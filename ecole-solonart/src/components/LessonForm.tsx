// Cahier de textes : saisie d'une séance (leçon faite + devoirs donnés).
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { db, useCollection } from '../data/store';
import type { Course, Lesson } from '../data/types';
import { Field, Modal, toast } from './ui';
import { todayISO } from '../lib/format';
import { audit } from '../lib/session';
import { HOURS, hourLabel } from '../pages/admin/Timetable';

/** Heure du cours ce jour-là d'après l'emploi du temps (pour préremplir). */
export function slotHour(course: Pick<Course, 'classeId' | 'matiereId'>, date: string) {
  const day = new Date(date + 'T12:00:00').getDay();
  return db.list('timetable').find((s) => s.classeId === course.classeId && s.matiereId === course.matiereId && s.jour === day)?.debut;
}

/** Date de référence : aujourd'hui, ou la dernière séance saisie si l'école est en congé (données de démonstration). */
export function referenceDate() {
  const today = todayISO();
  const last = db.list('lessons').reduce((m, l) => (l.date > m ? l.date : m), '');
  if (!last) return today;
  const gap = (Date.parse(today) - Date.parse(last)) / 86400000;
  return gap > 60 ? last : today;
}

export function LessonForm({ value, courses, onClose }: { value: Partial<Lesson>; courses: Course[]; onClose: () => void }) {
  const subjects = useCollection('subjects');
  const classes = useCollection('classes');
  const [f, setF] = useState<Partial<Lesson>>(() => {
    const co = courses.find((c) => c.id === value.coursId) ?? courses[0];
    const date = value.date ?? todayISO();
    return { date, coursId: co?.id, heure: co ? slotHour(co, date) : undefined, ...value };
  });
  const [devoir, setDevoir] = useState(!!value.devoirs);
  const set = <K extends keyof Lesson>(k: K, v: Lesson[K]) => setF((x) => ({ ...x, [k]: v }));
  const course = courses.find((c) => c.id === f.coursId);
  const label = (c: Course) => `${classes.find((k) => k.id === c.classeId)?.code} · ${subjects.find((s) => s.id === c.matiereId)?.nom.split(' (')[0]}`;
  const save = () => {
    if (!course) return toast('Choisissez le cours', true);
    if (!f.titre?.trim()) return toast('Indiquez la leçon ou le chapitre', true);
    db.put('lessons', {
      ...f, classeId: course.classeId, matiereId: course.matiereId, professeurId: course.professeurId,
      contenu: f.contenu?.trim() ?? '', devoirs: devoir ? f.devoirs?.trim() || undefined : undefined, pourLe: devoir && f.devoirs ? f.pourLe : undefined,
    } as Lesson);
    audit(value.id ? 'Cahier de textes modifié' : 'Cahier de textes', `${label(course)} · ${f.date}`);
    toast('Séance enregistrée');
    onClose();
  };
  return (
    <Modal open onClose={onClose} title={value.id ? 'Séance' : 'Nouvelle séance'}
      footer={<>
        {value.id && <button className="btn btn-danger" style={{ marginRight: 'auto' }} onClick={() => { db.remove('lessons', value.id!); toast('Séance supprimée'); onClose(); }}><Trash2 /></button>}
        <button className="btn" onClick={onClose}>Annuler</button>
        <button className="btn btn-primary" onClick={save}>Enregistrer</button>
      </>}>
      <div className="stack" style={{ gap: 14 }}>
        {courses.length > 1 && (
          <Field label="Cours">
            <select className="select" value={f.coursId} onChange={(e) => { const co = courses.find((c) => c.id === e.target.value)!; setF((x) => ({ ...x, coursId: co.id, heure: slotHour(co, x.date ?? todayISO()) ?? x.heure })); }}>
              {courses.map((c) => <option key={c.id} value={c.id}>{label(c)}</option>)}
            </select>
          </Field>
        )}
        <div className="form-grid">
          <Field label="Date"><input type="date" className="input" value={f.date} onChange={(e) => { const d = e.target.value; setF((x) => ({ ...x, date: d, heure: course ? slotHour(course, d) ?? x.heure : x.heure })); }} /></Field>
          <Field label="Heure">
            <select className="select" value={f.heure ?? ''} onChange={(e) => set('heure', e.target.value || undefined)}>
              <option value="">—</option>{HOURS.map(([h]) => <option key={h} value={h}>{hourLabel(h)}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Leçon / chapitre"><input className="input" value={f.titre ?? ''} onChange={(e) => set('titre', e.target.value)} placeholder="Ex. Les équations du second degré" /></Field>
        <Field label="Ce qui a été fait" opt><textarea className="textarea" value={f.contenu ?? ''} onChange={(e) => set('contenu', e.target.value)} placeholder="Cours, exercices, correction…" /></Field>
        <label className="row between"><span>Devoirs donnés</span><input type="checkbox" checked={devoir} onChange={(e) => setDevoir(e.target.checked)} style={{ width: 20, height: 20 }} /></label>
        {devoir && (
          <div className="form-grid">
            <Field label="Devoirs" className="span-2"><textarea className="textarea" value={f.devoirs ?? ''} onChange={(e) => set('devoirs', e.target.value)} placeholder="Ex. Exercices 3 à 6 page 42" /></Field>
            <Field label="Pour le"><input type="date" className="input" value={f.pourLe ?? ''} onChange={(e) => set('pourLe', e.target.value)} /></Field>
          </div>
        )}
      </div>
    </Modal>
  );
}
