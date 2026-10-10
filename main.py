"""Phone voice assistant: connects Twilio phone calls to OpenAI's GPT-Live voice model.

Twilio calls POST /incoming-call when someone dials the number. We answer with TwiML that
streams the call audio to the /media-stream WebSocket, which relays it to OpenAI and plays
OpenAI's spoken replies back to the caller. The voice model hands transfers and bookings
to a backend model, which calls the functions in tools.py.
"""

import asyncio
import base64
import contextlib
import hashlib
import hmac
import json
import logging
import time
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import uvicorn
from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import Response
from twilio.request_validator import RequestValidator
from twilio.twiml.voice_response import Connect, VoiceResponse
from websockets.asyncio.client import connect as websocket_connect

import config
import tools

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("assistant")
# The Twilio library logs every API request with its headers.
logging.getLogger("twilio.http_client").setLevel(logging.WARNING)

for name in ("OPENAI_API_KEY", "TWILIO_AUTH_TOKEN", "PUBLIC_BASE_URL"):
    if not getattr(config, name):
        raise RuntimeError(f"{name} is not set. Copy .env.example to .env and fill it in.")
if not config.TWILIO_ACCOUNT_SID:
    log.warning("TWILIO_ACCOUNT_SID is not set: calls can't be transferred.")
if not config.RESEND_API_KEY:
    log.warning("RESEND_API_KEY is not set: bookings aren't sent by email.")

BUENOS_AIRES = ZoneInfo("America/Argentina/Buenos_Aires")
OPENAI_LIVE_URL = "wss://api.openai.com/v1/live/sessions"
STREAM_URL = config.PUBLIC_BASE_URL.replace("https://", "wss://").replace("http://", "ws://") + "/media-stream"
# The gym's information goes in the instructions, so the assistant answers without looking anything up.
KNOWLEDGE = "\n\n".join(
    path.read_text() for path in sorted((Path(__file__).parent / "knowledge").iterdir()) if path.suffix in (".md", ".txt")
)
# What Twilio puts in "From" when the caller hides their number: ANONYMOUS, RESTRICTED, BLOCKED, UNKNOWN on a keypad.
HIDDEN_CALLER_IDS = {"+266696687", "+7378742833", "+2562533", "+8656696"}
INSTRUCTIONS = (
    (Path(__file__).parent / "instructions.md").read_text()
    .replace("{{BUSINESS_NAME}}", config.BUSINESS_NAME)
    .replace("{{KNOWLEDGE}}", KNOWLEDGE)
    .rstrip()
)

app = FastAPI()
twilio_validator = RequestValidator(config.TWILIO_AUTH_TOKEN)


def stream_token(call_sid: str) -> str:
    """Proves a media stream was started by our /incoming-call webhook, so strangers can't open one."""
    return hmac.new(config.TWILIO_AUTH_TOKEN.encode(), call_sid.encode(), hashlib.sha256).hexdigest()


@app.get("/")
async def health():
    return {"status": "ok"}


@app.post("/incoming-call")
async def incoming_call(request: Request):
    params = dict(await request.form())
    url = config.PUBLIC_BASE_URL + request.url.path
    if request.url.query:
        url += "?" + request.url.query
    if not twilio_validator.validate(url, params, request.headers.get("X-Twilio-Signature", "")):
        log.warning("Rejected request to /incoming-call: invalid Twilio signature")
        raise HTTPException(status_code=403)

    call_sid = params["CallSid"]
    log.info("Incoming call %s", call_sid)

    response = VoiceResponse()
    connect = Connect()
    stream = connect.stream(url=STREAM_URL)
    stream.parameter(name="token", value=stream_token(call_sid))
    caller_number = params.get("From", "")
    stream.parameter(name="caller", value="" if caller_number in HIDDEN_CALLER_IDS else caller_number)
    response.append(connect)
    return Response(content=str(response), media_type="application/xml")


