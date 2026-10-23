import { useEffect, useMemo, useRef } from 'react';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { db } from '../data/store';
import { classTeacherIds } from '../lib/regles';
import { classReport, sortedPeriods, appreciation, autoCouncil } from '../data/compute';
import type { ID, ReportCardEntry, School, Student } from '../data/types';
import { DefaultCrest } from '../components/Logo';

/** QR code en SVG (synchrone → s'imprime sans délai). */
export function QR({ text, size = 80, color = '#0d2a63', bg = '#fff' }: { text: string; size?: number | string; color?: string; bg?: string }) {
  const { n, path } = useMemo(() => {
    const qr = QRCode.create(text, { errorCorrectionLevel: 'M' });
    const m = qr.modules;
    let d = '';
    for (let y = 0; y < m.size; y++) for (let x = 0; x < m.size; x++) if (m.get(x, y)) d += `M${x + 2},${y + 2}h1v1h-1z`;
    return { n: m.size + 4, path: d };
  }, [text]);
  return (
    <svg className="qr" width={size} height={size} viewBox={`0 0 ${n} ${n}`} shapeRendering="crispEdges" style={{ background: bg }}>
      <path d={path} fill={color} />
    </svg>
  );
}

export function Barcode({ value, height = 40, width = 1.3 }: { value: string; height?: number; width?: number }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (ref.current) JsBarcode(ref.current, value, { format: 'CODE128', height, width, displayValue: false, margin: 0, background: 'transparent' });
  }, [value, height, width]);
  return <svg ref={ref} />;
}

