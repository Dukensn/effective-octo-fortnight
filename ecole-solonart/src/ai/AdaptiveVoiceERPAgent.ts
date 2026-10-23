// AdaptiveVoiceERPAgent : service réutilisable (voix ou texte → commande ERP en JSON), 100 % local.
//   const agent = AdaptiveVoiceERPAgent.shared();
//   await agent.load();                         // mode détecté (mobile ~150 Mo / ordinateur ~700 Mo)
//   await agent.setMode('desktop');             // bascule manuelle : libère l'ancien profil AVANT de charger le nouveau
//   const cmd = await agent.processVoiceCommand(blob);  // { action, entite, variables, texte, source }
import { db } from '../data/store';
import { detectDeviceMode, PROFILES, saveMode, savedMode, type AgentMode } from './config';
import { decodeTo16kMono, MicRecorder } from './audio';
import { buildMessages, resolveCommand, type ErpCommand } from './erpCommand';
import type { ProgressInfo } from '@huggingface/transformers';
import type { Slot, WorkerEvent, WorkerRequest, WorkerState } from './agent.worker';
import { cacheUsage, clearModelCache, requestPersistentStorage } from './idbCache';

export type SlotProgress = { status: 'idle' | 'loading' | 'ready' | 'error'; percent: number; loaded: number; total: number; file?: string };
export type AgentSnapshot = {
  mode: AgentMode;
  detected: AgentMode;
  forced: boolean;
  worker: WorkerState;
  progress: Record<Slot, SlotProgress>;
  busy: null | 'loading' | 'unloading' | 'transcribing' | 'thinking';
  error: string | null;
};
type Listener = (s: AgentSnapshot) => void;
type Pending = { resolve: (v: unknown) => void; reject: (e: Error) => void };
type RequestBody = WorkerRequest extends infer R ? (R extends WorkerRequest ? Omit<R, 'id'> : never) : never;

const emptyProgress = (): SlotProgress => ({ status: 'idle', percent: 0, loaded: 0, total: 0 });

export class AdaptiveVoiceERPAgent {
  private static instance: AdaptiveVoiceERPAgent | null = null;
  /** Une seule instance pour toute l'application : les modèles restent chargés d'un écran à l'autre. */
  static shared() { return (this.instance ??= new AdaptiveVoiceERPAgent()); }
  static detectDeviceMode = detectDeviceMode;

  private worker: Worker | null = null;
  private seq = 0;
  private pending = new Map<number, Pending>();
  private files = new Map<string, { loaded: number; total: number }>();
  private listeners = new Set<Listener>();
  readonly mic = new MicRecorder();
  private snap: AgentSnapshot;

  constructor() {
    const detected = detectDeviceMode();
    const forced = savedMode();
    this.snap = { mode: forced ?? detected, detected, forced: !!forced, worker: { mode: null, device: null, stt: null, llm: null }, progress: { stt: emptyProgress(), llm: emptyProgress() }, busy: null, error: null };
  }

  // ---------- état ----------
  get snapshot() { return this.snap; }
  subscribe(fn: Listener) { this.listeners.add(fn); fn(this.snap); return () => { this.listeners.delete(fn); }; }
  private set(patch: Partial<AgentSnapshot>) { this.snap = { ...this.snap, ...patch }; this.listeners.forEach((f) => f(this.snap)); }
  get ready() { return !!(this.snap.worker.stt && this.snap.worker.llm && this.snap.worker.mode === this.snap.mode); }

  // ---------- worker ----------
  private ensureWorker() {
    if (this.worker) return this.worker;
    this.worker = new Worker(new URL('./agent.worker.ts', import.meta.url), { type: 'module' });
    this.worker.onmessage = (ev: MessageEvent<WorkerEvent>) => this.onEvent(ev.data);
    this.worker.onerror = (e) => { this.set({ error: e.message || 'Erreur du moteur IA', busy: null }); this.pending.forEach((p) => p.reject(new Error(e.message))); this.pending.clear(); };
    return this.worker;
  }

  private onEvent(e: WorkerEvent) {
    if (e.type === 'state') { this.set({ worker: e.state }); return; }
    if (e.type === 'progress') { this.onProgress(e.slot, e.info); return; }
    const p = this.pending.get(e.id);
    if (!p) return;
    this.pending.delete(e.id);
    if (e.type === 'result') p.resolve(e.data); else p.reject(new Error(e.message));
  }

  /** Progression distincte par modèle (voix / langage) : somme des fichiers en cours. */
  private onProgress(slot: Slot, info: ProgressInfo) {
    const cur = { ...this.snap.progress[slot] };
    if (info.status === 'progress') {
      this.files.set(`${slot}|${info.name}|${info.file}`, { loaded: info.loaded, total: info.total });
      cur.file = info.file;
    }
    if (info.status === 'done') {
      const k = `${slot}|${info.name}|${info.file}`;
      const f = this.files.get(k);
      if (f) this.files.set(k, { loaded: f.total || f.loaded, total: f.total || f.loaded });
    }
    let loaded = 0, total = 0;
    this.files.forEach((v, k) => { if (k.startsWith(`${slot}|`)) { loaded += v.loaded; total += v.total; } });
    cur.loaded = loaded; cur.total = total;
    cur.percent = info.status === 'ready' ? 100 : total ? Math.min(99, Math.round((loaded / total) * 100)) : cur.percent;
    cur.status = info.status === 'ready' ? 'ready' : 'loading';
    this.set({ progress: { ...this.snap.progress, [slot]: cur } });
  }

