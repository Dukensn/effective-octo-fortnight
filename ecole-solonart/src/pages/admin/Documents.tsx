import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, IdCard, ScrollText, ChevronRight, Printer, BadgeCheck } from 'lucide-react';
import { db, useCollection } from '../../data/store';
import { PageHead, Card, Field, SearchInput, Avatar, Modal, toast } from '../../components/ui';
import { fullName, norm, dateLong, todayISO, civ } from '../../lib/format';
import { printDocument } from '../../lib/print';
import { A4 } from '../../docs/Sheets';
import { Signature, QR } from '../../docs/common';
import type { Staff, Student } from '../../data/types';

export default function Documents() {
  const nav = useNavigate();
  const [cert, setCert] = useState<'scolarite' | 'travail' | null>(null);
  const tiles = [
    { icon: <FileText />, tint: 'blue', title: 'Bulletins scolaires', sub: 'Tripliables 6 thèmes, annuels /20 et /100, livret avec dos. Individuel ou par classe.', go: () => nav('/documents/bulletins') },
    { icon: <IdCard />, tint: 'green', title: 'Badges', sub: 'Professeurs, direction, personnel et élèves — modèles distincts, 9 par feuille.', go: () => nav('/documents/badges') },
    { icon: <ScrollText />, tint: 'violet', title: 'Certificat de scolarité', sub: 'Attestation qu’un élève est inscrit pour l’année en cours.', go: () => setCert('scolarite') },
    { icon: <BadgeCheck />, tint: 'orange', title: 'Attestation de travail', sub: 'Pour un membre du personnel.', go: () => setCert('travail') },
  ];
  return (
    <>
      <PageHead title="Documents" sub="Générez les documents officiels de l’école : bulletins, badges, certificats." />
      <div className="grid g-2">
        {tiles.map((t) => (
          <button key={t.title} className="card card-pad row" style={{ textAlign: 'left', gap: 16 }} onClick={t.go}>
            <span className={`tint-${t.tint}`} style={{ width: 54, height: 54, borderRadius: 14, display: 'grid', placeItems: 'center', flex: 'none' }}>{t.icon}</span>
            <span className="grow"><b style={{ color: 'var(--ink)', fontSize: 16 }}>{t.title}</b><br /><span className="small muted">{t.sub}</span></span>
            <ChevronRight className="chev" />
          </button>
        ))}
      </div>
      <Card title="Modèles personnalisables" className="mt-16">
        <p className="small muted">Le logo, la signature du directeur et le cachet de l’école apparaissent automatiquement sur tous les documents. Importez-les dans <a onClick={() => nav('/parametres')} style={{ cursor: 'pointer' }}>Paramètres → École</a>.</p>
      </Card>
      {cert && <CertificateModal kind={cert} onClose={() => setCert(null)} />}
    </>
  );
}

function CertificateModal({ kind, onClose }: { kind: 'scolarite' | 'travail'; onClose: () => void }) {
  const students = useCollection('students').filter((s) => s.statut === 'Actif');
  const staff = useCollection('staff').filter((s) => s.statut === 'Actif');
  const [q, setQ] = useState('');
  const list = (kind === 'scolarite' ? students : staff).filter((p) => q.length >= 2 && norm(`${p.prenom} ${p.nom} ${p.matricule}`).includes(norm(q))).slice(0, 8);
  const print = (p: Student | Staff) => {
    printDocument(kind === 'scolarite' ? <Certificate s={p as Student} /> : <WorkCertificate s={p as Staff} />, 'A4 portrait', `Certificat ${fullName(p)}`);
    toast('Certificat prêt');
    onClose();
  };
  return (
    <Modal open onClose={onClose} title={kind === 'scolarite' ? 'Certificat de scolarité' : 'Attestation de travail'}>
      <Field label={kind === 'scolarite' ? 'Élève' : 'Membre du personnel'}><SearchInput value={q} onChange={setQ} placeholder="Nom ou matricule..." /></Field>
      <div className="list mt-8">{list.map((p) => <button key={p.id} className="list-item" style={{ border: 0, width: '100%', textAlign: 'left' }} onClick={() => print(p)}><Avatar src={p.photo} name={fullName(p)} size={32} /><span className="grow">{fullName(p)}<br /><span className="tiny muted">{p.matricule}</span></span><Printer size={16} /></button>)}</div>
    </Modal>
  );
}

function Certificate({ s }: { s: Student }) {
  const school = db.get('school', 'main')!;
  const c = db.get('classes', s.classeId);
  const y = db.get('years', school.anneeCourante);
  return (
    <div className="print-page">
      <A4 title="CERTIFICAT DE SCOLARITÉ" sub={`N° CS-${s.matricule}`}>
        <div style={{ fontSize: 14, lineHeight: 2, marginTop: 30 }}>
          <p>Je soussigné, <b>{school.directeur}</b>, Directeur de l’<b>{school.nom}</b>, sise à {school.adresse}, {school.commune}, certifie que :</p>
          <p style={{ textAlign: 'center', fontSize: 20, fontWeight: 800, color: '#0d2a63', margin: '20px 0' }}>{s.prenom} {s.nom.toUpperCase()}</p>
          <p>né{s.sexe === 'F' ? 'e' : ''} le <b>{dateLong(s.dateNaissance)}</b> à <b>{s.lieuNaissance}</b>, matricule <b>{s.matricule}</b>, est régulièrement inscrit{s.sexe === 'F' ? 'e' : ''} dans notre établissement en classe de <b>{c?.nom}</b> pour l’année scolaire <b>{y?.libelle}</b>.</p>
          <p>En foi de quoi, le présent certificat lui est délivré pour servir et valoir ce que de droit.</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 50 }}>
          <QR text={`${school.siteWeb}/verifier?m=${s.matricule}`} size={80} />
          <div style={{ textAlign: 'center', fontSize: 12 }}>Fait à {school.commune}, le {dateLong(todayISO())}<br /><Signature image={school.signatureDirecteur} w={150} /><br /><b>{school.directeur}</b><br />Directeur</div>
        </div>
      </A4>
    </div>
  );
}

function WorkCertificate({ s }: { s: Staff }) {
  const school = db.get('school', 'main')!;
  return (
    <div className="print-page">
      <A4 title="ATTESTATION DE TRAVAIL" sub={`Réf. AT-${s.matricule}`}>
        <div style={{ fontSize: 14, lineHeight: 2, marginTop: 30 }}>
          <p>Je soussigné, <b>{school.directeur}</b>, Directeur de l’<b>{school.nom}</b>, atteste que <b>{civ(s)}</b>, matricule <b>{s.matricule}</b>, occupe le poste de <b>{s.poste}{s.specialite ? ` (${s.specialite})` : ''}</b> au sein de notre établissement depuis le <b>{dateLong(s.dateEmbauche)}</b>.</p>
          <p>Cette attestation est délivrée à l’intéressé{s.sexe === 'F' ? 'e' : ''} pour servir et valoir ce que de droit.</p>
        </div>
        <div style={{ textAlign: 'right', fontSize: 12, marginTop: 60 }}>Fait à {school.commune}, le {dateLong(todayISO())}<br /><Signature image={school.signatureDirecteur} w={150} /><br /><b>{school.directeur}</b></div>
      </A4>
    </div>
  );
}
