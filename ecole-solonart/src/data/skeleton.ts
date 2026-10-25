// Squelette d'une école neuve : ce qu'il faut pour démarrer, sans aucune donnée d'élève.
// Utilisé par la démonstration (seed.ts) et par le script qui crée une école en ligne (scripts/bootstrap-school.ts).
import type { Access, ModuleKey, Role, School, SchoolYear, Subject, User } from './types';

export const ALL_MODULES: ModuleKey[] = ['dashboard', 'eleves', 'inscriptions', 'classes', 'parents', 'personnel', 'emploi', 'notes', 'presences', 'discipline', 'cahier', 'finance', 'documents', 'communication', 'rapports', 'parametres', 'utilisateurs'];
const perms = (a: Access, over: Partial<Record<ModuleKey, Access>> = {}) => ({ ...Object.fromEntries(ALL_MODULES.map((m) => [m, a])), ...over }) as Record<ModuleKey, Access>;

export const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'fr', nom: 'Français', court: 'FR', couleur: 'blue', updatedAt: 0 },
  { id: 'cr', nom: 'Créole', court: 'CR', couleur: 'teal', updatedAt: 0 },
  { id: 'an', nom: 'Anglais', court: 'AN', couleur: 'pink', updatedAt: 0 },
  { id: 'ma', nom: 'Mathématiques', court: 'MA', couleur: 'green', updatedAt: 0 },
  { id: 'svt', nom: 'Sciences de la vie et de la terre (SVT)', court: 'SVT', couleur: 'violet', updatedAt: 0 },
  { id: 'pc', nom: 'Physique-Chimie', court: 'PC', couleur: 'violet', updatedAt: 0 },
  { id: 'hg', nom: 'Histoire-Géographie', court: 'HG', couleur: 'amber', updatedAt: 0 },
  { id: 'ec', nom: 'Éducation civique et morale', court: 'ECM', couleur: 'cyan', updatedAt: 0 },
  { id: 'inf', nom: 'Informatique', court: 'INF', couleur: 'slate', updatedAt: 0 },
  { id: 'art', nom: 'Éducation artistique', court: 'ART', couleur: 'violet', updatedAt: 0 },
  { id: 'eps', nom: 'Éducation physique et sportive (EPS)', court: 'EPS', couleur: 'blue', updatedAt: 0 },
  { id: 'opt', nom: 'Options / Projet', court: 'OPT', couleur: 'amber', updatedAt: 0 },
  // Préscolaire : domaines d'apprentissage évalués par compétences (Acquis / En cours / Non acquis)
  { id: 'ps-lang', nom: 'Langage oral et écrit', court: 'LANG', couleur: 'blue', groupe: 'prescolaire', updatedAt: 0 },
  { id: 'ps-math', nom: 'Pré-mathématiques', court: 'MATH', couleur: 'green', groupe: 'prescolaire', updatedAt: 0 },
  { id: 'ps-monde', nom: 'Découverte du monde', court: 'MONDE', couleur: 'violet', groupe: 'prescolaire', updatedAt: 0 },
  { id: 'ps-mot', nom: 'Motricité', court: 'MOT', couleur: 'cyan', groupe: 'prescolaire', updatedAt: 0 },
  { id: 'ps-art', nom: 'Arts, chants et comptines', court: 'ART', couleur: 'pink', groupe: 'prescolaire', updatedAt: 0 },
  { id: 'ps-vivre', nom: 'Vivre ensemble', court: 'VIVRE', couleur: 'amber', groupe: 'prescolaire', updatedAt: 0 },
];

export function defaultRoles(): Role[] {
  return [
    { id: 'r-dir', nom: 'Directeur', description: 'Accès complet à toute l’application.', systeme: true, espace: 'admin', permissions: perms('write'), updatedAt: 0 },
    { id: 'r-adj', nom: 'Directeur adjoint', description: 'Gestion pédagogique et administrative, sans paramètres ni utilisateurs.', espace: 'admin', permissions: perms('write', { parametres: 'read', utilisateurs: 'none', finance: 'read' }), updatedAt: 0 },
    { id: 'r-sec', nom: 'Secrétaire', description: 'Inscriptions, élèves, parents, documents.', espace: 'admin', permissions: perms('none', { dashboard: 'read', eleves: 'write', inscriptions: 'write', parents: 'write', classes: 'read', documents: 'write', communication: 'write', presences: 'read', emploi: 'read', personnel: 'read', discipline: 'read', cahier: 'read' }), updatedAt: 0 },
    { id: 'r-cpt', nom: 'Comptable', description: 'Finance, paiements, salaires et rapports financiers.', espace: 'admin', permissions: perms('none', { dashboard: 'read', finance: 'write', eleves: 'read', parents: 'read', personnel: 'read', rapports: 'read' }), updatedAt: 0 },
    { id: 'r-cen', nom: 'Censeur', description: 'Présences, discipline et consultation des notes.', espace: 'admin', permissions: perms('none', { dashboard: 'read', eleves: 'read', presences: 'write', discipline: 'write', cahier: 'read', notes: 'read', classes: 'read', emploi: 'read', parents: 'read', communication: 'write' }), updatedAt: 0 },
    { id: 'r-prof', nom: 'Professeur', description: 'Espace professeur : ses classes, saisie des notes, appel, palmarès.', systeme: true, espace: 'professeur', permissions: perms('none'), updatedAt: 0 },
    { id: 'r-par', nom: 'Parent', description: 'Espace parent : notes validées, absences, discipline, devoirs et paiements de ses enfants uniquement.', systeme: true, espace: 'parent', permissions: perms('none'), updatedAt: 0 },
  ];
}

/** Identifiant d'un compte en ligne : son adresse e-mail (les règles de sécurité lisent users/{email}). */
export const userKey = (email: string) => email.trim().toLowerCase();

/** Année scolaire haïtienne en cours : septembre → juin. */
export function currentYear(now = new Date()): SchoolYear {
  const y = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  return { id: `y${y}`, libelle: `${y} - ${y + 1}`, debut: `${y}-09-01`, fin: `${y + 1}-06-30`, active: true, updatedAt: Date.now() };
}

export interface Skeleton { school: School; years: SchoolYear[]; roles: Role[]; subjects: Subject[]; users: User[] }

export function skeleton(o: { nom: string; commune?: string; directeurNom: string; directeurEmail: string; code: string }): Skeleton {
  const now = Date.now();
  const year = currentYear();
  const school: School = {
    id: 'main', nom: o.nom, devise: '', slogan: '', adresse: '', commune: o.commune ?? '', departement: '', telephone: '', email: '', siteWeb: '',
    directeur: o.directeurNom, anneeCourante: year.id, monnaie: 'G', bareme: 20, seuilReussite: 10,
    codeEtablissement: o.code, parentsCompletent: false, relanceAuto: { actif: false, jours: 14, minimum: 1000 }, rappels: { actif: true, jours: 2 }, updatedAt: now,
  };
  const dir: User = { id: userKey(o.directeurEmail), nom: o.directeurNom, email: userKey(o.directeurEmail), roleId: 'r-dir', pin: '', actif: true, updatedAt: now };
  const stamp = <T extends { updatedAt: number }>(x: T) => ({ ...x, updatedAt: now });
  return { school, years: [year], roles: defaultRoles().map(stamp), subjects: DEFAULT_SUBJECTS.map(stamp), users: [dir] };
}
