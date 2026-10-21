"""Episode 2 templates: kòman Facebook Ads mache anndan l."""
from engine import icon, INK, INK2, MUTE, LINE, ACC, ACCD, ACCP, GOOD, WARN, BAD, FB, WA
from scenes_ep1 import recap


def window(title, inner, cls="win"):
    return (f'<div class="card {cls}"><div class="wbar"><i></i><i></i><i></i><span>{title}</span></div><div class="wbody">{inner}</div></div>')


WIN_CSS = f"""
    & .wbar {{ height: 58px; display: flex; align-items: center; gap: 10px; padding: 0 22px; border-bottom: 2px solid #EDE9E2; }}
    & .wbar i {{ width: 14px; height: 14px; border-radius: 50%; background: {LINE}; }}
    & .wbar span {{ margin-left: 14px; font: 700 22px/1 "Inter"; color: {INK2}; }}
    & .wbody {{ position: relative; padding: 30px; }}"""


def manager(c):
    rows = "".join(f'<div class="rw w{k}"><span class="tg"></span><b>Kanpay {k + 1}</b><u></u><u></u><u></u></div>' for k in range(4))
    side = "".join(f'<i class="si"></i>' for k in range(6))
    body = f"""{window('Meta Ads Manager', f'<div class="side">{side}</div><div class="main"><div class="btn">+ Kreye</div>{rows}</div>', 'win')}
      <div class="card boost"><div class="bb">{icon('rocket', 34, '#fff')} Boost</div><div class="d">Pratik, men <b class="bad">limite</b></div></div>
      <div class="full pill">{icon('sliders-horizontal', 32, '#fff')} Tout kontwòl</div>"""
    css = WIN_CSS + f"""
    & .win {{ left: 520px; top: 170px; width: 1240px; height: 640px; overflow: hidden; }}
    & .side {{ position: absolute; left: 0; top: 0; bottom: 0; width: 90px; background: #F7F5F0; padding: 24px 22px; }}
    & .si {{ display: block; width: 46px; height: 46px; border-radius: 14px; background: #E6E1D8; margin-bottom: 22px; }}
    & .main {{ margin-left: 100px; }}
    & .btn {{ display: inline-block; background: {GOOD}; color: #fff; font: 800 26px/1 "Inter"; padding: 14px 22px; border-radius: 12px; margin-bottom: 24px; }}
    & .rw {{ display: flex; align-items: center; gap: 24px; height: 88px; border-top: 2px solid #EDE9E2; font: 700 26px/1 "Inter"; }}
    & .rw .tg {{ width: 50px; height: 28px; border-radius: 14px; background: {FB}; }} & .rw u {{ width: 130px; height: 14px; border-radius: 7px; background: #E6E1D8; }}
    & .rw b {{ width: 220px; }}
    & .boost {{ left: 140px; top: 330px; width: 320px; padding: 34px; text-align: center; }}
    & .bb {{ display: inline-flex; gap: 10px; align-items: center; background: {FB}; color: #fff; font: 800 30px/1 "Inter"; padding: 14px 24px; border-radius: 14px; }}
    & .boost .d {{ font: 500 26px/1.3 "Inter"; color: {INK2}; margin-top: 20px; }}
    & .full {{ position: absolute; left: 1020px; top: 840px; transform: translateX(-50%); background: {INK}; color: #fff; font-size: 30px; }}"""
    js = f"""pop(q(".win"), {c.cue('Meta Ads Manager')}); tl.fromTo(qa(".rw"), {{ opacity: 0, x: 30 }}, {{ opacity: 1, x: 0, duration: .4, stagger: .1, ease: "expo.out" }}, {c.cue('Meta Ads Manager')} + .4);
    pop(q(".boost"), {c.cue('Bouton Boost')}); pulse(q(".boost .bad"), {c.cue('limite')}); pop(q(".full"), {c.cue('tout kontwòl')});"""
    return body, css, js


