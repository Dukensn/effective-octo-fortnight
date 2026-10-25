// Fil de discussion (style WhatsApp) et liste des fils, partagés par les espaces parent, professeur et direction.
import { useEffect, useRef, useState } from 'react';
import { Send, ArrowLeft, Bell, School, GraduationCap } from 'lucide-react';
import { db, useCollection } from '../data/store';
import type { ChatMessage, ID } from '../data/types';
import { Avatar, Empty } from './ui';
import { fullName, timeAgo } from '../lib/format';
import { markRead, sendChat, staffName, threadMessages, type Side, type Thread } from '../lib/chat';
import { useSession } from '../lib/session';

const hour = (t: number) => new Date(t).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

/** Titre d'un fil vu de ce côté. */
export function threadTitle(t: Pick<Thread, 'eleveId' | 'canal' | 'staffId'>, side: Side) {
  const s = db.get('students', t.eleveId);
  const who = t.canal === 'ecole' ? 'École' : staffName(t.staffId);
  return side === 'parent' ? who : side === 'prof' ? `Parents de ${fullName(s)}` : t.canal === 'ecole' ? `Parents de ${fullName(s)}` : `${who} ↔ parents de ${fullName(s)}`;
}

export function ThreadList({ threads, side, onOpen, empty }: { threads: Thread[]; side: Side; onOpen: (t: Thread) => void; empty: string }) {
  if (!threads.length) return <Empty title={empty} />;
  return (
    <div className="list">{threads.map((t) => {
      const s = db.get('students', t.eleveId);
      const sys = t.last?.auteur === 'systeme';
      return (
        <button key={t.key} className="list-item thread-row" onClick={() => onOpen(t)}>
          {side === 'parent' ? <span className={`thread-ic ${t.canal}`}>{t.canal === 'ecole' ? <School size={18} /> : <GraduationCap size={18} />}</span> : <Avatar src={s?.photo} name={fullName(s)} size={40} />}
          <span className="grow" style={{ minWidth: 0 }}>
            <b className="ellipsis" style={{ display: 'block', color: 'var(--ink)' }}>{threadTitle(t, side)}</b>
            <span className="tiny muted ellipsis" style={{ display: 'block' }}>{sys && <Bell size={11} style={{ verticalAlign: -1, marginRight: 3 }} />}{t.last?.texte ?? 'Aucun message'}</span>
          </span>
          <span className="right" style={{ flex: 'none' }}><span className="tiny muted">{t.last ? timeAgo(t.last.date) : ''}</span>{t.unread > 0 && <span className="unread">{t.unread}</span>}</span>
        </button>
      );
    })}</div>
  );
}

/** Un fil : messages + champ de réponse (si autorisé). Marque comme lu à l'ouverture. */
export function ThreadView({ eleveId, canal, staffId, side, canWrite, onBack, note }: { eleveId: ID; canal: ChatMessage['canal']; staffId?: ID; side: Side; canWrite: boolean; onBack?: () => void; note?: string }) {
  const session = useSession()!;
  useCollection('chat');
  const msgs = threadMessages(eleveId, canal, staffId);
  const [text, setText] = useState('');
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { markRead(msgs, side); end.current?.scrollIntoView({ block: 'end' }); }, [msgs.length]); // eslint-disable-line
  const mine = (m: ChatMessage) => (side === 'parent' ? m.auteur === 'parent' : side === 'prof' ? m.auteur === 'professeur' : m.auteur === 'ecole');
  const send = () => { if (!text.trim()) return; sendChat(eleveId, canal, staffId, text, session); setText(''); };
  const author = (m: ChatMessage) => (m.auteur === 'parent' ? 'Parent' : m.auteur === 'systeme' ? 'Alerte automatique' : db.get('users', m.auteurId)?.nom ?? (m.auteur === 'ecole' ? 'École' : staffName(m.staffId)));
  return (
    <div className="thread">
      <div className="thread-head">
        {onBack && <button className="icon-btn" onClick={onBack} aria-label="Retour"><ArrowLeft /></button>}
        <b className="grow ellipsis">{threadTitle({ eleveId, canal, staffId }, side)}</b>
      </div>
      {note && <div className="tiny muted thread-note">{note}</div>}
      <div className="thread-body">
        {msgs.length === 0 && <p className="small muted center" style={{ padding: 24 }}>Aucun message pour l’instant.</p>}
        {msgs.map((m) => (
          <div key={m.id} className={`bubble ${m.auteur === 'systeme' ? `sys t-${m.type}` : mine(m) ? 'me' : 'ai'}`}>
            {!mine(m) && <div className="bubble-from">{author(m)}</div>}
            <div>{m.texte}</div>
            <div className="bubble-time">{hour(m.date)}</div>
          </div>
        ))}
        <div ref={end} />
      </div>
      {canWrite && (
        <form className="thread-compose" onSubmit={(e) => { e.preventDefault(); send(); }}>
          <input className="input grow" value={text} onChange={(e) => setText(e.target.value)} placeholder="Écrire un message…" aria-label="Message" />
          <button type="submit" className="btn btn-primary btn-icon" disabled={!text.trim()} aria-label="Envoyer"><Send size={18} /></button>
        </form>
      )}
    </div>
  );
}
