import { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, RotateCcw, Check, SwitchCamera, Trash2 } from 'lucide-react';
import { Modal, toast } from './ui';

const SIZE = 480; // photo carrée stockée (≈ 40 Ko en JPEG)

/** Recadre une image au format carré (portrait d'identité) et renvoie un JPEG. */
function squareJpeg(src: CanvasImageSource, w: number, h: number, offsetY = 0.35) {
  const s = Math.min(w, h);
  const sx = (w - s) / 2;
  const sy = Math.max(0, Math.min(h - s, (h - s) * offsetY));
  const c = document.createElement('canvas');
  c.width = SIZE;
  c.height = SIZE;
  c.getContext('2d')!.drawImage(src, sx, sy, s, s, 0, 0, SIZE, SIZE);
  return c.toDataURL('image/jpeg', 0.85);
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Prise de photo : caméra en direct (téléphone, tablette, webcam) ou fichier.
 * Sur téléphone, « Prendre une photo » ouvre l'appareil photo arrière.
 */
export function PhotoCapture({ open, onClose, onSave, title = 'Photo', current, subtitle, onRemove }: {
  open: boolean; onClose: () => void; onSave: (dataUrl: string) => void; title?: string; current?: string; subtitle?: string; onRemove?: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facing, setFacing] = useState<'environment' | 'user'>('environment');
  const [shot, setShot] = useState<string | null>(null);
  const [live, setLive] = useState(false);

  const stop = () => { stream?.getTracks().forEach((t) => t.stop()); setStream(null); setLive(false); };
  useEffect(() => { if (!open) { stop(); setShot(null); } }, [open]); // eslint-disable-line
  useEffect(() => () => stream?.getTracks().forEach((t) => t.stop()), [stream]);

  const startLive = async (face = facing) => {
    if (!navigator.mediaDevices?.getUserMedia) { cameraInput.current?.click(); return; }
    try {
      stream?.getTracks().forEach((t) => t.stop());
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: face, width: { ideal: 1280 }, height: { ideal: 1280 } }, audio: false });
      setStream(s); setLive(true); setShot(null);
      setTimeout(() => { if (video.current) { video.current.srcObject = s; video.current.play().catch(() => {}); } }, 30);
    } catch {
      // Permission refusée ou pas de caméra : on bascule sur l'appareil photo natif / le choix de fichier.
      cameraInput.current?.click();
    }
  };
  const snap = () => {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    setShot(squareJpeg(v, v.videoWidth, v.videoHeight, 0.4));
    stop();
  };
  const fromFile = async (f?: File) => {
    if (!f) return;
    try { const img = await loadImage(f); setShot(squareJpeg(img, img.naturalWidth, img.naturalHeight)); stop(); }
    catch { toast('Image illisible', true); }
  };

  return (
    <Modal open={open} onClose={() => { stop(); onClose(); }} title={title}
      footer={shot ? (
        <>
          <button className="btn" onClick={() => { setShot(null); }}><RotateCcw />Reprendre</button>
          <button className="btn btn-primary" onClick={() => { onSave(shot); setShot(null); }}><Check />Enregistrer</button>
        </>
      ) : live ? (
        <>
          <button className="btn" onClick={() => { const f = facing === 'user' ? 'environment' : 'user'; setFacing(f); startLive(f); }} aria-label="Changer de caméra"><SwitchCamera /></button>
          <button className="btn btn-primary btn-lg" onClick={snap}><Camera />Prendre la photo</button>
        </>
      ) : undefined}>
      {subtitle && <p className="small muted mb-12">{subtitle}</p>}
      <div className="photo-stage">
        {live ? <video ref={video} playsInline muted /> : shot ? <img src={shot} alt="" /> : current ? <img src={current} alt="" /> : <div className="photo-empty"><Camera size={40} /></div>}
        {live && <div className="photo-guide" />}
      </div>
      {!live && !shot && (
        <div className="grid g-2 mt-16" style={{ gap: 10 }}>
          <button className="btn btn-primary btn-lg" onClick={() => startLive()}><Camera />Prendre une photo</button>
          <button className="btn btn-lg" onClick={() => fileInput.current?.click()}><ImagePlus />Choisir une image</button>
          {current && onRemove && <button className="btn btn-ghost span-2" style={{ color: 'var(--red)' }} onClick={() => { onRemove(); onClose(); }}><Trash2 />Retirer la photo</button>}
        </div>
      )}
      <input ref={fileInput} type="file" accept="image/*" hidden onChange={(e) => { fromFile(e.target.files?.[0]); e.target.value = ''; }} />
      <input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { fromFile(e.target.files?.[0]); e.target.value = ''; }} />
    </Modal>
  );
}
