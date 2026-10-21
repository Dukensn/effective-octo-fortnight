"""Episode 3 templates: chif yo (one running example: a 25 $ bag, 20 $ spent, 5 000 impressions, 4 000 reached, 100 clicks, 4 sales)."""
from engine import icon, INK, INK2, MUTE, LINE, ACC, ACCD, ACCP, GOOD, WARN, BAD, FB, WA
from scenes_ep1 import recap

EX = [("Depans", "20 $", "wallet"), ("Enpresyon", "5 000", "eye"), ("Moun touche", "4 000", "users"), ("Klik", "100", "mouse-pointer-click"), ("Vant", "4", "shopping-cart")]


def strip(active=None):
    """the running example, small, at the top of every metric scene"""
    return '<div class="ex">' + "".join(f'<div class="x{" on" if k == active else ""}">{icon(ic, 26, ACC if k == active else MUTE)}<span>{l}</span><b>{v}</b></div>'
                                        for k, (l, v, ic) in enumerate(EX)) + "</div>"


STRIP_CSS = f"""
    & .ex {{ position: absolute; left: 160px; right: 160px; top: 130px; display: flex; gap: 14px; }}
    & .x {{ flex: 1; display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,.7); border-radius: 16px; padding: 12px 16px; font: 600 20px/1 "Inter"; color: {MUTE}; }}
    & .x b {{ margin-left: auto; font: 800 24px/1 "Inter"; color: {INK2}; }} & .x.on {{ background: #fff; box-shadow: 0 0 0 3px {ACC}; }} & .x.on b {{ color: {INK}; }}"""

METRIC_CSS = STRIP_CSS + f"""
    & .mc {{ left: 160px; top: 250px; width: 900px; padding: 46px 52px; }}
    & .mc .term {{ font: 900 96px/1 "InterD"; letter-spacing: -2px; }} & .mc .full {{ font: 700 26px/1 "Inter"; color: {ACCD}; letter-spacing: 1px; margin: 12px 0 18px; }}
    & .mc .def {{ font: 500 32px/1.35 "Inter"; color: {INK2}; }}
    & .fm {{ margin-top: 30px; display: flex; align-items: center; flex-wrap: wrap; gap: 14px; font: 800 38px/1 "Inter"; }}
    & .fm .op {{ color: {MUTE}; }} & .fm .rs {{ background: {INK}; color: #fff; padding: 14px 22px; border-radius: 18px; }}
    & .side {{ position: absolute; left: 1120px; top: 250px; width: 640px; }}"""


def metric_card(term, full, definition, formula_parts, result):
    fm = "".join(f'<span class="f{k}{" op" if p in ("÷", "×", "=") else ""}">{p}</span>' for k, p in enumerate(formula_parts))
    return (f'<div class="card gh mc"><div class="term">{term}</div><div class="full">{full}</div><div class="def">{definition}</div>'
            f'<div class="fm">{fm}<span class="rs">{result}</span></div></div>')


def fm_js(c, cue, n):
    return f'tl.fromTo(qa(".fm > span"), {{ opacity: 0, y: 20 }}, {{ opacity: 1, y: 0, duration: .3, stagger: .18, ease: "expo.out" }}, {cue});'


