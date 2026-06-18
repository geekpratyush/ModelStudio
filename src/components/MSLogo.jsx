/* Model Studio Logo — reusable SVG mark */
export default function MSLogo({ size = 32, className = '' }) {
  const s = size;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="ms-grad-a" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="ms-grad-b" x1="48" y1="0" x2="0" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        <filter id="ms-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Outer hexagon ring */}
      <path
        d="M24 3 L42 13.5 L42 34.5 L24 45 L6 34.5 L6 13.5 Z"
        stroke="url(#ms-grad-a)"
        strokeWidth="2.2"
        fill="none"
        strokeLinejoin="round"
      />

      {/* Inner hexagon */}
      <path
        d="M24 10 L36 17 L36 31 L24 38 L12 31 L12 17 Z"
        fill="url(#ms-grad-a)"
        opacity="0.12"
        strokeLinejoin="round"
      />

      {/* Vertical spine */}
      <line x1="24" y1="10" x2="24" y2="38" stroke="url(#ms-grad-b)" strokeWidth="2" strokeLinecap="round" filter="url(#ms-glow)" />

      {/* Horizontal crossbar */}
      <line x1="12" y1="24" x2="36" y2="24" stroke="url(#ms-grad-a)" strokeWidth="2" strokeLinecap="round" opacity="0.7" />

      {/* Corner connectors — top-left to bottom-right */}
      <line x1="12" y1="17" x2="36" y2="31" stroke="url(#ms-grad-b)" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />

      {/* Corner connectors — top-right to bottom-left */}
      <line x1="36" y1="17" x2="12" y2="31" stroke="url(#ms-grad-a)" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />

      {/* Node dots */}
      <circle cx="24" cy="10" r="2.4" fill="url(#ms-grad-b)" filter="url(#ms-glow)" />
      <circle cx="36" cy="17" r="2" fill="#3b82f6" opacity="0.9" />
      <circle cx="36" cy="31" r="2" fill="#6366f1" opacity="0.9" />
      <circle cx="24" cy="38" r="2.4" fill="url(#ms-grad-a)" filter="url(#ms-glow)" />
      <circle cx="12" cy="31" r="2" fill="#3b82f6" opacity="0.9" />
      <circle cx="12" cy="17" r="2" fill="#22d3ee" opacity="0.9" />

      {/* Center node */}
      <circle cx="24" cy="24" r="3.5" fill="url(#ms-grad-b)" filter="url(#ms-glow)" />
    </svg>
  );
}
