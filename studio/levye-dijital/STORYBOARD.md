---
format: 1080x1920
duration: 131.45s
message: "Claude te fè pub sa a ; aprann fè l ou menm nan Atelye Dijital : 2 jou fòmasyon, samdi 24 ak 31 oktòb 2026, Sassou's Lamadone Club."
arc: Preuve (la pub se monte devant nous) → Gag muet → Diagnostic (biznis, pwodwi, kreyatè) → Pivot → Marque → Programme (5 modules) → Infos (date, lè, lokal, plas) → CTA WhatsApp + lyen
audience: entrepreneurs, vendeurs et créateurs de contenu en Haïti, non techniques, sur WhatsApp
mode: autonomous
captions: disabled
voice: "assets/audio/voix-montage-atelye-dat2.wav (131.45 s, créole haïtien, voix du client) ; minutage dans onsets.json ; le mix est monté par l'orchestrateur sur l'image"
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

## Frame 1 : Ak Claude

- scene: La vraie fenêtre de l'app Claude (reconstruite en HTML) occupe la scène : la demande « Fè yon pub videyo 9:16 pou Atelye Dijital, ak vwa m. » est tapée ; l'étoile Claude pulse.
- duration: 3.20s
- start: 0.00
- transition_in: cut
- status: storyboard
- src: compositions/frames/01-ak-claude.html
- voiceover: "Mwen travay videyo sa a ak Claude. Donk, sa w ap gade a,"
- type: hook
- blueprint: prompt-type-submit-generate (Adapt)
- focal: la fenêtre Claude et sa demande
- rules: spring-pop-entrance, depth-of-field-blur
- world: light
- handoff_in: aucun (ouverture du film) ; papier à points, rien d'autre
- handoff_out: à 3.20 : fenêtre Claude (lv-claude) au centre, échelle 0.92, en train de rétrécir vers le haut (vitesse -0,8/s), flou 6 px, la bande vide visible en bas floue ; sous-titre sorti ; papier à points

Word cues: Mwen@0.14 travay@0.32 videyo@0.57 sa@0.82 a@0.94 ak@1.03 Claude.@1.28 Donk,@2.15 sa@2.33 w@2.45 ap@2.53 gade@2.64 a,@2.81

Scene 1 (0.00 à 3.20 s) : la demande
  TEXTE ÉCRAN : « Mwen travay videyo sa a ak [boîte : Claude.] » puis « Donk, sa w ap gade a, »
  ÉTAPES : 0.00 la fenêtre Claude arrive trop grande (×1,15, flou 8 → net en 0,16 s expo.out) au centre (y 160 → 1160) ; 0.10 l'en-tête « Claude » et l'étoile ; 0.20 la bulle de la demande se tape caractère par caractère (0,8 s, caret accent) ; 1.00 envoi : la bulle monte de 20 px, l'étoile tourne de 30° (0,3 s) ; 1.28 « Claude. » en boîte ; 1.66–2.12 silence : sous la bulle, « M ap monte l… » paraît avec trois points qui s'allument (0,12 s chacun) ; 2.40 sous la fenêtre, le haut de la bande (règle 00:00) entre par le bas, floue ; 2.91–3.20 la fenêtre commence à rétrécir vers le haut.
  PISTE CAMÉRA : dérive y -12 px/s, échelle +2 %/s ; 2.90 → 3.20 recul s 1 → 0.95 power2.in.
  COUCHES ET PROFONDEUR : fenêtre nette ; bande floue en bas (avant-plan bas, flou 10 px) ; papier.
  OBJET-PONT ET VECTEUR : la fenêtre Claude devient le moniteur de la frame 2.
  SON : clic 1.00 (envoi).
  IMAGE CLÉ : 1.40 : la fenêtre Claude, la demande envoyée, « …ak [Claude.] » en bas.

## Frame 2 : Claude monte li menm

- scene: La fenêtre Claude se réduit et DEVIENT le moniteur 9:16 en haut de la bande ; deux tuiles outils (zouti, lojisyèl) tombent comme les premiers clips.
- duration: 6.55s
- start: 3.20
- transition_in: cut
- status: storyboard
- src: compositions/frames/02-claude-monte-li-menm.html
- voiceover: "konnen se yon videyo Claude monte li menm. Li itilize pwòp zouti l, pwòp lojisyèl li pou l fè videyo a."
- type: proof
- blueprint: zoom-out-workspace-reveal (Adapt)
- focal: le moniteur, puis les deux outils
- rules: card-morph-anchor, spring-pop-entrance
- world: light
- handoff_in: à 3.20 : fenêtre Claude (lv-claude) au centre, échelle 0.92, en train de rétrécir vers le haut (vitesse -0,8/s), flou 6 px, la bande vide visible en bas floue ; sous-titre sorti ; papier à points
- handoff_out: à 6.55 local (9.75 global) : moniteur 9:16 en haut (world x 360, y 60), bande et couloirs visibles, clips « Zouti » (couloir Imaj) et « Lojisyèl » (couloir Tranz.) posés ; caméra cam(540, 1300, 0.82) qui descend (+180 px/s), flou 6 px

Word cues: konnen@0.14 se@0.43 yon@0.58 videyo@0.77 Claude@1.08 monte@1.44 li@1.75 menm.@1.95 Li@2.21 itilize@2.57 pwòp@3.02 zouti@3.24 l,@3.57 pwòp@4.05 lojisyèl@4.43 li@4.80 pou@5.36 l@5.59 fè@5.71 videyo@5.87 a.@6.20

