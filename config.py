"""Settings, read from the .env file (see .env.example)."""

import os

from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_REALTIME_MODEL = os.getenv("OPENAI_REALTIME_MODEL") or "gpt-realtime-2.1"
OPENAI_VOICE = os.getenv("OPENAI_VOICE") or "marin"
OPENAI_REASONING_EFFORT = os.getenv("OPENAI_REASONING_EFFORT", "")
VECTOR_STORE_ID = os.getenv("VECTOR_STORE_ID", "")

TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
PUBLIC_BASE_URL = os.getenv("PUBLIC_BASE_URL", "").rstrip("/")

BUSINESS_NAME = os.getenv("BUSINESS_NAME") or "Zar del Fitness"
GREETING = os.getenv("GREETING") or f"¡Hola! Gracias por llamar a {BUSINESS_NAME}. ¿En qué te puedo ayudar?"

PORT = int(os.getenv("PORT") or 8000)
