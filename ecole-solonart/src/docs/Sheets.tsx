// Documents A4 simples : fiches, listes, reçus, palmarès, emplois du temps, états financiers.
import { Fragment, type ReactNode } from 'react';
import { db } from '../data/store';
import type { Evaluation, Guardian, Payment, Student, TimetableSlot } from '../data/types';
import { classReport, evaluationStats, fmtNote, isPreschool, levelOf, LEVELS, sortedPeriods } from '../data/compute';
import { money, dateLong, dateShort, fullName, civ, monthLabel, age } from '../lib/format';
import { balances } from '../lib/finance';
import { DocLogo, QR, Signature, PhotoOrSilhouette } from './common';

const NAVY = '#0d2a63';
const th: React.CSSProperties = { background: '#2457b3', color: '#fff', padding: '6px 8px', textAlign: 'left', fontWeight: 600, fontSize: 11 };
const td: React.CSSProperties = { padding: '5px 8px', borderBottom: '1px solid #e1e8f4', fontSize: 11 };

export function A4({ title, sub, children, landscape, footer }: { title: string; sub?: ReactNode; children: ReactNode; landscape?: boolean; footer?: ReactNode }) {
  const school = db.get('school', 'main')!;
  const year = db.get('years', school.anneeCourante);
  return (
    <div className={`doc-page ${landscape ? '' : 'portrait'}`} style={{ padding: '14mm 14mm 12mm', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, borderBottom: '2px solid #2457b3', paddingBottom: 10 }}>
        <DocLogo school={school} size={52} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 19, fontWeight: 800, color: NAVY }}>{school.nom}</div>
          <div style={{ fontSize: 10.5, color: '#46557a' }}>{school.devise} · {school.adresse}, {school.commune}, Haïti · {school.telephone} · {school.email}</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 11, color: NAVY }}>Année scolaire<br /><b style={{ fontSize: 14 }}>{year?.libelle}</b></div>
      </div>
      <div style={{ margin: '14px 0 12px' }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: NAVY }}>{title}</div>
        {sub && <div style={{ fontSize: 11.5, color: '#46557a', marginTop: 2 }}>{sub}</div>}
      </div>
      <div style={{ flex: 1 }}>{children}</div>
      <div style={{ borderTop: '1px solid #c8d6ef', paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: 10, color: '#46557a' }}>
        {footer ?? <span>Document généré le {dateLong(new Date().toISOString().slice(0, 10))}</span>}
        <span>{school.nom} — {school.devise}</span>
      </div>
    </div>
  );
}
const page = (node: ReactNode, key?: string | number) => <div className="print-page" key={key}>{node}</div>;

function Signatures({ left = 'Le Secrétariat', right = 'La Direction' }: { left?: string; right?: string }) {
  const school = db.get('school', 'main')!;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginTop: 30, fontSize: 11, textAlign: 'center' }}>
      <div>{left}<div style={{ height: 50 }} /><div style={{ borderTop: '1px solid #8aa0c8' }} /></div>
      <div>{right}<div style={{ height: 50, display: 'grid', placeItems: 'center' }}><Signature image={school.signatureDirecteur} w={110} /></div><div style={{ borderTop: '1px solid #8aa0c8' }} />{school.directeur}</div>
    </div>
  );
}

function KV({ rows, cols = 2 }: { rows: [string, ReactNode][]; cols?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, columnGap: 20, fontSize: 11.5 }}>
      {rows.map(([k, v]) => <div key={k} style={{ display: 'grid', gridTemplateColumns: '42% 1fr', padding: '5px 0', borderBottom: '1px solid #e8eef7' }}><span style={{ color: '#56627d' }}>{k}</span><b style={{ fontWeight: 600, color: '#1d2a44' }}>{v || '-'}</b></div>)}
    </div>
  );
}
const H = ({ children }: { children: ReactNode }) => <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, margin: '16px 0 6px', textTransform: 'uppercase', letterSpacing: '.04em' }}>{children}</div>;

