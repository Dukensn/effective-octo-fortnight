import { useEffect, useMemo, useState } from 'react';
import { FiltersFold } from '../../components/Mobile';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, Circle, UserCheck, UserX, Clock, Percent, LogIn, LogOut, CalendarDays } from 'lucide-react';
import { db, useCollection } from '../../data/store';
import type { StaffAttendance } from '../../data/types';
import { PageHead, Tabs, Field, Card, StatCard, Avatar, StatusBadge, Modal, Pills, Empty, toast } from '../../components/ui';
import { RollCall } from '../../components/RollCall';
import { BarChart } from '../../components/charts';
import { todayISO, dateFull, civ } from '../../lib/format';
import { classStudents } from '../../data/compute';
import { useSession } from '../../lib/session';
import { callerLabel, classesOfAbsent, replacementsOn, slotsOnDay } from '../../lib/regles';
import { dayItems, type DayItem } from '../../lib/prof';
import { checkOf, decideCourse, remunerationOf } from '../../lib/paie';
import { hourLabel } from './Timetable';
import { audit } from '../../lib/session';

export default function AttendancePage() {
  const [params] = useSearchParams();
  const [tab, setTab] = useState<'eleves' | 'personnel' | 'cours' | 'stats'>((params.get('tab') as 'personnel') ?? 'eleves');
  // Un lien vers un autre onglet (cloche, tableau de bord) doit changer d'onglet même si la page est déjà ouverte.
  useEffect(() => { const t = params.get('tab') as typeof tab | null; if (t) setTab(t); }, [params]);
  return (
    <>
      <PageHead title="Présences & ponctualité" sub={`${dateFull()} · un appel par jour et par classe ; au secondaire, il est fait par le personnel désigné.`} />
      <Tabs tabs={[['eleves', 'Élèves'], ['personnel', 'Personnel'], ['cours', 'Cours donnés'], ['stats', 'Statistiques']]} value={tab} onChange={setTab} />
      {tab === 'eleves' && <Students />}
      {tab === 'personnel' && <StaffAtt />}
      {tab === 'cours' && <CoursesGiven />}
      {tab === 'stats' && <Stats />}
    </>
  );
}

function Students() {
  const session = useSession()!;
  const classes = useCollection('classes').slice().sort((a, b) => a.code.localeCompare(b.code, 'fr', { numeric: true }));
  const attendance = useCollection('attendance');
  const [date, setDate] = useState(todayISO());
  const [params] = useSearchParams();
  // Par défaut : la première classe dont l'appel revient à cet utilisateur et n'est pas encore fait.
  const mine = classes.find((c) => c.appelParId === session.user.staffId && !attendance.some((a) => a.id === `at-${todayISO()}-${c.id}-done`));
  const [classe, setClasse] = useState(params.get('classe') ?? mine?.id ?? classes[0]?.id ?? '');
  const day = attendance.filter((a) => a.date === date);
  const absent = day.filter((a) => a.eleveId && a.statut === 'Absent').length;
  const late = day.filter((a) => a.eleveId && a.statut === 'Retard').length;
  const done = classes.filter((c) => day.some((a) => a.classeId === c.id && !a.eleveId));
  return (
    <>
      <div className="grid g-stats mb-16">
        <StatCard tint="green" icon={<UserCheck />} value={`${done.length}/${classes.length}`} label="Appels effectués" />
        <StatCard tint="red" icon={<UserX />} value={absent} label="Absents" />
        <StatCard tint="orange" icon={<Clock />} value={late} label="Retards" />
        <StatCard tint="blue" icon={<Percent />} value={`${Math.round((1 - absent / Math.max(1, done.reduce((a, c) => a + classStudents(c.id).length, 0))) * 100)}%`} label="Présence du jour" />
      </div>
      <div className="split split-side">
        <div>
          <FiltersFold summary={`${classes.find((c) => c.id === classe)?.nom ?? ''} · ${date === todayISO() ? 'aujourd’hui' : date}`}>
          <div className="form-grid mb-16">
            <Field label="Classe"><select className="select" value={classe} onChange={(e) => setClasse(e.target.value)}>{classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}</select></Field>
            <Field label="Date"><input type="date" className="input" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} /></Field>
          </div>
          </FiltersFold>
          <RollCall classeId={classe} date={date} readOnly={!session.can('presences', 'write')} />
        </div>
        <Card title="Appels du jour" pad={false}>
          <div className="list">{classes.map((c) => {
            const ok = done.includes(c);
            const abs = day.filter((a) => a.classeId === c.id && a.eleveId && a.statut === 'Absent').length;
            return (
              <button key={c.id} className="list-item" style={{ border: 0, width: '100%', textAlign: 'left', borderBottom: '1px solid var(--line-2)', background: c.id === classe ? 'var(--primary-50)' : '#fff' }} onClick={() => setClasse(c.id)}>
                {ok ? <CheckCircle2 size={18} color="var(--green)" /> : <Circle size={18} color="var(--faint)" />}
                <span className="grow" style={{ fontWeight: 500, color: 'var(--ink)' }}>{c.code}<span className="tiny muted" style={{ display: 'block', fontWeight: 400 }}>{callerLabel(c)}{c.appelParId && c.appelParId === session.user.staffId ? ' (vous)' : ''}</span></span>
                {ok ? <span className="small muted">{abs} absent(s)</span> : <span className="small" style={{ color: 'var(--orange)' }}>En attente</span>}
              </button>
            );
          })}</div>
        </Card>
      </div>
    </>
  );
}

