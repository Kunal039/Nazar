# Architecture

```
Phone call on speaker
        │  (laptop mic)
        ▼
Browser: getUserMedia → Web Audio (16 kHz PCM) ──WebSocket──► server/server.py
                                                               │ energy-based sentence cutting
                                                               │ faster-whisper large-v3-turbo (GPU, float16)
        ◄────────────── text per sentence (~0.6 s) ────────────┘
        │
        ▼
web/detector.js: fold text (Gurmukhi→Devanagari, nukta/halant) → match cue phrases
        → 5-step confidence → risk score (see scoring.md)
        │
        ├── Safe / Caution: live meter and highlighted phrases
        └── Danger (≥70): spoken warning (SpeechSynthesis) + Telegram alert + WhatsApp link
```

- Fallback: if the speech server is not running, the page uses Chrome's Web Speech API (needs internet).
- Fallback: if there is no GPU, the server loads Whisper small on the CPU.
- Privacy: in on-device mode, audio never leaves the laptop; only the alert text goes to Telegram.
