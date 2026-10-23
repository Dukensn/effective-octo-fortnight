// Modèle de données de l'application.
// Chaque collection correspond 1:1 à une collection Firestore (voir src/data/sync.ts).

export type ID = string;

export interface Meta {
  id: ID;
  updatedAt: number; // horodatage ms, utilisé pour la synchronisation (last-write-wins)
  deleted?: boolean; // suppression logique (synchronisable)
}

export type Sexe = 'M' | 'F';

export interface School extends Meta {
  nom: string;
  devise: string; // "Discipline • Excellence • Avenir"
  slogan: string; // "Apprendre aujourd'hui, construire demain."
  adresse: string;
  commune: string;
  departement: string;
  telephone: string;
  email: string;
  siteWeb: string;
  logo?: string; // dataURL (ou URL Storage)
  signatureDirecteur?: string; // dataURL
  cachet?: string; // dataURL
  directeur: string;
  anneeCourante: ID;
  monnaie: string; // "G"
  bareme: 20 | 100; // note maximale par défaut
  seuilReussite: number; // ex. 10 (/20) ou 50 (/100)
  numeroMenfp?: string;
  /** Règles de l'école (valeurs par défaut dans lib/regles : schoolRules). */
  chargeMaxHeures?: number; // heures de cours par semaine au-delà desquelles un enseignant est signalé surchargé
  seuilRetards?: number; // nombre de retards sur 7 jours avant d'alerter le parent (1 = à chaque retard)
  alerteAbsence?: boolean; // prévenir le parent à chaque absence
  alerteConduite?: boolean; // prévenir le parent à chaque incident ou félicitation
  /** Taux horaire payé aux enseignants, par matière et par niveau (en gourdes). */
  tauxHoraires?: { matiereId: ID; niveau: Niveau; taux: number }[];
}

export interface SchoolYear extends Meta {
  libelle: string; // "2024 - 2025"
  debut: string; // ISO date
  fin: string;
  active: boolean;
}

/** Étape / période d'évaluation : 1er contrôle ... 5e contrôle, examen final */
export interface Period extends Meta {
  anneeId: ID;
  ordre: number;
  libelle: string; // "1er contrôle"
  court: string; // "C1"
  debut: string;
  fin: string;
  verrouillee: boolean; // verrouillage des notes par la direction
  type: 'controle' | 'examen';
}

export type Niveau = 'Préscolaire' | 'Fondamental' | 'Secondaire';

export interface ClassRoom extends Meta {
  anneeId: ID;
  code: string; // "S4-A"
  nom: string; // "Secondaire IV - S4-A"
  niveau: Niveau;
  annee: string; // "Secondaire IV", "6e année fondamentale"
  section?: string; // "A"
  filiere?: string; // "Sciences"
  salle: string;
  capacite: number;
  titulaireId?: ID; // staff id
  /** Organisation de l'équipe : maître unique, équipe qui se partage les matières, un professeur par matière,
   *  ou co-titulaires à égalité sur tout. Sans valeur : déduite du niveau et des affectations (voir lib/regles). */
  organisation?: 'unique' | 'equipe' | 'matiere' | 'cotitulaires';
  /** Autres membres de l'équipe (mode « équipe ») ou co-titulaires (mode « co-titulaires »). */
  cotitulaireIds?: ID[];
  /** Secondaire : membre du personnel chargé de l'appel quotidien (les professeurs ne font pas l'appel). */
  appelParId?: ID;
  fraisScolarite: number; // montant annuel
  fraisInscription: number;
  comite?: ComiteMember[]; // comité de classe (élèves)
  /** Responsable de la classe. Au secondaire : toujours un élève (le président par défaut).
   *  Au fondamental et au préscolaire : un professeur (le titulaire par défaut) ou un élève. */
  responsable?: { type: 'eleve' | 'professeur'; id: ID };
}

export interface ComiteMember { eleveId: ID; role: string; depuis?: string }
/** Rôles proposés, dans l'ordre d'affichage. Les quatre premiers n'ont qu'un titulaire par classe. */
export const COMITE_ROLES = ['Président', 'Vice-président', 'Secrétaire', 'Trésorier', 'Conseiller', 'Responsable discipline', 'Responsable propreté', 'Responsable sport et culture'];
export const ROLES_UNIQUES = COMITE_ROLES.slice(0, 4);

