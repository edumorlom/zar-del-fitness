"""Functions the assistant can call during a phone call."""

import asyncio
import functools
import json
import logging

from openai import AsyncOpenAI
from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse

import config

log = logging.getLogger("assistant")

SEARCH_KNOWLEDGE_BASE = {
    "type": "function",
    "name": "search_knowledge_base",
    "description": (
        "Search the gym's documents: opening hours, prices, memberships, classes, "
        "trainers, location, policies, promotions and FAQs. Use it for any factual "
        "question about the gym."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Short search query describing what the caller wants to know.",
            }
        },
        "required": ["query"],
    },
}

TRANSFER_TO_RONALD = {
    "type": "function",
    "name": "transfer_to_ronald",
    "description": (
        "Transfer the call to Ronald Medina, the founder and head trainer. Use it when the caller asks to "
        "talk to Ronald. Tell the caller you're transferring them before calling it."
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

# Tools offered to the model. The knowledge base is only available once it has been uploaded.
TOOLS = ([SEARCH_KNOWLEDGE_BASE] if config.VECTOR_STORE_ID else []) + [TRANSFER_TO_RONALD, SCHEDULE_VISIT]

# Tasks still running after their tool has answered. asyncio keeps only weak references to tasks.
background_tasks: set[asyncio.Task] = set()


async def run_tool(name: str, arguments: str, caller_number: str) -> str:
    args = json.loads(arguments or "{}")
    if name == "search_knowledge_base":
        return await search_knowledge_base(args.get("query", ""))
    if name == "transfer_to_ronald":
        # main.py transfers the call once the caller has heard the assistant's reply.
        return "Transferring the call to Ronald now."
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
def openai_client() -> AsyncOpenAI:
    return AsyncOpenAI()


@functools.cache
def twilio_client() -> Client:
    return Client(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN)


async def transfer_call(call_sid: str) -> bool:
    """Replaces the call's TwiML: Twilio ends the media stream and dials Ronald. Returns whether it worked."""
    response = VoiceResponse()
    response.dial(config.RONALD_PHONE)
    log.info("Transferring call %s to Ronald (%s)", call_sid, config.RONALD_PHONE)
    try:
        await asyncio.to_thread(twilio_client().calls(call_sid).update, twiml=str(response))
        return True
    except Exception:
        log.exception("Couldn't transfer call %s to Ronald", call_sid)
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


async def search_knowledge_base(query: str) -> str:
    log.info("Searching knowledge base: %s", query)
    try:
        results = await openai_client().vector_stores.search(
            vector_store_id=config.VECTOR_STORE_ID,
            query=query,
            max_num_results=5,
            timeout=8,
        )
    except Exception:
        log.exception("Knowledge base search failed")
        return "The search failed. Tell the caller you can't check that right now."

    chunks = ["\n".join(part.text for part in result.content) for result in results.data]
    if not chunks:
        return "No matching information found in the knowledge base."
    return "Gym information (in Spanish; answer in the caller's language):\n\n" + "\n\n---\n\n".join(chunks)
