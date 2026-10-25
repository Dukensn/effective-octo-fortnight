import { useMemo, useState } from 'react';
import { Printer, Trophy, TrendingUp, Users, Percent } from 'lucide-react';
import { useCollection } from '../../data/store';
import { PageHead, Card, Avatar, StatCard } from '../../components/ui';
import { BarChart } from '../../components/charts';
import { classReport, fmtNote, sortedPeriods } from '../../data/compute';
import { fullName } from '../../lib/format';
import { printDocument } from '../../lib/print';
import { ClassResultsSheet, FinanceReportSheet } from '../../docs/Sheets';
import { useSession } from '../../lib/session';

export default function Reports() {
  const session = useSession()!;
  const classes = useCollection('classes').filter((c) => c.niveau !== 'Préscolaire').sort((a, b) => a.code.localeCompare(b.code, 'fr', { numeric: true }));
  const subjects = useCollection('subjects');
  useCollection('grades');
  useCollection('students');
  const periods = sortedPeriods();
  const [scope, setScope] = useState('annuel');
  const reports = useMemo(() => classes.map((c) => classReport(c.id, scope)!).filter(Boolean), [classes, scope]); // eslint-disable-line
  const all = reports.flatMap((r) => r.students.filter((s) => s.general != null));
  const top = [...all].sort((a, b) => b.general! - a.general!).slice(0, 10);
  const success = all.filter((s) => s.general! >= 10).length / Math.max(1, all.length);
  const avg = all.reduce((a, s) => a + s.general!, 0) / Math.max(1, all.length);
  const bySubject = subjects.map((sub) => {
    const vals = reports.flatMap((r) => r.students.map((s) => s.lines.find((l) => l.subject.id === sub.id)?.value)).filter((v): v is number => v != null);
    return { sub, v: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null };
  });
  const girls = all.filter((s) => s.student.sexe === 'F');
  const boys = all.filter((s) => s.student.sexe === 'M');
  const mean = (xs: typeof all) => xs.reduce((a, s) => a + s.general!, 0) / Math.max(1, xs.length);
  const evolution = periods.map((p) => { const rs = classes.map((c) => classReport(c.id, p.id)?.classGeneral).filter((x): x is number => x != null); return rs.length ? rs.reduce((a, b) => a + b, 0) / rs.length : null; });

  return (
    <>
      <PageHead title="Rapports" sub="Statistiques scolaires et états imprimables."
        actions={<select className="select" style={{ width: 200 }} value={scope} onChange={(e) => setScope(e.target.value)}><option value="annuel">Année complète</option>{periods.map((p) => <option key={p.id} value={p.id}>{p.libelle}</option>)}</select>} />
      <div className="grid g-stats mb-16">
        <StatCard tint="blue" icon={<TrendingUp />} value={fmtNote(avg)} label="Moyenne de l’école" sub="sur 20" />
        <StatCard tint="green" icon={<Percent />} value={`${Math.round(success * 100)}%`} label="Taux de réussite" sub="moyenne ≥ 10" />
        <StatCard tint="violet" icon={<Users />} value={`${fmtNote(mean(girls))} / ${fmtNote(mean(boys))}`} label="Filles / Garçons" sub="moyennes" />
        <StatCard tint="orange" icon={<Trophy />} value={fmtNote(top[0]?.general)} label="Meilleure moyenne" sub={top[0] ? fullName(top[0].student) : ''} />
      </div>
      <div className="grid g-2">
        <Card title="Moyenne et réussite par classe">
          <BarChart labels={reports.map((r) => r.classe.code)} max={20} ticks={4} showValues format={(v) => (Number.isInteger(v) ? String(v) : v.toFixed(1))} series={[{ label: 'Moyenne', color: '#1463f3', values: reports.map((r) => (r.classGeneral == null ? null : Math.round(r.classGeneral * 10) / 10)) }]} />
        </Card>
        <Card title="Évolution de la moyenne de l’école">
          <BarChart labels={periods.map((p) => p.court)} max={20} ticks={4} showValues format={(v) => (Number.isInteger(v) ? String(v) : v.toFixed(1))} series={[{ label: 'Moyenne', color: '#17a34a', values: evolution.map((v) => (v == null ? null : Math.round(v * 10) / 10)) }]} />
        </Card>
        <Card title="Moyenne par matière">
          {bySubject.filter((x) => x.v != null).sort((a, b) => b.v! - a.v!).map(({ sub, v }) => (
            <div key={sub.id} className="row" style={{ padding: '4px 0' }}><span className="small" style={{ width: 170 }}>{sub.nom.split(' (')[0]}</span><div className="bar grow"><i style={{ width: `${(v! / 20) * 100}%`, background: v! < 10 ? 'var(--red)' : v! < 12 ? 'var(--orange)' : 'var(--green)' }} /></div><b style={{ width: 40, textAlign: 'right' }}>{fmtNote(v)}</b></div>
          ))}
        </Card>
        <Card title="Tableau d’honneur" pad={false}>
          <div className="list">{top.map((s, i) => (
            <div key={s.student.id} className="list-item"><b style={{ width: 22, color: i < 3 ? 'var(--orange)' : 'var(--muted)' }}>{i + 1}</b><Avatar src={s.student.photo} name={fullName(s.student)} size={32} /><span className="grow">{fullName(s.student)}<br /><span className="tiny muted">{classes.find((c) => c.id === s.student.classeId)?.code}</span></span><b>{fmtNote(s.general)}</b></div>
          ))}</div>
        </Card>
        <Card title="Résultats par classe (PDF)">
          <div className="qa">{reports.map((r) => <button key={r.classe.id} onClick={() => printDocument(<ClassResultsSheet classeId={r.classe.id} scope={scope} />, 'A4 portrait', `Résultats ${r.classe.code}`)}><Printer />{r.classe.nom} — moy. {fmtNote(r.classGeneral)} · {Math.round(r.successRate * 100)}% réussite</button>)}</div>
        </Card>
        {session.can('finance') && (
          <Card title="États financiers (PDF)">
            <div className="qa">
              {([['revenus', 'État des revenus et dépenses'], ['creances', 'Situation des créances (élèves)'], ['salaires', 'Rapport des salaires'], ['balance', 'Balance comptable'], ['projets', 'Suivi des projets']] as const).map(([k, l]) => <button key={k} onClick={() => printDocument(<FinanceReportSheet kind={k} />, 'A4 portrait', l)}><Printer />{l}</button>)}
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
