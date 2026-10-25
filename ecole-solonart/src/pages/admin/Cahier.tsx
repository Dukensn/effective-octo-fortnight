import { useMemo, useState } from 'react';
import { defaultClassId } from '../../data/compute';
import { FiltersFold } from '../../components/Mobile';
import { Plus, Printer, BookText, NotebookPen, AlertCircle } from 'lucide-react';
import { useCollection } from '../../data/store';
import type { Lesson } from '../../data/types';
import { Badge, Card, Empty, PageHead, StatCard, Tabs } from '../../components/ui';
import { LessonForm, referenceDate } from '../../components/LessonForm';
import { civ, dateLong, dateShort } from '../../lib/format';
import { useSession } from '../../lib/session';
import { printDocument } from '../../lib/print';
import { CahierSheet } from '../../docs/Sheets';
import { hourLabel } from './Timetable';

const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

/** Liste de séances groupées par jour (réutilisée par l'espace professeur). */
export function LessonList({ lessons, onOpen, showClass }: { lessons: Lesson[]; onOpen?: (l: Lesson) => void; showClass?: boolean }) {
  const subjects = useCollection('subjects');
  const staff = useCollection('staff');
  const classes = useCollection('classes');
  const days = [...new Set(lessons.map((l) => l.date))].sort().reverse();
  if (!lessons.length) return <Empty title="Aucune séance">Le cahier de textes de ce cours est vide.</Empty>;
  return (
    <div className="stack" style={{ gap: 14 }}>
      {days.map((d) => (
        <div key={d}>
          <div className="small muted mb-8" style={{ textTransform: 'capitalize', fontWeight: 600 }}>{new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          <div className="card list">
            {lessons.filter((l) => l.date === d).sort((a, b) => (a.heure ?? '').localeCompare(b.heure ?? '')).map((l) => {
              const sub = subjects.find((s) => s.id === l.matiereId);
              return (
                <button key={l.id} className="day-slot" style={{ alignItems: 'flex-start' }} onClick={() => onOpen?.(l)} disabled={!onOpen}>
                  <span className="t">{l.heure ? hourLabel(l.heure) : '—'}</span>
                  <span className={`bar c-${sub?.couleur ?? 'slate'}`} />
                  <span className="grow">
                    <small>{sub?.nom.split(' (')[0]}{showClass ? ` · ${classes.find((c) => c.id === l.classeId)?.code}` : ''} · {civ(staff.find((s) => s.id === l.professeurId))}</small>
                    <b>{l.titre}</b>
                    {l.contenu && <small style={{ marginTop: 2 }}>{l.contenu}</small>}
                    {l.devoirs && <span className="homework">Devoirs{l.pourLe ? ` pour le ${dateShort(l.pourLe)}` : ''} : {l.devoirs}</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Cahier() {
  const session = useSession()!;
  const canWrite = session.can('cahier', 'write');
  const lessons = useCollection('lessons');
  const courses = useCollection('courses');
  const subjects = useCollection('subjects');
  const staff = useCollection('staff');
  const classes = useCollection('classes').slice().sort((a, b) => a.code.localeCompare(b.code, 'fr', { numeric: true }));
  const [tab, setTab] = useState<'seances' | 'devoirs' | 'suivi'>('seances');
  const [classe, setClasse] = useState(defaultClassId());
  const [matiere, setMatiere] = useState('all');
  const [form, setForm] = useState<Partial<Lesson> | null>(null);
  const ref = referenceDate();
  const classLessons = lessons.filter((l) => l.classeId === classe && (matiere === 'all' || l.matiereId === matiere));
  const classCourses = courses.filter((c) => c.classeId === classe);
  const week = lessons.filter((l) => daysBetween(l.date, ref) <= 7 && daysBetween(l.date, ref) >= 0).length;
  const suivi = useMemo(() => courses.filter((c) => classe === 'all' || c.classeId === classe).map((c) => {
    const ls = lessons.filter((l) => l.coursId === c.id);
    const last = ls.reduce((m, l) => (l.date > m ? l.date : m), '');
    return { c, last, recent: ls.filter((l) => daysBetween(l.date, ref) <= 14 && daysBetween(l.date, ref) >= 0).length, late: !last || daysBetween(last, ref) > 7 };
  }).sort((a, b) => Number(b.late) - Number(a.late) || a.last.localeCompare(b.last)), [courses, lessons, classe, ref]);
  const late = suivi.filter((x) => x.late).length;
  const devoirs = lessons.filter((l) => l.classeId === classe && l.devoirs).sort((a, b) => (b.pourLe ?? b.date).localeCompare(a.pourLe ?? a.date));
  const code = (id: string) => classes.find((c) => c.id === id)?.code;
  const subj = (id: string) => subjects.find((s) => s.id === id)?.nom.split(' (')[0];

  return (
    <>
      <PageHead title="Cahier de textes" sub="Ce qui a été fait en classe et les devoirs donnés, matière par matière."
        actions={<>
          <button className="btn" onClick={() => printDocument(<CahierSheet classeId={classe} lessons={lessons.filter((l) => l.classeId === classe)} />, 'A4 portrait', `Cahier de textes ${code(classe)}`)}><Printer />Imprimer</button>
          {canWrite && <button className="btn btn-primary" onClick={() => setForm({ coursId: classCourses[0]?.id })}><Plus />Nouvelle séance</button>}
        </>} />
      <div className="grid g-stats mini mb-16">
        <StatCard tint="blue" icon={<BookText />} value={lessons.length} label="Séances" />
        <StatCard tint="green" icon={<NotebookPen />} value={week} label="Cette semaine" />
        <StatCard tint="violet" icon={<BookText />} value={lessons.filter((l) => l.devoirs).length} label="Devoirs" />
        <StatCard tint="orange" icon={<AlertCircle />} value={late} label="Cours en retard" />
      </div>
      <Tabs tabs={[['seances', 'Séances'], ['devoirs', 'Devoirs'], ['suivi', `Suivi${late ? ` (${late})` : ''}`]]} value={tab} onChange={setTab} />
      <FiltersFold active summary={`${classes.find((c) => c.id === classe)?.nom ?? 'Toutes les classes'}${tab === 'seances' && matiere !== 'all' ? ` · ${subj(matiere)}` : ''}`}>
      <div className="card card-pad stack filters mb-16" style={{ gap: 10 }}>
        <select className="select" value={classe} onChange={(e) => { setClasse(e.target.value); setMatiere('all'); }} aria-label="Classe">
          {tab === 'suivi' && <option value="all">Toutes les classes</option>}
          {classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
        {tab === 'seances' && (
          <select className="select" value={matiere} onChange={(e) => setMatiere(e.target.value)} aria-label="Matière">
            <option value="all">Toutes les matières</option>
            {classCourses.map((c) => <option key={c.id} value={c.matiereId}>{subj(c.matiereId)}</option>)}
          </select>
        )}
      </div>
      </FiltersFold>

      {tab === 'seances' && <LessonList lessons={classLessons} onOpen={canWrite ? (l) => setForm(l) : undefined} />}

      {tab === 'devoirs' && (
        <Card pad={false}>
          {devoirs.length === 0 ? <Empty title="Aucun devoir" /> : (
            <div className="list">
              {devoirs.map((l) => (
                <div key={l.id} className="list-item" style={{ alignItems: 'flex-start' }}>
                  <div className="grow">
                    <div className="row wrap" style={{ gap: 6 }}><b style={{ color: 'var(--ink)' }}>{subj(l.matiereId)}</b>{l.pourLe && <Badge tone={l.pourLe >= ref ? 'blue' : 'gray'}>Pour le {dateShort(l.pourLe)}</Badge>}</div>
                    <div className="small" style={{ marginTop: 2 }}>{l.devoirs}</div>
                    <div className="tiny muted mt-4">Donné le {dateShort(l.date)} · {l.titre}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'suivi' && (
        <Card pad={false}>
          <div className="card-pad small muted">Un cours est « en retard » quand rien n’a été noté depuis plus de 7 jours (au {dateLong(ref)}).</div>
          <div className="list">
            {suivi.map(({ c, last, recent, late: l }) => (
              <div key={c.id} className="list-item">
                <div className="grow">
                  <b style={{ color: 'var(--ink)' }}>{subj(c.matiereId)} · {code(c.classeId)}</b>
                  <div className="tiny muted">{civ(staff.find((s) => s.id === c.professeurId))} · {recent} séance{recent > 1 ? 's' : ''} sur 14 jours</div>
                </div>
                {l ? <Badge tone="orange">{last ? `Dernière : ${dateShort(last)}` : 'Jamais rempli'}</Badge> : <Badge tone="green">À jour</Badge>}
              </div>
            ))}
          </div>
        </Card>
      )}
      {form && <LessonForm value={form} courses={classCourses.length ? classCourses : courses} onClose={() => setForm(null)} />}
    </>
  );
}