def structure(c):
    body = f"""
    <div class="bx b0"><div class="hd">{icon('target', 40, '#fff')} 1 · KANPAY</div><div class="ds">Sa w vle: objektif ou</div>
      <div class="bx b1"><div class="hd">{icon('users', 36, '#fff')} 2 · ANSANM PIBLISITE</div><div class="ds">Kiyès · ki kote · konbyen kòb</div>
        <div class="bx b2"><div class="hd">{icon('image', 32, '#fff')} 3 · PIBLISITE</div><div class="ds">Imaj oswa videyo · tèks · bouton</div>
          <div class="ad"><i></i><u></u><b>Voye mesaj</b></div></div></div></div>"""
    css = f"""
    & .bx {{ position: absolute; border-radius: 30px; padding: 26px 34px; }}
    & .b0 {{ left: 190px; top: 160px; width: 1540px; height: 720px; background: {INK}; color: #fff; }}
    & .b1 {{ left: 60px; top: 150px; width: 1420px; height: 520px; background: #3D3A35; }}
    & .b2 {{ left: 60px; top: 140px; width: 1300px; height: 330px; background: {ACC}; }}
    & .hd {{ display: flex; align-items: center; gap: 14px; font: 800 34px/1 "Inter"; letter-spacing: 2px; }}
    & .ds {{ font: 500 28px/1 "Inter"; color: rgba(255,255,255,.75); margin-top: 14px; }}
    & .ad {{ position: absolute; right: 40px; top: 30px; width: 300px; height: 270px; background: #fff; border-radius: 20px; padding: 16px; }}
    & .ad i {{ display: block; height: 130px; border-radius: 12px; background: #E6E1D8; }} & .ad u {{ display: block; height: 16px; width: 70%; border-radius: 8px; background: #E6E1D8; margin: 16px 0; }}
    & .ad b {{ display: inline-block; background: {FB}; color: #fff; font: 700 20px/1 "Inter"; padding: 12px 16px; border-radius: 10px; }}"""
    js = f"""tl.fromTo(q(".b0"), {{ opacity: 0, scale: .92 }}, {{ opacity: 1, scale: 1, duration: .5, ease: "expo.out" }}, {c.cue('Premye nivo')});
    tl.fromTo(q(".b1"), {{ opacity: 0, scale: .9 }}, {{ opacity: 1, scale: 1, duration: .5, ease: "expo.out" }}, {c.cue('Dezyèm nivo')});
    tl.fromTo(q(".b2"), {{ opacity: 0, scale: .9 }}, {{ opacity: 1, scale: 1, duration: .5, ease: "expo.out" }}, {c.cue('Twazyèm nivo')});
    pop(q(".ad"), {c.cue('imaj la oswa')});"""
    return body, css, js


OBJ = [("megaphone", "Notoryete", "anpil moun wè w", "Notoryete"), ("mouse-pointer-click", "Trafik", "moun ale sou sit ou", "Trafik"),
       ("message-circle", "Angajman", "like, kòmantè, mesaj", "Angajman"), ("user-check", "Prospè", "non ak nimewo", "Prospè"),
       ("smartphone", "Aplikasyon", "telechaje app ou", "Pwomosyon aplikasyon"), ("shopping-cart", "Vant", "acha", "Ak Vant")]


def _obj_tiles(cls="ob"):
    return "".join(f'<div class="card {cls} o{k}" style="left:{200 + (k % 3) * 520}px; top:{260 + (k // 3) * 290}px"><div class="ic">{icon(ic, 54, INK)}</div>'
                   f'<div class="t">{t}</div><div class="d">{d}</div></div>' for k, (ic, t, d, _) in enumerate(OBJ))


OBJ_CSS = f"""
    & .ob {{ width: 480px; height: 240px; padding: 34px 38px; }}
    & .ob .t {{ font: 800 40px/1 "Inter"; margin: 18px 0 10px; }} & .ob .d {{ font: 500 26px/1.2 "Inter"; color: {INK2}; }}"""


