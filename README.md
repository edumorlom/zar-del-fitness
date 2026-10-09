# Zar del Fitness phone assistant

Answers phone calls with an AI voice assistant that knows the gym's information and speaks the caller's language.

```
Caller ──► Twilio number ──► this server (FastAPI) ◄──► OpenAI Realtime API (listens and speaks)
```

| File | What it is |
|---|---|
| `instructions.md` | How the assistant behaves: tone, language, rules. Edit freely. |
| `knowledge/` | The gym's information (hours, prices, classes…), in Markdown or text files. The assistant gets all of it in its instructions at the start of every call, so it answers without looking anything up. |
| `main.py` | The server that connects phone calls to OpenAI. |
| `tools.py` | Functions the assistant can call: book a visit (sent by WhatsApp), transfer to the front desk. |
| `test_call.py` | Talk to the assistant through your microphone, without calling. |

## Setup

1. **Install**
   ```sh
   uv venv && uv pip install -r requirements.txt
   ```
   (or `python3 -m venv .venv && .venv/bin/pip install -r requirements.txt`)

2. **Configure:** `cp .env.example .env` and fill in `OPENAI_API_KEY`, `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`.

3. **Add the gym's information:** fill in `knowledge/gym-info.md`, and add any other `.md` or `.txt` files to `knowledge/`. The server reads them when it starts: restart it after a change (on Railway, push). Keep them to what a receptionist would know: every call sends all of it to OpenAI.

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

7. **Call the number.** The terminal shows what the caller and the assistant say.

## Deploy to Railway

1. In Railway, create a project from the GitHub repo. The `Dockerfile` tells Railway how to build and start it.
2. In the service's **Variables**, add `OPENAI_API_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`, and optionally `TWILIO_WHATSAPP_TEMPLATE_SID`, `FRONT_DESK_PHONE`, `BOOKINGS_WHATSAPP_TO`, `OPENAI_REALTIME_MODEL`, `OPENAI_VOICE`, `BUSINESS_NAME` and `GREETING`. `PUBLIC_BASE_URL` isn't needed.
3. In **Settings → Networking**, click **Generate Domain**. You get an address like `https://zar-del-fitness-production.up.railway.app`.
4. In the Twilio Console, set the number's webhook to that address plus `/incoming-call`.

Every push to `main` redeploys the server.

## Test without calling

1. Start the server: `.venv/bin/python main.py` (ngrok isn't needed for this).
2. In another terminal: `.venv/bin/python test_call.py`, then talk. Ctrl+C hangs up.

It connects to the server the same way Twilio does, so it tests everything except the phone network. The server's terminal shows what you and the assistant say. Use headphones; with your computer's speakers run `test_call.py --speakers`, which mutes your microphone while the assistant talks. The first time, macOS asks to let your terminal use the microphone.

## Transfers and WhatsApp

**Transfers.** When the caller asks for a person, the front desk or Ronald, the assistant says it's transferring them to one of the front desk advisors, then the call is forwarded to `FRONT_DESK_PHONE` (+1 786 715 4286), which sees the caller's number. Twilio blocks calls to most countries outside the US by default: to transfer to another country, such as an Argentine number, enable that country in the Twilio Console under *Voice → Settings → Geo permissions*. Each transfer is also an outgoing call that Twilio bills.

**Booking confirmations.** When the assistant books a visit, the server sends it by WhatsApp, in Spanish, to `BOOKINGS_WHATSAPP_TO` (+1 786 715 4286): name, day, time, reason and the caller's number. To try it with Twilio's sandbox:

1. In the Twilio Console, open *Messaging → Try it out → Send a WhatsApp message*.
2. From the phone at `BOOKINGS_WHATSAPP_TO`, send the `join …` code shown there to +1 415 523 8886.
3. Set `TWILIO_WHATSAPP_FROM=+14155238886`.

WhatsApp only lets businesses send free-form messages within 24 hours of the person's last message to them, so with the sandbox, messages stop arriving after a day of silence from that phone. For regular use, register your own WhatsApp sender in Twilio, create a template under *Messaging → Content Template Builder* with this text, get it approved, and put its Content SID in `TWILIO_WHATSAPP_TEMPLATE_SID`:

```
✅ Visita confirmada en Zar del Fitness

Nombre: {{1}}
Día: {{2}}
Hora: {{3}}
Motivo: {{4}}
Teléfono: {{5}}

Agendada por el asistente telefónico.
```

The server log says when a message was sent. If it doesn't arrive, Twilio's *Monitor → Logs → Messaging* shows why.

## Languages

The assistant greets callers in Spanish (change `GREETING` in `.env`) and then answers in whatever language the caller speaks, switching if they switch. The documents can be in any language; it translates.

## Notes

- Free ngrok URLs change each time you restart ngrok: update `PUBLIC_BASE_URL` and the Twilio webhook when that happens.
- Requests are verified with your Twilio auth token, so only Twilio can start calls on this server.
- To go live, deploy to a host that supports WebSockets and stays running (Fly.io, Render, Railway); serverless functions won't work.
