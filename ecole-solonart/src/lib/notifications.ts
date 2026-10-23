// Centre de notifications (cloche) : ce qui attend une action, selon l'espace de l'utilisateur.
import { useCollection } from '../data/store';
import { useSession } from './session';
import { isUnread } from './chat';
import { callDone, canTeacherCall, canTeacherMessage, classesOfAbsent, missingCalls, replacementsOn } from './regles';
import { todayISO } from './format';
import { lastExport } from './backup';
import { firebaseEnabled } from '../data/sync';

export interface Notif { n: number; label: string; sub: string; to: string; tone: 'red' | 'orange' | 'blue' | 'green' }

export function useNotifications(): Notif[] {
  const session = useSession();
  const chat = useCollection('chat');
  const classes = useCollection('classes');
  const students = useCollection('students');
  const payments = useCollection('payments');
  useCollection('attendance');
  useCollection('remplacements');
  useCollection('timetable');
  const staffAtt = useCollection('staffAttendance');
  useCollection('courses');
  if (!session) return [];
  const out: Notif[] = [];
  if (session.isParent) {
    const kids = new Set(students.filter((s) => session.user.guardianId && s.tuteurIds.includes(session.user.guardianId)).map((s) => s.id));
    const n = chat.filter((m) => kids.has(m.eleveId) && isUnread(m, 'parent')).length;
    out.push({ n, label: 'Messages non lus', sub: 'Alertes de l’école et professeurs', to: '/p/messages', tone: 'green' });
  } else if (session.isTeacher) {
    const me = session.user.staffId;
    const reps = replacementsOn().filter((r) => r.remplacantId === me);
    for (const r of reps) out.push({ n: 1, label: 'Remplacement aujourd’hui', sub: `Classes : ${r.classeIds.map((id) => classes.find((c) => c.id === id)?.code).join(', ')}`, to: '/', tone: 'orange' });
    const toCall = classes.filter((c) => canTeacherCall(me, c) && !callDone(c.id) && new Date().getDay() !== 0);
    out.push({ n: toCall.length, label: 'Appel à faire aujourd’hui', sub: toCall.map((c) => c.code).join(', '), to: '/prof/appel', tone: 'red' });
    const mine = new Set(classes.filter((c) => canTeacherMessage(me, c)).map((c) => c.id));
    const n = chat.filter((m) => m.staffId === me && isUnread(m, 'prof') && mine.has(students.find((s) => s.id === m.eleveId)?.classeId ?? '')).length;
    out.push({ n, label: 'Messages de parents', sub: 'Non lus', to: '/prof/messages', tone: 'green' });
  } else {
    if (session.can('presences')) {
      const miss = missingCalls();
      out.push({ n: miss.length, label: 'Appel non fait aujourd’hui', sub: miss.map((c) => c.code).join(', '), to: '/presences', tone: 'red' });
      // Enseignants absents aujourd'hui avec des classes, sans remplaçant décidé
      const reps = replacementsOn();
      const noRep = staffAtt.filter((a) => a.date === todayISO() && a.statut === 'Absent' && !reps.some((r) => r.absentId === a.staffId) && classesOfAbsent(a.staffId).length > 0);
      out.push({ n: noRep.length, label: 'Professeur absent sans remplaçant', sub: 'Présences → Personnel', to: '/presences?tab=personnel', tone: 'red' });
    }
    if (session.can('communication')) out.push({ n: chat.filter((m) => isUnread(m, 'ecole')).length, label: 'Messages de parents', sub: 'Non lus', to: '/messages', tone: 'green' });
    if (session.can('inscriptions')) out.push({ n: students.filter((s) => s.statut === 'En attente').length, label: 'Inscriptions en attente', sub: 'À valider', to: '/inscriptions', tone: 'blue' });
    // Sauvegarde : rappel hebdomadaire d'envoyer le fichier hors de l'appareil (tant que la synchronisation n'est pas branchée)
    if (session.can('parametres', 'write') && !firebaseEnabled && Date.now() - lastExport() > 7 * 86400000) out.push({ n: 1, label: 'Envoyer la sauvegarde', sub: 'Aucune copie hors de cet appareil depuis 7 jours', to: '/parametres?tab=donnees', tone: 'orange' });
    if (session.can('finance')) out.push({ n: payments.filter((p) => p.statut === 'En attente').length, label: 'Paiements à confirmer', sub: 'MonCash / NatCash', to: '/finance?tab=paiements', tone: 'orange' });
  }
  return out.filter((x) => x.n > 0);
}
