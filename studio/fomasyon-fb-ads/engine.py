"""Scene engine for the Facebook Ads course (1920x1080, HyperFrames + GSAP).

Timing: every segment of script.py gets (dur, s0, s1) in timing/epN.json: scene duration, speech start and speech end
(local seconds). Until the client's voice exists they are estimated (2.6 words/s); align.py rewrites them from the
recordings. Inside a scene, `cue("word")` places a beat at the moment that word is spoken, by its position in the text
(proportional to characters inside [s0, s1]); subtitles are timed the same way, phrase by phrase.

A template is a function (ctx) -> (html, css, js). It writes CSS with "&" for the scene root, and JS with q(".cls")
(a query inside the scene) and the helpers of COMMON_JS. Ids never leak: scenes are inlined in one document.
"""
import html as H
import json, pathlib, re, unicodedata

ROOT = pathlib.Path(__file__).resolve().parent
ICONS = ROOT / "icons"
W, Hh = 1920, 1080
WPS = 2.6        # estimated speaking rate, words per second
INK, INK2, MUTE, LINE, PAPER, CARD, ACC, ACCD, ACCP = "#1B1A18", "#5A554E", "#8C877F", "#D9D4CC", "#F3F0EA", "#FFFFFF", "#D97757", "#B5532F", "#F7DCCF"
GOOD, WARN, BAD, FB, WA = "#2F9E6B", "#D9A23A", "#D2503C", "#0866FF", "#25D366"


def icon(name, size=48, color="currentColor", sw=2):
    """inline Lucide icon (ISC) or brand-<name> (Simple Icons, CC0)"""
    s = (ICONS / f"{name}.svg").read_text()
    if name.startswith("brand-"):
        d = re.search(r'd="([^"]+)"', s).group(1)
        return f'<svg viewBox="0 0 24 24" width="{size}" height="{size}"><path fill="{color}" d="{d}"/></svg>'
    inner = s[s.index(">", s.index("<svg")) + 1:s.rindex("</svg>")]
    return (f'<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="{color}" stroke-width="{sw}" '
            f'stroke-linecap="round" stroke-linejoin="round">{inner}</svg>')


def norm(s):
    s = unicodedata.normalize("NFKD", s.lower())
    return "".join(c for c in s if not unicodedata.combining(c))


class Ctx:
    def __init__(self, sid, text, dur, s0, s1, ep, ep_title):
        self.sid, self.text, self.dur, self.s0, self.s1, self.ep, self.ep_title = sid, text, dur, s0, s1, ep, ep_title
        self._n = norm(text)
        self._last = 0

    def cue(self, word, after=None):
        """local time at which `word` is spoken (first occurrence after `after` word if given)"""
        start = 0
        if after:
            start = self._n.find(norm(after))
            start = max(0, start)
        i = self._n.find(norm(word), start)
        if i < 0:
            raise KeyError(f"{self.sid}: cue '{word}' not in text")
        return round(self.s0 + (self.s1 - self.s0) * i / max(1, len(self._n)), 2)

    def at(self, frac):
        return round(self.s0 + (self.s1 - self.s0) * frac, 2)

    def subtitles(self):
        """phrases of <= 9 words, cut at punctuation, each timed by its first character"""
        words = self.text.split()
        chunks, cur = [], []
        for w in words:
            cur.append(w)
            if (w[-1] in ".?!:" and len(cur) >= 3) or (w[-1] == "," and len(cur) >= 6) or len(cur) >= 9:
                chunks.append(cur); cur = []
        if cur:
            if chunks and len(cur) < 3 and len(chunks[-1]) + len(cur) <= 12:
                chunks[-1] += cur          # no one-word subtitle at the end
            else:
                chunks.append(cur)
        out, pos = [], 0
        for c in chunks:
            phrase = " ".join(c)
            i = self.text.find(phrase, pos); pos = i + len(phrase)
            out.append([phrase, round(self.s0 + (self.s1 - self.s0) * i / len(self.text), 2)])
        for k in range(len(out)):
            out[k].append(out[k + 1][1] - 0.14 if k + 1 < len(out) else self.s1 + 0.3)   # gone before the next one comes
        return out


