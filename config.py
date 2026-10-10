"""Settings, read from the .env file (see .env.example)."""

import os

from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
# The voice model, which talks with the caller.
OPENAI_LIVE_MODEL = os.getenv("OPENAI_LIVE_MODEL") or "gpt-live-1"
OPENAI_VOICE = os.getenv("OPENAI_VOICE") or "cedar"
# The backend model, which transfers calls and books visits when the voice model delegates them.
OPENAI_BACKEND_MODEL = os.getenv("OPENAI_BACKEND_MODEL") or "gpt-6.1-sol"
# The backend model's reasoning effort. Lower is faster; "low" is the lowest gpt-6.1-sol accepts.
OPENAI_REASONING_EFFORT = os.getenv("OPENAI_REASONING_EFFORT") or "low"

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
