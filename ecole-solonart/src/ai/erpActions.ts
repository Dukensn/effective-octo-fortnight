// Exécute une commande ERP (JSON produit par l'IA locale) sur la base de l'appareil.
// Consultations : réponse immédiate. Écritures : JAMAIS automatiques — on ouvre le formulaire prérempli
// et c'est la personne qui confirme en enregistrant.
import { db } from '../data/store';
import type { ClassRoom, ModuleKey, Student } from '../data/types';
import { classReport, isPreschool, levelOf, sortedPeriods } from '../data/compute';
import { activeMonths, balances, monthlyReport } from '../lib/finance';
import { civ, dateShort, fullName, money, monthLabel, norm } from '../lib/format';
import type { Session } from '../lib/session';
import type { ErpCommand } from './erpCommand';
import { referenceDate } from '../components/LessonForm';

export interface ReplyLine { label: string; value?: string; to?: string; photo?: string }
export interface ChatReply {
  text: string;
  lines?: ReplyLine[];
  actions?: { label: string; to: string; primary?: boolean }[];
  /** Plusieurs élèves possibles : la personne choisit. */
  choices?: { label: string; sub: string; command: ErpCommand }[];
  tone?: 'info' | 'warn' | 'confirm';
}

const fmt = (n: number | null | undefined) => (n == null ? '-' : n.toFixed(1).replace('.', ','));

function findClass(v: unknown): ClassRoom | undefined {
  const n = norm(String(v ?? '')).replace(/[\s-]/g, '');
  if (!n) return undefined;
  const cls = db.list('classes');
  return cls.find((c) => norm(c.code).replace(/[\s-]/g, '') === n) ?? cls.find((c) => norm(c.nom).replace(/[\s-]/g, '').includes(n));
}

/** Élèves dont le nom apparaît dans la demande (ou dans la variable « eleve »), du plus probable au moins probable. */
export function findStudents(cmd: ErpCommand): Student[] {
  const hay = norm(`${cmd.variables.eleve ?? ''} ${cmd.texte}`);
  const words = new Set(hay.split(/[^a-z0-9]+/).filter((w) => w.length > 1));
  const scored = db.list('students').filter((s) => s.statut !== 'Archivé').map((s) => {
    const nom = norm(s.nom).split(/\s+/);
    const pre = norm(s.prenom).split(/\s+/);
    const nomOk = nom.every((w) => words.has(w));
    const preHits = pre.filter((w) => words.has(w)).length;
    const mat = hay.includes(norm(s.matricule));
    return { s, score: mat ? 100 : nomOk ? 10 + preHits * 3 + (preHits === pre.length ? 2 : 0) : preHits >= 2 ? preHits : 0 };
  }).filter((x) => x.score >= 3).sort((a, b) => b.score - a.score);
  if (!scored.length) {
    // Un seul mot reconnu (prénom ou nom) : on propose les élèves qui le portent, la personne choisit.
    const loose = db.list('students').filter((s) => s.statut === 'Actif' && [...norm(s.prenom).split(/\s+/), ...norm(s.nom).split(/\s+/)].some((w) => w.length > 2 && words.has(w)));
    return loose.length > 1 ? loose.slice(0, 8) : loose;
  }
  const best = scored[0].score;
  return scored.filter((x) => x.score === best).map((x) => x.s).slice(0, 5);
}

const deny = (what: string): ChatReply => ({ text: `Votre rôle ne donne pas accès à ${what}.`, tone: 'warn' });
const studentLine = (s: Student, value?: string): ReplyLine => ({ label: fullName(s), value, to: `/eleves/${s.id}`, photo: s.photo });

/** Quand plusieurs élèves correspondent, on propose de choisir (la commande est rejouée avec le bon élève). */
function choose(cmd: ErpCommand, list: Student[]): ChatReply {
  return {
    text: list.length ? 'Plusieurs élèves correspondent. Lequel ?' : 'Je n’ai trouvé aucun élève avec ce nom. Essayez avec le nom et le prénom, ou le matricule.',
    tone: 'warn',
    choices: list.map((s) => ({ label: fullName(s), sub: `${db.get('classes', s.classeId)?.code} · ${s.matricule}`, command: { ...cmd, variables: { ...cmd.variables, eleve: s.matricule }, texte: `${cmd.texte} ${s.matricule}` } })),
  };
}

function oneStudent(cmd: ErpCommand): Student | ChatReply {
  const list = findStudents(cmd);
  return list.length === 1 ? list[0] : choose(cmd, list);
}