Scene 1 (0.00 à 6.55 s) : la fenêtre devient le moniteur, les outils tombent
  TEXTE ÉCRAN : « konnen se yon videyo [boîte : Claude] monte li menm. » puis « Li itilize pwòp zouti l, pwòp lojisyèl li pou l fè videyo a. »
  ÉTAPES : 0.00 → 0.40 la fenêtre Claude se morphe en moniteur noir 360x640 (radius 54 → 28, fond #FAF9F6 → #111), l'étoile reste au centre et rétrécit ; 0.45 « ● REC » paraît ; 1.08 l'étoile pulse (Claude) ; 1.44 « monte » : la règle des timecodes s'imprime le long de la bande (0,01 s d'écart) ; 2.20 les en-têtes de couloirs s'allument ; 3.24 « zouti » : tuile clip « Zouti » (logo Claude + terminal) tombe dans le couloir Imaj (signature 1) ; 3.71–4.16 silence : la tête de lecture glisse de 00:00 à 00:02 ; 4.43 « lojisyèl » : clip « Lojisyèl » tombe dans Tranz. (signature 1) ; 5.36–6.20 dans le moniteur, une silhouette de pub (bandes de couleur) se dessine ; 6.36 départ de la descente.
  PISTE CAMÉRA : 0.00 → 0.60 recul s 1 → 0.82 expo.out ; dérive y +15 px/s ; 6.20 → 6.55 descente power2.in vers le couloir Vwa.
  COUCHES ET PROFONDEUR : moniteur ; bande ; clips au premier plan ; papier.
  OBJET-PONT ET VECTEUR : vecteur vers le bas, repris par la frame 3.
  SON : pop 6.44 global (zouti), pop 7.63 global (lojisyèl).
  IMAGE CLÉ : 4.60 : moniteur en haut, bande avec deux clips posés, « …pwòp [lojisyèl] li » en bas.

## Frame 3 : Pa Veo 3

- scene: Une carte « Veo 3 · jenere » tente de se poser sur la bande et se fait barrer puis tombe hors de la bande ; à la place, le couloir Vwa se remplit de la vraie forme d'onde de la voix.
- duration: 4.45s
- start: 9.75
- transition_in: cut
- status: storyboard
- src: compositions/frames/03-pa-veo-3.html
- voiceover: "Se pa jenere l jenere tankou Veo 3. Mwen jis ba l vwa a."
- type: proof
- blueprint: comparison-split (Adapt)
- focal: la carte Veo 3 rejetée, puis la forme d'onde
- rules: svg-path-draw, physics-press-reaction
- world: light
- handoff_in: à 6.55 local (9.75 global) : moniteur 9:16 en haut (world x 360, y 60), bande et couloirs visibles, clips « Zouti » (couloir Imaj) et « Lojisyèl » (couloir Tranz.) posés ; caméra cam(540, 1300, 0.82) qui descend (+180 px/s), flou 6 px
- handoff_out: à 4.45 local (14.20 global) : caméra cam(540, 1500, 0.9) en descente (+200 px/s) flou 6 px ; couloir Vwa rempli de la forme d'onde ; aucune carte Veo

Word cues: Se@0.22 pa@0.45 jenere@0.61 l@0.93 jenere@1.05 tankou@1.37 Veo@1.75 3.@1.95 Mwen@2.38 jis@2.75 ba@2.93 l@3.08 vwa@3.19 a.@3.74

Scene 1 (0.00 à 4.45 s) : pas généré, juste ma voix
  TEXTE ÉCRAN : « Se pa jenere l jenere tankou [boîte : Veo 3.] » puis « Mwen jis ba l vwa a. »
  ÉTAPES : 0.20 une carte grise « Veo 3 · Jenere » (texte, icône play) arrive trop grande et floue vers la bande ; 1.05 elle se pose de travers au-dessus du couloir ; 1.75 « Veo 3 » : un trait accent la barre (0,25 s) ; 2.10 elle bascule (-25°) et tombe hors du cadre à gauche (0,3 s power2.in) ; 2.38 « Mwen » : un couloir « Vwa » s'ouvre pleine largeur (signature 2 en petit) ; 3.19 « vwa » : la forme d'onde réelle de la voix (scripts/waveform.py) se dessine de gauche à droite (0,6 s), clip encre ; 3.74 → 4.45 la tête de lecture parcourt la forme d'onde.
  PISTE CAMÉRA : cran sur le couloir Vwa à 0.00 (expo.out 0,3 s), dérive x +10 px/s ; 4.10 → 4.45 descente power2.in.
  OBJET-PONT ET VECTEUR : la forme d'onde reste sur la bande jusqu'à la fin de l'acte I.
  SON : pop 12.94 global (vwa).
  IMAGE CLÉ : 1.90 : la carte Veo 3 barrée en train de basculer, la bande propre dessous.

## Frame 4 : Tèks, imaj, tranzisyon, son

- scene: Les couloirs se remplissent au mot près : un clip tombe sur Tèks, Imaj, Tranz., Son à chaque mot ; dans le moniteur, la pub prend forme au même rythme.
- duration: 6.10s
- start: 14.20
- transition_in: cut
- status: storyboard
- src: compositions/frames/04-teks-imaj-tranzisyon-s.html
- voiceover: "Epi li fè tout lòt bagay yo. Li ajoute tèks, li ajoute imaj, li fè tranzisyon, li ajoute son."
- type: proof
- blueprint: grid-card-assemble (Adapt)
- focal: le clip qui tombe, un à la fois
- rules: kinetic-beat-slam, spring-pop-entrance
- world: light
- handoff_in: à 4.45 local (14.20 global) : caméra cam(540, 1500, 0.9) en descente (+200 px/s) flou 6 px ; couloir Vwa rempli de la forme d'onde ; aucune carte Veo
- handoff_out: à 6.10 local (20.30 global) : caméra cam(540, 1100, 0.72) en recul (s -0,4/s), flou 0 ; moniteur + 4 couloirs remplis (Tèks, Imaj, Tranz., Son) + Vwa ; couloir Mizik vide ; tête de lecture à 00:00

Word cues: Epi@0.17 li@0.40 fè@0.71 tout@1.02 lòt@1.35 bagay@1.55 yo.@1.86 Li@2.06 ajoute@2.22 tèks,@2.61 li@3.14 ajoute@3.30 imaj,@3.63 li@3.91 fè@4.20 tranzisyon,@4.35 li@5.18 ajoute@5.30 son.@5.56

Scene 1 (0.00 à 6.10 s) : les quatre clips
  TEXTE ÉCRAN : « Epi li fè tout lòt bagay yo. » puis « Li ajoute tèks, li ajoute imaj, li fè tranzisyon, li ajoute [boîte : son.] »
  ÉTAPES : 0.17 la caméra arrive sur les couloirs (fin de descente) ; 1.02 « tout » : les 5 en-têtes de couloirs clignent (0,05 s d'écart) ; 2.61 « tèks » : clip Tèks tombe (signature 1), dans le moniteur une ligne de texte blanche apparaît ; 3.63 « imaj » : clip Imaj tombe, dans le moniteur un rectangle image ; 4.35 « tranzisyon » : clip Tranz. tombe, le moniteur fait un balayage ; 5.56 « son » : clip Son tombe, une petite onde dans le moniteur ; 5.80 recul.
  PISTE CAMÉRA : crans de 0,12 s vers chaque couloir (x +136) ; 5.70 → 6.10 recul s 0.9 → 0.72.
  SON : pops 16.81, 17.83, 18.55, 19.76 global.
  IMAGE CLÉ : 3.70 : le clip Imaj en train de se poser, Tèks déjà posé, « Li ajoute tèks, li ajoute imaj, » en bas.

## Frame 5 : Piblisite m (gag muet)

- scene: La musique (clip Mizik) tombe, la tête de lecture part, le moniteur joue la pub ; gag muet : la pub se « publie » en statut WhatsApp (barres de progression du statut en haut du moniteur, coche verte), le moniteur tourne pour faire face.
- duration: 5.50s
- start: 20.30
- transition_in: cut
- status: storyboard
- src: compositions/frames/05-piblisite-m.html
- voiceover: "Apre sa, li ba m piblisite m."
- type: proof
- blueprint: camera-journey (Adapt)
- focal: le moniteur qui joue la pub
- rules: multi-phase-camera, cursor-click-ripple
- world: light
- handoff_in: à 6.10 local (20.30 global) : caméra cam(540, 1100, 0.72) en recul (s -0,4/s), flou 0 ; moniteur + 4 couloirs remplis (Tèks, Imaj, Tranz., Son) + Vwa ; couloir Mizik vide ; tête de lecture à 00:00
- handoff_out: à 5.50 local (25.80 global) : caméra cam(540, 2700, 0.9) en descente (+300 px/s), flou 8 px ; acte I quitte le cadre par le haut ; la bande continue vers le bas, vide ; sous-titre sorti

Word cues: Apre@0.25 sa,@0.55 li@0.76 ba@1.20 m@1.53 piblisite@1.65 m.@2.36

Scene 1 (0.00 à 2.60 s) : la pub est prête
  TEXTE ÉCRAN : « Apre sa, li ba m [trait : piblisite m.] »
  ÉTAPES : 0.50 clip Mizik tombe (pop 20.80 global) ; 1.20 la tête de lecture part du haut de la bande ; 1.65 « piblisite » : le moniteur s'agrandit vers la caméra (×1,25) ; 2.36 notification à deux tons : coche verte « Pare » au coin du moniteur.
Scene 2 (2.60 à 5.50 s) : gag muet
  TEXTE ÉCRAN : aucun (silence).
  ÉTAPES : 2.60 la tête de lecture accélère et parcourt toute la bande (2,6 s), chaque clip s'allume quand elle le traverse ; 3.10 dans le moniteur : barres de statut WhatsApp en haut qui se remplissent, logo WhatsApp en coin ; 4.40 le moniteur fait un petit salut (rotation -6° → 0) ; 5.10 descente.
  PISTE CAMÉRA : 0.00 → 2.60 dérive ; 2.60 → 5.50 la caméra suit la tête de lecture vers le bas (power1.inOut), puis accélère.
  SON : notification 22.66 global (signature) ; clic 23.40 (lecture).
  IMAGE CLÉ : 3.60 : le moniteur joue la pub avec les barres de statut WhatsApp, la tête de lecture traverse les clips.

## Frame 6 : Biznis, pwodwi

- scene: Plus bas sur la bande : deux stations-profils se posent sur la règle : « Biznis » (une petite boutique en HTML) et « Pwodwi » (une boîte produit) ; puis une carte « Piblisite pwofesyonèl » avec une coche.
- duration: 6.10s
- start: 25.80
- transition_in: cut
- status: storyboard
- src: compositions/frames/06-biznis-pwodwi.html
- voiceover: "Ou ka remake sa: si w ta gen yon biznis, oubyen yon pwodwi, ou ta renmen fè bèl piblisite ki pwofesyonèl,"
- type: problem
- blueprint: spatial-pan-stations (Adapt)
- focal: Biznis, puis Pwodwi, puis la pub pro
- rules: spring-pop-entrance, depth-of-field-blur
- world: light
- handoff_in: à 5.50 local (25.80 global) : caméra cam(540, 2700, 0.9) en descente (+300 px/s), flou 8 px ; acte I quitte le cadre par le haut ; la bande continue vers le bas, vide ; sous-titre sorti
- handoff_out: à 6.10 local (31.90 global) : caméra cam(540, 3050, 1.0), dérive, flou 0 ; stations Biznis et Pwodwi posées, carte « Piblisite pwofesyonèl » au centre

Word cues: Ou@0.09 ka@0.27 remake@0.45 sa:@0.79 si@1.30 w@1.45 ta@1.56 gen@1.71 yon@1.90 biznis,@2.09 oubyen@2.43 yon@2.96 pwodwi,@3.14 ou@3.52 ta@3.67 renmen@3.98 fè@4.28 bèl@4.43 piblisite@4.62 ki@5.05 pwofesyonèl,@5.23

Scene 1 (0.00 à 6.10 s)
  TEXTE ÉCRAN : « Ou ka remake sa: » puis « si w ta gen yon [boîte : biznis,] oubyen yon pwodwi, » puis « ou ta renmen fè bèl piblisite ki pwofesyonèl, »
  ÉTAPES : 0.09 fin de la descente ; 0.45 « remake » : un petit œil s'imprime sur la règle ; 1.90 station Biznis (vitrine HTML : store rayé accent, porte) tombe à gauche (signature 1) ; 2.96 station Pwodwi (boîte carton + étiquette) à droite ; 4.43 « bèl » : entre les deux, une carte 9:16 « pub » arrive trop grande et floue ; 5.23 « pwofesyonèl » : coche verte + la carte se pose.
  PISTE CAMÉRA : dérive y +12 px/s ; cran x -80 sur Biznis à 1.80, x +80 sur Pwodwi à 2.90, recentrage à 4.40.
  IMAGE CLÉ : 2.30 : la vitrine Biznis posée sur la bande, « …yon [biznis,] » en bas.

## Frame 7 : Konpetans sa

- scene: La carte pub se retourne : au dos, le mot « Konpetans » ; un petit cadenas s'ouvre à moitié.
- duration: 2.15s
- start: 31.90
- transition_in: cut
- status: storyboard
- src: compositions/frames/07-konpetans-sa.html
- voiceover: "ebyen ou ta dwe gen konpetans sa."
- type: problem
- blueprint: kinetic-type-beats (Adapt)
- focal: le mot Konpetans
- rules: kinetic-beat-slam
- world: light
- handoff_in: à 6.10 local (31.90 global) : caméra cam(540, 3050, 1.0), dérive, flou 0 ; stations Biznis et Pwodwi posées, carte « Piblisite pwofesyonèl » au centre
- handoff_out: à 2.15 local (34.05 global) : caméra cam(540, 3350, 1.0) en descente courte (+150 px/s), carte « Konpetans » sortie par le haut ; station Kreyatè à venir floue en bas

Word cues: ebyen@0.17 ou@0.50 ta@0.63 dwe@0.75 gen@0.91 konpetans@1.09 sa.@1.47

Scene 1 (0.00 à 2.15 s)
  TEXTE ÉCRAN : « ebyen ou ta dwe gen [boîte : konpetans] sa. »
  ÉTAPES : 0.17 la carte pub se retourne (rotationY 0 → 180, 0,3 s) ; 0.60 au dos : « KONPETANS » en Inter 800 ; 1.09 « konpetans » : le mot s'imprime en accent ; 1.60 la carte remonte, 2.00 descente.
  IMAGE CLÉ : 1.20 : la carte retournée « KONPETANS », Biznis et Pwodwi flous de part et d'autre.

## Frame 8 : Kreyatè kontni

- scene: Une carte profil de créateur (avatar cercle, « @kreyatè », grille de 6 vignettes vidéo) ; trois vignettes « serye » s'allument ; deux vignettes « IA » grises, aux visages lisses, sont marquées d'un tampon « IA » et glissent hors de la grille.
- duration: 7.05s
- start: 34.05
- transition_in: cut
- status: storyboard
- src: compositions/frames/08-kreyate-kontni.html
- voiceover: "Oubyen ou ta vle vin yon kreyatè kontni k ap pibliye videyo ki serye, ki pa sanble ak videyo ki jenere avèk IA."
- type: problem
- blueprint: grid-card-assemble (Adapt)
- focal: la grille du créateur
- rules: dynamic-content-sequencing, spring-pop-entrance
- world: light
- handoff_in: à 2.15 local (34.05 global) : caméra cam(540, 3350, 1.0) en descente courte (+150 px/s), carte « Konpetans » sortie par le haut ; station Kreyatè à venir floue en bas
- handoff_out: à 7.05 local (41.10 global) : caméra cam(540, 3350, 0.85) en recul ; grille du créateur avec 4 vignettes serye ; la bande commence à se tendre (vibration 1 px)

Word cues: Oubyen@0.11 ou@0.40 ta@0.60 vle@0.88 vin@1.08 yon@1.27 kreyatè@1.61 kontni@2.14 k@2.56 ap@2.68 pibliye@2.84 videyo@3.24 ki@3.62 serye,@3.77 ki@4.47 pa@4.73 sanble@4.88 ak@5.14 videyo@5.27 ki@5.60 jenere@5.73 avèk@6.00 IA.@6.22

Scene 1 (0.00 à 7.05 s)
  TEXTE ÉCRAN : « Oubyen ou ta vle vin yon kreyatè kontni » puis « k ap pibliye videyo ki [boîte : serye,] » puis « ki pa sanble ak videyo ki jenere avèk IA. »
  ÉTAPES : 0.11 fin de descente ; 1.61 « kreyatè » : la carte profil s'ouvre (signature 2) ; 2.14 avatar + « @kreyatè » ; 2.84 « pibliye » : les 6 vignettes tombent (0,05 s d'écart) ; 3.77 « serye » : 4 vignettes s'allument d'un liseré accent ; 4.08–4.47 silence : la grille respire ; 5.27 deux vignettes grises « IA » ; 6.22 « IA » : tampon gris, elles glissent hors de la grille (0,25 s) ; 6.60 recul.
  IMAGE CLÉ : 4.00 : la grille du créateur, 4 vignettes serye allumées, « …videyo ki [serye,] » en bas.

## Frame 9 : Se yon konpetans (pivot)

- scene: Moment typographique : la phrase « Ebyen, se yon konpetans. » centrée ; la bande se coupe ; noir ; un point de lumière accent.
- duration: 3.80s
- start: 41.10
- transition_in: cut
- status: storyboard
- src: compositions/frames/09-se-yon-konpetans.html
- voiceover: "Ebyen, se yon konpetans."
- type: pivot
- blueprint: titlecard-reveal (Adapt)
- focal: la phrase seule
- rules: kinetic-beat-slam, ambient-glow-bloom
- world: light→dark
- handoff_in: à 7.05 local (41.10 global) : caméra cam(540, 3350, 0.85) en recul ; grille du créateur avec 4 vignettes serye ; la bande commence à se tendre (vibration 1 px)
- handoff_out: à 3.80 local (44.90 global) : noir #141312, un point de lumière accent ø 30 px au centre (540, 760) qui commence à s'ouvrir

Word cues: Ebyen,@0.27 se@0.89 yon@1.13 konpetans.@1.40

Scene 1 (0.00 à 2.10 s) : la phrase
  TEXTE ÉCRAN : moment typographique centré (y 860, 84 px) : « Ebyen, se yon [boîte : konpetans.] » (pas de sous-titre en bas)
  ÉTAPES : 0.27 « Ebyen, » ; 0.89 la bande derrière se vide de ses couleurs ; 1.40 « konpetans. » en boîte ; 1.80 la bande se coupe en deux au milieu (0,2 s).
Scene 2 (2.10 à 3.80 s) : noir
  ÉTAPES : 2.10 coupe franche au noir (43.20 global, impact grave) ; 2.10 → 3.40 noir vivant (grain) ; 3.40 un point de lumière accent naît au centre.
  SON : riser 40.20 → 43.20, impact 43.20, silence.

## Frame 10 : Atelye Dijital

- scene: La lumière : le point s'ouvre en cercle sur le papier ; la bande réapparaît, claire, et la marque « ATELYE DIJITAL » s'assemble au-dessus d'elle.
- duration: 2.25s
- start: 44.90
- transition_in: cut
- status: storyboard
- src: compositions/frames/10-atelye-dijital.html
- voiceover: "Se sa n ap montre w nan Atelye Dijital."
- type: brand
- blueprint: logo-assemble-lockup (Adapt)
- focal: la marque
- rules: center-outward-expansion, spring-pop-entrance
- world: dark→light
- handoff_in: à 3.80 local (44.90 global) : noir #141312, un point de lumière accent ø 30 px au centre (540, 760) qui commence à s'ouvrir
- handoff_out: à 2.25 local (47.15 global) : papier, caméra cam(540, 4000, 1.0) en descente (+200 px/s) ; la marque remonte hors du cadre ; la bande claire, règle « MODIL 1 » qui arrive

Word cues: Se@0.05 sa@0.39 n@0.53 ap@0.64 montre@0.78 w@1.08 nan@1.19 Levye@1.38 Dijital.@1.63

Scene 1 (0.00 à 2.25 s)
  TEXTE ÉCRAN : sous-titre « Se sa n ap montre w nan [trait : Atelye Dijital.] »
  ÉTAPES : 0.05 le point s'ouvre en cercle jusqu'à couvrir le cadre (0,35 s expo.out, sparkle) ; 0.40 la bande claire est là ; 1.38 « Atelye » : ATELYE s'assemble lettre par lettre (0,03 s d'écart, de y +40) ; 1.63 « Dijital. » : DIJITAL en accent ; 1.70 « Fòmasyon · Pratik · Pwojè » ; 2.00 descente.
  SON : sparkle 45.00, chime 46.28.
  IMAGE CLÉ : 1.90 : ATELYE DIJITAL sur le papier, la bande claire dessous, le trait accent sous « Atelye Dijital. »

