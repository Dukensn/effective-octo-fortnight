// Badges (cartes d'identité 63 × 86 mm) — modèles inspirés des maquettes.
// Trois familles de catégories : Professeurs, Direction, Personnel, et un jeu distinct pour les Élèves.
import type { CSSProperties, ReactNode } from 'react';
import { User, Phone, Mail, MapPin, CalendarDays, GraduationCap, Users, BookOpen, Home, Droplet, School, Hash, Leaf } from 'lucide-react';
import type { BadgeModel, School as SchoolT } from '../data/types';
import { DocLogo, QR, Barcode, Signature, PhotoOrSilhouette } from './common';

export type BadgeKind = 'professeur' | 'direction' | 'personnel' | 'eleve';
export interface BadgePerson {
  id: string; kind: BadgeKind; nom: string; prenom: string; role: string; sub?: string; matricule: string;
  telephone?: string; email?: string; adresse?: string; dateNaissance?: string; diplome?: string; photo?: string;
  classe?: string; parentTel?: string; groupeSanguin?: string; sexe?: 'M' | 'F';
}
export interface BadgeTpl {
  key: string; nom: string; kinds: BadgeKind[];
  family: 'light' | 'header' | 'dark' | 'student';
  accent: string; pill: string; pillText?: string; ink: string;
  year: 'tab' | 'plain' | 'bar' | 'none';
  deco?: 'wash-green' | 'blobs' | 'wave-orange' | 'band-red' | 'teal' | 'none';
  footer: 'barcode' | 'qr-words' | 'sign';
  words?: string[]; footIcon?: ReactNode; footBar?: string; tagline?: string;
  /** Fond des modèles sombres (dégradé CSS). */
  bg?: string;
  /** Forme de la photo et champs affichés (personnalisables). */
  photo?: PhotoShape; champs?: string[];
  custom?: boolean;
}
export type PhotoShape = 'carre' | 'arrondi' | 'rond';

/** Champs possibles sur un badge, par catégorie. */
export const BADGE_FIELDS: { eleve: [string, string][]; staff: [string, string][] } = {
  eleve: [['classe', 'Classe'], ['matricule', 'Matricule'], ['naissance', 'Date de naissance'], ['parent', 'Téléphone du parent'], ['groupe', 'Groupe sanguin']],
  staff: [['matricule', 'Matricule'], ['telephone', 'Téléphone'], ['email', 'Email'], ['adresse', 'Adresse'], ['naissance', 'Date de naissance']],
};

/** Lien de vérification porté par le QR : ouvre l'application sur la fiche de vérification. */
export function verifyUrl(matricule: string) {
  const base = typeof window === 'undefined' ? '' : `${window.location.origin}${window.location.pathname}`;
  return `${base}#/verifier/${encodeURIComponent(matricule)}`;
}

/** Lignes d'information du badge selon les champs choisis. */
function rowData(p: BadgePerson, tpl: BadgeTpl, landscape = false): [string, ReactNode, string, string | undefined][] {
  const st = p.kind === 'eleve';
  const born = st ? 'Né(e) le' : p.sexe === 'F' ? 'Née le' : 'Né le';
  const all: [string, ReactNode, string, string | undefined][] = st
    ? [['classe', <School key="c" />, 'Classe', p.classe], ['matricule', <Hash key="m" />, 'Matricule', p.matricule], ['naissance', <CalendarDays key="d" />, born, p.dateNaissance], ['parent', <Phone key="p" />, 'Parent', p.parentTel], ['groupe', <Droplet key="g" />, 'Groupe', p.groupeSanguin]]
    : [['matricule', <User key="m" />, 'Matricule', p.matricule], ['telephone', <Phone key="t" />, 'Téléphone', p.telephone], ['email', <Mail key="e" />, 'Email', p.email], ['adresse', <MapPin key="a" />, 'Adresse', p.adresse], ['naissance', <CalendarDays key="d" />, born, p.dateNaissance]];
  const def = landscape
    ? (st ? ['classe', 'matricule', 'naissance', 'parent'] : ['matricule', 'telephone', 'email'])
    : st ? ['classe', 'matricule', 'naissance', 'parent', 'groupe'] : ['matricule', 'telephone', 'email', 'adresse', ...((tpl.family !== 'light' || tpl.deco === 'band-red') && p.dateNaissance ? ['naissance'] : [])];
  const on = tpl.champs ?? def;
  return all.filter(([k]) => on.includes(k)).slice(0, landscape ? 4 : 5);
}
const InfoRows = ({ p, tpl, color }: { p: BadgePerson; tpl: BadgeTpl; color: string }) => <>{rowData(p, tpl).map(([k, icon, label, v]) => <Row key={k} icon={icon} k={label} v={v} color={color} />)}</>;

