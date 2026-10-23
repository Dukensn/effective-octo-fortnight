import { PageHead, Card } from '../components/ui';
import { useSession } from '../lib/session';

const ADMIN: [string, string][] = [
  ['Inscrire un élève', 'Élèves → « Inscrire un élève ». Seuls le nom, le prénom, la date de naissance, la classe et un responsable avec téléphone sont obligatoires. Si un parent est déjà enregistré (frère/sœur), saisissez son numéro : l’application propose de le lier.'],
  ['Notes et professeurs', 'Les professeurs saisissent leurs notes dans leur espace. Elles arrivent automatiquement dans Notes / Examens. La direction suit l’avancement, peut corriger, puis verrouille la période.'],
  ['Bulletins', 'Documents → Bulletins : choisissez le modèle, la période, la classe, puis « Imprimer / PDF ». Les appréciations se préparent dans Notes / Examens → Conseil de classe (bouton « Proposer automatiquement »).'],
  ['Badges', 'Documents → Badges : onglets Professeurs, Direction, Personnel, Élèves. Chaque catégorie a ses propres modèles. 9 badges par feuille A4.'],
  ['Paiements', 'Finance → Nouveau → Paiement élève. Le reste à payer est calculé automatiquement ; imprimez le reçu en 2 exemplaires. « Élèves en retard » permet d’envoyer un rappel WhatsApp.'],
  ['Rôles', 'Paramètres → Rôles & permissions : créez un rôle (ex. Caissier) et cochez ce qu’il peut voir ou modifier. Puis Paramètres → Utilisateurs pour lui donner un compte.'],
  ['Hors ligne', 'L’application fonctionne sans Internet. Les modifications sont gardées sur l’appareil et envoyées à Firebase dès que la connexion revient.'],
];
const PROF: [string, string][] = [
  ['Saisir des notes', 'Accueil → Saisir des notes → choisissez la classe → le contrôle → « Saisir les notes ». Tapez « abs » pour un absent. Entrée passe à l’élève suivant.'],
  ['Palmarès', 'Après l’enregistrement, le palmarès (rang, moyenne, plus haute, plus basse) est calculé. Vous pouvez l’imprimer ou l’exporter en Excel.'],
  ['Clôturer', 'Quand toutes les notes sont justes, « Clôturer le contrôle ». Seule la direction peut ensuite rouvrir.'],
  ['Appel', 'Faire l’appel : tout le monde est présent par défaut, touchez seulement les absents ou retards puis « Enregistrer l’appel ».'],
];

export default function Help() {
  const session = useSession()!;
  const items = session.isTeacher ? PROF : ADMIN;
  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <PageHead title="Centre d’aide" sub="Les réponses aux questions les plus fréquentes." />
      <div className="stack" style={{ gap: 10 }}>
        {items.map(([q, a]) => (
          <details key={q} className="card card-pad">
            <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--ink)' }}>{q}</summary>
            <p className="small muted mt-8" style={{ lineHeight: 1.6 }}>{a}</p>
          </details>
        ))}
      </div>
      <Card title="Contacter l’administration" className="mt-16"><p className="small muted">Pour toute difficulté, adressez-vous au secrétariat ou à la direction.</p></Card>
    </div>
  );
}
