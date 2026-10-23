// Messagerie école ↔ parents.
// - Fil « École » (administration) pour chaque élève, à tous les niveaux. Les alertes automatiques
//   (absence, retard, conduite) y arrivent.
// - Fil « Professeur » : préscolaire et fondamental seulement ; la direction peut le lire.
import { db } from '../data/store';
import type { ChatMessage, ID, Student } from '../data/types';
import { dateShort } from './format';
import { audit, type Session } from './session';
import { classTeacherIds, isSecondaire } from './regles';

export type Side = 'parent' | 'ecole' | 'prof';
export interface Thread { key: string; eleveId: ID; canal: ChatMessage['canal']; staffId?: ID; messages: ChatMessage[]; last?: ChatMessage; unread: number }

export const threadKey = (eleveId: ID, canal: ChatMessage['canal'], staffId?: ID) => (canal === 'ecole' ? `${eleveId}|ecole` : `${eleveId}|prof|${staffId}`);
const keyOf = (m: ChatMessage) => threadKey(m.eleveId, m.canal, m.staffId);

/** Message non lu par ce côté (on ne compte jamais ses propres messages). */
export function isUnread(m: ChatMessage, side: Side) {
  if (side === 'parent') return m.auteur !== 'parent' && !m.lu.parent;
  if (side === 'prof') return m.canal === 'professeur' && m.auteur === 'parent' && !m.lu.prof;
  return m.canal === 'ecole' && m.auteur === 'parent' && !m.lu.ecole;
}

/** Regroupe les messages en fils, du plus récent au plus ancien. */
export function groupThreads(messages: ChatMessage[], side: Side): Thread[] {
  const m = new Map<string, Thread>();
  for (const x of messages) {
    const k = keyOf(x);
    const t = m.get(k) ?? { key: k, eleveId: x.eleveId, canal: x.canal, staffId: x.staffId, messages: [], unread: 0 };
    t.messages.push(x);
    if (isUnread(x, side)) t.unread++;
    m.set(k, t);
  }
  const list = [...m.values()];
  for (const t of list) { t.messages.sort((a, b) => a.date - b.date); t.last = t.messages[t.messages.length - 1]; }
  return list.sort((a, b) => (b.last?.date ?? 0) - (a.last?.date ?? 0));
}

export function threadMessages(eleveId: ID, canal: ChatMessage['canal'], staffId?: ID) {
  const k = threadKey(eleveId, canal, staffId);
  return db.list('chat').filter((x) => keyOf(x) === k).sort((a, b) => a.date - b.date);
}

export function markRead(msgs: ChatMessage[], side: Side) {
  for (const x of msgs) if (isUnread(x, side)) db.patch('chat', x.id, { lu: { ...x.lu, [side]: true } });
}

export function sendChat(eleveId: ID, canal: ChatMessage['canal'], staffId: ID | undefined, texte: string, session: Session) {
  const auteur: ChatMessage['auteur'] = session.isParent ? 'parent' : session.isTeacher ? 'professeur' : 'ecole';
  const side: Side = auteur === 'parent' ? 'parent' : auteur === 'professeur' ? 'prof' : 'ecole';
  db.put('chat', { eleveId, canal, staffId: canal === 'professeur' ? staffId : undefined, auteur, auteurId: session.user.id, texte: texte.trim(), type: 'message', date: Date.now(), lu: { [side]: true } });
}

const pr = (s: Student) => s.prenom.split(' ')[0];

/** Alerte automatique au parent, dans le fil « École ». L'identifiant fixe évite les doublons si l'on réenregistre. */
export function notifyParent(id: string, s: Student, type: NonNullable<ChatMessage['type']>, texte: string) {
  if (db.get('chat', id)) return;
  db.put('chat', { id, eleveId: s.id, canal: 'ecole', auteur: 'systeme', texte, type, date: Date.now(), lu: { ecole: true, prof: true } });
}

export function notifyAttendance(s: Student, statut: 'Absent' | 'Retard', date: string) {
  const texte = statut === 'Absent'
    ? `Absence : ${pr(s)} n’était pas en classe le ${dateShort(date)}. Merci de prévenir l’école du motif.`
    : `Retard : ${pr(s)} est arrivé${s.sexe === 'F' ? 'e' : ''} en retard le ${dateShort(date)}.`;
  notifyParent(`notif-at-${date}-${s.id}-${statut}`, s, statut === 'Absent' ? 'absence' : 'retard', texte);
}

export function notifyIncident(incidentId: ID, s: Student, type: string, description: string, sanction?: string) {
  const fel = type === 'Félicitations';
  const texte = fel ? `Félicitations : ${description}` : `Conduite (${type.toLowerCase()}) : ${description}${sanction ? ` Suite donnée : ${sanction}.` : ''}`;
  notifyParent(`notif-inc-${incidentId}`, s, fel ? 'felicitations' : 'conduite', texte);
  audit('Notification parent', `${s.prenom} ${s.nom} · ${type}`, { domaine: 'discipline' });
}

/** Professeurs que le parent peut joindre pour cet élève (aucun au secondaire). */
export function teachersFor(s: Student): ID[] {
  const c = db.get('classes', s.classeId);
  if (!c || isSecondaire(c)) return [];
  const course = db.list('courses').filter((x) => x.classeId === c.id).map((x) => x.professeurId).filter((x): x is ID => !!x);
  return [...new Set([...classTeacherIds(c), ...course])];
}

export function staffName(id?: ID) {
  const s = db.get('staff', id);
  return s ? `${s.sexe === 'F' ? 'Mme' : 'M.'} ${s.prenom} ${s.nom}` : '';
}
