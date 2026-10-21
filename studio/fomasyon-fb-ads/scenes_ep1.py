"""Episode 1 templates: kòman yon vant fèt, ak kòman mache piblisite a mache."""
from engine import icon, INK, INK2, MUTE, LINE, ACC, ACCD, ACCP, GOOD, WARN, BAD, FB, WA


def hook(c):
    dots = "".join(f'<i style="left:{(k % 16) * 34}px; top:{(k // 16) * 34}px"></i>' for k in range(16 * 11))
    body = f"""
    <div class="big"><div class="lab">Chak jou</div><div class="n num">0</div><div class="h2">moun sou Facebook, Instagram, WhatsApp</div>
      <div class="apps"><span style="background:{FB}">{icon('brand-facebook', 40, '#fff')}</span><span style="background:#E1306C">{icon('brand-instagram', 40, '#fff')}</span><span style="background:{WA}">{icon('brand-whatsapp', 40, '#fff')}</span></div></div>
    <div class="crowd">{dots}</div>
    <div class="tag t1 pill" style="background:#1B1A18;color:#fff">BON moun · bon moman · bon mesaj</div>
    <div class="fa pill" style="background:{FB};color:#fff">{icon('brand-facebook', 32, '#fff')} Facebook Ads</div>
    <div class="zero lab">Depi zewo · etap pa etap</div>"""
    css = f"""
    & .big {{ position: absolute; left: 140px; top: 230px; width: 760px; }}
    & .big .n {{ font: 900 150px/1 "InterD"; letter-spacing: -4px; margin: 16px 0 10px; }}
    & .big .h2 {{ color: {INK2}; font-size: 40px; }}
    & .apps {{ display: flex; gap: 18px; margin-top: 34px; }}
    & .apps span {{ width: 84px; height: 84px; border-radius: 24px; display: flex; align-items: center; justify-content: center; }}
    & .crowd {{ position: absolute; left: 1060px; top: 210px; width: 544px; height: 374px; }}
    & .crowd i {{ position: absolute; width: 18px; height: 18px; border-radius: 50%; background: {LINE}; }}
    & .tag {{ position: absolute; left: 1060px; top: 640px; font-size: 28px; }}
    & .fa {{ position: absolute; left: 140px; top: 690px; font-size: 34px; padding: 16px 28px; }}
    & .zero {{ position: absolute; left: 1060px; top: 730px; color: {ACCD}; }}"""
    pick = [5, 22, 37, 41, 66, 90, 103, 118, 131, 150, 163, 171]
    js = f"""
    up(q(".big .lab"), {c.at(0.0)}); up(q(".big .n"), {c.at(0.01)});
    count(".big .n", 0, 3000000000, {c.at(0.02)}, 1.6, function (v) {{ return v >= 2999999999 ? "3 milya +" : Math.round(v / 1e6).toLocaleString("fr-FR") + " M"; }});
    up(q(".big .h2"), {c.cue('Facebook')}); up(qa(".apps span"), {c.cue('WhatsApp') - 0.4});
    tl.fromTo(qa(".crowd i"), {{ opacity: 0, scale: 0 }}, {{ opacity: 1, scale: 1, duration: .3, ease: "back.out(2)", stagger: {{ each: .004, from: "random" }} }}, {c.cue('Pami yo')});
    {"".join(f'tl.to(qa(".crowd i")[{k}], {{ backgroundColor: "{ACC}", scale: 1.5, duration: .25 }}, {c.cue("BON moun")} + {k * 0.04});' for k in pick)}
    tl.to(qa(".crowd i").filter(function (e, i) {{ return {pick}.indexOf(i) < 0; }}), {{ opacity: .35, duration: .4 }}, {c.cue('BON moun')} + .3);
    pop(q(".tag"), {c.cue('BON moun')}); pop(q(".fa"), {c.cue('Se sa Facebook Ads')}); up(q(".zero"), {c.cue('depi zewo')});"""
    return body, css, js


