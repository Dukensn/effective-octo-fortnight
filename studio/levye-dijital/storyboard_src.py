#!/usr/bin/env python3
"""Generates STORYBOARD.md from the frame data below + the word cues of onsets.json (frame-local seconds).

Edit the data here, then: python3 storyboard_src.py  (rewrites STORYBOARD.md). Bounds sit in voice silences.
"""
import json
import re
import unicodedata

from variant import DAT, SUFFIX, TOTAL, F19, remap

B0 = [0, 3.20, 9.75, 14.20, 20.30, 25.80, 31.90, 34.05, 41.10, 44.90, 47.15, 50.95, 56.95, 64.40, 70.05, 75.95,
      80.95, 84.45, 90.40, 94.20, 96.60, 101.05, 107.15, 115.70, 124.39]   # original voice montage
B = [round(remap(t), 2) for t in B0]
W = []
for w in json.load(open("onsets.json"))["words"]:
    if DAT == "B" and F19 <= w["s"] < 94.20:
        continue                                    # old date sentence, replaced below
    w = dict(w, s=round(remap(w["s"]), 2))
    if w["w"] == "levyedijital.vercel.app":
        w["w"] = "atelyedijital.vercel.app"
    W.append(w)
if DAT == "B":
    W += [{"w": a, "s": round(F19 + t, 2)} for a, t in [("Dat", .25), ("la", .47), ("se", .70), ("samdi", .82), ("24", 1.15),
          ("oktòb", 1.78), ("ak", 2.27), ("31", 2.46), ("oktòb", 3.09), ("2026", 3.57), ("la.", 4.32)]]
    W.sort(key=lambda w: w["s"])


def cues(i):
    a, b = B[i - 1], B[i]
    return " ".join(f"{w['w']}@{w['s'] - a:.2f}" for w in W if a <= w["s"] < b)


HEADER = """---
format: 1080x1920
duration: {TOTAL:.2f}s
message: "Claude te fè pub sa a ; aprann fè l ou menm nan Atelye Dijital : 2 jou fòmasyon, samdi 17 ak 24 oktòb 2026, Sassou's Lamadone Club."
arc: Preuve (la pub se monte devant nous) → Gag muet → Diagnostic (biznis, pwodwi, kreyatè) → Pivot → Marque → Programme (5 modules) → Infos (date, lè, lokal, plas) → CTA WhatsApp + lyen
audience: entrepreneurs, vendeurs et créateurs de contenu en Haïti, non techniques, sur WhatsApp
mode: autonomous
captions: disabled
voice: "assets/audio/voix-montage-atelye{SUFFIX}.wav ({TOTAL:.2f} s, créole haïtien, voix du client) ; minutage dans onsets.json ; le mix est monté par l'orchestrateur sur l'image"
direction: "B · Liy tan an (la bande de montage verticale), avec la fin de C (l'épingle qui se plante sur le Sassou's)"
patterns: ../patterns/STORYBOARD-CRAFT.md, ../patterns/PATTERNS.md
---

## Video direction

- **Un seul objet porte le film** : la bande de montage verticale de frame.md (reference/bande.html), posée sur le papier
  à points ; la caméra la DESCEND du début à la fin, comme on fait défiler un statut. Acte I : ses pistes Tèks / Imaj /
  Tranz. / Son / Mizik se remplissent au mot près pendant que la voix les nomme, sous un moniteur 9:16. Acte III : la même
  bande devient le PROGRAMME (stations Modil 1 à 5). Acte IV : sa règle devient le calendrier, la tête de lecture devient
  l'aiguille de l'horloge, puis la bande se replie en carte et l'épingle se plante sur le Sassou's ; fin sur le bouton
  WhatsApp et le lien.
- **Code commun** : `reference/bande.html` (bloc CSS, gabarits, kit LV) copié MOT POUR MOT ; GSAP en local
  `assets/vendor/gsap.min.js` (jamais le CDN). Seules images de la banque : `assets/img/sassou.png`, `assets/img/team.png`
  (+ l'épingle `assets/img/pin.png`) ; logos officiels `assets/icons/*.svg` ; tout le reste est construit en HTML/SVG.
- **Coutures invisibles** : `cut` partout, la continuité est un seul geste de caméra (descente de la bande) ou d'objet ; le
  `handoff_out` de N est recopié dans le `handoff_in` de N+1. Une seule coupe franche : 43.20 (noir du pivot).
- **Règles maison (prioritaires)** : sous-titre en bas au centre (bande y 1430 à 1640), 60 px, mot par mot ; une
  [boîte] par phrase, 4 [traits] dans le film ; une seule chose à regarder à la fois ; aucune tenue figée ; chaque image
  illustre littéralement sa phrase ; aucun chiffre inventé ; le curseur arrive et clique directement.
- **Négatifs** : diaporama, capture d'écran statique, emoji, deuxième accent, objet dédoublé, élément dans la bande du
  sous-titre, `repeat: -1`, `Math.random`.

**MONDE** (coordonnées monde en px, x 0 → 1080)
- Acte I (0 → 25.80) : moniteur 9:16 (x 360, y 60, 360x640), bande y 740 → 2600, couloirs Tèks/Imaj/Tranz./Son/Mizik
  (x 290 + 136·i, y 830 → 2500), couloir Vwa pleine largeur ajouté en y 1780 (frame 3) ; règle en timecodes 00:00…
- Acte II (25.80 → 43.20) : la bande continue y 2600 → 3600, ses stations sont trois « profils » (Biznis y 2800, Pwodwi
  y 3050, Kreyatè y 3350) posés sur la règle.
- Pivot (43.20 → 44.90) : noir #141312, la phrase, un point de lumière accent.
- Acte III (44.90 → 90.40) : la bande en clair, règle « MODIL 1…5 » : M1 Facebook Ads y 4200, M2 Ajan IA y 5300, M3 Pwodwi
  dijital y 6400, M4 Atelye y 7500, M5 Resous + gwoup y 8600.
- Acte IV (90.40 → 124.39) : règle calendrier « SAM 17 » y 9500, « SAM 24 » y 9800 ; horloge y 10200 ; la bande se replie
  en carte (frame 21) ; places, WhatsApp, lien, carte de fin sur la carte.
- Couleurs de rôle : accent #D97757 = boîte, trait, tête de lecture, anneau de l'épingle, anneau du clic ; couleurs des
  pistes seulement dans la bande ; couleurs de marque seulement dans les logos et les interfaces WhatsApp/Facebook.

**SIGNATURES**
- Mécanisme 1, « le clip tombe sur sa piste » (trop grand ×1,6 et flou 8 → posé en 0,14 s expo.out, rebond 4 px) :
  frame 2 (zouti 6.44, lojisyèl 7.63), frame 3 (vwa 12.94), frame 4 (tèks 16.81, imaj 17.83, tranzisyon 18.55,
  son 19.76), frame 5 (mizik 20.80) — 8 fois.
- Mécanisme 2, « la station s'ouvre sur la bande » (un trait accent de 2 px qui s'ouvre en carte) : M1 47.40, M2 57.10,
  M3 64.70, M4 76.10, M5 81.10, calendrier 90.70 — 6 fois.
- Pont : la tête de lecture accent (lit les clips → pointe les modules → aiguille de l'horloge → curseur du clic final).
- Rimes : la fenêtre Claude de l'ouverture revient en tuile dans M2 ; les 5 pistes pleines du début reviennent en
  miniature sur la carte de fin ; l'anneau de l'épingle = l'anneau du clic WhatsApp.

**PARTITION CAMÉRA** (temps globaux ; descente = y croissant)
- 0.00 dérive sur la fenêtre Claude · 3.20 la fenêtre rétrécit en moniteur, recul (s 1 → 0.82) · 9.75 cran sur le couloir
  Vwa · 14.20 descente sur les couloirs · 20.30 recul : tout le montage visible · 22.90 → 25.80 gag : la tête de
  lecture parcourt la bande, la caméra la suit vers le bas · 25.80 descente vers les profils (acte II) · 41.10 dézoom,
  la bande se coupe · 43.20 coupe au noir · 44.90 lumière : la bande en clair · 47.15 → 90.40 descente de station en
  station (crans de 0,5 s expo.inOut, dérive 15 px/s entre) · 90.40 cran sur la règle calendrier · 94.20 cran sur
  l'horloge · 96.60 la bande se replie en carte, plongée sur l'épingle · 101.05 recul sur les places · 107.15 cran sur
  le bouton · 115.70 recul final, carte de fin.

**VOIX** : silences > 0,4 s (chacun écrit comme un plan avec son action) : 1.66–2.12, 2.91–3.33, 6.91–7.36, 8.14–8.56,
9.56–10.00, 11.88–12.29, 13.80–14.36, 19.94–20.61, 22.86–25.90 (gag muet), 31.55–32.18, 33.54–34.13, 38.13–38.65,
40.45–41.42, 43.15–45.15 (pivot), 50.31–51.20, 56.20–57.12, 62.49–62.97, 64.19–64.65, 69.70–70.19, 74.86–76.13,
80.72–81.18, 89.76–90.65, 93.54–94.35, 100.56–101.17, 105.24–105.70, 106.84–107.26, 112.00–112.44, 115.49–115.95,
120.10–124.39 (carte de fin).

**COUPES** (voix narrative, quota 0 à 4) : une seule, 43.20 · silence du pivot · changement d'acte (le problème vers la
solution). Tout le reste : coutures de caméra ou d'objet.

**RYTHME** : acte I 9 plans en 25,8 s (≈ 3,5 / 10 s mais un événement toutes les 0,3 à 0,6 s) ; acte II plus lent ;
acte III une station par idée ; acte IV posé et lisible (les infos doivent se lire).

**SON** (l'image se cale dessus, temps globaux) : musique « tension » 0 → 43.20 (riser 40.20 → 43.20, impact grave 43.20,
silence), musique « élan » qui attaque sur « Se » 44.95 et s'éteint en fondu sur la carte de fin. Bruitages : pop sur
chaque clip qui tombe (6.44, 7.63, 12.94, 16.81, 17.83, 18.55, 19.76, 20.80) · whoosh court sur chaque cran de station
(47.30, 57.00, 64.55, 76.00, 81.00, 90.55) · notification à deux tons 22.66 (la pub est prête, LA signature) · clic
23.40 (lecture) · sparkle 45.00 · chime 46.28 (Atelye Dijital) · ticks 103.00 → 104.00 (les places s'allument) ·
clic 110.10 et 111.70 · chime 115.10 (numéro) · typing 118.90 → 119.80 (l'URL) · clic 120.40 · whoosh-cinematic 123.60.
"""

