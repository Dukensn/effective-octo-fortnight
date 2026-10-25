import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, Camera, AlertCircle } from 'lucide-react';
import { db, useCollection } from '../../data/store';
import { Avatar, Field, PageHead, toast } from '../../components/ui';
import { PhotoCapture } from '../../components/PhotoCapture';
import { classStudents } from '../../data/compute';
import { fullName } from '../../lib/format';
import { audit } from '../../lib/session';

/** Séance photo : on photographie les élèves d'une classe les uns après les autres. */
export default function ClassPhotos() {
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const classes = useCollection('classes').slice().sort((a, b) => a.code.localeCompare(b.code, 'fr', { numeric: true }));
  useCollection('students');
  const classe = params.get('classe') ?? classes[0]?.id ?? '';
  const [current, setCurrent] = useState<string | null>(null);
  const [onlyMissing, setOnlyMissing] = useState(false);
  const students = classStudents(classe);
  const done = students.filter((s) => s.photo).length;
  const list = onlyMissing ? students.filter((s) => !s.photo) : students;
  const student = students.find((s) => s.id === current);

  const save = (url: string) => {
    if (!student) return;
    db.patch('students', student.id, { photo: url, documents: student.documents.map((d) => (d.type === "Photo d'identité" ? { ...d, fourni: true } : d)) });
    audit('Photo élève', fullName(student));
    // Enchaîne automatiquement avec le prochain élève sans photo
    const idx = students.findIndex((s) => s.id === student.id);
    const next = [...students.slice(idx + 1), ...students.slice(0, idx)].find((s) => !s.photo && s.id !== student.id);
    toast(`Photo de ${student.prenom} enregistrée`);
    setCurrent(next?.id ?? null);
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <PageHead
        back={<button className="back-link" style={{ border: 0, background: 'none', padding: 0 }} onClick={() => nav('/eleves')}><ArrowLeft size={16} />Élèves</button>}
        title="Photos des élèves"
        sub="Touchez un élève pour le photographier. Après chaque photo, l’élève suivant s’ouvre automatiquement."
      />
      <div className="card card-pad row wrap mb-16" style={{ gap: 12, alignItems: 'flex-end' }}>
        <Field label="Classe" className="grow"><select className="select" value={classe} onChange={(e) => setParams({ classe: e.target.value }, { replace: true })}>{classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}</select></Field>
        <div style={{ minWidth: 160 }}>
          <div className="small muted">{done} / {students.length} photos</div>
          <div className="bar mt-8"><i style={{ width: `${students.length ? (done / students.length) * 100 : 0}%` }} /></div>
        </div>
        <label className="check small"><input type="checkbox" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} />Sans photo seulement</label>
        <button className="btn btn-primary" disabled={done === students.length} onClick={() => setCurrent(students.find((s) => !s.photo)?.id ?? null)}><Camera />Commencer</button>
      </div>
      <div className="photo-grid">
        {list.map((s) => (
          <button key={s.id} className="photo-cell" onClick={() => setCurrent(s.id)}>
            {s.photo ? <span className="tick"><Check size={13} strokeWidth={3} /></span> : <span className="missing"><AlertCircle size={13} /></span>}
            <Avatar src={s.photo} name={fullName(s)} size={72} square />
            <span className="ellipsis" style={{ maxWidth: '100%' }}>{s.prenom}<br /><b>{s.nom}</b></span>
          </button>
        ))}
      </div>
      <PhotoCapture open={!!student} onClose={() => setCurrent(null)} onSave={save} current={student?.photo}
        title={student ? fullName(student) : ''} subtitle={student ? `${student.matricule} · ${students.findIndex((x) => x.id === student.id) + 1}/${students.length}` : ''}
        onRemove={student?.photo ? () => db.patch('students', student.id, { photo: undefined }) : undefined} />
    </div>
  );
}
