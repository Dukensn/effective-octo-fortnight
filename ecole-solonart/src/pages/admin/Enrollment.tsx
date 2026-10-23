import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, User, GraduationCap, Users, Plus as PlusIcon, FileText, ImagePlus, Upload, CheckCircle2, Circle, Info, Check, Printer, IdCard, Link2 } from 'lucide-react';
import { db, useCollection, useDoc, uid } from '../../data/store';
import type { Guardian, Student, PaymentMode } from '../../data/types';
import { PageHead, Field, Badge, toast, useIsDesktop, Avatar } from '../../components/ui';
import { readFileAsDataURL, fullName, dateShort, money, todayISO } from '../../lib/format';
import { audit } from '../../lib/session';
import { nextReceipt } from '../../lib/finance';
import { printDocument } from '../../lib/print';
import { EnrollmentSheet } from '../../docs/Sheets';

const STEPS = ['Informations personnelles', 'Scolarité', 'Responsables', 'Informations médicales', 'Documents', 'Confirmation'];
const LIENS: Guardian['lien'][] = ['Père', 'Mère', 'Tuteur', 'Tutrice', 'Grand-père', 'Grand-mère', 'Oncle', 'Tante', 'Frère', 'Sœur', 'Autre'];
const DOCS = [
  { type: 'Acte de naissance', req: true },
  { type: 'Dernier bulletin', req: true },
  { type: "Photo d'identité", req: true },
  { type: 'Certificat médical', req: false },
  { type: 'Photo des parents', req: false },
];

interface GForm { id?: string; nom: string; prenom: string; telephone: string; email: string; profession: string; lien: Guardian['lien']; sexe: 'M' | 'F' }
const emptyG = (lien: Guardian['lien'], sexe: 'M' | 'F'): GForm => ({ nom: '', prenom: '', telephone: '', email: '', profession: '', lien, sexe });

export default function EnrollmentRoute() {
  const loc = useLocation();
  return <Enrollment key={loc.key} />;
}

