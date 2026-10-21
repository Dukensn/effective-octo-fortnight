#!/usr/bin/env python3
"""Final sound of one episode: voice + lo-fi bed (ducked under the voice) + a soft whoosh on every scene change.

  python3 mix.py N   -> assets/audio/mix-epN.wav (-16 LUFS); without assets/audio/voice-epN.wav: music only (preview)
"""
import json, pathlib, subprocess, sys
import numpy as np
from scipy.ndimage import uniform_filter1d

ROOT = pathlib.Path(__file__).resolve().parent
SR = 48000
SFX = ROOT.parent / ".claude" / "skills" / "media-use" / "audio" / "assets" / "sfx"


def load(path, ch=2):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-f", "f32le", "-ac", str(ch), "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, ch).copy()


def main(ep):
    sc = json.loads((ROOT / "timing" / f"ep{ep}.scenes.json").read_text())
    N = int(sc["total"] * SR)
    vf = ROOT / "assets" / "audio" / f"voice-ep{ep}.wav"
    voice = load(vf)[:N] if vf.exists() else np.zeros((N, 2), np.float32)
    voice = np.pad(voice, ((0, N - len(voice)), (0, 0)))
    m = load(ROOT / "assets" / "music" / "lofi-atelye.wav")
    music = np.concatenate([m] * (N // len(m) + 1))[:N]
    # ducking: -13 dB under speech, slow release so the bed does not pump between words
    env = uniform_filter1d(np.abs(voice[:, 0]), int(0.05 * SR))
    act = uniform_filter1d(uniform_filter1d((env > 0.01).astype(np.float32), int(0.3 * SR)), int(0.9 * SR))
    music *= (10 ** ((-13 * np.clip(act * 1.5, 0, 1) - 9) / 20))[:, None]
    f = int(1.0 * SR); music[:f] *= np.linspace(0, 1, f)[:, None]
    f = int(3.0 * SR); music[-f:] *= np.linspace(1, 0, f)[:, None]
    fx = np.zeros_like(music)
    wh = load(SFX / "whoosh-short.mp3") * 0.18
    for sid, a, d in sc["scenes"][1:]:
        i = max(0, int((a - 0.18) * SR)); j = min(N, i + len(wh)); fx[i:j] += wh[:j - i]
    mix = voice + music + fx
    mix *= min(1, 0.95 / max(1e-6, np.abs(mix).max()))
    out = ROOT / "assets" / "audio" / f"mix-ep{ep}.wav"; out.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", "-af",
                    "loudnorm=I=-16:TP=-1.5:LRA=11,alimiter=limit=0.84:level=disabled", "-ar", str(SR), str(out)],
                   input=mix.astype(np.float32).tobytes(), check=True)
    print(out.name, f"{N / SR:.1f} s", "(voice)" if vf.exists() else "(music only: preview)")


if __name__ == "__main__":
    main(int(sys.argv[1]))
