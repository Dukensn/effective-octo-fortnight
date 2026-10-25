// Compte créé mais pas encore lié à l'école : on entre le code d'établissement, puis on attend la direction.
import { useState } from 'react';
import { Clock, XCircle } from 'lucide-react';
import { useDoc } from '../data/store';
import type { User } from '../data/types';
import { joinSchool, logoutEverywhere } from '../lib/auth';
import { logout } from '../lib/session';
import { Avatar } from '../components/ui';
import { SchoolLogo } from '../components/Logo';

export default function Join({ user }: { user: User }) {
  const school = useDoc('school', 'main');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const out = () => { logoutEverywhere(); logout(); };
  const d = user.demande;
  return (
    <div className="auth">
      <div className="auth-box">
        <div className="auth-brand"><Avatar src={user.photo} name={user.nom} size={64} /><b>{user.nom}</b><span>{user.email}</span></div>
        {!d || d.refusee ? (
          <>
            <h1 className="auth-title">Rejoindre votre école</h1>
            {d?.refusee && <p className="auth-error" style={{ display: 'flex', gap: 8 }}><XCircle size={18} />La direction a refusé la demande{d.motif ? ` : ${d.motif}` : ''}. Vérifiez le code ou parlez-lui.</p>}
            <p className="auth-text">Entrez le code d’établissement que la direction vous a donné.</p>
            <form className="auth-form" onSubmit={(e) => { e.preventDefault(); const err = joinSchool(user.id, code); setError(err ?? ''); }}>
              <input className="input auth-code" placeholder="Ex. SOLONART-4821" autoCapitalize="characters" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
              {error && <p className="auth-error">{error}</p>}
              <button className="btn btn-primary btn-lg btn-block" disabled={code.trim().length < 4}>Rejoindre</button>
            </form>
          </>
        ) : (
          <>
            <div className="auth-wait"><SchoolLogo size={44} /><span><b>{school?.nom}</b><small>Demande envoyée</small></span><Clock size={20} /></div>
            <h1 className="auth-title">En attente de la direction</h1>
            <p className="auth-text">La direction doit valider votre accès et choisir votre rôle. Vous pourrez ensuite utiliser l’application.</p>
          </>
        )}
        <p className="auth-switch"><button onClick={out}>Se déconnecter</button></p>
      </div>
    </div>
  );
}
