"""Episode 4 templates: kreye epi lanse premye piblisite ou."""
from engine import icon, INK, INK2, MUTE, LINE, ACC, ACCD, ACCP, GOOD, WARN, BAD, FB, WA


def card(c):
    body = f"""
    <div class="vc"><div class="chip"></div><div class="nm">KAT DEBI VITYÈL</div><div class="no">•••• •••• •••• 4821</div><div class="br">{icon('brand-visa', 70, '#fff')}{icon('brand-mastercard', 60, '#fff')}</div></div>
    <div class="card gh nb"><div class="lab">Kat bank lokal</div><div class="x">{icon('x', 44, BAD, 3)} Souvan pa mache sou entènèt an dola</div></div>
    <div class="flow"><span class="pill f0">{icon('smartphone', 30, INK)} Kat la sou telefòn ou</span><span class="pill f1">{icon('wallet', 30, INK)} Mete kòb sou li</span><span class="pill f2">{icon('credit-card', 30, INK)} Anrejistre l nan Ads Manager</span></div>
    <div class="card id"><div class="lab">Prepare yon pyès idantite</div><div class="ids"><span class="pill i0">{icon('id-card', 30, ACC)} Kat idantite</span><span class="pill i1">{icon('book-open', 30, ACC)} Paspò</span><span class="pill i2">{icon('id-card', 30, ACC)} Lisans</span></div></div>"""
    css = f"""
    & .vc {{ position: absolute; left: 180px; top: 200px; width: 620px; height: 380px; border-radius: 34px; padding: 44px; color: #fff;
      background: linear-gradient(135deg, #1B1A18 0%, #3D3A35 60%, #B5532F 140%); box-shadow: 0 40px 80px rgba(27,26,24,.30); }}
    & .chip {{ width: 90px; height: 66px; border-radius: 14px; background: linear-gradient(135deg, #E6C77E, #B8933F); }}
    & .nm {{ font: 800 26px/1 "Inter"; letter-spacing: 4px; margin-top: 40px; color: #E8E3DA; }} & .no {{ font: 600 40px/1 "Inter"; letter-spacing: 3px; margin-top: 24px; }}
    & .br {{ position: absolute; right: 40px; bottom: 34px; display: flex; gap: 16px; align-items: center; }}
    & .nb {{ left: 900px; top: 200px; width: 840px; padding: 34px 40px; }} & .nb .x {{ display: flex; align-items: center; gap: 14px; font: 700 30px/1.2 "Inter"; margin-top: 16px; }}
    & .flow {{ position: absolute; left: 900px; top: 400px; display: flex; flex-direction: column; gap: 16px; }} & .flow .pill {{ background: #fff; font-size: 28px; box-shadow: 0 10px 24px rgba(40,30,20,.08); }}
    & .id {{ left: 180px; top: 660px; width: 1560px; padding: 30px 40px; display: flex; align-items: center; gap: 40px; }}
    & .ids {{ display: flex; gap: 16px; }} & .ids .pill {{ background: {ACCP}; font-size: 28px; }}"""
    js = f"""pop(q(".nb"), {c.cue('Anpil kat bank')}); tl.fromTo(q(".vc"), {{ opacity: 0, rotationY: -60, x: -80 }}, {{ opacity: 1, rotationY: 0, x: 0, duration: .8, ease: "expo.out" }}, {c.cue('kat debi vityèl')});
    up(q(".f0"), {c.cue('egziste sou telefòn')}); up(q(".f1"), {c.cue('mete kòb')}); up(q(".f2"), {c.cue('anrejistre l')});
    pop(q(".id"), {c.cue('pyès idantite')}); pop(q(".i0"), {c.cue('kat idantite')}); pop(q(".i1"), {c.cue('paspò')}); pop(q(".i2"), {c.cue('lisans')});"""
    return body, css, js


