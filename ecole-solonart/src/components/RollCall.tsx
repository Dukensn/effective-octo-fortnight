import { useEffect, useState } from 'react';
import { Check, Clock, X, FileCheck2, MessageCircle } from 'lucide-react';
import { db, useCollection } from '../data/store';
import type { Attendance, Student } from '../data/types';
import { classStudents } from '../data/compute';
import { Avatar, toast } from './ui';
import { civ, dateShort, fullName } from '../lib/format';
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

  return (
    <div>
      <div className="row wrap mb-12" style={{ gap: 8 }}>
        {STATES.map(({ s }, i) => <span key={s} className={`badge ${['b-green', 'b-orange', 'b-red', 'b-violet'][i]}`}>{s} : {counts[i]}</span>)}
        <span className="grow" />
        {done ? <span className="badge b-green">Appel fait</span> : <span className="badge b-gray">Appel non fait</span>}
      </div>
      <div className="card">
        <div className="list">
          {students.map((s, i) => (
            <div key={s.id} className="list-item" style={{ flexWrap: 'wrap' }}>
              <span className="muted small" style={{ width: 20 }}>{i + 1}</span>
              <Avatar src={s.photo} name={fullName(s)} size={34} />
              <span className="grow" style={{ color: 'var(--ink)', fontWeight: 500, minWidth: 140 }}>{fullName(s)}</span>
              <div className="row" style={{ gap: 4 }}>
                {STATES.map(({ s: st, icon: Icon, cls }) => (
                  <button key={st} disabled={readOnly} title={st} aria-label={st}
                    className={`btn btn-sm btn-icon ${state[s.id] === st ? cls || 'btn-primary' : ''}`}
                    style={state[s.id] === st && st === 'Retard' ? { background: 'var(--orange)', color: '#fff', borderColor: 'var(--orange)' } : state[s.id] === st && st === 'Excusé' ? { background: 'var(--violet)', color: '#fff', borderColor: 'var(--violet)' } : undefined}
                    onClick={() => setState({ ...state, [s.id]: st })}><Icon size={15} /></button>
                ))}
              </div>
            </div>
          ))}
        </div>
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
      {!readOnly && <div className="sticky-foot"><button className="btn btn-primary btn-lg btn-block" onClick={save}>Enregistrer l’appel</button></div>}
    </div>
  );
}
