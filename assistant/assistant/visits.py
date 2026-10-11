"""The schedule_visit tool: books a visit within opening hours and emails it to the gym.

Not connected to a calendar yet: any time within opening hours is accepted.
"""

import datetime
import logging

from . import config, emails
from .spanish import spanish_date

log = logging.getLogger(__name__)

NAME = "schedule_visit"
TOOL = {
    "type": "function",
    "name": NAME,
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

# When a visit can start, as in knowledge/gym-info.md: Monday to Friday, from opening to each shift's last entry.
OPEN_WEEKDAYS = range(5)
VISIT_START_HOURS = [(datetime.time(8, 0), datetime.time(11, 0)), (datetime.time(14, 30), datetime.time(20, 0))]


def schedule_visit(args: dict, caller_number: str) -> dict:
    """Books the visit the backend asked for, or says why it couldn't."""
    try:
        day = datetime.date.fromisoformat(args.get("date") or "")
        # The model sometimes writes "8:00" for "08:00".
        start = datetime.time.fromisoformat((args.get("time") or "").zfill(5))
    except (TypeError, ValueError):
        return {"turno_agendado": False, "error": "fecha u hora inválida: usá AAAA-MM-DD y HH:MM"}
    # Naming the caller's language keeps the model from switching to Spanish after the booking.
    language = args.get("language") or "el idioma de la persona"

    if not is_open(day, start):
        log.info("Visit outside opening hours, not booked: %s", args)
        return {
            "turno_agendado": False,
            "motivo": "fuera del horario del gimnasio",
            "dias": "lunes a viernes, no feriados",
            "horas_de_inicio": ["08:00 a 11:00", "14:30 a 20:00"],
            "responder_en": language,
        }

    log.info("Visit booked: %s", args)
    subject, text = booking_email(args, day, caller_number)
    # In the background, so the caller doesn't wait for the email.
    emails.send_in_background(config.BOOKINGS_EMAIL_TO, subject, text)
    return {"turno_agendado": True, "fecha": args["date"], "hora": args["time"], "responder_en": language}


def is_open(day: datetime.date, start: datetime.time) -> bool:
    """Whether a visit can start then."""
    return day.weekday() in OPEN_WEEKDAYS and any(
        opens <= start <= last_entry for opens, last_entry in VISIT_START_HOURS
    )


def booking_email(visit: dict, day: datetime.date, caller_number: str) -> tuple[str, str]:
    """The booking's email to the gym, in Spanish: its subject and text."""
    name = visit.get("name") or "sin nombre"
    date = spanish_date(day)
    time = visit["time"]
    # Empty when they confirmed the number they're calling from.
    phone = visit.get("phone") or caller_number or "desconocido"
    # The number they called from too, in case the one they dictated was misheard.
    called_from = ""
    if caller_number and digits(caller_number) != digits(phone):
        called_from = f"\nLlamó desde: {caller_number}"
    subject = f"Nueva visita: {name}, {date} a las {time}"
    text = (
        f"Visita confirmada en {config.BUSINESS_NAME}\n\n"
        f"Nombre: {name}\nDía: {date}\nHora: {time}\nMotivo: {visit.get('reason') or 'sin especificar'}\n"
        f"Teléfono: {phone}{called_from}\nIdioma: {visit.get('language') or 'desconocido'}\n\n"
        "Agendada por el asistente telefónico."
    )
    return subject, text


def digits(phone: str) -> str:
    return "".join(char for char in phone if char.isdigit())
