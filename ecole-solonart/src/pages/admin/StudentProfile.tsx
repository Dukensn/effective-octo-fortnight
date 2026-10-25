import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useDoc } from '../../data/store';
import { StudentPanel } from '../../components/StudentPanel';
import { Empty } from '../../components/ui';

export default function StudentProfile() {
  const { id } = useParams();
  const nav = useNavigate();
  const student = useDoc('students', id);
  return (
    <div style={{ maxWidth: 980, margin: '0 auto' }}>
      <button className="back-link" style={{ border: 0, background: 'none', padding: 0 }} onClick={() => nav(-1)}><ArrowLeft size={16} />Retour</button>
      {student ? <StudentPanel student={student} /> : <Empty title="Élève introuvable" />}
    </div>
  );
}
