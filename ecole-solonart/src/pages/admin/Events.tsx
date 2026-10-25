import { useState } from 'react';
import { Plus, MapPin, Clock, Trash2 } from 'lucide-react';
import { db, useCollection } from '../../data/store';
import type { SchoolEvent } from '../../data/types';
import { PageHead, Modal, Field, toast, Badge, Empty, type BadgeTone } from '../../components/ui';
import { monthLabel } from '../../lib/format';
import { useSession } from '../../lib/session';

const TONE: Record<SchoolEvent['type'], BadgeTone> = { Réunion: 'blue', Examen: 'red', Congé: 'green', Activité: 'violet', Fête: 'orange' };

export default function Events() {
  const session = useSession()!;
  const canWrite = !session.isTeacher && session.can('communication', 'write');
  const events = useCollection('events').slice().sort((a, b) => a.date.localeCompare(b.date));
  const [edit, setEdit] = useState<Partial<SchoolEvent> | null>(null);
  const months = [...new Set(events.map((e) => e.date.slice(0, 7)))];
  return (
    <>
      <PageHead title="Événements" sub="Calendrier de l’école : réunions, examens, congés et activités."
        actions={canWrite && <button className="btn btn-primary" onClick={() => setEdit({ type: 'Réunion', date: new Date().toISOString().slice(0, 10) })}><Plus />Nouvel événement</button>} />
      {events.length === 0 && <Empty title="Aucun événement" />}
      <div className="stack">
        {months.map((m) => (
          <div key={m}>
            <h3 style={{ fontSize: 15 }} className="mb-8">{monthLabel(m)}</h3>
            <div className="card">
              {events.filter((e) => e.date.startsWith(m)).map((e) => (
                <div key={e.id} className="list-item" style={{ cursor: canWrite ? 'pointer' : undefined }} onClick={() => canWrite && setEdit(e)}>
                  <div style={{ width: 50, textAlign: 'center', flex: 'none' }}><div style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>{Number(e.date.slice(8))}</div><div className="tiny muted">{monthLabel(m).split(' ')[0].slice(0, 4)}.</div></div>
                  <div className="grow"><b style={{ color: 'var(--ink)' }}>{e.titre}</b><div className="tiny muted row wrap" style={{ gap: 10 }}>{e.heure && <span className="row" style={{ gap: 4 }}><Clock size={12} />{e.heure}</span>}{e.lieu && <span className="row" style={{ gap: 4 }}><MapPin size={12} />{e.lieu}</span>}</div>{e.description && <div className="small muted">{e.description}</div>}</div>
                  <Badge tone={TONE[e.type]}>{e.type}</Badge>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {edit && (
        <Modal open onClose={() => setEdit(null)} title={edit.id ? 'Modifier l’événement' : 'Nouvel événement'}
          footer={<>{edit.id && <button className="btn btn-danger" style={{ marginRight: 'auto' }} onClick={() => { db.remove('events', edit.id!); setEdit(null); toast('Supprimé'); }}><Trash2 size={15} /></button>}<button className="btn" onClick={() => setEdit(null)}>Annuler</button><button className="btn btn-primary" onClick={() => { if (!edit.titre || !edit.date) return toast('Titre et date requis', true); db.put('events', edit as SchoolEvent); setEdit(null); toast('Événement enregistré'); }}>Enregistrer</button></>}>
          <div className="form-grid">
            <Field label="Titre" req className="span-2"><input className="input" value={edit.titre ?? ''} onChange={(e) => setEdit({ ...edit, titre: e.target.value })} /></Field>
            <Field label="Date" req><input type="date" className="input" value={edit.date ?? ''} onChange={(e) => setEdit({ ...edit, date: e.target.value })} /></Field>
            <Field label="Heure" opt><input type="time" className="input" value={edit.heure ?? ''} onChange={(e) => setEdit({ ...edit, heure: e.target.value })} /></Field>
            <Field label="Type"><select className="select" value={edit.type} onChange={(e) => setEdit({ ...edit, type: e.target.value as SchoolEvent['type'] })}>{Object.keys(TONE).map((t) => <option key={t}>{t}</option>)}</select></Field>
            <Field label="Lieu" opt><input className="input" value={edit.lieu ?? ''} onChange={(e) => setEdit({ ...edit, lieu: e.target.value })} /></Field>
            <Field label="Description" opt className="span-2"><textarea className="textarea" value={edit.description ?? ''} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></Field>
          </div>
        </Modal>
      )}
    </>
  );
}