function StaffAtt() {
  const session = useSession()!;
  const canWrite = session.can('presences', 'write');
  const staff = useCollection('staff').filter((s) => s.statut === 'Actif');
  const records = useCollection('staffAttendance');
  const [date, setDate] = useState(todayISO());
  const day = new Map(records.filter((r) => r.date === date).map((r) => [r.staffId, r]));
  const reps = useCollection('remplacements').filter((r) => r.date === date);
  useCollection('timetable');
  const [replace, setReplace] = useState<string | null>(null);
  // Enseignants absents ce jour qui ont des classes : il faut décider qui les prend.
  const absentTeachers = staff.filter((s) => s.type === 'Professeur' && (day.get(s.id)?.statut === 'Absent' || reps.some((r) => r.absentId === s.id)) && classesOfAbsent(s.id, date).length > 0);
  const now = () => new Date().toTimeString().slice(0, 5);
  const mark = (staffId: string, patch: Partial<StaffAttendance>) => {
    const cur = day.get(staffId);
    db.put('staffAttendance', { id: `sa-${date}-${staffId}`, date, staffId, statut: 'Présent', ...cur, ...patch } as StaffAttendance);
  };
  return (
    <>
      <div className="row wrap mb-16" style={{ gap: 12, alignItems: 'flex-end' }}>
        <Field label="Date"><input type="date" className="input" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} /></Field>
        <span className="small muted">Pointage : arrivée avant 7h00 = à l’heure. {day.size}/{staff.length} pointés.</span>
      </div>
      {absentTeachers.length > 0 && (
        <Card title="Remplacements du jour" className="mb-16">
          <div className="stack" style={{ gap: 8 }}>{absentTeachers.map((s) => {
            const r = reps.find((x) => x.absentId === s.id);
            const rp = staff.find((x) => x.id === r?.remplacantId);
            return (
              <div key={s.id} className="row wrap" style={{ gap: 10 }}>
                <span className="grow small"><b style={{ color: 'var(--ink)' }}>{civ(s)}</b> absent{s.sexe === 'F' ? 'e' : ''} · {classesOfAbsent(s.id, date).map((id) => db.get('classes', id)?.code).join(', ')}<br />
                  {rp ? <span style={{ color: 'var(--green)' }}>Remplacé{s.sexe === 'F' ? 'e' : ''} par {civ(rp)}</span> : r ? <span className="muted">{r.note || 'Sans remplaçant'}</span> : <span style={{ color: 'var(--red)' }}>Pas encore de remplaçant</span>}</span>
                {canWrite && <button className="btn btn-sm btn-soft" onClick={() => setReplace(s.id)}><UserCheck size={14} />{r ? 'Modifier' : 'Choisir un remplaçant'}</button>}
              </div>
            );
          })}</div>
        </Card>
      )}
      {replace && <ReplacementForm absentId={replace} date={date} onClose={() => setReplace(null)} />}
      <div className="card"><div className="table-wrap"><table className="t">
        <thead><tr><th>Membre</th><th className="only-desktop">Poste</th><th>Arrivée</th><th>Départ</th><th>Statut</th><th /></tr></thead>
        <tbody>{staff.map((s) => {
          const r = day.get(s.id);
          return (
            <tr key={s.id}>
              <td><div className="person"><Avatar src={s.photo} name={civ(s)} size={30} /><b>{civ(s)}</b></div></td>
              <td className="only-desktop muted">{s.poste}</td>
              <td>{r?.arrivee ?? '-'}</td><td>{r?.depart ?? '-'}</td>
              <td>{r ? <StatusBadge s={r.statut} /> : <span className="badge b-gray">Non pointé</span>}</td>
              <td>{canWrite && <div className="row" style={{ gap: 6 }}>
                {!r?.arrivee && <button className="btn btn-sm btn-soft" onClick={() => { const t = now(); mark(s.id, { arrivee: t, statut: t > '07:00' ? 'Retard' : 'Présent' }); toast(`Arrivée de ${s.prenom} à ${t}`); }}><LogIn size={14} />Arrivée</button>}
                {r?.arrivee && !r.depart && <button className="btn btn-sm" onClick={() => mark(s.id, { depart: now() })}><LogOut size={14} />Départ</button>}
                {!r && <button className="btn btn-sm btn-danger" onClick={() => { mark(s.id, { statut: 'Absent' }); if (s.type === 'Professeur' && classesOfAbsent(s.id, date).length) setReplace(s.id); }}>Absent</button>}
              </div>}</td>
            </tr>
          );
        })}</tbody>
      </table></div></div>
    </>
  );
}

