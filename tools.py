"""Functions the assistant can call during a phone call."""

import asyncio
import functools
import json
import logging

from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse

import config

log = logging.getLogger("assistant")

TRANSFER_TO_FRONT_DESK = {
    "type": "function",
    "name": "transfer_to_front_desk",
    "description": (
        "Transfer the call to one of the gym's front desk advisors. Use it when the caller asks to talk to a "
        "person, the front desk or Ronald, or accepts your offer to transfer them. Tell the caller you're "
        "transferring them to a front desk advisor before calling it."
    ),
    "parameters": {"type": "object", "properties": {}},
}

SCHEDULE_VISIT = {
    "type": "function",
    "name": "schedule_visit",
    "description": (
        "Book a first visit or an appointment at the gym. Before calling it, ask for the caller's name "
        "and availability, and agree on a day and time with them."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "name": {"type": "string", "description": "The caller's name."},
            "date": {"type": "string", "description": "Day of the visit, in Spanish, e.g. 'martes 13 de octubre'."},
            "time": {"type": "string", "description": "Time of the visit, e.g. '18:30'."},
            "reason": {
                "type": "string",
                "description": "What the visit is for, in Spanish, e.g. 'primera visita' or 'evaluación'.",
            },
        },
        "required": ["name", "date", "time"],
    },
}

# Tools offered to the model.
TOOLS = [TRANSFER_TO_FRONT_DESK, SCHEDULE_VISIT]

# Tasks still running after their tool has answered. asyncio keeps only weak references to tasks.
background_tasks: set[asyncio.Task] = set()


async def run_tool(name: str, arguments: str, caller_number: str) -> str:
    args = json.loads(arguments or "{}")
    if name == "transfer_to_front_desk":
        # main.py transfers the call once the caller has heard the assistant's reply.
        return "Transferring the call to a front desk advisor now."
    if name == "schedule_visit":
        # Not connected to a calendar yet: any time is accepted, the booking is logged and sent by WhatsApp.
        log.info("Visit booked: %s", args)
        if config.TWILIO_ACCOUNT_SID and config.TWILIO_WHATSAPP_FROM:
            # In the background, so the caller doesn't wait for WhatsApp.
            task = asyncio.create_task(send_booking_whatsapp(args, caller_number))
            background_tasks.add(task)
            task.add_done_callback(background_tasks.discard)
        return f"Booked: {args.get('name')}, {args.get('date')} at {args.get('time')}."
    return f"Unknown tool: {name}"


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


async def send_booking_whatsapp(booking: dict, caller_number: str):
    """Sends the booking confirmation, in Spanish, to BOOKINGS_WHATSAPP_TO."""
    # The same text as the WhatsApp template in the README, whose variables are {{1}} to {{5}}.
    fields = [
        booking.get("name") or "sin nombre",
        booking.get("date") or "sin día",
        booking.get("time") or "sin hora",
        booking.get("reason") or "sin especificar",
        caller_number or "desconocido",
    ]
    message = {
        "from_": f"whatsapp:{config.TWILIO_WHATSAPP_FROM}",
        "to": f"whatsapp:{config.BOOKINGS_WHATSAPP_TO}",
    }
    if config.TWILIO_WHATSAPP_TEMPLATE_SID:
        message["content_sid"] = config.TWILIO_WHATSAPP_TEMPLATE_SID
        message["content_variables"] = json.dumps({str(i): value for i, value in enumerate(fields, start=1)})
    else:
        name, date, time, reason, phone = fields
        message["body"] = (
            f"✅ Visita confirmada en {config.BUSINESS_NAME}\n\n"
            f"Nombre: {name}\nDía: {date}\nHora: {time}\nMotivo: {reason}\nTeléfono: {phone}\n\n"
            "Agendada por el asistente telefónico."
        )
    try:
        sent = await asyncio.to_thread(twilio_client().messages.create, **message)
        log.info("Booking sent by WhatsApp to %s (%s)", config.BOOKINGS_WHATSAPP_TO, sent.sid)
    except Exception:
        log.exception("Couldn't send the booking by WhatsApp")
