"""The transfer_to_front_desk tool: passes the call to the gym's front desk advisors."""

import asyncio
import functools
import logging

from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse

from . import config

log = logging.getLogger(__name__)

NAME = "transfer_to_front_desk"
TOOL = {
    "type": "function",
    "name": NAME,
    "description": (
        "Pasa la llamada a uno de los asesores de recepción del gimnasio. Usala cuando la persona pide hablar con "
        "alguien, con recepción o con Ronald, o acepta que le pasen la llamada."
    ),
    "parameters": {"type": "object", "properties": {}},
}
# What the tool tells the backend. The call is transferred later, once the caller has heard it's being transferred
# (see CallSession.wait_to_transfer).
RESULT = {"transferencia": "en curso"}


@functools.cache
def twilio_client() -> Client:
    return Client(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN)


async def transfer_call(call_sid: str) -> bool:
    """Replaces the call's TwiML: Twilio ends the media stream and dials the front desk. Returns whether it worked."""
    response = VoiceResponse()
    response.dial(config.FRONT_DESK_PHONE)
    log.info("Transferring call %s to the front desk (%s)", call_sid, config.FRONT_DESK_PHONE)
    try:
        await asyncio.to_thread(twilio_client().calls(call_sid).update, twiml=str(response))
        return True
    except Exception:
        log.exception("Couldn't transfer call %s to the front desk", call_sid)
        return False
