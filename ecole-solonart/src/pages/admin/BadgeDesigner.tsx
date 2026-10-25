// Personnaliser un badge : on part d'un modèle, on change couleurs, photo, champs et textes, avec l'aperçu en direct.
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { db } from '../../data/store';
import type { BadgeModel, School } from '../../data/types';
import { Field, Modal, toast } from '../../components/ui';
import { Scaled } from '../../components/Scaled';
import { BADGE_FIELDS, BADGE_TEMPLATES, IdCard, IdCardLandscape, modelToTpl, type BadgeKind, type BadgePerson, type BadgeTpl, type PhotoShape } from '../../docs/Badges';
import { audit } from '../../lib/session';

const MM = 3.7795;
const BASE_NAME = (k: string) => BADGE_TEMPLATES.find((t) => t.key === k)?.nom;
/** Couleurs prêtes à l'emploi : principale, étiquette, texte de l'étiquette. */
const PALETTES: [string, string, string, string][] = [
  ['Bleu', '#1d4fa8', '#1d4fa8', '#ffffff'],
  ['Marine & or', '#0d2a63', '#f2c94c', '#0d2a63'],
  ['Vert', '#2e8b4f', '#2e8b4f', '#ffffff'],
  ['Rouge', '#c62f3e', '#c62f3e', '#ffffff'],
  ['Bleu & rouge', '#00209f', '#d21034', '#ffffff'],
  ['Violet', '#5b2a86', '#e75a9b', '#ffffff'],
  ['Orange', '#e07800', '#f08c00', '#ffffff'],
  ['Turquoise', '#0f9e8f', '#11a596', '#ffffff'],
  ['Gris', '#3b4658', '#3b4658', '#ffffff'],
  ['Bordeaux', '#8f2a35', '#9b2c38', '#ffffff'],
];

