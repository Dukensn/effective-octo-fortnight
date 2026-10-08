#!/usr/bin/env python3
"""Atelye Dijital VIP cards: Platinum 100 % (top level), Gold 50 %, Bronze 30 %. Credit-card size 85.6 x 54 mm,
front + back, a serial number on each card (PLT-001, GLD-001, BRZ-001...).

Outputs (out/):
  kat-vip-A4-rekto-veso.pdf     A4 sheets, 10 cards per sheet with crop marks: page 1 fronts, page 2 backs (mirrored
                                for a long-edge duplex flip), one pair of pages per level. Print at 100 % (actual size).
  kat-vip-lis-nimewo-seri.pdf   the register of every serial number, to fill in by hand when a card is given
  elektwonik/<SERIAL>.png       front + back of each card on one image, to send on WhatsApp
  kat-vip-tout.png              overview of the three levels
Usage: python3 build.py   (COUNT cards per level)
"""
import pathlib, shutil, subprocess
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE / "out"
CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
LOGO = (HERE / "logo-atelye.svg").read_text()
COUNT = 10            # cards per level = one A4 sheet each
SIGNERS = ["Felemps Cimilien", "Duke Mathieu"]

TIERS = [  # name, prefix, discount, metal, light metal, ground, glow
    ("Platinum", "PLT", 100, "#C9CED4", "#EEF1F4", "#16181B", "#2A2E33"),
    ("Gold", "GLD", 50, "#CDA552", "#F0D99A", "#14120D", "#2E2717"),
    ("Bronze", "BRZ", 30, "#C08457", "#E7BE9C", "#17120F", "#2E2219"),
]


def warning(pct):
    if pct == 100:
        return "Kontakte nou <b>7 jou anvan</b> fòmasyon an pou konfime w ap la. San konfimasyon, kat la pa valab."
    return (f"Kontakte nou <b>7 jou anvan</b> fòmasyon an pou konfime w ap la, epi peye <b>{100 - pct}% ki rete a "
            f"4 jou anvan</b>. Sinon, kat la pa valab.")