def objectives(c):
    body = f'<div class="h2 ttl">6 objektif</div>{_obj_tiles()}<div class="cap pill">Facebook chèche egzakteman sa w mande l</div>'
    css = OBJ_CSS + f"& .ttl {{ position: absolute; left: 200px; top: 160px; }} & .cap {{ position: absolute; left: 50%; top: 860px; transform: translateX(-50%); background: {INK}; color: #fff; font-size: 30px; }}"
    js = f'up(q(".ttl"), {c.at(0)});' + "".join(f'pop(q(".o{k}"), {c.cue(w)});' for k, (_, _, _, w) in enumerate(OBJ)) + \
        f'pop(q(".cap"), {c.cue("enpòtan anpil")}); tl.to(qa(".ob"), {{ boxShadow: "0 0 0 4px {ACC}", duration: .25, stagger: .05 }}, {c.cue("kalite moun")});'
    return body, css, js


def whatsapp(c):
    body = f"""
    <div class="card ad"><div class="pg"><i></i><b>Boutik ou</b><span>Sponsorisé</span></div><div class="im">{icon('image', 90, LINE, 1.5)}</div>
      <div class="cta"><span>Ekri nou sou WhatsApp</span><b>{icon('brand-whatsapp', 26, '#fff')} Voye mesaj</b></div></div>
    <svg class="arw" width="220" height="60"><path d="M5 30 H190 M168 10 L195 30 L168 50" fill="none" stroke="{ACC}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <div class="card wa"><div class="wh">{icon('brand-whatsapp', 34, '#fff')} <b>Kliyan</b></div>
      <div class="m m0">Bonjou! Mwen wè piblisite a. Konbyen li koute?</div><div class="m m1 me">Bonjou! Li koute 25 dola. Ki kote w ye?</div></div>
    <div class="ch">
      <div class="pill k0" style="background:{GOOD};color:#fff">{icon('message-circle', 28, '#fff')} WhatsApp / Messenger → Angajman + mesaj</div>
      <div class="pill k1" style="background:{INK};color:#fff">{icon('globe', 28, '#fff')} Sit ki vann pou kont li → Vant</div>
      <div class="pill k2" style="background:{BAD};color:#fff">{icon('x', 28, '#fff', 3)} Pou vann: evite Notoryete</div></div>"""
    css = f"""
    & .ad {{ left: 170px; top: 170px; width: 520px; padding: 24px; }}
    & .pg {{ display: flex; align-items: center; gap: 12px; font: 700 24px/1 "Inter"; }} & .pg i {{ width: 46px; height: 46px; border-radius: 50%; background: {ACC}; }}
    & .pg span {{ font: 500 18px/1 "Inter"; color: {MUTE}; margin-left: auto; }}
    & .im {{ height: 260px; border-radius: 16px; background: #F2EEE7; margin: 20px 0; display: flex; align-items: center; justify-content: center; }}
    & .cta {{ display: flex; align-items: center; justify-content: space-between; font: 600 22px/1 "Inter"; color: {INK2}; }}
    & .cta b {{ display: inline-flex; gap: 8px; align-items: center; background: {WA}; color: #fff; padding: 12px 16px; border-radius: 12px; font: 800 22px/1 "Inter"; }}
    & .arw {{ position: absolute; left: 720px; top: 380px; }}
    & .wa {{ left: 970px; top: 170px; width: 780px; height: 470px; overflow: hidden; background: #ECE5DD; }}
    & .wh {{ display: flex; align-items: center; gap: 14px; background: #075E54; color: #fff; padding: 22px 28px; font: 800 28px/1 "Inter"; }}
    & .m {{ margin: 26px 28px 0; max-width: 560px; background: #fff; padding: 18px 22px; border-radius: 6px 20px 20px 20px; font: 500 26px/1.35 "Inter"; }}
    & .m.me {{ margin-left: auto; background: #D9FDD3; border-radius: 20px 6px 20px 20px; }}
    & .ch {{ position: absolute; left: 170px; top: 690px; display: flex; flex-direction: column; gap: 14px; }} & .ch .pill {{ font-size: 26px; }}"""
    js = f"""pop(q(".ad"), {c.cue('Si w vann sou WhatsApp')}); pop(q(".k0"), {c.cue('chwazi Angajman')});
    pulse(q(".cta b"), {c.cue('Moun yo klike')}); draw(".arw path", {c.cue('Moun yo klike')} + .2, .5);
    pop(q(".wa"), {c.cue('tonbe dirèkteman')}); up(q(".m0"), {c.cue('tonbe dirèkteman')} + .4); up(q(".m1"), {c.cue('pale avè w')});
    up(q(".k1"), {c.cue('sit ki ka vann')}); up(q(".k2"), {c.cue('evite Notoryete')});"""
    return body, css, js


