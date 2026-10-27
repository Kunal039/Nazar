# Contributing to Nazar

Thanks for helping make scam calls fail.

## Run it
```
pip install -r server/requirements.txt
python server/server.py        # or double-click start.bat on Windows
```
Open http://localhost:8000.

## Before you open a pull request
1. `npm test` must pass (detector, scoring, folding, listener and awareness tests).
2. If you change the server, run `python server/test_cutter.py`.
3. Add a test for what you change:
   - a new scam pattern → a scam call in `web/calls.js` that is caught **before** the money ask;
   - a new word or rule → a genuine call that uses similar words and stays safe.
4. Keep privacy promises intact: no call audio or text may leave the device or be logged. See `docs/privacy.md`.

## Adding words
Cue phrases live in `LEX` in `web/detector.js`, grouped by step (Authority, Fear, Isolation, Control, Transfer), each with a strength from 0 to 1. Write each word once: spelling variants (nukta, Gurmukhi vs Devanagari) are folded automatically.

## Commit messages
One change per commit, written as what it does: "Fear: add ...", "UI: ...", "Fix: ...".
