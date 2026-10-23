# École Mixte Solonart — application de gestion scolaire

Application web progressive (PWA) **React + TypeScript**, mobile d’abord, qui s’adapte au téléphone,
à la tablette et à l’ordinateur. Elle **fonctionne hors ligne** et **s’installe** comme une application
(téléphone : « Ajouter à l’écran d’accueil » ; ordinateur : icône d’installation dans la barre d’adresse).

## Démarrer

```bash
cd ecole-solonart
npm install
npm run dev        # développement : http://localhost:5173
npm run build      # version de production dans dist/ (à héberger n'importe où : Firebase Hosting, Netlify…)
npm run preview    # tester la version de production
```

### Comptes de démonstration (code : **1234**)

| Espace | Compte | Rôle |
|---|---|---|
| Administration | M. Léomide S. Cherismé | Directeur (accès complet) |
| Administration | Mme Nadia Pierre | Directeur adjoint |
| Administration | M. Luc Joseph | Secrétaire (élèves, inscriptions, documents) |
| Administration | M. Michel Saintil | Comptable (finance) |
| Administration | M. Joël Méus | Censeur (présences, discipline) |
| Professeur | M. Jean Robert | Mathématiques en S3-A, S4-A, S4-B (5e contrôle à saisir) |
| Professeur | tous les autres professeurs | leurs matières |

Les profils sont fictifs (photos tirées des maquettes). Paramètres → Données → « Réinitialiser la démo » remet tout à zéro.

## Nouveautés (version 2)
- **Inscription rapide** en un seul écran (téléphone) : classe, nom, prénom, sexe, naissance, téléphone du parent, photo. Le parent déjà connu (frères et sœurs) est reconnu par son numéro.
- **Import Excel** (.xlsx / .csv) : colonnes reconnues automatiquement, aperçu, doublons ignorés, modèle à télécharger.
- **Photos des élèves** : appareil photo du téléphone ou image, depuis la fiche ou en « séance photo » par classe (l’élève suivant s’ouvre tout seul).
- **Badges portrait (63 × 86 mm) et paysage (86 × 54 mm)**.
- **Bulletins en 3 choix** (classe, période, modèle) ; **conseil de classe automatique** : appréciation, conduite (absences, retards, incidents), observations (matières faibles), décision ou avis du conseil.
- **Accueil** avec liste « À faire » (appels, notes, paiements à confirmer, retards de paiement, salaires, photos, dossiers incomplets).
- Professeur : brouillon des notes conservé si la page se ferme ; recherche des comptes à la connexion ; recherche sur mobile.

## Assistant IA locale (version 7)
Menu **Assistant** (ou ＋ → Assistant sur téléphone) : un chat où l’on écrit ou dicte une demande.
L’IA tourne **dans l’appareil** (transformers.js + ONNX Runtime, WebGPU ou WASM) : aucune donnée ne part sur Internet.

```
npm install @huggingface/transformers@3
```

| Profil | Voix (Whisper, int4) | Agent (int4) | Téléchargement |
|---|---|---|---|
| Téléphone | whisper-tiny | SmolLM2-135M-Instruct | ~170 Mo |
| Ordinateur | whisper-base | Llama-3.2-1B-Instruct (repli Qwen2.5-1.5B) | ~700 Mo |

- Détection automatique de l’appareil, avec choix manuel (Auto / Téléphone / Ordinateur).
- Un seul profil en mémoire : l’ancien est libéré (`dispose`) avant de charger le nouveau.
- Modèles gardés dans IndexedDB (`solonart-modeles`) : téléchargés une seule fois, puis hors ligne.
- Micro capté et converti en mono 16 kHz (Web Audio), compatible WebView / Capacitor.
- `processVoiceCommand(audioBlob)` : Whisper → agent → **JSON strict** `{ action, entite, variables }`.
- Sans IA chargée, les demandes écrites marchent déjà grâce à des règles (français et créole).
- **Lecture** (résultats, impayés, finances, présences, discipline, cahier) : réponse directe dans le chat.
- **Écriture** (paiement, dépense, inscription, incident, séance) : le formulaire s’ouvre prérempli,
  rien n’est enregistré sans que l’utilisateur confirme.

Code : `src/ai/` (`AdaptiveVoiceERPAgent.ts`, `agent.worker.ts`, `audio.ts`, `erpCommand.ts`, `erpActions.ts`)
et `src/pages/Assistant.tsx`. Le domaine `huggingface.co` doit être joignable au premier chargement.

