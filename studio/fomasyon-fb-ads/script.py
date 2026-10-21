"""Fòmasyon Facebook Ads (Atelye Dijital): the narration, one entry per scene.

Source: programme du séminaire, Jour 1 (Bloc 2 « La loi de la vente et le marché publicitaire », Bloc 3 « Créer une vraie
publicité », Bloc 1 « la carte de débit virtuelle »). Kept: what a beginner needs to launch and read a campaign.
Left out on purpose: pixel/API set-up, A/B test tooling, attribution windows, bid caps (not useful on day one).

Each segment: (id, scene type, text). The client reads the text; the scene type picks the visual template (scenes.py).
Recording rule given to the client: one file per episode, 2 seconds of silence between two numbered parts.
"""

EPISODES = [
    ("Kòman yon vant fèt, ak kòman mache piblisite a mache", [
        ("1.1", "hook",
         "Chak jou, gen plis pase twa milya moun ki ouvri Facebook, Instagram oswa WhatsApp. Pami yo, gen kliyan ou yo. "
         "Pwoblèm nan se pa jwenn moun. Pwoblèm nan se jwenn BON moun yo, nan bon moman, ak bon mesaj la. "
         "Se sa Facebook Ads fè. Nan seri videyo sa a, n ap aprann li depi zewo, etap pa etap."),
        ("1.2", "plan",
         "Seri a gen kat videyo. Premye a: kòman yon vant fèt, ak kòman mache piblisite a mache. "
         "Dezyèm nan: kòman Facebook Ads mache anndan l. Twazyèm nan: chif yo, tankou CPM, CPC ak CTR. "
         "Katriyèm nan: kreye epi lanse premye piblisite ou."),
        ("1.3", "law",
         "Anvan nou touche Facebook, ann konprann kòman yon vant fèt. Pa gen vant san twa etap. "
         "Yon moun dwe WÈ ou. Li dwe ENTERESE ase pou l pwoche. Epi li dwe AJI, sa vle di achte. "
         "Wè, enterese, aji. Se lwa lavant lan."),
        ("1.4", "funnel",
         "Ann mete chif sou li. Si dis mil moun wè piblisite ou, epi de pousan ladan yo enterese ase pou yo klike, "
         "sa fè desan moun. Si senk pousan nan desan moun sa yo achte, ou fè dis vant. "
         "Vant ou yo, se moun ki wè, fwa pousantaj ki enterese, fwa pousantaj ki achte."),
        ("1.5", "levers",
         "Sa vle di gen twa bouton ou ka vire pou vann plis. Fè plis moun wè w. Fè plis moun enterese, "
         "avèk yon pi bon piblisite. Oswa fè plis moun achte, avèk yon pi bon òf, yon pi bon pri, "
         "oswa yon pi bon repons sou WhatsApp. Si youn nan twa bouton yo rete a zewo, tout vant ou yo rete a zewo."),
        ("1.6", "measure",
         "Maketing dijital la swiv menm lwa sa a, men ak yon diferans: chak etap ka mezire. "
         "Nan yon mache, ou pa konnen konbyen moun ki pase devan tab ou. Sou Facebook, ou konnen egzakteman "
         "konbyen moun ki wè, konbyen ki klike, ak konbyen ki ekri w. Se chif sa yo ki pral gide w."),
        ("1.7", "attention",
         "Kounye a, kòman mache piblisite a mache? Facebook pa vann pwodwi. Li vann ATANSYON. "
         "Chak fwa yon moun ap desann nan fil li, gen yon ti plas pou yon piblisite. Plizyè milye biznis vle menm plas sa a. "
         "Kidonk, Facebook fè yon enchè, yon vant alanchè, an yon fraksyon segonn, chak fwa."),
        ("1.8", "auction",
         "Men atansyon: se pa sa ki peye plis la ki toujou genyen. Facebook chwazi piblisite ki pral bay pi bon rezilta, "
         "pou moun nan ak pou li menm. Li konbine twa bagay: kòb ou dakò peye a, chans pou moun nan reyaji, "
         "ak kalite piblisite a. Sa vle di yon bon piblisite ka bat yon pi gwo bidjè."),
        ("1.9", "compare",
         "Konpare sa ak yon afich nan lari oswa yon spot radyo. Avèk Facebook Ads, ou chwazi KIYÈS ki wè w: kote yo rete, "
         "laj yo, sa yo renmen. Ou kòmanse ak ti kòb. Ou wè rezilta yo an tan reyèl. Epi ou ka kanpe oswa chanje nenpòt ki lè. "
         "Ou peye pou rezilta, pa pou espwa."),
        ("1.10", "where",
         "Dènye kesyon an: ki kote pou w fè piblisite a? Règ la senp. Fè l kote moun ki ka ACHTE ou yo ye, "
         "epi kote ou ka DELIVRE. Si w vann yon pwodwi fizik nan Pòtoprens, vize Pòtoprens ak zòn kote w ka livre. "
         "Si w vann yon pwodwi dijital, tankou yon fòmasyon oswa yon liv elektwonik, ou ka vize dyaspora a, "
         "Ozetazini, Kanada oswa Lafrans. Men konnen sa: la, pou moun yo wè w ap koute pi chè."),
        ("1.11", "recap",
         "An rezime. Yon vant, se wè, enterese, aji. Facebook vann atansyon nan yon enchè, kote kalite piblisite a "
         "konte otan ke lajan an. Epi ou chwazi ki kote w fè piblisite selon kiyès ki ka achte, ak ki kote ou ka delivre. "
         "Nan pwochen videyo a, n ap louvri Facebook Ads pou nou wè kòman li mache anndan l."),
    ]),
    ("Kòman Facebook Ads mache anndan l", [
        ("2.1", "manager",
         "Nan videyo sa a, n ap louvri Facebook Ads. Zouti nou pral itilize a rele Meta Ads Manager, "
         "jesyonè piblisite Meta a. Se la tout piblisite Facebook ak Instagram fèt. Bouton Boost ki sou paj ou a pratik, "
         "men li limite. Nan Ads Manager, ou gen tout kontwòl."),
        ("2.2", "structure",
         "Chak piblisite gen twa nivo, tankou yon bwat anndan yon bwat. Premye nivo a, se KANPAY la. "
         "Se la ou di Facebook sa w vle, objektif ou. Dezyèm nivo a, se ANSANM PIBLISITE a. Se la ou di kiyès ki dwe wè l, "
         "ki kote, ak konbyen kòb ou depanse. Twazyèm nivo a, se PIBLISITE a li menm: imaj la oswa videyo a, tèks la, ak bouton an."),
        ("2.3", "objectives",
         "Lè w kreye yon kanpay, Facebook mande w chwazi youn nan sis objektif. Notoryete, pou anpil moun wè w. "
         "Trafik, pou moun ale sou sit ou. Angajman, pou like, kòmantè, oswa mesaj. Prospè, pou ranmase non ak nimewo. "
         "Pwomosyon aplikasyon. Ak Vant. Objektif la enpòtan anpil, paske Facebook ap chèche egzakteman kalite moun ou mande l la."),
        ("2.4", "whatsapp",
         "Ki objektif pou w chwazi? Si w vann sou WhatsApp oswa sou Messenger, chwazi Angajman, ak mesaj kòm destinasyon. "
         "Moun yo klike, epi yo tonbe dirèkteman nan WhatsApp ou, pou yo pale avè w. Si w gen yon sit ki ka vann pou kont li, "
         "chwazi Vant. Epi evite Notoryete si sa w vle se vann: w ap jwenn anpil moun ki wè, men se pa kliyan."),
        ("2.5", "audience",
         "Nan nivo ansanm piblisite a, ou chwazi odyans ou. Twa bagay de baz. Kote: yon peyi, yon vil, oswa yon zòn otou yon adrès. "
         "Laj ak sèks. Epi enterè: sa moun yo renmen, tankou bote, kizin, oswa fòmasyon. "
         "Pita, ou ka vize moun ki deja konnen w: moun ki te ekri w, oswa ki te gade videyo w yo."),
        ("2.6", "broad",
         "Gen yon erè pou w evite: sere odyans lan twòp. Jodi a, algoritm Facebook la konnen jwenn bon moun yo "
         "pi byen pase nou. Ba l yon odyans ki pa twò piti, epi kite piblisite a fè triyaj la. "
         "Se piblisite ou la ki chwazi kliyan ou yo, pa sèlman sib la."),
        ("2.7", "budget",
         "Pou bidjè a, ou gen de chwa. Yon bidjè pa jou, pa egzanp senk dola pa jou. Oswa yon bidjè pou tout kanpay la, "
         "ak yon dat fen. Pou kòmanse, bidjè pa jou a pi fasil pou kontwole. Ou pa bezwen gwo kòb: ak senk a dis dola "
         "pa jou, pandan senk jou, ou gen ase chif pou aprann."),
        ("2.8", "placements",
         "Apre sa, gen plasman yo: kote piblisite a ap parèt. Fil Facebook, fil Instagram, Stories, Reels, Messenger. "
         "Pou kòmanse, kite Facebook chwazi pou ou. Sa rele plasman Advantage plus. "
         "Li pral mete kòb ou kote li bay pi bon rezilta."),
        ("2.9", "learning",
         "Lè w lanse, piblisite a antre nan sa yo rele FAZ APRANTISAJ. Algoritm lan ap teste: li montre l bay diferan moun, "
         "li gade kiyès ki reyaji, epi li ajiste. Pandan tan sa a, rezilta yo pa estab, e se nòmal. "
         "Facebook bezwen anviwon senkant rezilta nan yon semèn pou l soti nan faz sa a."),
        ("2.10", "patience",
         "Pi gwo erè debitan yo fè: yo chanje piblisite a chak jou. Chak gwo chanjman voye aprantisaj la tounen a zewo. "
         "Kite l woule omwen twa jou anvan ou jije l."),
        ("2.11", "recap",
         "An rezime. Kanpay la, se sa w vle. Ansanm piblisite a, se kiyès, ki kote, ak konbyen. Piblisite a, se sa moun yo wè. "
         "Chwazi bon objektif la, yon odyans ki pa twò sere, yon ti bidjè pa jou, epi gen pasyans pandan faz aprantisaj la. "
         "Nan pwochen videyo a, n ap aprann li chif yo."),
    ]),
    ("Chif yo: CPM, CPC, CTR ak lòt", [
        ("3.1", "numbers",
         "Facebook ba w anpil chif, e pifò moun pè yo. Men ou bezwen konprann sèlman kèk ladan yo pou w konnen "
         "si piblisite w la ap mache. Ann pran yo youn pa youn, ak yon sèl egzanp pou tout videyo a."),
        ("3.2", "example",
         "Imajine ou vann yon sak a vennsenk dola. Ou depanse ven dola nan piblisite. Men sa Ads Manager montre w: "
         "senk mil enpresyon, kat mil moun touche, san klik, ak kat vant. Ann dekode chak chif."),
        ("3.3", "reach",
         "ENPRESYON: konbyen fwa piblisite a parèt sou yon ekran. MOUN TOUCHE, oswa Couverture: konbyen moun diferan ki wè l. "
         "Senk mil enpresyon pou kat mil moun, sa vle di kèk moun wè l plis pase yon fwa. FREKANS lan, se senk mil divize pa kat mil: "
         "en vigil vennsenk. Si frekans lan depase twa oswa kat, moun yo ap bouke wè menm piblisite a."),
        ("3.4", "cpm",
         "CPM: pri pou mil enpresyon. Se pri atansyon an. Ou peye ven dola pou senk mil enpresyon: ven divize pa senk, "
         "sa fè kat dola pou chak mil. CPM depann sou konkirans lan. Plis biznis vle menm moun yo, plis CPM monte. "
         "Se poutèt sa CPM Ozetazini pi wo pase an Ayiti."),
        ("3.5", "ctr",
         "KLIK: konbyen moun ki klike sou lyen an oswa sou bouton an. CTR: pousantaj moun ki klike, pami moun ki wè. "
         "San klik sou senk mil enpresyon, sa fè de pousan. CTR se nòt piblisite w la. Li di w si imaj la, videyo a "
         "ak premye fraz la kaptire atansyon. Kòm repè: anba en pousan, se fèb. Ant en ak de pousan, se kòrèk. "
         "Plis pase de pousan, se bon."),
        ("3.6", "cpc",
         "CPC: pri chak klik. Ven dola divize pa san klik: vin santim pou chak klik. Retni relasyon sa a: "
         "lè CTR ou monte, CPC ou desann. Yon pi bon piblisite fè chak klik koute w mwens."),
        ("3.7", "cpa",
         "KONVÈSYON: aksyon final ou vle a. Yon acha, yon mesaj, oswa yon enskripsyon. San moun klike, kat achte: "
         "to konvèsyon an se kat pousan. Apre sa, gen KOU PA REZILTA, ke yo rele tou CPA: konbyen sa koute w pou chak rezilta. "
         "Ven dola divize pa kat vant: senk dola pa vant."),
        ("3.8", "roas",
         "ROAS: konbyen kòb piblisite a fè rantre pou chak dola ou mete. Kat vant fwa vennsenk dola, sa fè san dola. "
         "San divize pa ven: senk. Chak dola fè senk dola rantre. Men atansyon, ROAS se pa benefis. "
         "Kesyon ki pi enpòtan an, se: konbyen ou ka peye pou yon vant? Si chak sak ba w dis dola benefis anvan piblisite, "
         "depi kou pa vant ou rete anba dis dola, ou fè lajan."),
        ("3.9", "diagnose",
         "Kounye a, ou ka fè dyagnostik. Si CPM ou twò wo, odyans lan twò sere, oswa konkirans lan fò. "
         "Si CTR ou ba, se piblisite a ki pa kaptire: chanje imaj la, videyo a, oswa premye fraz la. "
         "Si CTR bon men pa gen vant, pwoblèm nan rive apre klik la: pri a, òf la, sit la, oswa jan w reponn sou WhatsApp."),
        ("3.10", "recap",
         "Ou rekonèt lwa lavant lan? CPM mezire si moun WÈ ou pou pa twò chè. CTR mezire si yo ENTERESE. "
         "Konvèsyon ak kou pa rezilta mezire si yo AJI. Chak chif montre w ki bouton pou w vire. "
         "Nan dènye videyo a, n ap kreye epi lanse premye piblisite ou."),
    ]),
    ("Kreye epi lanse premye piblisite ou", [
        ("4.1", "card",
         "Anvan w lanse, Facebook bezwen yon fason pou l touche kòb li. Li pran kat Visa oswa Mastercard ki ka peye sou entènèt "
         "an dola. Anpil kat bank lokal pa mache pou sa. Solisyon an, se yon kat debi vityèl: yon kat ki egziste sou telefòn ou, "
         "ou mete kòb sou li, epi ou anrejistre l nan Ads Manager. Prepare yon pyès idantite valab pou w kreye l: "
         "kat idantite, paspò, oswa lisans."),
        ("4.2", "hookrule",
         "Kounye a, piblisite a li menm. Se li ki fè pi fò nan travay la. Sou Facebook, moun yo ap desann vit. "
         "Ou gen apeprè twa segonn pou kenbe yo. Kidonk, premye segonn yo dwe montre pwoblèm nan oswa rezilta a "
         "dirèkteman. Pa kòmanse ak logo ou."),
        ("4.3", "video",
         "Pou yon videyo: kòmanse ak yon fraz oswa yon imaj ki kenbe moun. Montre pwodwi a an aksyon. "
         "Mete sou-tit, paske anpil moun gade san son. Epi fini ak yon aksyon klè, tankou: ekri nou sou WhatsApp. "
         "Fòma vètikal nèf sou sèz pou Reels ak Stories, oswa kat sou senk pou fil la. Ant kenz ak trant segonn, sa ase."),
        ("4.4", "poster",
         "Pou yon afich: yon sèl mesaj, yon imaj klè, pa twòp tèks sou imaj la, epi pri a oswa òf la byen vizib. "
         "Fòma kare, oswa kat sou senk. Prepare de oswa twa vèsyon diferan: se Facebook ki pral montre w kiyès ki pi bon."),
        ("4.5", "anatomy",
         "Tèks piblisite a gen twa pati. Tèks prensipal la, anlè: premye liy lan se tout bagay, paske se li sèlman "
         "moun wè anvan yo klike sou wè plis. Tit la: kout, ak benefis la. Epi bouton an: voye mesaj, achte, oswa enskri."),
        ("4.6", "steps",
         "Kounye a, ann pibliye, etap pa etap. Nan Ads Manager, klike sou Kreye. Chwazi objektif la. "
         "Nan ansanm piblisite a, chwazi kote mesaj yo ap ale, odyans lan, ak bidjè pa jou a. "
         "Nan piblisite a, chwazi paj ou, mete videyo oswa afich ou, tèks la, ak bouton an. "
         "Verifye tout bagay, epi klike sou Pibliye."),
        ("4.7", "review",
         "Facebook ap revize piblisite a, anjeneral nan kèk minit, rive nan vennkat è. Si li refize l, li di w poukisa. "
         "Souvan, se yon pwomès ki twò fò, tankou: fè mil dola nan yon semèn. Oswa yon tèks ki pale dirèkteman de yon "
         "karakteristik pèsonèl moun nan, tankou: ou twò gwo?"),
        ("4.8", "first72",
         "Apre lansman an, pa manyen anyen pandan omwen twa jou. Apre vennkat è, gade CPM ak CTR. "
         "Apre twa jou, gade kou pa rezilta a. Si CTR ba, chanje piblisite a. Si kou pa rezilta a anba limit ou, "
         "ogmante bidjè a dousman, pa plis pase ven pousan chak de oswa twa jou, pou w pa voye aprantisaj la tounen a zewo."),
        ("4.9", "final",
         "Ou fèk aprann baz Facebook Ads. Kòman yon vant fèt. Kòman platfòm nan mache. Kòman pou li chif yo. "
         "Epi kòman pou kreye ak lanse yon piblisite. Kounye a, se pratik ki pral fè diferans lan. "
         "Kòmanse piti, li chif ou yo, epi amelyore yon bouton alafwa."),
    ]),
]
