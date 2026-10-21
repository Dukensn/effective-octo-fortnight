#!/usr/bin/env python3
"""Original background music for the course (no third-party rights): a calm lo-fi bed, 80 BPM, in C major.

Progression (one chord per bar): Dm9 - G13 - Cmaj9 - Am9, electric piano + soft pad + round bass + light drums
(kick, rim, hats) and a faint vinyl noise. 96 bars = 4 min 48 s, built so that its end joins its start (loopable).
Every 16 bars the drums drop out for one bar, so the bed breathes. Mixed low: it sits under a voice.
Usage: python3 make_music.py -> assets/music/lofi-atelye.wav (48 kHz stereo)
"""
import pathlib, subprocess
import numpy as np
from scipy.signal import butter, sosfilt

SR, BPM, BARS = 48000, 80, 96
BEAT = 60 / BPM
BAR = 4 * BEAT
N = int(BARS * BAR * SR)
rng = np.random.default_rng(11)
L = np.zeros(N); R = np.zeros(N)


def midi(m):
    return 440 * 2 ** ((m - 69) / 12)


def add(sig, t0, pan=0.0, gain=1.0):
    i = int(t0 * SR); j = min(N, i + len(sig)); s = sig[:j - i] * gain
    L[i:j] += s * np.sqrt((1 - pan) / 2); R[i:j] += s * np.sqrt((1 + pan) / 2)


def epiano(f, dur):
    t = np.arange(int(dur * SR)) / SR
    env = np.exp(-t * 2.2) * (1 - np.exp(-t * 300))
    mod = 1.6 * np.exp(-t * 5) * np.sin(2 * np.pi * f * 2 * t)
    trem = 1 + 0.08 * np.sin(2 * np.pi * 4.5 * t)
    return np.sin(2 * np.pi * f * t + mod) * env * trem


def pad(fs, dur):
    t = np.arange(int(dur * SR)) / SR
    s = sum(np.sin(2 * np.pi * f * d * t) for f in fs for d in (0.997, 1.003))
    env = np.minimum(1, t / 0.9) * np.minimum(1, (dur - t) / 0.9)
    return sosfilt(butter(2, 1400, "low", fs=SR, output="sos"), s) * env


def bass(f, dur):
    t = np.arange(int(dur * SR)) / SR
    return (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t)) * np.exp(-t * 1.6) * (1 - np.exp(-t * 200))


def kick():
    t = np.arange(int(0.35 * SR)) / SR
    f = 48 + 70 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)


def noise_hit(dur, lo, hi, decay):
    t = np.arange(int(dur * SR)) / SR
    n = sosfilt(butter(2, [lo, hi], "band", fs=SR, output="sos"), rng.standard_normal(len(t)))
    return n * np.exp(-t * decay)


def bell(f, dur):
    t = np.arange(int(dur * SR)) / SR
    return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 3.01 * f * t) * np.exp(-t * 6)) * np.exp(-t * 2.8) * (1 - np.exp(-t * 400))


MOTIFS = [[76, 79, 81, 79], [74, 76, 79, 76], [72, 74, 76, 79], [81, 79, 76, 74]]   # C-major pentatonic
CHORDS = [  # root (bass), voicing (EP)
    (38, [53, 57, 60, 64]),      # Dm9:   D | F A C E
    (43, [53, 57, 59, 64]),      # G13:   G | F A B E
    (36, [52, 55, 59, 62]),      # Cmaj9: C | E G B D
    (45, [55, 59, 60, 64]),      # Am9:   A | G B C E
]
K, RIM, HAT = kick(), noise_hit(0.12, 900, 4000, 40), noise_hit(0.05, 6000, 14000, 90)
for b in range(BARS):
    t0 = b * BAR
    root, voicing = CHORDS[b % 4]
    add(pad([midi(m) for m in voicing], BAR + 0.4), t0, 0, 0.035)
    # electric piano: chord on beat 1, a softer echo of the top notes on the "and" of 2
    for k, m in enumerate(voicing):
        add(epiano(midi(m + 12), BAR), t0 + k * 0.012, -0.3 + 0.2 * k, 0.06)
    for k, m in enumerate(voicing[2:]):
        add(epiano(midi(m + 12), BAR / 2), t0 + 1.5 * BEAT + k * 0.01, 0.25, 0.035)
    add(bass(midi(root), 1.4 * BEAT), t0, 0, 0.13)
    add(bass(midi(root), 0.9 * BEAT), t0 + 2.5 * BEAT, 0, 0.09)
    if b % 2 == 1:            # a small bell motif in the upper register, every other bar
        for k, m in enumerate(MOTIFS[(b // 2) % len(MOTIFS)]):
            add(bell(midi(m), 1.6), t0 + k * BEAT * 0.75, 0.15 - 0.1 * k, 0.03)
    if b % 16 == 15:          # one bar without drums every 16 bars
        continue
    add(K, t0, 0, 0.17); add(K, t0 + 2.5 * BEAT, 0, 0.12)
    add(RIM, t0 + BEAT, 0.1, 0.14); add(RIM, t0 + 3 * BEAT, 0.1, 0.14)
    for h in range(8):
        add(HAT, t0 + h * BEAT / 2 + (0.03 if h % 2 else 0), 0.35, 0.07 if h % 2 else 0.10)   # light swing

# faint vinyl noise
crack = sosfilt(butter(2, [800, 6000], "band", fs=SR, output="sos"), rng.standard_normal(N)) * 0.004
pops = (rng.random(N) < 0.00004) * rng.standard_normal(N) * 0.08
L += crack + pops; R += crack + pops

# gentle bus: low-pass warmth, soft clip, -20 LUFS-ish target before the final mix
st = np.stack([L, R], 1)
st = sosfilt(butter(2, 9000, "low", fs=SR, output="sos"), st, axis=0)
st = np.tanh(st * 1.4) / 1.4
st /= np.abs(st).max() / 0.8
out = pathlib.Path(__file__).resolve().parent / "assets" / "music"; out.mkdir(parents=True, exist_ok=True)
tmp = out / "_raw.wav"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f64le", "-ar", str(SR), "-ac", "2", "-i", "-", "-c:a", "pcm_s16le", str(tmp)],
               input=st.astype(np.float64).tobytes(), check=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(tmp), "-af", "loudnorm=I=-20:TP=-2:LRA=7", "-ar", str(SR),
                str(out / "lofi-atelye.wav")], check=True)
tmp.unlink()
print("assets/music/lofi-atelye.wav", round(N / SR, 1), "s")
