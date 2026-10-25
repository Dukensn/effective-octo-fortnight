// Finance du professeur : salaire, versements, taux horaires, heures de cours, historique, documents.
import { Fragment, useState } from 'react';
import { Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, CalendarCheck, Wallet, Clock, BarChart3, FileText, UserCog, Download, CheckCircle2, Hourglass, Info, School } from 'lucide-react';
import { db, useCollection, useDoc } from '../../data/store';
import type { Salary } from '../../data/types';
import { Avatar, Badge, Card, Empty, ScreenHead, toast } from '../../components/ui';
import { BarChart } from '../../components/charts';
import { dateLong, money, monthLabel } from '../../lib/format';
import { useSession, audit } from '../../lib/session';
import { printDocument } from '../../lib/print';
import { AttestationSheet, PaySlipSheet } from '../../docs/Sheets';
import { canMultiSchool, monthHours, rateFor } from '../../lib/prof';
import { monthPay, remunerationOf } from '../../lib/paie';

const thisMonth = () => new Date().toISOString().slice(0, 7);

const net = (s: Salary) => s.montant + s.primes - s.retenues;
const Wrap = ({ title, back, children }: { title: string; back: string; children: React.ReactNode }) => {
  const nav = useNavigate();
  return <div style={{ maxWidth: 760, margin: '0 auto' }}><ScreenHead center title={title} onBack={() => nav(back)} />{children}</div>;
};

/** Mois de l'année scolaire en cours (« 2024-09 » … « 2025-06 »). */
function yearMonths() {
  const y = db.get('years', db.get('school', 'main')?.anneeCourante);
  const out: string[] = [];
  if (!y) return out;
  for (let d = new Date(y.debut + 'T12:00:00'); d <= new Date(y.fin + 'T12:00:00'); d.setMonth(d.getMonth() + 1)) out.push(d.toISOString().slice(0, 7));
  return out;
}

function useMine() {
  const session = useSession()!;
  const salaries = useCollection('salaries').filter((s) => s.staffId === session.user.staffId).sort((a, b) => b.periode.localeCompare(a.periode));
  const me = useDoc('staff', session.user.staffId);
  return { session, me, salaries };
}

export default function TeacherFinance() {
  return (
    <Routes>
      <Route index element={<Overview />} />
      <Route path="versements" element={<Payments />} />
      <Route path="versements/:id" element={<PaymentDetail />} />
      <Route path="taux" element={<Rates />} />
      <Route path="heures" element={<Hours />} />
      <Route path="historique" element={<HistoryView />} />
      <Route path="documents" element={<Documents />} />
      <Route path="infos" element={<Infos />} />
    </Routes>
  );
}