def plan(c):
    items = [("1", "eye", "Kòman yon vant fèt, ak mache piblisite a", "Premye"), ("2", "layers", "Kòman Facebook Ads mache anndan l", "Dezyèm"),
             ("3", "chart-column", "Chif yo: CPM, CPC, CTR", "Twazyèm"), ("4", "rocket", "Kreye epi lanse premye piblisite ou", "Katriyèm")]
    cards = "".join(f'<div class="card gh c{k}" style="left:{140 + k * 418}px"><div class="no">{n}</div><div class="ic">{icon(ic, 64, ACC)}</div><div class="t">{t}</div></div>'
                    for k, (n, ic, t, _) in enumerate(items))
    body = f'<div class="h1 title">Seri a: 4 videyo</div>{cards}'
    css = f"""
    & .title {{ position: absolute; left: 140px; top: 180px; }}
    & .card {{ top: 360px; width: 380px; height: 400px; padding: 40px 36px; }}
    & .no {{ font: 900 90px/1 "InterD"; color: {LINE}; }}
    & .ic {{ margin: 18px 0 22px; }}
    & .t {{ font: 700 34px/1.2 "Inter"; }}
    & .c0 {{ outline: 4px solid {ACC}; outline-offset: -4px; }}"""
    js = f'up(q(".title"), {c.at(0)});' + "".join(f'pop(q(".c{k}"), {c.cue(w)});' for k, (_, _, _, w) in enumerate(items)) + \
        f'tl.to(qa(".card:not(.c0)"), {{ opacity: .45, duration: .4 }}, {c.at(0.97)});'
    return body, css, js


def _steps_html(labels, icons_, top=330):
    return "".join(f'<div class="st gh s{k}" style="left:{180 + k * 560}px; top:{top}px"><div class="ci">{icon(ic, 96, "#fff")}</div><div class="w">{w}</div><div class="d">{d}</div></div>'
                   + (f'<div class="ar gh a{k}" style="left:{180 + k * 560 + 330}px; top:{top + 70}px"><svg width="190" height="40"><path d="M5 20 H170 M150 6 L172 20 L150 34" fill="none" stroke="{LINE}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' if k < 2 else "")
                   for k, ((w, d), ic) in enumerate(zip(labels, icons_)))


STEP_CSS = f"""
    & .st {{ position: absolute; width: 330px; text-align: center; }}
    & .st .ci {{ width: 190px; height: 190px; margin: 0 auto; border-radius: 50%; background: {INK}; display: flex; align-items: center; justify-content: center; }}
    & .st.s2 .ci {{ background: {ACC}; }}
    & .st .w {{ font: 900 64px/1 "InterD"; margin-top: 30px; }}
    & .st .d {{ font: 500 28px/1.3 "Inter"; color: {INK2}; margin-top: 12px; }}
    & .ar {{ position: absolute; }}"""


def law(c):
    body = '<div class="lab ttl">Lwa lavant</div>' + _steps_html([("WÈ", "Yon moun wè ou"), ("ENTERESE", "Li pwoche, li klike"), ("AJI", "Li achte")],
                                                                ["eye", "mouse-pointer-click", "shopping-cart"]) + \
        '<div class="rule pill" style="background:#1B1A18;color:#fff">Wè → Enterese → Aji</div>'
    css = STEP_CSS + "& .ttl { position: absolute; left: 180px; top: 200px; } & .rule { position: absolute; left: 50%; top: 790px; transform: translateX(-50%); font-size: 30px; }"
    js = f"""up(q(".ttl"), {c.at(0)});
    pop(q(".s0"), {c.cue('WÈ ou')}); fade(q(".a0"), {c.cue('WÈ ou') + .3});
    pop(q(".s1"), {c.cue('ENTERESE')}); fade(q(".a1"), {c.cue('ENTERESE') + .3});
    pop(q(".s2"), {c.cue('AJI')});
    pop(q(".rule"), {c.cue('Wè, enterese')}); pulse(q(".s2 .ci"), {c.cue('lwa lavant')});"""
    return body, css, js


