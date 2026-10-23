import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Pencil, Printer, FileText, FileSpreadsheet, Lock, History, MoreVertical, Unlock } from 'lucide-react';
import { db, useCollection, useDoc } from '../../data/store';
import { evaluationStats, fmtNote, isPreschool, levelOf, LEVELS } from '../../data/compute';
import { Empty, Modal, toast, useIsDesktop, Confirm, ScreenHead } from '../../components/ui';
import { fullName, dateShort, downloadCSV, timeAgo } from '../../lib/format';
import { useSession, audit } from '../../lib/session';
import { printDocument } from '../../lib/print';
import { PalmaresSheet } from '../../docs/Sheets';

export default function Palmares({ admin }: { admin?: boolean }) {
  const { id } = useParams();
  const nav = useNavigate();
  const session = useSession()!;
  const desktop = useIsDesktop();
  const ev = useDoc('evaluations', id);
  const classe = useDoc('classes', ev?.classeId);
  const subject = useDoc('subjects', ev?.matiereId);
  const period = useDoc('periods', ev?.periodeId);
  const course = useDoc('courses', ev?.coursId);
  const audits = useCollection('audit');
  useCollection('grades');
  const [actions, setActions] = useState(false);
  const [closeAsk, setCloseAsk] = useState(false);
  const [hist, setHist] = useState(false);
  if (!ev) return <Empty title="Évaluation introuvable" />;
  const isOwner = course?.professeurId === session.user.staffId;
  const canEdit = (admin && session.can('notes', 'write')) || (isOwner && !period?.verrouillee && ev.statut !== 'Clôturé');
  const st = evaluationStats(ev);
  const pre = isPreschool(classe);
  const after = st.saisies > 0;
  const lvl = (note?: number | null) => levelOf(note == null ? null : (note / ev.noteMax) * 20);
  const entryUrl = admin ? `/notes/saisie/${ev.id}` : `/prof/evaluation/${ev.id}/saisie`;
  const sheet = <PalmaresSheet ev={ev} />;
  const printIt = () => printDocument(sheet, 'A4 portrait', `Palmarès ${classe?.code} ${subject?.nom} ${ev.titre}`);
  const excel = () => downloadCSV(`palmares-${classe?.code}-${subject?.court}-${ev.titre}.csv`, [['Rang', 'Élève', 'Matricule', `Note / ${ev.noteMax}`], ...st.ranked.map((r) => [st.rankOf.get(r.student.id), fullName(r.student), r.student.matricule, r.grade?.note]), ...st.rows.filter((r) => r.grade?.note == null).map((r) => ['-', fullName(r.student), r.student.matricule, r.grade?.absent ? 'Absent' : ''])]);
  // Préscolaire : pas de classement, les enfants restent dans l'ordre de la liste.
  const rows = after && !pre ? [...st.ranked, ...st.rows.filter((r) => r.grade?.note == null)] : st.rows;
  const history = audits.filter((a) => a.detail.includes(`${subject?.nom} ${classe?.code} ${ev.titre}`)).sort((a, b) => b.date - a.date);

  const ActionList = (
    <div className="qa" style={{ gap: 10 }}>
      {canEdit && <button onClick={() => nav(entryUrl)}><Pencil />Modifier les notes</button>}
      <button onClick={printIt}><Printer />Imprimer le palmarès</button>
      <button onClick={printIt}><FileText style={{ color: 'var(--red)' }} />Exporter en PDF</button>
      <button onClick={excel}><FileSpreadsheet style={{ color: 'var(--green)' }} />Télécharger en Excel</button>
      {canEdit && ev.statut !== 'Clôturé' && after && <button className="danger" style={{ background: 'var(--red-50)' }} onClick={() => setCloseAsk(true)}><Lock />Clôturer le contrôle</button>}
      {admin && ev.statut === 'Clôturé' && session.can('notes', 'write') && <button onClick={() => { db.patch('evaluations', ev.id, { statut: 'En cours' }); toast('Contrôle rouvert'); }}><Unlock />Rouvrir le contrôle</button>}
      <button onClick={() => setHist(true)}><History />Voir l’historique</button>
    </div>
  );

  return (
    <div className="split split-side" style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div>
        <ScreenHead title={`${classe?.code} - ${ev.titre}`} sub={`${subject?.nom} · ${dateShort(ev.date)}`} onBack={() => nav(-1)}
          right={<span className="badge b-blue" style={{ alignSelf: 'center' }}>{st.total} élèves</span>}
          menu={!desktop && <button className="icon-btn" onClick={() => setActions(true)} aria-label="Actions"><MoreVertical /></button>} />
        <div className="card">
          <table className="t">
            <thead><tr><th style={{ width: 40 }}>#</th><th>Élève</th><th className="c">{pre ? 'Niveau' : `Note / ${ev.noteMax}`}</th>{after && !pre && <th className="c">Rang</th>}</tr></thead>
            <tbody>{rows.map((r, i) => (
              <tr key={r.student.id}>
                <td className="muted">{i + 1}</td>
                <td style={{ color: 'var(--ink)' }}>{fullName(r.student)}</td>
                <td className="c bold">{r.grade?.absent ? <span className="badge b-red">Abs.</span> : r.grade?.note == null ? '-' : pre ? (() => { const l = lvl(r.grade.note)!; return <span className="lvl" title={l.label} style={{ background: l.bg, color: l.color }}>{l.code}</span>; })() : fmtNote(r.grade.note)}</td>
                {after && !pre && <td className="c">{st.rankOf.get(r.student.id) ?? '-'}</td>}
              </tr>
            ))}</tbody>
          </table>
        </div>
        {after && pre && (
          <div className="grid mt-16" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {LEVELS.map((l) => (
              <div key={l.code} className="card center" style={{ padding: 12, background: l.bg, border: 0 }}><div className="tiny" style={{ color: l.color }}>{l.label}</div><div style={{ fontSize: 20, fontWeight: 800, color: l.color }}>{st.rows.filter((r) => !r.grade?.absent && lvl(r.grade?.note)?.code === l.code).length}</div></div>
            ))}
          </div>
        )}
        {after && !pre && (
          <div className="grid mt-16" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <div className="card center" style={{ padding: 12, background: 'var(--primary-50)', border: 0 }}><div className="tiny muted">Moyenne</div><div style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)' }}>{fmtNote(st.moyenne)} <span className="tiny muted">/ {ev.noteMax}</span></div></div>
            <div className="card center" style={{ padding: 12, background: 'var(--green-50)', border: 0 }}><div className="tiny" style={{ color: 'var(--green)' }}>Plus haute</div><div style={{ fontSize: 20, fontWeight: 800, color: 'var(--green)' }}>{fmtNote(st.max)}</div></div>
            <div className="card center" style={{ padding: 12, background: 'var(--red-50)', border: 0 }}><div className="tiny" style={{ color: 'var(--red)' }}>Plus basse</div><div style={{ fontSize: 20, fontWeight: 800, color: 'var(--red)' }}>{fmtNote(st.min)}</div></div>
          </div>
        )}
        {canEdit && !after && <div className="sticky-foot"><button className="btn btn-primary btn-lg btn-block" onClick={() => nav(entryUrl)}><Pencil />Saisir les notes</button></div>}
      </div>
      {desktop && <div className="card card-pad"><h3 style={{ fontSize: 16 }} className="mb-12">Actions</h3>{ActionList}</div>}
      <Modal open={actions} onClose={() => setActions(false)} title={`${classe?.code} - ${ev.titre}`}>{ActionList}</Modal>
      <Confirm open={closeAsk} onClose={() => setCloseAsk(false)} title="Clôturer le contrôle" confirmLabel="Clôturer"
        message="Après clôture, les notes ne pourront plus être modifiées par le professeur. Seule la direction pourra rouvrir le contrôle."
        onConfirm={() => { db.patch('evaluations', ev.id, { statut: 'Clôturé' }); audit('Clôture contrôle', `${subject?.nom} ${classe?.code} ${ev.titre}`); toast('Contrôle clôturé'); }} />
      <Modal open={hist} onClose={() => setHist(false)} title="Historique">
        {history.length === 0 ? <p className="muted small">Aucune modification enregistrée sur cet appareil.</p> : history.map((h) => (
          <div key={h.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--line-2)' }}><b style={{ color: 'var(--ink)' }}>{h.action}</b><div className="tiny muted">{db.get('users', h.userId)?.nom ?? '—'} · {timeAgo(h.date)}</div></div>
        ))}
        {ev.saisieLe && <p className="tiny muted mt-12">Dernière saisie : {timeAgo(ev.saisieLe)}</p>}
      </Modal>
    </div>
  );
}
