import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import {
  Home, Users, PenSquare, Map, UsersRound, Contact, CalendarDays, FileText, ClipboardCheck, BadgeDollarSign, FolderOpen,
  Mail, BarChart3, Settings, CalendarHeart, BookOpenCheck, Trophy, CalendarClock, UserPlus, Receipt, TrendingDown, IdCard, ShieldAlert, NotebookPen, Sparkles, History, MessagesSquare, TrendingUp,
} from 'lucide-react';
import { Shell, type NavItem, type QuickAction } from './components/Layout';
import { Toasts } from './components/ui';
import { PrintRoot } from './lib/print';
import { useSession } from './lib/session';
import { useCollection } from './data/store';
import { canTeacherCall, canTeacherMessage } from './lib/regles';
import type { ModuleKey } from './data/types';
import Login from './pages/Login';
import Dashboard from './pages/admin/Dashboard';
import Gestion from './pages/admin/Gestion';
import Students from './pages/admin/Students';
import StudentProfile from './pages/admin/StudentProfile';
import Enrollment from './pages/admin/Enrollment';
import Enrollments from './pages/admin/Enrollments';
import QuickEnroll from './pages/admin/QuickEnroll';
import ImportStudents from './pages/admin/ImportStudents';
import ClassPhotos from './pages/admin/ClassPhotos';
import Classes from './pages/admin/Classes';
import ClassDetail from './pages/admin/ClassDetail';
import Parents from './pages/admin/Parents';
import StaffPage from './pages/admin/Staff';
import Timetable from './pages/admin/Timetable';
import Grades from './pages/admin/Grades';
import AttendancePage from './pages/admin/Attendance';
import Finance from './pages/admin/Finance';
import Documents from './pages/admin/Documents';
import ReportCards from './pages/admin/ReportCards';
import Badges from './pages/admin/Badges';
import Communication from './pages/admin/Communication';
import Events from './pages/admin/Events';
import Reports from './pages/admin/Reports';
import SettingsPage from './pages/admin/Settings';
import Profile from './pages/Profile';
import Help from './pages/Help';
import Assistant from './pages/Assistant';
import TeacherHome from './pages/teacher/TeacherHome';
import TeacherClasses from './pages/teacher/TeacherClasses';
import TeacherEvaluations from './pages/teacher/TeacherEvaluations';
import Palmares from './pages/teacher/Palmares';
import GradeEntry from './pages/teacher/GradeEntry';
import TeacherAttendance from './pages/teacher/TeacherAttendance';
import TeacherTimetable from './pages/teacher/TeacherTimetable';
import TeacherCahier from './pages/teacher/TeacherCahier';
import TeacherDiscipline from './pages/teacher/TeacherDiscipline';
import Discipline from './pages/admin/Discipline';
import Cahier from './pages/admin/Cahier';
import Journal from './pages/admin/Journal';
import { ParentHome, ParentBulletins, ParentProgres, ParentVie, ParentPaiements } from './pages/parent/Parent';
import { AdminMessages, TeacherMessages, ParentMessages } from './pages/Messages';

const ADMIN_NAV: (NavItem & { m: ModuleKey })[] = [
  { to: '/', label: 'Tableau de bord', icon: Home, end: true, m: 'dashboard' },
  { to: '/assistant', label: 'Assistant', icon: Sparkles, m: 'dashboard' },
  { to: '/eleves', label: 'Élèves', icon: Users, m: 'eleves' },
  { to: '/inscriptions', label: 'Inscriptions', icon: PenSquare, m: 'inscriptions' },
  { to: '/classes', label: 'Classes', icon: Map, m: 'classes' },
  { to: '/parents', label: 'Parents', icon: UsersRound, m: 'parents' },
  { to: '/personnel', label: 'Personnel', icon: Contact, m: 'personnel' },
  { to: '/emploi-du-temps', label: 'Emploi du temps', icon: CalendarDays, m: 'emploi' },
  { to: '/notes', label: 'Notes / Examens', icon: FileText, m: 'notes' },
  { to: '/presences', label: 'Présences', icon: ClipboardCheck, m: 'presences' },
  { to: '/discipline', label: 'Discipline', icon: ShieldAlert, m: 'discipline' },
  { to: '/cahier', label: 'Cahier de textes', icon: NotebookPen, m: 'cahier' },
  { to: '/finance', label: 'Finance', icon: BadgeDollarSign, m: 'finance' },
  { to: '/documents', label: 'Documents', icon: FolderOpen, m: 'documents' },
  { to: '/messages', label: 'Messagerie', icon: MessagesSquare, m: 'communication' },
  { to: '/communication', label: 'Communication', icon: Mail, m: 'communication' },
  { to: '/rapports', label: 'Rapports', icon: BarChart3, m: 'rapports' },
  { to: '/journal', label: 'Journal', icon: History, m: 'utilisateurs' },
  { to: '/parametres', label: 'Paramètres', icon: Settings, m: 'parametres' },
];

