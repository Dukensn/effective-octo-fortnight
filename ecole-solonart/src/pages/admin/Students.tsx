import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, ChevronDown, FileSpreadsheet, Printer, Eye, Pencil, IdCard, FileText, ChevronRight, Upload, Camera } from 'lucide-react';
import { useCollection } from '../../data/store';
import { PageHead, Tabs, Field, SearchInput, Avatar, StatusBadge, Menu, Pager, usePaged, Empty, useIsDesktop, Card } from '../../components/ui';
import { StudentPanel } from '../../components/StudentPanel';
import { downloadCSV, fullName, norm, dateShort, age } from '../../lib/format';
import { useSession } from '../../lib/session';
import { printDocument } from '../../lib/print';
import { StudentListSheet } from '../../docs/Sheets';
import { Donut, BarChart } from '../../components/charts';

type Tab = 'liste' | 'stats' | 'attente';

export default function Students() {
  const nav = useNavigate();
  const session = useSession()!;
  const [params, setParams] = useSearchParams();
  const students = useCollection('students');
  const classes = useCollection('classes').slice().sort((a, b) => a.code.localeCompare(b.code, 'fr', { numeric: true }));
  const [tab, setTab] = useState<Tab>('liste');
  const [classe, setClasse] = useState(params.get('classe') ?? 'c-s4-a');
  const [statut, setStatut] = useState('Actif');
  const [q, setQ] = useState('');
  const [perPage, setPerPage] = useState(10);
  const desktop = useIsDesktop();
  const selectedId = params.get('id');

  const list = useMemo(() => {
    const n = norm(q);
    return students
      .filter((s) => (classe === 'all' || s.classeId === classe) && (statut === 'all' ? s.statut !== 'Archivé' : s.statut === statut) && (!n || norm(`${s.prenom} ${s.nom} ${s.matricule}`).includes(n)))
      .sort((a, b) => (classe === 'c-s4-a' && !q ? 0 : (a.nom + a.prenom).localeCompare(b.nom + b.prenom, 'fr')));
  }, [students, classe, statut, q]);
  const paged = usePaged(list, perPage);
  const selected = students.find((s) => s.id === selectedId) ?? (desktop ? list[0] : undefined);
  const classOf = (id: string) => classes.find((c) => c.id === id);
  const pending = students.filter((s) => s.statut === 'En attente');

  const exportCSV = () => downloadCSV(`eleves-${classe === 'all' ? 'toutes-classes' : classOf(classe)?.code}.csv`, [
    ['Matricule', 'Nom', 'Prénom', 'Sexe', 'Date de naissance', 'Classe', 'Statut', 'Téléphone', 'Adresse'],
    ...list.map((s) => [s.matricule, s.nom, s.prenom, s.sexe, s.dateNaissance, classOf(s.classeId)?.code, s.statut, s.telephone, `${s.adresse}, ${s.commune}`]),
  ]);
  const printList = () => printDocument(<StudentListSheet students={list} title={classe === 'all' ? 'Liste des élèves' : `Liste des élèves — ${classOf(classe)?.nom}`} />, 'A4 portrait');
  const open = (id: string) => (desktop ? setParams({ id }, { replace: true }) : nav(`/eleves/${id}`));

  return (
    <>
      <PageHead
        title="Élèves"
        sub="Gérez les élèves, leurs informations et leur parcours scolaire."
        actions={<>
          <Menu trigger={<button className="btn">Exporter<ChevronDown /></button>} items={[
            { label: 'Télécharger en Excel', icon: <FileSpreadsheet />, onClick: exportCSV },
            { label: 'Imprimer / PDF', icon: <Printer />, onClick: printList },
          ]} />
          {session.can('inscriptions', 'write') && <button className="btn" onClick={() => nav('/eleves/import')}><Upload />Importer Excel</button>}
          {session.can('eleves', 'write') && <button className="btn" onClick={() => nav(`/eleves/photos${classe !== 'all' ? `?classe=${classe}` : ''}`)}><Camera />Photos</button>}
          {session.can('inscriptions', 'write') && <button className="btn btn-primary" onClick={() => nav('/inscriptions/rapide')}><Plus />Inscrire un élève</button>}
        </>}
      />
      <Tabs tabs={[['liste', 'Liste des élèves'], ['stats', 'Statistiques'], ['attente', `Inscriptions en attente${pending.length ? ` (${pending.length})` : ''}`]]} value={tab} onChange={setTab} />

      {tab === 'liste' && (
        <div className="split split-wide">
          <div className="card card-pad stack filters" style={{ gap: 14 }}>
            <Field label="Classe">
              <select className="select" value={classe} onChange={(e) => setClasse(e.target.value)}>
                <option value="all">Toutes les classes</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </Field>
            <Field label="Statut" className="hide-mobile">
              <select className="select" value={statut} onChange={(e) => setStatut(e.target.value)}>
                <option value="all">Tous les statuts</option>
                {['Actif', 'En attente', 'Suspendu', 'Transféré', 'Archivé'].map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Rechercher"><SearchInput value={q} onChange={setQ} placeholder="Nom, prénom, matricule..." /></Field>
            <button className="btn btn-soft hide-mobile" onClick={() => { setClasse('all'); setStatut('Actif'); setQ(''); }}>Réinitialiser les filtres</button>
          </div>

          <div className="card">
            <div className="card-head" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
              <h3 style={{ fontSize: 18 }}>Élèves ({list.length})</h3>
              <span className="small muted row" style={{ gap: 6 }}><i style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--green)' }} />{list.length} élèves {classe !== 'all' ? 'dans cette classe' : 'au total'}</span>
            </div>
            {list.length === 0 ? <Empty title="Aucun élève trouvé">Modifiez les filtres ou inscrivez un nouvel élève.</Empty> : desktop ? (
              <div className="table-wrap" style={{ padding: '0 14px' }}>
                <table className="t" style={{ border: '1px solid var(--line)', borderRadius: 10 }}>
                  <thead><tr><th>#</th><th>Photo</th><th>Nom et prénom</th><th>Matricule</th><th>Statut</th><th className="c">Actions</th></tr></thead>
                  <tbody>
                    {paged.items.map((s, i) => (
                      <tr key={s.id} className={`clickable ${selected?.id === s.id ? 'selected' : ''}`} onClick={() => open(s.id)}>
                        <td className="muted">{(paged.page - 1) * perPage + i + 1}</td>
                        <td><Avatar src={s.photo} name={fullName(s)} size={38} square /></td>
                        <td style={{ color: 'var(--ink)', fontWeight: 500 }}>{fullName(s)}</td>
                        <td>{s.matricule}</td>
                        <td><StatusBadge s={s.statut} /></td>
                        <td className="c"><RowMenu id={s.id} classeId={s.classeId} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="list">
                {paged.items.map((s) => (
                  <button key={s.id} className="list-item" style={{ border: 0, width: '100%', textAlign: 'left', borderBottom: '1px solid var(--line-2)' }} onClick={() => open(s.id)}>
                    <Avatar src={s.photo} name={fullName(s)} size={42} />
                    <div className="grow"><div style={{ fontWeight: 600, color: 'var(--ink)' }}>{fullName(s)}</div><div className="tiny muted">{s.matricule} · {classOf(s.classeId)?.code}</div></div>
                    <StatusBadge s={s.statut} /><ChevronRight className="chev" />
                  </button>
                ))}
              </div>
            )}
            <Pager {...paged} perPage={perPage} onPerPage={setPerPage} />
          </div>

          {desktop && selected && <StudentPanel student={selected} />}
        </div>
      )}

      {tab === 'stats' && <Stats />}

      {tab === 'attente' && (
        <Card pad={false}>
          {pending.length === 0 ? <Empty title="Aucune inscription en attente" /> : (
            <div className="list">
              {pending.map((s) => (
                <button key={s.id} className="list-item" style={{ border: 0, width: '100%', textAlign: 'left', borderBottom: '1px solid var(--line-2)' }} onClick={() => nav(`/inscriptions/${s.id}`)}>
                  <Avatar src={s.photo} name={fullName(s)} size={42} />
                  <div className="grow"><div style={{ fontWeight: 600, color: 'var(--ink)' }}>{fullName(s)}</div><div className="tiny muted">Demande du {dateShort(s.dateInscription)} · {classOf(s.classeId)?.nom} · {s.documents.filter((d) => !d.fourni).length} document(s) manquant(s)</div></div>
                  <StatusBadge s="En attente" /><ChevronRight className="chev" />
                </button>
              ))}
            </div>
          )}
        </Card>
      )}
    </>
  );

  function RowMenu({ id, classeId }: { id: string; classeId: string }) {
    return <Menu items={[
      { label: 'Voir le profil', icon: <Eye />, onClick: () => nav(`/eleves/${id}`) },
      ...(session.can('eleves', 'write') ? [{ label: 'Modifier', icon: <Pencil />, onClick: () => nav(`/inscriptions/${id}`) }] : []),
      { label: 'Bulletin', icon: <FileText />, onClick: () => nav(`/documents/bulletins?classe=${classeId}&eleve=${id}`) },
      { label: 'Badge', icon: <IdCard />, onClick: () => nav(`/documents/badges?type=eleve&eleve=${id}`) },
    ]} />;
  }
}

function Stats() {
  const students = useCollection('students').filter((s) => s.statut === 'Actif');
  const classes = useCollection('classes').slice().sort((a, b) => a.code.localeCompare(b.code, 'fr', { numeric: true }));
  const f = students.filter((s) => s.sexe === 'F').length;
  const ages = new Map<number, number>();
  students.forEach((s) => ages.set(age(s.dateNaissance), (ages.get(age(s.dateNaissance)) ?? 0) + 1));
  const ageKeys = [...ages.keys()].sort((a, b) => a - b);
  return (
    <div className="grid g-2">
      <Card title="Répartition filles / garçons">
        <div className="row wrap" style={{ gap: 24 }}>
          <Donut parts={[{ label: 'Filles', value: f, color: '#e05d8f' }, { label: 'Garçons', value: students.length - f, color: '#1463f3' }]} center={<div><b style={{ fontSize: 22 }}>{students.length}</b><div className="tiny muted">élèves</div></div>} />
          <div className="donut-legend grow">
            <div><i style={{ background: '#e05d8f' }} />Filles<b>{f} ({Math.round((f / students.length) * 100)}%)</b></div>
            <div><i style={{ background: '#1463f3' }} />Garçons<b>{students.length - f} ({Math.round(((students.length - f) / students.length) * 100)}%)</b></div>
            <div><i style={{ background: '#f08c00' }} />Redoublants<b>{students.filter((s) => s.redoublant).length}</b></div>
            <div><i style={{ background: '#17a34a' }} />Boursiers<b>{students.filter((s) => s.boursier).length}</b></div>
          </div>
        </div>
      </Card>
      <Card title="Effectif par classe">
        <BarChart labels={classes.map((c) => c.code)} series={[{ label: 'Effectif', color: '#1463f3', values: classes.map((c) => students.filter((s) => s.classeId === c.id).length) }]} showValues ticks={4} />
      </Card>
      <Card title="Pyramide des âges">
        <BarChart labels={ageKeys.map((a) => `${a} ans`)} series={[{ label: 'Élèves', color: '#7c4ddb', values: ageKeys.map((a) => ages.get(a)!) }]} showValues ticks={4} />
      </Card>
      <Card title="Provenance (lieu de naissance)">
        {Object.entries(students.reduce<Record<string, number>>((m, s) => ((m[s.lieuNaissance] = (m[s.lieuNaissance] ?? 0) + 1), m), {})).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
          <div key={k} className="row" style={{ padding: '6px 0' }}><span style={{ width: 120 }}>{k}</span><div className="bar grow"><i style={{ width: `${(v / students.length) * 100}%`, background: 'var(--primary)' }} /></div><b style={{ width: 40, textAlign: 'right' }}>{v}</b></div>
        ))}
      </Card>
    </div>
  );
}
