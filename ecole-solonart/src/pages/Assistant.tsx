// Assistant : chat dans l'application ; les demandes écrites sont comprises par des règles (aucune donnée ne quitte l'appareil).
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Trash2, Code2 } from 'lucide-react';
import { Avatar, PageHead } from '../components/ui';
import { ruleBasedCommand, type ErpCommand } from '../ai/erpCommand';
import { db } from '../data/store';
import { actionLabel, executeCommand, type ChatReply } from '../ai/erpActions';
import { useSession } from '../lib/session';
import { NS } from '../data/mode';

type Msg =
  | { id: number; who: 'me'; text: string }
  | { id: number; who: 'ai'; reply: ChatReply; cmd?: ErpCommand }
  | { id: number; who: 'status'; text: string };

type NewMsg = Msg extends infer M ? (M extends Msg ? Omit<M, 'id'> : never) : never;
const KEY = `${NS}:assistant-chat`;
const load = (): Msg[] => { try { return JSON.parse(sessionStorage.getItem(KEY) ?? '[]'); } catch { return []; } };
const SUGGESTIONS = ['Résultats de la S4-A', 'Qui n’a pas encore payé en 7e année ?', 'Rapport financier du mois d’avril', 'Présences de la S3-A', 'Quels cahiers de textes ne sont pas à jour ?', 'Jean Philippe Dorval a payé 15000 gourdes par MonCash'];

export default function Assistant() {
  const session = useSession()!;
  const nav = useNavigate();
  const [msgs, setMsgs] = useState<Msg[]>(load);
  const [text, setText] = useState('');
  const [showJson, setShowJson] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const seq = useRef(Date.now());

  useEffect(() => { try { sessionStorage.setItem(KEY, JSON.stringify(msgs.slice(-40))); } catch { /* ignore */ } endRef.current?.scrollIntoView({ block: 'end' }); }, [msgs]);

  const push = (m: NewMsg) => setMsgs((x) => [...x, { ...m, id: ++seq.current } as Msg]);
  const answer = (cmd: ErpCommand) => push({ who: 'ai', reply: executeCommand(cmd, session), cmd });
  const interpret = (t: string) => {
    const year = db.get('years', db.get('school', 'main')?.anneeCourante);
    return ruleBasedCommand(t, { classCodes: db.list('classes').map((c) => c.code), schoolStartYear: Number((year?.debut ?? '2024').slice(0, 4)) });
  };

  const sendText = (t = text) => {
    const clean = t.trim();
    if (!clean) return;
    setText('');
    push({ who: 'me', text: clean });
    answer(interpret(clean));
  };

  return (
    <div className="assistant">
      <PageHead title="Assistant" sub="Posez votre question par écrit. Tout se passe dans cet appareil : rien ne part sur Internet."
        actions={msgs.length > 0 && <button className="btn" onClick={() => setMsgs([])}><Trash2 />Effacer la conversation</button>} />

      <div className="chat">
        {msgs.length === 0 && (
          <div className="chat-empty">
            <p className="small muted">Exemples :</p>
            <div className="row wrap" style={{ gap: 8 }}>{SUGGESTIONS.map((s) => <button key={s} className="chip" onClick={() => sendText(s)}>{s}</button>)}</div>
          </div>
        )}
        {msgs.map((m) => m.who === 'me' ? (
          <div key={m.id} className="bubble me">{m.text}</div>
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
                <span>{actionLabel[m.cmd.action]}</span>
                <button onClick={() => setShowJson(showJson === m.id ? null : m.id)}><Code2 size={13} />JSON</button>
              </div>
            )}
            {showJson === m.id && m.cmd && <pre className="ai-json">{JSON.stringify({ action: m.cmd.action, entite: m.cmd.entite, variables: m.cmd.variables }, null, 2)}</pre>}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form className="composer" onSubmit={(e) => { e.preventDefault(); sendText(); }}>
        <input className="input grow" value={text} onChange={(e) => setText(e.target.value)} placeholder="Écrivez votre demande…" />
        <button type="submit" className="btn btn-primary btn-icon" disabled={!text.trim()} aria-label="Envoyer"><Send size={18} /></button>
      </form>
    </div>
  );
}