function Overview() {
  const nav = useNavigate();
  const { me, salaries, session } = useMine();
  const school = useDoc('school', 'main');
  const year = useDoc('years', school?.anneeCourante);
  const months = yearMonths();
  const last = salaries[0];
  const paid = salaries.filter((s) => s.statut === 'Payé' && months.includes(s.periode));
  const pending = salaries.filter((s) => s.statut === 'En attente');
  const missing = months.filter((m) => !salaries.some((s) => s.periode === m) && m > (last?.periode ?? ''));
  const hourly = remunerationOf(me) === 'horaire';
  useCollection('pointages');
  const cur = hourly ? monthPay(me?.id, thisMonth()) : null;
  const toCome = pending.reduce((a, s) => a + net(s), 0) + (hourly ? 0 : missing.length * (me?.salaire ?? 0));
  const links: [string, string, React.ReactNode, string][] = [
    ['versements', 'Mes versements', <CalendarCheck key="v" />, 'tint-blue'],
    ['taux', 'Taux par matière', <Wallet key="t" />, 'tint-green'],
    ['heures', 'Mes heures de cours', <Clock key="h" />, 'tint-orange'],
    ['documents', 'Documents', <FileText key="d" />, 'tint-violet'],
    ['historique', 'Historique', <BarChart3 key="hi" />, 'tint-blue'],
    ['infos', 'Mes informations', <UserCog key="i" />, 'tint-green'],
  ];
  return (
    <Wrap title="Finance" back="/">
      <div className="row mb-16" style={{ gap: 12 }}>
        <Avatar src={me?.photo ?? session.user.photo} name={session.user.nom} size={52} />
        <div><b style={{ color: 'var(--ink)', fontSize: 16 }}>{session.user.nom}</b><div className="small muted">{me?.poste}{me?.specialite ? ` de ${me.specialite}` : ''}</div><div className="tiny muted row" style={{ gap: 4 }}><School size={12} />{school?.nom} · {year?.libelle}</div></div>
      </div>
      {last ? (
        <button className="fin-hero mb-12" onClick={() => nav(`versements/${last.id}`)}>
          <span className="grow"><small>Salaire du mois · {monthLabel(last.periode)}</small><b>{money(net(last), school?.monnaie)}</b><span className={`badge ${last.statut === 'Payé' ? 'b-green' : 'b-orange'}`}>{last.statut === 'Payé' ? 'Versé' : 'En attente'}</span></span>
          <ChevronRight />
        </button>
      ) : <Empty title="Aucun salaire enregistré" />}
      {cur && (
        <button className="card card-pad row mb-12" style={{ gap: 12, width: '100%', textAlign: 'left' }} onClick={() => nav('heures')}>
          <span className="tint-orange" style={{ width: 40, height: 40, borderRadius: 10, display: 'grid', placeItems: 'center' }}><Clock /></span>
          <span className="grow"><div className="tiny muted">Payé à l’heure · {monthLabel(thisMonth())}</div><b style={{ color: 'var(--ink)' }}>{cur.heures} h validées ≈ {money(cur.montant, school?.monnaie)}</b><div className="tiny muted">Touchez « Cours donné » après chaque cours</div></span>
          <ChevronRight size={18} className="chev" />
        </button>
      )}
      <div className="stat-pair mb-16">
        <div className="card card-pad"><div className="tiny muted">Total versé</div><b style={{ fontSize: 19, color: 'var(--ink)' }}>{money(paid.reduce((a, s) => a + net(s), 0), school?.monnaie)}</b><div className="tiny muted">Cette année</div></div>
        <div className="card card-pad"><div className="tiny muted">Total à venir</div><b style={{ fontSize: 19, color: 'var(--ink)' }}>{money(toCome, school?.monnaie)}</b><div className="tiny muted">{pending.length + missing.length} mois</div></div>
      </div>
      <div className="card">{links.map(([to, label, icon, tint]) => (
        <button key={to} className="sheet-row" onClick={() => nav(to)}><span className={tint} style={{ width: 34, height: 34, borderRadius: 9, display: 'grid', placeItems: 'center' }}>{icon}</span><span className="grow">{label}</span><ChevronRight size={18} className="chev" /></button>
      ))}</div>
    </Wrap>
  );
}

function Payments() {
  const nav = useNavigate();
  const { salaries } = useMine();
  const school = useDoc('school', 'main');
  const total = salaries.filter((s) => s.statut === 'Payé').reduce((a, s) => a + net(s), 0);
  return (
    <Wrap title="Mes versements" back="/prof/finance">
      <div className="card mb-12">{salaries.map((s) => (
        <button key={s.id} className="sheet-row" onClick={() => nav(s.id)}>
          <span className="grow">{monthLabel(s.periode)}</span><b style={{ color: 'var(--ink)' }}>{money(net(s), school?.monnaie)}</b>
          <Badge tone={s.statut === 'Payé' ? 'green' : 'orange'}>{s.statut === 'Payé' ? 'Versé' : 'En attente'}</Badge><ChevronRight size={18} className="chev" />
        </button>
      ))}{salaries.length === 0 && <Empty title="Aucun versement" />}</div>
      <div className="card card-pad row" style={{ gap: 12 }}><span className="tint-green" style={{ width: 40, height: 40, borderRadius: 10, display: 'grid', placeItems: 'center' }}><Wallet /></span><span><div className="tiny muted">Total versé</div><b style={{ fontSize: 19, color: 'var(--ink)' }}>{money(total, school?.monnaie)}</b><div className="tiny muted">{salaries.filter((s) => s.statut === 'Payé').length} mois</div></span></div>
    </Wrap>
  );
}

