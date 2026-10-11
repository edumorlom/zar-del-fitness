"""Logs what the caller and the assistant say during a call."""

import logging

log = logging.getLogger(__name__)

CALLER = "Caller"
ASSISTANT = "Assistant"


class Transcript:
    """Their words arrive in small pieces, and both can talk at once. Each side's line is logged once the other
    side starts speaking after it, or when the call ends."""

    def __init__(self, call_sid: str):
        self.call_sid = call_sid
        self.lines = {CALLER: "", ASSISTANT: ""}
        # When each side last spoke, in milliseconds into the call.
        self.end_ms = {CALLER: 0, ASSISTANT: 0}

    def add(self, speaker: str, text: str, start_ms: int, end_ms: int):
        other = ASSISTANT if speaker == CALLER else CALLER
        # The other side's line is complete once they've stopped.
        if start_ms >= self.end_ms[other]:
            self.log_line(other)
        self.lines[speaker] += text
        self.end_ms[speaker] = end_ms

    def flush(self):
        """Logs both sides' lines, at the end of the call."""
        self.log_line(CALLER)
        self.log_line(ASSISTANT)

    def log_line(self, speaker: str):
        if line := self.lines[speaker].strip():
            log.info("[%s] %s: %s", self.call_sid, speaker, line)
        self.lines[speaker] = ""
