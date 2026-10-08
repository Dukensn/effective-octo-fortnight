"""Two cuts of the same film, chosen with the DAT environment variable:

  DAT=A  old date  "Dat la se 17 ak 24 oktob 2026."               (voice-montage take)
  DAT=B  new date  "Dat la se samdi 24 oktob ak 31 oktob 2026 la." (nouvo_dat.m4a take, 1.25 s longer)

Both cuts: corrected link take (lyen_an.m4a, +0.41 s), no spoken price (the price is written on screen for the whole
film, compositions/pri-badge.html). Times below are on the ORIGINAL voix-montage.wav timeline (124.39 s); remap() moves
them onto the cut's timeline. Used by splice-voice.py, storyboard_src.py, mix-final.py and cut-60s.py.
"""
import os

DAT = os.environ.get("DAT", "A").upper()
assert DAT in ("A", "B"), "DAT must be A (old date) or B (new date)"
SUFFIX = "" if DAT == "A" else "-dat2"

DATE_CUT = (90.40, 93.75)          # old date sentence, replaced in B
DATE_TAKE = (0.25, 4.75)           # nouvo_dat.m4a, used in B after 0.10 s of silence
DATE_PAD = 0.10
DS = (DATE_PAD + DATE_TAKE[1] - DATE_TAKE[0]) - (DATE_CUT[1] - DATE_CUT[0]) if DAT == "B" else 0.0   # 1.25 or 0
LINK_CUT = (118.31, 120.10)        # mispronounced "levyedijital.vercel.app"
LINK_TAKE = (0.20, 2.40)           # lyen_an.m4a
LS = (LINK_TAKE[1] - LINK_TAKE[0]) - (LINK_CUT[1] - LINK_CUT[0])                                    # 0.41

F19 = 90.40                        # frame 19 (the dates) start
F24 = 115.70                       # frame 24 (form + end card) start
END_HOLD = 5.40                    # end card held longer: the price stays 8 s on screen
TOTAL = round(124.39 + DS + LS + END_HOLD, 2)

# frame 19, variant B: old local time -> new local time (piecewise linear on the spoken words)
F19_ANCHORS = [(0, 0), (0.25, 0.25), (0.90, 0.70), (1.17, 1.15), (1.56, 2.27), (1.84, 2.46), (2.67, 3.57), (3.40, 4.65), (3.80, 5.05)]


def f19(t):
    if DAT == "A":
        return t
    for (a0, b0), (a1, b1) in zip(F19_ANCHORS, F19_ANCHORS[1:]):
        if t <= a1:
            return b0 + (t - a0) * (b1 - b0) / (a1 - a0)
    return t + DS


def f24(t):
    """frame 24 local time, before -> after the longer link take"""
    if abs(t - 3.20) < 0.05:
        return 2.70                # typing starts with the URL
    if abs(t - 4.70) < 0.05:
        return 4.41                # the pill click
    if t >= 7.4:
        return t + LS + END_HOLD   # iris and its whoosh, after the long hold
    return t + LS if t >= 3.5 else t


def remap(t):
    """original montage time -> time in this cut"""
    if t < F19:
        return t
    if t < F19 + 3.80:
        return F19 + f19(t - F19)
    if t < F24:
        return t + DS
    return F24 + DS + f24(t - F24)
