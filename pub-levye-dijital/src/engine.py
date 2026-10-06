"""Frame renderer: scenes of animated cards + word-by-word kinetic captions."""
import math
from PIL import Image, ImageDraw
from gfx import *

FPS = 30


def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def ease_out_back(x, s=1.6):
    x = clamp(x) - 1
    return 1 + (s + 1) * x ** 3 + s * x ** 2


def ease_out(x):
    return 1 - (1 - clamp(x)) ** 3


def make_bg():
    im = Image.new("RGBA", (W, H), BG + (255,))
    d = ImageDraw.Draw(im)
    for y in range(60, H, 54):
        for x in range(30, W, 54):
            d.ellipse([x - 2, y - 2, x + 2, y + 2], fill=(222, 222, 220))
    draw_center(d, W / 2, H - 120, "levye dijital", font(34, "SemiBold"), (205, 205, 203))
    return im


class El:
    """An animated image element. x,y = centre in frame coordinates."""

    def __init__(self, img, x, y, t_in=0.0, anim="pop", scale=1.0, float_amp=6, t_out=None, dur_in=0.45):
        self.img, self.x, self.y, self.t_in, self.anim = img, x, y, t_in, anim
        self.scale, self.float_amp, self.t_out, self.dur_in = scale, float_amp, t_out, dur_in
        self._cache = {}

    def draw(self, frame, t, scene_end):
        lt = t - self.t_in
        if lt < 0:
            return
        p = lt / self.dur_in
        end = self.t_out if self.t_out is not None else scene_end
        q = clamp((t - (end - 0.22)) / 0.22)  # exit progress
        if q >= 1:
            return
        sc, dx, dy, al = self.scale, 0, 0, 1.0
        if self.anim == "pop":
            sc *= 0.35 + 0.65 * ease_out_back(p)
            al = clamp(p * 3)
        elif self.anim == "up":
            dy = 140 * (1 - ease_out(p)); al = clamp(p * 2)
        elif self.anim == "left":
            dx = -700 * (1 - ease_out(p)); al = clamp(p * 2)
        elif self.anim == "right":
            dx = 700 * (1 - ease_out(p)); al = clamp(p * 2)
        elif self.anim == "zoom":
            sc *= 1.6 - 0.6 * ease_out(p); al = clamp(p * 2)
        dy += math.sin(t * 1.7 + self.x * 0.01) * self.float_amp
        if q > 0:
            sc *= 1 - 0.12 * q; al *= 1 - q
        key = round(sc, 3)
        im = self._cache.get(key)
        if im is None:
            w, h = self.img.size
            im = self.img.resize((max(1, int(w * sc)), max(1, int(h * sc))), Image.BILINEAR)
            if len(self._cache) < 60 or p >= 1:
                self._cache[key] = im
        if al < 0.999:
            im = im.copy()
            im.putalpha(im.split()[3].point(lambda v: int(v * al)))
        frame.alpha_composite(im, (int(self.x + dx - im.width / 2), int(self.y + dy - im.height / 2)))


class Scene:
    def __init__(self, t0, t1, els, cap_y=1380):
        self.t0, self.t1, self.els, self.cap_y = t0, t1, els, cap_y


# ---------------- captions ----------------
class Captions:
    """chunks: list of dict(t0, t1, words=[(text, t, style)]); style in {'n','b','o','g'}"""

    def __init__(self, chunks, size=78, maxw=940):
        self.chunks, self.size, self.maxw = chunks, size, maxw

    def fonts(self, style):
        s = self.size
        return {"n": (font(s, "Regular"), INK), "b": (font(s, "Bold"), INK), "o": (font(s, "ExtraBold"), ORANGE),
                "g": (font(s, "Light"), (120, 120, 120))}[style]

    def layout(self, words):
        lines, cur, cw = [], [], 0
        sp = self.size * 0.27
        for wd in words:
            f, _ = self.fonts(wd[2])
            w = text_w(wd[0], f)
            if cur and cw + sp + w > self.maxw:
                lines.append((cur, cw)); cur, cw = [], 0
            cw += (sp if cur else 0) + w
            cur.append((wd, w))
        if cur:
            lines.append((cur, cw))
        return lines, sp

    def draw(self, frame, t, cy):
        d = ImageDraw.Draw(frame)
        for ch in self.chunks:
            if not (ch["t0"] - 0.05 <= t < ch["t1"]):
                continue
            lines, sp = self.layout(ch["words"])
            lh = self.size * 1.18
            y0 = cy - len(lines) * lh / 2
            out = clamp((t - (ch["t1"] - 0.15)) / 0.15)
            for li, (ws, lw) in enumerate(lines):
                x = W / 2 - lw / 2
                for (txt, wt, st), w in ws:
                    p = (t - wt) / 0.22
                    if p > 0:
                        f, col = self.fonts(st)
                        a = clamp(p) * (1 - out)
                        yy = y0 + li * lh + 26 * (1 - ease_out(p)) - 8 * out
                        # current word slightly emphasised: grey before settling
                        c = tuple(int(BG[i] + (col[i] - BG[i]) * a) for i in range(3))
                        d.text((x, yy), txt, font=f, fill=c)
                    x += w + sp


def render_frame(t, bg, scenes, caps):
    fr = bg.copy()
    cap_y = 1380
    for sc in scenes:
        if sc.t0 <= t < sc.t1:
            cap_y = sc.cap_y
            for e in sc.els:
                e.draw(fr, t, sc.t1)
    caps.draw(fr, t, cap_y)
    return fr
