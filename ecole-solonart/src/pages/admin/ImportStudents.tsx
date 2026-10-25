import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileSpreadsheet, Upload, Download, Check, AlertTriangle, Camera, X } from 'lucide-react';
import { db, useCollection, uid } from '../../data/store';
import type { Guardian, Student } from '../../data/types';
import { Field, PageHead, Badge, toast } from '../../components/ui';
import { downloadCSV, norm, todayISO } from '../../lib/format';
import { audit } from '../../lib/session';

type Key = 'nom' | 'prenom' | 'complet' | 'sexe' | 'naissance' | 'lieu' | 'classe' | 'parent' | 'telephone' | 'matricule' | 'adresse';
const SYNONYMS: Record<Key, string[]> = {
  nom: ['nom', 'nom de famille', 'last name', 'surname', 'nom eleve', 'nom de l eleve', 'non'],
  prenom: ['prenom', 'prenoms', 'first name', 'prenom eleve', 'siyati'],
  complet: ['nom et prenom', 'nom complet', 'nom prenom', 'eleve', 'nom et prenoms', 'full name'],
  sexe: ['sexe', 'genre', 'sex', 'gender', 's'],
  naissance: ['date de naissance', 'naissance', 'date naissance', 'ne le', 'nee le', 'ne e le', 'dob', 'date'],
  lieu: ['lieu de naissance', 'lieu', 'ne a'],
  classe: ['classe', 'class', 'niveau'],
  parent: ['parent', 'nom du parent', 'responsable', 'pere', 'mere', 'tuteur', 'nom parent'],
  telephone: ['telephone', 'tel', 'telephone parent', 'phone', 'contact', 'tel parent', 'cellulaire', 'whatsapp'],
  matricule: ['matricule', 'code', 'id', 'numero'],
  adresse: ['adresse', 'address', 'domicile'],
};
const LABEL: Record<Key, string> = { nom: 'Nom', prenom: 'Prénom', complet: 'Nom et prénom', sexe: 'Sexe', naissance: 'Date de naissance', lieu: 'Lieu de naissance', classe: 'Classe', parent: 'Parent', telephone: 'Téléphone', matricule: 'Matricule', adresse: 'Adresse' };
const clean = (s: string) => norm(s).replace(/[^a-z0-9]+/g, ' ').trim();

type Cell = string | number | boolean | Date | null;
interface Row { nom: string; prenom: string; sexe: 'M' | 'F'; naissance: string; lieu: string; classeId: string; parent: string; telephone: string; matricule: string; adresse: string; errors: string[]; duplicate: boolean; keep: boolean }

function parseCSV(text: string): string[][] {
  const sep = (text.split('\n')[0].match(/;/g)?.length ?? 0) >= (text.split('\n')[0].match(/,/g)?.length ?? 0) ? ';' : ',';
  const rows: string[][] = [];
  let row: string[] = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else if (c === '"') q = true;
    else if (c === sep) { row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; }
    else cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim()));
}

