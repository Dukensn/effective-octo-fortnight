// Le parent complète l'inscription de son enfant : photo, informations, santé, contact d'urgence, documents.
// L'école vérifie ensuite le dossier (fiche de l'élève → « Valider le dossier »).
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Camera, Check, FileUp, PartyPopper, Paperclip } from 'lucide-react';
import { db, useDoc } from '../../data/store';
import type { Student } from '../../data/types';
import { Avatar, Empty, Field, toast } from '../../components/ui';
import { PhotoCapture } from '../../components/PhotoCapture';
import { fullName, readFileAsDataURL } from '../../lib/format';
import { audit, useSession } from '../../lib/session';
import { notifyParent } from '../../lib/chat';

const DOCS = ['Acte de naissance', 'Dernier bulletin', 'Certificat médical'];

export default function ParentEnroll() {
  const { id } = useParams();
  const nav = useNavigate();
  const session = useSession()!;
  const s = useDoc('students', id);
  const school = useDoc('school', 'main');
  const [f, setF] = useState<Partial<Student>>(() => s ? { photo: s.photo, dateNaissance: s.dateNaissance, lieuNaissance: s.lieuNaissance, adresse: s.adresse, commune: s.commune, medical: { ...s.medical }, contactUrgence: s.contactUrgence ?? { nom: '', telephone: '', lien: '' }, documents: s.documents } : {});
  const [photoOpen, setPhotoOpen] = useState(false);
  const [done, setDone] = useState(false);
  // Un parent ne voit que ses propres enfants.
  if (!s || !session.user.guardianId || !s.tuteurIds.includes(session.user.guardianId)) return <Empty title="Élève introuvable" />;
  const set = <K extends keyof Student>(k: K, v: Student[K]) => setF((x) => ({ ...x, [k]: v }));
  const docs = DOCS.map((type) => (f.documents ?? []).find((d) => d.type === type) ?? { type, nom: '', fourni: false });
  const attach = async (type: string, file?: File) => {
    if (!file) return;
    const url = await readFileAsDataURL(file, 1400);
    const others = (f.documents ?? []).filter((d) => d.type !== type);
    set('documents', [...others, { type, nom: file.name, fourni: true, fichier: url }]);
  };
  const submit = () => {
    if (!f.photo) return toast('Ajoutez la photo de l’enfant', true);
    if (!f.dateNaissance || !f.adresse?.trim()) return toast('Date de naissance et adresse sont demandées', true);
    db.patch('students', s.id, { ...f, dossierParent: { statut: 'soumis', soumisLe: Date.now() } });
    notifyParent(`notif-dossier-${s.id}-${Date.now()}`, s, 'message', `Merci ! Le dossier d’inscription de ${s.prenom} a bien été envoyé. L’école va le vérifier.`);
    audit('Dossier complété par le parent', fullName(s), { domaine: 'eleves' });
    setDone(true);
  };

  if (done || s.dossierParent?.statut === 'soumis' || s.dossierParent?.statut === 'valide') return (
    <div className="pe-done">
      <span className="tour-ic tint-green"><PartyPopper /></span>
      <h2>{s.dossierParent?.statut === 'valide' ? 'Dossier validé' : 'Dossier envoyé'}</h2>
      <p>{s.dossierParent?.statut === 'valide' ? `${school?.nom ?? 'L’école'} a validé l’inscription de ${s.prenom}.` : `Merci ! ${school?.nom ?? 'L’école'} va vérifier le dossier de ${s.prenom}. Vous serez prévenu dans les messages.`}</p>
      <button className="btn btn-primary btn-lg" onClick={() => nav('/')}>Retour à l’accueil</button>
    </div>
  );

  return (
    <div className="pe">
      <div className="pe-head">
        <button className="avatar-edit pf-photo" onClick={() => setPhotoOpen(true)} aria-label="Photo de l’enfant">
          {f.photo ? <Avatar src={f.photo} name={fullName(s)} size={96} /> : <span className="photo-empty" style={{ width: 96, height: 96, borderRadius: '50%', display: 'grid' }}><Camera /></span>}
          <span className="cam"><Camera size={15} /></span>
        </button>
        <h2>{fullName(s)}</h2>
        <p>Complétez l’inscription. Cela prend 3 minutes ; l’école vérifie ensuite.</p>
      </div>

      <section className="card card-pad pe-sec">
        <h3><span>1</span>Informations</h3>
        <div className="form-grid">
          <Field label="Date de naissance" req><input type="date" className="input" value={f.dateNaissance ?? ''} onChange={(e) => set('dateNaissance', e.target.value)} /></Field>
          <Field label="Lieu de naissance"><input className="input" value={f.lieuNaissance ?? ''} onChange={(e) => set('lieuNaissance', e.target.value)} /></Field>
          <Field label="Adresse" req><input className="input" value={f.adresse ?? ''} onChange={(e) => set('adresse', e.target.value)} placeholder="Rue, quartier" /></Field>
          <Field label="Commune"><input className="input" value={f.commune ?? ''} onChange={(e) => set('commune', e.target.value)} /></Field>
        </div>
      </section>

      <section className="card card-pad pe-sec">
        <h3><span>2</span>Santé</h3>
        <div className="form-grid">
          <Field label="Groupe sanguin" opt><select className="select" value={f.medical?.groupeSanguin ?? ''} onChange={(e) => set('medical', { ...f.medical, groupeSanguin: e.target.value || undefined })}><option value="">Je ne sais pas</option>{['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((g) => <option key={g}>{g}</option>)}</select></Field>
          <Field label="Allergies" opt><input className="input" value={f.medical?.allergies ?? ''} onChange={(e) => set('medical', { ...f.medical, allergies: e.target.value })} placeholder="Aucune" /></Field>
        </div>
      </section>

      <section className="card card-pad pe-sec">
        <h3><span>3</span>Personne à prévenir en urgence</h3>
        <div className="form-grid">
          <Field label="Nom"><input className="input" value={f.contactUrgence?.nom ?? ''} onChange={(e) => set('contactUrgence', { ...f.contactUrgence!, nom: e.target.value })} /></Field>
          <Field label="Téléphone"><input className="input" type="tel" value={f.contactUrgence?.telephone ?? ''} onChange={(e) => set('contactUrgence', { ...f.contactUrgence!, telephone: e.target.value })} /></Field>
          <Field label="Lien" className="span-2"><input className="input" value={f.contactUrgence?.lien ?? ''} onChange={(e) => set('contactUrgence', { ...f.contactUrgence!, lien: e.target.value })} placeholder="Ex. tante, voisin" /></Field>
        </div>
      </section>

      <section className="card card-pad pe-sec">
        <h3><span>4</span>Documents <small>photos ou PDF</small></h3>
        <div className="stack" style={{ gap: 8 }}>{docs.map((d) => (
          <label key={d.type} className={`pe-doc${d.fourni ? ' ok' : ''}`}>
            <span className="row-ic">{d.fourni ? <Check /> : <FileUp />}</span>
            <span className="grow"><b>{d.type}</b><small>{d.fourni ? d.nom || 'Fourni' : 'Touchez pour prendre une photo ou choisir un fichier'}</small></span>
            <Paperclip size={18} className="chev" />
            <input type="file" accept="image/*,application/pdf" hidden onChange={(e) => attach(d.type, e.target.files?.[0])} />
          </label>
        ))}</div>
      </section>

      <div className="sticky-foot"><button className="btn btn-primary btn-lg btn-block" onClick={submit}><Check />Envoyer le dossier à l’école</button></div>
      <PhotoCapture open={photoOpen} onClose={() => setPhotoOpen(false)} onSave={(u) => { set('photo', u); setPhotoOpen(false); }} current={f.photo} title="Photo de l’enfant" onRemove={f.photo ? () => set('photo', undefined) : undefined} />
    </div>
  );
}
