import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Mail, Home, Users, Pencil, FileText, Wallet, CalendarCheck, Printer, Archive, ArrowUp, ArrowDown, ArrowRightLeft, IdCard, CheckCircle2, Circle } from 'lucide-react';
import { db, useCollection, useDoc } from '../data/store';
import type { Student } from '../data/types';
import { Avatar, Badge, Menu, StatusBadge, Confirm, toast, Modal, Field } from './ui';
import { appreciation, classReport, fmtNote, sortedPeriods } from '../data/compute';
import { money, dateLong, dateShort, age, fullName } from '../lib/format';
import { balances } from '../lib/finance';
import { useSession, audit } from '../lib/session';
import { printDocument } from '../lib/print';
import { StudentSheet } from '../docs/Sheets';

type Tab = 'Aperçu' | 'Notes' | 'Finance' | 'Présences' | 'Documents' | 'Historique';

export function StudentPanel({ student }: { student: Student }) {
  const nav = useNavigate();
  const session = useSession()!;
  const canEdit = session.can('eleves', 'write');
  const classe = useDoc('classes', student.classeId);
  const guardians = useCollection('guardians').filter((g) => student.tuteurIds.includes(g.id));
  const payments = useCollection('payments').filter((p) => p.eleveId === student.id);
  const attendance = useCollection('attendance');
  const incidents = useCollection('incidents').filter((i) => i.eleveId === student.id);
  const classes = useCollection('classes');
  useCollection('grades');
  const [tab, setTab] = useState<Tab>('Aperçu');
  const [archive, setArchive] = useState(false);
  const [transfer, setTransfer] = useState(false);
  const periods = sortedPeriods();
  const principal = guardians.find((g) => g.principal) ?? guardians[0];

  const reports = useMemo(() => periods.map((p) => ({ p, r: classReport(student.classeId, p.id)?.students.find((x) => x.student.id === student.id) })), [student.id, student.classeId, periods]);
  const annual = classReport(student.classeId, 'annuel');
  const me = annual?.students.find((x) => x.student.id === student.id);
  const filled = reports.filter((x) => x.r?.general != null);
  const last = filled[filled.length - 1];
  const prev = filled[filled.length - 2];
  const delta = last && prev ? last.r!.general! - prev.r!.general! : 0;

  const att = useMemo(() => {
    const days = new Set(attendance.filter((a) => a.classeId === student.classeId && !a.eleveId).map((a) => a.date));
    const mine = attendance.filter((a) => a.eleveId === student.id);
    const abs = mine.filter((a) => a.statut === 'Absent' || a.statut === 'Excusé').length;
    return { total: days.size, present: days.size - abs, rate: days.size ? 1 - abs / days.size : 1, mine };
  }, [attendance, student.id, student.classeId]);
  const bal = balances().get(student.id);

  const printSheet = () => printDocument(<StudentSheet student={student} />, 'A4 portrait', `Fiche ${fullName(student)}`);

  return (
    <div className="stack">
      <div className="card card-pad">
        <div className="row" style={{ alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <Avatar src={student.photo} name={fullName(student)} size={112} square />
          <div className="grow" style={{ minWidth: 200 }}>
            <div className="row wrap" style={{ gap: 10 }}>
              <h2 style={{ fontSize: 20 }}>{fullName(student)}</h2>
              <StatusBadge s={student.statut} />
            </div>
            <div className="small" style={{ color: 'var(--text)', lineHeight: 1.75, marginTop: 6 }}>
              Matricule : {student.matricule}<br />
              Classe : {classe?.nom}<br />
              Né{student.sexe === 'F' ? 'e' : ''} le : {dateLong(student.dateNaissance)} ({age(student.dateNaissance)} ans)<br />
              Sexe : {student.sexe === 'F' ? 'Féminin' : 'Masculin'}
            </div>
          </div>
          <div className="row">
            {canEdit && <button className="btn btn-primary" onClick={() => nav(`/inscriptions/${student.id}`)}>Modifier</button>}
            <Menu items={[
              { label: 'Voir le bulletin', icon: <FileText />, onClick: () => nav(`/documents/bulletins?classe=${student.classeId}&eleve=${student.id}`) },
              { label: 'Générer le badge', icon: <IdCard />, onClick: () => nav(`/documents/badges?type=eleve&eleve=${student.id}`) },
              { label: 'Imprimer la fiche', icon: <Printer />, onClick: printSheet },
              ...(canEdit ? ['sep' as const, { label: 'Changer de classe', icon: <ArrowRightLeft />, onClick: () => setTransfer(true) }, { label: 'Archiver l’élève', icon: <Archive />, onClick: () => setArchive(true), danger: true }] : []),
            ]} />
          </div>
        </div>
        <div className="form-grid mt-16 small" style={{ gap: 10 }}>
          <div className="row"><Phone size={17} color="var(--primary)" />{student.telephone ?? principal?.telephone ?? '-'}</div>
          <div className="row"><Mail size={17} color="var(--primary)" /><span className="ellipsis">{student.email ?? principal?.email ?? '-'}</span></div>
          <div className="row"><Home size={17} color="var(--primary)" />{student.adresse}, {student.commune}</div>
          <div className="row"><Users size={17} color="var(--primary)" /><span className="ellipsis">Parent : {principal ? `${principal.sexe === 'F' ? 'Mme' : 'M.'} ${principal.nom} ${principal.prenom} (${principal.telephone})` : '-'}</span></div>
        </div>
      </div>

      <div className="pills" style={{ width: '100%', overflowX: 'auto', flexWrap: 'nowrap' }}>
        {(['Aperçu', 'Notes', 'Finance', 'Présences', 'Documents', 'Historique'] as Tab[]).map((t) => <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t}</button>)}
      </div>

      {tab === 'Aperçu' && (
        <>
          <div className="kpis">
            <div className="card kpi"><div className="t">Moyenne générale</div><div className="v">{fmtNote(last?.r?.general)} <small>/ 20</small></div><div className="s">{delta !== 0 && <span className={delta > 0 ? 'trend-up' : 'trend-down'}>{delta > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />} {delta > 0 ? '+' : ''}{fmtNote(delta)}</span>}<br />{last?.p.libelle}</div></div>
            <div className="card kpi"><div className="t">Rang de la classe</div><div className="v">{last?.r?.rank ?? '-'} <small>/ {annual?.effectif}</small></div></div>
            <div className="card kpi"><div className="t">Présence</div><div className="v">{Math.round(att.rate * 100)}%</div><div className="s">{att.present} / {att.total} jours</div></div>
            <div className="card kpi"><div className="t">Situation financière</div><div style={{ margin: '10px 0 6px' }}>{bal && bal.rest === 0 ? <Badge tone="green"><ArrowUp />À jour</Badge> : <Badge tone="orange">Reste {money(bal?.rest ?? 0)}</Badge>}</div><div className="s">Année {useDoc('years', student.anneeId)?.libelle}</div></div>
          </div>
          <div className="card">
            <div className="card-head"><h3>Derniers résultats</h3><button className="link" style={{ border: 0, background: 'none', color: 'var(--primary)' }} onClick={() => setTab('Notes')}>Voir tous</button></div>
            <div className="table-wrap" style={{ padding: '0 16px 16px' }}>
              <table className="t" style={{ border: '1px solid var(--line)', borderRadius: 10 }}>
                <thead><tr><th>Contrôle</th><th>Moyenne</th><th>Rang</th><th>Appréciation</th></tr></thead>
                <tbody>
                  {reports.map(({ p, r }) => {
                    const a = appreciation(r?.general);
                    return <tr key={p.id}><td>{p.libelle}</td><td>{fmtNote(r?.general)}</td><td>{r?.general != null ? `${r.rank}/${annual?.effectif}` : '-'}</td><td style={{ color: a.tone === 'insuffisant' ? 'var(--red)' : 'var(--green)', fontWeight: 500 }}>{r?.general != null ? a.label : '-'}</td></tr>;
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="grid g-2">
            <div className="card card-pad">
              <h3 style={{ fontSize: 16 }} className="mb-8">Informations complémentaires</h3>
              <div className="info">
                <div>Date d’inscription</div><div>{dateLong(student.dateInscription)}</div>
                <div>Redoublant</div><div style={{ color: student.redoublant ? 'var(--orange)' : 'var(--green)' }}>{student.redoublant ? 'Oui' : 'Non'}</div>
                <div>Régime</div><div>{student.regime}</div>
                <div>Groupe sanguin</div><div>{student.medical.groupeSanguin ?? '-'}</div>
                <div>Allergies</div><div>{student.medical.allergies ?? 'Aucune'}</div>
                <div>Langue d’enseignement</div><div>{student.langue}</div>
                <div>Notes particulières</div><div>{student.notesParticulieres ?? '-'}</div>
              </div>
            </div>
            <div className="card card-pad">
              <h3 style={{ fontSize: 16 }} className="mb-12">Actions rapides</h3>
              <div className="qa">
                {canEdit && <button onClick={() => nav(`/inscriptions/${student.id}`)}><Pencil />Modifier le profil</button>}
                <button onClick={() => nav(`/documents/bulletins?classe=${student.classeId}&eleve=${student.id}`)}><FileText />Voir le bulletin</button>
                <button onClick={() => setTab('Finance')}><Wallet />Voir la situation financière</button>
                <button onClick={() => setTab('Présences')}><CalendarCheck />Voir les présences</button>
                <button onClick={printSheet}><Printer />Imprimer la fiche</button>
                {canEdit && <button className="danger" onClick={() => setArchive(true)}><Archive />Archiver l’élève</button>}
              </div>
            </div>
          </div>
        </>
      )}

      {tab === 'Notes' && annual && me && (
        <div className="card">
          <div className="table-wrap">
            <table className="t t-compact">
              <thead><tr><th>Matière</th><th className="c">Coef.</th>{periods.map((p) => <th key={p.id} className="c">{p.court}</th>)}<th className="c">Moy.</th><th className="c">Classe</th></tr></thead>
              <tbody>
                {me.lines.map((l) => (
                  <tr key={l.course.id}>
                    <td>{l.subject.nom}</td><td className="c">{l.course.coefficient}</td>
                    {periods.map((p) => <td key={p.id} className="c">{fmtNote(l.byPeriod[p.id])}</td>)}
                    <td className="c bold">{fmtNote(l.value)}</td><td className="c muted">{fmtNote(l.classAvg)}</td>
                  </tr>
                ))}
                <tr style={{ background: 'var(--primary-50)' }}><td className="bold">Moyenne générale</td><td />{periods.map((p) => <td key={p.id} className="c bold">{fmtNote(me.byPeriod[p.id])}</td>)}<td className="c bold">{fmtNote(me.general)}</td><td className="c">{fmtNote(annual.classGeneral)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'Finance' && (
        <div className="card">
          <div className="card-pad row wrap" style={{ gap: 24 }}>
            <div><div className="small muted">Total dû</div><div className="bold" style={{ fontSize: 18 }}>{money(bal?.due ?? 0)}</div></div>
            <div><div className="small muted">Payé</div><div className="bold" style={{ fontSize: 18, color: 'var(--green)' }}>{money(bal?.paid ?? 0)}</div></div>
            <div><div className="small muted">Reste</div><div className="bold" style={{ fontSize: 18, color: bal?.rest ? 'var(--red)' : 'var(--green)' }}>{money(bal?.rest ?? 0)}</div></div>
            {session.can('finance', 'write') && <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={() => nav(`/finance?tab=paiements&new=1&eleve=${student.id}`)}>Enregistrer un paiement</button>}
          </div>
          <div className="table-wrap"><table className="t"><thead><tr><th>Date</th><th>Reçu</th><th>Motif</th><th>Mode</th><th className="num">Montant</th><th>Statut</th></tr></thead>
            <tbody>{payments.sort((a, b) => b.date.localeCompare(a.date)).map((p) => <tr key={p.id}><td>{dateShort(p.date)}</td><td>{p.recu}</td><td>{p.motif}{p.versement ? ` · ${p.versement}` : ''}</td><td>{p.mode}</td><td className="num">{money(p.montant)}</td><td><StatusBadge s={p.statut} /></td></tr>)}</tbody></table></div>
        </div>
      )}

      {tab === 'Présences' && (
        <div className="card">
          <div className="card-pad small muted">Seules les absences, retards et excuses sont listés. Taux de présence : <b style={{ color: 'var(--ink)' }}>{Math.round(att.rate * 100)}%</b></div>
          <div className="table-wrap"><table className="t"><thead><tr><th>Date</th><th>Statut</th><th>Motif</th></tr></thead>
            <tbody>{att.mine.sort((a, b) => b.date.localeCompare(a.date)).map((a) => <tr key={a.id}><td>{dateShort(a.date)}</td><td><StatusBadge s={a.statut} /></td><td>{a.motif ?? '-'}</td></tr>)}
              {att.mine.length === 0 && <tr><td colSpan={3} className="muted center">Aucune absence enregistrée.</td></tr>}</tbody></table></div>
        </div>
      )}

      {tab === 'Documents' && (
        <div className="card card-pad">
          <div className="stack" style={{ gap: 8 }}>
            {student.documents.map((d) => (
              <div key={d.type} className="row between file-tile" onClick={() => canEdit && db.patch('students', student.id, { documents: student.documents.map((x) => x.type === d.type ? { ...x, fourni: !x.fourni } : x) })}>
                <span className="row">{d.fourni ? <CheckCircle2 color="var(--green)" size={18} /> : <Circle color="var(--faint)" size={18} />}{d.type}</span>
                <Badge tone={d.fourni ? 'green' : 'orange'}>{d.fourni ? 'Fourni' : 'Manquant'}</Badge>
              </div>
            ))}
          </div>
          <p className="tiny muted mt-12">Touchez un document pour changer son état.</p>
        </div>
      )}

      {tab === 'Historique' && (
        <div className="card card-pad">
          <div className="stack" style={{ gap: 10 }}>
            <div className="row"><Badge tone="blue">Inscription</Badge><span className="small">{dateLong(student.dateInscription)} — {student.typeInscription} en {classe?.code}</span></div>
            {incidents.map((i) => <div key={i.id} className="row"><Badge tone={i.type === 'Félicitations' ? 'green' : 'orange'}>{i.type}</Badge><span className="small">{dateShort(i.date)} — {i.description}{i.sanction ? ` (${i.sanction})` : ''}</span></div>)}
            {student.ecoleProvenance && <div className="row"><Badge tone="gray">Provenance</Badge><span className="small">{student.ecoleProvenance}</span></div>}
          </div>
        </div>
      )}

      <Confirm open={archive} onClose={() => setArchive(false)} danger title="Archiver l’élève" confirmLabel="Archiver"
        message={`${fullName(student)} ne figurera plus dans les listes actives. Ses notes et paiements sont conservés.`}
        onConfirm={() => { db.patch('students', student.id, { statut: 'Archivé' }); audit('Archivage élève', fullName(student)); toast('Élève archivé'); nav('/eleves'); }} />
      <TransferModal open={transfer} onClose={() => setTransfer(false)} student={student} classes={classes} />
    </div>
  );
}

function TransferModal({ open, onClose, student, classes }: { open: boolean; onClose: () => void; student: Student; classes: { id: string; code: string; nom: string }[] }) {
  const [to, setTo] = useState(student.classeId);
  return (
    <Modal open={open} onClose={onClose} title="Changer de classe" footer={<><button className="btn" onClick={onClose}>Annuler</button><button className="btn btn-primary" onClick={() => { db.patch('students', student.id, { classeId: to }); audit('Changement de classe', `${fullName(student)} → ${classes.find((c) => c.id === to)?.code}`); toast('Classe mise à jour'); onClose(); }}>Enregistrer</button></>}>
      <Field label="Nouvelle classe"><select className="select" value={to} onChange={(e) => setTo(e.target.value)}>{classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}</select></Field>
      <p className="small muted mt-12">Les notes déjà saisies restent liées à l’ancienne classe pour l’historique.</p>
    </Modal>
  );
}
