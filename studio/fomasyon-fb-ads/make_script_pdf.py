#!/usr/bin/env python3
"""Reading script for the client: out/Script-Fomasyon-Facebook-Ads.pdf (A4, large type, numbered parts)."""
import html, pathlib, re
from playwright.sync_api import sync_playwright
from script import EPISODES

HERE = pathlib.Path(__file__).resolve().parent
LOGO = (HERE / "logo-atelye.svg").read_text()


def fmt(t):
    t = html.escape(t)
    return re.sub(r"\b([A-ZÈÒ]{2,}(?: [A-ZÈÒ]{2,})*)\b", r"<b>\1</b>", t)   # words in capitals are stressed


parts = []
for i, (title, segs) in enumerate(EPISODES, 1):
    w = sum(len(s[2].split()) for s in segs)
    blocks = "".join(f'<div class="seg"><div class="n">{sid}</div><p>{fmt(txt)}</p></div>' for sid, _, txt in segs)
    parts.append(f'<section><div class="ep">VIDEYO {i} · ~{round(w / 2.6 / 60 + .4)} minit</div><h2>{html.escape(title)}</h2>'
                 f'<div class="file">Fichye pou voye: <b>videyo-{i}.m4a</b></div>{blocks}</section>')

css = """
@font-face { font-family: Inter; src: url(assets/fonts/Inter-Regular.otf); font-weight: 400; }
@font-face { font-family: Inter; src: url(assets/fonts/Inter-SemiBold.otf); font-weight: 600; }
@font-face { font-family: Inter; src: url(assets/fonts/Inter-Bold.otf); font-weight: 700; }
@font-face { font-family: Inter; src: url(assets/fonts/Inter-ExtraBold.otf); font-weight: 800; }
@page { size: A4; margin: 16mm 18mm 16mm; }
body { font-family: Inter; color: #1B1A18; font-size: 13.5pt; line-height: 1.55; }
header { display: flex; gap: 5mm; align-items: center; margin-bottom: 6mm; }
header svg { width: 16mm; height: 16mm; flex: none; }
h1 { font-size: 22pt; font-weight: 800; line-height: 1.1; }
header p { font-size: 10.5pt; color: #5A554E; margin-top: 1mm; }
.rules { background: #F2EEE7; border-left: 1.5mm solid #D97757; border-radius: 2mm; padding: 4mm 5mm; font-size: 11pt; line-height: 1.5; margin-bottom: 4mm; }
.rules h3 { font-size: 11pt; font-weight: 800; letter-spacing: .3mm; margin-bottom: 1.5mm; }
.rules li { margin-left: 5mm; margin-bottom: .8mm; }
section { break-before: page; }
.ep { font-size: 10pt; font-weight: 700; letter-spacing: .6mm; color: #C4613F; }
h2 { font-size: 20pt; font-weight: 800; line-height: 1.15; margin: 1mm 0 2mm; }
.file { font-size: 10pt; color: #5A554E; margin-bottom: 6mm; }
.seg { display: flex; gap: 5mm; margin-bottom: 6mm; break-inside: avoid; }
.n { flex: none; width: 13mm; height: 9mm; border-radius: 4.5mm; background: #1B1A18; color: #fff; font-size: 10pt; font-weight: 700;
  display: flex; align-items: center; justify-content: center; margin-top: 1mm; }
.seg p { flex: 1; }
.seg b { color: #B5532F; }
"""
rules = """<div class="rules"><h3>KÒMAN POU ANREJISTRE</h3><ul>
<li>Yon fichye pou chak videyo: <b>4 fichye</b> an tout (videyo-1, videyo-2, videyo-3, videyo-4).</li>
<li>Pa li nimewo yo. Ant chak pati nimewote, rete an silans <b>2 segonn</b>. Se silans sa a ki pèmèt mwen koupe ak mete imaj yo nan plas yo.</li>
<li>Si w fè yon erè: kanpe, rete 3 segonn, epi rekòmanse <b>tout pati a</b> depi nan kòmansman. M ap kenbe dènye vèsyon an.</li>
<li>Mo ki ekri an GWO LÈT yo: mete aksan sou yo, yo enpòtan.</li>
<li>Anrejistre nan yon kote trankil (pa vantilatè, pa machin), telefòn nan anviwon yon pye de bouch ou. Pale tankou w ap eksplike yon zanmi, san prese.</li>
<li>Chif yo, li yo jan yo ekri a. Ou ka adapte yon mo si l pa natirèl nan bouch ou, men kenbe chif yo ak tèm yo (CPM, CTR, CPC...).</li>
</ul></div>"""
doc = (f'<!doctype html><html><head><meta charset="utf-8"><style>{css}</style></head><body><header>{LOGO}<div>'
       f'<h1>Fòmasyon Facebook Ads · Script</h1><p>Atelye Dijital · 4 videyo · ~16 minit an tout</p></div></header>'
       f'{rules}{"".join(parts)}</body></html>')
h = HERE / ".script.html"; h.write_text(doc)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome")
    pg = b.new_page(); pg.goto(h.as_uri()); pg.wait_for_timeout(400)
    pg.pdf(path=str(HERE / "out" / "Script-Fomasyon-Facebook-Ads.pdf"), format="A4", print_background=True)
    b.close()
h.unlink()
print("out/Script-Fomasyon-Facebook-Ads.pdf")