def numbers(c):
    terms = ["CPM", "CTR", "CPC", "ROAS", "CPA", "Frekans", "Enpresyon", "Reach", "CPL", "Hook rate", "ThruPlay", "Relevance", "Klik", "Vant"]
    keep = {"CPM", "CTR", "CPC", "ROAS", "CPA", "Frekans", "Enpresyon", "Klik"}
    pos = [(260, 260), (620, 210), (980, 280), (1360, 230), (300, 470), (700, 430), (1100, 500), (1480, 450), (420, 650), (840, 640), (1240, 690), (1560, 640), (160, 380), (1650, 330)]
    t = "".join(f'<div class="tm{" k" if w in keep else ""}" style="left:{x}px; top:{y}px">{w}</div>' for w, (x, y) in zip(terms, pos))
    body = f'{t}<div class="cap pill">Ou bezwen sèlman kèk ladan yo</div>'
    css = f"""& .tm {{ position: absolute; font: 900 52px/1 "InterD"; color: {LINE}; }} & .tm.k {{ color: {INK}; }}
    & .cap {{ position: absolute; left: 50%; top: 840px; transform: translateX(-50%); background: {ACC}; color: #fff; font-size: 32px; }}"""
    js = f"""tl.fromTo(qa(".tm"), {{ opacity: 0, scale: .6 }}, {{ opacity: 1, scale: 1, duration: .4, stagger: {{ each: .06, from: "random" }}, ease: "back.out(2)" }}, {c.at(0.02)});
    tl.to(qa(".tm:not(.k)"), {{ opacity: .25, scale: .85, duration: .4 }}, {c.cue('sèlman kèk')});
    tl.to(qa(".tm.k"), {{ color: "{ACC}", duration: .3, stagger: .06 }}, {c.cue('sèlman kèk')});
    pop(q(".cap"), {c.cue('sèlman kèk')});"""
    return body, css, js


def example(c):
    cols = "".join(f'<div class="cl c{k}"><div class="lab">{l}</div><div class="v num">{v}</div></div>' for k, (l, v, _) in enumerate(EX[1:]))
    body = f"""<div class="card pr"><div class="bag">{icon('shopping-cart', 80, ACC)}</div><div><div class="lab">Pwodwi</div><div class="h2">Yon sak · 25 $</div></div></div>
      <div class="card bd"><div class="lab">Depans piblisite</div><div class="h2 num">20 $</div></div>
      <div class="card tb"><div class="hd">{icon('brand-meta', 30, FB)} Ads Manager · Rezilta</div><div class="rw">{cols}</div></div>"""
    css = f"""
    & .pr {{ left: 160px; top: 200px; width: 760px; padding: 36px; display: flex; align-items: center; gap: 30px; }}
    & .bag {{ width: 140px; height: 140px; border-radius: 30px; background: {ACCP}; display: flex; align-items: center; justify-content: center; }}
    & .bd {{ left: 1000px; top: 200px; width: 760px; padding: 50px 44px; }}
    & .tb {{ left: 160px; top: 470px; width: 1600px; padding: 34px 44px; }}
    & .hd {{ display: flex; align-items: center; gap: 12px; font: 800 26px/1 "Inter"; color: {INK2}; margin-bottom: 24px; }}
    & .rw {{ display: flex; }} & .cl {{ flex: 1; border-left: 2px solid #EDE9E2; padding: 6px 24px; }} & .cl:first-child {{ border: 0; padding-left: 0; }}
    & .cl .v {{ font: 900 76px/1 "InterD"; margin-top: 14px; }}"""
    js = f"""pop(q(".pr"), {c.cue('sak')}); pop(q(".bd"), {c.cue('ven dola')}); pop(q(".tb"), {c.cue('Ads Manager')});
    up(q(".c0"), {c.cue('senk mil')}); up(q(".c1"), {c.cue('kat mil')}); up(q(".c2"), {c.cue('san klik')}); up(q(".c3"), {c.cue('kat vant')});"""
    return body, css, js


