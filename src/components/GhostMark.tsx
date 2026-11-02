export function GhostMark({ size = 42 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" role="img" aria-label="PaperGhost icon">
      <circle cx="64" cy="64" r="58" fill="#172941" stroke="#bfa66e" strokeWidth="3" />
      <path d="M37 87V56c0-19 12-33 27-33s27 14 27 33v31l-11-7-9 9-9-8-13 9z" fill="#f6eedc" />
      <circle cx="55" cy="58" r="5" fill="#172941"/>
      <circle cx="75" cy="58" r="5" fill="#172941"/>
      <path d="M61 73q4 4 8 0" fill="none" stroke="#172941" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}