function PaymentDetail() {
  const { id } = useParams();
  const { salaries } = useMine();
  const school = useDoc('school', 'main');
  const s = salaries.find((x) => x.id === id);
  if (!s) return <Wrap title="Détail du versement" back="/prof/finance/versements"><Empty title="Versement introuvable" /></Wrap>;
  const paid = s.statut === 'Payé';
  return (
    <Wrap title="Détail du versement" back="/prof/finance/versements">
      <div className="card card-pad center mb-12" style={{ background: paid ? 'var(--green-50)' : 'var(--orange-50)', border: 0 }}>
        <div className="row" style={{ justifyContent: 'center', gap: 6, color: paid ? 'var(--green)' : 'var(--orange)', fontWeight: 600 }}>{paid ? <CheckCircle2 size={18} /> : <Hourglass size={18} />}{paid ? 'Paiement effectué' : 'Paiement en attente'}</div>
        {s.datePaiement && <div className="tiny muted">Le {dateLong(s.datePaiement)}</div>}
        <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--ink)', marginTop: 6 }}>{money(net(s), school?.monnaie)}</div>
        <div className="small">{monthLabel(s.periode)}</div>
      </div>
      <div className="card card-pad mb-12">
        <div className="info small">
          <div>École</div><div>{school?.nom}</div>
          <div>Période</div><div>{monthLabel(s.periode)}</div>
          {s.detail?.length ? s.detail.map((d) => <Fragment key={`${d.matiereId}${d.niveau}`}><div>{db.get('subjects', d.matiereId)?.nom.split(' (')[0]} · {d.niveau}</div><div>{d.heures} h × {money(d.taux)}</div></Fragment>) : null}
          <div>{s.heures != null ? `Salaire (${s.heures} h validées)` : 'Salaire de base'}</div><div>{money(s.montant)}</div>
          <div>Primes</div><div>{money(s.primes)}</div>
          <div>Retenues</div><div>− {money(s.retenues)}</div>
          <div>Mode</div><div>{s.mode}</div>
          <div><b>Total</b></div><div><b>{money(net(s), school?.monnaie)}</b></div>
        </div>
      </div>
      <button className="btn btn-soft btn-block" onClick={() => printDocument(<PaySlipSheet salary={s} />, 'A4 portrait', `Fiche de paie ${s.periode}`)}><Download size={16} />Télécharger le reçu (PDF)</button>
    </Wrap>
  );
}

function Rates() {
  const { session, me } = useMine();
  const courses = useCollection('courses').filter((c) => c.professeurId === session.user.staffId);
  const classes = useCollection('classes');
  const subjects = useCollection('subjects');
  useDoc('school', 'main');
  const pairs = [...new Map(courses.map((c) => { const n = classes.find((k) => k.id === c.classeId)?.niveau; return [`${c.matiereId}|${n}`, { m: c.matiereId, n }]; })).values()].filter((x) => x.n && x.n !== 'Préscolaire');
  return (
    <Wrap title="Taux par matière" back="/prof/finance">
      <div className="card mb-12">
        <div className="team-row tiny muted"><span>Matière</span><span>Niveau</span><span className="right">Taux / heure</span></div>
        {pairs.map(({ m, n }) => { const t = me?.tauxPerso ?? rateFor(m, n!); return (
          <div key={`${m}${n}`} className="team-row rate-row"><span className="small" style={{ color: 'var(--ink)' }}>{subjects.find((s) => s.id === m)?.nom.split(' (')[0]}</span><span className="small muted">{n}</span><b className="right small">{t ? money(t) : '—'}</b></div>
        ); })}
        {pairs.length === 0 && <Empty title="Aucune matière payée à l’heure" />}
      </div>
      <div className="card card-pad small row" style={{ gap: 10, background: 'var(--primary-50)', border: 0 }}><Info size={18} color="var(--primary)" />{remunerationOf(me) === 'horaire' ? (me?.tauxPerso ? 'La direction vous a fixé un taux horaire propre, pour toutes vos matières.' : 'Les taux horaires sont définis par l’administration (Paramètres → Matières & règles).') : 'Vous êtes payé au salaire fixe : ces taux ne servent qu’aux heures de remplacement.'}</div>
    </Wrap>
  );
}

