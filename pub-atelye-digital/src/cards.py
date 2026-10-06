"""Scene cards (static RGBA images) built with gfx helpers."""
import math
from PIL import Image, ImageDraw
from gfx import *


def editor_card():
    """Dark video-editor window: preview + timeline tracks."""
    w, h = 820, 560
    im = rrect((w, h), 34, (20, 20, 22, 255))
    d = ImageDraw.Draw(im)
    for i, c in enumerate([(255, 95, 86), (255, 189, 46), (39, 201, 63)]):
        d.ellipse([28 + i * 30, 26, 46 + i * 30, 44], fill=c)
    d.text((w / 2 - 70, 22), "Claude · Video", font=font(24, "Medium"), fill=(170, 170, 170))
    # preview (9:16)
    d.rounded_rectangle([300, 70, 520, 330], 16, fill=(40, 40, 44))
    star = claude_star(110)
    im.alpha_composite(star, (355, 145))
    # side panel lines
    for i in range(5):
        d.rounded_rectangle([28, 80 + i * 44, 250 - (i % 3) * 40, 104 + i * 44], 8, fill=(44, 44, 48))
    for i in range(5):
        d.rounded_rectangle([560, 80 + i * 44, 790 - (i % 2) * 50, 104 + i * 44], 8, fill=(44, 44, 48))
    # timeline tracks
    tracks = [(ORANGE, "Tèks"), ((90, 140, 255), "Imaj"), ((80, 200, 140), "Son"), ((200, 120, 230), "Mizik")]
    f = font(20, "SemiBold")
    for i, (c, lab) in enumerate(tracks):
        y = 360 + i * 46
        d.text((28, y + 6), lab, font=f, fill=(150, 150, 150))
        x = 110
        k = 0
        while x < w - 40:
            ln = [140, 90, 180, 120, 70][(i + k) % 5]
            d.rounded_rectangle([x, y, min(x + ln, w - 30), y + 34], 8, fill=c)
            x += ln + 10
            k += 1
    d.line([430, 350, 430, 545], fill="white", width=3)
    d.polygon([(420, 345), (440, 345), (430, 358)], fill="white")
    return shadowed(im)


def phone_status():
    """Phone showing a WhatsApp status being viewed."""
    w, h = 470, 900
    im = rrect((w, h), 64, (18, 18, 18, 255))
    scr = rrect((w - 30, h - 30), 52, (245, 245, 243, 255))
    d = ImageDraw.Draw(scr)
    for i in range(4):
        d.rounded_rectangle([20 + i * 102, 34, 112 + i * 102, 40], 3, fill=(60, 60, 60) if i < 2 else (200, 200, 200))
    d.ellipse([22, 60, 92, 130], fill=ORANGE)
    d.text((108, 72), "Atelye Digital", font=font(30, "Bold"), fill=INK)
    d.text((108, 108), "Kounye a", font=font(22), fill=GREY)
    st = claude_star(220)
    scr.alpha_composite(st, (int((w - 30) / 2 - 110), 270))
    draw_center(d, (w - 30) / 2, 540, "Fèt ak", font(44, "Regular"), INK)
    draw_center(d, (w - 30) / 2, 595, "Claude", font(84, "Bold"), INK)
    d.rounded_rectangle([40, h - 140, w - 70, h - 70], 35, fill=(230, 230, 228))
    d.text((70, h - 124), "Reponn…", font=font(28), fill=GREY)
    im.alpha_composite(scr, (15, 15))
    return shadowed(im, blur=34, offset=(0, 24), alpha=90)


