# Demo audio (phone-quality, 16 kHz mono)

Synthetic test calls made with `stt-bench/make_audio.py` (text-to-speech plus a phone-line filter), one file per line.

| Files | Call | Expected |
|---|---|---|
| `S1_1..6.wav` | Hindi digital-arrest scam ("Inspector Sharma, Cyber Crime") | Alarm at line 3, before the money ask |
| `S11_1..6.wav` | Punjabi digital-arrest scam | Alarm before the money ask |
| `G2_1..4.wav` | Genuine call | Stays safe |

Play them in order on speaker next to the laptop, or stream them without a mic:
`python server/stream_test.py demo-audio/S1_1.wav demo-audio/S1_2.wav demo-audio/S1_3.wav --lang hi`
