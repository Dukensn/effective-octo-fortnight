import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, GraduationCap, ClipboardCheck, Wallet, UserPlus, FileText, IdCard, Receipt, CalendarDays, ChevronRight } from 'lucide-react';
import { useCollection, useDoc } from '../../data/store';
import { PageHead, StatCard, Card, Avatar, StatusBadge, Badge } from '../../components/ui';
import { BarChart } from '../../components/charts';
import { classReport, fmtNote, gradesForEvaluation, classStudents, sortedPeriods } from '../../data/compute';
import { money, dateShort, dateFull, fullName, dayMonth } from '../../lib/format';
import { balances } from '../../lib/finance';
import { useSession } from '../../lib/session';

export default function Dashboard() {
  const nav = useNavigate();
  const session = useSession()!;
  const school = useDoc('school', 'main');
  const students = useCollection('students');
  const staff = useCollection('staff');
  const classes = useCollection('classes');
  const payments = useCollection('payments');
  const attendance = useCollection('attendance');
  const events = useCollection('events');
  const evaluations = useCollection('evaluations');
  useCollection('grades');
  const actifs = students.filter((s) => s.statut === 'Actif');
  const pending = students.filter((s) => s.statut === 'En attente');
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
    let due = 0, paid = 0;
    b.forEach((v) => { due += v.due; paid += v.paid; });
    return { due, paid, rate: due ? paid / due : 0 };
  }, [payments, students]); // eslint-disable-line

  const classAvgs = sortedClasses.map((c) => classReport(c.id, current?.id ?? 'annuel'));
  const progress = useMemo(() => {
    if (!current) return { done: 0, total: 0, list: [] as { ev: typeof evaluations[0]; n: number; t: number }[] };
    const evs = evaluations.filter((e) => e.periodeId === current.id);
    const list = evs.map((ev) => ({ ev, n: gradesForEvaluation(ev.id).size, t: classStudents(ev.classeId).length }));
    return { done: list.filter((x) => x.n >= x.t && x.t > 0).length, total: list.length, list: list.filter((x) => x.n < x.t) };
  }, [evaluations, current]); // eslint-disable-line

  const recent = [...payments].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const upcoming = [...events].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);
  const staffById = new Map(staff.map((s) => [s.id, s]));
  const subjects = new Map(useCollection('subjects').map((s) => [s.id, s]));
  const courseProfs = new Map(useCollection('courses').map((c) => [c.id, c.professeurId]));

  return (
    <>
      <PageHead
        title={`Bonjour, ${session.user.nom.split(' ').slice(0, 2).join(' ')}`}
        sub={<>{dateFull()} · Année scolaire {useDoc('years', school?.anneeCourante)?.libelle}</>}
        actions={session.can('inscriptions', 'write') && <button className="btn btn-primary" onClick={() => nav('/inscriptions/nouvelle')}><UserPlus />Inscrire un élève</button>}
      />
      <div className="grid g-stats mb-16">
        <StatCard tint="blue" icon={<Users />} value={actifs.length} label="Élèves inscrits" sub={`${actifs.filter((s) => s.sexe === 'F').length} filles · ${actifs.filter((s) => s.sexe === 'M').length} garçons`} />
        <StatCard tint="green" icon={<GraduationCap />} value={profs.length} label="Professeurs" sub={`${staff.filter((s) => s.statut === 'Actif').length} membres du personnel`} />
        <StatCard tint="violet" icon={<ClipboardCheck />} value={`${Math.round(presence * 100)}%`} label="Taux de présence" sub="20 derniers jours" />
        <StatCard tint="orange" icon={<Wallet />} value={`${Math.round(finance.rate * 100)}%`} label="Scolarité encaissée" sub={`${money(finance.paid)} / ${money(finance.due)}`} />
      </div>

      <div className="split split-side">
        <div className="stack">
          <Card title={`Moyennes par classe — ${current?.libelle ?? ''}`} link="Notes / Examens" onLink={() => nav('/notes')}>
            <BarChart
              labels={sortedClasses.map((c) => c.code)}
              series={[{ label: 'Moyenne', color: '#1463f3', values: classAvgs.map((r) => (r?.classGeneral != null ? Math.round(r.classGeneral * 10) / 10 : null)) }]}
              max={20} ticks={4} showValues format={(n) => (Number.isInteger(n) ? String(n) : n.toFixed(1))}
            />
          </Card>
          <div className="grid g-2">
            <Card title="Derniers paiements" link="Voir tout" onLink={() => nav('/finance?tab=paiements')} pad={false}>
              <div className="list">
                {recent.map((p) => {
                  const s = students.find((x) => x.id === p.eleveId);
                  return (
                    <div key={p.id} className="list-item">
                      <Avatar src={s?.photo} name={fullName(s)} size={34} />
                      <div className="grow"><div className="bold ellipsis" style={{ fontWeight: 600, color: 'var(--ink)' }}>{fullName(s)}</div><div className="tiny muted">{dateShort(p.date)} · {p.mode}</div></div>
                      <div className="right"><div className="bold">{money(p.montant)}</div><StatusBadge s={p.statut} /></div>
                    </div>
                  );
                })}
              </div>
            </Card>
            <Card title={`Saisie des notes — ${current?.court ?? ''}`} pad={false}>
              <div className="card-pad" style={{ paddingTop: 4 }}>
                <div className="row between small"><span>{progress.done} / {progress.total} évaluations complètes</span><b>{progress.total ? Math.round((progress.done / progress.total) * 100) : 0}%</b></div>
                <div className="bar mt-8"><i style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%`, background: 'var(--primary)' }} /></div>
              </div>
              <div className="list">
                {progress.list.slice(0, 5).map(({ ev, n, t }) => {
                  const c = classes.find((x) => x.id === ev.classeId);
                  const prof = staffById.get(courseProfs.get(ev.coursId) ?? '');
                  return (
                    <button key={ev.id} className="list-item" style={{ border: 0, width: '100%', textAlign: 'left' }} onClick={() => nav(`/notes/saisie/${ev.id}`)}>
                      <div className="grow"><div style={{ fontWeight: 600, color: 'var(--ink)' }}>{subjects.get(ev.matiereId)?.nom.split(' (')[0]} · {c?.code}</div><div className="tiny muted">{prof ? `${prof.sexe === 'F' ? 'Mme' : 'M.'} ${prof.prenom} ${prof.nom}` : '—'}</div></div>
                      <Badge tone={n === 0 ? 'orange' : 'blue'}>{n}/{t}</Badge><ChevronRight className="chev" />
                    </button>
                  );
                })}
                {progress.list.length === 0 && <div className="list-item muted small">Toutes les notes sont saisies.</div>}
              </div>
            </Card>
          </div>
        </div>
        <div className="stack">
          <Card title="Actions rapides">
            <div className="qa">
              {session.can('inscriptions', 'write') && <button onClick={() => nav('/inscriptions/nouvelle')}><UserPlus />Nouvelle inscription</button>}
              {session.can('finance', 'write') && <button onClick={() => nav('/finance?tab=paiements&new=1')}><Receipt />Enregistrer un paiement</button>}
              {session.can('documents') && <button onClick={() => nav('/documents/bulletins')}><FileText />Générer des bulletins</button>}
              {session.can('documents') && <button onClick={() => nav('/documents/badges')}><IdCard />Générer des badges</button>}
              {session.can('presences') && <button onClick={() => nav('/presences')}><ClipboardCheck />Présences du jour</button>}
            </div>
          </Card>
          {pending.length > 0 && session.can('inscriptions') && (
            <Card title="Inscriptions en attente" link="Voir" onLink={() => nav('/inscriptions')} pad={false}>
              <div className="list">
                {pending.map((s) => (
                  <button key={s.id} className="list-item" style={{ border: 0, width: '100%', textAlign: 'left' }} onClick={() => nav(`/inscriptions/${s.id}`)}>
                    <Avatar src={s.photo} name={fullName(s)} size={34} />
                    <div className="grow"><div style={{ fontWeight: 600, color: 'var(--ink)' }}>{fullName(s)}</div><div className="tiny muted">{classes.find((c) => c.id === s.classeId)?.code} · {dateShort(s.dateInscription)}</div></div>
                    <StatusBadge s="En attente" />
                  </button>
                ))}
              </div>
            </Card>
          )}
          <Card title="Prochains événements" link="Voir tout" onLink={() => nav('/evenements')} pad={false}>
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
                <span>{r!.classe.code}</span>
                <span className="small muted">{Math.round(r!.successRate * 100)}% de réussite</span>
                <b>{fmtNote(r!.classGeneral)}</b>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </>
  );
}
