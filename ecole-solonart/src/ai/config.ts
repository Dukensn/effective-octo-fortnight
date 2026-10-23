// IA locale : profils de modèles (Whisper + LLM) selon l'appareil.
// Tout tourne dans le navigateur (transformers.js v3 + ONNX Runtime), hors ligne après le premier téléchargement.

export type AgentMode = 'mobile' | 'desktop';

export interface ModelSlot {
  /** Dépôts Hugging Face essayés dans l'ordre (le premier qui existe est utilisé). */
  ids: string[];
  /** Précisions essayées dans l'ordre : 4 bits d'abord (« int4 » = q4 / q4f16), puis 8 bits si le dépôt n'a pas de version 4 bits. */
  dtypes: { wasm: string[]; webgpu: string[] };
  approxMB: number;
}

export interface ModeProfile {
  mode: AgentMode;
  label: string;
  approxMB: number;
  stt: ModelSlot;
  llm: ModelSlot;
}

export const PROFILES: Record<AgentMode, ModeProfile> = {
  mobile: {
    mode: 'mobile',
    label: 'Téléphone (~150 Mo)',
    approxMB: 150,
    stt: { ids: ['Xenova/whisper-tiny', 'onnx-community/whisper-tiny'], dtypes: { wasm: ['q4', 'q8'], webgpu: ['q4f16', 'q4', 'fp16'] }, approxMB: 40 },
    llm: { ids: ['onnx-community/SmolLM2-135M-Instruct-ONNX', 'HuggingFaceTB/SmolLM2-135M-Instruct'], dtypes: { wasm: ['q4', 'q8'], webgpu: ['q4f16', 'q4', 'fp16'] }, approxMB: 90 },
  },
  desktop: {
    mode: 'desktop',
    label: 'Ordinateur (~700 Mo)',
    approxMB: 700,
    stt: { ids: ['onnx-community/whisper-base', 'Xenova/whisper-base'], dtypes: { wasm: ['q4', 'q8'], webgpu: ['q4f16', 'q4', 'fp16'] }, approxMB: 90 },
    llm: { ids: ['onnx-community/Llama-3.2-1B-Instruct-ONNX', 'onnx-community/Llama-3.2-1B-Instruct', 'onnx-community/Qwen2.5-1.5B-Instruct'], dtypes: { wasm: ['q4', 'q8'], webgpu: ['q4f16', 'q4'] }, approxMB: 450 },
  },
};

/** Mode par défaut : « mobile » sur téléphone/tablette ou appareil peu puissant, « desktop » sinon. */
export function detectDeviceMode(): AgentMode {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent || '';
  const uaMobile = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData?.mobile;
  const touchSmall = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches && Math.min(window.screen.width, window.screen.height) < 820;
  const mobile = uaMobile ?? (/Android|iPhone|iPad|iPod|Mobile|Capacitor/i.test(ua) || !!touchSmall);
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory; // Go (Chrome seulement)
  if (mobile || (mem !== undefined && mem < 4)) return 'mobile';
  return 'desktop';
}

const MODE_KEY = 'solonart:ia-mode';
export const savedMode = (): AgentMode | null => { try { const v = localStorage.getItem(MODE_KEY); return v === 'mobile' || v === 'desktop' ? v : null; } catch { return null; } };
export const saveMode = (m: AgentMode | null) => { try { if (m) localStorage.setItem(MODE_KEY, m); else localStorage.removeItem(MODE_KEY); } catch { /* ignore */ } };
