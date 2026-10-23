// Livret du préscolaire : évaluation par compétences (Acquis / En cours / Non acquis), sans note ni rang.
import { LEVELS, levelOf } from '../data/compute';
import { dateLong } from '../lib/format';
import { DocLogo, Signature, PhotoOrSilhouette, type BulletinData } from './common';

const INK = '#3b2a6b';
const ACCENT = '#7c5cd6';
const SOFT = '#f3effd';

const DOMAIN_HINT: Record<string, string> = {
  'ps-lang': 'Écouter, parler, reconnaître les lettres, tenir son crayon',
  'ps-math': 'Compter, classer, reconnaître les formes et les couleurs',
  'ps-monde': 'Le corps, la nature, le temps qui passe, Haïti',
  'ps-mot': 'Courir, sauter, découper, coller, enfiler',
  'ps-art': 'Dessiner, peindre, chanter, réciter des comptines',
  'ps-vivre': 'Partager, attendre son tour, respecter les règles',
};

function Mark({ v, big }: { v: number | null | undefined; big?: boolean }) {
  const l = levelOf(v);
  if (!l) return <span style={{ color: '#a5a0b8' }}>—</span>;
  return (
    <span style={{ display: 'inline-block', minWidth: big ? 44 : 34, padding: big ? '4px 8px' : '2px 6px', borderRadius: 999, background: l.bg, color: l.color, fontWeight: 800, fontSize: big ? 13 : 11 }}>{l.code}</span>
  );
}

function Legend() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {LEVELS.map((l) => (
        <div key={l.code} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
          <span style={{ minWidth: 34, textAlign: 'center', padding: '2px 6px', borderRadius: 999, background: l.bg, color: l.color, fontWeight: 800 }}>{l.code}</span>{l.label}
        </div>
      ))}
    </div>
  );
}

