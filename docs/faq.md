# Questions we expect

**Why rule-based and not ML?** It explains why it alarmed (the five steps), needs no training data (no public dataset of Indian scam calls exists), and runs instantly on any phone. ML can be layered on later.

**How would it get call audio on a real phone?** Android blocks apps from recording calls directly. That needs a dialer app or a telecom partner, so the demo listens on speaker.

**What about new scam scripts?** The word lists are data, not code, so they update without retraining.

**Accuracy on real calls?** Our test calls were written by our team, so the numbers (22/22 scams caught, 0/30 false alarms) are not real-world accuracy. Real calls are the next step.

**Why Whisper large-v3-turbo?** Our benchmark (`stt-bench/RESULTS.md`) compared small, medium and large-v3-turbo on CPU and GPU with phone-quality audio; turbo on GPU was accurate and fast enough for live use.
