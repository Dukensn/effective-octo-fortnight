#!/usr/bin/env python3
"""Clean the raw voice and remove the junk before the montage of build-audio.sh.

Raw voice: assets/audio/voix.mp3 (the user's own recording, Haitian Creole).
REMOVE lists raw ranges taken out (each boundary checked by ear-equivalent: energy dips and a Whisper re-read of the join):
  0.00-4.05    clicks before the first word
  16.06-17.41  mouth noise between "tankou Veo 3." and "Mwen jis ba l vwa a."
  88.51-90.40  repetition: "...gwoup WhatsApp [pou kontinye asiste] ... pou nou kontinye asiste patisipan yo"
  105.02-107.84 false start "Na fè koni," + mouth noise, before "N ap fè nou konnen"
  127.30-end   clicks after the last word
Output: assets/audio/voix-propre.wav (denoised, warmer low end, compressed), the RAW of build-audio.sh.
"""
import subprocess

RAW = "assets/audio/voix.mp3"
OUT = "assets/audio/voix-propre.wav"
REMOVE = [(0.0, 4.05), (16.06, 17.41), (88.51, 90.40), (105.02, 107.84), (127.30, 999.0)]
FADE = 0.005
CHAIN = ("highpass=f=75,afftdn=nr=12:nf=-45:tn=1,equalizer=f=140:t=q:w=1:g=3.5,"
         "equalizer=f=350:t=q:w=1.2:g=-2,equalizer=f=3500:t=q:w=1.5:g=1.5,"
         "acompressor=threshold=-20dB:ratio=3:attack=8:release=120:makeup=2")

dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", RAW],
                           capture_output=True, text=True, check=True).stdout)
keep, t = [], 0.0
for a, b in REMOVE:
    if a > t:
        keep.append((t, min(a, dur)))
    t = b
parts, labels = [], []
for k, (a, b) in enumerate(keep):
    parts.append(f"[c]atrim={a:.3f}:{b:.3f},asetpts=PTS-STARTPTS,afade=t=in:d={FADE},"
                 f"afade=t=out:st={b - a - FADE:.3f}:d={FADE}[k{k}]")
    labels.append(f"[k{k}]")
graph = (f"[0]{CHAIN},asplit={len(keep)}" + "".join(f"[c{k}]" for k in range(len(keep))) + ";" +
         ";".join(p.replace("[c]", f"[c{k}]", 1) for k, p in enumerate(parts)) + ";" +
         "".join(labels) + f"concat=n={len(keep)}:v=0:a=1[out]")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", RAW, "-filter_complex", graph, "-map", "[out]",
                "-ar", "44100", "-ac", "1", OUT], check=True)
print(f"{OUT}: {sum(b - a for a, b in keep):.2f} s kept from {dur:.2f} s")
for a, b in keep:
    print(f"  keep {a:7.2f} - {b:7.2f}")
