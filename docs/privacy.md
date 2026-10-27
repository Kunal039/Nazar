# Privacy by design

Concern raised at Evaluation 1: would AI or a third party listen to every call, including genuine ones?

| Guarantee | How |
|---|---|
| Audio never leaves the device | Whisper runs on the device (`server/server.py`, bound to 127.0.0.1). Cloud browser speech is opt-in with a warning. |
| Nothing is recorded | Audio is transcribed in memory sentence by sentence and discarded; nothing is written to disk. |
| Short memory | Call text is forgotten after 30 s; a line keeps only its scam phrases, or nothing. |
| Wiped at call end | Stopping listening forgets all call text immediately. |
| Alerts carry no conversation | The family alert holds only risk level, steps seen and time. |
| Only what it needs | Nazar matches about 200 scam phrases; it does not interpret anything else. |

On a phone, Nazar would listen only to calls from unknown numbers, never saved contacts (product design; not shown in the laptop demo).

"A smoke detector, not a recorder."
