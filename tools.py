"""Functions the backend model calls during a phone call, when the voice model delegates a task to it."""

import asyncio
import datetime
import functools
import json
import logging
import urllib.error
import urllib.request

from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse

import config

log = logging.getLogger("assistant")

# Instructions for the backend model. Those for the voice model, including when to delegate, are in instructions.md.
BACKEND_INSTRUCTIONS = """## Voice conversation context
Sos el backend del asistente telefónico de {business_name}. El asistente de voz te delega transferir la llamada o agendar una visita. Las transcripciones pueden tener errores, frases a medias y correcciones: usá lo último que confirmó la persona.

## Task instructions
- Hoy es {date}, son las {time} en Buenos Aires. Convertí días como "el martes" a su fecha.
- Si la persona quiere hablar con alguien, usá transfer_to_front_desk.
- Si la persona confirmó día, hora y teléfono de una visita, usá schedule_visit. Si falta un dato obligatorio, no lo inventes: decí cuál falta.
- schedule_visit solo agenda dentro del horario del gimnasio. Si responde que la visita está fuera del horario, decí que no se agendó y cuál es el horario.

## Return the result
Respondé en una frase corta con el resultado y el próximo paso. Decí que algo está hecho solo si la herramienta lo confirmó."""

TRANSFER_TO_FRONT_DESK = {
    "type": "function",
    "name": "transfer_to_front_desk",
    "description": (
        "Pasa la llamada a uno de los asesores de recepción del gimnasio. Usala cuando la persona pide hablar con "
        "alguien, con recepción o con Ronald, o acepta que le pasen la llamada."
    ),
    "parameters": {"type": "object", "properties": {}},
}

SCHEDULE_VISIT = {
    "type": "function",
    "name": "schedule_visit",
    "description": (
        "Agenda una primera visita o un turno en el gimnasio. Usala solo cuando la persona ya dio su nombre y "
        "confirmó el día, la hora y su número de teléfono. Solo agenda de lunes a viernes, empezando entre las 8:00 "
        "y las 11:00 o entre las 14:30 y las 20:00."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "name": {"type": "string", "description": "Nombre de la persona."},
            "date": {"type": "string", "description": "Día de la visita, en formato AAAA-MM-DD."},
            "time": {"type": "string", "description": "Hora de la visita, en formato 24 horas, por ejemplo '18:30'."},
            "reason": {
                "type": "string",
                "description": "Para qué es la visita, en español, por ejemplo 'primera visita' o 'evaluación'.",
            },
            "phone": {
                "type": "string",
                "description": (
                    "Solo si la persona te dictó un número para contactarla: ese número, tal como lo dijo, por "
                    "ejemplo '11 5555 1234'. Si confirmó el número desde el que llama, dejalo vacío."
                ),
            },
            "language": {
                "type": "string",
                "description": "Idioma en el que te habla la persona, en español, por ejemplo 'español' o 'inglés'.",
            },
        },
        "required": ["name", "date", "time", "language"],
    },
}

# Tools offered to the backend model.
TOOLS = [TRANSFER_TO_FRONT_DESK, SCHEDULE_VISIT]

# When a visit can start, as in knowledge/gym-info.md: Monday to Friday, from opening to each shift's last entry.
OPEN_WEEKDAYS = range(5)
VISIT_START_HOURS = [(datetime.time(8, 0), datetime.time(11, 0)), (datetime.time(14, 30), datetime.time(20, 0))]

SPANISH_WEEKDAYS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]
SPANISH_MONTHS = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
]

# Tasks still running after their tool has answered. asyncio keeps only weak references to tasks.
background_tasks: set[asyncio.Task] = set()


