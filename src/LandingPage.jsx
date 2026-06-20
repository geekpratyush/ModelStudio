import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowRight, Code2, Layers, Workflow, Pencil,
  Download, Boxes, Zap, Shield, Network,
  ChevronLeft, ChevronRight, Share2, Bot, Palette,
} from 'lucide-react';
import MSLogo from './components/MSLogo';
import './LandingPage.css';

/* ── Social icons ─────────────────────────────────────────────── */
const GitHubIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 -0.5 25 25" fill="currentColor">
    <path d="m12.301 0h.093c2.242 0 4.34.613 6.137 1.68l-.055-.031c1.871 1.094 3.386 2.609 4.449 4.422l.031.058c1.04 1.769 1.654 3.896 1.654 6.166 0 5.406-3.483 10-8.327 11.658l-.087.026c-.063.02-.135.031-.209.031-.162 0-.312-.054-.433-.144l.002.001c-.128-.115-.208-.281-.208-.466 0-.005 0-.01 0-.014v.001q0-.048.008-1.226t.008-2.154c.007-.075.011-.161.011-.249 0-.792-.323-1.508-.844-2.025.618-.061 1.176-.163 1.718-.305l-.076.017c.573-.16 1.073-.373 1.537-.642l-.031.017c.508-.28.938-.636 1.292-1.058l.006-.007c.372-.476.663-1.036.84-1.645l.009-.035c.209-.683.329-1.468.329-2.281 0-.045 0-.091-.001-.136v.007c0-.022.001-.047.001-.072 0-1.248-.482-2.383-1.269-3.23l.003.003c.168-.44.265-.948.265-1.479 0-.649-.145-1.263-.404-1.814l.011.026c-.115-.022-.246-.035-.381-.035-.334 0-.649.078-.929.216l.012-.005c-.568.21-1.054.448-1.512.726l.038-.022-.609.384c-.922-.264-1.981-.416-3.075-.416s-2.153.152-3.157.436l.081-.02q-.256-.176-.681-.433c-.373-.214-.814-.421-1.272-.595l-.066-.022c-.293-.154-.64-.244-1.009-.244-.124 0-.246.01-.364.03l.013-.002c-.248.524-.393 1.139-.393 1.788 0 .531.097 1.04.275 1.509l-.01-.029c-.785.844-1.266 1.979-1.266 3.227 0 .025 0 .051.001.076v-.004c-.001.039-.001.084-.001.13 0 .809.12 1.591.344 2.327l-.015-.057c.189.643.476 1.202.85 1.693l-.009-.013c.354.435.782.793 1.267 1.062l.022.011c.432.252.933.465 1.46.614l.046.011c.466.125 1.024.227 1.595.284l.046.004c-.431.428-.718 1-.784 1.638l-.001.012c-.207.101-.448.183-.699.236l-.021.004c-.256.051-.549.08-.85.08h-.066c-.394-.008-.756-.136-1.055-.348l.006.004c-.371-.259-.671-.595-.881-.986l-.007-.015c-.198-.336-.459-.614-.768-.827l-.009-.006c-.225-.169-.49-.301-.776-.38l-.016-.004-.32-.048c-.023-.002-.05-.003-.077-.003-.14 0-.273.028-.394.077l.007-.003q-.128.072-.08.184c.039.086.087.16.145.225l-.001-.001c.061.072.13.135.205.19l.003.002.112.08c.283.148.516.354.693.603l.004.006c.191.237.359.505.494.792l.01.024.16.368c.135.402.38.738.7.981l.005.004c.3.234.662.402 1.057.478l.016.002c.33.064.714.104 1.106.112h.007c.045.002.097.002.15.002.261 0 .517-.021.767-.062l-.027.004.368-.064q0 .609.008 1.418t.008.873v.014c0 .185-.08.351-.208.466h-.001c-.119.089-.268.143-.431.143-.075 0-.147-.011-.214-.032l.005.001c-4.929-1.689-8.409-6.283-8.409-11.69 0-2.268.612-4.393 1.681-6.219l-.032.058c1.094-1.871 2.609-3.386 4.422-4.449l.058-.031c1.739-1.034 3.835-1.645 6.073-1.645h.098z" />
  </svg>
);
const LinkedInIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);


/* ── useScrollReveal ──────────────────────────────────────────── */
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('revealed');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ── Demo SVG components ──────────────────────────────────────── */
const nc = (count, n) => count >= n ? 'node-pop' : 'node-hidden';
const ec = (count, n) => count >= n ? 'edge-draw' : 'node-hidden';

function FlowchartSVG({ count }) {
  return (
    <svg viewBox="0 0 380 170" fill="none" style={{ width:'100%', height:'100%', padding:'8px' }}>
      <defs>
        <marker id="fa1" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6Z" fill="#60a5fa"/></marker>
        <marker id="fa2" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6Z" fill="#34d399"/></marker>
        <marker id="fa3" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6Z" fill="#fbbf24"/></marker>
      </defs>
      {/* U node */}
      <g className={nc(count,2)}>
        <rect x="8" y="73" width="66" height="28" rx="6" fill="#3b82f620" stroke="#3b82f6" strokeWidth="1.2"/>
        <text x="41" y="91" textAnchor="middle" fontSize="9" fill="#93c5fd" fontWeight="600">👤 User</text>
      </g>
      {/* U→GW arrow */}
      <line className={ec(count,2)} x1="74" y1="87" x2="105" y2="87" stroke="#60a5fa" strokeWidth="1.5" pathLength="1" markerEnd="url(#fa1)"/>
      {/* GW node */}
      <g className={nc(count,2)}>
        <rect x="106" y="73" width="84" height="28" rx="6" fill="#8b5cf620" stroke="#8b5cf6" strokeWidth="1.2"/>
        <text x="148" y="91" textAnchor="middle" fontSize="9" fill="#c4b5fd" fontWeight="600">API Gateway</text>
      </g>
      {/* GW→Auth arrow */}
      <path className={ec(count,3)} d="M192,80 Q210,80 215,58" stroke="#60a5fa" strokeWidth="1.5" fill="none" pathLength="1" markerEnd="url(#fa1)"/>
      {/* Auth node */}
      <g className={nc(count,3)}>
        <rect x="216" y="38" width="68" height="28" rx="6" fill="#10b98120" stroke="#10b981" strokeWidth="1.2"/>
        <text x="250" y="56" textAnchor="middle" fontSize="9" fill="#6ee7b7" fontWeight="600">Auth</text>
      </g>
      {/* GW→Orders arrow */}
      <path className={ec(count,4)} d="M192,94 Q210,94 215,116" stroke="#60a5fa" strokeWidth="1.5" fill="none" pathLength="1" markerEnd="url(#fa1)"/>
      {/* Orders node */}
      <g className={nc(count,4)}>
        <rect x="216" y="108" width="68" height="28" rx="6" fill="#ec489920" stroke="#ec4899" strokeWidth="1.2"/>
        <text x="250" y="126" textAnchor="middle" fontSize="9" fill="#f9a8d4" fontWeight="600">Orders</text>
      </g>
      {/* Auth→DB1 arrow */}
      <line className={ec(count,5)} x1="284" y1="52" x2="308" y2="52" stroke="#34d399" strokeWidth="1.5" pathLength="1" markerEnd="url(#fa2)"/>
      {/* DB1 */}
      <g className={nc(count,5)}>
        <ellipse cx="335" cy="52" rx="30" ry="15" fill="#34d39920" stroke="#34d399" strokeWidth="1.2"/>
        <ellipse cx="335" cy="46" rx="30" ry="8" fill="#34d39930" stroke="#34d399" strokeWidth="1"/>
        <text x="335" y="56" textAnchor="middle" fontSize="7.5" fill="#6ee7b7">Users DB</text>
      </g>
      {/* Orders→DB2 arrow */}
      <line className={ec(count,6)} x1="284" y1="122" x2="308" y2="122" stroke="#fbbf24" strokeWidth="1.5" pathLength="1" markerEnd="url(#fa3)"/>
      {/* DB2 */}
      <g className={nc(count,6)}>
        <ellipse cx="335" cy="122" rx="30" ry="15" fill="#f59e0b20" stroke="#f59e0b" strokeWidth="1.2"/>
        <ellipse cx="335" cy="116" rx="30" ry="8" fill="#f59e0b30" stroke="#f59e0b" strokeWidth="1"/>
        <text x="335" y="126" textAnchor="middle" fontSize="7.5" fill="#fbbf24">Orders DB</text>
      </g>
    </svg>
  );
}

function SequenceSVG({ count }) {
  const cols = [48, 142, 236, 330];
  const colors = ['#3b82f6','#8b5cf6','#10b981','#f59e0b'];
  const labels = ['User','Frontend','Backend','Database'];
  const msgs = [
    [0,1,68,'login(creds)','solid',2],
    [1,2,88,'POST /auth','solid',3],
    [2,3,108,'SELECT user','solid',4],
    [3,2,128,'user row','dashed',5],
    [2,1,148,'JWT token','dashed',6],
    [1,0,168,'✅ Welcome!','dashed',7],
  ];
  return (
    <svg viewBox="0 0 380 185" fill="none" style={{ width:'100%', height:'100%', padding:'6px' }}>
      <defs>
        <marker id="sa1" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5Z" fill="#60a5fa"/></marker>
        <marker id="sa2" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5Z" fill="#a5b4fc"/></marker>
      </defs>
      {/* Actor boxes */}
      {cols.map((x, i) => (
        <g key={i} className={nc(count, 1)}>
          <rect x={x-32} y={8} width={64} height={22} rx="5" fill={`${colors[i]}20`} stroke={colors[i]} strokeWidth="1.2"/>
          <text x={x} y={23} textAnchor="middle" fontSize="8.5" fill={colors[i]} fontWeight="600">{labels[i]}</text>
          <line x1={x} y1={30} x2={x} y2={175} stroke={colors[i]} strokeWidth="0.8" strokeDasharray="3 3" opacity="0.35"/>
        </g>
      ))}
      {/* Messages */}
      {msgs.map(([from, to, y, lbl, style, revealAt]) => {
        const x1 = cols[from], x2 = cols[to];
        const isDashed = style === 'dashed';
        return (
          <g key={y} className={ec(count, revealAt)}>
            <line
              x1={x1} y1={y} x2={x2} y2={y}
              stroke={isDashed ? '#a5b4fc' : '#60a5fa'}
              strokeWidth="1.2"
              strokeDasharray={isDashed ? '4 2' : undefined}
              pathLength="1"
              markerEnd={`url(#${isDashed ? 'sa2' : 'sa1'})`}
            />
            <text
              x={(x1+x2)/2} y={y-4}
              textAnchor="middle" fontSize="7" fill="#94a3b8"
            >{lbl}</text>
          </g>
        );
      })}
    </svg>
  );
}

