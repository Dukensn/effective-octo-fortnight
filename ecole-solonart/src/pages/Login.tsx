import { useMemo, useRef, useState } from 'react';
import { ArrowLeft, ShieldCheck, GraduationCap, WifiOff, Users } from 'lucide-react';
import { useCollection, useDoc } from '../data/store';
import { login, loginParent } from '../lib/session';
import { Avatar } from '../components/ui';
import { SchoolLogo } from '../components/Logo';

export default function Login() {
  const school = useDoc('school', 'main');
  const users = useCollection('users');
  const roles = useCollection('roles');
  const [space, setSpace] = useState<'admin' | 'professeur' | 'parent'>('admin');
  const [tel, setTel] = useState('');
  const [ppin, setPpin] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const roleOf = (id: string) => roles.find((r) => r.id === id);
  const [q, setQ] = useState('');
  const list = useMemo(() => users.filter((u) => u.actif && roleOf(u.roleId)?.espace === space && (!q || u.nom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')))), [users, roles, space, q]); // eslint-disable-line
  const user = users.find((u) => u.id === selected);

  const submit = (code: string) => {
    if (!selected) return;
    const err = login(selected, code);
    if (err) {
      setError(err);
      setPin(['', '', '', '']);
      refs.current[0]?.focus();
    }
  };
  const setDigit = (i: number, v: string) => {
    const d = v.replace(/\D/g, '').slice(-1);
    const next = [...pin];
    next[i] = d;
    setPin(next);
    setError('');
    if (d && i < 3) refs.current[i + 1]?.focus();
    if (next.every(Boolean)) submit(next.join(''));
  };

  return (
    <div className="login">
      <div className="login-hero">
        <div className="row" style={{ gap: 14 }}>
          <SchoolLogo size={56} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 22 }}>{school?.nom}</div>
            <div style={{ color: '#c8d6f5', fontSize: 13 }}>{school?.devise}</div>
          </div>
        </div>
        <div>
          <h2>Gérer l’école,<br />simplement.</h2>
          <p>Élèves, notes, bulletins, badges, présences et finance — sur téléphone, tablette et ordinateur, même sans connexion Internet.</p>
        </div>
        <div style={{ color: '#9fb4e3', fontSize: 13 }}>« {school?.slogan} »</div>
      </div>
      <div className="login-panel">
        <div className="login-box">
          <div className="row mb-16" style={{ gap: 12 }}>
            <SchoolLogo size={44} />
            <div>
              <h2 style={{ fontSize: 22 }}>{school?.nom}</h2>
              <div className="small muted">{school?.devise}</div>
            </div>
          </div>
          {!user ? (
            <>
              <h3 style={{ fontSize: 18 }} className="mt-16">Connexion</h3>
              <p className="muted small mt-8 mb-16">Choisissez votre espace puis votre compte.</p>
              <div className="seg mb-16">
                <button className={space === 'admin' ? 'active' : ''} onClick={() => setSpace('admin')}><ShieldCheck size={16} />Direction</button>
                <button className={space === 'professeur' ? 'active' : ''} onClick={() => setSpace('professeur')}><GraduationCap size={16} />Professeur</button>
                <button className={space === 'parent' ? 'active' : ''} onClick={() => { setSpace('parent'); setError(''); }}><Users size={16} />Parent</button>
              </div>
              {space === 'parent' ? (
                <form className="stack" style={{ gap: 12 }} onSubmit={(e) => { e.preventDefault(); const err = loginParent(tel, ppin); if (err) { setError(err); setPpin(''); } }}>
                  <label className="field"><span>Numéro de téléphone</span><input className="input" type="tel" inputMode="tel" autoComplete="tel" value={tel} onChange={(e) => { setTel(e.target.value); setError(''); }} placeholder="Ex. 3698 7654" /></label>
                  <label className="field"><span>Code à 4 chiffres</span><input className="input" type="password" inputMode="numeric" maxLength={4} value={ppin} onChange={(e) => { setPpin(e.target.value.replace(/\D/g, '')); setError(''); }} placeholder="••••" /></label>
                  {error && <p className="small" style={{ color: 'var(--red)' }}>{error}</p>}
                  <button className="btn btn-primary" type="submit" disabled={ppin.length !== 4 || !tel.trim()}>Se connecter</button>
                  <p className="tiny muted">Le code vous est remis par le secrétariat de l’école. Démonstration : 3698 7654, code 1234.</p>
                </form>
              ) : <>
              {users.filter((u) => u.actif && roleOf(u.roleId)?.espace === space).length > 6 && <input className="input mb-12" placeholder="Rechercher mon nom…" value={q} onChange={(e) => setQ(e.target.value)} />}
              <div className="stack" style={{ gap: 8, maxHeight: '52dvh', overflowY: 'auto', paddingRight: 2 }}>
                {list.map((u) => (
                  <button key={u.id} className="account" onClick={() => { setSelected(u.id); setTimeout(() => refs.current[0]?.focus(), 50); }}>
                    <Avatar src={u.photo} name={u.nom} size={40} />
                    <span className="grow">
                      <b style={{ color: 'var(--ink)', display: 'block' }}>{u.nom}</b>
                      <span className="small muted">{roleOf(u.roleId)?.nom}</span>
                    </span>
                  </button>
                ))}
              </div>
              </>}
            </>
          ) : (
            <>
              <button className="back-link btn-ghost" style={{ border: 0, background: 'none', padding: 0 }} onClick={() => { setSelected(null); setPin(['', '', '', '']); setError(''); }}><ArrowLeft size={16} />Changer de compte</button>
              <div className="card card-pad center mt-12">
                <div style={{ display: 'flex', justifyContent: 'center' }}><Avatar src={user.photo} name={user.nom} size={72} /></div>
                <h3 className="mt-12">{user.nom}</h3>
                <div className="small muted">{roleOf(user.roleId)?.nom}</div>
                <p className="small mt-16 mb-12">Entrez votre code à 4 chiffres</p>
                <div className="pin">
                  {pin.map((d, i) => (
                    <input key={i} ref={(el) => (refs.current[i] = el)} value={d} inputMode="numeric" type="password" maxLength={1} aria-label={`Chiffre ${i + 1}`}
                      onChange={(e) => setDigit(i, e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Backspace' && !pin[i] && i > 0) refs.current[i - 1]?.focus(); }} />
                  ))}
                </div>
                {error && <p className="small mt-12" style={{ color: 'var(--red)' }}>{error}</p>}
                <p className="tiny muted mt-16">Démonstration : le code de tous les comptes est <b>1234</b>.</p>
              </div>
            </>
          )}
          <p className="tiny muted center mt-24"><WifiOff size={12} style={{ verticalAlign: -2 }} /> Fonctionne aussi hors ligne · Installable sur téléphone et ordinateur</p>
        </div>
      </div>
    </div>
  );
}
