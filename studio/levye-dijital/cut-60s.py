#!/usr/bin/env python3
"""1-minute WhatsApp status cut of the full film: whole frames only, cuts in voice silences.
Keeps: 01 hook, 03 not-Veo / my voice, 05 (first 2.9 s, "li ba m piblisite m"), 10-11 brand + Facebook Ads,
13 AI agents + WhatsApp automation, 19-24 date, hours, venue, 30 seats, WhatsApp, form + end card.
Video from renders/video.mp4; audio rebuilt: same voice ranges + one continuous funk bed (ducked) + a whoosh per cut."""
import subprocess, numpy as np
from scipy.ndimage import uniform_filter1d
R = [(0.00, 3.20), (9.75, 14.20), (20.30, 23.20), (44.90, 50.95), (56.95, 64.40), (90.40, 124.39)]
SR = 48000
def load(p):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()
# video
parts = "".join(f"[0:v]trim={a}:{b},setpts=PTS-STARTPTS[v{i}];" for i, (a, b) in enumerate(R))
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "renders/video.mp4", "-filter_complex",
                parts + "".join(f"[v{i}]" for i in range(len(R))) + f"concat=n={len(R)}:v=1:a=0[v]",
                "-map", "[v]", "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p", "renders/video-60s.mp4"], check=True)
# audio
voice = load("assets/audio/voix-montage.wav")
F = int(0.01 * SR); segs = []
for a, b in R:
    s = voice[int(a * SR):int(b * SR)].copy(); s[:F] *= np.linspace(0, 1, F)[:, None]; s[-F:] *= np.linspace(1, 0, F)[:, None]; segs.append(s)
v = np.concatenate(segs); N = len(v)
cuts = np.cumsum([len(s) for s in segs])[:-1] / SR
music = load("assets/music/funk.mp3")[int(4.73 * SR):]
reps = int(np.ceil(N / len(music))) + 1
music = np.concatenate([music] * reps)[:N]
n = int(2.5 * SR); music[-n:] *= np.linspace(1, 0, n)[:, None]
env = uniform_filter1d(np.abs(v[:, 0]), int(0.05 * SR)); act = uniform_filter1d(uniform_filter1d((env > 0.012).astype(np.float32), int(0.25 * SR)), int(0.6 * SR))
music *= (10 ** ((-12 * np.clip(act * 1.6, 0, 1)) / 20) * 10 ** (-8 / 20))[:, None]
fx = np.zeros_like(v); wh = load("../.claude/skills/media-use/audio/assets/sfx/whoosh-short.mp3") * 0.3
for c in cuts:
    i = max(0, int((c - 0.15) * SR)); j = min(N, i + len(wh)); fx[i:j] += wh[:j - i]
mix = v + music + fx; mix *= min(1, 0.98 / np.abs(mix).max())
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", "-af",
                "loudnorm=I=-16:TP=-1.5:LRA=11,alimiter=limit=0.79:level=disabled", "-ar", str(SR), "assets/audio/mix-60s.wav"],
               input=mix.astype(np.float32).tobytes(), check=True)
print(f"{N / SR:.2f} s, cuts at", ", ".join(f"{c:.2f}" for c in cuts))