function Enrollment() {
  const { id } = useParams();
  const nav = useNavigate();
  const desktop = useIsDesktop();
  const existing = useDoc('students', id);
  const school = useDoc('school', 'main');
  const classes = useCollection('classes').slice().sort((a, b) => a.code.localeCompare(b.code, 'fr', { numeric: true }));
  const guardians = useCollection('guardians');
  const year = useDoc('years', school?.anneeCourante);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<Student | null>(null);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  const [f, setF] = useState(() => ({
    nom: '', prenom: '', sexe: 'M' as 'M' | 'F', dateNaissance: '', lieuNaissance: 'Léogâne', nationalite: 'Haïtienne', numeroActe: '', nin: '', religion: '',
    adresse: '', commune: 'Léogâne', telephone: '', photo: '' as string,
    niveau: 'Secondaire', classeId: '', typeInscription: 'Nouvelle inscription' as Student['typeInscription'], dateEntree: todayISO(), regime: 'Externe' as Student['regime'],
    redoublant: false, boursier: false, tauxBourse: 50, ecoleProvenance: '',
    pere: emptyG('Père', 'M'), mere: emptyG('Mère', 'F'), autre: emptyG('Tuteur', 'M'), principal: 'pere' as 'pere' | 'mere' | 'autre',
    urgenceNom: '', urgenceTel: '',
    groupeSanguin: '', allergies: '', problemes: '', assurance: '',
    docs: Object.fromEntries(DOCS.map((d) => [d.type, false])) as Record<string, boolean>,
    payerInscription: true, modePaiement: 'Espèces' as PaymentMode, montantPaye: 0, refPaiement: '',
  }));

  // Pré-remplissage en mode modification
  useEffect(() => {
    if (!existing) return;
    const gs = existing.tuteurIds.map((g) => db.get('guardians', g)).filter(Boolean) as Guardian[];
    const toForm = (g?: Guardian): GForm | undefined => g && { id: g.id, nom: g.nom, prenom: g.prenom, telephone: g.telephone, email: g.email ?? '', profession: g.profession ?? '', lien: g.lien, sexe: g.sexe };
    const pere = gs.find((g) => g.lien === 'Père');
    const mere = gs.find((g) => g.lien === 'Mère');
    const autre = gs.find((g) => g !== pere && g !== mere);
    const cls = db.get('classes', existing.classeId);
    setF((x) => ({
      ...x, ...existing, telephone: existing.telephone ?? '', photo: existing.photo ?? '', numeroActe: existing.numeroActe ?? '', nin: existing.nin ?? '', religion: existing.religion ?? '', ecoleProvenance: existing.ecoleProvenance ?? '',
      niveau: cls?.niveau ?? 'Secondaire', tauxBourse: existing.tauxBourse ?? 50,
      pere: toForm(pere) ?? x.pere, mere: toForm(mere) ?? x.mere, autre: toForm(autre) ?? x.autre,
      principal: gs.find((g) => g.principal) === mere ? 'mere' : gs.find((g) => g.principal) === autre ? 'autre' : 'pere',
      urgenceNom: existing.contactUrgence?.nom ?? '', urgenceTel: existing.contactUrgence?.telephone ?? '',
      groupeSanguin: existing.medical.groupeSanguin ?? '', allergies: existing.medical.allergies ?? '', problemes: existing.medical.problemes ?? '', assurance: existing.medical.assurance ?? '',
      docs: Object.fromEntries(DOCS.map((d) => [d.type, existing.documents.find((x) => x.type === d.type)?.fourni ?? false])),
      payerInscription: false,
    }));
  }, [existing?.id]); // eslint-disable-line

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => { setF((x) => ({ ...x, [k]: v })); setErrors((e) => ({ ...e, [k]: '' })); };
  const setG = (who: 'pere' | 'mere' | 'autre', k: keyof GForm, v: string) => { setF((x) => ({ ...x, [who]: { ...x[who], [k]: v, ...(k !== 'id' && k === 'telephone' ? {} : {}) } })); setErrors((e) => ({ ...e, guardians: '' })); };
  const classe = classes.find((c) => c.id === f.classeId);
  const classesForLevel = classes.filter((c) => c.niveau === f.niveau);
  const frais = classe ? classe.fraisInscription : 0;

  // Détection d'un parent déjà enregistré (frères et sœurs) par numéro de téléphone
  const phoneMatch = (tel: string, selfId?: string) => {
    const n = tel.replace(/\D/g, '');
    if (n.length < 8) return undefined;
    return guardians.find((g) => g.id !== selfId && g.telephone.replace(/\D/g, '').endsWith(n.slice(-8)));
  };
  const linkGuardian = (who: 'pere' | 'mere' | 'autre', g: Guardian) => setF((x) => ({ ...x, [who]: { id: g.id, nom: g.nom, prenom: g.prenom, telephone: g.telephone, email: g.email ?? '', profession: g.profession ?? '', lien: g.lien, sexe: g.sexe } }));

  const validate = (upTo: number) => {
    const e: Record<string, string> = {};
    if (upTo >= 0) {
      if (!f.nom.trim()) e.nom = 'Nom requis';
      if (!f.prenom.trim()) e.prenom = 'Prénom requis';
      if (!f.dateNaissance) e.dateNaissance = 'Date requise';
    }
    if (upTo >= 1 && !f.classeId) e.classeId = 'Choisissez une classe';
    if (upTo >= 2) {
      const any = [f.pere, f.mere, f.autre].some((g) => g.nom.trim() && g.telephone.trim());
      if (!any) e.guardians = 'Indiquez au moins un responsable avec son téléphone';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const firstErrorStep = (e: Record<string, string>) => (e.nom || e.prenom || e.dateNaissance ? 0 : e.classeId ? 1 : e.guardians ? 2 : -1);

  const goNext = () => {
    if (desktop && step < 5) {
      if (!validate(4)) { toast('Complétez les champs obligatoires', true); return; }
      setStep(5);
    } else if (step < 5) {
      if (!validate(step)) return;
      setStep(step + 1);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const goStep = (i: number) => {
    if (desktop && i < 5) { setStep(0); setTimeout(() => refs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30); return; }
    if (i > step && !validate(Math.min(i - 1, 4))) return;
    setStep(i);
  };

  const save = (asDraft = false) => {
    if (!validate(4)) { setStep(desktop ? 0 : Math.max(0, firstErrorStep(errors))); toast('Complétez les champs obligatoires', true); return; }
    const tuteurIds: string[] = [];
    (['pere', 'mere', 'autre'] as const).forEach((who) => {
      const g = f[who];
      if (!g.nom.trim() || !g.telephone.trim()) return;
      const data = { nom: g.nom.trim(), prenom: g.prenom.trim(), telephone: g.telephone.trim(), whatsapp: g.telephone.trim(), email: g.email || undefined, profession: g.profession || undefined, lien: g.lien, sexe: who === 'mere' ? 'F' as const : who === 'pere' ? 'M' as const : g.sexe, principal: f.principal === who, statut: 'Actif' as const, nationalite: 'Haïtienne', adresse: `${f.adresse}, ${f.commune}` };
      if (g.id) { db.patch('guardians', g.id, data); tuteurIds.push(g.id); }
      else tuteurIds.push(db.put('guardians', data).id);
    });
    const levelPrefix = classe ? ({ 'Secondaire IV': 'SIV', 'Secondaire III': 'SIII', 'Secondaire II': 'SII', 'Secondaire I': 'SI' } as Record<string, string>)[classe.annee] ?? classe.code.replace(/[^A-Z0-9]/gi, '') : 'E';
    const base: Omit<Student, 'id' | 'updatedAt'> = {
      matricule: existing?.matricule ?? `${levelPrefix}${(year?.debut ?? todayISO()).slice(0, 4)}${String(db.list('students').length + 1).padStart(4, '0')}`,
      nom: f.nom.trim().toUpperCase() === f.nom.trim() ? f.nom.trim()[0] + f.nom.trim().slice(1).toLowerCase() : f.nom.trim(),
      prenom: f.prenom.trim(), sexe: f.sexe, dateNaissance: f.dateNaissance, lieuNaissance: f.lieuNaissance, nationalite: f.nationalite,
      religion: f.religion || undefined, numeroActe: f.numeroActe || undefined, nin: f.nin || undefined, photo: f.photo || undefined,
      adresse: f.adresse, commune: f.commune, telephone: f.telephone || undefined, classeId: f.classeId, anneeId: school!.anneeCourante,
      regime: f.regime, typeInscription: f.typeInscription, redoublant: f.redoublant, boursier: f.boursier, tauxBourse: f.boursier ? f.tauxBourse : undefined,
      ecoleProvenance: f.ecoleProvenance || undefined, dateInscription: existing?.dateInscription ?? todayISO(), dateEntree: f.dateEntree,
      statut: existing ? (existing.statut === 'En attente' && !asDraft ? 'Actif' : existing.statut) : asDraft ? 'En attente' : 'Actif',
      tuteurIds, contactUrgence: f.urgenceNom ? { nom: f.urgenceNom, telephone: f.urgenceTel, lien: '' } : undefined,
      medical: { groupeSanguin: f.groupeSanguin || undefined, allergies: f.allergies || undefined, problemes: f.problemes || undefined, assurance: f.assurance || undefined },
      documents: DOCS.map((d) => ({ type: d.type, nom: '', fourni: f.docs[d.type] })), langue: 'Français',
    };
    const saved = db.put('students', { ...base, id: existing?.id ?? uid('e') });
    if (!existing && f.payerInscription && classe) {
      db.put('payments', { recu: nextReceipt(), eleveId: saved.id, classeId: classe.id, date: todayISO(), montant: f.montantPaye || frais, mode: f.modePaiement, motif: 'Inscription', statut: 'Payé', reference: f.refPaiement || undefined });
    }
    audit(existing ? 'Modification élève' : 'Inscription', fullName(saved));
    if (existing) { toast('Modifications enregistrées'); nav(`/eleves/${saved.id}`); }
    else setDone(saved);
  };

  if (done) return <Success student={done} onNew={() => nav('/inscriptions/nouvelle', { state: Date.now() })} />;

  const show = (i: number) => (desktop ? step < 5 : step === i);
  const err = (k: string) => errors[k] ? <small style={{ color: 'var(--red)' }}>{errors[k]}</small> : null;

  return (
    <>
      <PageHead
        title={<span className="row" style={{ gap: 12 }}><span className="only-desktop tint-blue" style={{ width: 40, height: 40, borderRadius: 10, display: 'grid', placeItems: 'center' }}><FileText size={20} /></span>{existing ? 'Modifier un élève' : 'Inscription d’un élève'}</span>}
        sub={existing ? `${fullName(existing)} · ${existing.matricule}` : 'Remplissez les informations ci-dessous pour inscrire un nouvel élève.'}
        actions={<button className="btn btn-soft" onClick={() => nav(existing ? `/eleves/${existing.id}` : '/eleves')}><ArrowLeft />Retour à la liste</button>}
      />
      <div className="card mb-16">
        <div className="steps">
          {STEPS.map((s, i) => (
            <span key={s} style={{ display: 'contents' }}>
              {i > 0 && <span className={`step-line ${i <= step || (desktop && step === 5) ? 'done' : ''}`} />}
              <button className={`step ${i === step || (desktop && step < 5 && i === 0) ? 'active' : i < step ? 'done' : ''}`} onClick={() => goStep(i)}>
                <span className="n">{i < step && !(desktop && i === 0 && step < 5) ? <Check size={16} /> : i + 1}</span>
                <span className={i === step ? '' : 'only-desktop'}>{s}</span>
              </button>
            </span>
          ))}
        </div>
        {!desktop && <div className="small muted" style={{ padding: '0 14px 12px' }}>Étape {step + 1} sur {STEPS.length} · <b style={{ color: 'var(--ink)' }}>{STEPS[step]}</b></div>}
      </div>

      <div className="split split-side">
        <div className="stack">
          {step < 5 && (
            <>
              {show(0) && (
                <Section n={1} refEl={(el) => (refs.current[0] = el)} icon={<User />} title="Informations personnelles" sub="Identité de l'élève">
                  <div className="form-grid cols-4">
                    <Field label="Nom" req><input className={`input ${errors.nom ? 'invalid' : ''}`} value={f.nom} onChange={(e) => set('nom', e.target.value)} placeholder="Ex. Dorval" />{err('nom')}</Field>
                    <Field label="Prénom(s)" req><input className={`input ${errors.prenom ? 'invalid' : ''}`} value={f.prenom} onChange={(e) => set('prenom', e.target.value)} placeholder="Ex. Jean Philippe" />{err('prenom')}</Field>
                    <Field label="Sexe" req><select className="select" value={f.sexe} onChange={(e) => set('sexe', e.target.value as 'M' | 'F')}><option value="M">Masculin</option><option value="F">Féminin</option></select></Field>
                    <Field label="Date de naissance" req><input type="date" className={`input ${errors.dateNaissance ? 'invalid' : ''}`} value={f.dateNaissance} onChange={(e) => set('dateNaissance', e.target.value)} />{err('dateNaissance')}</Field>
                    <Field label="Lieu de naissance"><input className="input" value={f.lieuNaissance} onChange={(e) => set('lieuNaissance', e.target.value)} /></Field>
                    <Field label="Nationalité"><select className="select" value={f.nationalite} onChange={(e) => set('nationalite', e.target.value)}>{['Haïtienne', 'Dominicaine', 'Américaine', 'Française', 'Canadienne', 'Autre'].map((n) => <option key={n}>{n}</option>)}</select></Field>
                    <Field label="Numéro d’acte de naissance"><input className="input" value={f.numeroActe} onChange={(e) => set('numeroActe', e.target.value)} placeholder="A-2008-12345" /></Field>
                    <Field label="NIN (si disponible)"><input className="input" value={f.nin} onChange={(e) => set('nin', e.target.value)} placeholder="Ex. 0045 6789 1234" /></Field>
                    <Field label="Religion" opt><select className="select" value={f.religion} onChange={(e) => set('religion', e.target.value)}><option value="">—</option>{['Catholique', 'Protestante', 'Adventiste', 'Baptiste', 'Témoin de Jéhovah', 'Vodou', 'Autre', 'Aucune'].map((n) => <option key={n}>{n}</option>)}</select></Field>
                    <Field label="Adresse"><input className="input" value={f.adresse} onChange={(e) => set('adresse', e.target.value)} placeholder="Rue, quartier" /></Field>
                    <Field label="Commune"><input className="input" value={f.commune} onChange={(e) => set('commune', e.target.value)} /></Field>
                    <Field label="Téléphone de l’élève" opt><input className="input" type="tel" value={f.telephone} onChange={(e) => set('telephone', e.target.value)} placeholder="+509" /></Field>
                  </div>
                  {!desktop && <PhotoBox photo={f.photo} onChange={(p) => set('photo', p)} />}
                </Section>
              )}
              {show(1) && (
                <Section n={2} refEl={(el) => (refs.current[1] = el)} icon={<GraduationCap />} title="Informations scolaires" sub="Classe et parcours de l'élève">
                  <div className="form-grid cols-4">
                    <Field label="Niveau scolaire" req><select className="select" value={f.niveau} onChange={(e) => { set('niveau', e.target.value); set('classeId', ''); }}>{['Préscolaire', 'Fondamental', 'Secondaire'].map((n) => <option key={n}>{n}</option>)}</select></Field>
                    <Field label="Classe" req><select className={`select ${errors.classeId ? 'invalid' : ''}`} value={f.classeId} onChange={(e) => set('classeId', e.target.value)}><option value="">Choisir...</option>{classesForLevel.map((c) => { const n = db.list('students').filter((s) => s.classeId === c.id && s.statut === 'Actif').length; return <option key={c.id} value={c.id} disabled={n >= c.capacite}>{c.nom} ({n}/{c.capacite})</option>; })}</select>{err('classeId')}</Field>
                    <Field label="Type d’inscription" req><select className="select" value={f.typeInscription} onChange={(e) => set('typeInscription', e.target.value as Student['typeInscription'])}>{['Nouvelle inscription', 'Réinscription', 'Transfert'].map((n) => <option key={n}>{n}</option>)}</select></Field>
                    <Field label="Date d’entrée" req><input type="date" className="input" value={f.dateEntree} onChange={(e) => set('dateEntree', e.target.value)} /></Field>
                    <Field label="Régime" req><select className="select" value={f.regime} onChange={(e) => set('regime', e.target.value as Student['regime'])}>{['Externe', 'Demi-pensionnaire', 'Interne'].map((n) => <option key={n}>{n}</option>)}</select></Field>
                    <Field label="Section" opt><input className="input" value={classe?.section ?? ''} readOnly /></Field>
                    <Field label="Redoublant ?" req><select className="select" value={f.redoublant ? 'Oui' : 'Non'} onChange={(e) => set('redoublant', e.target.value === 'Oui')}><option>Non</option><option>Oui</option></select></Field>
                    <Field label="Bourse ?"><select className="select" value={f.boursier ? 'Oui' : 'Non'} onChange={(e) => set('boursier', e.target.value === 'Oui')}><option>Non</option><option>Oui</option></select></Field>
                    {f.boursier && <Field label="Réduction (%)"><input type="number" className="input" min={0} max={100} value={f.tauxBourse} onChange={(e) => set('tauxBourse', Number(e.target.value))} /></Field>}
                    {f.typeInscription !== 'Réinscription' && <Field label="École de provenance" opt className="span-2"><input className="input" value={f.ecoleProvenance} onChange={(e) => set('ecoleProvenance', e.target.value)} /></Field>}
                  </div>
                </Section>
              )}
              {show(2) && (
                <Section n={3} refEl={(el) => (refs.current[2] = el)} icon={<Users />} title="Responsables légaux" sub="Parents ou tuteurs de l'élève">
                  {errors.guardians && <p className="small mb-12" style={{ color: 'var(--red)' }}>{errors.guardians}</p>}
                  <div className="grid g-3">
                    {(['pere', 'mere', 'autre'] as const).map((who) => {
                      const g = f[who];
                      const match = !g.id ? phoneMatch(g.telephone) : undefined;
                      return (
                        <div key={who}>
                          <div className="row between mb-8"><b style={{ color: 'var(--ink)' }}>{who === 'pere' ? 'Père' : who === 'mere' ? 'Mère' : 'Autre responsable'}{who === 'autre' && <span className="muted" style={{ fontWeight: 400 }}> (optionnel)</span>}</b>
                            <label className="check tiny"><input type="radio" name="principal" checked={f.principal === who} onChange={() => set('principal', who)} />Principal</label></div>
                          <div className="stack" style={{ gap: 8 }}>
                            <GRow label="Nom"><input className="input" value={g.nom} onChange={(e) => setG(who, 'nom', e.target.value)} /></GRow>
                            <GRow label="Prénom"><input className="input" value={g.prenom} onChange={(e) => setG(who, 'prenom', e.target.value)} /></GRow>
                            {who === 'autre' && <GRow label="Lien avec l’élève"><select className="select" value={g.lien} onChange={(e) => setG(who, 'lien', e.target.value)}>{LIENS.map((l) => <option key={l}>{l}</option>)}</select></GRow>}
                            <GRow label="Téléphone"><input className="input" type="tel" value={g.telephone} onChange={(e) => setG(who, 'telephone', e.target.value)} placeholder="+509" /></GRow>
                            {match && (
                              <button type="button" className="btn btn-soft btn-sm" style={{ height: 'auto', padding: 8, whiteSpace: 'normal', textAlign: 'left' }} onClick={() => linkGuardian(who, match)}>
                                <Link2 size={14} />Déjà enregistré : {fullName(match)} ({match.lien}). Lier ce parent
                              </button>
                            )}
                            {g.id && <Badge tone="green">Parent existant lié</Badge>}
                            <GRow label="Email"><input className="input" type="email" value={g.email} onChange={(e) => setG(who, 'email', e.target.value)} /></GRow>
                            <GRow label="Profession"><input className="input" value={g.profession} onChange={(e) => setG(who, 'profession', e.target.value)} /></GRow>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="form-grid mt-16">
                    <Field label="Personne à contacter en urgence" opt><input className="input" value={f.urgenceNom} onChange={(e) => set('urgenceNom', e.target.value)} placeholder="Si les parents sont injoignables" /></Field>
                    <Field label="Téléphone d’urgence" opt><input className="input" type="tel" value={f.urgenceTel} onChange={(e) => set('urgenceTel', e.target.value)} placeholder="+509" /></Field>
                  </div>
                </Section>
              )}
              <div className={desktop && step < 5 ? 'grid g-2' : 'stack'}>
                {show(3) && (
                  <Section n={4} refEl={(el) => (refs.current[3] = el)} icon={<PlusIcon />} title="Informations médicales" sub="Informations importantes pour le suivi de l'élève">
                    <div className="form-grid">
                      <Field label="Numéro d’assurance" opt><input className="input" value={f.assurance} onChange={(e) => set('assurance', e.target.value)} /></Field>
                      <Field label="Groupe sanguin"><select className="select" value={f.groupeSanguin} onChange={(e) => set('groupeSanguin', e.target.value)}><option value="">Inconnu</option>{['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((g) => <option key={g}>{g}</option>)}</select></Field>
                      <Field label="Allergies" opt><input className="input" value={f.allergies} onChange={(e) => set('allergies', e.target.value)} placeholder="Aucune" /></Field>
                      <Field label="Problèmes de santé" opt><input className="input" value={f.problemes} onChange={(e) => set('problemes', e.target.value)} placeholder="Aucun" /></Field>
                    </div>
                  </Section>
                )}
                {show(4) && (
                  <Section n={5} refEl={(el) => (refs.current[4] = el)} icon={<FileText />} title="Documents requis" sub="Cochez les documents remis au secrétariat">
                    <div className="grid g-2" style={{ gap: 10 }}>
                      {DOCS.map((d) => (
                        <div key={d.type} className="file-tile" onClick={() => set('docs', { ...f.docs, [d.type]: !f.docs[d.type] })}>
                          <span className="ic">{f.docs[d.type] ? <CheckCircle2 color="var(--green)" /> : <Upload />}</span>
                          <span className="grow"><b style={{ color: 'var(--ink)', fontWeight: 500, fontSize: 13 }}>{d.type}{d.req && <span style={{ color: 'var(--red)' }}> *</span>}</b><br /><span className="tiny muted">{f.docs[d.type] ? 'Remis' : 'PDF, JPG, PNG (Max 2 Mo)'}</span></span>
                        </div>
                      ))}
                    </div>
                    <p className="tiny muted mt-12">Les documents manquants n’empêchent pas l’inscription : ils restent signalés sur la fiche de l’élève jusqu’à leur remise.</p>
                  </Section>
                )}
              </div>
            </>
          )}

          {step === 5 && (
            <div className="card card-pad">
              <div className="section-title"><span className="ic"><Check /></span><div><h3>Confirmation</h3><p>Vérifiez les informations avant d’enregistrer.</p></div></div>
              <div className="grid g-2">
                <div className="info">
                  <div>Nom complet</div><div>{f.prenom} {f.nom}</div>
                  <div>Naissance</div><div>{dateShort(f.dateNaissance)} à {f.lieuNaissance}</div>
                  <div>Classe</div><div>{classe?.nom}</div>
                  <div>Type</div><div>{f.typeInscription}</div>
                  <div>Régime</div><div>{f.regime}</div>
                  <div>Responsable principal</div><div>{fullName(f[f.principal])} · {f[f.principal].telephone}</div>
                  <div>Documents</div><div>{DOCS.filter((d) => f.docs[d.type]).length} / {DOCS.length} remis</div>
                </div>
                {!existing && classe && (
                  <div className="card card-pad" style={{ background: 'var(--bg)', boxShadow: 'none' }}>
                    <b style={{ color: 'var(--ink)' }}>Frais de l’année {year?.libelle}</b>
                    <div className="info mt-8">
                      <div>Frais d’inscription</div><div>{money(classe.fraisInscription)}</div>
                      <div>Scolarité annuelle</div><div>{money(classe.fraisScolarite * (f.boursier ? 1 - f.tauxBourse / 100 : 1))}{f.boursier && <span className="tiny muted"> (bourse {f.tauxBourse}%)</span>}</div>
                      <div>Versements</div><div>3 × {money((classe.fraisScolarite * (f.boursier ? 1 - f.tauxBourse / 100 : 1)) / 3)}</div>
                    </div>
                    <label className="check mt-12"><input type="checkbox" checked={f.payerInscription} onChange={(e) => set('payerInscription', e.target.checked)} />Encaisser les frais d’inscription maintenant</label>
                    {f.payerInscription && (
                      <div className="form-grid mt-12">
                        <Field label="Mode"><select className="select" value={f.modePaiement} onChange={(e) => set('modePaiement', e.target.value as PaymentMode)}>{['Espèces', 'MonCash', 'NatCash', 'Virement', 'Chèque'].map((m) => <option key={m}>{m}</option>)}</select></Field>
                        <Field label="Montant"><input type="number" className="input" value={f.montantPaye || frais} onChange={(e) => set('montantPaye', Number(e.target.value))} /></Field>
                        {f.modePaiement !== 'Espèces' && <Field label="N° de transaction" className="span-2"><input className="input" value={f.refPaiement} onChange={(e) => set('refPaiement', e.target.value)} /></Field>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="sticky-foot">
            <button className="btn btn-lg" onClick={() => (step > 0 && !(desktop && step < 5) ? setStep(desktop ? 0 : step - 1) : nav(-1))}>{step > 0 && !(desktop && step < 5) ? 'Précédent' : 'Annuler'}</button>
            <span className="grow" />
            {step === 5 || existing ? (
              <>
                {!existing && <button className="btn btn-lg only-desktop" onClick={() => save(true)}>Enregistrer en attente</button>}
                <button className="btn btn-primary btn-lg" onClick={() => save(false)}>{existing ? 'Enregistrer' : 'Valider l’inscription'}<Check /></button>
              </>
            ) : <button className="btn btn-primary btn-lg" onClick={goNext}>Suivant<ArrowRight /></button>}
          </div>
        </div>

        <div className="stack only-desktop">
          <div className="card card-pad">
            <div className="section-title"><span className="ic" style={{ borderRadius: '50%' }}><PlusIcon /></span><h3>Photo de l’élève</h3></div>
            <PhotoBox photo={f.photo} onChange={(p) => set('photo', p)} />
          </div>
          <div className="card card-pad">
            <div className="section-title"><span className="ic"><User /></span><h3>Aperçu des informations</h3></div>
            <div className="info">
              <div>Nom complet</div><div>{f.prenom || f.nom ? `${f.nom} ${f.prenom}` : '-'}</div>
              <div>Date de naissance</div><div>{f.dateNaissance ? f.dateNaissance.split('-').reverse().join('/') : '-'}</div>
              <div>Sexe</div><div>{f.sexe === 'F' ? 'Féminin' : 'Masculin'}</div>
              <div>Classe</div><div>{classe?.nom ?? '-'}</div>
              <div>Statut</div><div><Badge tone="green">{existing ? existing.statut : 'Nouveau'}</Badge></div>
              <div>Année scolaire</div><div>{year?.libelle}</div>
            </div>
          </div>
          <div className="card card-pad" style={{ background: 'var(--primary-50)', border: 0 }}>
            <div className="section-title"><span className="ic" style={{ background: '#fff' }}><FileText /></span><h3>Liste des documents à fournir</h3></div>
            <div className="stack" style={{ gap: 8 }}>
              {DOCS.map((d) => <div key={d.type} className="row small">{f.docs[d.type] ? <CheckCircle2 size={18} color="var(--green)" /> : <Circle size={18} color="var(--faint)" />}{d.type} ({d.req ? 'obligatoire' : 'optionnel'})</div>)}
            </div>
          </div>
          <div className="card card-pad" style={{ background: 'var(--primary-50)', border: 0 }}>
            <div className="row" style={{ alignItems: 'flex-start' }}><Info color="#fff" fill="var(--primary)" size={26} /><div><b style={{ color: 'var(--ink)' }}>Après l’inscription</b><p className="small muted mt-8">Un compte parent pourra être créé pour permettre le suivi en ligne de l’élève.</p></div></div>
          </div>
        </div>
      </div>
    </>
  );
}

function Section({ n, icon, title, sub, children, refEl }: { n: number; icon: ReactNode; title: string; sub: string; children: ReactNode; refEl: (el: HTMLDivElement | null) => void }) {
  return (
    <div className="card card-pad" ref={refEl} style={{ scrollMarginTop: 80 }}>
      <div className="section-title"><span className="ic">{icon}</span><div><h3>{n}. {title}</h3><p>{sub}</p></div></div>
      {children}
    </div>
  );
}
function GRow({ label, children }: { label: string; children: ReactNode }) {
  return <label className="row" style={{ gap: 0, border: '1px solid var(--line)', borderRadius: 9, overflow: 'hidden' }}><span className="small" style={{ width: 120, padding: '0 10px', color: 'var(--text)', flex: 'none' }}>{label}</span><span className="grow" style={{ borderLeft: '1px solid var(--line)' }}>{children}</span></label>;
}
function PhotoBox({ photo, onChange }: { photo: string; onChange: (p: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="upload mt-12" onClick={() => input.current?.click()}>
      {photo ? <img src={photo} alt="" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 12 }} /> : <span className="tint-blue" style={{ width: 48, height: 48, borderRadius: 12, display: 'grid', placeItems: 'center' }}><ImagePlus /></span>}
      <b>{photo ? 'Changer la photo' : 'Cliquez pour ajouter une photo'}</b>
      <span className="tiny">Format : JPG, PNG (Max 2 Mo) — ou prenez une photo avec le téléphone</span>
      <input ref={input} type="file" accept="image/*" capture="user" hidden onChange={async (e) => { const file = e.target.files?.[0]; if (file) onChange(await readFileAsDataURL(file, 480)); }} />
    </div>
  );
}

function Success({ student, onNew }: { student: Student; onNew: () => void }) {
  const nav = useNavigate();
  const classe = useDoc('classes', student.classeId);
  return (
    <div style={{ maxWidth: 520, margin: '40px auto' }} className="card card-pad center">
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--green)', display: 'grid', placeItems: 'center', margin: '0 auto' }}><Check color="#fff" size={40} strokeWidth={3} /></div>
      <h2 className="mt-16">Inscription enregistrée !</h2>
      <p className="muted mt-8">{fullName(student)} est inscrit{student.sexe === 'F' ? 'e' : ''} en {classe?.nom}.<br />Matricule : <b style={{ color: 'var(--ink)' }}>{student.matricule}</b>{student.documents.some((d) => !d.fourni) && <><br /><Badge tone="orange">{student.documents.filter((d) => !d.fourni).length} document(s) à fournir</Badge></>}</p>
      <div className="row mt-16" style={{ justifyContent: 'center' }}><Avatar src={student.photo} name={fullName(student)} size={64} /></div>
      <div className="stack mt-24" style={{ gap: 10 }}>
        <button className="btn btn-primary btn-lg" onClick={() => nav(`/eleves/${student.id}`)}>Voir la fiche de l’élève</button>
        <div className="grid g-2" style={{ gap: 10 }}>
          <button className="btn" onClick={() => printDocument(<EnrollmentSheet student={student} />, 'A4 portrait', `Inscription ${fullName(student)}`)}><Printer />Fiche d’inscription</button>
          <button className="btn" onClick={() => nav(`/documents/badges?type=eleve&eleve=${student.id}`)}><IdCard />Badge</button>
        </div>
        <button className="btn btn-soft" onClick={onNew}>Nouvelle inscription</button>
      </div>
    </div>
  );
}

