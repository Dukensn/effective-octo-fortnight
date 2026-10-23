// Données de démonstration (profils fictifs) — contexte haïtien, École Mixte Solonart, Léogâne.
import { db } from './store';
import type {
  ChatMessage,
  ClassRoom, Course, Evaluation, Grade, Guardian, Period, Role, Staff, Student, Subject, TimetableSlot,
  Payment, Expense, Salary, Attendance, ModuleKey, Access, User, Sexe, Incident, Lesson,
} from './types';

let seedState = 20240905;
function rnd() {
  seedState = (seedState * 1664525 + 1013904223) % 4294967296;
  return seedState / 4294967296;
}
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];
const gauss = () => (rnd() + rnd() + rnd() + rnd() - 2) / 0.58; // ~N(0,1)
const pad = (n: number, l = 4) => String(n).padStart(l, '0');
const iso = (y: number, m: number, d: number) => `${y}-${pad(m, 2)}-${pad(d, 2)}`;

const PRENOMS_M = ['Jean', 'Pierre', 'Marc', 'Wilson', 'Kervens', 'Jameson', 'Peterson', 'Stevenson', 'Ricardo', 'Lucas', 'David', 'Steeve', 'Fritz', 'Wilner', 'Ronald', 'Jonathan', 'Emmanuel', 'Daniel', 'Samuel', 'Josué', 'Mackenson', 'Woodley', 'Jephté', 'Ruben', 'Richardson', 'Ralph', 'Kenley', 'Bergson', 'Nickenson', 'Dieuveut', 'Widley', 'Junior', 'Clifford', 'Gerby', 'Évens'];
const PRENOMS_F = ['Marie', 'Naomi', 'Carla', 'Daniela', 'Sarah', 'Ashley', 'Nadège', 'Roseline', 'Fabiola', 'Mirlande', 'Guerline', 'Esther', 'Rachelle', 'Judith', 'Nathalie', 'Sophia', 'Kettly', 'Medjine', 'Christela', 'Wideline', 'Bethania', 'Taïna', 'Lovely', 'Sherlyne', 'Darline', 'Ketia', 'Islande', 'Myrlande', 'Stéphanie', 'Johanne', 'Farah', 'Tamara'];
const NOMS = ['Pierre', 'Jean', 'Louis', 'Joseph', 'Charles', 'Saintil', 'Dorval', 'Auguste', 'Méus', 'Benoit', 'Bonheur', 'Hermogène', 'Dupont', 'Étienne', 'François', 'Augustin', 'Calixte', 'Vital', 'Michel', 'Valcourt', 'Alexandre', 'Mondésir', 'Cherismé', 'Desrosiers', 'Jean-Baptiste', 'Baptiste', 'Simon', 'Noël', 'Laguerre', 'Fils-Aimé', 'Toussaint', 'Célestin', 'Désir', 'Paul', 'Philippe', 'Destiné', 'Lafortune', 'Exantus', 'Bien-Aimé', 'Thélusma'];
const RUES = ['Rue Principale', 'Route de Gressier', 'Rue du Marché', 'Rue des Écoles', 'Rue du Portail', 'Cité Solonart', 'Route de Petit-Goâve', "Rue de l'Avenir", 'Rue Lamarre', 'Darbonne', 'Dampus', 'Belle-Anse, Léogâne'];
const PROFESSIONS = ['Commerçant(e)', 'Enseignant(e)', 'Agriculteur(trice)', 'Infirmier(ère)', 'Chauffeur', 'Couturière', 'Mécanicien', 'Comptable', 'Pasteur', 'Fonctionnaire', 'Électricien', 'Marchande', 'Ingénieur', 'Infirmière'];
const phone = () => `+509 ${pick(['31', '32', '33', '34', '36', '37', '38', '39', '41', '42', '43', '44', '46', '48'])} ${pad(Math.floor(rnd() * 100), 2)} ${pad(Math.floor(rnd() * 100), 2)} ${pad(Math.floor(rnd() * 100), 2)}`;
const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '');

export const ALL_MODULES: ModuleKey[] = ['dashboard', 'eleves', 'inscriptions', 'classes', 'parents', 'personnel', 'emploi', 'notes', 'presences', 'discipline', 'cahier', 'finance', 'documents', 'communication', 'rapports', 'parametres', 'utilisateurs'];
const perms = (a: Access, over: Partial<Record<ModuleKey, Access>> = {}) => ({ ...Object.fromEntries(ALL_MODULES.map((m) => [m, a])), ...over });

