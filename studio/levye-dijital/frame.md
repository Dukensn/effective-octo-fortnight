---
name: "Levye Dijital: launch frame"
description: >
  Video-first frame spec for the Levye Dijital WhatsApp-status ad (9:16, 1080x1920, 30 fps, 124.39 s, Haitian Creole
  voice). Metaphor: the ad is BUILT under our eyes on a vertical editing strip (la bande), and that same strip becomes
  the workshop program, then the calendar, then folds into a map whose pin lands on Sassou's Lamadone Club.
  Light paper world everywhere except the pivot (warm black). One accent only, Claude orange, kept for what matters.
---

# Levye Dijital: frame spec

## Canvas and safe zones (9:16)

- Canvas 1080x1920, 30 fps. The video is seen as a WhatsApp status: the top 150 px carry the status progress bars and
  the bottom 220 px the "Reponn" bar. Nothing important above y 160 or below y 1700.
- **Subtitle band**: y 1430 to 1640, centered, nothing else in it (no card, no line crosses it). Above it, the stage:
  y 160 to 1400 (the subject of the sentence lives there, centered on x 540 with equal side margins ≥ 70 px).

## Colors (roles, one color per role)

```yaml
colors:
  paper: "#EFECE6"          # light world ground (with the dot texture)
  paper-2: "#F8F6F2"        # the strip (la bande) surface
  lane: "#EBE7DF"           # empty track lane
  card: "#FFFFFF"           # cards
  ink-dark: "#1B1A18"       # text on light
  ink-dark-soft: "#5A554E"
  ink-mute: "#8C877F"       # labels, ruler numbers
  hairline: "#D9D3C9"       # ruler ticks, dividers
  dot: "#DAD5CC"            # the 44 px dot grid of the paper (makes the camera drift visible)
  stage: "#141312"          # pivot black
  ink-light: "#F3EFE8"      # text on black
  accent: "#D97757"         # THE accent (Claude orange): key-word box text, peak stroke, playhead, the pin's ring, CTA ring
  accent-pale: "#F7DCCF"    # key-word box fill
  accent-deep: "#B5532F"    # key-word box text
  accent-glow: "#E89A7C"
```
Brand colors are allowed ONLY inside real tool tiles / interfaces: WhatsApp #25D366 (+ header #075E54), Facebook
#0866FF, the red map pin #E5352B (the pin itself, from the image bank). Track colors (inside the strip only): Tèks =
accent, Imaj #5B8DEF, Tranzisyon #9B7BE8, Son #4CB98A, Mizik #E2B23C, Vwa #1B1A18.

## Typography (local files only, assets/fonts/)

- Inter (Regular 400, Medium 500, SemiBold 600, Bold 700, ExtraBold 800) for everything; InterDisplay Black 900 for the
  wordmark and the 3 typographic moments. `@font-face` from `assets/fonts/Inter-*.otf` / `InterDisplay-*.otf`.
- Subtitle: Inter 500, 60 px, line-height 1.28, letter-spacing -0.5 px, ink-dark, max 2 lines (≈ 26 characters/line),
  soft paper halo behind (linear-gradient band, never a box).
- Labels / ruler: Inter 600 26 px uppercase, letter-spacing 2 px, ink-mute.
- Wordmark: "LEVYE" ink-dark + "DIJITAL" accent, InterDisplay 900, 150 px, letter-spacing -4 px.

## Subtitle and its two highlights

- Word by word on the voice (frame-local cues, 0 to 2 frames early), each word: y +18 → 0, blur 4 → 0, opacity 0 → 1
  in 0.12 s expo.out. Leaves 0.12 s before the next sentence (opacity → 0, y -10). Never at the top.
- **[boîte : mot]** key-word box: accent-pale fill, accent-deep bold text, radius 12 px, padding 0 12 px; the box
  grows from scaleX 0 (origin left) in 0.12 s expo.out 0.02 s before the word. ONE per sentence.
- **[trait : mot]** peak stroke: a tapered accent stroke 9 px under the word, drawn left→right in 0.35 s power2.out.
  Only 4 in the film: 22.66 "piblisite m", 46.28 "Levye Dijital", 92.24 "24", 118.88 the URL.
