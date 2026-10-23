import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Copy, Trash2, FileText, IdCard, CalendarDays, Printer } from 'lucide-react';
import { db, useCollection, useDoc } from '../../data/store';
import { PageHead, Tabs, Avatar, StatusBadge, Menu, Empty, Confirm, toast, StatCard, Card } from '../../components/ui';
import { classReport, classStudents, fmtNote, sortedPeriods, appreciation, isPreschool, levelOf } from '../../data/compute';
import { LevelPill } from '../../components/Level';
import { civ, fullName } from '../../lib/format';
import { useSession, audit } from '../../lib/session';
import { callerLabel, classTeacherIds } from '../../lib/regles';
import { ClassForm } from './Classes';
import { ClassComite } from './ClassComite';
import { roleLabel } from '../../lib/comite';
import { Users, GraduationCap, BookOpen, Trophy } from 'lucide-react';
import { printDocument } from '../../lib/print';
import { StudentListSheet } from '../../docs/Sheets';

export default function ClassDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const session = useSession()!;
  const canWrite = session.can('classes', 'write');
  const classe = useDoc('classes', id);
  const courses = useCollection('courses').filter((c) => c.classeId === id);
  const subjects = useCollection('subjects');
  const staff = useCollection('staff');
  useCollection('students');
  useCollection('grades');
  const [tab, setTab] = useState<'eleves' | 'comite' | 'matieres' | 'resultats'>('eleves');
  const [edit, setEdit] = useState(false);
  const [del, setDel] = useState(false);
  const periods = sortedPeriods();
  const [scope, setScope] = useState<string>('annuel');
  if (!classe) return <Empty title="Classe introuvable" />;
  const students = classStudents(classe.id);
  const report = classReport(classe.id, scope);
  const tit = staff.find((s) => s.id === classe.titulaireId);
  const pre = isPreschool(classe);
  const roleOf = (eleveId: string) => { const m = classe.comite?.find((x) => x.eleveId === eleveId); return m && roleLabel(m.role, students.find((x) => x.id === eleveId)?.sexe); };
  const profs = staff.filter((s) => s.type === 'Professeur');
  const subjectOrder = subjects.map((s) => s.id);
  courses.sort((a, b) => subjectOrder.indexOf(a.matiereId) - subjectOrder.indexOf(b.matiereId));

  const duplicate = () => {
    const copy = db.put('classes', { ...classe, id: undefined, code: `${classe.code} (copie)`, nom: `${classe.nom} (copie)` });
    db.bulkPut('courses', courses.map((c) => ({ ...c, id: `${copy.id}-${c.matiereId}`, classeId: copy.id })));
    toast('Classe dupliquée');
    nav(`/classes/${copy.id}`);
  };

  return (
    <>
      <PageHead
        back={<button className="back-link" style={{ border: 0, background: 'none', padding: 0 }} onClick={() => nav('/classes')}><ArrowLeft size={16} />Classes</button>}
        title={classe.code}
        sub={`${classe.nom} · ${classe.salle} · ${classe.niveau === 'Préscolaire' && (classe.cotitulaireIds?.length ?? 0) > 0 ? `Co-titulaires : ${classTeacherIds(classe).map((id) => civ(staff.find((s) => s.id === id))).join(', ')}` : `Titulaire : ${tit ? civ(tit) : '—'}`} · Appel : ${callerLabel(classe)}`}
        actions={<>
          <button className="btn" onClick={() => nav(`/documents/bulletins?classe=${classe.id}`)}><FileText />Bulletins</button>
          {canWrite && <button className="btn btn-primary" onClick={() => setEdit(true)}><Pencil />Modifier</button>}
          <Menu items={[
            { label: 'Imprimer la liste', icon: <Printer />, onClick: () => printDocument(<StudentListSheet students={students} title={`Liste des élèves — ${classe.nom}`} />, 'A4 portrait') },
            { label: 'Badges de la classe', icon: <IdCard />, onClick: () => nav(`/documents/badges?type=eleve&classe=${classe.id}`) },
            { label: 'Emploi du temps', icon: <CalendarDays />, onClick: () => nav(`/emploi-du-temps?classe=${classe.id}`) },
            ...(canWrite ? ['sep' as const, { label: 'Dupliquer la classe', icon: <Copy />, onClick: duplicate }, { label: 'Supprimer la classe', icon: <Trash2 />, onClick: () => setDel(true), danger: true }] : []),
          ]} />
        </>}
      />
      <div className="grid g-stats mb-16">
        <StatCard tint="blue" icon={<Users />} value={`${students.length}/${classe.capacite}`} label="Élèves" sub={`${students.filter((s) => s.sexe === 'F').length} filles · ${students.filter((s) => s.sexe === 'M').length} garçons`} />
        <StatCard tint="green" icon={<BookOpen />} value={courses.length} label={pre ? 'Domaines' : 'Matières'} sub={pre ? 'Évalués par compétences' : `Coef. total ${courses.reduce((a, c) => a + c.coefficient, 0)}`} />
        <StatCard tint="violet" icon={<GraduationCap />} value={new Set(courses.map((c) => c.professeurId)).size} label="Professeurs" />
        {pre
          ? <StatCard tint="orange" icon={<Trophy />} value={`${Math.round((classReport(classe.id, 'annuel')?.students.filter((r) => levelOf(r.general)?.code === 'A').length ?? 0) / Math.max(1, students.length) * 100)}%`} label="Enfants « Acquis »" sub="Bilan de l’année" />
          : <StatCard tint="orange" icon={<Trophy />} value={fmtNote(classReport(classe.id, 'annuel')?.classGeneral)} label="Moyenne annuelle" sub={`${Math.round((classReport(classe.id, 'annuel')?.successRate ?? 0) * 100)}% de réussite`} />}
      </div>
      <Tabs tabs={[['eleves', `Élèves (${students.length})`], ['comite', 'Comité'], ['matieres', pre ? 'Domaines' : 'Matières'], ['resultats', 'Résultats']]} value={tab} onChange={setTab} />

      {tab === 'comite' && <ClassComite classe={classe} canWrite={canWrite} />}

      {tab === 'eleves' && (
        <Card pad={false}>
          <div className="table-wrap"><table className="t">
            <thead><tr><th>#</th><th>Élève</th><th>Matricule</th><th className="only-desktop">Sexe</th><th>Statut</th></tr></thead>
            <tbody>{students.map((s, i) => (
              <tr key={s.id} className="clickable" onClick={() => nav(`/eleves/${s.id}`)}>
                <td className="muted">{i + 1}</td><td><div className="person"><Avatar src={s.photo} name={fullName(s)} size={32} /><b>{fullName(s)}</b>{roleOf(s.id) && <span className="badge b-violet">{roleOf(s.id)}</span>}</div></td>
                <td>{s.matricule}</td><td className="only-desktop">{s.sexe}</td><td><StatusBadge s={s.statut} /></td>
              </tr>))}</tbody>
          </table></div>
        </Card>
      )}

      {tab === 'matieres' && (
        <Card pad={false}>
          <div className="table-wrap"><table className="t">
            <thead><tr><th>Matière</th><th>Professeur</th><th className="c">Coefficient</th><th className="c">Heures / sem.</th></tr></thead>
            <tbody>{courses.map((c) => (
              <tr key={c.id}>
                <td style={{ color: 'var(--ink)', fontWeight: 500 }}>{subjects.find((s) => s.id === c.matiereId)?.nom}</td>
                <td>{canWrite ? (
                  <select className="select" style={{ minWidth: 200 }} value={c.professeurId ?? ''} onChange={(e) => { db.patch('courses', c.id, { professeurId: e.target.value || undefined }); toast('Professeur affecté'); }}>
                    <option value="">— Non affecté —</option>{profs.map((p) => <option key={p.id} value={p.id}>{civ(p)} · {p.specialite}</option>)}
                  </select>) : civ(staff.find((s) => s.id === c.professeurId))}
                </td>
                <td className="c">{canWrite ? <input type="number" min={1} max={10} className="input" style={{ width: 70, textAlign: 'center' }} value={c.coefficient} onChange={(e) => db.patch('courses', c.id, { coefficient: Math.max(1, Number(e.target.value)) })} /> : c.coefficient}</td>
                <td className="c">{canWrite ? <input type="number" min={1} max={10} className="input" style={{ width: 70, textAlign: 'center' }} value={c.heuresSemaine} onChange={(e) => db.patch('courses', c.id, { heuresSemaine: Number(e.target.value) })} /> : c.heuresSemaine}</td>
              </tr>))}</tbody>
          </table></div>
          {canWrite && (
            <div className="card-pad row wrap">
              <span className="small muted">Ajouter une matière :</span>
              {subjects.filter((s) => !courses.some((c) => c.matiereId === s.id)).map((s) => (
                <button key={s.id} className="btn btn-sm btn-soft" onClick={() => db.put('courses', { id: `${classe.id}-${s.id}`, classeId: classe.id, matiereId: s.id, coefficient: 2, heuresSemaine: 3 })}>+ {s.nom}</button>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'resultats' && report && (
        <Card pad={false}>
          <div className="card-pad row wrap">
            <select className="select" style={{ width: 200 }} value={scope} onChange={(e) => setScope(e.target.value)}>
              <option value="annuel">{pre ? "Bilan annuel" : "Moyenne annuelle"}</option>{periods.map((p) => <option key={p.id} value={p.id}>{p.libelle}</option>)}
            </select>
            {pre ? <span className="small muted">Évaluation par compétences : A acquis · EC en cours · NA non acquis</span> : <span className="small muted">Moyenne de classe : <b style={{ color: 'var(--ink)' }}>{fmtNote(report.classGeneral)}</b> · Plus haute : <b style={{ color: 'var(--green)' }}>{fmtNote(report.best)}</b> · Plus basse : <b style={{ color: 'var(--red)' }}>{fmtNote(report.worst)}</b></span>}
          </div>
          <div className="table-wrap"><table className="t">
            <thead><tr>{!pre && <th>Rang</th>}<th>Élève</th><th className="c">{pre ? 'Bilan' : 'Moyenne / 20'}</th><th>Appréciation</th></tr></thead>
            <tbody>{(pre ? report.students : [...report.students].sort((a, b) => a.rank - b.rank || (b.general ?? 0) - (a.general ?? 0))).map((r) => (
              <tr key={r.student.id} className="clickable" onClick={() => nav(`/eleves/${r.student.id}`)}>
                {!pre && <td className="bold">{r.general != null ? r.rank : '-'}</td>}
                <td><div className="person"><Avatar src={r.student.photo} name={fullName(r.student)} size={30} /><b>{fullName(r.student)}</b></div></td>
                {pre ? <><td className="c"><LevelPill v={r.general} /></td><td>{levelOf(r.general)?.label ?? '-'}</td></> : <><td className="c bold">{fmtNote(r.general)}</td><td>{appreciation(r.general).label}</td></>}
              </tr>))}</tbody>
          </table></div>
        </Card>
      )}

      {edit && <ClassForm value={classe} onClose={() => setEdit(false)} />}
      <Confirm open={del} onClose={() => setDel(false)} danger title="Supprimer la classe" confirmLabel="Supprimer"
        message={students.length ? `Impossible : ${students.length} élèves sont encore inscrits dans cette classe. Transférez-les d’abord.` : 'Cette classe et ses affectations de matières seront supprimées.'}
        onConfirm={() => { if (students.length) return toast('Transférez d’abord les élèves', true); courses.forEach((c) => db.remove('courses', c.id)); db.remove('classes', classe.id); audit('Suppression classe', classe.code); toast('Classe supprimée'); nav('/classes'); }} />
    </>
  );
}