async def run_tool(name: str, arguments: str, caller_number: str) -> str:
    args = json.loads(arguments or "{}")
    if name == "transfer_to_front_desk":
        # main.py transfers the call once the caller has heard they're being transferred.
        # Results are data, not sentences: a Spanish sentence pulls the model into Spanish with other callers.
        return json.dumps({"transferencia": "en curso"})
    if name == "schedule_visit":
        try:
            day = datetime.date.fromisoformat(args.get("date") or "")
            # The model sometimes writes "8:00" for "08:00".
            start = datetime.time.fromisoformat((args.get("time") or "").zfill(5))
        except ValueError:
            return json.dumps({"turno_agendado": False, "error": "fecha u hora inválida: usá AAAA-MM-DD y HH:MM"})
        if day.weekday() not in OPEN_WEEKDAYS or not any(
            opens <= start <= last_entry for opens, last_entry in VISIT_START_HOURS
        ):
            log.info("Visit outside opening hours, not booked: %s", args)
            return json.dumps({
                "turno_agendado": False,
                "motivo": "fuera del horario del gimnasio",
                "dias": "lunes a viernes, no feriados",
                "horas_de_inicio": ["08:00 a 11:00", "14:30 a 20:00"],
                "responder_en": args.get("language") or "el idioma de la persona",
            }, ensure_ascii=False)
        # Not connected to a calendar yet: any time within opening hours is accepted, the booking is logged and emailed.
        log.info("Visit booked: %s", args)
        if config.RESEND_API_KEY:
            # In the background, so the caller doesn't wait for the email.
            task = asyncio.create_task(send_booking_email(args, caller_number))
            background_tasks.add(task)
            task.add_done_callback(background_tasks.discard)
        # Naming the caller's language keeps the model from switching to Spanish after the booking.
        return json.dumps({
            "turno_agendado": True,
            "fecha": args.get("date"),
            "hora": args.get("time"),
            "responder_en": args.get("language") or "el idioma de la persona",
        }, ensure_ascii=False)
    return f"Herramienta desconocida: {name}"


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


def spanish_date(iso_date: str) -> str:
    """'2026-10-12' -> 'lunes 12 de octubre'. Anything else is returned as the model wrote it."""
    try:
        day = datetime.date.fromisoformat(iso_date)
    except ValueError:
        return iso_date
    return f"{SPANISH_WEEKDAYS[day.weekday()]} {day.day} de {SPANISH_MONTHS[day.month - 1]}"


def digits(phone: str) -> str:
    return "".join(char for char in phone if char.isdigit())


async def send_booking_email(booking: dict, caller_number: str):
    """Emails the booking confirmation, in Spanish, to BOOKINGS_EMAIL_TO."""
    name = booking.get("name") or "sin nombre"
    date = spanish_date(booking.get("date") or "sin día")
    time = booking.get("time") or "sin hora"
    reason = booking.get("reason") or "sin especificar"
    # Empty when they confirmed the number they're calling from.
    phone = booking.get("phone") or caller_number or "desconocido"
    language = booking.get("language") or "desconocido"
    # The number they called from too, in case the one they dictated was misheard.
    called_from = ""
    if caller_number and digits(caller_number) != digits(phone):
        called_from = f"\nLlamó desde: {caller_number}"
    email = {
        "from": config.BOOKINGS_EMAIL_FROM,
        "to": [config.BOOKINGS_EMAIL_TO],
        "subject": f"Nueva visita: {name}, {date} a las {time}",
        "text": (
            f"Visita confirmada en {config.BUSINESS_NAME}\n\n"
            f"Nombre: {name}\nDía: {date}\nHora: {time}\nMotivo: {reason}\nTeléfono: {phone}{called_from}\n"
            f"Idioma: {language}\n\n"
            "Agendada por el asistente telefónico."
        ),
    }
    request = urllib.request.Request(
        "https://api.resend.com/emails",
        data=json.dumps(email).encode(),
        headers={
            "Authorization": f"Bearer {config.RESEND_API_KEY}",
            "Content-Type": "application/json",
            # Resend rejects requests with Python's default User-Agent.
            "User-Agent": "zar-del-fitness-assistant",
        },
    )

    def send() -> str:
        with urllib.request.urlopen(request, timeout=10) as response:
            return json.load(response)["id"]

    try:
        email_id = await asyncio.to_thread(send)
        log.info("Booking emailed to %s (%s)", config.BOOKINGS_EMAIL_TO, email_id)
    except urllib.error.HTTPError as error:
        log.error("Couldn't email the booking: %s %s", error.code, error.read().decode(errors="replace"))
    except Exception:
        log.exception("Couldn't email the booking")
