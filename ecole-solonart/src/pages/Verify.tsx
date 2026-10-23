// Vérification d'un badge : le QR ouvre cette page, qui dit si la personne fait bien partie de l'école.
// Accessible sans connexion, mais elle ne montre que le strict nécessaire (photo, nom, classe ou fonction, statut).
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, XCircle, AlertTriangle, ScanLine, ArrowLeft, Search } from 'lucide-react';
import { db, useCollection, useDoc } from '../data/store';
import { Avatar } from '../components/ui';
import { DocLogo } from '../docs/common';
import { useSession } from '../lib/session';

type Found =
  | { type: 'eleve'; nom: string; photo?: string; detail: string; actif: boolean; statut: string }
  | { type: 'personnel'; nom: string; photo?: string; detail: string; actif: boolean; statut: string };

function lookup(code: string): Found | null {
  const m = code.trim().toUpperCase();
  if (!m) return null;
  const s = db.list('students').find((x) => x.matricule.toUpperCase() === m);
  if (s) return { type: 'eleve', nom: `${s.prenom} ${s.nom}`, photo: s.photo, detail: `Élève · ${db.get('classes', s.classeId)?.nom ?? ''}`, actif: s.statut === 'Actif', statut: s.statut };
  const st = db.list('staff').find((x) => x.matricule.toUpperCase() === m);
  if (st) return { type: 'personnel', nom: `${st.prenom} ${st.nom}`, photo: st.photo, detail: st.poste, actif: st.statut === 'Actif', statut: st.statut };
  return null;
}

/** Extrait le matricule d'un QR (lien de vérification) ou d'une saisie. */
function codeFrom(raw: string) {
  const i = raw.indexOf('#/verifier/');
  if (i >= 0) return decodeURIComponent(raw.slice(i + 11).split(/[?#/]/)[0]);
  const old = raw.match(/[?&]m=([^&]+)/); // anciens badges
  return old ? decodeURIComponent(old[1]) : raw.trim();
}

type Detector = { detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> };

export default function Verify() {
  const { code } = useParams();
  const nav = useNavigate();
  const session = useSession();
  const school = useDoc('school', 'main');
  const year = useDoc('years', school?.anneeCourante)?.libelle;
  useCollection('students'); useCollection('staff');
  const [typed, setTyped] = useState('');
  const [scan, setScan] = useState(false);
  const [err, setErr] = useState('');
  const video = useRef<HTMLVideoElement>(null);
  const canScan = typeof window !== 'undefined' && 'BarcodeDetector' in window;

  useEffect(() => {
    if (!scan) return;
    let stop = false;
    let stream: MediaStream | undefined;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (!video.current) return;
        video.current.srcObject = stream;
        await video.current.play();
        const Ctor = (window as unknown as { BarcodeDetector: new (o: { formats: string[] }) => Detector }).BarcodeDetector;
        const det = new Ctor({ formats: ['qr_code'] });
        while (!stop) {
          const r = await det.detect(video.current).catch(() => []);
          if (r[0]) { setScan(false); nav(`/verifier/${encodeURIComponent(codeFrom(r[0].rawValue))}`); break; }
          await new Promise((res) => setTimeout(res, 250));
        }
      } catch { setErr('Caméra inaccessible. Autorisez la caméra, ou tapez le matricule.'); setScan(false); }
    })();
    return () => { stop = true; stream?.getTracks().forEach((t) => t.stop()); };
  }, [scan, nav]);

  const found = code ? lookup(code) : null;
  const back = () => nav(session ? '/' : '/');
  return (
    <div className="verify">
      <div className="verify-head">
        {school && <DocLogo school={school} size={34} />}
        <div className="grow"><b>{school?.nom}</b><div className="tiny muted">Vérification de badge{year ? ` · ${year}` : ''}</div></div>
        {session && <button className="btn btn-sm" onClick={back}><ArrowLeft size={15} />Retour</button>}
      </div>

      {code && (
        found ? (
          <div className={`verify-card ${found.actif ? 'ok' : 'warn'}`}>
            <div className="verify-status">{found.actif ? <CheckCircle2 /> : <AlertTriangle />}{found.actif ? (found.type === 'eleve' ? 'Élève inscrit à l’école' : 'Membre du personnel') : `Ne fait plus partie de l’école (${found.statut.toLowerCase()})`}</div>
            <Avatar src={found.photo} name={found.nom} size={120} />
            <b className="verify-name">{found.nom}</b>
            <div className="small">{found.detail}</div>
            <div className="tiny muted mt-8">Matricule {code.toUpperCase()}</div>
            <p className="tiny muted mt-12">Comparez la photo avec la personne qui présente le badge.</p>
          </div>
        ) : (
          <div className="verify-card bad">
            <div className="verify-status"><XCircle />Badge inconnu</div>
            <p className="small">Le matricule <b>{code}</b> n’existe pas dans la base de l’école.</p>
            <p className="tiny muted">Badge faux, ou appareil qui n’a pas encore les données de l’école.</p>
          </div>
        )
      )}

      <div className="card card-pad stack mt-16" style={{ gap: 12 }}>
        {scan ? (
          <>
            <video ref={video} className="verify-video" playsInline muted />
            <button className="btn" onClick={() => setScan(false)}>Arrêter</button>
          </>
        ) : canScan ? (
          <button className="btn btn-primary btn-lg btn-block" onClick={() => { setErr(''); setScan(true); }}><ScanLine />{code ? 'Scanner un autre badge' : 'Scanner un badge'}</button>
        ) : (
          <p className="tiny muted">Pour scanner, ouvrez l’appareil photo du téléphone et visez le QR du badge : le lien ouvre cette page.</p>
        )}
        {err && <p className="tiny" style={{ color: 'var(--red)' }}>{err}</p>}
        <form className="row" style={{ gap: 8 }} onSubmit={(e) => { e.preventDefault(); if (typed.trim()) nav(`/verifier/${encodeURIComponent(typed.trim())}`); }}>
          <input className="input grow" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Ou tapez le matricule" aria-label="Matricule" />
          <button className="btn" type="submit"><Search size={16} />Vérifier</button>
        </form>
      </div>
    </div>
  );
}
