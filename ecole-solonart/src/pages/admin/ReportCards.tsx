import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Printer, CheckSquare, Square, Info } from 'lucide-react';
import { useCollection, useDoc } from '../../data/store';
import { PageHead, Field, Avatar, SearchInput, toast, Badge } from '../../components/ui';
import { Scaled, A4L } from '../../components/Scaled';
import { BulletinPages, BULLETIN_MODELS, TRI_THEMES, type BulletinModel } from '../../docs/Bulletins';
import { buildBulletin } from '../../docs/common';
import { classStudents, sortedPeriods } from '../../data/compute';
import { fullName, norm } from '../../lib/format';
import { printDocument } from '../../lib/print';
import { audit } from '../../lib/session';

const SWATCH: Record<string, string[]> = { bleu: ['#1d4fa8', '#c9dbf8'], vert: ['#2e8b4f', '#cfeedb'], gris: ['#4d566a', '#e3e6ec'], or: ['#e39a12', '#fff1d6'], marine: ['#0f2a5c', '#e0b03a'], violet: ['#5b52c9', '#e2defc'] };

export default function ReportCards() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const classes = useCollection('classes').slice().sort((a, b) => a.code.localeCompare(b.code, 'fr', { numeric: true }));
  useCollection('grades');
  useCollection('reportEntries');
  useDoc('school', 'main');
  const periods = sortedPeriods();
  const [model, setModel] = useState<BulletinModel>(params.get('scope') && params.get('scope') !== 'annuel' ? 'tripliable' : 'annuel');
  const [theme, setTheme] = useState('bleu');
  const [scope, setScope] = useState<string>(params.get('scope') ?? 'annuel');
  const [classe, setClasse] = useState(params.get('classe') ?? 'c-s4-a');
  const [mode, setMode] = useState<'classe' | 'selection'>(params.get('eleve') ? 'selection' : 'classe');
  const [selected, setSelected] = useState<Record<string, boolean>>(params.get('eleve') ? { [params.get('eleve')!]: true } : {});
  const [sides, setSides] = useState<'both' | 'recto' | 'verso'>('both');
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const info = BULLETIN_MODELS.find((m) => m.key === model)!;
  useEffect(() => { if (info.annualOnly) setScope('annuel'); }, [info.annualOnly]);
  const students = classStudents(classe);
  const targets = mode === 'classe' ? students : students.filter((s) => selected[s.id]);
  const current = targets[Math.min(idx, targets.length - 1)];
  const t = TRI_THEMES.find((x) => x.key === theme)!;
  const data = useMemo(() => (current ? buildBulletin(current.id, scope) : null), [current, scope]); // eslint-disable-line
  const twoSided = model === 'livret' || model === 'tripliable';

  const print = () => {
    if (!targets.length) return toast('Aucun élève sélectionné', true);
    const all = targets.map((s) => buildBulletin(s.id, scope)).filter(Boolean);
    audit('Génération bulletins', `${all.length} × ${info.nom} · ${classes.find((c) => c.id === classe)?.code}`);
    printDocument(<>{all.map((d) => <BulletinPages key={d!.student.id} d={d!} model={model} theme={t} sides={sides} />)}</>, 'A4 landscape', `Bulletins ${classes.find((c) => c.id === classe)?.code}`);
  };

  return (
    <>
      <PageHead
        back={<button className="back-link" style={{ border: 0, background: 'none', padding: 0 }} onClick={() => nav('/documents')}><ArrowLeft size={16} />Documents</button>}
        title="Générateur de bulletins"
        sub="Choisissez un modèle, une période et les élèves. Impression individuelle ou par lot (PDF)."
        actions={<button className="btn btn-primary btn-lg" onClick={print}><Printer />Imprimer / PDF ({targets.length})</button>}
      />
      <div className="gen-layout">
        <div className="stack">
          <div className="card card-pad">
            <h3 style={{ fontSize: 15 }} className="mb-12">1. Modèle</h3>
            <div className="stack" style={{ gap: 8 }}>
              {BULLETIN_MODELS.map((m) => (
                <button key={m.key} className="file-tile" style={{ borderColor: model === m.key ? 'var(--primary)' : undefined, background: model === m.key ? 'var(--primary-50)' : '#fff', textAlign: 'left' }} onClick={() => setModel(m.key)}>
                  <span className="grow"><b style={{ color: 'var(--ink)', fontSize: 13.5 }}>{m.nom}</b><br /><span className="tiny muted">{m.desc}</span></span>
                  <Badge tone="gray">{m.pages}</Badge>
                </button>
              ))}
            </div>
            {model === 'tripliable' && (
              <>
                <div className="small bold mt-16 mb-8" style={{ color: 'var(--ink)' }}>Thème</div>
                <div className="template-pick">
                  {TRI_THEMES.map((x) => (
                    <button key={x.key} className={theme === x.key ? 'active' : ''} onClick={() => setTheme(x.key)}>
                      <span className="swatch">{SWATCH[x.key].map((c) => <i key={c} style={{ background: c }} />)}</span>{x.nom}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="card card-pad stack" style={{ gap: 12 }}>
            <h3 style={{ fontSize: 15 }}>2. Période et classe</h3>
            <Field label="Période">
              <select className="select" value={scope} onChange={(e) => setScope(e.target.value)} disabled={info.annualOnly}>
                <option value="annuel">Bulletin annuel</option>
                {periods.map((p) => <option key={p.id} value={p.id}>{p.libelle}</option>)}
              </select>
            </Field>
            {info.annualOnly && <p className="tiny muted row" style={{ gap: 6 }}><Info size={13} />Ce modèle présente toute l’année.</p>}
            <Field label="Classe"><select className="select" value={classe} onChange={(e) => { setClasse(e.target.value); setIdx(0); setSelected({}); }}>{classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}</select></Field>
            {twoSided && (
              <Field label="Faces à imprimer">
                <select className="select" value={sides} onChange={(e) => setSides(e.target.value as typeof sides)}><option value="both">Recto + verso (impression recto-verso)</option><option value="recto">Recto seulement</option><option value="verso">Verso seulement</option></select>
              </Field>
            )}
          </div>
          <div className="card card-pad">
            <h3 style={{ fontSize: 15 }} className="mb-12">3. Élèves</h3>
            <div className="seg mb-12"><button className={mode === 'classe' ? 'active' : ''} onClick={() => { setMode('classe'); setIdx(0); }}>Toute la classe ({students.length})</button><button className={mode === 'selection' ? 'active' : ''} onClick={() => { setMode('selection'); setIdx(0); }}>Sélection</button></div>
            {mode === 'selection' && (
              <>
                <SearchInput value={q} onChange={setQ} placeholder="Rechercher..." />
                <div className="list mt-8" style={{ maxHeight: 280, overflow: 'auto', border: '1px solid var(--line)', borderRadius: 10 }}>
                  {students.filter((s) => !q || norm(fullName(s)).includes(norm(q))).map((s) => (
                    <button key={s.id} className="list-item" style={{ border: 0, width: '100%', textAlign: 'left', padding: '8px 10px' }} onClick={() => setSelected({ ...selected, [s.id]: !selected[s.id] })}>
                      {selected[s.id] ? <CheckSquare size={18} color="var(--primary)" /> : <Square size={18} color="var(--faint)" />}
                      <Avatar src={s.photo} name={fullName(s)} size={26} /><span className="grow small">{fullName(s)}</span>
                    </button>
                  ))}
                </div>
                <div className="row mt-8"><button className="btn btn-sm" onClick={() => setSelected(Object.fromEntries(students.map((s) => [s.id, true])))}>Tout</button><button className="btn btn-sm" onClick={() => setSelected({})}>Aucun</button><span className="small muted">{targets.length} sélectionné(s)</span></div>
              </>
            )}
          </div>
          <button className="btn btn-primary btn-lg btn-block" onClick={print}><Printer />Imprimer / Enregistrer en PDF ({targets.length})</button>
          <p className="tiny muted">Astuce : dans la fenêtre d’impression, choisissez « Enregistrer au format PDF », format A4 paysage, marges « Aucune ». Pour les modèles recto-verso, activez l’impression recto-verso (retourner sur le bord court).</p>
        </div>

        <div className="card card-pad">
          <div className="row mb-12 wrap">
            <b style={{ color: 'var(--ink)' }}>Aperçu</b>
            {current && <span className="small muted grow">{fullName(current)} · {idx + 1} / {targets.length}</span>}
            <button className="btn btn-sm btn-icon" disabled={idx <= 0} onClick={() => setIdx(idx - 1)} aria-label="Précédent"><ChevronLeft size={16} /></button>
            <button className="btn btn-sm btn-icon" disabled={idx >= targets.length - 1} onClick={() => setIdx(idx + 1)} aria-label="Suivant"><ChevronRight size={16} /></button>
            {current && <button className="btn btn-sm" onClick={() => { const d = buildBulletin(current.id, scope); if (d) printDocument(<BulletinPages d={d} model={model} theme={t} sides={sides} />, 'A4 landscape', `Bulletin ${fullName(current)}`); }}><Printer size={14} />Cet élève</button>}
          </div>
          <div className="preview-stage">
            {!data ? <div className="muted center" style={{ alignSelf: 'center' }}>Sélectionnez au moins un élève.</div> : (
              <div className="preview-pages" style={{ width: '100%' }}>
                {(model === 'annuel' || model === 'annuel100' ? [0] : sides === 'both' ? [0, 1] : [0]).map((i) => (
                  <Scaled key={i} width={A4L.w} height={A4L.h}>
                    <BulletinPages d={data} model={model} theme={t} sides={model === 'annuel' || model === 'annuel100' ? 'both' : sides === 'both' ? (i === 0 ? 'recto' : 'verso') : sides} />
                  </Scaled>
                ))}
              </div>
            )}
          </div>
          <p className="tiny muted mt-12">Les notes, moyennes et rangs sont calculés automatiquement à partir des notes saisies par les professeurs. Les appréciations et décisions se modifient dans Notes / Examens → Conseil de classe. Le logo, la signature et le cachet se règlent dans Paramètres.</p>
        </div>
      </div>
    </>
  );
}