export function BadgeDesigner({ from, kind, sample, school, year, landscape, onClose, onSaved }: {
  from: BadgeTpl; kind: BadgeKind; sample?: BadgePerson; school: School; year: string; landscape: boolean;
  onClose: () => void; onSaved: (key: string) => void;
}) {
  const editing = from.custom ? school.badgeModeles?.find((m) => m.key === from.key) : undefined;
  const fields = kind === 'eleve' ? BADGE_FIELDS.eleve : BADGE_FIELDS.staff;
  const [m, setM] = useState<BadgeModel>(editing ?? {
    key: `perso-${Date.now().toString(36)}`, nom: `${from.nom} (perso)`, base: from.key, kinds: [kind],
    accent: from.accent, pill: from.pill, pillText: from.pillText, ink: from.ink, photo: from.photo,
    champs: from.champs, footBar: from.footBar?.replace(/"/g, ''), words: from.words,
  });
  const set = <K extends keyof BadgeModel>(k: K, v: BadgeModel[K]) => setM({ ...m, [k]: v });
  const tpl = modelToTpl(m);
  const champs = m.champs ?? fields.map(([k]) => k).filter((k) => kind === 'eleve' || k !== 'naissance');
  const toggle = (k: string) => set('champs', champs.includes(k) ? champs.filter((x) => x !== k) : [...champs, k]);
  const save = () => {
    if (!m.nom.trim()) return toast('Donnez un nom au modèle', true);
    const list = (school.badgeModeles ?? []).filter((x) => x.key !== m.key);
    db.patch('school', 'main', { badgeModeles: [...list, { ...m, nom: m.nom.trim(), champs }] });
    audit(editing ? 'Modèle de badge modifié' : 'Modèle de badge créé', m.nom.trim(), { domaine: 'autre' });
    toast('Modèle enregistré');
    onSaved(m.key);
  };
  const remove = () => {
    if (!window.confirm(`Supprimer le modèle « ${m.nom} » ?`)) return;
    db.patch('school', 'main', { badgeModeles: (school.badgeModeles ?? []).filter((x) => x.key !== m.key) });
    toast('Modèle supprimé');
    onSaved('');
  };
  const size = landscape ? { w: 86 * MM, h: 54 * MM } : { w: 63 * MM, h: 86 * MM };
  const Front = landscape ? IdCardLandscape : IdCard;
  return (
    <Modal open size="xl" onClose={onClose} title={editing ? 'Modifier le modèle' : 'Personnaliser le badge'}
      footer={<>{editing && <button className="btn btn-danger" style={{ marginRight: 'auto' }} onClick={remove}><Trash2 />Supprimer</button>}<button className="btn" onClick={onClose}>Annuler</button><button className="btn btn-primary" onClick={save}>Enregistrer le modèle</button></>}>
      <div className="designer">
        <div className="designer-preview">
          {tpl && sample && <div style={{ width: '100%', maxWidth: landscape ? 340 : 250, margin: '0 auto' }}><Scaled width={size.w} height={size.h} max={2}><Front p={sample} tpl={tpl} school={school} year={year} /></Scaled></div>}
          <p className="tiny muted center mt-8">Aperçu en direct · {landscape ? '86 × 54 mm' : '63 × 86 mm'}</p>
        </div>
        <div className="stack" style={{ gap: 14 }}>
          <Field label="Nom du modèle"><input className="input" value={m.nom} onChange={(e) => set('nom', e.target.value)} /></Field>
          <div>
            <div className="small muted mb-8">Couleurs toutes prêtes</div>
            <div className="row wrap" style={{ gap: 6 }}>{PALETTES.map(([n, a, p, t]) => (
              <button key={n} type="button" className={`chip ${m.accent === a && m.pill === p ? 'active' : ''}`} onClick={() => setM({ ...m, accent: a, pill: p, pillText: t })}><i style={{ background: a }} /><i style={{ background: p }} />{n}</button>
            ))}</div>
          </div>
          <div className="grid g-3" style={{ gap: 10 }}>
            <Field label="Principale"><input type="color" className="input color-input" value={m.accent} onChange={(e) => set('accent', e.target.value)} /></Field>
            <Field label="Étiquette"><input type="color" className="input color-input" value={m.pill} onChange={(e) => set('pill', e.target.value)} /></Field>
            <Field label="Texte étiquette"><input type="color" className="input color-input" value={m.pillText ?? '#ffffff'} onChange={(e) => set('pillText', e.target.value)} /></Field>
          </div>
          <Field label="Photo">
            <div className="seg">{([['carre', 'Carrée'], ['arrondi', 'Arrondie'], ['rond', 'Ronde']] as [PhotoShape, string][]).map(([k, l]) => (
              <button key={k} type="button" className={(m.photo ?? 'arrondi') === k ? 'active' : ''} onClick={() => set('photo', k)}>{l}</button>
            ))}</div>
          </Field>
          <div>
            <div className="small muted mb-8">Informations affichées {landscape && <span className="tiny">(4 au plus en paysage)</span>}</div>
            <div className="row wrap" style={{ gap: '6px 14px' }}>{fields.map(([k, l]) => (
              <label key={k} className="check small"><input type="checkbox" checked={champs.includes(k)} onChange={() => toggle(k)} />{l}</label>
            ))}</div>
          </div>
          <Field label="Texte en bas du badge" opt><input className="input" value={m.footBar ?? ''} onChange={(e) => set('footBar', e.target.value)} placeholder="Ex. CARTE D’IDENTITÉ SCOLAIRE" /></Field>
          {from.footer === 'qr-words' && kind !== 'eleve' && <Field label="Mots à côté du QR" opt><input className="input" value={(m.words ?? []).join(', ')} onChange={(e) => set('words', e.target.value.split(',').map((w) => w.trim()).filter(Boolean).slice(0, 3))} placeholder="Ex. Savoir, Partager, Bâtir" /></Field>}
          <p className="tiny muted">La structure (place de la photo, du logo, du QR) vient du modèle « {BASE_NAME(m.base) ?? from.nom} ». Le modèle enregistré est gardé pour l’école et réutilisable à chaque impression.</p>
        </div>
      </div>
    </Modal>
  );
}
