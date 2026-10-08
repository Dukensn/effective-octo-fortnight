#!/usr/bin/env python3
"""Synthesised sound effects that carry on a phone speaker (the library impacts are mostly sub-bass):
  heartbeat.wav  "lub-dub": two thumps 0.2 s apart, 50 Hz body + 100-200 Hz harmonics + a soft click on the attack
  hit.wav        a short punchy hit: pitch-dropping 120 -> 50 Hz body, saturated, plus a 4 ms noise transient
Usage: python3 make-sfx.py  -> assets/audio/sfx/*.wav (48 kHz stereo)"""
import subprocess
import numpy as np

SR = 48000
rng = np.random.default_rng(7)   # fixed seed: same file every run


def thump(f0, f1, dur, amp):
    t = np.arange(int(dur * SR)) / SR
    f = f1 + (f0 - f1) * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    env = (1 - np.exp(-t * 900)) * np.exp(-t * 11)
    body = np.sin(ph) + 0.55 * np.sin(2 * ph) + 0.3 * np.sin(3 * ph)          # harmonics a phone can play
    click = rng.standard_normal(len(t)) * np.exp(-t * 900) * 0.25
    return np.tanh(1.6 * (body * env + click)) * amp


def save(name, x):
    x = x / np.abs(x).max() * 0.89
    st = np.stack([x, x], 1).astype(np.float32)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-",
                    "-c:a", "pcm_s16le", f"assets/audio/sfx/{name}.wav"], input=st.tobytes(), check=True)


hb = np.zeros(int(0.9 * SR))
a = thump(95, 48, 0.45, 1.0); hb[:len(a)] += a
b = thump(85, 45, 0.45, 0.72); i = int(0.2 * SR); hb[i:i + len(b)] += b[:len(hb) - i]
save("heartbeat", hb)

t = np.arange(int(0.7 * SR)) / SR
hit = thump(140, 50, 0.7, 1.0)
noise = rng.standard_normal(len(t)) * np.exp(-t * 600)
hit += 0.5 * np.diff(np.concatenate([[0], noise]))       # bright transient (high-passed noise)
save("hit", hit)
print("assets/audio/sfx/heartbeat.wav, hit.wav")