def funnel(c):
    rows = [("10 000", "moun wè", 1180, "eye"), ("200", "klike", 760, "mouse-pointer-click"), ("10", "achte", 360, "shopping-cart")]
    body = "".join(f'<div class="fr gh r{k}" style="width:{w}px">{icon(ic, 46, "#fff")}<b class="num v{k}">0</b><span>{l}</span></div>' for k, (v, l, w, ic) in enumerate(rows)) + \
        '<div class="pc p0 pill">× 2 %</div><div class="pc p1 pill">× 5 %</div>' + \
        '<div class="eq">Vant = moun ki wè × % ki enterese × % ki achte</div>'
    css = f"""
    & .fr {{ position: absolute; left: 50%; transform: translateX(-50%); height: 130px; border-radius: 24px; background: {INK}; color: #fff;
      display: flex; align-items: center; justify-content: center; gap: 22px; }}
    & .fr b {{ font: 900 70px/1 "InterD"; }} & .fr span {{ font: 600 32px/1 "Inter"; color: #D9D4CC; }}
    & .r0 {{ top: 190px; }} & .r1 {{ top: 380px; background: #3D3A35; }} & .r2 {{ top: 570px; background: {ACC}; }}
    & .pc {{ position: absolute; left: 1420px; background: #fff; box-shadow: 0 10px 30px rgba(40,30,20,.12); font-size: 32px; }}
    & .p0 {{ top: 330px; }} & .p1 {{ top: 520px; }}
    & .eq {{ position: absolute; left: 0; right: 0; top: 760px; text-align: center; font: 700 36px/1 "Inter"; color: {INK2}; }}"""
    js = f"""
    growX = function (s, t) {{ tl.fromTo(s, {{ opacity: G, scaleX: .4 }}, {{ opacity: 1, scaleX: 1, duration: .5, ease: "expo.out" }}, t); }};
    growX(q(".r0"), {c.cue('dis mil')}); count(".v0", 0, 10000, {c.cue('dis mil')}, .8);
    pop(q(".p0"), {c.cue('de pousan')}); growX(q(".r1"), {c.cue('desan')}); count(".v1", 0, 200, {c.cue('desan')}, .6);
    pop(q(".p1"), {c.cue('senk pousan')}); growX(q(".r2"), {c.cue('dis vant')}); count(".v2", 0, 10, {c.cue('dis vant')}, .5);
    up(q(".eq"), {c.cue('Vant ou yo')});"""
    return body, css, "var growX;" + js


def levers(c):
    k3 = [("Fè plis moun WÈ", "plis moun"), ("Fè plis moun ENTERESE", "pi bon piblisite"), ("Fè plis moun ACHTE", "pi bon òf, pri, repons")]
    dials = "".join(f'<div class="dl gh d{k}" style="left:{210 + k * 540}px"><svg width="260" height="260" viewBox="0 0 260 260"><circle cx="130" cy="130" r="110" fill="#fff" stroke="{LINE}" stroke-width="14"/>'
                    f'<path class="arc" d="M52 208 A110 110 0 1 1 208 208" fill="none" stroke="{ACC}" stroke-width="14" stroke-linecap="round"/>'
                    f'<g class="nd"><line x1="130" y1="130" x2="130" y2="44" stroke="{INK}" stroke-width="12" stroke-linecap="round"/></g><circle cx="130" cy="130" r="18" fill="{INK}"/></svg>'
                    f'<div class="t">{t}</div><div class="d">{d}</div></div>' for k, (t, d) in enumerate(k3))
    body = f'<div class="h2 ttl">3 bouton pou vann plis</div>{dials}<div class="zero pill">1 bouton a 0 → 0 vant</div>'
    css = f"""
    & .ttl {{ position: absolute; left: 210px; top: 180px; }}
    & .dl {{ position: absolute; top: 300px; width: 400px; text-align: center; }}
    & .dl svg {{ display: block; margin: 0 auto; }}
    & .dl .t {{ font: 800 32px/1.2 "Inter"; margin-top: 18px; }} & .dl .d {{ font: 500 26px/1.3 "Inter"; color: {INK2}; margin-top: 8px; }}
    & .zero {{ position: absolute; left: 50%; top: 790px; transform: translateX(-50%); background: {BAD}; color: #fff; font-size: 30px; }}"""
    js = f"""up(q(".ttl"), {c.at(0)});
    {"".join(f'pop(q(".d{k}"), {c.cue(w)}); tl.fromTo(q(".d{k} .nd"), {{ rotation: -130, svgOrigin: "130 130" }}, {{ rotation: 60, svgOrigin: "130 130", duration: .9, ease: "expo.out" }}, {c.cue(w)} + .2);' for k, w in enumerate(['plis moun wè', 'plis moun enterese', 'plis moun achte']))}
    tl.to(q(".d1 .nd"), {{ rotation: -130, svgOrigin: "130 130", duration: .6, ease: "power3.inOut" }}, {c.cue('zewo')});
    tl.to(q(".d1 .arc"), {{ stroke: "{BAD}", duration: .3 }}, {c.cue('zewo')});
    pop(q(".zero"), {c.cue('tout vant')});"""
    return body, css, js