// ------------------------------------------------------------------
export function StudentSheet({ student }: { student: Student }) {
  const c = db.get('classes', student.classeId);
  const gs = student.tuteurIds.map((g) => db.get('guardians', g)).filter(Boolean) as Guardian[];
  const b = balances().get(student.id);
  const r = classReport(student.classeId, 'annuel')?.students.find((x) => x.student.id === student.id);
  return page(
    <A4 title="Fiche de l’élève" sub={`${fullName(student)} · ${student.matricule}`}>
      <div style={{ display: 'flex', gap: 18 }}>
        <PhotoOrSilhouette src={student.photo} style={{ width: 110, height: 130, borderRadius: 10 }} />
        <div style={{ flex: 1 }}><KV cols={1} rows={[['Nom et prénom', fullName(student)], ['Matricule', student.matricule], ['Classe', c?.nom], ['Date de naissance', `${dateLong(student.dateNaissance)} (${age(student.dateNaissance)} ans)`], ['Lieu de naissance', student.lieuNaissance], ['Sexe', student.sexe === 'F' ? 'Féminin' : 'Masculin']]} /></div>
      </div>
      <H>Identité & scolarité</H>
      <KV rows={[['Nationalité', student.nationalite], ['N° acte de naissance', student.numeroActe], ['NIN', student.nin], ['Religion', student.religion], ['Adresse', `${student.adresse}, ${student.commune}`], ['Téléphone', student.telephone], ['Régime', student.regime], ['Type d’inscription', student.typeInscription], ['Date d’inscription', dateShort(student.dateInscription)], ['Redoublant', student.redoublant ? 'Oui' : 'Non'], ['Boursier', student.boursier ? `Oui (${student.tauxBourse}%)` : 'Non'], ['Statut', student.statut]]} />
      <H>Responsables</H>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr><th style={th}>Nom</th><th style={th}>Lien</th><th style={th}>Téléphone</th><th style={th}>Email</th><th style={th}>Profession</th></tr></thead>
        <tbody>{gs.map((g) => <tr key={g.id}><td style={td}>{fullName(g)}{g.principal ? ' ★' : ''}</td><td style={td}>{g.lien}</td><td style={td}>{g.telephone}</td><td style={td}>{g.email ?? '-'}</td><td style={td}>{g.profession ?? '-'}</td></tr>)}</tbody></table>
      {student.contactUrgence && <p style={{ fontSize: 11, marginTop: 6 }}>Contact d’urgence : <b>{student.contactUrgence.nom}</b> — {student.contactUrgence.telephone}</p>}
      <H>Santé</H>
      <KV rows={[['Groupe sanguin', student.medical.groupeSanguin], ['Allergies', student.medical.allergies ?? 'Aucune'], ['Problèmes de santé', student.medical.problemes ?? 'Aucun'], ['Assurance', student.medical.assurance]]} />
      <H>Résultats & finance</H>
      <KV rows={[['Moyenne annuelle', `${fmtNote(r?.general)} / 20`], ['Rang', r?.rank ? `${r.rank}` : '-'], ['Total dû', money(b?.due ?? 0)], ['Reste à payer', money(b?.rest ?? 0)]]} />
      <Signatures />
    </A4>,
  );
}

