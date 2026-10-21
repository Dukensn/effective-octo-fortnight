#!/usr/bin/env python3
"""Builds one episode of the course as a HyperFrames project: compositions/epN/*.html + index.html.

  python3 build.py N      (timing from timing/epN.json if align.py wrote it, else estimated)
Then: npx hyperframes render --quality high --output renders/epN.mp4 ; python3 mix.py N
"""
import json, sys, pathlib
import engine
from engine import Ctx, wrap, icon, INK, ACC
from script import EPISODES
import scenes_ep1, scenes_ep2, scenes_ep3, scenes_ep4

ROOT = pathlib.Path(__file__).resolve().parent
TEMPLATES = {**scenes_ep1.TEMPLATES, **scenes_ep2.TEMPLATES, **scenes_ep3.TEMPLATES, **scenes_ep4.TEMPLATES}
INTRO, OUTRO = 3.2, 3.0


def card(ep, title, sid, dur, kind):
    """title card (intro) or end card (outro), no voice"""
    c = Ctx(sid, "", dur, 0, 0, ep, title)
    logo = (ROOT / "logo-atelye.svg").read_text()
    if kind == "intro":
        body = (f'<div class="lg">{logo}</div><div class="lab k">Fòmasyon Facebook Ads · Videyo {ep} sou 4</div>'
                f'<div class="h1 t">{title}</div><div class="bar"></div>')
        css = """& .lg { position: absolute; left: 160px; top: 300px; } & .lg svg { width: 110px; height: 110px; }
          & .k { position: absolute; left: 160px; top: 460px; color: #B5532F; } & .t { position: absolute; left: 160px; top: 510px; width: 1500px; font-size: 96px; }
          & .bar { position: absolute; left: 160px; top: 760px; width: 300px; height: 10px; border-radius: 5px; background: #D97757; }"""
        js = 'pop(q(".lg"), .15); up(q(".k"), .35); up(q(".t"), .5); grow(q(".bar"), .8, .8);'
    else:
        nxt = EPISODES[ep][0] if ep < len(EPISODES) else None
        body = (f'<div class="lg">{logo}</div><div class="h1 t">ATELYE <span class="acc">DIJITAL</span></div>'
                + (f'<div class="lab k">Pwochen videyo · {nxt}</div>' if nxt else '<div class="lab k">Fen fòmasyon an · Bòn chans!</div>'))
        css = """& .lg { position: absolute; left: 50%; top: 300px; transform: translateX(-50%); } & .lg svg { width: 130px; height: 130px; }
          & .t { position: absolute; left: 0; right: 0; top: 480px; text-align: center; font-size: 110px; }
          & .k { position: absolute; left: 0; right: 0; top: 640px; text-align: center; color: #B5532F; }"""
        js = 'pop(q(".lg"), .1); up(q(".t"), .3); up(q(".k"), .6);'
    html, sid2 = wrap(c, body, css, js)
    html = html.replace('<div class="top">', '<div class="top" style="display:none">')
    return html, sid2


def build(ep):
    title, segs = EPISODES[ep - 1]
    tf = ROOT / "timing" / f"ep{ep}.json"
    timing = json.loads(tf.read_text()) if tf.exists() else engine.estimate(segs)
    out = ROOT / "compositions" / f"ep{ep}"; out.mkdir(parents=True, exist_ok=True)
    for f in out.glob("*.html"):
        f.unlink()
    scenes, t = [], 0.0
    html, sid = card(ep, title, f"{ep}.0", INTRO, "intro")
    (out / f"{sid}.html").write_text(html); scenes.append((sid, t, INTRO)); t += INTRO
    for seg_id, kind, text in segs:
        tm = timing[seg_id]
        c = Ctx(seg_id, text, tm["dur"], tm["s0"], tm["s1"], ep, title)
        fn = TEMPLATES.get(f"{kind}@{seg_id}") or TEMPLATES[kind]
        body, css, js = fn(c)
        html, sid = wrap(c, body, css, js)
        (out / f"{sid}.html").write_text(html); scenes.append((sid, t, tm["dur"])); t += tm["dur"]
    html, sid = card(ep, title, f"{ep}.99", OUTRO, "outro")
    (out / f"{sid}.html").write_text(html); scenes.append((sid, t, OUTRO)); t += OUTRO
    els = "\n".join(f'      <div id="el-{s}" class="scene" data-composition-id="{s}" data-composition-src="compositions/ep{ep}/{s}.html" '
                    f'data-start="{a:.2f}" data-duration="{d:.2f}" data-track-index="1"></div>' for s, a, d in scenes)
    (ROOT / "index.html").write_text(f"""<!doctype html>
<html lang="ht"><head><meta charset="UTF-8" /><meta name="viewport" content="width=1920, height=1080" />
<script src="assets/vendor/gsap.min.js"></script>
<style>* {{ margin: 0; padding: 0; box-sizing: border-box; }} html, body {{ width: 1920px; height: 1080px; overflow: hidden; background: #000; }}
#root {{ position: relative; width: 1920px; height: 1080px; overflow: hidden; background: #F3F0EA; }} .scene {{ position: absolute; inset: 0; }}</style></head>
<body><div id="root" data-composition-id="main" data-start="0" data-duration="{t:.2f}" data-width="1920" data-height="1080">
{els}
</div><script>window.__timelines = window.__timelines || {{}}; window.__timelines["main"] = gsap.timeline({{ paused: true }});</script></body></html>
""")
    (ROOT / "timing").mkdir(exist_ok=True)
    (ROOT / "timing" / f"ep{ep}.scenes.json").write_text(json.dumps({"total": round(t, 2), "intro": INTRO, "scenes": scenes}, indent=1))
    print(f"ep{ep}: {len(scenes)} scenes, {t:.1f} s ({'voice' if tf.exists() else 'estimated'} timing)")


if __name__ == "__main__":
    build(int(sys.argv[1]))
