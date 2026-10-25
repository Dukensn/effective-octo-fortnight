import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Camera, Check, Link2, ListPlus, FileSpreadsheet, MessageCircle } from 'lucide-react';
import { findByEmail } from '../../lib/auth';
import { phoneDigits } from '../../lib/relance';
import { db, useCollection, uid } from '../../data/store';
import type { PaymentMode, Student } from '../../data/types';
import { Field, PageHead, toast } from '../../components/ui';
import { PhotoCapture } from '../../components/PhotoCapture';
import { civ, fullName, money, todayISO } from '../../lib/format';
import { audit } from '../../lib/session';
import { nextReceipt } from '../../lib/finance';

/** Inscription en un seul écran : l'essentiel, pensé pour le téléphone. Le reste se complète plus tard sur la fiche. */
export default function QuickEnroll() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const classes = useCollection('classes').slice().sort((a, b) => a.code.localeCompare(b.code, 'fr', { numeric: true }));
  const guardians = useCollection('guardians');
  const students = useCollection('students');
  const school = db.get('school', 'main')!;
  const parentMode = !!school.parentsCompletent;
  const empty = { nom: '', prenom: '', sexe: 'M' as 'M' | 'F', naissance: '', parent: '', telephone: '', email: '', photo: '', paye: true, mode: 'Espèces' as PaymentMode, parentComplete: parentMode };
  const [classeId, setClasseId] = useState(params.get('classe') ?? '');
  const [f, setF] = useState({ ...empty, prenom: params.get('prenom') ?? '', nom: params.get('nom') ?? '' });
  const [photoOpen, setPhotoOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [last, setLast] = useState<Student | null>(null);
  const [invite, setInvite] = useState<{ tel: string; text: string } | null>(null);
  const classe = classes.find((c) => c.id === classeId);
  const set = (k: keyof typeof f, v: unknown) => { setF((x) => ({ ...x, [k]: v })); setErrors((e) => ({ ...e, [k]: false })); };
  const tel = f.telephone.replace(/\D/g, '');
  const match = useMemo(() => (tel.length >= 8 ? guardians.find((g) => g.telephone.replace(/\D/g, '').endsWith(tel.slice(-8))) : undefined), [tel, guardians]);
  const siblings = match ? students.filter((s) => s.tuteurIds.includes(match.id)) : [];

  const save = () => {
    const e = { nom: !f.nom.trim(), prenom: !f.prenom.trim(), classe: !classeId, telephone: tel.length < 8 };
    setErrors(e);
    if (Object.values(e).some(Boolean)) return toast('Complétez les champs en rouge', true);
    let gid = match?.id;
    if (!gid) {
      const [gp, ...gn] = (f.parent.trim() || `Parent ${f.nom}`).split(/\s+/);
      gid = db.put('guardians', { nom: gn.join(' ') || f.nom.trim(), prenom: gp, sexe: 'M', lien: 'Tuteur', telephone: f.telephone.trim().startsWith('+') ? f.telephone.trim() : `+509 ${tel.slice(-8).replace(/(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4')}`, whatsapp: f.telephone.trim(), principal: true, statut: 'Actif', nationalite: 'Haïtienne' }).id;
    }
    const prefix = ({ 'Secondaire IV': 'SIV', 'Secondaire III': 'SIII', 'Secondaire II': 'SII', 'Secondaire I': 'SI' } as Record<string, string>)[classe!.annee] ?? classe!.code.replace(/[^A-Z0-9]/gi, '');
    const s = db.put('students', {
      id: uid('e'), matricule: `${prefix}${(db.get('years', school.anneeCourante)?.debut ?? todayISO()).slice(0, 4)}${String(students.length + 1).padStart(4, '0')}`,
      nom: f.nom.trim(), prenom: f.prenom.trim(), sexe: f.sexe, dateNaissance: f.naissance, lieuNaissance: school.commune, nationalite: 'Haïtienne',
      adresse: '', commune: school.commune, classeId, anneeId: school.anneeCourante, regime: 'Externe', typeInscription: 'Nouvelle inscription',
      redoublant: false, boursier: false, dateInscription: todayISO(), dateEntree: todayISO(), statut: 'Actif', tuteurIds: [gid], medical: {},
      photo: f.photo || undefined, langue: 'Français',
      dossierParent: parentMode && f.parentComplete ? { statut: 'a_completer' } : undefined,
      documents: [{ type: 'Acte de naissance', nom: '', fourni: false }, { type: 'Dernier bulletin', nom: '', fourni: false }, { type: "Photo d'identité", nom: '', fourni: !!f.photo }],
    });
    if (f.paye && classe) db.put('payments', { recu: nextReceipt(), eleveId: s.id, classeId, date: todayISO(), montant: classe.fraisInscription, mode: f.mode, motif: 'Inscription', statut: 'Payé' });
    audit('Inscription rapide', fullName(s));
    // Le parent complète le reste : on lui crée son accès et on prépare l'invitation.
    setInvite(null);
    if (parentMode && f.parentComplete) {
      const role = db.list('roles').find((x) => x.espace === 'parent');
      const g = db.get('guardians', gid)!;
      let account = db.list('users').find((u) => u.guardianId === gid);
      const email = f.email.trim().toLowerCase();
      if (!account && role && /^\S+@\S+\.\S+$/.test(email) && !findByEmail(email)) {
        account = db.put('users', { id: `u-par-${gid}`, nom: civ(g), email, telephone: g.telephone, roleId: role.id, guardianId: gid, pin: '', actif: true });
        if (!g.email) db.patch('guardians', gid, { email });
      }
      const url = `${location.origin}${location.pathname}`;
      const how = account ? (account.dernierAcces ? 'connectez-vous à votre compte' : `connectez-vous avec Google, ou touchez « Créer un compte » avec l’adresse ${account.email}`) : 'demandez votre accès au secrétariat';
      setInvite({ tel: g.whatsapp ?? g.telephone, text: `Bonjour ${civ(g)}, ${fullName(s)} est inscrit${s.sexe === 'F' ? 'e' : ''} à ${school.nom} en ${classe?.code}. Pour terminer l’inscription (photo, informations, documents), ouvrez ${url} puis ${how}. Merci.` });
    }
    toast(`${fullName(s)} inscrit${s.sexe === 'F' ? 'e' : ''} en ${classe?.code}`);
    setLast(s);
    setF(empty);
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <PageHead
        back={<button className="back-link" style={{ border: 0, background: 'none', padding: 0 }} onClick={() => nav('/inscriptions')}><ArrowLeft size={16} />Inscriptions</button>}
        title="Inscription rapide"
        sub="L’essentiel en un écran. Les autres informations se complètent plus tard sur la fiche de l’élève."
      />
      {last && (
        <div className="card card-pad row mb-16" style={{ background: 'var(--green-50)', border: 0 }}>
          <Check color="var(--green)" />
          <span className="grow small"><b style={{ color: 'var(--ink)' }}>{fullName(last)}</b> est inscrit{last.sexe === 'F' ? 'e' : ''} · {last.matricule}</span>
          <button className="btn btn-sm" onClick={() => nav(`/eleves/${last.id}`)}>Voir la fiche</button>
        </div>
      )}
      {invite && (
        <div className="card card-pad row wrap mb-16" style={{ gap: 12 }}>
          <span className="grow small"><b style={{ color: 'var(--ink)' }}>Le parent complète le reste</b><br /><span className="muted">Envoyez-lui l’invitation : il ajoutera la photo, les informations et les documents. Vous vérifierez ensuite.</span></span>
          <a className="btn btn-success" href={`https://wa.me/${phoneDigits(invite.tel)}?text=${encodeURIComponent(invite.text)}`} target="_blank" rel="noreferrer"><MessageCircle size={16} />Inviter par WhatsApp</a>
        </div>
      )}
      <div className="card card-pad stack" style={{ gap: 16 }}>
        <div className="row" style={{ gap: 16 }}>
          <button className="avatar-edit" onClick={() => setPhotoOpen(true)} aria-label="Photo de l’élève">
            {f.photo ? <img src={f.photo} alt="" style={{ width: 92, height: 92, borderRadius: 16, objectFit: 'cover' }} /> : <span className="photo-empty" style={{ width: 92, height: 92, borderRadius: 16, display: 'grid' }}><Camera /></span>}
            <span className="cam"><Camera size={15} /></span>
          </button>
          <div className="grow">
            <Field label="Classe" req>
              <select className="select" style={errors.classe ? { borderColor: 'var(--red)' } : undefined} value={classeId} onChange={(e) => { setClasseId(e.target.value); setErrors((x) => ({ ...x, classe: false })); }}>
                <option value="">Choisir…</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </Field>
            {classe && <div className="tiny muted mt-8">Inscription {money(classe.fraisInscription)} · Scolarité {money(classe.fraisScolarite)} / an</div>}
          </div>
        </div>
        <div className="form-grid">
          <Field label="Nom" req><input className={`input ${errors.nom ? 'invalid' : ''}`} autoCapitalize="words" value={f.nom} onChange={(e) => set('nom', e.target.value)} /></Field>
          <Field label="Prénom(s)" req><input className={`input ${errors.prenom ? 'invalid' : ''}`} autoCapitalize="words" value={f.prenom} onChange={(e) => set('prenom', e.target.value)} /></Field>
          <Field label="Sexe"><div className="seg"><button type="button" className={f.sexe === 'M' ? 'active' : ''} onClick={() => set('sexe', 'M')}>Garçon</button><button type="button" className={f.sexe === 'F' ? 'active' : ''} onClick={() => set('sexe', 'F')}>Fille</button></div></Field>
          <Field label="Date de naissance"><input type="date" className="input" value={f.naissance} onChange={(e) => set('naissance', e.target.value)} /></Field>
          <Field label="Téléphone du parent" req><input type="tel" inputMode="tel" className={`input ${errors.telephone ? 'invalid' : ''}`} value={f.telephone} onChange={(e) => set('telephone', e.target.value)} placeholder="+509 …" /></Field>
          {match ? (
            <div className="row small" style={{ background: 'var(--primary-50)', borderRadius: 10, padding: 10, alignSelf: 'end' }}>
              <Link2 size={16} color="var(--primary)" /><span>Parent déjà connu : <b>{fullName(match)}</b>{siblings.length ? ` (${siblings.map((s) => s.prenom).join(', ')})` : ''}</span>
            </div>
          ) : <Field label="Nom du parent"><input className="input" autoCapitalize="words" value={f.parent} onChange={(e) => set('parent', e.target.value)} placeholder="Prénom Nom" /></Field>}
          {parentMode && f.parentComplete && !(match && db.list('users').some((u) => u.guardianId === match.id)) && <Field label="E-mail du parent" opt className="span-2"><input className="input" type="email" inputMode="email" value={f.email} onChange={(e) => set('email', e.target.value)} placeholder="Pour créer son accès" /></Field>}
        </div>
        {parentMode && <label className="check"><input type="checkbox" checked={f.parentComplete} onChange={(e) => set('parentComplete', e.target.checked)} />Le parent complète le reste depuis son téléphone (photo, informations, documents)</label>}
        {classe && (
          <div className="row wrap" style={{ gap: 10 }}>
            <label className="check"><input type="checkbox" checked={f.paye} onChange={(e) => set('paye', e.target.checked)} />Frais d’inscription payés ({money(classe.fraisInscription)})</label>
            {f.paye && <select className="select" style={{ width: 140 }} value={f.mode} onChange={(e) => set('mode', e.target.value)}>{['Espèces', 'MonCash', 'NatCash', 'Virement', 'Chèque'].map((m) => <option key={m}>{m}</option>)}</select>}
          </div>
        )}
        <button className="btn btn-primary btn-lg btn-block" onClick={save}><Check />Inscrire l’élève</button>
      </div>
      <div className="row wrap mt-16" style={{ gap: 8, justifyContent: 'center' }}>
        <button className="btn btn-ghost" onClick={() => nav('/inscriptions/nouvelle')}><ListPlus />Formulaire complet</button>
        <button className="btn btn-ghost" onClick={() => nav('/eleves/import')}><FileSpreadsheet />Importer un fichier Excel</button>
      </div>
      <PhotoCapture open={photoOpen} onClose={() => setPhotoOpen(false)} onSave={(u) => { set('photo', u); setPhotoOpen(false); }} current={f.photo || undefined} title="Photo de l’élève" onRemove={f.photo ? () => set('photo', '') : undefined} />
    </div>
  );
}
