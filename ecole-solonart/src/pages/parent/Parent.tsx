// Espace parent : uniquement les enfants liés au compte, en lecture seule.
// Les moyennes d'une période ne sont visibles qu'une fois la période validée (verrouillée) par la direction.
import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ClipboardCheck, Wallet, NotebookPen, ChevronRight, Printer, Lock, ShieldAlert } from 'lucide-react';
import { db, useCollection, useDoc } from '../../data/store';
import type { Student } from '../../data/types';
import { classReport, evaluationsForClass, fmtNote, gradesForEvaluation, isPreschool, scaleNote, sortedPeriods } from '../../data/compute';
import { Avatar, Badge, Card, Empty, PageHead, StatCard, StatusBadge } from '../../components/ui';
import { LevelPill } from '../../components/Level';
import { dateShort, fullName, money, todayISO } from '../../lib/format';
import { balances } from '../../lib/finance';
import { useSession } from '../../lib/session';
import { printDocument } from '../../lib/print';
import { ReceiptSheet } from '../../docs/Sheets';

const KEY = 'solonart:enfant';

/** Enfants du parent connecté (jamais d'autres élèves). */
export function useChildren(): Student[] {
  const session = useSession()!;
  const students = useCollection('students');
  const gid = session.user.guardianId;
  if (!gid) return [];
  return students.filter((s) => s.tuteurIds.includes(gid) && s.statut !== 'Archivé').sort((a, b) => a.prenom.localeCompare(b.prenom, 'fr'));
}

/** Enfant choisi (mémorisé), avec un sélecteur quand le parent en a plusieurs. */
function useChild() {
  const kids = useChildren();
  const [id, setIdRaw] = useState(() => { try { return localStorage.getItem(KEY) ?? ''; } catch { return ''; } });
  const setId = (v: string) => { setIdRaw(v); try { localStorage.setItem(KEY, v); } catch { /* ignore */ } };
  const child = kids.find((k) => k.id === id) ?? kids[0];
  const picker = kids.length > 1 && (
    <div className="chips-scroll mb-16" role="tablist" aria-label="Enfant">
      {kids.map((k) => <button key={k.id} role="tab" aria-selected={k.id === child?.id} className={`chip ${k.id === child?.id ? 'active' : ''}`} onClick={() => setId(k.id)}><Avatar src={k.photo} name={fullName(k)} size={22} />{k.prenom}</button>)}
    </div>
  );
  return { kids, child, picker };
}

function NoChild() {
  return <Empty title="Aucun enfant lié à ce compte">Contactez le secrétariat de l’école pour relier votre compte à vos enfants.</Empty>;
}

/** Dernière période validée et rapport de l'enfant pour cette période. */
function lastValidated(child: Student) {
  const locked = sortedPeriods().filter((p) => p.verrouillee);
  for (let i = locked.length - 1; i >= 0; i--) {
    const r = classReport(child.classeId, locked[i].id)?.students.find((x) => x.student.id === child.id);
    if (r && r.general !== null) return { period: locked[i], report: r, effectif: classReport(child.classeId, locked[i].id)!.effectif };
  }
  return null;
}

const absencesOf = (childId: string) => db.list('attendance').filter((a) => a.eleveId === childId && a.statut !== 'Présent');