CSS = """
@font-face { font-family: "Inter"; src: url("../fonts/Inter-Regular.otf"); font-weight: 400; }
@font-face { font-family: "Inter"; src: url("../fonts/Inter-Medium.otf"); font-weight: 500; }
@font-face { font-family: "Inter"; src: url("../fonts/Inter-SemiBold.otf"); font-weight: 600; }
@font-face { font-family: "Inter"; src: url("../fonts/Inter-Bold.otf"); font-weight: 700; }
@font-face { font-family: "Inter"; src: url("../fonts/Inter-ExtraBold.otf"); font-weight: 800; }
@font-face { font-family: "InterD"; src: url("../fonts/InterDisplay-Black.otf"); font-weight: 900; }
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; font-family: "Inter"; }
.t-platinum { --metal: #C9CED4; --light: #EEF1F4; --ground: #16181B; --glow: #2A2E33; }
.t-gold     { --metal: #CDA552; --light: #F0D99A; --ground: #14120D; --glow: #2E2717; }
.t-bronze   { --metal: #C08457; --light: #E7BE9C; --ground: #17120F; --glow: #2E2219; }

/* a card = trim box 85.6 x 54 mm; .bleed paints its ground 1.5 mm beyond the trim for the cut */
.card { position: absolute; width: 85.6mm; height: 54mm; }
.card .bleed { position: absolute; inset: -1.5mm; }
.front .bleed { background: radial-gradient(120% 140% at 100% 0%, var(--glow) 0%, var(--ground) 55%), var(--ground); }
.back .bleed { background: #F7F5F0; }

.front { color: #F3EFE8; }
.front .frame { position: absolute; inset: 2.2mm; border: .18mm solid var(--metal); border-radius: 2.2mm; opacity: .45; }
.front .markc { position: absolute; inset: -1.5mm; overflow: hidden; }   /* keeps the big A inside the bleed */
.front .mark { position: absolute; right: -4.5mm; bottom: -7.5mm; width: 48mm; height: 48mm; opacity: .07; }
.front .mark svg { width: 100%; height: 100%; }
.front .mark svg rect:first-child { fill: none; }
.front .mark svg path { stroke: var(--metal); }
.front .mark svg rect:last-child { fill: var(--metal); }
.front .brand { position: absolute; left: 5.2mm; top: 5.2mm; display: flex; align-items: center; gap: 1.6mm; font: 700 2.25mm/1 "Inter"; letter-spacing: .5mm; }
.front .brand svg { display: block; width: 5.6mm; height: 5.6mm; }
.front .brand svg rect:first-child { fill: #F3EFE8; }
.front .brand svg path { stroke: var(--ground); }
.front .vip { position: absolute; right: 5.2mm; top: 6.3mm; font: 600 1.9mm/1 "Inter"; letter-spacing: .7mm; color: var(--metal); }
.front .tier { position: absolute; left: 5mm; top: 15.5mm; font: 900 9.4mm/1 "InterD"; letter-spacing: -.15mm; color: var(--metal); }
.front .rule { position: absolute; left: 5.2mm; top: 27.6mm; width: 12mm; height: .35mm; background: var(--metal); opacity: .8; }
.front .tag { position: absolute; left: 5.2mm; top: 29.6mm; font: 500 1.75mm/1 "Inter"; letter-spacing: .15mm; color: rgba(243,239,232,.62); }
.front .deal { position: absolute; left: 4.6mm; bottom: 4.9mm; display: flex; align-items: baseline; gap: 2mm; }
.front .pct { font: 900 15.5mm/.74 "InterD"; letter-spacing: -.5mm; white-space: nowrap; }
.front .pct span { font-size: 8mm; margin-left: .5mm; color: var(--metal); }
.front .off { font: 800 3mm/1 "Inter"; letter-spacing: .8mm; color: var(--metal); }
.front .serial { position: absolute; right: 5.2mm; bottom: 5.2mm; font: 600 1.8mm/1 "Inter"; letter-spacing: .35mm; color: rgba(243,239,232,.7);
  font-variant-numeric: tabular-nums; }
.front .serial b { color: var(--metal); font-weight: 700; }

.back { color: #1B1A18; }
.back .band { position: absolute; left: -1.5mm; right: -1.5mm; top: -1.5mm; height: 2.9mm; background: linear-gradient(90deg, var(--metal), var(--light), var(--metal)); }
.back .brand { position: absolute; left: 5.2mm; top: 4.3mm; display: flex; align-items: center; gap: 1.4mm; font: 700 2mm/1 "Inter"; letter-spacing: .45mm; }
.back .brand svg { display: block; width: 4.6mm; height: 4.6mm; }
.back .chip { position: absolute; right: 5.2mm; top: 4.5mm; height: 4.2mm; padding: 0 2mm; border-radius: 2.1mm; background: var(--ground);
  color: var(--metal); font: 700 1.7mm/4.2mm "Inter"; letter-spacing: .3mm; white-space: nowrap; }
.back .txt { position: absolute; left: 5.2mm; right: 5.2mm; top: 10.3mm; font: 400 1.85mm/1.4 "Inter"; color: #3D3A35; }
.back .txt b { font-weight: 700; color: #1B1A18; }
.back .warn { position: absolute; left: 5.2mm; right: 5.2mm; top: 16.3mm; padding: .9mm 1.6mm .9mm 2.4mm; border-radius: 1.2mm;
  background: #ECE7DE; font: 400 1.55mm/1.38 "Inter"; color: #3D3A35; }
.back .warn::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: .8mm; border-radius: 1.2mm 0 0 1.2mm; background: var(--metal); }
.back .warn i { font-style: normal; font-weight: 800; letter-spacing: .25mm; color: #1B1A18; margin-right: .8mm; }
.back .warn b { font-weight: 700; color: #1B1A18; }
.back .field { position: absolute; left: 5.2mm; right: 5.2mm; display: flex; align-items: flex-end; gap: 2mm; height: 4.6mm; }
.back .field span { font: 700 1.6mm/1 "Inter"; letter-spacing: .3mm; text-transform: uppercase; color: #5A554E; width: 21mm; flex: none; padding-bottom: .4mm; white-space: nowrap; }
.back .field i { flex: 1; border-bottom: .2mm solid #8C877F; height: 100%; }
.back .f1 { top: 23.4mm; } .back .f2 { top: 28.9mm; }
.back .sig-lab { position: absolute; left: 5.2mm; top: 35.6mm; font: 600 1.4mm/1 "Inter"; letter-spacing: .35mm; text-transform: uppercase; color: #8C877F; }
.back .sig { position: absolute; top: 36.2mm; width: 34mm; text-align: center; }
.back .sig i { display: block; height: 6.2mm; border-bottom: .2mm solid #1B1A18; }
.back .sig b { display: block; margin-top: .8mm; font: 700 1.8mm/1 "Inter"; }
.back .sig span { display: block; margin-top: .45mm; font: 500 1.35mm/1 "Inter"; color: #77726B; }
.back .s1 { left: 5.2mm; } .back .s2 { right: 5.2mm; }
.back .foot { position: absolute; left: 5.2mm; right: 5.2mm; bottom: 2.4mm; display: flex; justify-content: space-between;
  font: 500 1.35mm/1 "Inter"; letter-spacing: .15mm; color: #8C877F; }
.back .foot b { font-weight: 700; color: #1B1A18; letter-spacing: .3mm; }
"""


