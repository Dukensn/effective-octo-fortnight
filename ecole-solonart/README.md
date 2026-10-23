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
| Parent | M. Jean Dorval — téléphone 3698 7654 | Parent de Jean Philippe (S4-A) et Naomi (S2-B) |

Les profils sont fictifs (photos tirées des maquettes). Paramètres → Données → « Réinitialiser la démo » remet tout à zéro.

## Nouveautés (version 2)
- **Inscription rapide** en un seul écran (téléphone) : classe, nom, prénom, sexe, naissance, téléphone du parent, photo. Le parent déjà connu (frères et sœurs) est reconnu par son numéro.
- **Import Excel** (.xlsx / .csv) : colonnes reconnues automatiquement, aperçu, doublons ignorés, modèle à télécharger.
- **Photos des élèves** : appareil photo du téléphone ou image, depuis la fiche ou en « séance photo » par classe (l’élève suivant s’ouvre tout seul).
- **Badges portrait (63 × 86 mm) et paysage (86 × 54 mm)**.
- **Bulletins en 3 choix** (classe, période, modèle) ; **conseil de classe automatique** : appréciation, conduite (absences, retards, incidents), observations (matières faibles), décision ou avis du conseil.
- **Accueil** avec liste « À faire » (appels, notes, paiements à confirmer, retards de paiement, salaires, photos, dossiers incomplets).
- Professeur : brouillon des notes conservé si la page se ferme ; recherche des comptes à la connexion ; recherche sur mobile.

## Messagerie, règles par niveau et espace parent recentré (version 9)
- **Appel** : un seul par jour et par classe. Préscolaire et fondamental : le(s) titulaire(s) ; secondaire :
  le personnel désigné dans la fiche de la classe (« Appel fait par », le censeur par défaut) — les professeurs
  du secondaire n'ont plus d'écran d'appel. La cloche signale chaque jour les classes sans appel (à partir de 8 h).
- **Préscolaire** : plusieurs **co-titulaires** à égalité par classe (appel, évaluation de tous les domaines,
  noms et signature sur le livret).
- **Messagerie** (Menu → Messagerie, et espaces professeur / parent) : un fil « École » par élève ; absences,
  retards et notes de conduite y arrivent **automatiquement** chez le parent, avec en plus un WhatsApp prérempli
  pour l'urgent. Au préscolaire et au fondamental, professeur et parent s'écrivent ; la direction voit ces fils.
  Au secondaire, seule l'administration écrit aux parents.
- **Espace parent** : Accueil, Messages, **Bulletins** (les bulletins officiels publiés, aperçu + PDF) et
  **Progrès** (évolution de la moyenne face à la classe, matières en progrès / à surveiller) ; Vie scolaire et
  Paiements dans le menu. Les écrans Notes et Devoirs ont été retirés.
- Démonstration : M. Jean Dorval (3698 7654, code 1234) a trois enfants dont un en moyenne section ;
  Mme Mirlande Desrosiers (titulaire MS) et Mme Fabienne Célestin (co-titulaire MS).
- Notifications sur le téléphone du parent hors de l'application et WhatsApp automatique : à brancher avec la
  synchronisation en ligne (Firebase) ; WhatsApp automatique demande l'API WhatsApp Business (payante).

## Journal, relances et espace parent (version 8)
- **Journal des modifications** (Menu → Journal) : qui, quand, quoi. Une note déjà saisie qui change garde
  l’ancienne et la nouvelle valeur ; annuler un paiement exige un motif. Filtres par domaine, utilisateur et période,
  export Excel. Les lignes ne se modifient ni ne se suppriment (aussi dans `firestore.rules`).
- **Relances de paiement** (Finance → Paiements → Relances) : message personnalisable ({parent}, {eleve}, {classe},
  {reste}, {ecole}), envoi WhatsApp ou SMS un par un pour une sélection, date et nombre de relances par élève,
  filtre « pas relancés depuis 7 jours ».
- **Espace parent** : connexion avec le numéro de téléphone et un code à 4 chiffres créé depuis la fiche du parent
  (Parents → Accès parent). Le parent voit seulement ses enfants : moyennes des périodes validées par la direction,
  absences, discipline, paiements et reçus (voir la version 9 pour la suite).
  Démonstration : 3698 7654, code 1234 (M. Jean Dorval, deux enfants).
  Sur le téléphone des parents, il faudra une synchronisation filtrée (seulement leurs enfants) : les règles
  Firestore interdisent déjà aux comptes parent de lire le reste de l’école.

## Assistant (version 7)
Menu **Assistant** (ou ＋ → Assistant sur téléphone) : un chat où l’on écrit une demande en français ou en créole.
Pas de modèle d’IA pour l’instant : un analyseur par règles transforme la phrase en commande JSON
`{ action, entite, variables }` (classe, mois, montant, nom…), et tout reste dans l’appareil.

- **Lecture** (résultats, impayés, finances, présences, discipline, cahier) : réponse directe dans le chat.
- **Écriture** (paiement, dépense, inscription, incident) : le formulaire s’ouvre prérempli,
  rien n’est enregistré sans que l’utilisateur confirme.

Code : `src/ai/erpCommand.ts` (règles), `src/ai/erpActions.ts` (exécution), `src/pages/Assistant.tsx`.
Une IA locale (voix + modèle de langage) pourra produire plus tard le même JSON ; une première version
existe dans l’historique git (commit « Assistant IA locale… »).

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
src/ai/                assistant (demande → commande JSON → action)
src/pages/admin/       espace direction      src/pages/teacher/  espace professeur
src/pages/parent/      espace parent
```
