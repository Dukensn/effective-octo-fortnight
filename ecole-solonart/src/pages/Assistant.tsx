// Assistant : chat dans l'application, texte ou voix, IA 100 % locale (aucune donnée ne quitte l'appareil).
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Send, Square, Trash2, Cpu, Download, ChevronDown, Code2 } from 'lucide-react';
import { Avatar, PageHead, toast } from '../components/ui';
import { useAdaptiveVoiceERPAgent } from '../ai/useAdaptiveVoiceERPAgent';
import { AdaptiveVoiceERPAgent } from '../ai/AdaptiveVoiceERPAgent';
import { PROFILES, type AgentMode } from '../ai/config';
import type { ErpCommand } from '../ai/erpCommand';
import { actionLabel, executeCommand, type ChatReply } from '../ai/erpActions';
import { useSession } from '../lib/session';

type Msg =
  | { id: number; who: 'me'; text: string; voice?: boolean }
  | { id: number; who: 'ai'; reply: ChatReply; cmd?: ErpCommand & { brut?: string } }
  | { id: number; who: 'status'; text: string };

type NewMsg = Msg extends infer M ? (M extends Msg ? Omit<M, 'id'> : never) : never;
const KEY = 'solonart:assistant-chat';
const load = (): Msg[] => { try { return JSON.parse(sessionStorage.getItem(KEY) ?? '[]'); } catch { return []; } };
const mb = (b: number) => `${Math.round(b / 1048576)} Mo`;
const SUGGESTIONS = ['Résultats de la S4-A', 'Qui n’a pas encore payé en 7e année ?', 'Rapport financier du mois d’avril', 'Présences de la S3-A', 'Quels cahiers de textes ne sont pas à jour ?', 'Jean Philippe Dorval a payé 15000 gourdes par MonCash'];

