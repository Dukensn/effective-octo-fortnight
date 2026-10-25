// Comité de classe : responsable de la classe + élèves élus (président, secrétaire…).
import { useState } from 'react';
import { Crown, Pencil, Plus, UserMinus, Repeat } from 'lucide-react';
import { db, useCollection } from '../../data/store';
import { COMITE_ROLES, ROLES_UNIQUES, type ClassRoom, type ComiteMember } from '../../data/types';
import { Avatar, Card, Empty, Field, Menu, Modal, SearchInput, toast } from '../../components/ui';
import { classStudents } from '../../data/compute';
import { civ, fullName, norm, todayISO } from '../../lib/format';
import { audit } from '../../lib/session';
import { allowsTeacherResponsable, responsableOf, roleLabel, roleOrder } from '../../lib/comite';

export function ClassComite({ classe, canWrite }: { classe: ClassRoom; canWrite: boolean }) {
  const students = classStudents(classe.id);
  const staff = useCollection('staff');
  const [nommer, setNommer] = useState<Partial<ComiteMember> | null>(null);
  const [changeResp, setChangeResp] = useState(false);
  const comite = [...(classe.comite ?? [])].sort((a, b) => roleOrder(a.role) - roleOrder(b.role));
  const resp = responsableOf(classe);
  const respPerson = resp?.type === 'eleve' ? students.find((s) => s.id === resp.id) : staff.find((s) => s.id === resp?.id);
  const save = (next: ComiteMember[], msg: string) => { db.patch('classes', classe.id, { comite: next }); audit('Comité de classe', `${classe.code} · ${msg}`); toast(msg); };
  const remove = (m: ComiteMember) => {
    const s = students.find((x) => x.id === m.eleveId);
    save((classe.comite ?? []).filter((x) => x !== m), `${fullName(s)} n’est plus ${roleLabel(m.role, s?.sexe).toLowerCase()}`);
  };

  return (
    <div className="stack">
      <Card title="Responsable de la classe" actions={canWrite && <button className="btn btn-sm" onClick={() => setChangeResp(true)}><Repeat size={14} />Changer</button>}>
        {!respPerson ? (
          <p className="small muted">{allowsTeacherResponsable(classe) ? 'Aucun responsable. Choisissez un professeur ou un élève.' : 'Aucun responsable. Au secondaire, c’est un élève — en général le président du comité.'}</p>
        ) : (
          <div className="row">
            <Avatar src={respPerson.photo} name={fullName(respPerson)} size={48} />
            <div className="grow">
              <b style={{ color: 'var(--ink)', fontSize: 15.5 }}>{resp?.type === 'professeur' ? civ(respPerson as never) : fullName(respPerson)}</b>
              <div className="small muted">{resp?.type === 'professeur' ? 'Professeur' : `Élève${comite.find((m) => m.eleveId === resp?.id) ? ` · ${roleLabel(comite.find((m) => m.eleveId === resp?.id)!.role, (respPerson as { sexe?: 'M' | 'F' }).sexe)}` : ''}`}</div>
            </div>
            <Crown size={20} color="var(--gold)" />
          </div>
        )}
        <p className="tiny muted mt-12">{allowsTeacherResponsable(classe) ? 'Au fondamental et au préscolaire, le responsable peut être un professeur ou un élève.' : 'Au secondaire, la classe est sous la responsabilité d’un élève, pas d’un professeur.'}</p>
      </Card>

      <Card title={`Comité de classe${comite.length ? ` (${comite.length})` : ''}`} pad={false} actions={canWrite && <button className="btn btn-sm btn-primary" onClick={() => setNommer({ role: COMITE_ROLES.find((r) => !comite.some((m) => m.role === r)) ?? 'Conseiller' })}><Plus size={14} />Nommer</button>}>
        {comite.length === 0 ? <Empty title="Pas encore de comité">Nommez un président, un secrétaire, un trésorier…</Empty> : (
          <div className="list">
            {comite.map((m) => {
              const s = students.find((x) => x.id === m.eleveId);
              if (!s) return null;
              return (
                <div key={`${m.eleveId}-${m.role}`} className="list-item">
                  <Avatar src={s.photo} name={fullName(s)} size={40} />
                  <div className="grow"><b style={{ color: 'var(--ink)' }}>{fullName(s)}</b><div className="tiny muted">{roleLabel(m.role, s.sexe)}{m.depuis ? ` · depuis le ${new Date(m.depuis + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}</div></div>
                  {canWrite && <Menu items={[
                    { label: 'Changer de rôle', icon: <Pencil />, onClick: () => setNommer({ ...m }) },
                    { label: 'Retirer du comité', icon: <UserMinus />, onClick: () => remove(m), danger: true },
                  ]} />}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {nommer && <NommerModal classe={classe} value={nommer} onClose={() => setNommer(null)} onSave={save} />}
      {changeResp && <ResponsableModal classe={classe} onClose={() => setChangeResp(false)} />}
    </div>
  );
}

function StudentPicker({ classeId, value, onChange, exclude = [] }: { classeId: string; value?: string; onChange: (id: string) => void; exclude?: string[] }) {
  const [q, setQ] = useState('');
  const list = classStudents(classeId).filter((s) => !exclude.includes(s.id) && norm(fullName(s)).includes(norm(q)));
  return (
    <div className="stack" style={{ gap: 8 }}>
      <SearchInput value={q} onChange={setQ} placeholder="Chercher un élève…" />
      <div className="pick-list">
        {list.map((s) => (
          <button key={s.id} type="button" className={value === s.id ? 'on' : ''} onClick={() => onChange(s.id)}>
            <Avatar src={s.photo} name={fullName(s)} size={32} /><span className="grow">{fullName(s)}</span>
          </button>
        ))}
        {list.length === 0 && <div className="small muted" style={{ padding: 10 }}>Aucun élève.</div>}
      </div>
    </div>
  );
}

function NommerModal({ classe, value, onClose, onSave }: { classe: ClassRoom; value: Partial<ComiteMember>; onClose: () => void; onSave: (c: ComiteMember[], msg: string) => void }) {
  const editing = !!value.eleveId;
  const [role, setRole] = useState(value.role ?? 'Président');
  const [autre, setAutre] = useState(COMITE_ROLES.includes(value.role ?? '') ? '' : value.role ?? '');
  const [eleveId, setEleveId] = useState(value.eleveId ?? '');
  const finalRole = role === 'Autre' ? autre.trim() : role;
  const current = classe.comite ?? [];
  const holder = ROLES_UNIQUES.includes(finalRole) ? current.find((m) => m.role === finalRole && m.eleveId !== eleveId) : undefined;
  const holderStudent = holder && db.get('students', holder.eleveId);
  const submit = () => {
    if (!eleveId) return toast('Choisissez un élève', true);
    if (!finalRole) return toast('Indiquez le rôle', true);
    let next = current.filter((m) => !(editing && m.eleveId === value.eleveId && m.role === value.role));
    if (holder) next = next.filter((m) => m !== holder); // un seul président, secrétaire…
    next.push({ eleveId, role: finalRole, depuis: todayISO() });
    const s = db.get('students', eleveId);
    onSave(next, `${fullName(s)} nommé${s?.sexe === 'F' ? 'e' : ''} ${roleLabel(finalRole, s?.sexe).toLowerCase()}`);
    onClose();
  };
  return (
    <Modal open onClose={onClose} title={editing ? 'Changer de rôle' : 'Nommer un membre du comité'} footer={<><button className="btn" onClick={onClose}>Annuler</button><button className="btn btn-primary" onClick={submit}>{editing ? 'Enregistrer' : 'Nommer'}</button></>}>
      <div className="stack" style={{ gap: 14 }}>
        <Field label="Rôle">
          <select className="select" value={COMITE_ROLES.includes(role) ? role : 'Autre'} onChange={(e) => setRole(e.target.value)}>
            {COMITE_ROLES.map((r) => <option key={r}>{r}</option>)}
            <option value="Autre">Autre rôle…</option>
          </select>
        </Field>
        {role === 'Autre' && <Field label="Nom du rôle"><input className="input" value={autre} onChange={(e) => setAutre(e.target.value)} placeholder="Ex. Responsable bibliothèque" /></Field>}
        {holderStudent && <div className="small" style={{ background: 'var(--orange-50)', color: '#8a5300', padding: '8px 12px', borderRadius: 10 }}>{fullName(holderStudent)} est actuellement {roleLabel(finalRole, holderStudent.sexe).toLowerCase()} : il ou elle sera remplacé(e).</div>}
        {!editing && <div className="field"><span>Élève</span><StudentPicker classeId={classe.id} value={eleveId} onChange={setEleveId} /></div>}
      </div>
    </Modal>
  );
}

function ResponsableModal({ classe, onClose }: { classe: ClassRoom; onClose: () => void }) {
  const profsAllowed = allowsTeacherResponsable(classe);
  const cur = responsableOf(classe);
  const [type, setType] = useState<'eleve' | 'professeur'>(profsAllowed ? cur?.type ?? 'professeur' : 'eleve');
  const [id, setId] = useState(cur?.type === type ? cur.id : '');
  const teachers = useCollection('staff').filter((s) => s.type === 'Professeur' && s.statut === 'Actif');
  const courses = useCollection('courses').filter((c) => c.classeId === classe.id);
  const classTeachers = teachers.filter((t) => t.id === classe.titulaireId || courses.some((c) => c.professeurId === t.id)).sort((a, b) => Number(b.id === classe.titulaireId) - Number(a.id === classe.titulaireId));
  const submit = () => {
    if (!id) return toast(type === 'eleve' ? 'Choisissez un élève' : 'Choisissez un professeur', true);
    db.patch('classes', classe.id, { responsable: { type, id } });
    audit('Responsable de classe', `${classe.code} · ${type} ${id}`);
    toast('Responsable de la classe mis à jour');
    onClose();
  };
  return (
    <Modal open onClose={onClose} title={`Responsable de ${classe.code}`} footer={<><button className="btn" onClick={onClose}>Annuler</button><button className="btn btn-primary" onClick={submit}>Enregistrer</button></>}>
      <div className="stack" style={{ gap: 14 }}>
        {profsAllowed ? (
          <div className="seg"><button className={type === 'professeur' ? 'active' : ''} onClick={() => { setType('professeur'); setId(''); }}>Un professeur</button><button className={type === 'eleve' ? 'active' : ''} onClick={() => { setType('eleve'); setId(''); }}>Un élève</button></div>
        ) : <p className="small muted">Au secondaire, le responsable est un élève de la classe.</p>}
        {type === 'eleve' ? (
          <>
            {(classe.comite ?? []).length > 0 && (
              <div className="row wrap" style={{ gap: 6 }}>
                {[...(classe.comite ?? [])].sort((a, b) => roleOrder(a.role) - roleOrder(b.role)).slice(0, 4).map((m) => {
                  const s = db.get('students', m.eleveId);
                  return <button key={m.eleveId + m.role} className={`chip ${id === m.eleveId ? 'active' : ''}`} onClick={() => setId(m.eleveId)}>{roleLabel(m.role, s?.sexe)} · {s?.prenom}</button>;
                })}
              </div>
            )}
            <StudentPicker classeId={classe.id} value={id} onChange={setId} />
          </>
        ) : (
          <div className="pick-list">
            {(classTeachers.length ? classTeachers : teachers).map((t) => (
              <button key={t.id} type="button" className={id === t.id ? 'on' : ''} onClick={() => setId(t.id)}>
                <Avatar src={t.photo} name={fullName(t)} size={32} /><span className="grow">{civ(t)}<small className="muted" style={{ display: 'block' }}>{t.id === classe.titulaireId ? 'Titulaire' : t.specialite}</small></span>
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
