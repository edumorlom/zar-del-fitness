"""Tells when the assistant is speaking, from the loudness of its audio, which streams nonstop, silence included."""

import asyncio
import time


def ulaw_magnitude(byte: int) -> int:
    """How loud one G.711 μ-law sample is, from 0 to 32124."""
    byte = ~byte & 0xFF
    return ((((byte & 0x0F) << 3) + 0x84) << ((byte >> 4) & 0x07)) - 0x84


ULAW_MAGNITUDES = [ulaw_magnitude(byte) for byte in range(256)]
# Average loudness above which audio counts as speech.
SPEECH_LEVEL = 150
# A pause longer than this, in seconds, ends a stretch of speech.
PAUSE = 0.3


class SpeechTracker:
    def __init__(self):
        # When the current stretch of speech started, and when there was last speech (time.monotonic()).
        self.started_at = 0.0
        self.last_spoke_at = 0.0

    def add_audio(self, chunk: bytes):
        """Notes whether a chunk of the assistant's audio, as it's played, has speech in it."""
        if sum(ULAW_MAGNITUDES[byte] for byte in chunk) > SPEECH_LEVEL * len(chunk):
            now = time.monotonic()
            if now - self.last_spoke_at > PAUSE:
                self.started_at = now
            self.last_spoke_at = now

    async def wait_until_said(self, since: float):
        """Returns once the assistant has started speaking after `since` (time.monotonic()) and paused for a second.

        Goes ahead if it doesn't start speaking within 5 seconds, or is still speaking after 20.
        """
        while True:
            await asyncio.sleep(0.1)
            now = time.monotonic()
            if self.started_at > since:
                if now - self.last_spoke_at > 1 or now - since > 20:
                    return
            elif now - since > 5:
                return