export function seedDatabase() {
  seedState = 20240905;
  const Y = 'y2024';

  db.put('school', {
    id: 'main', nom: 'École Mixte Solonart', devise: 'Discipline • Excellence • Avenir', slogan: "Apprendre aujourd'hui, construire demain.",
    adresse: 'Rue Principale', commune: 'Léogâne', departement: 'Ouest', telephone: '+509 37 12 34 56', email: 'contact@solonart.edu', siteWeb: 'www.solonart.edu',
    directeur: 'M. Léomide S. Cherismé', anneeCourante: Y, monnaie: 'G', bareme: 20, seuilReussite: 10, numeroMenfp: '01-0412-23',
  });
  db.put('years', { id: Y, libelle: '2024 - 2025', debut: '2024-09-02', fin: '2025-06-30', active: true });
  db.put('years', { id: 'y2023', libelle: '2023 - 2024', debut: '2023-09-04', fin: '2024-06-28', active: false });

  const periods: Period[] = [
    { id: 'p1', anneeId: Y, ordre: 1, libelle: '1er contrôle', court: 'C1', debut: '2024-09-02', fin: '2024-10-31', verrouillee: true, type: 'controle', updatedAt: 0 },
    { id: 'p2', anneeId: Y, ordre: 2, libelle: '2e contrôle', court: 'C2', debut: '2024-11-01', fin: '2025-01-18', verrouillee: true, type: 'controle', updatedAt: 0 },
    { id: 'p3', anneeId: Y, ordre: 3, libelle: '3e contrôle', court: 'C3', debut: '2025-01-20', fin: '2025-03-15', verrouillee: true, type: 'controle', updatedAt: 0 },
    { id: 'p4', anneeId: Y, ordre: 4, libelle: '4e contrôle', court: 'C4', debut: '2025-03-17', fin: '2025-05-10', verrouillee: false, type: 'controle', updatedAt: 0 },
    { id: 'p5', anneeId: Y, ordre: 5, libelle: '5e contrôle', court: 'C5', debut: '2025-05-12', fin: '2025-06-10', verrouillee: false, type: 'controle', updatedAt: 0 },
  ];
  db.bulkPut('periods', periods);

  const subjects: Subject[] = [
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
  db.bulkPut('subjects', subjects);
  const COEF: Record<string, number> = { fr: 3, cr: 2, an: 3, ma: 4, svt: 3, pc: 3, hg: 2, ec: 1, inf: 2, art: 1, eps: 1, opt: 2, 'ps-lang': 1, 'ps-math': 1, 'ps-monde': 1, 'ps-mot': 1, 'ps-art': 1, 'ps-vivre': 1 };

  // ---------- Personnel ----------
  const staff: Staff[] = [];
  const addStaff = (s: Partial<Staff> & Pick<Staff, 'nom' | 'prenom' | 'sexe' | 'type' | 'poste'>) => {
    const n = staff.length + 1;
    const st: Staff = {
      id: `st${pad(n, 2)}`, matricule: `EMP${pad(n, 3)}`, telephone: phone(), email: `${slug(s.prenom)}.${slug(s.nom)}@solonart.edu`,
      adresse: `${pick(RUES)}, Léogâne, Haïti`, dateEmbauche: iso(2015 + Math.floor(rnd() * 9), 9, 1), salaire: 24000, modePaiement: pick(['MonCash', 'Virement', 'Espèces']),
      statut: 'Actif', updatedAt: 0, dateNaissance: iso(1972 + Math.floor(rnd() * 25), 1 + Math.floor(rnd() * 12), 1 + Math.floor(rnd() * 27)), ...s,
    } as Staff;
    staff.push(st);
    return st;
  };
  const dir = addStaff({ nom: 'Cherismé', prenom: 'Léomide S.', sexe: 'M', type: 'Direction', poste: 'Directeur', diplome: "Maîtrise en Sciences de l'éducation", salaire: 72000, photo: 'avatars/dir.jpg', telephone: '+509 36 00 12 45', email: 'direction@solonart.edu', dateNaissance: '1975-06-14' });
  const adj = addStaff({ nom: 'Pierre', prenom: 'Nadia', sexe: 'F', type: 'Direction', poste: 'Directrice adjointe', diplome: 'Licence en Administration scolaire', salaire: 54000, telephone: '+509 38 22 44 66', adresse: 'Rue du Portail, Léogâne, Haïti', dateNaissance: '1978-09-09' });
  const robert = addStaff({ nom: 'Robert', prenom: 'Jean', sexe: 'M', type: 'Professeur', poste: 'Professeur', specialite: 'Mathématiques', diplome: 'Licence en Mathématiques', salaire: 39000, photo: 'avatars/t01.jpg', telephone: '+509 36 12 34 56' });
  const P: Record<string, Staff> = {
    fr: addStaff({ nom: 'Michel', prenom: 'Josée', sexe: 'F', type: 'Professeur', poste: 'Professeure', specialite: 'Français', diplome: 'Licence en Lettres', salaire: 36000 }),
    cr: addStaff({ nom: 'Calixte', prenom: 'Jean', sexe: 'M', type: 'Professeur', poste: 'Professeur', specialite: 'Créole', diplome: 'Licence en Linguistique', salaire: 33000 }),
    an: addStaff({ nom: 'Pierre', prenom: 'Claudia', sexe: 'F', type: 'Professeur', poste: 'Professeure', specialite: 'Anglais', diplome: 'Licence en Langues', salaire: 34500 }),
    ma: addStaff({ nom: 'Augustin', prenom: 'Wilner', sexe: 'M', type: 'Professeur', poste: 'Professeur', specialite: 'Mathématiques', diplome: 'Licence en Mathématiques', salaire: 37000 }),
    svt: addStaff({ nom: 'Louis', prenom: 'Sandrine', sexe: 'F', type: 'Professeur', poste: 'Professeure', specialite: 'SVT', diplome: 'Licence en Biologie', salaire: 34500 }),
    pc: addStaff({ nom: 'Charles', prenom: 'Peterson', sexe: 'M', type: 'Professeur', poste: 'Professeur', specialite: 'Physique-Chimie', diplome: 'Licence en Physique', salaire: 36000 }),
    hg: addStaff({ nom: 'Pierre', prenom: 'Ronald', sexe: 'M', type: 'Professeur', poste: 'Professeur', specialite: 'Histoire-Géographie', diplome: 'Licence en Histoire', salaire: 33500 }),
    ec: addStaff({ nom: 'François', prenom: 'Nadine', sexe: 'F', type: 'Professeur', poste: 'Professeure', specialite: 'Éducation civique', diplome: 'Licence en Sciences sociales', salaire: 34500 }),
    inf: addStaff({ nom: 'Dorvil', prenom: 'Stevenson', sexe: 'M', type: 'Professeur', poste: 'Professeur', specialite: 'Informatique', diplome: 'Licence en Informatique', salaire: 36000 }),
    art: addStaff({ nom: 'Mondésir', prenom: 'Carline', sexe: 'F', type: 'Professeur', poste: 'Professeure', specialite: 'Éducation artistique', diplome: 'Diplôme ENARTS', salaire: 30000 }),
    eps: addStaff({ nom: 'Étienne', prenom: 'Kervens', sexe: 'M', type: 'Professeur', poste: 'Professeur', specialite: 'EPS', diplome: 'Licence en STAPS', salaire: 30000 }),
    opt: addStaff({ nom: 'Vital', prenom: 'Jameson', sexe: 'M', type: 'Professeur', poste: 'Professeur', specialite: 'Projet / Options', diplome: 'Licence en Gestion', salaire: 31000 }),
  };
  const P2: Record<string, Staff> = {
    fr: addStaff({ nom: 'Laurent', prenom: 'Marie', sexe: 'F', type: 'Professeur', poste: 'Professeure', specialite: 'Français', diplome: 'Licence en Lettres', salaire: 33000, adresse: 'Route de Gressier, Léogâne, Haïti' }),
    hg: addStaff({ nom: 'Jean', prenom: 'Daniel', sexe: 'M', type: 'Professeur', poste: 'Professeur', specialite: 'Histoire - Géographie', diplome: 'Licence en Histoire', salaire: 33000, adresse: 'Rue des Écoles, Léogâne, Haïti', dateNaissance: '1982-02-14' }),
    an: addStaff({ nom: 'Benoit', prenom: 'Guerline', sexe: 'F', type: 'Professeur', poste: 'Professeure', specialite: 'Anglais', diplome: 'Licence en Langues', salaire: 31000 }),
  };
  const maitresses: Record<string, Staff> = {
    PS: addStaff({ nom: 'Jean-Baptiste', prenom: 'Roseline', sexe: 'F', type: 'Professeur', poste: 'Maîtresse', specialite: 'Préscolaire', diplome: 'Brevet de jardinière d’enfants', salaire: 26000 }),
    MS: addStaff({ nom: 'Desrosiers', prenom: 'Mirlande', sexe: 'F', type: 'Professeur', poste: 'Maîtresse', specialite: 'Préscolaire', diplome: 'Brevet de jardinière d’enfants', salaire: 26000 }),
    GS: addStaff({ nom: 'Toussaint', prenom: 'Guerda', sexe: 'F', type: 'Professeur', poste: 'Maîtresse', specialite: 'Préscolaire', diplome: 'Diplôme ENI (préscolaire)', salaire: 27000 }),
  };
  addStaff({ nom: 'Joseph', prenom: 'Luc', sexe: 'M', type: 'Administration', poste: 'Secrétaire', salaire: 27000, adresse: 'Route de Petit-Goâve, Léogâne, Haïti' });
  addStaff({ nom: 'Saintil', prenom: 'Michel', sexe: 'M', type: 'Administration', poste: 'Comptable', diplome: 'Licence en Comptabilité', salaire: 30000 });
  addStaff({ nom: 'Mondésir', prenom: 'Carline', sexe: 'F', type: 'Soutien', poste: 'Bibliothécaire', salaire: 22500, adresse: 'Rue du Marché, Léogâne, Haïti' });
  addStaff({ nom: 'Valcourt', prenom: 'Jean R.', sexe: 'M', type: 'Soutien', poste: "Agent d'entretien", salaire: 15000, adresse: 'Cité Solonart, Léogâne, Haïti' });
  addStaff({ nom: 'Alexandre', prenom: 'Fritz', sexe: 'M', type: 'Administration', poste: 'Conseiller scolaire', diplome: 'Licence en Psychologie', salaire: 33000, adresse: "Rue de l'Avenir, Léogâne, Haïti", dateNaissance: '1984-11-28' });
  addStaff({ nom: 'Méus', prenom: 'Ricardo', sexe: 'M', type: 'Soutien', poste: "Agent d'entretien", salaire: 21000 });
  addStaff({ nom: 'Benoit', prenom: 'Carmen', sexe: 'F', type: 'Administration', poste: 'Secrétaire', salaire: 27000 });
  addStaff({ nom: 'Pierre', prenom: 'Wilson', sexe: 'M', type: 'Professeur', poste: 'Professeur', specialite: 'EPS', salaire: 27000 });
  addStaff({ nom: 'Méus', prenom: 'Joël', sexe: 'M', type: 'Administration', poste: 'Censeur (Préfet de discipline)', salaire: 30000 });
  db.bulkPut('staff', staff);

  // ---------- Classes ----------
  const classDefs: [string, string, ClassRoom['niveau'], string, number, number, string?][] = [
    ['PS', 'Petite section (Préscolaire I)', 'Préscolaire', 'Préscolaire I', 18, 35000],
    ['MS', 'Moyenne section (Préscolaire II)', 'Préscolaire', 'Préscolaire II', 20, 35000],
    ['GS', 'Grande section (Préscolaire III)', 'Préscolaire', 'Préscolaire III', 22, 38000],
    ['7AF', '7e année fondamentale', 'Fondamental', '7e AF', 30, 60000],
    ['8AF', '8e année fondamentale', 'Fondamental', '8e AF', 28, 60000],
    ['9AF', '9e année fondamentale', 'Fondamental', '9e AF', 30, 66000],
    ['S1-B', 'Secondaire I - S1-B', 'Secondaire', 'Secondaire I', 26, 75000, 'B'],
    ['S2-A', 'Secondaire II - S2-A', 'Secondaire', 'Secondaire II', 28, 81000, 'A'],
    ['S2-B', 'Secondaire II - S2-B', 'Secondaire', 'Secondaire II', 27, 81000, 'B'],
    ['S3-A', 'Secondaire III - S3-A', 'Secondaire', 'Secondaire III', 30, 84000, 'A'],
    ['S3-B', 'Secondaire III - S3-B', 'Secondaire', 'Secondaire III', 28, 84000, 'B'],
    ['S4-A', 'Secondaire IV - S4-A', 'Secondaire', 'Secondaire IV', 32, 90000, 'A'],
    ['S4-B', 'Secondaire IV - S4-B', 'Secondaire', 'Secondaire IV', 28, 90000, 'B'],
  ];
  const classes: ClassRoom[] = classDefs.map(([code, nom, niveau, annee, n, frais, section]) => ({
    id: `c-${code.toLowerCase()}`, anneeId: Y, code, nom, niveau, annee, section, filiere: niveau === 'Secondaire' ? 'Sciences' : undefined,
    salle: `Salle ${code}`, capacite: 35, fraisScolarite: frais, fraisInscription: niveau === 'Préscolaire' ? 3000 : 5000, updatedAt: 0, titulaireId: undefined,
    _n: n,
  } as ClassRoom & { _n: number }));
  const titulaires: Record<string, string> = { 'S4-A': P.ec.id, 'S4-B': P.fr.id, 'S3-A': robert.id, 'S3-B': P.svt.id, 'S2-A': P.an.id, 'S2-B': P.hg.id, 'S1-B': P2.fr.id, '9AF': P.cr.id, '8AF': P2.hg.id, '7AF': P2.an.id, PS: maitresses.PS.id, MS: maitresses.MS.id, GS: maitresses.GS.id };
  classes.forEach((c) => (c.titulaireId = titulaires[c.code]));

  // ---------- Cours (matières x classes) ----------
  const courses: Course[] = [];
  for (const c of classes) {
    const pre = c.niveau === 'Préscolaire';
    for (const s of subjects) {
      if (pre !== (s.groupe === 'prescolaire')) continue;
      if (pre) { courses.push({ id: `${c.id}-${s.id}`, classeId: c.id, matiereId: s.id, professeurId: maitresses[c.code].id, coefficient: 1, heuresSemaine: 4, updatedAt: 0 }); continue; }
      if (c.niveau === 'Fondamental' && (s.id === 'pc' || s.id === 'opt')) continue;
      let prof = P[s.id];
      if (s.id === 'ma' && ['S4-A', 'S4-B', 'S3-A'].includes(c.code)) prof = robert;
      if (c.niveau === 'Fondamental' && P2[s.id]) prof = P2[s.id];
      courses.push({ id: `${c.id}-${s.id}`, classeId: c.id, matiereId: s.id, professeurId: prof.id, coefficient: COEF[s.id], heuresSemaine: COEF[s.id] + 1, updatedAt: 0 });
    }
  }
  db.bulkPut('courses', courses);

  // ---------- Parents & élèves ----------
  const guardians: Guardian[] = [];
  const students: Student[] = [];
  let gseq = 0;
  const addGuardian = (g: Partial<Guardian> & Pick<Guardian, 'nom' | 'prenom' | 'sexe' | 'lien'>) => {
    const gg: Guardian = { id: `g${pad(++gseq)}`, telephone: phone(), principal: true, statut: 'Actif', nationalite: 'Haïtienne', profession: pick(PROFESSIONS), adresse: `${pick(RUES)}, Léogâne`, updatedAt: 0, ...g } as Guardian;
    if (!gg.email && rnd() > 0.35) gg.email = `${slug(gg.prenom)}.${slug(gg.nom)}@email.com`;
    gg.whatsapp = gg.telephone;
    guardians.push(gg);
    return gg;
  };

  const jeanDorval = addGuardian({ nom: 'Dorval', prenom: 'Jean', sexe: 'M', lien: 'Père', telephone: '+509 36 98 76 54', email: 'jean.dorval@email.com', profession: 'Commerçant', adresse: 'Rue Principale, Léogâne', dateNaissance: '1980-05-15', photo: 'avatars/p01_hd.jpg', notes: 'Parent très impliqué dans la scolarité.' });
  const marieDorval = addGuardian({ nom: 'Dorval', prenom: 'Marie', sexe: 'F', lien: 'Mère', telephone: '+509 37 12 34 56', email: 'marie.dorval@email.com', profession: 'Enseignante', photo: 'avatars/p02.jpg', principal: false });
  const namedParents = [
    addGuardian({ nom: 'Louis', prenom: 'Pierre', sexe: 'M', lien: 'Grand-père', telephone: '+509 44 55 66 77', photo: 'avatars/p03.jpg' }),
    addGuardian({ nom: 'Pierre', prenom: 'Sophie', sexe: 'F', lien: 'Mère', telephone: '+509 38 77 88 99', photo: 'avatars/p04.jpg' }),
    addGuardian({ nom: 'Auguste', prenom: 'André', sexe: 'M', lien: 'Père', telephone: '+509 41 22 33 44', photo: 'avatars/p05.jpg' }),
    addGuardian({ nom: 'Charles', prenom: 'Nathanaël', sexe: 'M', lien: 'Oncle', telephone: '+509 48 99 00 11', photo: 'avatars/p06.jpg' }),
    addGuardian({ nom: 'Méus', prenom: 'Lucienne', sexe: 'F', lien: 'Grand-mère', telephone: '+509 46 12 34 56', photo: 'avatars/p07.jpg', statut: 'Inactif' }),
    addGuardian({ nom: 'Benoit', prenom: 'Carmen', sexe: 'F', lien: 'Mère', telephone: '+509 39 87 65 43', photo: 'avatars/p08.jpg' }),
    addGuardian({ nom: 'Saintil', prenom: 'Michel', sexe: 'M', lien: 'Père', telephone: '+509 42 33 44 55', photo: 'avatars/p09.jpg' }),
    addGuardian({ nom: 'Jean', prenom: 'Rosemonde', sexe: 'F', lien: 'Grand-mère', telephone: '+509 49 11 22 33', photo: 'avatars/p10.jpg' }),
  ];

  const S4A_NAMED: [string, string, Sexe, string?][] = [
    ['Dorval', 'Jean Philippe', 'M', 'avatars/s01_hd.jpg'], ['Dupont', 'Marie', 'F', 'avatars/s02.jpg'], ['Saintil', 'Carla', 'F', 'avatars/s03.jpg'],
    ['Louis', 'David', 'M', 'avatars/s04.jpg'], ['Pierre', 'Naomi', 'F', 'avatars/s05.jpg'], ['Auguste', 'Steeve', 'M', 'avatars/s06.jpg'],
    ['Charles', 'Daniela', 'F', 'avatars/s07.jpg'], ['Méus', 'Ricardo', 'M', 'avatars/s08.jpg'], ['Benoit', 'Ashley', 'F', 'avatars/s09.jpg'],
    ['Pierre', 'Lucas', 'M', 'avatars/s10.jpg'], ['Bonheur', 'Sarah', 'F'], ['Hermogène', 'Lucas', 'M'],
  ];
  const LEVEL_PREFIX: Record<string, string> = { 'Préscolaire I': 'PI', 'Préscolaire II': 'PII', 'Préscolaire III': 'PIII', '7e AF': 'F7', '8e AF': 'F8', '9e AF': 'F9', 'Secondaire I': 'SI', 'Secondaire II': 'SII', 'Secondaire III': 'SIII', 'Secondaire IV': 'SIV' };
  let mseq = 0;
  const groupes = ['O+', 'O+', 'O+', 'A+', 'B+', 'AB+', 'O-', 'A-'];
  for (const c of classes as (ClassRoom & { _n: number })[]) {
    const n = c._n;
    const age = { 'Préscolaire I': 3, 'Préscolaire II': 4, 'Préscolaire III': 5, '7e AF': 12, '8e AF': 13, '9e AF': 14, 'Secondaire I': 15, 'Secondaire II': 15, 'Secondaire III': 16, 'Secondaire IV': 16 }[c.annee] ?? 14;
    for (let i = 0; i < n; i++) {
      mseq++;
      let nom: string, prenom: string, sexe: Sexe, photo: string | undefined;
      if (c.code === 'S4-A' && i < S4A_NAMED.length) [nom, prenom, sexe, photo] = S4A_NAMED[i];
      else if (c.code === 'S2-B' && i === 0) [nom, prenom, sexe, photo] = ['Dorval', 'Naomi', 'F', 'avatars/c02.jpg'];
      else {
        sexe = rnd() < 0.5 ? 'M' : 'F';
        nom = pick(NOMS);
        const pool = (sexe === 'M' ? PRENOMS_M : PRENOMS_F).filter((x) => x !== nom);
        prenom = pick(pool);
        if (rnd() < 0.25) prenom += ' ' + pick(pool.filter((x) => x !== prenom));
        photo = undefined;
      }
      // tuteurs
      let tuteurIds: string[];
      if (nom === 'Dorval' && (prenom === 'Jean Philippe' || prenom === 'Naomi')) tuteurIds = [jeanDorval.id, marieDorval.id];
      else if (c.code === 'S4-A' && i >= 2 && i < 10) {
        const byName = namedParents.find((g) => g.nom === nom);
        tuteurIds = byName ? [byName.id] : [addGuardian({ nom, prenom: pick(PRENOMS_M), sexe: 'M', lien: 'Père' }).id];
      } else {
        const pere = addGuardian({ nom, prenom: pick(PRENOMS_M), sexe: 'M', lien: 'Père' });
        tuteurIds = [pere.id];
        if (rnd() < 0.55) tuteurIds.push(addGuardian({ nom: pick(NOMS), prenom: pick(PRENOMS_F), sexe: 'F', lien: 'Mère', principal: false }).id);
      }
      const y = 2024 - age - (rnd() < 0.2 ? 1 : 0);
      const isJP = prenom === 'Jean Philippe';
      students.push({
        id: isJP ? 'e-jean-philippe' : `e${pad(mseq)}`,
        matricule: isJP ? 'SIV20240087' : `${LEVEL_PREFIX[c.annee]}2024${pad(mseq)}`,
        nom, prenom, sexe, photo,
        dateNaissance: isJP ? '2008-03-12' : iso(y, 1 + Math.floor(rnd() * 12), 1 + Math.floor(rnd() * 27)),
        lieuNaissance: isJP ? 'Léogâne' : pick(['Léogâne', 'Léogâne', 'Port-au-Prince', 'Gressier', 'Petit-Goâve', 'Grand-Goâve', 'Carrefour', 'Jacmel']),
        nationalite: 'Haïtienne', religion: pick(['Catholique', 'Protestante', 'Adventiste', 'Baptiste', 'Témoin de Jéhovah']),
        numeroActe: `A-${y}-${pad(Math.floor(rnd() * 99999), 5)}`,
        adresse: isJP ? 'Rue Principale' : pick(RUES), commune: 'Léogâne',
        telephone: isJP ? '+509 34 12 56 78' : rnd() < 0.4 ? phone() : undefined,
        email: isJP ? 'jean.dorval@email.com' : undefined,
        classeId: c.id, anneeId: Y,
        regime: rnd() < 0.9 ? 'Externe' : 'Demi-pensionnaire',
        typeInscription: rnd() < 0.8 ? 'Réinscription' : 'Nouvelle inscription',
        redoublant: !isJP && rnd() < 0.07, boursier: !isJP && rnd() < 0.06, tauxBourse: 50,
        dateInscription: isJP ? '2023-09-05' : iso(2024, 8, 1 + Math.floor(rnd() * 30)), dateEntree: '2024-09-05',
        statut: 'Actif', tuteurIds,
        contactUrgence: undefined,
        medical: { groupeSanguin: pick(groupes), allergies: rnd() < 0.08 ? pick(['Arachides', 'Pénicilline', 'Poussière']) : undefined },
        documents: [
          { type: 'Acte de naissance', nom: 'acte.pdf', fourni: true },
          { type: 'Dernier bulletin', nom: 'bulletin.pdf', fourni: rnd() < 0.92 },
          { type: "Photo d'identité", nom: 'photo.jpg', fourni: true },
          { type: 'Certificat médical', nom: 'certificat.pdf', fourni: rnd() < 0.6 },
        ],
        langue: 'Français', updatedAt: 0,
      });
    }
  }
  // inscriptions en attente
  for (let i = 0; i < 4; i++) {
    const sexe: Sexe = i % 2 ? 'F' : 'M';
    const nom = pick(NOMS);
    const pere = addGuardian({ nom, prenom: pick(PRENOMS_M), sexe: 'M', lien: 'Père' });
    students.push({
      id: `e${pad(++mseq)}`, matricule: `ATT2025${pad(mseq)}`, nom, prenom: sexe === 'M' ? pick(PRENOMS_M) : pick(PRENOMS_F), sexe,
      dateNaissance: iso(2010, 3 + i, 10 + i), lieuNaissance: 'Léogâne', nationalite: 'Haïtienne', adresse: pick(RUES), commune: 'Léogâne',
      classeId: classes[i + 6].id, anneeId: Y, regime: 'Externe', typeInscription: 'Nouvelle inscription', redoublant: false, boursier: false,
      dateInscription: iso(2025, 6, 2 + i), dateEntree: '2025-09-01', statut: 'En attente', tuteurIds: [pere.id],
      medical: {}, documents: [{ type: 'Acte de naissance', nom: 'acte.pdf', fourni: true }, { type: 'Dernier bulletin', nom: '', fourni: i % 2 === 0 }, { type: "Photo d'identité", nom: '', fourni: false }],
      langue: 'Français', updatedAt: 0,
    });
  }
  // Démonstration espace parent : la famille Dorval a aussi un enfant en moyenne section (préscolaire).
  const petit = students.find((x) => x.classeId === 'c-ms' && x.statut === 'Actif');
  if (petit) { petit.nom = 'Dorval'; petit.tuteurIds = [jeanDorval.id, marieDorval.id]; }
  db.bulkPut('guardians', guardians);
  db.bulkPut('students', students);
  // Comités de classe : élèves élus (pas de comité au préscolaire).
  const comiteRoles = ['Président', 'Vice-président', 'Secrétaire', 'Trésorier', 'Conseiller', 'Responsable discipline'];
  for (const c of classes) {
    if (c.niveau === 'Préscolaire') continue;
    const pool = students.filter((x) => x.classeId === c.id && x.statut === 'Actif');
    const jp = pool.find((x) => x.id === 'e-jean-philippe');
    const picked = [...(jp ? [jp] : []), ...pool.filter((x) => x !== jp).sort(() => rnd() - 0.5)].slice(0, comiteRoles.length);
    c.comite = picked.map((x, i) => ({ eleveId: x.id, role: comiteRoles[i], depuis: '2024-10-07' }));
  }
  classes.forEach((c) => delete (c as Partial<ClassRoom & { _n: number }>)._n);
  // Secondaire : l'appel quotidien est fait par le censeur, pas par les professeurs.
  const censeur = staff.find((x) => x.poste.startsWith('Censeur'));
  classes.forEach((c) => { if (c.niveau === 'Secondaire') c.appelParId = censeur?.id; });
  db.bulkPut('classes', classes);

  // ---------- Évaluations & notes ----------
  const evals: Evaluation[] = [];
  const grades: Grade[] = [];
  const ability = new Map<string, number>();
  students.forEach((s) => ability.set(s.id, s.prenom === 'Jean Philippe' ? 15.6 : 12.4 + gauss() * 2.6));
  const subjOffset = new Map<string, number>();
  const evalDates = ['2024-10-24', '2025-01-18', '2025-03-12', '2025-05-07', '2025-06-06'];
  for (const co of courses) {
    const cls = classes.find((c) => c.id === co.classeId)!;
    const clsStudents = students.filter((s) => s.classeId === cls.id && s.statut === 'Actif');
    periods.forEach((p, pi) => {
      // Démo : les maths du 5e contrôle des classes de M. Robert restent à saisir.
      const pending = p.id === 'p5' && co.professeurId === robert.id;
      const statut: Evaluation['statut'] = p.verrouillee ? 'Clôturé' : pending ? 'En cours' : p.id === 'p5' ? 'En cours' : 'Clôturé';
      const ev: Evaluation = { id: `ev-${co.id}-${p.id}`, coursId: co.id, classeId: co.classeId, matiereId: co.matiereId, periodeId: p.id, titre: p.libelle, date: evalDates[pi], noteMax: 20, statut, updatedAt: 0 };
      evals.push(ev);
      if (pending) return;
      for (const s of clsStudents) {
        const key = s.id + co.matiereId;
        if (!subjOffset.has(key)) subjOffset.set(key, gauss() * 1.4);
        let n = ability.get(s.id)! + subjOffset.get(key)! + pi * 0.25 + gauss() * 1.1;
        if (co.matiereId === 'eps' || co.matiereId === 'art') n += 1.6;
        if (co.matiereId === 'ma') n -= 1.2;
        n = Math.max(3, Math.min(19.5, Math.round(n * 2) / 2));
        // Préscolaire : la note n'est que le support du niveau (A = 18, EC = 12, NA = 6).
        if (cls.niveau === 'Préscolaire') n = n >= 13 ? 18 : n >= 9 ? 12 : 6;
        const absent = rnd() < 0.006;
        grades.push({ id: `gr-${ev.id}-${s.id}`, evaluationId: ev.id, eleveId: s.id, note: absent ? null : n, absent, updatedAt: 0 });
      }
    });
  }
  db.bulkPut('evaluations', evals);
  db.bulkPut('grades', grades);

  db.put('reportEntries', {
    id: 're-e-jean-philippe-annuel', eleveId: 'e-jean-philippe', periodeId: 'annuel',
    appreciation: "Jean Philippe est un élève sérieux, travailleur et respectueux. Il a obtenu de très bons résultats tout au long de l'année. Il fait preuve de curiosité intellectuelle et d'un bon esprit d'équipe. Nous l'encourageons à poursuivre sur cette voie.",
    observations: "Continuer à fournir des efforts, particulièrement en mathématiques et en anglais, pour viser l'excellence l'année prochaine.",
    decision: 'Admis(e) en classe supérieure',
    comportement: { conduite: 'Très bonne', collaboration: 'Excellent', respect: 'Très bon', participation: 'Active' },
  });

  // ---------- Emploi du temps ----------
  const slots: TimetableSlot[] = [];
  const HOURS: [string, string][] = [['07:00', '07:50'], ['08:00', '08:50'], ['09:00', '09:50'], ['10:00', '10:50'], ['11:00', '11:50'], ['13:00', '13:50'], ['14:00', '14:50'], ['15:00', '15:50'], ['16:00', '16:50']];
  const S4A_GRID: (string | [string, string, string?])[][] = [
    // lundi .. vendredi pour chaque heure ; string = matière ; tuple = [libellé, salle, profId?]
    ['fr', 'ma', 'an', 'svt', 'fr'],
    ['ma', 'fr', 'hg', 'ma', 'an'],
    ['an', 'svt', 'ma', 'fr', 'ec'],
    ['hg', 'an', 'fr', 'an', 'svt'],
    ['svt', 'ec', 'inf', 'hg', 'ma'],
    ['eps', 'opt', 'eps', 'opt', ['Orientation', 'S4-A', 'st']],
    ['art', 'cr', 'art', 'cr', 'art'],
    [['Étude dirigée', 'S4-A'], ['Étude dirigée', 'S4-A'], ['Projet / Atelier', 'S4-A'], ['Étude dirigée', 'S4-A'], ['Étude dirigée', 'S4-A']],
    [['Club de lecture', 'CDI'], ['Activités parascolaires', 'Divers'], ['Club scientifique', 'Lab 1'], ['Vie de classe', 'S4-A'], ['Activités parascolaires', 'Divers']],
  ];
  const special: Record<string, string> = { eps: 'Terrain', inf: 'Lab 1', opt: 'Lab 2', art: 'A1', cr: 'A2' };
  // Occupation des professeurs (jour|heure) pour générer un emploi du temps sans conflit
  const busy = new Set<string>();
  const ordered = [...classes].sort((a, b) => (a.code === 'S4-A' ? -1 : b.code === 'S4-A' ? 1 : 0));
  for (const c of ordered) {
    const cc = courses.filter((x) => x.classeId === c.id);
    const left = new Map(cc.map((x) => [x.id, x.heuresSemaine]));
    HOURS.forEach(([debut, fin], hi) => {
      for (let d = 0; d < 5; d++) {
        const base = { id: `tt-${c.id}-${d}-${hi}`, classeId: c.id, jour: (d + 1) as TimetableSlot['jour'], debut, fin, updatedAt: 0 };
        const key = (pid?: string) => `${pid}|${d}|${hi}`;
        let cell: string | [string, string, string?];
        if (c.code === 'S4-A') cell = S4A_GRID[hi][d];
        else if (hi < 7) {
          const start = (hi * 5 + d + c.code.length * 3) % cc.length;
          const pickC = [...cc.slice(start), ...cc.slice(0, start)].find((x) => (left.get(x.id) ?? 0) > 0 && !busy.has(key(x.professeurId)));
          if (pickC) { left.set(pickC.id, left.get(pickC.id)! - 1); cell = pickC.matiereId; } else cell = ['Étude dirigée', c.code];
        } else cell = hi === 7 ? ['Étude dirigée', c.code] : ['Activités parascolaires', 'Divers'];
        if (typeof cell === 'string') {
          const co = cc.find((x) => x.matiereId === cell);
          if (co?.professeurId) busy.add(key(co.professeurId));
          slots.push({ ...base, matiereId: cell, professeurId: co?.professeurId, salle: c.code === 'S4-A' ? special[cell] ?? c.code : cell === 'eps' ? 'Terrain' : c.code });
        } else slots.push({ ...base, libelle: cell[0], salle: cell[1], professeurId: cell[2] ? staff.find((s) => s.poste === 'Conseiller scolaire')?.id : undefined });
      }
    });
  }
  db.bulkPut('timetable', slots);

  // ---------- Finance ----------
  const payments: Payment[] = [];
  let rseq = 0;
  const actifs = students.filter((s) => s.statut === 'Actif');
  const MOIS = [[2024, 9], [2024, 10], [2024, 11], [2024, 12], [2025, 1], [2025, 2], [2025, 3], [2025, 4], [2025, 5], [2025, 6]];
  for (const s of actifs) {
    const c = classes.find((x) => x.id === s.classeId)!;
    const tranche = c.fraisScolarite / 3;
    payments.push({ id: `pay${pad(++rseq, 5)}`, recu: `REC-2024-${pad(rseq)}`, eleveId: s.id, classeId: c.id, date: iso(2024, 8, 10 + Math.floor(rnd() * 20)), montant: c.fraisInscription, mode: pick(['MonCash', 'Espèces', 'Espèces', 'Virement']), motif: 'Inscription', statut: 'Payé', updatedAt: 0 });
    const r = rnd();
    const nb = s.boursier ? 3 : r < 0.62 ? 3 : r < 0.86 ? 2 : r < 0.97 ? 1 : 0;
    const due = [[2024, 10], [2025, 1], [2025, 4]];
    for (let t = 0; t < nb; t++) {
      const [yy, mm] = due[t];
      const amount = s.boursier ? tranche / 2 : tranche;
      payments.push({ id: `pay${pad(++rseq, 5)}`, recu: `REC-${yy}-${pad(rseq)}`, eleveId: s.id, classeId: c.id, date: iso(yy, mm, 1 + Math.floor(rnd() * 27)), montant: Math.round(amount), mode: pick(['MonCash', 'MonCash', 'Espèces', 'NatCash', 'Virement']), motif: 'Scolarité', versement: ['1er versement', '2e versement', '3e versement'][t], statut: 'Payé', reference: rnd() < 0.5 ? `MC${Math.floor(rnd() * 1e8)}` : undefined, updatedAt: 0 });
    }
    if (rnd() < 0.3) payments.push({ id: `pay${pad(++rseq, 5)}`, recu: `REC-2024-${pad(rseq)}`, eleveId: s.id, classeId: c.id, date: iso(2024, 9, 5 + Math.floor(rnd() * 20)), montant: 3500, mode: 'Espèces', motif: 'Uniforme', statut: 'Payé', updatedAt: 0 });
  }
  // quelques paiements en attente (MonCash à confirmer)
  actifs.slice(0, 3).forEach((s, i) => payments.push({ id: `pay${pad(++rseq, 5)}`, recu: `REC-2025-${pad(rseq)}`, eleveId: s.id, classeId: s.classeId, date: iso(2025, 6, 10 + i), montant: 30000, mode: 'MonCash', motif: 'Scolarité', versement: 'Complément', statut: 'En attente', reference: `MC${81000000 + i}`, updatedAt: 0 }));
  db.bulkPut('payments', payments);

  const salaries: Salary[] = [];
  for (const st of staff) {
    MOIS.forEach(([yy, mm], i) => {
      const last = i === MOIS.length - 1;
      salaries.push({ id: `sal-${st.id}-${yy}${pad(mm, 2)}`, staffId: st.id, periode: `${yy}-${pad(mm, 2)}`, montant: st.salaire, primes: mm === 12 ? Math.round(st.salaire * 0.5) : 0, retenues: Math.round(st.salaire * 0.02), statut: last && rnd() < 0.35 ? 'En attente' : 'Payé', datePaiement: last ? undefined : iso(yy, mm, 28), mode: st.modePaiement, updatedAt: 0 });
    });
  }
  db.bulkPut('salaries', salaries);

  db.bulkPut('projects', [
    { id: 'pr1', nom: 'Rénovation des salles', budget: 2000000, depense: 1200000, statut: 'En cours', debut: '2024-11-01', description: 'Peinture, toitures et bancs des salles du secondaire.' },
    { id: 'pr2', nom: 'Aire de jeux', budget: 1500000, depense: 300000, statut: 'Planifié', debut: '2025-03-01' },
    { id: 'pr3', nom: 'Laboratoire informatique', budget: 3000000, depense: 1800000, statut: 'En cours', debut: '2024-10-01', description: '20 ordinateurs, panneaux solaires et onduleurs.' },
    { id: 'pr4', nom: 'Bibliothèque', budget: 800000, depense: 200000, statut: 'Planifié', debut: '2025-05-01' },
  ]);
  const expenses: Expense[] = [];
  const CATS: [Expense['categorie'], string[], number][] = [
    ['Fonctionnement', ['Électricité EDH', 'Carburant génératrice', 'Internet', 'Eau traitée', 'Fournitures de bureau'], 60000],
    ['Infrastructures', ['Réparation toiture', 'Plomberie', 'Peinture'], 120000],
    ['Matériel pédagogique', ['Craies et marqueurs', 'Manuels scolaires', 'Matériel de laboratoire'], 80000],
    ['Autres', ['Transport', 'Réception parents', 'Frais bancaires'], 30000],
  ];
  MOIS.forEach(([yy, mm]) => {
    CATS.forEach(([cat, libs, base]) => {
      const n = cat === 'Fonctionnement' ? 3 : 1;
      for (let k = 0; k < n; k++) expenses.push({ id: `ex-${yy}${mm}-${cat.slice(0, 3)}${k}`, date: iso(yy, mm, 3 + k * 8), categorie: cat, libelle: pick(libs), montant: Math.round((base * (0.6 + rnd() * 0.8)) / 500) * 500, mode: pick(['Espèces', 'Chèque', 'Virement']), statut: 'Payé', updatedAt: 0 });
    });
    expenses.push({ id: `ex-${yy}${mm}-proj`, date: iso(yy, mm, 15), categorie: 'Projets', libelle: 'Laboratoire informatique', montant: 150000, mode: 'Virement', projetId: 'pr3', statut: 'Payé', updatedAt: 0 });
  });
  db.bulkPut('expenses', expenses);

  // ---------- Présences (20 derniers jours ouvrables) ----------
  const att: Attendance[] = [];
  const today = new Date();
  const days: string[] = [];
  for (let d = new Date(today); days.length < 20; d.setDate(d.getDate() - 1)) {
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    days.push(d.toISOString().slice(0, 10));
  }
  for (const day of days.slice(1)) {
    for (const s of actifs) {
      const r = rnd();
      const statut: Attendance['statut'] = r < 0.93 ? 'Présent' : r < 0.96 ? 'Retard' : r < 0.985 ? 'Absent' : 'Excusé';
      if (statut === 'Présent') continue; // seules les exceptions sont stockées ; absence de fiche = présent si l'appel est fait
      att.push({ id: `at-${day}-${s.id}`, date: day, classeId: s.classeId, eleveId: s.id, statut, updatedAt: 0 });
    }
  }
  db.bulkPut('attendance', att);
  // marqueurs "appel fait" : un document par classe et par jour (eleveId vide)
  db.bulkPut('attendance', days.slice(1).flatMap((day) => classes.map((c) => ({ id: `at-${day}-${c.id}-done`, date: day, classeId: c.id, eleveId: '', statut: 'Présent' as const }))));

  // ---------- Communication / événements ----------
  db.bulkPut('events', [
    { id: 'evt1', titre: 'Réunion des parents — Secondaire', date: '2025-06-14', heure: '10:00', lieu: 'Grande salle', type: 'Réunion', description: 'Remise des bulletins du 4e contrôle.' },
    { id: 'evt2', titre: '5e contrôle — début des épreuves', date: '2025-06-02', type: 'Examen' },
    { id: 'evt3', titre: 'Fête du Drapeau', date: '2025-05-18', type: 'Fête', description: 'Défilé et activités culturelles.' },
    { id: 'evt4', titre: 'Examens officiels 9e AF (MENFP)', date: '2025-06-23', type: 'Examen' },
    { id: 'evt5', titre: 'Conseil de classe de fin d’année', date: '2025-06-25', heure: '09:00', type: 'Réunion' },
    { id: 'evt6', titre: 'Vacances d’été', date: '2025-07-01', type: 'Congé' },
  ]);
  db.bulkPut('messages', [
    { id: 'msg1', date: Date.parse('2025-06-05T09:00:00'), canal: 'SMS', objet: 'Réunion des parents', contenu: 'Chers parents, la réunion du secondaire aura lieu le samedi 14 juin à 10h. Présence obligatoire. — Direction', cible: 'Tous les parents', destinataires: 356 },
    { id: 'msg2', date: Date.parse('2025-05-28T15:30:00'), canal: 'WhatsApp', objet: 'Rappel 3e versement', contenu: 'Rappel : le 3e versement de la scolarité est attendu avant le 30 mai. Paiement possible par MonCash.', cible: 'Tous les parents', destinataires: 284 },
    { id: 'msg3', date: Date.parse('2025-05-20T08:00:00'), canal: 'Annonce', objet: 'Calendrier du 5e contrôle', contenu: 'Le calendrier du 5e contrôle est disponible au secrétariat.', cible: 'Classe', classeId: 'c-s4-a', destinataires: 32 },
  ]);
  // ---------- Registre de discipline ----------
  const SURV = [staff.find((x) => x.poste === 'Censeur (Préfet de discipline)')!, ...Object.values(P).slice(0, 6)];
  const INC: [Incident['type'], Incident['gravite'], string, string?][] = [
    ['Retard', 'Légère', 'Arrivé après la prière du matin.', 'Avertissement oral'],
    ['Retard', 'Légère', 'Troisième retard de la semaine.', 'Retenue'],
    ['Bavardage', 'Légère', 'Bavardages répétés pendant le cours.', 'Avertissement oral'],
    ['Tenue non conforme', 'Légère', 'Uniforme incomplet (pas de cravate).', 'Avertissement oral'],
    ['Téléphone', 'Moyenne', 'Téléphone utilisé en classe, confisqué jusqu’à la fin de la journée.', 'Avertissement écrit'],
    ['Insolence', 'Moyenne', 'A répondu de manière irrespectueuse au professeur.', 'Convocation des parents'],
    ['Indiscipline', 'Moyenne', 'Refus de travailler et perturbation du cours.', 'Retenue'],
    ['Absence injustifiée', 'Moyenne', 'Absent sans justificatif toute la journée.', 'Convocation des parents'],
    ['Fraude', 'Grave', 'Copie pendant le contrôle de mathématiques.', 'Avertissement écrit'],
    ['Bagarre / violence', 'Grave', 'Bagarre dans la cour pendant la récréation.', 'Exclusion temporaire'],
    ['Dégradation', 'Moyenne', 'Table de classe abîmée volontairement.', 'Travail d’intérêt général'],
    ['Félicitations', undefined, 'Aide spontanée à un camarade en difficulté.'],
    ['Félicitations', undefined, 'Excellente tenue lors de la sortie scolaire.'],
  ];
  const incidents: Incident[] = [
    { id: 'inc1', eleveId: students.find((x) => x.prenom === 'Ricardo')!.id, date: '2025-04-11', type: 'Retard', gravite: 'Légère', description: 'Trois retards consécutifs.', sanction: 'Avertissement oral', statut: 'Clôturé', parentsPrevenus: true, updatedAt: 0 },
    { id: 'inc2', eleveId: 'e-jean-philippe', date: '2025-03-20', type: 'Félicitations', description: 'Premier prix au concours de lecture.', statut: 'Clôturé', updatedAt: 0 },
  ];
  const actifsSec = students.filter((x) => x.statut === 'Actif' && classes.find((c) => c.id === x.classeId)?.niveau !== 'Préscolaire');
  for (let i = 0; i < 46; i++) {
    const st = pick(actifsSec);
    const [type, gravite, description, sanction] = pick(INC);
    const month = pick([10, 11, 12, 1, 2, 3, 4, 5]);
    const date = iso(month >= 9 ? 2024 : 2025, month, 1 + Math.floor(rnd() * 27));
    const ouvert = date >= '2025-05-15' && type !== 'Félicitations' && rnd() < 0.7;
    incidents.push({
      id: `inc${i + 3}`, eleveId: st.id, classeId: st.classeId, date, type, gravite, description, sanction,
      joursExclusion: sanction === 'Exclusion temporaire' ? pick([1, 2, 3]) : undefined,
      parentsPrevenus: gravite !== 'Légère' && type !== 'Félicitations' ? rnd() < 0.8 : false,
      statut: ouvert ? 'Ouvert' : 'Clôturé', auteurId: pick(SURV).id, updatedAt: 0,
    });
  }
  incidents.forEach((x) => (x.classeId ??= students.find((s) => s.id === x.eleveId)?.classeId));
  db.bulkPut('incidents', incidents);

  // ---------- Cahier de textes (trois dernières semaines de cours) ----------
  const CHAPITRES: Record<string, string[]> = {
    fr: ['La dissertation : l’introduction', 'Étude d’un poème de Jacques Roumain', 'Le discours rapporté', 'Analyse de « Gouverneurs de la rosée »', 'Le résumé de texte'],
    cr: ['Pwovèb ak ekspresyon', 'Ekri yon lèt fòmèl', 'Konjigezon vèb yo', 'Lekti : yon kont tradisyonèl'],
    an: ['Present perfect vs simple past', 'Reading: Haiti’s history', 'Writing a formal email', 'Conditionals (type 2)'],
    ma: ['Fonctions du second degré', 'Équations et inéquations', 'Suites arithmétiques', 'Trigonométrie : cercle trigonométrique', 'Statistiques : moyenne et écart-type'],
    svt: ['La cellule et ses organites', 'La photosynthèse', 'Le système immunitaire', 'Les écosystèmes d’Haïti'],
    pc: ['Les forces et le mouvement', 'Les réactions chimiques', 'L’électricité : loi d’Ohm', 'Les solutions acides et basiques'],
    hg: ['La révolution haïtienne (1791-1804)', 'L’occupation américaine (1915-1934)', 'Le relief d’Haïti', 'Les départements et leurs ressources'],
    ec: ['Les droits de l’enfant', 'La Constitution haïtienne', 'Le civisme au quotidien'],
    inf: ['Tableur : formules de base', 'Traitement de texte : mise en page', 'Internet et sécurité'],
    art: ['Peinture naïve haïtienne', 'Chant choral', 'Dessin d’observation'],
    eps: ['Football : passes et contrôles', 'Athlétisme : course de vitesse', 'Volley-ball : service'],
    opt: ['Projet : jardin scolaire', 'Projet : journal de la classe'],
    'ps-lang': ['Les sons [a] et [o]', 'Comptine « Lapli tonbe »', 'Reconnaître son prénom'],
    'ps-math': ['Compter jusqu’à 10', 'Les formes : rond, carré, triangle', 'Grand, moyen, petit'],
    'ps-monde': ['Les parties du corps', 'Les fruits d’Haïti', 'Le jour et la nuit'],
    'ps-mot': ['Découper en suivant une ligne', 'Parcours d’équilibre'],
    'ps-art': ['Peinture avec les doigts', 'Chant : « Ayiti cheri »'],
    'ps-vivre': ['Attendre son tour', 'Ranger la classe ensemble'],
  };
  const lessons: Lesson[] = [];
  const weekDays: string[] = [];
  for (let d = new Date('2025-05-19T12:00:00'); d <= new Date('2025-06-06T12:00:00'); d.setDate(d.getDate() + 1)) if (d.getDay() >= 1 && d.getDay() <= 5) weekDays.push(d.toISOString().slice(0, 10));
  for (const sl of slots) {
    if (!sl.matiereId) continue;
    const co = courses.find((c) => c.classeId === sl.classeId && c.matiereId === sl.matiereId);
    if (!co) continue;
    const days = weekDays.filter((d) => new Date(d + 'T12:00:00').getDay() === sl.jour);
    days.forEach((date, wi) => {
      if (co.professeurId === robert.id && date >= '2025-06-02' && rnd() < 0.6) return; // quelques séances non remplies
      if (rnd() < 0.12) return;
      const ch = CHAPITRES[sl.matiereId!] ?? ['Révision'];
      const titre = ch[(wi + sl.jour) % ch.length];
      const devoir = rnd() < 0.45;
      lessons.push({
        id: `les-${sl.id}-${date}`, coursId: co.id, classeId: co.classeId, matiereId: co.matiereId, professeurId: co.professeurId, date, heure: sl.debut, titre,
        contenu: pick(['Cours magistral et prise de notes.', 'Exercices d’application en groupe.', 'Correction des exercices et synthèse.', 'Lecture et explication, questions orales.', 'Travaux pratiques.']),
        devoirs: devoir ? pick(['Exercices 3 à 6 page 42.', 'Apprendre la leçon pour une interrogation.', 'Rédiger un paragraphe de 15 lignes.', 'Préparer l’exposé en groupe.', 'Réviser pour le 5e contrôle.']) : undefined,
        pourLe: devoir ? weekDays[Math.min(weekDays.length - 1, weekDays.indexOf(date) + 2)] : undefined,
        updatedAt: 0,
      });
    });
  }
  db.bulkPut('lessons', lessons);

  // ---------- Préscolaire : deux maîtresses co-titulaires par classe ----------
  const firstNew = staff.length;
  const cotit = [
    addStaff({ nom: 'Lafortune', prenom: 'Nadège', sexe: 'F', type: 'Professeur', poste: 'Maîtresse', specialite: 'Préscolaire', diplome: 'Brevet de jardinière d’enfants', salaire: 25000 }),
    addStaff({ nom: 'Célestin', prenom: 'Fabienne', sexe: 'F', type: 'Professeur', poste: 'Maîtresse', specialite: 'Préscolaire', diplome: 'Brevet de jardinière d’enfants', salaire: 25000 }),
    addStaff({ nom: 'Augustin', prenom: 'Myrlande', sexe: 'F', type: 'Professeur', poste: 'Maîtresse', specialite: 'Préscolaire', diplome: 'Diplôme ENI (préscolaire)', salaire: 25500 }),
  ];
  db.bulkPut('staff', staff.slice(firstNew));
  ['ps', 'ms', 'gs'].forEach((code, i) => db.patch('classes', `c-${code}`, { cotitulaireIds: [cotit[i].id] }));

  // ---------- Rôles & utilisateurs ----------
  const roles: Role[] = [
    { id: 'r-dir', nom: 'Directeur', description: 'Accès complet à toute l’application.', systeme: true, espace: 'admin', permissions: perms('write'), updatedAt: 0 },
    { id: 'r-adj', nom: 'Directeur adjoint', description: 'Gestion pédagogique et administrative, sans paramètres ni utilisateurs.', espace: 'admin', permissions: perms('write', { parametres: 'read', utilisateurs: 'none', finance: 'read' }), updatedAt: 0 },
    { id: 'r-sec', nom: 'Secrétaire', description: 'Inscriptions, élèves, parents, documents.', espace: 'admin', permissions: perms('none', { dashboard: 'read', eleves: 'write', inscriptions: 'write', parents: 'write', classes: 'read', documents: 'write', communication: 'write', presences: 'read', emploi: 'read', personnel: 'read', discipline: 'read', cahier: 'read' }), updatedAt: 0 },
    { id: 'r-cpt', nom: 'Comptable', description: 'Finance, paiements, salaires et rapports financiers.', espace: 'admin', permissions: perms('none', { dashboard: 'read', finance: 'write', eleves: 'read', parents: 'read', personnel: 'read', rapports: 'read' }), updatedAt: 0 },
    { id: 'r-cen', nom: 'Censeur', description: 'Présences, discipline et consultation des notes.', espace: 'admin', permissions: perms('none', { dashboard: 'read', eleves: 'read', presences: 'write', discipline: 'write', cahier: 'read', notes: 'read', classes: 'read', emploi: 'read', parents: 'read', communication: 'write' }), updatedAt: 0 },
    { id: 'r-prof', nom: 'Professeur', description: 'Espace professeur : ses classes, saisie des notes, appel, palmarès.', systeme: true, espace: 'professeur', permissions: perms('none'), updatedAt: 0 },
    { id: 'r-par', nom: 'Parent', description: 'Espace parent : notes validées, absences, discipline, devoirs et paiements de ses enfants uniquement.', systeme: true, espace: 'parent', permissions: perms('none'), updatedAt: 0 },
  ];
  db.bulkPut('roles', roles);
  const byPoste = (p: string) => staff.find((s) => s.poste === p)!;
  const users: Omit<User, 'updatedAt'>[] = [
    { id: 'u-dir', nom: 'M. Léomide S. Cherismé', email: 'direction@solonart.edu', roleId: 'r-dir', staffId: dir.id, pin: '1234', actif: true, photo: 'avatars/dir.jpg' },
    { id: 'u-adj', nom: 'Mme Nadia Pierre', email: adj.email, roleId: 'r-adj', staffId: adj.id, pin: '1234', actif: true },
    { id: 'u-sec', nom: 'M. Luc Joseph', email: byPoste('Secrétaire').email, roleId: 'r-sec', staffId: byPoste('Secrétaire').id, pin: '1234', actif: true },
    { id: 'u-cpt', nom: 'M. Michel Saintil', email: byPoste('Comptable').email, roleId: 'r-cpt', staffId: byPoste('Comptable').id, pin: '1234', actif: true },
    { id: 'u-cen', nom: 'M. Joël Méus', email: byPoste('Censeur (Préfet de discipline)').email, roleId: 'r-cen', staffId: byPoste('Censeur (Préfet de discipline)').id, pin: '1234', actif: true },
    ...staff.filter((s) => s.type === 'Professeur').map((s) => ({
      id: s.id === robert.id ? 'u-prof' : `u-${s.id}`, nom: `${s.sexe === 'F' ? 'Mme' : 'M.'} ${s.prenom} ${s.nom}`, email: s.email, roleId: 'r-prof', staffId: s.id, pin: '1234', actif: true, photo: s.photo,
    })),
    // Espace parent (démonstration) : connexion avec le numéro de téléphone et le code 1234
    ...[jeanDorval, marieDorval].map((g) => ({ id: `u-par-${g.id}`, nom: `${g.sexe === 'F' ? 'Mme' : 'M.'} ${g.prenom} ${g.nom}`, email: g.email ?? '', telephone: g.telephone, roleId: 'r-par', guardianId: g.id, pin: '1234', actif: true, photo: g.photo })),
  ];
  db.bulkPut('users', users as User[]);

  // ---------- Messagerie (démonstration) ----------
  const now = Date.now();
  const H = 3600000;
  const naomi = students.find((x) => x.nom === 'Dorval' && x.prenom === 'Naomi');
  const chat: Omit<ChatMessage, 'updatedAt'>[] = [
    { id: 'chat-d1', eleveId: 'e-jean-philippe', canal: 'ecole', auteur: 'systeme', type: 'felicitations', texte: 'Félicitations : Premier prix au concours de lecture.', date: now - 72 * H, lu: { ecole: true, prof: true, parent: true } },
    ...(naomi ? [
      { id: 'chat-d2', eleveId: naomi.id, canal: 'ecole' as const, auteur: 'systeme' as const, type: 'absence' as const, texte: 'Absence : Naomi n’était pas en classe hier. Merci de prévenir l’école du motif.', date: now - 26 * H, lu: { ecole: true, prof: true, parent: true } },
      { id: 'chat-d3', eleveId: naomi.id, canal: 'ecole' as const, auteur: 'parent' as const, auteurId: `u-par-${jeanDorval.id}`, type: 'message' as const, texte: 'Bonjour, Naomi avait de la fièvre. Elle revient demain avec un certificat médical. Merci.', date: now - 25 * H, lu: { parent: true } },
    ] : []),
    ...(petit ? [
      { id: 'chat-d4', eleveId: petit.id, canal: 'professeur' as const, staffId: maitresses.MS.id, auteur: 'professeur' as const, auteurId: `u-${maitresses.MS.id}`, type: 'message' as const, texte: `Bonjour M. Dorval, ${petit.prenom} a très bien participé à l’atelier de peinture aujourd’hui. Pensez à apporter une blouse pour vendredi.`, date: now - 5 * H, lu: { prof: true } },
    ] : []),
  ];
  db.bulkPut('chat', chat as ChatMessage[]);
}