/** Cadre de la photo selon la forme choisie. */
const photoBox = (tpl: BadgeTpl, base: CSSProperties, def = '2mm'): CSSProperties => {
  if (tpl.photo === 'rond') return { ...base, height: base.width, borderRadius: '50%' };
  return { ...base, borderRadius: tpl.photo === 'carre' ? '.6mm' : tpl.photo === 'arrondi' ? '2.4mm' : def };
};

const NAVY = '#0d2a63';
const pillSize = (t: string) => (t.length > 20 ? { fontSize: '1.75mm', padding: '1mm 1.6mm' } : t.length > 14 ? { fontSize: '2mm' } : undefined);
const nameSize = (p: { prenom: string; nom: string }) => ((p.prenom + p.nom).length > 20 ? { fontSize: '3.1mm' } : undefined);
export const BADGE_TEMPLATES: BadgeTpl[] = [
  { key: 'classique', nom: 'Classique bleu', kinds: ['professeur', 'personnel'], family: 'light', accent: '#123a7a', pill: '#1d4fa8', ink: NAVY, year: 'tab', footer: 'barcode', footBar: '"Apprendre aujourd’hui, Construire demain."' },
  { key: 'nature', nom: 'Nature verte', kinds: ['professeur', 'personnel'], family: 'light', accent: '#2e8b4f', pill: '#2e8b4f', ink: NAVY, year: 'plain', deco: 'wash-green', footer: 'qr-words', words: ['Éduquer', 'Inspirer', 'Transformer'], footIcon: <Leaf color="#2e8b4f" fill="#3aa564" /> },
  { key: 'marine', nom: 'Marine & or', kinds: ['professeur', 'direction'], family: 'header', accent: NAVY, pill: '#f2c94c', pillText: NAVY, ink: NAVY, year: 'bar', footer: 'qr-words', words: ['Savoir', 'Partager', 'Bâtir'] },
  { key: 'bordeaux', nom: 'Bordeaux direction', kinds: ['direction'], family: 'light', accent: '#8f2a35', pill: '#9b2c38', ink: NAVY, year: 'tab', deco: 'band-red', footer: 'sign', tagline: 'Leadership\nau service de l’éducation' },
  { key: 'nuit', nom: 'Nuit dorée', kinds: ['direction', 'personnel'], family: 'dark', accent: '#e2bd6a', pill: '#e8c36e', pillText: NAVY, ink: '#fff', year: 'plain', footer: 'qr-words', words: ['Écouter • Accompagner • Réussir'] },
  { key: 'ciel', nom: 'Bleu ciel', kinds: ['personnel'], family: 'light', accent: '#1d4fa8', pill: '#1d4fa8', ink: NAVY, year: 'plain', deco: 'blobs', footer: 'qr-words', words: ['Service', 'Respect', 'Collaboration'], footIcon: <Users color="#1d4fa8" fill="#1d4fa8" /> },
  { key: 'orange', nom: 'Orange vif', kinds: ['personnel', 'professeur'], family: 'light', accent: '#f08c00', pill: '#f59a23', ink: NAVY, year: 'none', deco: 'wave-orange', footer: 'qr-words', words: ['Lire', 'Apprendre', 'Grandir'], footIcon: <BookOpen color="#f08c00" /> },
  { key: 'turquoise', nom: 'Turquoise', kinds: ['personnel'], family: 'light', accent: '#0f9e8f', pill: '#11a596', ink: NAVY, year: 'plain', deco: 'teal', footer: 'qr-words', words: ['Respect', 'Propreté', 'Bien-être'], footIcon: <Leaf color="#0f9e8f" fill="#17b3a1" />, tagline: 'Un environnement\npropre pour mieux\napprendre' },
  { key: 'minimal', nom: 'Minimal gris', kinds: ['professeur', 'personnel', 'direction'], family: 'light', accent: '#3b4658', pill: '#3b4658', ink: '#1d2430', year: 'plain', footer: 'qr-words', words: ['Rigueur', 'Respect'] },
  { key: 'haiti', nom: 'Bleu & rouge', kinds: ['professeur', 'direction', 'personnel'], family: 'header', accent: '#00209f', pill: '#d21034', ink: NAVY, year: 'bar', footer: 'qr-words', words: ['L’union', 'fait la force'] },
  { key: 'violet', nom: 'Violet & rose', kinds: ['professeur', 'personnel'], family: 'header', accent: '#5b2a86', pill: '#e75a9b', ink: '#2c1544', year: 'bar', footer: 'qr-words', words: ['Créer', 'Partager'] },
  { key: 'emeraude', nom: 'Émeraude nuit', kinds: ['direction', 'professeur'], family: 'dark', accent: '#4fd1a5', pill: '#4fd1a5', pillText: '#06281e', ink: '#fff', year: 'plain', footer: 'qr-words', words: ['Servir avec excellence'], bg: 'linear-gradient(160deg,#0d4535,#062a20)' },
  // Élèves
  { key: 'eleve-bleu', nom: 'Élève — bleu', kinds: ['eleve'], family: 'student', accent: '#1d4fa8', pill: '#1d4fa8', ink: NAVY, year: 'tab', footer: 'qr-words', footBar: 'CARTE D’IDENTITÉ SCOLAIRE' },
  { key: 'eleve-vert', nom: 'Élève — vert', kinds: ['eleve'], family: 'student', accent: '#2e8b4f', pill: '#2e8b4f', ink: '#123b25', year: 'tab', deco: 'wash-green', footer: 'qr-words', footBar: 'CARTE D’IDENTITÉ SCOLAIRE' },
  { key: 'eleve-marine', nom: 'Élève — marine & or', kinds: ['eleve'], family: 'header', accent: NAVY, pill: '#f2c94c', pillText: NAVY, ink: NAVY, year: 'bar', footer: 'qr-words', words: ['Discipline', 'Excellence', 'Avenir'] },
  { key: 'eleve-rouge', nom: 'Élève — rouge', kinds: ['eleve'], family: 'student', accent: '#c62f3e', pill: '#c62f3e', ink: '#3a1016', year: 'tab', footer: 'qr-words', footBar: 'CARTE D’IDENTITÉ SCOLAIRE' },
  { key: 'eleve-orange', nom: 'Élève — orange', kinds: ['eleve'], family: 'student', accent: '#e07800', pill: '#f08c00', ink: '#3a2000', year: 'tab', deco: 'wave-orange', footer: 'qr-words', footBar: 'CARTE D’IDENTITÉ SCOLAIRE' },
  { key: 'eleve-violet', nom: 'Élève — violet', kinds: ['eleve'], family: 'header', accent: '#5b2a86', pill: '#e75a9b', ink: '#2c1544', year: 'bar', footer: 'qr-words', words: ['Apprendre', 'Oser', 'Réussir'] },
  { key: 'eleve-haiti', nom: 'Élève — bleu & rouge', kinds: ['eleve'], family: 'header', accent: '#00209f', pill: '#d21034', ink: NAVY, year: 'bar', footer: 'qr-words', words: ['Travail', 'Discipline', 'Réussite'] },
  { key: 'eleve-nuit', nom: 'Élève — nuit', kinds: ['eleve'], family: 'dark', accent: '#e2bd6a', pill: '#e8c36e', pillText: NAVY, ink: '#fff', year: 'plain', footer: 'qr-words', words: ['Discipline • Excellence'] },
];

