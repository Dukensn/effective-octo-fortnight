"""Approximate word timings: spread words over the voiced parts of a segment."""
import wave
import numpy as np

_w = wave.open(__file__.rsplit("/", 1)[0] + "/work/voice16k.wav")
SR = _w.getframerate()
A = np.frombuffer(_w.readframes(_w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
HOP = SR // 100
RMS = np.array([np.sqrt(np.mean(A[i:i + HOP] ** 2)) + 1e-9 for i in range(0, len(A), HOP)])
DB = 20 * np.log10(RMS)


def word_times(t0, t1, words, thr=-38):
    """Map cumulative character weight of words onto cumulative voiced time."""
    i0, i1 = int(t0 * 100), int(t1 * 100)
    voiced = DB[i0:i1] > thr
    # smooth: fill gaps shorter than 80ms
    v = voiced.copy()
    run = 0
    for k in range(len(v)):
        if not voiced[k]:
            run += 1
        else:
            if 0 < run < 8:
                v[k - run:k] = True
            run = 0
    cum = np.cumsum(v)
    tot = max(cum[-1], 1)
    wts = np.array([len(w) + 2 for w in words], float)
    starts = np.concatenate([[0], np.cumsum(wts)[:-1]]) / wts.sum()
    out = []
    for s in starts:
        k = int(np.searchsorted(cum, s * tot + 0.5))
        out.append(t0 + min(k, len(v) - 1) / 100)
    return out
