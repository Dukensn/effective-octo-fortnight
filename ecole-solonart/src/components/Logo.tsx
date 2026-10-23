import { useDoc } from '../data/store';

/** Écusson par défaut (bouclier, livre ouvert, flambeau). Remplacé par le logo importé dans Paramètres. */
export function DefaultCrest({ size = 44, mono }: { size?: number; mono?: string }) {
  const navy = mono ?? '#0b2559';
  const gold = mono ? mono : '#e9b949';
  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 100 110" aria-hidden="true">
      <path d="M50 3 92 16v34c0 27-18 47-42 57C26 97 8 77 8 50V16Z" fill={gold} />
      <path d="M50 10 85 21v29c0 23-15 40-35 49C30 90 15 73 15 50V21Z" fill={navy} />
      <path d="M50 26c-3 4-5 7-5 10a5 5 0 0 0 10 0c0-3-2-6-5-10Z" fill={mono ? '#fff' : '#f6a821'} />
      <rect x="47" y="40" width="6" height="12" rx="1.5" fill={mono ? '#fff' : '#e9b949'} />
      <path d="M24 56c9-3 18-2 26 3 8-5 17-6 26-3v26c-9-3-18-2-26 3-8-5-17-6-26-3Z" fill="#fff" />
      <path d="M50 59v26" stroke={navy} strokeWidth="2" />
      <path d="M29 63c6-1.5 11-1 16 1.5M29 69c6-1.5 11-1 16 1.5M29 75c6-1.5 11-1 16 1.5M55 64.5c5-2.5 10-3 16-1.5M55 70.5c5-2.5 10-3 16-1.5M55 76.5c5-2.5 10-3 16-1.5" stroke="#9fb2d8" strokeWidth="1.6" fill="none" />
    </svg>
  );
}

export function SchoolLogo({ size = 44, mono, className }: { size?: number; mono?: string; className?: string }) {
  const school = useDoc('school', 'main');
  if (school?.logo) return <img src={school.logo} alt="Logo" className={className} style={{ width: size, height: size * 1.1, objectFit: 'contain' }} />;
  return <DefaultCrest size={size} mono={mono} />;
}