def hookrule(c):
    posts = "".join('<div class="post"><i></i><u></u><u class="s"></u></div>' for _ in range(10))
    body = f"""<div class="phone"><div class="feed"><div class="scroll">{posts}</div></div></div>
    <div class="tm"><svg width="260" height="260" viewBox="0 0 260 260"><circle cx="130" cy="130" r="110" fill="#fff" stroke="#EDE9E2" stroke-width="18"/>
      <circle class="rg" cx="130" cy="130" r="110" fill="none" stroke="{ACC}" stroke-width="18" stroke-linecap="round" transform="rotate(-90 130 130)"/></svg><b class="num">3</b><span>segonn</span></div>
    <div class="cmp"><div class="card no"><div class="lab">Pa kòmanse ak</div><div class="h2">{icon('x', 40, BAD, 3)} Logo ou</div></div>
      <div class="card ye"><div class="lab">Kòmanse ak</div><div class="h2">{icon('check', 40, GOOD, 3)} Pwoblèm nan oswa rezilta a</div></div></div>"""
    css = f"""
    & .phone {{ position: absolute; left: 180px; top: 150px; width: 400px; height: 760px; border-radius: 56px; background: {INK}; padding: 18px; }}
    & .feed {{ width: 100%; height: 100%; border-radius: 40px; background: #F7F5F0; overflow: hidden; }}
    & .post {{ margin: 16px; height: 170px; border-radius: 18px; background: #fff; position: relative; }}
    & .post i {{ position: absolute; left: 14px; top: 14px; width: 40px; height: 40px; border-radius: 50%; background: {LINE}; }}
    & .post u {{ position: absolute; left: 66px; top: 22px; width: 160px; height: 12px; border-radius: 6px; background: #E6E1D8; }} & .post u.s {{ top: 74px; left: 14px; width: 300px; height: 80px; border-radius: 12px; }}
    & .tm {{ position: absolute; left: 700px; top: 220px; width: 260px; height: 260px; }} & .tm svg {{ position: absolute; inset: 0; }}
    & .tm b {{ position: absolute; left: 0; right: 0; top: 70px; text-align: center; font: 900 110px/1 "InterD"; }} & .tm span {{ position: absolute; left: 0; right: 0; top: 178px; text-align: center; font: 700 24px/1 "Inter"; color: {INK2}; }}
    & .cmp {{ position: absolute; left: 1060px; top: 220px; width: 700px; }} & .cmp .card {{ position: relative; padding: 34px 40px; margin-bottom: 30px; }}
    & .cmp .h2 {{ display: flex; align-items: center; gap: 14px; margin-top: 14px; font-size: 40px; }}"""
    L = 691
    js = f"""up(q(".phone"), {c.at(0)}); tl.fromTo(q(".scroll"), {{ y: 0 }}, {{ y: -1300, duration: 5, ease: "none" }}, {c.cue('desann vit')} - .5);
    pop(q(".tm"), {c.cue('twa segonn')}); tl.fromTo(q(".rg"), {{ strokeDasharray: {L}, strokeDashoffset: 0 }}, {{ strokeDashoffset: {L}, duration: 3, ease: "none" }}, {c.cue('twa segonn')});
    count(".tm b", 3, 0, {c.cue('twa segonn')}, 3, function (v) {{ return Math.ceil(v); }});
    pop(q(".ye"), {c.cue('montre pwoblèm')}); pop(q(".no"), {c.cue('Pa kòmanse')});"""
    return body, css, js