  private request<T>(msg: RequestBody, transfer: Transferable[] = []): Promise<T> {
    const w = this.ensureWorker();
    const id = ++this.seq;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve: resolve as (v: unknown) => void, reject });
      w.postMessage({ ...msg, id } as WorkerRequest, transfer);
    });
  }

  // ---------- modèles ----------
  /** Charge la paire Whisper + LLM du mode courant (téléchargement la 1re fois, puis depuis IndexedDB). */
  async load(mode: AgentMode = this.snap.mode) {
    if (this.ready && this.snap.worker.mode === mode) return;
    void requestPersistentStorage();
    this.files.clear();
    this.set({ mode, busy: 'loading', error: null, progress: { stt: { ...emptyProgress(), status: 'loading' }, llm: { ...emptyProgress(), status: 'loading' } } });
    try {
      await this.request({ type: 'load', mode });
      this.set({ busy: null, progress: { stt: { ...this.snap.progress.stt, status: 'ready', percent: 100 }, llm: { ...this.snap.progress.llm, status: 'ready', percent: 100 } } });
    } catch (e) {
      this.set({ busy: null, error: (e as Error).message, progress: { stt: { ...this.snap.progress.stt, status: this.snap.worker.stt ? 'ready' : 'error' }, llm: { ...this.snap.progress.llm, status: 'error' } } });
      throw e;
    }
  }

  /**
   * Bascule manuelle Mobile ⇄ Ordinateur (ou « auto » pour revenir à la détection).
   * Les pipelines de l'ancien profil sont libérés (dispose ONNX) AVANT que les nouveaux soient alloués.
   */
  async setMode(mode: AgentMode | 'auto', { reload = true } = {}) {
    const target = mode === 'auto' ? this.snap.detected : mode;
    saveMode(mode === 'auto' ? null : mode);
    const wasLoaded = !!this.snap.worker.mode;
    this.set({ mode: target, forced: mode !== 'auto' });
    if (wasLoaded && this.snap.worker.mode !== target) {
      await this.unload(); // libération stricte d'abord
      if (reload) await this.load(target);
    }
  }

  /** Libère toute la mémoire des modèles (les fichiers restent dans IndexedDB). */
  async unload() {
    if (!this.worker) return;
    this.set({ busy: 'unloading' });
    try { await this.request({ type: 'unload' }); } finally {
      this.set({ busy: null, progress: { stt: emptyProgress(), llm: emptyProgress() } });
    }
  }

  /** Arrête complètement le moteur (le navigateur récupère toute la mémoire du worker). */
  terminate() {
    this.worker?.terminate();
    this.worker = null;
    this.pending.forEach((p) => p.reject(new Error('Moteur arrêté')));
    this.pending.clear();
    this.set({ worker: { mode: null, device: null, stt: null, llm: null }, progress: { stt: emptyProgress(), llm: emptyProgress() }, busy: null });
  }

  // ---------- traitement ----------
  private context() {
    const school = db.get('school', 'main');
    const year = db.get('years', school?.anneeCourante);
    return { classCodes: db.list('classes').map((c) => c.code), schoolStartYear: Number((year?.debut ?? '2024').slice(0, 4)) };
  }

  /** Voix → texte (Whisper du profil chargé). */
  async transcribe(audioBlob: Blob): Promise<string> {
    if (!this.ready) await this.load();
    const audio = await decodeTo16kMono(audioBlob);
    if (audio.length < 16000 * 0.3) throw new Error('Enregistrement trop court');
    this.set({ busy: 'transcribing' });
    try { return await this.request<string>({ type: 'transcribe', audio, language: 'french' }, [audio.buffer]); } finally { this.set({ busy: null }); }
  }

  /** Texte → commande ERP JSON (LLM du profil chargé, puis validation et secours par règles). */
  async processText(text: string): Promise<ErpCommand & { brut: string }> {
    const clean = text.trim();
    if (!clean) throw new Error('Demande vide');
    let raw = '';
    if (this.ready) {
      this.set({ busy: 'thinking' });
      try { raw = await this.request<string>({ type: 'generate', messages: buildMessages(clean), maxNewTokens: 160 }); } catch { raw = ''; } finally { this.set({ busy: null }); }
    }
    return { ...resolveCommand(raw, clean, this.context()), brut: raw };
  }

  /** Fonction principale : audio → transcription Whisper → LLM → objet JSON pour l'ERP. */
  async processVoiceCommand(audioBlob: Blob): Promise<ErpCommand & { brut: string }> {
    const text = await this.transcribe(audioBlob);
    return this.processText(text);
  }

  // ---------- micro ----------
  startRecording() { return this.mic.start(); }
  stopRecording() { return this.mic.stop(); }
  cancelRecording() { this.mic.cancel(); }

  // ---------- stockage ----------
  static cacheUsage = cacheUsage;
  async clearDownloadedModels() { await this.unload().catch(() => undefined); await clearModelCache(); }
  static profiles = PROFILES;
}
