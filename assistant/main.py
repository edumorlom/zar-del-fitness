"""Starts the phone assistant's server: uv run main.py (see README.md). The code is in assistant/."""

import logging

import uvicorn

from assistant import config
from assistant.server import app


def main():
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    # The Twilio library logs every API request with its headers.
    logging.getLogger("twilio.http_client").setLevel(logging.WARNING)
    config.check()
    uvicorn.run(app, host="0.0.0.0", port=config.PORT)


if __name__ == "__main__":
    main()
