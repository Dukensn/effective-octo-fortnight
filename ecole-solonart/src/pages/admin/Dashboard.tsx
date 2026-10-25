import { useMemo } from 'react';
import { SetupCard } from '../../components/Guide';
import { useNavigate } from 'react-router-dom';
import { Users, GraduationCap, ClipboardCheck, Wallet, UserPlus, FileText, Receipt, CalendarDays, ChevronRight, Camera, FileWarning, PenSquare, Smartphone, BadgeDollarSign, IdCard, ShieldAlert } from 'lucide-react';
import { useCollection, useDoc } from '../../data/store';
import { StatCard, Card, Avatar, StatusBadge } from '../../components/ui';
import { BarChart } from '../../components/charts';
import { classReport, fmtNote, gradesForEvaluation, classStudents, sortedPeriods } from '../../data/compute';
import { money, dateShort, dateFull, fullName, dayMonth, todayISO } from '../../lib/format';
import { balances } from '../../lib/finance';
import { useSession } from '../../lib/session';
import { SchoolLogo } from '../../components/Logo';
import type { ModuleKey } from '../../data/types';

export default function Dashboard() {
  const nav = useNavigate();
  const session = useSession()!;
  const school = useDoc('school', 'main');
  const year = useDoc('years', school?.anneeCourante);
  const students = useCollection('students');
  const staff = useCollection('staff');
  const classes = useCollection('classes');
  const payments = useCollection('payments');
  const attendance = useCollection('attendance');
  const events = useCollection('events');
  const evaluations = useCollection('evaluations');
  const salaries = useCollection('salaries');
  const incidents = useCollection('incidents');
  useCollection('grades');
  const actifs = students.filter((s) => s.statut === 'Actif');
  const profs = staff.filter((s) => s.type === 'Professeur' && s.statut === 'Actif');
  const sortedClasses = [...classes].sort((a, b) => a.code.localeCompare(b.code, 'fr', { numeric: true }));
  const periods = sortedPeriods();
  const current = [...periods].reverse().find((p) => !p.verrouillee && evaluations.some((e) => e.periodeId === p.id && e.statut !== 'Clôturé')) ?? periods.find((p) => !p.verrouillee) ?? periods[periods.length - 1];

  const presence = useMemo(() => {
    const days = new Set(attendance.filter((a) => !a.eleveId).map((a) => a.date));
    const abs = attendance.filter((a) => a.eleveId && (a.statut === 'Absent' || a.statut === 'Excusé')).length;
    const total = days.size * actifs.length;
    return total ? 1 - abs / total : 1;
  }, [attendance, actifs.length]);

  const finance = useMemo(() => {
    const b = balances();
    let due = 0, paid = 0, late = 0;
    b.forEach((v) => { due += v.due; paid += v.paid; if (v.rest > 0) late++; });
    return { due, paid, late, rate: due ? paid / due : 0 };
  }, [payments, students]); // eslint-disable-line

  // Liste « À faire » : ce qui demande une action aujourd'hui
  const todo = useMemo(() => {
    const today = todayISO();
    const weekday = new Date().getDay() % 6 !== 0;
    const appels = weekday ? sortedClasses.filter((c) => !attendance.some((a) => a.id === `at-${today}-${c.id}-done`)).length : 0;
    const evs = current ? evaluations.filter((e) => e.periodeId === current.id && e.statut !== 'Clôturé') : [];
    const notes = evs.filter((e) => gradesForEvaluation(e.id).size < classStudents(e.classeId).length).length;
    const moncash = payments.filter((p) => p.statut === 'En attente').length;
    const photos = actifs.filter((s) => !s.photo).length;
    const incOuverts = incidents.filter((i) => i.statut === 'Ouvert').length;
    const docs = actifs.filter((s) => s.documents.some((d) => !d.fourni && d.type !== 'Certificat médical' && d.type !== 'Photo des parents')).length;
    const parentDossiers = students.filter((s) => s.dossierParent?.statut === 'soumis');
    const lastMonth = [...new Set(salaries.map((s) => s.periode))].sort().pop();
    const sal = salaries.filter((s) => s.periode === lastMonth && s.statut === 'En attente').length;
    const items: { n: number; label: string; sub: string; to: string; icon: typeof Users; tint: string; m: ModuleKey }[] = [
      { n: appels, label: 'Appels non faits aujourd’hui', sub: 'Classes sans feuille de présence', to: '/presences', icon: ClipboardCheck, tint: 'violet', m: 'presences' },
      { n: notes, label: `Notes à saisir — ${current?.court ?? ''}`, sub: 'Évaluations incomplètes', to: '/notes', icon: PenSquare, tint: 'blue', m: 'notes' },
      { n: moncash, label: 'Paiements à confirmer', sub: 'MonCash / NatCash en attente', to: '/finance?tab=paiements', icon: Smartphone, tint: 'orange', m: 'finance' },
      { n: finance.late, label: 'Élèves en retard de paiement', sub: 'Relances WhatsApp ou SMS', to: '/finance?tab=paiements', icon: BadgeDollarSign, tint: 'red', m: 'finance' },
      { n: sal, label: 'Salaires du mois à payer', sub: 'Personnel en attente', to: '/finance?tab=salaires', icon: Wallet, tint: 'green', m: 'finance' },
      { n: photos, label: 'Élèves sans photo', sub: 'Séance photo avec le téléphone', to: '/eleves/photos', icon: Camera, tint: 'blue', m: 'eleves' },
      { n: parentDossiers.length, label: 'Dossiers complétés par les parents', sub: 'À vérifier puis valider', to: parentDossiers[0] ? `/eleves/${parentDossiers[0].id}` : '/eleves', icon: ClipboardCheck, tint: 'green', m: 'eleves' },
      { n: incOuverts, label: 'Incidents à traiter', sub: 'Registre de discipline', to: '/discipline', icon: ShieldAlert, tint: 'red', m: 'discipline' },
      { n: docs, label: 'Dossiers incomplets', sub: 'Acte de naissance ou bulletin manquant', to: '/eleves', icon: FileWarning, tint: 'orange', m: 'eleves' },
    ];
    return items.filter((i) => i.n > 0 && session.can(i.m));
  }, [attendance, evaluations, payments, actifs, students, salaries, incidents, current, finance.late, sortedClasses, session]); // eslint-disable-line

  // Le préscolaire est évalué par compétences : il n'entre pas dans les moyennes.
  const gradedClasses = sortedClasses.filter((c) => c.niveau !== 'Préscolaire');
  const classAvgs = gradedClasses.map((c) => classReport(c.id, current?.id ?? 'annuel'));
  const recent = [...payments].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const upcoming = [...events].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);
  const first = session.user.nom.replace(/^(M\.|Mme)\s+/, '').split(' ')[0];
  const hour = new Date().getHours();
  const actions = [
    session.can('inscriptions', 'write') && { label: 'Inscrire', icon: UserPlus, to: '/inscriptions/rapide' },
    session.can('finance', 'write') && { label: 'Encaisser', icon: Receipt, to: '/finance?tab=paiements&new=1' },
    session.can('documents') && { label: 'Bulletins', icon: FileText, to: '/documents/bulletins' },
    session.can('documents') && { label: 'Badges', icon: IdCard, to: '/documents/badges' },
  ].filter(Boolean) as { label: string; icon: typeof Users; to: string }[];

  return (
    <>
      <section className="hero mb-16">
        <div className="hero-text">
          <div className="hero-date">{dateFull()} · Année {year?.libelle}</div>
          <h1>{hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'}, {first}</h1>
          <p>{todo.length ? `${todo.length} point${todo.length > 1 ? 's' : ''} demande${todo.length > 1 ? 'nt' : ''} votre attention aujourd’hui.` : 'Tout est à jour. Bonne journée !'}</p>
          {actions.length > 0 && (
            <div className="hero-actions">
              {actions.map((a) => <button key={a.label} onClick={() => nav(a.to)}><a.icon />{a.label}</button>)}
            </div>
          )}
        </div>
        <div className="hero-logo"><SchoolLogo size={110} /></div>
      </section>

      <SetupCard />
      <div className="grid g-stats mini mb-16">
        <StatCard tint="blue" icon={<Users />} value={actifs.length} label="Élèves" sub={`${actifs.filter((s) => s.sexe === 'F').length} filles · ${actifs.filter((s) => s.sexe === 'M').length} garçons`} />
        <StatCard tint="green" icon={<GraduationCap />} value={profs.length} label="Professeurs" sub={`${staff.filter((s) => s.statut === 'Actif').length} membres du personnel`} />
        <StatCard tint="violet" icon={<ClipboardCheck />} value={`${Math.round(presence * 100)}%`} label="Présence" sub="20 derniers jours" />
        <StatCard tint="orange" icon={<Wallet />} value={`${Math.round(finance.rate * 100)}%`} label="Scolarité" sub={money(finance.paid)} />
      </div>

      <div className="split split-side">
        <div className="stack">
          {todo.length > 0 && (
            <Card title="À faire" pad={false}>
              <div className="list">
                {todo.map((t) => (
                  <button key={t.label} className="list-item todo" onClick={() => nav(t.to)}>
                    <span className={`tint-${t.tint}`} style={{ width: 40, height: 40, borderRadius: 11, display: 'grid', placeItems: 'center', flex: 'none' }}><t.icon size={19} /></span>
                    <span className="grow"><b>{t.label}</b><br /><span className="tiny muted">{t.sub}</span></span>
                    <span className="todo-n">{t.n}</span>
                    <ChevronRight className="chev" />
                  </button>
                ))}
              </div>
            </Card>
          )}
          <Card title={`Moyennes par classe — ${current?.libelle ?? ''}`} link="Notes / Examens" onLink={() => nav('/notes')}>
            <BarChart labels={gradedClasses.map((c) => c.code)} series={[{ label: 'Moyenne', color: '#1463f3', values: classAvgs.map((r) => (r?.classGeneral != null ? Math.round(r.classGeneral * 10) / 10 : null)) }]} max={20} ticks={4} showValues format={(n) => (Number.isInteger(n) ? String(n) : n.toFixed(1))} />
          </Card>
        </div>
        <div className="stack">
          {session.can('finance') && (
            <Card title="Derniers paiements" link="Voir tout" onLink={() => nav('/finance?tab=paiements')} pad={false}>
              <div className="list">
                {recent.map((p) => {
                  const s = students.find((x) => x.id === p.eleveId);
                  return (
                    <div key={p.id} className="list-item">
                      <Avatar src={s?.photo} name={fullName(s)} size={34} />
                      <div className="grow"><div className="ellipsis" style={{ fontWeight: 600, color: 'var(--ink)' }}>{fullName(s)}</div><div className="tiny muted">{dateShort(p.date)} · {p.mode}</div></div>
                      <div className="right"><div className="bold" style={{ whiteSpace: 'nowrap' }}>{money(p.montant)}</div><StatusBadge s={p.statut} /></div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
          <Card title="Événements" link="Voir tout" onLink={() => nav('/evenements')} pad={false}>
            <div className="list">
              {upcoming.map((e) => (
                <div key={e.id} className="list-item">
                  <div className="tint-blue" style={{ width: 40, height: 40, borderRadius: 10, display: 'grid', placeItems: 'center', flex: 'none' }}><CalendarDays size={18} /></div>
                  <div className="grow"><div style={{ fontWeight: 600, color: 'var(--ink)' }} className="ellipsis">{e.titre}</div><div className="tiny muted">{dayMonth(e.date)}{e.heure ? ` · ${e.heure}` : ''} · {e.type}</div></div>
                </div>
              ))}
            </div>
          </Card>
          <Card title="Meilleures classes">
            {classAvgs.filter(Boolean).sort((a, b) => (b!.classGeneral ?? 0) - (a!.classGeneral ?? 0)).slice(0, 4).map((r) => (
              <div key={r!.classe.id} className="row between" style={{ padding: '6px 0' }}>
                <span>{r!.classe.code}</span><span className="small muted">{Math.round(r!.successRate * 100)}% de réussite</span><b>{fmtNote(r!.classGeneral)}</b>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </>
  );
}
