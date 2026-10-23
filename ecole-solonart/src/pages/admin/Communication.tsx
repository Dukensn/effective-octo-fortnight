import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, MessageCircle, Mail, Smartphone, Megaphone, Copy, FileSpreadsheet, Info } from 'lucide-react';
import { db, useCollection, useDoc } from '../../data/store';
import type { Message } from '../../data/types';
import { PageHead, Field, Card, Badge, toast, Empty } from '../../components/ui';
import { downloadCSV, timeAgo } from '../../lib/format';
import { useSession, audit } from '../../lib/session';

const TEMPLATES: [string, string][] = [
  ['Réunion des parents', 'Chers parents, une réunion aura lieu le [date] à [heure] à l’école. Votre présence est importante. — La Direction'],
  ['Rappel de paiement', 'Chers parents, nous vous rappelons que le versement de la scolarité est attendu avant le [date]. Paiement possible par MonCash ou au secrétariat. Merci.'],
  ['Remise des bulletins', 'Les bulletins du [période] sont disponibles. Merci de passer les récupérer au secrétariat à partir du [date].'],
  ['Fermeture exceptionnelle', 'En raison de [motif], l’école sera fermée le [date]. Les cours reprendront le [date]. — La Direction'],
];
const CANAUX: [Message['canal'], typeof Send][] = [['SMS', Smartphone], ['WhatsApp', MessageCircle], ['Email', Mail], ['Annonce', Megaphone]];

