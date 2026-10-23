// Messagerie : direction (fils « École » + lecture des fils professeurs), professeur (préscolaire / fondamental), parent.
import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { db, useCollection } from '../data/store';
import type { ChatMessage, ID, Student } from '../data/types';
import { Avatar, Modal, PageHead, Pills, SearchInput, useIsDesktop } from '../components/ui';
import { ThreadList, ThreadView } from '../components/Chat';
import { fullName, norm } from '../lib/format';
import { useSession } from '../lib/session';
import { groupThreads, teachersFor, threadKey, type Side, type Thread } from '../lib/chat';
import { canTeacherMessage } from '../lib/regles';
import { useChildren } from './parent/Parent';

type Open = { eleveId: ID; canal: ChatMessage['canal']; staffId?: ID } | null;

/** Liste + fil : côte à côte sur ordinateur, l'un après l'autre sur téléphone. */
function Layout({ list, open, view }: { list: React.ReactNode; open: Open; view: React.ReactNode }) {
  const desktop = useIsDesktop();
  if (!desktop) return <>{open ? view : list}</>;
  return <div className="msg-layout"><div className="card">{list}</div><div>{open ? view : <div className="thread"><p className="small muted center" style={{ margin: 'auto' }}>Choisissez une conversation.</p></div>}</div></div>;
}

function StudentPicker({ students, onPick, onClose }: { students: Student[]; onPick: (s: Student) => void; onClose: () => void }) {
  const [q, setQ] = useState('');
  const list = students.filter((s) => !q || norm(`${fullName(s)} ${s.matricule}`).includes(norm(q))).slice(0, 30);
  return (
    <Modal open onClose={onClose} title="Écrire aux parents de…">
      <SearchInput value={q} onChange={setQ} placeholder="Nom de l’élève" />
      <div className="list mt-8">{list.map((s) => (
        <button key={s.id} className="list-item thread-row" onClick={() => onPick(s)}><Avatar src={s.photo} name={fullName(s)} size={32} /><span className="grow">{fullName(s)}<br /><span className="tiny muted">{db.get('classes', s.classeId)?.code}</span></span></button>
      ))}</div>
    </Modal>
  );
}

const toOpen = (t: Thread): Open => ({ eleveId: t.eleveId, canal: t.canal, staffId: t.staffId });

export function AdminMessages() {
  const session = useSession()!;
  const canWrite = session.can('communication', 'write');
  const chat = useCollection('chat');
  const students = useCollection('students').filter((s) => s.statut === 'Actif');
  const [canal, setCanal] = useState<'ecole' | 'professeur'>('ecole');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<Open>(null);
  const [pick, setPick] = useState(false);
  const threads = useMemo(() => groupThreads(chat.filter((m) => m.canal === canal), 'ecole')
    .filter((t) => !q || norm(fullName(db.get('students', t.eleveId))).includes(norm(q))), [chat, canal, q]);
  const unread = groupThreads(chat.filter((m) => m.canal === 'ecole'), 'ecole').reduce((a, t) => a + t.unread, 0);
  return (
    <>
      <PageHead title="Messagerie" sub="Fils avec les parents. Les alertes d’absence, de retard et de conduite partent automatiquement." actions={canWrite && <button className="btn btn-primary" onClick={() => setPick(true)}><Plus />Nouveau message</button>} />
      <Layout open={open}
        list={<>
          <div className="card-pad stack" style={{ gap: 10 }}>
            <Pills items={[['ecole', `École${unread ? ` (${unread})` : ''}`], ['professeur', 'Professeurs ↔ parents']]} value={canal} onChange={(v) => { setCanal(v); setOpen(null); }} />
            <SearchInput value={q} onChange={setQ} placeholder="Élève…" />
          </div>
          <ThreadList threads={threads} side="ecole" onOpen={(t) => setOpen(toOpen(t))} empty={canal === 'ecole' ? 'Aucune conversation' : 'Aucun échange professeur ↔ parent'} />
        </>}
        view={open && <ThreadView key={threadKey(open.eleveId, open.canal, open.staffId)} {...open} side="ecole" canWrite={canWrite && open.canal === 'ecole'} onBack={() => setOpen(null)}
          note={open.canal === 'professeur' ? 'Échange entre le professeur et le parent : la direction le voit pour être au courant.' : undefined} />} />
      {pick && <StudentPicker students={students} onClose={() => setPick(false)} onPick={(s) => { setPick(false); setCanal('ecole'); setOpen({ eleveId: s.id, canal: 'ecole' }); }} />}
    </>
  );
}