## Frame 11 : Facebook Ads

- scene: Station MODIL 1 : « 2 jou fòmasyon + pratik » puis le vrai logo Facebook et une carte Ads Manager (HTML) qui s'ouvre.
- duration: 3.80s
- start: 47.15
- transition_in: cut
- status: storyboard
- src: compositions/frames/11-facebook-ads.html
- voiceover: "De jou fòmasyon ak pratik pou metrize Facebook Ads,"
- type: solution
- blueprint: spatial-pan-stations (Adapt)
- focal: la station Facebook Ads
- rules: spring-pop-entrance, svg-icon-enrichment
- world: light
- handoff_in: à 2.25 local (47.15 global) : papier, caméra cam(540, 4000, 1.0) en descente (+200 px/s) ; la marque remonte hors du cadre ; la bande claire, règle « MODIL 1 » qui arrive
- handoff_out: à 3.80 local (50.95 global) : caméra cam(620, 4200, 1.0), station M1 ouverte (carte Ads Manager), dérive

Word cues: De@0.15 jou@0.31 fòmasyon@0.52 ak@0.91 pratik@1.19 pou@1.58 metrize@1.81 Facebook@2.42 Ads,@2.93

Scene 1 (0.00 à 3.80 s)
  TEXTE ÉCRAN : « [boîte : De jou] fòmasyon ak pratik » puis « pou metrize Facebook Ads, »
  ÉTAPES : 0.15 « De » : la tête de lecture s'arrête sur « MODIL 1 » ; 0.25 station s'ouvre (signature 2) ; 0.31 « 2 JOU » en gros ; 1.19 « pratik » : petites pastilles « Teyori » et « Pratik » ; 2.42 « Facebook » : le vrai logo Facebook arrive trop grand et flou, se pose ; 2.93 la carte Ads Manager (HTML : « Kanpay », « Bidjè », graphique) s'ouvre.
  SON : whoosh court 47.30.