def measure(c):
    body = f"""
    <div class="card gh l"><div class="ic">{icon('store', 90, INK2)}</div><div class="h2">Nan mache a</div><div class="q">? moun</div><div class="d">ou pa konnen konbyen moun ki pase</div></div>
    <div class="card gh r"><div class="hd">{icon('brand-facebook', 40, FB)} <b>Facebook</b></div>
      <div class="row r0">{icon('eye', 40, INK2)}<span>Moun ki wè</span><b class="num v0">0</b></div>
      <div class="row r1">{icon('mouse-pointer-click', 40, INK2)}<span>Moun ki klike</span><b class="num v1">0</b></div>
      <div class="row r2">{icon('message-circle', 40, INK2)}<span>Moun ki ekri w</span><b class="num v2">0</b></div></div>
    <div class="cap pill">Chak etap ka mezire</div>"""
    css = f"""
    & .l {{ left: 180px; top: 230px; width: 620px; height: 500px; padding: 50px; text-align: center; }}
    & .l .q {{ font: 900 110px/1 "InterD"; color: {LINE}; margin: 24px 0 14px; }} & .l .d {{ font: 500 28px/1.3 "Inter"; color: {INK2}; }}
    & .r {{ left: 900px; top: 230px; width: 840px; height: 500px; padding: 44px 54px; }}
    & .hd {{ display: flex; align-items: center; gap: 14px; font: 800 34px/1 "Inter"; margin-bottom: 30px; }}
    & .row {{ display: flex; align-items: center; gap: 22px; height: 110px; border-top: 2px solid #EDE9E2; font: 600 32px/1 "Inter"; }}
    & .row span {{ flex: 1; color: {INK2}; }} & .row b {{ font: 900 60px/1 "InterD"; }}
    & .cap {{ position: absolute; left: 50%; top: 790px; transform: translateX(-50%); background: {INK}; color: #fff; font-size: 30px; }}"""
    js = f"""pop(q(".l"), {c.cue('Nan yon mache')}); pop(q(".r"), {c.cue('Sou Facebook')});
    up(q(".r0"), {c.cue('konbyen moun ki wè')}); count(".v0", 0, 10000, {c.cue('konbyen moun ki wè')}, .7);
    up(q(".r1"), {c.cue('konbyen ki klike')}); count(".v1", 0, 200, {c.cue('konbyen ki klike')}, .6);
    up(q(".r2"), {c.cue('ki ekri w')}); count(".v2", 0, 10, {c.cue('ki ekri w')}, .5);
    pop(q(".cap"), {c.cue('chak etap')});"""
    return body, css, js


