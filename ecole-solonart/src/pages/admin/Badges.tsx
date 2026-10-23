import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Printer, CheckSquare, Square, RectangleVertical, RectangleHorizontal, Users2 } from 'lucide-react';
import { useCollection, useDoc } from '../../data/store';
import type { Staff, Student } from '../../data/types';
import { PageHead, Tabs, Avatar, SearchInput, toast, Modal } from '../../components/ui';
import { Scaled } from '../../components/Scaled';
import { BADGE_TEMPLATES, IdCard, IdCardBack, IdCardLandscape, IdCardBackLandscape, type BadgeKind, type BadgePerson } from '../../docs/Badges';
import { fullName, norm, dateShort } from '../../lib/format';
import { printDocument } from '../../lib/print';
import { audit } from '../../lib/session';

const MM = 3.7795; // px par mm
const CARD = { w: 63 * MM, h: 86 * MM };
const CARD_L = { w: 86 * MM, h: 54 * MM };

export function staffKind(s: Staff): BadgeKind {
  return s.type === 'Professeur' ? 'professeur' : s.type === 'Direction' ? 'direction' : 'personnel';
}
export function staffToBadge(s: Staff): BadgePerson {
  const kind = staffKind(s);
  const role = kind === 'professeur' ? (s.sexe === 'F' ? 'Professeure' : 'Professeur') : s.poste === 'Secrétaire' || s.poste === 'Comptable' ? 'Personnel administratif' : s.poste.replace(' (Préfet de discipline)', '');
  const sub = kind === 'professeur' ? s.specialite : s.poste === 'Secrétaire' || s.poste === 'Comptable' ? s.poste : undefined;
  return { id: s.id, kind, nom: s.nom, prenom: s.prenom, role, sub, matricule: s.matricule, telephone: s.telephone, email: s.email, adresse: s.adresse.replace(', Haïti', ', Haïti'), dateNaissance: s.dateNaissance ? dateShort(s.dateNaissance) : undefined, diplome: s.diplome, photo: s.photo, sexe: s.sexe };
}
export function studentToBadge(s: Student, classe?: string, parentTel?: string): BadgePerson {
  return { id: s.id, kind: 'eleve', nom: s.nom, prenom: s.prenom, role: 'Élève', sub: classe, matricule: s.matricule, dateNaissance: dateShort(s.dateNaissance), photo: s.photo, classe, parentTel, groupeSanguin: s.medical.groupeSanguin, sexe: s.sexe };
}

