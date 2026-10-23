import { useEffect, useState } from 'react';
import { Check, Clock, X, FileCheck2, MessageCircle, Users } from 'lucide-react';
import { db, useCollection } from '../data/store';
import type { Attendance, Student } from '../data/types';
import { classStudents } from '../data/compute';
import { Avatar, SearchInput, toast } from './ui';
import { civ, dateShort, fullName, norm } from '../lib/format';
import { notifyAttendance } from '../lib/chat';
import { contactOf, phoneDigits } from '../lib/relance';
import { useSession, audit } from '../lib/session';

const STATES: { s: Attendance['statut']; icon: typeof Check; cls: string }[] = [
  { s: 'Présent', icon: Check, cls: 'btn-success' },
  { s: 'Retard', icon: Clock, cls: '' },
  { s: 'Absent', icon: X, cls: 'btn-danger' },
  { s: 'Excusé', icon: FileCheck2, cls: '' },
];

/** Feuille d'appel : par défaut tout le monde est présent, on ne touche que les exceptions. */
export function RollCall({ classeId, date, readOnly }: { classeId: string; date: string; readOnly?: boolean }) {
  const session = useSession()!;
  const attendance = useCollection('attendance');
  const students = classStudents(classeId);
  const doneId = `at-${date}-${classeId}-done`;
  const done = attendance.some((a) => a.id === doneId);
  const existing = new Map(attendance.filter((a) => a.date === date && a.classeId === classeId && a.eleveId).map((a) => [a.eleveId, a]));
  const [state, setState] = useState<Record<string, Attendance['statut']>>({});
  const [q, setQ] = useState('');
  const [alerted, setAlerted] = useState<{ s: Student; st: 'Absent' | 'Retard' }[]>([]);
  useEffect(() => {
    setState(Object.fromEntries(students.map((s) => [s.id, existing.get(s.id)?.statut ?? 'Présent'])));
  }, [classeId, date, attendance.length]); // eslint-disable-line

  const counts = STATES.map(({ s }) => Object.values(state).filter((x) => x === s).length);
  const save = () => {
    const alerts: { s: Student; st: 'Absent' | 'Retard' }[] = [];
    for (const s of students) {
      const st = state[s.id] ?? 'Présent';
      const id = `at-${date}-${s.id}`;
      const cur = existing.get(s.id);
      if (st === 'Présent') { if (cur) db.remove('attendance', cur.id); }
      else if (!cur || cur.statut !== st) db.put('attendance', { id, date, classeId, eleveId: s.id, statut: st, saisiePar: session.user.id });
      // Le parent est prévenu automatiquement dans sa messagerie (absence ou retard).
      if ((st === 'Absent' || st === 'Retard') && notifyAttendance(s, st, date)) alerts.push({ s, st });
    }
    setAlerted(alerts);
    db.put('attendance', { id: doneId, date, classeId, eleveId: '', statut: 'Présent', saisiePar: session.user.id });
    audit('Appel', `${db.get('classes', classeId)?.code} ${date}`);
    toast(`Appel enregistré : ${counts[2]} absent(s), ${counts[1]} retard(s)`);
  };

  const present = counts[0];
  const shown = q ? students.filter((s) => norm(fullName(s)).includes(norm(q))) : students;
  return (
    <div>
      <div className="card card-pad mb-12 rc-head">
        <span className="tint-blue" style={{ width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center' }}><Users /></span>
        <div className="grow"><b style={{ color: 'var(--ink)' }}>{students.length} élèves</b>
          <div className="tiny rc-counts"><span><i style={{ background: 'var(--green)' }} />{present} présent(s)</span><span><i style={{ background: 'var(--red)' }} />{counts[2]} absent(s)</span><span><i style={{ background: 'var(--orange)' }} />{counts[1]} en retard</span>{counts[3] > 0 && <span><i style={{ background: 'var(--violet)' }} />{counts[3]} excusé(s)</span>}</div></div>
        {done ? <span className="badge b-green">Fait</span> : <span className="badge b-red">Non fait</span>}
      </div>
      <div className="row mb-12" style={{ gap: 8 }}>
        <div className="grow"><SearchInput value={q} onChange={setQ} placeholder="Rechercher un élève…" /></div>
        {!readOnly && <button className="btn" onClick={() => setState(Object.fromEntries(students.map((s) => [s.id, 'Présent'])))}>Tout présent</button>}
      </div>
      <div className="card rc-grid">
        <div className="rc-row rc-th"><span>#</span><span>Élève</span>{STATES.map(({ s: st }) => <span key={st} title={st}>{st === 'Excusé' ? 'E' : st[0]}</span>)}</div>
        {shown.map((s) => (
          <div key={s.id} className="rc-row">
            <span className="muted small">{students.indexOf(s) + 1}</span>
            <span className="rc-name"><Avatar src={s.photo} name={fullName(s)} size={32} /><span>{fullName(s)}</span></span>
            {STATES.map(({ s: st }, k) => (
              <button key={st} type="button" disabled={readOnly} aria-label={`${st} — ${fullName(s)}`} aria-pressed={state[s.id] === st}
                className={`rc-dot k${k} ${state[s.id] === st ? 'on' : ''}`} onClick={() => setState({ ...state, [s.id]: st })}>{state[s.id] === st && <Check size={14} strokeWidth={3} />}</button>
            ))}
          </div>
        ))}
        {shown.length === 0 && <p className="small muted card-pad">Aucun élève trouvé.</p>}
      </div>
      {alerted.length > 0 && (
        <div className="card card-pad mt-16">
          <b style={{ color: 'var(--ink)' }}>Parents prévenus dans la messagerie ({alerted.length})</b>
          <p className="tiny muted mb-12">Pour une absence urgente, envoyez aussi un WhatsApp déjà rédigé :</p>
          <div className="list">{alerted.map(({ s, st }) => {
            const g = contactOf(s);
            const text = `Bonjour ${g ? civ(g) : ''}, ${st === 'Absent' ? `${s.prenom} n’est pas en classe aujourd’hui (${dateShort(date)})` : `${s.prenom} est arrivé${s.sexe === 'F' ? 'e' : ''} en retard aujourd’hui (${dateShort(date)})`}. Merci de nous contacter. — ${db.get('school', 'main')?.nom ?? ''}`;
            return (
              <div key={s.id} className="list-item">
                <span className="grow">{fullName(s)} <span className={`badge ${st === 'Absent' ? 'b-red' : 'b-orange'}`}>{st}</span></span>
                {g ? <a className="btn btn-sm btn-soft" target="_blank" rel="noreferrer" href={`https://wa.me/${phoneDigits(g.whatsapp ?? g.telephone)}?text=${encodeURIComponent(text)}`}><MessageCircle size={14} />WhatsApp</a> : <span className="tiny muted">Aucun parent</span>}
              </div>
            );
          })}</div>
        </div>
      )}
      {!readOnly && <div className="sticky-foot"><button className="btn btn-primary btn-lg btn-block" onClick={save}>Enregistrer l’appel ({present} présent{present > 1 ? 's' : ''})</button></div>}
    </div>
  );
}
