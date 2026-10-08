#!/usr/bin/env python3
"""Final mix: voice montage (Atelye Dijital: price + link takes spliced, see splice-voice.py) + funk music (tension / pivot / drop on the brand / 10-bar loop) + SFX, ducked, -16 LUFS.

Music (user-provided track assets/music/funk.mp3, 111 BPM, bar 2.162 s, main drop at 39.9 s):
  A  film 0.00 -> 43.20 : track 4.73 -> 47.93 (first energy entry at frame 0), low-passed 1.4 kHz, -3 dB (tension)
     riser 40.20 -> 43.20, impact-bass at 43.20, then silence (pivot)
  B  film 44.95 -> end  : track 39.90 (the drop, on "Se sa n ap montre w nan Atelye Dijital") -> 61.51, a 10-bar loop
     repeated on downbeats with 40 ms crossfades, fade out over the end card
Ducking: music gain follows the voice envelope (-12 dB under speech, 0.25 s attack, 0.6 s release).
SFX: names from ../.claude/skills/media-use/audio/assets/sfx/, events in assets/audio/sfx-events.json ([name, t, gain]).
Usage: DAT=A|B python3 mix-final.py  -> assets/audio/mix-final[-dat2].wav (variant.py)
"""
import json, subprocess
from variant import SUFFIX, TOTAL, remap
import numpy as np
from scipy.ndimage import uniform_filter1d
from scipy.signal import butter, sosfilt

SR = 48000
SFXDIR = "../.claude/skills/media-use/audio/assets/sfx"


def load(path, ch=2):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", str(ch), "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, ch).copy()


N = int(TOTAL * SR)
voice = load(f"assets/audio/voix-montage-atelye{SUFFIX}.wav")[:N]
voice = np.pad(voice, ((0, N - len(voice)), (0, 0)))
track = load("assets/music/funk.mp3")


def seg(t0, t1):
    return track[int(t0 * SR):int(t1 * SR)].copy()


def fade(x, fi=0.0, fo=0.0):
    if fi: n = int(fi * SR); x[:n] *= np.linspace(0, 1, n)[:, None]
    if fo: n = int(fo * SR); x[-n:] *= np.linspace(1, 0, n)[:, None]
    return x


music = np.zeros((N, 2), np.float32)
# A: tension
a = seg(4.73, 4.73 + 43.20)
a = sosfilt(butter(2, 1400, "low", fs=SR, output="sos"), a, axis=0).astype(np.float32) * 10 ** (-3 / 20)
a = fade(a, 0.02, 0.03)
music[:len(a)] += a
# B: drop + 10-bar loop
LOOP0, LOOP1, XF = 39.90, 61.51, 0.04
t = 44.95
first = True
while t < TOTAL:
    b = seg(LOOP0 - (0 if first else XF), LOOP1)
    i = int((t - (0 if first else XF)) * SR)
    b = b[:max(0, N - i)]
    if not first and len(b): b = fade(b, XF)
    music[i:i + len(b)] += b
    t += LOOP1 - LOOP0
    first = False
n = int(3.0 * SR); music[N - n:] *= np.linspace(1, 0, n)[:, None]
music[int(43.20 * SR):int(44.95 * SR)] = 0  # pivot silence

# ducking from the voice envelope
env = uniform_filter1d(np.abs(voice[:, 0]), int(0.05 * SR))
act = (env > 0.012).astype(np.float32)
act = uniform_filter1d(act, int(0.25 * SR))
act = uniform_filter1d(act, int(0.6 * SR))
gain = 10 ** ((-12 * np.clip(act * 1.6, 0, 1)) / 20)
music *= (gain * 10 ** (-8 / 20))[:, None]   # base level under the voice

# sound effects
fx = np.zeros((N, 2), np.float32)
try:
    events = json.load(open("assets/audio/sfx-events.json"))
except Exception:
    events = []
cache = {}
for name, t, g in events:
    t = remap(t)   # sfx-events.json is on the original montage timeline
    if name not in cache:
        cache[name] = load(f"{SFXDIR}/{name}.mp3")
    s = cache[name] * float(g)
    if name == "riser":  # crests at its end: cut hard on the pivot
        s = s[:max(0, int((43.20 - t) * SR))].copy()
    if name.startswith("impact"):  # the hit only: 0.5 s then a 0.3 s fade, the pivot stays a silence
        s = s[:int(0.8 * SR)].copy(); k = int(0.3 * SR); s[-k:] *= np.linspace(1, 0, k)[:, None]
    i = int(t * SR); j = min(N, i + len(s))
    if i < N: fx[i:j] += s[:j - i]

fx[int(43.20 * SR) + int(0.8 * SR):int(44.95 * SR)] = 0  # nothing but the hit in the pivot
fx[int(44.20 * SR):int(44.95 * SR)] *= np.linspace(1, 0, int(44.95 * SR) - int(44.20 * SR))[:, None] ** 2  # impact tail dies before the drop
mix = voice * 1.0 + music + fx * 0.6
peak = np.abs(mix).max()
if peak > 0.98: mix *= 0.98 / peak
tmp = "assets/audio/_mix_raw.wav"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-",
                "-c:a", "pcm_s16le", tmp], input=mix.astype(np.float32).tobytes(), check=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-af",
                "loudnorm=I=-16:TP=-1.5:LRA=11,alimiter=limit=0.79:level=disabled", "-ar", str(SR),
                f"assets/audio/mix-final{SUFFIX}.wav"], check=True)
print(f"assets/audio/mix-final{SUFFIX}.wav", round(N / SR, 2), "s,", len(events), "sfx")
