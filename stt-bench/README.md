# Speech-to-text benchmark (prep for the Code Yudh final)

Checks whether local Whisper (faster-whisper) is fast and accurate enough for Nazar, and whether the
scam detector still works on what Whisper actually hears. Results: see `RESULTS.md`.

## What is where
- `make_audio.py`: turns the scripted test calls into speech (Edge neural voices for Hindi, Hinglish and English;
  Google TTS for Punjabi), plus a phone-speaker version of every line (300–3400 Hz, 8 kHz, noise at about 15 dB SNR).
- `bench.py`: runs each Whisper model on every line, records time per line and character error rate (CER).
- `summarize.py`: speed and CER table per model, language and condition.
- `e2e.js`: feeds each model's transcripts into the detector, line by line like a live call, and compares with typed text.
- `calls.json`: export of `../nazar-prototype/calls.js` (regenerate after editing calls).

Everything for the project lives on drive D: (drives C: and E: are nearly full). Heavy files are in `../stt-data`:
- `stt-data\venv`: Python 3.11 with faster-whisper and the CUDA 12 libraries (about 2.3 GB)
- `stt-data\models`: downloaded Whisper models
- `stt-data\audio`: generated test audio (`clean/`, `phone/`, `manifest.json`)
- `stt-data\pipcache`, `stt-data\hfhome`: download caches, so reinstalling needs little internet

## Rerun (from this `stt-bench` folder)
```
node -e "process.stdout.write(JSON.stringify(require('../nazar-prototype/calls.js').CALLS))" > calls.json
..\stt-data\venv\Scripts\python make_audio.py calls.json ..\stt-data\audio
set HF_HOME=..\stt-data\hfhome
..\stt-data\venv\Scripts\python bench.py ..\stt-data\audio ..\stt-data\models results.json large-v3-turbo:cuda small:cuda
..\stt-data\venv\Scripts\python summarize.py results.json
node e2e.js results.json
```
Model spec is `name:device[:compute]`, e.g. `large-v3-turbo:cuda`, `small:cpu:int8`.

## Caveats
- The speech is text-to-speech, which is cleaner and more regular than a real caller. Real recordings will score worse.
  Record real team members before the final and rerun.
- Decoding is tuned for live use: greedy, no temperature fallback, at most 160 tokens per line.
- Timing is per line of 3–7 seconds, on an RTX 3050 Laptop GPU (6 GB) and an i7-13650HX.
