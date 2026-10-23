// Commande ERP structurée {action, entite, variables}, produite par un analyseur par règles (français et créole).
// Un modèle d'IA locale pourra plus tard produire le même JSON.

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
  source: 'regles';
}

// ---------------- Analyseur par règles ----------------
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