export function EnrollmentSheet({ student }: { student: Student }) {
  const c = db.get('classes', student.classeId)!;
  const gs = student.tuteurIds.map((g) => db.get('guardians', g)).filter(Boolean) as Guardian[];
  return page(
    <A4 title="Fiche d’inscription" sub={`Inscription n° ${student.matricule} du ${dateLong(student.dateInscription)}`}>
      <div style={{ display: 'flex', gap: 18 }}>
        <div style={{ flex: 1 }}><KV cols={1} rows={[['Élève', fullName(student)], ['Né(e) le', `${dateLong(student.dateNaissance)} à ${student.lieuNaissance}`], ['Classe', c.nom], ['Type', student.typeInscription], ['Régime', student.regime], ['Date d’entrée', dateLong(student.dateEntree)]]} /></div>
        <PhotoOrSilhouette src={student.photo} style={{ width: 100, height: 120, borderRadius: 10 }} />
      </div>
      <H>Responsables</H>
      {gs.map((g) => <p key={g.id} style={{ fontSize: 11.5, margin: '4px 0' }}><b>{g.lien}</b> : {fullName(g)} — {g.telephone}{g.email ? ` — ${g.email}` : ''}</p>)}
      <H>Documents remis</H>
      {student.documents.map((d) => <p key={d.type} style={{ fontSize: 11.5, margin: '3px 0' }}>{d.fourni ? '☑' : '☐'} {d.type}</p>)}
      <H>Frais de l’année</H>
      <KV rows={[['Frais d’inscription', money(c.fraisInscription)], ['Scolarité annuelle', money(c.fraisScolarite * (student.boursier ? 1 - (student.tauxBourse ?? 0) / 100 : 1))], ['Versements', '3 versements (octobre, janvier, avril)'], ['Modes acceptés', 'Espèces, MonCash, NatCash, virement']]} />
      <p style={{ fontSize: 11, marginTop: 18, lineHeight: 1.5 }}>Je soussigné(e), responsable de l’élève, certifie l’exactitude des informations ci-dessus et m’engage à respecter le règlement intérieur de l’établissement ainsi que le calendrier de paiement.</p>
      <Signatures left="Signature du parent / tuteur" right="La Direction" />
    </A4>,
  );
}

export function StudentListSheet({ students, title }: { students: Student[]; title: string }) {
  const per = 32;
  const pages = Math.max(1, Math.ceil(students.length / per));
  return <>{Array.from({ length: pages }, (_, pi) => page(
    <A4 title={title} sub={`${students.length} élèves · page ${pi + 1}/${pages}`}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr><th style={th}>#</th><th style={th}>Nom et prénom</th><th style={th}>Matricule</th><th style={th}>Sexe</th><th style={th}>Naissance</th><th style={th}>Classe</th><th style={th}>Téléphone parent</th></tr></thead>
        <tbody>{students.slice(pi * per, pi * per + per).map((s, i) => <tr key={s.id}><td style={td}>{pi * per + i + 1}</td><td style={td}>{s.nom} {s.prenom}</td><td style={td}>{s.matricule}</td><td style={td}>{s.sexe}</td><td style={td}>{dateShort(s.dateNaissance)}</td><td style={td}>{db.get('classes', s.classeId)?.code}</td><td style={td}>{db.get('guardians', s.tuteurIds[0])?.telephone}</td></tr>)}</tbody>
      </table>
    </A4>, pi))}</>;
}

export function GuardianListSheet({ guardians, kids, code }: { guardians: Guardian[]; kids: Map<string, Student[]>; code: (id: string) => string }) {
  const per = 30;
  const pages = Math.max(1, Math.ceil(guardians.length / per));
  return <>{Array.from({ length: pages }, (_, pi) => page(
    <A4 title="Liste des parents / tuteurs" sub={`${guardians.length} contacts · page ${pi + 1}/${pages}`}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr><th style={th}>Nom</th><th style={th}>Lien</th><th style={th}>Téléphone</th><th style={th}>Élève(s)</th><th style={th}>Classe(s)</th></tr></thead>
        <tbody>{guardians.slice(pi * per, pi * per + per).map((g) => <tr key={g.id}><td style={td}>{fullName(g)}</td><td style={td}>{g.lien}</td><td style={td}>{g.telephone}</td><td style={td}>{(kids.get(g.id) ?? []).map(fullName).join(', ')}</td><td style={td}>{[...new Set((kids.get(g.id) ?? []).map((s) => code(s.classeId)))].join(', ')}</td></tr>)}</tbody>
      </table>
    </A4>, pi))}</>;
}

export function GuardianSheet({ g, kids }: { g: Guardian; kids: { prenom: string; nom: string; classeId: string }[] }) {
  return page(
    <A4 title="Fiche parent / tuteur" sub={fullName(g)}>
      <KV rows={[['Nom et prénom', fullName(g)], ['Lien', g.lien], ['Téléphone', g.telephone], ['WhatsApp', g.whatsapp], ['Email', g.email], ['Profession', g.profession], ['Adresse', g.adresse], ['Statut', g.statut], ['Contact principal', g.principal ? 'Oui' : 'Non']]} />
      <H>Enfants inscrits</H>
      {kids.map((k) => <p key={k.prenom + k.nom} style={{ fontSize: 12, margin: '4px 0' }}>• {k.prenom} {k.nom} — {db.get('classes', k.classeId)?.nom}</p>)}
      {g.notes && <><H>Notes</H><p style={{ fontSize: 12 }}>{g.notes}</p></>}
    </A4>,
  );
}

