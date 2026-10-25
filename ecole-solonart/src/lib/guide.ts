// Aide à la prise en main : tutoriel du premier jour, astuces par écran, et rappels « pas encore fait ».
import { db } from '../data/store';
import type { User } from '../data/types';
import { firebaseEnabled } from '../data/sync';
import { lastExport } from './backup';
import type { Session } from './session';

/** Tutoriel et astuces déjà vus par ce compte. */
export const seen = (u: User | undefined, key: string) => !!u?.vus?.includes(key);
export function markSeen(u: User, key: string) {
  if (seen(u, key)) return;
  db.patch('users', u.id, { vus: [...(u.vus ?? []), key] });
}
/** « Revoir le tutoriel » : tout redevient nouveau. */
export function resetGuide(u: User) { db.patch('users', u.id, { vus: [] }); }

export type Espace = 'admin' | 'prof' | 'parent';
export const espaceOf = (s: Session): Espace => (s.isParent ? 'parent' : s.isTeacher ? 'prof' : 'admin');

export interface Slide { icon: string; tint: string; title: string; text: string }

/** Le tutoriel du premier jour : quelques écrans, selon l'espace. */
export const TOUR: Record<Espace, Slide[]> = {
  admin: [
    { icon: 'home', tint: 'blue', title: 'Bienvenue dans votre école', text: 'L’accueil montre chaque jour ce qui demande votre attention : appels non faits, paiements à confirmer, notes à saisir. Touchez une ligne pour agir.' },
    { icon: 'plus', tint: 'green', title: 'Le bouton ＋', text: 'Au centre de la barre du bas : inscrire un élève, encaisser un paiement, faire l’appel, écrire aux parents. Tout ce qu’on fait souvent est là.' },
    { icon: 'users', tint: 'violet', title: 'Élèves et inscriptions', text: 'Ajoutez les élèves un par un (inscription rapide), ou importez votre liste Excel. Le parent peut même compléter le dossier depuis son téléphone.' },
    { icon: 'wallet', tint: 'orange', title: 'Paiements et relances', text: 'Chaque paiement donne un reçu. Les parents en retard reçoivent un rappel automatique ; vous pouvez l’arrêter quand vous voulez.' },
    { icon: 'settings', tint: 'blue', title: 'Pour bien démarrer', text: 'Une liste « Mise en route » sur l’accueil vous guide : logo, classes et frais, professeurs, élèves… Elle disparaît quand tout est prêt.' },
  ],
  prof: [
    { icon: 'home', tint: 'blue', title: 'Bienvenue', text: 'L’accueil montre votre cours du moment. Après chaque cours, touchez « J’ai donné ce cours » : c’est ce qui compte pour vos heures.' },
    { icon: 'calendar', tint: 'green', title: 'Votre horaire', text: 'Semaine, jour ou mois. Touchez un cours pour voir la liste des élèves, les devoirs et le programme.' },
    { icon: 'pen', tint: 'violet', title: 'Les notes', text: 'Choisissez la classe puis le contrôle, et saisissez les notes. Elles sont gardées même si l’application se ferme.' },
    { icon: 'wallet', tint: 'orange', title: 'Votre finance', text: 'Salaire, versements, heures validées et reçus : tout est dans Finance.' },
  ],
  parent: [
    { icon: 'home', tint: 'blue', title: 'Bienvenue', text: 'Vous suivez ici vos enfants : bulletins, progrès, absences et paiements. Rien d’autre n’est visible.' },
    { icon: 'message', tint: 'green', title: 'Les messages', text: 'L’école vous prévient en cas d’absence, de retard ou de paiement en attente. Vous pouvez répondre.' },
    { icon: 'file', tint: 'violet', title: 'Les bulletins', text: 'Chaque bulletin validé par l’école apparaît ici, prêt à imprimer.' },
  ],
};