const TEACHER_NAV: NavItem[] = [
  { to: '/', label: 'Accueil', icon: Home, end: true },
  { to: '/prof/classes', label: 'Mes classes', icon: Users },
  { to: '/prof/notes', label: 'Saisir des notes', icon: BookOpenCheck },
  { to: '/prof/palmares', label: 'Palmarès', icon: Trophy },
  { to: '/prof/appel', label: 'Faire l’appel', icon: ClipboardCheck },
  { to: '/prof/messages', label: 'Messages', icon: MessagesSquare },
  { to: '/prof/emploi', label: 'Emploi du temps', icon: CalendarClock },
  { to: '/prof/cahier', label: 'Cahier de textes', icon: NotebookPen },
  { to: '/prof/discipline', label: 'Discipline', icon: ShieldAlert },
  { to: '/evenements', label: 'Événements', icon: CalendarHeart },
];

function Guard({ m, children }: { m: ModuleKey; children: React.ReactNode }) {
  const s = useSession();
  if (!s?.can(m)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AdminApp() {
  const session = useSession()!;
  const items = ADMIN_NAV.filter((n) => session.can(n.m));
  // Barre du bas : les 3 écrans les plus utilisés auxquels ce rôle a accès, le bouton « ＋ » et le menu.
  const tabs = ([
    { to: '/', label: 'Accueil', icon: Home, end: true, m: 'dashboard' },
    { to: '/eleves', label: 'Élèves', icon: Users, m: 'eleves' },
    { to: '/finance', label: 'Finance', icon: BadgeDollarSign, m: 'finance' },
    { to: '/notes', label: 'Notes', icon: FileText, m: 'notes' },
    { to: '/presences', label: 'Présences', icon: ClipboardCheck, m: 'presences' },
    { to: '/documents', label: 'Documents', icon: FolderOpen, m: 'documents' },
  ] as (NavItem & { m: ModuleKey })[]).filter((t) => session.can(t.m)).slice(0, 3);
  const quick = ([
    { label: 'Assistant', sub: 'Demander à la voix', icon: Sparkles, to: '/assistant', tint: 'violet', m: 'dashboard', w: false },
    { label: 'Inscrire un élève', sub: 'En 1 minute', icon: UserPlus, to: '/inscriptions/rapide', tint: 'blue', m: 'inscriptions', w: true },
    { label: 'Encaisser', sub: 'Paiement + reçu', icon: Receipt, to: '/finance?new=1', tint: 'green', m: 'finance', w: true },
    { label: 'Dépense', sub: 'Enregistrer une sortie', icon: TrendingDown, to: '/finance?tab=depenses&depense=1', tint: 'red', m: 'finance', w: true },
    { label: 'Faire l’appel', sub: 'Présences du jour', icon: ClipboardCheck, to: '/presences', tint: 'violet', m: 'presences', w: true },
    { label: 'Incident', sub: 'Registre de discipline', icon: ShieldAlert, to: '/discipline?new=1', tint: 'red', m: 'discipline', w: true },
    { label: 'Notes', sub: 'Saisie et conseil', icon: FileText, to: '/notes', tint: 'orange', m: 'notes', w: false },
    { label: 'Bulletins', sub: 'Classe ou élève', icon: BookOpenCheck, to: '/documents/bulletins', tint: 'navy', m: 'documents', w: false },
    { label: 'Badges', sub: 'Portrait ou paysage', icon: IdCard, to: '/documents/badges', tint: 'blue', m: 'documents', w: false },
    { label: 'Rapport du mois', sub: 'Finances en PDF', icon: BarChart3, to: '/finance?tab=rapports', tint: 'green', m: 'finance', w: false },
    { label: 'Message', sub: 'SMS, WhatsApp', icon: Mail, to: '/communication', tint: 'orange', m: 'communication', w: true },
  ] as (QuickAction & { m: ModuleKey; w: boolean })[]).filter((q) => session.can(q.m, q.w ? 'write' : 'read'));
  const G = (m: ModuleKey, el: React.ReactNode) => <Guard m={m}>{el}</Guard>;
  return (
    <Shell items={items} tabs={tabs} quick={quick}>
      <Routes>
        <Route path="/" element={G('dashboard', <Dashboard />)} />
        <Route path="/gestion" element={<Gestion />} />
        <Route path="/assistant" element={G('dashboard', <Assistant />)} />
        <Route path="/eleves" element={G('eleves', <Students />)} />
        <Route path="/eleves/import" element={G('inscriptions', <ImportStudents />)} />
        <Route path="/eleves/photos" element={G('eleves', <ClassPhotos />)} />
        <Route path="/eleves/:id" element={G('eleves', <StudentProfile />)} />
        <Route path="/inscriptions" element={G('inscriptions', <Enrollments />)} />
        <Route path="/inscriptions/rapide" element={G('inscriptions', <QuickEnroll />)} />
        <Route path="/inscriptions/nouvelle" element={G('inscriptions', <Enrollment />)} />
        <Route path="/inscriptions/:id" element={G('inscriptions', <Enrollment />)} />
        <Route path="/classes" element={G('classes', <Classes />)} />
        <Route path="/classes/:id" element={G('classes', <ClassDetail />)} />
        <Route path="/parents" element={G('parents', <Parents />)} />
        <Route path="/personnel" element={G('personnel', <StaffPage />)} />
        <Route path="/emploi-du-temps" element={G('emploi', <Timetable />)} />
        <Route path="/notes" element={G('notes', <Grades />)} />
        <Route path="/notes/saisie/:id" element={G('notes', <GradeEntry admin />)} />
        <Route path="/notes/palmares/:id" element={G('notes', <Palmares admin />)} />
        <Route path="/presences" element={G('presences', <AttendancePage />)} />
        <Route path="/discipline" element={G('discipline', <Discipline />)} />
        <Route path="/cahier" element={G('cahier', <Cahier />)} />
        <Route path="/finance" element={G('finance', <Finance />)} />
        <Route path="/documents" element={G('documents', <Documents />)} />
        <Route path="/documents/bulletins" element={G('documents', <ReportCards />)} />
        <Route path="/documents/badges" element={G('documents', <Badges />)} />
        <Route path="/communication" element={G('communication', <Communication />)} />
        <Route path="/messages" element={G('communication', <AdminMessages />)} />
        <Route path="/evenements" element={<Events />} />
        <Route path="/rapports" element={G('rapports', <Reports />)} />
        <Route path="/journal" element={G('utilisateurs', <Journal />)} />
        <Route path="/parametres" element={G('parametres', <SettingsPage />)} />
        <Route path="/profil" element={<Profile />} />
        <Route path="/aide" element={<Help />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}

function TeacherApp() {
  const session = useSession()!;
  const classes = useCollection('classes');
  useCollection('courses');
  // L'appel n'apparaît que pour les professeurs qui en ont la charge (jamais au secondaire) ; idem pour la messagerie.
  const appel = classes.some((c) => canTeacherCall(session.user.staffId, c));
  const msg = classes.some((c) => canTeacherMessage(session.user.staffId, c));
  const items = TEACHER_NAV.filter((n) => (n.to !== '/prof/appel' || appel) && (n.to !== '/prof/messages' || msg));
  const tabs: NavItem[] = [
    { to: '/', label: 'Accueil', icon: Home, end: true },
    { to: '/prof/notes', label: 'Notes', icon: BookOpenCheck },
    appel ? { to: '/prof/appel', label: 'Appel', icon: ClipboardCheck } : { to: '/prof/cahier', label: 'Cahier', icon: NotebookPen },
    msg ? { to: '/prof/messages', label: 'Messages', icon: MessagesSquare } : { to: '/prof/emploi', label: 'Horaire', icon: CalendarClock },
  ];
  return (
    <Shell items={items} tabs={tabs}>
      <Routes>
        <Route path="/" element={<TeacherHome />} />
        <Route path="/prof/classes" element={<TeacherClasses />} />
        <Route path="/prof/notes" element={<TeacherClasses mode="notes" />} />
        <Route path="/prof/palmares" element={<TeacherClasses mode="palmares" />} />
        <Route path="/prof/classes/:coursId" element={<TeacherEvaluations />} />
        <Route path="/prof/evaluation/:id" element={<Palmares />} />
        <Route path="/prof/evaluation/:id/saisie" element={<GradeEntry />} />
        <Route path="/prof/appel" element={<TeacherAttendance />} />
        <Route path="/prof/emploi" element={<TeacherTimetable />} />
        <Route path="/prof/cahier" element={<TeacherCahier />} />
        <Route path="/prof/discipline" element={<TeacherDiscipline />} />
        <Route path="/prof/messages" element={<TeacherMessages />} />
        <Route path="/evenements" element={<Events />} />
        <Route path="/profil" element={<Profile />} />
        <Route path="/aide" element={<Help />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}

const PARENT_NAV: NavItem[] = [
  { to: '/', label: 'Accueil', icon: Home, end: true },
  { to: '/p/messages', label: 'Messages', icon: MessagesSquare },
  { to: '/p/bulletins', label: 'Bulletins', icon: FileText },
  { to: '/p/progres', label: 'Progrès', icon: TrendingUp },
  { to: '/p/vie', label: 'Vie scolaire', icon: ClipboardCheck },
  { to: '/p/paiements', label: 'Paiements', icon: Receipt },
  { to: '/evenements', label: 'Événements', icon: CalendarHeart },
];

function ParentApp() {
  return (
    <Shell items={PARENT_NAV} tabs={PARENT_NAV.slice(0, 4)}>
      <Routes>
        <Route path="/" element={<ParentHome />} />
        <Route path="/p/messages" element={<ParentMessages />} />
        <Route path="/p/bulletins" element={<ParentBulletins />} />
        <Route path="/p/progres" element={<ParentProgres />} />
        <Route path="/p/vie" element={<ParentVie />} />
        <Route path="/p/paiements" element={<ParentPaiements />} />
        <Route path="/evenements" element={<Events />} />
        <Route path="/profil" element={<Profile />} />
        <Route path="/aide" element={<Help />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}

export default function App() {
  const session = useSession();
  return (
    <HashRouter>
      {!session ? <Login /> : session.isParent ? <ParentApp /> : session.isTeacher ? <TeacherApp /> : <AdminApp />}
      <Toasts />
      <PrintRoot />
    </HashRouter>
  );
}