def fb_ads_card(reach="100 000+"):
    w, h = 760, 560
    im = rrect((w, h), 34, (255, 255, 255, 255))
    d = ImageDraw.Draw(im)
    d.ellipse([34, 30, 94, 90], fill=FB)
    draw_center(d, 64, 34, "f", font(50, "Bold"), "white")
    d.text((112, 40), "Ads Manager", font=font(34, "Bold"), fill=INK)
    d.text((40, 120), "Moun rive", font=font(28), fill=GREY)
    d.text((40, 156), reach, font=font(78, "Bold"), fill=INK)
    d.text((440, 120), "Depans", font=font(28), fill=GREY)
    d.text((440, 156), "Ti kòb", font=font(56, "Bold"), fill=(39, 170, 90))
    pts = []
    for i in range(12):
        x = 40 + i * 62
        y = 500 - (i ** 1.6) * 7 - 20 * math.sin(i)
        pts.append((x, y))
    poly = pts + [(pts[-1][0], 530), (40, 530)]
    d.polygon(poly, fill=(220, 233, 252))
    d.line(pts, fill=FB, width=7, joint="curve")
    d.ellipse([pts[-1][0] - 11, pts[-1][1] - 11, pts[-1][0] + 11, pts[-1][1] + 11], fill=FB)
    return shadowed(im)


def chat_card():
    """WhatsApp automation: incoming question, instant bot answer."""
    w, h = 720, 600
    im = rrect((w, h), 34, (236, 229, 221, 255))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, w, 100], 34, fill=(7, 94, 84))
    d.rectangle([0, 60, w, 100], fill=(7, 94, 84))
    im.alpha_composite(whatsapp_icon(64), (28, 18))
    d.text((110, 30), "Biznis ou · Otomatik", font=font(32, "SemiBold"), fill="white")
    f = font(30, "Medium")

    def bubble(y, txt, me):
        tw = text_w(txt, f) + 50
        x = w - tw - 30 if me else 30
        d.rounded_rectangle([x, y, x + tw, y + 70], 22, fill=(217, 253, 211) if me else (255, 255, 255))
        d.text((x + 25, y + 16), txt, font=f, fill=INK)
    bubble(140, "Bonjou, ki pri pwodwi a?", False)
    bubble(240, "Bonjou! Men pri a…", True)
    bubble(340, "Kòman pou m peye?", False)
    bubble(440, "Klike la a pou peye", True)
    d.text((w - 200, 520), "Repons otomatik", font=font(22, "SemiBold"), fill=(7, 94, 84))
    return shadowed(im)


def product_card():
    w, h = 460, 620
    im = rrect((w, h), 26, (25, 25, 28, 255))
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, w, 300], fill=ORANGE)
    d.rounded_rectangle([0, 0, w, 60], 26, fill=ORANGE)
    im.alpha_composite(claude_star(200, color=(255, 255, 255)), (130, 50))
    d.text((36, 330), "E-BOOK", font=font(26, "SemiBold"), fill=(180, 180, 180))
    d.text((36, 370), "Premye pwodwi", font=font(44, "Bold"), fill="white")
    d.text((36, 425), "dijital ou", font=font(44, "Bold"), fill="white")
    d.rounded_rectangle([36, 520, 250, 580], 30, fill=GREEN)
    d.text((62, 532), "Vann li", font=font(30, "Bold"), fill="white")
    return shadowed(im)


def sales_badge(n):
    f = font(46, "Bold")
    t = f"+{n} vant"
    im = rrect((text_w(t, f) + 70, 92), 46, (255, 255, 255, 255))
    d = ImageDraw.Draw(im)
    d.text((35, 18), t, font=f, fill=(39, 170, 90))
    return shadowed(im, blur=16, offset=(0, 8), alpha=50, pad=70)


def brand_card():
    w, h = 820, 420
    im = rrect((w, h), 40, (20, 20, 22, 255))
    d = ImageDraw.Draw(im)
    im.alpha_composite(claude_star(150), (60, 135))
    d.text((240, 120), "ATELYE", font=font(96, "Black"), fill="white")
    d.text((240, 218), "DIGITAL", font=font(96, "Black"), fill=ORANGE)
    d.text((244, 330), "Fòmasyon · Pratik · Pwojè", font=font(30, "Medium"), fill=(170, 170, 170))
    return shadowed(im, alpha=90)