export interface Subject extends Meta {
  nom: string;
  court: string;
  couleur: string; // couleur dans l'emploi du temps
  groupe?: string;
}

/** Affectation : une matière enseignée dans une classe par un professeur, avec coefficient. */
export interface Course extends Meta {
  classeId: ID;
  matiereId: ID;
  professeurId?: ID;
  coefficient: number;
  heuresSemaine: number;
}

export interface Guardian extends Meta {
  nom: string;
  prenom: string;
  sexe: Sexe;
  lien: 'Père' | 'Mère' | 'Tuteur' | 'Tutrice' | 'Grand-père' | 'Grand-mère' | 'Oncle' | 'Tante' | 'Frère' | 'Sœur' | 'Autre';
  telephone: string;
  whatsapp?: string;
  email?: string;
  profession?: string;
  adresse?: string;
  dateNaissance?: string;
  nationalite?: string;
  photo?: string;
  principal: boolean; // reçoit toutes les communications
  statut: 'Actif' | 'Inactif';
  notes?: string;
}

export interface Student extends Meta {
  matricule: string;
  nom: string;
  prenom: string;
  sexe: Sexe;
  dateNaissance: string;
  lieuNaissance: string;
  nationalite: string;
  religion?: string;
  numeroActe?: string; // numéro d'acte de naissance
  nin?: string;
  photo?: string;
  adresse: string;
  commune: string;
  telephone?: string;
  email?: string;
  classeId: ID;
  anneeId: ID;
  regime: 'Externe' | 'Demi-pensionnaire' | 'Interne';
  typeInscription: 'Nouvelle inscription' | 'Réinscription' | 'Transfert';
  redoublant: boolean;
  boursier: boolean;
  tauxBourse?: number; // % de réduction
  ecoleProvenance?: string;
  dateInscription: string;
  dateEntree: string;
  statut: 'Actif' | 'En attente' | 'Suspendu' | 'Transféré' | 'Archivé';
  tuteurIds: ID[];
  contactUrgence?: { nom: string; telephone: string; lien: string };
  medical: {
    groupeSanguin?: string;
    allergies?: string;
    problemes?: string;
    assurance?: string;
    medecin?: string;
  };
  documents: { type: string; nom: string; fourni: boolean; fichier?: string }[];
  langue: string;
  notesParticulieres?: string;
}

export type StaffType = 'Professeur' | 'Direction' | 'Administration' | 'Soutien';

export interface Staff extends Meta {
  matricule: string; // "EMP001"
  nom: string;
  prenom: string;
  sexe: Sexe;
  type: StaffType;
  poste: string; // "Professeur", "Directrice adjointe", "Secrétaire", "Bibliothécaire"...
  specialite?: string; // "Mathématiques"
  diplome?: string; // "Licence en Histoire"
  dateNaissance?: string;
  telephone: string;
  email: string;
  adresse: string;
  photo?: string;
  dateEmbauche: string;
  salaire: number;
  modePaiement: 'MonCash' | 'NatCash' | 'Espèces' | 'Virement' | 'Chèque';
  nif?: string;
  statut: 'Actif' | 'Congé' | 'Inactif' | 'Archivé';
  /** Professeurs du secondaire : autres établissements où ils enseignent (pour leur emploi du temps complet). */
  autresEcoles?: OtherSchool[];
  typeContrat?: 'Temps plein' | 'Temps partiel' | 'Vacataire';
}

export interface OtherSchool { id: ID; nom: string; commune?: string; actif: boolean }

/** Cours donné par un professeur dans un autre établissement (son agenda personnel ; non géré par l'école). */
export interface ExternalSlot extends Meta {
  staffId: ID;
  ecoleId: ID; // OtherSchool.id
  jour: 1 | 2 | 3 | 4 | 5 | 6;
  debut: string;
  fin: string;
  matiere: string;
  classe: string;
  salle?: string;
  eleves?: number;
}

/** Un contrôle ou examen pour un cours (classe + matière) dans une période. */
export interface Evaluation extends Meta {
  coursId: ID;
  classeId: ID;
  matiereId: ID;
  periodeId: ID;
  titre: string; // "2e contrôle"
  date: string;
  noteMax: number; // 20 ou 100
  statut: 'À venir' | 'En cours' | 'Clôturé';
  saisiePar?: ID; // userId
  saisieLe?: number;
}

export interface Grade extends Meta {
  evaluationId: ID;
  eleveId: ID;
  note: number | null; // null = absent / non saisi
  absent?: boolean;
  commentaire?: string;
}