# (title, scene, voiceover, type, blueprint, focal, rules, world, handoff_out, scenes_text)
F = [
("Ak Claude", "La vraie fenêtre de l'app Claude (reconstruite en HTML) occupe la scène : la demande « Fè yon pub videyo 9:16 pou Atelye Dijital, ak vwa m. » est tapée ; l'étoile Claude pulse.",
 "Mwen travay videyo sa a ak Claude. Donk, sa w ap gade a,", "hook", "prompt-type-submit-generate (Adapt)", "la fenêtre Claude et sa demande", "spring-pop-entrance, depth-of-field-blur", "light",
 "à 3.20 : fenêtre Claude (lv-claude) au centre, échelle 0.92, en train de rétrécir vers le haut (vitesse -0,8/s), flou 6 px, la bande vide visible en bas floue ; sous-titre sorti ; papier à points",
 """Scene 1 (0.00 à 3.20 s) : la demande
  TEXTE ÉCRAN : « Mwen travay videyo sa a ak [boîte : Claude.] » puis « Donk, sa w ap gade a, »
  ÉTAPES : 0.00 la fenêtre Claude arrive trop grande (×1,15, flou 8 → net en 0,16 s expo.out) au centre (y 160 → 1160) ; 0.10 l'en-tête « Claude » et l'étoile ; 0.20 la bulle de la demande se tape caractère par caractère (0,8 s, caret accent) ; 1.00 envoi : la bulle monte de 20 px, l'étoile tourne de 30° (0,3 s) ; 1.28 « Claude. » en boîte ; 1.66–2.12 silence : sous la bulle, « M ap monte l… » paraît avec trois points qui s'allument (0,12 s chacun) ; 2.40 sous la fenêtre, le haut de la bande (règle 00:00) entre par le bas, floue ; 2.91–3.20 la fenêtre commence à rétrécir vers le haut.
  PISTE CAMÉRA : dérive y -12 px/s, échelle +2 %/s ; 2.90 → 3.20 recul s 1 → 0.95 power2.in.
  COUCHES ET PROFONDEUR : fenêtre nette ; bande floue en bas (avant-plan bas, flou 10 px) ; papier.
  OBJET-PONT ET VECTEUR : la fenêtre Claude devient le moniteur de la frame 2.
  SON : clic 1.00 (envoi).
  IMAGE CLÉ : 1.40 : la fenêtre Claude, la demande envoyée, « …ak [Claude.] » en bas."""),
("Claude monte li menm", "La fenêtre Claude se réduit et DEVIENT le moniteur 9:16 en haut de la bande ; deux tuiles outils (zouti, lojisyèl) tombent comme les premiers clips.",
 "konnen se yon videyo Claude monte li menm. Li itilize pwòp zouti l, pwòp lojisyèl li pou l fè videyo a.", "proof", "zoom-out-workspace-reveal (Adapt)", "le moniteur, puis les deux outils", "card-morph-anchor, spring-pop-entrance", "light",
 "à 6.55 local (9.75 global) : moniteur 9:16 en haut (world x 360, y 60), bande et couloirs visibles, clips « Zouti » (couloir Imaj) et « Lojisyèl » (couloir Tranz.) posés ; caméra cam(540, 1300, 0.82) qui descend (+180 px/s), flou 6 px",
 """Scene 1 (0.00 à 6.55 s) : la fenêtre devient le moniteur, les outils tombent
  TEXTE ÉCRAN : « konnen se yon videyo [boîte : Claude] monte li menm. » puis « Li itilize pwòp zouti l, pwòp lojisyèl li pou l fè videyo a. »
  ÉTAPES : 0.00 → 0.40 la fenêtre Claude se morphe en moniteur noir 360x640 (radius 54 → 28, fond #FAF9F6 → #111), l'étoile reste au centre et rétrécit ; 0.45 « ● REC » paraît ; 1.08 l'étoile pulse (Claude) ; 1.44 « monte » : la règle des timecodes s'imprime le long de la bande (0,01 s d'écart) ; 2.20 les en-têtes de couloirs s'allument ; 3.24 « zouti » : tuile clip « Zouti » (logo Claude + terminal) tombe dans le couloir Imaj (signature 1) ; 3.71–4.16 silence : la tête de lecture glisse de 00:00 à 00:02 ; 4.43 « lojisyèl » : clip « Lojisyèl » tombe dans Tranz. (signature 1) ; 5.36–6.20 dans le moniteur, une silhouette de pub (bandes de couleur) se dessine ; 6.36 départ de la descente.
  PISTE CAMÉRA : 0.00 → 0.60 recul s 1 → 0.82 expo.out ; dérive y +15 px/s ; 6.20 → 6.55 descente power2.in vers le couloir Vwa.
  COUCHES ET PROFONDEUR : moniteur ; bande ; clips au premier plan ; papier.
  OBJET-PONT ET VECTEUR : vecteur vers le bas, repris par la frame 3.
  SON : pop 6.44 global (zouti), pop 7.63 global (lojisyèl).
  IMAGE CLÉ : 4.60 : moniteur en haut, bande avec deux clips posés, « …pwòp [lojisyèl] li » en bas."""),
("Pa Veo 3", "Une carte « Veo 3 · jenere » tente de se poser sur la bande et se fait barrer puis tombe hors de la bande ; à la place, le couloir Vwa se remplit de la vraie forme d'onde de la voix.",
 "Se pa jenere l jenere tankou Veo 3. Mwen jis ba l vwa a.", "proof", "comparison-split (Adapt)", "la carte Veo 3 rejetée, puis la forme d'onde", "svg-path-draw, physics-press-reaction", "light",
 "à 4.45 local (14.20 global) : caméra cam(540, 1500, 0.9) en descente (+200 px/s) flou 6 px ; couloir Vwa rempli de la forme d'onde ; aucune carte Veo",
 """Scene 1 (0.00 à 4.45 s) : pas généré, juste ma voix
  TEXTE ÉCRAN : « Se pa jenere l jenere tankou [boîte : Veo 3.] » puis « Mwen jis ba l vwa a. »
  ÉTAPES : 0.20 une carte grise « Veo 3 · Jenere » (texte, icône play) arrive trop grande et floue vers la bande ; 1.05 elle se pose de travers au-dessus du couloir ; 1.75 « Veo 3 » : un trait accent la barre (0,25 s) ; 2.10 elle bascule (-25°) et tombe hors du cadre à gauche (0,3 s power2.in) ; 2.38 « Mwen » : un couloir « Vwa » s'ouvre pleine largeur (signature 2 en petit) ; 3.19 « vwa » : la forme d'onde réelle de la voix (scripts/waveform.py) se dessine de gauche à droite (0,6 s), clip encre ; 3.74 → 4.45 la tête de lecture parcourt la forme d'onde.
  PISTE CAMÉRA : cran sur le couloir Vwa à 0.00 (expo.out 0,3 s), dérive x +10 px/s ; 4.10 → 4.45 descente power2.in.
  OBJET-PONT ET VECTEUR : la forme d'onde reste sur la bande jusqu'à la fin de l'acte I.
  SON : pop 12.94 global (vwa).
  IMAGE CLÉ : 1.90 : la carte Veo 3 barrée en train de basculer, la bande propre dessous."""),
("Tèks, imaj, tranzisyon, son", "Les couloirs se remplissent au mot près : un clip tombe sur Tèks, Imaj, Tranz., Son à chaque mot ; dans le moniteur, la pub prend forme au même rythme.",
 "Epi li fè tout lòt bagay yo. Li ajoute tèks, li ajoute imaj, li fè tranzisyon, li ajoute son.", "proof", "grid-card-assemble (Adapt)", "le clip qui tombe, un à la fois", "kinetic-beat-slam, spring-pop-entrance", "light",
 "à 6.10 local (20.30 global) : caméra cam(540, 1100, 0.72) en recul (s -0,4/s), flou 0 ; moniteur + 4 couloirs remplis (Tèks, Imaj, Tranz., Son) + Vwa ; couloir Mizik vide ; tête de lecture à 00:00",
 """Scene 1 (0.00 à 6.10 s) : les quatre clips
  TEXTE ÉCRAN : « Epi li fè tout lòt bagay yo. » puis « Li ajoute tèks, li ajoute imaj, li fè tranzisyon, li ajoute [boîte : son.] »
  ÉTAPES : 0.17 la caméra arrive sur les couloirs (fin de descente) ; 1.02 « tout » : les 5 en-têtes de couloirs clignent (0,05 s d'écart) ; 2.61 « tèks » : clip Tèks tombe (signature 1), dans le moniteur une ligne de texte blanche apparaît ; 3.63 « imaj » : clip Imaj tombe, dans le moniteur un rectangle image ; 4.35 « tranzisyon » : clip Tranz. tombe, le moniteur fait un balayage ; 5.56 « son » : clip Son tombe, une petite onde dans le moniteur ; 5.80 recul.
  PISTE CAMÉRA : crans de 0,12 s vers chaque couloir (x +136) ; 5.70 → 6.10 recul s 0.9 → 0.72.
  SON : pops 16.81, 17.83, 18.55, 19.76 global.
  IMAGE CLÉ : 3.70 : le clip Imaj en train de se poser, Tèks déjà posé, « Li ajoute tèks, li ajoute imaj, » en bas."""),
("Piblisite m (gag muet)", "La musique (clip Mizik) tombe, la tête de lecture part, le moniteur joue la pub ; gag muet : la pub se « publie » en statut WhatsApp (barres de progression du statut en haut du moniteur, coche verte), le moniteur tourne pour faire face.",
 "Apre sa, li ba m piblisite m.", "proof", "camera-journey (Adapt)", "le moniteur qui joue la pub", "multi-phase-camera, cursor-click-ripple", "light",
 "à 5.50 local (25.80 global) : caméra cam(540, 2700, 0.9) en descente (+300 px/s), flou 8 px ; acte I quitte le cadre par le haut ; la bande continue vers le bas, vide ; sous-titre sorti",
 """Scene 1 (0.00 à 2.60 s) : la pub est prête
  TEXTE ÉCRAN : « Apre sa, li ba m [trait : piblisite m.] »
  ÉTAPES : 0.50 clip Mizik tombe (pop 20.80 global) ; 1.20 la tête de lecture part du haut de la bande ; 1.65 « piblisite » : le moniteur s'agrandit vers la caméra (×1,25) ; 2.36 notification à deux tons : coche verte « Pare » au coin du moniteur.
Scene 2 (2.60 à 5.50 s) : gag muet
  TEXTE ÉCRAN : aucun (silence).
  ÉTAPES : 2.60 la tête de lecture accélère et parcourt toute la bande (2,6 s), chaque clip s'allume quand elle le traverse ; 3.10 dans le moniteur : barres de statut WhatsApp en haut qui se remplissent, logo WhatsApp en coin ; 4.40 le moniteur fait un petit salut (rotation -6° → 0) ; 5.10 descente.
  PISTE CAMÉRA : 0.00 → 2.60 dérive ; 2.60 → 5.50 la caméra suit la tête de lecture vers le bas (power1.inOut), puis accélère.
  SON : notification 22.66 global (signature) ; clic 23.40 (lecture).
  IMAGE CLÉ : 3.60 : le moniteur joue la pub avec les barres de statut WhatsApp, la tête de lecture traverse les clips."""),
("Biznis, pwodwi", "Plus bas sur la bande : deux stations-profils se posent sur la règle : « Biznis » (une petite boutique en HTML) et « Pwodwi » (une boîte produit) ; puis une carte « Piblisite pwofesyonèl » avec une coche.",
 "Ou ka remake sa: si w ta gen yon biznis, oubyen yon pwodwi, ou ta renmen fè bèl piblisite ki pwofesyonèl,", "problem", "spatial-pan-stations (Adapt)", "Biznis, puis Pwodwi, puis la pub pro", "spring-pop-entrance, depth-of-field-blur", "light",
 "à 6.10 local (31.90 global) : caméra cam(540, 3050, 1.0), dérive, flou 0 ; stations Biznis et Pwodwi posées, carte « Piblisite pwofesyonèl » au centre",
 """Scene 1 (0.00 à 6.10 s)
  TEXTE ÉCRAN : « Ou ka remake sa: » puis « si w ta gen yon [boîte : biznis,] oubyen yon pwodwi, » puis « ou ta renmen fè bèl piblisite ki pwofesyonèl, »
  ÉTAPES : 0.09 fin de la descente ; 0.45 « remake » : un petit œil s'imprime sur la règle ; 1.90 station Biznis (vitrine HTML : store rayé accent, porte) tombe à gauche (signature 1) ; 2.96 station Pwodwi (boîte carton + étiquette) à droite ; 4.43 « bèl » : entre les deux, une carte 9:16 « pub » arrive trop grande et floue ; 5.23 « pwofesyonèl » : coche verte + la carte se pose.
  PISTE CAMÉRA : dérive y +12 px/s ; cran x -80 sur Biznis à 1.80, x +80 sur Pwodwi à 2.90, recentrage à 4.40.
  IMAGE CLÉ : 2.30 : la vitrine Biznis posée sur la bande, « …yon [biznis,] » en bas."""),
("Konpetans sa", "La carte pub se retourne : au dos, le mot « Konpetans » ; un petit cadenas s'ouvre à moitié.",
 "ebyen ou ta dwe gen konpetans sa.", "problem", "kinetic-type-beats (Adapt)", "le mot Konpetans", "kinetic-beat-slam", "light",
 "à 2.15 local (34.05 global) : caméra cam(540, 3350, 1.0) en descente courte (+150 px/s), carte « Konpetans » sortie par le haut ; station Kreyatè à venir floue en bas",
 """Scene 1 (0.00 à 2.15 s)
  TEXTE ÉCRAN : « ebyen ou ta dwe gen [boîte : konpetans] sa. »
  ÉTAPES : 0.17 la carte pub se retourne (rotationY 0 → 180, 0,3 s) ; 0.60 au dos : « KONPETANS » en Inter 800 ; 1.09 « konpetans » : le mot s'imprime en accent ; 1.60 la carte remonte, 2.00 descente.
  IMAGE CLÉ : 1.20 : la carte retournée « KONPETANS », Biznis et Pwodwi flous de part et d'autre."""),
("Kreyatè kontni", "Une carte profil de créateur (avatar cercle, « @kreyatè », grille de 6 vignettes vidéo) ; trois vignettes « serye » s'allument ; deux vignettes « IA » grises, aux visages lisses, sont marquées d'un tampon « IA » et glissent hors de la grille.",
 "Oubyen ou ta vle vin yon kreyatè kontni k ap pibliye videyo ki serye, ki pa sanble ak videyo ki jenere avèk IA.", "problem", "grid-card-assemble (Adapt)", "la grille du créateur", "dynamic-content-sequencing, spring-pop-entrance", "light",
 "à 7.05 local (41.10 global) : caméra cam(540, 3350, 0.85) en recul ; grille du créateur avec 4 vignettes serye ; la bande commence à se tendre (vibration 1 px)",
 """Scene 1 (0.00 à 7.05 s)
  TEXTE ÉCRAN : « Oubyen ou ta vle vin yon kreyatè kontni » puis « k ap pibliye videyo ki [boîte : serye,] » puis « ki pa sanble ak videyo ki jenere avèk IA. »
  ÉTAPES : 0.11 fin de descente ; 1.61 « kreyatè » : la carte profil s'ouvre (signature 2) ; 2.14 avatar + « @kreyatè » ; 2.84 « pibliye » : les 6 vignettes tombent (0,05 s d'écart) ; 3.77 « serye » : 4 vignettes s'allument d'un liseré accent ; 4.08–4.47 silence : la grille respire ; 5.27 deux vignettes grises « IA » ; 6.22 « IA » : tampon gris, elles glissent hors de la grille (0,25 s) ; 6.60 recul.
  IMAGE CLÉ : 4.00 : la grille du créateur, 4 vignettes serye allumées, « …videyo ki [serye,] » en bas."""),
("Se yon konpetans (pivot)", "Moment typographique : la phrase « Ebyen, se yon konpetans. » centrée ; la bande se coupe ; noir ; un point de lumière accent.",
 "Ebyen, se yon konpetans.", "pivot", "titlecard-reveal (Adapt)", "la phrase seule", "kinetic-beat-slam, ambient-glow-bloom", "light→dark",
 "à 3.80 local (44.90 global) : noir #141312, un point de lumière accent ø 30 px au centre (540, 760) qui commence à s'ouvrir",
 """Scene 1 (0.00 à 2.10 s) : la phrase
  TEXTE ÉCRAN : moment typographique centré (y 860, 84 px) : « Ebyen, se yon [boîte : konpetans.] » (pas de sous-titre en bas)
  ÉTAPES : 0.27 « Ebyen, » ; 0.89 la bande derrière se vide de ses couleurs ; 1.40 « konpetans. » en boîte ; 1.80 la bande se coupe en deux au milieu (0,2 s).
Scene 2 (2.10 à 3.80 s) : noir
  ÉTAPES : 2.10 coupe franche au noir (43.20 global, impact grave) ; 2.10 → 3.40 noir vivant (grain) ; 3.40 un point de lumière accent naît au centre.
  SON : riser 40.20 → 43.20, impact 43.20, silence."""),
("Atelye Dijital", "La lumière : le point s'ouvre en cercle sur le papier ; la bande réapparaît, claire, et la marque « ATELYE DIJITAL » s'assemble au-dessus d'elle.",
 "Se sa n ap montre w nan Atelye Dijital.", "brand", "logo-assemble-lockup (Adapt)", "la marque", "center-outward-expansion, spring-pop-entrance", "dark→light",
 "à 2.25 local (47.15 global) : papier, caméra cam(540, 4000, 1.0) en descente (+200 px/s) ; la marque remonte hors du cadre ; la bande claire, règle « MODIL 1 » qui arrive",
 """Scene 1 (0.00 à 2.25 s)
  TEXTE ÉCRAN : sous-titre « Se sa n ap montre w nan [trait : Atelye Dijital.] »
  ÉTAPES : 0.05 le point s'ouvre en cercle jusqu'à couvrir le cadre (0,35 s expo.out, sparkle) ; 0.40 la bande claire est là ; 1.38 « Atelye » : ATELYE s'assemble lettre par lettre (0,03 s d'écart, de y +40) ; 1.63 « Dijital. » : DIJITAL en accent ; 1.70 « Fòmasyon · Pratik · Pwojè » ; 2.00 descente.
  SON : sparkle 45.00, chime 46.28.
  IMAGE CLÉ : 1.90 : ATELYE DIJITAL sur le papier, la bande claire dessous, le trait accent sous « Atelye Dijital. »"""),
("Facebook Ads", "Station MODIL 1 : « 2 jou fòmasyon + pratik » puis le vrai logo Facebook et une carte Ads Manager (HTML) qui s'ouvre.",
 "De jou fòmasyon ak pratik pou metrize Facebook Ads,", "solution", "spatial-pan-stations (Adapt)", "la station Facebook Ads", "spring-pop-entrance, svg-icon-enrichment", "light",
 "à 3.80 local (50.95 global) : caméra cam(620, 4200, 1.0), station M1 ouverte (carte Ads Manager), dérive",
 """Scene 1 (0.00 à 3.80 s)
  TEXTE ÉCRAN : « [boîte : De jou] fòmasyon ak pratik » puis « pou metrize Facebook Ads, »
  ÉTAPES : 0.15 « De » : la tête de lecture s'arrête sur « MODIL 1 » ; 0.25 station s'ouvre (signature 2) ; 0.31 « 2 JOU » en gros ; 1.19 « pratik » : petites pastilles « Teyori » et « Pratik » ; 2.42 « Facebook » : le vrai logo Facebook arrive trop grand et flou, se pose ; 2.93 la carte Ads Manager (HTML : « Kanpay », « Bidjè », graphique) s'ouvre.
  SON : whoosh court 47.30."""),
("Santèn milye moun", "Dans la carte Ads Manager : une foule de points-personnes se multiplie autour du téléphone ; le champ « Bidjè » affiche « ti kòb » (pas de chiffre).",
 "pou w ka fè yon piblisite ki ateyn petèt plizyè santèn milye moun, tout pandan w ap depanse yon ti kòb.", "solution", "dataviz-countup (Adapt)", "la portée qui s'étend", "particle-burst, depth-scatter-assemble", "light",
 "à 6.00 local (56.95 global) : caméra cam(620, 4800, 1.0) en descente (+250 px/s), flou 6 px ; M1 remonte",
 """Scene 1 (0.00 à 6.00 s)
  TEXTE ÉCRAN : « pou w ka fè yon piblisite ki ateyn » puis « petèt plizyè [boîte : santèn milye] moun, » puis « tout pandan w ap depanse yon ti kòb. »
  ÉTAPES : 1.02 une pub (carte 9:16 miniature) au centre ; 1.62 « ateyn » : un anneau d'onde part de la pub ; 2.30 → 3.11 les points-personnes se multiplient par cercles (×10, ×100 en densité, 3 anneaux) ; 3.36 → 4.30 recul pour voir la foule ; 4.89 « ti kòb » : le champ Bidjè avec une petite pièce ; 5.70 descente.
  IMAGE CLÉ : 3.00 : la pub au centre, trois anneaux de points-personnes, « …plizyè [santèn milye] moun, »"""),
("Ajan IA", "Station MODIL 2 : « Ajan IA tankou Claude » : trois tuiles d'agents (logo Claude « Kontni », « Kliyan », logo WhatsApp « Otomatizasyon ») ; la tuile WhatsApp ouvre une petite conversation à réponse automatique.",
 "N ap montre w kòman pou itilize ajan tankou Claude ak lòt ankò pou kreye kontni, jere kliyan, fè otomatizasyon WhatsApp.", "solution", "constellation-hub (Adapt)", "les trois agents", "spring-pop-entrance, svg-icon-enrichment", "light",
 "à 7.45 local (64.40 global) : caméra cam(620, 5600, 1.0) en descente (+250 px/s) flou 6 px ; M2 remonte",
 """Scene 1 (0.00 à 7.45 s)
  TEXTE ÉCRAN : « N ap montre w kòman pou itilize » puis « ajan tankou [boîte : Claude] ak lòt ankò » puis « pou kreye kontni, jere kliyan, » puis « fè otomatizasyon WhatsApp. »
  ÉTAPES : 0.15 station M2 s'ouvre (signature 2) ; 1.92 « ajan » ; 2.51 « Claude » : la tuile logo Claude (rime de la fenêtre d'ouverture) ; 4.31 « kontni » : sous-tuile « Kontni » ; 5.21 « kliyan » : tuile « Kliyan » (fiche client HTML) ; 6.19 « otomatizasyon » : tuile WhatsApp, une bulle entrante « Bonjou, ki pri a ? » et la réponse automatique « Men pri a… » tombe 0,3 s après ; 7.10 descente.
  SON : whoosh court 57.00."""),
("Pwodwi dijital", "Station MODIL 3 : l'IA crée un produit digital : une couverture d'e-book (HTML) se compose sous nos yeux (titre, image, bouton « Achte »).",
 "Epi n ap montre w kòman tou pou itilize entèlijans atifisyèl pou kreye premye pwodwi dijital ou.", "solution", "prompt-type-submit-generate (Adapt)", "l'e-book qui se compose", "waterfall-entry", "light",
 "à 5.65 local (70.05 global) : caméra cam(620, 6400, 1.0), e-book posé au centre, dérive",
 """Scene 1 (0.00 à 5.65 s)
  TEXTE ÉCRAN : « Epi n ap montre w kòman tou » puis « pou itilize entèlijans atifisyèl » puis « pou kreye premye [boîte : pwodwi dijital] ou. »
  ÉTAPES : 0.25 station M3 s'ouvre ; 2.36 « entèlijans » : l'étoile Claude au-dessus d'un cadre vide ; 3.45 « kreye » : la couverture se compose (fond accent, titre, image, bouton) en cascade (0,06 s d'écart) ; 4.43 « pwodwi » : l'e-book prend son épaisseur (ombre) ; 5.13 se pose.
  SON : whoosh court 64.55."""),
("Vann li plizyè fwa", "L'e-book reste au centre ; un compteur « vant » roule : 1 → 10 (« dizèn ») → 100 (« santèn ») ; de petites copies partent vers des téléphones autour.",
 "Yon pwodwi w kreye yon sèl fwa, men ou ka vann li plizyè dizèn fwa, e plizyè santèn fwa.", "solution", "dataviz-countup (Adapt)", "le compteur de ventes", "counting-dynamic-scale", "light",
 "à 5.90 local (75.95 global) : caméra cam(620, 7200, 1.0) en descente (+250 px/s) flou 6 px",
 """Scene 1 (0.00 à 5.90 s)
  TEXTE ÉCRAN : « Yon pwodwi w kreye [boîte : yon sèl fwa,] » puis « men ou ka vann li plizyè dizèn fwa, » puis « e plizyè santèn fwa. »
  ÉTAPES : 1.06 « sèl » : badge « ×1 » ; 2.29 « vann » : une copie part de l'e-book ; 3.20 « dizèn » : le compteur roule 1 → 10 (0,4 s), 10 copies en éventail ; 4.25 « santèn » : 10 → 100 (0,5 s), l'éventail devient un nuage ; 5.40 descente.
  IMAGE CLÉ : 4.80 : l'e-book, le compteur « 100 vant », le nuage de copies."""),
("Atelye : aprantisaj, pratik, pwojè", "Station MODIL 4 : trois piliers s'impriment sur la bande (Aprantisaj, Pratik, Pwojè an gwoup) ; sur « gwoup », la photo du groupe (team.png) s'ouvre.",
 "Se yon atelye ki pral mete aksan sou aprantisaj, pratik ak pwojè an gwoup.", "solution", "spatial-pan-stations (Adapt)", "les trois piliers, puis le groupe", "spring-pop-entrance", "light",
 "à 5.00 local (80.95 global) : caméra cam(620, 7900, 1.0) en descente flou 6 px ; photo du groupe qui remonte",
 """Scene 1 (0.00 à 5.00 s)
  TEXTE ÉCRAN : « Se yon atelye ki pral mete aksan » puis « sou aprantisaj, pratik ak [boîte : pwojè an gwoup.] »
  ÉTAPES : 0.18 station M4 s'ouvre ; 0.56 « atelye » ; 2.06 pilier 1 « Aprantisaj » ; 2.63 pilier 2 « Pratik » ; 3.42 pilier 3 « Pwojè an gwoup » ; 4.26 « gwoup » : la photo du groupe s'ouvre (signature 2) entre les piliers ; 4.70 descente.
  SON : whoosh court 76.00."""),
("Resous gratis", "Station MODIL 5 : un dossier « Resous » (HTML) s'ouvre ; des fiches PDF, DOC, VIDEYO en sortent ; tampon « GRATIS ».",
 "Anplis de sa, w ap resevwa tout resous gratis ki nesesè.", "solution", "grid-card-assemble (Adapt)", "le dossier de ressources", "spring-pop-entrance", "light",
 "à 3.50 local (84.45 global) : caméra cam(620, 8600, 1.0), dossier posé, dérive",
 """Scene 1 (0.00 à 3.50 s)
  TEXTE ÉCRAN : « Anplis de sa, w ap resevwa » puis « tout resous [boîte : gratis] ki nesesè. »
  ÉTAPES : 0.15 station M5 ; 1.41 « resevwa » : le dossier arrive ; 2.12 « resous » : trois fiches (PDF, DOC, VIDEYO) jaillissent du dossier ; 2.43 « gratis » : tampon « GRATIS » ; 3.20 dérive.
  SON : whoosh court 81.00."""),
("Gwoup WhatsApp, yon mwa", "Le dossier se range ; une conversation de groupe WhatsApp « Atelye Dijital · Patisipan » s'ouvre (HTML) ; la règle à côté s'étire sur 30 jours avec « 1 MWA ».",
 "E n ap mete nou nan yon gwoup WhatsApp pou nou kontinye asiste patisipan yo pandan yon mwa.", "solution", "device-surface-showcase (Adapt)", "le groupe WhatsApp", "spring-pop-entrance", "light",
 "à 5.95 local (90.40 global) : caméra cam(620, 9300, 1.0) en descente (+250 px/s) flou 6 px ; le groupe remonte ; la règle commence à porter des jours",
 """Scene 1 (0.00 à 5.95 s)
  TEXTE ÉCRAN : « E n ap mete nou nan yon gwoup WhatsApp » puis « pou nou kontinye asiste patisipan yo » puis « pandan [boîte : yon mwa.] »
  ÉTAPES : 1.19 « gwoup » : la conversation de groupe s'ouvre (en-tête vert, avatars initiales) ; 1.54 « WhatsApp » : logo ; 2.38 « kontinye » : messages qui arrivent (question / réponse) 0,4 s d'écart ; 3.76 « pandan » : la règle de gauche s'imprime « J1… J30 » ; 5.08 « mwa » : accolade accent « 1 MWA » ; 5.60 descente.
  SON : notifications douces 87.00, 87.40."""),
("Dat la", "La règle devient le calendrier : « SAM 17 OKT » puis « SAM 24 OKT » s'allument ; « 2026 ».",
 "Dat la se 17 ak 24 oktòb 2026.", "info", "titlecard-reveal (Adapt)", "les deux dates", "kinetic-beat-slam", "light",
 "à 3.80 local (94.20 global) : caméra cam(620, 10000, 1.0) en descente flou 6 px ; dates posées remontent",
 """Scene 1 (0.00 à 3.80 s)
  TEXTE ÉCRAN : « Dat la se [boîte : 17] ak [trait : 24] oktòb 2026. »
  ÉTAPES : 0.30 station calendrier s'ouvre ; 1.17 « 17 » : « SAM 17 » + gros « 17 OKT » ; 1.84 « 24 » : « SAM 24 » + gros « 24 OKT » ; 2.67 « 2026 » ; 3.40 descente.
  SON : whoosh court 90.55."""),
("Lè a", "La tête de lecture devient l'aiguille d'une horloge (HTML) : de 10h00 à 4h00, l'arc se remplit en accent.",
 "10è nan maten pou rive 4è nan apremidi.", "info", "fixed-anchor-cycle (Adapt)", "l'horloge", "svg-path-draw", "light",
 "à 2.40 local (96.60 global) : caméra cam(540, 10200, 1.0) ; horloge 10:00 AM → 4:00 PM ; la bande commence à se replier",
 """Scene 1 (0.00 à 2.40 s)
  TEXTE ÉCRAN : « [boîte : 10è] nan maten pou rive 4è nan apremidi. »
  ÉTAPES : 0.17 l'horloge : aiguille sur 10 ; « 10:00 AM » ; 1.50 « 4è » : l'aiguille tourne jusqu'à 4, l'arc accent se remplit (0,5 s) ; « 4:00 PM » ; 2.10 la bande se replie."""),
("Lokal la", "La bande se replie et devient une carte vue de dessus ; l'épingle tombe et se plante sur la photo du Sassou's Lamadone Club ; « Plas Anacaona » sur la carte, à côté.",
 "Lokal la se Sassou's Lamadone Club, anfas Plas Anacaona.", "info", "camera-journey (Adapt)", "l'épingle sur le Sassou's", "physics-press-reaction, coordinate-target-zoom", "light",
 "à 4.45 local (101.05 global) : caméra cam(540, 900, 1.0) sur la carte (nouveau repère « carte »), photo du Sassou's épinglée, recul en cours",
 """Scene 1 (0.00 à 4.45 s)
  TEXTE ÉCRAN : « Lokal la se Sassou's Lamadone Club, » puis « anfas [boîte : Plas Anacaona.] »
  ÉTAPES : 0.15 la bande se couche et se replie en carte (rues, 0,6 s) ; 1.22 « Sassou's » : la photo du Sassou's s'ouvre ; 1.66 l'épingle tombe (0,25 s power2.in) et se plante sur la photo, anneau accent ; 3.07 « Plas » : marqueur « Plas Anacaona » de l'autre côté de la rue ; 3.43 un trait pointillé relie les deux ; 4.10 recul.
  IMAGE CLÉ : 2.00 : la photo du Sassou's sur la carte, l'épingle plantée, son anneau."""),
("30 plas", "Une grille de 30 places (6x5) ; les places s'allument une à une jusqu'à 30 ; « si w rive an reta » : une petite porte se ferme sur le côté.",
 "N ap fè nou konnen plas yo limite a 30 moun sèlman, kidonk si w rive an reta, n ap dezole pou ou.", "urgency", "dataviz-countup (Adapt)", "les 30 places", "stat-bars-and-fills", "light",
 "à 6.10 local (107.15 global) : caméra cam(540, 900, 1.0) ; grille 30/30 allumée, la carte et l'épingle floues derrière",
 """Scene 1 (0.00 à 6.10 s)
  TEXTE ÉCRAN : « N ap fè nou konnen plas yo limite » puis « a [boîte : 30 moun] sèlman, » puis « kidonk si w rive an reta, n ap dezole pou ou. »
  ÉTAPES : 0.98 « plas » : la grille vide arrive ; 1.89 « 30 » : « 30 » en gros, les places s'allument une à une (0,03 s d'écart, ticks) ; 3.61 « rive an reta » : petite horloge qui dépasse ; 4.90 « dezole » : la porte se ferme doucement ; 5.80 dérive.
  SON : ticks 103.00 → 104.00."""),
("WhatsApp", "Le bouton vert « Kontakte nou sou WhatsApp » arrive ; la tête de lecture devenue curseur arrive en courbe et clique ; le numéro « 31 43 3938 » s'imprime chiffre par chiffre.",
 "Pou rezève plas ou, tanpri kontakte nou kounye a sou WhatsApp, oswa klike sou lyen WhatsApp ki anba videyo sa a, oubyen ekri nou sou 31 43 3938.", "cta", "cta-morph-press (Adapt)", "le bouton WhatsApp et le numéro", "cursor-click-ripple, press-release-spring", "light",
 "à 8.55 local (115.70 global) : caméra cam(540, 900, 1.0), bouton WhatsApp avec le numéro, curseur posé à côté",
 """Scene 1 (0.00 à 8.55 s)
  TEXTE ÉCRAN : « Pou rezève plas ou, » puis « tanpri kontakte nou kounye a sou [boîte : WhatsApp,] » puis « oswa klike sou lyen WhatsApp ki anba videyo sa a, » puis « oubyen ekri nou sou 31 43 3938. »
  ÉTAPES : 0.31 « rezève » : une place de la grille se détache et vole vers le haut ; 1.63 « kontakte » : le bouton WhatsApp arrive trop grand et flou, se pose ; 2.91 « WhatsApp » : le curseur arrive en courbe (0,45 s) et clique (anneau accent) ; 4.26 « lyen » : une flèche pointe vers le bas (vers le lien sous la vidéo) ; 4.48 deuxième clic ; 7.55 « 31 » : le numéro s'imprime en gros sous le bouton, chiffre par chiffre, jusqu'à 3938 (8.20) ; 8.40 recul.
  SON : clic 110.10, clic 111.70, chime 115.10 (temps de la variante A)."""),
("Fòmilè + fen", "Le lien « atelyedijital.vercel.app » se tape dans une pilule ; le curseur clique ; recul final : carte de fin (ATELYE DIJITAL, Samdi 17 & 24 oktòb 2026, Sassou's Lamadone Club, bouton WhatsApp, lien) ; les 5 pistes pleines en miniature ; tenue vivante puis iris.",
 "Ou ka ranpli fòmilè enskripsyon an tou, lè w ale sou atelyedijital.vercel.app", "end", "cta-morph-press (Adapt)", "le lien, puis la carte de fin", "cursor-click-ripple, viewport-change", "light",
 "fin du film ({TOTAL:.2f}) : iris fermé",
 """Scene 1 (0.00 à 4.40 s) : le lien
  TEXTE ÉCRAN : « Ou ka ranpli fòmilè enskripsyon an tou, » puis « lè w ale sou [trait : atelyedijital.vercel.app] »
  ÉTAPES : 0.94 « fòmilè » : une carte formulaire (3 champs HTML : Non, Telefòn, Klike) arrive ; 2.73 « ale » : la pilule de lien ; 3.18 l'URL se tape (0,9 s, typing) ; 4.00 le curseur clique la pilule.
Scene 2 (4.40 à 8.69 s) : carte de fin
  TEXTE ÉCRAN : aucun sous-titre ; la carte : ATELYE DIJITAL, « Samdi 17 & 24 oktòb 2026 · 10:00 AM – 4:00 PM », « Sassou's Lamadone Club · anfas Plas Anacaona », bouton WhatsApp « 31 43 3938 », lien.
  ÉTAPES : 4.40 recul : tout le film se ramasse (implosion 0,5 s) puis la carte de fin s'assemble (0,3 s, cascade) ; 5.20 la miniature des 5 pistes pleines (rime) ; 5.60 → 7.90 tenue vivante (dérive, l'anneau du bouton respire) ; 7.90 → 8.69 iris vers le bouton WhatsApp.
  SON : typing 118.40 → 120.10, clic 120.11, whoosh-cinematic 123.61 (temps de la variante A)."""),
]