def reach(c):
    eyes = "".join(f'<i class="e" style="left:{(k % 10) * 54}px; top:{(k // 10) * 54}px"></i>' for k in range(50))
    body = strip(2) + metric_card("Frekans", "ENPRESYON ÷ MOUN TOUCHE", "Konbyen fwa an mwayèn yon menm moun wè piblisite a.", ["5 000", "÷", "4 000", "="], "1,25") + \
        f"""<div class="side"><div class="card gz"><div class="lab">Frekans</div><div class="sc"><div class="z ok">1 – 3 · nòmal</div><div class="z ko">&gt; 3 · bouke</div></div>
        <div class="mk"><b>1,25</b></div></div><div class="card ey"><div class="lab">1 pwen = 100 enpresyon</div><div class="eg">{eyes}</div></div></div>"""
    css = METRIC_CSS + f"""
    & .gz {{ position: relative; padding: 34px; }} & .sc {{ display: flex; margin-top: 22px; height: 70px; border-radius: 16px; overflow: hidden; font: 700 22px/70px "Inter"; color: #fff; text-align: center; }}
    & .z.ok {{ flex: 2; background: {GOOD}; }} & .z.ko {{ flex: 1.3; background: {BAD}; }}
    & .mk {{ position: absolute; left: 70px; top: 150px; }} & .mk b {{ display: inline-block; background: {INK}; color: #fff; font: 800 26px/1 "Inter"; padding: 10px 14px; border-radius: 10px; }}
    & .ey {{ margin-top: 30px; padding: 30px; }} & .eg {{ position: relative; height: 270px; margin-top: 16px; }}
    & .e {{ position: absolute; width: 36px; height: 36px; border-radius: 50%; background: {INK}; }}"""
    js = f"""pop(q(".mc"), {c.cue('ENPRESYON')}); tl.fromTo(qa(".e"), {{ opacity: 0, scale: 0 }}, {{ opacity: 1, scale: 1, duration: .25, stagger: .015 }}, {c.cue('ENPRESYON')} + .3);
    pop(q(".ey"), {c.cue('ENPRESYON')}); tl.to(qa(".e").slice(40), {{ backgroundColor: "{ACC}", duration: .3, stagger: .03 }}, {c.cue('plis pase yon fwa')});
    {fm_js(c, c.cue('FREKANS'), 4)} pop(q(".gz"), {c.cue('depase twa')}); pulse(q(".z.ko"), {c.cue('bouke')});"""
    return body, css, js


def cpm(c):
    body = strip(0) + metric_card("CPM", "KOU POU MIL ENPRESYON", "Pri ou peye pou piblisite a parèt 1 000 fwa. Se pri atansyon an.",
                                  ["20 $", "÷", "5 000", "×", "1 000", "="], "4 $") + \
        f"""<div class="side"><div class="card gh cmp"><div class="lab">Plis konkirans → CPM pi wo</div>
        <div class="bars"><div class="b b0"><div class="f"></div><span>Ayiti</span></div><div class="b b1"><div class="f"></div><span>Ozetazini</span></div></div></div></div>"""
    css = METRIC_CSS + f"""
    & .cmp {{ padding: 36px; }} & .bars {{ display: flex; align-items: flex-end; gap: 70px; height: 380px; justify-content: center; margin-top: 20px; }}
    & .b {{ width: 150px; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 14px; font: 800 28px/1 "Inter"; }}
    & .b .f {{ width: 100%; border-radius: 16px 16px 6px 6px; background: {INK}; }} & .b0 .f {{ height: 30%; }} & .b1 .f {{ height: 90%; background: {ACC}; }}"""
    js = f"""pop(q(".mc"), {c.cue('CPM')}); {fm_js(c, c.cue('ven divize'), 6)} pulse(q(".rs"), {c.cue('kat dola')});
    pop(q(".cmp"), {c.cue('konkirans')}); growY(q(".b0 .f"), {c.cue('Ozetazini')} - .4); growY(q(".b1 .f"), {c.cue('Ozetazini')});"""
    return body, css, js


