# L’école en ligne (Firebase) et la démonstration

Le même site sert deux choses :

| | École en ligne | Démonstration |
|---|---|---|
| Données | Firestore : `ecoles/{SCHOOL_ID}/…`, partagées par tous les téléphones | une école fictive, **seulement sur ce téléphone** |
| Au départ | vide (école, année, rôles, matières, directeur) | remplie (élèves, notes, paiements…) |
| Connexion | Google ou e-mail + mot de passe (Firebase Auth) | comptes de démonstration, mot de passe `solonart` |
| Entrée / sortie | par défaut | « Découvrir l’application avec une école de démonstration » sur l’écran de connexion ; « Quitter » ou Paramètres → Données → « Effacer la démonstration » |

Rien de la démonstration n’est jamais envoyé en ligne (`src/data/mode.ts` sépare les données de l’appareil).
Sans configuration Firebase (`.env`), l’application n’a que la démonstration.

## Projet actuel
- Projet Firebase `solonarterp`, Firestore `(default)` en `us-east1`, école `solonart`.
- La configuration Web (publique) est dans `.env.production`.
- Directeur : le compte dont l’adresse a été donnée à `scripts/ecole.ts creer`.

## Une nouvelle école (ou un nouveau projet)
1. Console Firebase : créer le projet, puis **Authentication → Commencer** ; activer **Google** et **E-mail/Mot de passe**.
2. Paramètres du projet → Comptes de service → « Générer une nouvelle clé privée ».
   **Ce fichier est la clé maîtresse du projet : jamais dans le dépôt, jamais dans l’application.**
3. Depuis un ordinateur :
   ```bash
   node --experimental-strip-types scripts/ecole.ts regles  --cle /chemin/cle.json
   node --experimental-strip-types scripts/ecole.ts creer   --cle /chemin/cle.json --ecole monecole \
        --nom "École …" --commune … --directeur direction@exemple.com
   node --experimental-strip-types scripts/ecole.ts domaine --cle /chemin/cle.json --domaine monecole.vercel.app
   ```
   `creer` ne remplace jamais une école existante et affiche le **code d’établissement**.
4. Mettre la configuration Web du projet dans `.env.production` (avec `VITE_FIREBASE_SCHOOL_ID=monecole`), puis déployer.

## Comptes et sécurité
- La fiche d’un compte est `ecoles/{ecole}/users/{adresse e-mail en minuscules}` ; son `roleId` désigne `roles/{roleId}`.
- L’adresse doit être **confirmée** (Google : toujours ; e-mail + mot de passe : lien envoyé à la création).
  Sans cela, n’importe qui pourrait créer un compte avec l’adresse d’un autre et prendre ses droits.
- Un compte créé par la personne elle-même n’a pas de rôle : elle entre le code d’établissement, la direction valide.
- Un compte préparé par l’école (professeur, parent) est retrouvé par son adresse à la première connexion.
- `firestore.rules` : le personnel lit toute l’école ; chacun ne modifie que ce que son rôle permet.

## Synchronisation (`src/data/sync.ts`)
- L’application travaille toujours sur la base de l’appareil (hors ligne), puis envoie la file d’attente par lots de 400.
- Les changements des autres appareils arrivent en temps réel (`onSnapshot`) ; la modification la plus récente gagne (`updatedAt`).
- Compte sans rôle ou parent : on n’écoute que sa fiche, l’école et les rôles ; personnel : toute l’école.
- Une écriture refusée par le serveur (droits, document de plus de 1 Mo) est écartée et signalée dans Paramètres → Données.
- À la déconnexion, les données de l’école sont effacées du téléphone (s’il ne reste rien à envoyer).

## Limites actuelles
- **Espace parent en ligne** : le parent se connecte, mais la lecture filtrée de ses enfants n’est pas encore en place.
- Photos et documents sont gardés dans les fiches : un dossier très lourd (plus de 1 Mo) est refusé. Prochaine étape : Firebase Storage.
- Les relances automatiques partent quand la direction ouvre l’application (pas encore de serveur).
