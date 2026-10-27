# Changelog

## Final round, Code Yudh 2026 (27–28 Oct, Chandigarh University)
### Added
- On-device speech server (Whisper large-v3-turbo on GPU, CPU fallback), browser mic streaming over WebSocket.
- Privacy by design: on-device by default, 30-second memory, wipe on stop, alerts without call text.
- Rules: threats count only when aimed at the listener; scam-awareness cap; "not a scam" treated as a warning sign.
- Whisper mishearing variants (ग्रग, वोरेंट, ट्रांसपर), Hinglish isolation phrases, delivery-OTP genuine cue.
- 64 new test calls (119 total), unit tests, end-to-end test through Whisper, GitHub Actions.
- UI: big mic button with loudness bar, risk ring, step tracker, transcript bubbles, call summary, dark mode, first-visit tips, keyboard shortcut, 1930 helpline button.

### Fixed
- Stop listening kept the mic running when pressed during start-up.
- News report about a scam (G22) raised a false alarm.
- Sentence cutter sent clicks to Whisper as sentences.
- start.bat failed in folders with "&" in the path; works offline.

### Results
54/54 in-scope scams caught before the money ask; 1/58 genuine calls raise the alarm (documented in docs/known-limits.md).

## Phase 1 (online round)
- Rule-based five-step detector, web prototype with browser speech, 55 scripted calls, test bench.
