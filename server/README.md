# server/ — on-device speech

`server.py` turns live mic audio into text on this machine, using faster-whisper.

- **In:** 16 kHz mono 16-bit PCM over a WebSocket at `/ws?lang=hi` (send `lang:en` to switch).
- **Out:** `{"type": "final", "text": "...", "ms": 640, "sec": 6.3}` per sentence.
- Sentences are cut by loudness: speech, then 0.6 s of quiet (max 8 s).
- Model: `large-v3-turbo` on GPU (float16); falls back to `small` on CPU.
- Listens on 127.0.0.1 only and never logs call text.

```
python server/server.py --speech-rms 0.03   # less sensitive in a noisy hall
python server/test_cutter.py                # sentence-cutter tests (no model needed)
python server/stream_test.py demo-audio/S1_1.wav
```