def audience(c):
    body = f"""
    <div class="card pn"><div class="lab">Odyans</div>
      <div class="fl f0">{icon('map-pin', 34, ACC)}<b>Kote</b><span class="ch">Pòtoprens · +15 km</span></div>
      <div class="fl f1">{icon('users', 34, ACC)}<b>Laj · sèks</b><div class="rg"><div class="rk"></div><i class="h a"></i><i class="h b"></i></div><span class="ch">18 – 45 · Tout</span></div>
      <div class="fl f2">{icon('heart', 34, ACC)}<b>Enterè</b><span class="ch c0">Bote</span><span class="ch c1">Kizin</span><span class="ch c2">Fòmasyon</span></div></div>
    <div class="card cu"><div class="lab">Pita: moun ki deja konnen w</div>
      <div class="cr r0">{icon('message-circle', 32, INK2)} Moun ki te ekri w</div><div class="cr r1">{icon('play', 32, INK2)} Moun ki te gade videyo w</div></div>"""
    css = f"""
    & .pn {{ left: 170px; top: 170px; width: 1000px; padding: 40px 44px; }}
    & .fl {{ display: flex; align-items: center; gap: 18px; height: 140px; border-top: 2px solid #EDE9E2; font: 800 30px/1 "Inter"; }}
    & .fl b {{ width: 200px; }}
    & .ch {{ background: #F2EEE7; border-radius: 30px; padding: 12px 20px; font: 600 26px/1 "Inter"; }}
    & .rg {{ position: relative; width: 300px; height: 10px; border-radius: 5px; background: #E6E1D8; }}
    & .rk {{ position: absolute; left: 10%; right: 40%; top: 0; bottom: 0; background: {ACC}; border-radius: 5px; }}
    & .h {{ position: absolute; top: -9px; width: 28px; height: 28px; border-radius: 50%; background: #fff; border: 4px solid {ACC}; }} & .h.a {{ left: calc(10% - 14px); }} & .h.b {{ left: calc(60% - 14px); }}
    & .cu {{ left: 1230px; top: 300px; width: 520px; padding: 40px; }}
    & .cr {{ display: flex; align-items: center; gap: 14px; margin-top: 26px; font: 600 28px/1.2 "Inter"; }}"""
    js = f"""pop(q(".pn"), {c.at(0)}); up(q(".f0"), {c.cue('Kote')}); up(q(".f1"), {c.cue('Laj ak sèks')}); grow(q(".rk"), {c.cue('Laj ak sèks')} + .2);
    up(q(".f2"), {c.cue('enterè')}); pop(q(".c0"), {c.cue('bote')}); pop(q(".c1"), {c.cue('kizin')}); pop(q(".c2"), {c.cue('fòmasyon')});
    pop(q(".cu"), {c.cue('Pita')}); up(q(".r0"), {c.cue('te ekri w')}); up(q(".r1"), {c.cue('gade videyo')});"""
    return body, css, js