export function PalmaresSheet({ ev }: { ev: Evaluation }) {
  const st = evaluationStats(ev);
  const c = db.get('classes', ev.classeId);
  const s = db.get('subjects', ev.matiereId);
  const prof = db.get('staff', db.get('courses', ev.coursId)?.professeurId);
  const pre = isPreschool(c);
  const lv = (n?: number | null) => levelOf(n == null ? null : (n / ev.noteMax) * 20);
  if (pre) return page(
    <A4 title={`Bilan de compétences — ${c?.code} · ${s?.nom}`} sub={`${ev.titre} du ${dateLong(ev.date)} · Maîtresse : ${civ(prof)}`}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        {LEVELS.map((l) => <div key={l.code} style={{ flex: 1, background: l.bg, borderRadius: 8, padding: 8, textAlign: 'center', color: l.color }}><div style={{ fontSize: 10 }}>{l.label}</div><b style={{ fontSize: 16 }}>{st.rows.filter((r) => !r.grade?.absent && lv(r.grade?.note)?.code === l.code).length}</b></div>)}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr><th style={th}>#</th><th style={th}>Enfant</th><th style={th}>Matricule</th><th style={{ ...th, textAlign: 'center' }}>Niveau</th></tr></thead>
        <tbody>{st.rows.map((r, i) => <tr key={r.student.id}><td style={td}>{i + 1}</td><td style={td}>{fullName(r.student)}</td><td style={td}>{r.student.matricule}</td><td style={{ ...td, textAlign: 'center', fontWeight: 700, color: lv(r.grade?.note)?.color }}>{r.grade?.absent ? 'Absent' : lv(r.grade?.note)?.label ?? '-'}</td></tr>)}</tbody>
      </table>
      <Signatures left="La Maîtresse" right="La Direction" />
    </A4>,
  );
  const rows = [...st.ranked, ...st.rows.filter((r) => r.grade?.note == null)];
  return page(
    <A4 title={`Palmarès — ${c?.code} · ${s?.nom}`} sub={`${ev.titre} du ${dateLong(ev.date)} · Professeur : ${civ(prof)} · Noté sur ${ev.noteMax}`}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        {[['Moyenne', fmtNote(st.moyenne)], ['Plus haute', fmtNote(st.max)], ['Plus basse', fmtNote(st.min)], ['Notes saisies', `${st.saisies}/${st.total}`]].map(([k, v]) => <div key={k} style={{ flex: 1, background: '#eef4fd', borderRadius: 8, padding: 8, textAlign: 'center' }}><div style={{ fontSize: 10 }}>{k}</div><b style={{ fontSize: 16, color: NAVY }}>{v}</b></div>)}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr><th style={th}>Rang</th><th style={th}>Élève</th><th style={th}>Matricule</th><th style={{ ...th, textAlign: 'center' }}>Note / {ev.noteMax}</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.student.id}><td style={td}>{st.rankOf.get(r.student.id) ?? '-'}</td><td style={td}>{fullName(r.student)}</td><td style={td}>{r.student.matricule}</td><td style={{ ...td, textAlign: 'center', fontWeight: 700 }}>{r.grade?.absent ? 'Absent' : fmtNote(r.grade?.note)}</td></tr>)}</tbody>
      </table>
      <Signatures left="Le Professeur" right="La Direction" />
    </A4>,
  );
}

