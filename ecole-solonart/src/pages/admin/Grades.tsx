import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Unlock, Pencil, Trophy, Plus, Wand2, Save, FileText } from 'lucide-react';
import { db, useCollection, useDoc } from '../../data/store';
import type { Evaluation, ReportCardEntry } from '../../data/types';
import { PageHead, Tabs, Field, StatusBadge, Badge, Menu, Modal, toast, Card, Avatar, Toggle, Empty } from '../../components/ui';
import { classReport, classStudents, fmtNote, gradesForEvaluation, sortedPeriods, appreciation, autoCouncil, isPreschool } from '../../data/compute';
import { LevelPill } from '../../components/Level';
import { civ, dateShort, fullName } from '../../lib/format';
import { useSession, audit } from '../../lib/session';

type Tab = 'evaluations' | 'periodes' | 'conseil';

export default function Grades() {
  const [params] = useSearchParams();
  const [tab, setTab] = useState<Tab>((params.get('tab') as Tab) ?? 'evaluations');
  return (
    <>
      <PageHead title="Notes / Examens" sub="Suivez la saisie des notes, verrouillez les périodes et préparez le conseil de classe." />
      <Tabs tabs={[['evaluations', 'Évaluations'], ['periodes', 'Périodes & verrouillage'], ['conseil', 'Conseil de classe']]} value={tab} onChange={setTab} />
      {tab === 'evaluations' && <Evaluations />}
      {tab === 'periodes' && <Periods />}
      {tab === 'conseil' && <Council />}
    </>
  );
}

function Evaluations() {
  const nav = useNavigate();
  const session = useSession()!;
  const canWrite = session.can('notes', 'write');
  const evaluations = useCollection('evaluations');
  const classes = useCollection('classes').slice().sort((a, b) => a.code.localeCompare(b.code, 'fr', { numeric: true }));
  const subjects = useCollection('subjects');
  const courses = useCollection('courses');
  const staff = useCollection('staff');
  useCollection('grades');
  const periods = sortedPeriods();
  const [periode, setPeriode] = useState(periods.find((p) => !p.verrouillee)?.id ?? periods[0]?.id);
  const [classe, setClasse] = useState('c-s4-a');
  const [statut, setStatut] = useState('all');
  const [create, setCreate] = useState(false);
  const list = useMemo(() => evaluations.filter((e) => e.periodeId === periode && (classe === 'all' || e.classeId === classe) && (statut === 'all' || e.statut === statut)), [evaluations, periode, classe, statut]);
  const order = subjects.map((s) => s.id);
  list.sort((a, b) => a.classeId.localeCompare(b.classeId) || order.indexOf(a.matiereId) - order.indexOf(b.matiereId));
  const period = periods.find((p) => p.id === periode);

  const setStatus = (ev: Evaluation, s: Evaluation['statut']) => { db.patch('evaluations', ev.id, { statut: s }); audit(`Évaluation ${s}`, ev.id); toast(s === 'Clôturé' ? 'Évaluation clôturée' : 'Évaluation rouverte'); };

  return (
    <>
      <div className="card card-pad row wrap mb-16" style={{ gap: 12, alignItems: 'flex-end' }}>
        <Field label="Période"><select className="select" value={periode} onChange={(e) => setPeriode(e.target.value)}>{periods.map((p) => <option key={p.id} value={p.id}>{p.libelle}{p.verrouillee ? ' 🔒' : ''}</option>)}</select></Field>
        <Field label="Classe"><select className="select" value={classe} onChange={(e) => setClasse(e.target.value)}><option value="all">Toutes les classes</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}</select></Field>
        <Field label="Statut"><select className="select" value={statut} onChange={(e) => setStatut(e.target.value)}><option value="all">Tous</option><option>À venir</option><option>En cours</option><option>Clôturé</option></select></Field>
        <span className="grow" />
        {canWrite && <button className="btn btn-primary" onClick={() => setCreate(true)}><Plus />Nouvelle évaluation</button>}
      </div>
      {period?.verrouillee && <div className="card card-pad mb-16 row" style={{ background: 'var(--orange-50)', border: 0 }}><Lock size={18} color="var(--orange)" /><span className="small">Cette période est verrouillée : les professeurs ne peuvent plus modifier les notes. Déverrouillez-la dans « Périodes & verrouillage ».</span></div>}
      <div className="card">
        <div className="table-wrap"><table className="t">
          <thead><tr><th>Matière</th><th>Classe</th><th className="only-desktop">Professeur</th><th className="only-desktop">Date</th><th className="c">Saisie</th><th className="c">Moyenne</th><th>Statut</th><th /></tr></thead>
          <tbody>{list.map((ev) => {
            const g = gradesForEvaluation(ev.id);
            const t = classStudents(ev.classeId).length;
            const notes = [...g.values()].map((x) => x.note).filter((n): n is number => n !== null);
            const co = courses.find((c) => c.id === ev.coursId);
            const prof = staff.find((s) => s.id === co?.professeurId);
            return (
              <tr key={ev.id} className="clickable" onClick={() => nav(`/notes/palmares/${ev.id}`)}>
                <td style={{ color: 'var(--ink)', fontWeight: 500 }}>{subjects.find((s) => s.id === ev.matiereId)?.nom.split(' (')[0]}</td>
                <td>{classes.find((c) => c.id === ev.classeId)?.code}</td>
                <td className="only-desktop">{prof ? civ(prof) : '—'}</td>
                <td className="only-desktop">{dateShort(ev.date)}</td>
                <td className="c"><Badge tone={g.size >= t ? 'green' : g.size ? 'blue' : 'orange'}>{g.size}/{t}</Badge></td>
                <td className="c bold">{notes.length ? fmtNote(notes.reduce((a, b) => a + b, 0) / notes.length) : '-'}</td>
                <td><StatusBadge s={ev.statut} /></td>
                <td onClick={(e) => e.stopPropagation()}><Menu items={[
                  { label: 'Voir le palmarès', icon: <Trophy />, onClick: () => nav(`/notes/palmares/${ev.id}`) },
                  ...(canWrite ? [
                    { label: 'Saisir / modifier les notes', icon: <Pencil />, onClick: () => nav(`/notes/saisie/${ev.id}`) },
                    ev.statut === 'Clôturé' ? { label: 'Rouvrir', icon: <Unlock />, onClick: () => setStatus(ev, 'En cours') } : { label: 'Clôturer', icon: <Lock />, onClick: () => setStatus(ev, 'Clôturé') },
                  ] : []),
                ]} /></td>
              </tr>
            );
          })}</tbody>
        </table></div>
        {list.length === 0 && <Empty title="Aucune évaluation pour ces filtres" />}
      </div>
      {create && <NewEvaluation onClose={() => setCreate(false)} periodeId={periode!} classeId={classe === 'all' ? classes[0].id : classe} />}
    </>
  );
}