- Typographic moments (the sentence IS the image, centered at y 860, 84 px max, InterDisplay 900 for the key word):
  frame 9 (pivot "Ebyen, se yon konpetans."), and nothing else.

## The world: la bande (vertical editing strip)

Written once in `reference/bande.html` (CSS, templates, camera kit, `bande()` builder): every frame copies it verbatim.

- `#world` is a tall column 1080 wide; the strip is a rounded panel x 250 → 990 (740 px wide), paper-2, soft shadow.
- Ruler on its left edge (x 230): a tick every 60 px, a long tick every 240 px, labels in ink-mute at x 20 → 210,
  right-aligned. The ruler label set changes by act (frame-local data, same component): act I timecodes
  ("00:00", "00:04"…), act III "MODIL 1…5", act IV calendar ("SAM 17", "SAM 24 OKT").
- Lanes (act I): 5 lanes 120 px wide with 16 px gaps starting x 290: Tèks, Imaj, Tranz., Son, Mizik; lane headers at the
  top of the strip; plus a full-width "Vwa" lane added in frame 3 (waveform of the real voice, ink-dark).
- Monitor (act I): a 9:16 preview card 360x640 centered at x 540, y 380 (world), black, radius 28, "● REC" chip.
- Stations (acts III, IV): white cards that OPEN on the strip (signature 2), max 680x880, centered on x 620.
- Playhead: a 5 px accent line across the strip + a 30 px accent dot on the ruler; it is THE bridge object of the film
  (reads clips → points modules → becomes the clock hand → becomes the cursor that clicks WhatsApp).
- Stations of the world (y in world px): act I lanes 760 → 2400; act III program: M1 Facebook Ads y 3200, M2 Ajan IA
  y 4300, M3 Pwodwi dijital y 5400, M4 Atelye y 6500, M5 Resous + gwoup y 7600; act IV: calendar y 8700, clock y 9500,
  then the strip folds into the map (frame 18).

## Camera kit (copied from reference/bande.html)

`#stage` (1080x1920, overflow hidden) > `#drift` > `#cam` (transform-origin 540px 960px) > `#world`.
- `cam(t, worldX, worldY, scale, d=0.5)`: brings world point to frame center (540, 760) — the stage center sits ABOVE
  the subtitle band; expo.inOut; blur 0 → 8 px → 0 during moves faster than 0.3 s.
- Drift: one linear tween per frame on `#drift`, alternating direction, 10 to 25 px/s and +1 to 3 %/s scale. Never stops.
- Main camera move of the film: going DOWN the strip (y increasing). A clear zoom in one direction is fine; never a
  back-and-forth.
- Handoff rule: every seam falls at the top of a camera move's blur; handoff_out of N = handoff_in of N+1 word for word.

## Components

- **chip**: white pill, 64 px colored dot (or real logo) + Inter 700 44 px label, shadow 0 20px 40px rgba(40,30,20,.14).
- **clip**: rounded rect (radius 18) in its track color, white Inter 800 label, arrives too big (×1.6) and blurred
  (8 px), lands in 0.14 s expo.out with a 4 px bounce (signature 1).
- **station-open**: a 2 px accent line across the strip opens into a white card (clip-path inset 49.5% → 0) in 0.22 s
  power3.out while its content settles from ×1.06 (signature 2).
- **tool-tile**: 120 px white rounded tile (radius 28) holding a real logo SVG from assets/icons (claude, whatsapp,
  facebook, meta) in its brand color.
