#!/usr/bin/env python3
"""Atelye Dijital fix: splice the two new takes into the voice montage.

  1. price take (prix.m4a, "Pou patisipe, w ap peye 95 dola.") inserted at 107.15, between "...n ap dezole pou ou."
     and "Pou rezeve plas ou", as a PRICE_LEN block (speech + breath);
  2. link take (lyen_an.m4a, "atelyedijital.vercel.app") replaces the mispronounced "levyedijital.vercel.app"
     (118.31 -> 120.10 in voix-montage.wav).
New takes go through the same cleaning chain as prep-voice.py and are level-matched to the montage.
Usage: python3 splice-voice.py PRIX.m4a LYEN.m4a  -> assets/audio/voix-montage-atelye.wav (prints the new total)
"""
import subprocess, sys
import numpy as np

SR = 44100
SRC = "assets/audio/voix-montage.wav"
OUT = "assets/audio/voix-montage-atelye.wav"
CHAIN = ("highpass=f=75,afftdn=nr=12:nf=-45:tn=1,equalizer=f=140:t=q:w=1:g=3.5,"
         "equalizer=f=350:t=q:w=1.2:g=-2,equalizer=f=3500:t=q:w=1.5:g=1.5,"
         "acompressor=threshold=-20dB:ratio=3:attack=8:release=120:makeup=2")
INSERT_AT, PRICE_TRIM, PRICE_LEN = 107.15, (0.30, 2.90), 3.00
LINK_OUT, LINK_TRIM = (118.31, 120.10), (0.20, 2.40)


def load(path, chain=None):
    cmd = ["ffmpeg", "-v", "error", "-i", path] + (["-af", chain] if chain else []) + \
          ["-f", "f32le", "-ac", "1", "-ar", str(SR), "-"]
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32).copy()


def cut(x, a, b, fade=0.008):
    y = x[int(a * SR):int(b * SR)].copy(); n = int(fade * SR)
    y[:n] *= np.linspace(0, 1, n); y[-n:] *= np.linspace(1, 0, n)
    return y


def speech_rms(x):
    f = x[:len(x) // 441 * 441].reshape(-1, 441); r = np.sqrt((f ** 2).mean(1))
    return np.sqrt((r[r > 0.02] ** 2).mean())


v = load(SRC)
price, link = load(sys.argv[1], CHAIN), load(sys.argv[2], CHAIN)
ref = speech_rms(v[int(90 * SR):int(118 * SR)])
price *= ref / speech_rms(price); link *= ref / speech_rms(link)

p = cut(price, *PRICE_TRIM); p = np.pad(p, (0, int(PRICE_LEN * SR) - len(p)))
parts = [v[:int(INSERT_AT * SR)], p, v[int(INSERT_AT * SR):int(LINK_OUT[0] * SR)],
         cut(link, *LINK_TRIM), v[int(LINK_OUT[1] * SR):]]
out = np.concatenate(parts)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
                "-c:a", "pcm_s16le", OUT], input=np.clip(out, -1, 1).astype(np.float32).tobytes(), check=True)
print(OUT, "total", round(len(out) / SR, 3), "link shift", round((LINK_TRIM[1] - LINK_TRIM[0]) - (LINK_OUT[1] - LINK_OUT[0]), 3))