function C4SVG({ count }) {
  return (
    <svg viewBox="0 0 380 185" fill="none" style={{ width:'100%', height:'100%', padding:'8px' }}>
      <defs>
        <marker id="ca1" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5Z" fill="#10b981"/></marker>
      </defs>
      {/* Customer Person */}
      <g className={nc(count, 3)}>
        <circle cx="36" cy="68" r="12" fill="#3b82f620" stroke="#3b82f6" strokeWidth="1.2"/>
        <line x1="36" y1="80" x2="36" y2="105" stroke="#3b82f6" strokeWidth="1.2"/>
        <line x1="20" y1="90" x2="52" y2="90" stroke="#3b82f6" strokeWidth="1.2"/>
        <line x1="36" y1="105" x2="22" y2="120" stroke="#3b82f6" strokeWidth="1.2"/>
        <line x1="36" y1="105" x2="50" y2="120" stroke="#3b82f6" strokeWidth="1.2"/>
        <text x="36" y="135" textAnchor="middle" fontSize="8" fill="#93c5fd" fontWeight="600">Customer</text>
      </g>
      {/* Platform Boundary */}
      <g className={nc(count, 4)}>
        <rect x="80" y="12" width="260" height="158" rx="8" fill="#1e293b30" stroke="#475569" strokeWidth="1.2" strokeDasharray="6 3"/>
        <text x="210" y="28" textAnchor="middle" fontSize="8" fill="#64748b" fontWeight="600">Platform Boundary</text>
      </g>
      {/* SPA */}
      <g className={nc(count, 5)}>
        <rect x="90" y="35" width="105" height="38" rx="5" fill="#3b82f620" stroke="#3b82f6" strokeWidth="1.2"/>
        <text x="143" y="55" textAnchor="middle" fontSize="8.5" fill="#93c5fd" fontWeight="600">React SPA</text>
        <text x="143" y="66" textAnchor="middle" fontSize="6.5" fill="#64748b">TypeScript</text>
      </g>
      {/* API */}
      <g className={nc(count, 6)}>
        <rect x="90" y="88" width="105" height="38" rx="5" fill="#10b98120" stroke="#10b981" strokeWidth="1.2"/>
        <text x="143" y="108" textAnchor="middle" fontSize="8.5" fill="#6ee7b7" fontWeight="600">Node API</text>
        <text x="143" y="119" textAnchor="middle" fontSize="6.5" fill="#64748b">Express</text>
      </g>
      {/* DB */}
      <g className={nc(count, 7)}>
        <rect x="225" y="60" width="105" height="50" rx="5" fill="#f59e0b20" stroke="#f59e0b" strokeWidth="1.2"/>
        <text x="278" y="83" textAnchor="middle" fontSize="8.5" fill="#fbbf24" fontWeight="600">PostgreSQL</text>
        <text x="278" y="96" textAnchor="middle" fontSize="6.5" fill="#64748b">Database</text>
      </g>
      {/* Customer → SPA */}
      <g className={ec(count, 9)}>
        <line x1="68" y1="75" x2="90" y2="55" stroke="#10b981" strokeWidth="1.2" pathLength="1" markerEnd="url(#ca1)"/>
        <text x="74" y="62" fontSize="6.5" fill="#94a3b8">HTTPS</text>
      </g>
      {/* SPA → API */}
      <line className={ec(count,10)} x1="143" y1="73" x2="143" y2="88" stroke="#10b981" strokeWidth="1.2" pathLength="1" markerEnd="url(#ca1)"/>
      {/* API → DB */}
      <line className={ec(count,11)} x1="195" y1="107" x2="225" y2="92" stroke="#10b981" strokeWidth="1.2" pathLength="1" markerEnd="url(#ca1)"/>
    </svg>
  );
}

function StateSVG({ count }) {
  return (
    <svg viewBox="0 0 380 185" fill="none" style={{ width:'100%', height:'100%', padding:'8px' }}>
      <defs>
        <marker id="sta1" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5Z" fill="#60a5fa"/></marker>
        <marker id="sta2" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5Z" fill="#22c55e"/></marker>
        <marker id="sta3" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5Z" fill="#ef4444"/></marker>
      </defs>
      {/* Start dot */}
      <g className={nc(count,2)}>
        <circle cx="190" cy="16" r="7" fill="#60a5fa"/>
        <circle cx="190" cy="16" r="10" stroke="#60a5fa" strokeWidth="1" fill="none"/>
      </g>
      {/* Start→Idle */}
      <line className={ec(count,2)} x1="190" y1="26" x2="190" y2="42" stroke="#60a5fa" strokeWidth="1.2" pathLength="1" markerEnd="url(#sta1)"/>
      {/* Idle */}
      <g className={nc(count,2)}>
        <rect x="150" y="43" width="80" height="26" rx="13" fill="#3b82f620" stroke="#3b82f6" strokeWidth="1.2"/>
        <text x="190" y="60" textAnchor="middle" fontSize="9" fill="#93c5fd" fontWeight="600">Idle</text>
      </g>
      {/* Idle→Loading */}
      <g className={ec(count,3)}>
        <line x1="190" y1="69" x2="190" y2="88" stroke="#60a5fa" strokeWidth="1.2" pathLength="1" markerEnd="url(#sta1)"/>
        <text x="196" y="82" fontSize="7" fill="#94a3b8">submit()</text>
      </g>
      {/* Loading */}
      <g className={nc(count,3)}>
        <rect x="143" y="89" width="94" height="26" rx="13" fill="#f59e0b20" stroke="#f59e0b" strokeWidth="1.2"/>
        <text x="190" y="106" textAnchor="middle" fontSize="9" fill="#fbbf24" fontWeight="600">Loading</text>
      </g>
      {/* Loading→Success */}
      <g className={ec(count,4)}>
        <path d="M163,115 Q120,130 108,148" stroke="#22c55e" strokeWidth="1.2" fill="none" pathLength="1" markerEnd="url(#sta2)"/>
        <text x="117" y="135" fontSize="7" fill="#94a3b8">200 OK</text>
      </g>
      {/* Success */}
      <g className={nc(count,4)}>
        <rect x="60" y="149" width="90" height="26" rx="13" fill="#22c55e20" stroke="#22c55e" strokeWidth="1.2"/>
        <text x="105" y="166" textAnchor="middle" fontSize="9" fill="#4ade80" fontWeight="600">Success</text>
      </g>
      {/* Loading→Error */}
      <g className={ec(count,5)}>
        <path d="M217,115 Q260,130 272,148" stroke="#ef4444" strokeWidth="1.2" fill="none" pathLength="1" markerEnd="url(#sta3)"/>
        <text x="255" y="135" fontSize="7" fill="#94a3b8">4xx/5xx</text>
      </g>
      {/* Error */}
      <g className={nc(count,5)}>
        <rect x="230" y="149" width="90" height="26" rx="13" fill="#ef444420" stroke="#ef4444" strokeWidth="1.2"/>
        <text x="275" y="166" textAnchor="middle" fontSize="9" fill="#fca5a5" fontWeight="600">Error</text>
      </g>
      {/* Success→Idle */}
      <g className={ec(count,6)}>
        <path d="M60,162 Q28,90 150,56" stroke="#22c55e" strokeWidth="1.2" fill="none" strokeDasharray="4 2" pathLength="1" markerEnd="url(#sta2)"/>
        <text x="38" y="105" fontSize="7" fill="#94a3b8">reset()</text>
      </g>
      {/* Error→Idle */}
      <g className={ec(count,7)}>
        <path d="M320,162 Q352,90 230,56" stroke="#ef4444" strokeWidth="1.2" fill="none" strokeDasharray="4 2" pathLength="1" markerEnd="url(#sta3)"/>
        <text x="328" y="105" fontSize="7" fill="#94a3b8">retry()</text>
      </g>
    </svg>
  );
}

