// Connexion : e-mail + mot de passe, ou Google. Rien d'autre.
// - Avec Firebase configuré (.env) : Firebase Auth vérifie le mot de passe ou le compte Google,
//   puis on retrouve la fiche utilisateur de l'école par son adresse e-mail.
// - Sans Firebase (démonstration, données sur l'appareil) : le mot de passe est vérifié ici
//   (empreinte SHA-256) ; Google n'est pas disponible.
// Un compte créé par la personne elle-même n'a pas encore d'école : elle entre le code d'établissement,
// puis la direction valide et choisit son rôle.
import { db } from '../data/store';
import { firebaseConfig, firebaseEnabled } from '../data/sync';
import type { User } from '../data/types';
import { audit, signIn } from './session';

/** Mot de passe des comptes de démonstration qui n'en ont pas encore choisi. */
export const DEMO_PASSWORD = 'solonart';
export const googleAvailable = firebaseEnabled;

const clean = (e: string) => e.trim().toLowerCase();
export const findByEmail = (email: string) => db.list('users').find((u) => u.email && clean(u.email) === clean(email));

async function fingerprint(email: string, pw: string) {
  const data = new TextEncoder().encode(`solonart|${clean(email)}|${pw}`);
  const h = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function firebaseAuth() {
  const { initializeApp, getApps } = await import('firebase/app');
  const m = await import('firebase/auth');
  const app = getApps()[0] ?? initializeApp(firebaseConfig);
  return { m, auth: m.getAuth(app) };
}

function fbMessage(e: unknown) {
  const code = (e as { code?: string }).code ?? '';
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) return 'E-mail ou mot de passe incorrect';
  if (code.includes('email-already-in-use')) return 'Un compte existe déjà avec cette adresse. Connectez-vous.';
  if (code.includes('weak-password')) return 'Mot de passe trop faible (8 caractères au moins)';
  if (code.includes('popup-closed')) return 'Connexion Google annulée';
  if (code.includes('network')) return 'Pas de connexion Internet';
  return 'La connexion a échoué. Réessayez.';
}

/** Ouvre la session sur la fiche de cette adresse (la crée si c'est un nouveau compte). */
function enter(email: string, nom: string, photo?: string, uid?: string) {
  // Avec Firebase, un nouveau compte prend l'identifiant Firebase (les règles de sécurité lisent users/{uid}).
  const u = findByEmail(email) ?? db.put('users', { id: uid, nom, email: clean(email), roleId: '', pin: '', actif: true, photo } as Omit<User, 'updatedAt'> as User);
  return signIn(u.id);
}

const check = (email: string, pw: string) => {
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) return 'Entrez une adresse e-mail valide';
  if (pw.length < 6) return 'Le mot de passe doit avoir au moins 6 caractères';
  return null;
};

export async function loginWithPassword(email: string, pw: string): Promise<string | null> {
  const bad = check(email, pw);
  if (bad) return bad;
  if (firebaseEnabled) {
    try { const { m, auth } = await firebaseAuth(); const r = await m.signInWithEmailAndPassword(auth, email.trim(), pw); return enter(r.user.email ?? email, r.user.displayName ?? email, undefined, r.user.uid); }
    catch (e) { return fbMessage(e); }
  }
  const u = findByEmail(email);
  if (!u) return 'Aucun compte avec cette adresse. Créez un compte.';
  const ok = u.mdp ? u.mdp === (await fingerprint(email, pw)) : pw === DEMO_PASSWORD;
  if (!ok) return 'Mot de passe incorrect';
  return signIn(u.id);
}

export async function signUp(nom: string, email: string, pw: string): Promise<string | null> {
  if (nom.trim().length < 3) return 'Entrez votre nom complet';
  const bad = check(email, pw);
  if (bad) return bad;
  if (firebaseEnabled) {
    try { const { m, auth } = await firebaseAuth(); const r = await m.createUserWithEmailAndPassword(auth, email.trim(), pw); return enter(email, nom.trim(), undefined, r.user.uid); }
    catch (e) { return fbMessage(e); }
  }
  const existing = findByEmail(email);
  // Invitation : la direction a enregistré cette adresse ; la personne choisit son mot de passe à la première connexion.
  if (existing && !existing.mdp && !existing.dernierAcces) { db.patch('users', existing.id, { mdp: await fingerprint(email, pw) }); return signIn(existing.id); }
  if (existing) return 'Un compte existe déjà avec cette adresse. Connectez-vous.';
  const u = db.put('users', { nom: nom.trim(), email: clean(email), roleId: '', pin: '', actif: true, mdp: await fingerprint(email, pw) } as Omit<User, 'id' | 'updatedAt'> as User);
  return signIn(u.id);
}

