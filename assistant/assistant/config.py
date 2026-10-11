"""Settings, read from the .env file (see .env.example)."""

import logging
import os

from dotenv import load_dotenv

load_dotenv()

log = logging.getLogger(__name__)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
# The voice model, which talks with the caller.
OPENAI_LIVE_MODEL = os.getenv("OPENAI_LIVE_MODEL") or "gpt-live-1"
OPENAI_VOICE = os.getenv("OPENAI_VOICE") or "cedar"
# The backend model, which transfers calls and books visits when the voice model delegates them.
OPENAI_BACKEND_MODEL = os.getenv("OPENAI_BACKEND_MODEL") or "gpt-6.1-sol"
# Optional reasoning effort for the backend model. Blank uses the model's default.
OPENAI_REASONING_EFFORT = os.getenv("OPENAI_REASONING_EFFORT", "")

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
# On Railway it can be left unset: Railway provides the service's public domain.
RAILWAY_PUBLIC_DOMAIN = os.getenv("RAILWAY_PUBLIC_DOMAIN", "")
PUBLIC_BASE_URL = (
    os.getenv("PUBLIC_BASE_URL") or (f"https://{RAILWAY_PUBLIC_DOMAIN}" if RAILWAY_PUBLIC_DOMAIN else "")
).rstrip("/")

# Where calls are transferred: the front desk advisors.
FRONT_DESK_PHONE = os.getenv("FRONT_DESK_PHONE") or "+5491127336258"

# Booking confirmations are emailed through Resend (resend.com).
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
BOOKINGS_EMAIL_TO = os.getenv("BOOKINGS_EMAIL_TO") or "zardelfitnessgym@gmail.com"
# Any address on a domain verified in Resend.
BOOKINGS_EMAIL_FROM = os.getenv("BOOKINGS_EMAIL_FROM") or "Asistente Zar del Fitness <asistente@edumorales.dev>"

BUSINESS_NAME = os.getenv("BUSINESS_NAME") or "Zar del Fitness"
GREETING = os.getenv("GREETING") or f"¡Hola! Gracias por llamar a {BUSINESS_NAME}. ¿En qué te puedo ayudar?"

PORT = int(os.getenv("PORT") or 8000)


def check():
    """Stops the server from starting without the settings it needs, and warns about features that are off."""
    required = {
        "OPENAI_API_KEY": OPENAI_API_KEY,
        "TWILIO_AUTH_TOKEN": TWILIO_AUTH_TOKEN,
        "PUBLIC_BASE_URL": PUBLIC_BASE_URL,
    }
    for name, value in required.items():
        if not value:
            raise RuntimeError(f"{name} is not set. Copy .env.example to .env and fill it in.")
    if not TWILIO_ACCOUNT_SID:
        log.warning("TWILIO_ACCOUNT_SID is not set: calls can't be transferred.")
    if not RESEND_API_KEY:
        log.warning("RESEND_API_KEY is not set: bookings aren't sent by email.")
