"""Settings, read from the .env file (see .env.example)."""

import os

from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_REALTIME_MODEL = os.getenv("OPENAI_REALTIME_MODEL") or "gpt-realtime-2.1-mini"
OPENAI_VOICE = os.getenv("OPENAI_VOICE") or "cedar"
OPENAI_REASONING_EFFORT = os.getenv("OPENAI_REASONING_EFFORT", "")

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
# On Railway it can be left unset: Railway provides the service's public domain.
RAILWAY_PUBLIC_DOMAIN = os.getenv("RAILWAY_PUBLIC_DOMAIN", "")
PUBLIC_BASE_URL = (
    os.getenv("PUBLIC_BASE_URL") or (f"https://{RAILWAY_PUBLIC_DOMAIN}" if RAILWAY_PUBLIC_DOMAIN else "")
).rstrip("/")

# WhatsApp number that sends booking confirmations, e.g. Twilio's sandbox +14155238886.
TWILIO_WHATSAPP_FROM = os.getenv("TWILIO_WHATSAPP_FROM", "")
# Optional: an approved WhatsApp template (Content SID, HX...). Needed outside the sandbox.
TWILIO_WHATSAPP_TEMPLATE_SID = os.getenv("TWILIO_WHATSAPP_TEMPLATE_SID", "")
# Where booking confirmations are sent by WhatsApp.
BOOKINGS_WHATSAPP_TO = os.getenv("BOOKINGS_WHATSAPP_TO") or "+17867154286"
# Where calls are transferred: the front desk advisors.
FRONT_DESK_PHONE = os.getenv("FRONT_DESK_PHONE") or "+17867154286"

BUSINESS_NAME = os.getenv("BUSINESS_NAME") or "Zar del Fitness"
GREETING = os.getenv("GREETING") or f"¡Hola! Gracias por llamar a {BUSINESS_NAME}. ¿En qué te puedo ayudar?"

PORT = int(os.getenv("PORT") or 8000)