def video(c):
    segs = [("0 – 3 s", "Kwòk", "Yon fraz oswa yon imaj ki kenbe moun", "kenbe moun", ACC), ("", "Pwodwi an aksyon", "Montre l k ap travay", "an aksyon", INK),
            ("", "Sou-tit", "Anpil moun gade san son", "sou-tit", "#3D3A35"), ("", "Aksyon klè", "« Ekri nou sou WhatsApp »", "aksyon klè", GOOD)]
    tl_ = "".join(f'<div class="sg gh g{k}" style="background:{col}"><small>{a}</small><b>{t}</b><span>{d}</span></div>' for k, (a, t, d, _, col) in enumerate(segs))
    body = f"""<div class="lab ttl">Estrikti yon videyo piblisite</div><div class="tl">{tl_}</div>
    <div class="fmts"><div class="fm v"><div class="sh"></div><b>9:16</b><span>Reels · Stories</span></div><div class="fm p"><div class="sh"></div><b>4:5</b><span>Fil la</span></div>
      <div class="du pill">{icon('timer', 32, '#fff')} 15 – 30 segonn</div></div>"""
    css = f"""
    & .ttl {{ position: absolute; left: 160px; top: 170px; }}
    & .tl {{ position: absolute; left: 160px; top: 220px; width: 1600px; display: flex; gap: 12px; }}
    & .sg {{ flex: 1; border-radius: 22px; padding: 26px; color: #fff; height: 230px; display: flex; flex-direction: column; }} & .g0 {{ flex: .8; }}
    & .sg small {{ font: 700 20px/1 "Inter"; opacity: .8; height: 22px; }} & .sg b {{ font: 800 36px/1.1 "Inter"; margin: 12px 0; }} & .sg span {{ font: 500 24px/1.3 "Inter"; opacity: .9; }}
    & .fmts {{ position: absolute; left: 160px; top: 520px; width: 1600px; display: flex; align-items: flex-end; gap: 60px; }}
    & .fm {{ text-align: center; }} & .fm .sh {{ border: 6px solid {INK}; border-radius: 22px; background: #fff; margin: 0 auto 14px; }}
    & .v .sh {{ width: 160px; height: 284px; }} & .p .sh {{ width: 200px; height: 250px; }}
    & .fm b {{ display: block; font: 900 44px/1 "InterD"; }} & .fm span {{ font: 600 24px/1 "Inter"; color: {INK2}; }}
    & .du {{ margin-left: auto; margin-bottom: 40px; background: {INK}; color: #fff; font-size: 34px; }}"""
    js = f'up(q(".ttl"), {c.at(0)});' + "".join(f'tl.fromTo(q(".g{k}"), {{ opacity: G, y: 40 }}, {{ opacity: 1, y: 0, duration: .45, ease: "expo.out" }}, {c.cue(w)});' for k, (_, _, _, w, _) in enumerate(segs)) + \
        f'pop(q(".v"), {c.cue("nèf sou sèz")}); pop(q(".p"), {c.cue("kat sou senk")}); pop(q(".du"), {c.cue("kenz ak trant")});'
    return body, css, js


def poster(c):
    def ps(k, hl, col):
        return (f'<div class="card ps s{k}"><div class="im" style="background:{col}">{icon("image", 70, "#fff", 1.5)}</div><div class="hl">{hl}</div>'
                f'<div class="pr">25 $</div><div class="bt">Voye mesaj</div><div class="win">{icon("trophy", 30, "#fff")} Pi bon</div></div>')
    body = (f'<div class="rules"><span class="pill r0">1 sèl mesaj</span><span class="pill r1">Imaj klè</span><span class="pill r2">Pa twòp tèks</span><span class="pill r3">Pri / òf vizib</span></div>'
            + ps(0, "Sak an kwi, fèt a la men", ACC) + ps(1, "Sak pou chak okazyon", INK2) + ps(2, "-20 % semèn sa a", GOOD)
            + '<div class="fmt pill">Kare 1:1 · 4:5</div>')
    css = f"""
    & .rules {{ position: absolute; left: 160px; top: 170px; display: flex; gap: 14px; }} & .rules .pill {{ background: #fff; font-size: 28px; box-shadow: 0 10px 24px rgba(40,30,20,.08); }}
    & .ps {{ top: 290px; width: 420px; padding: 22px; }} & .s0 {{ left: 160px; }} & .s1 {{ left: 620px; }} & .s2 {{ left: 1080px; }}
    & .im {{ height: 260px; border-radius: 16px; display: flex; align-items: center; justify-content: center; }}
    & .hl {{ font: 800 30px/1.15 "Inter"; margin: 18px 0 10px; }} & .pr {{ font: 900 48px/1 "InterD"; color: {ACC}; }}
    & .bt {{ margin-top: 14px; background: {FB}; color: #fff; font: 700 22px/1 "Inter"; padding: 14px; border-radius: 12px; text-align: center; }}
    & .win {{ position: absolute; right: 16px; top: 16px; display: flex; gap: 8px; align-items: center; background: {GOOD}; color: #fff; padding: 10px 16px; border-radius: 24px; font: 800 22px/1 "Inter"; opacity: 0; }}
    & .fmt {{ position: absolute; left: 1560px; top: 470px; background: {INK}; color: #fff; font-size: 28px; }}"""
    js = f"""up(q(".r0"), {c.cue('yon sèl mesaj')}); up(q(".r1"), {c.cue('imaj klè')}); up(q(".r2"), {c.cue('pa twòp tèks')}); up(q(".r3"), {c.cue('pri a oswa')});
    pop(q(".s0"), {c.cue('yon sèl mesaj')}); pop(q(".fmt"), {c.cue('Fòma kare')});
    pop(q(".s1"), {c.cue('de oswa twa')}); pop(q(".s2"), {c.cue('de oswa twa')} + .25);
    pop(q(".s2 .win"), {c.cue('kiyès ki pi bon')}); tl.to(qa(".s0, .s1"), {{ opacity: .5, duration: .4 }}, {c.cue('kiyès ki pi bon')});"""
    return body, css, js