## Frame 12 : Santèn milye moun

- scene: Dans la carte Ads Manager : une foule de points-personnes se multiplie autour du téléphone ; le champ « Bidjè » affiche « ti kòb » (pas de chiffre).
- duration: 6.00s
- start: 50.95
- transition_in: cut
- status: storyboard
- src: compositions/frames/12-santen-milye-moun.html
- voiceover: "pou w ka fè yon piblisite ki ateyn petèt plizyè santèn milye moun, tout pandan w ap depanse yon ti kòb."
- type: solution
- blueprint: dataviz-countup (Adapt)
- focal: la portée qui s'étend
- rules: particle-burst, depth-scatter-assemble
- world: light
- handoff_in: à 3.80 local (50.95 global) : caméra cam(620, 4200, 1.0), station M1 ouverte (carte Ads Manager), dérive
- handoff_out: à 6.00 local (56.95 global) : caméra cam(620, 4800, 1.0) en descente (+250 px/s), flou 6 px ; M1 remonte

Word cues: pou@0.16 w@0.43 ka@0.53 fè@0.68 yon@0.82 piblisite@1.02 ki@1.48 ateyn@1.62 petèt@1.87 plizyè@2.30 santèn@2.58 milye@2.86 moun,@3.11 tout@3.36 pandan@3.68 w@4.03 ap@4.16 depanse@4.30 yon@4.72 ti@4.89 kòb.@5.04