/* ── Demo data ─────────────────────────────────────────────────── */
const DEMOS = [
  {
    label: 'flowchart.mmd',
    color: '#3b82f6',
    lines: [
      [{ t:'flowchart ', c:'#8b5cf6' }, { t:'LR', c:'#f59e0b' }],
      [{ t:'  U', c:'#e2e8f0' }, { t:'["👤 User"]', c:'#34d399' }, { t:' --> ', c:'#60a5fa' }, { t:'GW', c:'#e2e8f0' }],
      [{ t:'  GW', c:'#e2e8f0' }, { t:'["API Gateway"]', c:'#34d399' }, { t:' --> ', c:'#60a5fa' }, { t:'Auth', c:'#e2e8f0' }],
      [{ t:'  GW', c:'#e2e8f0' }, { t:' --> ', c:'#60a5fa' }, { t:'Orders', c:'#e2e8f0' }],
      [{ t:'  Auth', c:'#e2e8f0' }, { t:' --> ', c:'#60a5fa' }, { t:'DB1', c:'#fbbf24' }, { t:'[(Users DB)]', c:'#fbbf24' }],
      [{ t:'  Orders', c:'#e2e8f0' }, { t:' --> ', c:'#60a5fa' }, { t:'DB2', c:'#fbbf24' }, { t:'[(Orders DB)]', c:'#fbbf24' }],
    ],
    SVG: FlowchartSVG,
  },
  {
    label: 'sequence.mmd',
    color: '#8b5cf6',
    lines: [
      [{ t:'sequenceDiagram', c:'#8b5cf6' }],
      [{ t:'  actor ', c:'#60a5fa' }, { t:'User', c:'#e2e8f0' }],
      [{ t:'  User', c:'#3b82f6' }, { t:'->>Frontend: ', c:'#60a5fa' }, { t:'login(creds)', c:'#34d399' }],
      [{ t:'  Frontend', c:'#8b5cf6' }, { t:'->>Backend: ', c:'#60a5fa' }, { t:'POST /auth', c:'#34d399' }],
      [{ t:'  Backend', c:'#10b981' }, { t:'->>Database: ', c:'#60a5fa' }, { t:'SELECT user', c:'#34d399' }],
      [{ t:'  Database', c:'#f59e0b' }, { t:'-->>Backend: ', c:'#a5b4fc' }, { t:'user row', c:'#94a3b8' }],
      [{ t:'  Backend', c:'#10b981' }, { t:'-->>Frontend: ', c:'#a5b4fc' }, { t:'JWT token', c:'#94a3b8' }],
      [{ t:'  Frontend', c:'#8b5cf6' }, { t:'-->>User: ', c:'#a5b4fc' }, { t:'✅ Welcome!', c:'#4ade80' }],
    ],
    SVG: SequenceSVG,
  },
  {
    label: 'c4container.mmd',
    color: '#10b981',
    lines: [
      [{ t:'C4Container', c:'#10b981' }],
      [{ t:'  title ', c:'#64748b' }, { t:'E-Commerce Platform', c:'#fbbf24' }],
      [{ t:'  Person', c:'#60a5fa' }, { t:'(u, ', c:'#94a3b8' }, { t:'"Customer"', c:'#34d399' }, { t:')', c:'#94a3b8' }],
      [{ t:'  Container_Boundary', c:'#60a5fa' }, { t:'(p, "Platform") {', c:'#94a3b8' }],
      [{ t:'    Container', c:'#3b82f6' }, { t:'(spa, "React SPA", "TypeScript")', c:'#94a3b8' }],
      [{ t:'    Container', c:'#10b981' }, { t:'(api, "Node API", "Express")', c:'#94a3b8' }],
      [{ t:'    ContainerDb', c:'#f59e0b' }, { t:'(db, "PostgreSQL")', c:'#94a3b8' }],
      [{ t:'  }', c:'#94a3b8' }],
      [{ t:'  Rel', c:'#60a5fa' }, { t:'(u, spa, "Uses", "HTTPS")', c:'#94a3b8' }],
      [{ t:'  Rel', c:'#60a5fa' }, { t:'(spa, api, "Calls", "REST")', c:'#94a3b8' }],
      [{ t:'  Rel', c:'#60a5fa' }, { t:'(api, db, "Reads/Writes")', c:'#94a3b8' }],
    ],
    SVG: C4SVG,
  },
  {
    label: 'statemachine.mmd',
    color: '#f59e0b',
    lines: [
      [{ t:'stateDiagram-v2', c:'#f59e0b' }],
      [{ t:'  [*] ', c:'#94a3b8' }, { t:'--> ', c:'#60a5fa' }, { t:'Idle', c:'#e2e8f0' }],
      [{ t:'  Idle ', c:'#e2e8f0' }, { t:'--> ', c:'#60a5fa' }, { t:'Loading', c:'#fbbf24' }, { t:': submit()', c:'#94a3b8' }],
      [{ t:'  Loading ', c:'#fbbf24' }, { t:'--> ', c:'#60a5fa' }, { t:'Success', c:'#4ade80' }, { t:': 200 OK', c:'#94a3b8' }],
      [{ t:'  Loading ', c:'#fbbf24' }, { t:'--> ', c:'#60a5fa' }, { t:'Error', c:'#fca5a5' }, { t:': 4xx/5xx', c:'#94a3b8' }],
      [{ t:'  Success ', c:'#4ade80' }, { t:'--> ', c:'#60a5fa' }, { t:'Idle', c:'#e2e8f0' }, { t:': reset()', c:'#94a3b8' }],
      [{ t:'  Error ', c:'#fca5a5' }, { t:'--> ', c:'#60a5fa' }, { t:'Idle', c:'#e2e8f0' }, { t:': retry()', c:'#94a3b8' }],
    ],
    SVG: StateSVG,
  },
];

/* ── HeroCycler ────────────────────────────────────────────────── */
function HeroCycler() {
  const [demoIdx, setDemoIdx] = useState(0);
  const [revealedCount, setRevealedCount] = useState(0);
  const [phase, setPhase] = useState('typing');
  const demo = DEMOS[demoIdx];
  const { SVG } = demo;

  useEffect(() => {
    let t;
    if (phase === 'typing') {
      if (revealedCount < demo.lines.length) {
        t = setTimeout(() => setRevealedCount((c) => c + 1), 480);
      } else {
        setPhase('holding');
      }
    } else if (phase === 'holding') {
      t = setTimeout(() => setPhase('fading'), 1800);
    } else if (phase === 'fading') {
      t = setTimeout(() => {
        setDemoIdx((d) => (d + 1) % DEMOS.length);
        setRevealedCount(0);
        setPhase('typing');
      }, 420);
    }
    return () => clearTimeout(t);
  }, [phase, revealedCount, demoIdx, demo.lines.length]);

  const allShown = revealedCount >= demo.lines.length;

  return (
    <div
      className="hero-demo-panel"
      style={{ opacity: phase === 'fading' ? 0 : 1, transition: 'opacity 0.42s ease' }}
    >
      {/* Mac-style tab bar */}
      <div className="demo-tab-bar">
        <div className="demo-dot demo-dot-red" />
        <div className="demo-dot demo-dot-yellow" />
        <div className="demo-dot demo-dot-green" />
        <span className="demo-filename" style={{ color: demo.color }}>{demo.label}</span>
        <span className="demo-badge" style={{ color: demo.color, borderColor: demo.color }}>
          {demoIdx + 1}/{DEMOS.length}
        </span>
      </div>

      {/* Code editor half */}
      <div className="demo-code-panel" key={`code-${demoIdx}`}>
        {demo.lines.map((tokens, i) => (
          i < revealedCount ? (
            <span key={i} className="code-line">
              {tokens.map((tok, j) => (
                <span key={j} style={{ color: tok.c }}>{tok.t}</span>
              ))}
              {i === revealedCount - 1 && !allShown && (
                <span className="cursor-blink"> ▋</span>
              )}
            </span>
          ) : null
        ))}
        {allShown && (
          <span className="cursor-blink" style={{ color: '#60a5fa', display: 'block', height: '1.7em' }}> ▋</span>
        )}
      </div>

      {/* Preview half */}
      <div className="demo-preview-panel" key={`preview-${demoIdx}`}>
        <span className="demo-preview-label">⚡ LIVE PREVIEW</span>
        <SVG count={revealedCount} />
      </div>

      {/* Progress bar */}
      <div className="demo-progress-bar">
        <div
          className="demo-progress-fill"
          style={{
            width: `${(revealedCount / demo.lines.length) * 100}%`,
            background: demo.color,
            transition: 'width 0.45s ease',
          }}
        />
      </div>
    </div>
  );
}

/* ── Section Divider ───────────────────────────────────────────── */
function SectionDivider() {
  return <div className="section-divider" />;
}

