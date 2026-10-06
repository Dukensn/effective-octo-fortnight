#!/usr/bin/env python3
"""Word timings of voix-montage.wav without openai-whisper (its model host is blocked here).

The text is the corrected Creole transcript (Whisper large-v3 passes + the user's corrections); each phrase's words are
spread over its voiced 10 ms slices, then raw times are mapped onto the montage (prep-voice.py removals, build-audio.sh
inserted silences). onsets.py --transcript then snaps every phrase start onto the real sound.
"""
import json, subprocess, wave
import numpy as np

REMOVE = [(0.0, 4.05), (16.06, 17.41), (88.51, 90.40), (105.02, 107.84)]
INSERT = [(23.14, 2.0), (41.63, 1.2)]   # (time in voix-propre, silence) = CUTS of build-audio.sh
SEGS = [
 (4.18, 5.77, "Mwen travay videyo sa a ak Claude."),
 (6.17, 7.05, "Donk, sa w ap gade a,"),
 (7.38, 11.01, "konnen se yon videyo Claude monte li menm. Li itilize pwòp zouti l,"),
 (11.38, 12.26, "pwòp lojisyèl li"),
 (12.60, 13.64, "pou l fè videyo a."),
 (14.04, 16.01, "Se pa jenere l jenere tankou Veo 3."),
 (17.69, 19.58, "Mwen jis ba l vwa a."),
 (19.74, 24.52, "Epi li fè tout lòt bagay yo. Li ajoute tèks, li ajoute imaj, li fè tranzisyon,"),
 (24.76, 25.45, "li ajoute son."),
 (26.01, 28.36, "Apre sa, li ba m piblisite m."),
 (29.30, 30.25, "Ou ka remake sa:"),
 (30.49, 35.01, "si w ta gen yon biznis, oubyen yon pwodwi, ou ta renmen fè bèl piblisite ki pwofesyonèl,"),
 (35.58, 37.00, "ebyen ou ta dwe gen konpetans sa."),
 (37.53, 41.57, "Oubyen ou ta vle vin yon kreyatè kontni k ap pibliye videyo ki serye,"),
 (42.04, 43.88, "ki pa sanble ak videyo ki jenere avèk IA."),
 (44.82, 46.63, "Ebyen, se yon konpetans."),
 (47.35, 49.25, "Se sa n ap montre w nan Levye Dijital."),
 (49.50, 52.61, "De jou fòmasyon ak pratik pou metrize Facebook Ads,"),
 (53.40, 58.47, "pou w ka fè yon piblisite ki ateyn petèt plizyè santèn milye moun, tout pandan w ap depanse yon ti kòb."),
 (59.32, 64.77, "N ap montre w kòman pou itilize ajan tankou Claude ak lòt ankò pou kreye kontni, jere kliyan,"),
 (65.14, 66.53, "fè otomatizasyon WhatsApp."),
 (66.84, 71.97, "Epi n ap montre w kòman tou pou itilize entèlijans atifisyèl pou kreye premye pwodwi dijital ou."),
 (72.38, 73.73, "Yon pwodwi w kreye yon sèl fwa,"),
 (74.01, 77.16, "men ou ka vann li plizyè dizèn fwa, e plizyè santèn fwa."),
 (78.33, 82.98, "Se yon atelye ki pral mete aksan sou aprantisaj, pratik ak pwojè an gwoup."),
 (83.35, 86.53, "Anplis de sa, w ap resevwa tout resous gratis ki nesesè."),
 (86.83, 88.51, "E n ap mete nou nan yon gwoup WhatsApp"),
 (90.50, 93.88, "pou nou kontinye asiste patisipan yo pandan yon mwa."),
 (94.74, 97.80, "Dat la se 17 ak 24 oktòb 2026."),
 (98.42, 103.14, "10è nan maten pou rive 4è nan apremidi. Lokal la se Sassou's Lamadone Club,"),
 (103.45, 104.69, "anfas Plas Anacaona."),
 (108.06, 112.26, "N ap fè nou konnen plas yo limite a 30 moun sèlman, kidonk si w rive an reta,"),
 (112.60, 113.80, "n ap dezole pou ou."),
 (114.17, 122.50, "Pou rezève plas ou, tanpri kontakte nou kounye a sou WhatsApp, oswa klike sou lyen WhatsApp ki anba videyo sa a, oubyen ekri nou sou 31 43 3938."),
 (122.84, 127.08, "Ou ka ranpli fòmilè enskripsyon an tou, lè w ale sou levyedijital.vercel.app"),
]

def raw_to_montage(t):
    p = t - sum(min(b, t) - a for a, b in REMOVE if t > a)
    return p + sum(g for at, g in INSERT if p > at)

def main():
    tmp = "/tmp/_voix16k.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "assets/audio/voix.mp3", "-ac", "1", "-ar", "16000", tmp], check=True)
    w = wave.open(tmp); a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    hop = 160
    db = 20 * np.log10(np.array([np.sqrt(np.mean(a[i:i + hop] ** 2)) + 1e-9 for i in range(0, len(a), hop)]))
    words = []
    for t0, t1, txt in SEGS:
        toks = txt.split(" ")
        v = db[int(t0 * 100):int(t1 * 100)] > -38
        cum = np.cumsum(v); tot = max(cum[-1], 1)
        wts = np.array([len(x) + 2 for x in toks], float)
        st = np.concatenate([[0], np.cumsum(wts)]) / wts.sum()
        for k, tok in enumerate(toks):
            s = t0 + min(int(np.searchsorted(cum, st[k] * tot + .5)), len(v) - 1) / 100
            e = t0 + min(int(np.searchsorted(cum, st[k + 1] * tot - .5)), len(v) - 1) / 100
            words.append({"w": tok, "start": round(raw_to_montage(s), 2), "end": round(raw_to_montage(max(e, s + .05)), 2)})
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0",
                                "assets/audio/voix-montage.wav"], capture_output=True, text=True).stdout)
    json.dump({"duration": round(dur, 2), "words": words}, open("assets/audio/voix-montage-mots.json", "w"),
              ensure_ascii=False, indent=1)
    gaps = [(x["end"], y["start"]) for x, y in zip(words, words[1:]) if y["start"] - x["end"] > 0.4]
    print(f"{len(words)} mots, {dur:.2f} s; silences > 0,4 s : " + ", ".join(f"{p:.2f} à {q:.2f}" for p, q in gaps))

main()
