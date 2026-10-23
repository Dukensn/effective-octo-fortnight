// Commande ERP structurée : ce que le LLM local doit produire (UNIQUEMENT du JSON),
// sa validation, et un analyseur par règles qui prend le relais quand le petit modèle se trompe.
import type { ChatMessage } from './agent.worker';

export const ERP_ACTIONS = [
  'consulter_resultats', 'consulter_eleve', 'consulter_impayes', 'consulter_finances', 'consulter_presences',
  'consulter_discipline', 'consulter_cahier', 'signaler_incident', 'encaisser_paiement', 'enregistrer_depense',
  'inscrire_eleve', 'nouvelle_seance', 'faire_appel', 'ouvrir_page', 'inconnu',
] as const;
export type ErpAction = (typeof ERP_ACTIONS)[number];

const ENTITE: Record<ErpAction, string> = {
  consulter_resultats: 'classe', consulter_eleve: 'eleve', consulter_impayes: 'paiement', consulter_finances: 'finance',
  consulter_presences: 'presence', consulter_discipline: 'incident', consulter_cahier: 'seance', signaler_incident: 'incident',
  encaisser_paiement: 'paiement', enregistrer_depense: 'depense', inscrire_eleve: 'eleve', nouvelle_seance: 'seance',
  faire_appel: 'presence', ouvrir_page: 'page', inconnu: 'aucune',
};

export type ErpVariables = Partial<Record<'classe' | 'eleve' | 'periode' | 'mois' | 'montant' | 'mode' | 'type' | 'description' | 'libelle' | 'categorie' | 'matiere' | 'titre' | 'nom' | 'prenom' | 'page', string | number>>;

export interface ErpCommand {
  action: ErpAction;
  entite: string;
  variables: ErpVariables;
  /** Texte d'origine (tapé ou transcrit). */
  texte: string;
  /** « llm » si le JSON du modèle était valide, « regles » si l'analyseur de secours a été utilisé. */
  source: 'llm' | 'regles';
}

export const SYSTEM_PROMPT = `Tu convertis une demande d'un membre du personnel d'une école en commande JSON pour le logiciel de l'école.
Réponds UNIQUEMENT par un objet JSON, sans texte avant ni après, de la forme :
{"action": "...", "entite": "...", "variables": {...}}
Actions possibles :
- consulter_resultats (variables : classe, periode)
- consulter_eleve (variables : eleve)
- consulter_impayes (variables : classe)
- consulter_finances (variables : mois au format AAAA-MM)
- consulter_presences (variables : classe)
- consulter_discipline (variables : classe)
- consulter_cahier (variables : classe)
- signaler_incident (variables : eleve, type, description)
- encaisser_paiement (variables : eleve, montant, mode)
- enregistrer_depense (variables : libelle, montant, categorie)
- inscrire_eleve (variables : prenom, nom, classe)
- nouvelle_seance (variables : classe, matiere, titre)
- faire_appel (variables : classe)
- ouvrir_page (variables : page)
- inconnu (si la demande ne correspond à rien)
Les classes s'écrivent comme S4-A, S3-B, 7AF, 9AF, PS, MS, GS. Les montants sont des nombres en gourdes.`;

// Exemples pour guider les petits modèles (apprentissage par l'exemple).
const FEW_SHOT: [string, object][] = [
  ['Montre-moi les résultats de la S4-A au 4e contrôle', { action: 'consulter_resultats', entite: 'classe', variables: { classe: 'S4-A', periode: 'C4' } }],
  ['Qui n’a pas encore payé en 7e année ?', { action: 'consulter_impayes', entite: 'paiement', variables: { classe: '7AF' } }],
  ['Jean Philippe Dorval a payé 15000 gourdes par MonCash', { action: 'encaisser_paiement', entite: 'paiement', variables: { eleve: 'Jean Philippe Dorval', montant: 15000, mode: 'MonCash' } }],
  ['Signale que Marie Dupont utilisait son téléphone en classe', { action: 'signaler_incident', entite: 'incident', variables: { eleve: 'Marie Dupont', type: 'Téléphone', description: 'Utilisait son téléphone en classe' } }],
  ['Rapport financier du mois d’avril', { action: 'consulter_finances', entite: 'finance', variables: { mois: '2025-04' } }],
  ['Kijan prezans S3-A ye ?', { action: 'consulter_presences', entite: 'presence', variables: { classe: 'S3-A' } }],
];

export function buildMessages(text: string): ChatMessage[] {
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    ...FEW_SHOT.flatMap(([q, a]) => [{ role: 'user' as const, content: q }, { role: 'assistant' as const, content: JSON.stringify(a) }]),
    { role: 'user', content: text },
  ];
}

