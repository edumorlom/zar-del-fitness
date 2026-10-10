"""The backend model: the voice model delegates transfers and bookings to it, and it calls the tools that do them."""

import json
import logging
from datetime import datetime

from . import config, transfer, visits
from .spanish import spanish_date

log = logging.getLogger(__name__)

# Instructions for the backend model. Those for the voice model, including when to delegate, are in instructions.md.
INSTRUCTIONS = """## Voice conversation context
Sos el backend del asistente telefónico de {business_name}. El asistente de voz te delega transferir la llamada o agendar una visita. Las transcripciones pueden tener errores, frases a medias y correcciones: usá lo último que confirmó la persona.

## Task instructions
- Hoy es {date}, son las {time} en Buenos Aires. Convertí días como "el martes" a su fecha.
- Si la persona quiere hablar con alguien, usá transfer_to_front_desk.
- Si la persona confirmó día, hora y teléfono de una visita, usá schedule_visit. Si falta un dato obligatorio, no lo inventes: decí cuál falta.
- schedule_visit solo agenda dentro del horario del gimnasio. Si responde que la visita está fuera del horario, decí que no se agendó y cuál es el horario.

## Return the result
Respondé en una frase corta con el resultado y el próximo paso. Decí que algo está hecho solo si la herramienta lo confirmó."""

TOOLS = [transfer.TOOL, visits.TOOL]


def delegation(now: datetime) -> dict:
    """The session's delegation settings: the backend model, its instructions and its tools."""
    responses = {
        "model": config.OPENAI_BACKEND_MODEL,
        "instructions": INSTRUCTIONS.format(
            business_name=config.BUSINESS_NAME,
            date=f"{spanish_date(now.date(), with_year=True)} ({now.date().isoformat()})",
            time=f"{now:%H:%M}",
        ),
        "tools": TOOLS,
        "tool_choice": "auto",
        "parallel_tool_calls": False,
    }
    if config.OPENAI_REASONING_EFFORT:
        responses["reasoning"] = {"effort": config.OPENAI_REASONING_EFFORT}
    return {"type": "responses", "responses": responses}


async def run_tool(name: str, arguments: str, caller_number: str) -> str:
    """Runs one of the backend's function calls and returns its result, as JSON.

    Results are data, not sentences: a Spanish sentence pulls the model into Spanish with other callers.
    """
    try:
        args = json.loads(arguments or "{}")
        if name == transfer.NAME:
            result = transfer.RESULT
        elif name == visits.NAME:
            result = visits.schedule_visit(args, caller_number)
        else:
            result = {"error": f"herramienta desconocida: {name}"}
    except Exception:
        # Better for the backend to say it couldn't than for the call to drop.
        log.exception("Tool %s failed with arguments %s", name, arguments)
        result = {"error": "la herramienta falló"}
    return json.dumps(result, ensure_ascii=False)
