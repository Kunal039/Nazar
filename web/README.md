# web/ — the Nazar page and detector

| File | What it does |
|---|---|
| `index.html`, `style.css` | The page: live mic, sample calls, typed lines, score panel, alarm screen |
| `app.js` | Page logic: mic (on-device or browser speech), scoring display, privacy memory, alerts |
| `detector.js` | The scam detector: text folding, five-step cue phrases, risk score. Runs in the browser and in Node |
| `calls.js` | 119 labelled test calls (scam and genuine) in Hindi, English, Hinglish and Punjabi |
| `test*.js` | Tests: `test.js` (all calls), `test_addressed.js`, `test_fold.js`, `test_score.js`, `test_aware.js` |
| `e2e_live.js` | Streams a recorded call through the speech server into the detector |

Run all tests: `npm test` from the repository root.