/** Modèle personnalisé de l'école → modèle affichable (part d'un modèle de base). */
export function modelToTpl(m: BadgeModel): BadgeTpl | null {
  const base = BADGE_TEMPLATES.find((t) => t.key === m.base);
  if (!base) return null;
  return { ...base, key: m.key, nom: m.nom, kinds: m.kinds, accent: m.accent, pill: m.pill, pillText: m.pillText, ink: m.ink ?? base.ink, photo: m.photo, champs: m.champs, footBar: m.footBar || base.footBar, words: m.words?.length ? m.words : base.words, custom: true };
}

/** Fond d'un modèle sombre : celui du modèle, ou un dégradé de la couleur principale choisie par l'école. */
const darkBg = (tpl: BadgeTpl) => (tpl.custom ? `linear-gradient(160deg, ${tpl.accent}, color-mix(in srgb, ${tpl.accent} 55%, #000))` : tpl.bg ?? 'linear-gradient(160deg,#0f2a5c,#0a1f47)');

const Row = ({ icon, k, v, color }: { icon: ReactNode; k: string; v?: string; color?: string }) => (
  <>
    <span style={{ color }}>{icon}</span><span>{k}</span><span>:</span><span style={{ fontWeight: 500 }}>{v || '-'}</span>
  </>
);