def anatomy(c):
    body = f"""
    <div class="card post"><div class="pg"><i></i><div><b>Boutik ou</b><small>Sponsorisé</small></div></div>
      <div class="pt"><span class="l1">Ou bouke chèche yon sak ki dire?</span> Sak nou yo fèt ak kwi, a la men, nan Pòtoprens... <u>Wè plis</u></div>
      <div class="im">{icon('image', 90, LINE, 1.5)}</div>
      <div class="ft"><div><small>WhatsApp</small><b class="hd">Sak an kwi · livrezon gratis</b></div><span class="bt">Voye mesaj</span></div></div>
    <div class="lb gh b0"><span>1</span><div><b>Tèks prensipal</b>Premye liy lan se tout bagay</div></div>
    <div class="lb gh b1"><span>2</span><div><b>Tit</b>Kout, ak benefis la</div></div>
    <div class="lb gh b2"><span>3</span><div><b>Bouton</b>Voye mesaj · Achte · Enskri</div></div>
    <svg class="ld" width="1920" height="1080"><path class="p0" d="M1010 330 H1180" /><path class="p1" d="M1000 805 H1180" /><path class="p2" d="M1120 805 V880 H1180" /></svg>"""
    css = f"""
    & .post {{ left: 380px; top: 170px; width: 700px; padding: 28px; }}
    & .pg {{ display: flex; gap: 14px; align-items: center; }} & .pg i {{ width: 56px; height: 56px; border-radius: 50%; background: {ACC}; }}
    & .pg b {{ display: block; font: 800 26px/1 "Inter"; }} & .pg small {{ font: 500 18px/1 "Inter"; color: {MUTE}; }}
    & .pt {{ font: 500 24px/1.4 "Inter"; color: {INK2}; margin: 18px 0; }} & .pt .l1 {{ color: {INK}; font-weight: 700; }} & .pt u {{ color: {MUTE}; text-decoration: none; font-weight: 700; }}
    & .im {{ height: 330px; border-radius: 12px; background: #F2EEE7; display: flex; align-items: center; justify-content: center; }}
    & .ft {{ display: flex; align-items: center; justify-content: space-between; background: #F7F5F0; border-radius: 0 0 12px 12px; padding: 18px; }}
    & .ft small {{ font: 500 18px/1 "Inter"; color: {MUTE}; }} & .ft b {{ display: block; font: 800 24px/1.2 "Inter"; margin-top: 6px; }}
    & .bt {{ background: #E6E1D8; font: 800 22px/1 "Inter"; padding: 14px 18px; border-radius: 10px; }}
    & .lb {{ position: absolute; left: 1190px; width: 560px; display: flex; gap: 18px; align-items: flex-start; font: 500 26px/1.35 "Inter"; color: {INK2}; }}
    & .lb span {{ flex: none; width: 54px; height: 54px; border-radius: 50%; background: {ACC}; color: #fff; display: flex; align-items: center; justify-content: center; font: 900 28px/1 "InterD"; }}
    & .lb b {{ display: block; font: 800 32px/1.1 "Inter"; color: {INK}; margin-bottom: 6px; }}
    & .b0 {{ top: 300px; }} & .b1 {{ top: 690px; }} & .b2 {{ top: 850px; }}
    & .ld {{ position: absolute; left: 0; top: 0; pointer-events: none; }} & .ld path {{ fill: none; stroke: {ACC}; stroke-width: 4; stroke-dasharray: 8 8; }}"""
    js = f"""pop(q(".post"), {c.at(0)});
    up(q(".b0"), {c.cue('Tèks prensipal')}); draw(".ld .p0", {c.cue('Tèks prensipal')}, .5); tl.to(q(".pt .l1"), {{ backgroundColor: "{ACCP}", duration: .3 }}, {c.cue('premye liy')});
    pulse(q(".pt u"), {c.cue('wè plis')});
    up(q(".b1"), {c.cue('Tit la')}); draw(".ld .p1", {c.cue('Tit la')}, .5); tl.to(q(".hd"), {{ color: "{ACC}", duration: .3 }}, {c.cue('Tit la')});
    up(q(".b2"), {c.cue('bouton an')}); draw(".ld .p2", {c.cue('bouton an')}, .5); tl.to(q(".bt"), {{ backgroundColor: "{FB}", color: "#fff", duration: .3 }}, {c.cue('voye mesaj')});"""
    return body, css, js