function Hours() {
  const { session, me } = useMine();
  useCollection('timetable'); useCollection('staffAttendance'); useCollection('remplacements'); useCollection('pointages');
  const months = yearMonths();
  if (!months.includes(thisMonth())) months.push(thisMonth());
  const [ym, setYm] = useState(thisMonth());
  const h = monthHours(session.user.staffId, ym);
  const pct = h.prevues ? Math.min(100, Math.round((h.effectuees / h.prevues) * 100)) : 0;
  const rates = db.list('courses').filter((c) => c.professeurId === me?.id).map((c) => rateFor(c.matiereId, db.get('classes', c.classeId)?.niveau ?? 'Secondaire')).filter((x): x is number => !!x);
  const avg = rates.length ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : 0;
  const hourly = remunerationOf(me) === 'horaire';
  const v = monthPay(me?.id, ym);
  return (
    <Wrap title="Mes heures de cours" back="/prof/finance">
      <select className="select mb-16" value={ym} onChange={(e) => setYm(e.target.value)} aria-label="Mois">{months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}</select>
      <div className="card card-pad mb-12 row" style={{ gap: 18 }}>
        <div className="ring" style={{ background: `conic-gradient(var(--primary) ${pct * 3.6}deg, var(--line-2) 0)` }}><div><b>{h.effectuees} h</b><small>effectuées</small></div></div>
        <div className="grow"><div className="small muted">sur</div><b style={{ fontSize: 20, color: 'var(--ink)' }}>{h.prevues} h</b><div className="small muted">prévues</div></div>
      </div>
      <div className="card card-pad mb-12">
        <div className="info small">
          <div><i className="legend-dot" style={{ background: 'var(--primary)' }} />Heures normales</div><div>{h.normales} h</div>
          <div><i className="legend-dot" style={{ background: 'var(--orange)' }} />Heures supplémentaires</div><div>{h.supp} h{avg && h.supp ? ` (≈ ${money(h.supp * avg)})` : ''}</div>
          <div><i className="legend-dot" style={{ background: 'var(--red)' }} />Heures annulées</div><div>{h.annulees} h</div>
        </div>
        <p className="tiny muted mt-8">Calcul à partir de votre emploi du temps : les absences annulent des heures, les remplacements en ajoutent.</p>
      </div>
      <div className="card card-pad mb-12">
        <div className="row" style={{ gap: 10 }}><CheckCircle2 size={18} color="var(--green)" /><b className="grow" style={{ color: 'var(--ink)' }}>{v.heures} h validées</b>{hourly && <b>{money(v.montant)}</b>}</div>
        {v.detail.map((d) => <div key={`${d.matiereId}${d.niveau}`} className="row small mt-8"><span className="grow muted">{db.get('subjects', d.matiereId)?.nom.split(' (')[0]} · {d.niveau}</span>{d.heures} h × {money(d.taux)}</div>)}
        <p className="tiny muted mt-8">{hourly ? 'Vous êtes payé à l’heure : seuls les cours validés (« Cours donné », cahier de textes ou appel) comptent.' : 'Vous êtes payé au salaire fixe ; la validation des cours sert au suivi.'}</p>
      </div>
      <Card title="Détail par semaine" pad={false}>
        {h.weeks.map((w) => <div key={w.label} className="sheet-row"><span className="grow">{w.label}</span><b>{w.heures} h</b></div>)}
        {h.weeks.length === 0 && <p className="small muted card-pad">Pas de jours de classe ce mois-ci.</p>}
      </Card>
    </Wrap>
  );
}

function HistoryView() {
  const { salaries } = useMine();
  const school = useDoc('school', 'main');
  const months = yearMonths();
  const paidBy = (m: string) => salaries.filter((s) => s.periode === m && s.statut === 'Payé').reduce((a, s) => a + net(s), 0);
  const values = months.map(paidBy);
  const total = values.reduce((a, b) => a + b, 0);
  const n = values.filter(Boolean).length;
  return (
    <Wrap title="Historique des revenus" back="/prof/finance">
      <Card title={db.get('years', school?.anneeCourante)?.libelle ?? ''}>
        <BarChart labels={months.map((m) => monthLabel(m).slice(0, 3))} series={[{ label: 'Versé', color: '#1463f3', values }]} format={(x) => `${Math.round(x / 1000)}k`} ticks={3} />
      </Card>
      <div className="stat-pair mt-12 mb-12">
        <div className="card card-pad"><div className="tiny muted">Total année</div><b style={{ fontSize: 19, color: 'var(--ink)' }}>{money(total, school?.monnaie)}</b></div>
        <div className="card card-pad"><div className="tiny muted">Moyenne mensuelle</div><b style={{ fontSize: 19, color: 'var(--ink)' }}>{money(n ? total / n : 0, school?.monnaie)}</b></div>
      </div>
      <Card title="Historique détaillé" pad={false}>{[...months].reverse().filter((m) => paidBy(m)).map((m) => <div key={m} className="sheet-row"><span className="grow">{monthLabel(m)}</span><b>{money(paidBy(m))}</b></div>)}</Card>
    </Wrap>
  );
}