/** Astuce montrée la première fois qu'on ouvre un écran. */
export const TIPS: { espace: Espace; path: RegExp; title: string; text: string }[] = [
  { espace: 'admin', path: /^\/eleves$/, title: 'Trouver un élève', text: 'Tapez un nom ou un matricule. Le bouton « Filtres » choisit la classe ; un point bleu indique qu’un filtre est actif.' },
  { espace: 'admin', path: /^\/eleves\/[^/]+$/, title: 'La fiche de l’élève', text: 'Appelez ou écrivez au parent en un geste, encaissez un paiement, imprimez le bulletin ou le badge depuis « Plus ».' },
  { espace: 'admin', path: /^\/inscriptions/, title: 'Inscrire vite', text: 'L’inscription rapide demande l’essentiel. Si l’option est activée, le parent complète le reste (photo, documents) depuis son compte.' },
  { espace: 'admin', path: /^\/finance/, title: 'Encaisser', text: 'Le bouton « Encaisser » enregistre le paiement et imprime le reçu. Touchez un paiement pour revoir son reçu ou le confirmer.' },
  { espace: 'admin', path: /^\/presences/, title: 'L’appel du jour', text: 'Choisissez la classe : tout le monde est présent par défaut, touchez seulement les absents et les retards. Les parents sont prévenus.' },
  { espace: 'admin', path: /^\/notes/, title: 'Notes et bulletins', text: 'Créez un contrôle, suivez la saisie des professeurs, puis verrouillez la période pour publier les bulletins aux parents.' },
  { espace: 'admin', path: /^\/documents/, title: 'Documents', text: 'Bulletins, badges, certificats : choisissez, vérifiez l’aperçu, imprimez ou enregistrez en PDF.' },
  { espace: 'admin', path: /^\/parametres/, title: 'Réglages', text: 'Logo, signature, année scolaire, frais, comptes et rôles. Le code d’établissement est dans « Utilisateurs ».' },
  { espace: 'prof', path: /^\/prof\/emploi/, title: 'Votre horaire', text: 'Touchez un jour en haut, puis un cours. « Donné ? » valide le cours le jour même.' },
  { espace: 'prof', path: /^\/prof\/notes/, title: 'Saisir des notes', text: 'Choisissez la classe, puis le contrôle. Une note se tape avec la virgule : 12,5.' },
  { espace: 'prof', path: /^\/prof\/appel/, title: 'Faire l’appel', text: 'Tout le monde est présent par défaut : touchez seulement les absents et les retards, puis enregistrez.' },
  { espace: 'prof', path: /^\/prof\/finance/, title: 'Votre finance', text: 'Touchez un versement pour voir le détail et télécharger le reçu.' },
  { espace: 'parent', path: /^\/p\/paiements/, title: 'Paiements', text: 'Chaque paiement a son reçu. Le reste à payer est en haut.' },
];

export interface Step { id: string; label: string; sub: string; to: string; done: boolean }