def broad(c):
    dots = "".join(f'<i style="left:{(k % 20) * 30}px; top:{(k // 20) * 30}px"></i>' for k in range(200))
    body = f"""
    <div class="card gg"><div class="lab">Gwosè odyans lan</div>
      <svg width="560" height="300" viewBox="0 0 560 300"><path d="M60 270 A220 220 0 0 1 280 50" fill="none" stroke="{BAD}" stroke-width="34"/>
      <path d="M280 50 A220 220 0 0 1 500 270" fill="none" stroke="{GOOD}" stroke-width="34"/>
      <g class="nd"><line x1="280" y1="270" x2="280" y2="80" stroke="{INK}" stroke-width="12" stroke-linecap="round"/></g><circle cx="280" cy="270" r="20" fill="{INK}"/></svg>
      <div class="lb"><span class="bad">Twò sere</span><span class="good">Bon gwosè</span></div></div>
    <div class="crowd">{dots}</div><div class="br pill">{icon('brain', 32, '#fff')} Piblisite a fè triyaj la</div>"""
    css = f"""
    & .gg {{ left: 170px; top: 220px; width: 640px; padding: 40px; text-align: center; }}
    & .lb {{ display: flex; justify-content: space-between; font: 800 28px/1 "Inter"; margin-top: 10px; }}
    & .crowd {{ position: absolute; left: 1000px; top: 230px; width: 600px; height: 300px; }}
    & .crowd i {{ position: absolute; width: 18px; height: 18px; border-radius: 50%; background: {LINE}; }}
    & .br {{ position: absolute; left: 1000px; top: 620px; background: {INK}; color: #fff; font-size: 30px; }}"""
    pick = [3, 27, 44, 61, 78, 95, 112, 133, 150, 171, 188]
    js = f"""pop(q(".gg"), {c.at(0)}); tl.fromTo(q(".nd"), {{ rotation: -70, svgOrigin: "280 270" }}, {{ rotation: -70, svgOrigin: "280 270", duration: .1 }}, {c.at(0)});
    tl.to(q(".nd"), {{ rotation: 55, svgOrigin: "280 270", duration: 1, ease: "expo.inOut" }}, {c.cue('ki pa twò piti')});
    tl.fromTo(qa(".crowd i"), {{ opacity: 0, scale: 0 }}, {{ opacity: 1, scale: 1, duration: .3, stagger: {{ each: .004, from: "random" }} }}, {c.cue('ki pa twò piti')});
    {"".join(f'tl.to(qa(".crowd i")[{k}], {{ backgroundColor: "{ACC}", scale: 1.6, duration: .25 }}, {c.cue("triyaj")} + {i * 0.05});' for i, k in enumerate(pick))}
    pop(q(".br"), {c.cue('triyaj')});"""
    return body, css, js


def budget(c):
    body = f"""
    <div class="card o0"><div class="bd">{icon('calendar', 40, '#fff')} REKOMANDE</div><div class="lab">Bidjè pa jou</div><div class="v"><span class="num">5</span> $ / jou</div><div class="d">Pi fasil pou kontwole</div></div>
    <div class="card o1"><div class="lab">Bidjè pou tout kanpay la</div><div class="v sm">Total + dat fen</div><div class="d">Facebook separe l sou jou yo</div></div>
    <div class="calc"><span class="pill">5 a 10 $ / jou</span><b>×</b><span class="pill">5 jou</span><b>=</b><span class="pill res">ase chif pou aprann</span></div>"""
    css = f"""
    & .o0, & .o1 {{ top: 210px; width: 640px; height: 400px; padding: 50px; }} & .o0 {{ left: 250px; outline: 5px solid {GOOD}; outline-offset: -5px; }} & .o1 {{ left: 1030px; }}
    & .bd {{ position: absolute; right: 30px; top: 30px; display: inline-flex; gap: 10px; align-items: center; background: {GOOD}; color: #fff; font: 800 20px/1 "Inter"; letter-spacing: 2px; padding: 10px 14px; border-radius: 12px; }}
    & .v {{ font: 900 96px/1 "InterD"; margin: 30px 0 18px; }} & .v.sm {{ font-size: 64px; }} & .d {{ font: 500 28px/1.3 "Inter"; color: {INK2}; }}
    & .calc {{ position: absolute; left: 0; right: 0; top: 700px; display: flex; justify-content: center; align-items: center; gap: 22px; }}
    & .calc .pill {{ background: #fff; box-shadow: 0 10px 30px rgba(40,30,20,.10); font-size: 32px; }} & .calc b {{ font: 900 44px/1 "InterD"; color: {MUTE}; }}
    & .calc .res {{ background: {INK}; color: #fff; }}"""
    js = f"""pop(q(".o0"), {c.cue('Yon bidjè pa jou')}); count(".o0 .num", 0, 5, {c.cue('senk dola')}, .5);
    pop(q(".o1"), {c.cue('Oswa yon bidjè')}); pop(q(".o0 .bd"), {c.cue('pi fasil')});
    tl.fromTo(qa(".calc > *"), {{ opacity: 0, y: 30 }}, {{ opacity: 1, y: 0, duration: .4, stagger: .15, ease: "expo.out" }}, {c.cue('senk a dis')});"""
    return body, css, js


