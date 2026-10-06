"""Edit decision list, timeline mapping, scenes, captions, sfx cue list."""
import json, sys
sys.path.insert(0, __file__.rsplit("/", 1)[0])
from engine import *
from cards import *
from align import word_times

# (id, src_start, src_end, caption text)  -- corrected Haitian Creole
SEGS = [
    ("A", 4.18, 5.77, "Mwen travay videyo sa a ak *Claude."),
    ("B", 6.17, 7.05, "Donk, sa w ap gade a,"),
    ("C", 7.38, 11.01, "konnen se yon videyo *Claude monte li menm. Li itilize pwòp **zouti l,"),
    ("D", 11.38, 12.26, "pwòp **lojisyèl li"),
    ("E", 12.60, 13.64, "pou l fè videyo a."),
    ("F", 14.04, 16.01, "Se pa jenere l jenere tankou **Veo **3."),
    ("G", 17.69, 18.47, "Mwen jis ba l **vwa a."),
    ("H", 19.74, 24.52, "Epi li fè tout lòt bagay yo. Li ajoute **tèks, li ajoute **imaj, li fè **tranzisyon,"),
    ("I", 24.76, 25.45, "li ajoute **son."),
    ("J", 26.01, 28.36, "Apre sa, li ba m *piblisite m."),
    ("K", 29.30, 30.25, "Ou ka remake sa:"),
    ("L", 30.49, 35.01, "si w ta gen yon **biznis, oubyen yon **pwodwi, ou ta renmen fè bèl piblisite ki **pwofesyonèl,"),
    ("M", 35.58, 37.00, "ebyen ou ta dwe gen *konpetans sa."),
    ("N", 37.53, 41.57, "Oubyen ou ta vle vin yon **kreyatè **kontni k ap pibliye videyo ki **serye,"),
    ("O", 42.04, 43.88, "ki pa sanble ak videyo ki jenere avèk **IA."),
    ("P", 44.82, 46.63, "Ebyen, se yon **konpetans"),
    ("Q", 47.35, 49.25, "se sa n ap montre w nan *Atelye *Digital."),
    ("R", 49.50, 52.61, "**De **jou fòmasyon ak pratik pou metrize *Facebook *Ads,"),
    ("S", 53.40, 58.47, "pou w ka fè yon piblisite ki ateyn petèt **plizyè **santèn **milye moun, tout pandan w ap depanse yon **ti **kòb."),
    ("T", 59.32, 64.77, "N ap montre w kòman pou itilize **ajan tankou *Claude ak lòt ankò pou kreye **kontni, jere **kliyan,"),
    ("U", 65.14, 66.53, "fè otomatizasyon *WhatsApp."),
    ("V", 66.84, 71.97, "Epi n ap montre w kòman tou pou itilize entèlijans atifisyèl pou kreye premye **pwodwi **dijital ou."),
    ("W", 72.38, 73.73, "Yon pwodwi w kreye **yon **sèl **fwa,"),
    ("X", 74.01, 77.16, "men ou ka vann li plizyè **dizèn fwa, e plizyè *santèn *fwa."),
    ("Y", 78.33, 82.98, "Se yon atelye ki pral mete aksan sou **aprantisaj, **pratik ak **pwojè an gwoup."),
    ("Z", 83.35, 89.25, "Anplis de sa, w ap resevwa tout **resous **gratis ki nesesè. E n ap mete w nan yon gwoup *WhatsApp pou kontinye"),
    ("Z2", 90.49, 93.89, "kote n ap kontinye asiste patisipan yo pandan **yon **mwa."),
    ("AA", 94.74, 97.80, "Dat la se *17 ak *24 *oktòb 2026."),
    ("AB", 98.42, 103.14, "**10è nan maten pou rive **4è nan apremidi. Lokal la se *La *Madone *Club,"),
    ("AC", 103.45, 104.74, "anfas **Plas **Anakaona."),
    ("AD", 108.06, 112.26, "N ap fè nou konnen plas yo limite a *30 *moun sèlman, kidonk si w rive an reta,"),
    ("AE", 112.60, 113.80, "n ap dezole pou ou."),
    ("AF", 114.17, 122.50, "Pou rezève plas ou, tanpri kontakte nou kounye a sou *WhatsApp, oswa klike sou lyen WhatsApp ki anba videyo sa a, oubyen ekri nou sou *3143 *3938."),
    ("AG", 122.84, 127.08, "Ou ka ranpli fòmilè enskripsyon an tou, lè w ale sou **levierdigital.vercel.app"),
]

