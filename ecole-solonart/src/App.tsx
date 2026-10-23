import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import {
  Home, Users, PenSquare, Map, UsersRound, Contact, CalendarDays, FileText, ClipboardCheck, BadgeDollarSign, FolderOpen,
  Mail, BarChart3, Settings, Clock, LayoutGrid, CalendarHeart, BookOpenCheck, Trophy, CalendarClock,
} from 'lucide-react';
import { Shell, type NavItem } from './components/Layout';
import { Toasts } from './components/ui';
import { PrintRoot } from './lib/print';
import { useSession } from './lib/session';
import type { ModuleKey } from './data/types';
import Login from './pages/Login';
import Dashboard from './pages/admin/Dashboard';
import Gestion from './pages/admin/Gestion';
import Students from './pages/admin/Students';
import StudentProfile from './pages/admin/StudentProfile';
import Enrollment from './pages/admin/Enrollment';
import Enrollments from './pages/admin/Enrollments';
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
import TeacherHome from './pages/teacher/TeacherHome';
import TeacherClasses from './pages/teacher/TeacherClasses';
import TeacherEvaluations from './pages/teacher/TeacherEvaluations';
import Palmares from './pages/teacher/Palmares';
import GradeEntry from './pages/teacher/GradeEntry';
import TeacherAttendance from './pages/teacher/TeacherAttendance';
import TeacherTimetable from './pages/teacher/TeacherTimetable';

const ADMIN_NAV: (NavItem & { m: ModuleKey })[] = [
  { to: '/', label: 'Tableau de bord', icon: Home, end: true, m: 'dashboard' },
  { to: '/eleves', label: 'Élèves', icon: Users, m: 'eleves' },
  { to: '/inscriptions', label: 'Inscriptions', icon: PenSquare, m: 'inscriptions' },
  { to: '/classes', label: 'Classes', icon: Map, m: 'classes' },
  { to: '/parents', label: 'Parents', icon: UsersRound, m: 'parents' },
  { to: '/personnel', label: 'Personnel', icon: Contact, m: 'personnel' },
  { to: '/emploi-du-temps', label: 'Emploi du temps', icon: CalendarDays, m: 'emploi' },
  { to: '/notes', label: 'Notes / Examens', icon: FileText, m: 'notes' },
  { to: '/presences', label: 'Présences', icon: ClipboardCheck, m: 'presences' },
  { to: '/finance', label: 'Finance', icon: BadgeDollarSign, m: 'finance' },
  { to: '/documents', label: 'Documents', icon: FolderOpen, m: 'documents' },
  { to: '/communication', label: 'Communication', icon: Mail, m: 'communication' },
  { to: '/rapports', label: 'Rapports', icon: BarChart3, m: 'rapports' },
  { to: '/parametres', label: 'Paramètres', icon: Settings, m: 'parametres' },
];

const TEACHER_NAV: NavItem[] = [
  { to: '/', label: 'Accueil', icon: Home, end: true },
  { to: '/prof/classes', label: 'Mes classes', icon: Users },
  { to: '/prof/notes', label: 'Saisir des notes', icon: BookOpenCheck },
  { to: '/prof/palmares', label: 'Palmarès', icon: Trophy },
  { to: '/prof/appel', label: 'Faire l’appel', icon: ClipboardCheck },
  { to: '/prof/emploi', label: 'Emploi du temps', icon: CalendarClock },
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
  const bottomAll: (NavItem & { m: ModuleKey })[] = [
    { to: '/', label: 'Accueil', icon: Home, end: true, m: 'dashboard' },
    { to: '/presences', label: 'Ponctualité', icon: Clock, m: 'presences' },
    { to: '/gestion', label: 'Gestion', icon: LayoutGrid, m: 'eleves' },
    { to: '/finance', label: 'Finance', icon: BadgeDollarSign, m: 'finance' },
    { to: '/evenements', label: 'Événements', icon: CalendarHeart, m: 'dashboard' },
  ];
  const bottom = bottomAll.filter((b) => session.can(b.m));
  const G = (m: ModuleKey, el: React.ReactNode) => <Guard m={m}>{el}</Guard>;
  return (
    <Shell items={items} bottom={bottom.length >= 3 ? bottom : bottomAll.slice(0, 1).concat(bottom.slice(1))}>
      <Routes>
        <Route path="/" element={G('dashboard', <Dashboard />)} />
        <Route path="/gestion" element={<Gestion />} />
        <Route path="/eleves" element={G('eleves', <Students />)} />
        <Route path="/eleves/:id" element={G('eleves', <StudentProfile />)} />
        <Route path="/inscriptions" element={G('inscriptions', <Enrollments />)} />
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
        <Route path="/finance" element={G('finance', <Finance />)} />
        <Route path="/documents" element={G('documents', <Documents />)} />
        <Route path="/documents/bulletins" element={G('documents', <ReportCards />)} />
        <Route path="/documents/badges" element={G('documents', <Badges />)} />
        <Route path="/communication" element={G('communication', <Communication />)} />
        <Route path="/evenements" element={<Events />} />
        <Route path="/rapports" element={G('rapports', <Reports />)} />
        <Route path="/parametres" element={G('parametres', <SettingsPage />)} />
        <Route path="/profil" element={<Profile />} />
        <Route path="/aide" element={<Help />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}

function TeacherApp() {
  const bottom: NavItem[] = [
    { to: '/', label: 'Accueil', icon: Home, end: true },
    { to: '/prof/classes', label: 'Classes', icon: Users },
    { to: '/prof/notes', label: 'Notes', icon: BookOpenCheck },
    { to: '/prof/appel', label: 'Appel', icon: ClipboardCheck },
    { to: '/prof/palmares', label: 'Palmarès', icon: Trophy },
  ];
  return (
    <Shell items={TEACHER_NAV} bottom={bottom}>
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
      {!session ? <Login /> : session.isTeacher ? <TeacherApp /> : <AdminApp />}
      <Toasts />
      <PrintRoot />
    </HashRouter>
  );
}
