/// <reference lib="webworker" />
// Worker IA : détient les pipelines Whisper (voix → texte) et LLM (texte → JSON).
// Tourne hors du fil principal pour ne pas figer l'interface.
// Règle stricte : un seul profil (mobile OU ordinateur) en mémoire. Avant d'en charger un autre,
// on libère (dispose) les sessions ONNX de l'ancien.
import { env, pipeline, type AutomaticSpeechRecognitionPipeline, type TextGenerationPipeline, type ProgressInfo } from '@huggingface/transformers';
import { PROFILES, type AgentMode, type ModelSlot } from './config';
import { idbModelCache } from './idbCache';

// --- Hors ligne : modèles stockés dans IndexedDB, moteur WebAssembly servi par l'application (pas de CDN).
env.allowLocalModels = false;
env.useBrowserCache = false;
env.useCustomCache = true;
env.customCache = idbModelCache;
const onnx = env.backends.onnx as { wasm?: { wasmPaths?: unknown; numThreads?: number } };
if (onnx.wasm) {
  onnx.wasm.wasmPaths = {
    wasm: new URL('../../node_modules/@huggingface/transformers/dist/ort-wasm-simd-threaded.jsep.wasm', import.meta.url).href,
    mjs: new URL('../../node_modules/@huggingface/transformers/dist/ort-wasm-simd-threaded.jsep.mjs', import.meta.url).href,
  };
  if (!self.crossOriginIsolated) onnx.wasm.numThreads = 1; // le multithread exige l'isolation cross-origin
}

export type Slot = 'stt' | 'llm';
export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };
export type WorkerRequest =
  | { id: number; type: 'load'; mode: AgentMode }
  | { id: number; type: 'unload' }
  | { id: number; type: 'transcribe'; audio: Float32Array; language?: string }
  | { id: number; type: 'generate'; messages: ChatMessage[]; maxNewTokens?: number };
export type LoadedInfo = { model: string; dtype: string; device: string };
export type WorkerState = { mode: AgentMode | null; device: string | null; stt: LoadedInfo | null; llm: LoadedInfo | null };
export type WorkerEvent =
  | { type: 'progress'; slot: Slot; info: ProgressInfo }
  | { type: 'state'; state: WorkerState }
  | { id: number; type: 'result'; data: unknown }
  | { id: number; type: 'error'; message: string };

let stt: AutomaticSpeechRecognitionPipeline | null = null;
let llm: TextGenerationPipeline | null = null;
const state: WorkerState = { mode: null, device: null, stt: null, llm: null };
const post = (e: WorkerEvent) => (self as unknown as Worker).postMessage(e);
const pushState = () => post({ type: 'state', state: { ...state } });

async function pickDevice(): Promise<'webgpu' | 'wasm'> {
  try {
    const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<unknown> } }).gpu;
    if (gpu && (await gpu.requestAdapter())) return 'webgpu';
  } catch { /* pas de WebGPU */ }
  return 'wasm';
}

/** Libère les sessions ONNX (mémoire) des deux pipelines. Toujours appelé AVANT un nouveau chargement. */
async function unloadAll() {
  const old = [stt, llm];
  stt = null;
  llm = null;
  state.stt = null;
  state.llm = null;
  state.mode = null;
  for (const p of old) {
    if (p) { try { await p.dispose(); } catch { /* déjà libéré */ } }
  }
  pushState();
}

/** Essaie chaque dépôt puis chaque précision (4 bits d'abord) jusqu'à ce qu'un chargement réussisse. */
async function loadSlot<T>(task: 'automatic-speech-recognition' | 'text-generation', slot: ModelSlot, which: Slot, device: 'webgpu' | 'wasm'): Promise<{ pipe: T; info: LoadedInfo }> {
  const devices: ('webgpu' | 'wasm')[] = device === 'webgpu' ? ['webgpu', 'wasm'] : ['wasm'];
  let lastErr: unknown = null;
  for (const dev of devices) {
    for (const id of slot.ids) {
      for (const dtype of slot.dtypes[dev]) {
        try {
          const pipe = await (pipeline as unknown as (t: string, m: string, o: object) => Promise<T>)(task, id, {
            dtype, device: dev,
            progress_callback: (info: ProgressInfo) => post({ type: 'progress', slot: which, info }),
          });
          return { pipe, info: { model: id, dtype, device: dev } };
        } catch (e) {
          lastErr = e;
        }
      }
    }
  }
  throw new Error(`Impossible de charger le modèle ${which === 'stt' ? 'de voix' : 'de langage'} : ${(lastErr as Error)?.message ?? lastErr}`);
}

async function load(mode: AgentMode) {
  if (state.mode === mode && stt && llm) return state;
  await unloadAll(); // jamais deux profils en mémoire en même temps
  const profile = PROFILES[mode];
  const device = await pickDevice();
  state.device = device;
  const a = await loadSlot<AutomaticSpeechRecognitionPipeline>('automatic-speech-recognition', profile.stt, 'stt', device);
  stt = a.pipe;
  state.stt = a.info;
  pushState();
  const b = await loadSlot<TextGenerationPipeline>('text-generation', profile.llm, 'llm', device);
  llm = b.pipe;
  state.llm = b.info;
  state.mode = mode;
  pushState();
  return { ...state };
}

async function transcribe(audio: Float32Array, language = 'french') {
  if (!stt) throw new Error('Modèle de voix non chargé');
  const out = (await stt(audio, { language, task: 'transcribe', chunk_length_s: 30, stride_length_s: 5 })) as { text: string } | { text: string }[];
  return (Array.isArray(out) ? out.map((o) => o.text).join(' ') : out.text).trim();
}

async function generate(messages: ChatMessage[], maxNewTokens = 160) {
  if (!llm) throw new Error('Modèle de langage non chargé');
  const out = (await llm(messages as never, { max_new_tokens: maxNewTokens, do_sample: false })) as { generated_text: string | ChatMessage[] }[];
  const g = out[0]?.generated_text;
  return typeof g === 'string' ? g : g?.[g.length - 1]?.content ?? '';
}

// File d'attente : une opération à la fois (chargement, libération, inférence).
let queue: Promise<unknown> = Promise.resolve();
self.addEventListener('message', (ev: MessageEvent<WorkerRequest>) => {
  const req = ev.data;
  queue = queue.then(async () => {
    try {
      let data: unknown;
      if (req.type === 'load') data = await load(req.mode);
      else if (req.type === 'unload') data = await unloadAll();
      else if (req.type === 'transcribe') data = await transcribe(req.audio, req.language);
      else if (req.type === 'generate') data = await generate(req.messages, req.maxNewTokens);
      post({ id: req.id, type: 'result', data });
    } catch (e) {
      post({ id: req.id, type: 'error', message: (e as Error)?.message ?? String(e) });
    }
  });
});
pushState();