/** Choisir qui remplace un enseignant absent : il fera l'appel et prendra ses classes ce jour-là. */
function ReplacementForm({ absentId, date, onClose }: { absentId: string; date: string; onClose: () => void }) {
  const session = useSession()!;
  const staff = useCollection('staff').filter((s) => s.statut === 'Actif');
  const absent = staff.find((s) => s.id === absentId);
  const existing = db.list('remplacements').find((r) => r.date === date && r.absentId === absentId);
  const classes = classesOfAbsent(absentId, date);
  const [rid, setRid] = useState(existing?.remplacantId ?? '');
  const [note, setNote] = useState(existing?.note ?? '');
  const theirs = slotsOnDay(absentId, date);
  // Disponibilité : nombre de créneaux du remplaçant qui tombent en même temps que ceux de l'absent.
  const clashes = (id: string) => slotsOnDay(id, date).filter((x) => theirs.some((t) => t.debut === x.debut)).length;
  const absentToday = new Set(db.list('staffAttendance').filter((a) => a.date === date && a.statut === 'Absent').map((a) => a.staffId));
  const candidates = staff.filter((s) => s.id !== absentId && !absentToday.has(s.id) && (s.type === 'Professeur' || s.type === 'Direction' || s.poste.startsWith('Censeur') || s.poste.startsWith('Conseiller')))
    .map((s) => ({ s, n: clashes(s.id) })).sort((a, b) => a.n - b.n || a.s.nom.localeCompare(b.s.nom, 'fr'));
  const save = () => {
    db.put('remplacements', { id: existing?.id ?? `rep-${date}-${absentId}`, date, absentId, remplacantId: rid || undefined, classeIds: classes, note: note.trim() || undefined, parId: session.user.id });
    audit('Remplacement', `${civ(absent)} → ${civ(staff.find((s) => s.id === rid)) || 'sans remplaçant'} · ${date}`, { domaine: 'autre' });
    toast(rid ? 'Remplaçant enregistré : il fera l’appel et prendra les classes' : 'Absence enregistrée sans remplaçant');
    onClose();
  };
  return (
    <Modal open onClose={onClose} title={`Remplacer ${civ(absent)}`} footer={<><button className="btn" onClick={onClose}>Annuler</button><button className="btn btn-primary" onClick={save}>Enregistrer</button></>}>
      <p className="small mb-12">{dateFull(new Date(date + 'T12:00:00'))} · classes : <b>{classes.map((id) => db.get('classes', id)?.code).join(', ') || '—'}</b> · {theirs.length} cours ce jour-là.</p>
      <Field label="Remplaçant"><select className="select" value={rid} onChange={(e) => setRid(e.target.value)}>
        <option value="">Pas de remplaçant (étude surveillée, cours reporté…)</option>
        {candidates.map(({ s, n }) => <option key={s.id} value={s.id}>{civ(s)} · {s.poste}{s.specialite ? ` (${s.specialite})` : ''} — {n ? `${n} cours en même temps` : 'libre'}</option>)}
      </select></Field>
      <Field label="Note (facultatif)" className="mt-12"><input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex. maladie, la 7AF fait de l’étude en salle B" /></Field>
      <p className="tiny muted mt-12">Le remplaçant voit les classes sur son accueil et peut faire l’appel ce jour-là (préscolaire et fondamental). Les plus disponibles sont en tête de liste.</p>
    </Modal>
  );
}

