# Built from the root of the repo (Railway: Root Directory "/"), because the assistant reads db/, next to assistant/.

# There's no official python:3.15 image yet, so uv installs Python 3.15 (from .python-version).
FROM ghcr.io/astral-sh/uv:0.13.0-trixie-slim

# The image has no root certificates, which Python needs to connect to OpenAI, Twilio and Resend over HTTPS.
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app/assistant
COPY assistant/pyproject.toml assistant/uv.lock assistant/.python-version ./
RUN uv sync --locked --no-dev --compile-bytecode
COPY assistant/ ./
# The gym's information that can change (plans, prices, hours…), shared with the website.
COPY db/ /app/db/

# Railway (and most hosts) set PORT; main.py listens on it.
CMD [".venv/bin/python", "main.py"]