def front(t, serial, x, y):
    name, pre, pct = t[0], t[1], t[2]
    return f"""<div class="card front t-{name.lower()}" style="left:{x}mm; top:{y}mm"><div class="bleed"></div>
  <div class="frame"></div><div class="markc"><div class="mark">{LOGO}</div></div>
  <div class="brand">{LOGO}ATELYE DIJITAL</div><div class="vip">KAT VIP</div>
  <div class="tier">{name.upper()}</div><div class="rule"></div><div class="tag">Fòmasyon · Pratik · Pwojè</div>
  <div class="deal"><div class="pct">{pct}<span>%</span></div><div class="off">RABÈ</div></div>
  <div class="serial">N° <b>{serial}</b></div></div>"""


def back(t, serial, x, y):
    name, pre, pct = t[0], t[1], t[2]
    return f"""<div class="card back t-{name.lower()}" style="left:{x}mm; top:{y}mm"><div class="bleed"></div><div class="band"></div>
  <div class="brand">{LOGO}ATELYE DIJITAL</div><div class="chip">VIP {name.upper()} · {pct}% RABÈ</div>
  <p class="txt">Kat pèsonèl. Li bay moun ki gen non l ekri sou li a dwa patisipe nan fòmasyon Atelye Dijital la
    ak <b>{pct}% rabè</b>. Prezante l lè w ap enskri.</p>
  <div class="warn"><i>ENPÒTAN</i>{warning(pct)}</div>
  <div class="field f1"><span>Non</span><i></i></div>
  <div class="field f2"><span>Nimewo telefòn</span><i></i></div>
  <div class="sig-lab">Siyati otorize</div>
  <div class="sig s1"><i></i><b>{SIGNERS[0]}</b><span>Fòmatè</span></div>
  <div class="sig s2"><i></i><b>{SIGNERS[1]}</b><span>Fòmatè</span></div>
  <div class="foot"><span>atelyedijital.vercel.app · WhatsApp 31 43 3938</span><span>N° <b>{serial}</b></span></div></div>"""


def serials(t):
    return [f"{t[1]}-{i:03d}" for i in range(1, COUNT + 1)]


# ---- A4 imposition: 2 columns x 5 rows, 8 mm between columns, 3 mm between rows (= the two bleeds) ----
CW, CH, GX, GY = 85.6, 54.0, 8.0, 3.0
X0 = (210 - (2 * CW + GX)) / 2          # 15.4 mm
Y0 = (297 - (5 * CH + 4 * GY)) / 2      # 7.5 mm
COLS = [X0, X0 + CW + GX]
ROWS = [Y0 + r * (CH + GY) for r in range(5)]