## Registre de discipline et cahier de textes (version 6)
- **Discipline** (menu Discipline, ou ＋ → Incident) :
  - on signale un incident ou des félicitations : élève, date, type, gravité, faits, mesure prise (avertissement, retenue, convocation, exclusion de N jours…) ;
  - on suit le dossier : parents prévenus, dossier clôturé ;
  - un bouton prépare le message WhatsApp au parent ;
  - registre filtrable (classe, type, dossiers ouverts) et imprimable en PDF ;
  - statistiques par classe et par type, liste des élèves à suivre ;
  - les incidents comptent déjà dans la conduite des bulletins ;
  - le professeur signale depuis son espace, pour les élèves de ses classes ;
  - le censeur a les droits d'écriture ;
  - « Incidents à traiter » apparaît sur l'accueil.
- **Cahier de textes** :
  - le professeur note chaque séance (leçon, travail fait, devoirs et date de remise) ; l'heure est préremplie d'après l'emploi du temps ;
  - la direction consulte par classe et par matière, voit les devoirs donnés, et suit le remplissage (« en retard » si rien depuis 7 jours) ;
  - impression PDF par classe.

## Comité de classe, épuration (version 5)
- **Comité de classe** (Classes → une classe → Comité) :
  - on nomme un président, un vice-président, un secrétaire, un trésorier, des conseillers et des responsables (discipline, propreté, sport…), ou un rôle libre ;
  - on peut changer le rôle d'un membre ou le retirer ;
  - un seul président, secrétaire… par classe : le précédent est remplacé automatiquement.
- **Responsable de la classe** :
  - au **secondaire**, c'est toujours un élève (le président par défaut) ;
  - au **fondamental et au préscolaire**, on choisit un professeur (le titulaire par défaut) ou un élève.
  - Le rôle apparaît sur la fiche de l'élève, dans la liste de la classe et sur la carte de la classe.
- **Téléphone : plus rien ne glisse de gauche à droite** :
  - au-delà de 4 onglets, un sélecteur ; jusqu'à 4, ils se partagent la largeur ;
  - les tableaux trop larges deviennent des fiches empilées ;
  - l'emploi du temps s'affiche jour par jour ;
  - les mois du rapport se choisissent avec ‹ › ;
  - les étapes d'inscription tiennent sur une ligne.
- **Plus épuré** : plus d'ombres sur les cartes et les boutons (seuls les menus, fenêtres et le bouton ＋ en gardent une légère).
- Correction : la fiche élève plantait en changeant d'onglet.

## Application mobile et rapport mensuel (version 4)
- **Sur téléphone et tablette, l’interface devient une vraie application** :
  - barre du haut avec le nom de l’écran, un bouton retour et un menu ⋮ qui regroupe les actions de la page ;
  - barre du bas : **Accueil · Élèves · ＋ · Finance · Menu** (adaptée aux droits de chaque rôle) ;
  - le **＋** ouvre les actions rapides : inscrire, encaisser, dépense, appel, notes, bulletins, badges, rapport du mois, message ;
  - **Menu** donne tous les modules, le profil et la déconnexion ;
  - onglets en pastilles collés en haut, chiffres clés compacts, feuilles qui montent du bas, transitions entre écrans.
- **Professeur** : Accueil · Notes · Appel · Horaire · Menu.
- **Rapport financier mensuel** (Finance → Rapport mensuel, ou ＋ → Rapport du mois) :
  - recettes par motif et par mode de paiement, salaires, dépenses par catégorie, résultat et comparaison avec le mois précédent ;
  - impression ou PDF A4, envoi du résumé par WhatsApp, export Excel.
- L’ordinateur garde la mise en page habituelle (menu de gauche).

## Préscolaire (version 3)
- 3 classes : **Petite section (PS)**, **Moyenne section (MS)**, **Grande section (GS)**, avec leurs maîtresses (comptes professeur, code 1234).
- 6 **domaines d’apprentissage** : langage, pré-mathématiques, découverte du monde, motricité, arts et chants, vivre ensemble.
- **Pas de notes ni de rang** : la maîtresse touche **A** (acquis), **EC** (en cours d’acquisition) ou **NA** (non acquis) pour chaque enfant.
- **Livret préscolaire** recto + verso (photo, domaines × contrôles, mot de la maîtresse, décision « Passe en … », mot aux parents, signatures).
- Les classes du préscolaire sont exclues des moyennes de l’école (tableau de bord, rapports).

