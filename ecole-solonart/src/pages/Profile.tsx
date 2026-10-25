import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, KeyRound, Download, Smartphone } from 'lucide-react';
import { db, useDoc } from '../data/store';
import { PageHead, Card, Avatar, Field, toast, Badge, Toggle } from '../components/ui';
import { enablePush, pushEnabled, pushSupported } from '../lib/push';
import { logout, useSession } from '../lib/session';
import { civ, readFileAsDataURL } from '../lib/format';
import { changePassword, logoutEverywhere } from '../lib/auth';
import { SchoolLogo } from '../components/Logo';

export default function Profile() {
  const session = useSession()!;
  const [push, setPush] = useState(pushEnabled);
  const nav = useNavigate();
  const staff = useDoc('staff', session.user.staffId);
  const [pw, setPw] = useState({ old: '', a: '', b: '' });
  const [code, setCode] = useState('');
  const school = useDoc('school', 'main');
  const install = (window as unknown as { __installPrompt?: { prompt: () => void } }).__installPrompt;
  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <PageHead title="Mon profil" />
      <Card>
        <div className="row" style={{ gap: 16 }}>
          <label style={{ cursor: 'pointer' }}><Avatar src={session.user.photo} name={session.user.nom} size={80} />
            <input type="file" accept="image/*" capture="user" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; const url = await readFileAsDataURL(f, 300); db.patch('users', session.user.id, { photo: url }); if (staff) db.patch('staff', staff.id, { photo: url }); toast('Photo mise à jour'); }} /></label>
          <div className="grow"><h2 style={{ fontSize: 20 }}>{session.user.nom}</h2><div className="muted small">{session.user.email}</div><div className="mt-8"><Badge tone="blue">{session.role.nom}</Badge></div></div>
        </div>
        {staff && <div className="info mt-16"><div>Matricule</div><div>{staff.matricule}</div><div>Poste</div><div>{staff.poste}{staff.specialite ? ` · ${staff.specialite}` : ''}</div><div>Téléphone</div><div>{staff.telephone}</div><div>Fiche</div><div>{civ(staff)}</div></div>}
      </Card>
      <Card title="Mot de passe" className="mt-16">
          <div className="form-grid cols-3">
            <Field label="Actuel"><input className="input" type="password" autoComplete="current-password" value={pw.old} onChange={(e) => setPw({ ...pw, old: e.target.value })} /></Field>
            <Field label="Nouveau"><input className="input" type="password" autoComplete="new-password" value={pw.a} onChange={(e) => setPw({ ...pw, a: e.target.value })} /></Field>
            <Field label="Confirmer"><input className="input" type="password" autoComplete="new-password" value={pw.b} onChange={(e) => setPw({ ...pw, b: e.target.value })} /></Field>
          </div>
          <button className="btn btn-primary mt-12" onClick={async () => {
            if (pw.a !== pw.b) return toast('Les deux mots de passe ne sont pas identiques', true);
            const err = await changePassword(session.user, pw.old, pw.a);
            if (err) return toast(err, true);
            setPw({ old: '', a: '', b: '' }); toast('Mot de passe modifié');
          }}><KeyRound />Enregistrer</button>
          <p className="tiny muted mt-8">Si vous vous connectez avec Google, votre mot de passe est celui de Google.</p>
      </Card>
      {!session.isParent && (
        <Card title="Mes établissements" className="mt-16">
          <div className="row" style={{ gap: 12 }}>
            <SchoolLogo size={36} /><span className="grow"><b style={{ color: 'var(--ink)' }}>{school?.nom}</b><div className="small muted">{session.role.nom}</div></span><Badge tone="green">Membre</Badge>
          </div>
          <form className="row mt-12" style={{ gap: 8 }} onSubmit={(e) => { e.preventDefault(); const c = code.replace(/\s/g, '').toUpperCase(); if (!c) return; toast(c === school?.codeEtablissement ? 'Vous êtes déjà membre de cet établissement' : 'Code inconnu. Pour l’instant, l’application sert une seule école.', c !== school?.codeEtablissement); setCode(''); }}>
            <input className="input grow" placeholder="Code d’un autre établissement" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
            <button className="btn">Ajouter</button>
          </form>
        </Card>
      )}
      <Card title="Notifications sur ce téléphone" className="mt-16">
        <p className="small muted mb-12">Une notification apparaît dans la barre du téléphone pour les nouveaux messages et alertes{session.isTeacher ? ' (appel à faire, remplacement)' : ''}, quand l’application est ouverte ou en arrière-plan. Application complètement fermée : ce sera possible une fois la synchronisation en ligne branchée.</p>
        {!pushSupported() ? <p className="small muted">Ce navigateur ne permet pas les notifications. Installez l’application (ci-dessous) puis réessayez.</p>
          : <label className="row between"><span className="small">Recevoir les notifications</span><Toggle on={push} onChange={async (v) => { try { setPush(await enablePush(v)); } catch (e) { toast((e as Error).message, true); } }} label="Notifications" /></label>}
      </Card>
      <Card title="Application" className="mt-16">
        <p className="small muted mb-12">Installez l’application sur votre téléphone ou ordinateur pour l’ouvrir comme une application normale, même sans Internet.</p>
        <div className="row wrap">
          {install ? <button className="btn btn-primary" onClick={() => install.prompt()}><Download />Installer l’application</button> : <span className="small muted row" style={{ gap: 6 }}><Smartphone size={16} />Sur téléphone : menu du navigateur → « Ajouter à l’écran d’accueil ».</span>}
          <button className="btn btn-danger" onClick={() => { logoutEverywhere(); logout(); nav('/'); }}><LogOut />Se déconnecter</button>
        </div>
      </Card>
    </div>
  );
}
