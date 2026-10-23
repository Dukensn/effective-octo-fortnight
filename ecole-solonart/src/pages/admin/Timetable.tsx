import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, User, MapPin, UtensilsCrossed, Printer, AlertTriangle, CalendarPlus, Copy, School, Users, BookOpen, CalendarRange, Pencil, Trash2 } from 'lucide-react';
import { db, useCollection } from '../../data/store';
import type { TimetableSlot } from '../../data/types';
import { PageHead, Tabs, Field, Modal, toast, Card, Badge } from '../../components/ui';
import { civ } from '../../lib/format';
import { useSession } from '../../lib/session';
import { printDocument } from '../../lib/print';
import { TimetableSheet } from '../../docs/Sheets';

export const HOURS: [string, string][] = [['07:00', '07:50'], ['08:00', '08:50'], ['09:00', '09:50'], ['10:00', '10:50'], ['11:00', '11:50'], ['13:00', '13:50'], ['14:00', '14:50'], ['15:00', '15:50'], ['16:00', '16:50']];
export const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
export const hourLabel = (h: string) => h.replace(':', 'h').replace(/^0/, '');

/** Grille hebdomadaire réutilisable (admin + professeur). */
export function TimetableGrid({ slots, onSlot, showClass, title }: { slots: TimetableSlot[]; onSlot?: (s: TimetableSlot | { jour: number; debut: string; fin: string }) => void; showClass?: boolean; title?: string }) {
  const subjects = useCollection('subjects');
  const staff = useCollection('staff');
  const classes = useCollection('classes');
  return (
    <div className="table-wrap">
      <div className="tt" aria-label={title}>
        <div className="h">Heure</div>
        {DAYS.map((d) => <div key={d} className="h">{d}</div>)}
        {HOURS.map(([debut, fin], hi) => (
          <div key={debut} style={{ display: 'contents' }}>
            {hi === 5 && (<><div className="hour">12h00 - 13h00</div><div className="lunch"><UtensilsCrossed size={16} />Pause déjeuner</div></>)}
            <div className="hour">{hourLabel(debut)} - {hourLabel(fin)}</div>
            {DAYS.map((_, di) => {
              const s = slots.find((x) => x.jour === di + 1 && x.debut === debut);
              if (!s) return <div key={di}>{onSlot && <button className="slot" style={{ background: 'transparent', border: '1px dashed var(--line)', alignItems: 'center', justifyContent: 'center', color: 'var(--faint)' }} onClick={() => onSlot({ jour: di + 1, debut, fin })}><Plus size={14} /></button>}</div>;
              const sub = subjects.find((x) => x.id === s.matiereId);
              const prof = staff.find((x) => x.id === s.professeurId);
              return (
                <div key={di}>
                  <button className={`slot c-${sub?.couleur ?? 'slate'}`} onClick={() => onSlot?.(s)} style={{ cursor: onSlot ? 'pointer' : 'default' }}>
                    <b>{sub ? sub.nom.split(' (')[0].replace('Sciences de la vie et de la terre', 'Sciences').replace('Éducation physique et sportive', 'Éducation physique') : s.libelle}</b>
                    <span><User />{prof ? `${prof.sexe === 'F' ? 'Mme' : 'M.'} ${prof.nom}` : 'Équipe'}<MapPin style={{ marginLeft: 6 }} />{showClass ? classes.find((c) => c.id === s.classeId)?.code : s.salle}</span>
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function conflictsOf(slots: TimetableSlot[]) {
  const out: { a: TimetableSlot; b: TimetableSlot; type: string }[] = [];
  const byKey = new Map<string, TimetableSlot>();
  for (const s of slots) {
    if (s.professeurId) {
      const k = `p${s.professeurId}|${s.jour}|${s.debut}`;
      const o = byKey.get(k);
      if (o) out.push({ a: o, b: s, type: 'Professeur sur deux classes' }); else byKey.set(k, s);
    }
    if (s.salle && !['Divers', 'Terrain'].includes(s.salle) && !s.salle.startsWith('S') && !s.salle.match(/^\d/)) {
      const k = `s${s.salle}|${s.jour}|${s.debut}`;
      const o = byKey.get(k);
      if (o) out.push({ a: o, b: s, type: `Salle ${s.salle} occupée deux fois` }); else byKey.set(k, s);
    }
  }
  return out;
}

export default function Timetable() {
  const [params] = useSearchParams();
  const session = useSession()!;
  const canWrite = session.can('emploi', 'write');
  const classes = useCollection('classes').slice().sort((a, b) => a.code.localeCompare(b.code, 'fr', { numeric: true }));
  const slots = useCollection('timetable');
  const staff = useCollection('staff');
  const subjects = useCollection('subjects');
  const courses = useCollection('courses');
  const [tab, setTab] = useState<'classe' | 'prof'>(params.get('prof') ? 'prof' : 'classe');
  const [classe, setClasse] = useState(params.get('classe') ?? 'c-s4-a');
  const [prof, setProf] = useState(params.get('prof') ?? staff.find((s) => s.type === 'Professeur')?.id ?? '');
  const [edit, setEdit] = useState<Partial<TimetableSlot> | null>(null);
  const [showConflicts, setShowConflicts] = useState(false);
  const [dup, setDup] = useState(false);
  const c = classes.find((x) => x.id === classe);
  const view = tab === 'classe' ? slots.filter((s) => s.classeId === classe) : slots.filter((s) => s.professeurId === prof);
  const conflicts = conflictsOf(slots);
  const profs = staff.filter((s) => s.type === 'Professeur' || s.poste === 'Conseiller scolaire');
  const today = new Date().getDay();
  const next = view.filter((s) => s.jour >= (today === 0 || today === 6 ? 1 : today)).sort((a, b) => a.jour - b.jour || a.debut.localeCompare(b.debut))[0];
  const nextSub = subjects.find((x) => x.id === next?.matiereId);
  const nextProf = staff.find((x) => x.id === next?.professeurId);
  const legend = [['blue', 'Français'], ['green', 'Mathématiques'], ['pink', 'Anglais'], ['violet', 'Sciences'], ['amber', 'Histoire-Géo'], ['slate', 'Autres']];

  const print = () => printDocument(<TimetableSheet slots={view} title={tab === 'classe' ? `Emploi du temps — ${c?.nom}` : `Emploi du temps — ${civ(staff.find((s) => s.id === prof))}`} showClass={tab === 'prof'} />, 'A4 landscape');

  return (
    <>
      <PageHead title="Emploi du temps" sub="Créez et gérez l'emploi du temps de l'établissement. Affectez les classes, les matières et les professeurs."
        actions={<>
          <button className="btn" onClick={print}><Printer />Imprimer</button>
          {canWrite && <button className="btn btn-outline" onClick={() => setDup(true)}>Dupliquer</button>}
          {canWrite && <button className="btn btn-primary" onClick={() => setEdit({ classeId: classe, jour: 1, debut: '07:00', fin: '07:50', salle: c?.code ?? '' })}><Plus />Nouveau créneau</button>}
        </>} />
      <Tabs tabs={[['classe', 'Par classe'], ['prof', 'Par professeur']]} value={tab} onChange={setTab} />
      <div className="split split-side">
        <div className="stack">
          <div className="card card-pad row wrap" style={{ gap: 12 }}>
            {tab === 'classe' ? (
              <Field label="Classe" className="grow"><select className="select" value={classe} onChange={(e) => setClasse(e.target.value)}>{classes.map((x) => <option key={x.id} value={x.id}>{x.nom}</option>)}</select></Field>
            ) : (
              <Field label="Professeur" className="grow"><select className="select" value={prof} onChange={(e) => setProf(e.target.value)}>{profs.map((x) => <option key={x.id} value={x.id}>{civ(x)} · {x.specialite ?? x.poste}</option>)}</select></Field>
            )}
            {conflicts.length > 0 && <button className="btn btn-danger" style={{ alignSelf: 'flex-end' }} onClick={() => setShowConflicts(true)}><AlertTriangle />{conflicts.length} conflit(s)</button>}
          </div>
          <TimetableGrid slots={view} showClass={tab === 'prof'} onSlot={canWrite ? (s) => setEdit('id' in s ? s : { ...s, classeId: tab === 'classe' ? classe : '', professeurId: tab === 'prof' ? prof : undefined, salle: c?.code ?? '', jour: s.jour as TimetableSlot['jour'] }) : undefined} />
        </div>
        <div className="stack">
          {tab === 'classe' && c && (
            <div className="card card-pad">
              <div className="row"><div className="tint-navy" style={{ width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center' }}><School size={22} /></div><div><h3>{c.code}</h3><div className="small muted">{c.annee} - {db.list('students').filter((s) => s.classeId === c.id && s.statut === 'Actif').length} élèves</div></div></div>
              <div className="grid g-2 mt-16" style={{ gap: 10 }}>
                <MiniStat icon={<BookOpen size={18} />} v={courses.filter((x) => x.classeId === c.id).length} l="Matières" />
                <MiniStat icon={<Users size={18} />} v={new Set(courses.filter((x) => x.classeId === c.id).map((x) => x.professeurId)).size} l="Professeurs" />
                <MiniStat icon={<MapPin size={18} />} v={new Set(view.map((x) => x.salle)).size} l="Salles" />
                <MiniStat icon={<CalendarRange size={18} />} v={view.length} l="Créneaux / semaine" />
              </div>
            </div>
          )}
          {next && (
            <Card title="Prochain cours">
              <div className="row" style={{ alignItems: 'flex-start' }}>
                <div className="tint-blue" style={{ width: 40, height: 40, borderRadius: 10, display: 'grid', placeItems: 'center' }}><BookOpen size={18} /></div>
                <div className="grow small" style={{ lineHeight: 1.7 }}><b style={{ color: 'var(--ink)', fontSize: 14 }}>{nextSub?.nom.split(' (')[0] ?? next.libelle}</b><br />{DAYS[next.jour - 1]} · {hourLabel(next.debut)} - {hourLabel(next.fin)}<br />Salle {next.salle}<br />{civ(nextProf)}</div>
                {canWrite && <button className="btn btn-primary btn-sm" onClick={() => setEdit(next)}>Modifier</button>}
              </div>
            </Card>
          )}
          <Card title="Actions rapides">
            <div className="qa">
              {canWrite && <button onClick={() => setEdit({ classeId: classe, jour: 1, debut: '07:00', fin: '07:50', salle: c?.code ?? '' })}><CalendarPlus />Ajouter un cours</button>}
              {canWrite && <button onClick={() => setDup(true)}><Copy />Dupliquer vers une autre classe</button>}
              <button onClick={() => setShowConflicts(true)}><AlertTriangle style={{ color: 'var(--red)' }} />Voir les conflits ({conflicts.length})</button>
              <button onClick={print}><Printer style={{ color: 'var(--red)' }} />Imprimer / Exporter (PDF)</button>
            </div>
          </Card>
          <Card title="Légende des matières">
            <div className="grid g-2" style={{ gap: 8 }}>{legend.map(([k, l]) => <div key={k} className="row small"><i className={`c-${k}`} style={{ width: 14, height: 14, borderRadius: '50%', display: 'inline-block' }} />{l}</div>)}</div>
          </Card>
        </div>
      </div>
      {edit && <SlotForm value={edit} onClose={() => setEdit(null)} />}
      <Modal open={showConflicts} onClose={() => setShowConflicts(false)} title="Conflits d’emploi du temps">
        {conflicts.length === 0 ? <p className="muted">Aucun conflit détecté.</p> : conflicts.map((x, i) => (
          <div key={i} className="row" style={{ padding: '8px 0', borderBottom: '1px solid var(--line-2)' }}><Badge tone="red">{x.type}</Badge><span className="small">{DAYS[x.a.jour - 1]} {hourLabel(x.a.debut)} — {classes.find((k) => k.id === x.a.classeId)?.code} / {classes.find((k) => k.id === x.b.classeId)?.code} · {civ(staff.find((s) => s.id === x.a.professeurId))}</span></div>
        ))}
      </Modal>
      {dup && <DuplicateModal from={classe} onClose={() => setDup(false)} />}
    </>
  );
}

function MiniStat({ icon, v, l }: { icon: React.ReactNode; v: number; l: string }) {
  return <div className="row" style={{ border: '1px solid var(--line)', borderRadius: 10, padding: 10 }}><span style={{ color: 'var(--primary)' }}>{icon}</span><div><b style={{ fontSize: 18, color: 'var(--ink)' }}>{v}</b><div className="tiny muted">{l}</div></div></div>;
}

function SlotForm({ value, onClose }: { value: Partial<TimetableSlot>; onClose: () => void }) {
  const classes = useCollection('classes');
  const subjects = useCollection('subjects');
  const staff = useCollection('staff').filter((s) => s.type === 'Professeur' || s.poste === 'Conseiller scolaire');
  const courses = useCollection('courses');
  const [f, setF] = useState<Partial<TimetableSlot>>(value);
  const set = (k: keyof TimetableSlot, v: unknown) => setF((x) => ({ ...x, [k]: v }));
  const save = () => {
    if (!f.classeId) return toast('Choisissez une classe', true);
    if (!f.matiereId && !f.libelle) return toast('Choisissez une matière ou une activité', true);
    const existing = db.list('timetable').find((s) => s.classeId === f.classeId && s.jour === f.jour && s.debut === f.debut && s.id !== f.id);
    if (existing) db.remove('timetable', existing.id);
    const clash = f.professeurId && db.list('timetable').find((s) => s.professeurId === f.professeurId && s.jour === f.jour && s.debut === f.debut && s.id !== f.id && s.classeId !== f.classeId);
    db.put('timetable', { salle: '', ...f, fin: HOURS.find((h) => h[0] === f.debut)?.[1] ?? f.fin } as TimetableSlot);
    toast(clash ? 'Enregistré — attention : ce professeur a déjà un cours à cette heure' : 'Créneau enregistré', !!clash);
    onClose();
  };
  return (
    <Modal open onClose={onClose} title={f.id ? 'Modifier le créneau' : 'Nouveau créneau'}
      footer={<>{f.id && <button className="btn btn-danger" style={{ marginRight: 'auto' }} onClick={() => { db.remove('timetable', f.id!); toast('Créneau supprimé'); onClose(); }}><Trash2 size={16} />Supprimer</button>}<button className="btn" onClick={onClose}>Annuler</button><button className="btn btn-primary" onClick={save}><Pencil size={15} />Enregistrer</button></>}>
      <div className="form-grid">
        <Field label="Classe"><select className="select" value={f.classeId ?? ''} onChange={(e) => set('classeId', e.target.value)}><option value="">—</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}</select></Field>
        <Field label="Jour"><select className="select" value={f.jour} onChange={(e) => set('jour', Number(e.target.value))}>{DAYS.map((d, i) => <option key={d} value={i + 1}>{d}</option>)}</select></Field>
        <Field label="Heure"><select className="select" value={f.debut} onChange={(e) => set('debut', e.target.value)}>{HOURS.map(([a, b]) => <option key={a} value={a}>{hourLabel(a)} - {hourLabel(b)}</option>)}</select></Field>
        <Field label="Matière"><select className="select" value={f.matiereId ?? ''} onChange={(e) => { const m = e.target.value || undefined; set('matiereId', m); const co = courses.find((c) => c.classeId === f.classeId && c.matiereId === m); if (co?.professeurId) set('professeurId', co.professeurId); }}><option value="">— Activité —</option>{subjects.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}</select></Field>
        {!f.matiereId && <Field label="Activité" className="span-2"><input className="input" list="acts" value={f.libelle ?? ''} onChange={(e) => set('libelle', e.target.value)} /><datalist id="acts">{['Étude dirigée', 'Projet / Atelier', 'Club de lecture', 'Club scientifique', 'Vie de classe', 'Activités parascolaires', 'Orientation'].map((a) => <option key={a} value={a} />)}</datalist></Field>}
        <Field label="Professeur"><select className="select" value={f.professeurId ?? ''} onChange={(e) => set('professeurId', e.target.value || undefined)}><option value="">Équipe</option>{staff.map((s) => <option key={s.id} value={s.id}>{civ(s)}</option>)}</select></Field>
        <Field label="Salle"><input className="input" value={f.salle ?? ''} onChange={(e) => set('salle', e.target.value)} /></Field>
      </div>
    </Modal>
  );
}

function DuplicateModal({ from, onClose }: { from: string; onClose: () => void }) {
  const classes = useCollection('classes');
  const [to, setTo] = useState(classes.find((c) => c.id !== from)?.id ?? '');
  return (
    <Modal open onClose={onClose} title="Dupliquer l’emploi du temps" footer={<><button className="btn" onClick={onClose}>Annuler</button><button className="btn btn-primary" onClick={() => {
      const target = db.get('classes', to)!;
      db.list('timetable').filter((s) => s.classeId === to).forEach((s) => db.remove('timetable', s.id));
      const src = db.list('timetable').filter((s) => s.classeId === from);
      db.bulkPut('timetable', src.map((s) => ({ ...s, id: `tt-${to}-${s.jour}-${s.debut}`, classeId: to, salle: s.salle === db.get('classes', from)?.code ? target.code : s.salle, professeurId: s.matiereId ? db.list('courses').find((c) => c.classeId === to && c.matiereId === s.matiereId)?.professeurId : s.professeurId })));
      toast(`Emploi du temps copié vers ${target.code}`); onClose();
    }}>Dupliquer</button></>}>
      <p className="small muted mb-12">L’emploi du temps de {classes.find((c) => c.id === from)?.code} remplacera celui de la classe choisie. Les professeurs sont ajustés selon les affectations de la classe cible.</p>
      <Field label="Vers la classe"><select className="select" value={to} onChange={(e) => setTo(e.target.value)}>{classes.filter((c) => c.id !== from).map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}</select></Field>
    </Modal>
  );
}