/** Cours donnés : validation par les professeurs (bouton, cahier de textes, appel) et décision de la direction. */
function CoursesGiven() {
  const session = useSession()!;
  const canWrite = session.can('presences', 'write') || session.can('finance', 'write');
  const staff = useCollection('staff').filter((s) => s.type === 'Professeur' && s.statut === 'Actif');
  useCollection('pointages'); useCollection('timetable'); useCollection('remplacements'); useCollection('staffAttendance');
  const [date, setDate] = useState(todayISO());
  const [only, setOnly] = useState<'tous' | 'non'>('tous');
  const [refuse, setRefuse] = useState<{ it: DayItem; staffId: string } | null>(null);
  const [motif, setMotif] = useState('');
  const replaced = new Set(replacementsOn(date).filter((r) => r.remplacantId).map((r) => r.absentId));
  const rows = staff.filter((s) => !replaced.has(s.id)).map((s) => ({ s, items: dayItems(s.id, date).filter((it) => it.kind !== 'externe' && it.slot) })).filter((x) => x.items.length);
  const now = new Date().toTimeString().slice(0, 5);
  const later = (it: DayItem) => date === todayISO() && it.debut > now;
  const all = rows.flatMap((r) => r.items.filter((it) => !later(it)).map((it) => ({ r, it, c: checkOf(date, it.slot!.id) })));
  const ok = all.filter((x) => x.c?.statut === 'valide').length;
  const ko = all.filter((x) => x.c?.statut === 'refuse').length;
  const SRC: Record<string, string> = { prof: 'bouton', cahier: 'cahier de textes', appel: 'appel', direction: 'direction' };
  return (
    <>
      <div className="row wrap mb-16" style={{ gap: 12, alignItems: 'flex-end' }}>
        <Field label="Date"><input type="date" className="input" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} /></Field>
        <Pills items={[['tous', `Tous (${all.length})`], ['non', `Non validés (${all.length - ok - ko})`]]} value={only} onChange={setOnly} />
      </div>
      <div className="grid g-stats mb-16">
        <StatCard tint="blue" icon={<CalendarDays />} value={all.length} label={date === todayISO() ? 'Cours déjà commencés' : 'Cours prévus'} />
        <StatCard tint="green" icon={<CheckCircle2 />} value={ok} label="Validés" />
        <StatCard tint="orange" icon={<Clock />} value={all.length - ok - ko} label="Non validés" />
        <StatCard tint="red" icon={<UserX />} value={ko} label="Refusés" />
      </div>
      <p className="tiny muted mb-12">Un cours est validé quand le professeur touche « Cours donné », remplit le cahier de textes de ce cours ou fait l’appel le jour même. Les cours validés servent à la paie des professeurs payés à l’heure.</p>
      <div className="stack">{rows.map(({ s, items }) => {
        const list = items.filter((it) => only === 'tous' || (!later(it) && !checkOf(date, it.slot!.id)));
        if (!list.length) return null;
        return (
          <Card key={s.id} title={<span className="row" style={{ gap: 10 }}><Avatar src={s.photo} name={civ(s)} size={28} />{civ(s)} <span className="badge b-gray">{remunerationOf(s) === 'horaire' ? 'À l’heure' : 'Fixe'}</span></span>} pad={false}>
            {list.map((it) => { const c = checkOf(date, it.slot!.id); return (
              <div key={it.id} className="sheet-row" style={{ gap: 10 }}>
                <span className="grow small"><b>{hourLabel(it.debut)} · {it.matiere}</b> <span className="muted">{it.classe}</span>{c && <small className="muted" style={{ display: 'block', fontSize: 11.5 }}>{c.statut === 'valide' ? `Validé par ${SRC[c.source]} à ${new Date(c.le).toTimeString().slice(0, 5)}` : `Refusé${c.motif ? ` : ${c.motif}` : ''}`}</small>}</span>
                {c ? <span className={`check-chip ${c.statut}`}>{c.statut === 'valide' ? 'Donné' : 'Refusé'}</span> : <span className="check-chip none">{later(it) ? 'À venir' : 'Non validé'}</span>}
                {canWrite && !later(it) && (!c || c.statut === 'refuse') && <button className="btn btn-sm btn-soft" onClick={() => { decideCourse(it, date, s.id, 'valide', session.user.id, 'Validation par la direction'); toast('Cours validé'); }}>Valider</button>}
                {canWrite && !later(it) && c?.statut !== 'refuse' && <button className="btn btn-sm" onClick={() => { setRefuse({ it, staffId: s.id }); setMotif(''); }}>Refuser</button>}
              </div>
            ); })}
          </Card>
        );
      })}</div>
      {rows.length === 0 && <Empty title="Aucun cours ce jour-là" />}
      {refuse && (
        <Modal open onClose={() => setRefuse(null)} title="Refuser ce cours" footer={<><button className="btn" onClick={() => setRefuse(null)}>Annuler</button><button className="btn btn-danger" disabled={motif.trim().length < 4} onClick={() => { decideCourse(refuse.it, date, refuse.staffId, 'refuse', session.user.id, motif.trim()); toast('Cours refusé'); setRefuse(null); }}>Refuser</button></>}>
          <p className="small mb-12">{refuse.it.matiere} · {refuse.it.classe} · {hourLabel(refuse.it.debut)}</p>
          <Field label="Motif"><input className="input" value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Ex. professeur absent, cours non assuré" /></Field>
          <p className="tiny muted mt-8">Un cours refusé n’est pas payé ; le refus est gardé au journal.</p>
        </Modal>
      )}
    </>
  );
}

