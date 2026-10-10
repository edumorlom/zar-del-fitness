# There's no official python:3.15 image yet, so uv installs Python 3.15 (from .python-version).
FROM ghcr.io/astral-sh/uv:0.13.0-trixie-slim

WORKDIR /app
COPY pyproject.toml uv.lock .python-version ./
RUN uv sync --locked --no-dev --compile-bytecode
COPY . .

# Railway (and most hosts) set PORT; main.py listens on it.
CMD [".venv/bin/python", "main.py"]
