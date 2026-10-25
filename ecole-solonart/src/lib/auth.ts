// Connexion : e-mail + mot de passe, ou Google. Rien d'autre.
// - Avec Firebase configuré (.env) : Firebase Auth vérifie le mot de passe ou le compte Google,
//   puis on retrouve la fiche utilisateur de l'école par son adresse e-mail.
// - Sans Firebase (démonstration, données sur l'appareil) : le mot de passe est vérifié ici
//   (empreinte SHA-256) ; Google n'est pas disponible.
// Un compte créé par la personne elle-même n'a pas encore d'école : elle entre le code d'établissement,
// puis la direction valide et choisit son rôle.
import { db } from '../data/store';
import { fetchAccount, firebaseApp, firebaseEnabled } from '../data/sync';
import { userKey } from '../data/skeleton';
import type { User } from '../data/types';
import { audit, signIn } from './session';

/** Mot de passe des comptes de démonstration qui n'en ont pas encore choisi. */
export const DEMO_PASSWORD = 'solonart';
export const googleAvailable = firebaseEnabled;

/** Réponse d'une connexion : null = c'est fait, texte = erreur, { info } = message à lire (ex. vérifier son e-mail). */
export type AuthResult = string | null | { info: string };

const clean = (e: string) => e.trim().toLowerCase();
export const findByEmail = (email: string) => db.list('users').find((u) => u.email && clean(u.email) === clean(email));

/** Enregistre un compte. En ligne, son identifiant EST son adresse e-mail (les règles de sécurité lisent users/{e-mail}) :
 *  changer l'adresse déplace donc la fiche. En démonstration, l'identifiant ne change pas. */
export function putAccount(doc: Omit<User, 'id' | 'updatedAt'> & { id?: string }): User {
  const email = clean(doc.email);
  const id = firebaseEnabled ? email : doc.id;
  const prev = doc.id ? db.get('users', doc.id) : undefined;
  if (firebaseEnabled && prev && prev.id !== id) db.remove('users', prev.id);
  return db.put('users', { ...prev, ...doc, email, id } as User);
}

async function fingerprint(email: string, pw: string) {
  const data = new TextEncoder().encode(`solonart|${clean(email)}|${pw}`);
  const h = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function firebaseAuth() {
  const [app, m] = await Promise.all([firebaseApp(), import('firebase/auth')]);
  return { m, auth: m.getAuth(app) };
}

function fbMessage(e: unknown) {
  const code = (e as { code?: string }).code ?? '';
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) return 'E-mail ou mot de passe incorrect';
  if (code.includes('email-already-in-use')) return 'Un compte existe déjà avec cette adresse. Connectez-vous.';
  if (code.includes('weak-password')) return 'Mot de passe trop faible (8 caractères au moins)';
  if (code.includes('popup-closed')) return 'Connexion Google annulée';
  if (code.includes('network')) return 'Pas de connexion Internet';
  if (code.includes('configuration-not-found') || code.includes('operation-not-allowed')) return 'Ce mode de connexion n’est pas encore activé pour l’école. Prévenez la direction.';
  if (code.includes('unauthorized-domain')) return 'Ce site n’est pas encore autorisé pour la connexion Google. Prévenez la direction.';
  if (code.includes('too-many-requests')) return 'Trop d’essais. Patientez quelques minutes.';
  if (code.includes('popup-blocked')) return 'Le navigateur a bloqué la fenêtre Google. Autorisez-la puis réessayez.';
  return 'La connexion a échoué. Réessayez.';
}

/** En ligne : ouvre la session sur la fiche de cette adresse, lue sur le serveur.
 *  Pas de fiche = nouveau compte sans école (il entrera le code d'établissement). */
async function enter(email: string, nom: string, photo?: string): Promise<AuthResult> {
  let u: User | undefined;
  try { u = await fetchAccount(email); }
  catch (e) { return fbMessage(e); }
  u ??= db.put('users', { id: userKey(email), nom, email: clean(email), roleId: '', pin: '', actif: true, photo } as Omit<User, 'updatedAt'> as User);
  // Compte préparé par l'école (« Direction », pas de photo) : on reprend le nom et la photo du compte Google.
  if (u.nom === 'Direction' && nom !== email) db.patch('users', u.id, { nom });
  if (!u.photo && photo) db.patch('users', u.id, { photo });
  return signIn(u.id);
}

