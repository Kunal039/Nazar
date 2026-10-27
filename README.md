# Nazar — live scam-call detector (Team CodeVators)

Nazar listens to a phone call on speaker and warns the user, in Hindi, English or Punjabi, the moment the call starts to follow the "digital arrest" pattern:
**Authority → Fear → Isolation → Control → Transfer**. It flags the scam before any money is asked for, and can alert a family member on Telegram or WhatsApp.

Team: Kunal Mittal (lead), Ansh Kumar, Shivani Kumari. Code Yudh 2026 final, Chandigarh University.

## What was built when (transparency note)

| Part | Origin |
|---|---|
| `web/` detector, UI, sample calls, test bench | **Phase 1 online-round prototype** (our own Phase 1 submission, https://nazar-codevators.vercel.app), committed here as the starting point |
| Pre-event research (speech-to-text speed benchmark) | Done before the event; scripts and results added later, marked as such |
| `stt-bench/` speech-to-text benchmark (Whisper sizes, CPU vs GPU, phone-quality audio) | Pre-event research, committed as-is |
| Live on-device speech server, alert flow, false-alarm fix, final integration | Built at the venue, 27–28 Oct 2026 (see commit history) |

## Privacy

On-device by default, nothing recorded, call text forgotten after 30 s, wiped when listening stops; family alerts never include what was said. See [docs/privacy.md](docs/privacy.md).

## Run

Open `web/index.html` in Chrome (mic needs Chrome's Web Speech API), or serve the folder:

```
cd web
python -m http.server 8000
```

Tests: `node web/test.js` (detector on 119 labelled calls: 61 scam, 58 genuine, including Whisper-style transcripts), `node web/test_addressed.js`, `node web/test_fold.js`, `node web/test_score.js`, `node web/test_aware.js` (or simply `npm test`), `python server/test_cutter.py`; end to end through Whisper: `node web/e2e_live.js demo-audio/S1_full.wav`.

Docs: [privacy](docs/privacy.md), [architecture](docs/architecture.md), [scoring](docs/scoring.md), [FAQ](docs/faq.md). One-click start on Windows: `start.bat`.

## On-device speech (no internet)

```
pip install -r server/requirements.txt
python server/server.py            # large-v3-turbo on GPU; falls back to small on CPU
```

Open http://localhost:8000. The page detects the server and switches the mic to **On-device (Whisper)**:
mic audio streams over a WebSocket to the laptop, is cut into sentences, transcribed (about 0.6 s per sentence on GPU), and scored. Audio never leaves the machine.
Test without a mic: `python server/stream_test.py call_line1.wav call_line2.wav`.

## How detection works

- Text is folded (Unicode normalisation, nukta/halant removal, Gurmukhi mapped to Devanagari) so Hindi, Punjabi and Romanised speech match one word list.
- Each of the five stages has weighted cue phrases; a score above 70 with stage progression raises the alarm.
- The alarm needs a second-person word somewhere in the call, so news reports and stories about scams do not trigger it.
- A call that shows scam awareness (warns about scams, mentions the 1930 helpline, says to report it) gets a caution at most; "this is not a scam" does not count, since scammers say it too.
- Out-of-scope scams (e.g. lottery, job fraud) are reported separately in the test bench.

## Known limits

- Fixed at the venue: G22 (a TV news report about a scam racket) was a false alarm. Threats now count only once the caller addresses the listener ("you", aap, tusi, ਤੁਸੀਂ); a call that only talks about other people stays below the alarm. Result now: 54/54 in-scope scams caught before the money ask; 1/58 genuine calls raise the alarm (G49, see [known limits](docs/known-limits.md)).
- Browser speech recognition needs internet; the on-device Whisper server removes that need.