## Ce que contient l’application

**Espace direction / administration** (menu de gauche sur ordinateur, barre du bas + menu ☰ sur téléphone)
- Tableau de bord : effectifs, présence, scolarité encaissée, moyennes par classe, avancement de la saisie des notes.
- Élèves : liste filtrable + fiche complète (aperçu, notes, finance, présences, documents, historique), export Excel/PDF, changement de classe, archivage.
- Inscriptions : formulaire en 6 étapes (contexte haïtien : acte de naissance, NIN, commune, régime, redoublant, bourse, responsables, contact d’urgence, groupe sanguin), détection d’un parent déjà enregistré par son téléphone (frères et sœurs), encaissement des frais d’inscription, fiche d’inscription imprimable, réinscription annuelle en bloc.
- Classes : effectifs, titulaire, matières, coefficients, professeurs, résultats, duplication.
- Parents / tuteurs : liste, fiche, appel, WhatsApp, email, carte, liste PDF.
- Personnel : professeurs et employés, matières/classes assignées, salaire, création d’un compte d’accès.
- Emploi du temps : par classe ou par professeur, créneaux modifiables, détection des conflits, duplication, impression.
- Notes / Examens : suivi des évaluations, saisie/correction, palmarès, clôture, **verrouillage des périodes**, **conseil de classe** (appréciations, conduite, décisions — proposition automatique).
- Présences : appel par classe, pointage du personnel (arrivée/départ), statistiques.
- Finance : vue d’ensemble (maquette), paiements élèves (MonCash, NatCash, espèces, virement, chèque) avec reçu en 2 exemplaires, élèves en retard + rappel WhatsApp, salaires mensuels, dépenses, journal comptable, projets, états financiers PDF.
- Documents : **générateur de bulletins** et **générateur de badges**, certificat de scolarité, attestation de travail.
- Communication (SMS / WhatsApp / email / annonces), événements, rapports scolaires.
- Paramètres : école (logo, signature du directeur, cachet), année scolaire et périodes, matières et barème (/20 ou /100), **utilisateurs**, **rôles et permissions** (créer un rôle et choisir ce qu’il voit / modifie), sauvegarde/restauration, journal d’activité.

**Espace professeur** (copie des maquettes mobiles 1 à 8) : accueil, mes classes, contrôles/examens, palmarès avant/après saisie, saisie des notes (« abs » = absent), confirmation, actions (modifier, imprimer, PDF, Excel, clôturer, historique), appel, emploi du temps.

## Synchronisation professeur ↔ administration
Une seule base de données : quand un professeur enregistre ses notes, elles apparaissent immédiatement dans
Notes / Examens, dans les fiches élèves, les rangs et les bulletins. La direction voit l’avancement,
peut corriger, puis **verrouille** la période : le professeur ne peut plus modifier.
Sur plusieurs appareils, la synchronisation passe par Firebase — voir **[FIREBASE.md](FIREBASE.md)**.

## Bulletins
Modèles reproduits des maquettes :
1. **Tripliable** recto + verso, 6 thèmes (bleu, vert, gris, or, marine, violet) — par contrôle ou annuel ;
2. **Bulletin annuel /20** (tableau C1–C5, évolution, résultat global) ;
3. **Bulletin annuel /100** avec coefficients et examen final ;
4. **Livret 3 volets + dos** (détail par matière, assiduité, comportement, décision du conseil, cachet).

Individuel ou par classe entière, impression ou « Enregistrer au format PDF » (A4 paysage, sans marges).
Le logo importé dans Paramètres remplace l’écusson par défaut sur tous les documents.
Des exemples générés par l’application sont dans `exemples-pdf/`.

## Badges (63 × 86 mm, 9 par A4)
Modèles distincts par catégorie : **Professeurs**, **Direction**, **Personnel**, **Élèves** (classe, matricule,
téléphone du parent, groupe sanguin, QR de vérification). Verso optionnel. Individuel ou par lot.

## Structure du code
```
src/data/types.ts      modèle de données (= collections Firestore)
src/data/store.ts      base locale IndexedDB + file d'attente de synchronisation
src/data/sync.ts       synchronisation Firebase (optionnelle)
src/data/seed.ts       données de démonstration
src/data/compute.ts    moyennes pondérées, rangs, appréciations, décisions
src/docs/              bulletins, badges, fiches imprimables
src/ai/                assistant IA locale (voix + agent JSON)
src/pages/admin/       espace direction      src/pages/teacher/  espace professeur
```
