"""The web server Twilio talks to: it answers phone calls and streams their audio."""

import asyncio
import contextlib
import hashlib
import hmac
import json
import logging

from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import Response
from twilio.request_validator import RequestValidator
from twilio.twiml.voice_response import Connect, VoiceResponse

from . import config, live_session
from .call_session import CallSession

log = logging.getLogger(__name__)

app = FastAPI()
twilio_validator = RequestValidator(config.TWILIO_AUTH_TOKEN)

STREAM_URL = config.PUBLIC_BASE_URL.replace("https://", "wss://").replace("http://", "ws://") + "/media-stream"
# What Twilio puts in "From" when the caller hides their number: ANONYMOUS, RESTRICTED, BLOCKED, UNKNOWN on a keypad.
HIDDEN_CALLER_IDS = {"+266696687", "+7378742833", "+2562533", "+8656696"}


@app.get("/")
async def health():
    return {"status": "ok"}


@app.post("/incoming-call")
async def incoming_call(request: Request):
    """Twilio calls this when someone dials the number. The TwiML we return streams the call to /media-stream."""
    params = dict(await request.form())
    if not is_from_twilio(request, params):
        log.warning("Rejected request to /incoming-call: invalid Twilio signature")
        raise HTTPException(status_code=403)

    call_sid = params["CallSid"]
    log.info("Incoming call %s", call_sid)
    caller_number = params.get("From", "")

    response = VoiceResponse()
    connect = Connect()
    stream = connect.stream(url=STREAM_URL)
    stream.parameter(name="token", value=stream_token(call_sid))
    stream.parameter(name="caller", value="" if caller_number in HIDDEN_CALLER_IDS else caller_number)
    response.append(connect)
    return Response(content=str(response), media_type="application/xml")


@app.websocket("/media-stream")
async def media_stream(twilio_ws: WebSocket):
    """The call's audio, both ways, which a CallSession relays to and from OpenAI."""
    await twilio_ws.accept()
    start = await wait_for_start(twilio_ws)
    if start is None:
        log.warning("Rejected media stream: missing or invalid start event")
        await twilio_ws.close()
        return

    caller_number = start["customParameters"].get("caller", "")
    try:
        async with live_session.connect() as openai_ws:
            await CallSession(twilio_ws, openai_ws, start["streamSid"], start["callSid"], caller_number).run()
    except Exception:
        log.exception("Call %s failed", start["callSid"])
    finally:
        # Closing the stream makes Twilio hang up, e.g. if the OpenAI connection dropped, unless the
        # call was transferred. After a normal hang-up Twilio has already closed it.
        with contextlib.suppress(WebSocketDisconnect, RuntimeError):
            await twilio_ws.close()


def is_from_twilio(request: Request, params: dict) -> bool:
    """Checks Twilio's signature, made with our auth token, so only Twilio can start calls here."""
    url = config.PUBLIC_BASE_URL + request.url.path
    if request.url.query:
        url += "?" + request.url.query
    return twilio_validator.validate(url, params, request.headers.get("X-Twilio-Signature", ""))


def stream_token(call_sid: str) -> str:
    """Proves a media stream was started by our /incoming-call webhook, so strangers can't open one."""
    return hmac.new(config.TWILIO_AUTH_TOKEN.encode(), call_sid.encode(), hashlib.sha256).hexdigest()


async def wait_for_start(twilio_ws: WebSocket) -> dict | None:
    """Twilio sends a 'connected' event, then 'start' with the call details and our token.

    Returns the details, or None if they don't come within 10 seconds or the token is wrong.
    """
    try:
        async with asyncio.timeout(10):
            async for message in twilio_ws.iter_text():
                data = json.loads(message)
                if data["event"] == "start":
                    start = data["start"]
                    token = start.get("customParameters", {}).get("token", "")
                    return start if hmac.compare_digest(token, stream_token(start["callSid"])) else None
    except Exception:
        return None
    return None
