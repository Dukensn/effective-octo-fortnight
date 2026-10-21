#!/usr/bin/env python3
"""Fits the client's recording of one episode onto the scenes.

  python3 align.py N path/to/videyo-N.m4a

1. cleans the voice (same chain as the Atelye Dijital ad: high-pass, denoise, warmth, presence, gentle compression);
2. splits it on silences >= 1.2 s (the client leaves 2 s between numbered parts);
3. transcribes every piece (Whisper large-v3, Haitian Creole) and matches it to its part of script.py:
   a piece that restarts a part already heard replaces it (a retake), a piece that continues it is appended;
4. writes timing/epN.json (scene durations from the real speech) and assets/audio/voice-epN.wav laid out on the scenes.
Then: python3 build.py N && render && python3 mix.py N
"""
import difflib, json, pathlib, subprocess, sys, wave
import numpy as np
import sherpa_onnx
from engine import norm
from script import EPISODES
from build import INTRO

ROOT = pathlib.Path(__file__).resolve().parent
MODEL = pathlib.Path("/tmp/claude-0/-home-user-effective-octo-fortnight/d62d781f-e26f-5038-b050-f52fe2bc04ea/scratchpad/models/sherpa-onnx-whisper-large-v3")
SR = 48000
CHAIN = ("highpass=f=75,afftdn=nr=12:nf=-45:tn=1,equalizer=f=140:t=q:w=1:g=3.0,"
         "equalizer=f=350:t=q:w=1.2:g=-2,equalizer=f=3500:t=q:w=1.5:g=1.5,"
         "acompressor=threshold=-20dB:ratio=3:attack=8:release=120:makeup=2")
LEAD, TAIL, MIN_SIL = 0.55, 0.85, 1.2


def load(path, chain=None, sr=SR):
    cmd = ["ffmpeg", "-v", "error", "-i", str(path)] + (["-af", chain] if chain else []) + ["-f", "f32le", "-ac", "1", "-ar", str(sr), "-"]
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32).copy()


def pieces(x):
    """speech pieces separated by >= MIN_SIL of silence (threshold relative to the speech level)"""
    hop = int(0.02 * SR)
    db = 20 * np.log10(np.sqrt(np.mean(x[:len(x) // hop * hop].reshape(-1, hop) ** 2, 1)) + 1e-9)
    thr = np.percentile(db, 90) - 30
    on = db > thr
    out, start, quiet = [], None, 0
    for i, v in enumerate(on):
        if v:
            if start is None:
                start = i
            quiet = 0
        elif start is not None:
            quiet += 1
            if quiet * 0.02 >= MIN_SIL:
                out.append((start, i - quiet + 1)); start, quiet = None, 0
    if start is not None:
        out.append((start, len(on) - quiet))
    return [(a * 0.02, b * 0.02) for a, b in out if (b - a) * 0.02 > 0.4]


def transcribe(rec, x):
    s = rec.create_stream(); s.accept_waveform(16000, x); rec.decode_stream(s)
    return s.result.text


def sim(a, b):
    return difflib.SequenceMatcher(None, norm(a).split(), norm(b).split()).ratio()


def main(ep, path):
    title, segs = EPISODES[ep - 1]
    x = load(path, CHAIN)
    x16 = load(path, CHAIN, 16000)
    rec = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=str(MODEL / "large-v3-encoder.int8.onnx"), decoder=str(MODEL / "large-v3-decoder.int8.onnx"),
                                                     tokens=str(MODEL / "large-v3-tokens.txt"), language="ht", task="transcribe")
    parts = {}          # segment index -> list of (a, b) in seconds
    cur = 0
    for a, b in pieces(x):
        txt = transcribe(rec, x16[int(a * 16000):int(b * 16000)])
        # best match among the current part, the next two and the previous one (a retake of the last part)
        cands = [k for k in (cur - 1, cur, cur + 1, cur + 2) if 0 <= k < len(segs)]
        scores = {k: sim(txt, segs[k][2]) for k in cands}
        k = max(scores, key=scores.get)
        head = " ".join(segs[k][2].split()[:max(4, len(txt.split()))])
        restart = sim(txt, head) > 0.45
        if k in parts and restart:
            parts[k] = [(a, b)]                       # a retake: keep the last one
        else:
            parts.setdefault(k, []).append((a, b))    # a new part, or the rest of a part after a long pause
        cur = max(cur, k)
        print(f"  {a:7.2f}-{b:7.2f}  -> {segs[k][0]} ({scores[k]:.2f}{', retake' if k in parts and restart and len(parts[k]) == 1 else ''})  {txt[:70]}")
    missing = [segs[k][0] for k in range(len(segs)) if k not in parts]
    if missing:
        sys.exit(f"parts not found in the recording: {', '.join(missing)} (check the 2 s pauses, or send these parts again)")

    timing, voice, t = {}, [np.zeros(int(INTRO * SR), np.float32)], INTRO
    for k, (sid, _, _) in enumerate(segs):
        clip = np.concatenate([np.concatenate([x[int(a * SR):int(b * SR)], np.zeros(int(0.35 * SR), np.float32)]) for a, b in parts[k]])[:-int(0.35 * SR)]
        f = int(0.01 * SR); clip[:f] *= np.linspace(0, 1, f); clip[-f:] *= np.linspace(1, 0, f)
        sp = len(clip) / SR
        timing[sid] = {"dur": round(LEAD + sp + TAIL, 2), "s0": LEAD, "s1": round(LEAD + sp, 2)}
        scene = np.zeros(int(timing[sid]["dur"] * SR), np.float32); i = int(LEAD * SR); scene[i:i + len(clip)] = clip
        voice.append(scene)
    v = np.concatenate(voice)
    (ROOT / "timing").mkdir(exist_ok=True); (ROOT / "assets" / "audio").mkdir(parents=True, exist_ok=True)
    (ROOT / "timing" / f"ep{ep}.json").write_text(json.dumps(timing, indent=1))
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-c:a", "pcm_s16le",
                    str(ROOT / "assets" / "audio" / f"voice-ep{ep}.wav")], input=np.clip(v, -1, 1).tobytes(), check=True)
    print(f"ep{ep}: {len(segs)} parts aligned, voice {len(v) / SR:.1f} s -> timing/ep{ep}.json, assets/audio/voice-ep{ep}.wav")


if __name__ == "__main__":
    main(int(sys.argv[1]), sys.argv[2])