def crop_marks():
    m, s = [], "position:absolute;background:#7A766F"
    for x in sorted({c for c in COLS} | {c + CW for c in COLS}):
        m.append(f'<div style="{s};left:{x - .1}mm;top:1mm;width:.2mm;height:{Y0 - 2.5}mm"></div>')
        m.append(f'<div style="{s};left:{x - .1}mm;bottom:1mm;width:.2mm;height:{Y0 - 2.5}mm"></div>')
    for y in sorted({r for r in ROWS} | {r + CH for r in ROWS}):
        m.append(f'<div style="{s};top:{y - .1}mm;left:2mm;height:.2mm;width:{X0 - 3.5}mm"></div>')
        m.append(f'<div style="{s};top:{y - .1}mm;right:2mm;height:.2mm;width:{X0 - 3.5}mm"></div>')
    return "".join(m)


def a4_doc():
    pages = []
    for t in TIERS:
        ss = serials(t)
        for side in ("front", "back"):
            cards = []
            for k, sn in enumerate(ss):
                r, c = divmod(k, 2)
                if side == "back":
                    c = 1 - c          # long-edge flip: the back of a card sits in the mirrored column
                cards.append((front if side == "front" else back)(t, sn, COLS[c], ROWS[r]))
            pages.append(f'<div class="a4">{crop_marks()}{"".join(cards)}</div>')
    css = CSS + "@page { size: 210mm 297mm; margin: 0; } .a4 { position: relative; width: 210mm; height: 297mm; overflow: hidden; page-break-after: always; }"
    return f'<!doctype html><html><head><meta charset="utf-8"><style>{css}</style></head><body>{"".join(pages)}</body></html>'


def register_doc():
    rows = []
    for t in TIERS:
        name, pre, pct = t[0], t[1], t[2]
        pay = "—" if pct == 100 else f"{100 - pct}%"
        body = "".join(f"<tr><td class='sn'>{sn}</td><td></td><td></td><td></td><td class='ck'>☐</td><td class='ck'>{'☐ ' if pct < 100 else ''}{pay}</td><td></td></tr>"
                       for sn in serials(t))
        rows.append(f"""<section class="t-{name.lower()}"><h2><span class="dot"></span>VIP {name.upper()} · {pct}% rabè
          <small>{COUNT} kat · {pre}-001 → {pre}-{COUNT:03d}</small></h2>
          <table><thead><tr><th>N° seri</th><th>Non</th><th>Nimewo telefòn</th><th>Dat ou bay kat la</th><th>Konfime<br>(7 jou anvan)</th>
          <th>Peye<br>(4 jou anvan)</th><th>Remak</th></tr></thead><tbody>{body}</tbody></table></section>""")
    css = CSS + """@page { size: A4; margin: 12mm 12mm 14mm; }
      body { color: #1B1A18; font: 400 3mm/1.3 "Inter"; }
      header { display: flex; align-items: center; gap: 3mm; margin-bottom: 5mm; }
      header svg { width: 11mm; height: 11mm; }
      header h1 { font: 800 6mm/1.1 "Inter"; letter-spacing: -.1mm; }
      header p { font: 400 2.8mm/1.35 "Inter"; color: #5A554E; margin-top: .8mm; }
      section { margin-bottom: 7mm; break-inside: avoid; }
      section:nth-of-type(3) { break-before: page; }   /* 2 levels on page 1, the third on page 2 */
      h2 { display: flex; align-items: center; gap: 2mm; font: 800 3.6mm/1 "Inter"; letter-spacing: .3mm; margin-bottom: 2mm; }
      h2 small { margin-left: auto; font: 500 2.6mm/1 "Inter"; color: #77726B; letter-spacing: 0; }
      .dot { display: inline-block; width: 3.4mm; height: 3.4mm; border-radius: 50%; background: var(--metal); border: .4mm solid var(--ground); flex: none; }
      table { width: 100%; border-collapse: collapse; table-layout: fixed; }
      th { font: 700 2.3mm/1.2 "Inter"; text-transform: uppercase; letter-spacing: .2mm; color: #5A554E; text-align: left;
        padding: 1.6mm 1.4mm; background: #ECE7DE; border-bottom: .3mm solid #1B1A18; }
      td { height: 8.2mm; padding: 0 1.4mm; border-bottom: .2mm solid #CFC9BF; font-size: 2.8mm; }
      td.sn { white-space: nowrap; font-weight: 700; letter-spacing: .3mm; font-variant-numeric: tabular-nums; }
      td.ck { color: #5A554E; font-size: 3mm; }
      col.c1 { width: 21mm } col.c2 { width: 42mm } col.c3 { width: 30mm } col.c4 { width: 24mm } col.c5 { width: 20mm } col.c6 { width: 20mm }"""
    head = f"""<header>{LOGO}<div><h1>Kat VIP · lis nimewo seri</h1>
      <p>Atelye Dijital · Ekri non moun nan ak nimewo telefòn li chak fwa w bay yon kat. Make konfimasyon an (7 jou anvan) ak peman an (4 jou anvan).</p></div></header>"""
    secs = "".join(r.replace("<table>", "<table><colgroup><col class='c1'><col class='c2'><col class='c3'><col class='c4'><col class='c5'><col class='c6'><col></colgroup>") for r in rows)
    return f'<!doctype html><html><head><meta charset="utf-8"><style>{css}</style></head><body>{head}{secs}</body></html>'


