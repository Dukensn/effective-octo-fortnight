import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, ChevronDown, ChevronRight, HelpCircle, LayoutGrid, LogOut, Plus, Search, UserCircle2, WifiOff, Cloud, CloudOff, RefreshCw, type LucideIcon } from 'lucide-react';
import { SchoolLogo } from './Logo';
import { AppBarCtx, Avatar, Sheet, useIsDesktop, useIsMobile } from './ui';
import { watchTables } from '../lib/stackTables';
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

function GlobalSearch({ autoFocus, onDone }: { autoFocus?: boolean; onDone?: () => void }) {
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
      <input autoFocus={autoFocus} value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)} placeholder="Rechercher un élève, un parent, une classe, un matricule..." />
      {open && results.length > 0 && (
        <div className="menu" style={{ left: 0, right: 0 }}>
          {results.map((r) => (
            <button key={r.to} onMouseDown={() => { navigate(r.to); setQ(''); onDone?.(); }}>
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

export interface QuickAction { label: string; sub?: string; icon: LucideIcon; to: string; tint: string }

// Titres des écrans secondaires (les écrans principaux prennent le libellé du menu).
const SUB_TITLES: [RegExp, string][] = [
  [/^\/inscriptions\/rapide/, 'Inscription rapide'], [/^\/inscriptions\/nouvelle/, 'Nouvelle inscription'], [/^\/eleves\/import/, 'Importer des élèves'],
  [/^\/eleves\/photos/, 'Séance photo'], [/^\/eleves\//, 'Fiche élève'], [/^\/classes\//, 'Classe'], [/^\/notes\/saisie/, 'Saisie des notes'],
  [/^\/notes\/palmares/, 'Palmarès'], [/^\/documents\/bulletins/, 'Bulletins'], [/^\/documents\/badges/, 'Badges'], [/^\/prof\/evaluation\/.+\/saisie/, 'Saisie des notes'],
  [/^\/prof\/evaluation/, 'Palmarès'], [/^\/prof\/classes\//, 'Contrôles'], [/^\/profil/, 'Mon profil'], [/^\/aide/, 'Aide'], [/^\/evenements/, 'Événements'], [/^\/gestion/, 'Gestion'],
];

export function Shell({ items, tabs, quick = [], children }: { items: NavItem[]; tabs: NavItem[]; quick?: QuickAction[]; children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [plus, setPlus] = useState(false);
  const [more, setMore] = useState(false);
  const [slots, setSlots] = useState<{ title: HTMLElement | null; actions: HTMLElement | null }>({ title: null, actions: null });
  const titleRef = useCallback((el: HTMLElement | null) => setSlots((x) => (x.title === el ? x : { ...x, title: el })), []);
  const actionsRef = useCallback((el: HTMLElement | null) => setSlots((x) => (x.actions === el ? x : { ...x, actions: el })), []);
  const session = useSession();
  const school = useDoc('school', 'main');
  const year = useDoc('years', school?.anneeCourante);
  const online = useOnline();
  const navigate = useNavigate();
  const location = useLocation();
  const desktop = useIsDesktop();
  const pendingStudents = useCollection('students').filter((s) => s.statut === 'En attente').length;
  const pendingPayments = useCollection('payments').filter((p) => p.statut === 'En attente').length;
  const notifCount = session?.isTeacher ? 0 : pendingStudents + pendingPayments;
  useEffect(() => { window.scrollTo(0, 0); setSearchOpen(false); setPlus(false); setMore(false); }, [location.pathname, location.search]);
  const phone = useIsMobile();
  const [contentEl, setContentEl] = useState<HTMLElement | null>(null);
  useEffect(() => (phone && contentEl ? watchTables(contentEl) : undefined), [phone, contentEl]);
  if (!session) return null;
  const roleLabel = session.isTeacher ? 'Professeur' : session.role.nom;
  const path = location.pathname;
  const isTab = tabs.some((t) => (t.end ? path === t.to : path === t.to));
  const fallbackTitle = SUB_TITLES.find(([re]) => re.test(path))?.[1] ?? items.find((t) => t.to !== '/' && path.startsWith(t.to))?.label ?? (path === '/' ? 'Accueil' : '');
  const goBack = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navigate(-1);
    else navigate('/' + (path.split('/')[1] ?? ''));
  };
  const others = items.filter((it) => !tabs.some((t) => t.to === it.to));
  const half = Math.ceil(tabs.length / 2);
  return (
    <AppBarCtx.Provider value={slots}>
    <div className="shell">
      <aside className="sidebar"><SideNav items={items} /></aside>
      <div className="main">
        {!online && <div className="offline-banner"><WifiOff size={13} style={{ verticalAlign: -2 }} /> Hors ligne — tout est enregistré sur l’appareil et sera synchronisé.</div>}
        {desktop ? (
          <header className="topbar">
            <GlobalSearch />
            <span className="spacer" />
            <SyncPill />
            <button className="icon-btn" aria-label="Notifications" onClick={() => navigate('/evenements')}>
              <Bell />
              {notifCount > 0 && <span className="dot-count">{Math.min(notifCount, 9)}</span>}
            </button>
            {!session.isTeacher && (
              <button className="btn year-select" style={{ color: 'var(--ink)', fontWeight: 500 }} onClick={() => navigate('/parametres?tab=annee')} title="Changer d’année scolaire">Année {year?.libelle}</button>
            )}
            <UserMenu name={session.user.nom} photo={session.user.photo} role={roleLabel} />
          </header>
        ) : (
          <header className="appbar">
            {isTab ? <SchoolLogo size={28} className="appbar-logo" /> : <button className="icon-btn" aria-label="Retour" onClick={goBack}><ArrowLeft /></button>}
            <h1 className="appbar-title"><span ref={titleRef} className="ab-slot" /><span className="ab-default">{fallbackTitle}</span></h1>
            {!session.isTeacher && <button className="icon-btn" aria-label="Rechercher" onClick={() => setSearchOpen(!searchOpen)}><Search /></button>}
            <button className="icon-btn" aria-label="Notifications" onClick={() => navigate('/evenements')}>
              <Bell />
              {notifCount > 0 && <span className="dot-count">{Math.min(notifCount, 9)}</span>}
            </button>
            <span ref={actionsRef} className="ab-actions" />
          </header>
        )}
        {searchOpen && !desktop && <div className="mobile-search-bar"><GlobalSearch autoFocus onDone={() => setSearchOpen(false)} /></div>}
        <main className="content" key={desktop ? 'd' : path} ref={setContentEl}>{children}</main>
        <nav className="bottom-nav">
          {tabs.slice(0, half).map((it) => <NavLink key={it.to} to={it.to} end={it.end}><it.icon />{it.label}</NavLink>)}
          {quick.length > 0 && <button className="tab-plus" aria-label="Nouveau" onClick={() => setPlus(true)}><span><Plus /></span></button>}
          {tabs.slice(half).map((it) => <NavLink key={it.to} to={it.to} end={it.end}><it.icon />{it.label}</NavLink>)}
          <button className={more ? 'active' : ''} onClick={() => setMore(true)}><LayoutGrid />Menu</button>
        </nav>
      </div>
      <Sheet open={plus} onClose={() => setPlus(false)} title="Que voulez-vous faire ?">
        <div className="quick-grid">
          {quick.map((q) => (
            <button key={q.label} onClick={() => { setPlus(false); navigate(q.to); }}>
              <span className={`qi tint-${q.tint}`}><q.icon /></span>
              <b>{q.label}</b>
              {q.sub && <small>{q.sub}</small>}
            </button>
          ))}
        </div>
      </Sheet>
      <Sheet open={more} onClose={() => setMore(false)}>
        <button className="me-row" onClick={() => { setMore(false); navigate('/profil'); }}>
          <Avatar src={session.user.photo} name={session.user.nom} size={46} />
          <span className="grow"><b>{session.user.nom}</b><small>{roleLabel}{!session.isTeacher && year ? ` · Année ${year.libelle}` : ''}</small></span>
          <ChevronRight size={18} className="chev" />
        </button>
        <div className="app-grid">
          {others.map((it) => (
            <button key={it.to} onClick={() => { setMore(false); navigate(it.to); }}>
              <span><it.icon /></span>{it.label.replace('Tableau de bord', 'Accueil').replace('Notes / Examens', 'Notes')}
            </button>
          ))}
          <button onClick={() => { setMore(false); navigate('/aide'); }}><span><HelpCircle /></span>Aide</button>
        </div>
        <button className="sheet-row danger" onClick={() => { setMore(false); logout(); navigate('/'); }}><LogOut />Se déconnecter</button>
      </Sheet>
    </div>
    </AppBarCtx.Provider>
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
