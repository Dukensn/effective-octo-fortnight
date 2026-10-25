// Journal des modifications : qui a fait quoi, quand, avec les valeurs avant / après et le motif.
// Les lignes ne sont jamais modifiées ni supprimées depuis l'application.
import { useMemo, useState } from 'react';
import { FileSpreadsheet, ChevronDown } from 'lucide-react';
import { useCollection } from '../../data/store';
import type { AuditLog } from '../../data/types';
import { PageHead, Pills, SearchInput, Empty, usePaged, Pager } from '../../components/ui';
import { downloadCSV, norm } from '../../lib/format';

type Domaine = NonNullable<AuditLog['domaine']>;
const DOMAINES: [Domaine | 'tous', string][] = [['tous', 'Tout'], ['notes', 'Notes'], ['finance', 'Finance'], ['eleves', 'Élèves'], ['discipline', 'Discipline'], ['acces', 'Accès'], ['autre', 'Autres']];
const PERIODES: [string, string][] = [['7', '7 jours'], ['30', '30 jours'], ['365', '1 an'], ['tout', 'Tout']];

/** Domaine d'une ligne (les anciennes lignes n'en ont pas : on le déduit de l'action). */
export function domaineOf(l: AuditLog): Domaine {
  if (l.domaine) return l.domaine;
  const a = norm(l.action);
  if (/note|evaluation|periode|controle|bulletin/.test(a)) return 'notes';
  if (/paiement|depense|salaire|relance/.test(a)) return 'finance';
  if (/inscri|eleve|import|photo|archiv|parent|classe/.test(a)) return 'eleves';
  if (/incident|discipline/.test(a)) return 'discipline';
  if (/connexion|utilisateur|compte|acces|role/.test(a)) return 'acces';
  return 'autre';
}

const when = (t: number) => new Date(t).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function Journal() {
  const logs = useCollection('audit');
  const users = useCollection('users');
  const [dom, setDom] = useState<Domaine | 'tous'>('tous');
  const [periode, setPeriode] = useState('30');
  const [user, setUser] = useState('tous');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const name = (id?: string) => users.find((u) => u.id === id)?.nom ?? 'Système';

  const list = useMemo(() => {
    const since = periode === 'tout' ? 0 : Date.now() - Number(periode) * 86400000;
    return logs
      .filter((l) => l.date >= since && (dom === 'tous' || domaineOf(l) === dom) && (user === 'tous' || l.userId === user))
      .filter((l) => !q || norm(`${l.action} ${l.detail} ${l.motif ?? ''} ${(l.changements ?? []).map((c) => c.libelle).join(' ')}`).includes(norm(q)))
      .sort((a, b) => b.date - a.date);
  }, [logs, dom, periode, user, q]);
  const paged = usePaged(list, 25);
  const authors = useMemo(() => [...new Set(logs.map((l) => l.userId).filter(Boolean))].map((id) => ({ id: id!, nom: name(id) })).sort((a, b) => a.nom.localeCompare(b.nom, 'fr')), [logs, users]); // eslint-disable-line

  const exportCsv = () => downloadCSV('journal.csv', [
    ['Date', 'Utilisateur', 'Domaine', 'Action', 'Détail', 'Motif', 'Changements'],
    ...list.map((l) => [when(l.date), name(l.userId), domaineOf(l), l.action, l.detail, l.motif, (l.changements ?? []).map((c) => `${c.libelle} : ${c.avant} → ${c.apres}`).join(' ; ')]),
  ]);

  return (
    <>
      <PageHead title="Journal des modifications" sub="Chaque action importante est gardée ici : qui, quand, et ce qui a changé. Les lignes ne peuvent être ni modifiées ni supprimées."
        actions={<button className="btn" onClick={exportCsv}><FileSpreadsheet />Excel</button>} />
      <div className="card card-pad mb-16 stack" style={{ gap: 12 }}>
        <Pills items={DOMAINES} value={dom} onChange={setDom} />
        <div className="row wrap" style={{ gap: 10 }}>
          <div style={{ flex: '1 1 220px' }}><SearchInput value={q} onChange={setQ} placeholder="Élève, n° de reçu, matière, motif…" /></div>
          <select className="select" style={{ width: 200 }} value={user} onChange={(e) => setUser(e.target.value)} aria-label="Utilisateur"><option value="tous">Tous les utilisateurs</option>{authors.map((a) => <option key={a.id} value={a.id}>{a.nom}</option>)}</select>
          <select className="select" style={{ width: 130 }} value={periode} onChange={(e) => setPeriode(e.target.value)} aria-label="Période">{PERIODES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        </div>
      </div>
      <div className="card">
        <div className="card-pad small muted" style={{ paddingBottom: 0 }}>{list.length} ligne(s)</div>
        <div className="journal">
          {paged.items.map((l) => {
            const more = !!(l.changements?.length || l.motif);
            const isOpen = open === l.id;
            return (
              <div key={l.id} className="journal-row">
                <button className="journal-head" disabled={!more} onClick={() => setOpen(isOpen ? null : l.id)} aria-expanded={more ? isOpen : undefined}>
                  <span className={`journal-dot d-${domaineOf(l)}`} />
                  <span className="grow">
                    <b>{l.action}</b>{l.changements?.length ? <span className="badge b-orange" style={{ marginLeft: 6 }}>{l.changements.length} changement(s)</span> : null}
                    <span className="tiny muted" style={{ display: 'block' }}>{l.detail}</span>
                  </span>
                  <span className="tiny muted right" style={{ flex: 'none' }}>{name(l.userId)}<br />{when(l.date)}</span>
                  {more && <ChevronDown size={16} style={{ flex: 'none', transform: isOpen ? 'rotate(180deg)' : undefined }} />}
                </button>
                {isOpen && (
                  <div className="journal-body">
                    {l.motif && <p className="small"><b>Motif :</b> {l.motif}</p>}
                    {l.changements?.map((c, i) => (
                      <div key={i} className="journal-change"><span className="grow">{c.libelle}</span><s className="muted">{c.avant}</s><span className="muted">→</span><b>{c.apres}</b></div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {list.length === 0 && <Empty title="Aucune ligne pour ces filtres" />}
        <Pager {...paged} />
      </div>
    </>
  );
}
