#!/usr/bin/env python3
"""Atelye Dijital VIP cards (Platinum 50 %, Bronze 30 %, Gold 100 %): front + back, credit-card size 85.6 x 54 mm.

Outputs (out/):
  kat-vip-<tier>-enprime.pdf   2 pages (front, back), 91.6 x 60 mm = card + 3 mm bleed on every side, for the printer
  kat-vip-<tier>-devan.png / -dèyè.png   the card alone at 300 dpi (1011 x 638 px), rounded corners, for sending
  kat-vip-<tier>-telefon.png   front and back on one image, to send on WhatsApp
  kat-vip-tout.png             the three cards side by side (overview)
Usage: python3 build.py
"""
import pathlib
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE / "out"; OUT.mkdir(exist_ok=True)
CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
LOGO = (HERE / "logo-atelye.svg").read_text()

TIERS = [  # name, discount, metal colour, light metal, dark ground
    ("Platinum", 50, "#C9CED4", "#EEF1F4", "#16181B"),
    ("Bronze", 30, "#C08457", "#E7BE9C", "#17120F"),
    ("Gold", 100, "#CDA552", "#F0D99A", "#14120D"),
]
SIGNERS = ["Felemps Cimilien", "Duke Mathieu"]

BASE = """
@font-face { font-family: "Inter"; src: url("../fonts/Inter-Regular.otf"); font-weight: 400; }
@font-face { font-family: "Inter"; src: url("../fonts/Inter-Medium.otf"); font-weight: 500; }
@font-face { font-family: "Inter"; src: url("../fonts/Inter-SemiBold.otf"); font-weight: 600; }
@font-face { font-family: "Inter"; src: url("../fonts/Inter-Bold.otf"); font-weight: 700; }
@font-face { font-family: "Inter"; src: url("../fonts/Inter-ExtraBold.otf"); font-weight: 800; }
@font-face { font-family: "InterD"; src: url("../fonts/InterDisplay-Black.otf"); font-weight: 900; }
@page { size: 91.6mm 60mm; margin: 0; }
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 91.6mm; height: 60mm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.sheet { position: relative; width: 91.6mm; height: 60mm; overflow: hidden; page-break-after: always; }
.card { position: absolute; left: 3mm; top: 3mm; width: 85.6mm; height: 54mm; }   /* the trim box */
body { font-family: "Inter"; }
.png .sheet { background: transparent !important; } .png .card { border-radius: 3.2mm; overflow: hidden; }
.png .back .card { box-shadow: inset 0 0 0 .15mm rgba(27,26,24,.12); }
"""

FRONT = """
<div class="sheet front"><div class="card">
  <div class="frame"></div>
  <div class="mark">{logo_big}</div>
  <div class="brand"><span class="lg">{logo}</span>ATELYE DIJITAL</div>
  <div class="vip">KAT VIP</div>
  <div class="tier">{name}</div>
  <div class="rule"></div>
  <div class="deal"><div class="pct">{pct}<span>%</span></div><div class="off">RABÈ</div></div>
  <div class="tag">Fòmasyon · Pratik · Pwojè</div>
</div></div>"""

