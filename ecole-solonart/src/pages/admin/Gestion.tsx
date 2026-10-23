import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, UserRound, Users, BookOpen, ChevronRight, ChevronDown } from 'lucide-react';
import { PageHead, SearchInput } from '../../components/ui';
import { useSession } from '../../lib/session';
import { norm } from '../../lib/format';
import type { ModuleKey } from '../../data/types';

type Link = [string, string, string, ModuleKey];
const SECTIONS: { key: string; title: string; sub: string; icon: typeof Users; tint: string; links: Link[] }[] = [
  { key: 'classes', title: 'Classes', sub: 'Gérer les classes et salles', icon: GraduationCap, tint: 'green', links: [
    ['Liste des classes', 'Voir, rechercher et filtrer', '/classes', 'classes'],
    ['Créer une classe', 'Ajouter une nouvelle classe', '/classes?new=1', 'classes'],
    ['Emploi du temps', 'Consulter par classe', '/emploi-du-temps', 'emploi'],
    ['Affectation des matières', 'Matières, coefficients, professeurs', '/classes', 'classes'],
  ] },
  { key: 'eleves', title: 'Élèves', sub: 'Inscriptions et dossiers', icon: UserRound, tint: 'blue', links: [
    ['Liste des élèves', 'Rechercher et filtrer', '/eleves', 'eleves'],
    ['Inscrire un élève', 'Inscription rapide en un écran', '/inscriptions/rapide', 'inscriptions'],
    ['Importer depuis Excel', 'Liste d’élèves (.xlsx ou .csv)', '/eleves/import', 'inscriptions'],
    ['Photos des élèves', 'Avec l’appareil photo du téléphone', '/eleves/photos', 'eleves'],
    ['Inscriptions en attente', 'Valider les dossiers', '/inscriptions', 'inscriptions'],
    ['Parents / responsables', 'Gérer les contacts', '/parents', 'parents'],
    ['Présences', 'Appel et absences', '/presences', 'presences'],
    ['Badges élèves', 'Cartes d’identité scolaires', '/documents/badges?type=eleve', 'documents'],
  ] },
  { key: 'personnel', title: 'Personnel', sub: 'Professeurs et employés', icon: Users, tint: 'orange', links: [
    ['Liste des professeurs', 'Rechercher et filtrer', '/personnel', 'personnel'],
    ['Liste du personnel', 'Employés administratifs', '/personnel?tab=personnel', 'personnel'],
    ['Créer un membre', 'Nouveau professeur ou employé', '/personnel?new=1', 'personnel'],
    ['Salaires', 'Paiement du personnel', '/finance?tab=salaires', 'finance'],
    ['Badges du personnel', 'Professeurs et direction', '/documents/badges', 'documents'],
    ['Utilisateurs & rôles', 'Accès à l’application', '/parametres?tab=utilisateurs', 'utilisateurs'],
  ] },
  { key: 'scolarite', title: 'Scolarité', sub: 'Notes, bulletins et matières', icon: BookOpen, tint: 'violet', links: [
    ['Notes / Examens', 'Évaluations et saisie', '/notes', 'notes'],
    ['Verrouillage des notes', 'Clôturer une période', '/notes?tab=periodes', 'notes'],
    ['Génération des bulletins', 'Par étape ou annuel', '/documents/bulletins', 'documents'],
    ['Statistiques scolaires', 'Résultats et moyennes', '/rapports', 'rapports'],
    ['Matières & coefficients', 'Paramètres de scolarité', '/parametres?tab=scolarite', 'parametres'],
  ] },
];

export default function Gestion() {
  const nav = useNavigate();
  const session = useSession()!;
  const [open, setOpen] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const filtered = SECTIONS.map((s) => ({ ...s, links: s.links.filter((l) => session.can(l[3]) && (!q || norm(l[0] + l[1]).includes(norm(q)))) })).filter((s) => s.links.length);
  return (
    <>
      <PageHead title="Gestion" sub="Classes, élèves, personnel et scolarité." />
      <div className="mb-16"><SearchInput value={q} onChange={setQ} placeholder="Rechercher..." /></div>
      <div className="stack" style={{ gap: 12 }}>
        {filtered.map((s) => {
          const isOpen = open === s.key || !!q;
          return (
            <div key={s.key} className="card">
              <button className="list-item" style={{ width: '100%', border: 0, borderRadius: 14, textAlign: 'left' }} onClick={() => setOpen(isOpen ? null : s.key)}>
                <div className={`tint-${s.tint}`} style={{ width: 46, height: 46, borderRadius: 12, display: 'grid', placeItems: 'center' }}><s.icon size={24} /></div>
                <div className="grow"><div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 15.5 }}>{s.title}</div><div className="small muted">{s.sub}</div></div>
                {isOpen ? <ChevronDown className="chev" /> : <ChevronRight className="chev" />}
              </button>
              {isOpen && (
                <div className="list" style={{ borderTop: '1px solid var(--line-2)' }}>
                  {s.links.map((l) => (
                    <button key={l[0]} className="list-item" style={{ border: 0, width: '100%', textAlign: 'left', paddingLeft: 72 }} onClick={() => nav(l[2])}>
                      <div className="grow"><div style={{ fontWeight: 500, color: 'var(--ink)' }}>{l[0]}</div><div className="tiny muted">{l[1]}</div></div>
                      <ChevronRight className="chev" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