/** Extrait le premier objet JSON équilibré d'une réponse (le modèle peut ajouter du texte autour). */
export function extractJson(raw: string): unknown {
  const start = raw.indexOf('{');
  if (start < 0) return null;
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < raw.length; i++) {
    const c = raw[i];
    if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) {
      try { return JSON.parse(raw.slice(start, i + 1)); } catch { return null; }
    }
  }
  return null;
}

/** Valide le JSON du modèle ; renvoie null s'il est inutilisable. */
export function validateCommand(obj: unknown, texte: string): ErpCommand | null {
  if (!obj || typeof obj !== 'object') return null;
  const o = obj as Record<string, unknown>;
  const rawAction = String(o.action ?? '').trim().toLowerCase();
  const action = (ERP_ACTIONS as readonly string[]).includes(rawAction) ? (rawAction as ErpAction) : null;
  if (!action) return null;
  const vars = (o.variables ?? o.params ?? o.parametres ?? {}) as Record<string, unknown>;
  const variables: ErpVariables = {};
  for (const [k, v] of Object.entries(typeof vars === 'object' && vars ? vars : {})) {
    if (typeof v === 'string' && v.trim()) (variables as Record<string, unknown>)[k] = v.trim();
    else if (typeof v === 'number' && Number.isFinite(v)) (variables as Record<string, unknown>)[k] = v;
  }
  return { action, entite: ENTITE[action], variables, texte, source: 'llm' };
}

// ---------------- Analyseur par règles (secours) ----------------
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const MOIS = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'];
const MOIS_KR = ['janvye', 'fevriye', 'mas', 'avril', 'me', 'jen', 'jiyè', 'out', 'septanm', 'oktob', 'novanm', 'desanm'];

export function findClassCode(text: string, codes: string[]): string | undefined {
  const t = norm(text).replace(/\s+/g, '');
  // codes exacts (S4-A, 7AF…), du plus long au plus court
  for (const c of [...codes].sort((a, b) => b.length - a.length)) if (t.includes(norm(c).replace(/[\s-]/g, '')) || t.includes(norm(c).replace(/\s/g, ''))) return c;
  const n = norm(text);
  const sec = n.match(/\b(?:s|secondaire|seg)\s*(i{1,3}v?|iv|[1-4])\s*-?\s*([ab])\b/);
  if (sec) { const roman: Record<string, string> = { i: '1', ii: '2', iii: '3', iv: '4' }; const code = `S${roman[sec[1]] ?? sec[1]}-${sec[2].toUpperCase()}`; if (codes.includes(code)) return code; }
  const fond = n.match(/\b([1-9])\s*(?:e|er|eme|em|yem)?\s*(?:annee|ane|af|a\.f)/);
  if (fond && codes.includes(`${fond[1]}AF`)) return `${fond[1]}AF`;
  if (/petite section/.test(n)) return 'PS';
  if (/moyenne section/.test(n)) return 'MS';
  if (/grande section/.test(n)) return 'GS';
  return undefined;
}

function findMonth(text: string, schoolStartYear: number): string | undefined {
  const n = norm(text);
  const iso = n.match(/\b(20\d{2})-(0[1-9]|1[0-2])\b/);
  if (iso) return `${iso[1]}-${iso[2]}`;
  const i = MOIS.findIndex((m) => new RegExp(`\\b${m}\\b`).test(n));
  const k = i >= 0 ? i : MOIS_KR.findIndex((m) => new RegExp(`\\b${norm(m)}\\b`).test(n));
  if (k < 0) return undefined;
  const year = k >= 8 ? schoolStartYear : schoolStartYear + 1; // sept.–déc. : 1re année civile
  return `${year}-${String(k + 1).padStart(2, '0')}`;
}

function findAmount(text: string): number | undefined {
  const m = norm(text).match(/(\d[\d\s.,]*)\s*(?:g\b|gdes?\b|gourdes?|goud|htg)/) ?? norm(text).match(/\b(\d{3,7})\b/);
  if (!m) return undefined;
  const v = Number(m[1].replace(/[\s.,]/g, ''));
  return Number.isFinite(v) && v > 0 ? v : undefined;
}

