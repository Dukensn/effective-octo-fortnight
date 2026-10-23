import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import './styles/app.css';
import './styles/docs.css';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { loadDatabase } from './data/store';
import { seedDatabase } from './data/seed';
import { startSync } from './data/sync';
import { reconcileTimetable } from './lib/regles';
import { autoSnapshot } from './lib/backup';

registerSW({ immediate: true });

// Mémorise l'invite d'installation (bouton « Installer l'application » dans Mon profil)
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  (window as unknown as { __installPrompt?: Event }).__installPrompt = e;
});

loadDatabase(seedDatabase).then(() => {
  reconcileTimetable();
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  startSync();
  // Copie de sécurité quotidienne sur l'appareil (au démarrage et quand l'application passe en arrière-plan)
  setTimeout(autoSnapshot, 4000);
  document.addEventListener('visibilitychange', () => { if (document.hidden) void autoSnapshot(); });
});