function NewEvaluation({ onClose, periodeId, classeId }: { onClose: () => void; periodeId: string; classeId: string }) {
  const courses = useCollection('courses');
  const subjects = useCollection('subjects');
  const classes = useCollection('classes');
  const periods = sortedPeriods();
  const [f, setF] = useState({ classeId, periodeId, coursId: '', titre: '', date: new Date().toISOString().slice(0, 10), noteMax: 20, all: false });
  const cc = courses.filter((c) => c.classeId === f.classeId);
  const save = () => {
    const targets = f.all ? cc : cc.filter((c) => c.id === f.coursId);
    if (!targets.length) return toast('Choisissez une matière', true);
    const p = periods.find((x) => x.id === f.periodeId)!;
    db.bulkPut('evaluations', targets.map((co) => ({ coursId: co.id, classeId: co.classeId, matiereId: co.matiereId, periodeId: f.periodeId, titre: f.titre || p.libelle, date: f.date, noteMax: f.noteMax, statut: 'À venir' as const })));
    toast(`${targets.length} évaluation(s) créée(s)`);
    onClose();
  };
  return (
    <Modal open onClose={onClose} title="Nouvelle évaluation" footer={<><button className="btn" onClick={onClose}>Annuler</button><button className="btn btn-primary" onClick={save}>Créer</button></>}>
      <div className="form-grid">
        <Field label="Classe"><select className="select" value={f.classeId} onChange={(e) => setF({ ...f, classeId: e.target.value, coursId: '' })}>{classes.map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}</select></Field>
        <Field label="Période"><select className="select" value={f.periodeId} onChange={(e) => setF({ ...f, periodeId: e.target.value })}>{periods.map((p) => <option key={p.id} value={p.id}>{p.libelle}</option>)}</select></Field>
        <Field label="Matière" className="span-2"><select className="select" disabled={f.all} value={f.coursId} onChange={(e) => setF({ ...f, coursId: e.target.value })}><option value="">Choisir...</option>{cc.map((c) => <option key={c.id} value={c.id}>{subjects.find((s) => s.id === c.matiereId)?.nom}</option>)}</select></Field>
        <label className="check span-2"><input type="checkbox" checked={f.all} onChange={(e) => setF({ ...f, all: e.target.checked })} />Créer pour toutes les matières de la classe</label>
        <Field label="Titre" opt><input className="input" value={f.titre} onChange={(e) => setF({ ...f, titre: e.target.value })} placeholder="Ex. Interrogation écrite" /></Field>
        <Field label="Date"><input type="date" className="input" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
        <Field label="Noté sur"><select className="select" value={f.noteMax} onChange={(e) => setF({ ...f, noteMax: Number(e.target.value) })}><option value={20}>20</option><option value={10}>10</option><option value={100}>100</option></select></Field>
      </div>
      <p className="tiny muted mt-12">Plusieurs évaluations d’une même matière dans une période sont moyennées automatiquement.</p>
    </Modal>
  );
}

