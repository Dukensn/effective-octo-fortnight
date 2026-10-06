# Pub WhatsApp — Levye Dijital (9:16, 1 min 58 s)

`pub-levye-dijital-9x16.mp4` : 1080×1920, 30 i/s, H.264 + AAC, -14 LUFS.

## Ce qui a été fait
- Voix : coupe-bas 75 Hz, débruitage FFT, +3,5 dB vers 140 Hz (chaleur), compression, normalisation.
- Coupes : silence et clics du début (0–4 s) et de la fin (après 127 s), faux départ « Na fè koni… » (105 s), pauses réduites à ~0,4 s.
- Musique et effets sonores (whoosh, pop, impact, riser, ding, tick) synthétisés en Python (aucune banque de sons accessible), musique baissée automatiquement sous la voix.
- Visuels dessinés en Python dans le style de la référence ; sous-titres créoles mot à mot calés sur la voix.

#### Infos affichées (confirmées)
- Formation : Levye Dijital
- Dates : samedi 17 et 24 octobre 2026, 10:00 AM – 4:00 PM
- Lieu : Sassou's Lamadone Club, anfas Plas Anacaona
- WhatsApp : 31 43 3938
- Formulaire : levyedijital.vercel.app

 Regénérer
Le texte des sous-titres se trouve dans `src/build.py` (liste `SEGS`). Ordre : `synth.py` → `build.py` → `render.py` (×4 en parallèle) → `mix.py` → mux ffmpeg.
