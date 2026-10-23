import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Users, ChevronRight, DoorOpen } from 'lucide-react';
import { db, useCollection } from '../../data/store';
import type { ClassRoom } from '../../data/types';
import { PageHead, Modal, Field, toast, SearchInput, Avatar, Pills } from '../../components/ui';
import { classReport, fmtNote, sortedPeriods } from '../../data/compute';
import { civ, money, norm } from '../../lib/format';
import { useSession, audit } from '../../lib/session';

export default function Classes() {
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const session = useSession()!;
  const classes = useCollection('classes').slice().sort((a, b) => a.code.localeCompare(b.code, 'fr', { numeric: true }));
  const students = useCollection('students');
  const staff = useCollection('staff');
  useCollection('grades');
  const [q, setQ] = useState('');
  const [niveau, setNiveau] = useState<'Tous' | ClassRoom['niveau']>('Tous');
  const [edit, setEdit] = useState<Partial<ClassRoom> | null>(null);
  useEffect(() => { if (params.get('new')) { setEdit({}); setParams({}, { replace: true }); } }, [params, setParams]);
  const periods = sortedPeriods();
  const last = [...periods].reverse().find((p) => p.verrouillee) ?? periods[0];
  const list = classes.filter((c) => (niveau === 'Tous' || c.niveau === niveau) && (!q || norm(c.code + c.nom).includes(norm(q))));

  return (
    <>
      <PageHead title="Classes" sub="Organisation des classes, salles, titulaires et matières."
        actions={session.can('classes', 'write') && <button className="btn btn-primary" onClick={() => setEdit({})}><Plus />Créer une classe</button>} />
      <div className="row wrap mb-16" style={{ gap: 12 }}>
        <div style={{ flex: '1 1 260px', maxWidth: 380 }}><SearchInput value={q} onChange={setQ} placeholder="Rechercher une classe..." /></div>
        <Pills items={['Tous', 'Fondamental', 'Secondaire']} value={niveau} onChange={setNiveau} />
      </div>
      <div className="grid g-3">
        {list.map((c) => {
          const n = students.filter((s) => s.classeId === c.id && s.statut === 'Actif').length;
          const tit = staff.find((s) => s.id === c.titulaireId);
          const r = classReport(c.id, last?.id ?? 'annuel');
          return (
            <button key={c.id} className="card card-pad" style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12 }} onClick={() => nav(`/classes/${c.id}`)}>
              <div className="row">
                <div className="tint-blue" style={{ width: 46, height: 46, borderRadius: 12, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 13 }}>{c.code}</div>
                <div className="grow"><div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 15 }}>{c.nom}</div><div className="tiny muted">{c.niveau}{c.filiere ? ` · ${c.filiere}` : ''}</div></div>
                <ChevronRight className="chev" />
              </div>
              <div>
                <div className="row between small"><span className="row" style={{ gap: 6 }}><Users size={15} />{n} / {c.capacite} élèves</span><span className="row" style={{ gap: 6 }}><DoorOpen size={15} />{c.salle}</span></div>
                <div className="bar mt-8"><i style={{ width: `${Math.min(100, (n / c.capacite) * 100)}%`, background: n >= c.capacite ? 'var(--red)' : 'var(--primary)' }} /></div>
              </div>
              <div className="row between small" style={{ borderTop: '1px solid var(--line-2)', paddingTop: 10 }}>
                <span className="row" style={{ gap: 8 }}>{tit && <Avatar src={tit.photo} name={civ(tit)} size={26} />}<span className="ellipsis" style={{ maxWidth: 160 }}>{tit ? civ(tit) : 'Aucun titulaire'}</span></span>
                <span>Moy. {last?.court} : <b>{fmtNote(r?.classGeneral)}</b></span>
              </div>
            </button>
          );
        })}
      </div>
      {edit && <ClassForm value={edit} onClose={() => setEdit(null)} onSaved={(id) => nav(`/classes/${id}`)} />}
    </>
  );
}