def ctr(c):
    body = strip(3) + metric_card("CTR", "TO KLIK · NÒT PIBLISITE A", "Pousantaj moun ki klike, pami moun ki wè piblisite a.",
                                  ["100", "÷", "5 000", "×", "100", "="], "2 %") + \
        f"""<div class="side"><div class="card gh sc"><div class="lab">Repè jeneral</div>
        <div class="zs"><div class="z z0">Fèb<br><b>&lt; 1 %</b></div><div class="z z1">Kòrèk<br><b>1 – 2 %</b></div><div class="z z2">Bon<br><b>&gt; 2 %</b></div></div>
        <div class="pt">▲ ou la</div></div></div>"""
    css = METRIC_CSS + f"""
    & .sc {{ padding: 36px; }} & .zs {{ display: flex; gap: 10px; margin-top: 24px; }}
    & .z {{ flex: 1; border-radius: 18px; padding: 26px 10px; text-align: center; color: #fff; font: 700 26px/1.35 "Inter"; }} & .z b {{ font-size: 32px; }}
    & .z0 {{ background: {BAD}; }} & .z1 {{ background: {WARN}; }} & .z2 {{ background: {GOOD}; }}
    & .pt {{ margin: 18px 0 0 340px; font: 800 26px/1 "Inter"; color: {INK}; }}"""
    js = f"""pop(q(".mc"), {c.cue('CTR')}); {fm_js(c, c.cue('San klik sou'), 6)} pulse(q(".rs"), {c.cue('nòt piblisite')});
    pop(q(".sc"), {c.cue('Kòm repè')}); pop(q(".z0"), {c.cue('anba en')}); pop(q(".z1"), {c.cue('Ant en')}); pop(q(".z2"), {c.cue('Plis pase de')}); up(q(".pt"), {c.cue('Plis pase de')} + .3);"""
    return body, css, js


def cpc(c):
    body = strip(3) + metric_card("CPC", "KOU PA KLIK", "Konbyen chak klik koute w.", ["20 $", "÷", "100", "="], "0,20 $") + \
        f"""<div class="side"><div class="card gh ss"><div class="lab">CTR ↑ → CPC ↓</div>
        <svg width="560" height="320" viewBox="0 0 560 320"><polygon points="280,250 250,300 310,300" fill="{INK}"/>
        <g class="bm"><rect x="40" y="236" width="480" height="16" rx="8" fill="{INK2}"/>
        <g transform="translate(70 120)"><rect width="140" height="110" rx="20" fill="{GOOD}"/><text x="70" y="70" text-anchor="middle" font-family="Inter" font-weight="800" font-size="38" fill="#fff">CTR</text></g>
        <g transform="translate(350 120)"><rect width="140" height="110" rx="20" fill="{ACC}"/><text x="70" y="70" text-anchor="middle" font-family="Inter" font-weight="800" font-size="38" fill="#fff">CPC</text></g></g></svg>
        <div class="d">Yon pi bon piblisite → chak klik koute mwens</div></div></div>"""
    css = METRIC_CSS + f"& .ss {{ padding: 36px; text-align: center; }} & .ss .d {{ font: 600 28px/1.3 \"Inter\"; color: {INK2}; }}"
    js = f"""pop(q(".mc"), {c.cue('CPC')}); {fm_js(c, c.cue('Ven dola divize'), 4)}
    pop(q(".ss"), {c.cue('Retni')}); tl.fromTo(q(".bm"), {{ rotation: 0, svgOrigin: "280 244" }}, {{ rotation: 12, svgOrigin: "280 244", duration: .8, ease: "back.out(1.6)" }}, {c.cue('CTR ou monte')});"""
    return body, css, js


def cpa(c):
    body = strip(4) + metric_card("CPA", "KOU PA REZILTA", "Konbyen sa koute w pou chak rezilta: yon vant, yon mesaj, yon enskripsyon.",
                                  ["20 $", "÷", "4 vant", "="], "5 $") + \
        f"""<div class="side"><div class="card gh cv"><div class="lab">To konvèsyon</div><div class="pp">{''.join('<i></i>' for _ in range(100))}</div>
        <div class="r"><b>4</b> sou 100 klik = <b>4 %</b></div></div></div>"""
    css = METRIC_CSS + f"""
    & .cv {{ padding: 36px; }} & .pp {{ display: grid; grid-template-columns: repeat(20, 1fr); gap: 8px; margin: 24px 0; }}
    & .pp i {{ height: 22px; border-radius: 6px; background: #E6E1D8; }} & .r {{ font: 600 30px/1 "Inter"; color: {INK2}; }} & .r b {{ color: {INK}; font-weight: 900; }}"""
    js = f"""pop(q(".cv"), {c.cue('KONVÈSYON')}); tl.fromTo(qa(".pp i"), {{ opacity: 0 }}, {{ opacity: 1, duration: .2, stagger: .006 }}, {c.cue('San moun klike')});
    tl.to([qa(".pp i")[12], qa(".pp i")[37], qa(".pp i")[58], qa(".pp i")[83]], {{ backgroundColor: "{ACC}", duration: .3, stagger: .1 }}, {c.cue('kat achte')});
    pop(q(".mc"), {c.cue('KOU PA REZILTA')}); {fm_js(c, c.cue('Ven dola divize'), 4)}"""
    return body, css, js


