# Security and privacy policy

## Reporting a problem
If you find a way to make Nazar leak call audio or text, or a way for a scammer to switch off the alarm, please report it privately to the maintainer, Kunal Mittal (GitHub: @Kunal039), instead of opening a public issue. We aim to reply within 7 days.

## What we protect
- Call audio stays on the device; the speech server listens on 127.0.0.1 only.
- Call text is forgotten after 30 seconds and wiped when listening stops.
- Family alerts contain the risk level and steps seen, never what was said.
- The Telegram token is stored only in the user's browser, never in this repository.

## Known evasion found and fixed
- "This is not a scam" used to switch off the alarm through the scam-awareness rule. Fixed; covered by `web/test_aware.js`.