FIDS = {"Dat la": "19-dat-la" + SUFFIX, "WhatsApp": "23-whatsapp", "Fòmilè + fen": "24-fomile-fen" + SUFFIX}


def main():
    out = [HEADER]
    for i, (title, scene, vo, typ, bp, focal, rules, world, hout, scenes) in enumerate(F, start=1):
        a, b = B[i - 1], B[i]
        hin = "aucun (ouverture du film) ; papier à points, rien d'autre" if i == 1 else F[i - 2][8]
        base = unicodedata.normalize("NFKD", title.lower().split("(")[0]).encode("ascii", "ignore").decode()
        fid = FIDS.get(title) or f"{i:02d}-" + re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", base)).strip("-")[:22].strip("-")
        out.append(f"""## Frame {i} : {title}

- scene: {scene}
- duration: {b - a:.2f}s
- start: {a:.2f}
- transition_in: cut
- status: storyboard
- src: compositions/frames/{fid}.html
- voiceover: "{vo}"
- type: {typ}
- blueprint: {bp}
- focal: {focal}
- rules: {rules}
- world: {world}
- handoff_in: {hin}
- handoff_out: {hout}

Word cues: {cues(i)}

{scenes}
""")
    text = "\n".join(out).replace("{TOTAL:.2f}", f"{TOTAL:.2f}").replace("{SUFFIX}", SUFFIX)
    if DAT == "B":   # new date: Saturdays 24 and 31 October 2026
        for a, b in [("samdi 17 ak 24 oktòb", "samdi 24 ak 31 oktòb"), ("Samdi 17 & 24 oktòb", "Samdi 24 & 31 oktòb"),
                     ("« SAM 17 OKT » puis « SAM 24 OKT »", "« SAM 24 OKT » puis « SAM 31 OKT »"),
                     ('"Dat la se 17 ak 24 oktòb 2026."', '"Dat la se samdi 24 oktòb ak 31 oktòb 2026 la."'),
                     ("« Dat la se [boîte : 17] ak [trait : 24] oktòb 2026. »", "« Dat la se samdi [boîte : 24] oktòb » puis « ak [trait : 31] oktòb 2026 la. »"),
                     ("1.17 « 17 » : « SAM 17 » + gros « 17 OKT » ; 1.84 « 24 » : « SAM 24 » + gros « 24 OKT » ; 2.67 « 2026 » ; 3.40 descente.",
                      "1.15 « 24 » : « SAM 24 » + gros « 24 OKT » ; 2.46 « 31 » : « SAM 31 » + gros « 31 OKT » ; 3.57 « 2026 » ; 4.65 descente.")]:
            text = text.replace(a, b)
    open("STORYBOARD.md", "w").write(text)
    print(f"STORYBOARD.md (DAT={DAT}): {len(F)} frames, {B[-1]:.2f} s")


main()
