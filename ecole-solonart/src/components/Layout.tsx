import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, Menu as MenuIcon, Search, UserCircle2, WifiOff, Cloud, CloudOff, RefreshCw, type LucideIcon } from 'lucide-react';
import { SchoolLogo } from './Logo';
import { Avatar } from './ui';
import { useCollection, useDoc } from '../data/store';
import { logout, useSession } from '../lib/session';
import { useSyncState } from '../data/sync';
import { norm, fullName } from '../lib/format';

export interface NavItem { to: string; label: string; icon: LucideIcon; end?: boolean }

function useOnline() {
  const [on, setOn] = useState(navigator.onLine);
  useEffect(() => {
    const a = () => setOn(true), b = () => setOn(false);
    window.addEventListener('online', a); window.addEventListener('offline', b);
    return () => { window.removeEventListener('online', a); window.removeEventListener('offline', b); };
  }, []);
  return on;
}

function SideNav({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const school = useDoc('school', 'main');
  const navigate = useNavigate();
  return (
    <>
      <div className="brand">
        <SchoolLogo size={40} className="brand-logo" />
        <div>
          <div className="brand-name">{school?.nom ?? 'École'}</div>
          <div className="brand-motto">{school?.devise}</div>
        </div>
      </div>
      <nav className="nav">
        {items.map((it) => (
          <NavLink key={it.to} to={it.to} end={it.end} onClick={onNavigate}>
            <it.icon />
            {it.label}
          </NavLink>
        ))}
      </nav>
      <div className="help-card">
        <h4><span className="q">?</span>Besoin d'aide ?</h4>
        <p>Consultez notre centre d'aide ou contactez l'administration.</p>
        <button className="btn" onClick={() => { onNavigate?.(); navigate('/aide'); }}>Centre d'aide</button>
      </div>
    </>
  );
}

function GlobalSearch() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const students = useCollection('students');
  const guardians = useCollection('guardians');
  const classes = useCollection('classes');
  const staff = useCollection('staff');
  const navigate = useNavigate();
  const session = useSession();
  const results = useMemo(() => {
    const n = norm(q.trim());
    if (n.length < 2) return [];
    const out: { label: string; sub: string; to: string; photo?: string }[] = [];
    for (const s of students) if (norm(`${s.prenom} ${s.nom} ${s.matricule}`).includes(n)) out.push({ label: fullName(s), sub: `Élève · ${s.matricule}`, to: `/eleves/${s.id}`, photo: s.photo });
    if (!session?.isTeacher) {
      for (const g of guardians) if (norm(`${g.prenom} ${g.nom} ${g.telephone}`).includes(n)) out.push({ label: fullName(g), sub: `Parent · ${g.telephone}`, to: `/parents?id=${g.id}`, photo: g.photo });
      for (const c of classes) if (norm(`${c.code} ${c.nom}`).includes(n)) out.push({ label: c.code, sub: c.nom, to: `/classes/${c.id}` });
      for (const s of staff) if (norm(`${s.prenom} ${s.nom} ${s.matricule} ${s.poste}`).includes(n)) out.push({ label: fullName(s), sub: `${s.poste} · ${s.matricule}`, to: `/personnel?id=${s.id}`, photo: s.photo });
    }
    return out.slice(0, 8);
  }, [q, students, guardians, classes, staff, session?.isTeacher]);
  if (session?.isTeacher) return null;
  return (
    <div className="search" style={{ position: 'relative' }}>
      <Search />
      <input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)} placeholder="Rechercher un élève, un parent, une classe, un matricule..." />
      {open && results.length > 0 && (
        <div className="menu" style={{ left: 0, right: 0 }}>
          {results.map((r) => (
            <button key={r.to} onMouseDown={() => { navigate(r.to); setQ(''); }}>
              <Avatar src={r.photo} name={r.label} size={28} />
              <span className="grow"><b style={{ color: 'var(--ink)', fontWeight: 600 }}>{r.label}</b><br /><span className="tiny muted">{r.sub}</span></span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SyncPill() {
  const s = useSyncState();
  const online = useOnline();
  if (s.status === 'local') return null;
  const map = { offline: [CloudOff, 'Hors ligne'], syncing: [RefreshCw, 'Synchronisation…'], synced: [Cloud, 'Synchronisé'], error: [CloudOff, 'Erreur de synchro'], local: [Cloud, ''] } as const;
  const [Ic, label] = online ? map[s.status] : map.offline;
  return <span className="sync-pill only-desktop"><Ic size={14} />{label}</span>;
}

export function Shell({ items, bottom, children }: { items: NavItem[]; bottom: NavItem[]; children: ReactNode }) {
  const [drawer, setDrawer] = useState(false);
  const session = useSession();
  const school = useDoc('school', 'main');
  const year = useDoc('years', school?.anneeCourante);
  const years = useCollection('years');
  const online = useOnline();
  const navigate = useNavigate();
  const location = useLocation();
  const events = useCollection('events');
  const pendingStudents = useCollection('students').filter((s) => s.statut === 'En attente').length;
  const notifCount = session?.isTeacher ? events.length : pendingStudents + events.length;
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);
  if (!session) return null;
  const roleLabel = session.isTeacher ? 'Professeur' : session.role.nom;
  return (
    <div className="shell">
      <aside className="sidebar"><SideNav items={items} /></aside>
      {drawer && (
        <>
          <div className="drawer-backdrop" onClick={() => setDrawer(false)} />
          <aside className="drawer"><SideNav items={items} onNavigate={() => setDrawer(false)} /></aside>
        </>
      )}
      <div className="main">
        {!online && <div className="offline-banner"><WifiOff size={13} style={{ verticalAlign: -2 }} /> Mode hors ligne — vos modifications sont enregistrées sur cet appareil et seront synchronisées.</div>}
        <header className="topbar">
          <button className="icon-btn only-mobile" style={{ display: undefined }} onClick={() => setDrawer(true)} aria-label="Menu"><MenuIcon /></button>
          <div className="mobile-brand only-mobile"><SchoolLogo size={26} /><span className="ellipsis" style={{ maxWidth: 150 }}>{school?.nom.replace('École Mixte ', '')}</span></div>
          <GlobalSearch />
          <span className="spacer" />
          <SyncPill />
          <button className="icon-btn" aria-label="Notifications" onClick={() => navigate(session.isTeacher ? '/evenements' : '/evenements')}>
            <Bell />
            {notifCount > 0 && <span className="dot-count">{Math.min(notifCount, 9)}</span>}
          </button>
          {!session.isTeacher && (
            <select className="select year-select" style={{ width: 196 }} value={year?.id} onChange={() => navigate('/parametres?tab=annee')} aria-label="Année scolaire">
              {years.sort((a, b) => b.libelle.localeCompare(a.libelle)).map((y) => <option key={y.id} value={y.id}>Année {y.libelle}</option>)}
            </select>
          )}
          <UserMenu name={session.user.nom} photo={session.user.photo} role={roleLabel} />
        </header>
        <main className="content">{children}</main>
        <nav className="bottom-nav">
          {bottom.map((it) => (
            <NavLink key={it.to} to={it.to} end={it.end}><it.icon />{it.label}</NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}

function UserMenu({ name, photo, role }: { name: string; photo?: string; role: string }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  return (
    <div className="menu-wrap">
      <button className="user-chip" onClick={() => setOpen(!open)} onBlur={() => setTimeout(() => setOpen(false), 150)}>
        <Avatar src={photo} name={name} size={38} />
        <span className="who"><b>{role === 'Directeur' ? 'Directeur' : name}</b><span>{role === 'Directeur' ? 'Administration' : role}</span></span>
        <ChevronDown size={16} className="only-desktop" />
      </button>
      {open && (
        <div className="menu">
          <div style={{ padding: '8px 10px' }}><b style={{ color: 'var(--ink)' }}>{name}</b><div className="tiny muted">{role}</div></div>
          <hr />
          <button onMouseDown={() => navigate('/profil')}><UserCircle2 />Mon profil</button>
          <button onMouseDown={() => { logout(); navigate('/'); }}><LogOut />Se déconnecter</button>
        </div>
      )}
    </div>
  );
}
