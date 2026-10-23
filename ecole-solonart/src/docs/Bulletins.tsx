// Modèles de bulletins — reproduction des maquettes fournies.
//  · Bulletin annuel (tableau /20)           · Bulletin annuel /100 avec coefficients
//  · Livret 3 volets (recto) + Dos (verso)   · Tripliable recto + verso, 6 thèmes de couleur
import type { ReactNode } from 'react';
import {
  GraduationCap, BarChart3, MessageCircle, FileText, Trophy, BookOpen, CalendarDays, Star, Award, Check, User, Users, Heart, Settings,
  Lightbulb, Target, Phone, Mail, MapPin, Globe, Shield, Clock, UserX, UserCheck, BookMarked,
} from 'lucide-react';
import { BarChart } from '../components/charts';
import { APPRECIATION_LEGEND, appreciation } from '../data/compute';
import { dateLong } from '../lib/format';
import { PrescolaireRecto, PrescolaireVerso } from './Prescolaire';
import { DocLogo, QR, Signature, Seal, PhotoOrSilhouette, n1, n0, shortSubject, shortProf, type BulletinData } from './common';

const NAVY = '#0d2a63';
const BLUE = '#2457b3';
const toneColor: Record<string, string> = { excellent: '#1b9e4b', 'tres-bien': '#1f63e0', bien: '#7eb3f5', 'assez-bien': '#f2b51d', insuffisant: '#f07a2b', 'tres-insuffisant': '#d8352a' };
const legend20Color: Record<string, string> = { excellent: '#1b9e4b', 'tres-bien': '#1f63e0', bien: '#8fbdf6', 'assez-bien': '#f2b51d', insuffisant: '#d8352a' };
const faitLe = (d: BulletinData) => {
  const p = d.periods.find((x) => x.id === d.scope);
  const end = p?.fin ?? d.periods[d.periods.length - 1]?.fin;
  return `Fait à ${d.school.commune}, le ${dateLong(end)}`;
};
const sig = (d: BulletinData) => d.school.signatureDirecteur;

function Leaves({ color = '#cfe0fb', style }: { color?: string; style?: React.CSSProperties }) {
  return (
    <svg width="120" height="90" viewBox="0 0 120 90" style={style} aria-hidden="true">
      <path d="M70 90C60 60 72 30 104 8c6 34-6 64-34 82Z" fill={color} />
      <path d="M50 90C38 70 40 48 60 30c8 26 2 46-10 60Z" fill={color} opacity=".7" />
      <path d="M92 90c-2-20 8-34 26-40-2 20-10 32-26 40Z" fill={color} opacity=".55" />
    </svg>
  );
}
export function Wave({ colors, height = 120, flip }: { colors: string[]; height?: number; flip?: boolean }) {
  return (
    <svg className="wave" viewBox="0 0 400 120" preserveAspectRatio="none" style={{ height, transform: flip ? 'scaleX(-1)' : undefined }} aria-hidden="true">
      {colors[2] && <path d="M0 60C80 20 160 30 230 60s130 40 170 10v50H0Z" fill={colors[2]} />}
      {colors[1] && <path d="M0 80C90 40 170 60 240 80s120 20 160-10v50H0Z" fill={colors[1]} />}
      <path d="M0 98C100 70 190 92 270 98s100-6 130-24v46H0Z" fill={colors[0]} />
    </svg>
  );
}