@app.websocket("/media-stream")
async def media_stream(twilio_ws: WebSocket):
    await twilio_ws.accept()
    try:
        start = await asyncio.wait_for(wait_for_start(twilio_ws), timeout=10)
    except Exception:
        start = None
    if start is None:
        log.warning("Rejected media stream: missing or invalid start event")
        await twilio_ws.close()
        return

    headers = {"Authorization": f"Bearer {config.OPENAI_API_KEY}"}
    try:
        async with websocket_connect(OPENAI_LIVE_URL, additional_headers=headers) as openai_ws:
            caller_number = start["customParameters"].get("caller", "")
            await CallSession(twilio_ws, openai_ws, start["streamSid"], start["callSid"], caller_number).run()
    except Exception:
        log.exception("Call %s failed", start["callSid"])
    finally:
        # Closing the stream makes Twilio hang up, e.g. if the OpenAI connection dropped, unless the
        # call was transferred. After a normal hang-up Twilio has already closed it.
        with contextlib.suppress(WebSocketDisconnect, RuntimeError):
            await twilio_ws.close()


async def wait_for_start(twilio_ws: WebSocket) -> dict | None:
    """Twilio sends a 'connected' event, then 'start' with the call details and our token."""
    async for message in twilio_ws.iter_text():
        data = json.loads(message)
        if data["event"] == "start":
            start = data["start"]
            token = start.get("customParameters", {}).get("token", "")
            if hmac.compare_digest(token, stream_token(start["callSid"])):
                return start
            return None
    return None


def ulaw_magnitude(byte: int) -> int:
    """How loud one G.711 μ-law sample is, from 0 to 32124."""
    byte = ~byte & 0xFF
    return ((((byte & 0x0F) << 3) + 0x84) << ((byte >> 4) & 0x07)) - 0x84


ULAW_MAGNITUDES = [ulaw_magnitude(byte) for byte in range(256)]
# Average loudness above which the assistant's audio counts as speech. Its audio streams nonstop, silence included.
SPEECH_LEVEL = 150


