import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, ChevronDown, DollarSign, TrendingUp, TrendingDown, BarChart3, PieChart, FileSpreadsheet, Receipt, CheckCircle2, Printer, FolderKanban, FileText, Wallet, BadgeCheck, CircleDollarSign } from 'lucide-react';
import { db, useCollection, useDoc } from '../../data/store';
import type { Expense, Payment, PaymentMode, Project, Salary } from '../../data/types';
import { PageHead, Tabs, Field, Card, Avatar, StatusBadge, Menu, Modal, toast, SearchInput, usePaged, Pager, Empty } from '../../components/ui';
import { BarChart, Donut } from '../../components/charts';
import { money, moneyShort, dateShort, fullName, monthLabel, monthShort, todayISO, downloadCSV, norm, civ } from '../../lib/format';
import { balances, nextReceipt } from '../../lib/finance';
import { useSession, audit } from '../../lib/session';
import { printDocument } from '../../lib/print';
import { ReceiptSheet, FinanceReportSheet } from '../../docs/Sheets';

type Tab = 'apercu' | 'paiements' | 'salaires' | 'depenses' | 'comptabilite' | 'projets' | 'rapports';
const MODES: PaymentMode[] = ['MonCash', 'NatCash', 'Espèces', 'Virement', 'Chèque'];
const CAT_COLORS: Record<Expense['categorie'], string> = { Salaires: '#1463f3', Fonctionnement: '#17a34a', Infrastructures: '#f0a500', 'Matériel pédagogique': '#a855f7', Projets: '#ef4f5f', Autres: '#9aa3b5' };

export function useFinanceTotals() {
  const payments = useCollection('payments');
  const expenses = useCollection('expenses');
  const salaries = useCollection('salaries');
  const projects = useCollection('projects');
  useCollection('students');
  return useMemo(() => {
    const paid = payments.filter((p) => p.statut === 'Payé');
    const revenus = paid.reduce((a, p) => a + p.montant, 0);
    const salPaid = salaries.filter((s) => s.statut === 'Payé').reduce((a, s) => a + s.montant + s.primes - s.retenues, 0);
    const expPaid = expenses.filter((e) => e.statut === 'Payé');
    const depenses = salPaid + expPaid.reduce((a, e) => a + e.montant, 0);
    let creances = 0;
    balances().forEach((b) => (creances += b.rest));
    const byCat: Record<string, number> = { Salaires: salPaid };
    expPaid.forEach((e) => (byCat[e.categorie] = (byCat[e.categorie] ?? 0) + e.montant));
    const months: string[] = [];
    const y = db.get('years', db.get('school', 'main')?.anneeCourante);
    for (let d = new Date((y?.debut ?? '2024-09-01') + 'T12:00:00'); d <= new Date((y?.fin ?? '2025-06-30') + 'T12:00:00'); d.setMonth(d.getMonth() + 1)) months.push(d.toISOString().slice(0, 7));
    const revM = months.map((m) => paid.filter((p) => p.date.startsWith(m)).reduce((a, p) => a + p.montant, 0));
    const depM = months.map((m) => salaries.filter((s) => s.statut === 'Payé' && s.periode === m).reduce((a, s) => a + s.montant + s.primes - s.retenues, 0) + expPaid.filter((e) => e.date.startsWith(m)).reduce((a, e) => a + e.montant, 0));
    let run = 0;
    const soldeM = months.map((_, i) => (run += revM[i] - depM[i]));
    const dettes = salaries.filter((s) => s.statut === 'En attente').reduce((a, s) => a + s.montant, 0) + expenses.filter((e) => e.statut === 'En attente').reduce((a, e) => a + e.montant, 0);
    const immo = projects.reduce((a, p) => a + p.depense, 0) + expPaid.filter((e) => e.categorie === 'Infrastructures').reduce((a, e) => a + e.montant, 0);
    return { revenus, depenses, solde: revenus - depenses, creances, byCat, months, revM, depM, soldeM, dettes, immo };
  }, [payments, expenses, salaries, projects]);
}

export default function Finance() {
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>((params.get('tab') as Tab) ?? 'apercu');
  const [payForm, setPayForm] = useState<string | null>(null);
  const [expForm, setExpForm] = useState<Partial<Expense> | null>(null);
  const [projForm, setProjForm] = useState<Partial<Project> | null>(null);
  const session = useSession()!;
  const canWrite = session.can('finance', 'write');
  useEffect(() => { if (params.get('new')) { setPayForm(params.get('eleve') ?? ''); setParams({ tab: 'paiements' }, { replace: true }); } }, [params]); // eslint-disable-line
  const actions = { pay: () => setPayForm(''), exp: () => setExpForm({}), proj: () => setProjForm({}) };
  return (
    <>
      <PageHead title="Finance" sub="Gérez les paiements, les dépenses, la comptabilité et les projets de l'établissement."
        actions={canWrite && <>
          <Menu trigger={<button className="btn">Actions rapides<ChevronDown /></button>} items={[
            { label: 'Ajouter un paiement (élève)', icon: <Receipt />, onClick: actions.pay },
            { label: 'Enregistrer une dépense', icon: <TrendingDown />, onClick: actions.exp },
            { label: 'Créer un projet', icon: <FolderKanban />, onClick: actions.proj },
            { label: 'Générer un état financier', icon: <FileText />, onClick: () => setTab('rapports') },
          ]} />
          <Menu trigger={<button className="btn btn-primary"><Plus />Nouveau<ChevronDown /></button>} items={[
            { label: 'Paiement élève', icon: <Receipt />, onClick: actions.pay },
            { label: 'Dépense', icon: <TrendingDown />, onClick: actions.exp },
            { label: 'Projet', icon: <FolderKanban />, onClick: actions.proj },
          ]} />
        </>} />
      <Tabs tabs={[['apercu', 'Vue d’ensemble'], ['paiements', 'Paiements élèves'], ['salaires', 'Salaires et personnels'], ['depenses', 'Dépenses'], ['comptabilite', 'Comptabilité'], ['projets', 'Projets'], ['rapports', 'Rapports']]} value={tab} onChange={(t) => { setTab(t); setParams({ tab: t }, { replace: true }); }} />
      {tab === 'apercu' && <Overview go={setTab} actions={actions} canWrite={canWrite} />}
      {tab === 'paiements' && <Payments onNew={actions.pay} canWrite={canWrite} />}
      {tab === 'salaires' && <Salaries canWrite={canWrite} />}
      {tab === 'depenses' && <Expenses onNew={actions.exp} canWrite={canWrite} />}
      {tab === 'comptabilite' && <Journal />}
      {tab === 'projets' && <Projects onEdit={setProjForm} canWrite={canWrite} />}
      {tab === 'rapports' && <Reports />}
      {payForm !== null && <PaymentForm eleveId={payForm} onClose={() => setPayForm(null)} />}
      {expForm && <ExpenseForm value={expForm} onClose={() => setExpForm(null)} />}
      {projForm && <ProjectForm value={projForm} onClose={() => setProjForm(null)} />}
    </>
  );
}

