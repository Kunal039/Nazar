# Whisper benchmark results (22 Oct 2026)

Laptop: RTX 3050 Laptop GPU (6 GB), i7-13650HX, 16 GB RAM (about 3 GB free with normal apps open).
Test audio: 29 scripted calls, 112 lines (Hindi 8 calls, English 10, Punjabi 9, Hinglish 2), as clean audio
and as a phone-speaker version (300–3400 Hz, 8 kHz, background noise). Decoding: greedy, no retries, live settings.

## Recommendation

**Use `large-v3-turbo` on the GPU.** It is the most accurate model that fits, and it takes about 0.6 s per line.
It caught every Hindi, Hinglish and English scam before money was asked for, on clean and phone audio.
Close heavy apps (Postman, extra Chrome windows) before loading it: two larger runs failed for lack of free RAM.

## Speed and accuracy

Median time per line of speech (lines are 3–7 s long). CER = share of characters wrong.

| Model | Device | Hindi time | English time | Hindi CER clean / phone | English CER |
|---|---|---|---|---|---|
| small | GPU | 0.48 s | 0.22 s | 18% / 26% | 2–4% |
| medium | GPU | 1.01 s | 0.48 s | 15% / 17% | 2–3% |
| **large-v3-turbo** | **GPU** | **0.60 s** | **0.45 s** | **10% / 9%** | **2–3%** |
| small | CPU | 2.07 s | 1.30 s | 17% / 23% | 2–3% |
| large-v3 | GPU | failed to load: not enough free RAM | | | |
| large-v3-turbo | CPU | failed to load: not enough free RAM | | | |

Punjabi CER (about 60–70%) is not shown: Whisper writes Punjabi speech in Hindi script, so it is
compared against the wrong script. The detector now reads both scripts, so the end-to-end check below is what counts.

## Does Nazar still catch the scams? (detector fed with Whisper's text, line by line)

Scams counted as caught only if the alarm fired before the money was asked for.

| Model | Device | Hindi + Hinglish + English scams (9) clean / phone | Punjabi scams (4) clean / phone | False alarms (genuine calls) |
|---|---|---|---|---|
| typed text (reference) | – | 9 / 9 | 4 / 4 | G22 (TV news report) |
| small | GPU | 6 / 7 | 2 / 0 | G22 on phone audio |
| medium | GPU | 9 / 9 | 2 / 1 | G22, G11 (Punjabi bank reminder) |
| **large-v3-turbo** | **GPU** | **9 / 9** | **4 / 2** | G22; G11 on phone audio |
| small | CPU | 6 / 6 | 2 / 0 | G22 on phone audio |

## What this means for the final

1. **Hindi, Hinglish and English are ready** with large-v3-turbo on the GPU.
2. **Punjabi works on clean audio, but not reliably on phone audio.** On phone audio Whisper mishears key words
   ("आयूटी पी" for OTP, "सेज अकाउंट" for "safe account"). In the demo, lead with Hindi or Hinglish and present
   Punjabi as clean-audio support. A Punjabi-tuned Whisper model is a possible next step.
3. **The CPU fallback is weak.** If the GPU fails, small on the CPU takes about 2 s per line and misses some Hindi scams.
   Keep the browser's own speech recognition (needs internet) as the emergency fallback instead.
4. **Check memory before the demo.** With only about 3 GB of RAM free, large-v3 and large-v3-turbo on the CPU
   could not load. Close other apps first, and load the model once at start-up, not per call.
5. **G22 is a real false alarm** (a news report about a scam gang). Counting threats only when they are aimed at
   "you" (आप / ਤੁਸੀਂ / you) is the suggested fix.

## Honest limits

- All speech is text-to-speech, which is cleaner than real callers. **Record real voices and rerun before the final.**
- The Punjabi script fixes were made after seeing these transcripts, so the Punjabi numbers above are optimistic.
- 29 calls is a small test set; one call changes a number a lot.
- The first load of each model includes downloading it (large-v3-turbo took 66 s the first time).
