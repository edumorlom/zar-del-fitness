"""Talk to the assistant with your microphone and speakers, as if you were calling the phone number.

Start the server first (python main.py), then in another terminal run: python test_call.py
This script connects to the server the same way Twilio does, so it tests everything except the
phone network. What you and the assistant say is shown in the server's terminal.

Use headphones. With your computer's speakers, run `python test_call.py --speakers`: it mutes your
microphone while the assistant talks, otherwise the assistant hears itself and keeps interrupting.
"""

import argparse
import asyncio
import audioop
import base64
import collections
import json
import threading
import time
import uuid

import sounddevice as sd
from websockets.asyncio.client import connect

from assistant import config
from assistant.server import stream_token

# Phone audio, like Twilio sends: 8 kHz, 16-bit samples encoded as μ-law, in 20 ms chunks.
SAMPLE_RATE = 8000
CHUNK_SAMPLES = 160
SILENCE = audioop.lin2ulaw(b"\0\0" * CHUNK_SAMPLES, 2)


class Speaker:
    """Plays the assistant's audio and reports each mark once the audio before it has played, like Twilio."""

    def __init__(self, on_mark):
        self.on_mark = on_mark
        self.queue = collections.deque()  # audio (bytearray) and mark names (str), in playback order
        self.lock = threading.Lock()
        # When the assistant's audio last had speech in it. It streams nonstop, silence included.
        self.last_speech_at = 0.0
        self.stream = sd.RawOutputStream(
            samplerate=SAMPLE_RATE, channels=1, dtype="int16", blocksize=CHUNK_SAMPLES, callback=self._play
        )

    @property
    def talking(self) -> bool:
        return time.monotonic() - self.last_speech_at < 0.5

    def add_audio(self, pcm: bytes):
        if audioop.rms(pcm, 2) > 200:
            self.last_speech_at = time.monotonic()
        with self.lock:
            self.queue.append(bytearray(pcm))

    def add_mark(self, name: str):
        with self.lock:
            self.queue.append(name)

    def clear(self):
        with self.lock:
            self.queue.clear()

    def _play(self, outdata, frames, time, status):
        out = bytearray()
        with self.lock:
            while self.queue and (len(out) < len(outdata) or isinstance(self.queue[0], str)):
                item = self.queue[0]
                if isinstance(item, str):
                    self.queue.popleft()
                    self.on_mark(item)
                    continue
                needed = len(outdata) - len(out)
                out += item[:needed]
                del item[:needed]
                if not item:
                    self.queue.popleft()
        outdata[:] = bytes(out.ljust(len(outdata), b"\0"))


async def call(url: str, mute_while_assistant_talks: bool):
    loop = asyncio.get_running_loop()
    # Microphone chunks and played marks, waiting to be sent to the server.
    outbox: asyncio.Queue = asyncio.Queue()
    speaker = Speaker(on_mark=lambda name: loop.call_soon_threadsafe(outbox.put_nowait, ("mark", name)))
    microphone = sd.RawInputStream(
        samplerate=SAMPLE_RATE,
        channels=1,
        dtype="int16",
        blocksize=CHUNK_SAMPLES,
        callback=lambda indata, frames, time, status: loop.call_soon_threadsafe(
            outbox.put_nowait, ("audio", bytes(indata))
        ),
    )
    call_sid = "CA" + uuid.uuid4().hex
    stream_sid = "MZ" + uuid.uuid4().hex

    async with connect(url) as ws:
        await ws.send(json.dumps({"event": "connected"}))
        await ws.send(json.dumps({
            "event": "start",
            "start": {"streamSid": stream_sid, "callSid": call_sid, "customParameters": {"token": stream_token(call_sid)}},
        }))

        async def send_to_server():
            timestamp = 0
            while True:
                kind, data = await outbox.get()
                if kind == "mark":
                    await ws.send(json.dumps({"event": "mark", "streamSid": stream_sid, "mark": {"name": data}}))
                    continue
                timestamp += 20
                audio = SILENCE if mute_while_assistant_talks and speaker.talking else audioop.lin2ulaw(data, 2)
                await ws.send(json.dumps({
                    "event": "media",
                    "streamSid": stream_sid,
                    "media": {"timestamp": str(timestamp), "payload": base64.b64encode(audio).decode()},
                }))

        async def receive_from_server():
            async for message in ws:
                data = json.loads(message)
                match data["event"]:
                    case "media":
                        speaker.add_audio(audioop.ulaw2lin(base64.b64decode(data["media"]["payload"]), 2))
                    case "mark":
                        speaker.add_mark(data["mark"]["name"])
                    case "clear":
                        speaker.clear()

        with microphone, speaker.stream:
            print("Connected. Start talking. Press Ctrl+C to hang up.")
            tasks = [asyncio.create_task(send_to_server()), asyncio.create_task(receive_from_server())]
            try:
                await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
            finally:
                for task in tasks:
                    task.cancel()
                try:
                    await ws.send(json.dumps({"event": "stop", "streamSid": stream_sid}))
                except Exception:
                    pass
    print("Call ended.")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--speakers", action="store_true", help="mute the microphone while the assistant talks")
    parser.add_argument("--url", default=f"ws://localhost:{config.PORT}/media-stream", help="server's media stream URL")
    args = parser.parse_args()

    if not args.speakers:
        print("Tip: use headphones, or run with --speakers so the assistant doesn't hear itself.")
    try:
        asyncio.run(call(args.url, mute_while_assistant_talks=args.speakers))
    except OSError:
        print(f"Can't reach the server at {args.url}. Start it first with: python main.py")
    except KeyboardInterrupt:
        print("\nHung up.")


if __name__ == "__main__":
    main()