Scene 1 (0.00 à 6.00 s)
  TEXTE ÉCRAN : « pou w ka fè yon piblisite ki ateyn » puis « petèt plizyè [boîte : santèn milye] moun, » puis « tout pandan w ap depanse yon ti kòb. »
  ÉTAPES : 1.02 une pub (carte 9:16 miniature) au centre ; 1.62 « ateyn » : un anneau d'onde part de la pub ; 2.30 → 3.11 les points-personnes se multiplient par cercles (×10, ×100 en densité, 3 anneaux) ; 3.36 → 4.30 recul pour voir la foule ; 4.89 « ti kòb » : le champ Bidjè avec une petite pièce ; 5.70 descente.
  IMAGE CLÉ : 3.00 : la pub au centre, trois anneaux de points-personnes, « …plizyè [santèn milye] moun, »

## Frame 13 : Ajan IA

- scene: Station MODIL 2 : « Ajan IA tankou Claude » : trois tuiles d'agents (logo Claude « Kontni », « Kliyan », logo WhatsApp « Otomatizasyon ») ; la tuile WhatsApp ouvre une petite conversation à réponse automatique.
- duration: 7.45s
- start: 56.95
- transition_in: cut
- status: storyboard
- src: compositions/frames/13-ajan-ia.html
- voiceover: "N ap montre w kòman pou itilize ajan tankou Claude ak lòt ankò pou kreye kontni, jere kliyan, fè otomatizasyon WhatsApp."
- type: solution
- blueprint: constellation-hub (Adapt)
- focal: les trois agents
- rules: spring-pop-entrance, svg-icon-enrichment
- world: light
- handoff_in: à 6.00 local (56.95 global) : caméra cam(620, 4800, 1.0) en descente (+250 px/s), flou 6 px ; M1 remonte
- handoff_out: à 7.45 local (64.40 global) : caméra cam(620, 5600, 1.0) en descente (+250 px/s) flou 6 px ; M2 remonte

Word cues: N@0.19 ap@0.28 montre@0.43 w@0.73 kòman@0.91 pou@1.38 itilize@1.58 ajan@1.92 tankou@2.14 Claude@2.51 ak@2.98 lòt@3.14 ankò@3.36 pou@3.81 kreye@4.01 kontni,@4.31 jere@4.69 kliyan,@5.21 fè@6.02 otomatizasyon@6.19 WhatsApp.@6.80

Scene 1 (0.00 à 7.45 s)
  TEXTE ÉCRAN : « N ap montre w kòman pou itilize » puis « ajan tankou [boîte : Claude] ak lòt ankò » puis « pou kreye kontni, jere kliyan, » puis « fè otomatizasyon WhatsApp. »
  ÉTAPES : 0.15 station M2 s'ouvre (signature 2) ; 1.92 « ajan » ; 2.51 « Claude » : la tuile logo Claude (rime de la fenêtre d'ouverture) ; 4.31 « kontni » : sous-tuile « Kontni » ; 5.21 « kliyan » : tuile « Kliyan » (fiche client HTML) ; 6.19 « otomatizasyon » : tuile WhatsApp, une bulle entrante « Bonjou, ki pri a ? » et la réponse automatique « Men pri a… » tombe 0,3 s après ; 7.10 descente.
  SON : whoosh court 57.00.

## Frame 14 : Pwodwi dijital

- scene: Station MODIL 3 : l'IA crée un produit digital : une couverture d'e-book (HTML) se compose sous nos yeux (titre, image, bouton « Achte »).
- duration: 5.65s
- start: 64.40
- transition_in: cut
- status: storyboard
- src: compositions/frames/14-pwodwi-dijital.html
- voiceover: "Epi n ap montre w kòman tou pou itilize entèlijans atifisyèl pou kreye premye pwodwi dijital ou."
- type: solution
- blueprint: prompt-type-submit-generate (Adapt)
- focal: l'e-book qui se compose
- rules: waterfall-entry
- world: light
- handoff_in: à 7.45 local (64.40 global) : caméra cam(620, 5600, 1.0) en descente (+250 px/s) flou 6 px ; M2 remonte
- handoff_out: à 5.65 local (70.05 global) : caméra cam(620, 6400, 1.0), e-book posé au centre, dérive

Word cues: Epi@0.22 n@0.46 ap@0.69 montre@0.83 w@1.13 kòman@1.25 tou@1.53 pou@1.77 itilize@2.04 entèlijans@2.36 atifisyèl@2.87 pou@3.27 kreye@3.45 premye@3.89 pwodwi@4.43 dijital@4.78 ou.@5.13