export function ReceiptSheet({ payment }: { payment: Payment }) {
  const s = db.get('students', payment.eleveId);
  const c = db.get('classes', payment.classeId);
  const b = s ? balances().get(s.id) : undefined;
  const school = db.get('school', 'main')!;
  const one = (copy: string) => (
    <div style={{ border: '1.5px solid #2457b3', borderRadius: 12, padding: 18, position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><DocLogo school={school} size={40} /><div><b style={{ color: NAVY, fontSize: 15 }}>{school.nom}</b><div style={{ fontSize: 10 }}>{school.adresse}, {school.commune} · {school.telephone}</div></div></div>
        <div style={{ textAlign: 'right' }}><b style={{ fontSize: 17, color: NAVY }}>REÇU DE PAIEMENT</b><div style={{ fontSize: 11 }}>N° {payment.recu}</div><div style={{ fontSize: 10, color: '#56627d' }}>{copy}</div></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px', gap: 16, marginTop: 14 }}>
        <KV cols={1} rows={[['Reçu de', s ? `${fullName(s)} (${s.matricule})` : '-'], ['Classe', c?.nom], ['Motif', `${payment.motif}${payment.versement ? ` — ${payment.versement}` : ''}`], ['Mode', `${payment.mode}${payment.reference ? ` · Réf. ${payment.reference}` : ''}`], ['Date', dateLong(payment.date)], ['Reste à payer', money(b?.rest ?? 0)]]} />
        <div style={{ textAlign: 'center' }}><div style={{ background: '#eef4fd', borderRadius: 10, padding: 12 }}><div style={{ fontSize: 10 }}>Montant</div><b style={{ fontSize: 20, color: NAVY }}>{money(payment.montant)}</b></div><div style={{ marginTop: 10 }}><QR text={`${school.siteWeb}/recu/${payment.recu}`} size={70} /></div></div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 10.5 }}><span>Signature du parent</span><span style={{ textAlign: 'center' }}><Signature image={school.signatureDirecteur} w={90} /><br />Caisse / Direction</span></div>
      {payment.statut !== 'Payé' && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 50, fontWeight: 900, color: 'rgba(220,40,40,.18)', transform: 'rotate(-18deg)' }}>{payment.statut.toUpperCase()}</div>}
    </div>
  );
  return page(
    <div className="doc-page portrait" style={{ padding: '14mm', display: 'flex', flexDirection: 'column', gap: 18 }}>
      {one('Exemplaire parent')}
      <div style={{ borderTop: '1px dashed #9aa8c4', textAlign: 'center', fontSize: 9, color: '#8a95ab' }}>✂ découper ici</div>
      {one('Exemplaire école')}
    </div>,
  );
}

export function TimetableSheet({ slots, title, showClass }: { slots: TimetableSlot[]; title: string; showClass?: boolean }) {
  const HOURS = [['07:00', '07:50'], ['08:00', '08:50'], ['09:00', '09:50'], ['10:00', '10:50'], ['11:00', '11:50'], ['13:00', '13:50'], ['14:00', '14:50'], ['15:00', '15:50'], ['16:00', '16:50']];
  const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
  const cell = (s?: TimetableSlot) => {
    if (!s) return '';
    const sub = db.get('subjects', s.matiereId);
    const prof = db.get('staff', s.professeurId);
    return <><b style={{ fontSize: 10.5 }}>{sub?.nom.split(' (')[0] ?? s.libelle}</b><div style={{ fontSize: 9, color: '#56627d' }}>{prof ? `${prof.sexe === 'F' ? 'Mme' : 'M.'} ${prof.nom}` : 'Équipe'} · {showClass ? db.get('classes', s.classeId)?.code : s.salle}</div></>;
  };
  return page(
    <A4 title={title} landscape>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead><tr><th style={{ ...th, width: 90 }}>Heure</th>{DAYS.map((d) => <th key={d} style={th}>{d}</th>)}</tr></thead>
        <tbody>{HOURS.map(([a, b], i) => (<Fragment key={a}>
          {i === 5 && <tr key="lunch"><td style={{ ...td, background: '#f3f6fb' }}>12h - 13h</td><td colSpan={5} style={{ ...td, textAlign: 'center', background: '#f3f6fb', fontWeight: 600 }}>Pause déjeuner</td></tr>}
          <tr key={a}><td style={{ ...td, background: '#f3f6fb' }}>{a.replace(':', 'h')} - {b.replace(':', 'h')}</td>{DAYS.map((_, di) => <td key={di} style={{ ...td, height: 40, borderLeft: '1px solid #e1e8f4' }}>{cell(slots.find((s) => s.jour === di + 1 && s.debut === a))}</td>)}</tr>
        </Fragment>))}</tbody>
      </table>
    </A4>,
  );
}

