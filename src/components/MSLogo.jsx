/* Model Studio — M glyph drawn as a node graph */
export default function MSLogo({ size = 32, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Model Studio"
    >
      {/* The letter M traced as a node-edge diagram */}
      <polyline
        points="7,42 7,6 24,26 41,6 41,42"
        stroke="#3b82f6"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Nodes at each vertex — the "diagram" metaphor */}
      <circle cx="7"  cy="6"  r="3.6" fill="#3b82f6" />
      <circle cx="7"  cy="42" r="3.6" fill="#3b82f6" />
      <circle cx="24" cy="26" r="3.6" fill="#3b82f6" />
      <circle cx="41" cy="6"  r="3.6" fill="#3b82f6" />
      <circle cx="41" cy="42" r="3.6" fill="#3b82f6" />
    </svg>
  );
}