BASE_CSS = """
@font-face { font-family: "Inter"; src: url("assets/fonts/Inter-Regular.otf"); font-weight: 400; font-display: block; }
@font-face { font-family: "Inter"; src: url("assets/fonts/Inter-Medium.otf"); font-weight: 500; font-display: block; }
@font-face { font-family: "Inter"; src: url("assets/fonts/Inter-SemiBold.otf"); font-weight: 600; font-display: block; }
@font-face { font-family: "Inter"; src: url("assets/fonts/Inter-Bold.otf"); font-weight: 700; font-display: block; }
@font-face { font-family: "Inter"; src: url("assets/fonts/Inter-ExtraBold.otf"); font-weight: 800; font-display: block; }
@font-face { font-family: "InterD"; src: url("assets/fonts/InterDisplay-Black.otf"); font-weight: 900; font-display: block; }
& { position: relative; width: 1920px; height: 1080px; overflow: hidden; font-family: "Inter"; color: #1B1A18; -webkit-font-smoothing: antialiased; }
& .bg { position: absolute; inset: -40px; background: radial-gradient(70% 90% at 75% 10%, #FBF9F5 0%, #F3F0EA 60%, #ECE7DF 100%); }
& .dots { position: absolute; inset: -60px; background: radial-gradient(circle, rgba(27,26,24,.07) 1.6px, transparent 2px) 0 0 / 44px 44px; }
& .stage { position: absolute; inset: 0; }
& .top { position: absolute; left: 72px; right: 72px; top: 44px; display: flex; align-items: center; justify-content: space-between; }
& .chip-ep { display: flex; align-items: center; gap: 14px; font: 700 22px/1 "Inter"; letter-spacing: 3px; color: #8C877F; }
& .chip-ep b { color: #fff; background: #1B1A18; border-radius: 18px; padding: 8px 14px; letter-spacing: 2px; font-size: 18px; }
& .brand { display: flex; align-items: center; gap: 12px; font: 800 20px/1 "Inter"; letter-spacing: 4px; color: #5A554E; }
& .brand svg { width: 38px; height: 38px; }
& .sub { position: absolute; left: 200px; right: 200px; bottom: 46px; min-height: 120px; display: flex; align-items: flex-end; justify-content: center; }
& .sub span { position: absolute; bottom: 0; left: 0; right: 0; text-align: center; font: 600 42px/1.3 "Inter"; color: #1B1A18; opacity: 0;
  text-shadow: 0 0 18px #F3F0EA, 0 0 30px #F3F0EA; }
& .h1 { font: 900 84px/1.02 "InterD"; letter-spacing: -2px; }
& .h2 { font: 800 50px/1.1 "Inter"; letter-spacing: -1px; }
& .lab { font: 700 22px/1 "Inter"; letter-spacing: 3px; text-transform: uppercase; color: #8C877F; }
& .card { position: absolute; background: #fff; border-radius: 28px; box-shadow: 0 30px 60px rgba(40,30,20,.10), 0 4px 12px rgba(40,30,20,.06); }
& .acc { color: #D97757; } & .good { color: #2F9E6B; } & .bad { color: #D2503C; }
& .pill { display: inline-flex; align-items: center; gap: 10px; padding: 10px 20px; border-radius: 40px; font: 700 26px/1 "Inter"; }
& .num { font-variant-numeric: tabular-nums; }
"""