def attention(c):
    posts = "".join(f'<div class="post p{k}"><i></i><u></u><u class="s"></u></div>' for k in range(6))
    shops = "".join(f'<div class="shop sh{k}" style="left:{90 + (k % 3) * 150}px; top:{260 + (k // 3) * 170}px">{icon("store", 52, INK2)}</div>' for k in range(6))
    body = f"""<div class="phone"><div class="feed"><div class="scroll">{posts}<div class="slot">PIBLISITE</div>{posts}</div></div></div>{shops}
      <div class="sell"><div class="lab">Facebook pa vann pwodwi</div><div class="h1">Li vann <span class="acc">ATANSYON</span></div></div>
      <div class="auc pill">{icon('gavel', 36, '#fff')} Yon enchè · 0,2 segonn</div>"""
    css = f"""
    & .phone {{ position: absolute; left: 760px; top: 140px; width: 400px; height: 760px; border-radius: 56px; background: {INK}; padding: 18px; }}
    & .feed {{ width: 100%; height: 100%; border-radius: 40px; background: #F7F5F0; overflow: hidden; position: relative; }}
    & .post {{ margin: 16px; height: 170px; border-radius: 18px; background: #fff; position: relative; }}
    & .post i {{ position: absolute; left: 14px; top: 14px; width: 40px; height: 40px; border-radius: 50%; background: {LINE}; }}
    & .post u {{ position: absolute; left: 66px; top: 22px; width: 160px; height: 12px; border-radius: 6px; background: #E6E1D8; }}
    & .post u.s {{ top: 74px; left: 14px; width: 300px; height: 80px; border-radius: 12px; }}
    & .slot {{ margin: 16px; height: 190px; border-radius: 18px; border: 4px dashed {ACC}; display: flex; align-items: center; justify-content: center;
      font: 800 26px/1 "Inter"; letter-spacing: 3px; color: {ACC}; }}
    & .shop {{ position: absolute; width: 110px; height: 110px; border-radius: 28px; background: #fff; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 10px 30px rgba(40,30,20,.12); }}
    & .sell {{ position: absolute; left: 1250px; top: 330px; width: 600px; }} & .sell .h1 {{ font-size: 70px; margin-top: 14px; }}
    & .auc {{ position: absolute; left: 1250px; top: 600px; background: {INK}; color: #fff; font-size: 30px; }}"""
    js = f"""up(q(".phone"), {c.at(0)});
    tl.fromTo(q(".scroll"), {{ y: 0 }}, {{ y: -870, duration: 3.2, ease: "power1.inOut" }}, {c.cue('Chak fwa')} - .6);
    pop(q(".slot"), {c.cue('ti plas')});
    tl.fromTo(qa(".shop"), {{ opacity: 0, scale: .5 }}, {{ opacity: 1, scale: 1, duration: .35, ease: "back.out(2)", stagger: .07 }}, {c.cue('Plizyè milye')});
    tl.to(qa(".shop"), {{ x: 300, y: function (i) {{ return 120 - (Math.floor(i / 3) * 170); }}, scale: .6, opacity: .6, duration: .8, ease: "power2.inOut", stagger: .05 }}, {c.cue('menm plas')});
    up(q(".sell .lab"), {c.cue('pa vann pwodwi')}); up(q(".sell .h1"), {c.cue('ATANSYON')});
    pop(q(".auc"), {c.cue('enchè')});"""
    return body, css, js


def auction(c):
    ads = [("A", 0.95, 0.35, 0.30), ("B", 0.55, 0.85, 0.90), ("C", 0.70, 0.50, 0.45)]
    cards = "".join(f"""<div class="card ad a{k}" style="left:{170 + k * 540}px"><div class="nm">Piblisite {n}</div>
      {''.join(f'<div class="bar"><span>{lab}</span><div class="tr"><div class="fl f{j}" style="width:{int(v * 100)}%"></div></div></div>' for j, (lab, v) in enumerate([('Kòb li ofri', b), ('Chans moun reyaji', p), ('Kalite', q_)]))}
      <div class="crown">{icon('trophy', 40, '#fff')} Li genyen</div></div>""" for k, (n, b, p, q_) in enumerate(ads))
    body = f'<div class="h2 ttl">Kiyès ki genyen enchè a?</div>{cards}<div class="eq">Valè = kòb ou ofri × chans pou moun nan reyaji + kalite piblisite a</div>'
    css = f"""
    & .ttl {{ position: absolute; left: 170px; top: 170px; }}
    & .ad {{ top: 290px; width: 480px; padding: 40px; }}
    & .nm {{ font: 800 36px/1 "Inter"; margin-bottom: 26px; }}
    & .bar {{ margin-bottom: 22px; }} & .bar span {{ font: 600 24px/1 "Inter"; color: {INK2}; }}
    & .tr {{ height: 22px; border-radius: 11px; background: #EDE9E2; margin-top: 10px; overflow: hidden; }}
    & .fl {{ height: 100%; border-radius: 11px; background: {INK}; }} & .f1 {{ background: {ACC}; }} & .f2 {{ background: {GOOD}; }}
    & .crown {{ margin-top: 18px; display: inline-flex; gap: 10px; align-items: center; background: {GOOD}; color: #fff; padding: 10px 18px; border-radius: 30px; font: 800 26px/1 "Inter"; opacity: 0; }}
    & .eq {{ position: absolute; left: 0; right: 0; top: 800px; text-align: center; font: 700 32px/1 "Inter"; color: {INK2}; }}"""
    js = f"""up(q(".ttl"), {c.at(0)}); tl.fromTo(qa(".ad"), {{ opacity: 0, y: 50 }}, {{ opacity: 1, y: 0, duration: .5, ease: "expo.out", stagger: .12 }}, {c.at(0.02)});
    grow(qa(".f0"), {c.cue('kòb ou dakò')}); grow(qa(".f1"), {c.cue('chans pou moun')}); grow(qa(".f2"), {c.cue('kalite piblisite')});
    pulse(q(".a0"), {c.cue('se pa sa ki peye plis')});
    pop(q(".a1 .crown"), {c.cue('bon piblisite ka bat')}); tl.to(q(".a1"), {{ y: -20, boxShadow: "0 40px 80px rgba(47,158,107,.30)", duration: .4 }}, {c.cue('bon piblisite ka bat')});
    tl.to(qa(".a0, .a2"), {{ opacity: .45, duration: .4 }}, {c.cue('bon piblisite ka bat')});
    up(q(".eq"), {c.cue('Li konbine')});"""
    return body, css, js


