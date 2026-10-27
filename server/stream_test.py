"""Streams WAV files to the speech server in real time, as the browser would, and prints the text.

Usage: python server/stream_test.py file1.wav [file2.wav ...] [--lang hi] [--fast]
"""
import argparse
import asyncio
import json
import wave

import numpy as np
import websockets


async def main(files, lang, fast):
    async with websockets.connect(f"ws://localhost:8000/ws?lang={lang}") as ws:
        async def reader():
            async for msg in ws:
                m = json.loads(msg)
                if m["type"] == "final":
                    print(f"[{m['sec']}s audio, {m['ms']} ms] {m['text']}", flush=True)
        task = asyncio.create_task(reader())
        chunk = 4096
        for f in files:
            with wave.open(f) as w:
                assert w.getframerate() == 16000 and w.getnchannels() == 1, "need 16 kHz mono"
                pcm = np.frombuffer(w.readframes(w.getnframes()), np.int16)
            pcm = np.concatenate([pcm, np.zeros(16000, np.int16)])  # 1 s pause between lines
            for i in range(0, len(pcm), chunk):
                await ws.send(pcm[i:i + chunk].tobytes())
                await asyncio.sleep(0 if fast else chunk / 16000)
        await asyncio.sleep(6)
        task.cancel()


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("files", nargs="+")
    ap.add_argument("--lang", default="hi")
    ap.add_argument("--fast", action="store_true")
    a = ap.parse_args()
    asyncio.run(main(a.files, a.lang, a.fast))