export default function Badges() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const school = useDoc('school', 'main')!;
  const year = useDoc('years', school.anneeCourante)?.libelle ?? '';
  const staff = useCollection('staff').filter((s) => s.statut === 'Actif');
  const students = useCollection('students').filter((s) => s.statut === 'Actif');
  const classes = useCollection('classes').slice().sort((a, b) => a.code.localeCompare(b.code, 'fr', { numeric: true }));
  const guardians = useCollection('guardians');
  const initialKind = (params.get('type') as BadgeKind) ?? (params.get('staff') ? staffKind(staff.find((s) => s.id === params.get('staff'))!) : 'professeur');
  const [kind, setKind] = useState<BadgeKind>(initialKind);
  const templates = BADGE_TEMPLATES.filter((t) => t.kinds.includes(kind));
  const [tplKey, setTplKey] = useState<Record<BadgeKind, string>>({ professeur: 'classique', direction: 'bordeaux', personnel: 'ciel', eleve: 'eleve-bleu' });
  const tpl = templates.find((t) => t.key === tplKey[kind]) ?? templates[0];
  const [classe, setClasse] = useState(params.get('classe') ?? students.find((s) => s.id === params.get('eleve'))?.classeId ?? 'c-s4-a');
  const preset = params.get('eleve') ?? params.get('staff');
  const [selected, setSelected] = useState<Record<string, boolean>>(preset ? { [preset]: true } : {});
  const [mode, setMode] = useState<'tous' | 'selection'>(preset ? 'selection' : 'tous');
  const [verso, setVerso] = useState(false);
  const [landscape, setLandscape] = useState(false);
  const [picker, setPicker] = useState(false);
  const [q, setQ] = useState('');

  const people: BadgePerson[] = useMemo(() => {
    if (kind === 'eleve') {
      const code = classes.find((c) => c.id === classe)?.code;
      return students.filter((s) => s.classeId === classe).sort((a, b) => a.nom.localeCompare(b.nom)).map((s) => studentToBadge(s, code, guardians.find((g) => g.id === s.tuteurIds[0])?.telephone));
    }
    return staff.filter((s) => staffKind(s) === kind).map(staffToBadge);
  }, [kind, classe, staff, students, classes, guardians]);
  const targets = mode === 'tous' ? people : people.filter((p) => selected[p.id]);

  const perSheet = landscape ? 10 : 9;
  const Front = landscape ? IdCardLandscape : IdCard;
  const Back = landscape ? IdCardBackLandscape : IdCardBack;
  const size = landscape ? CARD_L : CARD;

  const print = () => {
    if (!targets.length) return toast('Aucune personne sélectionnée', true);
    const sheets: BadgePerson[][] = [];
    for (let i = 0; i < targets.length; i += perSheet) sheets.push(targets.slice(i, i + perSheet));
    audit('Génération badges', `${targets.length} × ${tpl.nom} (${landscape ? 'paysage' : 'portrait'})`);
    const cls = `badge-sheet${landscape ? ' landscape' : ''}`;
    printDocument(
      <>{sheets.map((sh, i) => (
        <div key={i}>
          <div className="print-page"><div className={cls}>{sh.map((p) => <Front key={p.id} p={p} tpl={tpl} school={school} year={year} />)}</div></div>
          {verso && <div className="print-page"><div className={cls} style={{ direction: 'rtl' }}>{sh.map((p) => <div key={p.id} style={{ direction: 'ltr' }}><Back school={school} tpl={tpl} kind={kind} /></div>)}</div></div>}
        </div>
      ))}</>,
      'A4 portrait', `Badges ${kind}`,
    );
  };

  return (
    <>
      <PageHead
        back={<button className="back-link" style={{ border: 0, background: 'none', padding: 0 }} onClick={() => nav('/documents')}><ArrowLeft size={16} />Documents</button>}
        title="Badges"
        sub="Choisissez la catégorie, le format et le modèle, puis imprimez."
      />
      <Tabs tabs={[['professeur', 'Professeurs'], ['direction', 'Direction'], ['personnel', 'Personnel'], ['eleve', 'Élèves']]} value={kind} onChange={(k) => { setKind(k); setSelected({}); setMode('tous'); }} />
      <div className="card card-pad mb-16 stack" style={{ gap: 14 }}>
        <div className="row wrap" style={{ gap: 12 }}>
          <div className="seg" style={{ minWidth: 230 }}>
            <button className={!landscape ? 'active' : ''} onClick={() => setLandscape(false)}><RectangleVertical size={15} style={{ verticalAlign: -3, marginRight: 6 }} />Portrait</button>
            <button className={landscape ? 'active' : ''} onClick={() => setLandscape(true)}><RectangleHorizontal size={15} style={{ verticalAlign: -3, marginRight: 6 }} />Paysage</button>
          </div>
          {kind === 'eleve' && <select className="select" style={{ width: 'auto', minWidth: 200 }} value={classe} onChange={(e) => { setClasse(e.target.value); setSelected({}); }}>{classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}</select>}
          <button className="btn" onClick={() => setPicker(true)}><Users2 />{mode === 'tous' ? `Tous (${people.length})` : `${targets.length} sélectionné(s)`}</button>
          <label className="check small"><input type="checkbox" checked={verso} onChange={(e) => setVerso(e.target.checked)} />Avec verso</label>
          <span className="grow" />
          <button className="btn btn-primary btn-lg" onClick={print}><Printer />Imprimer {targets.length} badge{targets.length > 1 ? 's' : ''}</button>
        </div>
        <div className="row wrap" style={{ gap: 8 }}>
          <span className="small muted">Modèle :</span>
          {templates.map((t) => (
            <button key={t.key} className={`chip ${tpl.key === t.key ? 'active' : ''}`} onClick={() => setTplKey({ ...tplKey, [kind]: t.key })}>
              <i style={{ background: t.accent }} /><i style={{ background: t.pill }} />{t.nom}
            </button>
          ))}
        </div>
      </div>
      <div className="preview-stage" style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${landscape ? 300 : 220}px, 1fr))`, gap: 18, alignItems: 'start', justifyItems: 'center' }}>
        {targets.slice(0, 12).map((p) => (
          <div key={p.id} style={{ width: '100%', maxWidth: landscape ? 340 : 250 }}><Scaled width={size.w} height={size.h} max={2}><Front p={p} tpl={tpl} school={school} year={year} /></Scaled></div>
        ))}
        {verso && targets[0] && <div style={{ width: '100%', maxWidth: landscape ? 340 : 250 }}><Scaled width={size.w} height={size.h} max={2}><Back school={school} tpl={tpl} kind={kind} /></Scaled><div className="tiny muted center mt-8">Verso</div></div>}
        {targets.length > 12 && <div className="muted small" style={{ alignSelf: 'center' }}>+ {targets.length - 12} autres à l’impression</div>}
        {targets.length === 0 && <div className="muted">Sélectionnez au moins une personne.</div>}
      </div>
      <p className="tiny muted mt-12">{landscape ? '86 × 54 mm (format carte), 10 par feuille A4.' : '63 × 86 mm, 9 par feuille A4.'} Imprimez à l’échelle 100 %, sans marges, sur papier cartonné ou PVC. Le QR code permet de vérifier l’identité.</p>

      <Modal open={picker} onClose={() => setPicker(false)} title="Qui imprimer ?" footer={<button className="btn btn-primary" onClick={() => setPicker(false)}>Terminé</button>}>
        <div className="seg mb-12"><button className={mode === 'tous' ? 'active' : ''} onClick={() => setMode('tous')}>Tous ({people.length})</button><button className={mode === 'selection' ? 'active' : ''} onClick={() => setMode('selection')}>Choisir</button></div>
        {mode === 'selection' && (
          <>
            <SearchInput value={q} onChange={setQ} placeholder="Rechercher..." />
            <div className="list mt-8" style={{ maxHeight: 360, overflow: 'auto', border: '1px solid var(--line)', borderRadius: 10 }}>
              {people.filter((p) => !q || norm(`${p.prenom} ${p.nom}`).includes(norm(q))).map((p) => (
                <button key={p.id} className="list-item" style={{ border: 0, width: '100%', textAlign: 'left', padding: '8px 10px' }} onClick={() => setSelected({ ...selected, [p.id]: !selected[p.id] })}>
                  {selected[p.id] ? <CheckSquare size={18} color="var(--primary)" /> : <Square size={18} color="var(--faint)" />}
                  <Avatar src={p.photo} name={fullName(p)} size={28} /><span className="grow small">{fullName(p)}<br /><span className="tiny muted">{p.sub ?? p.role}</span></span>
                </button>
              ))}
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
