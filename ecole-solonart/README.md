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

## Connexion par Google ou mot de passe, administration mobile (version 16)

- **Connexion** : uniquement « Continuer avec Google » ou e-mail + mot de passe (plus de code à 4 chiffres). « Créer un compte » au même endroit ; « Mot de passe oublié ».
- **Rejoindre l’école** : un compte créé par la personne elle-même n’a pas d’école. Elle entre le **code d’établissement** (Paramètres → Utilisateurs, ex. `SOLONART-2025`) ; la direction voit la **demande d’accès**, choisit le rôle et la fiche du personnel, puis accepte ou refuse.
- **Comptes enregistrés par la direction** (personnel, parents) : la direction saisit l’adresse e-mail ; la personne se connecte avec Google, ou touche « Créer un compte » avec cette adresse pour choisir son mot de passe. Les parents reçoivent l’invitation par WhatsApp.
- **Sans Firebase** (démonstration) : les mots de passe sont vérifiés sur l’appareil ; Google s’active dès que Firebase est configuré (`.env`, voir FIREBASE.md). Comptes de démonstration : mot de passe `solonart`.
- **Administration sur téléphone** : liste des élèves en vraie liste (photo, classe, reste à payer), **filtres repliables** (bouton « Filtres » avec un point quand un filtre est actif) sur Élèves, Notes, Présences, Parents, Discipline et Cahier ; compteurs en une ligne qui défile ; **fiche élève** façon profil (photo, actions Appeler · WhatsApp · Encaisser) ; **paiements** en liste avec le reçu en panneau ; évaluations en liste.

## Nouveau design mobile (version 15)

Refait selon le guide *mobile-app-ui-design* (github.com/Dukensn/mobile-app-ui-design) :
- **Fond blanc, plus aucun contour autour des widgets** : la profondeur vient d’ombres douces teintées de bleu ; les listes sont séparées par l’espace, pas par des traits ; les champs sont « remplis » (fond gris très clair) au lieu d’encadrés.
- **Règle 60/30/10** : blanc, encre bleu nuit, et le bleu de l’école réservé aux actions et à la carte principale. Grille de 8 points, zones tactiles d’au moins 44 px.
- **Accueil du professeur refait** : salutation, carte « En cours / Prochain cours » avec le bouton « J’ai donné ce cours » sous le pouce et la progression de la journée, alertes (appel, remplacement), 4 raccourcis ronds, frise de la journée, notes à saisir avec barres de progression.
- **Moments forts** (règle pic-fin) : étincelles et message d’encouragement quand un cours est validé ou l’appel enregistré ; carte « Journée complète » quand tous les cours sont donnés.
- Frise des cours (heure · couleur · cours · action) dans l’accueil et l’horaire ; appel plus lisible sur téléphone (les noms ne sont plus coupés) ; finance du professeur avec carte de salaire et totaux côte à côte.

## Badges personnalisables, impression à l’unité, vérification (version 14)

- **Vérifier un badge** : le QR de chaque badge ouvre la page *Vérification* de l’application (`#/verifier/<matricule>`), même sans être connecté. Elle dit si la personne fait partie de l’école (élève inscrit, membre du personnel, ou plus inscrit), avec sa photo à comparer. Bouton « Vérifier un badge » dans Badges ; scan par la caméra sur Android, ou saisie du matricule. Tant que la base n’est pas en ligne, la vérification ne marche que sur un appareil qui a les données de l’école.
- **Plus de modèles** : 21 en tout (dont Minimal gris, Bleu & rouge, Violet & rose, Émeraude nuit ; pour les élèves : rouge, orange, violet, bleu & rouge, nuit).
- **Personnaliser** : à partir de n’importe quel modèle, on change les couleurs (palettes prêtes ou couleurs libres), la forme de la photo (carrée, arrondie, ronde), les informations affichées et le texte du bas, avec l’aperçu en direct. Le modèle est enregistré pour l’école, modifiable et supprimable.
- **Impression** : *Planche A4* (9 portraits ou 10 paysages par feuille) ou *Une par carte* : chaque badge sur sa propre page, à la taille réelle. En paysage, c’est le format des cartes PVC (86 × 54 mm, CR80) pour une imprimante à cartes ; en portrait (63 × 86 mm), pour un porte-badge.
- **Finance vérifiée** : numéros de reçu sans doublon possible (plus grand numéro + 1), et avertissement quand un paiement dépasse le reste à payer.

## Paie fixe ou à l’heure, cours validés (version 13)

