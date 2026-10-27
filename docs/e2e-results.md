# End-to-end results (on-device, 27 Oct 2026)

Phone-quality audio → `server/server.py` (Whisper large-v3-turbo, GPU) → `web/detector.js`.
Run: `node web/e2e_live.js demo-audio/S1_full.wav --lang hi`

| Call | Language setting | Result | Money asked at | Speech-to-text per sentence |
|---|---|---|---|---|
| S1 Hindi digital arrest | hi | **Alarm at sentence 4** (risk 65 at sentence 3) | sentence 5 | 0.7–1.0 s |
| S11 Punjabi digital arrest | pa | **Alarm at sentence 3** | sentence 5 | 1.0–1.3 s |
| G2 genuine bank call | en | **No alarm** (risk 9) | – | 0.8–1.1 s |

Notes
- Whisper misheard "drugs" (ड्रग्स → ग्रग) in S1 line 2, so the alarm came one sentence later than on the clean text; still before the money ask.
- Whisper writes Punjabi partly in Devanagari; the detector folds both scripts, so the Punjabi call is still caught.
- The language setting must match the call: G2 (English) run as Hindi gives garbled text (and no alarm).