export function ParentHome() {
  const session = useSession()!;
  const nav = useNavigate();
  const { kids } = useChild();
  useCollection('grades'); useCollection('attendance'); useCollection('payments'); useCollection('lessons');
  const school = useDoc('school', 'main');
  const bareme = school?.bareme ?? 20;
  return (
    <>
      <PageHead title={`Bonjour ${session.user.nom.replace(/^(M\.|Mme)\s+/, '').split(' ')[0]}`} sub="Le suivi de vos enfants à l’école, mis à jour par l’établissement." />
      {kids.length === 0 ? <NoChild /> : (
        <div className="stack">
          {kids.map((k) => {
            const classe = db.get('classes', k.classeId);
            const last = lastValidated(k);
            const abs = absencesOf(k.id);
            const bal = balances().get(k.id);
            const homework = db.list('lessons').filter((l) => l.classeId === k.classeId && l.devoirs && (l.pourLe ?? '') >= todayISO()).length;
            const pre = isPreschool(classe);
            return (
              <div key={k.id} className="card card-pad">
                <div className="row mb-16" style={{ gap: 12 }}>
                  <Avatar src={k.photo} name={fullName(k)} size={52} />
                  <div className="grow"><b style={{ color: 'var(--ink)', fontSize: 16 }}>{fullName(k)}</b><div className="small muted">{classe?.nom} · {k.matricule}</div></div>
                </div>
                <div className="grid g-stats">
                  <button className="parent-tile" onClick={() => { localStorage.setItem(KEY, k.id); nav('/p/notes'); }}>
                    <FileText /><span><b>{last ? (pre ? <LevelPill v={last.report.general} long /> : `${fmtNote(scaleNote(last.report.general, bareme))}/${bareme}`) : '—'}</b><small>{last ? `${last.period.libelle}${pre ? '' : ` · ${last.report.rank}e / ${last.effectif}`}` : 'Aucune période validée'}</small></span>
                  </button>
                  <button className="parent-tile" onClick={() => { localStorage.setItem(KEY, k.id); nav('/p/vie'); }}>
                    <ClipboardCheck /><span><b>{abs.filter((a) => a.statut === 'Absent').length} absence(s)</b><small>{abs.filter((a) => a.statut === 'Retard').length} retard(s) cette année</small></span>
                  </button>
                  <button className="parent-tile" onClick={() => { localStorage.setItem(KEY, k.id); nav('/p/paiements'); }}>
                    <Wallet /><span><b style={{ color: bal?.rest ? 'var(--red)' : 'var(--green)' }}>{bal?.rest ? money(bal.rest, school?.monnaie) : 'À jour'}</b><small>{bal?.rest ? 'Reste à payer' : 'Scolarité réglée'}</small></span>
                  </button>
                  <button className="parent-tile" onClick={() => { localStorage.setItem(KEY, k.id); nav('/p/devoirs'); }}>
                    <NotebookPen /><span><b>{homework} devoir(s)</b><small>À rendre prochainement</small></span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

export function ParentNotes() {
  const { child, picker } = useChild();
  useCollection('grades'); useCollection('periods'); useCollection('evaluations');
  const school = useDoc('school', 'main');
  const bareme = school?.bareme ?? 20;
  const [open, setOpen] = useState<string | null>(null);
  if (!child) return <><PageHead title="Notes" /><NoChild /></>;
  const classe = db.get('classes', child.classeId);
  const pre = isPreschool(classe);
  const periods = sortedPeriods();
  const current = periods.find((p) => !p.verrouillee);
  // Contrôles déjà corrigés et clôturés de la période en cours (avant validation de la moyenne)
  const recent = current ? evaluationsForClass(child.classeId).filter((e) => e.periodeId === current.id && e.statut === 'Clôturé') : [];
  return (
    <>
      <PageHead title="Notes" sub={`${fullName(child)} · ${classe?.code}`} />
      {picker}
      <div className="stack">
        {periods.map((p) => {
          if (!p.verrouillee) return (
            <div key={p.id} className="card card-pad row" style={{ gap: 12 }}><Lock size={18} color="var(--faint)" /><span className="grow"><b style={{ color: 'var(--ink)' }}>{p.libelle}</b><div className="tiny muted">La moyenne sera publiée après validation par la direction.</div></span></div>
          );
          const rep = classReport(child.classeId, p.id);
          const r = rep?.students.find((x) => x.student.id === child.id);
          const isOpen = open === p.id;
          return (
            <div key={p.id} className="card">
              <button className="journal-head" onClick={() => setOpen(isOpen ? null : p.id)} aria-expanded={isOpen}>
                <span className="grow"><b>{p.libelle}</b><span className="tiny muted" style={{ display: 'block' }}>{pre ? 'Niveau global' : r?.general != null ? `Rang ${r.rank}e sur ${rep!.effectif} · moyenne de la classe ${fmtNote(scaleNote(rep!.classGeneral, bareme))}` : 'Pas de note'}</span></span>
                <b style={{ fontSize: 18, color: 'var(--ink)' }}>{pre ? <LevelPill v={r?.general} /> : `${fmtNote(scaleNote(r?.general ?? null, bareme))}`}</b>
                <ChevronRight size={16} style={{ transform: isOpen ? 'rotate(90deg)' : undefined }} />
              </button>
              {isOpen && r && (
                <div className="table-wrap"><table className="t">
                  <thead><tr><th>Matière</th><th className="num">{pre ? 'Niveau' : 'Moyenne'}</th>{!pre && <th className="num">Classe</th>}</tr></thead>
                  <tbody>{r.lines.filter((l) => l.byPeriod[p.id] !== null).map((l) => (
                    <tr key={l.course.id}><td>{l.subject.nom}</td><td className="num bold">{pre ? <LevelPill v={l.byPeriod[p.id]} /> : fmtNote(scaleNote(l.byPeriod[p.id], bareme))}</td>{!pre && <td className="num muted">{fmtNote(scaleNote(l.classAvg, bareme))}</td>}</tr>
                  ))}</tbody>
                </table></div>
              )}
            </div>
          );
        })}
        {recent.length > 0 && (
          <Card title={`Contrôles corrigés · ${current!.libelle}`} pad={false}>
            <div className="list">{recent.map((e) => {
              const g = gradesForEvaluation(e.id).get(child.id);
              const subj = db.get('subjects', e.matiereId);
              return <div key={e.id} className="list-item"><span className="grow">{subj?.nom}<br /><span className="tiny muted">{e.titre} · {dateShort(e.date)}</span></span><b style={{ color: 'var(--ink)' }}>{!g ? '—' : g.absent ? 'Absent' : pre ? <LevelPill v={g.note === null ? null : (g.note / e.noteMax) * 20} /> : `${fmtNote(g.note, g.note !== null && Number.isInteger(g.note) ? 0 : 1)}/${e.noteMax}`}</b></div>;
            })}</div>
          </Card>
        )}
      </div>
    </>
  );
}

export function ParentVie() {
  const { child, picker } = useChild();
  const attendance = useCollection('attendance');
  const incidents = useCollection('incidents');
  if (!child) return <><PageHead title="Vie scolaire" /><NoChild /></>;
  const abs = attendance.filter((a) => a.eleveId === child.id && a.statut !== 'Présent').sort((a, b) => b.date.localeCompare(a.date));
  const inc = incidents.filter((i) => i.eleveId === child.id).sort((a, b) => b.date.localeCompare(a.date));
  return (
    <>
      <PageHead title="Vie scolaire" sub={`${fullName(child)} · absences, retards et discipline`} />
      {picker}
      <div className="grid g-stats mb-16">
        <StatCard tint="red" icon={<ClipboardCheck />} value={abs.filter((a) => a.statut === 'Absent').length} label="Absences" />
        <StatCard tint="orange" icon={<ClipboardCheck />} value={abs.filter((a) => a.statut === 'Retard').length} label="Retards" />
        <StatCard tint="blue" icon={<ClipboardCheck />} value={abs.filter((a) => a.statut === 'Excusé').length} label="Excusées" />
        <StatCard tint="violet" icon={<ShieldAlert />} value={inc.length} label="Discipline" />
      </div>
      <div className="grid g-2">
        <Card title="Absences et retards" pad={false}>
          <div className="list">{abs.slice(0, 60).map((a) => <div key={a.id} className="list-item"><span className="grow">{dateShort(a.date)}{a.motif && <><br /><span className="tiny muted">{a.motif}</span></>}</span><StatusBadge s={a.statut} /></div>)}</div>
          {abs.length === 0 && <Empty title="Aucune absence ni retard" />}
        </Card>
        <Card title="Discipline et félicitations" pad={false}>
          <div className="list">{inc.map((i) => (
            <div key={i.id} className="list-item" style={{ alignItems: 'flex-start' }}>
              <span className="grow"><b style={{ color: 'var(--ink)' }}>{i.type}</b> <span className="tiny muted">· {dateShort(i.date)}</span><div className="small">{i.description}</div>{i.sanction && <div className="tiny muted">Suite donnée : {i.sanction}{i.joursExclusion ? ` (${i.joursExclusion} j)` : ''}</div>}</span>
              {i.type === 'Félicitations' ? <Badge tone="green">Bravo</Badge> : i.gravite && <Badge tone={i.gravite === 'Grave' ? 'red' : i.gravite === 'Moyenne' ? 'orange' : 'gray'}>{i.gravite}</Badge>}
            </div>
          ))}</div>
          {inc.length === 0 && <Empty title="Rien à signaler" />}
        </Card>
      </div>
    </>
  );
}

export function ParentPaiements() {
  const { child, picker } = useChild();
  const payments = useCollection('payments');
  const school = useDoc('school', 'main');
  if (!child) return <><PageHead title="Paiements" /><NoChild /></>;
  const bal = balances().get(child.id);
  const list = payments.filter((p) => p.eleveId === child.id && p.statut !== 'Annulé').sort((a, b) => b.date.localeCompare(a.date));
  return (
    <>
      <PageHead title="Paiements" sub={`${fullName(child)} · scolarité ${db.get('years', school?.anneeCourante)?.libelle ?? ''}`} />
      {picker}
      <div className="grid g-3 mb-16">
        <StatCard tint="blue" icon={<Wallet />} value={money(bal?.due ?? 0, school?.monnaie)} label="Total de l’année" />
        <StatCard tint="green" icon={<Wallet />} value={money(bal?.paid ?? 0, school?.monnaie)} label="Déjà payé" />
        <StatCard tint={bal?.rest ? 'red' : 'green'} icon={<Wallet />} value={money(bal?.rest ?? 0, school?.monnaie)} label="Reste à payer" />
      </div>
      {!!bal?.rest && <div className="card card-pad mb-16 small" style={{ background: 'var(--primary-50)', border: 0 }}>Paiement possible par MonCash ou au secrétariat. Pour MonCash, indiquez le nom et la classe de l’élève, puis gardez le numéro de transaction : il figurera sur le reçu.</div>}
      <Card title="Reçus" pad={false}>
        <div className="list">{list.map((p) => (
          <div key={p.id} className="list-item">
            <span className="grow"><b style={{ color: 'var(--ink)' }}>{money(p.montant, school?.monnaie)}</b> <span className="tiny muted">· {p.motif}{p.versement ? ` · ${p.versement}` : ''}</span><br /><span className="tiny muted">{dateShort(p.date)} · {p.mode} · {p.recu}</span></span>
            {p.statut === 'Payé' ? <button className="btn btn-sm" onClick={() => printDocument(<ReceiptSheet payment={p} />, 'A4 portrait', p.recu)}><Printer size={14} />Reçu</button> : <StatusBadge s={p.statut} />}
          </div>
        ))}</div>
        {list.length === 0 && <Empty title="Aucun paiement enregistré" />}
      </Card>
    </>
  );
}

export function ParentDevoirs() {
  const { child, picker } = useChild();
  const lessons = useCollection('lessons');
  if (!child) return <><PageHead title="Devoirs" /><NoChild /></>;
  const today = todayISO();
  const mine = lessons.filter((l) => l.classeId === child.classeId).sort((a, b) => b.date.localeCompare(a.date));
  const todo = mine.filter((l) => l.devoirs && (l.pourLe ?? '') >= today).sort((a, b) => (a.pourLe ?? '').localeCompare(b.pourLe ?? ''));
  const subj = (id: string) => db.get('subjects', id)?.nom;
  const Row = ({ title, children }: { title: ReactNode; children: ReactNode }) => <div className="list-item" style={{ alignItems: 'flex-start' }}><span className="grow">{title}{children}</span></div>;
  return (
    <>
      <PageHead title="Devoirs" sub={`${fullName(child)} · cahier de textes de la classe`} />
      {picker}
      <div className="grid g-2">
        <Card title="À faire" pad={false}>
          <div className="list">{todo.map((l) => <Row key={l.id} title={<><b style={{ color: 'var(--ink)' }}>{subj(l.matiereId)}</b> <span className="tiny muted">· pour le {dateShort(l.pourLe)}</span></>}><div className="small">{l.devoirs}</div></Row>)}</div>
          {todo.length === 0 && <Empty title="Aucun devoir à rendre" />}
        </Card>
        <Card title="Derniers cours" pad={false}>
          <div className="list">{mine.slice(0, 20).map((l) => <Row key={l.id} title={<><b style={{ color: 'var(--ink)' }}>{subj(l.matiereId)}</b> <span className="tiny muted">· {dateShort(l.date)}</span></>}><div className="small">{l.titre}</div>{l.devoirs && <div className="tiny muted">Devoirs : {l.devoirs}</div>}</Row>)}</div>
          {mine.length === 0 && <Empty title="Le cahier de textes est vide" />}
        </Card>
      </div>
    </>
  );
}