function toISODate(v: Cell): string {
  if (v instanceof Date && !isNaN(v.getTime())) return v.toISOString().slice(0, 10);
  if (typeof v === 'number' && v > 20000 && v < 60000) return new Date(Math.round((v - 25569) * 86400000)).toISOString().slice(0, 10); // date Excel
  const s = String(v ?? '').trim();
  let m = s.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})$/);
  if (m) { const y = m[3].length === 2 ? 2000 + Number(m[3]) - (Number(m[3]) > 30 ? 100 : 0) : Number(m[3]); return `${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`; }
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : '';
}
const sexOf = (v: Cell): 'M' | 'F' | '' => { const s = clean(String(v ?? '')); if (!s) return ''; if (['f', 'fille', 'feminin', 'femme', 'female'].includes(s)) return 'F'; if (['m', 'g', 'garcon', 'masculin', 'homme', 'male'].includes(s)) return 'M'; return ''; };
const cap = (s: string) => s.trim().toLowerCase().replace(/(^|[\s\-'])(\p{L})/gu, (_, a, b) => a + b.toUpperCase());

export default function ImportStudents() {
  const nav = useNavigate();
  const classes = useCollection('classes').slice().sort((a, b) => a.code.localeCompare(b.code, 'fr', { numeric: true }));
  const students = useCollection('students');
  const guardians = useCollection('guardians');
  const school = db.get('school', 'main')!;
  const [classeId, setClasseId] = useState(classes.find((c) => c.code === 'S1-B')?.id ?? classes[0]?.id ?? '');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [mapping, setMapping] = useState<Partial<Record<Key, number>>>({});
  const [fileName, setFileName] = useState('');
  const [firstNameFirst, setFirstNameFirst] = useState(false);
  const [raw, setRaw] = useState<{ head: string[]; body: Cell[][] } | null>(null);
  const [done, setDone] = useState<{ n: number; classeId: string } | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const build = (_head: string[], body: Cell[][], map: Partial<Record<Key, number>>, defClasse: string, fnFirst: boolean): Row[] => {
    const get = (r: Cell[], k: Key) => (map[k] !== undefined ? r[map[k]!] : null);
    const existing = new Set(students.map((s) => clean(`${s.nom} ${s.prenom} ${s.classeId}`)));
    return body.map((r) => {
      let nom = String(get(r, 'nom') ?? '').trim();
      let prenom = String(get(r, 'prenom') ?? '').trim();
      if ((!nom || !prenom) && map.complet !== undefined) {
        const parts = String(get(r, 'complet') ?? '').trim().split(/\s+/);
        if (fnFirst) { nom = parts.pop() ?? ''; prenom = parts.join(' '); } else { nom = parts.shift() ?? ''; prenom = parts.join(' '); }
      }
      const clsCell = clean(String(get(r, 'classe') ?? ''));
      const cls = clsCell ? classes.find((c) => clean(c.code) === clsCell || clean(c.nom) === clsCell || clean(c.annee) === clsCell) : undefined;
      const sexe = sexOf(get(r, 'sexe'));
      const naissance = toISODate(get(r, 'naissance'));
      const errors: string[] = [];
      if (!nom) errors.push('Nom manquant');
      if (!prenom) errors.push('Prénom manquant');
      if (clsCell && !cls) errors.push(`Classe « ${get(r, 'classe')} » inconnue → classe choisie`);
      const classe = cls?.id ?? defClasse;
      const duplicate = existing.has(clean(`${cap(nom)} ${cap(prenom)} ${classe}`));
      return {
        nom: cap(nom), prenom: cap(prenom), sexe: sexe || 'M', naissance, lieu: cap(String(get(r, 'lieu') ?? '')),
        classeId: classe, parent: cap(String(get(r, 'parent') ?? '')), telephone: String(get(r, 'telephone') ?? '').trim(),
        matricule: String(get(r, 'matricule') ?? '').trim(), adresse: String(get(r, 'adresse') ?? '').trim(),
        errors: sexe ? errors : [...errors.filter(Boolean), ...(get(r, 'sexe') ? ['Sexe non reconnu (M par défaut)'] : [])],
        duplicate, keep: !!nom && !!prenom && !duplicate,
      };
    }).filter((r) => r.nom || r.prenom);
  };

  const load = async (file?: File) => {
    if (!file) return;
    setFileName(file.name);
    try {
      let data: Cell[][];
      if (/\.(csv|txt)$/i.test(file.name)) data = parseCSV(await file.text());
      else {
        const { readSheet } = await import('read-excel-file/browser');
        data = (await readSheet(file)) as unknown as Cell[][];
      }
      // La ligne d'en-tête est la première ligne contenant au moins un titre connu
      const known = Object.values(SYNONYMS).flat();
      const hi = Math.max(0, data.findIndex((r) => r.some((c) => known.includes(clean(String(c ?? ''))))));
      const head = (data[hi] ?? []).map((c) => String(c ?? ''));
      const body = data.slice(hi + 1);
      const map: Partial<Record<Key, number>> = {};
      head.forEach((h, i) => {
        const c = clean(h);
        (Object.keys(SYNONYMS) as Key[]).forEach((k) => { if (map[k] === undefined && SYNONYMS[k].includes(c)) map[k] = i; });
      });
      if (map.nom === undefined && map.prenom === undefined && map.complet === undefined) map.complet = 0;
      setMapping(map);
      setRaw({ head, body });
      setRows(build(head, body, map, classeId, firstNameFirst));
    } catch (e) {
      toast(`Fichier illisible : ${(e as Error).message}. Utilisez un fichier .xlsx ou .csv.`, true);
    }
  };
  const remap = (map: Partial<Record<Key, number>>, cls = classeId, fn = firstNameFirst) => { setMapping(map); if (raw) setRows(build(raw.head, raw.body, map, cls, fn)); };

  const doImport = () => {
    if (!rows) return;
    const keep = rows.filter((r) => r.keep);
    const byPhone = new Map(guardians.map((g) => [g.telephone.replace(/\D/g, '').slice(-8), g]));
    let seq = students.length;
    const newGuardians: Guardian[] = [];
    const newStudents: Student[] = keep.map((r) => {
      const tuteurIds: string[] = [];
      const tel = r.telephone.replace(/\D/g, '');
      if (tel.length >= 8) {
        let g = byPhone.get(tel.slice(-8));
        if (!g) {
          const [gp, ...gn] = (r.parent || `Parent ${r.nom}`).split(' ');
          g = { id: uid('g'), updatedAt: 0, nom: gn.join(' ') || r.nom, prenom: gp, sexe: 'M', lien: 'Tuteur', telephone: r.telephone.startsWith('+') ? r.telephone : `+509 ${tel.slice(-8).replace(/(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4')}`, principal: true, statut: 'Actif', nationalite: 'Haïtienne' };
          newGuardians.push(g);
          byPhone.set(tel.slice(-8), g);
        }
        tuteurIds.push(g.id);
      }
      const cls = classes.find((c) => c.id === r.classeId);
      seq++;
      return {
        id: uid('e'), updatedAt: 0, matricule: r.matricule || `${(cls?.code ?? 'E').replace(/[^A-Z0-9]/gi, '')}${(db.get('years', school.anneeCourante)?.debut ?? todayISO()).slice(0, 4)}${String(seq).padStart(4, '0')}`,
        nom: r.nom, prenom: r.prenom, sexe: r.sexe, dateNaissance: r.naissance, lieuNaissance: r.lieu || school.commune, nationalite: 'Haïtienne',
        adresse: r.adresse, commune: school.commune, classeId: r.classeId, anneeId: school.anneeCourante, regime: 'Externe', typeInscription: 'Réinscription',
        redoublant: false, boursier: false, dateInscription: todayISO(), dateEntree: todayISO(), statut: 'Actif', tuteurIds, medical: {},
        documents: [{ type: 'Acte de naissance', nom: '', fourni: false }, { type: 'Dernier bulletin', nom: '', fourni: false }, { type: "Photo d'identité", nom: '', fourni: false }],
        langue: 'Français',
      };
    });
    if (newGuardians.length) db.bulkPut('guardians', newGuardians);
    db.bulkPut('students', newStudents);
    audit('Import Excel', `${newStudents.length} élèves (${fileName})`);
    toast(`${newStudents.length} élèves importés`);
    setDone({ n: newStudents.length, classeId: newStudents[0]?.classeId ?? classeId });
  };

  const template = () => downloadCSV('modele-import-eleves.csv', [
    ['Nom', 'Prénom', 'Sexe', 'Date de naissance', 'Lieu de naissance', 'Classe', 'Parent', 'Téléphone', 'Adresse'],
    ['Dorval', 'Jean Philippe', 'M', '12/03/2008', 'Léogâne', 'S4-A', 'Jean Dorval', '+509 36 98 76 54', 'Rue Principale'],
    ['Pierre', 'Naomi', 'F', '05/07/2009', 'Léogâne', 'S4-A', 'Sophie Pierre', '+509 38 77 88 99', 'Darbonne'],
  ]);

  if (done) return (
    <div style={{ maxWidth: 520, margin: '40px auto' }} className="card card-pad center">
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--green)', display: 'grid', placeItems: 'center', margin: '0 auto' }}><Check color="#fff" size={40} strokeWidth={3} /></div>
      <h2 className="mt-16">{done.n} élèves importés</h2>
      <p className="muted mt-8">Il reste à ajouter leurs photos. Vous pouvez le faire maintenant avec l’appareil photo du téléphone.</p>
      <div className="stack mt-24" style={{ gap: 10 }}>
        <button className="btn btn-primary btn-lg" onClick={() => nav(`/eleves/photos?classe=${done.classeId}`)}><Camera />Ajouter les photos</button>
        <button className="btn" onClick={() => nav(`/eleves?classe=${done.classeId}`)}>Voir les élèves</button>
        <button className="btn btn-soft" onClick={() => { setDone(null); setRows(null); setRaw(null); }}>Importer un autre fichier</button>
      </div>
    </div>
  );

  const ok = rows?.filter((r) => r.keep).length ?? 0;
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <PageHead
        back={<button className="back-link" style={{ border: 0, background: 'none', padding: 0 }} onClick={() => nav('/eleves')}><ArrowLeft size={16} />Élèves</button>}
        title="Importer des élèves"
        sub="Depuis un fichier Excel (.xlsx) ou CSV : une ligne par élève. Les colonnes sont reconnues automatiquement."
        actions={<button className="btn" onClick={template}><Download />Télécharger le modèle</button>}
      />
      <div className="card card-pad mb-16">
        <div className="form-grid">
          <Field label="Classe des élèves (si le fichier n’a pas de colonne « Classe »)">
            <select className="select" value={classeId} onChange={(e) => { setClasseId(e.target.value); remap(mapping, e.target.value); }}>{classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}</select>
          </Field>
          <div className="upload" onClick={() => input.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); load(e.dataTransfer.files[0]); }}>
            <span className="tint-green" style={{ width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center' }}><FileSpreadsheet /></span>
            <b>{fileName || 'Choisir le fichier Excel'}</b>
            <span className="tiny">.xlsx ou .csv — glissez-déposez ou touchez ici</span>
          </div>
        </div>
        <input ref={input} type="file" accept=".xlsx,.csv,.txt,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" hidden onChange={(e) => { load(e.target.files?.[0]); e.target.value = ''; }} />
      </div>

      {rows && raw && (
        <>
          <details className="card card-pad mb-16">
            <summary style={{ cursor: 'pointer' }}><b style={{ color: 'var(--ink)' }}>Colonnes reconnues : </b><span className="small muted">{(Object.keys(LABEL) as Key[]).filter((k) => mapping[k] !== undefined).map((k) => LABEL[k]).join(', ') || 'aucune'} — modifier</span></summary>
            <div className="row wrap mt-8" style={{ gap: 8 }}>
              {(Object.keys(LABEL) as Key[]).map((k) => (
                <label key={k} className="row small" style={{ gap: 6, border: '1px solid var(--line)', borderRadius: 9, padding: '4px 8px', background: mapping[k] !== undefined ? 'var(--green-50)' : '#fff' }}>
                  {LABEL[k]}
                  <select className="select" style={{ height: 30, width: 'auto', fontSize: 12.5 }} value={mapping[k] ?? ''} onChange={(e) => remap({ ...mapping, [k]: e.target.value === '' ? undefined : Number(e.target.value) })}>
                    <option value="">—</option>{raw.head.map((h, i) => <option key={i} value={i}>{h || `Colonne ${i + 1}`}</option>)}
                  </select>
                </label>
              ))}
            </div>
          </details>
          {mapping.complet !== undefined && <label className="check small mb-16"><input type="checkbox" checked={firstNameFirst} onChange={(e) => { setFirstNameFirst(e.target.checked); remap(mapping, classeId, e.target.checked); }} />Dans « Nom et prénom », le prénom est écrit en premier</label>}
          <div className="card">
            <div className="card-pad row wrap" style={{ gap: 8 }}>
              <b style={{ color: 'var(--ink)' }}>Aperçu</b>
              <Badge tone="green">{ok} à importer</Badge>
              {rows.some((r) => r.duplicate) && <Badge tone="orange">{rows.filter((r) => r.duplicate).length} déjà inscrits (ignorés)</Badge>}
              {rows.some((r) => r.errors.length) && <Badge tone="red">{rows.filter((r) => r.errors.length).length} à vérifier</Badge>}
            </div>
            <div className="table-wrap" style={{ maxHeight: 460 }}>
              <table className="t t-compact">
                <thead><tr><th /><th>Nom</th><th>Prénom</th><th>Sexe</th><th>Naissance</th><th>Classe</th><th>Parent</th><th>Téléphone</th><th>Remarque</th></tr></thead>
                <tbody>{rows.map((r, i) => (
                  <tr key={i} style={{ opacity: r.keep ? 1 : 0.5 }}>
                    <td><input type="checkbox" checked={r.keep} disabled={!r.nom || !r.prenom} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, keep: e.target.checked } : x)))} /></td>
                    <td style={{ color: 'var(--ink)', fontWeight: 500 }}>{r.nom}</td><td>{r.prenom}</td><td>{r.sexe}</td><td>{r.naissance ? r.naissance.split('-').reverse().join('/') : '-'}</td>
                    <td>{classes.find((c) => c.id === r.classeId)?.code}</td><td>{r.parent || '-'}</td><td style={{ whiteSpace: 'nowrap' }}>{r.telephone || '-'}</td>
                    <td className="small">{r.duplicate ? <span style={{ color: 'var(--orange)' }}>Déjà inscrit</span> : r.errors.length ? <span className="row" style={{ gap: 4, color: 'var(--red)' }}><AlertTriangle size={13} />{r.errors.join(' · ')}</span> : <Check size={15} color="var(--green)" />}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
          <div className="sticky-foot">
            <button className="btn btn-lg" onClick={() => { setRows(null); setRaw(null); setFileName(''); }}><X />Annuler</button>
            <span className="grow" />
            <button className="btn btn-primary btn-lg" disabled={!ok} onClick={doImport}><Upload />Importer {ok} élève{ok > 1 ? 's' : ''}</button>
          </div>
        </>
      )}
      {!rows && (
        <div className="card card-pad small muted">
          <b style={{ color: 'var(--ink)' }}>Conseils</b>
          <ul style={{ margin: '8px 0 0', paddingLeft: 18, lineHeight: 1.7 }}>
            <li>La première ligne doit contenir les titres : Nom, Prénom, Sexe, Date de naissance, Classe, Parent, Téléphone…</li>
            <li>Une seule colonne « Nom et prénom » fonctionne aussi.</li>
            <li>Les élèves déjà inscrits (même nom, prénom et classe) sont ignorés.</li>
            <li>Si un numéro de parent existe déjà (frères et sœurs), l’élève est rattaché au même parent.</li>
          </ul>
        </div>
      )}
    </div>
  );
}