def compare(c):
    rows = [("Ou chwazi kiyès ki wè w", "KIYÈS"), ("Ou kòmanse ak ti kòb", "ti kòb"), ("Rezilta an tan reyèl", "tan reyèl"), ("Kanpe oswa chanje nenpòt ki lè", "kanpe")]
    tr = "".join(f'<div class="tr t{k}"><div class="c1">{t}</div><div class="c2">{icon("x", 44, BAD, 3)}</div><div class="c3">{icon("check", 44, GOOD, 3)}</div></div>' for k, (t, _) in enumerate(rows))
    body = f"""<div class="card tb"><div class="th"><div class="c1"></div><div class="c2">{icon('radio', 40, INK2)} Afich / Radyo</div><div class="c3">{icon('brand-facebook', 40, FB)} Facebook Ads</div></div>{tr}</div>
      <div class="cap pill">Ou peye pou rezilta, pa pou espwa</div>"""
    css = f"""
    & .tb {{ left: 260px; top: 180px; width: 1400px; padding: 20px 50px; }}
    & .th, & .tr {{ display: flex; align-items: center; height: 104px; }} & .tr {{ border-top: 2px solid #EDE9E2; }}
    & .c1 {{ flex: 1; font: 600 34px/1.2 "Inter"; }} & .c2, & .c3 {{ width: 330px; display: flex; justify-content: center; align-items: center; gap: 12px; font: 800 28px/1 "Inter"; }}
    & .th .c2 {{ color: {INK2}; }}
    & .cap {{ position: absolute; left: 50%; top: 800px; transform: translateX(-50%); background: {ACC}; color: #fff; font-size: 32px; }}"""
    js = f'pop(q(".tb"), {c.at(0)}); fade(qa(".th > div"), {c.cue("Facebook Ads")});' + "".join(
        f'up(q(".t{k} .c1"), {c.cue(w)}); pop(q(".t{k} .c2"), {c.cue(w)} + .1); pop(q(".t{k} .c3"), {c.cue(w)} + .25);' for k, (_, w) in enumerate(rows)) + \
        f'pop(q(".cap"), {c.cue("Ou peye pou rezilta")});'
    return body, css, js


