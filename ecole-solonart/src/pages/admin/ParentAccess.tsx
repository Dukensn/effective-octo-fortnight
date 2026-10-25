// Accès à l'espace parent : la direction enregistre l'adresse e-mail du parent et lui envoie une invitation.
// Le parent se connecte avec Google, ou crée son mot de passe avec cette adresse (« Créer un compte »).
import { useState } from 'react';
import { MessageCircle, Copy, UserX, UserCheck, MailPlus, RotateCcw } from 'lucide-react';
import { db, useCollection, useDoc } from '../../data/store';
import type { Guardian } from '../../data/types';
import { toast } from '../../components/ui';
import { civ, timeAgo } from '../../lib/format';
import { audit } from '../../lib/session';
import { phoneDigits } from '../../lib/relance';
import { findByEmail, googleAvailable, putAccount, resetLocalPassword } from '../../lib/auth';

export function ParentAccess({ g, canWrite }: { g: Guardian; canWrite: boolean }) {
  const users = useCollection('users');
  const school = useDoc('school', 'main');
  const role = useCollection('roles').find((r) => r.espace === 'parent');
  const account = users.find((u) => u.guardianId === g.id);
  const [email, setEmail] = useState(account?.email || g.email || '');
  const tel = g.whatsapp ?? g.telephone;
  const url = `${location.origin}${location.pathname}`;
  const message = `Bonjour ${civ(g)}, votre accès à l’espace parent de ${school?.nom ?? 'l’école'} est prêt. Ouvrez ${url} puis connectez-vous avec Google, ou touchez « Créer un compte » avec l’adresse ${email.trim()} pour choisir votre mot de passe.`;

  const create = () => {
    if (!role) return toast('Rôle « Parent » introuvable : vérifiez Paramètres → Rôles', true);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return toast('Entrez l’adresse e-mail du parent', true);
    const other = findByEmail(email);
    if (other && other.id !== account?.id) return toast(`Cette adresse est déjà utilisée par ${other.nom}`, true);
    if (account) putAccount({ ...account, email, actif: true });
    else putAccount({ id: `u-par-${g.id}`, nom: civ(g), email: email.trim().toLowerCase(), telephone: g.telephone, roleId: role.id, guardianId: g.id, pin: '', actif: true, photo: g.photo });
    if (!g.email) db.patch('guardians', g.id, { email: email.trim() });
    audit(account ? 'Accès parent modifié' : 'Création accès parent', `${civ(g)} · ${email.trim()}`, { domaine: 'acces' });
    toast('Accès prêt : envoyez l’invitation');
  };
  const toggle = () => {
    if (!account) return;
    db.patch('users', account.id, { actif: !account.actif });
    audit(account.actif ? 'Désactivation accès parent' : 'Réactivation accès parent', civ(g), { domaine: 'acces' });
  };

  return (
    <div className="card card-pad">
      <h3 style={{ fontSize: 15 }} className="mb-8">Accès parent</h3>
      {!account ? <p className="small muted mb-12">Pas encore d’accès. Le parent verra les bulletins, le progrès, les absences et les messages de ses enfants, et rien d’autre.</p>
        : <p className="small mb-12">{account.actif ? 'Actif' : 'Désactivé'} · {account.email}{account.dernierAcces ? ` · dernière visite ${timeAgo(account.dernierAcces)}` : ' · invitation pas encore utilisée'}</p>}
      {canWrite && (
        <div className="stack" style={{ gap: 8 }}>
          <div className="row" style={{ gap: 8 }}>
            <input className="input grow" type="email" placeholder="Adresse e-mail du parent" value={email} onChange={(e) => setEmail(e.target.value)} />
            <button className="btn btn-primary" onClick={create}><MailPlus size={16} />{account ? 'Mettre à jour' : 'Créer l’accès'}</button>
          </div>
          {account && (
            <div className="row wrap" style={{ gap: 8 }}>
              {phoneDigits(tel).length >= 8 && <a className="btn btn-sm btn-soft" href={`https://wa.me/${phoneDigits(tel)}?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer"><MessageCircle size={14} />Inviter par WhatsApp</a>}
              <button className="btn btn-sm" onClick={async () => { try { await navigator.clipboard.writeText(message); toast('Message copié'); } catch { toast('Copie impossible', true); } }}><Copy size={14} />Copier l’invitation</button>
              {!googleAvailable && account.mdp && <button className="btn btn-sm" onClick={() => { resetLocalPassword(account.id); db.patch('users', account.id, { dernierAcces: undefined }); toast('Le parent pourra choisir un nouveau mot de passe'); }}><RotateCcw size={14} />Nouveau mot de passe</button>}
              <button className="btn btn-sm" onClick={toggle}>{account.actif ? <><UserX size={14} />Désactiver</> : <><UserCheck size={14} />Réactiver</>}</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
