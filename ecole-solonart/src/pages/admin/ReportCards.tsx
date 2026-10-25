import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Printer, Sparkles, User } from 'lucide-react';
import { useCollection, useDoc } from '../../data/store';
import { PageHead } from '../../components/ui';
import { Scaled, A4L } from '../../components/Scaled';
import { BulletinPages, BULLETIN_MODELS, TRI_THEMES, type BulletinModel } from '../../docs/Bulletins';
import { buildBulletin } from '../../docs/common';
import { classStudents, isPreschool, sortedPeriods, defaultClassId } from '../../data/compute';
import { fullName } from '../../lib/format';
import { printDocument } from '../../lib/print';
import { audit } from '../../lib/session';

const SWATCH: Record<string, string> = { bleu: '#1d4fa8', vert: '#2e8b4f', gris: '#4d566a', or: '#e39a12', marine: '#0f2a5c', violet: '#5b52c9' };

/** Générateur de bulletins : 3 choix (classe, période, modèle) puis « Imprimer ». */
export default function ReportCards() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const classes = useCollection('classes').slice().sort((a, b) => a.code.localeCompare(b.code, 'fr', { numeric: true }));
  useCollection('grades');
  useCollection('reportEntries');
  useDoc('school', 'main');
  const periods = sortedPeriods();
  const [classe, setClasse] = useState(params.get('classe') ?? defaultClassId());
  const [scope, setScope] = useState<string>(params.get('scope') ?? 'annuel');
  const [model, setModel] = useState<BulletinModel>(params.get('scope') && params.get('scope') !== 'annuel' ? 'tripliable' : 'annuel');
  const [theme, setTheme] = useState('bleu');
  const [duplex, setDuplex] = useState(true);
  const students = classStudents(classe);
  const startIdx = Math.max(0, students.findIndex((s) => s.id === params.get('eleve')));
  const [idx, setIdx] = useState(startIdx);
  const current = students[Math.min(idx, students.length - 1)];
  const t = TRI_THEMES.find((x) => x.key === theme)!;
  const c = classes.find((x) => x.id === classe);
  const pre = isPreschool(c);
  // Le préscolaire n'a qu'un modèle (compétences, sans notes) ; les autres classes ne l'utilisent pas.
  const models = BULLETIN_MODELS.filter((m) => !!m.prescolaire === pre && (scope === 'annuel' || !m.annualOnly));
  const activeModel = models.some((m) => m.key === model) ? model : models[0].key;
  const data = useMemo(() => (current ? buildBulletin(current.id, scope) : null), [current, scope]); // eslint-disable-line
  const twoSided = activeModel === 'livret' || activeModel === 'tripliable' || activeModel === 'prescolaire';
  const sides = twoSided && !duplex ? 'recto' : 'both';

  const printAll = (only?: string) => {
    const list = only ? students.filter((s) => s.id === only) : students;
    const all = list.map((s) => buildBulletin(s.id, scope)).filter(Boolean);
    audit('Génération bulletins', `${all.length} × ${activeModel} · ${c?.code}`);
    printDocument(<>{all.map((d) => <BulletinPages key={d!.student.id} d={d!} model={activeModel} theme={t} sides={sides} />)}</>, 'A4 landscape', only ? `Bulletin ${fullName(list[0])}` : `Bulletins ${c?.code}`);
  };
  const pages = activeModel === 'annuel' || activeModel === 'annuel100' ? ['both'] : sides === 'both' ? ['recto', 'verso'] : ['recto'];

  return (
    <>
      <PageHead
        back={<button className="back-link" style={{ border: 0, background: 'none', padding: 0 }} onClick={() => nav('/documents')}><ArrowLeft size={16} />Documents</button>}
        title="Bulletins"
        sub="Choisissez la classe, la période et le modèle. Tout le reste est calculé automatiquement."
      />
      <div className="card card-pad mb-16 stack" style={{ gap: 14 }}>
        <div className="row wrap" style={{ gap: 10 }}>
          <select className="select" style={{ width: 'auto', minWidth: 210, flex: '1 1 210px' }} value={classe} onChange={(e) => { setClasse(e.target.value); setIdx(0); }} aria-label="Classe">
            {classes.map((x) => <option key={x.id} value={x.id}>{x.nom}</option>)}
          </select>
          <select className="select" style={{ width: 'auto', minWidth: 170, flex: '1 1 170px' }} value={scope} onChange={(e) => setScope(e.target.value)} aria-label="Période">
            <option value="annuel">Bulletin annuel</option>
            {periods.map((p) => <option key={p.id} value={p.id}>{p.libelle}</option>)}
          </select>
          <button className="btn btn-primary btn-lg" style={{ flex: '1 1 220px' }} onClick={() => printAll()}><Printer />Imprimer la classe ({students.length})</button>
        </div>
        <div className="row wrap" style={{ gap: 8 }}>
          {models.map((m) => (
            <button key={m.key} className={`chip ${activeModel === m.key ? 'active' : ''}`} onClick={() => setModel(m.key)}>{m.nom.replace(' (6 thèmes)', '')}</button>
          ))}
          {activeModel === 'tripliable' && (
            <span className="row" style={{ gap: 6, marginLeft: 4 }}>
              {TRI_THEMES.map((x) => (
                <button key={x.key} title={x.nom} aria-label={x.nom} onClick={() => setTheme(x.key)}
                  style={{ width: 26, height: 26, borderRadius: '50%', background: SWATCH[x.key], border: theme === x.key ? '3px solid var(--card)' : '0', boxShadow: theme === x.key ? `0 0 0 2px ${SWATCH[x.key]}` : 'none' }} />
              ))}
            </span>
          )}
          {twoSided && <label className="check small" style={{ marginLeft: 'auto' }}><input type="checkbox" checked={duplex} onChange={(e) => setDuplex(e.target.checked)} />Recto-verso</label>}
        </div>
        <div className="row small" style={{ gap: 8, color: 'var(--muted)' }}>
          <Sparkles size={15} color="var(--primary)" style={{ flex: 'none' }} />
          <span>{pre ? 'Niveaux de compétence, mot de la maîtresse et décision sont remplis automatiquement.' : 'Moyennes, rangs, appréciations, conduite, observations et décision sont remplis automatiquement.'} <a style={{ cursor: 'pointer' }} onClick={() => nav('/notes?tab=conseil')}>Modifier un élève</a></span>
        </div>
      </div>

      <div className="card card-pad">
        <div className="row mb-12 wrap" style={{ gap: 8 }}>
          <button className="btn btn-sm btn-icon" disabled={idx <= 0} onClick={() => setIdx(idx - 1)} aria-label="Élève précédent"><ChevronLeft size={16} /></button>
          <select className="select" style={{ width: 'auto', flex: '1 1 200px', height: 36 }} value={current?.id ?? ''} onChange={(e) => setIdx(students.findIndex((s) => s.id === e.target.value))} aria-label="Élève">
            {students.map((s, i) => <option key={s.id} value={s.id}>{i + 1}. {fullName(s)}</option>)}
          </select>
          <button className="btn btn-sm btn-icon" disabled={idx >= students.length - 1} onClick={() => setIdx(idx + 1)} aria-label="Élève suivant"><ChevronRight size={16} /></button>
          {current && <button className="btn btn-sm" onClick={() => printAll(current.id)}><User size={14} />Imprimer cet élève</button>}
        </div>
        <div className="preview-stage">
          {!data ? <div className="muted center" style={{ alignSelf: 'center' }}>Aucun élève dans cette classe.</div> : (
            <div className="preview-pages" style={{ width: '100%' }}>
              {pages.map((side) => (
                <Scaled key={side} width={A4L.w} height={A4L.h}>
                  <BulletinPages d={data} model={activeModel} theme={t} sides={side as 'both' | 'recto' | 'verso'} />
                </Scaled>
              ))}
            </div>
          )}
        </div>
        <p className="tiny muted mt-12">À l’impression : A4 paysage, marges « Aucune ». Pour un PDF, choisissez « Enregistrer au format PDF ». Logo, signature et cachet : Paramètres → École.</p>
      </div>
    </>
  );
}