export function FinanceReportSheet({ kind }: { kind: 'revenus' | 'balance' | 'creances' | 'salaires' | 'projets' }) {
  const payments = db.list('payments').filter((p) => p.statut === 'Payé');
  const expenses = db.list('expenses').filter((e) => e.statut === 'Payé');
  const salaries = db.list('salaries');
  const titleMap = { revenus: 'État des revenus et dépenses', balance: 'Balance comptable', creances: 'Situation des créances (élèves)', salaires: 'Rapport des salaires', projets: 'Suivi des projets' };
  const months = [...new Set([...payments.map((p) => p.date.slice(0, 7)), ...salaries.map((s) => s.periode)])].sort();
  const rev = payments.reduce((a, p) => a + p.montant, 0);
  const sal = salaries.filter((s) => s.statut === 'Payé').reduce((a, s) => a + s.montant + s.primes - s.retenues, 0);
  const dep = expenses.reduce((a, e) => a + e.montant, 0) + sal;
  let body: ReactNode = null;
  if (kind === 'revenus') body = (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr><th style={th}>Mois</th><th style={{ ...th, textAlign: 'right' }}>Revenus</th><th style={{ ...th, textAlign: 'right' }}>Salaires</th><th style={{ ...th, textAlign: 'right' }}>Autres dépenses</th><th style={{ ...th, textAlign: 'right' }}>Résultat</th></tr></thead>
      <tbody>{months.map((m) => { const r = payments.filter((p) => p.date.startsWith(m)).reduce((a, p) => a + p.montant, 0); const s = salaries.filter((x) => x.periode === m && x.statut === 'Payé').reduce((a, x) => a + x.montant + x.primes - x.retenues, 0); const e = expenses.filter((x) => x.date.startsWith(m)).reduce((a, x) => a + x.montant, 0); return <tr key={m}><td style={td}>{monthLabel(m)}</td><td style={{ ...td, textAlign: 'right' }}>{money(r)}</td><td style={{ ...td, textAlign: 'right' }}>{money(s)}</td><td style={{ ...td, textAlign: 'right' }}>{money(e)}</td><td style={{ ...td, textAlign: 'right', fontWeight: 700, color: r - s - e < 0 ? '#c0392b' : '#137a3d' }}>{money(r - s - e)}</td></tr>; })}
        <tr><td style={{ ...td, fontWeight: 800 }}>TOTAL</td><td style={{ ...td, textAlign: 'right', fontWeight: 800 }}>{money(rev)}</td><td style={{ ...td, textAlign: 'right', fontWeight: 800 }}>{money(sal)}</td><td style={{ ...td, textAlign: 'right', fontWeight: 800 }}>{money(dep - sal)}</td><td style={{ ...td, textAlign: 'right', fontWeight: 800 }}>{money(rev - dep)}</td></tr></tbody></table>
  );
  if (kind === 'balance') { let cr = 0; balances().forEach((b) => (cr += b.rest)); const det = salaries.filter((s) => s.statut === 'En attente').reduce((a, s) => a + s.montant, 0); const immo = db.list('projects').reduce((a, p) => a + p.depense, 0); body = <KV rows={[['Trésorerie', money(rev - dep)], ['Créances élèves', money(cr)], ['Immobilisations (projets)', money(immo)], ['Total actifs', money(rev - dep + cr + immo)], ['Salaires à payer', money(det)], ['Capitaux propres', money(rev - dep + cr + immo - det)]]} />; }
  if (kind === 'creances') { const b = balances(); const list = db.list('students').filter((s) => (b.get(s.id)?.rest ?? 0) > 0).sort((x, y) => (db.get('classes', x.classeId)?.code ?? '').localeCompare(db.get('classes', y.classeId)?.code ?? '')); body = <table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr><th style={th}>Élève</th><th style={th}>Classe</th><th style={{ ...th, textAlign: 'right' }}>Dû</th><th style={{ ...th, textAlign: 'right' }}>Payé</th><th style={{ ...th, textAlign: 'right' }}>Restant</th></tr></thead><tbody>{list.slice(0, 38).map((s) => { const x = b.get(s.id)!; return <tr key={s.id}><td style={td}>{fullName(s)}</td><td style={td}>{db.get('classes', s.classeId)?.code}</td><td style={{ ...td, textAlign: 'right' }}>{money(x.due)}</td><td style={{ ...td, textAlign: 'right' }}>{money(x.paid)}</td><td style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{money(x.rest)}</td></tr>; })}</tbody></table>; }
  if (kind === 'salaires') { const last = months[months.length - 1]; body = <table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr><th style={th}>Employé</th><th style={th}>Poste</th><th style={{ ...th, textAlign: 'right' }}>Brut</th><th style={{ ...th, textAlign: 'right' }}>Net</th><th style={th}>Statut</th></tr></thead><tbody>{salaries.filter((s) => s.periode === last).map((s) => { const st = db.get('staff', s.staffId); return <tr key={s.id}><td style={td}>{fullName(st)}</td><td style={td}>{st?.poste}</td><td style={{ ...td, textAlign: 'right' }}>{money(s.montant)}</td><td style={{ ...td, textAlign: 'right' }}>{money(s.montant + s.primes - s.retenues)}</td><td style={td}>{s.statut}</td></tr>; })}</tbody></table>; }
  if (kind === 'projets') body = <table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr><th style={th}>Projet</th><th style={{ ...th, textAlign: 'right' }}>Budget</th><th style={{ ...th, textAlign: 'right' }}>Dépensé</th><th style={th}>Avancement</th><th style={th}>Statut</th></tr></thead><tbody>{db.list('projects').map((p) => <tr key={p.id}><td style={td}>{p.nom}</td><td style={{ ...td, textAlign: 'right' }}>{money(p.budget)}</td><td style={{ ...td, textAlign: 'right' }}>{money(p.depense)}</td><td style={td}>{Math.round((p.depense / p.budget) * 100)}%</td><td style={td}>{p.statut}</td></tr>)}</tbody></table>;
  return page(<A4 title={titleMap[kind]} sub={`Arrêté au ${dateLong(new Date().toISOString().slice(0, 10))}`}>{body}<Signatures left="Le Comptable" right="La Direction" /></A4>);
}