function Overview({ go, actions, canWrite }: { go: (t: Tab) => void; actions: { pay: () => void; exp: () => void; proj: () => void }; canWrite: boolean }) {
  const t = useFinanceTotals();
  const payments = useCollection('payments');
  const students = useCollection('students');
  const staff = useCollection('staff');
  const salaries = useCollection('salaries');
  const projects = useCollection('projects');
  const classes = useCollection('classes').slice().sort((a, b) => a.code.localeCompare(b.code, 'fr', { numeric: true })).reverse();
  const nav = useNavigate();
  const recent = [...payments].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const lastMonth = t.months[t.months.length - 1];
  const recentSal = salaries.filter((s) => s.periode === lastMonth).slice(0, 5);
  const cats = (Object.keys(CAT_COLORS) as Expense['categorie'][]).map((c) => ({ label: c, value: t.byCat[c] ?? 0, color: CAT_COLORS[c] })).filter((x) => x.value > 0);
  const b = balances();
  const byClass = classes.map((c) => { let due = 0, paid = 0; students.filter((s) => s.classeId === c.id).forEach((s) => { const x = b.get(s.id); if (x) { due += x.due; paid += x.paid; } }); return { c, due, paid, rest: due - paid, rate: due ? paid / due : 0 }; }).filter((x) => x.due > 0);
  const mi = t.months.length - 1;
  const pct = (a: number, b: number) => (b ? Math.round(((a - b) / b) * 100) : 0);
  return (
    <div className="stack">
      <div className="grid g-stats">
        <FinStat icon={<DollarSign />} tint="green" label="Revenus totaux" v={money(t.revenus)} trend={pct(t.revM[mi], t.revM[mi - 1])} />
        <FinStat icon={<TrendingUp />} tint="red" label="Dépenses totales" v={money(t.depenses)} trend={pct(t.depM[mi], t.depM[mi - 1])} invert />
        <FinStat icon={<BarChart3 />} tint="blue" label="Solde disponible" v={money(t.solde)} trend={pct(t.soldeM[mi], t.soldeM[mi - 1])} />
        <FinStat icon={<PieChart />} tint="orange" label="Créances élèves" v={money(t.creances)} sub="à recouvrer" />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))' }}>
        <Card title="Évolution des revenus et dépenses" actions={<div className="chart-legend"><span><i style={{ background: '#22b35e' }} />Revenus</span><span><i style={{ background: '#ef5b6b' }} />Dépenses</span><span><i style={{ background: '#1463f3', height: 3 }} />Solde</span></div>}>
          <BarChart labels={t.months.map((m) => monthShort(Number(m.slice(5))))} series={[{ label: 'Revenus', color: '#22b35e', values: t.revM }, { label: 'Dépenses', color: '#ef5b6b', values: t.depM }]} line={{ label: 'Solde', color: '#1463f3', values: t.revM.map((r, i) => Math.max(0, r - t.depM[i])) }} format={moneyShort} ticks={4} barWidth={13} />
        </Card>
        <Card title="Répartition des dépenses">
          <div className="row wrap" style={{ gap: 18, justifyContent: 'center' }}>
            <Donut parts={cats} size={170} thickness={30} center={<div><b style={{ fontSize: 15 }}>{money(t.depenses)}</b><div className="tiny muted">Total</div></div>} />
            <div className="donut-legend grow" style={{ minWidth: 150 }}>{cats.map((c) => <div key={c.label}><i style={{ background: c.color }} />{c.label}<b>{Math.round((c.value / t.depenses) * 100)}%</b></div>)}</div>
          </div>
        </Card>
        {canWrite && (
          <Card title="Actions rapides">
            <div className="grid g-2" style={{ gap: 10 }}>
              <QuickTile icon={<Receipt />} tint="green" label="Ajouter un paiement (élève)" onClick={actions.pay} />
              <QuickTile icon={<BadgeCheck />} tint="blue" label="Valider un paiement (employé)" onClick={() => go('salaires')} />
              <QuickTile icon={<CircleDollarSign />} tint="red" label="Enregistrer une dépense" onClick={actions.exp} />
              <QuickTile icon={<FolderKanban />} tint="orange" label="Créer un projet" onClick={actions.proj} />
              <QuickTile icon={<BarChart3 />} tint="violet" label="Voir les rapports" onClick={() => nav('/rapports')} />
              <QuickTile icon={<FileText />} tint="green" label="Générer un état financier" onClick={() => go('rapports')} />
            </div>
          </Card>
        )}
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))' }}>
        <Card title="Derniers paiements élèves" link="Voir tout" onLink={() => go('paiements')} pad={false}>
          <div className="table-wrap"><table className="t t-compact"><thead><tr><th>Date</th><th>Élève</th><th>Classe</th><th className="num">Montant</th><th>Mode</th><th>Statut</th></tr></thead>
            <tbody>{recent.map((p) => { const s = students.find((x) => x.id === p.eleveId); return <tr key={p.id}><td style={{ whiteSpace: 'nowrap' }}>{dateShort(p.date)}</td><td><div className="person"><Avatar src={s?.photo} name={fullName(s)} size={26} /><b style={{ color: 'var(--primary)' }}>{fullName(s)}</b></div></td><td>{classes.find((c) => c.id === p.classeId)?.code}</td><td className="num">{money(p.montant)}</td><td>{p.mode}</td><td><StatusBadge s={p.statut} /></td></tr>; })}</tbody></table></div>
        </Card>
        <Card title="Salaires du personnel" link="Voir tout" onLink={() => go('salaires')} pad={false}>
          <div className="table-wrap"><table className="t t-compact"><thead><tr><th>Nom</th><th>Poste</th><th className="num">Salaire</th><th>Période</th><th>Statut</th></tr></thead>
            <tbody>{recentSal.map((x) => { const s = staff.find((y) => y.id === x.staffId); return <tr key={x.id}><td><div className="person"><Avatar src={s?.photo} name={fullName(s)} size={26} /><b style={{ color: 'var(--primary)' }}>{fullName(s)}</b></div></td><td>{s?.poste}</td><td className="num">{money(x.montant)}</td><td>{monthLabel(x.periode)}</td><td><StatusBadge s={x.statut} /></td></tr>; })}</tbody></table></div>
        </Card>
        <Card title="Projets en cours" link="Voir tout" onLink={() => go('projets')} pad={false}>
          <div className="table-wrap"><table className="t t-compact"><thead><tr><th>Projet</th><th className="num">Budget</th><th>Dépensé</th><th>Statut</th></tr></thead>
            <tbody>{projects.map((p) => <tr key={p.id}><td>{p.nom}</td><td className="num">{money(p.budget)}</td><td style={{ minWidth: 110 }}>{money(p.depense)}<div className="bar mt-8" style={{ height: 5 }}><i style={{ width: `${(p.depense / p.budget) * 100}%`, background: p.statut === 'Planifié' ? 'var(--primary)' : 'var(--green)' }} /></div><span className="tiny muted">{Math.round((p.depense / p.budget) * 100)}%</span></td><td><StatusBadge s={p.statut} /></td></tr>)}</tbody></table></div>
        </Card>
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))' }}>
        <Card title="Créances par classe" link="Voir tout" onLink={() => go('paiements')} pad={false}>
          <div className="table-wrap"><table className="t t-compact"><thead><tr><th>Classe</th><th className="num">Total dû</th><th className="num">Payé</th><th className="num">Restant</th><th>Taux de paiement</th></tr></thead>
            <tbody>{byClass.slice(0, 6).map((x) => <tr key={x.c.id}><td>{x.c.code}</td><td className="num">{money(x.due)}</td><td className="num">{money(x.paid)}</td><td className="num" style={{ color: x.rate < 0.75 ? 'var(--red)' : undefined }}>{money(x.rest)}</td><td><div className="row" style={{ gap: 8 }}><span style={{ width: 34, color: x.rate < 0.6 ? 'var(--red)' : x.rate < 0.7 ? 'var(--orange)' : undefined }}>{Math.round(x.rate * 100)}%</span><div className="bar grow" style={{ minWidth: 60 }}><i style={{ width: `${x.rate * 100}%`, background: x.rate < 0.6 ? 'var(--red)' : x.rate < 0.7 ? 'var(--orange)' : 'var(--green)' }} /></div></div></td></tr>)}</tbody></table></div>
        </Card>
        <Card title="Balance comptable (aperçu)" link="Voir le journal" onLink={() => go('comptabilite')}>
          <div className="grid g-2" style={{ gap: 10 }}>
            <div><div style={{ background: 'var(--green-50)', borderRadius: 10, padding: 12 }}><div className="small bold" style={{ color: 'var(--ink)' }}>Actifs</div><div style={{ fontSize: 20, fontWeight: 800, color: 'var(--green)' }}>{money(t.solde + t.creances + t.immo)}</div></div>
              <div className="info mt-8"><div>Trésorerie</div><div className="right">{money(t.solde)}</div><div>Créances</div><div className="right">{money(t.creances)}</div><div>Immobilisations</div><div className="right">{money(t.immo)}</div></div></div>
            <div><div style={{ background: 'var(--red-50)', borderRadius: 10, padding: 12 }}><div className="small bold" style={{ color: 'var(--ink)' }}>Passifs</div><div style={{ fontSize: 20, fontWeight: 800, color: 'var(--red)' }}>{money(t.dettes)}</div></div>
              <div className="info mt-8"><div>Salaires à payer</div><div className="right">{money(salaries.filter((s) => s.statut === 'En attente').reduce((a, s) => a + s.montant, 0))}</div><div>Autres dettes</div><div className="right">{money(t.dettes - salaries.filter((s) => s.statut === 'En attente').reduce((a, s) => a + s.montant, 0))}</div></div>
              <div className="row between mt-8" style={{ background: 'var(--green-50)', borderRadius: 10, padding: 10 }}><b className="small">Capitaux propres</b><b>{money(t.solde + t.creances + t.immo - t.dettes)}</b></div></div>
          </div>
        </Card>
        <Card title="Rapports financiers" actions={<button className="btn btn-soft btn-sm" onClick={() => go('rapports')}>Générer</button>}>
          <ReportList />
        </Card>
      </div>
    </div>
  );
}

