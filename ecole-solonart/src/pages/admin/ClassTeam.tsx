// Équipe pédagogique d'une classe : la direction choisit l'organisation (maître unique, équipe,
// un professeur par matière, co-titulaires) ; l'application en déduit les affectations, l'appel,
// la saisie des notes, la signature du bulletin et qui peut écrire aux parents.
import { db, useCollection } from '../../data/store';
import type { ClassRoom, Course, ID } from '../../data/types';
import { Card, toast } from '../../components/ui';
import { civ, norm } from '../../lib/format';
import { audit } from '../../lib/session';
import { ORGANISATIONS, callerLabel, classTeacherIds, isSecondaire, organisationOf, type Organisation } from '../../lib/regles';

const MAX_H = 30; // heures / semaine considérées comme une charge pleine

export function ClassTeam({ classe, courses, canWrite }: { classe: ClassRoom; courses: Course[]; canWrite: boolean }) {
  const staff = useCollection('staff');
  const subjects = useCollection('subjects');
  const allCourses = useCollection('courses');
  const profs = staff.filter((s) => s.type === 'Professeur' && s.statut === 'Actif');
  const org = organisationOf(classe);
  const pre = classe.niveau === 'Préscolaire';
  const team = classTeacherIds(classe);
  const name = (id?: ID) => civ(staff.find((s) => s.id === id)) || '—';
  const subj = (c: Course) => subjects.find((s) => s.id === c.matiereId);

  const setAll = (profId: ID | undefined) => courses.forEach((c) => c.professeurId !== profId && db.patch('courses', c.id, { professeurId: profId }));
  const patchClass = (p: Partial<ClassRoom>, what: string) => { db.patch('classes', classe.id, p); audit('Équipe pédagogique', `${classe.code} · ${what}`, { domaine: 'autre' }); };

  const choose = (o: Organisation) => {
    if (o === org) return;
    // Maître unique et co-titulaires : le titulaire porte toutes les matières (les co-titulaires y ont accès aussi).
    if ((o === 'unique' || o === 'cotitulaires') && classe.titulaireId) setAll(classe.titulaireId);
    patchClass({ organisation: o, cotitulaireIds: o === 'unique' || o === 'matiere' ? [] : classe.cotitulaireIds }, ORGANISATIONS.find((x) => x.key === o)!.label);
    toast(`Organisation : ${ORGANISATIONS.find((x) => x.key === o)!.label}`);
  };
  const setTitulaire = (id: ID | undefined) => {
    patchClass({ titulaireId: id, cotitulaireIds: (classe.cotitulaireIds ?? []).filter((x) => x !== id) }, `titulaire ${name(id)}`);
    if (org === 'unique' || org === 'cotitulaires') setAll(id);
  };
  const toggleMember = (id: ID) => {
    const cur = classe.cotitulaireIds ?? [];
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    patchClass({ cotitulaireIds: next }, `${cur.includes(id) ? 'retrait' : 'ajout'} de ${name(id)}`);
    // En équipe, les matières d'un membre retiré reviennent au titulaire.
    if (org === 'equipe' && cur.includes(id)) courses.filter((c) => c.professeurId === id).forEach((c) => db.patch('courses', c.id, { professeurId: classe.titulaireId }));
  };
  // Répartition automatique en équipe : la spécialité d'abord, puis le moins chargé.
  const autoSplit = () => {
    if (team.length < 2) return toast('Ajoutez au moins deux enseignants à l’équipe', true);
    const load = new Map(team.map((id) => [id, 0]));
    for (const c of [...courses].sort((a, b) => b.heuresSemaine - a.heuresSemaine)) {
      const s = subj(c);
      const spec = team.find((id) => { const sp = norm(staff.find((x) => x.id === id)?.specialite ?? ''); return !!sp && !!s && (norm(s.nom).includes(sp) || sp.includes(norm(s.nom))); });
      const pick = spec ?? [...load.entries()].sort((a, b) => a[1] - b[1])[0][0];
      load.set(pick, (load.get(pick) ?? 0) + c.heuresSemaine);
      if (c.professeurId !== pick) db.patch('courses', c.id, { professeurId: pick });
    }
    audit('Équipe pédagogique', `${classe.code} · répartition automatique`, { domaine: 'autre' });
    toast('Matières réparties entre les membres de l’équipe');
  };

  // Charge de chaque enseignant concerné : dans cette classe et dans toute l'école.
  const involved = [...new Set([...team, ...courses.map((c) => c.professeurId).filter((x): x is ID => !!x)])];
  const loads = involved.map((id) => {
    const here = org === 'cotitulaires' && team.includes(id) ? courses : courses.filter((c) => c.professeurId === id);
    const total = allCourses.filter((c) => c.professeurId === id).reduce((a, c) => a + c.heuresSemaine, 0);
    return { id, n: here.length, h: here.reduce((a, c) => a + c.heuresSemaine, 0), total };
  });
  const orphan = courses.filter((c) => !c.professeurId && org !== 'cotitulaires');
  const choices = ORGANISATIONS.filter((o) => !(isSecondaire(classe) && (o.key === 'unique' || o.key === 'cotitulaires')));
  const memberPicker = org === 'equipe' || org === 'cotitulaires';

  return (
    <div className="stack">
      <Card title="Comment cette classe est-elle organisée ?">
        <div className="org-grid">{choices.map((o) => (
          <button key={o.key} type="button" className={`org-card ${org === o.key ? 'on' : ''}`} disabled={!canWrite} onClick={() => choose(o.key)} aria-pressed={org === o.key}>
            <b>{o.label}{o.pour.includes(classe.niveau) && <span className="badge b-blue" style={{ marginLeft: 6 }}>courant en {classe.niveau.toLowerCase()}</span>}</b>
            <small>{o.desc}</small>
          </button>
        ))}</div>
        {!classe.organisation && <p className="tiny muted mt-8">Organisation déduite automatiquement ; choisissez-la pour la confirmer.</p>}
      </Card>

      <Card title="Équipe">
        <div className="stack" style={{ gap: 12 }}>
          <label className="field"><span>{org === 'unique' ? 'Enseignant(e) unique' : org === 'cotitulaires' ? 'Titulaire' : 'Titulaire (professeur principal)'}</span>
            <select className="select" disabled={!canWrite} value={classe.titulaireId ?? ''} onChange={(e) => setTitulaire(e.target.value || undefined)}>
              <option value="">— Choisir —</option>{profs.map((p) => <option key={p.id} value={p.id}>{civ(p)}{p.specialite ? ` · ${p.specialite}` : ''}</option>)}
            </select>
          </label>
          {memberPicker && (
            <div className="field"><span>{org === 'cotitulaires' ? 'Co-titulaires (à égalité sur tout)' : 'Autres membres de l’équipe'}</span>
              <div className="row wrap" style={{ gap: 6 }}>
                {(classe.cotitulaireIds ?? []).map((id) => <span key={id} className="chip active">{name(id)}{canWrite && <button type="button" className="chip-x" aria-label={`Retirer ${name(id)}`} onClick={() => toggleMember(id)}>×</button>}</span>)}
                {canWrite && (
                  <select className="select" style={{ width: 'auto', minWidth: 190, height: 34 }} value="" aria-label="Ajouter un membre" onChange={(e) => e.target.value && toggleMember(e.target.value)}>
                    <option value="">+ Ajouter…</option>{profs.filter((p) => p.id !== classe.titulaireId && !(classe.cotitulaireIds ?? []).includes(p.id)).map((p) => <option key={p.id} value={p.id}>{civ(p)}{p.specialite ? ` · ${p.specialite}` : ''}</option>)}
                  </select>
                )}
              </div>
            </div>
          )}
          {org === 'equipe' && canWrite && <button className="btn btn-soft" style={{ alignSelf: 'flex-start' }} onClick={autoSplit}>Répartir les matières automatiquement</button>}
        </div>
      </Card>

      <Card title={pre ? 'Domaines' : 'Matières'} pad={false}>
        <div className="team-list">{courses.map((c) => (
          <div key={c.id} className="team-row">
            <b className="team-subj">{subj(c)?.nom}</b>
            <div className="team-prof">{org === 'unique' ? <span className="small muted">{name(classe.titulaireId)}</span>
              : org === 'cotitulaires' ? <span className="small muted">{team.map(name).join(', ') || '—'}</span>
              : !canWrite ? <span className="small">{name(c.professeurId)}</span>
              : org === 'equipe' ? (
                <div className="row wrap" style={{ gap: 4 }}>{team.map((id) => <button key={id} type="button" className={`chip ${c.professeurId === id ? 'active' : ''}`} style={{ height: 30 }} onClick={() => db.patch('courses', c.id, { professeurId: id })}>{staff.find((s) => s.id === id)?.prenom}</button>)}{team.length === 0 && <span className="tiny muted">Choisissez l’équipe</span>}</div>
              ) : (
                <select className="select" aria-label={`Enseignant de ${subj(c)?.nom}`} value={c.professeurId ?? ''} onChange={(e) => db.patch('courses', c.id, { professeurId: e.target.value || undefined })}>
                  <option value="">— Non affecté —</option>{profs.map((p) => <option key={p.id} value={p.id}>{civ(p)}{p.specialite ? ` · ${p.specialite}` : ''}</option>)}
                </select>
              )}</div>
            <div className="team-nums">
              {!pre && <label className="tiny muted">Coef.{canWrite ? <input type="number" min={1} max={10} className="input" value={c.coefficient} onChange={(e) => db.patch('courses', c.id, { coefficient: Math.max(1, Number(e.target.value)) })} /> : <b> {c.coefficient}</b>}</label>}
              <label className="tiny muted">h / sem.{canWrite ? <input type="number" min={1} max={12} className="input" value={c.heuresSemaine} onChange={(e) => db.patch('courses', c.id, { heuresSemaine: Number(e.target.value) })} /> : <b> {c.heuresSemaine}</b>}</label>
            </div>
          </div>
        ))}</div>
        {canWrite && subjects.some((s) => !courses.some((c) => c.matiereId === s.id) && (s.groupe === 'prescolaire') === pre) && (
          <div className="card-pad row wrap">
            <span className="small muted">Ajouter :</span>
            {subjects.filter((s) => !courses.some((c) => c.matiereId === s.id) && (s.groupe === 'prescolaire') === pre).map((s) => (
              <button key={s.id} className="btn btn-sm btn-soft" onClick={() => db.put('courses', { id: `${classe.id}-${s.id}`, classeId: classe.id, matiereId: s.id, professeurId: org === 'unique' || org === 'cotitulaires' ? classe.titulaireId : undefined, coefficient: pre ? 1 : 2, heuresSemaine: 3 })}>+ {s.nom}</button>
            ))}
          </div>
        )}
      </Card>

      <div className="grid g-2">
        <Card title="Charge des enseignants">
          {loads.length === 0 && <p className="small muted">Aucun enseignant affecté.</p>}
          {loads.map((l) => (
            <div key={l.id} style={{ padding: '6px 0' }}>
              <div className="row between small"><span>{name(l.id)}</span><b>{l.n} {pre ? 'domaine(s)' : 'matière(s)'} · {l.h} h ici</b></div>
              <div className="bar mt-4"><i style={{ width: `${Math.min(100, (l.total / MAX_H) * 100)}%`, background: l.total > MAX_H ? 'var(--red)' : 'var(--primary)' }} /></div>
              <div className="tiny muted">{l.total} h / semaine dans toute l’école{l.total > MAX_H ? ' — surcharge' : ''}</div>
            </div>
          ))}
          {orphan.length > 0 && <p className="small mt-8" style={{ color: 'var(--red)' }}>{orphan.length} {pre ? 'domaine(s)' : 'matière(s)'} sans enseignant : {orphan.map((c) => subj(c)?.nom).join(', ')}.</p>}
        </Card>
        <Card title="Ce que l’application en déduit">
          <div className="info small">
            <div>Appel du jour</div><div>{callerLabel(classe)}</div>
            <div>Saisie des notes</div><div>{org === 'cotitulaires' ? 'Tous les co-titulaires, pour tous les domaines' : org === 'unique' ? `${name(classe.titulaireId)}, toutes les matières` : 'Chaque enseignant pour ses matières'}</div>
            <div>Bulletin signé par</div><div>{org === 'cotitulaires' ? team.map(name).join(' et ') || '—' : name(classe.titulaireId)}</div>
            <div>Messages aux parents</div><div>{isSecondaire(classe) ? 'Administration seulement' : org === 'unique' ? name(classe.titulaireId) : 'Les enseignants de la classe (la direction voit tout)'}</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