function Header({ school, light, color = NAVY }: { school: SchoolT; light?: boolean; color?: string }) {
  return (
    <div className="hdr">
      <DocLogo school={school} size={26} mono={light ? '#fff' : undefined} />
      <div><b style={{ color: light ? '#fff' : color }}>{school.nom}</b><span style={{ color: light ? '#cfd8ea' : color }}>{school.devise.toUpperCase()}</span></div>
    </div>
  );
}

function Year({ tpl, year, light }: { tpl: BadgeTpl; year: string; light?: boolean }) {
  const [a, b] = year.split(' - ');
  if (tpl.year === 'tab') return <div className="yr" style={{ background: tpl.accent, color: '#fff' }}>{a}<br />{b}</div>;
  if (tpl.year === 'plain') return <div className="yr" style={{ color: light ? '#fff' : tpl.ink, fontWeight: 600, fontSize: '3mm' }}>{a}<br />{b}</div>;
  return null;
}

function Deco({ tpl }: { tpl: BadgeTpl }) {
  const s: CSSProperties = { position: 'absolute', pointerEvents: 'none' };
  if (tpl.deco === 'wash-green') return <svg viewBox="0 0 100 140" preserveAspectRatio="none" style={{ ...s, inset: 0, width: '100%', height: '100%' }}><path d="M100 40C70 70 60 110 30 140h70Z" fill="#e5f4ea" /><path d="M100 90c-20 20-40 40-70 50h70Z" fill="#d3eedd" /></svg>;
  if (tpl.deco === 'blobs') return <svg viewBox="0 0 100 140" preserveAspectRatio="none" style={{ ...s, inset: 0, width: '100%', height: '100%' }}><circle cx="96" cy="8" r="20" fill="#e5efff" /><circle cx="100" cy="80" r="26" fill="#eef4ff" /><circle cx="-4" cy="132" r="22" fill="#e5efff" /></svg>;
  if (tpl.deco === 'wave-orange') return <svg viewBox="0 0 100 140" preserveAspectRatio="none" style={{ ...s, inset: 0, width: '100%', height: '100%' }}><path d="M70 0h30v40C90 30 78 18 70 0Z" fill="#f7b733" /><path d="M0 110c14 10 22 20 30 30H0Z" fill="#f08c00" /><path d="M100 50c-6 30-4 60 0 90V50Z" fill="#ffd36b" /></svg>;
  if (tpl.deco === 'teal') return <svg viewBox="0 0 100 140" preserveAspectRatio="none" style={{ ...s, inset: 0, width: '100%', height: '100%' }}><path d="M0 128c30-8 60-6 100 4v8H0Z" fill="#bfe9e3" /><path d="M0 134c30-4 60-2 100 4v2H0Z" fill="#7fd3c8" /></svg>;
  if (tpl.deco === 'band-red') return <div style={{ ...s, left: 0, top: '26mm', bottom: 0, width: '3.4mm', background: tpl.accent, borderTopRightRadius: '3mm' }} />;
  return null;
}