export function PrescolaireRecto({ d }: { d: BulletinData }) {
  const ps = d.periods;
  const final = levelOf(d.me.general);
  const box = { border: '1px solid #e2dbf6', borderRadius: 10, padding: '10px 12px' } as const;
  return (
    <div className="doc-page">
      <div style={{ display: 'grid', gridTemplateColumns: '78mm 1fr', height: '100%' }}>
        <div style={{ background: SOFT, padding: '16px 16px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <DocLogo school={d.school} size={52} />
            <div><b style={{ color: INK, fontSize: 14, fontWeight: 800 }}>{d.school.nom}</b><div style={{ fontSize: 10, color: INK }}>{d.school.devise}</div></div>
          </div>
          <div style={{ textAlign: 'center', marginTop: 4 }}>
            <PhotoOrSilhouette src={d.student.photo} style={{ width: 92, height: 100, borderRadius: 14, margin: '0 auto', border: `3px solid #fff`, boxShadow: '0 2px 8px rgba(60,40,120,.15)' }} />
            <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginTop: 8 }}>{d.student.prenom} {d.student.nom}</div>
            <div style={{ fontSize: 11, color: ACCENT, fontWeight: 600 }}>{d.report.classe.nom}</div>
          </div>
          <div style={{ ...box, background: '#fff', fontSize: 10.5, display: 'grid', gap: 3 }}>
            <div>Né{d.student.sexe === 'F' ? 'e' : ''} le : <b>{dateLong(d.student.dateNaissance)}</b></div>
            <div>Matricule : <b>{d.student.matricule}</b></div>
            <div>Maîtresse : <b>{d.titulaire || '—'}</b></div>
            <div>Année scolaire : <b>{d.yearLabel}</b></div>
          </div>
          <div style={{ ...box, background: '#fff' }}>
            <div style={{ fontWeight: 700, color: INK, marginBottom: 6, fontSize: 11.5 }}>Assiduité</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', fontSize: 10.5, gap: 2 }}>
              <span>Absences justifiées</span><b>{d.absences.justifiees}</b>
              <span>Absences non justifiées</span><b>{d.absences.nonJustifiees}</b>
              <span>Retards</span><b>{d.absences.retards}</b>
            </div>
          </div>
          <div style={{ ...box, background: '#fff' }}>
            <div style={{ fontWeight: 700, color: INK, marginBottom: 6, fontSize: 11.5 }}>Comment lire ce livret</div>
            <Legend />
          </div>
        </div>
        <div style={{ padding: '16px 18px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 900, color: INK, letterSpacing: '.02em' }}>LIVRET DE COMPÉTENCES</div>
              <div style={{ fontSize: 11, letterSpacing: '.35em', color: ACCENT, fontWeight: 600 }}>PRÉSCOLAIRE · {d.scope === 'annuel' ? 'BILAN DE L’ANNÉE' : d.periodLabel.toUpperCase()}</div>
            </div>
            {final && <div style={{ textAlign: 'right', fontSize: 10.5, color: INK }}>Bilan général<div style={{ marginTop: 3 }}><Mark v={d.me.general} big /></div></div>}
          </div>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 11, border: '1px solid #e2dbf6', borderRadius: 10, overflow: 'hidden', tableLayout: 'fixed' }}>
            <colgroup><col style={{ width: '42%' }} />{ps.map((p) => <col key={p.id} />)}<col style={{ width: '13%' }} /></colgroup>
            <thead>
              <tr style={{ background: INK, color: '#fff' }}>
                <th style={{ textAlign: 'left', padding: '7px 10px' }}>Domaines d’apprentissage</th>
                {ps.map((p) => <th key={p.id} style={{ padding: 7 }}>{p.court}</th>)}
                <th style={{ padding: 7 }}>Bilan</th>
              </tr>
            </thead>
            <tbody>
              {d.me.lines.map((l, i) => (
                <tr key={l.course.id} style={{ background: i % 2 ? '#faf8ff' : '#fff' }}>
                  <td style={{ padding: '11px 10px', borderTop: '1px solid #eee8fb' }}>
                    <b style={{ color: INK }}>{l.subject.nom}</b>
                    {DOMAIN_HINT[l.subject.id] && <div style={{ fontSize: 9.5, color: '#6d6688', lineHeight: 1.2 }}>{DOMAIN_HINT[l.subject.id]}</div>}
                  </td>
                  {ps.map((p) => <td key={p.id} style={{ textAlign: 'center', borderTop: '1px solid #eee8fb' }}><Mark v={l.byPeriod[p.id]} /></td>)}
                  <td style={{ textAlign: 'center', borderTop: '1px solid #eee8fb' }}><Mark v={l.value} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 10 }}>
            <div style={box}>
              <div style={{ fontWeight: 700, color: INK, fontSize: 11.5 }}>Mot de la maîtresse</div>
              <div style={{ fontSize: 11, marginTop: 4 }}>{d.entry.appreciation}</div>
              <div style={{ fontSize: 10.5, marginTop: 4, color: '#6d6688' }}>{d.entry.observations}</div>
            </div>
            <div style={{ ...box, background: SOFT, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: 10.5, color: INK }}>{d.scope === 'annuel' ? 'Décision de fin d’année' : 'Bilan de la période'}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: INK, marginTop: 2 }}>{d.entry.decision}</div>
            </div>
          </div>
          <div style={{ marginTop: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'end', fontSize: 10.5, borderTop: '1px solid #e2dbf6', paddingTop: 6 }}>
            <div style={{ color: INK }}>Fait à {d.school.commune}, le {dateLong(d.periods.find((x) => x.id === d.scope)?.fin ?? d.periods[d.periods.length - 1]?.fin)}</div>
            <div className="d-sign"><span>La Maîtresse</span><Signature variant={2} w={90} color={INK} /><div className="line" /><span>{d.titulaire}</span></div>
            <div className="d-sign"><span>La Direction</span><Signature image={d.school.signatureDirecteur} w={90} color={INK} /><div className="line" /><span>{d.school.directeur}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PrescolaireVerso({ d }: { d: BulletinData }) {
  const box = { border: '1px solid #e2dbf6', borderRadius: 10, padding: '12px 14px' } as const;
  return (
    <div className="doc-page">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, padding: '18px 20px', height: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ ...box, background: SOFT }}>
            <div style={{ fontWeight: 800, color: INK, fontSize: 14 }}>Chers parents,</div>
            <p style={{ fontSize: 11, margin: '6px 0 0' }}>
              Au préscolaire, votre enfant n’a pas de notes. La maîtresse observe ce qu’il sait faire seul, ce qu’il est en train d’apprendre
              et ce qui demande encore du temps. Chaque enfant avance à son rythme : encouragez-le, lisez-lui des histoires,
              comptez avec lui, chantez ensemble. Votre présence fait toute la différence.
            </p>
          </div>
          <div style={box}>
            <div style={{ fontWeight: 700, color: INK, fontSize: 12, marginBottom: 8 }}>Les niveaux</div>
            <Legend />
          </div>
          <div style={box}>
            <div style={{ fontWeight: 700, color: INK, fontSize: 12, marginBottom: 6 }}>Signature des parents</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10.5 }}>
              <tbody>
                {d.periods.map((p) => (
                  <tr key={p.id}><td style={{ padding: '7px 0', borderBottom: '1px dashed #d8cff3', width: '35%' }}>{p.libelle}</td><td style={{ borderBottom: '1px dashed #d8cff3' }} /></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: INK, color: '#fff', borderRadius: 16, padding: 20, gap: 10 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 10 }}><DocLogo school={d.school} size={90} /></div>
          <div style={{ fontSize: 20, fontWeight: 900 }}>{d.school.nom}</div>
          <div style={{ fontSize: 11, opacity: 0.85 }}>{d.school.devise}</div>
          <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: '.04em', marginTop: 14 }}>LIVRET DU PRÉSCOLAIRE</div>
          <div style={{ fontSize: 13 }}>{d.student.prenom} {d.student.nom} · {d.report.classe.code}</div>
          <div style={{ fontSize: 12, opacity: 0.85 }}>Année scolaire {d.yearLabel}</div>
          <div style={{ fontStyle: 'italic', fontSize: 11, marginTop: 16, opacity: 0.85 }}>« {d.school.slogan} »</div>
          <div style={{ fontSize: 10, marginTop: 'auto', opacity: 0.8 }}>{d.school.adresse}, {d.school.commune} · {d.school.telephone} · {d.school.email}</div>
        </div>
      </div>
    </div>
  );
}
