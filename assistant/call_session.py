"""One phone call: relays its audio between Twilio and OpenAI, runs the backend's tools and transfers the call."""

import asyncio
import base64
import contextlib
import json
import logging
import time

from fastapi import WebSocket
from websockets.asyncio.client import ClientConnection

from . import backend, config, live_session, transfer
from .speech import SpeechTracker
from .transcript import ASSISTANT, CALLER, Transcript

log = logging.getLogger(__name__)


class CallSession:
    """Relays audio for one phone call between Twilio and OpenAI.

    GPT-Live listens while it talks and stops by itself when the caller interrupts. Its audio arrives at playback
    speed, so Twilio never has much of it queued and there's nothing to clear.
    """

    def __init__(
        self, twilio_ws: WebSocket, openai_ws: ClientConnection, stream_sid: str, call_sid: str, caller_number: str
    ):
        self.twilio_ws = twilio_ws
        self.openai_ws = openai_ws
        self.stream_sid = stream_sid
        self.call_sid = call_sid
        self.caller_number = caller_number
        self.transcript = Transcript(call_sid)
        self.speech = SpeechTracker()
        # Results of the backend's function calls, sent back once its response is complete.
        self.function_outputs = []
        # The backend started a transfer, and then replied to the voice model with the result.
        self.transfer_requested = False
        self.transfer_confirmed = asyncio.Event()
        # Twilio echoed the mark sent before transferring: the caller has heard everything before it.
        self.mark_played = asyncio.Event()
        self.session_closed = False

    async def run(self):
        """Handles the call until it ends or is transferred."""
        await live_session.start(self.openai_ws, self.caller_number)

        ready_to_transfer = asyncio.create_task(self.wait_to_transfer())
        tasks = [asyncio.create_task(self.from_twilio()), asyncio.create_task(self.from_openai()), ready_to_transfer]
        # Commentary is spoken right away; an instruction to greet takes a couple of seconds longer.
        await self.send_openai({"type": "session.commentary.append", "delegation_id": None, "content": config.GREETING})
        done = await wait_for_first(tasks)
        for task in done:
            if error := task.exception():
                log.error("Call %s: %r", self.call_sid, error)
        self.transcript.flush()

        # Only if the caller is still on the line and has heard they're being transferred.
        # If the transfer fails, the call ends.
        if (
            ready_to_transfer in done
            and not ready_to_transfer.exception()
            and await transfer.transfer_call(self.call_sid)
        ):
            log.info("Call %s transferred to the front desk", self.call_sid)
        else:
            log.info("Call %s ended", self.call_sid)
        await self.close_session()

    async def from_twilio(self):
        async for message in self.twilio_ws.iter_text():
            data = json.loads(message)
            match data["event"]:
                case "media":
                    await self.send_openai({"type": "session.input_audio.append", "audio": data["media"]["payload"]})
                case "mark":
                    self.mark_played.set()
                case "stop":
                    return

    async def from_openai(self):
        async for message in self.openai_ws:
            event = json.loads(message)
            match event["type"]:
                case "session.output_audio.delta":
                    await self.play_audio(event["delta"])
                case "session.input_transcript.delta":
                    self.transcript.add(CALLER, event["delta"], event["start_ms"], event["end_ms"])
                case "session.output_transcript.delta":
                    self.transcript.add(ASSISTANT, event["delta"], event["start_ms"], event["end_ms"])
                case "response.event":
                    await self.handle_backend_event(event["event"])
                case "session.closed":
                    self.session_closed = True
                    log.info("[%s] OpenAI closed the session (%s)", self.call_sid, event["reason"])
                    return
                case "error":
                    log.error("[%s] OpenAI error: %s", self.call_sid, event["error"])

    async def play_audio(self, audio: str):
        """Plays a chunk of the assistant's audio (base64 μ-law) to the caller."""
        self.speech.add_audio(base64.b64decode(audio))
        await self.send_twilio("media", media={"payload": audio})

    async def handle_backend_event(self, event: dict):
        """Runs the backend's function calls and sends it the results, so it can report back to the voice model."""
        match event["type"]:
            case "response.output_item.done" if event["item"]["type"] == "function_call":
                call = event["item"]
                output = await backend.run_tool(call["name"], call["arguments"], self.caller_number)
                item = {"type": "function_call_output", "call_id": call["call_id"], "output": output}
                self.function_outputs.append(item)
                if call["name"] == transfer.NAME:
                    self.transfer_requested = True
            case "response.completed" | "response.failed" | "response.incomplete":
                if event["type"] != "response.completed":
                    log.error("[%s] Backend response %s: %s", self.call_sid, event["type"], event.get("response"))
                if self.function_outputs:
                    # The backend continues, with the results, in a new response.
                    for item in self.function_outputs:
                        await self.send_openai({"type": "response.item.create", "item": item})
                    self.function_outputs = []
                    await self.send_openai({"type": "response.create"})
                elif self.transfer_requested:
                    self.transfer_confirmed.set()
            case "error":
                log.error("[%s] Backend error: %s", self.call_sid, event.get("error"))

    async def wait_to_transfer(self):
        """Returns once the caller has heard they're being transferred."""
        await self.transfer_confirmed.wait()
        # The assistant tells the caller a second or two after the backend confirms.
        await self.speech.wait_until_said(since=time.monotonic())
        # Twilio echoes the mark once the audio before it has played.
        await self.send_twilio("mark", mark={"name": "transfer"})
        with contextlib.suppress(TimeoutError):
            await asyncio.wait_for(self.mark_played.wait(), timeout=3)

    async def close_session(self):
        """Ends the OpenAI session cleanly, which reports how long it was billed for."""
        if self.session_closed:
            return
        with contextlib.suppress(Exception):
            await self.send_openai({"type": "session.close"})
            async with asyncio.timeout(5):
                async for message in self.openai_ws:
                    event = json.loads(message)
                    if event["type"] == "session.closed":
                        log.info("[%s] OpenAI session lasted %s seconds", self.call_sid, event["usage"]["seconds"])
                        return

    async def send_openai(self, event: dict):
        await self.openai_ws.send(json.dumps(event))

    async def send_twilio(self, event: str, **fields):
        await self.twilio_ws.send_json({"event": event, "streamSid": self.stream_sid, **fields})


async def wait_for_first(tasks: list[asyncio.Task]) -> set[asyncio.Task]:
    """Waits for one of the tasks to finish, then cancels the others and waits for them to stop.

    Returns the finished ones.
    """
    done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
    for task in pending:
        task.cancel()
    await asyncio.gather(*pending, return_exceptions=True)
    return done
