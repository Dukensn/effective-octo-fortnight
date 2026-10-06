"""Assemble edited voice + ducked music + sfx into one stereo wav."""
import json, sys, wave
import numpy as np
from scipy.ndimage import uniform_filter1d

SR = 48000
D = sys.argv[1]
plan = json.load(open(sys.argv[2]))
out = sys.argv[3]


def rd(p):
    w = wave.open(p)
    a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    a = a.reshape(-1, w.getnchannels())
    if a.shape[1] == 1:
        a = np.repeat(a, 2, 1)
    assert w.getframerate() == SR, p
    return a


N = int((plan["total"] + 0.5) * SR)
voice = np.zeros((N, 2), np.float32)
src = rd(D + "/work/voice_clean.wav")
F = int(0.012 * SR)
for a, b, o in plan["edl"]:
    seg = src[int(a * SR):int(b * SR)].copy()
    ramp = np.linspace(0, 1, F)[:, None]
    seg[:F] *= ramp
    seg[-F:] *= ramp[::-1]
    i = int(o * SR)
    voice[i:i + len(seg)] += seg

# ducking envelope from voice energy
e = np.abs(voice[:, 0])
e = uniform_filter1d(e, int(0.25 * SR))
act = (e > 0.01).astype(np.float32)
act = uniform_filter1d(act, int(0.7 * SR))  # smooth attack/release
db_lo, db_hi = -18.5, -10.0
gain_db = db_hi + (db_lo - db_hi) * np.clip(act * 1.5, 0, 1)
music = rd(D + "/sfx/music.wav")[:N]
music = np.pad(music, ((0, N - len(music)), (0, 0)))
music *= (10 ** (gain_db / 20))[:, None]
fo = int(2.5 * SR)
music[-fo:] *= np.linspace(1, 0, fo)[:, None]

fx = np.zeros((N, 2), np.float32)
for name, t, g in plan["sfx"]:
    s = rd(D + f"/sfx/{name}.wav") * 10 ** ((g - 6) / 20)
    i = int(t * SR)
    j = min(N, i + len(s))
    if i < N:
        fx[i:j] += s[:j - i]

mix = voice + music + fx
mix = np.tanh(mix * 1.1) / 1.1
w = wave.open(out, "wb")
w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes())
w.close()
print("ok", N / SR)
