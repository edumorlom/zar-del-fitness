"""The OpenAI GPT-Live session for a call: the voice model, what it knows and the backend model it delegates to."""

import json
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from websockets.asyncio.client import ClientConnection
from websockets.asyncio.client import connect as websocket_connect

from . import backend, config
from .spanish import spanish_date

URL = "wss://api.openai.com/v1/live/sessions"
PROJECT_DIR = Path(__file__).resolve().parent.parent
BUENOS_AIRES = ZoneInfo("America/Argentina/Buenos_Aires")


def load_instructions() -> str:
    """instructions.md, with the business name and the gym's information (knowledge/) filled in."""
    # The gym's information goes in the instructions, so the assistant answers without looking anything up.
    knowledge = "\n\n".join(
        path.read_text() for path in sorted((PROJECT_DIR / "knowledge").iterdir()) if path.suffix in (".md", ".txt")
    )
    return (
        (PROJECT_DIR / "instructions.md").read_text()
        .replace("{{BUSINESS_NAME}}", config.BUSINESS_NAME)
        .replace("{{KNOWLEDGE}}", knowledge)
        .rstrip()
    )


# Read once, when the server starts.
INSTRUCTIONS = load_instructions()


def connect():
    """Opens a WebSocket to OpenAI for one call."""
    return websocket_connect(URL, additional_headers={"Authorization": f"Bearer {config.OPENAI_API_KEY}"})


async def start(openai_ws: ClientConnection, caller_number: str):
    """Configures the session and waits for OpenAI to start it."""
    await openai_ws.send(json.dumps({"type": "session.start", "session": session_config(caller_number)}))
    event = json.loads(await openai_ws.recv())
    if event["type"] != "session.started":
        raise RuntimeError(f"OpenAI didn't start the session: {event}")


def session_config(caller_number: str) -> dict:
    now = datetime.now(BUENOS_AIRES)
    return {
        "model": config.OPENAI_LIVE_MODEL,
        "instructions": f"{INSTRUCTIONS}\n\n{call_context(caller_number, now)}",
        "audio": {
            # Phone audio is 8kHz G.711 μ-law, which OpenAI accepts and returns as-is.
            "format": {"type": "audio/pcmu", "rate": 8000},
            "output": {"voice": config.OPENAI_VOICE},
        },
        # The voice model delegates transfers and bookings to the backend model, which calls our tools.
        "delegation": backend.delegation(now),
    }


def call_context(caller_number: str, now: datetime) -> str:
    """What the voice model knows about this call: who is calling, and when."""
    if caller_number:
        caller = f"Llama desde el {caller_number}, que termina en {caller_number[-4:]}."
    else:
        caller = "Su número está oculto."
    today = spanish_date(now.date(), with_year=True)
    return f"# Quién llama\n{caller}\n\n# Fecha y hora\nHoy es {today}, son las {now:%H:%M} en Buenos Aires."