Scene 1 (0.00 à 5.65 s)
  TEXTE ÉCRAN : « Epi n ap montre w kòman tou » puis « pou itilize entèlijans atifisyèl » puis « pou kreye premye [boîte : pwodwi dijital] ou. »
  ÉTAPES : 0.25 station M3 s'ouvre ; 2.36 « entèlijans » : l'étoile Claude au-dessus d'un cadre vide ; 3.45 « kreye » : la couverture se compose (fond accent, titre, image, bouton) en cascade (0,06 s d'écart) ; 4.43 « pwodwi » : l'e-book prend son épaisseur (ombre) ; 5.13 se pose.
  SON : whoosh court 64.55.

## Frame 15 : Vann li plizyè fwa

- scene: L'e-book reste au centre ; un compteur « vant » roule : 1 → 10 (« dizèn ») → 100 (« santèn ») ; de petites copies partent vers des téléphones autour.
- duration: 5.90s
- start: 70.05
- transition_in: cut
- status: storyboard
- src: compositions/frames/15-vann-li-plizye-fwa.html
- voiceover: "Yon pwodwi w kreye yon sèl fwa, men ou ka vann li plizyè dizèn fwa, e plizyè santèn fwa."
- type: solution
- blueprint: dataviz-countup (Adapt)
- focal: le compteur de ventes
- rules: counting-dynamic-scale
- world: light
- handoff_in: à 5.65 local (70.05 global) : caméra cam(620, 6400, 1.0), e-book posé au centre, dérive
- handoff_out: à 5.90 local (75.95 global) : caméra cam(620, 7200, 1.0) en descente (+250 px/s) flou 6 px

Word cues: Yon@0.16 pwodwi@0.29 w@0.54 kreye@0.67 yon@0.90 sèl@1.06 fwa,@1.23 men@1.76 ou@1.97 ka@2.13 vann@2.29 li@2.69 plizyè@2.88 dizèn@3.20 fwa,@3.47 e@3.81 plizyè@3.93 santèn@4.25 fwa.@4.58

Scene 1 (0.00 à 5.90 s)
  TEXTE ÉCRAN : « Yon pwodwi w kreye [boîte : yon sèl fwa,] » puis « men ou ka vann li plizyè dizèn fwa, » puis « e plizyè santèn fwa. »
  ÉTAPES : 1.06 « sèl » : badge « ×1 » ; 2.29 « vann » : une copie part de l'e-book ; 3.20 « dizèn » : le compteur roule 1 → 10 (0,4 s), 10 copies en éventail ; 4.25 « santèn » : 10 → 100 (0,5 s), l'éventail devient un nuage ; 5.40 descente.
  IMAGE CLÉ : 4.80 : l'e-book, le compteur « 100 vant », le nuage de copies.

## Frame 16 : Atelye : aprantisaj, pratik, pwojè

- scene: Station MODIL 4 : trois piliers s'impriment sur la bande (Aprantisaj, Pratik, Pwojè an gwoup) ; sur « gwoup », la photo du groupe (team.png) s'ouvre.
- duration: 5.00s
- start: 75.95
- transition_in: cut
- status: storyboard
- src: compositions/frames/16-atelye-aprantisaj-prat.html
- voiceover: "Se yon atelye ki pral mete aksan sou aprantisaj, pratik ak pwojè an gwoup."
- type: solution
- blueprint: spatial-pan-stations (Adapt)
- focal: les trois piliers, puis le groupe
- rules: spring-pop-entrance
- world: light
- handoff_in: à 5.90 local (75.95 global) : caméra cam(620, 7200, 1.0) en descente (+250 px/s) flou 6 px
- handoff_out: à 5.00 local (80.95 global) : caméra cam(620, 7900, 1.0) en descente flou 6 px ; photo du groupe qui remonte

Word cues: Se@0.18 yon@0.34 atelye@0.56 ki@0.89 pral@1.05 mete@1.30 aksan@1.55 sou@1.84 aprantisaj,@2.06 pratik@2.63 ak@3.26 pwojè@3.42 an@4.26 gwoup.@4.42

Scene 1 (0.00 à 5.00 s)
  TEXTE ÉCRAN : « Se yon atelye ki pral mete aksan » puis « sou aprantisaj, pratik ak [boîte : pwojè an gwoup.] »
  ÉTAPES : 0.18 station M4 s'ouvre ; 0.56 « atelye » ; 2.06 pilier 1 « Aprantisaj » ; 2.63 pilier 2 « Pratik » ; 3.42 pilier 3 « Pwojè an gwoup » ; 4.26 « gwoup » : la photo du groupe s'ouvre (signature 2) entre les piliers ; 4.70 descente.
  SON : whoosh court 76.00.

## Frame 17 : Resous gratis

- scene: Station MODIL 5 : un dossier « Resous » (HTML) s'ouvre ; des fiches PDF, DOC, VIDEYO en sortent ; tampon « GRATIS ».
- duration: 3.50s
- start: 80.95
- transition_in: cut
- status: storyboard
- src: compositions/frames/17-resous-gratis.html
- voiceover: "Anplis de sa, w ap resevwa tout resous gratis ki nesesè."
- type: solution
- blueprint: grid-card-assemble (Adapt)
- focal: le dossier de ressources
- rules: spring-pop-entrance
- world: light
- handoff_in: à 5.00 local (80.95 global) : caméra cam(620, 7900, 1.0) en descente flou 6 px ; photo du groupe qui remonte
- handoff_out: à 3.50 local (84.45 global) : caméra cam(620, 8600, 1.0), dossier posé, dérive

Word cues: Anplis@0.23 de@0.54 sa,@0.70 w@1.13 ap@1.26 resevwa@1.41 tout@1.85 resous@2.12 gratis@2.43 ki@2.80 nesesè.@2.95

Scene 1 (0.00 à 3.50 s)
  TEXTE ÉCRAN : « Anplis de sa, w ap resevwa » puis « tout resous [boîte : gratis] ki nesesè. »
  ÉTAPES : 0.15 station M5 ; 1.41 « resevwa » : le dossier arrive ; 2.12 « resous » : trois fiches (PDF, DOC, VIDEYO) jaillissent du dossier ; 2.43 « gratis » : tampon « GRATIS » ; 3.20 dérive.
  SON : whoosh court 81.00.

## Frame 18 : Gwoup WhatsApp, yon mwa

- scene: Le dossier se range ; une conversation de groupe WhatsApp « Atelye Dijital · Patisipan » s'ouvre (HTML) ; la règle à côté s'étire sur 30 jours avec « 1 MWA ».
- duration: 5.95s
- start: 84.45
- transition_in: cut
- status: storyboard
- src: compositions/frames/18-gwoup-whatsapp-yon-mwa.html
- voiceover: "E n ap mete nou nan yon gwoup WhatsApp pou nou kontinye asiste patisipan yo pandan yon mwa."
- type: solution
- blueprint: device-surface-showcase (Adapt)
- focal: le groupe WhatsApp
- rules: spring-pop-entrance
- world: light
- handoff_in: à 3.50 local (84.45 global) : caméra cam(620, 8600, 1.0), dossier posé, dérive
- handoff_out: à 5.95 local (90.40 global) : caméra cam(620, 9300, 1.0) en descente (+250 px/s) flou 6 px ; le groupe remonte ; la règle commence à porter des jours