COMMON_JS = """
var R = document.getElementById(SID), q = function (s) { return R.querySelector(s); }, qa = function (s) { return Array.prototype.slice.call(R.querySelectorAll(s)); };
var tl = gsap.timeline({ paused: true });
var G = function (i, el) { return el && el.classList && el.classList.contains("gh") ? .14 : 0; };
function pop(s, t, d) { tl.fromTo(s, { opacity: G, scale: 1.25, filter: "blur(10px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: d || 0.35, ease: "expo.out" }, t); }
function up(s, t, d) { tl.fromTo(s, { opacity: G, y: 40 }, { opacity: 1, y: 0, duration: d || 0.45, ease: "expo.out" }, t); }
function fade(s, t, d) { tl.fromTo(s, { opacity: G }, { opacity: 1, duration: d || 0.4, ease: "power2.out" }, t); }
function out(s, t, d) { tl.to(s, { opacity: 0, duration: d || 0.3, ease: "power2.in" }, t); }
function grow(s, t, d, o) { tl.fromTo(s, { scaleX: 0 }, { scaleX: 1, duration: d || 0.6, ease: "expo.out", transformOrigin: o || "0% 50%" }, t); }
function growY(s, t, d) { tl.fromTo(s, { scaleY: 0 }, { scaleY: 1, duration: d || 0.6, ease: "expo.out", transformOrigin: "50% 100%" }, t); }
function pulse(s, t) { tl.to(s, { scale: 1.06, duration: 0.14, ease: "power2.out", yoyo: true, repeat: 1 }, t); }
function count(s, a, b, t, d, fmt) {
  var o = { v: a }, el = typeof s === "string" ? q(s) : s;
  tl.fromTo(o, { v: a }, { v: b, duration: d || 0.9, ease: "power2.out", onUpdate: function () { el.textContent = fmt ? fmt(o.v) : Math.round(o.v).toLocaleString("fr-FR"); } }, t);
}
function draw(s, t, d) { qa(s).forEach(function (p) { var L = p.getTotalLength ? p.getTotalLength() : 1000;
  tl.fromTo(p, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: d || 0.8, ease: "power2.inOut" }, t); }); }
"""


def wrap(ctx, body, css, js):
    sid = "sc" + ctx.sid.replace(".", "_")
    subs = ctx.subtitles()
    sub_html = "".join(f'<span class="s{k}">{H.escape(p)}</span>' for k, (p, a, b) in enumerate(subs))
    sub_js = "".join(f'tl.fromTo(q(".sub .s{k}"), {{opacity:0, y:12}}, {{opacity:1, y:0, duration:.18, ease:"power2.out"}}, {a});'
                     f'tl.to(q(".sub .s{k}"), {{opacity:0, duration:.1}}, {b});' for k, (p, a, b) in enumerate(subs))
    logo = (ROOT / "logo-atelye.svg").read_text()
    all_css = (BASE_CSS + css).replace("&", f"#{sid}")
    top = (f'<div class="top"><div class="chip-ep"><b>VIDEYO {ctx.ep}</b>{H.escape(ctx.ep_title.upper())}</div>'
           f'<div class="brand">{logo}ATELYE DIJITAL</div></div>')
    return f"""<template>
  <style>{all_css}</style>
  <div id="{sid}" data-composition-id="{sid}" data-width="1920" data-height="1080" data-duration="{ctx.dur:.2f}">
    <div class="clip" data-start="0" data-duration="{ctx.dur:.2f}" data-track-index="0" style="position:absolute;inset:0">
      <div class="bg"></div><div class="dots"></div>
      <div class="stage">{body}</div>
      {top}
      <div class="sub">{sub_html}</div>
    </div>
  </div>
  <script src="assets/vendor/gsap.min.js"></script>
  <script>
  (function () {{
    var SID = "{sid}", T = {ctx.dur:.2f};
    {COMMON_JS}
    tl.fromTo(q(".dots"), {{ x: 0, y: 0 }}, {{ x: -22, y: -14, duration: T, ease: "none" }}, 0);
    tl.fromTo(q(".stage"), {{ scale: 1 }}, {{ scale: 1.025, duration: T, ease: "none", transformOrigin: "50% 45%" }}, 0);
    tl.fromTo(qa(".gh"), {{ opacity: 0 }}, {{ opacity: .14, duration: .5, ease: "power2.out" }}, .25);   // the layout shows as a ghost, parts light up on their word
    tl.fromTo(q(".top"), {{ opacity: 0, y: -10 }}, {{ opacity: 1, y: 0, duration: .4, ease: "power2.out" }}, 0.05);
    {js}
    {sub_js}
    tl.to(q(".stage"), {{ opacity: 0, filter: "blur(8px)", duration: .25, ease: "power2.in" }}, T - 0.25);
    window.__timelines = window.__timelines || {{}};
    window.__timelines[SID] = tl;
  }})();
  </script>
</template>
""", sid


def estimate(segs):
    """dur, s0, s1 from the text length (before the client's voice exists)"""
    out = {}
    for sid, _, text in segs:
        speech = len(text.split()) / WPS
        out[sid] = {"dur": round(0.6 + speech + 0.9, 2), "s0": 0.6, "s1": round(0.6 + speech, 2)}
    return out