/** Ce qui reste à faire pour que l'école fonctionne bien (selon les droits de la personne). */
export function setupSteps(s: Session): Step[] {
  const school = db.get('school', 'main');
  const out: Step[] = [];
  if (s.isParent) {
    const kids = db.list('students').filter((x) => s.user.guardianId && x.tuteurIds.includes(s.user.guardianId));
    for (const k of kids.filter((x) => x.dossierParent?.statut === 'a_completer')) out.push({ id: `dossier-${k.id}`, label: `Compléter l’inscription de ${k.prenom}`, sub: 'Photo, informations et documents', to: `/p/inscription/${k.id}`, done: false });
    out.push({ id: 'photo', label: 'Ajouter votre photo', sub: 'Pour que l’école vous reconnaisse', to: '/profil', done: !!s.user.photo });
    return out;
  }
  if (s.isTeacher) {
    out.push({ id: 'photo', label: 'Ajouter votre photo de profil', sub: 'Elle apparaît sur votre badge', to: '/profil', done: !!s.user.photo });
    out.push({ id: 'mdp', label: 'Choisir votre mot de passe', sub: 'Remplacez le mot de passe de départ', to: '/profil', done: !!s.user.mdp || firebaseEnabled });
    return out;
  }
  const classes = db.list('classes');
  const staff = db.list('staff').filter((x) => x.statut === 'Actif');
  const profs = staff.filter((x) => x.type === 'Professeur');
  const users = db.list('users');
  if (s.can('parametres', 'write')) {
    out.push({ id: 'logo', label: 'Logo et signature de l’école', sub: 'Ils apparaissent sur les bulletins et les reçus', to: '/parametres?tab=ecole', done: !!school?.logo && !!school?.signatureDirecteur });
    out.push({ id: 'annee', label: 'Année scolaire et périodes', sub: 'Dates de l’année et des contrôles', to: '/parametres?tab=annee', done: db.list('periods').length > 0 });
  }
  if (s.can('classes', 'write')) out.push({ id: 'classes', label: 'Classes et frais de scolarité', sub: 'Chaque classe avec ses frais', to: '/classes', done: classes.length > 0 && classes.every((c) => c.fraisScolarite > 0) });
  if (s.can('personnel', 'write')) out.push({ id: 'profs', label: 'Ajouter les professeurs', sub: 'Avec leur matière et leur mode de paie', to: '/personnel', done: profs.length > 0 });
  if (s.can('eleves', 'write') || s.can('inscriptions', 'write')) out.push({ id: 'eleves', label: 'Ajouter les élèves', sub: 'Un par un ou avec un fichier Excel', to: '/inscriptions/rapide', done: db.list('students').length > 0 });
  if (s.can('emploi', 'write')) out.push({ id: 'emploi', label: 'Faire l’emploi du temps', sub: 'Les professeurs voient leurs cours', to: '/emploi-du-temps', done: db.list('timetable').length > 0 });
  if (s.can('utilisateurs', 'write')) {
    const withAccount = profs.filter((p) => users.some((u) => u.staffId === p.id && u.roleId)).length;
    out.push({ id: 'comptes', label: 'Donner le code aux professeurs', sub: `${withAccount} / ${profs.length} professeurs ont un compte`, to: '/parametres?tab=utilisateurs', done: profs.length > 0 && withAccount >= profs.length });
  }
  if (s.can('parents', 'write')) out.push({ id: 'parents', label: 'Créer les accès des parents', sub: 'Ils suivent leurs enfants depuis leur téléphone', to: '/parents', done: users.some((u) => u.guardianId) });
  if (s.can('parametres', 'write')) {
    if (!firebaseEnabled) out.push({ id: 'sauvegarde', label: 'Envoyer une sauvegarde', sub: 'Une copie hors de ce téléphone, chaque semaine', to: '/parametres?tab=donnees', done: Date.now() - lastExport() < 7 * 86400000 });
    out.push({ id: 'sync', label: 'Brancher la base de données en ligne', sub: 'Pour que tous les téléphones partagent les mêmes données', to: '/parametres?tab=donnees', done: firebaseEnabled });
  }
  return out;
}

/** Faut-il montrer un rappel aujourd'hui ? Au plus un tous les N jours (réglage de l'école). */
export function reminderDue(u: User) {
  const r = db.get('school', 'main')?.rappels ?? { actif: true, jours: 1 };
  if (!r.actif) return false;
  return Date.now() - (u.dernierRappel ?? 0) > r.jours * 86400000 - 3600000;
}
/** Le rappel du jour : on fait tourner les étapes non faites pour ne pas répéter toujours la même. */
export function reminderOfTheDay(steps: Step[]) {
  const todo = steps.filter((x) => !x.done);
  if (!todo.length) return null;
  const day = Math.floor(Date.now() / 86400000);
  return { step: todo[day % todo.length], left: todo.length };
}