function Stats() {
  const classes = useCollection('classes').slice().sort((a, b) => a.code.localeCompare(b.code, 'fr', { numeric: true }));
  const attendance = useCollection('attendance');
  const rates = useMemo(() => classes.map((c) => {
    const days = new Set(attendance.filter((a) => a.classeId === c.id && !a.eleveId).map((a) => a.date)).size;
    const abs = attendance.filter((a) => a.classeId === c.id && a.eleveId && (a.statut === 'Absent' || a.statut === 'Excusé')).length;
    const n = classStudents(c.id).length;
    return days && n ? Math.round((1 - abs / (days * n)) * 1000) / 10 : null;
  }), [classes, attendance]);
  const top = useMemo(() => {
    const m = new Map<string, number>();
    attendance.filter((a) => a.eleveId && a.statut === 'Absent').forEach((a) => m.set(a.eleveId, (m.get(a.eleveId) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([id, n]) => ({ s: db.get('students', id), n }));
  }, [attendance]);
  return (
    <div className="grid g-2">
      <Card title="Taux de présence par classe (%)"><BarChart labels={classes.map((c) => c.code)} series={[{ label: 'Présence', color: '#17a34a', values: rates }]} max={100} ticks={4} showValues /></Card>
      <Card title="Élèves les plus absents" pad={false}>
        <div className="list">{top.map(({ s, n }) => s && (
          <div key={s.id} className="list-item"><Avatar src={s.photo} name={`${s.prenom} ${s.nom}`} size={32} /><span className="grow">{s.prenom} {s.nom}<br /><span className="tiny muted">{db.get('classes', s.classeId)?.code}</span></span><span className="badge b-red">{n} absences</span></div>
        ))}</div>
      </Card>
    </div>
  );
}
