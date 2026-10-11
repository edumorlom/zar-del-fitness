"""Sends emails through Resend (resend.com), because Railway blocks regular email (SMTP) on the Hobby plan."""

import asyncio
import json
import logging
import urllib.error
import urllib.request

from . import config

log = logging.getLogger(__name__)

# Emails still being sent. asyncio keeps only weak references to tasks.
sending: set[asyncio.Task] = set()


def send_in_background(to: str, subject: str, text: str):
    """Sends an email without waiting for it. Does nothing if RESEND_API_KEY isn't set."""
    if not config.RESEND_API_KEY:
        return
    task = asyncio.create_task(send(to, subject, text))
    sending.add(task)
    task.add_done_callback(sending.discard)


async def send(to: str, subject: str, text: str):
    """Sends an email from BOOKINGS_EMAIL_FROM, and logs whether it worked."""
    email = {"from": config.BOOKINGS_EMAIL_FROM, "to": [to], "subject": subject, "text": text}
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

    def post() -> str:
        with urllib.request.urlopen(request, timeout=10) as response:
            return json.load(response)["id"]

    try:
        email_id = await asyncio.to_thread(post)
        log.info("Emailed %s: %s (%s)", to, subject, email_id)
    except urllib.error.HTTPError as error:
        log.error("Couldn't email %s: %s %s", to, error.code, error.read().decode(errors="replace"))
    except Exception:
        log.exception("Couldn't email %s", to)