def placements(c):
    pls = [("brand-facebook", "Fil Facebook", FB), ("brand-instagram", "Fil Instagram", "#E1306C"), ("smartphone", "Stories", ACC), ("play", "Reels", INK), ("brand-messenger", "Messenger", "#0084FF")]
    cards = "".join(f'<div class="card pl p{k}" style="left:{170 + k * 322}px"><div class="ph" style="--c:{col}">{icon(ic, 64, col)}</div><div class="t">{t}</div></div>' for k, (ic, t, col) in enumerate(pls))
    body = f"""{cards}<div class="sw"><div class="tg"><i></i></div><b>Plasman Advantage+</b><span>Facebook chwazi pou ou</span></div>"""
    css = f"""
    & .pl {{ top: 220px; width: 280px; height: 380px; padding: 24px; text-align: center; opacity: .35; }}
    & .ph {{ height: 260px; border-radius: 20px; border: 3px solid #EDE9E2; display: flex; align-items: center; justify-content: center; }}
    & .pl .t {{ font: 800 26px/1 "Inter"; margin-top: 20px; }}
    & .sw {{ position: absolute; left: 50%; top: 690px; transform: translateX(-50%); display: flex; align-items: center; gap: 22px; background: #fff; border-radius: 60px; padding: 18px 34px 18px 18px; box-shadow: 0 10px 30px rgba(40,30,20,.10); }}
    & .tg {{ width: 110px; height: 60px; border-radius: 30px; background: {LINE}; position: relative; }} & .tg i {{ position: absolute; left: 6px; top: 6px; width: 48px; height: 48px; border-radius: 50%; background: #fff; }}
    & .sw b {{ font: 800 32px/1 "Inter"; }} & .sw span {{ font: 500 26px/1 "Inter"; color: {INK2}; }}"""
    js = f"""tl.fromTo(qa(".pl"), {{ opacity: 0, y: 40 }}, {{ opacity: .35, y: 0, duration: .4, stagger: .12, ease: "expo.out" }}, {c.cue('Fil Facebook')});
    pop(q(".sw"), {c.cue('kite Facebook chwazi')}); tl.to(q(".tg"), {{ backgroundColor: "{GOOD}", duration: .3 }}, {c.cue('Advantage')});
    tl.to(q(".tg i"), {{ x: 50, duration: .3, ease: "power2.out" }}, {c.cue('Advantage')}); tl.to(qa(".pl"), {{ opacity: 1, duration: .4, stagger: .06 }}, {c.cue('Advantage')} + .2);"""
    return body, css, js


def learning(c):
    pts = [(0, 180), (60, 60), (120, 210), (180, 90), (240, 190), (300, 120), (360, 170), (420, 135), (480, 155), (540, 145), (600, 150), (700, 148), (800, 150)]
    d = "M" + " L".join(f"{x + 60} {y + 40}" for x, y in pts)
    body = f"""
    <div class="card ch"><div class="lab">Kou pa rezilta, jou apre jou</div>
      <svg width="940" height="320" viewBox="0 0 940 320"><rect x="60" y="20" width="480" height="270" rx="16" fill="{ACCP}" opacity=".6"/>
      <text x="80" y="60" font-family="Inter" font-weight="800" font-size="26" fill="{ACCD}">FAZ APRANTISAJ</text>
      <path class="ln" d="{d}" fill="none" stroke="{INK}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
    <div class="card pr"><div class="lab">Rezilta nan 7 jou</div><div class="v"><span class="num">0</span> / 50</div><div class="tr"><div class="fl"></div></div><div class="d">Apre ~50 rezilta: estab</div></div>"""
    css = f"""
    & .ch {{ left: 150px; top: 220px; width: 1040px; padding: 40px 50px; }}
    & .pr {{ left: 1260px; top: 300px; width: 500px; padding: 44px; }}
    & .pr .v {{ font: 900 90px/1 "InterD"; margin: 20px 0; }} & .tr {{ height: 24px; border-radius: 12px; background: #EDE9E2; overflow: hidden; }}
    & .fl {{ height: 100%; background: {GOOD}; border-radius: 12px; }} & .pr .d {{ font: 600 26px/1.3 "Inter"; color: {INK2}; margin-top: 18px; }}"""
    js = f"""pop(q(".ch"), {c.at(0)}); draw(".ln", {c.cue('Algoritm lan')}, 4.5);
    pop(q(".pr"), {c.cue('senkant rezilta')}); count(".pr .num", 0, 50, {c.cue('senkant rezilta')}, 1.6); grow(q(".fl"), {c.cue('senkant rezilta')}, 1.6);"""
    return body, css, js


