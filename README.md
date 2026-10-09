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
| `tools.py` | Functions the assistant can call: book a visit (emailed to the gym), transfer to the front desk. |
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
2. In the service's **Variables**, add `OPENAI_API_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `RESEND_API_KEY`, and optionally `FRONT_DESK_PHONE`, `BOOKINGS_EMAIL_TO`, `BOOKINGS_EMAIL_FROM`, `OPENAI_REALTIME_MODEL`, `OPENAI_VOICE`, `BUSINESS_NAME` and `GREETING`. `PUBLIC_BASE_URL` isn't needed.
3. In **Settings → Networking**, click **Generate Domain**. You get an address like `https://zar-del-fitness-production.up.railway.app`.
4. In the Twilio Console, set the number's webhook to that address plus `/incoming-call`.

Every push to `main` redeploys the server.

## Test without calling

1. Start the server: `.venv/bin/python main.py` (ngrok isn't needed for this).
2. In another terminal: `.venv/bin/python test_call.py`, then talk. Ctrl+C hangs up.

It connects to the server the same way Twilio does, so it tests everything except the phone network. The server's terminal shows what you and the assistant say. Use headphones; with your computer's speakers run `test_call.py --speakers`, which mutes your microphone while the assistant talks. The first time, macOS asks to let your terminal use the microphone.

## Transfers and booking emails

**Transfers.** When the caller asks for a person, the front desk or Ronald, the assistant says it's transferring them to one of the front desk advisors, then the call is forwarded to `FRONT_DESK_PHONE` (+54 9 11 2733-6258), which sees the caller's number. Twilio only calls the countries enabled in the Twilio Console under *Voice → Settings → Geo permissions*: Argentina has to be on. Each transfer is also an outgoing call that Twilio bills.

**Booking emails.** When the assistant books a visit, the server emails it, in Spanish, to `BOOKINGS_EMAIL_TO` (zardelfitnessgym@gmail.com): name, day, time, reason, the caller's language, and the phone number they confirmed during the call (plus the number they called from, if it's a different one). It sends through [Resend](https://resend.com), because Railway blocks regular email (SMTP) on its Hobby plan.

1. In Resend, add a domain under *Domains* and add the DNS records it shows. Without a verified domain, Resend only delivers to the Resend account's own address.
2. Set `BOOKINGS_EMAIL_FROM` to an address on that domain. It's `asistente@edumorales.dev` by default.
3. In Resend, open *API Keys*, create one and put it in `RESEND_API_KEY`.

The server log says when an email was sent, or why it failed.

## Languages

The assistant greets callers in Spanish (change `GREETING` in `.env`) and then answers in whatever language the caller speaks, switching if they switch. The documents can be in any language; it translates.

## Notes

- Free ngrok URLs change each time you restart ngrok: update `PUBLIC_BASE_URL` and the Twilio webhook when that happens.
- Requests are verified with your Twilio auth token, so only Twilio can start calls on this server.
- To go live, deploy to a host that supports WebSockets and stays running (Fly.io, Render, Railway); serverless functions won't work.
