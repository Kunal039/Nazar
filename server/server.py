"""Nazar on-device speech server: browser mic audio in over a WebSocket, Whisper text out.

The browser sends 16 kHz mono 16-bit PCM in small binary frames. The server cuts the
stream into utterances with a simple energy check (speech, then a short pause) and
transcribes each one with faster-whisper on this laptop. No audio leaves the machine.
It also serves the web page, so open http://localhost:8000 and pick "On-device (Whisper)".

Run:  python server/server.py [--model large-v3-turbo] [--device cuda] [--models DIR]
"""
import argparse
import asyncio
import glob
import os
import sys
import time

# Windows: make the CUDA DLLs that pip installed (nvidia-cublas-cu12, nvidia-cudnn-cu12) findable.
if os.name == "nt":
    for d in glob.glob(os.path.join(sys.prefix, "Lib", "site-packages", "nvidia", "*", "bin")):
        os.add_dll_directory(d)
        os.environ["PATH"] = d + os.pathsep + os.environ["PATH"]  # CTranslate2 loads cuBLAS by name

import numpy as np
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from faster_whisper import WhisperModel

RATE = 16000
FRAME = 480                  # 30 ms energy frames
SPEECH_RMS = 0.012           # frame counts as speech above this level (raised automatically in noise)
END_SILENCE = 0.6            # seconds of quiet that end an utterance
MAX_UTTER = 8.0              # seconds; long monologues are cut here so the warning is not delayed
MIN_UTTER = 0.4

WEB_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "web")
app = FastAPI()
model = None
model_lock = asyncio.Lock()


def transcribe(audio, lang):
    segs, _ = model.transcribe(audio, language=lang, beam_size=1, temperature=0.0,
                               without_timestamps=True, condition_on_previous_text=False,
                               vad_filter=False, max_new_tokens=160)
    return " ".join(s.text.strip() for s in segs).strip()


class Cutter:
    """Collects PCM and returns finished utterances."""

    def __init__(self):
        self.buf = np.zeros(0, np.float32)
        self.pending = np.zeros(0, np.float32)
        self.quiet = 0.0
        self.noise = SPEECH_RMS / 2

    def feed(self, pcm):
        self.pending = np.concatenate([self.pending, pcm])
        out = []
        while len(self.pending) >= FRAME:
            f, self.pending = self.pending[:FRAME], self.pending[FRAME:]
            rms = float(np.sqrt(np.mean(f * f)))
            speech = rms > max(SPEECH_RMS, self.noise * 3)
            if not speech:
                self.noise = 0.95 * self.noise + 0.05 * rms
            if speech or len(self.buf):
                self.buf = np.concatenate([self.buf, f])
                self.quiet = 0.0 if speech else self.quiet + FRAME / RATE
                dur = len(self.buf) / RATE
                if (self.quiet >= END_SILENCE and dur >= MIN_UTTER) or dur >= MAX_UTTER:
                    out.append(self.buf)
                    self.buf = np.zeros(0, np.float32)
                    self.quiet = 0.0
                elif self.quiet >= END_SILENCE:
                    self.buf = np.zeros(0, np.float32)   # a click, not speech
        return out


@app.websocket("/ws")
async def ws(sock: WebSocket):
    await sock.accept()
    lang = (sock.query_params.get("lang") or "hi")[:2]
    cutter = Cutter()
    try:
        while True:
            msg = await sock.receive()
            if msg.get("type") == "websocket.disconnect":
                break
            if msg.get("bytes"):
                pcm = np.frombuffer(msg["bytes"], np.int16).astype(np.float32) / 32768
                for utt in cutter.feed(pcm):
                    await sock.send_json({"type": "busy"})
                    t0 = time.perf_counter()
                    async with model_lock:
                        text = await asyncio.to_thread(transcribe, utt, lang)
                    ms = int((time.perf_counter() - t0) * 1000)
                    await sock.send_json({"type": "final", "text": text, "ms": ms, "sec": round(len(utt) / RATE, 1)})
            elif msg.get("text"):
                if msg["text"].startswith("lang:"):
                    lang = msg["text"][5:7]
    except WebSocketDisconnect:
        pass


@app.get("/health")
def health():
    return {"ok": model is not None, "model": app.state.model_name, "device": app.state.device}


app.mount("/", StaticFiles(directory=WEB_DIR, html=True), name="web")


def main():
    global model
    here = os.path.dirname(os.path.abspath(__file__))
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default="large-v3-turbo")
    ap.add_argument("--device", default="cuda")
    ap.add_argument("--compute", default=None)
    ap.add_argument("--models", default=os.environ.get("NAZAR_MODELS", os.path.join(here, "..", "..", "stt-data", "models")))
    ap.add_argument("--port", type=int, default=8000)
    a = ap.parse_args()
    compute = a.compute or ("float16" if a.device == "cuda" else "int8")
    t0 = time.perf_counter()
    try:
        model = WhisperModel(a.model, device=a.device, compute_type=compute, download_root=a.models)
        transcribe(np.zeros(RATE, np.float32), "hi")  # warm-up; also proves the GPU libraries load
    except Exception as e:  # no GPU at the venue: fall back to the small CPU model
        print(f"GPU model failed ({e}); falling back to small on CPU")
        a.model, a.device = "small", "cpu"
        model = WhisperModel("small", device="cpu", compute_type="int8", download_root=a.models)
    app.state.model_name, app.state.device = a.model, a.device
    print(f"Loaded {a.model} on {a.device} in {time.perf_counter() - t0:.1f}s. Open http://localhost:{a.port}")
    uvicorn.run(app, host="127.0.0.1", port=a.port, log_level="warning")


if __name__ == "__main__":
    main()