def where(c):
    body = f"""
    <div class="h2 ttl">Kote moun ki ka <span class="acc">achte</span> ou yo ye · kote ou ka <span class="acc">delivre</span></div>
    <div class="card gh l"><div class="lab">Pwodwi fizik</div><div class="map"><div class="ring r2"></div><div class="ring r1"></div><div class="pin">{icon('map-pin', 70, ACC, 2.4)}</div></div>
      <div class="nm">Pòtoprens + zòn livrezon</div></div>
    <div class="card gh r"><div class="lab">Pwodwi dijital</div><div class="glob">{icon('globe', 170, LINE, 1.2)}</div>
      <div class="cs"><span class="pill x0">Ozetazini</span><span class="pill x1">Kanada</span><span class="pill x2">Lafrans</span></div>
      <div class="warn pill">{icon('badge-dollar-sign', 30, '#fff')} Pi chè pou yo wè w</div></div>"""
    css = f"""
    & .ttl {{ position: absolute; left: 160px; top: 170px; font-size: 44px; }}
    & .l, & .r {{ top: 290px; width: 760px; height: 480px; padding: 40px; }} & .l {{ left: 160px; }} & .r {{ left: 1000px; }}
    & .map {{ position: relative; height: 290px; }}
    & .ring {{ position: absolute; left: 50%; top: 50%; border-radius: 50%; border: 4px dashed {ACC}; transform: translate(-50%,-50%); }}
    & .r1 {{ width: 170px; height: 170px; background: rgba(217,119,87,.10); }} & .r2 {{ width: 290px; height: 290px; opacity: .5; }}
    & .pin {{ position: absolute; left: 50%; top: 50%; transform: translate(-50%,-70%); }}
    & .nm {{ text-align: center; font: 700 30px/1 "Inter"; }}
    & .glob {{ display: flex; justify-content: center; margin: 10px 0; }}
    & .cs {{ display: flex; gap: 14px; justify-content: center; }} & .cs .pill {{ background: #F2EEE7; font-size: 26px; }}
    & .warn {{ position: absolute; left: 50%; bottom: 34px; transform: translateX(-50%); background: {WARN}; color: #fff; font-size: 26px; white-space: nowrap; }}"""
    js = f"""up(q(".ttl"), {c.cue('Règ la')});
    pop(q(".l"), {c.cue('pwodwi fizik')}); tl.fromTo(q(".pin"), {{ y: -80, opacity: 0 }}, {{ y: 0, opacity: 1, duration: .5, ease: "bounce.out" }}, {c.cue('Pòtoprens')});
    tl.fromTo(qa(".ring"), {{ scale: 0 }}, {{ scale: 1, duration: .7, ease: "expo.out", stagger: .12 }}, {c.cue('zòn kote')});
    pop(q(".r"), {c.cue('pwodwi dijital')}); pop(q(".x0"), {c.cue('Ozetazini')}); pop(q(".x1"), {c.cue('Kanada')}); pop(q(".x2"), {c.cue('Lafrans')});
    pop(q(".warn"), {c.cue('pi chè')});"""
    return body, css, js


def recap(c, items, nxt):
    """items: [(icon, text, cue)], nxt: teaser of the next video (or None)"""
    rows = "".join(f'<div class="it gh i{k}"><span>{icon(ic, 40, "#fff")}</span>{t}</div>' for k, (ic, t, _) in enumerate(items))
    nx = f'<div class="card nx"><div class="lab">Pwochen videyo</div><div class="h2">{nxt[0]}</div></div>' if nxt else ""
    body = f'<div class="h1 ttl">An rezime</div><div class="lst">{rows}</div>{nx}'
    css = f"""
    & .ttl {{ position: absolute; left: 160px; top: 170px; }}
    & .lst {{ position: absolute; left: 160px; top: 320px; width: 1000px; }}
    & .it {{ display: flex; align-items: center; gap: 24px; font: 600 34px/1.25 "Inter"; margin-bottom: 30px; }}
    & .it span {{ flex: none; width: 76px; height: 76px; border-radius: 22px; background: {INK}; display: flex; align-items: center; justify-content: center; }}
    & .nx {{ left: 1240px; top: 380px; width: 520px; padding: 44px; background: {INK}; color: #fff; }} & .nx .lab {{ color: {ACC}; margin-bottom: 18px; }}"""
    js = f'up(q(".ttl"), {c.at(0)});' + "".join(f'up(q(".i{k}"), {c.cue(w)});' for k, (_, _, w) in enumerate(items)) + \
        (f'pop(q(".nx"), {c.cue(nxt[1])});' if nxt else "")
    return body, css, js


TEMPLATES = {
    "hook": hook, "plan": plan, "law": law, "funnel": funnel, "levers": levers, "measure": measure, "attention": attention,
    "auction": auction, "compare": compare, "where": where,
    "recap@1.11": lambda c: recap(c, [("repeat", "Yon vant: wè, enterese, aji", "Yon vant"), ("gavel", "Facebook vann atansyon nan yon enchè", "Facebook vann"),
                                      ("trophy", "Kalite piblisite a konte otan ke lajan an", "konte otan"), ("map-pin", "Vize kote moun achte, kote w ka delivre", "ki kote w fè")],
                                  ("Kòman Facebook Ads mache anndan l", "pwochen videyo")),
}