def patience(c):
    days = "".join(f'<div class="card dy d{k}"><div class="lab">Jou {k + 1}</div>{icon("lock", 60, ACC) if False else icon("shield-check", 60, GOOD)}<div class="t">Pa manyen</div></div>' for k in range(3))
    body = f"""<div class="card bad0"><div class="lab">Chanje chak jou</div><div class="tr"><div class="fl"></div></div><div class="z">{icon('refresh-cw', 40, BAD)} Aprantisaj retounen a 0</div></div>
      {days}<div class="rule pill">Omwen 3 jou anvan ou jije</div>"""
    css = f"""
    & .bad0 {{ left: 170px; top: 200px; width: 1580px; padding: 34px 44px; }}
    & .bad0 .tr {{ height: 26px; border-radius: 13px; background: #EDE9E2; overflow: hidden; margin: 18px 0; }} & .bad0 .fl {{ height: 100%; width: 60%; background: {GOOD}; border-radius: 13px; }}
    & .z {{ display: flex; gap: 12px; align-items: center; font: 800 30px/1 "Inter"; color: {BAD}; opacity: 0; }}
    & .dy {{ top: 470px; width: 480px; height: 240px; padding: 34px; text-align: center; }} & .d0 {{ left: 170px; }} & .d1 {{ left: 720px; }} & .d2 {{ left: 1270px; }}
    & .dy .t {{ font: 800 32px/1 "Inter"; margin-top: 16px; }}
    & .rule {{ position: absolute; left: 50%; top: 780px; transform: translateX(-50%); background: {INK}; color: #fff; font-size: 32px; }}"""
    js = f"""pop(q(".bad0"), {c.at(0)}); grow(q(".bad0 .fl"), {c.at(0.05)}, 1.2);
    tl.to(q(".bad0 .fl"), {{ scaleX: 0, backgroundColor: "{BAD}", duration: .5, ease: "power3.in", transformOrigin: "0% 50%" }}, {c.cue('voye aprantisaj')});
    fade(q(".z"), {c.cue('voye aprantisaj')} + .4);
    tl.fromTo(qa(".dy"), {{ opacity: 0, y: 40 }}, {{ opacity: 1, y: 0, duration: .45, stagger: .25, ease: "expo.out" }}, {c.cue('Kite l woule')});
    pop(q(".rule"), {c.cue('twa jou')});"""
    return body, css, js


TEMPLATES = {
    "manager": manager, "structure": structure, "objectives": objectives, "whatsapp": whatsapp, "audience": audience, "broad": broad,
    "budget": budget, "placements": placements, "learning": learning, "patience": patience,
    "recap@2.11": lambda c: recap(c, [("target", "Kanpay: sa w vle", "Kanpay la"), ("users", "Ansanm: kiyès, ki kote, konbyen", "Ansanm piblisite a"),
                                      ("image", "Piblisite: sa moun yo wè", "Piblisite a, se"), ("timer", "Bon objektif, odyans laj, ti bidjè, pasyans", "Chwazi bon")],
                                  ("Chif yo: CPM, CPC, CTR ak lòt", "pwochen videyo")),
}
