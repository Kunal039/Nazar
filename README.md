# Nazar — live scam-call detector (Team CodeVators)

Nazar listens to a phone call on speaker and warns the user, in Hindi, English or Punjabi, the moment the call starts to follow the "digital arrest" pattern:
**Authority → Fear → Isolation → Control → Transfer**. It flags the scam before any money is asked for, and can alert a family member on Telegram or WhatsApp.

Team: Kunal Mittal (lead), Ansh Kumar, Shivani Kumari. Code Yudh 2026 final, Chandigarh University.

## What was built when (transparency note)

| Part | Origin |
|---|---|
| `web/` detector, UI, sample calls, test bench | **Phase 1 online-round prototype** (our own Phase 1 submission, https://nazar-codevators.vercel.app), committed here as the starting point |
| Pre-event research (speech-to-text speed benchmark) | Done before the event; scripts and results added later, marked as such |
| Live on-device speech server, alert flow, false-alarm fix, final integration | Built at the venue, 27–28 Oct 2026 (see commit history) |

## Run

Open `web/index.html` in Chrome (mic needs Chrome's Web Speech API), or serve the folder:

```
cd web
python -m http.server 8000
```

Tests: `node web/test.js` (detector on 55 labelled calls: 25 scam, 30 genuine).

## How detection works

- Text is folded (Unicode normalisation, nukta/halant removal, Gurmukhi mapped to Devanagari) so Hindi, Punjabi and Romanised speech match one word list.
- Each of the five stages has weighted cue phrases; a score above 70 with stage progression raises the alarm.
- Out-of-scope scams (e.g. lottery, job fraud) are reported separately in the test bench.

## Known limits

- One genuine call (G22, a real police complaint call) is a false alarm; fix planned at the venue.
- Browser speech recognition needs internet; the on-device Whisper server removes that need.