/* ── Carousel slide visuals ────────────────────────────────────── */
const AIJsonVisual = () => (
  <svg viewBox="0 0 480 260" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
    <rect x="8" y="20" width="140" height="110" rx="8" fill="#0f172a" stroke="#1e3a5f" strokeWidth="1.5"/>
    <text x="78" y="38" textAnchor="middle" fontSize="9" fill="#60a5fa" fontWeight="700">Your Design Idea</text>
    <rect x="18" y="48" width="50" height="30" rx="4" fill="#3b82f620" stroke="#3b82f6" strokeWidth="1"/>
    <text x="43" y="67" textAnchor="middle" fontSize="7" fill="#93c5fd">User</text>
    <rect x="80" y="48" width="58" height="30" rx="4" fill="#8b5cf620" stroke="#8b5cf6" strokeWidth="1"/>
    <text x="109" y="67" textAnchor="middle" fontSize="7" fill="#c4b5fd">API Service</text>
    <line x1="68" y1="63" x2="80" y2="63" stroke="#60a5fa" strokeWidth="1" markerEnd="url(#cla1)"/>
    <rect x="18" y="90" width="120" height="28" rx="4" fill="#10b98115" stroke="#10b981" strokeWidth="1" strokeDasharray="3 2"/>
    <text x="78" y="108" textAnchor="middle" fontSize="7" fill="#34d399">Database Layer</text>
    <defs><marker id="cla1" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5Z" fill="#60a5fa"/></marker></defs>
    <line x1="155" y1="75" x2="178" y2="75" stroke="#334155" strokeWidth="1.5" strokeDasharray="4 2"/>
    <polygon points="175,71 183,75 175,79" fill="#334155"/>
    <text x="167" y="69" textAnchor="middle" fontSize="7" fill="#64748b">export</text>
    <rect x="185" y="20" width="105" height="110" rx="8" fill="#0a0a14" stroke="#4f46e5" strokeWidth="1.5"/>
    <text x="237" y="36" textAnchor="middle" fontSize="8" fill="#818cf8" fontWeight="700">JSON / YAML</text>
    {[['{','#94a3b8',195,48],['"nodes": [','#60a5fa',198,60],['  { "id": "u1",','#a5b4fc',200,72],['    "type": "user"},','#a5b4fc',200,84],['  { "id": "api",','#a5b4fc',200,96],['    "type": "service"}','#a5b4fc',200,108],[']','#60a5fa',198,118]].map(([t,c,x,y])=>(<text key={y} x={x} y={y} fontSize="6.5" fill={c} fontFamily="monospace">{t}</text>))}
    <line x1="297" y1="75" x2="318" y2="75" stroke="#7c3aed" strokeWidth="1.5" strokeDasharray="4 2"/>
    <polygon points="315,71 323,75 315,79" fill="#7c3aed"/>
    <text x="307" y="69" textAnchor="middle" fontSize="7" fill="#a78bfa">ask AI</text>
    <rect x="325" y="14" width="148" height="130" rx="10" fill="#0d0d1f" stroke="#7c3aed" strokeWidth="1.5"/>
    <rect x="333" y="22" width="132" height="18" rx="4" fill="#1e1b4b"/>
    <text x="349" y="34" fontSize="7.5" fill="#a78bfa" fontWeight="700">🤖 AI Assistant</text>
    <rect x="333" y="78" width="132" height="56" rx="4" fill="#020209"/>
    {[['flowchart LR','#60a5fa',341,91],['  U["User"] --> A','#a5b4fc',341,103],['  A["API Service"]','#a5b4fc',341,115],['  A --> DB[(Data)]','#34d399',341,127]].map(([t,c,x,y])=>(<text key={y} x={x} y={y} fontSize="6.5" fill={c} fontFamily="monospace">{t}</text>))}
    <path d="M400 150 Q400 180 340 200" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 2" fill="none" markerEnd="url(#cla3)"/>
    <text x="390" y="175" fontSize="7" fill="#34d399">paste here</text>
    <defs><marker id="cla3" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5Z" fill="#10b981"/></marker></defs>
    <rect x="50" y="155" width="270" height="95" rx="8" fill="#0f172a" stroke="#10b981" strokeWidth="1.5"/>
    <text x="185" y="173" textAnchor="middle" fontSize="9" fill="#34d399" fontWeight="700">✨ Stunning Diagram — Ready to Share</text>
    <rect x="68" y="182" width="55" height="26" rx="4" fill="#3b82f620" stroke="#3b82f6" strokeWidth="1"/>
    <text x="95" y="199" textAnchor="middle" fontSize="7.5" fill="#93c5fd">User</text>
    <rect x="148" y="182" width="68" height="26" rx="4" fill="#8b5cf620" stroke="#8b5cf6" strokeWidth="1"/>
    <text x="182" y="199" textAnchor="middle" fontSize="7.5" fill="#c4b5fd">API Service</text>
    <rect x="240" y="175" width="60" height="40" rx="20" fill="#10b98120" stroke="#10b981" strokeWidth="1"/>
    <text x="270" y="199" textAnchor="middle" fontSize="7.5" fill="#6ee7b7">Database</text>
    <line x1="123" y1="195" x2="148" y2="195" stroke="#60a5fa" strokeWidth="1.2" markerEnd="url(#cla4)"/>
    <line x1="216" y1="195" x2="240" y2="195" stroke="#34d399" strokeWidth="1.2" markerEnd="url(#cla5)"/>
    <defs>
      <marker id="cla4" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5Z" fill="#60a5fa"/></marker>
      <marker id="cla5" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5Z" fill="#34d399"/></marker>
    </defs>
  </svg>
);

const MermaidAIVisual = () => (
  <svg viewBox="0 0 480 260" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
    <rect x="8" y="20" width="190" height="130" rx="8" fill="#0d0d1f" stroke="#7c3aed" strokeWidth="1.5"/>
    <rect x="16" y="28" width="174" height="18" rx="4" fill="#1e1b4b"/>
    <text x="26" y="40" fontSize="8" fill="#a78bfa" fontWeight="700">🤖 Ask any AI tool</text>
    <rect x="16" y="52" width="174" height="90" rx="4" fill="#020209"/>
    {[['"Draw me a C4 container','#e2e8f0',24,65],['diagram for an e-commerce','#e2e8f0',24,77],['platform with a React SPA,','#e2e8f0',24,89],['Node API, PostgreSQL DB,','#e2e8f0',24,101],['Redis cache, and Stripe','#e2e8f0',24,113],['payment integration."','#e2e8f0',24,125]].map(([t,c,x,y])=>(<text key={y} x={x} y={y} fontSize="7.5" fill={c}>{t}</text>))}
    <text x="103" y="158" textAnchor="middle" fontSize="7" fill="#7c3aed">Any AI assistant of your choice</text>
    <line x1="204" y1="85" x2="228" y2="85" stroke="#7c3aed" strokeWidth="1.5" strokeDasharray="4 2"/>
    <polygon points="225,81 233,85 225,89" fill="#7c3aed"/>
    <text x="213" y="79" textAnchor="middle" fontSize="7" fill="#a78bfa">get code</text>
    <rect x="234" y="20" width="110" height="155" rx="8" fill="#0a0a14" stroke="#4f46e5" strokeWidth="1.5"/>
    <text x="289" y="36" textAnchor="middle" fontSize="8" fill="#818cf8" fontWeight="700">Mermaid / C4</text>
    {[['C4Container','#8b5cf6',242,50],['  title E-Commerce','#94a3b8',242,62],['  Person(u,"User")','#60a5fa',242,74],['  Container_Boundary','#60a5fa',242,86],['  (p,"Platform") {','#60a5fa',242,98],['    Container(spa,','#a5b4fc',244,110],[     '"React SPA")','#a5b4fc',244,122],['    ContainerDb(db,','#34d399',244,134],[     '"PostgreSQL")','#34d399',244,146],['  }','#60a5fa',242,158],['  Rel(u,spa,"Uses")','#94a3b8',242,170]].map(([t,c,x,y])=>(<text key={y} x={x} y={y} fontSize="6" fill={c} fontFamily="monospace">{t}</text>))}
    <line x1="348" y1="85" x2="368" y2="85" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 2"/>
    <polygon points="365,81 373,85 365,89" fill="#10b981"/>
    <text x="356" y="79" textAnchor="middle" fontSize="7" fill="#34d399">paste</text>
    <rect x="374" y="14" width="100" height="165" rx="8" fill="#0f172a" stroke="#10b981" strokeWidth="1.5"/>
    <text x="424" y="30" textAnchor="middle" fontSize="7.5" fill="#34d399" fontWeight="700">Live Preview</text>
    <circle cx="424" cy="50" r="10" fill="#3b82f620" stroke="#3b82f6" strokeWidth="1"/>
    <text x="424" y="54" textAnchor="middle" fontSize="6" fill="#93c5fd">User</text>
    <rect x="382" y="70" width="84" height="95" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="1" strokeDasharray="3 2"/>
    <rect x="388" y="90" width="68" height="22" rx="3" fill="#3b82f620" stroke="#3b82f6" strokeWidth="1"/>
    <text x="422" y="104" textAnchor="middle" fontSize="6" fill="#93c5fd">React SPA</text>
    <rect x="388" y="118" width="68" height="22" rx="3" fill="#10b98120" stroke="#10b981" strokeWidth="1"/>
    <text x="422" y="132" textAnchor="middle" fontSize="6" fill="#6ee7b7">PostgreSQL</text>
    <rect x="388" y="146" width="68" height="14" rx="3" fill="#f59e0b20" stroke="#f59e0b" strokeWidth="1"/>
    <text x="422" y="156" textAnchor="middle" fontSize="6" fill="#fbbf24">Redis Cache</text>
    <rect x="50" y="195" width="360" height="50" rx="8" fill="#14532d20" stroke="#22c55e" strokeWidth="1"/>
    <text x="230" y="215" textAnchor="middle" fontSize="9" fill="#4ade80" fontWeight="700">Impress your boss and team with professional diagrams</text>
    <text x="230" y="232" textAnchor="middle" fontSize="8" fill="#86efac">Flowchart · Sequence · C4 · State · ER · Gantt · Mindmap · Timeline · Kanban · and 20 more</text>
  </svg>
);

const CamelVisual = () => (
  <svg viewBox="0 0 480 260" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
    <rect x="8" y="15" width="285" height="140" rx="8" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5"/>
    <text x="150" y="32" textAnchor="middle" fontSize="9" fill="#fbbf24" fontWeight="700">Visual Route Builder</text>
    {[['REST\nEndpoint','#3b82f6',20,55],['Choice\n(Router)','#8b5cf6',90,55],['Kafka\nProducer','#22c55e',170,40],['DB\nWrite','#10b981',170,85],['DLQ\nError','#ef4444',250,65]].map(([lbl,color,x,y])=>(<g key={x+','+y}><rect x={x} y={y} width={58} height={34} rx="5" fill={`${color}20`} stroke={color} strokeWidth="1.2"/>{lbl.split('\n').map((line,i)=>(<text key={i} x={x+29} y={y+14+i*12} textAnchor="middle" fontSize="7.5" fill={color} fontWeight="600">{line}</text>))}</g>))}
    <defs><marker id="cv1" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5Z" fill="#60a5fa"/></marker><marker id="cv2" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5Z" fill="#22c55e"/></marker><marker id="cv3" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5Z" fill="#10b981"/></marker><marker id="cv4" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5Z" fill="#ef4444"/></marker></defs>
    <line x1="78" y1="72" x2="90" y2="72" stroke="#60a5fa" strokeWidth="1.2" markerEnd="url(#cv1)"/>
    <path d="M148,72 Q158,57 170,57" stroke="#22c55e" strokeWidth="1.2" fill="none" markerEnd="url(#cv2)"/>
    <path d="M148,72 Q158,90 170,95" stroke="#10b981" strokeWidth="1.2" fill="none" markerEnd="url(#cv3)"/>
    <path d="M228,72 Q240,72 250,80" stroke="#ef4444" strokeWidth="1.2" fill="none" strokeDasharray="3 2" markerEnd="url(#cv4)"/>
    <rect x="323" y="10" width="152" height="200" rx="8" fill="#0a0a14" stroke="#f59e0b" strokeWidth="1.5"/>
    <text x="399" y="28" textAnchor="middle" fontSize="8.5" fill="#fbbf24" fontWeight="700">Camel YAML DSL</text>
    {[['- route:','#f59e0b',331,56],['    id: order-route','#94a3b8',331,68],['    from:','#60a5fa',331,80],['      uri: rest:post:/order','#a5b4fc',333,92],['    steps:','#60a5fa',331,104],['      - choice:','#8b5cf6',333,116],['          when:','#8b5cf6',335,128],['            - simple:','#a78bfa',337,140],['                ${body.valid}','#c4b5fd',339,152],['              steps:','#a78bfa',337,164],['                - to:','#22c55e',339,176],['                    uri: kafka:orders','#6ee7b7',341,188],['          otherwise:','#ef4444',335,200],['            - to:','#fca5a5',337,212],['                uri: kafka:dlq','#fca5a5',339,224]].map(([t,c,x,y])=>(<text key={y} x={x} y={y} fontSize="6" fill={c} fontFamily="monospace">{t}</text>))}
    <line x1="297" y1="85" x2="318" y2="85" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 2"/>
    <polygon points="315,81 323,85 315,89" fill="#f59e0b"/>
    <text x="307" y="79" textAnchor="middle" fontSize="7" fill="#fbbf24">export</text>
    <text x="100" y="148" fontSize="7" fill="#64748b">Drag EIP components · Connect · Configure · Done</text>
    <rect x="8" y="168" width="285" height="40" rx="6" fill="#451a0320" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 2"/>
    <text x="150" y="183" textAnchor="middle" fontSize="8" fill="#fbbf24" fontWeight="600">Copy YAML → drop into your Camel / Spring Boot project</text>
    <text x="150" y="197" textAnchor="middle" fontSize="7" fill="#92400e">Works with Apache Camel 4.x · Camel K · Camel Quarkus</text>
  </svg>
);

const JiraVisual = () => (
  <svg viewBox="0 0 480 260" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
    <rect x="8" y="15" width="165" height="135" rx="8" fill="#0f172a" stroke="#0052cc" strokeWidth="1.5"/>
    <rect x="16" y="23" width="80" height="14" rx="3" fill="#0052cc30"/>
    <text x="56" y="33" textAnchor="middle" fontSize="7.5" fill="#4c9aff" fontWeight="700">📋 Jira Story</text>
    <text x="16" y="52" fontSize="7.5" fill="#e2e8f0" fontWeight="600">USER-142</text>
    <text x="16" y="66" fontSize="7" fill="#94a3b8">As a user, I want to</text>
    <text x="16" y="78" fontSize="7" fill="#94a3b8">checkout my cart and</text>
    <text x="16" y="90" fontSize="7" fill="#94a3b8">pay with Stripe so I</text>
    <text x="16" y="102" fontSize="7" fill="#94a3b8">receive an order conf-</text>
    <text x="16" y="114" fontSize="7" fill="#94a3b8">irmation email.</text>
    <rect x="16" y="122" width="40" height="12" rx="3" fill="#22c55e30" stroke="#22c55e" strokeWidth="0.8"/>
    <text x="36" y="131" textAnchor="middle" fontSize="6.5" fill="#4ade80">Story: 5pts</text>
    <rect x="62" y="122" width="50" height="12" rx="3" fill="#f59e0b30" stroke="#f59e0b" strokeWidth="0.8"/>
    <text x="87" y="131" textAnchor="middle" fontSize="6.5" fill="#fbbf24">In Progress</text>
    <line x1="177" y1="82" x2="198" y2="82" stroke="#7c3aed" strokeWidth="1.5" strokeDasharray="4 2"/>
    <polygon points="195,78 203,82 195,86" fill="#7c3aed"/>
    <text x="187" y="76" textAnchor="middle" fontSize="7" fill="#a78bfa">→ AI</text>
    <rect x="205" y="15" width="135" height="135" rx="8" fill="#0d0d1f" stroke="#7c3aed" strokeWidth="1.5"/>
    <text x="272" y="30" textAnchor="middle" fontSize="7.5" fill="#a78bfa" fontWeight="700">🤖 AI generates code</text>
    {[['sequenceDiagram','#8b5cf6',213,45],['  actor User','#60a5fa',213,57],['  participant Cart','#94a3b8',213,69],['  participant Stripe','#94a3b8',213,81],['  participant Email','#94a3b8',213,93],['  User->>Cart: checkout','#60a5fa',213,105],['  Cart->>Stripe: charge','#a5b4fc',213,117],['  Stripe-->>Cart: ok','#a5b4fc',213,129],['  Cart->>Email: confirm','#34d399',213,141]].map(([t,c,x,y])=>(<text key={y} x={x} y={y} fontSize="6" fill={c} fontFamily="monospace">{t}</text>))}
    <line x1="344" y1="82" x2="365" y2="82" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 2"/>
    <polygon points="362,78 370,82 362,86" fill="#10b981"/>
    <text x="354" y="76" textAnchor="middle" fontSize="7" fill="#34d399">render</text>
    <rect x="372" y="10" width="102" height="150" rx="8" fill="#0f172a" stroke="#10b981" strokeWidth="1.5"/>
    <text x="423" y="26" textAnchor="middle" fontSize="7" fill="#34d399" fontWeight="700">Sequence Diagram</text>
    {[['User','#3b82f6',383],['Cart','#8b5cf6',408],['Stripe','#f59e0b',433],['Email','#10b981',458]].map(([l,c,x])=>(<g key={l}><rect x={x-12} y={30} width={24} height={14} rx="3" fill={`${c}20`} stroke={c} strokeWidth="0.8"/><text x={x} y={40} textAnchor="middle" fontSize="5.5" fill={c}>{l}</text><line x1={x} y1={44} x2={x} y2={152} stroke={c} strokeWidth="0.6" strokeDasharray="2 2" opacity="0.5"/></g>))}
    <defs><marker id="jv1" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4Z" fill="#60a5fa"/></marker></defs>
    {[[383,408,65,'checkout'],[408,433,85,'charge'],[433,408,105,'ok'],[408,458,125,'confirm']].map(([x1,x2,y,lbl])=>(<g key={y}><line x1={x1} y1={y} x2={x2} y2={y} stroke="#60a5fa" strokeWidth="0.8" markerEnd="url(#jv1)"/><text x={(x1+x2)/2} y={y-3} textAnchor="middle" fontSize="5" fill="#94a3b8">{lbl}</text></g>))}
    <rect x="8" y="165" width="466" height="45" rx="8" fill="#1e3a5f20" stroke="#3b82f6" strokeWidth="1"/>
    <text x="240" y="183" textAnchor="middle" fontSize="9" fill="#60a5fa" fontWeight="700">Turn every Jira story into a clear, convincing diagram</text>
    <text x="240" y="199" textAnchor="middle" fontSize="7.5" fill="#64748b">No diagram = no convincing story. Model it. Share it. Ship it.</text>
  </svg>
);

const StickyNoteVisual = () => (
  <svg viewBox="0 0 480 260" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
    <rect x="8" y="18" width="110" height="130" rx="4" fill="#92400e40" stroke="#f59e0b" strokeWidth="1.2"/>
    <text x="63" y="34" textAnchor="middle" fontSize="7.5" fill="#fbbf24" fontWeight="700">📝 Meeting Notes</text>
    {[['• Auth flow needs',50],['  MFA support',62],['• Session timeout',76],['  after 30min idle',88],['• Refresh token',102],['  rotation needed',114],['• Log failed logins',128],['• GDPR compliance',140]].map(([t,y])=>(<text key={y} x="16" y={y} fontSize="6.5" fill="#fde68a">{t}</text>))}
    <line x1="122" y1="83" x2="143" y2="83" stroke="#7c3aed" strokeWidth="1.5" strokeDasharray="4 2"/>
    <polygon points="140,79 148,83 140,87" fill="#7c3aed"/>
    <text x="132" y="77" textAnchor="middle" fontSize="7" fill="#a78bfa">→ AI</text>
    <rect x="150" y="12" width="148" height="145" rx="8" fill="#0d0d1f" stroke="#7c3aed" strokeWidth="1.5"/>
    <rect x="158" y="20" width="132" height="16" rx="4" fill="#1e1b4b"/>
    <text x="224" y="31" textAnchor="middle" fontSize="7.5" fill="#a78bfa" fontWeight="700">🤖 AI Chat Prompt</text>
    <rect x="158" y="90" width="132" height="58" rx="4" fill="#020209"/>
    {[['stateDiagram-v2','#8b5cf6',166,103],['  [*] --> Login','#94a3b8',166,115],['  Login --> MFA: creds ok','#60a5fa',166,127],['  MFA --> Session: otp ok','#a5b4fc',166,139],['  Session --> [*]: timeout','#34d399',166,151]].map(([t,c,x,y])=>(<text key={y} x={x} y={y} fontSize="5.8" fill={c} fontFamily="monospace">{t}</text>))}
    <line x1="302" y1="83" x2="323" y2="83" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 2"/>
    <polygon points="320,79 328,83 320,87" fill="#10b981"/>
    <text x="312" y="77" textAnchor="middle" fontSize="7" fill="#34d399">paste</text>
    <rect x="330" y="12" width="144" height="148" rx="8" fill="#0f172a" stroke="#10b981" strokeWidth="1.5"/>
    <text x="402" y="28" textAnchor="middle" fontSize="8" fill="#34d399" fontWeight="700">State Diagram</text>
    <circle cx="402" cy="44" r="5" fill="#60a5fa"/>
    {[['Login',402,65],['MFA',402,95],['Session',402,125],['End',402,148]].map(([l,x,y])=>(<g key={l}>{l==='End'?<circle cx={x} cy={y} r="6" fill="#10b981" stroke="#10b981" strokeWidth="1.5"/>:<rect x={x-35} y={y-9} width={70} height={18} rx="9" fill={l==='Login'?'#3b82f620':l==='MFA'?'#8b5cf620':'#22c55e20'} stroke={l==='Login'?'#3b82f6':l==='MFA'?'#8b5cf6':'#22c55e'} strokeWidth="1"/>}{l!=='End'&&<text x={x} y={y+4} textAnchor="middle" fontSize="7" fill={l==='Login'?'#93c5fd':l==='MFA'?'#c4b5fd':'#6ee7b7'}>{l}</text>}</g>))}
    <defs><marker id="sv1" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4Z" fill="#60a5fa"/></marker></defs>
    {[[402,49,56,'','#60a5fa'],[402,74,86,'creds ok','#60a5fa'],[402,104,116,'otp ok','#a5b4fc'],[402,134,142,'timeout','#34d399']].map(([x,y1,y2,lbl,c])=>(<g key={y1}><line x1={x} y1={y1} x2={x} y2={y2} stroke={c} strokeWidth="1" markerEnd="url(#sv1)"/>{lbl&&<text x={x+4} y={(y1+y2)/2+3} fontSize="5.5" fill={c}>{lbl}</text>}</g>))}
    <rect x="8" y="175" width="466" height="45" rx="8" fill="#14532d20" stroke="#22c55e" strokeWidth="1"/>
    <text x="240" y="193" textAnchor="middle" fontSize="9" fill="#4ade80" fontWeight="700">Sticky note → AI → Code → Diagram · in under 60 seconds</text>
    <text x="240" y="208" textAnchor="middle" fontSize="7.5" fill="#64748b">Modify the diagram freely · Export SVG / PNG · Share the link</text>
  </svg>
);

const ExportShareVisual = () => (
  <svg viewBox="0 0 480 260" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
    <rect x="155" y="60" width="170" height="110" rx="8" fill="#0f172a" stroke="#3b82f6" strokeWidth="1.5"/>
    <text x="240" y="78" textAnchor="middle" fontSize="8.5" fill="#60a5fa" fontWeight="700">Your Diagram</text>
    <rect x="168" y="86" width="55" height="24" rx="4" fill="#3b82f620" stroke="#3b82f6" strokeWidth="1"/>
    <text x="195" y="102" textAnchor="middle" fontSize="7" fill="#93c5fd">Service A</text>
    <rect x="257" y="86" width="55" height="24" rx="4" fill="#8b5cf620" stroke="#8b5cf6" strokeWidth="1"/>
    <text x="284" y="102" textAnchor="middle" fontSize="7" fill="#c4b5fd">Service B</text>
    <defs><marker id="ev1" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5Z" fill="#60a5fa"/></marker></defs>
    <line x1="223" y1="98" x2="257" y2="98" stroke="#60a5fa" strokeWidth="1.2" markerEnd="url(#ev1)"/>
    <rect x="168" y="122" width="144" height="36" rx="4" fill="#10b98115" stroke="#10b981" strokeWidth="1" strokeDasharray="3 2"/>
    <text x="240" y="144" textAnchor="middle" fontSize="7" fill="#34d399">Shared Data Store</text>
    {[{label:'PNG',sub:'2× retina',color:'#3b82f6',x:40,y:40,lx:155,ly:88},{label:'SVG',sub:'vector',color:'#8b5cf6',x:40,y:120,lx:155,ly:115},{label:'JSON',sub:'layout',color:'#10b981',x:40,y:200,lx:155,ly:145},{label:'YAML',sub:'structure',color:'#f59e0b',x:370,y:40,lx:325,ly:88},{label:'.mmd',sub:'mermaid',color:'#ec4899',x:370,y:120,lx:325,ly:115},{label:'YAML',sub:'camel dsl',color:'#ef4444',x:370,y:200,lx:325,ly:145}].map(({label,sub,color,x,y,lx,ly})=>(<g key={`${x},${y}`}><rect x={x} y={y} width={68} height={38} rx="6" fill={`${color}20`} stroke={color} strokeWidth="1.2"/><text x={x+34} y={y+17} textAnchor="middle" fontSize="9" fill={color} fontWeight="700">{label}</text><text x={x+34} y={y+29} textAnchor="middle" fontSize="6.5" fill={color} opacity="0.7">{sub}</text><line x1={x>200?x:x+68} y1={y+19} x2={lx} y2={ly} stroke={color} strokeWidth="1" strokeDasharray="3 2" opacity="0.6"/></g>))}
    <rect x="80" y="190" width="320" height="55" rx="10" fill="#1e3a5f30" stroke="#3b82f6" strokeWidth="1.5"/>
    <text x="120" y="213" fontSize="8.5" fill="#60a5fa" fontWeight="700">Share with anyone — one click</text>
    <rect x="95" y="222" width="220" height="16" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1"/>
    <text x="100" y="233" fontSize="6.5" fill="#64748b" fontFamily="monospace">https://model.studio/#diagram=eyJub2Rlc...</text>
    <rect x="320" y="222" width="65" height="16" rx="4" fill="#3b82f620" stroke="#3b82f6" strokeWidth="1"/>
    <text x="352" y="233" textAnchor="middle" fontSize="7" fill="#60a5fa" fontWeight="700">📋 Copied!</text>
    <text x="240" y="256" textAnchor="middle" fontSize="7" fill="#64748b">Link encodes the full diagram state · No server · No account needed</text>
  </svg>
);

/* ── Carousel ──────────────────────────────────────────────────── */
const SLIDES = [
  { tag:'AI + Diagrams', tagColor:'#7c3aed', headline:'Design → JSON → AI → Stunning Diagram', body:'Sketch your idea, export it as JSON, drop it into any AI assistant and ask for a diagram. Paste the code back here and get a professional diagram in seconds.', steps:['Design or describe your idea','Export as JSON / describe in text','Ask AI to generate Mermaid code','Paste → instant live diagram'], stepColor:'#7c3aed', Visual:AIJsonVisual },
  { tag:'Code as Diagram', tagColor:'#8b5cf6', headline:'AI Code → 26+ Diagram Types → Impress Everyone', body:'Get Mermaid or C4 code from any AI assistant. Paste it into the Code as Diagram editor and watch it render live — 26+ diagram types ready to export.', steps:['Prompt any AI assistant','Ask for Mermaid or C4 diagram code','Paste into the Code as Diagram editor','Render → Export → Share → Impress'], stepColor:'#8b5cf6', Visual:MermaidAIVisual },
  { tag:'Apache Camel', tagColor:'#f59e0b', headline:'Design Routes Visually → Export Production YAML', body:'Build Apache Camel integration routes by dragging EIP components onto the canvas, then export a production-ready Camel YAML DSL you can drop straight into your project.', steps:['Drag EIP components (REST, Choice, Kafka…)','Connect and configure your route','Export Camel YAML DSL','Drop into Spring Boot · Camel K · Quarkus'], stepColor:'#f59e0b', Visual:CamelVisual },
  { tag:'Jira → Diagrams', tagColor:'#0ea5e9', headline:'No Diagram = No Convincing Story', body:'Copy your Jira story into an AI assistant and ask for a sequence or flow diagram. Paste the code here and turn acceptance criteria into a visual that every stakeholder understands.', steps:['Copy your Jira story text','Ask AI: "Convert to a sequence diagram"','Paste Mermaid code → render','Share the link in your Jira ticket'], stepColor:'#0ea5e9', Visual:JiraVisual },
  { tag:'Sticky Notes → AI → Diagram', tagColor:'#22c55e', headline:'Meeting Notes → AI → Clean Diagram in 60s', body:'Write sticky notes during discussions. Paste your notes into any AI assistant and ask for a state, flow, or sequence diagram. Place the code here, modify as needed, and share.', steps:['Write sticky notes during discussions','Paste notes into an AI assistant','Get diagram code of your choice','Render → Modify → Export → Share'], stepColor:'#22c55e', Visual:StickyNoteVisual },
  { tag:'Export & Share', tagColor:'#3b82f6', headline:'Every Format. One Click. Share Instantly.', body:'Export as PNG (retina), SVG, JSON, YAML, Mermaid source, or Camel DSL. Click Share to get a clipboard link that encodes your entire diagram — no account needed.', steps:['Finish your diagram','Export: PNG · SVG · JSON · YAML · .mmd','Click Share → link copied to clipboard','Send link → anyone opens the full diagram'], stepColor:'#3b82f6', Visual:ExportShareVisual },
];

const SLIDE_DURATION = 6000; // ms per slide

function Carousel() {
  const [idx, setIdx]       = useState(0);
  const [paused, setPaused] = useState(false);
  const [phase, setPhase]   = useState('in');   // 'in' | 'out'
  const [dir, setDir]       = useState(1);       // 1 = forward, -1 = back
  const touchX              = useRef(null);
  const timerRef            = useRef(null);

  /* ── slide transition ─────────────────────────────────────────── */
  const go = useCallback((nextIdx, direction = 1) => {
    setDir(direction);
    setPhase('out');
    setTimeout(() => {
      setIdx(nextIdx);
      setPhase('in');
    }, 320);
  }, []);

  const goNext = useCallback(() => go((idx + 1) % SLIDES.length,  1), [idx, go]);
  const goPrev = useCallback(() => go((idx - 1 + SLIDES.length) % SLIDES.length, -1), [idx, go]);

  /* ── auto-advance ─────────────────────────────────────────────── */
  useEffect(() => {
    if (paused) return;
    timerRef.current = setTimeout(goNext, SLIDE_DURATION);
    return () => clearTimeout(timerRef.current);
  }, [paused, goNext, idx]);

  /* ── touch swipe ──────────────────────────────────────────────── */
  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 44) dx < 0 ? goNext() : goPrev();
    touchX.current = null;
  };

  const slide = SLIDES[idx];
  const { Visual } = slide;

  /* ── parallax offsets ─────────────────────────────────────────── */
  // Text layer: full travel. Visual layer: 45 % travel → depth illusion.
  const exiting = phase === 'out';
  const textX   = exiting ? `${dir * -52}px`  : '0px';
  const visualX = exiting ? `${dir * -24}px`  : '0px';
  const opacity = exiting ? 0 : 1;

  return (
    <section
      className="carousel-section reveal"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="section-header" style={{ marginBottom: '2rem', textAlign: 'left' }}>
        <h2>Your Workflow, <span className="text-gradient">Supercharged by AI</span></h2>
        <p style={{ margin: 0 }}>Six ways Model Studio fits into how engineers and architects work.</p>
      </div>

      <div
        className="carousel-stage"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Progress bar — key forces remount and restarts animation each slide */}
        <div className="carousel-progress">
          <div
            key={`${idx}-${paused}`}
            className={`carousel-progress-fill ${paused ? 'paused' : ''}`}
            style={{ '--slide-duration': `${SLIDE_DURATION}ms`, background: slide.tagColor }}
          />
        </div>

        <div className="carousel-slide">
          {/* Text — full-speed layer */}
          <div
            className="carousel-text"
            style={{
              opacity,
              transform: `translateX(${textX})`,
              transition: exiting
                ? 'opacity 0.28s ease, transform 0.32s ease'
                : 'opacity 0.38s ease 0.05s, transform 0.42s cubic-bezier(0.22,1,0.36,1) 0.05s',
            }}
          >
            <div className="carousel-tag" style={{ background:`${slide.tagColor}20`, border:`1px solid ${slide.tagColor}50`, color:slide.tagColor }}>
              {slide.tag}
            </div>
            <h3 className="carousel-headline">{slide.headline}</h3>
            <p className="carousel-body">{slide.body}</p>
            <div className="carousel-steps">
              {slide.steps.map((step, i) => (
                <div key={i} className="carousel-step">
                  <div className="carousel-step-num" style={{ background:`${slide.stepColor}20`, border:`1px solid ${slide.stepColor}50`, color:slide.stepColor }}>{i + 1}</div>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Visual — slower layer (parallax depth) */}
          <div
            className="carousel-visual"
            style={{
              opacity,
              transform: `translateX(${visualX})`,
              transition: exiting
                ? 'opacity 0.28s ease, transform 0.42s ease'
                : 'opacity 0.38s ease 0.05s, transform 0.55s cubic-bezier(0.22,1,0.36,1) 0.05s',
            }}
          >
            <Visual />
          </div>
        </div>

        <button className="carousel-arrow carousel-arrow-left"  onClick={goPrev} aria-label="Previous"><ChevronLeft  size={18}/></button>
        <button className="carousel-arrow carousel-arrow-right" onClick={goNext} aria-label="Next"><ChevronRight size={18}/></button>
      </div>

      {/* Dot indicators */}
      <div className="carousel-dots">
        {SLIDES.map((s, i) => (
          <button
            key={i}
            className={`carousel-dot ${i === idx ? 'active' : ''}`}
            style={{ '--dot-color': s.tagColor }}
            onClick={() => go(i, i > idx ? 1 : -1)}
            aria-label={s.tag}
          />
        ))}
      </div>

      {/* Strip tab navigation */}
      <div className="carousel-strip">
        {SLIDES.map((s, i) => (
          <button
            key={i}
            onClick={() => go(i, i > idx ? 1 : -1)}
            className={`carousel-strip-item ${i === idx ? 'active' : ''}`}
            style={{ '--strip-color': s.tagColor }}
          >
            {s.tag}
          </button>
        ))}
      </div>
    </section>
  );
}