Word cues: E@0.18 n@0.28 ap@0.37 mete@0.50 nou@0.69 nan@0.85 yon@1.03 gwoup@1.19 WhatsApp@1.54 pou@1.96 nou@2.16 kontinye@2.38 asiste@2.78 patisipan@3.13 yo@3.60 pandan@3.76 yon@4.61 mwa.@5.08

Scene 1 (0.00 à 5.95 s)
  TEXTE ÉCRAN : « E n ap mete nou nan yon gwoup WhatsApp » puis « pou nou kontinye asiste patisipan yo » puis « pandan [boîte : yon mwa.] »
  ÉTAPES : 1.19 « gwoup » : la conversation de groupe s'ouvre (en-tête vert, avatars initiales) ; 1.54 « WhatsApp » : logo ; 2.38 « kontinye » : messages qui arrivent (question / réponse) 0,4 s d'écart ; 3.76 « pandan » : la règle de gauche s'imprime « J1… J30 » ; 5.08 « mwa » : accolade accent « 1 MWA » ; 5.60 descente.
  SON : notifications douces 87.00, 87.40.

## Frame 19 : Dat la

- scene: La règle devient le calendrier : « SAM 24 OKT » puis « SAM 31 OKT » s'allument ; « 2026 ».
- duration: 5.05s
- start: 90.40
- transition_in: cut
- status: storyboard
- src: compositions/frames/19-dat-la-dat2.html
- voiceover: "Dat la se samdi 24 oktòb ak 31 oktòb 2026 la."
- type: info
- blueprint: titlecard-reveal (Adapt)
- focal: les deux dates
- rules: kinetic-beat-slam
- world: light
- handoff_in: à 5.95 local (90.40 global) : caméra cam(620, 9300, 1.0) en descente (+250 px/s) flou 6 px ; le groupe remonte ; la règle commence à porter des jours
- handoff_out: à 3.80 local (94.20 global) : caméra cam(620, 10000, 1.0) en descente flou 6 px ; dates posées remontent

Word cues: Dat@0.25 la@0.47 se@0.70 samdi@0.82 24@1.15 oktòb@1.78 ak@2.27 31@2.46 oktòb@3.09 2026@3.57 la.@4.32

Scene 1 (0.00 à 3.80 s)
  TEXTE ÉCRAN : « Dat la se samdi [boîte : 24] oktòb » puis « ak [trait : 31] oktòb 2026 la. »
  ÉTAPES : 0.30 station calendrier s'ouvre ; 1.15 « 24 » : « SAM 24 » + gros « 24 OKT » ; 2.46 « 31 » : « SAM 31 » + gros « 31 OKT » ; 3.57 « 2026 » ; 4.65 descente.
  SON : whoosh court 90.55.

## Frame 20 : Lè a

- scene: La tête de lecture devient l'aiguille d'une horloge (HTML) : de 10h00 à 4h00, l'arc se remplit en accent.
- duration: 2.40s
- start: 95.45
- transition_in: cut
- status: storyboard
- src: compositions/frames/20-le-a.html
- voiceover: "10è nan maten pou rive 4è nan apremidi."
- type: info
- blueprint: fixed-anchor-cycle (Adapt)
- focal: l'horloge
- rules: svg-path-draw
- world: light
- handoff_in: à 3.80 local (94.20 global) : caméra cam(620, 10000, 1.0) en descente flou 6 px ; dates posées remontent
- handoff_out: à 2.40 local (96.60 global) : caméra cam(540, 10200, 1.0) ; horloge 10:00 AM → 4:00 PM ; la bande commence à se replier

Word cues: 10è@0.17 nan@0.37 maten@0.59 pou@0.94 rive@1.24 4è@1.50 nan@1.82 apremidi.@2.04

Scene 1 (0.00 à 2.40 s)
  TEXTE ÉCRAN : « [boîte : 10è] nan maten pou rive 4è nan apremidi. »
  ÉTAPES : 0.17 l'horloge : aiguille sur 10 ; « 10:00 AM » ; 1.50 « 4è » : l'aiguille tourne jusqu'à 4, l'arc accent se remplit (0,5 s) ; « 4:00 PM » ; 2.10 la bande se replie.

## Frame 21 : Lokal la

- scene: La bande se replie et devient une carte vue de dessus ; l'épingle tombe et se plante sur la photo du Sassou's Lamadone Club ; « Plas Anacaona » sur la carte, à côté.
- duration: 4.45s
- start: 97.85
- transition_in: cut
- status: storyboard
- src: compositions/frames/21-lokal-la.html
- voiceover: "Lokal la se Sassou's Lamadone Club, anfas Plas Anacaona."
- type: info
- blueprint: camera-journey (Adapt)
- focal: l'épingle sur le Sassou's
- rules: physics-press-reaction, coordinate-target-zoom
- world: light
- handoff_in: à 2.40 local (96.60 global) : caméra cam(540, 10200, 1.0) ; horloge 10:00 AM → 4:00 PM ; la bande commence à se replier
- handoff_out: à 4.45 local (101.05 global) : caméra cam(540, 900, 1.0) sur la carte (nouveau repère « carte »), photo du Sassou's épinglée, recul en cours

Word cues: Lokal@0.15 la@0.86 se@1.04 Sassou's@1.22 Lamadone@1.66 Club,@2.13 anfas@2.76 Plas@3.07 Anacaona.@3.43

Scene 1 (0.00 à 4.45 s)
  TEXTE ÉCRAN : « Lokal la se Sassou's Lamadone Club, » puis « anfas [boîte : Plas Anacaona.] »
  ÉTAPES : 0.15 la bande se couche et se replie en carte (rues, 0,6 s) ; 1.22 « Sassou's » : la photo du Sassou's s'ouvre ; 1.66 l'épingle tombe (0,25 s power2.in) et se plante sur la photo, anneau accent ; 3.07 « Plas » : marqueur « Plas Anacaona » de l'autre côté de la rue ; 3.43 un trait pointillé relie les deux ; 4.10 recul.
  IMAGE CLÉ : 2.00 : la photo du Sassou's sur la carte, l'épingle plantée, son anneau.

## Frame 22 : 30 plas

