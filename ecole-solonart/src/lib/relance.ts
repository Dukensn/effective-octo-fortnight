// Relances de paiement : texte personnalisé par parent, liens WhatsApp / SMS et suivi des envois.
import { db } from '../data/store';
import type { Guardian, ID, Message, Student } from '../data/types';
import { civ, fullName, money } from './format';
import { audit } from './session';

export const MODELE_DEFAUT = 'Bonjour {parent}, {ecole} vous rappelle qu’il reste {reste} à payer pour la scolarité de {eleve} ({classe}). Paiement possible par MonCash ou au secrétariat. Merci.';
export const CHAMPS = ['{parent}', '{eleve}', '{classe}', '{reste}', '{ecole}'];
const KEY = 'solonart:relance-modele';

export function loadModele() {
  try { return localStorage.getItem(KEY) || MODELE_DEFAUT; } catch { return MODELE_DEFAUT; }
}
export function saveModele(t: string) {
  try { localStorage.setItem(KEY, t); } catch { /* navigation privée */ }
}

/** Parent à contacter : le principal actif, sinon le premier tuteur. */
export function contactOf(s: Student): Guardian | undefined {
  const gs = s.tuteurIds.map((id) => db.get('guardians', id)).filter((g): g is Guardian => !!g && g.statut === 'Actif');
  return gs.find((g) => g.principal) ?? gs[0];
}

/** Numéro au format international sans signe (wa.me) ; un numéro haïtien à 8 chiffres reçoit l'indicatif 509. */
export function phoneDigits(tel?: string) {
  const d = (tel ?? '').replace(/\D/g, '');
  return d.length === 8 ? `509${d}` : d;
}

export function fillModele(modele: string, s: Student, g: Guardian | undefined, reste: number) {
  const school = db.get('school', 'main');
  return modele
    .split('{parent}').join(g ? civ(g) : 'Chers parents')
    .split('{eleve}').join(fullName(s))
    .split('{classe}').join(db.get('classes', s.classeId)?.code ?? '')
    .split('{reste}').join(money(reste, school?.monnaie))
    .split('{ecole}').join(school?.nom ?? 'L’école');
}

export function relanceLink(canal: 'WhatsApp' | 'SMS', tel: string | undefined, text: string) {
  const n = phoneDigits(tel);
  return canal === 'WhatsApp' ? `https://wa.me/${n}?text=${encodeURIComponent(text)}` : `sms:+${n}?body=${encodeURIComponent(text)}`;
}

/** Enregistre l'envoi (historique Communication + suivi par élève). */
export function recordRelance(canal: Message['canal'], s: Student, g: Guardian | undefined, reste: number, contenu: string, auteurId?: ID) {
  db.put('messages', { date: Date.now(), canal, objet: 'Relance de paiement', contenu, cible: 'Parent', classeId: s.classeId, destinataires: 1, auteurId, relance: { eleveId: s.id, tuteurId: g?.id, reste } });
  audit('Relance de paiement', `${fullName(s)} · ${money(reste)} · ${canal}`, { domaine: 'finance' });
}

/** Dernière relance et nombre de relances par élève. */
export function relancesByStudent(messages: Message[]) {
  const m = new Map<ID, { last: number; count: number }>();
  for (const x of messages) {
    if (!x.relance) continue;
    const cur = m.get(x.relance.eleveId);
    m.set(x.relance.eleveId, { last: Math.max(cur?.last ?? 0, x.date), count: (cur?.count ?? 0) + 1 });
  }
  return m;
}