/** Une carte badge. */
export function IdCard({ p, tpl, school, year }: { p: BadgePerson; tpl: BadgeTpl; school: SchoolT; year: string }) {
  const verify = verifyUrl(p.matricule);
  const name = <>{p.prenom}<br />{p.nom}</>;

  if (tpl.family === 'header') {
    const isStudent = p.kind === 'eleve';
    return (
      <div className="idc">
        <div style={{ position: 'absolute', inset: '0 0 auto 0', height: '40mm', background: tpl.accent, borderBottomLeftRadius: '60% 12mm' }} />
        <Header school={school} light />
        <div style={photoBox(tpl, { position: 'absolute', left: '3.6mm', top: '13mm', width: '22mm', height: '22mm', border: `1mm solid ${tpl.pill}`, overflow: 'hidden', background: '#fff' }, '50%')}><PhotoOrSilhouette src={p.photo} style={{ width: '100%', height: '100%' }} /></div>
        <div style={{ position: 'absolute', left: '28mm', right: '2mm', top: '15mm', color: '#fff' }}>
          <div className="nm" style={nameSize(p)}>{p.prenom} {p.nom}</div>
          <div style={{ marginTop: '1.6mm' }}><span className="pill" style={{ background: tpl.pill, color: tpl.pillText ?? '#fff', ...pillSize(p.role) }}>{p.role}</span></div>
          {!isStudent && <div className="sub" style={{ color: '#fff' }}>{p.sub}</div>}
        </div>
        <div className="rows" style={{ top: '43mm', right: '18mm', color: tpl.ink }}>
          <InfoRows p={p} tpl={tpl} color={tpl.accent} />
        </div>
        <div style={{ position: 'absolute', right: '3mm', bottom: '9mm', textAlign: 'center', fontSize: '2.2mm', color: tpl.ink, lineHeight: 1.25 }}>
          <QR text={verify} size="13mm" />
          {(tpl.words ?? []).map((w) => <div key={w} style={{ fontWeight: 600 }}>{w}</div>)}
        </div>
        {!isStudent && p.diplome && <div className="row" style={{ position: 'absolute', left: '4mm', bottom: '10.5mm', fontSize: '2.3mm', gap: '1.5mm', color: NAVY }}><GraduationCap size={'3mm' as unknown as number} />{p.diplome}</div>}
        {isStudent && <div style={{ position: 'absolute', left: '4mm', bottom: '9mm', fontSize: '2.1mm' }}><Signature image={school.signatureDirecteur} w={70} /><div style={{ borderTop: '.2mm solid #9aa8c4', width: '22mm' }} />Le Directeur</div>}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '6mm', background: tpl.accent, color: '#fff', fontWeight: 700, fontSize: '2.6mm', display: 'grid', placeItems: 'center', borderTop: `.8mm solid ${tpl.pill}` }}>{tpl.footBar && tpl.custom ? `${tpl.footBar} · ${year}` : year}</div>
      </div>
    );
  }

  if (tpl.family === 'dark') {
    return (
      <div className="idc" style={{ background: darkBg(tpl), color: '#fff' }}>
        <svg viewBox="0 0 100 140" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}><path d="M100 98 62 140h38Z" fill={tpl.custom ? tpl.pill : tpl.accent} opacity=".85" /><path d="M100 84 48 140h10l42-46Z" fill={tpl.custom ? tpl.pill : tpl.accent} opacity=".35" /></svg>
        <Header school={school} light />
        <Year tpl={tpl} year={year} light />
        <div style={photoBox(tpl, { position: 'absolute', left: '4mm', top: '15mm', width: '19mm', height: '21mm', overflow: 'hidden' })}><PhotoOrSilhouette src={p.photo} style={{ width: '100%', height: '100%' }} /></div>
        <div style={{ position: 'absolute', left: '25.5mm', right: '2mm', top: '17mm' }}>
          <div className="nm" style={{ color: '#fff', ...nameSize(p) }}>{p.prenom} {p.nom}</div>
          <div style={{ marginTop: '2mm' }}><span className="pill" style={{ background: tpl.pill, color: tpl.pillText ?? '#fff', ...pillSize(p.role) }}>{p.role}</span></div>
          {p.sub && <div className="sub" style={{ color: '#dfe6f3' }}>{p.sub}</div>}
        </div>
        <div className="rows" style={{ top: '41mm', right: '4mm', color: '#fff' }}>
          <InfoRows p={p} tpl={tpl} color={tpl.pill} />
        </div>
        {p.diplome && <div className="row" style={{ position: 'absolute', left: '4mm', right: '20mm', top: '67mm', fontSize: '2.3mm', gap: '1.5mm' }}><GraduationCap size={11} />{p.diplome}</div>}
        <div style={{ position: 'absolute', left: '4mm', right: '20mm', bottom: '4.5mm', fontStyle: 'italic', fontSize: '2.3mm', color: '#e9eef8' }}>{tpl.footBar && tpl.custom ? tpl.footBar : p.kind === 'eleve' ? <>Valable pour l’année <b>{year}</b></> : tpl.words?.[0]}</div>
        <div style={{ position: 'absolute', right: '4mm', bottom: '3.5mm', background: '#fff', padding: '.8mm', borderRadius: '1mm' }}><QR text={verify} size="12mm" /></div>
      </div>
    );
  }

  // light & student
  const isStudent = tpl.family === 'student';
  const bandLeft = tpl.deco === 'band-red' ? '6mm' : '4mm';
  return (
    <div className="idc">
      <Deco tpl={tpl} />
      <Header school={school} />
      <Year tpl={tpl} year={year} />
      {tpl.tagline && tpl.deco === 'teal' && (
        <div style={{ position: 'absolute', left: '26mm', right: '3mm', top: '13.5mm', textAlign: 'center', fontSize: '2.1mm', color: NAVY, lineHeight: 1.25, whiteSpace: 'pre-line' }}><Home size={14} color="#0f9e8f" fill="#0f9e8f" style={{ display: 'block', margin: '0 auto 0.6mm' }} />{tpl.tagline}</div>
      )}
      <div style={photoBox(tpl, { position: 'absolute', left: bandLeft, top: '15mm', width: '19mm', height: '21mm', overflow: 'hidden' })}><PhotoOrSilhouette src={p.photo} style={{ width: '100%', height: '100%' }} /></div>
      <div style={{ position: 'absolute', left: tpl.deco === 'band-red' ? '27.5mm' : '25.5mm', right: '2mm', top: tpl.deco === 'teal' ? '27mm' : '17.5mm' }}>
        <div className="nm" style={{ color: tpl.ink, ...nameSize(p) }}>{tpl.deco === 'teal' ? `${p.prenom} ${p.nom}` : name}</div>
        <div style={{ marginTop: '1.6mm' }}><span className="pill" style={{ background: tpl.pill, color: tpl.pillText ?? '#fff', ...pillSize(p.role) }}>{p.role}</span></div>
        {p.sub && !isStudent && <div className="sub" style={{ color: '#2a3550' }}>{p.sub}</div>}
      </div>
      <div className="rows" style={{ top: tpl.deco === 'teal' ? '44mm' : '40.5mm', left: bandLeft, color: '#1d2a44' }}>
        <InfoRows p={p} tpl={tpl} color={tpl.accent} />
      </div>
      <div className="foot" style={{ left: bandLeft, bottom: tpl.footBar ? '8.5mm' : '4.5mm', height: '15mm' }}>
        {tpl.footer === 'barcode' && (<><div style={{ textAlign: 'center', fontSize: '2.2mm', width: '24mm', overflow: 'hidden' }}><Barcode value={p.matricule} height={30} width={1.1} /><div>{p.matricule}</div></div><div className="vline" /><div className="d-sign" style={{ fontSize: '2.2mm', flex: 1 }}><Signature image={school.signatureDirecteur} w={70} /><div style={{ borderTop: '.2mm solid #9aa8c4', width: '100%' }} />Le Directeur</div></>)}
        {tpl.footer === 'qr-words' && (<><QR text={verify} size="14mm" /><div className="vline" />{tpl.footIcon && <span style={{ display: 'grid', placeItems: 'center', width: '7mm' }}>{tpl.footIcon}</span>}<div className="words" style={{ color: tpl.ink, fontWeight: 500 }}>{isStudent ? <>Valable pour l’année<br /><b>{year}</b><div style={{ marginTop: '1mm' }}><Signature image={school.signatureDirecteur} w={56} /></div></> : (tpl.words ?? []).map((w) => <div key={w}>{w}</div>)}</div></>)}
        {tpl.footer === 'sign' && (<><div style={{ fontStyle: 'italic', fontSize: '2.3mm', color: tpl.accent, whiteSpace: 'pre-line', flex: 1 }}>{tpl.tagline}</div><div className="d-sign" style={{ fontSize: '2.2mm', width: '22mm' }}><Signature image={school.signatureDirecteur} w={70} /><div style={{ borderTop: '.2mm solid #9aa8c4', width: '100%' }} />Le Directeur</div></>)}
      </div>
      {tpl.footBar && <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '6.5mm', background: isStudent || tpl.custom ? tpl.accent : '#123a7a', color: '#fff', fontSize: '2.4mm', display: 'grid', placeItems: 'center', fontStyle: isStudent ? 'normal' : 'italic', fontWeight: isStudent ? 700 : 400, letterSpacing: isStudent ? '.06em' : 0 }}>{tpl.footBar}</div>}
    </div>
  );
}

