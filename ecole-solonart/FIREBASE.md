# Connecter l’application à Firebase

L’application fonctionne **hors ligne** dès maintenant : toutes les données sont dans le navigateur (IndexedDB).
Firebase sert à **synchroniser** plusieurs appareils (professeurs ↔ direction) et à sauvegarder en ligne.

## 1. Créer le projet
1. https://console.firebase.google.com → « Ajouter un projet » (ex. `solonart`).
2. **Firestore Database** → Créer (mode production, région `us-east1` ou la plus proche).
3. **Authentication** → activer « E-mail/Mot de passe » (étape 4).
4. Paramètres du projet → « Vos applications » → icône Web `</>` → copier la configuration.

## 2. Configurer l’application
```bash
cp .env.example .env.local
# remplir VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, etc.
npm install
npm run build
```
Au démarrage, `src/data/sync.ts` :
- envoie toutes les modifications locales (file d’attente) vers `ecoles/{SCHOOL_ID}/{collection}/{id}` par lots de 400 ;
- écoute chaque collection en temps réel (`onSnapshot`) et fusionne les changements reçus
  (règle « la modification la plus récente gagne », champ `updatedAt`) ;
- garde aussi le cache hors ligne de Firestore (`persistentLocalCache`).

La première ouverture avec Firebase envoie les données de démonstration. Pour démarrer à vide :
Paramètres → Données → « Réinitialiser », puis supprimer les données fictives, ou importer votre sauvegarde JSON.

## 3. Règles de sécurité
Copier `firestore.rules` dans Firestore → Règles. Elles lisent le rôle de l’utilisateur dans
`ecoles/{ecole}/users/{uid}` et les permissions dans `ecoles/{ecole}/roles/{roleId}`.

## 4. Authentification réelle (recommandé en production)
Aujourd’hui la connexion utilise un compte + code à 4 chiffres stocké localement (`src/lib/session.ts`).
Pour passer à Firebase Auth :
1. créer chaque utilisateur dans Authentication (email + mot de passe) ;
2. utiliser son `uid` comme identifiant du document `users/{uid}` ;
3. dans `login()`, appeler `signInWithEmailAndPassword(auth, email, motDePasse)` puis charger `users/{uid}`.

## Structure des collections
`school, years, periods, classes, subjects, courses, guardians, students, staff, evaluations, grades,
reportEntries, attendance, staffAttendance, timetable, payments, expenses, salaries, projects, messages,
events, incidents, roles, users, audit` — types complets dans `src/data/types.ts`.