/* ── Workspace mockups ─────────────────────────────────────────── */
const DddMockup = () => (
  <svg viewBox="0 0 200 120" fill="none" style={{ width:'100%', height:'100%' }}>
    <rect x="8" y="8" width="84" height="104" rx="6" fill="#3b82f620" stroke="#3b82f6" strokeWidth="1.2" strokeDasharray="4 2"/>
    <rect x="16" y="18" width="68" height="28" rx="4" fill="#3b82f630" stroke="#3b82f6" strokeWidth="1"/>
    <text x="50" y="37" textAnchor="middle" fontSize="8" fill="#93c5fd" fontWeight="600">Order Entity</text>
    <rect x="16" y="54" width="68" height="28" rx="4" fill="#3b82f620" stroke="#3b82f660" strokeWidth="1"/>
    <text x="50" y="73" textAnchor="middle" fontSize="8" fill="#93c5fd">Address VO</text>
    <rect x="108" y="8" width="84" height="104" rx="6" fill="#8b5cf620" stroke="#8b5cf6" strokeWidth="1.2" strokeDasharray="4 2"/>
    <rect x="116" y="18" width="68" height="28" rx="4" fill="#8b5cf630" stroke="#8b5cf6" strokeWidth="1"/>
    <text x="150" y="37" textAnchor="middle" fontSize="8" fill="#c4b5fd" fontWeight="600">User Service</text>
    <rect x="116" y="54" width="68" height="28" rx="4" fill="#8b5cf620" stroke="#8b5cf660" strokeWidth="1"/>
    <text x="150" y="73" textAnchor="middle" fontSize="8" fill="#c4b5fd">Domain Event</text>
    <defs><marker id="da1" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6Z" fill="#60a5fa"/></marker></defs>
    <line x1="84" y1="60" x2="108" y2="60" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="3 2" markerEnd="url(#da1)"/>
    <text x="96" y="56" textAnchor="middle" fontSize="6" fill="#60a5fa">ACL</text>
  </svg>
);
const ArchMockup = () => (
  <svg viewBox="0 0 200 120" fill="none" style={{ width:'100%', height:'100%' }}>
    <circle cx="28" cy="60" r="16" fill="#8b5cf620" stroke="#8b5cf6" strokeWidth="1.2"/>
    <text x="28" y="64" textAnchor="middle" fontSize="7" fill="#c4b5fd">User</text>
    <rect x="60" y="44" width="44" height="32" rx="4" fill="#3b82f620" stroke="#3b82f6" strokeWidth="1.2"/>
    <text x="82" y="64" textAnchor="middle" fontSize="7" fill="#93c5fd">API GW</text>
    <rect x="124" y="24" width="44" height="28" rx="4" fill="#10b98120" stroke="#10b981" strokeWidth="1.2"/>
    <text x="146" y="41" textAnchor="middle" fontSize="7" fill="#6ee7b7">Service A</text>
    <rect x="124" y="68" width="44" height="28" rx="4" fill="#10b98120" stroke="#10b981" strokeWidth="1.2"/>
    <text x="146" y="85" textAnchor="middle" fontSize="7" fill="#6ee7b7">Service B</text>
    <defs><marker id="da2" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6Z" fill="#60a5fa"/></marker><marker id="da3" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6Z" fill="#34d399"/></marker></defs>
    <line x1="44" y1="60" x2="60" y2="60" stroke="#60a5fa" strokeWidth="1.2" markerEnd="url(#da2)"/>
    <line x1="104" y1="52" x2="124" y2="38" stroke="#34d399" strokeWidth="1.2" markerEnd="url(#da3)"/>
    <line x1="104" y1="68" x2="124" y2="80" stroke="#34d399" strokeWidth="1.2" markerEnd="url(#da3)"/>
  </svg>
);
const CadMockup = () => (
  <svg viewBox="0 0 200 120" fill="none" style={{ width:'100%', height:'100%' }}>
    <rect x="4" y="4" width="90" height="112" rx="4" fill="#0f172a" stroke="#1e293b" strokeWidth="1"/>
    <text x="10" y="20" fontSize="7" fill="#64748b" fontFamily="monospace">flowchart LR</text>
    <text x="10" y="32" fontSize="7" fill="#7c3aed" fontFamily="monospace">  A["Start"]</text>
    <text x="10" y="44" fontSize="7" fill="#64748b" fontFamily="monospace">  A --&gt; B</text>
    <text x="10" y="56" fontSize="7" fill="#7c3aed" fontFamily="monospace">  B{"{Check}"}</text>
    <text x="10" y="68" fontSize="7" fill="#64748b" fontFamily="monospace">  B --&gt;|Yes| C</text>
    <text x="10" y="80" fontSize="7" fill="#10b981" fontFamily="monospace">  classDef ok</text>
    <text x="10" y="92" fontSize="7" fill="#10b981" fontFamily="monospace">    fill:#22c55e</text>
    <rect x="100" y="4" width="96" height="112" rx="4" fill="#111827" stroke="#1e293b" strokeWidth="1"/>
    <rect x="112" y="20" width="36" height="20" rx="10" fill="#22c55e30" stroke="#22c55e" strokeWidth="1"/>
    <text x="130" y="33" textAnchor="middle" fontSize="7" fill="#6ee7b7">Start</text>
    <polygon points="148,28 164,22 164,34" fill="#f59e0b20" stroke="#f59e0b" strokeWidth="1"/>
    <text x="156" y="31" textAnchor="middle" fontSize="6" fill="#fbbf24">?</text>
    <rect x="168" y="14" width="22" height="16" rx="3" fill="#3b82f620" stroke="#3b82f6" strokeWidth="1"/>
    <text x="179" y="25" textAnchor="middle" fontSize="6" fill="#93c5fd">End</text>
    <line x1="148" y1="30" x2="164" y2="28" stroke="#60a5fa" strokeWidth="0.8"/>
    <line x1="164" y1="22" x2="168" y2="20" stroke="#34d399" strokeWidth="0.8"/>
  </svg>
);
const EipMockup = () => (
  <svg viewBox="0 0 200 80" fill="none" style={{ width:'100%', height:'100%' }}>
    <defs><marker id="em1" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6Z" fill="#60a5fa"/></marker></defs>
    {[['Timer','#3b82f6',10],['Choice','#8b5cf6',60],['When','#f59e0b',110],['DB','#10b981',160]].map(([label,color,x])=>(<g key={label}><rect x={x} y="26" width="40" height="28" rx="4" fill={`${color}20`} stroke={color} strokeWidth="1.2"/><text x={x+20} y="43" textAnchor="middle" fontSize="8" fill={color} fontWeight="600">{label}</text></g>))}
    {[50,100,150].map(x=>(<line key={x} x1={x} y1="40" x2={x+10} y2="40" stroke="#60a5fa" strokeWidth="1.2" markerEnd="url(#em1)"/>))}
  </svg>
);
const DrawMockup = () => (
  <svg viewBox="0 0 200 120" fill="none" style={{ width:'100%', height:'100%' }}>
    <path d="M20,90 Q40,20 80,50 Q120,80 160,30 Q180,15 190,40" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.7"/>
    <rect x="30" y="60" width="50" height="35" rx="6" fill="#8b5cf620" stroke="#8b5cf6" strokeWidth="1.5"/>
    <circle cx="140" cy="70" r="22" fill="#10b98115" stroke="#10b981" strokeWidth="1.5"/>
    <polygon points="90,20 110,55 70,55" fill="#f59e0b15" stroke="#f59e0b" strokeWidth="1.5"/>
    <text x="55" y="82" textAnchor="middle" fontSize="8" fill="#c4b5fd">Cloud</text>
    <text x="140" y="74" textAnchor="middle" fontSize="8" fill="#6ee7b7">API</text>
  </svg>
);