/** Verso commun : règlement + contacts + QR. */
export function IdCardBack({ school, tpl, kind }: { school: SchoolT; tpl: BadgeTpl; kind: BadgeKind }) {
  const lines = kind === 'eleve'
    ? ['Cette carte est personnelle et doit être portée dans l’enceinte de l’école.', 'En cas de perte, prévenir immédiatement le secrétariat.', 'Si vous trouvez cette carte, merci de la rapporter à l’école.']
    : ['Cette carte est la propriété de l’école.', 'Elle doit être portée de manière visible pendant le service.', 'En cas de perte, prévenir l’administration.'];
  return (
    <div className="idc" style={{ background: tpl.family === 'dark' || tpl.family === 'header' ? tpl.accent : '#fff', color: tpl.family === 'dark' || tpl.family === 'header' ? '#fff' : NAVY }}>
      <div style={{ position: 'absolute', inset: '6mm 5mm', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '2.5mm' }}>
        <DocLogo school={school} size={46} mono={tpl.family === 'dark' || tpl.family === 'header' ? '#fff' : undefined} />
        <b style={{ fontSize: '3.6mm' }}>{school.nom}</b>
        <div style={{ fontSize: '2.2mm', lineHeight: 1.5 }}>{lines.map((l) => <div key={l}>• {l}</div>)}</div>
        <div style={{ marginTop: 'auto', fontSize: '2.3mm', lineHeight: 1.5 }}>{school.adresse}, {school.commune}, Haïti<br />{school.telephone} · {school.email}<br />{school.siteWeb}</div>
      </div>
    </div>
  );
}

