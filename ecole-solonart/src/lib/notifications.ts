// Centre de notifications (cloche) : ce qui attend une action, selon l'espace de l'utilisateur.
import { useCollection } from '../data/store';
import { useSession } from './session';
import { isUnread } from './chat';
import { callDone, canTeacherCall, canTeacherMessage, missingCalls } from './regles';

export interface Notif { n: number; label: string; sub: string; to: string; tone: 'red' | 'orange' | 'blue' | 'green' }

export function useNotifications(): Notif[] {
  const session = useSession();
  const chat = useCollection('chat');
  const classes = useCollection('classes');
  const students = useCollection('students');
  const payments = useCollection('payments');
  useCollection('attendance');
  useCollection('courses');
  if (!session) return [];
  const out: Notif[] = [];
  if (session.isParent) {
    const kids = new Set(students.filter((s) => session.user.guardianId && s.tuteurIds.includes(session.user.guardianId)).map((s) => s.id));
    const n = chat.filter((m) => kids.has(m.eleveId) && isUnread(m, 'parent')).length;
    out.push({ n, label: 'Messages non lus', sub: 'Alertes de l’école et professeurs', to: '/p/messages', tone: 'green' });
  } else if (session.isTeacher) {
    const me = session.user.staffId;
    const toCall = classes.filter((c) => canTeacherCall(me, c) && !callDone(c.id) && new Date().getDay() !== 0);
    out.push({ n: toCall.length, label: 'Appel à faire aujourd’hui', sub: toCall.map((c) => c.code).join(', '), to: '/prof/appel', tone: 'red' });
    const mine = new Set(classes.filter((c) => canTeacherMessage(me, c)).map((c) => c.id));
    const n = chat.filter((m) => m.staffId === me && isUnread(m, 'prof') && mine.has(students.find((s) => s.id === m.eleveId)?.classeId ?? '')).length;
    out.push({ n, label: 'Messages de parents', sub: 'Non lus', to: '/prof/messages', tone: 'green' });
  } else {
    if (session.can('presences')) {
      const miss = missingCalls();
      out.push({ n: miss.length, label: 'Appel non fait aujourd’hui', sub: miss.map((c) => c.code).join(', '), to: '/presences', tone: 'red' });
    }
    if (session.can('communication')) out.push({ n: chat.filter((m) => isUnread(m, 'ecole')).length, label: 'Messages de parents', sub: 'Non lus', to: '/messages', tone: 'green' });
    if (session.can('inscriptions')) out.push({ n: students.filter((s) => s.statut === 'En attente').length, label: 'Inscriptions en attente', sub: 'À valider', to: '/inscriptions', tone: 'blue' });
    if (session.can('finance')) out.push({ n: payments.filter((p) => p.statut === 'En attente').length, label: 'Paiements à confirmer', sub: 'MonCash / NatCash', to: '/finance?tab=paiements', tone: 'orange' });
  }
  return out.filter((x) => x.n > 0);
}
