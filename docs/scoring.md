# How Nazar scores a call

## 1. Confidence per step
Every cue phrase has a strength from 0 to 1 (`web/detector.js`, `LEX`). Specific scam words count more than everyday words:

| Authority phrase | Strength |
|---|---|
| CBI, cyber crime, inspector, narcotics, customs | 0.8 |
| police, officer, court, judge | 0.6 |
| bank | 0.25 |

`confidence[step] = max(confidence[step], strength)`: the strongest phrase heard so far. Repeating a phrase adds nothing; new steps raise the risk.
Exception: on lines with clear signs of a genuine call, Control-step matches (OTP, card number) are ignored.

## 2. Combine the five steps
| Step | Authority | Fear | Isolation | Control | Transfer |
|---|---|---|---|---|---|
| Weight | 0.35 | 0.5 | 0.7 | 0.8 | 0.9 |

```
base = 100 × (1 − Π (1 − confidence × weight))
```
Order bonus: +8 for each neighbouring pair heard in scam order (e.g. Authority before Fear), up to +24.

## 3. Safety cap
Until the caller addresses the listener (you, aap, tusi, ਤੁਸੀਂ), risk is capped at 39, so news reports and stories about scams never alarm.

## Levels
| Risk | Level | Action |
|---|---|---|
| 70–100 | Danger | Red alarm, spoken warning, Telegram alert to family |
| 40–69 | Caution | Yellow warning |
| 0–39 | Safe | Green |