export function TeacherMessages() {
  const session = useSession()!;
  const me = session.user.staffId;
  const chat = useCollection('chat');
  const classes = useCollection('classes').filter((c) => canTeacherMessage(me, c));
  const students = useCollection('students').filter((s) => s.statut === 'Actif' && classes.some((c) => c.id === s.classeId));
  const [open, setOpen] = useState<Open>(null);
  const [pick, setPick] = useState(false);
  const threads = groupThreads(chat.filter((m) => m.canal === 'professeur' && m.staffId === me && students.some((s) => s.id === m.eleveId)), 'prof');
  return (
    <>
      <PageHead title="Messages" sub="Échanges avec les parents de vos élèves (préscolaire et fondamental). La direction en est informée." actions={<button className="btn btn-primary" onClick={() => setPick(true)}><Plus />Écrire</button>} />
      <Layout open={open}
        list={<ThreadList threads={threads} side="prof" onOpen={(t) => setOpen(toOpen(t))} empty="Aucun message" />}
        view={open && <ThreadView key={threadKey(open.eleveId, open.canal, open.staffId)} {...open} side="prof" canWrite onBack={() => setOpen(null)} />} />
      {pick && <StudentPicker students={students} onClose={() => setPick(false)} onPick={(s) => { setPick(false); setOpen({ eleveId: s.id, canal: 'professeur', staffId: me }); }} />}
    </>
  );
}

export function ParentMessages() {
  const kids = useChildren();
  const chat = useCollection('chat');
  const [open, setOpen] = useState<Open>(null);
  const side: Side = 'parent';
  // Pour chaque enfant : le fil « École », puis un fil par professeur joignable (préscolaire et fondamental seulement).
  const threads = useMemo(() => {
    const existing = groupThreads(chat.filter((m) => kids.some((k) => k.id === m.eleveId)), side);
    const byKey = new Map(existing.map((t) => [t.key, t]));
    const all: Thread[] = [];
    for (const k of kids) {
      const keys: [ChatMessage['canal'], ID | undefined][] = [['ecole', undefined], ...teachersFor(k).map((id) => ['professeur', id] as [ChatMessage['canal'], ID])];
      for (const [canal, staffId] of keys) {
        const key = threadKey(k.id, canal, staffId);
        all.push(byKey.get(key) ?? { key, eleveId: k.id, canal, staffId, messages: [], unread: 0 });
      }
    }
    return all.sort((a, b) => (b.last?.date ?? 0) - (a.last?.date ?? 0));
  }, [chat, kids]);
  const many = kids.length > 1;
  return (
    <>
      <PageHead title="Messages" sub="Alertes de l’école et échanges avec les professeurs." />
      <Layout open={open}
        list={many ? <>{kids.map((k) => (
          <div key={k.id}>
            <div className="card-pad row" style={{ gap: 8, paddingBottom: 4 }}><Avatar src={k.photo} name={fullName(k)} size={24} /><b className="small" style={{ color: 'var(--ink)' }}>{fullName(k)}</b></div>
            <ThreadList threads={threads.filter((t) => t.eleveId === k.id)} side={side} onOpen={(t) => setOpen(toOpen(t))} empty="Aucune conversation" />
          </div>
        ))}</> : <ThreadList threads={threads} side={side} onOpen={(t) => setOpen(toOpen(t))} empty="Aucune conversation" />}
        view={open && <ThreadView key={threadKey(open.eleveId, open.canal, open.staffId)} {...open} side={side} canWrite onBack={() => setOpen(null)}
          note={`${fullName(db.get('students', open.eleveId))}${open.canal === 'professeur' ? ' · la direction de l’école voit aussi cet échange.' : ''}`} />} />
    </>
  );
}