const WORKSPACES = [
  { id:'ddd',     label:'Domain-Driven Design',  icon:<Boxes size={20}/>,    color:'#3b82f6', dim:'#1e3a5f', desc:'Bounded Contexts, Aggregates, Entities, Value Objects, Domain Events and Context Mapping — the full DDD palette.', Mockup:DddMockup },
  { id:'diagram', label:'System Architecture',   icon:<Network size={20}/>,  color:'#10b981', dim:'#064e3b', desc:'Drag-and-drop architecture with servers, databases, cloud icons, brand logos and smart auto-layout.', Mockup:ArchMockup },
  { id:'cad',     label:'Code as Diagram',       icon:<Code2 size={20}/>,    color:'#8b5cf6', dim:'#2e1065', desc:'Monaco Mermaid editor with live preview, 26+ diagram types, 13 themes, error squiggles and one-click export.', Mockup:CadMockup },
  { id:'eip',     label:'Apache Camel EIP',      icon:<Workflow size={20}/>, color:'#f59e0b', dim:'#78350f', desc:'Design integration patterns visually and export production-ready Camel YAML routes.', Mockup:EipMockup },
  { id:'draw',    label:'Free-form Draw',        icon:<Pencil size={20}/>,   color:'#ec4899', dim:'#500724', desc:'Freehand pencil, shapes, sticky notes and sketch mode. Perfect for brainstorming and whiteboard-style sessions.', Mockup:DrawMockup },
];

