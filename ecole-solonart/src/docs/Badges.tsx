// Badges (cartes d'identité 63 × 86 mm) — modèles inspirés des maquettes.
// Trois familles de catégories : Professeurs, Direction, Personnel, et un jeu distinct pour les Élèves.
import type { CSSProperties, ReactNode } from 'react';
import { User, Phone, Mail, MapPin, CalendarDays, GraduationCap, Users, BookOpen, Home, Droplet, School, Hash, Leaf } from 'lucide-react';
import type { School as SchoolT } from '../data/types';
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
}

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
  // Élèves
  { key: 'eleve-bleu', nom: 'Élève — bleu', kinds: ['eleve'], family: 'student', accent: '#1d4fa8', pill: '#1d4fa8', ink: NAVY, year: 'tab', footer: 'qr-words', footBar: 'CARTE D’IDENTITÉ SCOLAIRE' },
  { key: 'eleve-vert', nom: 'Élève — vert', kinds: ['eleve'], family: 'student', accent: '#2e8b4f', pill: '#2e8b4f', ink: '#123b25', year: 'tab', deco: 'wash-green', footer: 'qr-words', footBar: 'CARTE D’IDENTITÉ SCOLAIRE' },
  { key: 'eleve-marine', nom: 'Élève — marine & or', kinds: ['eleve'], family: 'header', accent: NAVY, pill: '#f2c94c', pillText: NAVY, ink: NAVY, year: 'bar', footer: 'qr-words', words: ['Discipline', 'Excellence', 'Avenir'] },
];

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
  const verify = `${school.siteWeb}/badge?m=${p.matricule}`;
  const icon = { user: <User />, phone: <Phone />, mail: <Mail />, pin: <MapPin />, cal: <CalendarDays />, grad: <GraduationCap /> };
  const name = <>{p.prenom}<br />{p.nom}</>;

  if (tpl.family === 'header') {
    const isStudent = p.kind === 'eleve';
    return (
      <div className="idc">
        <div style={{ position: 'absolute', inset: '0 0 auto 0', height: '40mm', background: tpl.accent, borderBottomLeftRadius: '60% 12mm' }} />
        <Header school={school} light />
        <div style={{ position: 'absolute', left: '3.6mm', top: '13mm', width: '22mm', height: '22mm', borderRadius: '50%', border: '1mm solid #f2c94c', overflow: 'hidden', background: '#fff' }}><PhotoOrSilhouette src={p.photo} style={{ width: '100%', height: '100%' }} /></div>
        <div style={{ position: 'absolute', left: '28mm', right: '2mm', top: '15mm', color: '#fff' }}>
          <div className="nm" style={nameSize(p)}>{p.prenom} {p.nom}</div>
          <div style={{ marginTop: '1.6mm' }}><span className="pill" style={{ background: tpl.pill, color: tpl.pillText ?? '#fff', ...pillSize(p.role) }}>{p.role}</span></div>
          {!isStudent && <div className="sub" style={{ color: '#fff' }}>{p.sub}</div>}
        </div>
        <div className="rows" style={{ top: '43mm', right: '18mm', color: tpl.ink }}>
          {isStudent ? (
            <>
              <Row icon={<School />} k="Classe" v={p.classe} color={NAVY} />
              <Row icon={<Hash />} k="Matricule" v={p.matricule} color={NAVY} />
              <Row icon={icon.cal} k="Né(e) le" v={p.dateNaissance} color={NAVY} />
              <Row icon={icon.phone} k="Parent" v={p.parentTel} color={NAVY} />
              <Row icon={<Droplet />} k="Groupe" v={p.groupeSanguin} color={NAVY} />
            </>
          ) : (
            <>
              <Row icon={icon.user} k="Matricule" v={p.matricule} color={NAVY} />
              <Row icon={icon.phone} k="Téléphone" v={p.telephone} color={NAVY} />
              <Row icon={icon.mail} k="Email" v={p.email} color={NAVY} />
              <Row icon={icon.pin} k="Adresse" v={p.adresse} color={NAVY} />
              {p.dateNaissance && <Row icon={icon.cal} k="Né le" v={p.dateNaissance} color={NAVY} />}
            </>
          )}
        </div>
        <div style={{ position: 'absolute', right: '3mm', bottom: '9mm', textAlign: 'center', fontSize: '2.2mm', color: NAVY, lineHeight: 1.25 }}>
          <QR text={verify} size="13mm" />
          {(tpl.words ?? []).map((w) => <div key={w} style={{ fontWeight: 600 }}>{w}</div>)}
        </div>
        {!isStudent && p.diplome && <div className="row" style={{ position: 'absolute', left: '4mm', bottom: '10.5mm', fontSize: '2.3mm', gap: '1.5mm', color: NAVY }}><GraduationCap size={'3mm' as unknown as number} />{p.diplome}</div>}
        {isStudent && <div style={{ position: 'absolute', left: '4mm', bottom: '9mm', fontSize: '2.1mm' }}><Signature image={school.signatureDirecteur} w={70} /><div style={{ borderTop: '.2mm solid #9aa8c4', width: '22mm' }} />Le Directeur</div>}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '6mm', background: tpl.accent, color: '#fff', fontWeight: 700, fontSize: '2.6mm', display: 'grid', placeItems: 'center', borderTop: '.8mm solid #f2c94c' }}>{year}</div>
      </div>
    );
  }

  if (tpl.family === 'dark') {
    return (
      <div className="idc" style={{ background: 'linear-gradient(160deg,#0f2a5c,#0a1f47)', color: '#fff' }}>
        <svg viewBox="0 0 100 140" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}><path d="M100 98 62 140h38Z" fill={tpl.accent} opacity=".85" /><path d="M100 84 48 140h10l42-46Z" fill={tpl.accent} opacity=".35" /></svg>
        <Header school={school} light />
        <Year tpl={tpl} year={year} light />
        <div style={{ position: 'absolute', left: '4mm', top: '15mm', width: '19mm', height: '21mm', borderRadius: '2mm', overflow: 'hidden' }}><PhotoOrSilhouette src={p.photo} style={{ width: '100%', height: '100%' }} /></div>
        <div style={{ position: 'absolute', left: '25.5mm', right: '2mm', top: '17mm' }}>
          <div className="nm" style={{ color: '#fff', ...nameSize(p) }}>{p.prenom} {p.nom}</div>
          <div style={{ marginTop: '2mm' }}><span className="pill" style={{ background: tpl.pill, color: tpl.pillText ?? '#fff', ...pillSize(p.role) }}>{p.role}</span></div>
          {p.sub && <div className="sub" style={{ color: '#dfe6f3' }}>{p.sub}</div>}
        </div>
        <div className="rows" style={{ top: '41mm', right: '4mm', color: '#fff' }}>
          <Row icon={icon.user} k="Matricule" v={p.matricule} color="#fff" />
          <Row icon={icon.phone} k="Téléphone" v={p.telephone} color="#fff" />
          <Row icon={icon.mail} k="Email" v={p.email} color="#fff" />
          <Row icon={icon.pin} k="Adresse" v={p.adresse} color="#fff" />
          {p.dateNaissance && <Row icon={icon.cal} k="Né le" v={p.dateNaissance} color="#fff" />}
        </div>
        {p.diplome && <div className="row" style={{ position: 'absolute', left: '4mm', right: '20mm', top: '67mm', fontSize: '2.3mm', gap: '1.5mm' }}><GraduationCap size={11} />{p.diplome}</div>}
        <div style={{ position: 'absolute', left: '4mm', bottom: '4.5mm', fontStyle: 'italic', fontSize: '2.3mm', color: '#e9eef8' }}>{tpl.words?.[0]}</div>
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
      <div style={{ position: 'absolute', left: bandLeft, top: '15mm', width: '19mm', height: '21mm', borderRadius: '2mm', overflow: 'hidden' }}><PhotoOrSilhouette src={p.photo} style={{ width: '100%', height: '100%' }} /></div>
      <div style={{ position: 'absolute', left: tpl.deco === 'band-red' ? '27.5mm' : '25.5mm', right: '2mm', top: tpl.deco === 'teal' ? '27mm' : '17.5mm' }}>
        <div className="nm" style={{ color: tpl.ink, ...nameSize(p) }}>{tpl.deco === 'teal' ? `${p.prenom} ${p.nom}` : name}</div>
        <div style={{ marginTop: '1.6mm' }}><span className="pill" style={{ background: tpl.pill, color: tpl.pillText ?? '#fff', ...pillSize(p.role) }}>{p.role}</span></div>
        {p.sub && !isStudent && <div className="sub" style={{ color: '#2a3550' }}>{p.sub}</div>}
      </div>
      <div className="rows" style={{ top: tpl.deco === 'teal' ? '44mm' : '40.5mm', left: bandLeft, color: '#1d2a44' }}>
        {isStudent ? (
          <>
            <Row icon={<School />} k="Classe" v={p.classe} color={NAVY} />
            <Row icon={<Hash />} k="Matricule" v={p.matricule} color={NAVY} />
            <Row icon={icon.cal} k="Né(e) le" v={p.dateNaissance} color={NAVY} />
            <Row icon={icon.phone} k="Parent" v={p.parentTel} color={NAVY} />
            <Row icon={<Droplet />} k="Groupe" v={p.groupeSanguin} color={NAVY} />
          </>
        ) : (
          <>
            <Row icon={icon.user} k="Matricule" v={p.matricule} color={NAVY} />
            <Row icon={icon.phone} k="Téléphone" v={p.telephone} color={NAVY} />
            <Row icon={icon.mail} k="Email" v={p.email} color={NAVY} />
            <Row icon={icon.pin} k="Adresse" v={p.adresse} color={NAVY} />
            {tpl.deco === 'band-red' && p.dateNaissance && <Row icon={icon.cal} k="Née le" v={p.dateNaissance} color={NAVY} />}
          </>
        )}
      </div>
      <div className="foot" style={{ left: bandLeft, bottom: tpl.footBar ? '8.5mm' : '4.5mm', height: '15mm' }}>
        {tpl.footer === 'barcode' && (<><div style={{ textAlign: 'center', fontSize: '2.2mm', width: '24mm', overflow: 'hidden' }}><Barcode value={p.matricule} height={30} width={1.1} /><div>{p.matricule}</div></div><div className="vline" /><div className="d-sign" style={{ fontSize: '2.2mm', flex: 1 }}><Signature image={school.signatureDirecteur} w={70} /><div style={{ borderTop: '.2mm solid #9aa8c4', width: '100%' }} />Le Directeur</div></>)}
        {tpl.footer === 'qr-words' && (<><QR text={verify} size="14mm" /><div className="vline" />{tpl.footIcon && <span style={{ display: 'grid', placeItems: 'center', width: '7mm' }}>{tpl.footIcon}</span>}<div className="words" style={{ color: tpl.ink, fontWeight: 500 }}>{isStudent ? <>Valable pour l’année<br /><b>{year}</b><div style={{ marginTop: '1mm' }}><Signature image={school.signatureDirecteur} w={56} /></div></> : (tpl.words ?? []).map((w) => <div key={w}>{w}</div>)}</div></>)}
        {tpl.footer === 'sign' && (<><div style={{ fontStyle: 'italic', fontSize: '2.3mm', color: tpl.accent, whiteSpace: 'pre-line', flex: 1 }}>{tpl.tagline}</div><div className="d-sign" style={{ fontSize: '2.2mm', width: '22mm' }}><Signature image={school.signatureDirecteur} w={70} /><div style={{ borderTop: '.2mm solid #9aa8c4', width: '100%' }} />Le Directeur</div></>)}
      </div>
      {tpl.footBar && <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '6.5mm', background: isStudent ? tpl.accent : '#123a7a', color: '#fff', fontSize: '2.4mm', display: 'grid', placeItems: 'center', fontStyle: isStudent ? 'normal' : 'italic', fontWeight: isStudent ? 700 : 400, letterSpacing: isStudent ? '.06em' : 0 }}>{tpl.footBar}</div>}
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
