import { PageHead, Card } from '../components/ui';
import { useSession } from '../lib/session';

const ADMIN: [string, string][] = [
  ['Inscrire un élève', 'Élèves → « Inscrire un élève ». Seuls le nom, le prénom, la date de naissance, la classe et un responsable avec téléphone sont obligatoires. Si un parent est déjà enregistré (frère/sœur), saisissez son numéro : l’application propose de le lier.'],
  ['Notes et professeurs', 'Les professeurs saisissent leurs notes dans leur espace. Elles arrivent automatiquement dans Notes / Examens. La direction suit l’avancement, peut corriger, puis verrouille la période.'],
  ['Bulletins', 'Documents → Bulletins : choisissez le modèle, la période, la classe, puis « Imprimer / PDF ». Les appréciations se préparent dans Notes / Examens → Conseil de classe (bouton « Proposer automatiquement »).'],
  ['Badges', 'Documents → Badges : onglets Professeurs, Direction, Personnel, Élèves. Chaque catégorie a ses propres modèles. 9 badges par feuille A4.'],
  ['Paiements', 'Finance → Nouveau → Paiement élève. Le reste à payer est calculé automatiquement ; imprimez le reçu en 2 exemplaires. Annuler un paiement demande un motif, gardé au journal.'],
  ['Relances', 'Finance → Paiements → Relances : choisissez les élèves (ou « Pas relancés depuis 7 jours »), vérifiez le message, puis « Relancer la sélection ». WhatsApp et les SMS s’ouvrent un par un avec le message prêt ; chaque envoi est noté.'],
  ['Accès parent', 'Parents → fiche du parent → « Accès parent » : un code à 4 chiffres est créé. Le parent se connecte avec son numéro de téléphone et ce code, et ne voit que ses enfants.'],
  ['Messagerie', 'Menu → Messagerie : un fil « École » par élève. Les absences, retards et notes de conduite y arrivent automatiquement chez le parent. Au préscolaire et au fondamental, les professeurs échangent aussi avec les parents ; la direction voit ces échanges (onglet « Professeurs ↔ parents »).'],
  ['Organisation des classes', 'Classe → « Équipe & matières » : maître unique, équipe de 2-3 enseignants, un professeur par matière ou co-titulaires. L’application en déduit qui fait l’appel, qui saisit les notes, qui signe le bulletin et qui écrit aux parents.'],
  ['Professeur absent', 'Présences → Personnel → « Absent » : choisissez le remplaçant (les plus libres sont en tête). Il voit les classes du jour sur son accueil et fait l’appel.'],
  ['Sauvegarde', 'Une copie est faite chaque jour sur l’appareil (Paramètres → Données). Pour ne rien perdre si l’appareil est perdu : « Envoyer la sauvegarde » vers WhatsApp ou Google Drive, au moins une fois par semaine.'],
  ['Appel', 'Un appel par jour et par classe. Préscolaire et fondamental : le(s) titulaire(s). Secondaire : le membre du personnel choisi dans la fiche de la classe (« Appel fait par »). La cloche signale chaque jour les classes sans appel.'],
  ['Journal', 'Menu → Journal : toutes les actions importantes, avec l’auteur, l’heure, l’ancienne et la nouvelle valeur (notes modifiées, paiements annulés…). Rien ne peut y être effacé.'],
  ['Rôles', 'Paramètres → Rôles & permissions : créez un rôle (ex. Caissier) et cochez ce qu’il peut voir ou modifier. Puis Paramètres → Utilisateurs pour lui donner un compte.'],
  ['Hors ligne', 'L’application fonctionne sans Internet. Les modifications sont gardées sur l’appareil et envoyées à Firebase dès que la connexion revient.'],
];
const PROF: [string, string][] = [
  ['Saisir des notes', 'Accueil → Saisir des notes → choisissez la classe → le contrôle → « Saisir les notes ». Tapez « abs » pour un absent. Entrée passe à l’élève suivant.'],
  ['Palmarès', 'Après l’enregistrement, le palmarès (rang, moyenne, plus haute, plus basse) est calculé. Vous pouvez l’imprimer ou l’exporter en Excel.'],
  ['Clôturer', 'Quand toutes les notes sont justes, « Clôturer le contrôle ». Seule la direction peut ensuite rouvrir.'],
  ['Appel', 'Faire l’appel : tout le monde est présent par défaut, touchez seulement les absents ou retards puis « Enregistrer l’appel ».'],
];

const PARENT: [string, string][] = [
  ['Messages', 'Les absences, retards et remarques de conduite arrivent ici automatiquement. Vous pouvez répondre à l’école et, au préscolaire et au fondamental, aux professeurs de votre enfant.'],
  ['Bulletins', 'Chaque bulletin apparaît dès que la direction a validé la période. « Télécharger (PDF) » donne le même bulletin que celui remis par l’école.'],
  ['Progrès', 'L’évolution de la moyenne d’une période à l’autre, comparée à la classe, avec les matières en progrès et celles à surveiller.'],
  ['Plusieurs enfants', 'Touchez le prénom de l’enfant en haut de l’écran pour passer de l’un à l’autre.'],
  ['Paiements et reçus', 'Paiements : total de l’année, déjà payé, reste à payer, et chaque reçu à télécharger.'],
  ['Code oublié', 'Demandez un nouveau code au secrétariat. Vous pouvez changer votre code dans Menu → votre nom.'],
];

export default function Help() {
  const session = useSession()!;
  const items = session.isParent ? PARENT : session.isTeacher ? PROF : ADMIN;
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