def steps(c):
    st = [("Kreye", "+ Kreye", "klike sou Kreye"), ("Objektif", "Angajman · mesaj", "Chwazi objektif"), ("Ansanm piblisite", "WhatsApp · odyans · 5 $/jou", "Nan ansanm piblisite"),
          ("Piblisite", "Paj · videyo · tèks · bouton", "Nan piblisite a"), ("Pibliye", "Verifye → Pibliye", "Verifye tout")]
    items = "".join(f'<div class="sp p{k}"><div class="n">{k + 1}</div><div class="t">{t}</div><div class="d">{d}</div></div>' for k, (t, d, _) in enumerate(st))
    body = f'<div class="h2 ttl">Pibliye, etap pa etap</div><div class="ln"><div class="fl"></div></div>{items}'
    css = f"""
    & .ttl {{ position: absolute; left: 160px; top: 170px; }}
    & .ln {{ position: absolute; left: 260px; right: 260px; top: 410px; height: 10px; border-radius: 5px; background: #E6E1D8; }} & .ln .fl {{ height: 100%; background: {ACC}; border-radius: 5px; transform-origin: 0 50%; transform: scaleX(0); }}
    & .sp {{ position: absolute; top: 350px; width: 300px; text-align: center; }} {''.join(f'& .p{k} {{ left: {110 + k * 350}px; }}' for k in range(5))}
    & .n {{ width: 130px; height: 130px; margin: 0 auto; border-radius: 50%; background: #fff; border: 8px solid #E6E1D8; display: flex; align-items: center; justify-content: center; font: 900 56px/1 "InterD"; color: {MUTE}; }}
    & .sp .t {{ font: 800 32px/1.1 "Inter"; margin-top: 24px; }} & .sp .d {{ font: 500 24px/1.3 "Inter"; color: {INK2}; margin-top: 10px; }}"""
    js = f'up(q(".ttl"), {c.at(0)}); tl.fromTo(qa(".sp"), {{ opacity: 0 }}, {{ opacity: .45, duration: .3, stagger: .05 }}, {c.at(0.02)});' + "".join(
        f'tl.to(q(".p{k}"), {{ opacity: 1, duration: .2 }}, {c.cue(w)}); tl.to(q(".p{k} .n"), {{ borderColor: "{ACC}", backgroundColor: "{ACC}", color: "#fff", duration: .3 }}, {c.cue(w)}); pulse(q(".p{k} .n"), {c.cue(w)});'
        f'tl.to(q(".ln .fl"), {{ scaleX: {k / 4:.2f}, duration: .5, ease: "power2.out" }}, {c.cue(w)});'
        for k, (_, _, w) in enumerate(st))
    return body, css, js