function Periods() {
  const session = useSession()!;
  const canWrite = session.can('notes', 'write');
  useCollection('periods');
  const periods = sortedPeriods();
  const evaluations = useCollection('evaluations');
  return (
    <div className="card">
      <div className="table-wrap"><table className="t">
        <thead><tr><th>Période</th><th>Du</th><th>Au</th><th className="c">Évaluations</th><th className="c">Clôturées</th><th>Notes verrouillées</th></tr></thead>
        <tbody>{periods.map((p) => {
          const evs = evaluations.filter((e) => e.periodeId === p.id);
          return (
            <tr key={p.id}>
              <td style={{ color: 'var(--ink)', fontWeight: 600 }}>{p.libelle} <span className="muted">({p.court})</span></td>
              <td>{canWrite ? <input type="date" className="input" value={p.debut} onChange={(e) => db.patch('periods', p.id, { debut: e.target.value })} /> : dateShort(p.debut)}</td>
              <td>{canWrite ? <input type="date" className="input" value={p.fin} onChange={(e) => db.patch('periods', p.id, { fin: e.target.value })} /> : dateShort(p.fin)}</td>
              <td className="c">{evs.length}</td>
              <td className="c">{evs.filter((e) => e.statut === 'Clôturé').length}</td>
              <td><div className="row"><Toggle on={p.verrouillee} label="Verrouiller" onChange={(v) => {
                if (!canWrite) return;
                db.patch('periods', p.id, { verrouillee: v });
                if (v) evs.forEach((e) => e.statut !== 'Clôturé' && db.patch('evaluations', e.id, { statut: 'Clôturé' }));
                audit(v ? 'Verrouillage période' : 'Déverrouillage période', p.libelle);
                toast(v ? `${p.libelle} verrouillé` : `${p.libelle} déverrouillé`);
              }} />{p.verrouillee ? <Badge tone="green"><Lock />Verrouillée</Badge> : <Badge tone="blue">Ouverte</Badge>}</div></td>
            </tr>
          );
        })}</tbody>
      </table></div>
      <p className="card-pad small muted">Verrouiller une période clôture toutes ses évaluations : les professeurs ne peuvent plus modifier les notes, les bulletins sont définitifs.</p>
    </div>
  );
}

const CONDUITE = ['Excellente', 'Très bonne', 'Bonne', 'Assez bonne', 'Passable', 'Mauvaise'];
const DECISIONS = ['Admis(e) en classe supérieure', 'Admis(e) sous condition', 'Redouble', 'Exclu(e)', 'Félicitations', 'Tableau d’honneur', 'Encouragements', 'Avertissement', 'En attente'];