- scene: Une grille de 30 places (6x5) ; les places s'allument une à une jusqu'à 30 ; « si w rive an reta » : une petite porte se ferme sur le côté.
- duration: 6.10s
- start: 102.30
- transition_in: cut
- status: storyboard
- src: compositions/frames/22-30-plas.html
- voiceover: "N ap fè nou konnen plas yo limite a 30 moun sèlman, kidonk si w rive an reta, n ap dezole pou ou."
- type: urgency
- blueprint: dataviz-countup (Adapt)
- focal: les 30 places
- rules: stat-bars-and-fills
- world: light
- handoff_in: à 4.45 local (101.05 global) : caméra cam(540, 900, 1.0) sur la carte (nouveau repère « carte »), photo du Sassou's épinglée, recul en cours
- handoff_out: à 6.10 local (107.15 global) : caméra cam(540, 900, 1.0) ; grille 30/30 allumée, la carte et l'épingle floues derrière

Word cues: N@0.14 ap@0.22 fè@0.35 nou@0.48 konnen@0.66 plas@0.98 yo@1.18 limite@1.31 a@1.79 30@1.89 moun@2.02 sèlman,@2.22 kidonk@2.75 si@3.38 w@3.52 rive@3.61 an@3.81 reta,@3.94 n@4.68 ap@4.76 dezole@4.90 pou@5.18 ou.@5.42

Scene 1 (0.00 à 6.10 s)
  TEXTE ÉCRAN : « N ap fè nou konnen plas yo limite » puis « a [boîte : 30 moun] sèlman, » puis « kidonk si w rive an reta, n ap dezole pou ou. »
  ÉTAPES : 0.98 « plas » : la grille vide arrive ; 1.89 « 30 » : « 30 » en gros, les places s'allument une à une (0,03 s d'écart, ticks) ; 3.61 « rive an reta » : petite horloge qui dépasse ; 4.90 « dezole » : la porte se ferme doucement ; 5.80 dérive.
  SON : ticks 103.00 → 104.00.

## Frame 23 : WhatsApp

- scene: Le bouton vert « Kontakte nou sou WhatsApp » arrive ; la tête de lecture devenue curseur arrive en courbe et clique ; le numéro « 31 43 3938 » s'imprime chiffre par chiffre.
- duration: 8.55s
- start: 108.40
- transition_in: cut
- status: storyboard
- src: compositions/frames/23-whatsapp.html
- voiceover: "Pou rezève plas ou, tanpri kontakte nou kounye a sou WhatsApp, oswa klike sou lyen WhatsApp ki anba videyo sa a, oubyen ekri nou sou 31 43 3938."
- type: cta
- blueprint: cta-morph-press (Adapt)
- focal: le bouton WhatsApp et le numéro
- rules: cursor-click-ripple, press-release-spring
- world: light
- handoff_in: à 6.10 local (107.15 global) : caméra cam(540, 900, 1.0) ; grille 30/30 allumée, la carte et l'épingle floues derrière
- handoff_out: à 8.55 local (115.70 global) : caméra cam(540, 900, 1.0), bouton WhatsApp avec le numéro, curseur posé à côté

Word cues: Pou@0.13 rezève@0.31 plas@0.61 ou,@0.83 tanpri@1.28 kontakte@1.63 nou@2.07 kounye@2.28 a@2.59 sou@2.70 WhatsApp,@2.91 oswa@3.47 klike@3.70 sou@4.06 lyen@4.26 WhatsApp@4.48 ki@5.31 anba@5.43 videyo@5.67 sa@5.97 a,@6.11 oubyen@6.41 ekri@6.73 nou@6.95 sou@7.15 31@7.55 43@7.70 3938.@7.95

Scene 1 (0.00 à 8.55 s)
  TEXTE ÉCRAN : « Pou rezève plas ou, » puis « tanpri kontakte nou kounye a sou [boîte : WhatsApp,] » puis « oswa klike sou lyen WhatsApp ki anba videyo sa a, » puis « oubyen ekri nou sou 31 43 3938. »
  ÉTAPES : 0.31 « rezève » : une place de la grille se détache et vole vers le haut ; 1.63 « kontakte » : le bouton WhatsApp arrive trop grand et flou, se pose ; 2.91 « WhatsApp » : le curseur arrive en courbe (0,45 s) et clique (anneau accent) ; 4.26 « lyen » : une flèche pointe vers le bas (vers le lien sous la vidéo) ; 4.48 deuxième clic ; 7.55 « 31 » : le numéro s'imprime en gros sous le bouton, chiffre par chiffre, jusqu'à 3938 (8.20) ; 8.40 recul.
  SON : clic 110.10, clic 111.70, chime 115.10 (temps de la variante A).

## Frame 24 : Fòmilè + fen

- scene: Le lien « atelyedijital.vercel.app » se tape dans une pilule ; le curseur clique ; recul final : carte de fin (ATELYE DIJITAL, Samdi 24 & 31 oktòb 2026, Sassou's Lamadone Club, bouton WhatsApp, lien) ; les 5 pistes pleines en miniature ; tenue vivante puis iris.
- duration: 14.50s
- start: 116.95
- transition_in: cut
- status: storyboard
- src: compositions/frames/24-fomile-fen-dat2.html
- voiceover: "Ou ka ranpli fòmilè enskripsyon an tou, lè w ale sou atelyedijital.vercel.app"
- type: end
- blueprint: cta-morph-press (Adapt)
- focal: le lien, puis la carte de fin
- rules: cursor-click-ripple, viewport-change
- world: light
- handoff_in: à 8.55 local (115.70 global) : caméra cam(540, 900, 1.0), bouton WhatsApp avec le numéro, curseur posé à côté
- handoff_out: fin du film (131.45) : iris fermé

Word cues: Ou@0.13 ka@0.42 ranpli@0.60 fòmilè@0.94 enskripsyon@1.33 an@1.97 tou,@2.14 lè@2.40 w@2.60 atelyedijital.vercel.app@2.70 ale@2.73 sou@2.94

Scene 1 (0.00 à 4.40 s) : le lien
  TEXTE ÉCRAN : « Ou ka ranpli fòmilè enskripsyon an tou, » puis « lè w ale sou [trait : atelyedijital.vercel.app] »
  ÉTAPES : 0.94 « fòmilè » : une carte formulaire (3 champs HTML : Non, Telefòn, Klike) arrive ; 2.73 « ale » : la pilule de lien ; 3.18 l'URL se tape (0,9 s, typing) ; 4.00 le curseur clique la pilule.
Scene 2 (4.40 à 8.69 s) : carte de fin
  TEXTE ÉCRAN : aucun sous-titre ; la carte : ATELYE DIJITAL, « Samdi 24 & 31 oktòb 2026 · 10:00 AM – 4:00 PM », « Sassou's Lamadone Club · anfas Plas Anacaona », bouton WhatsApp « 31 43 3938 », lien.
  ÉTAPES : 4.40 recul : tout le film se ramasse (implosion 0,5 s) puis la carte de fin s'assemble (0,3 s, cascade) ; 5.20 la miniature des 5 pistes pleines (rime) ; 5.60 → 7.90 tenue vivante (dérive, l'anneau du bouton respire) ; 7.90 → 8.69 iris vers le bouton WhatsApp.
  SON : typing 118.40 → 120.10, clic 120.11, whoosh-cinematic 123.61 (temps de la variante A).