def review(c):
    body = f"""
    <div class="card st"><div class="lab">Estati piblisite a</div><div class="s0 pill">{icon('clock', 30, '#fff')} An revizyon</div><div class="s1 pill">{icon('check', 30, '#fff', 3)} Aktif</div>
      <div class="d">Kèk minit → 24 è</div></div>
    <div class="card rj"><div class="lab">Sa ki fè yo refize piblisite</div>
      <div class="rw r0">{icon('x', 34, BAD, 3)}<div><b>« Fè 1 000 $ nan yon semèn »</b>Pwomès twò fò</div></div>
      <div class="rw r1">{icon('x', 34, BAD, 3)}<div><b>« Ou twò gwo? »</b>Pale de yon karakteristik pèsonèl moun nan</div></div>
      <div class="ok">{icon('check', 30, GOOD, 3)} Si yo refize l, Facebook di w poukisa: korije epi soumèt li ankò</div></div>"""
    css = f"""
    & .st {{ left: 160px; top: 230px; width: 560px; padding: 40px; text-align: center; }}
    & .st .pill {{ display: flex; justify-content: center; margin: 26px auto 0; width: 360px; font-size: 32px; color: #fff; }} & .s0 {{ background: {WARN}; }} & .s1 {{ background: {GOOD}; }}
    & .st .d {{ font: 600 26px/1 "Inter"; color: {INK2}; margin-top: 26px; }}
    & .rj {{ left: 800px; top: 230px; width: 960px; padding: 40px; }}
    & .rw {{ display: flex; gap: 18px; align-items: flex-start; padding: 24px 0; border-top: 2px solid #EDE9E2; font: 500 26px/1.35 "Inter"; color: {INK2}; }}
    & .rw:first-of-type {{ margin-top: 18px; }} & .rw b {{ display: block; font: 800 32px/1.2 "Inter"; color: {INK}; margin-bottom: 6px; }}
    & .ok {{ display: flex; gap: 12px; align-items: center; margin-top: 16px; font: 700 26px/1.3 "Inter"; color: {GOOD}; }}"""
    js = f"""pop(q(".st"), {c.at(0)}); pop(q(".s0"), {c.at(0.02)}); pop(q(".s1"), {c.cue('vennkat è')});
    pop(q(".rj"), {c.cue('refize')}); up(q(".r0"), {c.cue('pwomès ki twò fò')}); up(q(".r1"), {c.cue('karakteristik pèsonèl')}); up(q(".ok"), {c.cue('di w poukisa')});"""
    return body, css, js