/** Relevé de notes d'une classe (tous élèves) — utilisé dans Rapports. */
export function ClassResultsSheet({ classeId, scope }: { classeId: string; scope: string }) {
  const r = classReport(classeId, scope);
  if (!r) return null;
  const p = sortedPeriods().find((x) => x.id === scope);
  return page(
    <A4 title={`Résultats — ${r.classe.nom}`} sub={`${p?.libelle ?? 'Moyennes annuelles'} · Moyenne de classe ${fmtNote(r.classGeneral)} · Réussite ${Math.round(r.successRate * 100)}%`}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr><th style={th}>Rang</th><th style={th}>Élève</th>{r.students[0]?.lines.map((l) => <th key={l.course.id} style={{ ...th, fontSize: 8.5, padding: 3, textAlign: 'center' }}>{l.subject.court}</th>)}<th style={{ ...th, textAlign: 'center' }}>Moy.</th></tr></thead>
        <tbody>{[...r.students].sort((a, b) => a.rank - b.rank).map((s) => <tr key={s.student.id}><td style={td}>{s.rank}</td><td style={{ ...td, whiteSpace: 'nowrap' }}>{fullName(s.student)}</td>{s.lines.map((l) => <td key={l.course.id} style={{ ...td, textAlign: 'center', padding: 3 }}>{fmtNote(l.value)}</td>)}<td style={{ ...td, textAlign: 'center', fontWeight: 800 }}>{fmtNote(s.general)}</td></tr>)}</tbody></table>
    </A4>,
  );
}
