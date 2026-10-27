"""Checks the server's sentence cutter on synthetic audio (no model or GPU needed)."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
import numpy as np
from server import Cutter, RATE

def tone(sec, amp=0.1):
    t = np.arange(int(RATE * sec)) / RATE
    return (amp * np.sin(2 * np.pi * 220 * t)).astype(np.float32)

def silence(sec):
    return np.zeros(int(RATE * sec), np.float32)

c = Cutter()
out = c.feed(np.concatenate([silence(0.5), tone(2), silence(1), tone(1.5), silence(1)]))
assert len(out) == 2, f"expected 2 sentences, got {len(out)}"
assert not Cutter().feed(np.concatenate([tone(0.1), silence(1)])), "a click must not count as speech"
assert len(Cutter().feed(tone(17))) == 2, "long speech is cut every 8 s"
print("PASS")