const FEATURES = [
  { icon:<Bot size={22}/>,       accent:'#7c3aed', title:'AI-Ready Workflows',        desc:'Export JSON, paste Mermaid code from any AI tool, or copy your story — Model Studio bridges the gap between AI output and polished diagrams.' },
  { icon:<Code2 size={22}/>,     accent:'#8b5cf6', title:'26+ Mermaid Diagram Types', desc:'Flowchart, Sequence, C4, Class, State, ER, Gantt, Mindmap, Timeline, Kanban, Sankey, Radar, Quadrant — all live as you type.' },
  { icon:<Download size={22}/>,  accent:'#10b981', title:'Every Export Format',        desc:'PNG (retina), SVG, JSON, YAML, .mermaid, Camel YAML DSL. Import back from JSON, YAML or Mermaid files.' },
  { icon:<Share2 size={22}/>,    accent:'#3b82f6', title:'One-Click Share Link',       desc:'Click Share to get a link that encodes your entire diagram. Send to anyone — they open it instantly, no account needed.' },
  { icon:<Palette size={22}/>,   accent:'#ec4899', title:'13 Diagram Themes',          desc:'Ocean, Midnight, Emerald, Amethyst, Rose, Sunrise, Slate, Mono, Corporate — switch themes instantly across all diagram types.' },
  { icon:<Zap size={22}/>,       accent:'#f59e0b', title:'Auto-Layout Engine',         desc:'One-click LR or TB Dagre layout that respects containers, nesting and parent-child relationships.' },
  { icon:<Layers size={22}/>,    accent:'#a855f7', title:'40+ Pro Templates',          desc:'AWS Architecture, K8s Platform, OAuth Flow, Zero Trust, C4 diagrams, ER schemas, Agile stories and more.' },
  { icon:<Shield size={22}/>,    accent:'#22c55e', title:'Local-First & Private',      desc:'Everything runs in your browser. Auto-saves to localStorage. No account, no server, works fully offline.' },
];

