#!/usr/bin/env python3
"""Atelye Dijital voice: splice the client's corrective takes into the voice montage (see variant.py).

  - link take (lyen_an.m4a, "atelyedijital.vercel.app") replaces the mispronounced "levyedijital.vercel.app";
  - DAT=B only: the new date take (nouvo_dat.m4a) replaces the old date sentence.
New takes go through the same cleaning chain as prep-voice.py and are level-matched to the montage.
Usage: DAT=A|B python3 splice-voice.py LYEN.m4a [NOUVO_DAT.m4a]  -> assets/audio/voix-montage-atelye[-dat2].wav
"""
import subprocess, sys
import numpy as np
from variant import DAT, SUFFIX, DATE_CUT, DATE_TAKE, DATE_PAD, LINK_CUT, LINK_TAKE, TOTAL

SR = 44100
SRC = "assets/audio/voix-montage.wav"
OUT = f"assets/audio/voix-montage-atelye{SUFFIX}.wav"
CHAIN = ("highpass=f=75,afftdn=nr=12:nf=-45:tn=1,equalizer=f=140:t=q:w=1:g=3.5,"
         "equalizer=f=350:t=q:w=1.2:g=-2,equalizer=f=3500:t=q:w=1.5:g=1.5,"
         "acompressor=threshold=-20dB:ratio=3:attack=8:release=120:makeup=2")


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


def at(t):
    return int(t * SR)


v = load(SRC)
ref = speech_rms(v[at(90):at(118)])
link = load(sys.argv[1], CHAIN); link *= ref / speech_rms(link)
parts = []
if DAT == "B":
    date = load(sys.argv[2], CHAIN); date *= ref / speech_rms(date)
    parts += [v[:at(DATE_CUT[0])], np.zeros(at(DATE_PAD), np.float32), cut(date, *DATE_TAKE), v[at(DATE_CUT[1]):at(LINK_CUT[0])]]
else:
    parts += [v[:at(LINK_CUT[0])]]
parts += [cut(link, *LINK_TAKE), v[at(LINK_CUT[1]):]]
out = np.concatenate(parts)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
                "-c:a", "pcm_s16le", OUT], input=np.clip(out, -1, 1).astype(np.float32).tobytes(), check=True)
print(OUT, "total", round(len(out) / SR, 3), "expected", TOTAL)
