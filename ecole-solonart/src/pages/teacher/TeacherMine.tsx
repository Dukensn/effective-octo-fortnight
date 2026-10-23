// Mes matières (avec charge horaire) et Mes écoles (professeurs du secondaire : plusieurs établissements).
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, School, Plus, Pencil } from 'lucide-react';
import { db, useCollection } from '../../data/store';
import type { OtherSchool } from '../../data/types';
import { Empty, Field, Modal, ScreenHead, Toggle, toast, Badge } from '../../components/ui';
import { useSession, audit } from '../../lib/session';
import { canMultiSchool, externalHours, subjectLoad } from '../../lib/prof';
import { slotsOf } from '../../lib/regles';
import { uid } from '../../data/store';

const TINTS = ['tint-blue', 'tint-green', 'tint-violet', 'tint-orange'];

export function MySubjects() {
  const nav = useNavigate();
  const session = useSession()!;
  useCollection('courses'); useCollection('timetable');
  const load = subjectLoad(session.user.staffId);
  const total = load.reduce((a, x) => a + x.heures, 0);
  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <ScreenHead center title="Mes matières" onBack={() => nav('/')} />
      <p className="small muted center mb-12">{total} h de cours par semaine dans l’école</p>
      {load.length === 0 && <Empty title="Aucune matière" />}
      <div className="stack" style={{ gap: 10 }}>{load.map((x, i) => (
        <button key={x.matiereId} className="card list-item" style={{ borderRadius: 14, width: '100%', textAlign: 'left', padding: 14 }} onClick={() => nav('/prof/notes')}>
          <span className={TINTS[i % TINTS.length]} style={{ width: 46, height: 46, borderRadius: 12, display: 'grid', placeItems: 'center' }}><School size={20} /></span>
          <span className="grow"><b style={{ color: 'var(--ink)', fontSize: 15 }}>{x.nom}</b><br /><span className="small muted">{x.classes} classe{x.classes > 1 ? 's' : ''} · {x.heures} h / semaine · {x.niveaux.join(', ')}</span></span>
          <ChevronRight className="chev" />
        </button>
      ))}</div>
    </div>
  );
}

export function MySchools() {
  const nav = useNavigate();
  const session = useSession()!;
  const staff = useCollection('staff').find((s) => s.id === session.user.staffId);
  useCollection('agenda'); useCollection('timetable');
  const [edit, setEdit] = useState<Partial<OtherSchool> | null>(null);
  const school = db.get('school', 'main');
  const here = slotsOf(session.user.staffId, db.list('timetable')).length;
  if (!canMultiSchool(session.user.staffId)) return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}><ScreenHead center title="Mes écoles" onBack={() => nav('/')} />
      <Empty title="Réservé au secondaire">Seuls les professeurs du secondaire peuvent déclarer d’autres établissements.</Empty></div>
  );
  const others = staff?.autresEcoles ?? [];
  const save = (o: Partial<OtherSchool>) => {
    if (!o.nom?.trim()) return toast('Nom de l’établissement requis', true);
    const item: OtherSchool = { id: o.id ?? uid('ext-'), nom: o.nom.trim(), commune: o.commune?.trim() || undefined, actif: o.actif ?? true };
    db.patch('staff', staff!.id, { autresEcoles: [...others.filter((x) => x.id !== item.id), item] });
    audit('Autre établissement', `${staff!.prenom} ${staff!.nom} · ${item.nom}`, { domaine: 'autre' });
    setEdit(null);
  };
  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <ScreenHead center title="Mes écoles" onBack={() => nav('/')} />
      <div className="stack" style={{ gap: 10 }}>
        <div className="card list-item" style={{ borderRadius: 14, padding: 14 }}>
          <span className="tint-blue" style={{ width: 48, height: 48, borderRadius: 12, display: 'grid', placeItems: 'center' }}><School /></span>
          <span className="grow"><b style={{ color: 'var(--ink)', fontSize: 15 }}>{school?.nom}</b> <Badge tone="green">Principale</Badge><br /><span className="small muted">{here} h / semaine</span></span>
        </div>
        {others.map((o) => (
          <button key={o.id} className="card list-item" style={{ borderRadius: 14, padding: 14, width: '100%', textAlign: 'left', opacity: o.actif ? 1 : 0.65 }} onClick={() => setEdit(o)}>
            <span className="tint-violet" style={{ width: 48, height: 48, borderRadius: 12, display: 'grid', placeItems: 'center' }}><School /></span>
            <span className="grow"><b style={{ color: 'var(--ink)', fontSize: 15 }}>{o.nom}</b> <Badge tone={o.actif ? 'green' : 'gray'}>{o.actif ? 'Actif' : 'Inactif'}</Badge><br /><span className="small muted">{externalHours(session.user.staffId, o.id)} h / semaine{o.commune ? ` · ${o.commune}` : ''}</span></span>
            <Pencil size={16} className="chev" />
          </button>
        ))}
        <button className="btn btn-soft" onClick={() => setEdit({ actif: true })}><Plus />Ajouter un établissement</button>
        <p className="tiny muted">Vos cours dans les autres établissements s’ajoutent depuis l’emploi du temps (bouton +). Ils ne sont visibles que par vous et servent à éviter les chevauchements.</p>
      </div>
      {edit && (
        <Modal open onClose={() => setEdit(null)} title={edit.id ? 'Établissement' : 'Ajouter un établissement'} footer={<><button className="btn" onClick={() => setEdit(null)}>Annuler</button><button className="btn btn-primary" onClick={() => save(edit)}>Enregistrer</button></>}>
          <div className="stack" style={{ gap: 12 }}>
            <Field label="Nom"><input className="input" value={edit.nom ?? ''} onChange={(e) => setEdit({ ...edit, nom: e.target.value })} placeholder="Ex. Collège Lumière" /></Field>
            <Field label="Commune" opt><input className="input" value={edit.commune ?? ''} onChange={(e) => setEdit({ ...edit, commune: e.target.value })} /></Field>
            <label className="row between"><span className="small">J’y enseigne cette année</span><Toggle on={edit.actif ?? true} onChange={(v) => setEdit({ ...edit, actif: v })} label="Actif" /></label>
          </div>
        </Modal>
      )}
    </div>
  );
}