/** Signature manuscrite stylisée (remplacée par l'image importée dans Paramètres). */
export function Signature({ image, w = 120, color = '#1b2c5c', variant = 0 }: { image?: string; w?: number; color?: string; variant?: number }) {
  if (image) return <img src={image} alt="Signature" style={{ width: w, height: w * 0.36, objectFit: 'contain' }} />;
  const paths = [
    'M6 34c10-18 20-28 24-22s-12 26-6 24 14-30 20-26-4 22 2 20 10-16 16-14 0 12 6 10 14-8 40-6',
    'M4 30c8-4 14-22 20-24s2 26 8 26 8-20 14-20-2 16 4 16 10-10 16-10 6 8 12 6 20-6 34-4M30 10c10 2 30 0 50-4',
    'M8 32c6-20 16-26 18-18s-6 22 0 20 12-24 20-22-2 18 6 16 12-14 20-12 2 10 10 8 18-4 28-2',
  ];
  return (
    <svg width={w} height={w * 0.36} viewBox="0 0 130 46" fill="none" aria-hidden="true">
      <path d={paths[variant % paths.length]} stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Seal({ name, size = 110, color = '#2457b3' }: { name: string; size?: number; color?: string }) {
  const id = `arc${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true" style={{ opacity: 0.85 }}>
      <circle cx="60" cy="60" r="56" fill="none" stroke={color} strokeWidth="2.5" />
      <circle cx="60" cy="60" r="42" fill="none" stroke={color} strokeWidth="1.2" />
      <defs><path id={id} d="M60,60 m-49,0 a49,49 0 1,1 98,0 a49,49 0 1,1 -98,0" /></defs>
      <text fontSize="10.5" fontWeight="800" fill={color} letterSpacing="1.5"><textPath href={`#${id}`} startOffset="2%">{name.toUpperCase()} • DISCIPLINE • EXCELLENCE • AVENIR •</textPath></text>
      <path d="M38 52c7-3 15-2 22 3 7-5 15-6 22-3v22c-7-3-15-2-22 3-7-5-15-6-22-3Z" fill="none" stroke={color} strokeWidth="2" />
      <path d="M60 55v22" stroke={color} strokeWidth="1.6" />
    </svg>
  );
}

export function DocLogo({ school, size = 60, mono }: { school: School; size?: number; mono?: string }) {
  if (school.logo) return <img src={school.logo} alt="Logo" style={{ width: size, height: size * 1.1, objectFit: 'contain', display: 'block' }} />;
  return <DefaultCrest size={size} mono={mono} />;
}

/** Silhouette grise (photo manquante) — identique aux maquettes. */
export function Silhouette({ bg = '#d9dde5', fg = '#6f7682' }: { bg?: string; fg?: string }) {
  return (
    <svg viewBox="0 0 100 110" width="100%" height="100%" preserveAspectRatio="xMidYMax slice" style={{ background: bg, display: 'block' }}>
      <circle cx="50" cy="40" r="20" fill={fg} />
      <path d="M12 110c2-26 18-38 38-38s36 12 38 38Z" fill={fg} />
      <path d="M44 74l6 10 6-10" fill="#fff" opacity=".9" />
      <path d="M48 80l2 20 2-20Z" fill="#3a3f48" />
    </svg>
  );
}

export function PhotoOrSilhouette({ src, style, className }: { src?: string; style?: React.CSSProperties; className?: string }) {
  if (src) return <img src={src} alt="" className={className} style={{ objectFit: 'cover', ...style }} />;
  return <div className={className} style={{ overflow: 'hidden', ...style }}><Silhouette /></div>;
}

// ------------------------------------------------------------------
// Données d'un bulletin
// ------------------------------------------------------------------
export interface BulletinData {
  school: School;
  student: Student;
  scope: ID | 'annuel';
  periodLabel: string;
  yearLabel: string;
  report: NonNullable<ReturnType<typeof classReport>>;
  me: NonNullable<ReturnType<typeof classReport>>['students'][number];
  entry: ReportCardEntry;
  absences: { justifiees: number; nonJustifiees: number; retards: number; jours: number; presents: number };
  titulaire: string;
  mention: ReturnType<typeof appreciation>;
  periods: ReturnType<typeof sortedPeriods>;
  verifyUrl: string;
}

export function buildBulletin(studentId: ID, scope: ID | 'annuel'): BulletinData | null {
  const student = db.get('students', studentId);
  const school = db.get('school', 'main');
  if (!student || !school) return null;
  const report = classReport(student.classeId, scope);
  const me = report?.students.find((s) => s.student.id === studentId);
  if (!report || !me) return null;
  const periods = sortedPeriods();
  const p = periods.find((x) => x.id === scope);
  const year = db.get('years', school.anneeCourante);
  const att = db.list('attendance').filter((a) => a.eleveId === studentId && (!p || (a.date >= p.debut && a.date <= p.fin)));
  const days = new Set(db.list('attendance').filter((a) => a.classeId === student.classeId && !a.eleveId).map((a) => a.date)).size;
  const absJ = att.filter((a) => a.statut === 'Excusé').length;
  const absNJ = att.filter((a) => a.statut === 'Absent').length;
  // Préscolaire : tous les co-titulaires figurent (et signent) sur le livret.
  const tits = (report.classe.niveau === 'Préscolaire' ? classTeacherIds(report.classe) : [report.classe.titulaireId]).map((id) => db.get('staff', id)).filter((x): x is NonNullable<typeof x> => !!x);
  const seuil = school.bareme === 100 ? school.seuilReussite / 5 : school.seuilReussite;
  const saved = db.list('reportEntries').find((e) => e.eleveId === studentId && e.periodeId === scope);
  // Valeurs automatiques, remplacées champ par champ par ce que le conseil de classe a saisi.
  const auto = autoCouncil(me, scope, seuil);
  const entry: ReportCardEntry = {
    id: saved?.id ?? '', updatedAt: saved?.updatedAt ?? 0, eleveId: studentId, periodeId: scope,
    appreciation: saved?.appreciation || auto.appreciation,
    observations: saved?.observations || auto.observations,
    decision: saved?.decision || auto.decision,
    comportement: { ...auto.comportement, ...(saved?.comportement ?? {}) },
  };
  return {
    school, student, scope, report, me, entry, periods,
    periodLabel: p ? p.libelle.replace('contrôle', 'Contrôle') : 'Annuel',
    yearLabel: year?.libelle ?? '',
    absences: { justifiees: absJ, nonJustifiees: absNJ, retards: att.filter((a) => a.statut === 'Retard').length, jours: Math.max(days, 180), presents: Math.max(days, 180) - absJ - absNJ },
    titulaire: tits.map((t) => `${t.sexe === 'F' ? 'Mme.' : 'M.'} ${t.prenom} ${t.nom}`).join(' et '),
    mention: appreciation(me.general, school.bareme),
    verifyUrl: `${school.siteWeb}/verifier?m=${student.matricule}&p=${scope}`,
  };
}

export const n1 = (v: number | null | undefined) => (v === null || v === undefined ? '-' : v.toFixed(1).replace('.', ','));
export const n0 = (v: number | null | undefined) => (v === null || v === undefined ? '-' : String(Math.round(v)));
export const shortSubject = (nom: string) => nom.replace('Sciences de la vie et de la terre (SVT)', 'SVT').replace('Éducation physique et sportive (EPS)', 'EPS').replace('Éducation civique et morale', 'Éducation civique').replace('Histoire-Géographie', 'Histoire-Géo');

export const shortProf = (n: string) => n.replace(/^(Mme|M\.|Mrs\.)\s+(\S)\S*\s+/, '$1 $2. ');
