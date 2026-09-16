export function DoctorPortrait({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
      <circle cx="48" cy="48" r="48" fill="#173832" />
      <circle cx="48" cy="48" r="44" fill="#2a5850" />
      <path d="M18 86c6-22 18-32 30-32s24 10 30 32" fill="#e8efe9" />
      <path d="M28 84c5-16 13-24 20-24s15 8 20 24" fill="#f7fbf7" />
      <path d="M33 58c2 10 7 16 15 16s13-6 15-16" fill="#d8c4ae" />
      <ellipse cx="48" cy="46" rx="18" ry="21" fill="#e6c8a8" />
      <path d="M30 44c1-18 10-28 18-28 9 0 18 9 19 26 0 0-6-10-19-10-12 0-18 12-18 12z" fill="#3a2418" />
      <path d="M29 50c-2 6 0 14 4 16 1-6 2-12 2-16H29z" fill="#3a2418" />
      <path d="M67 50c2 6 0 14-4 16-1-6-2-12-2-16h6z" fill="#3a2418" />
      <path d="M40 43c2-1 4-1 5 1" stroke="#2b1810" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M51 44c2-1 4-1 5 1" stroke="#2b1810" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <circle cx="43" cy="47" r="2.1" fill="#2b1810" />
      <circle cx="55" cy="47" r="2.1" fill="#2b1810" />
      <circle cx="42.3" cy="46.3" r="0.7" fill="#fff" />
      <circle cx="54.3" cy="46.3" r="0.7" fill="#fff" />
      <path d="M44 55c2.4 2.4 6.2 2.4 8.4 0" stroke="#b56b5a" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M36 62c8 3 16 3 24 0" stroke="#6fa56a" strokeWidth="3" fill="none" />
      <circle cx="36" cy="62" r="3.2" fill="#6fa56a" stroke="#173832" strokeWidth="1" />
    </svg>
  );
}
