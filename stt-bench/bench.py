"""Benchmark faster-whisper models on the Nazar test audio.

Usage: python bench.py AUDIO_DIR MODELS_DIR OUT_JSON model:device[:compute] ...
  e.g. python bench.py ../stt-data/audio ../stt-data/models out.json small:cuda large-v3-turbo:cuda small:cpu:int8

For every line in AUDIO_DIR/manifest.json and both conditions (clean, phone) it records the
transcript, the wall-clock time to transcribe that line, and the character error rate (CER)
for lines whose reference text is in the same script as Whisper's output (Hindi, Punjabi, English).
Hinglish lines are written in Roman script but Whisper writes Hindi in Devanagari, so CER is skipped there;
the end-to-end detector check (e2e.js) is the real test for them.
"""
import glob, json, os, re, sys, time, unicodedata

# Windows: make the CUDA DLLs that pip installed (nvidia-cublas-cu12, nvidia-cudnn-cu12) findable.
for d in glob.glob(os.path.join(sys.prefix, "Lib", "site-packages", "nvidia", "*", "bin")):
    os.add_dll_directory(d)
    os.environ["PATH"] = d + os.pathsep + os.environ["PATH"]

import jiwer
from faster_whisper import WhisperModel

LANG = {"Hindi": "hi", "Hinglish": "hi", "Punjabi": "pa", "English": "en"}


def norm(s):
    s = unicodedata.normalize("NFC", s.lower())
    s = re.sub(r"[\u093C\u0A3C\u0A71]", "", s)            # nukta, adhak
    s = re.sub(r"[^\w\s]", " ", s)                         # punctuation (। , . ? etc.)
    return re.sub(r"\s+", " ", s).strip()


def main(audio_dir, models_dir, out_json, specs):
    manifest = json.load(open(os.path.join(audio_dir, "manifest.json"), encoding="utf8"))
    results = json.load(open(out_json, encoding="utf8")) if os.path.exists(out_json) else {}
    for spec in specs:
        name, device, *rest = spec.split(":")
        compute = rest[0] if rest else ("float16" if device == "cuda" else "int8")
        key = f"{name}|{device}|{compute}"
        t0 = time.perf_counter()
        model = WhisperModel(name, device=device, compute_type=compute, download_root=models_dir,
                             cpu_threads=8 if device == "cpu" else 0)
        load = time.perf_counter() - t0
        # warm-up, so the first timed line does not include CUDA start-up
        list(model.transcribe(os.path.join(audio_dir, "clean", manifest[0]["file"]), language="hi", beam_size=1)[0])
        rows = []
        for cond in ("clean", "phone"):
            for m in manifest:
                path = os.path.join(audio_dir, cond, m["file"])
                # Punjabi is also tried as Hindi: Whisper's Punjabi is weak, and the Hindi word list may still catch it.
                for group, lang in ([(m["group"], LANG[m["group"]])] + ([("Punjabi-as-hi", "hi")] if m["group"] == "Punjabi" else [])):
                    t = time.perf_counter()
                    # Live use needs speed: greedy decoding, no temperature fallback retries, capped output.
                    segs, info = model.transcribe(path, language=lang, beam_size=1, temperature=0.0,
                                                  condition_on_previous_text=False, vad_filter=False,
                                                  without_timestamps=True, max_new_tokens=160)
                    text = " ".join(s.text.strip() for s in segs).strip()
                    dt = time.perf_counter() - t
                    cer = None
                    if group in ("Hindi", "Punjabi", "English"):
                        ref, hyp = norm(m["text"]), norm(text)
                        cer = round(jiwer.cer(ref, hyp), 3) if ref else None
                    rows.append({"cond": cond, "call": m["call"], "line": m["line"], "group": group,
                                 "seconds": m["seconds"], "time": round(dt, 3), "cer": cer, "text": text})
        results[key] = {"model": name, "device": device, "compute": compute, "load_s": round(load, 1), "rows": rows}
        json.dump(results, open(out_json, "w", encoding="utf8"), ensure_ascii=False, indent=1)
        main_rows = [r for r in rows if r["group"] != "Punjabi-as-hi"]
        audio = sum(r["seconds"] for r in main_rows)
        busy = sum(r["time"] for r in main_rows)
        print(f"{key:32} load {load:5.1f}s  audio {audio:6.0f}s  compute {busy:6.1f}s  RTF {busy / audio:.3f}  "
              f"median/line {sorted(r['time'] for r in main_rows)[len(main_rows) // 2]:.2f}s", flush=True)
        del model


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4:])