LEAD = 1.0      # seconds of intro before the voice
OUTRO = 3.2
PRE, POST, MAXGAP = 0.10, 0.20, 0.38

# ---- build EDL: keep ranges in source time, gaps compressed ----
ranges = []
for sid, a, b, _ in SEGS:
    a, b = a - PRE, b + POST
    if ranges and a - ranges[-1][1] < MAXGAP:
        ranges[-1][1] = b
    else:
        ranges.append([a, b])
EDL = []
out_t = LEAD
for a, b in ranges:
    EDL.append((a, b, out_t))
    out_t += (b - a) + 0.12  # small breath between kept ranges
VOICE_END = out_t
TOTAL = VOICE_END + OUTRO


def M(t):
    """map source time -> output time"""
    for a, b, o in EDL:
        if a <= t <= b:
            return o + (t - a)
    raise ValueError(t)


# ---- captions with word timings ----
BOLD, ORNG = "b", "o"
seg_words = {}
for sid, a, b, txt in SEGS:
    toks = txt.split()
    words, styles = [], []
    for tk in toks:
        st = "n"
        if tk.startswith("**"):
            st, tk = "b", tk[2:]
        elif tk.startswith("*"):
            st, tk = "o", tk[1:]
        words.append(tk); styles.append(st)
    wt = word_times(a, b, words)
    seg_words[sid] = [(w, M(t), s) for w, t, s in zip(words, wt, styles)]

chunks = []
for sid, a, b, _ in SEGS:
    ws = seg_words[sid]
    cur = []
    for i, w in enumerate(ws):
        cur.append(w)
        rem = len(ws) - 1 - i
        brk = w[0][-1] in ".,:" and len(cur) >= 3
        if (len(cur) >= 6 and rem > 2) or (brk and rem != 1) or len(cur) >= 8 or rem == 0:
            chunks.append(cur); cur = []
CH = []
for i, c in enumerate(chunks):
    t0 = c[0][1] - 0.06
    nxt = chunks[i + 1][0][1] - 0.08 if i + 1 < len(chunks) else VOICE_END + 0.6
    t1 = min(nxt, c[-1][1] + 2.2)
    CH.append({"t0": t0, "t1": t1, "words": c})


def T(sid, k=0):
    """output time of k-th word of segment sid (k may be negative)"""
    return seg_words[sid][k][1]


def Tw(sid, word):
    for w, t, s in seg_words[sid]:
        if w.lower().strip(".,:").startswith(word.lower()):
            return t
    raise KeyError(word)


def St(sid):
    return T(sid, 0) - 0.15


# ---------------- scenes ----------------
CX = W / 2
SFX = []  # (name, time, gain_db)


def cue(name, t, g=0):
    SFX.append((name, max(0, t), g))


scenes = []


def scene(t0, t1, els, cap_y=1420, whoosh=True):
    scenes.append(Scene(t0, t1, els, cap_y))
    if whoosh and t0 > 0.3:
        cue("whoosh_short", t0 - 0.12, -8)
    for e in els:
        if e.anim == "pop" and e.t_in > t0 + 0.05:
            cue("pop", e.t_in, -10)


# 1 intro
star = claude_star(330)
cue("impact", 0.05, -6)
cue("riser", 0.0, -14)
scene(0, St("C"), [
    El(star, CX, 520, 0.05, "zoom", float_amp=0),
    El(phone_status(), CX, 980, St("B"), "up", scale=0.82),
], cap_y=1540, whoosh=False)
# 2 editor + tools
scene(St("C"), St("F"), [
    El(editor_card(), CX, 700, St("C") + .05, "pop"),
    El(chip("Zouti", glyph="Z"), 330, 1110, Tw("C", "zouti"), "pop"),
    El(chip("Lojisyèl", glyph="L", icon_color=(90, 140, 255)), 720, 1110, Tw("D", "lojisyèl"), "pop"),
])
# 3 not Veo 3, just my voice
scene(St("F"), St("H"), [
    El(chip("Veo 3", glyph="×", icon_color=(220, 60, 60), f=font(64, "Bold")), CX, 640, Tw("F", "Veo"), "pop", scale=1.3),
    El(chip("Vwa mwen sèlman", glyph="✓", icon_color=GREEN, f=font(56, "Bold"), dark=True), CX, 960, Tw("G", "vwa"), "pop", scale=1.1),
])
# 4 text image transitions sound -> ad
chips4 = [("Tèks", "T", ORANGE, "tèks", 380, 560), ("Imaj", "I", (90, 140, 255), "imaj", 720, 700),
          ("Tranzisyon", "→", (200, 120, 230), "tranzisyon", 400, 860), ("Son", "S", (80, 200, 140), "son", 740, 1010)]