def first72(c):
    body = f"""
    <div class="tlx"><div class="bar"></div>
      <div class="mk m0"><b>0 è</b><span>Lansman</span></div><div class="mk m1"><b>24 è</b><span>Gade CPM ak CTR</span></div><div class="mk m2"><b>72 è</b><span>Gade kou pa rezilta</span></div>
      <div class="lock pill">{icon('shield-check', 30, '#fff')} Pa manyen anyen pandan 3 jou</div></div>
    <div class="dc">
      <div class="card gh d0"><div class="lab">Si CTR ba</div><div class="h2">{icon('refresh-cw', 40, ACC)} Chanje piblisite a</div></div>
      <div class="card gh d1"><div class="lab">Si kou pa rezilta anba limit ou</div><div class="h2">{icon('trending-up', 40, GOOD)} Ogmante bidjè a dousman</div><div class="rl">+20 % maksimòm, chak 2 a 3 jou</div></div></div>"""
    css = f"""
    & .tlx {{ position: absolute; left: 200px; top: 200px; width: 1520px; height: 260px; }}
    & .bar {{ position: absolute; left: 0; right: 0; top: 60px; height: 12px; border-radius: 6px; background: {INK}; transform-origin: 0 50%; }}
    & .mk {{ position: absolute; top: 20px; width: 360px; }} & .mk::before {{ content: ""; display: block; width: 52px; height: 52px; border-radius: 50%; background: {ACC}; border: 8px solid #F3F0EA; margin: 18px 0 0 -26px; }}
    & .m0 {{ left: 0; }} & .m1 {{ left: 33%; }} & .m2 {{ left: 100%; }} & .m2 {{ left: calc(100% - 0px); }}
    & .mk b {{ display: block; font: 900 48px/1 "InterD"; margin: 12px 0 0 -26px; }} & .mk span {{ display: block; font: 600 26px/1.2 "Inter"; color: {INK2}; margin: 8px 0 0 -26px; }}
    & .m2 b, & .m2 span {{ margin-left: -320px; text-align: right; width: 340px; }} & .m2::before {{ margin-left: -26px; }}
    & .lock {{ position: absolute; left: 50%; top: -40px; transform: translateX(-50%); background: {INK}; color: #fff; font-size: 28px; }}
    & .dc {{ position: absolute; left: 200px; top: 520px; width: 1520px; display: flex; gap: 40px; }} & .dc .card {{ position: relative; flex: 1; padding: 34px 40px; }}
    & .dc .h2 {{ display: flex; align-items: center; gap: 14px; margin-top: 14px; font-size: 38px; }} & .rl {{ font: 700 26px/1 "Inter"; color: {GOOD}; margin-top: 16px; }}"""
    js = f"""grow(q(".bar"), {c.at(0)}, 1); pop(q(".m0"), {c.at(0.01)}); pop(q(".lock"), {c.cue('pa manyen')});
    pop(q(".m1"), {c.cue('Apre vennkat')}); pop(q(".m2"), {c.cue('Apre twa jou')});
    pop(q(".d0"), {c.cue('Si CTR ba')}); pop(q(".d1"), {c.cue('anba limit')}); up(q(".rl"), {c.cue('ven pousan')});"""
    return body, css, js


def final(c):
    m = [("eye", "Kòman yon vant fèt", "Kòman yon vant"), ("layers", "Kòman platfòm nan mache", "Kòman platfòm"), ("chart-column", "Kòman pou li chif yo", "li chif yo"),
         ("rocket", "Kreye ak lanse yon piblisite", "kreye ak lanse")]
    cards = "".join(f'<div class="card gh m m{k}" style="left:{160 + k * 410}px">{icon(ic, 56, ACC)}<div class="t">{t}</div><div class="ck">{icon("check", 30, "#fff", 3)}</div></div>'
                    for k, (ic, t, _) in enumerate(m))
    body = f'<div class="h1 ttl">Ou fèk aprann baz Facebook Ads</div>{cards}<div class="rule"><span class="pill a">Kòmanse piti</span><span class="pill b">Li chif ou yo</span><span class="pill c">Amelyore yon bouton alafwa</span></div>'
    css = f"""
    & .ttl {{ position: absolute; left: 160px; top: 170px; font-size: 72px; }}
    & .m {{ top: 330px; width: 370px; height: 280px; padding: 36px; }} & .m .t {{ font: 800 32px/1.2 "Inter"; margin-top: 22px; }}
    & .ck {{ position: absolute; right: 24px; top: 24px; width: 54px; height: 54px; border-radius: 50%; background: {GOOD}; display: flex; align-items: center; justify-content: center; }}
    & .rule {{ position: absolute; left: 0; right: 0; top: 700px; display: flex; justify-content: center; gap: 18px; }} & .rule .pill {{ background: {INK}; color: #fff; font-size: 32px; }} & .rule .c {{ background: {ACC}; }}"""
    js = f'up(q(".ttl"), {c.at(0)});' + "".join(f'pop(q(".m{k}"), {c.cue(w)}); pop(q(".m{k} .ck"), {c.cue(w)} + .3);' for k, (_, _, w) in enumerate(m)) + \
        f'up(q(".rule .a"), {c.cue("Kòmanse piti")}); up(q(".rule .b"), {c.cue("li chif ou")}); up(q(".rule .c"), {c.cue("amelyore yon bouton")});'
    return body, css, js


TEMPLATES = {"card": card, "hookrule": hookrule, "video": video, "poster": poster, "anatomy": anatomy, "steps": steps, "review": review,
             "first72": first72, "final": final}