def date_card(day, month="OKT", year="2026", label=""):
    w, h = 340, 400
    im = rrect((w, h), 34, (255, 255, 255, 255))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, w, 110], 34, fill=ORANGE)
    d.rectangle([0, 60, w, 110], fill=ORANGE)
    draw_center(d, w / 2, 24, f"{month} {year}", font(48, "Bold"), "white")
    draw_center(d, w / 2, 125, str(day), font(190, "Black"), INK)
    if label:
        draw_center(d, w / 2, 340, label, font(30, "Medium"), GREY)
    return shadowed(im)


def info_row(icon_text, title, sub, icon_bg=ORANGE, w=860):
    h = 170
    im = rrect((w, h), 34, (255, 255, 255, 255))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([28, 28, 142, 142], 28, fill=icon_bg)
    draw_center(d, 85, 46, icon_text, font(58, "Bold"), "white")
    d.text((172, 30), title, font=font(56, "Bold"), fill=INK)
    d.text((174, 102), sub, font=font(32), fill=GREY)
    return shadowed(im)


def seats_card(filled):
    w, h = 820, 560
    im = rrect((w, h), 34, (255, 255, 255, 255))
    d = ImageDraw.Draw(im)
    d.text((44, 36), "Plas limite", font=font(40, "SemiBold"), fill=GREY)
    d.text((44, 84), "30", font=font(110, "Black"), fill=ORANGE)
    d.text((44 + text_w("30", font(110, "Black")) + 24, 140), "moun sèlman", font=font(56, "Bold"), fill=INK)
    for i in range(30):
        r, c = divmod(i, 10)
        x = 48 + c * 74
        y = 270 + r * 86
        col = ORANGE if i < filled else (233, 233, 230)
        d.rounded_rectangle([x, y, x + 58, y + 64], 14, fill=col)
    return shadowed(im)


def cta_button(phone):
    w, h = 900, 190
    im = rrect((w, h), 95, GREEN + (255,))
    d = ImageDraw.Draw(im)
    wi = Image.new("RGBA", (130, 130), (0, 0, 0, 0))
    ImageDraw.Draw(wi).ellipse([0, 0, 129, 129], fill="white")
    wi.alpha_composite(whatsapp_icon(110), (10, 10))
    im.alpha_composite(wi, (30, 30))
    d.text((190, 34), "Ekri nou sou WhatsApp", font=font(36, "SemiBold"), fill="white")
    d.text((190, 82), phone, font=font(76, "Black"), fill="white")
    return shadowed(im, alpha=80)


def link_card(url):
    f = font(40, "SemiBold")
    w = max(700, text_w(url, f) + 200)
    h = 150
    im = rrect((w, h), 75, (255, 255, 255, 255))
    d = ImageDraw.Draw(im)
    d.ellipse([28, 28, 122, 122], fill=INK)
    draw_center(d, 75, 44, "→", font(52, "Bold"), "white")
    d.text((150, 22), "Fòmilè enskripsyon", font=font(28), fill=GREY)
    d.text((150, 62), url, font=f, fill=INK)
    return shadowed(im)


def certificate_card():
    w, h = 720, 500
    im = rrect((w, h), 20, (255, 252, 245, 255))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([20, 20, w - 20, h - 20], 12, outline=(210, 180, 120), width=5)
    draw_center(d, w / 2, 70, "SÈTIFIKA", font(64, "Black"), INK)
    draw_center(d, w / 2, 160, "Atelye Digital · 2026", font(30, "Medium"), GREY)
    for i, ln in enumerate([440, 380, 300]):
        d.rounded_rectangle([w / 2 - ln / 2, 240 + i * 40, w / 2 + ln / 2, 256 + i * 40], 8, fill=(230, 225, 215))
    d.ellipse([w / 2 - 55, 370, w / 2 + 55, 480], fill=ORANGE)
    im.alpha_composite(claude_star(80, (255, 255, 255)), (int(w / 2 - 40), 385))
    return shadowed(im)
