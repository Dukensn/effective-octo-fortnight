#!/usr/bin/env python3
"""Short WhatsApp status cut of the full film (a status holds up to 90 s): whole frames only, cuts in voice silences.
Keeps: 01 + 03-05 the hook (Claude, not Veo 3, my voice, the edit, "li ba m piblisite m", the silent gag),
09 the pivot (B only), 10-13 brand, 2 days, Facebook Ads, reach, AI agents, 18 the WhatsApp group, 19-24 date, hours, venue, 30 seats,
WhatsApp, link, end card with the price held 8 s. Leaves out 02 (tools), the diagnosis (06-08), modules 3-5 (14-17).
Video from renders/video[-dat2].mp4; audio: the same ranges cut from mix-final[-dat2].wav + a whoosh per cut.
DAT=A|B python3 cut-kout.py (variant.py): A 83.9 s, B 89.0 s with the pivot (a WhatsApp status holds 90 s)."""
import subprocess, numpy as np
from variant import DAT, SUFFIX, TOTAL
# DAT=B (24 & 31 okt) also keeps 09, the pivot "Ebyen, se yon konpetans" (silence, heartbeat, the drop on the brand)
R = [(0.00, 3.20), (9.75, 25.80), (41.10 if DAT == "B" else 44.90, 64.40), (84.45, TOTAL)]
SR = 48000
def load(p):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()
# video
parts = "".join(f"[0:v]trim={a}:{b},setpts=PTS-STARTPTS[v{i}];" for i, (a, b) in enumerate(R))
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"renders/video{SUFFIX}.mp4", "-filter_complex",
                parts + "".join(f"[v{i}]" for i in range(len(R))) + f"concat=n={len(R)}:v=1:a=0[v]",
                "-map", "[v]", "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p", f"renders/video-kout{SUFFIX}.mp4"], check=True)
# audio: the same ranges of the full mix (voice, music with its drop on the brand, sfx), 40 ms fades + a whoosh per cut
full = load(f"assets/audio/mix-final{SUFFIX}.wav")
F = int(0.04 * SR); segs = []
for a, b in R:
    s = full[int(a * SR):int(b * SR)].copy(); s[:F] *= np.linspace(0, 1, F)[:, None]; s[-F:] *= np.linspace(1, 0, F)[:, None]; segs.append(s)
mix = np.concatenate(segs); N = len(mix)
cuts = np.cumsum([len(s) for s in segs])[:-1] / SR
wh = load("../.claude/skills/media-use/audio/assets/sfx/whoosh-short.mp3") * 0.25
for c in cuts:
    i = max(0, int((c - 0.15) * SR)); j = min(N, i + len(wh)); mix[i:j] += wh[:j - i]
mix *= min(1, 0.98 / np.abs(mix).max())
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", "-af",
                "loudnorm=I=-16:TP=-1.5:LRA=11,alimiter=limit=0.79:level=disabled", "-ar", str(SR), f"assets/audio/mix-kout{SUFFIX}.wav"],
               input=mix.astype(np.float32).tobytes(), check=True)
print(f"{N / SR:.2f} s, cuts at", ", ".join(f"{c:.2f}" for c in cuts))
