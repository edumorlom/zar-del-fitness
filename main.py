"""Phone voice assistant: connects Twilio phone calls to the OpenAI Realtime API.

Twilio calls POST /incoming-call when someone dials the number. We answer with TwiML that
streams the call audio to the /media-stream WebSocket, which relays it to OpenAI and plays
OpenAI's spoken replies back to the caller.
"""

import asyncio
import contextlib
import hashlib
import hmac
import json
import logging
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
    log.warning("TWILIO_ACCOUNT_SID is not set: calls can't be transferred and bookings aren't sent by WhatsApp.")
elif not config.TWILIO_WHATSAPP_FROM:
    log.warning("TWILIO_WHATSAPP_FROM is not set: bookings aren't sent by WhatsApp.")

BUENOS_AIRES = ZoneInfo("America/Argentina/Buenos_Aires")
OPENAI_REALTIME_URL = f"wss://api.openai.com/v1/realtime?model={config.OPENAI_REALTIME_MODEL}"
STREAM_URL = config.PUBLIC_BASE_URL.replace("https://", "wss://").replace("http://", "ws://") + "/media-stream"
# The gym's information goes in the instructions, so the assistant answers without looking anything up.
KNOWLEDGE = "\n\n".join(
    path.read_text() for path in sorted((Path(__file__).parent / "knowledge").iterdir()) if path.suffix in (".md", ".txt")
)
INSTRUCTIONS = (
    (Path(__file__).parent / "instructions.md").read_text()
    .replace("{{BUSINESS_NAME}}", config.BUSINESS_NAME)
    .replace("{{KNOWLEDGE}}", KNOWLEDGE)
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
    stream.parameter(name="caller", value=params.get("From", ""))
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
        async with websocket_connect(OPENAI_REALTIME_URL, additional_headers=headers) as openai_ws:
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


class CallSession:
    """Relays audio for one phone call between Twilio and OpenAI."""

    def __init__(self, twilio_ws: WebSocket, openai_ws, stream_sid: str, call_sid: str, caller_number: str):
        self.twilio_ws = twilio_ws
        self.openai_ws = openai_ws
        self.stream_sid = stream_sid
        self.call_sid = call_sid
        self.caller_number = caller_number
        # Twilio's clock: milliseconds of caller audio received so far.
        self.latest_media_ts = 0
        # The assistant reply currently playing, when it started, and how many chunks are still queued.
        self.playing_item = None
        self.playing_since_ts = 0
        self.queued_chunks = 0
        # When the call should end: we hang up once the caller has heard the assistant's last reply.
        self.end_after_next_reply = False
        self.ending = False
        # Whether to transfer the call to the front desk instead of hanging up when it ends.
        self.transferring = False

    async def run(self):
        await self.configure_session()
        await self.send_openai({
            "type": "response.create",
            "response": {"instructions": f"Greet the caller by saying exactly: {config.GREETING}"},
        })

        tasks = [asyncio.create_task(self.from_twilio()), asyncio.create_task(self.from_openai())]
        done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
        for task in pending:
            task.cancel()
        for task in done:
            if error := task.exception():
                log.error("Call %s: %r", self.call_sid, error)
        # Only if the caller is still on the line and has heard they're being transferred.
        # If the transfer fails, the call ends.
        if self.transferring and self.done_talking() and await tools.transfer_call(self.call_sid):
            log.info("Call %s transferred to the front desk", self.call_sid)
        else:
            log.info("Call %s ended%s", self.call_sid, " (assistant hung up)" if self.ending else "")

    async def configure_session(self):
        session = {
            "type": "realtime",
            "model": config.OPENAI_REALTIME_MODEL,
            "output_modalities": ["audio"],
            "instructions": INSTRUCTIONS + f"\n\n# Current date\nIt is {datetime.now(BUENOS_AIRES):%A %d %B %Y, %H:%M} in Buenos Aires.",
            "audio": {
                "input": {
                    # Phone audio is 8kHz G.711 μ-law, which OpenAI accepts and returns as-is.
                    "format": {"type": "audio/pcmu"},
                    "noise_reduction": {"type": "near_field"},
                    "turn_detection": {"type": "server_vad"},
                    # Transcribes what the caller says, for the logs. No language is set so it auto-detects.
                    "transcription": {"model": "gpt-4o-mini-transcribe"},
                },
                "output": {"format": {"type": "audio/pcmu"}, "voice": config.OPENAI_VOICE},
            },
            "tools": tools.TOOLS,
            "tool_choice": "auto",
        }
        if config.OPENAI_REASONING_EFFORT:
            session["reasoning"] = {"effort": config.OPENAI_REASONING_EFFORT}
        await self.send_openai({"type": "session.update", "session": session})

    async def from_twilio(self):
        async for message in self.twilio_ws.iter_text():
            data = json.loads(message)
            match data["event"]:
                case "media":
                    self.latest_media_ts = int(data["media"]["timestamp"])
                    await self.send_openai({"type": "input_audio_buffer.append", "audio": data["media"]["payload"]})
                case "mark":
                    if data["mark"]["name"] == self.playing_item:
                        self.queued_chunks -= 1
                    if self.done_talking():
                        return
                case "stop":
                    return

    async def from_openai(self):
        async for message in self.openai_ws:
            event = json.loads(message)
            match event["type"]:
                case "response.output_audio.delta":
                    await self.play_audio(event["item_id"], event["delta"])
                case "input_audio_buffer.speech_started":
                    await self.stop_playback()
                case "response.done":
                    await self.handle_response_done(event["response"])
                    if self.done_talking():
                        return
                case "conversation.item.input_audio_transcription.completed":
                    log.info("[%s] Caller: %s", self.call_sid, event["transcript"])
                case "response.output_audio_transcript.done":
                    log.info("[%s] Assistant: %s", self.call_sid, event["transcript"])
                case "error":
                    log.error("[%s] OpenAI error: %s", self.call_sid, event["error"])

    async def play_audio(self, item_id: str, audio: str):
        if item_id != self.playing_item:
            self.playing_item = item_id
            self.playing_since_ts = self.latest_media_ts
            self.queued_chunks = 0
        await self.twilio_ws.send_json({"event": "media", "streamSid": self.stream_sid, "media": {"payload": audio}})
        # Twilio echoes the mark back once the chunk before it has played, so we know what the caller heard.
        await self.twilio_ws.send_json({"event": "mark", "streamSid": self.stream_sid, "mark": {"name": item_id}})
        self.queued_chunks += 1

    async def stop_playback(self):
        """The caller started talking: stop the assistant mid-sentence."""
        if self.playing_item and self.queued_chunks > 0:
            # Tell OpenAI how much of its reply was actually heard, so the conversation history matches.
            await self.send_openai({
                "type": "conversation.item.truncate",
                "item_id": self.playing_item,
                "content_index": 0,
                "audio_end_ms": max(0, self.latest_media_ts - self.playing_since_ts),
            })
            await self.twilio_ws.send_json({"event": "clear", "streamSid": self.stream_sid})
        self.playing_item = None
        self.queued_chunks = 0

    async def handle_response_done(self, response: dict):
        if self.end_after_next_reply:
            self.ending = True
            return
        calls = [item for item in response.get("output", []) if item.get("type") == "function_call"]
        if not calls or response.get("status") != "completed":
            return
        for call in calls:
            output = await tools.run_tool(call["name"], call["arguments"], self.caller_number)
            await self.send_openai({
                "type": "conversation.item.create",
                "item": {"type": "function_call_output", "call_id": call["call_id"], "output": output},
            })
        if any(call["name"] == "transfer_to_front_desk" for call in calls):
            # Transfer once the caller has heard they're being transferred.
            self.transferring = True
            if any(item.get("type") == "message" for item in response["output"]):
                self.ending = True
                return
            # The assistant hasn't said anything yet, so let it speak first.
            self.end_after_next_reply = True
        await self.send_openai({"type": "response.create"})

    def done_talking(self) -> bool:
        """True when the call is ending and the assistant's last reply has finished playing."""
        return self.ending and self.queued_chunks == 0

    async def send_openai(self, event: dict):
        await self.openai_ws.send(json.dumps(event))


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=config.PORT)