/* ── Landing Page ──────────────────────────────────────────────── */
function LandingPage({ onLaunch }) {
  useScrollReveal();

  return (
    <div className="landing-container" data-theme="dark">

      {/* Nav */}
      <nav className="landing-nav">
        <div className="nav-logo"><MSLogo size={34}/><span>Model Studio</span></div>
        <div className="nav-links">
          <a href="#how-it-works">How It Works</a>
          <a href="#workspaces">Workspaces</a>
          <a href="#features">Features</a>
          <a href="https://www.linkedin.com/in/leadtherightway" target="_blank" rel="noopener noreferrer" className="github-link" title="LinkedIn"><LinkedInIcon size={20}/></a>
          <a href="https://github.com/geekpratyush/ModelStudio" target="_blank" rel="noopener noreferrer" className="github-link"><GitHubIcon size={20}/></a>
          <button className="btn btn-primary nav-cta" onClick={onLaunch}>Launch Studio</button>
        </div>
      </nav>

      {/* Hero */}
      <header className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">Open Source · Runs in Your Browser · No Account Needed</div>
          <h1>Think It. Prompt It.<br /><span className="text-gradient">Diagram It.</span></h1>
          <p>
            Five specialised workspaces — Architecture Diagrams, Code as Diagram, Apache Camel EIP,
            Domain-Driven Design, and Free-form Draw. Paste Mermaid code from any AI tool. Export anything. Share instantly.
          </p>
          <div className="hero-actions">
            <button className="btn btn-lg btn-primary" onClick={onLaunch}>
              Open Studio <ArrowRight size={20}/>
            </button>
            <div className="hero-stats">
              <span>5 Workspaces</span><div className="divider"/>
              <span>40+ Templates</span><div className="divider"/>
              <span>26+ Diagram Types</span><div className="divider"/>
              <span>Open Source</span>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <HeroCycler />
          <div className="visual-glow"/>
        </div>
      </header>

      <SectionDivider />

      {/* Carousel */}
      <div id="how-it-works">
        <Carousel />
      </div>

      <SectionDivider />

      {/* Workspaces */}
      <section id="workspaces" className="workspaces-section">
        <div className="section-header reveal">
          <h2>Five Specialised <span className="text-gradient">Workspaces</span></h2>
          <p>Each workspace is purpose-built for a different modelling discipline — switch instantly, canvas state persists.</p>
        </div>
        <div className="workspaces-grid">
          {WORKSPACES.map((ws, i) => (
            <div key={ws.id} className={`workspace-card reveal ${i % 2 === 0 ? 'reveal-left' : 'reveal-right'}`}
              style={{ '--ws-color':ws.color, '--ws-dim':ws.dim, transitionDelay:`${i * 80}ms` }}>
              <div className="ws-preview"><ws.Mockup/></div>
              <div className="ws-body">
                <div className="ws-icon" style={{ background:`${ws.color}18`, color:ws.color }}>{ws.icon}</div>
                <h3 style={{ color:ws.color }}>{ws.label}</h3>
                <p>{ws.desc}</p>
              </div>
              <div className="ws-launch" style={{ borderColor:`${ws.color}30` }}>
                <button onClick={onLaunch} style={{ color:ws.color }}>Open workspace <ArrowRight size={14}/></button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <SectionDivider />

      {/* Features */}
      <section id="features" className="features-section">
        <div className="section-header reveal">
          <h2>Everything an Architect <span className="text-gradient">Actually Needs</span></h2>
          <p>No subscriptions. No onboarding. Just open the browser and start designing.</p>
        </div>
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="feature-item reveal" style={{ transitionDelay:`${i * 60}ms` }}>
              <div className="feature-icon" style={{ background:`${f.accent}15`, color:f.accent }}>{f.icon}</div>
              <div className="feature-text">
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-box reveal">
          <div className="cta-glow"/>
          <MSLogo size={52}/>
          <h2 className="text-gradient">Start Designing Right Now</h2>
          <p>No sign-up. No install. Runs entirely in your browser — your diagrams stay on your machine.</p>
          <div style={{ display:'flex', gap:'1rem', justifyContent:'center', flexWrap:'wrap' }}>
            <button className="btn btn-lg btn-primary" onClick={onLaunch}>Launch Studio <ArrowRight size={20}/></button>
            <a href="https://github.com/geekpratyush/ModelStudio" target="_blank" rel="noopener noreferrer" className="btn btn-lg btn-outline">
              <GitHubIcon size={18}/> View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="nav-logo"><MSLogo size={24}/><span>Model Studio</span></div>
          <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
            <a href="https://www.linkedin.com/in/leadtherightway" target="_blank" rel="noopener noreferrer" className="github-link" style={{ color:'var(--text-secondary)' }}><LinkedInIcon size={18}/></a>
            <a href="https://github.com/geekpratyush/ModelStudio" target="_blank" rel="noopener noreferrer" className="github-link" style={{ color:'var(--text-secondary)' }}><GitHubIcon size={18}/></a>
            <p>&copy; 2026 <strong style={{ color:'var(--text-primary)' }}>Pratyush Ranjan Mishra</strong> · Model Studio · MIT License</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
