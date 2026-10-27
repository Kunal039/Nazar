# Privacy: what Nazar does with your call

Nazar listens to phone calls, the most private conversations people have. So privacy is not a feature here; it is the rule every part of Nazar is built around.

> **In one line:** in the on-device version, your call never leaves your device, is never saved, and is forgotten as the call goes on. Nazar is a smoke detector, not a recorder.

## What Nazar never does

- ❌ **Never records** your call. There is no audio file and no transcript file, anywhere.
- ❌ **Never sends your call** to us, to a cloud, or to any company (on-device mode).
- ❌ **Never keeps** what was said. After 30 seconds, a line is reduced to its scam warning words, or erased completely.
- ❌ **Never tells your family what was said.** The alert only says that a call looks like a scam.
- ❌ **Never needs an account.** No sign-up, no login, no phone number collected by us.
- ❌ **Never shows ads or tracks you.** There is no analytics or tracking code in this project.

## What happens to your call, step by step (on-device version)

| Step | Where it happens | What is kept |
|---|---|---|
| 1. The laptop microphone hears the call on speaker | Your device | Nothing: audio goes straight to step 2, in memory |
| 2. Speech is turned into text, sentence by sentence (Whisper) | **Your device** (server bound to `127.0.0.1`, unreachable from the network) | Nothing: each audio sentence is discarded after it becomes text |
| 3. The text is checked for the scam pattern | Your browser, on your device | The text of the **last 30 seconds** only |
| 4. After 30 seconds | Your browser | Only the scam warning words of a line (e.g. "CBI · arrest warrant"); normal talk is erased |
| 5. You press Stop | Your browser | **Everything is wiped** |
| 6. If it is a scam | Your choice: WhatsApp, Telegram, copy or share | Only: *"possible scam call right now, risk 70/100, steps seen: authority, fear, time"* |

## What the family alert contains

```
Nazar alert: possible scam call right now (for Rahul)
Risk: HIGH (70/100)
Steps seen: authority, fear
Time: 10:42 AM
Please call them now and tell them to hang up. Do not share any OTP.
```

That is all. No words from the call, no phone number of the caller, no recording.
The alert is only sent through the apps **you** set up (Telegram or WhatsApp), to the person **you** chose.

## What is stored on your device

Only your settings, in your own browser: the call language, text size, the family member's name, and your Telegram/WhatsApp details for alerts.
They never leave your device except when an alert is sent, and you can delete them by clearing the site's data in your browser.

## The one exception: website mode, by your choice

The website (nazar-codevators.vercel.app) cannot run the speech model, so live listening there uses your **browser's own speech service** (Google in Chrome), which means **audio goes to Google**.
Nazar never switches to this silently: you must choose "Browser speech (cloud)" yourself, and the page warns you first. The privacy badge then changes from 🔒 *On-device* to ⚠️ *Cloud speech*.
Sample calls and typed lines never use the microphone or any cloud service. Like any website host, Vercel may log page visits (not call data).

## On a real phone (product design)

- Nazar would listen **only to calls from unknown numbers**, never to saved contacts.
- It would turn on **only when a call starts** and stop when it ends.
- Everything above still applies: on the phone, nothing recorded, nothing sent.

## How these promises are checked

Promises are only worth something if they are tested. `npm test` and `python server/test_privacy.py` run on every change (GitHub Actions) and fail if:

- the speech server listens on anything other than `127.0.0.1`,
- the server prints or writes call text, or opens files for writing,
- the 30-second memory or the wipe on Stop is removed,
- the family alert starts including call text,
- tracking or analytics code is added to the page.

Found a way Nazar could leak your call? Please report it privately: see [SECURITY.md](SECURITY.md).