- **Choix de la direction, professeur par professeur** (Personnel → fiche) : *Salaire fixe* ou *À l’heure*. Par défaut : à l’heure pour qui enseigne au secondaire, fixe pour le préscolaire et le fondamental. À l’heure, la direction peut fixer un taux propre au professeur ; sinon on prend le taux de la matière au niveau (Paramètres).
- **Valider un cours, en un geste** : sur l’accueil et l’horaire du professeur, chaque cours de la journée a un bouton « Cours donné » (actif le jour même, à partir de 10 minutes avant le début). Le cours est aussi validé **sans rien toucher** quand le professeur remplit le cahier de textes de ce cours ou fait l’appel de la classe ce jour-là.
- **Contrôle** : Présences → *Cours donnés* : par date et par professeur, chaque cours avec son état (donné, non validé, refusé, à venir) et la façon dont il a été validé. La direction valide un oubli ou refuse un cours non assuré (motif obligatoire, gardé au journal).
- **Paie** : Finance → Salaires. « Mois suivant » crée les fiches : montant du contrat pour un salaire fixe, heures validées × taux pour un professeur à l’heure. « Calculer les heures » met à jour les fiches à l’heure du mois (les fiches déjà payées ne bougent pas). Le professeur voit dans Finance ses heures validées du mois et le montant estimé, et le détail heures × taux sur sa fiche.

## Espace professeur refait (version 12)
Barre du bas : **Accueil · Horaire · Notes · Appel** (ou **Finance** si le professeur ne fait pas l'appel) · Menu.
- **Accueil** : les cours du jour, l'appel à faire, un remplacement éventuel, puis Mes classes, Mes matières,
  Saisir des notes, Mes écoles (secondaire) ou Palmarès, Finance, Cahier de textes et les prochaines évaluations.
- **Emploi du temps** : vues Semaine, Jour et Mois ; détail d'un cours (date, heure, salle, élèves, programme,
  notes, devoirs, appel). Les remplacements du jour y figurent.
- **Plusieurs établissements (secondaire seulement)** : Mes écoles (ajouter, activer / désactiver), et le bouton +
  de l'emploi du temps pour ajouter ses cours ailleurs ; les chevauchements sont signalés. Cet agenda est personnel.
- **Mes classes** (cette école / toutes) et **Mes matières** (classes et heures par semaine).
- **Finance** : salaire du mois, total versé et à venir, versements et détail (fiche de paie PDF), taux par matière
  (réglés par la direction dans Paramètres → Matières & règles), heures du mois (prévues, effectuées, supplémentaires
  par remplacement, annulées par absence, détail par semaine), historique, documents (fiches de paie, attestation de
  travail) et informations du contrat.
- **Appel** : classes du jour fait / non fait, puis feuille en grille P · R · A · E avec recherche, « Tout présent »
  et « Enregistrer (N présents) » — la même feuille sert à la direction.
- Démonstration : M. Jean Robert enseigne aussi au Collège Lumière (agenda personnel).

## Remplacements, réglages, sauvegarde et notifications (version 11)
- **Emploi du temps aligné** sur Classe → Équipe & matières : changer l'enseignant d'une matière met à jour ses
  créneaux ; les créneaux anciens sont corrigés au démarrage. Dans un créneau, l'enseignant d'une matière se règle
  désormais dans l'écran Équipe.
- **Remplacements** (Présences → Personnel) : marquer un professeur absent propose son remplaçant (les plus libres
  en tête). Le remplaçant voit ses classes du jour sur son accueil et fait l'appel ; la cloche signale les absents
  sans remplaçant.
- **Réglages** (Paramètres → Matières & règles) : charge maximale d'un enseignant, seuil de retards avant
  d'alerter le parent (1, 2, 3 ou 5 en 7 jours), alertes d'absence et de conduite activables.
- **Sauvegarde** : une copie automatique par jour sur l'appareil (5 gardées, restaurables) et « Envoyer la
  sauvegarde » (WhatsApp, Drive…) ; la cloche le rappelle chaque semaine tant que la synchronisation n'est pas branchée.
- **Notifications sur le téléphone** (Mon profil) : nouvelles alertes de la cloche dans la barre du téléphone,
  application ouverte ou en arrière-plan. Application fermée : à brancher avec Firebase Cloud Messaging.

## Organisation des classes (version 10)
Classe → onglet **Équipe & matières** : la direction choisit comment la classe est organisée, et l'application
en déduit le reste (affectations, appel, saisie des notes, signature du bulletin, messages aux parents).
- **Maître unique** : un enseignant pour toutes les matières.
- **Équipe** : 2 ou 3 enseignants se partagent les matières (répartition automatique par spécialité puis par charge).
- **Un professeur par matière** : comme au secondaire.
- **Co-titulaires** : plusieurs enseignants à égalité sur tout (courant au préscolaire).
La charge de chaque enseignant (dans la classe et dans toute l'école) est affichée, avec une alerte au-delà de 30 h.
Sans choix enregistré, l'organisation est déduite du niveau et des affectations.

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