function FinStat({ icon, tint, label, v, trend, sub, invert }: { icon: React.ReactNode; tint: string; label: string; v: string; trend?: number; sub?: string; invert?: boolean }) {
  const up = (trend ?? 0) >= 0;
  return (
    <div className="card stat">
      <div className={`ic tint-${tint}`}>{icon}</div>
      <div className="grow">
        <div className="l" style={{ fontWeight: 500 }}>{label}</div>
        <div className="v" style={{ fontSize: 22 }}>{v}</div>
        <div className="s">{trend !== undefined ? <><span className={up !== !!invert ? 'trend-up' : 'trend-down'}>{up ? '↗' : '↘'} {up ? '+' : ''}{trend}%</span> vs mois précédent</> : sub}</div>
      </div>
    </div>
  );
}
function QuickTile({ icon, tint, label, onClick }: { icon: React.ReactNode; tint: string; label: string; onClick: () => void }) {
  return <button className="row" style={{ border: '1px solid var(--line)', borderRadius: 10, padding: 10, background: '#fff', textAlign: 'left', fontSize: 12.5 }} onClick={onClick}><span className={`tint-${tint}`} style={{ width: 34, height: 34, borderRadius: 9, display: 'grid', placeItems: 'center', flex: 'none' }}>{icon}</span>{label}</button>;
}