- **claude-window**: HTML rebuild of the Claude app (no screenshot): white rounded window, header "Claude" with the
  orange star (assets/icons/claude.svg tinted accent), a user bubble (#EDEAE4) and the input "Chat with Claude",
  typing caret in accent.
- **wa-chat**: HTML WhatsApp chat (header #075E54 with avatar "L" accent, wallpaper #ECE5DD, white incoming bubbles,
  #D9FDD3 outgoing, blue ticks #53BDEB).
- **cta-wa**: green pill #25D366, WhatsApp logo white, "Kontakte nou sou WhatsApp" Inter 700 40 px + "31 43 3938"
  Inter 800 64 px; accent ring pulse on click.
- **link-pill**: white pill, globe glyph, "levyedijital.vercel.app" Inter 700 44 px in ink-dark.
- **seat**: 56x56 rounded square, lane color → accent when lit; 30 in a 6x5 grid.
- **cursor**: black arrow with white outline, 64 px; arrives in ONE curved move (x and y on two eases, 0.45 s) and clicks
  directly (scale .85 yoyo 0.06 s, ring wave).

## Images (only these two photos from the client's bank)

- `assets/img/sassou.png` — the real venue (frame 18, end card).
- `assets/img/team.png` — the group of three (frame 14 "pwojè an gwoup").
Everything else is built in HTML/CSS/SVG or uses the official logos in `assets/icons/` (Simple Icons, CC0). The map
pin may use `assets/img/pin.png`.

## Negative list

No slideshow, no static screenshot posing as UI, no invented numbers (only the voice's words: "santèn milye", "dizèn",
"santèn", "30", dates, hours, phone, URL), no emoji, no gradient text, no second accent, no object doubled across a
seam, no element in the subtitle band, no frozen hold > 0.5 s, no hesitating cursor, no `repeat:-1`, no Math.random.

## OVERRIDES validés par le client après le pilote (PRIORITAIRES sur tout ce qui précède et sur STORYBOARD.md)

Le pilote `compositions/frames/01-ak-claude.html` est LA référence de style, validée par le client (« fond clair,
proprement, pas trop de couleur », riche en profondeur). Chaque séquence en reprend :
- **le bloc CSS « LEVYE clair-riche : décor commun »** mot pour mot (`.lv-ground`, `.lv-floor`, `.lv-giant`, `.lv-grain`,
  `.lv-glass`, `.lv-tile`, `.lv-sub`, `.lv-sw`, `.lv-box*`, `.lv-wm`) et la même structure de pistes : track 0 = fond
  (`.lv-ground` + `.lv-floor` + un mot géant en filigrane propre à la séquence), track 1 = scène (`#fNN-cam` qui dérive),
  track 2 = sous-titre + filigrane LEVYE DIJITAL, track 3 = grain ;
- la fonction `sub()` et la fonction `words()` du pilote pour le sous-titre mot à mot (boîte orange #C4613F, texte blanc) ;
- `<script src="assets/vendor/gsap.min.js"></script>` (JAMAIS le CDN) et l'enregistrement `window.__timelines[FID]` ;
- les entrées « trop grand + flou → posé » en 0,14 à 0,18 s expo.out, la dérive permanente de `#fNN-cam`, les vies finies
  (yoyo, repeat fini), aucune `repeat:-1`, aucun `Math.random`.

Palette retenue : fond clair partout (le pivot de la frame 9 est un moment typographique SUR FOND CLAIR : le décor pâlit,
pas de noir ; frame 10 : la lumière s'intensifie au lieu de sortir du noir). Encre #1B1A18, gris #5A554E / #8C877F /
#B9B3A9 / #D9D4CC / #EDE9E2, blanc et verre. **Pistes de la bande : nuances d'encre et de gris, plus de couleurs par
piste** ; l'orange #D97757 (#C4613F pour le fond de boîte) seulement pour : l'élément actif (le clip qui tombe, la
station ouverte), la tête de lecture, le mot clé, l'étoile Claude, l'anneau de l'épingle. Couleurs de marque uniquement
dans les vrais logos (WhatsApp vert, Facebook bleu) et en petit.

Logos : les tracés officiels sont dans `assets/icons/{claude,whatsapp,facebook,meta}.svg` (Simple Icons, CC0) : lire le
`d="..."` du fichier et le recopier EXACTEMENT, jamais de mémoire. Photos : `assets/img/sassou.png`, `assets/img/team.png`,
épingle `assets/img/pin.png`.

Contraste : tout texte lisible ≥ 3:1 sur son fond (le check HyperFrames le vérifie) ; texte gris minimum #77726B sur blanc.
Aucun texte caché sous un élément opaque.
