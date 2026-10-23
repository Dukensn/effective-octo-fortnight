// Micro → audio mono 16 kHz (Float32Array) : le format attendu par Whisper.
// Compatible navigateurs et WebView (Android, iOS ≥ 14.5, Capacitor). Si MediaRecorder manque,
// on enregistre directement le PCM via Web Audio et on fabrique un WAV.

export const WHISPER_RATE = 16000;

type AudioCtxCtor = typeof AudioContext;
const AudioCtx = (): AudioCtxCtor => (window.AudioContext ?? (window as unknown as { webkitAudioContext: AudioCtxCtor }).webkitAudioContext);

function pickMime(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  for (const t of ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']) if (MediaRecorder.isTypeSupported?.(t)) return t;
  return '';
}

/** Encode un PCM mono en WAV 16 bits (secours sans MediaRecorder). */
function encodeWav(samples: Float32Array, rate: number): Blob {
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(buf);
  const w = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + samples.length * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, rate, true);
  v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) { const s = Math.max(-1, Math.min(1, samples[i])); v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true); }
  return new Blob([buf], { type: 'audio/wav' });
}

export class MicRecorder {
  private stream: MediaStream | null = null;
  private rec: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private ctx: AudioContext | null = null;
  private node: ScriptProcessorNode | null = null;
  private pcm: Float32Array[] = [];
  /** Niveau sonore 0..1 pour animer le bouton. */
  level = 0;
  private analyser: AnalyserNode | null = null;

  get recording() { return !!this.stream; }

  async start() {
    if (this.stream) return;
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Micro non disponible sur cet appareil (HTTPS requis).');
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    this.ctx = new (AudioCtx())();
    if (this.ctx.state === 'suspended') await this.ctx.resume().catch(() => undefined);
    const src = this.ctx.createMediaStreamSource(this.stream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    src.connect(this.analyser);
    const mime = pickMime();
    if (typeof MediaRecorder !== 'undefined') {
      this.chunks = [];
      this.rec = new MediaRecorder(this.stream, mime ? { mimeType: mime } : undefined);
      this.rec.ondataavailable = (e) => e.data.size && this.chunks.push(e.data);
      this.rec.start(250);
    } else {
      // Secours : capture PCM brute
      this.pcm = [];
      this.node = this.ctx.createScriptProcessor(4096, 1, 1);
      this.node.onaudioprocess = (e) => this.pcm.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      src.connect(this.node);
      this.node.connect(this.ctx.destination);
    }
  }

  /** Niveau instantané (pour l'animation du micro). */
  readLevel() {
    if (!this.analyser) return 0;
    const data = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(data);
    let peak = 0;
    for (const x of data) peak = Math.max(peak, Math.abs(x - 128));
    this.level = Math.min(1, peak / 64);
    return this.level;
  }

  async stop(): Promise<Blob> {
    let blob: Blob;
    if (this.rec) {
      const rec = this.rec;
      blob = await new Promise<Blob>((resolve) => {
        rec.onstop = () => resolve(new Blob(this.chunks, { type: rec.mimeType || 'audio/webm' }));
        rec.stop();
      });
    } else {
      const len = this.pcm.reduce((t, a) => t + a.length, 0);
      const all = new Float32Array(len);
      let o = 0;
      for (const a of this.pcm) { all.set(a, o); o += a.length; }
      blob = encodeWav(all, this.ctx?.sampleRate ?? 44100);
    }
    this.release();
    return blob;
  }

  cancel() { try { this.rec?.stop(); } catch { /* ignore */ } this.release(); }

  private release() {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.node?.disconnect();
    void this.ctx?.close().catch(() => undefined);
    this.stream = null; this.rec = null; this.node = null; this.ctx = null; this.analyser = null; this.level = 0;
  }
}

/** Décode un enregistrement (webm, mp4, wav…) en mono 16 kHz Float32Array. */
export async function decodeTo16kMono(blob: Blob): Promise<Float32Array> {
  const data = await blob.arrayBuffer();
  let decoded: AudioBuffer;
  try {
    // La plupart des navigateurs rééchantillonnent directement à la fréquence du contexte.
    const ctx = new (AudioCtx())({ sampleRate: WHISPER_RATE });
    decoded = await ctx.decodeAudioData(data.slice(0));
    void ctx.close();
  } catch {
    const ctx = new (AudioCtx())();
    decoded = await ctx.decodeAudioData(data.slice(0));
    void ctx.close();
  }
  if (decoded.sampleRate !== WHISPER_RATE) {
    // Rééchantillonnage hors ligne (anciens Safari qui refusent sampleRate dans le constructeur)
    const off = new OfflineAudioContext(1, Math.ceil(decoded.duration * WHISPER_RATE), WHISPER_RATE);
    const src = off.createBufferSource();
    src.buffer = decoded;
    src.connect(off.destination);
    src.start();
    decoded = await off.startRendering();
  }
  if (decoded.numberOfChannels === 1) return decoded.getChannelData(0).slice();
  const out = new Float32Array(decoded.length);
  for (let c = 0; c < decoded.numberOfChannels; c++) {
    const ch = decoded.getChannelData(c);
    for (let i = 0; i < ch.length; i++) out[i] += ch[i] / decoded.numberOfChannels;
  }
  return out;
}