export function ruleBasedCommand(text: string, ctx: { classCodes: string[]; schoolStartYear: number }): ErpCommand {
  const n = norm(text);
  const has = (...words: string[]) => words.some((w) => n.includes(w));
  const classe = findClassCode(text, ctx.classCodes);
  const montant = findAmount(text);
  const periode = (n.match(/\b([1-5])\s*(?:e|er|eme|em)?\s*(?:controle|kontwol)/) ?? [])[1];
  const v: ErpVariables = {};
  if (classe) v.classe = classe;
  let action: ErpAction = 'inconnu';
  if (has('inscri', 'enskri')) action = 'inscrire_eleve';
  else if (has('signal', 'sanction', 'incident', 'bagarre', 'insolen', 'telephone en classe', 'indiscipline') && !has('combien', 'registre', 'liste', 'statisti', 'montre')) action = 'signaler_incident';
  else if (has('discipline', 'incident', 'sanction')) action = 'consulter_discipline';
  else if (has('depense', 'achete', 'achat', 'depans') && montant) action = 'enregistrer_depense';
  else if (has('impaye', 'pas paye', 'pas encore paye', 'retard de paiement', 'doit', 'reste a payer', 'poko peye')) action = 'consulter_impayes';
  else if (has('encaiss', 'a paye', 'a verse', 'versement', 'peye') && montant) action = 'encaisser_paiement';
  else if (has('finance', 'recette', 'rapport financier', 'bilan du mois', 'depenses du mois', 'lajan')) action = 'consulter_finances';
  else if (has('faire l\'appel', 'faire l appel', 'appel de', 'fe apel')) action = 'faire_appel';
  else if (has('presence', 'absence', 'absent', 'prezans', 'absan')) action = 'consulter_presences';
  else if (has('cahier', 'devoir', 'seance', 'lecon')) action = has('ajoute', 'note', 'nouvelle', 'enregistre', 'remplir') ? 'nouvelle_seance' : 'consulter_cahier';
  else if (has('resultat', 'moyenne', 'note', 'palmares', 'classement', 'rang', 'rezilta', 'mwayen')) action = 'consulter_resultats';
  else if (has('fiche', 'dossier', 'eleve', 'elev')) action = 'consulter_eleve';
  else if (has('ouvre', 'ouvrir', 'va a', 'aller', 'louvri')) action = 'ouvrir_page';
  if (action === 'consulter_finances') { const m = findMonth(text, ctx.schoolStartYear); if (m) v.mois = m; }
  if (action === 'consulter_resultats' && periode) v.periode = `C${periode}`;
  if ((action === 'encaisser_paiement' || action === 'enregistrer_depense') && montant) v.montant = montant;
  if (action === 'encaisser_paiement') { const mode = ['MonCash', 'NatCash', 'Espèces', 'Virement', 'Chèque'].find((m) => n.includes(norm(m)) || (m === 'Espèces' && has('cash', 'kach', 'liquide'))); if (mode) v.mode = mode; }
  if (action === 'signaler_incident') { v.description = text.trim(); const t = (['Retard', 'Téléphone', 'Bavardage', 'Insolence', 'Fraude', 'Dégradation'] as const).find((x) => n.includes(norm(x).slice(0, 6))); if (t) v.type = t; else if (has('bagarre', 'battu', 'frappe')) v.type = 'Bagarre / violence'; }
  if (action === 'inscrire_eleve') {
    // « Inscrire Rose Pierre en 9e année » → prénom Rose, nom Pierre
    const m = text.match(/(?:[Ii]nscri\w*|[Ee]nskri\w*)\s+(?:l['’]élève\s+|l['’]eleve\s+)?([A-ZÀ-ÖØ-Ý][\wÀ-ÿ'’-]+(?:\s+[A-ZÀ-ÖØ-Ý][\wÀ-ÿ'’-]+)*)/);
    if (m) { const parts = m[1].trim().split(/\s+/); v.prenom = parts[0]; if (parts.length > 1) v.nom = parts.slice(1).join(' '); }
  }
  if (action === 'enregistrer_depense') v.libelle = text.replace(/\d[\d\s.,]*\s*(?:g\b|gdes?\b|gourdes?|goud|htg)/i, '').trim();
  if (action === 'ouvrir_page') v.page = text.replace(/^(ouvre|ouvrir|va a|va à|aller a|aller à)\s+(la\s+page\s+)?/i, '').trim();
  return { action, entite: ENTITE[action], variables: v, texte: text, source: 'regles' };
}

/** Combine : le JSON du modèle s'il est valide, complété par les règles (classe, montant…) quand il en oublie. */
export function resolveCommand(raw: string, text: string, ctx: { classCodes: string[]; schoolStartYear: number }): ErpCommand {
  const rules = ruleBasedCommand(text, ctx);
  const llm = validateCommand(extractJson(raw), text);
  if (!llm || llm.action === 'inconnu') return rules.action !== 'inconnu' ? rules : llm ?? rules;
  const facts: ErpVariables = {};
  for (const k of ['classe', 'mois', 'montant', 'periode'] as const) if (rules.variables[k] !== undefined) facts[k] = rules.variables[k];
  return { ...llm, variables: { ...(llm.action === rules.action ? rules.variables : facts), ...llm.variables } };
}
