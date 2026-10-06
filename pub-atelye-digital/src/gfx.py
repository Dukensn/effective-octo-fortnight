"""Drawing helpers: fonts, cards with soft shadows, icons, pixel mascots."""
import math
from functools import lru_cache
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1080, 1920
BG = (240, 240, 238)
INK = (24, 24, 24)
GREY = (150, 150, 150)
ORANGE = (217, 119, 87)      # Claude orange
GREEN = (37, 211, 102)       # WhatsApp green
DARK = (22, 22, 24)
FB = (24, 119, 242)
FD = "/usr/share/fonts/opentype/inter/"


@lru_cache(maxsize=256)
def font(size, weight="Regular", display=True):
    name = ("InterDisplay-" if display else "Inter-") + weight + ".otf"
    return ImageFont.truetype(FD + name, size)


def rrect(size, radius, fill, outline=None, width=0):
    im = Image.new("RGBA", size, (0, 0, 0, 0))
    ImageDraw.Draw(im).rounded_rectangle([0, 0, size[0] - 1, size[1] - 1], radius, fill=fill,
                                         outline=outline, width=width)
    return im


def shadowed(im, blur=28, offset=(0, 18), alpha=70, pad=110):
    """Return image with soft drop shadow; anchor stays centred."""
    w, h = im.size
    out = Image.new("RGBA", (w + 2 * pad, h + 2 * pad), (0, 0, 0, 0))
    a = im.split()[3].point(lambda v: v * alpha // 255)
    sh = Image.new("RGBA", im.size, (0, 0, 0, 255))
    sh.putalpha(a)
    out.alpha_composite(sh, (pad + offset[0], pad + offset[1]))
    out = out.filter(ImageFilter.GaussianBlur(blur))
    out.alpha_composite(im, (pad, pad))
    return out


def text_w(t, f):
    return f.getbbox(t)[2] - f.getbbox(t)[0] if t else 0


def draw_center(d, cx, y, t, f, fill):
    d.text((cx - text_w(t, f) / 2, y), t, font=f, fill=fill)


# ---------------- icons ----------------
def claude_star(size=300, color=ORANGE, seed=3):
    import random
    r = random.Random(seed)
    s = size * 4
    im = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    c = s / 2
    n = 12
    for i in range(n):
        a = i / n * 2 * math.pi + r.uniform(-0.08, 0.08)
        L = s * 0.5 * r.uniform(0.72, 0.98)
        wdt = s * 0.045
        x1, y1 = c + math.cos(a) * s * 0.08, c + math.sin(a) * s * 0.08
        x2, y2 = c + math.cos(a) * L, c + math.sin(a) * L
        d.line([x1, y1, x2, y2], fill=color, width=int(wdt))
        d.ellipse([x2 - wdt / 2, y2 - wdt / 2, x2 + wdt / 2, y2 + wdt / 2], fill=color)
    d.ellipse([c - s * .1, c - s * .1, c + s * .1, c + s * .1], fill=color)
    return im.resize((size, size), Image.LANCZOS)


def whatsapp_icon(size=120):
    s = size * 4
    im = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse([s * .05, s * .05, s * .95, s * .95], fill=GREEN)
    d.polygon([(s * .12, s * .95), (s * .2, s * .68), (s * .38, s * .85)], fill=GREEN)
    d.ellipse([s * .14, s * .14, s * .86, s * .86], fill=(255, 255, 255))
    d.ellipse([s * .2, s * .2, s * .8, s * .8], fill=GREEN)
    # handset
    d.rounded_rectangle([s * .33, s * .3, s * .45, s * .45], s * .04, fill="white")
    d.rounded_rectangle([s * .55, s * .55, s * .7, s * .67], s * .04, fill="white")
    d.arc([s * .3, s * .3, s * .7, s * .72], 100, 175, fill="white", width=int(s * .09))
    return im.resize((size, size), Image.LANCZOS)


def pixel_mascot(px=14, body=ORANGE, hat=None, seed=0):
    """Small pixel-art creature in the spirit of the reference agents."""
    g = [
        "....XXXXXX....",
        "..XXXXXXXXXX..",
        ".XXXXXXXXXXXX.",
        ".XXXXXXXXXXXX.",
        "XXXEEXXXXEEXXX",
        "XXXEEXXXXEEXXX",
        "XXXXXXXXXXXXXX",
        "XXXXXXMMXXXXXX",
        ".XXXXXXXXXXXX.",
        ".XX.XX..XX.XX.",
        ".XX.XX..XX.XX.",
    ]
    hats = {
        "detective": ["..HHHHHHHH....", ".HHHHHHHHHH...", "HHHHHHHHHHHH.."],
        "phones": ["...PPPPPPPP...", "..P........P..", ".P..........P."],
        "wizard": [".....HH.......", "....HHHH......", "..HHHHHHHH...."],
        None: [],
    }
    rows = hats[hat] + g
    w, h = len(rows[0]), len(rows)
    im = Image.new("RGBA", (w * px, h * px), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    dark = tuple(int(c * .55) for c in body)
    cols = {"X": body, "E": (30, 30, 30), "M": dark, "H": (90, 70, 60) if hat != "wizard" else (60, 70, 160),
            "P": (40, 60, 170)}
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            if ch in cols:
                d.rectangle([x * px, y * px, (x + 1) * px - 1, (y + 1) * px - 1], fill=cols[ch])
    return im


def chip(label, icon_color=ORANGE, f=None, dark=False, glyph=None):
    f = f or font(40, "SemiBold")
    tw = text_w(label, f)
    h = 96
    w = tw + 130
    bg = (28, 28, 30, 255) if dark else (255, 255, 255, 255)
    im = rrect((w, h), 48, bg)
    d = ImageDraw.Draw(im)
    d.ellipse([22, 22, 74, 74], fill=icon_color)
    if glyph:
        gf = font(30, "Bold")
        draw_center(d, 48, 28, glyph, gf, "white")
    d.text((96, h / 2 - 26), label, font=f, fill="white" if dark else INK)
    return shadowed(im, blur=18, offset=(0, 10), alpha=50, pad=70)


def sparkle(size=60, color=INK):
    s = size * 4
    im = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    c = s / 2
    pts = []
    for i in range(8):
        a = i * math.pi / 4 - math.pi / 2
        r = s * .5 if i % 2 == 0 else s * .12
        pts.append((c + math.cos(a) * r, c + math.sin(a) * r))
    d.polygon(pts, fill=color)
    return im.resize((size, size), Image.LANCZOS)
