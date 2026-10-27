"""Summarise results.json: per model, language group and condition.
Usage: python summarize.py results.json [model-key-filter]"""
import json, statistics, sys

res = json.load(open(sys.argv[1], encoding="utf8"))
flt = sys.argv[2] if len(sys.argv) > 2 else ""
print(f"{'model':30} {'group':13} {'cond':6} {'lines':>5} {'med s':>6} {'p90 s':>6} {'max s':>6} {'CER':>6} {'slow>3s':>7}")
for key, r in res.items():
    if flt not in key:
        continue
    for g in ("Hindi", "Hinglish", "English", "Punjabi", "Punjabi-as-hi"):
        for c in ("clean", "phone"):
            rows = [x for x in r["rows"] if x["group"] == g and x["cond"] == c]
            if not rows:
                continue
            t = sorted(x["time"] for x in rows)
            cers = [x["cer"] for x in rows if x["cer"] is not None]
            cer = f"{statistics.mean(cers):.2f}" if cers else "-"
            print(f"{key:30} {g:13} {c:6} {len(rows):5} {t[len(t) // 2]:6.2f} {t[int(len(t) * 0.9)]:6.2f} {t[-1]:6.1f} {cer:>6} {sum(1 for x in t if x > 3):7}")