// =====================================================================
// 1. BULLETIN ANNUEL — tableau /20 (maquette « Bulletin scolaire annuel »)
// =====================================================================
export function BulletinAnnuel({ d }: { d: BulletinData }) {
  const ps = d.periods;
  const chart = ps.map((p) => ({ l: p.court, me: d.me.byPeriod[p.id], cl: d.report.classByPeriod[p.id] }));
  return (
    <div className="doc-page">
      <div className="ann">
        <div className="ann-head">
          <div className="brand"><DocLogo school={d.school} size={74} /><div><b>{d.school.nom}</b><span>{d.school.devise}</span></div></div>
          <div className="title"><h1>BULLETIN SCOLAIRE ANNUEL</h1><div>Année scolaire {d.yearLabel}</div><i>« {d.school.slogan} »</i></div>
          <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
            <div className="ann-id" style={{ flex: 1 }}>
              <span>Nom et prénom</span><span>:</span><b>{d.student.prenom} {d.student.nom}</b>
              <span>Matricule</span><span>:</span><span>{d.student.matricule}</span>
              <span>Classe</span><span>:</span><span>{d.report.classe.code}</span>
              <span>Section</span><span>:</span><span>{d.report.classe.filiere ?? d.report.classe.section ?? '-'}</span>
            </div>
            <div style={{ textAlign: 'center', fontSize: 9.5 }}><QR text={d.verifyUrl} size={70} /><div style={{ marginTop: 3 }}>Vérifier l’authenticité</div></div>
          </div>
        </div>
        <div className="ann-body">
          <table className="ann-table">
            <thead>
              <tr><th rowSpan={2} style={{ width: 34 }}>N°</th><th rowSpan={2} style={{ textAlign: 'left' }}>Matières</th><th rowSpan={2} style={{ textAlign: 'left' }}>Professeurs</th><th colSpan={ps.length}>Notes des contrôles</th><th rowSpan={2} style={{ width: 64 }}>Moy. annuelle<small>(20)</small></th><th rowSpan={2} style={{ width: 58 }}>Moy. classe<small>(20)</small></th><th rowSpan={2} style={{ width: 92 }}>Appréciation</th></tr>
              <tr>{ps.map((p) => <th key={p.id} style={{ width: 42 }}>{p.court}<small>(20)</small></th>)}</tr>
            </thead>
            <tbody>
              {d.me.lines.map((l, i) => {
                const a = appreciation(l.value);
                return (
                  <tr key={l.course.id}>
                    <td className="c">{String(i + 1).padStart(2, '0')}</td>
                    <td style={{ lineHeight: 1.1 }}>{l.subject.nom.replace('Sciences de la vie et de la terre', 'Sciences de la vie et de la terre')}</td>
                    <td>{l.profNom.replace('M. ', 'M. ').replace('Mme ', 'Mme. ')}</td>
                    {ps.map((p) => <td key={p.id} className="c">{n0(l.byPeriod[p.id])}</td>)}
                    <td className="c moy">{n1(l.value)}</td>
                    <td className="c">{n1(l.classAvg)}</td>
                    <td className={`ap-${a.tone} ${a.tone === 'assez-bien' || a.tone === 'excellent' || a.tone === 'insuffisant' ? `bg-${a.tone}` : 'bg-bien'}`} style={{ fontWeight: 500 }}>{a.label}</td>
                  </tr>
                );
              })}
              <tr className="total">
                <td colSpan={3} style={{ textAlign: 'center', fontSize: 15 }}>Moyenne générale</td>
                {ps.map((p) => <td key={p.id} className="c">{n1(d.me.byPeriod[p.id])}</td>)}
                <td className="c" style={{ fontSize: 17 }}>{n1(d.me.general)}</td>
                <td className="c">{n1(d.report.classGeneral)}</td>
                <td className="c" style={{ fontSize: 17 }}>{d.mention.label}</td>
              </tr>
            </tbody>
          </table>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
            <div className="ann-card">
              <h3><GraduationCap />RÉSULTAT GLOBAL</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.95fr', gap: 8, alignItems: 'stretch' }}>
                <div><b style={{ fontSize: 21, color: NAVY }}>{n1(d.me.general)} / 20</b><div style={{ fontSize: 10.5 }}>Moyenne générale<br />de l’élève</div><b style={{ fontSize: 21, color: NAVY, display: 'block', marginTop: 8 }}>{d.me.rank} / {d.report.effectif}</b><div style={{ fontSize: 10.5 }}>Rang de l’élève</div></div>
                <div><b style={{ fontSize: 21, color: NAVY }}>{n1(d.report.classGeneral)} / 20</b><div style={{ fontSize: 10.5 }}>Moyenne générale<br />de la classe</div><b style={{ fontSize: 21, color: NAVY, display: 'block', marginTop: 8 }}>{d.report.effectif}</b><div style={{ fontSize: 10.5 }}>Effectif de la classe</div></div>
                <div style={{ background: '#e3edfc', borderRadius: 8, textAlign: 'center', padding: 6, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}><b style={{ color: NAVY, fontSize: 15 }}>Mention</b><Award style={{ margin: '4px auto', color: BLUE }} size={28} /><b style={{ color: NAVY, fontSize: 24 }}>{d.mention.label}</b></div>
              </div>
            </div>
            <div className="ann-card">
              <h3><BarChart3 />ÉVOLUTION DES MOYENNES</h3>
              <div>
                <div className="legend-dots" style={{ justifyContent: 'center', marginBottom: 2 }}><span><i style={{ background: '#2f6fe4' }} />Moyenne de l’élève</span><span><i style={{ background: '#b8c3d6' }} />Moyenne de la classe</span></div>
                <BarChart width={360} height={150} labels={chart.map((c) => c.l)} max={20} ticks={4} showValues format={(v) => (Number.isInteger(v) ? String(v) : v.toFixed(1).replace('.', ','))} series={[{ label: 'Élève', color: '#2f6fe4', values: chart.map((c) => (c.me == null ? null : Math.round(c.me * 10) / 10)) }, { label: 'Classe', color: '#b8c3d6', values: chart.map((c) => (c.cl == null ? null : Math.round(c.cl * 10) / 10)) }]} barWidth={22} />
              </div>
            </div>
            <div className="ann-card"><h3><MessageCircle />APPRÉCIATION GÉNÉRALE</h3><div style={{ fontSize: 11.5, lineHeight: 1.45 }}>{d.entry.appreciation}</div></div>
            <div className="ann-card"><h3><FileText />OBSERVATIONS / RECOMMANDATIONS</h3><div style={{ fontSize: 11.5 }}>{d.entry.observations || 'Continuer les efforts pour progresser dans toutes les matières.'}</div></div>
          </div>
        </div>
        <div className="ann-foot">
          <div><b style={{ fontSize: 11, color: NAVY }}>Légende des appréciations</b>
            <div className="legend-dots" style={{ marginTop: 6 }}>{APPRECIATION_LEGEND[20].map((x) => <span key={x.label}><i style={{ background: legend20Color[x.tone] }} />{x.label}<br />({x.range})</span>)}</div></div>
          <div className="d-sign" style={{ borderLeft: '1px solid #c8d6ef' }}><span style={{ color: BLUE, fontSize: 11 }}>{d.titulaire.startsWith('Mme') ? 'La Titulaire de classe' : 'Le Titulaire de classe'}</span><Signature variant={1} /><div className="line" /><span style={{ color: NAVY, fontSize: 11 }}>{d.titulaire}</span></div>
          <div className="d-sign" style={{ borderLeft: '1px solid #c8d6ef' }}><span style={{ color: BLUE, fontSize: 11 }}>Le Directeur</span><Signature image={sig(d)} /><div className="line" /><span style={{ color: NAVY, fontSize: 11 }}>{d.school.directeur}</span></div>
          <div style={{ borderLeft: '1px solid #c8d6ef', paddingLeft: 14, position: 'relative', height: '100%' }}><div style={{ color: BLUE, fontSize: 11.5, marginTop: 6 }}>{faitLe(d)}</div><div style={{ position: 'absolute', bottom: 0, right: 0, fontSize: 10, color: NAVY }}>{d.school.devise}</div><Leaves style={{ position: 'absolute', right: -20, bottom: -16, opacity: 0.7 }} /></div>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// 2. BULLETIN ANNUEL /100 avec coefficients
// =====================================================================
export function BulletinAnnuel100({ d }: { d: BulletinData }) {
  const ps = d.periods;
  const labelOf = (i: number) => (i === ps.length - 1 && ps.length > 1 ? 'Examen' : ps[i].court);
  const x5 = (v: number | null | undefined) => (v == null ? null : v * 5);
  const leg = APPRECIATION_LEGEND[100];
  return (
    <div className="doc-page">
      <div className="ann">
        <div className="ann-head">
          <div className="brand"><DocLogo school={d.school} size={80} /><div><b style={{ fontSize: 28 }}>{d.school.nom}</b><span style={{ letterSpacing: '.12em', fontSize: 12.5 }}>{d.school.devise.toUpperCase()}</span></div></div>
          <div className="title"><h1 style={{ fontSize: 31 }}>BULLETIN SCOLAIRE ANNUEL</h1><div>Année scolaire {d.yearLabel}</div><i>« {d.school.slogan} »</i></div>
          <div className="ann-id">
            <span>Nom et prénom</span><span>:</span><b>{d.student.prenom} {d.student.nom}</b>
            <span>Matricule</span><span>:</span><span>{d.student.matricule}</span>
            <span>Classe</span><span>:</span><span>{d.report.classe.code}</span>
            <span>Section</span><span>:</span><span>{d.report.classe.filiere ?? '-'}</span>
            <span>Régime</span><span>:</span><span>{d.student.regime}</span>
          </div>
        </div>
        <div className="ann-body" style={{ gridTemplateColumns: '1.9fr 1fr' }}>
          <table className="ann-table">
            <thead>
              <tr><th rowSpan={2} style={{ width: 40 }}>N°</th><th rowSpan={2} style={{ textAlign: 'left' }}>Matières</th><th rowSpan={2} style={{ width: 52 }}>Coef.</th><th colSpan={ps.length}>Notes / 100</th><th rowSpan={2} style={{ width: 62 }}>Total<small>/ 100</small></th><th rowSpan={2} style={{ width: 110 }}>Appréciation</th></tr>
              <tr>{ps.map((p, i) => <th key={p.id} style={{ width: 50 }}>{labelOf(i)}<small>(20 pts)</small></th>)}</tr>
            </thead>
            <tbody>
              {d.me.lines.map((l, i) => {
                const a = appreciation(l.value, 100);
                return (
                  <tr key={l.course.id}>
                    <td className="c">{String(i + 1).padStart(2, '0')}</td><td style={{ lineHeight: 1.1 }}>{l.subject.nom}</td><td className="c">{l.course.coefficient}</td>
                    {ps.map((p) => <td key={p.id} className="c">{n0(x5(l.byPeriod[p.id]))}</td>)}
                    <td className={`c moy bg-${a.tone === 'tres-bien' ? 'excellent' : a.tone}`} style={{ fontSize: 14 }}>{n0(x5(l.value))}</td>
                    <td className={`bg-${a.tone === 'tres-bien' ? 'excellent' : a.tone}`} style={{ color: a.tone === 'tres-bien' || a.tone === 'excellent' ? '#137a3d' : undefined }}>{a.label}</td>
                  </tr>
                );
              })}
              <tr className="total"><td colSpan={2} style={{ textAlign: 'center', fontSize: 15 }}>Moyenne générale</td><td className="c">—</td>{ps.map((p) => <td key={p.id} className="c">{n1(x5(d.me.byPeriod[p.id]))}</td>)}<td className="c" style={{ fontSize: 17 }}>{n1(x5(d.me.general))}</td><td>{appreciation(d.me.general, 100).label}</td></tr>
            </tbody>
          </table>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="ann-card">
              <h3 style={{ background: 'linear-gradient(90deg,#2457b3,#4a7fd6)', color: '#fff' }}><GraduationCap />RÉSULTAT GLOBAL</h3>
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.8fr', gap: 8 }}>
                  <div><div style={{ fontSize: 11 }}>Moyenne générale<br />de l’élève</div><b style={{ fontSize: 22, color: NAVY }}>{n1(x5(d.me.general))} / 100</b></div>
                  <div style={{ borderLeft: '1px solid #d5e0f2', paddingLeft: 8 }}><div style={{ fontSize: 11 }}>Moyenne générale<br />de la classe</div><b style={{ fontSize: 22, color: NAVY }}>{n1(x5(d.report.classGeneral))} / 100</b></div>
                  <div style={{ borderLeft: '1px solid #d5e0f2', paddingLeft: 8 }}><div style={{ fontSize: 11 }}>Rang de l’élève<br />&nbsp;</div><b style={{ fontSize: 22, color: NAVY }}>{d.me.rank} / {d.report.effectif}</b></div>
                </div>
                <div style={{ background: '#e3edfc', borderRadius: 8, padding: '8px 14px', marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><b style={{ color: NAVY, fontSize: 16 }}>Mention</b><b style={{ color: BLUE, fontSize: 26 }}>{appreciation(d.me.general, 100).label}</b></div>
              </div>
            </div>
            <div className="ann-card">
              <h3><BarChart3 />ÉVOLUTION DE LA MOYENNE</h3>
              <div>
                <div className="legend-dots" style={{ justifyContent: 'center' }}><span><i style={{ background: '#1f63e0' }} />Moyenne de l’élève</span><span><i style={{ background: '#b8c3d6' }} />Moyenne de la classe</span></div>
                <BarChart width={360} height={170} labels={ps.map((_, i) => labelOf(i))} max={100} ticks={5} showValues format={(v) => (Number.isInteger(v) ? String(v) : v.toFixed(1).replace('.', ','))} series={[{ label: 'Élève', color: '#1f63e0', values: ps.map((p) => (d.me.byPeriod[p.id] == null ? null : Math.round(d.me.byPeriod[p.id]! * 50) / 10)) }, { label: 'Classe', color: '#b8c3d6', values: ps.map((p) => (d.report.classByPeriod[p.id] == null ? null : Math.round(d.report.classByPeriod[p.id]! * 50) / 10)) }]} barWidth={24} />
              </div>
            </div>
            <div className="ann-card" style={{ flex: 1 }}><h3><MessageCircle />APPRÉCIATION GÉNÉRALE</h3><div style={{ fontSize: 12, lineHeight: 1.5 }}>{d.entry.appreciation}</div></div>
          </div>
        </div>
        <div className="ann-foot" style={{ gridTemplateColumns: '1.6fr .8fr .8fr .9fr' }}>
          <div>
            <b style={{ fontSize: 11, color: NAVY }}>Légende des appréciations</b>
            <div className="legend-dots" style={{ marginTop: 6 }}>{leg.map((x) => <span key={x.label}><i style={{ background: toneColor[x.tone] }} />{x.label}<br />({x.range})</span>)}</div>
            <div style={{ fontSize: 9.5, marginTop: 6, color: '#46557a' }}>{ps.slice(0, -1).map((p) => p.court).join(', ')} : Contrôles (20 points chacun) &nbsp;|&nbsp; Examen : Épreuve finale (20 points) &nbsp;|&nbsp; Total : Note sur 100</div>
          </div>
          <div className="d-sign" style={{ borderLeft: '1px solid #c8d6ef' }}><span style={{ fontSize: 11 }}>{d.titulaire.startsWith('Mme') ? 'La Titulaire de classe' : 'Le Titulaire de classe'}</span><Signature variant={1} /><div className="line" /><span style={{ fontSize: 11 }}>{d.titulaire}</span></div>
          <div className="d-sign" style={{ borderLeft: '1px solid #c8d6ef' }}><span style={{ fontSize: 11 }}>Le Directeur</span><Signature image={sig(d)} /><div className="line" /><span style={{ fontSize: 11 }}>{d.school.directeur}</span></div>
          <div className="row" style={{ borderLeft: '1px solid #c8d6ef', paddingLeft: 12, gap: 10, alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 11.5, alignSelf: 'center' }}>{faitLe(d)}</div>
            <div style={{ textAlign: 'center', fontSize: 9 }}><QR text={d.verifyUrl} size={62} />Vérifier l’authenticité</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// 3. LIVRET 3 VOLETS — recto (résultats annuels) et dos (détail / suivi)
// =====================================================================
export function LivretRecto({ d }: { d: BulletinData }) {
  const ps = d.periods;
  const half = Math.ceil(d.me.lines.length / 2);
  const rows = (lines: typeof d.me.lines) => lines.map((l) => (
    <tr key={l.course.id}>
      <td style={{ lineHeight: 1.1 }}>{shortSubject(l.subject.nom)}</td><td style={{ lineHeight: 1.1 }}>{shortProf(l.profNom)}</td>
      {ps.map((p) => <td key={p.id} className="c">{n0(l.byPeriod[p.id])}</td>)}
      <td className="c" style={{ fontWeight: 800, color: NAVY }}>{n1(l.value)}</td><td className="c">{appreciation(l.value).label}</td>
    </tr>
  ));
  const head = (
    <>
    <colgroup><col style={{ width: '25%' }} /><col style={{ width: '22%' }} />{ps.map((p) => <col key={p.id} style={{ width: `${26 / ps.length}%` }} />)}<col style={{ width: '11%' }} /><col style={{ width: '16%' }} /></colgroup>
    <thead>
      <tr><th rowSpan={2} style={{ textAlign: 'left' }}>Matières</th><th rowSpan={2} style={{ textAlign: 'left' }}>Professeurs</th><th colSpan={ps.length}>Notes des contrôles</th><th rowSpan={2}>Moy. ann.</th><th rowSpan={2}>Appréc.</th></tr>
      <tr>{ps.map((p) => <th key={p.id}>{p.court}</th>)}</tr>
    </thead>
    </>
  );
  return (
    <div className="doc-page">
      <div className="liv">
        <div className="panel">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="row" style={{ gap: 10 }}><DocLogo school={d.school} size={58} /><div><b style={{ fontSize: 19, color: NAVY, fontWeight: 800 }}>{d.school.nom}</b><div style={{ fontSize: 10.5, color: NAVY }}>{d.school.devise}</div></div></div>
            <div style={{ textAlign: 'center', color: NAVY }}><div style={{ fontSize: 12 }}>Année Scolaire</div><b style={{ fontSize: 18 }}>{d.yearLabel}</b></div>
          </div>
          <div className="box" style={{ marginTop: 12, border: '1px solid #d6e2f5' }}>
            <div style={{ padding: '6px 12px', fontWeight: 700, color: NAVY, borderBottom: '1px solid #d6e2f5', fontSize: 13 }}>Informations de l’élève</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', fontSize: 10.5, padding: '6px 12px', gap: 4 }}>
              <div>Nom et prénom : <b>{d.student.prenom} {d.student.nom}</b></div><div>Date de naissance : {dateLong(d.student.dateNaissance)}</div>
              <div>Matricule : {d.student.matricule}</div><div>Régime : {d.student.regime}</div>
              <div>Classe : {d.report.classe.code}</div><div>Titulaire : {d.titulaire}</div>
              <div>Section : {d.report.classe.filiere ?? '-'}</div>
            </div>
          </div>
          <table className="tbl" style={{ marginTop: 12 }}>{head}<tbody>{rows(d.me.lines.slice(0, half))}</tbody></table>
          <div style={{ marginTop: 'auto', fontSize: 12, color: NAVY, paddingTop: 10, borderTop: '1px solid #cfdcf1' }}>{faitLe(d)}</div>
        </div>
        <div className="panel" style={{ padding: 0 }}>
          <div style={{ background: NAVY, color: '#fff', textAlign: 'center', padding: '26px 10px 30px', borderBottomLeftRadius: '50% 22px', borderBottomRightRadius: '50% 22px' }}>
            <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: '.03em' }}>BULLETIN SCOLAIRE</div>
            <div style={{ fontSize: 12, letterSpacing: '.45em', marginTop: 4 }}>RÉSULTATS ANNUELS</div>
          </div>
          <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ textAlign: 'center', fontStyle: 'italic', color: '#36507f', fontSize: 12, margin: '6px 0 10px' }}>« {d.school.slogan} »</div>
            <table className="tbl">{head}<tbody>{rows(d.me.lines.slice(half))}
              <tr style={{ background: '#e6effc' }}><td colSpan={2} style={{ fontWeight: 800, color: NAVY, fontSize: 13 }}>Moyenne générale</td>{ps.map((p) => <td key={p.id} className="c" style={{ fontWeight: 700 }}>{n1(d.me.byPeriod[p.id])}</td>)}<td className="c" style={{ fontWeight: 800, color: NAVY, fontSize: 13 }}>{n1(d.me.general)}</td><td className="c" style={{ fontWeight: 800, color: NAVY }}>{d.mention.label}</td></tr>
            </tbody></table>
            <div style={{ marginTop: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid #cfdcf1', paddingTop: 8 }}>
              <div className="d-sign" style={{ fontSize: 11 }}><span>Le Titulaire</span><Signature variant={1} w={100} /><div className="line" /><span>{d.titulaire}</span></div>
              <div className="d-sign" style={{ fontSize: 11, borderLeft: '1px solid #cfdcf1' }}><span>La Direction</span><Signature image={sig(d)} w={100} /><div className="line" /><span>{d.school.directeur}</span><span>Directeur</span></div>
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="box" style={{ border: '1px solid #d6e2f5', overflow: 'hidden' }}>
            <div className="row" style={{ background: '#e6effc', padding: '10px 14px', gap: 12 }}><Trophy size={26} color={BLUE} /><b style={{ color: NAVY, fontSize: 15 }}>Résultats et appréciations</b></div>
            <div className="kv" style={{ gridTemplateColumns: '1fr 14px 70px' }}>
              <span>Moyenne générale de l’élève</span><span>:</span><b>{n1(d.me.general)} / 20</b>
              <span>Moyenne générale de la classe</span><span>:</span><b>{n1(d.report.classGeneral)} / 20</b>
              <span>Rang de l’élève</span><span>:</span><b>{d.me.rank} / {d.report.effectif}</b>
              <span>Effectif de la classe</span><span>:</span><b>{d.report.effectif}</b>
            </div>
            <div className="kv" style={{ gridTemplateColumns: '1fr 14px 70px', background: '#e6effc', fontSize: 14 }}><b style={{ color: NAVY }}>Mention</b><span>:</span><b style={{ color: NAVY, fontSize: 17 }}>{d.mention.label}</b></div>
          </div>
          <div className="box" style={{ border: '1px solid #d6e2f5', marginTop: 12, overflow: 'hidden' }}>
            <div className="row" style={{ background: '#e6effc', padding: '9px 14px', gap: 12 }}><MessageCircle size={22} color={BLUE} fill={BLUE} /><b style={{ color: NAVY, fontSize: 13.5 }}>Appréciation générale du conseil de classe</b></div>
            <div style={{ padding: '10px 14px', fontSize: 11.5, lineHeight: 1.5 }}>{d.entry.appreciation}</div>
          </div>
          <div className="box" style={{ border: '1px solid #d6e2f5', marginTop: 12, overflow: 'hidden' }}>
            <div className="row" style={{ background: '#e6effc', padding: '9px 14px', gap: 12 }}><Award size={24} color={BLUE} /><b style={{ color: NAVY, fontSize: 14 }}>Décision du conseil de classe</b></div>
            <div className="row" style={{ background: '#e8f6ee', padding: '14px', gap: 14 }}>
              <span style={{ width: 44, height: 44, borderRadius: '50%', border: '2.5px solid #1b8a4a', display: 'grid', placeItems: 'center', flex: 'none' }}><Check color="#1b8a4a" size={26} strokeWidth={3} /></span>
              <div><b style={{ color: NAVY, fontSize: 16 }}>{d.entry.decision}</b><div style={{ fontStyle: 'italic', fontSize: 11 }}>{d.me.general != null && d.me.general >= 14 ? 'Félicitations pour cette belle année scolaire !' : 'Bonne continuation.'}</div></div>
            </div>
          </div>
          <div className="row" style={{ marginTop: 'auto', borderTop: '1px solid #cfdcf1', paddingTop: 10, gap: 14 }}>
            <QR text={d.verifyUrl} size={70} />
            <div style={{ textAlign: 'center', flex: 1, color: NAVY }}><b style={{ fontSize: 13 }}>{d.school.devise}</b><div style={{ borderTop: '1px solid #9db3dc', margin: '6px 10px' }} /><i style={{ fontSize: 12 }}>Un élève aujourd’hui,<br />un citoyen meilleur demain.</i></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LivretVerso({ d }: { d: BulletinData }) {
  const box = (title: string, icon: ReactNode, children: ReactNode) => (
    <div className="box" style={{ marginTop: 12, overflow: 'hidden' }}>
      <div className="row" style={{ padding: '9px 14px', gap: 10, background: '#e6effc' }}>{icon}<b style={{ color: NAVY, fontSize: 14 }}>{title}</b></div>
      {children}
    </div>
  );
  const taux = Math.round((d.absences.presents / d.absences.jours) * 100);
  return (
    <div className="doc-page">
      <div className="liv">
        <div className="panel">
          <h2><BookOpen />DÉTAIL DES RÉSULTATS<br />PAR MATIÈRE</h2>
          <table className="tbl" style={{ marginTop: 12 }}>
            <colgroup><col style={{ width: '27%' }} /><col style={{ width: '27%' }} /><col style={{ width: '12%' }} /><col style={{ width: '13%' }} /><col style={{ width: '21%' }} /></colgroup>
            <thead><tr><th style={{ textAlign: 'left' }}>Matières</th><th style={{ textAlign: 'left' }}>Nom du professeur</th><th>Moy. Élève</th><th>Moy. Classe</th><th>Appréciation</th></tr></thead>
            <tbody>
              {d.me.lines.map((l) => <tr key={l.course.id}><td style={{ lineHeight: 1.1 }}>{shortSubject(l.subject.nom)}</td><td style={{ lineHeight: 1.1 }}>{shortProf(l.profNom)}</td><td className="c">{n0(l.value)}</td><td className="c">{n1(l.classAvg)}</td><td className="c">{appreciation(l.value).label}</td></tr>)}
              <tr style={{ background: '#e6effc' }}><td colSpan={2} style={{ fontWeight: 800, color: NAVY, fontSize: 13 }}>Moyenne générale</td><td className="c bold">{n1(d.me.general)}</td><td className="c bold">{n1(d.report.classGeneral)}</td><td className="c bold">{d.mention.label}</td></tr>
            </tbody>
          </table>
          <h2 style={{ marginTop: 14, fontSize: 14.5 }}><User />APPRÉCIATION GÉNÉRALE DES PROFESSEURS</h2>
          <div className="box" style={{ padding: '10px 12px', marginTop: 8, fontSize: 11.5, lineHeight: 1.5 }}>{d.entry.observations || 'Élève sérieux, assidu et travailleur. Montre des progrès constants dans l’ensemble des matières. Continue sur cette voie.'}</div>
          <Wave colors={['#1e4fa3', '#5d8ad6', '#b9cff2']} height={120} />
          <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, textAlign: 'center', color: '#fff', fontStyle: 'italic', fontSize: 11.5 }}>« Le travail d’aujourd’hui prépare<br />les réussites de demain. »</div>
        </div>
        <div className="panel">
          <h2><BarChart3 />SUIVI ET COMPORTEMENT</h2>
          {box('Assiduité', <CalendarDays size={20} color={BLUE} />, (
            <div className="kv" style={{ gridTemplateColumns: '1fr 14px 60px', paddingLeft: 40 }}>
              <span>Nombre total de jours de classe</span><span>:</span><b>{d.absences.jours}</b>
              <span>Jours de présence</span><span>:</span><b>{d.absences.presents}</b>
              <span>Jours d’absence justifiée</span><span>:</span><b>{d.absences.justifiees}</b>
              <span>Jours d’absence non justifiée</span><span>:</span><b>{d.absences.nonJustifiees}</b>
              <b style={{ color: NAVY }}>Taux de présence</b><span>:</span><b style={{ color: NAVY }}>{taux} %</b>
            </div>
          ))}
          {box('Comportement', <Star size={20} color={BLUE} fill={BLUE} />, (
            <div className="kv" style={{ gridTemplateColumns: '1fr 14px 90px', paddingLeft: 40 }}>
              <span>Conduite</span><span>:</span><b>{d.entry.comportement.conduite}</b>
              <span>Esprit de collaboration</span><span>:</span><b>{d.entry.comportement.collaboration}</b>
              <span>Respect des règlements</span><span>:</span><b>{d.entry.comportement.respect}</b>
              <span>Participation en classe</span><span>:</span><b>{d.entry.comportement.participation}</b>
            </div>
          ))}
          {box('Appréciation du titulaire', <MessageCircle size={20} color={BLUE} fill={BLUE} />, <div style={{ padding: '10px 14px', fontSize: 11.5, lineHeight: 1.5 }}>{d.entry.appreciation}</div>)}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', marginTop: 12, fontSize: 11 }}>
            <div className="d-sign"><span style={{ textAlign: 'center' }}>Nom et signature<br />du titulaire</span><Signature variant={1} w={100} /><div className="line" /><span>{d.titulaire}</span></div>
            <div className="d-sign" style={{ borderLeft: '1px solid #cfdcf1' }}><span>Visa de la direction</span><Signature image={sig(d)} w={100} /><div className="line" /><span>{d.school.directeur}</span><span>Directeur</span></div>
          </div>
          <div className="row" style={{ marginTop: 'auto', justifyContent: 'space-between' }}>
            {d.school.cachet ? <img src={d.school.cachet} alt="" style={{ width: 110, height: 110, objectFit: 'contain' }} /> : <Seal name={d.school.nom} size={108} />}
            <div style={{ fontSize: 11.5, color: NAVY }}>{faitLe(d)}</div>
          </div>
        </div>
        <div className="panel" style={{ padding: 0 }}>
          <div style={{ background: 'linear-gradient(180deg,#e5eefc,#f4f8fe)', padding: '22px 20px 30px', textAlign: 'center', color: '#1f4a99', position: 'relative' }}>
            <div style={{ letterSpacing: '.25em', fontSize: 12 }}>{d.school.devise.toUpperCase()}</div>
            <div style={{ fontSize: 17, marginTop: 16, letterSpacing: '.03em', lineHeight: 1.3 }}>{d.school.slogan.toUpperCase().replace(', ', ',\n')}</div>
            <div style={{ width: 40, borderTop: '2px solid #1f4a99', margin: '10px auto 0' }} />
          </div>
          <div style={{ padding: '6px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: 19 }}><Trophy />RÉSULTAT GLOBAL</h2>
            <div style={{ border: '1px solid #d6e2f5', borderRadius: 8, marginTop: 10, overflow: 'hidden' }}>
              {[['Moyenne générale de l’élève', `${n1(d.me.general)} / 20`], ['Moyenne générale de la classe', `${n1(d.report.classGeneral)} / 20`], ['Rang de l’élève', `${d.me.rank} / ${d.report.effectif}`], ['Effectif de la classe', String(d.report.effectif)]].map(([k, v]) => (
                <div key={k} style={{ display: 'grid', gridTemplateColumns: '1fr 14px 110px', padding: '8px 12px', borderBottom: '1px solid #e3eaf6', fontSize: 12.5 }}><span>{k}</span><span>:</span><b style={{ borderLeft: '1px solid #e3eaf6', paddingLeft: 10, fontSize: 15 }}>{v}</b></div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 14px 110px', padding: '8px 12px', background: '#e6effc', fontSize: 13 }}><b style={{ color: NAVY }}>Mention</b><span>:</span><b style={{ color: NAVY, fontSize: 19, paddingLeft: 10 }}>{d.mention.label}</b></div>
            </div>
            <h2 style={{ fontSize: 17, marginTop: 18 }}><Award />DÉCISION DU CONSEIL DE CLASSE</h2>
            <div style={{ background: '#e8f6ee', borderRadius: 10, padding: 14, marginTop: 10, textAlign: 'center' }}>
              <div className="row" style={{ justifyContent: 'center', gap: 10 }}><span style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #1b8a4a', display: 'grid', placeItems: 'center' }}><Check color="#1b8a4a" size={20} strokeWidth={3} /></span><b style={{ color: NAVY, fontSize: 17 }}>{d.entry.decision}</b></div>
              <div style={{ fontStyle: 'italic', fontSize: 11.5, marginTop: 6 }}>{d.me.general != null && d.me.general >= 14 ? 'Félicitations pour cette belle année scolaire !' : 'Bonne continuation.'}</div>
            </div>
            <div style={{ textAlign: 'center', fontStyle: 'italic', color: '#1f4a99', marginTop: 18, fontSize: 13 }}>« Un élève d’aujourd’hui,<br />un citoyen meilleur demain. »<div style={{ width: 40, borderTop: '2px solid #1f4a99', margin: '10px auto 0' }} /></div>
          </div>
          <Wave colors={['#1e4fa3', '#5d8ad6', '#c7d9f5']} height={95} />
          <div style={{ position: 'absolute', bottom: 14, left: 0, right: 0, textAlign: 'center', color: '#fff', fontSize: 10, letterSpacing: '.06em' }}>ÉDUQUER &nbsp;|&nbsp; INSPIRER &nbsp;|&nbsp; TRANSFORMER</div>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// 4. TRIPLIABLE — 6 thèmes (recto + verso)
// =====================================================================
export interface TriTheme {
  key: string; nom: string; primary: string; light: string; accent: string; ink: string;
  words: [string, string, string]; quote: string; phrase: [string, string];
  values: [ReactNode, string][]; coverText?: string; dark?: boolean; acronym?: boolean;
}
const ic = (C: typeof Star, color: string) => <C color={color} />;
export const TRI_THEMES: TriTheme[] = [
  { key: 'bleu', nom: 'Classique bleu', primary: '#1d4fa8', light: '#e6effc', accent: '#2f6fe4', ink: '#0d2a63', words: ['Apprendre aujourd’hui,', 'Construire demain.', ''], quote: '« Apprendre aujourd’hui, Construire demain. »', phrase: ['Un élève', 'Un meilleur demain'], values: [[ic(GraduationCap, NAVY), 'Discipline'], [ic(Users, NAVY), 'Respect'], [ic(BarChart3, NAVY), 'Réussite']] },
  { key: 'vert', nom: 'Moderne vert', primary: '#2e8b4f', light: '#e7f5ec', accent: '#3aa564', ink: '#1d5c36', words: ['Grandir', 'Apprendre', 'Réussir'], quote: '« Peu à peu, de grands résultats. »', phrase: ['Des valeurs', 'pour la vie'], values: [[ic(BookOpen, '#1d5c36'), 'Connaissances'], [<Heart key="h" color="#1d5c36" fill="#1d5c36" />, 'Respect'], [ic(Settings, '#1d5c36'), 'Persévérance']] },
  { key: 'gris', nom: 'Minimaliste gris', primary: '#4d566a', light: '#eef0f4', accent: '#6b7488', ink: '#2c3446', words: ['Apprendre', 'Évoluer', 'Réaliser'], quote: '« Un élève, un meilleur demain. »', phrase: ['La connaissance', 'd’aujourd’hui, un meilleur demain.'], values: [[ic(BarChart3, '#2c3446'), 'Progrès'], [ic(Users, '#2c3446'), 'Engagement'], [ic(Shield, '#2c3446'), 'Responsabilité']], acronym: true },
  { key: 'or', nom: 'Accent couleur (or)', primary: '#e39a12', light: '#fff5e1', accent: '#f3b33d', ink: '#7a4b00', words: ['Éduquer', 'Inspirer', 'Transformer'], quote: '« Chaque effort compte. »', phrase: ['Former aujourd’hui', 'des citoyens de demain.'], values: [[ic(Lightbulb, '#e39a12'), 'Apprendre'], [ic(Target, '#e39a12'), 'Progresser'], [<Star key="s" color="#e39a12" fill="#e39a12" />, 'Réussir']] },
  { key: 'marine', nom: 'Bande élégante (marine)', primary: '#0f2a5c', light: '#e9eef8', accent: '#e0b03a', ink: '#0f2a5c', words: ['Savoir', 'Aujourd’hui', 'Bâtir Demain.'], quote: '« La réussite est un chemin qui se construit. »', phrase: ['Un pas de plus', 'vers ton avenir'], values: [[ic(BookMarked, NAVY), 'Savoir'], [ic(Users, NAVY), 'Partager'], [ic(Settings, NAVY), 'Grandir']], dark: true },
  { key: 'violet', nom: 'Élégant pastel (violet)', primary: '#5b52c9', light: '#efedfd', accent: '#8d85ea', ink: '#2f2a7a', words: ['Éduquer', 'Inspirer', 'Transformer'], quote: '« Apprendre. Évoluer. Réussir. »', phrase: ['Les grandes réussites', 'commencent à l’école.'], values: [[ic(GraduationCap, '#2f2a7a'), 'Ambition'], [<Heart key="h" color="#3b4fd8" fill="#3b4fd8" />, 'Bienveillance'], [ic(BarChart3, '#3b4fd8'), 'Réussite']] },
];

function CoverDeco({ t, recto }: { t: TriTheme; recto?: boolean }) {
  if (t.key === 'bleu') return <Wave colors={[t.primary, '#5f8fe0', '#c9dbf8']} height={recto ? 70 : 150} />;
  if (t.key === 'vert') return <Wave colors={[t.primary, '#7cc596', '#cfeedb']} height={recto ? 70 : 150} />;
  if (t.key === 'gris') return <svg className="wave" viewBox="0 0 300 160" preserveAspectRatio="none" style={{ height: recto ? 90 : 170 }}><path d="M0 40 300 160H0Z" fill="#4d566a" /><path d="M0 0 120 160H0Z" fill="#6b7488" opacity=".35" /></svg>;
  if (t.key === 'or') return <svg className="wave" viewBox="0 0 300 160" preserveAspectRatio="none" style={{ height: recto ? 80 : 170 }}><path d="M0 50c80 10 170 50 300 110H0Z" fill="#f3b33d" /><path d="M0 90c90 0 160 30 230 70H0Z" fill="#e39a12" /></svg>;
  if (t.key === 'violet') return <svg className="wave" viewBox="0 0 300 160" preserveAspectRatio="none" style={{ height: recto ? 70 : 140 }}><path d="M0 60c80-30 180-10 300 40v60H0Z" fill="#d9d5fb" /><path d="M0 100c90-20 190 0 300 30v30H0Z" fill="#c2bcf6" /></svg>;
  return null;
}

function TriLogo({ d, t, size = 64 }: { d: BulletinData; t: TriTheme; size?: number }) {
  if (t.acronym && !d.school.logo) return <div style={{ fontSize: 42, fontWeight: 900, color: t.ink, letterSpacing: '.02em', lineHeight: 1 }}>{d.school.nom.split(' ').map((w) => w[0]).join('').replace('É', 'E')}</div>;
  return <DocLogo school={d.school} size={size} mono={t.dark ? '#fff' : undefined} />;
}

/** Recto : couverture extérieure (contacts | titre + photo | valeurs). */
export function TrifoldRecto({ d, t }: { d: BulletinData; t: TriTheme }) {
  const dark = t.dark;
  return (
    <div className="doc-page">
      <div className="tri">
        <div className="panel cover" style={{ background: dark ? t.primary : t.key === 'gris' ? '#f3f4f7' : t.key === 'violet' ? 'linear-gradient(160deg,#efedfd,#fff)' : t.key === 'or' ? '#fffaf0' : '#fff', color: dark ? '#fff' : t.ink }}>
          <div style={{ marginTop: 34 }}><TriLogo d={d} t={t} size={78} /></div>
          <div className="school" style={{ color: dark ? '#fff' : t.ink, fontSize: 26 }}>{t.acronym && !d.school.logo ? d.school.nom : d.school.nom.replace('Mixte ', 'Mixte\n')}</div>
          <div className="motto" style={{ color: dark ? '#cfd8ea' : t.ink }}>{d.school.devise}</div>
          <div className="sep" style={{ background: dark ? t.accent : t.primary }} />
          {t.key === 'marine' ? <div style={{ fontSize: 13, lineHeight: 1.9, marginTop: 6 }}>{d.school.devise.split(' • ').map((w) => <div key={w}>{w}</div>)}</div> : <div style={{ fontStyle: 'italic', fontSize: 13, marginTop: 4 }}>{t.key === 'or' ? 'Former aujourd’hui\ndes citoyens de demain.' : 'Apprendre aujourd’hui\nConstruire demain.'}</div>}
          {t.key !== 'marine' && (
            <div style={{ marginTop: 'auto', marginBottom: t.key === 'gris' ? 70 : 64, alignSelf: 'stretch', textAlign: 'left', fontSize: 11, display: 'grid', gap: 7, zIndex: 1 }}>
              <div className="row" style={{ gap: 8 }}><Phone size={13} />{d.school.telephone}</div>
              <div className="row" style={{ gap: 8 }}><Mail size={13} />{d.school.email}</div>
              <div className="row" style={{ gap: 8 }}><MapPin size={13} />{d.school.adresse}, {d.school.commune}, Haïti</div>
              <div className="row" style={{ gap: 8 }}><Globe size={13} />{d.school.siteWeb}</div>
            </div>
          )}
          {t.key === 'marine' && <div style={{ marginTop: 'auto', marginBottom: 30, fontStyle: 'italic', fontSize: 13 }}>{t.phrase[0]}<br />{t.phrase[1]}</div>}
          {t.key === 'gris' && <div style={{ position: 'absolute', left: 22, bottom: 18, color: '#fff', fontSize: 13, lineHeight: 1.5, zIndex: 2, textAlign: 'left' }}>{t.words.map((w) => <div key={w}>{w}</div>)}</div>}
          <CoverDeco t={t} recto />
        </div>
        <div className="panel cover" style={{ background: t.key === 'or' ? '#fffaf0' : '#fff' }}>
          <div className="big" style={{ color: t.ink, marginTop: 30, fontSize: 38 }}>BULLETIN<br />SCOLAIRE</div>
          <div style={{ fontSize: 14, marginTop: 8, color: t.ink }}>Année {d.yearLabel}</div>
          <div className="d-chip" style={{ background: t.light, color: t.ink, marginTop: 12, fontSize: 14 }}>{d.scope === 'annuel' ? 'Bulletin annuel' : d.periodLabel}</div>
          {d.student.photo ? <img className="photo" src={d.student.photo} alt="" style={{ width: 120, height: 120 }} /> : <div className="photo-ph" style={{ width: 120, height: 120 }}><PhotoOrSilhouette style={{ width: '100%', height: '100%' }} /></div>}
          <div style={{ fontWeight: 800, fontSize: 18, color: t.ink }}>{d.student.prenom} {d.student.nom}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 12px auto', gap: 4, fontSize: 13, marginTop: 12, textAlign: 'left' }}>
            <span>Classe</span><span>:</span><span>{d.report.classe.code}</span>
            <span>Matricule</span><span>:</span><span>{d.student.matricule}</span>
          </div>
        </div>
        <div className="panel" style={{ background: t.key === 'violet' ? 'linear-gradient(200deg,#efedfd,#fff 50%)' : t.key === 'or' ? '#fffaf0' : '#fff' }}>
          <div style={{ fontSize: 16, color: t.key === 'vert' ? t.primary : t.ink, marginTop: 34, lineHeight: 1.35, fontWeight: t.key === 'vert' ? 700 : 400 }}>{t.phrase[0]}<br />{t.phrase[1]}</div>
          <div style={{ width: 40, height: 2, background: t.primary, margin: '18px 0' }} />
          <div className="values">{t.values.map(([icon, label]) => <div key={label}>{icon}{label}</div>)}</div>
          {t.key !== 'vert' && <div style={{ width: 40, height: 2, background: t.primary, margin: '26px 0 14px' }} />}
          <div style={{ fontStyle: t.key === 'or' ? 'italic' : 'normal', fontSize: 13, color: t.ink }}>{t.key === 'gris' ? d.school.siteWeb : t.key === 'vert' ? 'Un avenir\nmeilleur\nensemble.' : t.key === 'marine' ? 'L’Éducation,\nune clé pour\ndemain.' : t.key === 'or' ? 'Chaque effort\ncompte.' : ''}</div>
          <svg className="wave" viewBox="0 0 300 200" preserveAspectRatio="none" style={{ height: 150 }} aria-hidden="true">
            <path d="M300 30C230 90 160 120 60 200h240Z" fill={t.light} />
            <path d="M300 90C250 140 190 170 120 200h180Z" fill={t.key === 'gris' ? '#dfe2e9' : t.accent} opacity=".55" />
            <path d="M300 140c-30 30-70 50-110 60h110Z" fill={t.primary} opacity=".85" />
          </svg>
        </div>
      </div>
    </div>
  );
}

/** Verso : couverture | notes | appréciation, absences, décision. */
export function TrifoldVerso({ d, t }: { d: BulletinData; t: TriTheme }) {
  const dark = t.dark;
  const cov = dark ? t.primary : t.key === 'gris' ? '#eef0f4' : t.key === 'violet' ? 'linear-gradient(170deg,#e6e3fc,#fff 60%)' : t.key === 'or' ? 'linear-gradient(170deg,#fff3da,#fff 40%)' : '#fff';
  const th = { background: t.key === 'marine' ? t.primary : t.light, color: t.key === 'marine' ? '#fff' : t.ink };
  return (
    <div className="doc-page">
      <div className="tri">
        <div className="panel cover" style={{ background: cov, color: dark ? '#fff' : t.ink }}>
          <div style={{ marginTop: 30 }}><TriLogo d={d} t={t} size={72} /></div>
          <div className="school" style={{ color: dark ? '#fff' : t.ink }}>{t.acronym && !d.school.logo ? d.school.nom : <>École Mixte<br />Solonart</>}</div>
          <div className="motto" style={{ color: dark ? '#cfd8ea' : t.ink }}>{t.acronym ? d.school.devise.toUpperCase().split(' • ').map((w) => <div key={w} style={{ letterSpacing: '.18em', marginTop: 4 }}>{w}</div>) : d.school.devise}</div>
          <div className="sep" style={{ background: dark ? t.accent : t.primary }} />
          <div className="big" style={{ color: dark ? '#fff' : t.key === 'vert' ? t.primary : t.ink }}>BULLETIN<br />SCOLAIRE</div>
          <div style={{ fontSize: 15, marginTop: 10 }}>{t.key === 'bleu' ? 'Année scolaire' : ''}{t.key === 'bleu' && <br />}{d.yearLabel}</div>
          {dark && <div className="sep" style={{ background: t.accent }} />}
          <div style={{ position: 'absolute', left: 22, bottom: 22, textAlign: 'left', fontSize: 14, lineHeight: 1.5, zIndex: 2, color: t.key === 'bleu' || t.key === 'vert' || t.key === 'gris' || dark ? '#fff' : t.ink, fontStyle: t.key === 'bleu' ? 'italic' : 'normal' }}>
            {t.key === 'bleu' ? <div style={{ textAlign: 'center', width: 300, fontSize: 12.5 }}>{t.quote}</div> : t.words.map((w) => <div key={w}>{w}</div>)}
          </div>
          <CoverDeco t={t} />
        </div>
        <div className="panel" style={{ background: dark ? '#0b2350' : '#fff', color: dark ? '#e6ecf8' : undefined }}>
          <h4 style={{ color: dark ? '#fff' : t.ink }}>{t.acronym || t.key === 'violet' ? `${d.student.prenom} ${d.student.nom}` : 'Informations de l’élève'}</h4>
          {t.acronym || t.key === 'violet' ? (
            <div style={{ fontSize: 11.5, marginBottom: 10 }}>{d.report.classe.code} &nbsp;|&nbsp; {d.student.matricule} &nbsp;|&nbsp; {d.periodLabel}</div>
          ) : (
            <div className="info-grid" style={{ marginBottom: 12 }}>
              <span>Nom</span><span>:</span><span>{d.student.prenom} {d.student.nom}</span>
              <span>Classe</span><span>:</span><span>{d.report.classe.code}</span>
              <span>Matricule</span><span>:</span><span>{d.student.matricule}</span>
              <span>Date de naissance</span><span>:</span><span>{dateLong(d.student.dateNaissance)}</span>
              <span>Période</span><span>:</span><span>{d.periodLabel}</span>
            </div>
          )}
          <table className="notes" style={{ border: `1px solid ${dark ? '#2a4677' : '#dfe6f2'}` }}>
            <thead><tr style={th}><th>Matières</th><th className="n">Note</th><th>Appréciation</th></tr></thead>
            <tbody>{d.me.lines.map((l) => <tr key={l.course.id} style={dark ? { borderColor: '#2a4677' } : undefined}><td style={dark ? { borderColor: '#2a4677' } : undefined}>{shortSubject(l.subject.nom)}</td><td className="n" style={dark ? { borderColor: '#2a4677' } : undefined}>{n0(l.value)}</td><td style={dark ? { borderColor: '#2a4677' } : undefined}>{appreciation(l.value).label}</td></tr>)}</tbody>
          </table>
          <table className="notes sum" style={{ marginTop: 6 }}>
            <tbody>
              <tr style={{ background: dark ? '#14336e' : t.light, color: dark ? '#fff' : t.ink }}><td>Moyenne générale</td><td className="n" style={{ fontSize: 14 }}>{n1(d.me.general)}</td></tr>
              <tr><td>Rang</td><td className="n">{d.me.rank} / {d.report.effectif}</td></tr>
            </tbody>
          </table>
        </div>
        <div className="panel" style={{ background: dark ? t.primary : t.key === 'violet' ? '#fbfaff' : '#fff', color: dark ? '#fff' : undefined }}>
          <h4 style={{ color: dark ? '#fff' : t.key === 'vert' ? t.primary : t.ink, marginTop: 6 }}>Appréciation générale</h4>
          <div style={{ fontSize: 12, lineHeight: 1.5 }}>{d.entry.appreciation.split('. ').slice(0, 2).join('. ')}</div>
          <div style={{ width: 40, height: 2, background: dark ? t.accent : t.primary, margin: '18px 0' }} />
          <h4 style={{ color: dark ? '#fff' : t.ink }}>Absences</h4>
          <div className="abs-row"><UserCheck size={15} color={dark ? t.accent : t.primary} />Justifiées :<b>{d.absences.justifiees}</b></div>
          <div className="abs-row"><UserX size={15} color={dark ? t.accent : t.primary} />Non justifiées :<b>{d.absences.nonJustifiees}</b></div>
          <div className="abs-row"><Clock size={15} color={dark ? t.accent : t.primary} />Retards :<b>{d.absences.retards}</b></div>
          <h4 style={{ color: dark ? '#fff' : t.ink, marginTop: 20 }}>Décision du conseil</h4>
          <div className="decision" style={{ background: dark ? t.accent : t.light, color: dark ? NAVY : t.ink }}>{d.entry.decision}</div>
          <div style={{ marginTop: 26, fontSize: 12 }}>Le Directeur</div>
          <Signature image={sig(d)} color={dark ? '#fff' : '#1b2c5c'} w={130} />
          <div style={{ borderTop: `1px solid ${dark ? '#8aa0c8' : '#9aa8c4'}`, width: '85%' }} />
          <div style={{ marginTop: 'auto', fontStyle: 'italic', fontSize: 11, textAlign: 'center', color: dark ? '#cfd8ea' : '#5b6782' }}>{t.quote}</div>
        </div>
      </div>
    </div>
  );
}

export type BulletinModel = 'annuel' | 'annuel100' | 'livret' | 'tripliable' | 'prescolaire';
export const BULLETIN_MODELS: { key: BulletinModel; nom: string; desc: string; pages: string; annualOnly?: boolean; prescolaire?: boolean }[] = [
  { key: 'tripliable', nom: 'Tripliable (6 thèmes)', desc: 'Bulletin de période ou annuel, recto + verso, à plier en 3.', pages: 'Recto + verso' },
  { key: 'annuel', nom: 'Bulletin annuel /20', desc: 'Tableau complet C1 à C5, évolution, résultat global.', pages: '1 page', annualOnly: true },
  { key: 'annuel100', nom: 'Bulletin annuel /100', desc: 'Notes sur 100 avec coefficients et examen final.', pages: '1 page', annualOnly: true },
  { key: 'livret', nom: 'Livret 3 volets + dos', desc: 'Résultats annuels, suivi, comportement et décision.', pages: 'Recto + verso', annualOnly: true },
  { key: 'prescolaire', nom: 'Livret préscolaire', desc: 'Compétences Acquis / En cours / Non acquis, sans note ni rang.', pages: 'Recto + verso', prescolaire: true },
];

/** Rend toutes les pages d'un bulletin pour un élève. */
export function BulletinPages({ d, model, theme, sides = 'both' }: { d: BulletinData; model: BulletinModel; theme: TriTheme; sides?: 'both' | 'recto' | 'verso' }) {
  const pages: ReactNode[] = [];
  if (model === 'annuel') pages.push(<BulletinAnnuel key="a" d={d} />);
  if (model === 'annuel100') pages.push(<BulletinAnnuel100 key="a" d={d} />);
  if (model === 'livret') { if (sides !== 'verso') pages.push(<LivretRecto key="r" d={d} />); if (sides !== 'recto') pages.push(<LivretVerso key="v" d={d} />); }
  if (model === 'prescolaire') { if (sides !== 'verso') pages.push(<PrescolaireRecto key="r" d={d} />); if (sides !== 'recto') pages.push(<PrescolaireVerso key="v" d={d} />); }
  if (model === 'tripliable') { if (sides !== 'verso') pages.push(<TrifoldRecto key="r" d={d} t={theme} />); if (sides !== 'recto') pages.push(<TrifoldVerso key="v" d={d} t={theme} />); }
  return <>{pages.map((p, i) => <div className="print-page" key={i}>{p}</div>)}</>;
}