export function ClassForm({ value, onClose, onSaved }: { value: Partial<ClassRoom>; onClose: () => void; onSaved?: (id: string) => void }) {
  const staff = useCollection('staff').filter((s) => s.type === 'Professeur' && s.statut === 'Actif');
  const school = db.get('school', 'main')!;
  const [f, setF] = useState<Partial<ClassRoom>>({ niveau: 'Secondaire', capacite: 35, fraisInscription: 5000, fraisScolarite: 60000, ...value });
  const set = (k: keyof ClassRoom, v: unknown) => setF((x) => ({ ...x, [k]: v }));
  const save = () => {
    if (!f.code?.trim() || !f.nom?.trim()) return toast('Code et nom requis', true);
    const saved = db.put('classes', { anneeId: school.anneeCourante, salle: f.salle || `Salle ${f.code}`, annee: f.annee || f.nom!, ...f } as ClassRoom);
    if (!value.id) {
      // Affecte automatiquement toutes les matières à la nouvelle classe
      const subjects = db.list('subjects');
      db.bulkPut('courses', subjects.map((s) => ({ id: `${saved.id}-${s.id}`, classeId: saved.id, matiereId: s.id, coefficient: 2, heuresSemaine: 3 })));
    }
    audit(value.id ? 'Modification classe' : 'Création classe', f.code!);
    toast('Classe enregistrée');
    onClose();
    onSaved?.(saved.id);
  };
  return (
    <Modal open onClose={onClose} title={value.id ? 'Modifier la classe' : 'Créer une classe'} size="lg"
      footer={<><button className="btn" onClick={onClose}>Annuler</button><button className="btn btn-primary" onClick={save}>Enregistrer</button></>}>
      <div className="form-grid">
        <Field label="Code" req><input className="input" value={f.code ?? ''} onChange={(e) => set('code', e.target.value)} placeholder="S4-A" /></Field>
        <Field label="Nom complet" req><input className="input" value={f.nom ?? ''} onChange={(e) => set('nom', e.target.value)} placeholder="Secondaire IV - S4-A" /></Field>
        <Field label="Niveau"><select className="select" value={f.niveau} onChange={(e) => set('niveau', e.target.value)}>{['Préscolaire', 'Fondamental', 'Secondaire'].map((n) => <option key={n}>{n}</option>)}</select></Field>
        <Field label="Année d’études"><input className="input" value={f.annee ?? ''} onChange={(e) => set('annee', e.target.value)} placeholder="Secondaire IV, 9e AF..." /></Field>
        <Field label="Section" opt><input className="input" value={f.section ?? ''} onChange={(e) => set('section', e.target.value)} /></Field>
        <Field label="Filière" opt><input className="input" value={f.filiere ?? ''} onChange={(e) => set('filiere', e.target.value)} placeholder="Sciences, Lettres..." /></Field>
        <Field label="Salle"><input className="input" value={f.salle ?? ''} onChange={(e) => set('salle', e.target.value)} /></Field>
        <Field label="Capacité"><input type="number" className="input" value={f.capacite} onChange={(e) => set('capacite', Number(e.target.value))} /></Field>
        <Field label="Titulaire"><select className="select" value={f.titulaireId ?? ''} onChange={(e) => set('titulaireId', e.target.value || undefined)}><option value="">—</option>{staff.map((s) => <option key={s.id} value={s.id}>{civ(s)}</option>)}</select></Field>
        <div />
        <Field label={`Frais d’inscription (${money(f.fraisInscription ?? 0)})`}><input type="number" className="input" value={f.fraisInscription} onChange={(e) => set('fraisInscription', Number(e.target.value))} /></Field>
        <Field label={`Scolarité annuelle (${money(f.fraisScolarite ?? 0)})`}><input type="number" className="input" value={f.fraisScolarite} onChange={(e) => set('fraisScolarite', Number(e.target.value))} /></Field>
      </div>
    </Modal>
  );
}