/** Appréciations, comportement et décision par élève et par période (ou annuelle). */
export interface ReportCardEntry extends Meta {
  eleveId: ID;
  periodeId: ID | 'annuel';
  appreciation: string;
  observations?: string;
  decision?: string; // "Admis(e) en classe supérieure"...
  comportement: {
    conduite: string;
    collaboration: string;
    respect: string;
    participation: string;
  };
}

export interface Attendance extends Meta {
  date: string; // YYYY-MM-DD
  classeId: ID;
  eleveId: ID;
  statut: 'Présent' | 'Absent' | 'Retard' | 'Excusé';
  motif?: string;
  saisiePar?: ID;
}

export interface StaffAttendance extends Meta {
  date: string;
  staffId: ID;
  arrivee?: string; // "07:12"
  depart?: string;
  statut: 'Présent' | 'Absent' | 'Retard' | 'Congé';
}

export interface TimetableSlot extends Meta {
  classeId: ID;
  jour: 1 | 2 | 3 | 4 | 5 | 6; // lundi=1
  debut: string; // "07:00"
  fin: string; // "07:50"
  matiereId?: ID;
  libelle?: string; // pour activités sans matière (Étude dirigée...)
  professeurId?: ID;
  salle: string;
}

export type PaymentMode = 'MonCash' | 'NatCash' | 'Espèces' | 'Virement' | 'Chèque';

export interface Payment extends Meta {
  recu: string; // "REC-2025-0001"
  eleveId: ID;
  classeId: ID;
  date: string;
  montant: number;
  mode: PaymentMode;
  motif: 'Inscription' | 'Scolarité' | 'Uniforme' | 'Livres' | 'Examen officiel' | 'Autre';
  versement?: string; // "1er versement"
  reference?: string; // n° transaction MonCash
  statut: 'Payé' | 'En attente' | 'Annulé';
  recuPar?: ID;
}

export interface Expense extends Meta {
  date: string;
  categorie: 'Salaires' | 'Fonctionnement' | 'Infrastructures' | 'Matériel pédagogique' | 'Projets' | 'Autres';
  libelle: string;
  montant: number;
  mode: PaymentMode;
  fournisseur?: string;
  projetId?: ID;
  statut: 'Payé' | 'En attente';
}

export interface Salary extends Meta {
  staffId: ID;
  periode: string; // "2025-04"
  montant: number;
  primes: number;
  retenues: number;
  statut: 'Payé' | 'En attente';
  datePaiement?: string;
  mode: PaymentMode;
}

export interface Project extends Meta {
  nom: string;
  budget: number;
  depense: number;
  statut: 'Planifié' | 'En cours' | 'Terminé';
  debut: string;
  fin?: string;
  description?: string;
}

export interface Message extends Meta {
  date: number;
  canal: 'SMS' | 'WhatsApp' | 'Email' | 'Annonce';
  objet: string;
  contenu: string;
  cible: 'Tous les parents' | 'Classe' | 'Parent' | 'Personnel';
  classeId?: ID;
  destinataires: number;
  auteurId?: ID;
  /** Relance de paiement : élève concerné et solde au moment de l'envoi. */
  relance?: { eleveId: ID; tuteurId?: ID; reste: number };
}

export interface SchoolEvent extends Meta {
  titre: string;
  date: string;
  heure?: string;
  lieu?: string;
  type: 'Réunion' | 'Examen' | 'Congé' | 'Activité' | 'Fête';
  description?: string;
}

export const INCIDENT_TYPES = ['Retard', 'Indiscipline', 'Absence injustifiée', 'Tenue non conforme', 'Bavardage', 'Insolence', 'Bagarre / violence', 'Fraude', 'Dégradation', 'Téléphone', 'Félicitations', 'Autre'] as const;
export const SANCTIONS = ['Avertissement oral', 'Avertissement écrit', 'Retenue', 'Travail d’intérêt général', 'Convocation des parents', 'Exclusion temporaire', 'Conseil de discipline'] as const;
export interface Incident extends Meta {
  eleveId: ID;
  classeId?: ID;
  date: string;
  type: (typeof INCIDENT_TYPES)[number];
  gravite?: 'Légère' | 'Moyenne' | 'Grave';
  description: string;
  sanction?: string;
  joursExclusion?: number;
  parentsPrevenus?: boolean;
  statut?: 'Ouvert' | 'Clôturé';
  auteurId?: ID; // membre du personnel qui a signalé
}

