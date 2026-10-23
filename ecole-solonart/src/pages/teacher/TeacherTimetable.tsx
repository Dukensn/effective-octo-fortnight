import { useCollection } from '../../data/store';
import { PageHead } from '../../components/ui';
import { useSession } from '../../lib/session';
import { TimetableGrid } from '../admin/Timetable';
import { printDocument } from '../../lib/print';
import { TimetableSheet } from '../../docs/Sheets';
import { Printer } from 'lucide-react';

export default function TeacherTimetable() {
  const session = useSession()!;
  const slots = useCollection('timetable').filter((s) => s.professeurId === session.user.staffId);
  return (
    <>
      <PageHead title="Mon emploi du temps" sub={`${slots.length} cours par semaine`}
        actions={<button className="btn" onClick={() => printDocument(<TimetableSheet slots={slots} title={`Emploi du temps — ${session.user.nom}`} showClass />, 'A4 landscape')}><Printer />Imprimer</button>} />
      <TimetableGrid slots={slots} showClass />
    </>
  );
}