els = [El(claude_star(200), CX, 330, St("H") + .05, "pop")]
for lab, g, c, w, x, y in chips4:
    sid = "I" if w == "son" else "H"
    els.append(El(chip(lab, glyph=g, icon_color=c, f=font(52, "Bold")), x, y, Tw(sid, w), "pop", scale=1.15))
scene(St("H"), St("J"), els)
scene(St("J"), St("K"), [
    El(phone_status(), CX, 820, St("J") + 0.05, "pop", scale=0.9),
    El(claude_star(160), 820, 420, Tw("J", "piblisite"), "pop"),
])
# 5 business / product / pro ad
scene(St("K"), St("N"), [
    El(chip("Biznis", glyph="B", f=font(56, "Bold")), 340, 560, Tw("L", "biznis"), "pop", scale=1.1),
    El(chip("Pwodwi", glyph="P", icon_color=(90, 140, 255), f=font(56, "Bold")), 740, 720, Tw("L", "pwodwi"), "pop", scale=1.1),
    El(chip("Piblisite pwofesyonèl", glyph="✓", icon_color=GREEN, f=font(52, "Bold"), dark=True), CX, 920,
       Tw("L", "pwofesyonèl"), "pop", scale=1.1),
    El(chip("Konpetans", glyph="!", icon_color=ORANGE, f=font(52, "Bold")), CX, 1110, Tw("M", "konpetans"), "pop"),
])
scene(St("N"), St("P"), [
    El(phone_status(), 380, 840, St("N") + .05, "left", scale=0.85),
    El(chip("Kreyatè kontni", glyph="★", f=font(44, "Bold")), 740, 520, Tw("N", "kreyatè"), "pop"),
    El(chip("Videyo serye", glyph="✓", icon_color=GREEN, f=font(44, "Bold")), 760, 1100, Tw("N", "serye"), "pop"),
])
# 6 brand reveal
cue("riser", St("P") - 0.6, -12)
cue("impact", Tw("Q", "Atelye"), -4)
scene(St("P"), St("R"), [
    El(chip("Yon konpetans", glyph="!", f=font(56, "Bold")), CX, 520, St("P") + .1, "pop"),
    El(brand_card(), CX, 860, Tw("Q", "Atelye") - 0.05, "zoom"),
])
# 7 facebook ads
scene(St("R"), St("T"), [
    El(chip("2 jou fòmasyon + pratik", glyph="2", f=font(48, "Bold"), dark=True), CX, 470, St("R") + .05, "pop"),
    El(fb_ads_card(), CX, 860, Tw("R", "Facebook"), "up"),
    El(chip("Ti kòb sèlman", glyph="$", icon_color=GREEN, f=font(46, "Bold")), 700, 1180, Tw("S", "ti"), "pop"),
])
# 8 agents
mascots = [("detective", ORANGE, "Kontni", "kontni"), ("phones", (240, 140, 100), "Kliyan", "kliyan"),
           ("wizard", (225, 110, 80), "WhatsApp", None)]
els = [El(chip("Ajan IA tankou Claude", glyph="★", f=font(46, "Bold"), dark=True), CX, 450, Tw("T", "ajan"), "pop")]
for i, (hat, col, lab, w) in enumerate(mascots):
    x = 230 + i * 310
    t = Tw("T", w) if w else Tw("U", "WhatsApp")
    els.append(El(pixel_mascot(px=16, body=col, hat=hat), x, 780, t, "pop"))
    els.append(El(chip(lab, f=font(36, "SemiBold"), glyph=lab[0]), x, 1010, t + 0.08, "up", float_amp=3))