function Council() {
  const nav = useNavigate();
  const session = useSession()!;
  const canWrite = session.can('notes', 'write');
  const classes = useCollection('classes').slice().sort((a, b) => a.code.localeCompare(b.code, 'fr', { numeric: true }));
  const entries = useCollection('reportEntries');
  useCollection('grades');
  const periods = sortedPeriods();
  const school = useDoc('school', 'main');
  const [classe, setClasse] = useState('c-s4-a');
  const [scope, setScope] = useState<string>('annuel');
  const report = classReport(classe, scope);
  const pre = isPreschool(report?.classe);
  const seuil = school?.bareme === 100 ? (school.seuilReussite ?? 50) / 5 : school?.seuilReussite ?? 10;
  const entryFor = (eleveId: string) => entries.find((e) => e.eleveId === eleveId && e.periodeId === scope);
  const upsert = (eleveId: string, patch: Partial<ReportCardEntry>) => {
    const cur = entryFor(eleveId);
    const base = cur ?? { id: `re-${eleveId}-${scope}`, eleveId, periodeId: scope, appreciation: '', comportement: { conduite: 'Très bonne', collaboration: 'Bon', respect: 'Bon', participation: 'Active' } };
    db.put('reportEntries', { ...base, ...patch } as ReportCardEntry);
  };
  const autoFill = () => {
    report?.students.forEach((r) => {
      const cur = entryFor(r.student.id);
      upsert(r.student.id, {
        ...autoCouncil(r, scope, seuil),
        ...(cur ? { appreciation: cur.appreciation || autoCouncil(r, scope, seuil).appreciation, decision: cur.decision || autoCouncil(r, scope, seuil).decision } : {}),
      });
    });
    toast('Appréciations et décisions proposées — vérifiez avant impression');
  };
  return (
    <>
      <div className="card card-pad row wrap mb-16" style={{ gap: 12, alignItems: 'flex-end' }}>
        <Field label="Classe"><select className="select" value={classe} onChange={(e) => setClasse(e.target.value)}>{classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}</select></Field>
        <Field label="Période"><select className="select" value={scope} onChange={(e) => setScope(e.target.value)}><option value="annuel">Année complète</option>{periods.map((p) => <option key={p.id} value={p.id}>{p.libelle}</option>)}</select></Field>
        <span className="grow" />
        {canWrite && <button className="btn" onClick={autoFill}><Wand2 />Figer les propositions</button>}
        <button className="btn btn-primary" onClick={() => nav(`/documents/bulletins?classe=${classe}&scope=${scope}`)}><FileText />Générer les bulletins</button>
      </div>
      {report && (
        <Card pad={false}>
          {pre ? <div className="card-pad small muted">Préscolaire : bilan par compétences, sans moyenne ni rang · Effectif : {report.effectif}</div> : <div className="card-pad small muted">Moyenne de la classe : <b style={{ color: 'var(--ink)' }}>{fmtNote(report.classGeneral)}</b> · Réussite : <b style={{ color: 'var(--ink)' }}>{Math.round(report.successRate * 100)}%</b> · Effectif : {report.effectif}</div>}
          <div className="table-wrap"><table className="t t-compact">
            <thead><tr>{!pre && <th>Rang</th>}<th>Élève</th><th className="c">{pre ? 'Bilan' : 'Moy.'}</th>{!pre && <th>Mention</th>}<th style={{ minWidth: 260 }}>Appréciation générale</th><th>Conduite</th><th>{scope === 'annuel' ? 'Décision' : 'Avis du conseil'}</th></tr></thead>
            <tbody>{(pre ? report.students : [...report.students].sort((a, b) => a.rank - b.rank)).map((r) => {
              const saved = entryFor(r.student.id);
              const auto = autoCouncil(r, scope, seuil);
              const e = { appreciation: saved?.appreciation || auto.appreciation, decision: saved?.decision || auto.decision, comportement: { ...auto.comportement, ...(saved?.comportement ?? {}) }, updatedAt: saved?.updatedAt };
              return (
                <tr key={r.student.id}>
                  {!pre && <td className="bold">{r.rank || '-'}</td>}
                  <td><div className="person"><Avatar src={r.student.photo} name={fullName(r.student)} size={28} /><b>{fullName(r.student)}</b></div></td>
                  {pre ? <td className="c"><LevelPill v={r.general} /></td> : <><td className="c bold">{fmtNote(r.general)}</td>
                  <td>{appreciation(r.general).label}</td></>}
                  <td><textarea className="textarea" style={{ minHeight: 44, fontSize: 12.5 }} disabled={!canWrite} defaultValue={e.appreciation} key={`${r.student.id}-${e.updatedAt}`} onBlur={(ev) => ev.target.value !== e.appreciation && upsert(r.student.id, { appreciation: ev.target.value })} placeholder="Appréciation..." /></td>
                  <td><select className="select" disabled={!canWrite} value={e.comportement.conduite} onChange={(ev) => upsert(r.student.id, { comportement: { ...e.comportement, conduite: ev.target.value } as ReportCardEntry['comportement'] })}>{[...new Set([e.comportement.conduite, ...CONDUITE])].map((c) => <option key={c}>{c}</option>)}</select></td>
                  <td><select className="select" disabled={!canWrite} value={e.decision} onChange={(ev) => upsert(r.student.id, { decision: ev.target.value })}>{[...new Set([e.decision, ...DECISIONS])].map((d) => <option key={d}>{d}</option>)}</select></td>
                </tr>
              );
            })}</tbody>
          </table></div>
          <div className="card-pad tiny muted row"><Save size={13} />Tout est rempli automatiquement à partir des notes, des absences et de la discipline. Modifiez seulement ce qui doit l’être : vos changements sont enregistrés et apparaissent sur les bulletins.</div>
        </Card>
      )}
    </>
  );
}
