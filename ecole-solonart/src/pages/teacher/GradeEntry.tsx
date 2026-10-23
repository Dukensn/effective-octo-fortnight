import { useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, Lock } from 'lucide-react';
import { db, useCollection, useDoc } from '../../data/store';
import { classStudents, gradesForEvaluation, isPreschool, levelOf, LEVELS } from '../../data/compute';
import { Avatar, Empty, Modal, ScreenHead, toast } from '../../components/ui';
import { fullName } from '../../lib/format';
import { useSession, audit } from '../../lib/session';

/** Saisie des notes d'une évaluation — utilisée par le professeur et par l'administration. */
export default function GradeEntry({ admin }: { admin?: boolean }) {
  const { id } = useParams();
  const nav = useNavigate();
  const session = useSession()!;
  const ev = useDoc('evaluations', id);
  const classe = useDoc('classes', ev?.classeId);
  const subject = useDoc('subjects', ev?.matiereId);
  const period = useDoc('periods', ev?.periodeId);
  const course = useDoc('courses', ev?.coursId);
  useCollection('grades');
  const students = ev ? classStudents(ev.classeId) : [];
  const existing = ev ? gradesForEvaluation(ev.id) : new Map();
  const draftKey = `solonart:brouillon:${id}`;
  const [values, setValuesRaw] = useState<Record<string, string>>(() => {
    const saved = Object.fromEntries(students.map((s) => {
      const g = existing.get(s.id);
      return [s.id, g ? (g.absent ? 'abs' : g.note !== null ? String(g.note).replace('.', ',') : '') : ''];
    }));
    // Reprend un brouillon non enregistré (page fermée, batterie, coupure…)
    try { const d = localStorage.getItem(draftKey); if (d) return { ...saved, ...JSON.parse(d) }; } catch { /* ignore */ }
    return saved;
  });
  const [restored] = useState(() => { try { return !!localStorage.getItem(draftKey); } catch { return false; } });
  const setValues = (v: Record<string, string>) => { setValuesRaw(v); try { localStorage.setItem(draftKey, JSON.stringify(v)); } catch { /* ignore */ } };
  const [done, setDone] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const max = ev?.noteMax ?? 20;
  const pre = isPreschool(classe);

  const parsed = useMemo(() => Object.fromEntries(Object.entries(values).map(([k, v]) => {
    const t = v.trim().toLowerCase();
    if (!t) return [k, { ok: true, empty: true }];
    if (t === 'abs' || t === 'a') return [k, { ok: true, absent: true }];
    const n = Number(t.replace(',', '.'));
    return [k, { ok: !Number.isNaN(n) && n >= 0 && n <= max, note: n }];
  })), [values, max]) as Record<string, { ok: boolean; empty?: boolean; absent?: boolean; note?: number }>;

  if (!ev) return <Empty title="Évaluation introuvable" />;
  const isOwner = course?.professeurId === session.user.staffId;
  const canAdmin = admin && session.can('notes', 'write');
  const locked = !canAdmin && (period?.verrouillee || ev.statut === 'Clôturé');
  if (!isOwner && !canAdmin) return <Empty title="Accès refusé">Cette évaluation ne fait pas partie de vos cours.</Empty>;

  const filled = Object.values(parsed).filter((p) => !p.empty).length;
  const invalid = Object.values(parsed).filter((p) => !p.ok).length;
  const back = () => nav(admin ? '/notes' : `/prof/classes/${ev.coursId}`);

  const save = () => {
    if (invalid) return toast(`${invalid} note(s) invalide(s) : entre 0 et ${max}, ou « abs »`, true);
    const docs = students.flatMap((s) => {
      const p = parsed[s.id];
      const cur = existing.get(s.id);
      if (p.empty) { if (cur) db.remove('grades', cur.id); return []; }
      return [{ id: cur?.id ?? `gr-${ev.id}-${s.id}`, evaluationId: ev.id, eleveId: s.id, note: p.absent ? null : Math.round(p.note! * 100) / 100, absent: !!p.absent }];
    });
    db.bulkPut('grades', docs);
    try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
    db.patch('evaluations', ev.id, { statut: ev.statut === 'Clôturé' ? 'Clôturé' : 'En cours', saisiePar: session.user.id, saisieLe: Date.now() });
    audit('Saisie des notes', `${subject?.nom} ${classe?.code} ${ev.titre} (${docs.length})`);
    setDone(true);
  };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <ScreenHead title={`${classe?.code} - ${ev.titre}`} sub={subject?.nom} onBack={back} right={<span className="badge b-blue" style={{ alignSelf: 'center' }}>{filled}/{students.length}</span>} />
      {restored && !locked && <div className="card card-pad mb-16 small" style={{ background: 'var(--primary-50)', border: 0 }}>Brouillon récupéré : vos notes non enregistrées ont été remises. Pensez à enregistrer.</div>}
      {locked && <div className="card card-pad mb-16 row" style={{ background: 'var(--orange-50)', border: 0 }}><Lock size={18} color="var(--orange)" /><span className="small">Notes verrouillées par la direction. Contactez l’administration pour toute correction.</span></div>}
      <div className="card">
        <table className="t">
          <thead><tr><th style={{ width: 40 }}>#</th><th>Élève</th><th className="right" style={{ width: pre ? 200 : 110 }}>{pre ? 'Niveau' : `Note / ${max}`}</th></tr></thead>
          <tbody>{students.map((s, i) => {
            const p = parsed[s.id];
            return (
              <tr key={s.id}>
                <td className="muted">{i + 1}</td>
                <td><div className="person"><Avatar src={s.photo} name={fullName(s)} size={28} /><span style={{ color: 'var(--ink)' }}>{fullName(s)}</span></div></td>
                <td className="right">
                  {pre ? (
                    <span className="level-picker" role="group" aria-label={`Niveau de ${fullName(s)}`}>
                      {LEVELS.map((l) => {
                        const on = !p?.empty && !p?.absent && levelOf(((p?.note ?? 0) / max) * 20)?.code === l.code;
                        const v = String(Math.round((l.note * max) / 20 * 100) / 100).replace('.', ',');
                        return <button key={l.code} type="button" title={l.label} disabled={locked} className={on ? 'on' : ''} style={on ? { background: l.bg, color: l.color, borderColor: l.color } : undefined} onClick={() => setValues({ ...values, [s.id]: on ? '' : v })}>{l.code}</button>;
                      })}
                      <button type="button" title="Absent" disabled={locked} className={p?.absent ? 'on' : ''} onClick={() => setValues({ ...values, [s.id]: p?.absent ? '' : 'abs' })}>abs</button>
                    </span>
                  ) : (
                  <input
                    ref={(el) => { refs.current[i] = el; }}
                    className={`note-input ${p && !p.ok ? 'bad' : ''}`}
                    inputMode="decimal" enterKeyHint={i === students.length - 1 ? 'done' : 'next'}
                    disabled={locked} value={values[s.id] ?? ''} placeholder="" aria-label={`Note de ${fullName(s)}`}
                    onChange={(e) => setValues({ ...values, [s.id]: e.target.value })}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); refs.current[i + 1]?.focus(); } if (e.key === 'ArrowUp') { e.preventDefault(); refs.current[i - 1]?.focus(); } }}
                  />
                  )}
                </td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
      {pre ? <p className="tiny muted mt-8">Préscolaire : touchez A (acquis), EC (en cours d’acquisition) ou NA (non acquis). Touchez à nouveau pour effacer.</p> : <p className="tiny muted mt-8">Astuce : tapez « abs » pour un élève absent. Entrée passe à l’élève suivant. Les notes sont enregistrées sur l’appareil et synchronisées avec l’administration.</p>}
      {!locked && (
        <div className="sticky-foot">
          <button className="btn btn-soft btn-lg grow" onClick={() => { try { localStorage.removeItem(draftKey); } catch { /* ignore */ } back(); }}>Annuler</button>
          <button className="btn btn-primary btn-lg grow" onClick={save}>Enregistrer</button>
        </div>
      )}
      <Modal open={done} onClose={() => setDone(false)} title="">
        <div className="center" style={{ padding: '0 8px 8px' }}>
          <div style={{ width: 76, height: 76, borderRadius: '50%', background: 'var(--green)', display: 'grid', placeItems: 'center', margin: '0 auto' }}><Check color="#fff" size={44} strokeWidth={3} /></div>
          <h2 className="mt-16" style={{ fontSize: 21 }}>Notes enregistrées<br />avec succès !</h2>
          <p className="muted small mt-12">Les notes du {ev.titre} pour la classe {classe?.code} ont été enregistrées.</p>
          <div className="stack mt-24" style={{ gap: 10 }}>
            <button className="btn btn-primary btn-lg" onClick={() => nav(admin ? `/notes/palmares/${ev.id}` : `/prof/evaluation/${ev.id}`, { replace: true })}>Voir le palmarès</button>
            <button className="btn btn-soft btn-lg" onClick={() => nav(admin ? '/notes' : '/prof/classes', { replace: true })}>Retour aux classes</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