class CallSession:
    """Relays audio for one phone call between Twilio and OpenAI.

    GPT-Live listens while it talks and stops by itself when the caller interrupts. Its audio arrives at playback
    speed, so Twilio never has much of it queued and there's nothing to clear.
    """

    def __init__(self, twilio_ws: WebSocket, openai_ws, stream_sid: str, call_sid: str, caller_number: str):
        self.twilio_ws = twilio_ws
        self.openai_ws = openai_ws
        self.stream_sid = stream_sid
        self.call_sid = call_sid
        self.caller_number = caller_number
        # What each side is saying, logged once the other side speaks, and when they last spoke (ms into the call).
        self.transcript = {"Caller": "", "Assistant": ""}
        self.transcript_end_ms = {"Caller": 0, "Assistant": 0}
        # When the assistant's current stretch of speech started and when it last spoke (time.monotonic()).
        self.speech_started_at = 0.0
        self.last_speech_at = 0.0
        # Results of the backend's function calls, sent back once its response is complete.
        self.function_outputs = []
        # The backend started a transfer, and then replied to the voice model with the result.
        self.transfer_requested = False
        self.transfer_confirmed = asyncio.Event()
        # Twilio echoed the mark sent before transferring: the caller has heard everything before it.
        self.mark_played = asyncio.Event()
        self.session_closed = False

    async def run(self):
        await self.start_session()

        transfer = asyncio.create_task(self.wait_to_transfer())
        tasks = [asyncio.create_task(self.from_twilio()), asyncio.create_task(self.from_openai()), transfer]
        # Commentary is spoken right away; an instruction to greet takes a couple of seconds longer.
        await self.send_openai({"type": "session.commentary.append", "delegation_id": None, "content": config.GREETING})
        done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
        for task in pending:
            task.cancel()
        # Let them stop before close_session() reads from OpenAI.
        await asyncio.gather(*pending, return_exceptions=True)
        for task in done:
            if error := task.exception():
                log.error("Call %s: %r", self.call_sid, error)
        self.log_transcript("Caller")
        self.log_transcript("Assistant")
        # Only if the caller is still on the line and has heard they're being transferred.
        # If the transfer fails, the call ends.
        if transfer in done and not transfer.exception() and await tools.transfer_call(self.call_sid):
            log.info("Call %s transferred to the front desk", self.call_sid)
        else:
            log.info("Call %s ended", self.call_sid)
        await self.close_session()

    async def start_session(self):
        now = datetime.now(BUENOS_AIRES)
        today = f"{tools.spanish_date(now.date().isoformat())} de {now.year}"
        backend = {
            "model": config.OPENAI_BACKEND_MODEL,
            "instructions": tools.BACKEND_INSTRUCTIONS.format(
                business_name=config.BUSINESS_NAME, date=f"{today} ({now.date().isoformat()})", time=f"{now:%H:%M}"
            ),
            "tools": tools.TOOLS,
            "tool_choice": "auto",
            "parallel_tool_calls": False,
        }
        if config.OPENAI_REASONING_EFFORT:
            backend["reasoning"] = {"effort": config.OPENAI_REASONING_EFFORT}
        session = {
            "model": config.OPENAI_LIVE_MODEL,
            "instructions": INSTRUCTIONS
            + "\n\n# Quién llama\n"
            + (
                f"Llama desde el {self.caller_number}, que termina en {self.caller_number[-4:]}."
                if self.caller_number
                else "Su número está oculto."
            )
            + "\n\n# Fecha y hora\n"
            + f"Hoy es {today}, son las {now:%H:%M} en Buenos Aires.",
            "audio": {
                # Phone audio is 8kHz G.711 μ-law, which OpenAI accepts and returns as-is.
                "format": {"type": "audio/pcmu", "rate": 8000},
                "output": {"voice": config.OPENAI_VOICE},
            },
            # The voice model delegates transfers and bookings to the backend model, which calls our functions.
            "delegation": {"type": "responses", "responses": backend},
        }
        await self.send_openai({"type": "session.start", "session": session})
        event = json.loads(await self.openai_ws.recv())
        if event["type"] != "session.started":
            raise RuntimeError(f"OpenAI didn't start the session: {event}")

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
                    self.add_transcript("Caller", event)
                case "session.output_transcript.delta":
                    self.add_transcript("Assistant", event)
                case "response.event":
                    await self.handle_backend_event(event["event"])
                case "session.closed":
                    self.session_closed = True
                    log.info("[%s] OpenAI closed the session (%s)", self.call_sid, event["reason"])
                    return
                case "error":
                    log.error("[%s] OpenAI error: %s", self.call_sid, event["error"])

    async def play_audio(self, audio: str):
        chunk = base64.b64decode(audio)
        if sum(ULAW_MAGNITUDES[byte] for byte in chunk) > SPEECH_LEVEL * len(chunk):
            now = time.monotonic()
            if now - self.last_speech_at > 0.3:
                self.speech_started_at = now
            self.last_speech_at = now
        await self.twilio_ws.send_json({"event": "media", "streamSid": self.stream_sid, "media": {"payload": audio}})

    async def handle_backend_event(self, event: dict):
        """Runs the backend's function calls and sends it the results, so it can report back to the voice model."""
        match event["type"]:
            case "response.output_item.done" if event["item"]["type"] == "function_call":
                call = event["item"]
                output = await tools.run_tool(call["name"], call["arguments"], self.caller_number)
                item = {"type": "function_call_output", "call_id": call["call_id"], "output": output}
                self.function_outputs.append(item)
                if call["name"] == "transfer_to_front_desk":
                    self.transfer_requested = True
            case "response.completed" | "response.failed" | "response.incomplete":
                if event["type"] != "response.completed":
                    log.error("[%s] Backend response %s: %s", self.call_sid, event["type"], event.get("response"))
                if self.function_outputs:
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
        confirmed_at = time.monotonic()
        # The assistant tells the caller a second or two after the backend confirms. Wait until it has said it,
        # or go ahead if it doesn't.
        while True:
            await asyncio.sleep(0.1)
            now = time.monotonic()
            if self.speech_started_at > confirmed_at:
                if now - self.last_speech_at > 1 or now - confirmed_at > 20:
                    break
            elif now - confirmed_at > 5:
                break
        # Twilio echoes the mark once the audio before it has played.
        await self.twilio_ws.send_json({"event": "mark", "streamSid": self.stream_sid, "mark": {"name": "transfer"}})
        with contextlib.suppress(TimeoutError):
            await asyncio.wait_for(self.mark_played.wait(), timeout=3)

    def add_transcript(self, speaker: str, event: dict):
        other = "Assistant" if speaker == "Caller" else "Caller"
        # Both can talk at once; the other side's line is complete once they've stopped.
        if event["start_ms"] >= self.transcript_end_ms[other]:
            self.log_transcript(other)
        self.transcript[speaker] += event["delta"]
        self.transcript_end_ms[speaker] = event["end_ms"]

    def log_transcript(self, speaker: str):
        if text := self.transcript[speaker].strip():
            log.info("[%s] %s: %s", self.call_sid, speaker, text)
        self.transcript[speaker] = ""

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


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=config.PORT)