FRONT_CSS = """
.front, .front .card { background: radial-gradient(120% 140% at 100% 0%, {glow} 0%, {ground} 55%), {ground}; color: #F3EFE8; }
.front .frame { position: absolute; inset: 2.2mm; border: 0.18mm solid {metal}; border-radius: 2.2mm; opacity: .45; }
.front .mark { position: absolute; right: -6mm; bottom: -9mm; width: 48mm; height: 48mm; opacity: .07; }
.front .mark svg { width: 100%; height: 100%; }
.front .mark svg rect:first-child { fill: none; }
.front .mark svg path { stroke: {metal}; }
.front .mark svg rect:last-child { fill: {metal}; }
.front .brand { position: absolute; left: 5.2mm; top: 5.2mm; display: flex; align-items: center; gap: 1.6mm;
  font: 700 2.25mm/1 "Inter"; letter-spacing: .5mm; color: #F3EFE8; }
.front .brand .lg svg { display: block; width: 5.6mm; height: 5.6mm; }
.front .brand .lg svg rect:first-child { fill: #F3EFE8; }
.front .brand .lg svg path { stroke: {ground}; }
.front .vip { position: absolute; right: 5.2mm; top: 6.3mm; font: 600 1.9mm/1 "Inter"; letter-spacing: .7mm; color: {metal}; }
.front .tier { position: absolute; left: 5mm; top: 15.5mm; font: 900 9.4mm/1 "InterD"; letter-spacing: -.15mm; color: {metal}; }
.front .rule { position: absolute; left: 5.2mm; top: 27.6mm; width: 12mm; height: .35mm; background: {metal}; opacity: .8; }
.front .deal { position: absolute; left: 4.6mm; bottom: 4.9mm; display: flex; align-items: baseline; gap: 2mm; }
.front .pct { font: 900 15.5mm/0.74 "InterD"; letter-spacing: -.5mm; color: #F3EFE8; white-space: nowrap; }
.front .pct span { font-size: 8mm; margin-left: .5mm; color: {metal}; }
.front .off { font: 800 3mm/1 "Inter"; letter-spacing: .8mm; color: {metal}; }
.front .tag { position: absolute; left: 5.2mm; top: 29.6mm; font: 500 1.75mm/1 "Inter"; letter-spacing: .15mm; color: rgba(243,239,232,.62); }
"""

BACK = """
<div class="sheet back"><div class="card">
  <div class="band"></div>
  <div class="brand"><span class="lg">{logo}</span>ATELYE DIJITAL</div>
  <div class="chip">VIP {name_up} · {pct}% RABÈ</div>
  <p class="txt">Kat pèsonèl. Li bay moun ki non l ekri sou li a dwa patisipe nan fòmasyon Atelye Dijital la
    ak <b>{pct}% rabè</b>. Prezante l lè w ap enskri.</p>
  <div class="field f1"><span>Non</span><i></i></div>
  <div class="field f2"><span>Nimewo</span><i></i></div>
  <div class="sig-lab">Siyati otorize</div>
  <div class="sig s1"><i></i><b>{s1}</b><span>Fòmatè</span></div>
  <div class="sig s2"><i></i><b>{s2}</b><span>Fòmatè</span></div>
  <div class="foot">atelyedijital.vercel.app · WhatsApp 31 43 3938</div>
</div></div>"""

BACK_CSS = """
.back, .back .card { background: #F7F5F0; color: #1B1A18; }
.back .band { position: absolute; left: 0; top: 0; width: 85.6mm; height: 1.4mm; background: linear-gradient(90deg, {metal}, {metal_light}, {metal}); }
.back .brand { position: absolute; left: 5.2mm; top: 4.4mm; display: flex; align-items: center; gap: 1.4mm; font: 700 2mm/1 "Inter"; letter-spacing: .45mm; }
.back .brand .lg svg { display: block; width: 4.6mm; height: 4.6mm; }
.back .chip { position: absolute; right: 5.2mm; top: 4.6mm; height: 4.2mm; padding: 0 2mm; border-radius: 2.1mm; background: {ground};
  color: {metal}; font: 700 1.7mm/4.2mm "Inter"; letter-spacing: .3mm; }
.back .txt { position: absolute; left: 5.2mm; right: 5.2mm; top: 11.2mm; font: 400 2mm/1.42 "Inter"; color: #3D3A35; }
.back .txt b { font-weight: 700; color: #1B1A18; }
.back .field { position: absolute; left: 5.2mm; right: 5.2mm; display: flex; align-items: flex-end; gap: 2mm; height: 5mm; }
.back .field span { font: 700 1.7mm/1 "Inter"; letter-spacing: .3mm; text-transform: uppercase; color: #5A554E; width: 11mm; flex: none; padding-bottom: .4mm; }
.back .field i { flex: 1; border-bottom: .2mm solid #8C877F; height: 100%; }
.back .f1 { top: 19.6mm; } .back .f2 { top: 26.2mm; }
.back .sig-lab { position: absolute; left: 5.2mm; top: 34.6mm; font: 600 1.45mm/1 "Inter"; letter-spacing: .35mm; text-transform: uppercase; color: #8C877F; }
.back .sig { position: absolute; top: 37.6mm; width: 34mm; text-align: center; }
.back .sig i { display: block; height: 5.4mm; border-bottom: .2mm solid #1B1A18; }
.back .sig b { display: block; margin-top: .9mm; font: 700 1.85mm/1 "Inter"; color: #1B1A18; }
.back .sig span { display: block; margin-top: .5mm; font: 500 1.4mm/1 "Inter"; color: #77726B; }
.back .s1 { left: 5.2mm; } .back .s2 { right: 5.2mm; }
.back .foot { position: absolute; left: 0; right: 0; bottom: 2.6mm; text-align: center; font: 500 1.4mm/1 "Inter"; letter-spacing: .15mm; color: #8C877F; }
"""