def roas(c):
    body = strip() + metric_card("ROAS", "KÒB KI RANTRE ÷ KÒB PIBLISITE", "Konbyen kòb piblisite a fè rantre pou chak dola ou mete.",
                                 ["4 × 25 $", "=", "100 $", "÷", "20 $", "="], "5") + \
        f"""<div class="side"><div class="card gh pf"><div class="lab">ROAS se pa benefis</div>
        <div class="ln l0"><span>Benefis sou chak sak, anvan piblisite</span><b>10 $</b></div>
        <div class="ln l1"><span>Kou pa vant ou (CPA)</span><b>5 $</b></div>
        <div class="ok">{icon('check', 36, '#fff', 3)} CPA anba 10 $ → ou fè lajan</div></div></div>"""
    css = METRIC_CSS + f"""
    & .pf {{ padding: 36px; }} & .ln {{ display: flex; align-items: center; gap: 20px; height: 100px; border-top: 2px solid #EDE9E2; font: 600 27px/1.25 "Inter"; color: {INK2}; }}
    & .ln:first-of-type {{ margin-top: 18px; }} & .ln b {{ margin-left: auto; font: 900 46px/1 "InterD"; color: {INK}; white-space: nowrap; }}
    & .ok {{ margin-top: 20px; display: flex; align-items: center; gap: 12px; background: {GOOD}; color: #fff; border-radius: 18px; padding: 20px 24px; font: 800 28px/1.2 "Inter"; }}"""
    js = f"""pop(q(".mc"), {c.cue('ROAS')}); {fm_js(c, c.cue('Kat vant fwa'), 6)} pulse(q(".rs"), {c.cue('Chak dola fè')});
    pop(q(".pf"), {c.cue('ROAS se pa benefis')}); up(q(".l0"), {c.cue('dis dola benefis')}); up(q(".l1"), {c.cue('depi kou pa vant')}); pop(q(".ok"), {c.cue('ou fè lajan')});"""
    return body, css, js