/** Badge au format paysage (86 × 54 mm, format carte bancaire). Reprend les couleurs du modèle choisi. */
export function IdCardLandscape({ p, tpl, school, year }: { p: BadgePerson; tpl: BadgeTpl; school: SchoolT; year: string }) {
  const verify = verifyUrl(p.matricule);
  const dark = tpl.family === 'dark';
  const ink = dark ? '#fff' : NAVY;
  const isStudent = p.kind === 'eleve';
  const rows = rowData(p, tpl, true).map(([, icon, k, v]) => [icon, k, v] as [ReactNode, string, string | undefined]);
  return (
    <div className="idc idc-l" style={{ background: dark ? darkBg(tpl) : '#fff', color: ink }}>
      <div style={{ position: 'absolute', inset: '0 0 auto 0', height: '12.5mm', background: dark ? 'transparent' : tpl.accent, display: 'flex', alignItems: 'center', gap: '2mm', padding: '0 3.5mm' }}>
        <span style={{ background: '#fff', borderRadius: '1.6mm', padding: '.6mm', display: 'grid' }}><DocLogo school={school} size={20} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <b style={{ display: 'block', color: '#fff', fontSize: '3.3mm', fontWeight: 800, whiteSpace: 'nowrap' }}>{school.nom}</b>
          <span style={{ display: 'block', color: 'rgba(255,255,255,.8)', fontSize: '1.5mm', letterSpacing: '.06em', fontWeight: 600 }}>{school.devise.toUpperCase()}</span>
        </div>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: '2.4mm', textAlign: 'right', lineHeight: 1.1, whiteSpace: 'pre-line' }}>{year.replace(' - ', '\n')}</span>
      </div>
      <div style={photoBox(tpl, { position: 'absolute', left: '3.5mm', top: '15mm', width: '21mm', height: '25mm', overflow: 'hidden', border: dark ? `.6mm solid ${tpl.accent}` : undefined })}>
        <PhotoOrSilhouette src={p.photo} style={{ width: '100%', height: '100%' }} />
      </div>
      <div style={{ position: 'absolute', left: '27.5mm', right: '3mm', top: '14.5mm' }}>
        <div style={{ fontSize: (p.prenom + p.nom).length > 22 ? '3.2mm' : '3.8mm', fontWeight: 800, lineHeight: 1.1, color: ink }}>{p.prenom} {p.nom}</div>
        <div style={{ marginTop: '1.2mm' }}><span className="pill" style={{ background: tpl.pill, color: tpl.pillText ?? '#fff', ...pillSize(p.role) }}>{p.role}</span>{p.sub && !isStudent && <span style={{ fontSize: '2.2mm', marginLeft: '1.5mm' }}>{p.sub}</span>}</div>
      </div>
      <div style={{ position: 'absolute', left: '27.5mm', right: '18mm', top: '26.5mm', display: 'grid', gridTemplateColumns: '3.4mm 12mm 1fr', rowGap: '.9mm', fontSize: '2.05mm', alignItems: 'center' }}>
        {rows.map(([icon, k, v]) => (
          <span key={k} style={{ display: 'contents' }}><span className="lic" style={{ color: dark ? tpl.pill : tpl.accent, display: 'grid' }}>{icon}</span><span style={{ opacity: .75 }}>{k}</span><span style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v || '-'}</span></span>
        ))}
      </div>
      <div style={{ position: 'absolute', right: '3mm', bottom: '4.5mm', background: '#fff', padding: '.6mm', borderRadius: '1mm' }}><QR text={verify} size="13mm" /></div>
      <div style={{ position: 'absolute', left: '3.5mm', bottom: '4mm', fontSize: '1.9mm', color: ink, opacity: .85 }}>{tpl.custom && tpl.footBar ? tpl.footBar : isStudent ? 'Carte d’identité scolaire' : p.diplome ?? ''}</div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '2.2mm', background: dark ? tpl.accent : tpl.pill }} />
    </div>
  );
}