def fill(css, **k):
    for a, b in k.items():
        css = css.replace("{" + a + "}", str(b))
    return css


def page(name, pct, metal, light, ground):
    k = dict(metal=metal, metal_light=light, ground=ground, glow=ground if name == "Platinum" else ground,
             off_left=5.2 + (27 if pct == 100 else 18.6))
    k["glow"] = {"Platinum": "#2A2E33", "Bronze": "#2E2219", "Gold": "#2E2717"}[name]
    css = BASE + fill(FRONT_CSS, **k) + fill(BACK_CSS, **k)
    body = fill(FRONT, logo=LOGO, logo_big=LOGO, name=name.upper(), pct=pct) + \
        fill(BACK, logo=LOGO, name_up=name.upper(), pct=pct, s1=SIGNERS[0], s2=SIGNERS[1])
    return f'<!doctype html><html><head><meta charset="utf-8"><style>{css}</style></head><body>{body}</body></html>'


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME)
    pg = b.new_page(device_scale_factor=300 / 96, viewport={"width": 400, "height": 520})
    shots = []
    for name, pct, metal, light, ground in TIERS:
        slug = name.lower()
        html = OUT / f".kat-vip-{slug}.html"
        html.write_text(page(name, pct, metal, light, ground))
        pg.goto(html.as_uri()); pg.wait_for_timeout(300)
        pg.pdf(path=str(OUT / f"kat-vip-{slug}-enprime.pdf"), width="91.6mm", height="60mm", print_background=True)
        pg.evaluate("document.body.classList.add('png')")
        sides = []
        for i, side in enumerate(["devan", "deye"]):
            f = OUT / f"kat-vip-{slug}-{side}.png"
            pg.locator(".card").nth(i).screenshot(path=str(f), omit_background=True)
            sides.append(f)
        shots.append(sides)
    b.close()

# WhatsApp images (front over back on a light ground) and the overview, assembled with ffmpeg
import subprocess
for (name, *_), (fr, bk) in zip(TIERS, shots):
    slug = name.lower()
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(fr), "-i", str(bk), "-filter_complex",
                    "color=c=0xEFECE6:s=1131x1436[bg];[bg][0]overlay=60:60[a];[a][1]overlay=60:738",
                    "-frames:v", "1", str(OUT / f"kat-vip-{slug}-telefon.png")], check=True)
ins = sum([["-i", str(fr), "-i", str(bk)] for fr, bk in shots], [])
fc = ("color=c=0xEFECE6:s=3273x1436[bg];" + "".join(
      f"[{'bg' if i == 0 else f'o{i - 1}'}][{i}]overlay={60 + (i // 2) * 1071}:{60 + (i % 2) * 678}[o{i}];" for i in range(6)))[:-5]
subprocess.run(["ffmpeg", "-v", "error", "-y", *ins, "-filter_complex", fc, "-frames:v", "1", str(OUT / "kat-vip-tout.png")], check=True)
print("ok:", ", ".join(sorted(x.name for x in OUT.iterdir())))