scene(St("T"), St("U") + 0.4, els)
scene(St("U") + 0.4, St("V"), [El(chat_card(), CX, 820, St("U") + 0.45, "pop")])
# 9 digital product
scene(St("V"), St("Y"), [
    El(chip("Entèlijans atifisyèl", glyph="★", f=font(50, "Bold"), dark=True), CX, 420, St("V") + .1, "pop"),
    El(claude_star(240), CX, 800, St("V") + .3, "pop", t_out=Tw("V", "pwodwi") - 0.05),
    El(product_card(), CX, 800, Tw("V", "pwodwi"), "pop"),
    El(chip("Kreye 1 fwa", glyph="1", f=font(44, "Bold")), 300, 1180, Tw("W", "yon"), "pop"),
    El(sales_badge(10), 820, 560, Tw("X", "dizèn"), "pop"),
    El(sales_badge(100), 800, 1100, Tw("X", "santèn"), "pop", scale=1.2),
])
# 10 learning, practice, group projects
scene(St("Y"), St("Z"), [
    El(chip("Aprantisaj", glyph="1", f=font(56, "Bold")), CX, 560, Tw("Y", "aprantisaj"), "pop", scale=1.1),
    El(chip("Pratik", glyph="2", icon_color=(90, 140, 255), f=font(56, "Bold")), CX, 790, Tw("Y", "pratik"), "pop", scale=1.1),
    El(chip("Pwojè an gwoup", glyph="3", icon_color=GREEN, f=font(56, "Bold")), CX, 1020, Tw("Y", "pwojè"), "pop", scale=1.1),
])
# 11 resources + whatsapp group 1 month
scene(St("Z"), St("AA"), [
    El(chip("Resous gratis", glyph="✓", icon_color=GREEN, f=font(56, "Bold")), CX, 520, Tw("Z", "resous"), "pop", scale=1.1),
    El(info_row("W", "Gwoup WhatsApp", "Swivi ak asistans", icon_bg=GREEN), CX, 800, Tw("Z", "WhatsApp"), "up"),
    El(chip("Pandan 1 mwa", glyph="1", f=font(56, "Bold"), dark=True), CX, 1080, Tw("Z2", "yon"), "pop", scale=1.1),
])
# 12 dates
cue("ding", Tw("AA", "17"), -12)
scene(St("AA"), St("AB"), [
    El(date_card(17), 330, 800, Tw("AA", "17"), "pop", scale=1.05),
    El(date_card(24), 750, 800, Tw("AA", "24"), "pop", scale=1.05),
])
# 13 time + place
scene(St("AB"), St("AD"), [
    El(info_row("10", "10è – 4è", "Nan maten rive apremidi"), CX, 600, Tw("AB", "10è"), "left"),
    El(info_row("★", "La Madone Club", "Anfas Plas Anakaona", icon_bg=INK), CX, 900, Tw("AB", "La"), "right"),
])
# 14 seats limited
t0, t1 = St("AD"), St("AF")
els = [El(chip("Plas limite", glyph="!", icon_color=(220, 60, 60), f=font(56, "Bold")), CX, 450, t0 + .05, "pop")]
steps = 9
ts = Tw("AD", "30")
for k in range(steps):
    a = t0 + 0.1 if k == 0 else ts + (k - 1) * 0.28
    b = ts + k * 0.28 if k < steps - 1 else None
    filled = [0, 4, 8, 12, 16, 20, 24, 28, 30][k]
    els.append(El(seats_card(filled), CX, 860, a, "pop" if k == 0 else "none", t_out=b, float_amp=0, dur_in=0.3 if k == 0 else 0.01))
    if k:
        cue("tick", a, -10)
scene(t0, t1, els)
# 15 CTA whatsapp
cue("ding", Tw("AF", "3143"), -8)
scene(St("AF"), St("AG"), [
    El(whatsapp_icon(260), CX, 520, Tw("AF", "WhatsApp"), "pop"),
    El(cta_button("3143-3938"), CX, 900, Tw("AF", "3143") - 0.1, "pop"),
])
# 16 form link + end card
scene(St("AG"), TOTAL + 1, [
    El(brand_card(), CX, 560, St("AG"), "pop", scale=0.85),
    El(link_card("levierdigital.vercel.app"), CX, 900, Tw("AG", "fòmilè"), "up"),
    El(cta_button("3143-3938"), CX, 1150, Tw("AG", "levierdigital") + 0.4, "pop", scale=0.85),
], cap_y=1500)
cue("impact", VOICE_END + 0.2, -10)

# make end of last scene not fade out before video end
scenes[-1].t1 = TOTAL + 1

CAPS = Captions(CH)
BG_IMG = make_bg()

if __name__ == "__main__":
    print("EDL", [(round(a, 2), round(b, 2), round(o, 2)) for a, b, o in EDL])
    print("TOTAL", round(TOTAL, 2), "voice_end", round(VOICE_END, 2))
    json.dump({"edl": EDL, "total": TOTAL, "sfx": SFX, "lead": LEAD}, open(sys.argv[1], "w"))
    for c in CH[:6]:
        print(round(c["t0"], 2), round(c["t1"], 2), " ".join(w for w, _, _ in c["words"]))
