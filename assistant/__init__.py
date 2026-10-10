"""Phone voice assistant: connects Twilio phone calls to OpenAI's GPT-Live voice model.

How a call flows through the modules:
- server.py: Twilio calls POST /incoming-call when someone dials the number. We answer with TwiML that streams the
  call audio to the /media-stream WebSocket.
- call_session.py: relays that audio to OpenAI and plays OpenAI's spoken replies back to the caller.
- live_session.py: configures the voice model: instructions.md, the gym's information (knowledge/), the voice.
- backend.py: the voice model delegates transfers and bookings to a backend model, which calls the tools in
  transfer.py and visits.py.
"""
