// Espace parent : uniquement les enfants liés au compte, en lecture seule.
// Bulletins et progrès : seulement les périodes validées (verrouillées) par la direction.
import { useState } from 'react';
import { SetupCard } from '../../components/Guide';
import { useNavigate } from 'react-router-dom';
import { FileText, ClipboardCheck, Wallet, Printer, Lock, ShieldAlert, MessagesSquare, TrendingUp, TrendingDown, Trophy } from 'lucide-react';
import { db, useCollection, useDoc } from '../../data/store';
import type { Student } from '../../data/types';
import { classReport, fmtNote, isPreschool, scaleNote, sortedPeriods } from '../../data/compute';
import { Avatar, Badge, Card, Empty, PageHead, StatCard, StatusBadge } from '../../components/ui';
import { LevelPill } from '../../components/Level';
import { dateShort, fullName, money, timeAgo } from '../../lib/format';
import { balances } from '../../lib/finance';
import { useSession } from '../../lib/session';
import { printDocument } from '../../lib/print';
import { ReceiptSheet } from '../../docs/Sheets';
import { BulletinPages, TRI_THEMES, type BulletinModel } from '../../docs/Bulletins';
import { buildBulletin } from '../../docs/common';
import { Scaled, A4L } from '../../components/Scaled';
import { BarChart } from '../../components/charts';
import { isUnread } from '../../lib/chat';

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
  useCollection('grades'); useCollection('attendance'); useCollection('payments'); useCollection('incidents');
  const chat = useCollection('chat');
  const school = useDoc('school', 'main');
  const bareme = school?.bareme ?? 20;
  const go = (id: string, to: string) => { try { localStorage.setItem(KEY, id); } catch { /* ignore */ } nav(to); };
  return (
    <>
      <PageHead title={`Bonjour ${session.user.nom.replace(/^(M\.|Mme)\s+/, '').split(' ')[0]}`} sub="Le suivi de vos enfants à l’école, mis à jour par l’établissement." />
      <SetupCard />
      {kids.length === 0 ? <NoChild /> : (
        <div className="stack">
          {kids.map((k) => {
            const classe = db.get('classes', k.classeId);
            const last = lastValidated(k);
            const abs = absencesOf(k.id);
            const bal = balances().get(k.id);
            const unread = chat.filter((m) => m.eleveId === k.id && isUnread(m, 'parent')).length;
            const lastAlert = chat.filter((m) => m.eleveId === k.id && m.auteur === 'systeme').sort((a, b) => b.date - a.date)[0];
            const pre = isPreschool(classe);
            return (
              <div key={k.id} className="card card-pad">
                <div className="row mb-16" style={{ gap: 12 }}>
                  <Avatar src={k.photo} name={fullName(k)} size={52} />
                  <div className="grow"><b style={{ color: 'var(--ink)', fontSize: 16 }}>{fullName(k)}</b><div className="small muted">{classe?.nom}</div></div>
                </div>
                {k.dossierParent?.statut === 'a_completer' && (
                  <button className="pe-banner" onClick={() => nav(`/p/inscription/${k.id}`)}>
                    <span className="row-ic tint-orange"><ClipboardCheck /></span>
                    <span className="grow"><b>Inscription à compléter</b><small>Photo, informations et documents · 3 minutes</small></span>
                    <span className="btn btn-sm btn-primary">Compléter</span>
                  </button>
                )}
                {k.dossierParent?.statut === 'soumis' && <div className="tiny muted mb-12">Dossier d’inscription envoyé · en cours de vérification par l’école</div>}
                {lastAlert && (
                  <button className={`bubble sys t-${lastAlert.type} parent-alert`} onClick={() => go(k.id, '/p/messages')}>
                    <div className="bubble-from">Dernière alerte · {timeAgo(lastAlert.date)}</div>{lastAlert.texte}
                  </button>
                )}
                <div className="grid g-stats">
                  <button className="parent-tile" onClick={() => go(k.id, '/p/bulletins')}>
                    <FileText /><span><b>{last ? (pre ? <LevelPill v={last.report.general} long /> : `${fmtNote(scaleNote(last.report.general, bareme))}/${bareme}`) : '—'}</b><small>{last ? `Bulletin ${last.period.libelle}${pre ? '' : ` · ${last.report.rank}e / ${last.effectif}`}` : 'Aucun bulletin publié'}</small></span>
                  </button>
                  <button className="parent-tile" onClick={() => go(k.id, '/p/messages')}>
                    <MessagesSquare /><span><b>{unread ? `${unread} nouveau${unread > 1 ? 'x' : ''}` : 'Messages'}</b><small>{unread ? 'Message(s) non lu(s)' : 'École et professeurs'}</small></span>
                  </button>
                  <button className="parent-tile" onClick={() => go(k.id, '/p/vie')}>
                    <ClipboardCheck /><span><b>{abs.filter((a) => a.statut === 'Absent').length} absence(s)</b><small>{abs.filter((a) => a.statut === 'Retard').length} retard(s) cette année</small></span>
                  </button>
                  <button className="parent-tile" onClick={() => go(k.id, '/p/paiements')}>
                    <Wallet /><span><b style={{ color: bal?.rest ? 'var(--red)' : 'var(--green)' }}>{bal?.rest ? money(bal.rest, school?.monnaie) : 'À jour'}</b><small>{bal?.rest ? 'Reste à payer' : 'Scolarité réglée'}</small></span>
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

/** Bulletins officiels publiés (périodes validées par la direction), tels que l'école les imprime. */
export function ParentBulletins() {
  const { child, picker } = useChild();
  useCollection('grades'); useCollection('periods'); useCollection('reportEntries');
  const [scope, setScope] = useState<string | null>(null);
  if (!child) return <><PageHead title="Bulletins" /><NoChild /></>;
  const classe = db.get('classes', child.classeId);
  const pre = isPreschool(classe);
  const periods = sortedPeriods();
  const published = periods.filter((p) => p.verrouillee);
  const allDone = periods.length > 0 && published.length === periods.length;
  const scopes: [string, string][] = [...published.map((p) => [p.id, p.libelle] as [string, string]), ...(allDone ? [['annuel', 'Bulletin annuel'] as [string, string]] : [])];
  const current = scope && scopes.some(([k]) => k === scope) ? scope : scopes[scopes.length - 1]?.[0];
  const model: BulletinModel = pre ? 'prescolaire' : current === 'annuel' ? 'annuel' : 'tripliable';
  const theme = TRI_THEMES[0];
  const d = current ? buildBulletin(child.id, current) : null;
  const sides = model === 'annuel' ? ['both'] as const : ['recto', 'verso'] as const;
  return (
    <>
      <PageHead title="Bulletins" sub={`${fullName(child)} · ${classe?.code}`} />
      {picker}
      {!scopes.length ? <Empty title="Aucun bulletin publié">Le bulletin apparaît ici dès que la direction a validé la période.</Empty> : (
        <div className="stack">
          <div className="chips-scroll">{scopes.map(([k, l]) => <button key={k} className={`chip ${k === current ? 'active' : ''}`} onClick={() => setScope(k)}>{l}</button>)}</div>
          {periods.filter((p) => !p.verrouillee).length > 0 && <p className="tiny muted"><Lock size={12} style={{ verticalAlign: -2 }} /> {periods.filter((p) => !p.verrouillee).map((p) => p.libelle).join(', ')} : publié après validation par la direction.</p>}
          {d && <>
            <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => printDocument(<BulletinPages d={d} model={model} theme={theme} />, 'A4 landscape', `Bulletin ${fullName(child)}`)}><Printer size={16} />Télécharger (PDF)</button>
            {sides.map((sd) => <div key={sd} className="card" style={{ padding: 8, overflow: 'hidden' }}><Scaled width={A4L.w} height={A4L.h}><BulletinPages d={d} model={model} theme={theme} sides={sd} /></Scaled></div>)}
          </>}
        </div>
      )}
    </>
  );
}

/** Progrès : évolution de la moyenne par période (élève et classe), points forts et matières à surveiller. */
export function ParentProgres() {
  const { child, picker } = useChild();
  useCollection('grades'); useCollection('periods');
  const school = useDoc('school', 'main');
  const bareme = school?.bareme ?? 20;
  if (!child) return <><PageHead title="Progrès" /><NoChild /></>;
  const classe = db.get('classes', child.classeId);
  const pre = isPreschool(classe);
  const published = sortedPeriods().filter((p) => p.verrouillee);
  const reports = published.map((p) => ({ p, rep: classReport(child.classeId, p.id) })).map(({ p, rep }) => ({ p, rep, me: rep?.students.find((x) => x.student.id === child.id) }));
  const last = reports[reports.length - 1];
  const prev = reports[reports.length - 2];
  const delta = last?.me?.general != null && prev?.me?.general != null ? last.me.general - prev.me.general : null;
  // Comparaison matière par matière entre les deux dernières périodes publiées
  const lines = last?.me ? last.me.lines.map((l) => ({ nom: l.subject.nom, now: l.byPeriod[last.p.id], before: prev ? l.byPeriod[prev.p.id] : null })).filter((l) => l.now !== null) : [];
  const ups = lines.filter((l) => l.before !== null && l.now! - l.before! >= 1).sort((a, b) => (b.now! - b.before!) - (a.now! - a.before!)).slice(0, 4);
  const watch = lines.filter((l) => l.now! < 10 || (l.before !== null && l.before - l.now! >= 1.5)).sort((a, b) => a.now! - b.now!).slice(0, 4);
  const sc = (v: number | null | undefined) => (v == null ? null : Math.round((scaleNote(v, bareme) ?? 0) * 10) / 10);
  return (
    <>
      <PageHead title="Progrès" sub={`${fullName(child)} · ${classe?.code}`} />
      {picker}
      {!last?.me ? <Empty title="Pas encore de résultats publiés" /> : (
        <div className="stack">
          <div className="grid g-3">
            <StatCard tint="blue" icon={<FileText />} value={pre ? <LevelPill v={last.me.general} long /> : `${fmtNote(sc(last.me.general))}/${bareme}`} label={`Moyenne · ${last.p.libelle}`} />
            {!pre && <StatCard tint={delta == null ? 'blue' : delta >= 0 ? 'green' : 'red'} icon={delta != null && delta < 0 ? <TrendingDown /> : <TrendingUp />} value={delta == null ? '—' : `${delta >= 0 ? '+' : ''}${fmtNote(bareme === 100 ? delta * 5 : delta)}`} label={prev ? `Depuis le ${prev.p.libelle}` : 'Évolution'} />}
            {!pre && <StatCard tint="violet" icon={<Trophy />} value={`${last.me.rank}e / ${last.rep!.effectif}`} label="Rang dans la classe" />}
          </div>
          {!pre && (
            <Card title="Évolution de la moyenne">
              <BarChart labels={reports.map((r) => r.p.court)} series={[{ label: fullName(child), color: '#1463f3', values: reports.map((r) => sc(r.me?.general)) }]} line={{ label: 'Moyenne de la classe', color: '#f0a500', values: reports.map((r) => sc(r.rep?.classGeneral)) }} max={bareme} ticks={4} showValues format={(n) => String(Math.round(n))} />
              <div className="row tiny muted mt-8" style={{ gap: 14 }}><span><i className="legend-dot" style={{ background: '#1463f3' }} />{child.prenom}</span><span><i className="legend-dot" style={{ background: '#f0a500' }} />Moyenne de la classe</span></div>
            </Card>
          )}
          <div className="grid g-2">
            <Card title="En progrès">{ups.length ? ups.map((l) => <div key={l.nom} className="row between small" style={{ padding: '6px 0' }}><span>{l.nom}</span><b style={{ color: 'var(--green)' }}>{pre ? <LevelPill v={l.now} /> : `${fmtNote(sc(l.before))} → ${fmtNote(sc(l.now))}`}</b></div>) : <p className="small muted">{prev ? 'Pas de hausse marquée depuis la période précédente.' : 'Il faudra deux bulletins pour voir les progrès.'}</p>}</Card>
            <Card title="À surveiller">{watch.length ? watch.map((l) => <div key={l.nom} className="row between small" style={{ padding: '6px 0' }}><span>{l.nom}</span><b style={{ color: 'var(--red)' }}>{pre ? <LevelPill v={l.now} /> : `${l.before != null ? `${fmtNote(sc(l.before))} → ` : ''}${fmtNote(sc(l.now))}`}</b></div>) : <p className="small muted">Aucune matière en difficulté. Bravo !</p>}</Card>
          </div>
        </div>
      )}
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
