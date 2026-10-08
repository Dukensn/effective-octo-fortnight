#!/usr/bin/env python3
"""Writes the DAT=B frames (new date, Saturdays 24 and 31 October 2026) from the DAT=A frames:
  19-dat-la.html      -> 19-dat-la-dat2.html      (new tiles and labels, retimed on the new take with variant.f19)
  24-fomile-fen.html  -> 24-fomile-fen-dat2.html  (end card date)
Edit the A frames, then: python3 make-variants.py
"""
import os, re
os.environ["DAT"] = "B"
from variant import f19, DS

D = "compositions/frames/"

s = open(D + "19-dat-la.html").read()
T0 = 3.80
T1 = round(T0 + DS, 2)
s = s.replace('"19-dat-la"', '"19-dat-la-dat2"')
s = s.replace(f'data-duration="{T0:.2f}"', f'data-duration="{T1:.2f}"').replace(f"T = {T0:.2f}", f"T = {T1:.2f}")
s = s.replace('<span class="f19-num">24</span>', '<span class="f19-num">31</span>').replace('<span class="f19-num">17</span>', '<span class="f19-num">24</span>')
s = s.replace(">Sam 24<", ">Sam 31<").replace(">Sam 17<", ">Sam 24<")
s = s.replace('[["Dat", 0.25], ["la", 0.59], ["se", 0.90], ["17", 1.17, "box"], ["ak", 1.56], ["24", 1.84, "peak"], ["oktòb", 2.13], ["2026.", 2.67]]',
              '[["Dat", 0.25], ["la", 0.47], ["se", 0.70], ["samdi", 0.82], ["24", 1.15, "box"], ["oktòb", 1.78], ["ak", 2.27], ["31", 2.46, "peak"], ["oktòb", 3.09], ["2026", 3.57], ["la.", 4.32]]')
a, b = s.split("var tl = gsap.timeline", 1)
# the month prints with each spoken "oktòb"
b = b.replace('{ opacity: 1, x: 0, filter: "blur(0px)", duration: 0.14, ease: "expo.out" }, 2.11);', '{ opacity: 1, x: 0, filter: "blur(0px)", duration: 0.14, ease: "expo.out" }, @1.76);')
b = b.replace('{ opacity: 1, x: 0, filter: "blur(0px)", duration: 0.14, ease: "expo.out" }, 2.17);', '{ opacity: 1, x: 0, filter: "blur(0px)", duration: 0.14, ease: "expo.out" }, @3.07);')
b = b.replace("duration: 3.14, ease: \"none\", immediateRender: false }, 0.26);", f"duration: {f19(3.40) - 0.26:.2f}, ease: \"none\", immediateRender: false }}, 0.26);")
b = re.sub(r"(\}, )(\d+\.\d+)(\);)", lambda m: f"{m.group(1)}{f19(float(m.group(2))):.2f}{m.group(3)}", b)
b = re.sub(r"(\}, )(\d+\.\d+)( \+ i \*)", lambda m: f"{m.group(1)}{f19(float(m.group(2))):.2f}{m.group(3)}", b)
b = b.replace("@", "").replace("words(S1, 3.50);", f"words(S1, {f19(3.50):.2f});")
open(D + "19-dat-la-dat2.html", "w").write(a + "var tl = gsap.timeline" + b)

s = open(D + "24-fomile-fen.html").read()
s = s.replace('"24-fomile-fen"', '"24-fomile-fen-dat2"').replace("Samdi 17 &amp; 24 oktòb 2026", "Samdi 24 &amp; 31 oktòb 2026")
open(D + "24-fomile-fen-dat2.html", "w").write(s)
print("wrote 19-dat-la-dat2.html (", T1, "s ) and 24-fomile-fen-dat2.html")