/** Compte e-mail + mot de passe : l'adresse doit être confirmée (sinon n'importe qui pourrait prendre l'adresse d'un autre). */
async function askVerification(m: typeof import('firebase/auth'), auth: import('firebase/auth').Auth, user: import('firebase/auth').User): Promise<AuthResult> {
  try { await m.sendEmailVerification(user); } catch { /* déjà envoyé il y a peu */ }
  await m.signOut(auth);
  return { info: `Confirmez votre adresse : ouvrez le lien envoyé à ${user.email} (regardez aussi dans « Spam »), puis connectez-vous.` };
}

const check = (email: string, pw: string) => {
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) return 'Entrez une adresse e-mail valide';
  if (pw.length < 6) return 'Le mot de passe doit avoir au moins 6 caractères';
  return null;
};

export async function loginWithPassword(email: string, pw: string): Promise<AuthResult> {
  const bad = check(email, pw);
  if (bad) return bad;
  if (firebaseEnabled) {
    try {
      const { m, auth } = await firebaseAuth();
      const r = await m.signInWithEmailAndPassword(auth, email.trim(), pw);
      if (!r.user.emailVerified) return askVerification(m, auth, r.user);
      return enter(r.user.email ?? email, r.user.displayName ?? email);
    } catch (e) { return fbMessage(e); }
  }
  const u = findByEmail(email);
  if (!u) return 'Aucun compte avec cette adresse. Créez un compte.';
  const ok = u.mdp ? u.mdp === (await fingerprint(email, pw)) : pw === DEMO_PASSWORD;
  if (!ok) return 'Mot de passe incorrect';
  return signIn(u.id);
}

export async function signUp(nom: string, email: string, pw: string): Promise<AuthResult> {
  if (nom.trim().length < 3) return 'Entrez votre nom complet';
  const bad = check(email, pw);
  if (bad) return bad;
  if (firebaseEnabled) {
    try {
      const { m, auth } = await firebaseAuth();
      const r = await m.createUserWithEmailAndPassword(auth, email.trim(), pw);
      await m.updateProfile(r.user, { displayName: nom.trim() }).catch(() => undefined);
      return askVerification(m, auth, r.user);
    } catch (e) { return fbMessage(e); }
  }
  const existing = findByEmail(email);
  // Invitation : la direction a enregistré cette adresse ; la personne choisit son mot de passe à la première connexion.
  if (existing && !existing.mdp && !existing.dernierAcces) { db.patch('users', existing.id, { mdp: await fingerprint(email, pw) }); return signIn(existing.id); }
  if (existing) return 'Un compte existe déjà avec cette adresse. Connectez-vous.';
  const u = db.put('users', { nom: nom.trim(), email: clean(email), roleId: '', pin: '', actif: true, mdp: await fingerprint(email, pw) } as Omit<User, 'id' | 'updatedAt'> as User);
  return signIn(u.id);
}

export async function loginWithGoogle(): Promise<AuthResult> {
  if (!firebaseEnabled) return 'La connexion Google s’activera quand la base de données en ligne sera branchée. En attendant, utilisez votre e-mail et votre mot de passe.';
  try {
    const { m, auth } = await firebaseAuth();
    const r = await m.signInWithPopup(auth, new m.GoogleAuthProvider());
    if (!r.user.email) return 'Ce compte Google n’a pas d’adresse e-mail';
    return enter(r.user.email, r.user.displayName ?? r.user.email, r.user.photoURL ?? undefined);
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
  if (!firebaseEnabled) return;
  try { const { m, auth } = await firebaseAuth(); await m.signOut(auth); } catch { /* hors ligne */ }
  // Téléphone partagé : on n'y laisse pas les données de l'école (sauf s'il reste des modifications à envoyer).
  if (db.pendingCount() === 0) await db.reset();
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