const NEED: Partial<Record<ErpCommand['action'], [ModuleKey, 'read' | 'write', string]>> = {
  consulter_resultats: ['notes', 'read', 'les notes'], consulter_eleve: ['eleves', 'read', 'les fiches élèves'],
  consulter_impayes: ['finance', 'read', 'la finance'], consulter_finances: ['finance', 'read', 'la finance'],
  consulter_presences: ['presences', 'read', 'les présences'], consulter_discipline: ['discipline', 'read', 'la discipline'],
  consulter_cahier: ['cahier', 'read', 'le cahier de textes'], signaler_incident: ['discipline', 'write', 'la discipline'],
  encaisser_paiement: ['finance', 'write', 'la finance'], enregistrer_depense: ['finance', 'write', 'la finance'],
  inscrire_eleve: ['inscriptions', 'write', 'les inscriptions'], nouvelle_seance: ['cahier', 'write', 'le cahier de textes'],
  faire_appel: ['presences', 'write', 'les présences'],
};

export function executeCommand(cmd: ErpCommand, session: Session): ChatReply {
  const need = NEED[cmd.action];
  if (need && !session.can(need[0], need[1])) return deny(need[2]);
  const v = cmd.variables;
  const classe = findClass(v.classe);
  const q = (o: Record<string, string | number | undefined>) => new URLSearchParams(Object.entries(o).filter(([, x]) => x !== undefined && x !== '').map(([k, x]) => [k, String(x)])).toString();

  switch (cmd.action) {
    case 'consulter_resultats': {
      if (!classe) return { text: 'Pour quelle classe ? (ex. « résultats de la S4-A »)', tone: 'warn' };
      const p = sortedPeriods().find((x) => norm(x.court) === norm(String(v.periode ?? '')) || x.id === v.periode);
      const r = classReport(classe.id, p?.id ?? 'annuel');
      if (!r) return { text: 'Pas encore de résultats pour cette classe.' };
      const scope = p ? p.libelle : 'l’année';
      const sorted = [...r.students].sort((a, b) => a.rank - b.rank);
      if (isPreschool(classe)) {
        const acq = r.students.filter((s) => levelOf(s.general)?.code === 'A').length;
        return { text: `${classe.code} — ${scope} : ${acq} enfant(s) sur ${r.effectif} ont « Acquis » en bilan.`, lines: r.students.filter((s) => levelOf(s.general)?.code === 'NA').map((s) => studentLine(s.student, 'Non acquis')), actions: [{ label: 'Voir la classe', to: `/classes/${classe.id}` }] };
      }
      const faibles = sorted.filter((s) => s.general != null && s.general < 10);
      return {
        text: `${classe.code} — ${scope} : moyenne de classe ${fmt(r.classGeneral)}/20, ${Math.round(r.successRate * 100)} % de réussite. ${faibles.length ? `${faibles.length} élève(s) sous 10.` : 'Aucun élève sous 10.'}`,
        lines: [...sorted.slice(0, 5).map((s) => studentLine(s.student, `${s.rank}e · ${fmt(s.general)}`)), ...faibles.slice(0, 5).map((s) => studentLine(s.student, `${fmt(s.general)} ⚠`))],
        actions: [{ label: 'Voir la classe', to: `/classes/${classe.id}` }, { label: 'Bulletins', to: `/documents/bulletins?classe=${classe.id}${p ? `&scope=${p.id}` : ''}` }],
      };
    }
    case 'consulter_eleve': {
      const s = oneStudent(cmd);
      if (!(s as Student).id) return s as ChatReply;
      const st = s as Student;
      const r = classReport(st.classeId, 'annuel')?.students.find((x) => x.student.id === st.id);
      const att = db.list('attendance').filter((a) => a.eleveId === st.id);
      const b = balances().get(st.id);
      const inc = db.list('incidents').filter((i) => i.eleveId === st.id && i.type !== 'Félicitations');
      return {
        text: `${fullName(st)} — ${db.get('classes', st.classeId)?.nom}.`,
        lines: [
          ...(session.can('notes') && r ? [{ label: 'Moyenne annuelle', value: `${fmt(r.general)}/20 · ${r.rank}e` }] : []),
          { label: 'Absences / retards', value: `${att.filter((a) => a.statut === 'Absent').length} / ${att.filter((a) => a.statut === 'Retard').length}` },
          ...(session.can('finance') && b ? [{ label: 'Reste à payer', value: money(b.rest) }] : []),
          ...(session.can('discipline') ? [{ label: 'Incidents', value: String(inc.length) }] : []),
        ],
        actions: [{ label: 'Ouvrir la fiche', to: `/eleves/${st.id}`, primary: true }],
      };
    }
    case 'consulter_impayes': {
      const b = balances();
      const list = db.list('students').filter((s) => s.statut === 'Actif' && (!classe || s.classeId === classe.id) && (b.get(s.id)?.rest ?? 0) > 0).sort((x, y) => b.get(y.id)!.rest - b.get(x.id)!.rest);
      const total = list.reduce((t, s) => t + b.get(s.id)!.rest, 0);
      return { text: `${list.length} élève(s) en retard${classe ? ` en ${classe.code}` : ''}, pour un total de ${money(total)}.`, lines: list.slice(0, 8).map((s) => studentLine(s, money(b.get(s.id)!.rest))), actions: [{ label: 'Paiements et rappels WhatsApp', to: '/finance?tab=paiements' }] };
    }
    case 'consulter_finances': {
      const months = activeMonths();
      const ym = /^\d{4}-\d{2}$/.test(String(v.mois ?? '')) ? String(v.mois) : months.find((m) => monthlyReport(m).recettes > 0) ?? months[0];
      if (!ym) return { text: 'Aucun mouvement financier enregistré.' };
      const r = monthlyReport(ym);
      return {
        text: `${monthLabel(ym)} : recettes ${money(r.recettes)}, sorties ${money(r.totalSorties)}, résultat ${money(r.resultat)}.`,
        lines: [...r.parMotif.slice(0, 3).map(([k, x]) => ({ label: `Recette · ${k}`, value: money(x) })), ...(r.salaires ? [{ label: 'Salaires', value: money(r.salaires) }] : []), ...r.parCategorie.slice(0, 3).map(([k, x]) => ({ label: `Dépense · ${k}`, value: money(x) }))],
        actions: [{ label: 'Rapport du mois (PDF)', to: '/finance?tab=rapports', primary: true }],
      };
    }
    case 'consulter_presences': {
      // Seules les exceptions (absent, retard, excusé) sont enregistrées : pas de fiche = présent, si l'appel a été fait ce jour-là.
      const all = db.list('attendance');
      const att = all.filter((a) => a.eleveId && (!classe || a.classeId === classe.id));
      const scope = db.list('classes').filter((c) => !classe || c.id === classe.id);
      let slots = 0, missing = 0;
      for (const c of scope) {
        const days = new Set(all.filter((a) => a.classeId === c.id && !a.eleveId).map((a) => a.date)).size;
        slots += days * db.list('students').filter((s) => s.classeId === c.id && s.statut === 'Actif').length;
        missing += all.filter((a) => a.classeId === c.id && a.eleveId && (a.statut === 'Absent' || a.statut === 'Excusé')).length;
      }
      const rate = slots ? Math.round((1 - missing / slots) * 1000) / 10 : null;
      const abs = new Map<string, number>();
      att.filter((a) => a.statut === 'Absent').forEach((a) => abs.set(a.eleveId!, (abs.get(a.eleveId!) ?? 0) + 1));
      return { text: `Présence${classe ? ` en ${classe.code}` : ''} : ${rate ?? '-'} %.`, lines: [...abs.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([id, n]) => { const s = db.get('students', id)!; return studentLine(s, `${n} absence${n > 1 ? 's' : ''}`); }), actions: [{ label: 'Présences', to: `/presences${classe ? `?classe=${classe.id}` : ''}` }] };
    }
    case 'consulter_discipline': {
      const list = db.list('incidents').filter((i) => !classe || i.classeId === classe.id);
      const open = list.filter((i) => i.statut === 'Ouvert');
      return { text: `${list.length} inscription(s) au registre${classe ? ` pour ${classe.code}` : ''}, dont ${open.length} dossier(s) ouvert(s).`, lines: open.slice(0, 6).map((i) => { const s = db.get('students', i.eleveId)!; return studentLine(s, `${i.type} · ${dateShort(i.date)}`); }), actions: [{ label: 'Registre de discipline', to: '/discipline' }] };
    }
    case 'consulter_cahier': {
      const ref = referenceDate();
      const lessons = db.list('lessons');
      const late = db.list('courses').filter((co) => !classe || co.classeId === classe.id).map((co) => ({ co, last: lessons.filter((l) => l.coursId === co.id).reduce((m, l) => (l.date > m ? l.date : m), '') })).filter((x) => !x.last || (Date.parse(ref) - Date.parse(x.last)) / 86400000 > 7);
      return { text: late.length ? `${late.length} cours sans cahier de textes à jour (plus de 7 jours).` : 'Tous les cahiers de textes sont à jour.', lines: late.slice(0, 8).map(({ co, last }) => ({ label: `${db.get('subjects', co.matiereId)?.court} · ${db.get('classes', co.classeId)?.code}`, value: `${civ(db.get('staff', co.professeurId))} · ${last ? dateShort(last) : 'jamais'}` })), actions: [{ label: 'Cahier de textes', to: '/cahier' }] };
    }
    case 'signaler_incident': {
      const s = oneStudent(cmd);
      if (!(s as Student).id) return s as ChatReply;
      const st = s as Student;
      return { tone: 'confirm', text: `Signaler un incident pour ${fullName(st)} (${db.get('classes', st.classeId)?.code})${v.type ? ` : ${String(v.type).toLowerCase()}` : ''}. Vérifiez puis enregistrez dans le formulaire.`, actions: [{ label: 'Ouvrir le formulaire prérempli', to: `/discipline?${q({ new: 1, eleve: st.id, type: v.type, description: v.description ?? cmd.texte })}`, primary: true }] };
    }
    case 'encaisser_paiement': {
      const s = oneStudent(cmd);
      if (!(s as Student).id) return s as ChatReply;
      const st = s as Student;
      return { tone: 'confirm', text: `Encaisser ${v.montant ? money(Number(v.montant)) : 'un paiement'} pour ${fullName(st)}${v.mode ? ` (${v.mode})` : ''}. Le reçu sera prêt après confirmation.`, actions: [{ label: 'Ouvrir le formulaire prérempli', to: `/finance?${q({ new: 1, eleve: st.id, montant: v.montant, mode: v.mode })}`, primary: true }] };
    }
    case 'enregistrer_depense':
      return { tone: 'confirm', text: `Enregistrer une dépense${v.montant ? ` de ${money(Number(v.montant))}` : ''}${v.libelle ? ` : ${v.libelle}` : ''}.`, actions: [{ label: 'Ouvrir le formulaire prérempli', to: `/finance?${q({ depense: 1, libelle: v.libelle ?? cmd.texte, montant: v.montant })}`, primary: true }] };
    case 'inscrire_eleve':
      return { tone: 'confirm', text: `Inscrire ${[v.prenom, v.nom].filter(Boolean).join(' ') || 'un nouvel élève'}${classe ? ` en ${classe.code}` : ''}.`, actions: [{ label: 'Ouvrir l’inscription rapide', to: `/inscriptions/rapide?${q({ classe: classe?.id, prenom: v.prenom, nom: v.nom })}`, primary: true }] };
    case 'nouvelle_seance':
      return { tone: 'confirm', text: 'Noter une séance dans le cahier de textes.', actions: [{ label: 'Ouvrir le cahier de textes', to: '/cahier', primary: true }] };
    case 'faire_appel':
      return { text: `Faire l’appel${classe ? ` de ${classe.code}` : ''}.`, actions: [{ label: 'Ouvrir l’appel', to: `/presences${classe ? `?classe=${classe.id}` : ''}`, primary: true }] };
    case 'ouvrir_page': {
      const pages: [string, string][] = [['accueil', '/'], ['eleves', '/eleves'], ['inscription', '/inscriptions'], ['classe', '/classes'], ['parent', '/parents'], ['personnel', '/personnel'], ['emploi', '/emploi-du-temps'], ['note', '/notes'], ['presence', '/presences'], ['discipline', '/discipline'], ['cahier', '/cahier'], ['finance', '/finance'], ['document', '/documents'], ['bulletin', '/documents/bulletins'], ['badge', '/documents/badges'], ['communication', '/communication'], ['rapport', '/rapports'], ['parametre', '/parametres']];
      const t = norm(`${v.page ?? ''} ${cmd.texte}`);
      const hit = pages.find(([k]) => t.includes(k));
      return hit ? { text: 'Voici la page demandée.', actions: [{ label: 'Ouvrir', to: hit[1], primary: true }] } : { text: 'Quelle page voulez-vous ouvrir ?', tone: 'warn' };
    }
    default:
      return { text: 'Je n’ai pas compris. Essayez par exemple : « résultats de la S4-A », « qui n’a pas payé en 7e année », « Marie Dupont a payé 5000 gourdes par MonCash ».', tone: 'warn' };
  }
}

/** Libellé lisible d'une commande, pour l'affichage sous la bulle. */
export const actionLabel: Record<ErpCommand['action'], string> = {
  consulter_resultats: 'Résultats', consulter_eleve: 'Fiche élève', consulter_impayes: 'Impayés', consulter_finances: 'Finances du mois',
  consulter_presences: 'Présences', consulter_discipline: 'Discipline', consulter_cahier: 'Cahier de textes', signaler_incident: 'Signaler un incident',
  encaisser_paiement: 'Encaisser', enregistrer_depense: 'Dépense', inscrire_eleve: 'Inscription', nouvelle_seance: 'Séance', faire_appel: 'Appel',
  ouvrir_page: 'Ouvrir une page', inconnu: 'Non compris',
};
