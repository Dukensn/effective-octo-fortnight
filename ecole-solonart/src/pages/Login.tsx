// Connexion : Google ou e-mail + mot de passe. Création de compte au même endroit.
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useCollection, useDoc } from '../data/store';
import { DEMO_PASSWORD, googleAvailable, loginWithGoogle, loginWithPassword, resetPassword, signUp } from '../lib/auth';
import { SchoolLogo } from '../components/Logo';

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);

export default function Login() {
  const school = useDoc('school', 'main');
  const users = useCollection('users');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const [demo, setDemo] = useState(false);

  const run = async (f: () => Promise<string | null>) => {
    setBusy(true); setError(''); setInfo('');
    const err = await f();
    setBusy(false);
    if (err) setError(err);
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    run(() => (mode === 'login' ? loginWithPassword(email, pw) : signUp(nom, email, pw)));
  };
  // Comptes de démonstration (mode local uniquement) : un par espace.
  const demoAccounts = googleAvailable ? [] : [
    ['Direction', 'u-dir'], ['Secrétariat', 'u-sec'], ['Professeur (secondaire)', 'u-prof'], ['Maîtresse (maternelle)', users.find((u) => u.nom.includes('Desrosiers'))?.id], ['Parent', users.find((u) => u.roleId === 'r-par')?.id],
  ].map(([label, id]) => ({ label, u: users.find((x) => x.id === id) })).filter((x) => x.u?.email);

  return (
    <div className="auth">
      <div className="auth-box">
        <div className="auth-brand">
          <SchoolLogo size={56} />
          <b>{school?.nom ?? 'École'}</b>
          <span>{school?.devise}</span>
        </div>

        <h1 className="auth-title">{mode === 'login' ? 'Connexion' : 'Créer un compte'}</h1>

        <button type="button" className="auth-google" disabled={busy} onClick={() => run(loginWithGoogle)}><GoogleIcon />Continuer avec Google</button>
        <div className="auth-or"><span>ou</span></div>

        <form onSubmit={submit} className="auth-form">
          {mode === 'signup' && <input className="input" placeholder="Nom complet" autoComplete="name" value={nom} onChange={(e) => setNom(e.target.value)} />}
          <input className="input" type="email" placeholder="Adresse e-mail" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <div className="auth-pw">
            <input className="input" type={show ? 'text' : 'password'} placeholder="Mot de passe" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={pw} onChange={(e) => setPw(e.target.value)} />
            <button type="button" aria-label={show ? 'Masquer' : 'Afficher'} onClick={() => setShow(!show)}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
          </div>
          {error && <p className="auth-error">{error}</p>}
          {info && <p className="auth-info">{info}</p>}
          <button className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? 'Un instant…' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}</button>
          {mode === 'login' && <button type="button" className="auth-link" onClick={async () => setInfo(await resetPassword(email))}>Mot de passe oublié ?</button>}
        </form>

        <p className="auth-switch">
          {mode === 'login' ? <>Pas encore de compte ? <button onClick={() => { setMode('signup'); setError(''); }}>Créer un compte</button></>
            : <>Déjà un compte ? <button onClick={() => { setMode('login'); setError(''); }}>Se connecter</button></>}
        </p>

        {demoAccounts.length > 0 && (
          <div className="auth-demo">
            <button type="button" onClick={() => setDemo(!demo)}>Comptes de démonstration</button>
            {demo && (
              <>
                <p>Mot de passe : <b>{DEMO_PASSWORD}</b></p>
                {demoAccounts.map(({ label, u }) => (
                  <button key={u!.id} type="button" className="auth-demo-row" onClick={() => { setMode('login'); setEmail(u!.email); setPw(DEMO_PASSWORD); setError(''); }}>
                    <span>{label}</span><small>{u!.email}</small>
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