/** Une séance du cahier de textes : ce qui a été fait en classe et les devoirs donnés. */
export interface Lesson extends Meta {
  coursId: ID;
  classeId: ID;
  matiereId: ID;
  professeurId?: ID;
  date: string;
  heure?: string; // "08:00"
  titre: string; // chapitre / leçon
  contenu: string; // ce qui a été fait
  devoirs?: string;
  pourLe?: string; // date de remise des devoirs
}

/** Messagerie : un fil par élève avec l'école (administration) ou avec un professeur (préscolaire / fondamental). */
export interface ChatMessage extends Meta {
  eleveId: ID;
  canal: 'ecole' | 'professeur';
  staffId?: ID; // professeur du fil (canal « professeur »)
  auteur: 'parent' | 'ecole' | 'professeur' | 'systeme';
  auteurId?: ID; // utilisateur
  texte: string;
  type?: 'message' | 'absence' | 'retard' | 'conduite' | 'felicitations';
  date: number;
  lu: { parent?: boolean; ecole?: boolean; prof?: boolean };
}

/** Remplacement d'un enseignant absent pour une journée : le remplaçant fait l'appel et prend ses classes. */
export interface Replacement extends Meta {
  date: string;
  absentId: ID; // staff
  remplacantId?: ID; // staff ; vide = pas encore de remplaçant (classe en étude, cours reporté…)
  classeIds: ID[];
  note?: string;
  parId?: ID; // utilisateur qui l'a organisé
}

export type ModuleKey =
  | 'dashboard' | 'eleves' | 'inscriptions' | 'classes' | 'parents' | 'personnel'
  | 'emploi' | 'notes' | 'presences' | 'discipline' | 'cahier' | 'finance' | 'documents' | 'communication'
  | 'rapports' | 'parametres' | 'utilisateurs';

export type Access = 'none' | 'read' | 'write';

export interface Role extends Meta {
  nom: string;
  description: string;
  systeme?: boolean; // non supprimable
  espace: 'admin' | 'professeur' | 'parent';
  permissions: Partial<Record<ModuleKey, Access>>;
}

export interface User extends Meta {
  nom: string;
  email: string;
  telephone?: string;
  roleId: ID;
  staffId?: ID; // lien vers la fiche personnel (pour les professeurs)
  guardianId?: ID; // lien vers la fiche parent (espace parent)
  pin: string; // code de connexion local (remplacé par Firebase Auth en production)
  actif: boolean;
  dernierAcces?: number;
  photo?: string;
}

/** Une valeur modifiée, gardée telle qu'elle était avant et après. */
export interface AuditChange { libelle: string; avant: string; apres: string }

/** Journal des modifications : on n'y ajoute que des lignes, on ne les modifie ni ne les supprime. */
export interface AuditLog extends Meta {
  date: number;
  userId?: ID;
  action: string;
  detail: string;
  domaine?: 'notes' | 'finance' | 'eleves' | 'discipline' | 'acces' | 'autre';
  motif?: string;
  changements?: AuditChange[];
}

export interface Collections {
  school: School;
  years: SchoolYear;
  periods: Period;
  classes: ClassRoom;
  subjects: Subject;
  courses: Course;
  guardians: Guardian;
  students: Student;
  staff: Staff;
  evaluations: Evaluation;
  grades: Grade;
  reportEntries: ReportCardEntry;
  attendance: Attendance;
  staffAttendance: StaffAttendance;
  timetable: TimetableSlot;
  payments: Payment;
  expenses: Expense;
  salaries: Salary;
  projects: Project;
  messages: Message;
  events: SchoolEvent;
  incidents: Incident;
  lessons: Lesson;
  chat: ChatMessage;
  remplacements: Replacement;
  agenda: ExternalSlot;
  roles: Role;
  users: User;
  audit: AuditLog;
}

export type CollectionName = keyof Collections;
export const COLLECTIONS: CollectionName[] = [
  'school', 'years', 'periods', 'classes', 'subjects', 'courses', 'guardians', 'students', 'staff',
  'evaluations', 'grades', 'reportEntries', 'attendance', 'staffAttendance', 'timetable', 'payments',
  'expenses', 'salaries', 'projects', 'messages', 'events', 'incidents', 'lessons', 'chat', 'remplacements', 'agenda', 'roles', 'users', 'audit',
];