def diagnose(c):
    rows = [("CPM twò wo", "Odyans twò sere, oswa gwo konkirans", "Elaji odyans lan", "CPM ou twò wo"),
            ("CTR ba", "Piblisite a pa kaptire atansyon", "Chanje imaj, videyo, premye fraz", "CTR ou ba"),
            ("CTR bon, men pa gen vant", "Pwoblèm nan apre klik la", "Pri, òf, sit, repons WhatsApp", "pa gen vant")]
    tr = "".join(f'<div class="rw r{k}"><div class="s">{icon("circle-alert", 34, BAD)}{a}</div><div class="ar">→</div><div class="cz">{b}</div><div class="ar">→</div><div class="fx">{icon("check", 30, GOOD, 3)}{cc}</div></div>'
                 for k, (a, b, cc, _) in enumerate(rows))
    body = f'<div class="card dg"><div class="hd"><span>Sentòm</span><span>Kòz</span><span>Sa pou w fè</span></div>{tr}</div>'
    css = f"""
    & .dg {{ left: 140px; top: 190px; width: 1640px; padding: 30px 46px; }}
    & .hd {{ display: grid; grid-template-columns: 460px 60px 470px 60px 1fr; font: 700 22px/1 "Inter"; letter-spacing: 3px; color: {MUTE}; text-transform: uppercase; padding-bottom: 16px; }}
    & .hd span:nth-child(2) {{ grid-column: 3; }} & .hd span:nth-child(3) {{ grid-column: 5; }}
    & .rw {{ display: grid; grid-template-columns: 460px 60px 470px 60px 1fr; align-items: center; height: 170px; border-top: 2px solid #EDE9E2; }}
    & .s {{ display: flex; align-items: center; gap: 14px; font: 800 32px/1.2 "Inter"; }} & .cz {{ font: 500 28px/1.3 "Inter"; color: {INK2}; }}
    & .fx {{ display: flex; align-items: center; gap: 12px; font: 700 28px/1.3 "Inter"; }} & .ar {{ font: 800 36px/1 "Inter"; color: {LINE}; text-align: center; }}"""
    js = f'pop(q(".dg"), {c.at(0)});' + "".join(
        f'up(q(".r{k} .s"), {c.cue(w)}); tl.fromTo(qa(".r{k} .ar, .r{k} .cz, .r{k} .fx"), {{ opacity: 0, x: -20 }}, {{ opacity: 1, x: 0, duration: .35, stagger: .25, ease: "expo.out" }}, {c.cue(w)} + .6);'
        for k, (_, _, _, w) in enumerate(rows))
    return body, css, js


def recap3(c):
    m = [("eye", "WÈ", "CPM", "pou pa twò chè"), ("mouse-pointer-click", "ENTERESE", "CTR", "nòt piblisite a"), ("shopping-cart", "AJI", "Konvèsyon · CPA", "kou pa rezilta")]
    cols = "".join(f'<div class="col gh k{k}"><div class="ci">{icon(ic, 70, "#fff")}</div><div class="w">{w}</div><div class="eq">↓</div><div class="mt">{mt}</div><div class="d">{d}</div></div>'
                   for k, (ic, w, mt, d) in enumerate(m))
    body = f'<div class="h2 ttl">Ou rekonèt lwa lavant lan?</div>{cols}<div class="nx pill">Pwochen videyo · kreye epi lanse piblisite ou</div>'
    css = f"""
    & .ttl {{ position: absolute; left: 160px; top: 170px; }}
    & .col {{ position: absolute; top: 300px; width: 460px; text-align: center; }} & .k0 {{ left: 200px; }} & .k1 {{ left: 730px; }} & .k2 {{ left: 1260px; }}
    & .ci {{ width: 150px; height: 150px; margin: 0 auto; border-radius: 50%; background: {INK}; display: flex; align-items: center; justify-content: center; }} & .k2 .ci {{ background: {ACC}; }}
    & .w {{ font: 900 52px/1 "InterD"; margin-top: 20px; }} & .eq {{ font: 800 40px/1 "Inter"; color: {LINE}; margin: 12px 0; }}
    & .mt {{ display: inline-block; background: #fff; border-radius: 16px; padding: 14px 22px; font: 800 36px/1 "Inter"; box-shadow: 0 10px 30px rgba(40,30,20,.10); }}
    & .d {{ font: 500 26px/1.3 "Inter"; color: {INK2}; margin-top: 14px; }}
    & .nx {{ position: absolute; left: 50%; top: 830px; transform: translateX(-50%); background: {INK}; color: #fff; font-size: 28px; }}"""
    js = f"""up(q(".ttl"), {c.at(0)});
    pop(q(".k0"), {c.cue('CPM mezire')}); pop(q(".k1"), {c.cue('CTR mezire')}); pop(q(".k2"), {c.cue('Konvèsyon ak kou')});
    pulse(qa(".mt"), {c.cue('Chak chif')}); pop(q(".nx"), {c.cue('dènye videyo')});"""
    return body, css, js


TEMPLATES = {"numbers": numbers, "example": example, "reach": reach, "cpm": cpm, "ctr": ctr, "cpc": cpc, "cpa": cpa, "roas": roas,
             "diagnose": diagnose, "recap@3.10": recap3}