def png_doc():
    """every card front and back, stacked, for the electronic images"""
    out = []
    for t in TIERS:
        for sn in serials(t):
            out.append(f'<div class="pair" id="{sn}"><div class="slot">{front(t, sn, 0, 0)}</div><div class="slot">{back(t, sn, 0, 0)}</div></div>')
    css = CSS + """body { background: transparent; } .pair { padding: 6mm; display: flex; flex-direction: column; gap: 5mm; width: 97.6mm; background: #EFECE6; }
      .slot { position: relative; width: 85.6mm; height: 54mm; border-radius: 3.2mm; overflow: hidden; }
      .slot .back { box-shadow: inset 0 0 0 .15mm rgba(27,26,24,.12); }"""
    return f'<!doctype html><html><head><meta charset="utf-8"><style>{css}</style></head><body>{"".join(out)}</body></html>'


if OUT.exists():
    shutil.rmtree(OUT)
(OUT / "elektwonik").mkdir(parents=True)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME)
    pg = b.new_page(device_scale_factor=300 / 96, viewport={"width": 420, "height": 800})
    for fname, doc, pdf in [("a4", a4_doc(), "kat-vip-A4-rekto-veso.pdf"), ("lis", register_doc(), "kat-vip-lis-nimewo-seri.pdf")]:
        h = OUT / f".{fname}.html"; h.write_text(doc)
        pg.goto(h.as_uri()); pg.wait_for_timeout(400)
        if fname == "a4":
            pg.pdf(path=str(OUT / pdf), width="210mm", height="297mm", print_background=True)
        else:
            pg.pdf(path=str(OUT / pdf), format="A4", print_background=True, margin={"top": "12mm", "bottom": "14mm", "left": "12mm", "right": "12mm"})
    h = OUT / ".png.html"; h.write_text(png_doc())
    pg.goto(h.as_uri()); pg.wait_for_timeout(400)
    for t in TIERS:
        for sn in serials(t):
            pg.locator(f"#{sn}").screenshot(path=str(OUT / "elektwonik" / f"{sn}.png"))
    b.close()

# overview: the first card of each level
firsts = [str(OUT / "elektwonik" / f"{serials(t)[0]}.png") for t in TIERS]
subprocess.run(["ffmpeg", "-v", "error", "-y", *sum([["-i", f] for f in firsts], []), "-filter_complex", "[0][1][2]hstack=3",
                "-frames:v", "1", str(OUT / "kat-vip-tout.png")], check=True)
shutil.make_archive(str(OUT / "kat-vip-elektwonik"), "zip", OUT / "elektwonik")
for h in OUT.glob(".*.html"):
    h.unlink()
print("ok:", ", ".join(sorted(x.name for x in OUT.iterdir())))