function Documents() {
  const { salaries, session } = useMine();
  const [tab, setTab] = useState<'tous' | 'recus' | 'attestations'>('tous');
  const paid = salaries.filter((s) => s.statut === 'Payé');
  const row = (key: string, title: string, sub: string, onClick: () => void) => (
    <button key={key} className="sheet-row" onClick={onClick}><span className="tint-red" style={{ width: 34, height: 34, borderRadius: 9, display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 800 }}>PDF</span><span className="grow">{title}<small className="muted" style={{ display: 'block', fontSize: 12 }}>{sub}</small></span><Download size={18} className="chev" /></button>
  );
  return (
    <Wrap title="Documents" back="/prof/finance">
      <div className="seg mb-12"><button className={tab === 'tous' ? 'active' : ''} onClick={() => setTab('tous')}>Tous</button><button className={tab === 'recus' ? 'active' : ''} onClick={() => setTab('recus')}>Reçus</button><button className={tab === 'attestations' ? 'active' : ''} onClick={() => setTab('attestations')}>Attestations</button></div>
      <div className="card mb-12">
        {tab !== 'recus' && row('att', 'Attestation de travail', 'Année scolaire en cours', () => printDocument(<AttestationSheet staffId={session.user.staffId!} />, 'A4 portrait', 'Attestation de travail'))}
        {tab !== 'attestations' && paid.map((s) => row(s.id, `Reçu — ${monthLabel(s.periode)}`, 'Fiche de paie', () => printDocument(<PaySlipSheet salary={s} />, 'A4 portrait', `Fiche de paie ${s.periode}`)))}
      </div>
      <div className="card card-pad small row" style={{ gap: 10, background: 'var(--primary-50)', border: 0 }}><Info size={18} color="var(--primary)" />Ces documents sont officiels et peuvent servir pour toute démarche administrative.</div>
    </Wrap>
  );
}

function Infos() {
  const nav = useNavigate();
  const { me, session } = useMine();
  const school = useDoc('school', 'main');
  const others = me?.autresEcoles ?? [];
  const ask = () => {
    db.put('messages', { date: Date.now(), canal: 'Annonce', objet: 'Demande de mise à jour (contrat)', contenu: `${session.user.nom} demande une mise à jour de ses informations contractuelles.`, cible: 'Personnel', destinataires: 1, auteurId: session.user.id });
    audit('Demande de mise à jour', session.user.nom, { domaine: 'autre' });
    toast('Demande envoyée à la direction');
  };
  return (
    <Wrap title="Mes informations" back="/prof/finance">
      <div className="small muted mb-8">École actuelle</div>
      <div className="card list-item mb-12" style={{ borderRadius: 14 }}><span className="tint-blue" style={{ width: 40, height: 40, borderRadius: 10, display: 'grid', placeItems: 'center' }}><School /></span><span className="grow"><b style={{ color: 'var(--ink)' }}>{school?.nom}</b></span><Badge tone="green">Actif</Badge></div>
      {canMultiSchool(session.user.staffId) && (
        <>
          <div className="small muted mb-8">Autres écoles</div>
          <div className="card mb-12">{others.map((o) => <div key={o.id} className="sheet-row"><span className="grow">{o.nom}</span><Badge tone={o.actif ? 'green' : 'gray'}>{o.actif ? 'Actif' : 'Inactif'}</Badge></div>)}<button className="sheet-row" style={{ color: 'var(--primary)' }} onClick={() => nav('/prof/ecoles')}>Gérer mes écoles<ChevronRight size={18} style={{ marginLeft: 'auto' }} /></button></div>
        </>
      )}
      <div className="small muted mb-8">Informations contractuelles</div>
      <div className="card card-pad mb-12"><div className="info small">
        <div>Type de contrat</div><div>{me?.typeContrat ?? 'Temps plein'}</div>
        <div>Date de début</div><div>{me?.dateEmbauche ? dateLong(me.dateEmbauche) : '—'}</div>
        <div>Rémunération</div><div>{remunerationOf(me) === 'horaire' ? 'À l’heure (cours validés)' : 'Salaire fixe'}</div>
        {remunerationOf(me) === 'horaire' ? <><div>Taux horaire</div><div>{me?.tauxPerso ? money(me.tauxPerso) : 'Selon la matière'}</div></> : <><div>Salaire de base mensuel</div><div>{money(me?.salaire ?? 0, school?.monnaie)}</div></>}
        <div>Mode de paiement</div><div>{me?.modePaiement}</div>
      </div></div>
      <button className="btn btn-soft btn-block" onClick={ask}><UserCog size={16} />Demander une mise à jour</button>
    </Wrap>
  );
}