function Payments({ onNew, canWrite }: { onNew: () => void; canWrite: boolean }) {
  const payments = useCollection('payments');
  const students = useCollection('students');
  const classes = useCollection('classes').slice().sort((a, b) => a.code.localeCompare(b.code, 'fr', { numeric: true }));
  const school = useDoc('school', 'main');
  const [view, setView] = useState<'paiements' | 'creances'>('paiements');
  const [q, setQ] = useState('');
  const [classe, setClasse] = useState('all');
  const [mode, setMode] = useState('all');
  const [statut, setStatut] = useState('all');
  const sMap = new Map(students.map((s) => [s.id, s]));
  const list = useMemo(() => payments.filter((p) => (classe === 'all' || p.classeId === classe) && (mode === 'all' || p.mode === mode) && (statut === 'all' || p.statut === statut) && (!q || norm(`${fullName(sMap.get(p.eleveId))} ${p.recu} ${p.reference ?? ''}`).includes(norm(q)))).sort((a, b) => b.date.localeCompare(a.date)), [payments, classe, mode, statut, q]); // eslint-disable-line
  const paged = usePaged(list, 15);
  const b = balances();
  const debtors = students.filter((s) => s.statut === 'Actif' && (classe === 'all' || s.classeId === classe) && (b.get(s.id)?.rest ?? 0) > 0 && (!q || norm(fullName(s)).includes(norm(q)))).sort((x, y) => (b.get(y.id)?.rest ?? 0) - (b.get(x.id)?.rest ?? 0));
  const total = list.filter((p) => p.statut === 'Payé').reduce((a, p) => a + p.montant, 0);
  return (
    <>
      <div className="card card-pad row wrap mb-16" style={{ gap: 12, alignItems: 'flex-end' }}>
        <div className="seg" style={{ minWidth: 260 }}><button className={view === 'paiements' ? 'active' : ''} onClick={() => setView('paiements')}>Paiements</button><button className={view === 'creances' ? 'active' : ''} onClick={() => setView('creances')}>Élèves en retard ({students.filter((s) => s.statut === 'Actif' && (b.get(s.id)?.rest ?? 0) > 0).length})</button></div>
        <div style={{ flex: '1 1 220px' }}><SearchInput value={q} onChange={setQ} placeholder="Élève, n° de reçu, référence..." /></div>
        <select className="select" style={{ width: 150 }} value={classe} onChange={(e) => setClasse(e.target.value)}><option value="all">Toutes classes</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}</select>
        {view === 'paiements' && <><select className="select" style={{ width: 140 }} value={mode} onChange={(e) => setMode(e.target.value)}><option value="all">Tous modes</option>{MODES.map((m) => <option key={m}>{m}</option>)}</select>
          <select className="select" style={{ width: 140 }} value={statut} onChange={(e) => setStatut(e.target.value)}><option value="all">Tous statuts</option><option>Payé</option><option>En attente</option><option>Annulé</option></select></>}
        <button className="btn" onClick={() => downloadCSV('paiements.csv', [['Reçu', 'Date', 'Élève', 'Classe', 'Motif', 'Montant', 'Mode', 'Référence', 'Statut'], ...list.map((p) => [p.recu, p.date, fullName(sMap.get(p.eleveId)), classes.find((c) => c.id === p.classeId)?.code, p.motif, p.montant, p.mode, p.reference, p.statut])])}><FileSpreadsheet />Excel</button>
        {canWrite && <button className="btn btn-primary" onClick={onNew}><Plus />Paiement</button>}
      </div>
      {view === 'paiements' ? (
        <div className="card">
          <div className="card-pad small muted" style={{ paddingBottom: 0 }}>{list.length} opérations · Total encaissé : <b style={{ color: 'var(--ink)' }}>{money(total, school?.monnaie)}</b></div>
          <div className="table-wrap"><table className="t">
            <thead><tr><th>Reçu</th><th>Date</th><th>Élève</th><th className="only-desktop">Classe</th><th>Motif</th><th className="num">Montant</th><th className="only-desktop">Mode</th><th>Statut</th><th /></tr></thead>
            <tbody>{paged.items.map((p) => { const s = sMap.get(p.eleveId); return (
              <tr key={p.id}><td className="small">{p.recu}</td><td style={{ whiteSpace: 'nowrap' }}>{dateShort(p.date)}</td><td><div className="person"><Avatar src={s?.photo} name={fullName(s)} size={28} /><b>{fullName(s)}</b></div></td><td className="only-desktop">{classes.find((c) => c.id === p.classeId)?.code}</td><td className="small">{p.motif}{p.versement ? ` · ${p.versement}` : ''}</td><td className="num bold">{money(p.montant)}</td><td className="only-desktop">{p.mode}</td><td><StatusBadge s={p.statut} /></td>
                <td><Menu items={[
                  { label: 'Imprimer le reçu', icon: <Printer />, onClick: () => printDocument(<ReceiptSheet payment={p} />, 'A4 portrait', p.recu) },
                  ...(canWrite && p.statut === 'En attente' ? [{ label: 'Confirmer le paiement', icon: <CheckCircle2 />, onClick: () => { db.patch('payments', p.id, { statut: 'Payé' }); toast('Paiement confirmé'); } }] : []),
                  ...(canWrite && p.statut !== 'Annulé' ? [{ label: 'Annuler', icon: <Wallet />, danger: true, onClick: () => { db.patch('payments', p.id, { statut: 'Annulé' }); audit('Annulation paiement', p.recu); toast('Paiement annulé'); } }] : []),
                ]} /></td></tr>); })}</tbody>
          </table></div>
          <Pager {...paged} />
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap"><table className="t">
            <thead><tr><th>Élève</th><th>Classe</th><th className="num">Dû</th><th className="num">Payé</th><th className="num">Restant</th><th>Parent</th><th /></tr></thead>
            <tbody>{debtors.slice(0, 100).map((s) => { const x = b.get(s.id)!; const g = db.get('guardians', s.tuteurIds[0]); return (
              <tr key={s.id}><td><div className="person"><Avatar src={s.photo} name={fullName(s)} size={28} /><b>{fullName(s)}</b></div></td><td>{classes.find((c) => c.id === s.classeId)?.code}</td><td className="num">{money(x.due)}</td><td className="num">{money(x.paid)}</td><td className="num bold" style={{ color: 'var(--red)' }}>{money(x.rest)}</td><td className="small">{g?.telephone}</td>
                <td>{g && <a className="btn btn-sm btn-soft" target="_blank" rel="noreferrer" href={`https://wa.me/${g.telephone.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour ${civ(g)}, ${school?.nom} vous rappelle qu'un solde de ${money(x.rest)} reste à payer pour la scolarité de ${fullName(s)}. Paiement possible par MonCash ou au secrétariat. Merci.`)}`}>Rappel WhatsApp</a>}</td></tr>); })}</tbody>
          </table></div>
          {debtors.length === 0 && <Empty title="Aucun élève en retard de paiement" />}
        </div>
      )}
    </>
  );
}

function PaymentForm({ eleveId, onClose }: { eleveId: string; onClose: () => void }) {
  const students = useCollection('students').filter((s) => s.statut === 'Actif');
  const [q, setQ] = useState('');
  const [sid, setSid] = useState(eleveId);
  const s = students.find((x) => x.id === sid);
  const bal = s ? balances().get(s.id) : undefined;
  const existing = useCollection('payments').filter((p) => p.eleveId === sid && p.motif === 'Scolarité' && p.statut === 'Payé').length;
  const [f, setF] = useState({ montant: 0, mode: 'MonCash' as PaymentMode, motif: 'Scolarité' as Payment['motif'], reference: '', date: todayISO() });
  const matches = q.length >= 2 ? students.filter((x) => norm(`${fullName(x)} ${x.matricule}`).includes(norm(q))).slice(0, 6) : [];
  const save = (print: boolean) => {
    if (!s) return toast('Choisissez un élève', true);
    const montant = f.montant || Math.round(bal?.rest ?? 0);
    if (montant <= 0) return toast('Montant invalide', true);
    const p = db.put('payments', { recu: nextReceipt(), eleveId: s.id, classeId: s.classeId, date: f.date, montant, mode: f.mode, motif: f.motif, versement: f.motif === 'Scolarité' ? ['1er versement', '2e versement', '3e versement'][existing] ?? 'Complément' : undefined, reference: f.reference || undefined, statut: 'Payé' });
    audit('Paiement', `${p.recu} ${fullName(s)} ${money(montant)}`);
    toast(`Paiement enregistré — ${p.recu}`);
    if (print) printDocument(<ReceiptSheet payment={p} />, 'A4 portrait', p.recu);
    onClose();
  };
  return (
    <Modal open onClose={onClose} title="Enregistrer un paiement" footer={<><button className="btn" onClick={onClose}>Annuler</button><button className="btn" onClick={() => save(false)}>Enregistrer</button><button className="btn btn-primary" onClick={() => save(true)}><Printer />Enregistrer et imprimer le reçu</button></>}>
      {!s ? (
        <>
          <SearchInput value={q} onChange={setQ} placeholder="Rechercher l’élève (nom ou matricule)..." />
          <div className="list mt-8">{matches.map((x) => <button key={x.id} className="list-item" style={{ border: 0, width: '100%', textAlign: 'left' }} onClick={() => setSid(x.id)}><Avatar src={x.photo} name={fullName(x)} size={32} /><span className="grow">{fullName(x)}<br /><span className="tiny muted">{x.matricule} · {db.get('classes', x.classeId)?.code}</span></span></button>)}</div>
        </>
      ) : (
        <>
          <div className="row mb-16" style={{ background: 'var(--bg)', borderRadius: 12, padding: 12 }}>
            <Avatar src={s.photo} name={fullName(s)} size={44} />
            <div className="grow"><b style={{ color: 'var(--ink)' }}>{fullName(s)}</b><div className="tiny muted">{s.matricule} · {db.get('classes', s.classeId)?.code}</div></div>
            <div className="right small">Reste à payer<br /><b style={{ color: bal?.rest ? 'var(--red)' : 'var(--green)', fontSize: 15 }}>{money(bal?.rest ?? 0)}</b></div>
            {!eleveId && <button className="btn btn-sm" onClick={() => setSid('')}>Changer</button>}
          </div>
          <div className="form-grid">
            <Field label="Motif"><select className="select" value={f.motif} onChange={(e) => setF({ ...f, motif: e.target.value as Payment['motif'] })}>{['Scolarité', 'Inscription', 'Uniforme', 'Livres', 'Examen officiel', 'Autre'].map((m) => <option key={m}>{m}</option>)}</select></Field>
            <Field label="Montant (G)"><input type="number" className="input" value={f.montant || Math.round(bal?.rest ?? 0) || ''} onChange={(e) => setF({ ...f, montant: Number(e.target.value) })} /></Field>
            <Field label="Mode de paiement"><select className="select" value={f.mode} onChange={(e) => setF({ ...f, mode: e.target.value as PaymentMode })}>{MODES.map((m) => <option key={m}>{m}</option>)}</select></Field>
            <Field label="Date"><input type="date" className="input" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
            {f.mode !== 'Espèces' && <Field label={f.mode === 'Chèque' ? 'N° de chèque' : 'N° de transaction'} className="span-2"><input className="input" value={f.reference} onChange={(e) => setF({ ...f, reference: e.target.value })} placeholder={f.mode === 'MonCash' ? 'Ex. MC12345678' : ''} /></Field>}
          </div>
        </>
      )}
    </Modal>
  );
}

function Salaries({ canWrite }: { canWrite: boolean }) {
  const salaries = useCollection('salaries');
  const staff = useCollection('staff');
  const months = [...new Set(salaries.map((s) => s.periode))].sort().reverse();
  const [m, setM] = useState(months[0]);
  const list = salaries.filter((s) => s.periode === m);
  const pending = list.filter((s) => s.statut === 'En attente');
  const pay = (s: Salary) => { db.patch('salaries', s.id, { statut: 'Payé', datePaiement: todayISO() }); audit('Paiement salaire', `${civ(staff.find((x) => x.id === s.staffId))} ${s.periode}`); };
  const generate = () => {
    const next = new Date(m + '-15'); next.setMonth(next.getMonth() + 1);
    const p = next.toISOString().slice(0, 7);
    if (salaries.some((s) => s.periode === p)) return toast('Ce mois existe déjà', true);
    db.bulkPut('salaries', staff.filter((s) => s.statut === 'Actif').map((s) => ({ id: `sal-${s.id}-${p.replace('-', '')}`, staffId: s.id, periode: p, montant: s.salaire, primes: 0, retenues: Math.round(s.salaire * 0.02), statut: 'En attente' as const, mode: s.modePaiement })));
    setM(p);
    toast(`Fiches de paie de ${monthLabel(p)} créées`);
  };
  return (
    <>
      <div className="card card-pad row wrap mb-16" style={{ gap: 12 }}>
        <select className="select" style={{ width: 200 }} value={m} onChange={(e) => setM(e.target.value)}>{months.map((x) => <option key={x} value={x}>{monthLabel(x)}</option>)}</select>
        <span className="small muted grow">Total net : <b style={{ color: 'var(--ink)' }}>{money(list.reduce((a, s) => a + s.montant + s.primes - s.retenues, 0))}</b> · {pending.length} en attente</span>
        {canWrite && pending.length > 0 && <button className="btn btn-success" onClick={() => { pending.forEach(pay); toast(`${pending.length} salaires payés`); }}><CheckCircle2 />Tout valider</button>}
        {canWrite && <button className="btn btn-primary" onClick={generate}><Plus />Mois suivant</button>}
      </div>
      <div className="card"><div className="table-wrap"><table className="t">
        <thead><tr><th>Nom</th><th className="only-desktop">Poste</th><th className="num">Salaire</th><th className="num">Primes</th><th className="num">Retenues</th><th className="num">Net</th><th className="only-desktop">Mode</th><th>Statut</th><th /></tr></thead>
        <tbody>{list.map((x) => { const s = staff.find((y) => y.id === x.staffId); return (
          <tr key={x.id}><td><div className="person"><Avatar src={s?.photo} name={fullName(s)} size={28} /><b>{fullName(s)}</b></div></td><td className="only-desktop">{s?.poste}</td><td className="num">{money(x.montant)}</td>
            <td className="num">{canWrite && x.statut === 'En attente' ? <input type="number" className="input" style={{ width: 100 }} value={x.primes} onChange={(e) => db.patch('salaries', x.id, { primes: Number(e.target.value) })} /> : money(x.primes)}</td>
            <td className="num">{money(x.retenues)}</td><td className="num bold">{money(x.montant + x.primes - x.retenues)}</td><td className="only-desktop">{x.mode}</td><td><StatusBadge s={x.statut} /></td>
            <td>{canWrite && x.statut === 'En attente' && <button className="btn btn-sm btn-soft" onClick={() => { pay(x); toast('Salaire payé'); }}>Payer</button>}</td></tr>); })}</tbody>
      </table></div></div>
    </>
  );
}

function Expenses({ onNew, canWrite }: { onNew: () => void; canWrite: boolean }) {
  const expenses = useCollection('expenses');
  const [cat, setCat] = useState('all');
  const list = expenses.filter((e) => cat === 'all' || e.categorie === cat).sort((a, b) => b.date.localeCompare(a.date));
  const paged = usePaged(list, 15);
  return (
    <>
      <div className="card card-pad row wrap mb-16" style={{ gap: 12 }}>
        <select className="select" style={{ width: 220 }} value={cat} onChange={(e) => setCat(e.target.value)}><option value="all">Toutes les catégories</option>{Object.keys(CAT_COLORS).filter((c) => c !== 'Salaires').map((c) => <option key={c}>{c}</option>)}</select>
        <span className="small muted grow">Total : <b style={{ color: 'var(--ink)' }}>{money(list.reduce((a, e) => a + e.montant, 0))}</b></span>
        <button className="btn" onClick={() => downloadCSV('depenses.csv', [['Date', 'Catégorie', 'Libellé', 'Montant', 'Mode', 'Statut'], ...list.map((e) => [e.date, e.categorie, e.libelle, e.montant, e.mode, e.statut])])}><FileSpreadsheet />Excel</button>
        {canWrite && <button className="btn btn-primary" onClick={onNew}><Plus />Dépense</button>}
      </div>
      <div className="card"><div className="table-wrap"><table className="t">
        <thead><tr><th>Date</th><th>Catégorie</th><th>Libellé</th><th className="num">Montant</th><th className="only-desktop">Mode</th><th>Statut</th></tr></thead>
        <tbody>{paged.items.map((e) => <tr key={e.id}><td style={{ whiteSpace: 'nowrap' }}>{dateShort(e.date)}</td><td><span className="row" style={{ gap: 6 }}><i style={{ width: 8, height: 8, borderRadius: 4, background: CAT_COLORS[e.categorie] }} />{e.categorie}</span></td><td>{e.libelle}</td><td className="num bold">{money(e.montant)}</td><td className="only-desktop">{e.mode}</td><td><StatusBadge s={e.statut} /></td></tr>)}</tbody>
      </table></div><Pager {...paged} /></div>
    </>
  );
}

function ExpenseForm({ value, onClose }: { value: Partial<Expense>; onClose: () => void }) {
  const projects = useCollection('projects');
  const [f, setF] = useState<Partial<Expense>>({ date: todayISO(), categorie: 'Fonctionnement', mode: 'Espèces', statut: 'Payé', ...value });
  const save = () => {
    if (!f.libelle || !f.montant) return toast('Libellé et montant requis', true);
    db.put('expenses', f as Expense);
    if (f.projetId) { const p = db.get('projects', f.projetId); if (p) db.patch('projects', p.id, { depense: p.depense + f.montant }); }
    audit('Dépense', `${f.libelle} ${money(f.montant)}`);
    toast('Dépense enregistrée');
    onClose();
  };
  return (
    <Modal open onClose={onClose} title="Enregistrer une dépense" footer={<><button className="btn" onClick={onClose}>Annuler</button><button className="btn btn-primary" onClick={save}>Enregistrer</button></>}>
      <div className="form-grid">
        <Field label="Libellé" req className="span-2"><input className="input" value={f.libelle ?? ''} onChange={(e) => setF({ ...f, libelle: e.target.value })} placeholder="Ex. Carburant génératrice" /></Field>
        <Field label="Catégorie"><select className="select" value={f.categorie} onChange={(e) => setF({ ...f, categorie: e.target.value as Expense['categorie'] })}>{Object.keys(CAT_COLORS).filter((c) => c !== 'Salaires').map((c) => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Montant (G)" req><input type="number" className="input" value={f.montant ?? ''} onChange={(e) => setF({ ...f, montant: Number(e.target.value) })} /></Field>
        <Field label="Date"><input type="date" className="input" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
        <Field label="Mode"><select className="select" value={f.mode} onChange={(e) => setF({ ...f, mode: e.target.value as PaymentMode })}>{MODES.map((m) => <option key={m}>{m}</option>)}</select></Field>
        <Field label="Fournisseur" opt><input className="input" value={f.fournisseur ?? ''} onChange={(e) => setF({ ...f, fournisseur: e.target.value })} /></Field>
        <Field label="Statut"><select className="select" value={f.statut} onChange={(e) => setF({ ...f, statut: e.target.value as Expense['statut'] })}><option>Payé</option><option>En attente</option></select></Field>
        {f.categorie === 'Projets' && <Field label="Projet" className="span-2"><select className="select" value={f.projetId ?? ''} onChange={(e) => setF({ ...f, projetId: e.target.value || undefined })}><option value="">—</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}</select></Field>}
      </div>
    </Modal>
  );
}

function Journal() {
  const payments = useCollection('payments').filter((p) => p.statut === 'Payé');
  const expenses = useCollection('expenses').filter((e) => e.statut === 'Payé');
  const salaries = useCollection('salaries').filter((s) => s.statut === 'Payé');
  const staff = useCollection('staff');
  const students = useCollection('students');
  const rows = useMemo(() => {
    const r = [
      ...payments.map((p) => ({ date: p.date, ref: p.recu, lib: `${p.motif} — ${fullName(students.find((s) => s.id === p.eleveId))}`, compte: '706 Scolarité', debit: 0, credit: p.montant })),
      ...expenses.map((e) => ({ date: e.date, ref: e.id.slice(-6).toUpperCase(), lib: e.libelle, compte: `6xx ${e.categorie}`, debit: e.montant, credit: 0 })),
      ...salaries.map((s) => ({ date: s.datePaiement ?? `${s.periode}-28`, ref: `PAIE-${s.periode}`, lib: `Salaire ${fullName(staff.find((x) => x.id === s.staffId))}`, compte: '641 Salaires', debit: s.montant + s.primes - s.retenues, credit: 0 })),
    ].sort((a, b) => a.date.localeCompare(b.date));
    let solde = 0;
    return r.map((x) => ({ ...x, solde: (solde += x.credit - x.debit) })).reverse();
  }, [payments, expenses, salaries, staff, students]);
  const paged = usePaged(rows, 20);
  return (
    <div className="card">
      <div className="card-pad row wrap"><span className="small muted grow">Journal général — {rows.length} écritures (recettes, dépenses et salaires payés).</span>
        <button className="btn" onClick={() => downloadCSV('journal.csv', [['Date', 'Pièce', 'Libellé', 'Compte', 'Débit', 'Crédit', 'Solde'], ...rows.map((r) => [r.date, r.ref, r.lib, r.compte, r.debit, r.credit, r.solde])])}><FileSpreadsheet />Excel</button></div>
      <div className="table-wrap"><table className="t t-compact">
        <thead><tr><th>Date</th><th>Pièce</th><th>Libellé</th><th className="only-desktop">Compte</th><th className="num">Débit</th><th className="num">Crédit</th><th className="num">Solde</th></tr></thead>
        <tbody>{paged.items.map((r, i) => <tr key={i}><td style={{ whiteSpace: 'nowrap' }}>{dateShort(r.date)}</td><td className="small">{r.ref}</td><td>{r.lib}</td><td className="only-desktop small muted">{r.compte}</td><td className="num" style={{ color: 'var(--red)' }}>{r.debit ? money(r.debit) : ''}</td><td className="num" style={{ color: 'var(--green)' }}>{r.credit ? money(r.credit) : ''}</td><td className="num bold">{money(r.solde)}</td></tr>)}</tbody>
      </table></div><Pager {...paged} />
    </div>
  );
}

function Projects({ onEdit, canWrite }: { onEdit: (p: Partial<Project>) => void; canWrite: boolean }) {
  const projects = useCollection('projects');
  return (
    <div className="grid g-3">
      {projects.map((p) => (
        <div key={p.id} className="card card-pad">
          <div className="row between"><b style={{ color: 'var(--ink)', fontSize: 15 }}>{p.nom}</b><StatusBadge s={p.statut} /></div>
          {p.description && <p className="small muted mt-8">{p.description}</p>}
          <div className="row between small mt-12"><span>Dépensé {money(p.depense)}</span><span className="muted">Budget {money(p.budget)}</span></div>
          <div className="bar mt-8"><i style={{ width: `${Math.min(100, (p.depense / p.budget) * 100)}%`, background: p.depense > p.budget ? 'var(--red)' : 'var(--green)' }} /></div>
          <div className="row between mt-12"><span className="tiny muted">Début : {dateShort(p.debut)}</span>{canWrite && <button className="btn btn-sm" onClick={() => onEdit(p)}>Modifier</button>}</div>
        </div>
      ))}
      {canWrite && <button className="card card-pad upload" onClick={() => onEdit({})}><Plus /><b>Nouveau projet</b></button>}
    </div>
  );
}

function ProjectForm({ value, onClose }: { value: Partial<Project>; onClose: () => void }) {
  const [f, setF] = useState<Partial<Project>>({ statut: 'Planifié', depense: 0, debut: todayISO(), ...value });
  return (
    <Modal open onClose={onClose} title={value.id ? 'Modifier le projet' : 'Créer un projet'} footer={<><button className="btn" onClick={onClose}>Annuler</button><button className="btn btn-primary" onClick={() => { if (!f.nom || !f.budget) return toast('Nom et budget requis', true); db.put('projects', f as Project); toast('Projet enregistré'); onClose(); }}>Enregistrer</button></>}>
      <div className="form-grid">
        <Field label="Nom" req className="span-2"><input className="input" value={f.nom ?? ''} onChange={(e) => setF({ ...f, nom: e.target.value })} /></Field>
        <Field label="Budget (G)" req><input type="number" className="input" value={f.budget ?? ''} onChange={(e) => setF({ ...f, budget: Number(e.target.value) })} /></Field>
        <Field label="Déjà dépensé (G)"><input type="number" className="input" value={f.depense ?? 0} onChange={(e) => setF({ ...f, depense: Number(e.target.value) })} /></Field>
        <Field label="Début"><input type="date" className="input" value={f.debut} onChange={(e) => setF({ ...f, debut: e.target.value })} /></Field>
        <Field label="Statut"><select className="select" value={f.statut} onChange={(e) => setF({ ...f, statut: e.target.value as Project['statut'] })}><option>Planifié</option><option>En cours</option><option>Terminé</option></select></Field>
        <Field label="Description" opt className="span-2"><textarea className="textarea" value={f.description ?? ''} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
      </div>
    </Modal>
  );
}

const REPORTS = [
  ['revenus', 'État des revenus et dépenses', 'red'],
  ['balance', 'Balance comptable', 'green'],
  ['creances', 'Situation des créances (élèves)', 'red'],
  ['salaires', 'Rapport des salaires', 'red'],
  ['projets', 'Suivi des projets', 'green'],
] as const;
function ReportList() {
  return (
    <div className="qa">
      {REPORTS.map(([k, l, c]) => <button key={k} onClick={() => printDocument(<FinanceReportSheet kind={k} />, 'A4 portrait', l)}><FileText style={{ color: `var(--${c})` }} />{l}</button>)}
    </div>
  );
}
function Reports() {
  return (
    <div className="grid g-2">
      <Card title="États financiers à imprimer (PDF)"><ReportList /></Card>
      <Card title="Conseil"><p className="small muted">Chaque état est généré à partir des données en temps réel. Choisissez « Enregistrer au format PDF » dans la fenêtre d’impression pour l’envoyer par email ou WhatsApp.</p></Card>
    </div>
  );
}
