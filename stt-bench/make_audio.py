"""Make test audio for the speech-to-text benchmark.

For each chosen call in calls.json (exported from nazar-prototype/calls.js), synthesise every line:
  - Hindi (Devanagari) and Hinglish: Microsoft Edge neural voices (hi-IN), via edge-tts
  - English: Edge neural voices (en-IN)
  - Punjabi (Gurmukhi): Google TTS (gTTS, "pa"), since Edge has no Punjabi voice
Then write two 16 kHz mono WAVs per line:
  clean/<call>_<n>.wav   straight from the TTS
  phone/<call>_<n>.wav   phone-speaker simulation: 300-3400 Hz band, 8 kHz, noise at ~15 dB SNR

TTS speech is cleaner and more regular than real callers, so results on it are optimistic.
Usage: python make_audio.py calls.json OUT_DIR
"""
import asyncio, json, os, sys, io
import numpy as np
import soundfile as sf
import av

CALL_IDS = {
    "Hindi": ["S2", "S9", "S20", "G7", "G9", "G20", "G24", "G30"],
    "English": ["S3", "S5", "S7", "S19", "S22", "G2", "G8", "G17", "G22", "G27"],
    "Punjabi": ["S11", "S12", "S13", "S16", "G11", "G12", "G13", "G15", "G25"],
    "Hinglish": ["S1", "G1"],
}
VOICES = {"Hindi": ["hi-IN-MadhurNeural", "hi-IN-SwaraNeural"], "Hinglish": ["hi-IN-MadhurNeural", "hi-IN-SwaraNeural"],
          "English": ["en-IN-PrabhatNeural", "en-IN-NeerjaNeural"]}
SR = 16000


def decode_to_16k(mp3_bytes):
    with av.open(io.BytesIO(mp3_bytes)) as c:
        rs = av.AudioResampler(format="flt", layout="mono", rate=SR)
        chunks = []
        for frame in c.decode(audio=0):
            for f in rs.resample(frame):
                chunks.append(f.to_ndarray().reshape(-1))
        for f in rs.resample(None):
            chunks.append(f.to_ndarray().reshape(-1))
    return np.concatenate(chunks).astype(np.float32)


def phone(x, rng):
    """Band-limit to 300-3400 Hz, drop to 8 kHz and back, add noise at ~15 dB SNR."""
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X[(f < 300) | (f > 3400)] = 0
    y = np.fft.irfft(X, n=len(x))
    y = np.repeat(y[::2], 2)[: len(x)]  # crude 8 kHz sample-and-hold
    p = np.mean(y ** 2) + 1e-12
    noise = rng.normal(0, np.sqrt(p / (10 ** (15 / 10))), len(y))
    y = y + noise
    return (y / (np.max(np.abs(y)) + 1e-9) * 0.9).astype(np.float32)


async def tts_edge(text, voice):
    import edge_tts
    buf = b""
    async for chunk in edge_tts.Communicate(text, voice).stream():
        if chunk["type"] == "audio":
            buf += chunk["data"]
    return buf


def tts_google(text, lang):
    from gtts import gTTS
    b = io.BytesIO()
    gTTS(text, lang=lang, lang_check=False).write_to_fp(b)  # "pa" works though gTTS no longer lists it
    return b.getvalue()


async def main(calls_json, out):
    calls = {c["id"]: c for c in json.load(open(calls_json, encoding="utf8"))}
    os.makedirs(os.path.join(out, "clean"), exist_ok=True)
    os.makedirs(os.path.join(out, "phone"), exist_ok=True)
    rng = np.random.default_rng(7)
    manifest = []
    for group, ids in CALL_IDS.items():
        for k, cid in enumerate(ids):
            c = calls[cid]
            for n, line in enumerate(c["lines"]):
                name = f"{cid}_{n + 1}"
                clean_p = os.path.join(out, "clean", name + ".wav")
                if not os.path.exists(clean_p):
                    if group == "Punjabi":
                        mp3 = tts_google(line, "pa")
                        voice = "gTTS-pa"
                    else:
                        voice = VOICES[group][k % 2]
                        mp3 = await tts_edge(line, voice)
                    x = decode_to_16k(mp3)
                    sf.write(clean_p, x, SR)
                    sf.write(os.path.join(out, "phone", name + ".wav"), phone(x, rng), SR)
                else:
                    voice = "cached"
                dur = sf.info(clean_p).duration
                manifest.append({"call": cid, "line": n, "group": group, "kind": c["kind"], "text": line,
                                 "file": name + ".wav", "seconds": round(dur, 2), "voice": voice})
                print(f"{name:8} {group:9} {dur:5.1f}s  {voice}")
    json.dump(manifest, open(os.path.join(out, "manifest.json"), "w", encoding="utf8"), ensure_ascii=False, indent=1)
    print("lines:", len(manifest), "audio seconds:", round(sum(m["seconds"] for m in manifest), 1))


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1], sys.argv[2]))