export async function loginWithGoogle(): Promise<string | null> {
  if (!firebaseEnabled) return 'La connexion Google s’activera quand la base de données en ligne sera branchée. En attendant, utilisez votre e-mail et votre mot de passe.';
  try {
    const { m, auth } = await firebaseAuth();
    const r = await m.signInWithPopup(auth, new m.GoogleAuthProvider());
    if (!r.user.email) return 'Ce compte Google n’a pas d’adresse e-mail';
    return enter(r.user.email, r.user.displayName ?? r.user.email, r.user.photoURL ?? undefined, r.user.uid);
  } catch (e) { return fbMessage(e); }
}

export async function resetPassword(email: string): Promise<string> {
  if (!firebaseEnabled) return 'Demandez à la direction de réinitialiser votre mot de passe.';
  try { const { m, auth } = await firebaseAuth(); await m.sendPasswordResetEmail(auth, email.trim()); return 'Un e-mail pour choisir un nouveau mot de passe vous a été envoyé.'; }
  catch (e) { return fbMessage(e); }
}

export async function changePassword(u: User, old: string, next: string): Promise<string | null> {
  if (next.length < 6) return 'Le nouveau mot de passe doit avoir au moins 6 caractères';
  if (firebaseEnabled) {
    try { const { m, auth } = await firebaseAuth(); if (!auth.currentUser) return 'Reconnectez-vous puis réessayez'; await m.updatePassword(auth.currentUser, next); return null; }
    catch (e) { return fbMessage(e); }
  }
  const ok = u.mdp ? u.mdp === (await fingerprint(u.email, old)) : old === DEMO_PASSWORD;
  if (!ok) return 'Mot de passe actuel incorrect';
  db.patch('users', u.id, { mdp: await fingerprint(u.email, next) });
  return null;
}

/** Remet le mot de passe d'un compte à celui de démonstration (direction, mode local). */
export function resetLocalPassword(userId: string) { db.patch('users', userId, { mdp: undefined }); }

export async function logoutEverywhere() {
  if (firebaseEnabled) { try { const { m, auth } = await firebaseAuth(); await m.signOut(auth); } catch { /* hors ligne */ } }
}

/** Code d'établissement : « SOLONART-4821 ». */
export function newSchoolCode(nom = 'ECOLE') {
  const base = nom.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z]/g, ' ').trim().split(/\s+/).pop() ?? 'ECOLE';
  return `${base.slice(0, 10)}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function joinSchool(userId: string, code: string): string | null {
  const school = db.get('school', 'main');
  const want = school?.codeEtablissement?.replace(/\s/g, '').toUpperCase();
  if (!want || code.replace(/\s/g, '').toUpperCase() !== want) return 'Code inconnu. Vérifiez-le auprès de la direction.';
  db.patch('users', userId, { demande: { code: want, le: Date.now() } });
  return null;
}

/** La direction accepte une demande : rôle et, pour un professeur, sa fiche du personnel. */
export function approveRequest(userId: string, roleId: string, staffId?: string) {
  const u = db.get('users', userId);
  if (!u) return;
  const st = staffId ? db.get('staff', staffId) : undefined;
  db.patch('users', userId, { roleId, staffId: st?.id, photo: u.photo ?? st?.photo, demande: undefined });
  audit('Accès accordé', `${u.nom} (${u.email}) · ${db.get('roles', roleId)?.nom}`, { domaine: 'acces' });
}
export function refuseRequest(userId: string, motif?: string) {
  const u = db.get('users', userId);
  if (!u?.demande) return;
  db.patch('users', userId, { demande: { ...u.demande, refusee: true, motif } });
  audit('Accès refusé', `${u.nom} (${u.email})`, { domaine: 'acces', motif });
}