export default function Communication() {
  const [params] = useSearchParams();
  const session = useSession()!;
  const canWrite = session.can('communication', 'write');
  const school = useDoc('school', 'main');
  const classes = useCollection('classes').slice().sort((a, b) => a.code.localeCompare(b.code, 'fr', { numeric: true }));
  const students = useCollection('students').filter((s) => s.statut === 'Actif');
  const guardians = useCollection('guardians');
  const staff = useCollection('staff').filter((s) => s.statut === 'Actif');
  const messages = useCollection('messages').slice().sort((a, b) => b.date - a.date);
  const [canal, setCanal] = useState<Message['canal']>((params.get('canal') as Message['canal']) ?? 'WhatsApp');
  const [cible, setCible] = useState<Message['cible']>(params.get('cible') === 'classe' ? 'Classe' : 'Tous les parents');
  const [classe, setClasse] = useState(params.get('classe') ?? classes[0]?.id);
  const [objet, setObjet] = useState('');
  const [contenu, setContenu] = useState('');

  const recipients = useMemo(() => {
    if (cible === 'Personnel') return staff.map((s) => ({ nom: `${s.prenom} ${s.nom}`, tel: s.telephone, email: s.email }));
    const kids = cible === 'Classe' ? students.filter((s) => s.classeId === classe) : students;
    const ids = new Set(kids.flatMap((s) => s.tuteurIds));
    return guardians.filter((g) => ids.has(g.id) && g.principal && g.statut === 'Actif').map((g) => ({ nom: `${g.prenom} ${g.nom}`, tel: g.whatsapp ?? g.telephone, email: g.email }));
  }, [cible, classe, students, guardians, staff]);

  const send = () => {
    if (!contenu.trim()) return toast('Écrivez un message', true);
    db.put('messages', { date: Date.now(), canal, objet: objet || contenu.slice(0, 40), contenu, cible, classeId: cible === 'Classe' ? classe : undefined, destinataires: recipients.length, auteurId: session.user.id });
    audit('Message', `${canal} → ${recipients.length}`);
    if (canal === 'Email') {
      const bcc = recipients.map((r) => r.email).filter(Boolean).join(',');
      window.location.href = `mailto:?bcc=${encodeURIComponent(bcc)}&subject=${encodeURIComponent(objet)}&body=${encodeURIComponent(contenu)}`;
    } else if (canal === 'WhatsApp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(`*${school?.nom}*\n${contenu}`)}`, '_blank');
    }
    toast(canal === 'Annonce' ? 'Annonce publiée' : `Message préparé pour ${recipients.length} destinataire(s)`);
    setContenu(''); setObjet('');
  };

  return (
    <>
      <PageHead title="Communication" sub="Messages aux parents et au personnel : SMS, WhatsApp, email et annonces." />
      <div className="split">
        {canWrite && (
          <Card title="Nouveau message">
            <div className="pills mb-16">{CANAUX.map(([c, I]) => <button key={c} className={canal === c ? 'active' : ''} onClick={() => setCanal(c)}><I size={15} style={{ verticalAlign: -3, marginRight: 6 }} />{c}</button>)}</div>
            <div className="form-grid">
              <Field label="Destinataires"><select className="select" value={cible} onChange={(e) => setCible(e.target.value as Message['cible'])}><option>Tous les parents</option><option>Classe</option><option>Personnel</option></select></Field>
              {cible === 'Classe' ? <Field label="Classe"><select className="select" value={classe} onChange={(e) => setClasse(e.target.value)}>{classes.map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}</select></Field> : <div />}
              <Field label="Objet" className="span-2"><input className="input" value={objet} onChange={(e) => setObjet(e.target.value)} /></Field>
              <Field label={`Message${canal === 'SMS' ? ` (${contenu.length}/160)` : ''}`} className="span-2"><textarea className="textarea" style={{ minHeight: 120 }} value={contenu} onChange={(e) => setContenu(e.target.value)} placeholder="Écrivez votre message..." /></Field>
            </div>
            <div className="row wrap mt-12" style={{ gap: 6 }}><span className="small muted">Modèles :</span>{TEMPLATES.map(([t, c]) => <button key={t} className="btn btn-sm btn-soft" onClick={() => { setObjet(t); setContenu(c); }}>{t}</button>)}</div>
            <div className="row wrap mt-16" style={{ gap: 8 }}>
              <Badge tone="blue">{recipients.length} destinataire(s)</Badge>
              <span className="grow" />
              <button className="btn btn-sm" onClick={() => { navigator.clipboard?.writeText(recipients.map((r) => r.tel).join(', ')); toast('Numéros copiés'); }}><Copy size={14} />Copier les numéros</button>
              <button className="btn btn-sm" onClick={() => downloadCSV('destinataires.csv', [['Nom', 'Téléphone', 'Email'], ...recipients.map((r) => [r.nom, r.tel, r.email])])}><FileSpreadsheet size={14} />Liste</button>
              <button className="btn btn-primary" onClick={send}><Send />Envoyer</button>
            </div>
            <p className="tiny muted mt-12 row" style={{ gap: 6, alignItems: 'flex-start' }}><Info size={13} style={{ flex: 'none', marginTop: 2 }} />WhatsApp ouvre l’application avec le message prêt (choisissez un groupe de diffusion). Email ouvre votre messagerie avec tous les parents en copie cachée. L’envoi SMS automatique se branche sur un fournisseur (Digicel / Natcom) via Firebase Functions ; en attendant, copiez les numéros.</p>
          </Card>
        )}
        <Card title="Historique" pad={false}>
          {messages.length === 0 ? <Empty title="Aucun message" /> : messages.map((m) => (
            <div key={m.id} className="list-item" style={{ alignItems: 'flex-start' }}>
              <span className="tint-blue" style={{ width: 36, height: 36, borderRadius: 10, display: 'grid', placeItems: 'center', flex: 'none' }}>{(() => { const I = CANAUX.find((c) => c[0] === m.canal)![1]; return <I size={17} />; })()}</span>
              <div className="grow"><div className="row between"><b style={{ color: 'var(--ink)' }}>{m.objet}</b><span className="tiny muted">{timeAgo(m.date)}</span></div><div className="small muted">{m.contenu}</div><div className="tiny mt-8"><Badge tone="gray">{m.canal}</Badge> <Badge tone="blue">{m.cible === 'Classe' ? classes.find((c) => c.id === m.classeId)?.code : m.cible} · {m.destinataires}</Badge></div></div>
            </div>
          ))}
        </Card>
      </div>
    </>
  );
}