export default function Assistant() {
  const session = useSession()!;
  const nav = useNavigate();
  const { agent, mode, detected, forced, worker, progress, busy, error, ready } = useAdaptiveVoiceERPAgent();
  const [msgs, setMsgs] = useState<Msg[]>(load);
  const [text, setText] = useState('');
  const [recording, setRecording] = useState(false);
  const [level, setLevel] = useState(0);
  const [panel, setPanel] = useState(!ready);
  const [usage, setUsage] = useState<{ bytes: number; files: number } | null>(null);
  const [showJson, setShowJson] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const seq = useRef(Date.now());

  useEffect(() => { try { sessionStorage.setItem(KEY, JSON.stringify(msgs.slice(-40))); } catch { /* ignore */ } endRef.current?.scrollIntoView({ block: 'end' }); }, [msgs]);
  useEffect(() => { void AdaptiveVoiceERPAgent.cacheUsage().then(setUsage); }, [worker.mode]);
  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => setLevel(agent.mic.readLevel()), 80);
    return () => clearInterval(t);
  }, [recording, agent]);

  const push = (m: NewMsg) => setMsgs((x) => [...x, { ...m, id: ++seq.current } as Msg]);
  const answer = (cmd: ErpCommand & { brut?: string }) => push({ who: 'ai', reply: executeCommand(cmd, session), cmd });

  const sendText = async (t = text) => {
    const clean = t.trim();
    if (!clean || busy) return;
    setText('');
    push({ who: 'me', text: clean });
    try { answer(await agent.processText(clean)); } catch (e) { push({ who: 'status', text: (e as Error).message }); }
  };

  const toggleMic = async () => {
    if (recording) {
      setRecording(false);
      try {
        const blob = await agent.stopRecording();
        const transcript = await agent.transcribe(blob);
        if (!transcript) { push({ who: 'status', text: 'Je n’ai rien entendu. Réessayez plus près du micro.' }); return; }
        push({ who: 'me', text: transcript, voice: true });
        answer(await agent.processText(transcript));
      } catch (e) { push({ who: 'status', text: (e as Error).message }); }
      return;
    }
    if (!ready) { setPanel(true); toast('Chargez d’abord l’IA pour utiliser la voix', true); return; }
    try { await agent.startRecording(); setRecording(true); } catch (e) { toast((e as Error).message || 'Micro refusé', true); }
  };

  const loadModels = async () => {
    try { await agent.load(); setPanel(false); toast('IA prête — elle fonctionne maintenant hors ligne'); } catch (e) { toast((e as Error).message, true); }
  };
  const switchMode = async (m: AgentMode | 'auto') => {
    try { await agent.setMode(m, { reload: !!worker.mode }); } catch (e) { toast((e as Error).message, true); }
  };
  const profile = PROFILES[mode];
  const loading = busy === 'loading';

  return (
    <div className="assistant">
      <PageHead title="Assistant" sub="Posez votre question par écrit ou à la voix. L’IA tourne dans cet appareil : rien ne part sur Internet."
        actions={msgs.length > 0 && <button className="btn" onClick={() => setMsgs([])}><Trash2 />Effacer la conversation</button>} />

      <div className="card ai-panel">
        <button className="ai-head" onClick={() => setPanel(!panel)} aria-expanded={panel}>
          <span className={`ai-dot ${ready ? 'on' : loading ? 'busy' : ''}`} />
          <span className="grow">
            <b>{ready ? `IA prête · ${profile.label}` : loading ? 'Chargement de l’IA…' : 'IA non chargée · mode simple'}</b>
            <small>{ready ? `${worker.device === 'webgpu' ? 'Carte graphique (WebGPU)' : 'Processeur (WASM)'} · hors ligne` : 'Les demandes écrites marchent déjà ; la voix demande l’IA.'}</small>
          </span>
          <ChevronDown size={18} style={{ transform: panel ? 'rotate(180deg)' : undefined, transition: '.2s' }} />
        </button>
        {panel && (
          <div className="ai-body">
            <div className="seg">
              <button className={!forced ? 'active' : ''} onClick={() => switchMode('auto')} disabled={loading}>Auto</button>
              <button className={forced && mode === 'mobile' ? 'active' : ''} onClick={() => switchMode('mobile')} disabled={loading}>Téléphone</button>
              <button className={forced && mode === 'desktop' ? 'active' : ''} onClick={() => switchMode('desktop')} disabled={loading}>Ordinateur</button>
            </div>
            <p className="tiny muted">Appareil détecté : {PROFILES[detected].label}. Choisi : <b>{profile.label}</b> — voix {profile.stt.ids[0].split('/')[1]}, agent {profile.llm.ids[0].split('/')[1]}. Un seul modèle en mémoire à la fois.</p>
            {(loading || progress.stt.status !== 'idle') && (
              <div className="stack" style={{ gap: 8 }}>
                {(['stt', 'llm'] as const).map((k) => (
                  <div key={k}>
                    <div className="row between tiny"><span>{k === 'stt' ? 'Voix (Whisper)' : 'Agent (langage)'}</span><span>{progress[k].status === 'ready' ? 'Prêt' : progress[k].status === 'error' ? 'Erreur' : `${progress[k].percent} %${progress[k].total ? ` · ${mb(progress[k].loaded)} / ${mb(progress[k].total)}` : ''}`}</span></div>
                    <div className="bar mt-4"><i style={{ width: `${progress[k].status === 'ready' ? 100 : progress[k].percent}%`, background: progress[k].status === 'error' ? 'var(--red)' : 'var(--primary)' }} /></div>
                  </div>
                ))}
              </div>
            )}
            {error && <div className="small" style={{ color: 'var(--red)' }}>{error}</div>}
            <div className="row wrap" style={{ gap: 8 }}>
              {!ready && <button className="btn btn-primary" disabled={loading} onClick={loadModels}><Download />{loading ? 'Chargement…' : `Charger l’IA (~${profile.approxMB} Mo, une seule fois)`}</button>}
              {worker.mode && <button className="btn" disabled={loading} onClick={() => agent.unload()}><Cpu />Libérer la mémoire</button>}
              {usage && usage.files > 0 && <button className="btn btn-ghost" disabled={loading} onClick={async () => { await agent.clearDownloadedModels(); setUsage(await AdaptiveVoiceERPAgent.cacheUsage()); toast('Modèles supprimés de l’appareil'); }}><Trash2 />Supprimer les modèles ({mb(usage.bytes)})</button>}
            </div>
          </div>
        )}
      </div>

      <div className="chat">
        {msgs.length === 0 && (
          <div className="chat-empty">
            <p className="small muted">Exemples :</p>
            <div className="row wrap" style={{ gap: 8 }}>{SUGGESTIONS.map((s) => <button key={s} className="chip" onClick={() => sendText(s)}>{s}</button>)}</div>
          </div>
        )}
        {msgs.map((m) => m.who === 'me' ? (
          <div key={m.id} className="bubble me">{m.voice && <Mic size={13} style={{ verticalAlign: -2, marginRight: 4 }} />}{m.text}</div>
        ) : m.who === 'status' ? (
          <div key={m.id} className="chat-status">{m.text}</div>
        ) : (
          <div key={m.id} className={`bubble ai ${m.reply.tone ?? ''}`}>
            <div>{m.reply.text}</div>
            {m.reply.lines && m.reply.lines.length > 0 && (
              <div className="ai-lines">
                {m.reply.lines.map((l, i) => (
                  <button key={i} className="ai-line" disabled={!l.to} onClick={() => l.to && nav(l.to)}>
                    {l.photo !== undefined && <Avatar src={l.photo} name={l.label} size={26} />}
                    <span className="grow">{l.label}</span>{l.value && <b>{l.value}</b>}
                  </button>
                ))}
              </div>
            )}
            {m.reply.choices && (
              <div className="ai-lines">{m.reply.choices.map((c) => <button key={c.sub} className="ai-line" onClick={() => answer(c.command)}><span className="grow">{c.label}<small className="muted" style={{ display: 'block' }}>{c.sub}</small></span></button>)}</div>
            )}
            {m.reply.actions && <div className="row wrap mt-8" style={{ gap: 6 }}>{m.reply.actions.map((a) => <button key={a.to} className={`btn btn-sm ${a.primary ? 'btn-primary' : ''}`} onClick={() => nav(a.to)}>{a.label}</button>)}</div>}
            {m.cmd && (
              <div className="ai-meta">
                <span>{actionLabel[m.cmd.action]} · {m.cmd.source === 'llm' ? 'IA locale' : 'règles'}</span>
                <button onClick={() => setShowJson(showJson === m.id ? null : m.id)}><Code2 size={13} />JSON</button>
              </div>
            )}
            {showJson === m.id && m.cmd && <pre className="ai-json">{JSON.stringify({ action: m.cmd.action, entite: m.cmd.entite, variables: m.cmd.variables }, null, 2)}</pre>}
          </div>
        ))}
        {(busy === 'thinking' || busy === 'transcribing') && <div className="chat-status">{busy === 'transcribing' ? 'Transcription…' : 'Réflexion…'}</div>}
        <div ref={endRef} />
      </div>

      <form className="composer" onSubmit={(e) => { e.preventDefault(); void sendText(); }}>
        <button type="button" className={`mic ${recording ? 'rec' : ''}`} onClick={toggleMic} aria-label={recording ? 'Arrêter et envoyer' : 'Parler'} style={recording ? { boxShadow: `0 0 0 ${4 + level * 10}px rgba(229, 56, 59, .18)` } : undefined}>
          {recording ? <Square size={18} /> : <Mic size={20} />}
        </button>
        <input className="input grow" value={text} onChange={(e) => setText(e.target.value)} placeholder={recording ? 'J’écoute… touchez ■ pour envoyer' : 'Écrivez votre demande…'} disabled={recording} />
        <button type="submit" className="btn btn-primary btn-icon" disabled={!text.trim() || !!busy} aria-label="Envoyer"><Send size={18} /></button>
      </form>
    </div>
  );
}
