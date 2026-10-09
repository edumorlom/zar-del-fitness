# Zar del Fitness phone assistant

Answers phone calls with an AI voice assistant that knows the gym's information and speaks the caller's language.

```
Caller ──► Twilio number ──► this server (FastAPI) ◄──► OpenAI Realtime API (listens and speaks)
                                    │
                                    └──► OpenAI vector store (the gym's documents)
```

| File | What it is |
|---|---|
| `instructions.md` | How the assistant behaves: tone, language, rules. Edit freely. |
| `knowledge/` | The gym's information (hours, prices, classes…). Markdown, text, PDF or Word. |
| `upload_knowledge.py` | Uploads `knowledge/` to OpenAI so the assistant can search it. |
| `main.py` | The server that connects phone calls to OpenAI. |
| `tools.py` | Functions the assistant can call (currently: search the knowledge base). |
| `test_call.py` | Talk to the assistant through your microphone, without calling. |

## Setup

1. **Install**
   ```sh
   uv venv && uv pip install -r requirements.txt
   ```
   (or `python3 -m venv .venv && .venv/bin/pip install -r requirements.txt`)

2. **Configure:** `cp .env.example .env` and fill in `OPENAI_API_KEY` and `TWILIO_AUTH_TOKEN`.

3. **Add the gym's information:** fill in `knowledge/gym-info.md` and add any other documents to `knowledge/`. Then upload them:
   ```sh
   .venv/bin/python upload_knowledge.py
   ```
   The first run prints a `VECTOR_STORE_ID`: put it in `.env`. Run the script again after every change to `knowledge/`.

4. **Expose your computer to the internet** (Twilio needs to reach it):
   ```sh
   ngrok http 8000
   ```
   Put the `https://….ngrok-free.app` URL in `.env` as `PUBLIC_BASE_URL`.

5. **Start the server**
   ```sh
   .venv/bin/python main.py
   ```

6. **Connect the phone number:** in the Twilio Console, open your number → *Voice Configuration* → *A call comes in* → Webhook `https://….ngrok-free.app/incoming-call`, method `HTTP POST`.

7. **Call the number.** The terminal shows what the caller and the assistant say, and every knowledge base search.

## Test without calling

1. Start the server: `.venv/bin/python main.py` (ngrok isn't needed for this).
2. In another terminal: `.venv/bin/python test_call.py`, then talk. Ctrl+C hangs up.

It connects to the server the same way Twilio does, so it tests everything except the phone network. The server's terminal shows what you and the assistant say. Use headphones; with your computer's speakers run `test_call.py --speakers`, which mutes your microphone while the assistant talks. The first time, macOS asks to let your terminal use the microphone.

## Languages

The assistant greets callers in Spanish (change `GREETING` in `.env`) and then answers in whatever language the caller speaks, switching if they switch. The documents can be in any language; it translates.

## Notes

- Free ngrok URLs change each time you restart ngrok: update `PUBLIC_BASE_URL` and the Twilio webhook when that happens.
- Requests are verified with your Twilio auth token, so only Twilio can start calls on this server.
- To go live, deploy to a host that supports WebSockets and stays running (Fly.io, Render, Railway); serverless functions won't work.
