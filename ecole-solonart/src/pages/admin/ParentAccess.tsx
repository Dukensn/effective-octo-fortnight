// Accès à l'espace parent : création, nouveau code, désactivation. Le code n'est montré qu'une fois.
import { useState } from 'react';
import { KeyRound, MessageCircle, Copy, UserX, UserCheck } from 'lucide-react';
import { db, useCollection, useDoc } from '../../data/store';
import type { Guardian } from '../../data/types';
import { Modal, toast } from '../../components/ui';
import { civ, timeAgo } from '../../lib/format';
import { audit } from '../../lib/session';
import { phoneDigits } from '../../lib/relance';

const newPin = () => String(crypto.getRandomValues(new Uint32Array(1))[0] % 10000).padStart(4, '0');

export function ParentAccess({ g, canWrite }: { g: Guardian; canWrite: boolean }) {
  const users = useCollection('users');
  const school = useDoc('school', 'main');
  const role = useCollection('roles').find((r) => r.espace === 'parent');
  const account = users.find((u) => u.guardianId === g.id);
  const [shown, setShown] = useState<string | null>(null);
  const tel = g.whatsapp ?? g.telephone;
  const url = `${location.origin}${location.pathname}`;
  const message = (pin: string) => `Bonjour ${civ(g)}, voici votre accès à l’espace parent de ${school?.nom ?? 'l’école'} : ouvrez ${url}, choisissez « Parent », entrez votre numéro ${g.telephone} et le code ${pin}. Gardez ce code pour vous.`;

  const create = () => {
    if (!role) return toast('Rôle « Parent » introuvable : vérifiez Paramètres → Rôles', true);
    if (phoneDigits(g.telephone).length < 8) return toast('Ajoutez d’abord un numéro de téléphone valide', true);
    const other = users.find((u) => u.id !== account?.id && u.roleId === role.id && phoneDigits(u.telephone) === phoneDigits(g.telephone));
    if (other) return toast(`Ce numéro est déjà utilisé par l’accès de ${other.nom}`, true);
    const pin = newPin();
    if (account) db.patch('users', account.id, { pin, actif: true, telephone: g.telephone });
    else db.put('users', { id: `u-par-${g.id}`, nom: civ(g), email: g.email ?? '', telephone: g.telephone, roleId: role.id, guardianId: g.id, pin, actif: true, photo: g.photo });
    audit(account ? 'Nouveau code parent' : 'Création accès parent', civ(g), { domaine: 'acces' });
    setShown(pin);
  };
  const toggle = () => {
    if (!account) return;
    db.patch('users', account.id, { actif: !account.actif });
    audit(account.actif ? 'Désactivation accès parent' : 'Réactivation accès parent', civ(g), { domaine: 'acces' });
  };

  return (
    <div className="card card-pad">
      <h3 style={{ fontSize: 15 }} className="mb-8">Accès parent</h3>
      {!account ? <p className="small muted mb-12">Pas encore d’accès. Le parent pourra voir les notes validées, les absences, la discipline, les devoirs et les paiements de ses enfants, et rien d’autre.</p>
        : <p className="small mb-12">{account.actif ? 'Actif' : 'Désactivé'} · connexion avec le {account.telephone}{account.dernierAcces ? ` · dernière visite ${timeAgo(account.dernierAcces)}` : ' · jamais connecté'}</p>}
      {canWrite && (
        <div className="row wrap" style={{ gap: 8 }}>
          <button className="btn btn-sm btn-primary" onClick={create}><KeyRound size={14} />{account ? 'Nouveau code' : 'Créer l’accès'}</button>
          {account && <button className="btn btn-sm" onClick={toggle}>{account.actif ? <><UserX size={14} />Désactiver</> : <><UserCheck size={14} />Réactiver</>}</button>}
        </div>
      )}
      {shown && (
        <Modal open onClose={() => setShown(null)} title="Code de l’espace parent" footer={<button className="btn btn-primary" onClick={() => setShown(null)}>Terminé</button>}>
          <p className="small mb-12">Code pour <b>{civ(g)}</b> (connexion avec le {g.telephone}) :</p>
          <div className="pin-show">{shown}</div>
          <p className="tiny muted mt-12 mb-12">Ce code ne sera plus affiché. Transmettez-le maintenant au parent.</p>
          <div className="row wrap" style={{ gap: 8 }}>
            <a className="btn btn-soft" href={`https://wa.me/${phoneDigits(tel)}?text=${encodeURIComponent(message(shown))}`} target="_blank" rel="noreferrer"><MessageCircle size={16} />Envoyer par WhatsApp</a>
            <button className="btn" onClick={async () => { try { await navigator.clipboard.writeText(message(shown)); toast('Message copié'); } catch { toast('Copie impossible', true); } }}><Copy size={16} />Copier le message</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
