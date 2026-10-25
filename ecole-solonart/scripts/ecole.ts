// Outil d'installation d'une école en ligne (Firebase), à lancer depuis un ordinateur — jamais dans l'application.
// Il a besoin de la clé « compte de service » du projet Firebase : ce fichier ne doit JAMAIS être mis dans le dépôt.
//
//   node --experimental-strip-types scripts/ecole.ts regles   --cle chemin/cle.json
//   node --experimental-strip-types scripts/ecole.ts creer    --cle chemin/cle.json --ecole solonart \
//        --nom "École Mixte Solonart" --commune Léogâne --directeur direction@exemple.com
//   node --experimental-strip-types scripts/ecole.ts domaine  --cle chemin/cle.json --domaine monecole.vercel.app
//
// « creer » ne remplace jamais une école existante : il échoue si l'école existe déjà.
import { createSign } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { skeleton } from '../src/data/skeleton.ts';

const args = process.argv.slice(2);
const cmd = args[0];
const opt = (k: string, d?: string) => { const i = args.indexOf(`--${k}`); return i > 0 ? args[i + 1] : d; };
const must = (k: string) => opt(k) ?? (console.error(`--${k} manquant`), process.exit(1));

const key = JSON.parse(readFileSync(must('cle'), 'utf8')) as { project_id: string; client_email: string; private_key: string; token_uri: string };
const P = key.project_id;

async function token() {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const body = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({ iss: key.client_email, scope: 'https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/firebase', aud: key.token_uri, iat: now, exp: now + 3600 })}`;
  const sig = createSign('RSA-SHA256').update(body).sign(key.private_key, 'base64url');
  const r = await fetch(key.token_uri, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${body}.${sig}` });
  const j = await r.json() as { access_token?: string };
  if (!j.access_token) throw new Error(`Jeton refusé : ${JSON.stringify(j)}`);
  return j.access_token;
}
async function call(method: string, url: string, body?: unknown) {
  const r = await fetch(url, { method, headers: { authorization: `Bearer ${await token()}`, 'content-type': 'application/json', 'x-goog-user-project': P }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json();
  if (!r.ok) throw new Error(`${method} ${url} → ${r.status} ${JSON.stringify(j)}`);
  return j;
}

// Valeurs au format REST de Firestore.
type V = Record<string, unknown>;
const enc = (v: unknown): V => v === null || v === undefined ? { nullValue: null }
  : typeof v === 'boolean' ? { booleanValue: v }
  : typeof v === 'number' ? (Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v })
  : typeof v === 'string' ? { stringValue: v }
  : Array.isArray(v) ? { arrayValue: { values: v.map(enc) } }
  : { mapValue: { fields: fields(v as Record<string, unknown>) } };
const fields = (o: Record<string, unknown>) => Object.fromEntries(Object.entries(o).filter(([, x]) => x !== undefined).map(([k, x]) => [k, enc(x)]));

async function regles() {
  const source = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
  const rs = await call('POST', `https://firebaserules.googleapis.com/v1/projects/${P}/rulesets`, { source: { files: [{ name: 'firestore.rules', content: source }] } }) as { name: string };
  const release = `projects/${P}/releases/cloud.firestore`;
  try { await call('PATCH', `https://firebaserules.googleapis.com/v1/${release}`, { release: { name: release, rulesetName: rs.name } }); }
  catch { await call('POST', `https://firebaserules.googleapis.com/v1/projects/${P}/releases`, { name: release, rulesetName: rs.name }); }
  console.log(`Règles publiées (${rs.name})`);
}

async function creer() {
  const ecole = opt('ecole', 'solonart')!;
  const nom = must('nom');
  const code = `${nom.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z ]/g, ' ').trim().split(/\s+/).pop()!.slice(0, 10)}-${Math.floor(1000 + Math.random() * 9000)}`;
  const sk = skeleton({ nom, commune: opt('commune'), directeurNom: opt('directeur-nom', 'Direction')!, directeurEmail: must('directeur'), code });
  const base = `projects/${P}/databases/(default)/documents/ecoles/${ecole}`;
  const writes = Object.entries({ school: [sk.school], years: sk.years, roles: sk.roles, subjects: sk.subjects, users: sk.users })
    .flatMap(([col, docs]) => (docs as { id: string }[]).map((d) => ({ update: { name: `${base}/${col}/${d.id}`, fields: fields(d as never) }, currentDocument: { exists: false } })));
  await call('POST', `https://firestore.googleapis.com/v1/projects/${P}/databases/(default)/documents:commit`, { writes });
  console.log(`École « ${nom} » créée (ecoles/${ecole}) : ${writes.length} documents. Directeur : ${sk.users[0].email}. Code d'établissement : ${code}`);
}

async function domaine() {
  const d = must('domaine');
  const cfg = await call('GET', `https://identitytoolkit.googleapis.com/admin/v2/projects/${P}/config`) as { authorizedDomains?: string[] };
  const list = [...new Set([...(cfg.authorizedDomains ?? []), d])];
  await call('PATCH', `https://identitytoolkit.googleapis.com/admin/v2/projects/${P}/config?updateMask=authorizedDomains`, { authorizedDomains: list });
  console.log(`Domaines autorisés : ${list.join(', ')}`);
}

const cmds: Record<string, () => Promise<void>> = { regles, creer, domaine };
if (!cmds[cmd]) { console.error('Commandes : regles | creer | domaine'); process.exit(1); }
cmds[cmd]().catch((e) => { console.error((e as Error).message); process.exit(1); });