export function IdCardBackLandscape({ school, tpl, kind }: { school: SchoolT; tpl: BadgeTpl; kind: BadgeKind }) {
  const lines = kind === 'eleve'
    ? ['Carte personnelle, à porter dans l’enceinte de l’école.', 'En cas de perte, prévenir le secrétariat.', 'Si vous trouvez cette carte, merci de la rapporter à l’école.']
    : ['Cette carte est la propriété de l’école.', 'À porter de manière visible pendant le service.', 'En cas de perte, prévenir l’administration.'];
  return (
    <div className="idc idc-l" style={{ background: tpl.family === 'dark' || tpl.family === 'header' ? tpl.accent : '#fff', color: tpl.family === 'dark' || tpl.family === 'header' ? '#fff' : NAVY }}>
      <div style={{ position: 'absolute', inset: '5mm 5mm', display: 'flex', gap: '4mm', alignItems: 'center' }}>
        <DocLogo school={school} size={52} mono={tpl.family === 'dark' || tpl.family === 'header' ? '#fff' : undefined} />
        <div style={{ fontSize: '2.2mm', lineHeight: 1.55 }}>
          <b style={{ fontSize: '3.4mm', display: 'block', marginBottom: '1mm' }}>{school.nom}</b>
          {lines.map((l) => <div key={l}>• {l}</div>)}
          <div style={{ marginTop: '1.5mm', opacity: .85 }}>{school.adresse}, {school.commune} · {school.telephone}<br />{school.email} · {school.siteWeb}</div>
        </div>
      </div>
    </div>
  );
}
