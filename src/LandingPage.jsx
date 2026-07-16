import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowRight, Code2, Layers, Workflow, Pencil,
  Download, Boxes, Zap, Shield, Network,
  ChevronLeft, ChevronRight, Share2, Bot, Palette,
  Star, GitFork, ExternalLink, Heart
} from 'lucide-react';
import MSLogo from './components/MSLogo';
import './LandingPage.css';
import dddScreenshot from './assets/screenshot_ddd.png';
import archScreenshot from './assets/screenshot_architecture.png';
import cadScreenshot from './assets/screenshot_cad.png';
import camelScreenshot from './assets/screenshot_camel.png';
import drawScreenshot from './assets/screenshot_draw.png';
import cadDemoVideo from './assets/videos/cad_demo.webm';
import drawDemoVideo from './assets/videos/draw_demo.webm';
import dddDemoVideo from './assets/videos/ddd_demo.webm';
import camelDemoVideo from './assets/videos/camel_demo.webm';

/* ── GitHub data fetcher ──────────────────────────────────────── */
function useGitHubStats() {
  const [stats, setStats] = useState({ stars: 0, forks: 0, updated: '' });
  useEffect(() => {
    fetch('https://api.github.com/repos/geekpratyush/ModelStudio')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          const d = new Date(data.pushed_at);
          setStats({
            stars: data.stargazers_count || 0,
            forks: data.forks_count || 0,
            updated: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          });
        }
      })
      .catch(() => {});
  }, []);
  return stats;
}

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
      <g className={nc(count,2)}>
        <rect x="8" y="73" width="66" height="28" rx="6" fill="#3b82f620" stroke="#3b82f6" strokeWidth="1.2"/>
        <text x="41" y="91" textAnchor="middle" fontSize="9" fill="#93c5fd" fontWeight="600">User</text>
      </g>
      <line className={ec(count,2)} x1="74" y1="87" x2="105" y2="87" stroke="#60a5fa" strokeWidth="1.5" pathLength="1" markerEnd="url(#fa1)"/>
      <g className={nc(count,2)}>
        <rect x="106" y="73" width="84" height="28" rx="6" fill="#8b5cf620" stroke="#8b5cf6" strokeWidth="1.2"/>
        <text x="148" y="91" textAnchor="middle" fontSize="9" fill="#c4b5fd" fontWeight="600">API Gateway</text>
      </g>
      <path className={ec(count,3)} d="M192,80 Q210,80 215,58" stroke="#60a5fa" strokeWidth="1.5" fill="none" pathLength="1" markerEnd="url(#fa1)"/>
      <g className={nc(count,3)}>
        <rect x="216" y="38" width="68" height="28" rx="6" fill="#10b98120" stroke="#10b981" strokeWidth="1.2"/>
        <text x="250" y="56" textAnchor="middle" fontSize="9" fill="#6ee7b7" fontWeight="600">Auth</text>
      </g>
      <path className={ec(count,4)} d="M192,94 Q210,94 215,116" stroke="#60a5fa" strokeWidth="1.5" fill="none" pathLength="1" markerEnd="url(#fa1)"/>
      <g className={nc(count,4)}>
        <rect x="216" y="108" width="68" height="28" rx="6" fill="#ec489920" stroke="#ec4899" strokeWidth="1.2"/>
        <text x="250" y="126" textAnchor="middle" fontSize="9" fill="#f9a8d4" fontWeight="600">Orders</text>
      </g>
      <line className={ec(count,5)} x1="284" y1="52" x2="308" y2="52" stroke="#34d399" strokeWidth="1.5" pathLength="1" markerEnd="url(#fa2)"/>
      <g className={nc(count,5)}>
        <ellipse cx="335" cy="52" rx="30" ry="15" fill="#34d39920" stroke="#34d399" strokeWidth="1.2"/>
        <ellipse cx="335" cy="46" rx="30" ry="8" fill="#34d39930" stroke="#34d399" strokeWidth="1"/>
        <text x="335" y="56" textAnchor="middle" fontSize="7.5" fill="#6ee7b7">Users DB</text>
      </g>
      <line className={ec(count,6)} x1="284" y1="122" x2="308" y2="122" stroke="#fbbf24" strokeWidth="1.5" pathLength="1" markerEnd="url(#fa3)"/>
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
    [1,0,168,'Welcome!','dashed',7],
  ];
  return (
    <svg viewBox="0 0 380 185" fill="none" style={{ width:'100%', height:'100%', padding:'6px' }}>
      <defs>
        <marker id="sa1" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5Z" fill="#60a5fa"/></marker>
        <marker id="sa2" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5Z" fill="#a5b4fc"/></marker>
      </defs>
      {cols.map((x, i) => (
        <g key={i} className={nc(count, 1)}>
          <rect x={x-32} y={8} width={64} height={22} rx="5" fill={`${colors[i]}20`} stroke={colors[i]} strokeWidth="1.2"/>
          <text x={x} y={23} textAnchor="middle" fontSize="8.5" fill={colors[i]} fontWeight="600">{labels[i]}</text>
          <line x1={x} y1={30} x2={x} y2={175} stroke={colors[i]} strokeWidth="0.8" strokeDasharray="3 3" opacity="0.35"/>
        </g>
      ))}
      {msgs.map(([from, to, y, lbl, style, revealAt]) => {
        const x1 = cols[from], x2 = cols[to];
        const isDashed = style === 'dashed';
        return (
          <g key={y} className={ec(count, revealAt)}>
            <line x1={x1} y1={y} x2={x2} y2={y} stroke={isDashed ? '#a5b4fc' : '#60a5fa'} strokeWidth="1.2" strokeDasharray={isDashed ? '4 2' : undefined} pathLength="1" markerEnd={`url(#${isDashed ? 'sa2' : 'sa1'})`} />
            <text x={(x1+x2)/2} y={y-4} textAnchor="middle" fontSize="7" fill="#94a3b8">{lbl}</text>
          </g>
        );
      })}
    </svg>
  );
}

function C4SVG({ count }) {
  return (
    <svg viewBox="0 0 380 185" fill="none" style={{ width:'100%', height:'100%', padding:'8px' }}>
      <defs><marker id="ca1" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5Z" fill="#10b981"/></marker></defs>
      <g className={nc(count, 3)}>
        <circle cx="36" cy="68" r="12" fill="#3b82f620" stroke="#3b82f6" strokeWidth="1.2"/>
        <line x1="36" y1="80" x2="36" y2="105" stroke="#3b82f6" strokeWidth="1.2"/>
        <line x1="20" y1="90" x2="52" y2="90" stroke="#3b82f6" strokeWidth="1.2"/>
        <line x1="36" y1="105" x2="22" y2="120" stroke="#3b82f6" strokeWidth="1.2"/>
        <line x1="36" y1="105" x2="50" y2="120" stroke="#3b82f6" strokeWidth="1.2"/>
        <text x="36" y="135" textAnchor="middle" fontSize="8" fill="#93c5fd" fontWeight="600">Customer</text>
      </g>
      <g className={nc(count, 4)}>
        <rect x="80" y="12" width="260" height="158" rx="8" fill="#1e293b30" stroke="#475569" strokeWidth="1.2" strokeDasharray="6 3"/>
        <text x="210" y="28" textAnchor="middle" fontSize="8" fill="#64748b" fontWeight="600">Platform Boundary</text>
      </g>
      <g className={nc(count, 5)}>
        <rect x="90" y="35" width="105" height="38" rx="5" fill="#3b82f620" stroke="#3b82f6" strokeWidth="1.2"/>
        <text x="143" y="55" textAnchor="middle" fontSize="8.5" fill="#93c5fd" fontWeight="600">React SPA</text>
        <text x="143" y="66" textAnchor="middle" fontSize="6.5" fill="#64748b">TypeScript</text>
      </g>
      <g className={nc(count, 6)}>
        <rect x="90" y="88" width="105" height="38" rx="5" fill="#10b98120" stroke="#10b981" strokeWidth="1.2"/>
        <text x="143" y="108" textAnchor="middle" fontSize="8.5" fill="#6ee7b7" fontWeight="600">Node API</text>
        <text x="143" y="119" textAnchor="middle" fontSize="6.5" fill="#64748b">Express</text>
      </g>
      <g className={nc(count, 7)}>
        <rect x="225" y="60" width="105" height="50" rx="5" fill="#f59e0b20" stroke="#f59e0b" strokeWidth="1.2"/>
        <text x="278" y="83" textAnchor="middle" fontSize="8.5" fill="#fbbf24" fontWeight="600">PostgreSQL</text>
        <text x="278" y="96" textAnchor="middle" fontSize="6.5" fill="#64748b">Database</text>
      </g>
      <g className={ec(count, 9)}>
        <line x1="68" y1="75" x2="90" y2="55" stroke="#10b981" strokeWidth="1.2" pathLength="1" markerEnd="url(#ca1)"/>
        <text x="74" y="62" fontSize="6.5" fill="#94a3b8">HTTPS</text>
      </g>
      <line className={ec(count,10)} x1="143" y1="73" x2="143" y2="88" stroke="#10b981" strokeWidth="1.2" pathLength="1" markerEnd="url(#ca1)"/>
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
      <g className={nc(count,2)}>
        <circle cx="190" cy="16" r="7" fill="#60a5fa"/>
        <circle cx="190" cy="16" r="10" stroke="#60a5fa" strokeWidth="1" fill="none"/>
      </g>
      <line className={ec(count,2)} x1="190" y1="26" x2="190" y2="42" stroke="#60a5fa" strokeWidth="1.2" pathLength="1" markerEnd="url(#sta1)"/>
      <g className={nc(count,2)}>
        <rect x="150" y="43" width="80" height="26" rx="13" fill="#3b82f620" stroke="#3b82f6" strokeWidth="1.2"/>
        <text x="190" y="60" textAnchor="middle" fontSize="9" fill="#93c5fd" fontWeight="600">Idle</text>
      </g>
      <g className={ec(count,3)}>
        <line x1="190" y1="69" x2="190" y2="88" stroke="#60a5fa" strokeWidth="1.2" pathLength="1" markerEnd="url(#sta1)"/>
        <text x="196" y="82" fontSize="7" fill="#94a3b8">submit()</text>
      </g>
      <g className={nc(count,3)}>
        <rect x="143" y="89" width="94" height="26" rx="13" fill="#f59e0b20" stroke="#f59e0b" strokeWidth="1.2"/>
        <text x="190" y="106" textAnchor="middle" fontSize="9" fill="#fbbf24" fontWeight="600">Loading</text>
      </g>
      <g className={ec(count,4)}>
        <path d="M163,115 Q120,130 108,148" stroke="#22c55e" strokeWidth="1.2" fill="none" pathLength="1" markerEnd="url(#sta2)"/>
        <text x="117" y="135" fontSize="7" fill="#94a3b8">200 OK</text>
      </g>
      <g className={nc(count,4)}>
        <rect x="60" y="149" width="90" height="26" rx="13" fill="#22c55e20" stroke="#22c55e" strokeWidth="1.2"/>
        <text x="105" y="166" textAnchor="middle" fontSize="9" fill="#4ade80" fontWeight="600">Success</text>
      </g>
      <g className={ec(count,5)}>
        <path d="M217,115 Q260,130 272,148" stroke="#ef4444" strokeWidth="1.2" fill="none" pathLength="1" markerEnd="url(#sta3)"/>
        <text x="255" y="135" fontSize="7" fill="#94a3b8">4xx/5xx</text>
      </g>
      <g className={nc(count,5)}>
        <rect x="230" y="149" width="90" height="26" rx="13" fill="#ef444420" stroke="#ef4444" strokeWidth="1.2"/>
        <text x="275" y="166" textAnchor="middle" fontSize="9" fill="#fca5a5" fontWeight="600">Error</text>
      </g>
      <g className={ec(count,6)}>
        <path d="M60,162 Q28,90 150,56" stroke="#22c55e" strokeWidth="1.2" fill="none" strokeDasharray="4 2" pathLength="1" markerEnd="url(#sta2)"/>
        <text x="38" y="105" fontSize="7" fill="#94a3b8">reset()</text>
      </g>
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
      [{ t:'  U', c:'#e2e8f0' }, { t:'["User"]', c:'#34d399' }, { t:' --> ', c:'#60a5fa' }, { t:'GW', c:'#e2e8f0' }],
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
      [{ t:'  Frontend', c:'#8b5cf6' }, { t:'-->>User: ', c:'#a5b4fc' }, { t:'Welcome!', c:'#4ade80' }],
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
    <div className="hero-demo-panel" style={{ opacity: phase === 'fading' ? 0 : 1, transition: 'opacity 0.42s ease' }}>
      <div className="demo-tab-bar">
        <div className="demo-dot demo-dot-red" />
        <div className="demo-dot demo-dot-yellow" />
        <div className="demo-dot demo-dot-green" />
        <span className="demo-filename" style={{ color: demo.color }}>{demo.label}</span>
        <span className="demo-badge" style={{ color: demo.color, borderColor: demo.color }}>{demoIdx + 1}/{DEMOS.length}</span>
      </div>
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
      <div className="demo-preview-panel" key={`preview-${demoIdx}`}>
        <span className="demo-preview-label">LIVE PREVIEW</span>
        <SVG count={revealedCount} />
      </div>
      <div className="demo-progress-bar">
        <div className="demo-progress-fill" style={{ width: `${(revealedCount / demo.lines.length) * 100}%`, background: demo.color, transition: 'width 0.45s ease' }} />
      </div>
    </div>
  );
}

/* ── Section Divider ───────────────────────────────────────────── */
function SectionDivider() {
  return <div className="section-divider" />;
}

/* ── Carousel slide visuals (simplified) ──────────────────────── */
const MermaidAIVisual = () => (
  <svg viewBox="0 0 480 260" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
    <rect x="8" y="20" width="190" height="130" rx="8" fill="#0d0d1f" stroke="#7c3aed" strokeWidth="1.5"/>
    <rect x="16" y="28" width="174" height="18" rx="4" fill="#1e1b4b"/>
    <text x="26" y="40" fontSize="8" fill="#a78bfa" fontWeight="700">Ask any AI tool</text>
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
    <text x="230" y="215" textAnchor="middle" fontSize="9" fill="#4ade80" fontWeight="700">Professional diagrams for your team</text>
    <text x="230" y="232" textAnchor="middle" fontSize="8" fill="#86efac">Flowchart, Sequence, C4, State, ER, Gantt, Mindmap, Timeline, Kanban + more</text>
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
    <text x="100" y="148" fontSize="7" fill="#64748b">Drag EIP components, connect, configure, done</text>
    <rect x="8" y="168" width="285" height="40" rx="6" fill="#451a0320" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 2"/>
    <text x="150" y="183" textAnchor="middle" fontSize="8" fill="#fbbf24" fontWeight="600">Copy YAML, drop into your Camel / Spring Boot project</text>
    <text x="150" y="197" textAnchor="middle" fontSize="7" fill="#92400e">Works with Apache Camel 4.x, Camel K, Camel Quarkus</text>
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
    {[{label:'PNG',sub:'2x retina',color:'#3b82f6',x:40,y:40,lx:155,ly:88},{label:'SVG',sub:'vector',color:'#8b5cf6',x:40,y:120,lx:155,ly:115},{label:'JSON',sub:'layout',color:'#10b981',x:40,y:200,lx:155,ly:145},{label:'YAML',sub:'structure',color:'#f59e0b',x:370,y:40,lx:325,ly:88},{label:'.mmd',sub:'mermaid',color:'#ec4899',x:370,y:120,lx:325,ly:115},{label:'YAML',sub:'camel dsl',color:'#ef4444',x:370,y:200,lx:325,ly:145}].map(({label,sub,color,x,y,lx,ly})=>(<g key={`${x},${y}`}><rect x={x} y={y} width={68} height={38} rx="6" fill={`${color}20`} stroke={color} strokeWidth="1.2"/><text x={x+34} y={y+17} textAnchor="middle" fontSize="9" fill={color} fontWeight="700">{label}</text><text x={x+34} y={y+29} textAnchor="middle" fontSize="6.5" fill={color} opacity="0.7">{sub}</text><line x1={x>200?x:x+68} y1={y+19} x2={lx} y2={ly} stroke={color} strokeWidth="1" strokeDasharray="3 2" opacity="0.6"/></g>))}
    <rect x="80" y="190" width="320" height="55" rx="10" fill="#1e3a5f30" stroke="#3b82f6" strokeWidth="1.5"/>
    <text x="120" y="213" fontSize="8.5" fill="#60a5fa" fontWeight="700">Share with anyone, one click</text>
    <rect x="95" y="222" width="220" height="16" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1"/>
    <text x="100" y="233" fontSize="6.5" fill="#64748b" fontFamily="monospace">https://model.studio/#diagram=eyJub2Rlc...</text>
    <rect x="320" y="222" width="65" height="16" rx="4" fill="#3b82f620" stroke="#3b82f6" strokeWidth="1"/>
    <text x="352" y="233" textAnchor="middle" fontSize="7" fill="#60a5fa" fontWeight="700">Copied!</text>
    <text x="240" y="256" textAnchor="middle" fontSize="7" fill="#64748b">Link encodes the full diagram state, no server, no account needed</text>
  </svg>
);

/* ── Carousel Slides ──────────────────────────────────────────── */
const SLIDES = [
  {
    tag: 'Code to Diagram',
    tagColor: '#8b5cf6',
    headline: 'Write Mermaid code, watch it render live',
    body: 'Create multiple tabs in a Notepad++-style layout. Copy Mermaid or C4 code from any AI assistant, paste it, rename tabs, and watch it instantly draw the corresponding flowcharts, sequence diagrams, class models, or ERDs.',
    steps: [
      'Create and manage multiple diagram tabs',
      'Paste/type Mermaid or C4 code directly',
      'Instant parsing and live side-by-side rendering',
      'Full validation and auto-caching to localStorage'
    ],
    stepColor: '#8b5cf6',
    videoSrc: cadDemoVideo
  },
  {
    tag: 'Free-form Sketching',
    tagColor: '#ec4899',
    headline: 'Draw diagrams and export to PNG, SVG, or JSON',
    body: 'Brainstorm with sticky notes, text labels, hand-drawn shapes, arrows, and freehand lines. Save your canvas layout as a JSON file, or export it to production-ready PNG or SVG in one click.',
    steps: [
      'Sketch freehand paths and geometric shapes',
      'Annotate with colorful, resizable sticky notes',
      'Export instantly as high-fidelity PNG or vector SVG',
      'Save diagram source layout as JSON code to load later'
    ],
    stepColor: '#ec4899',
    videoSrc: drawDemoVideo
  },
  {
    tag: 'Domain-Driven Design',
    tagColor: '#3b82f6',
    headline: 'Model bounded contexts and strategic context maps',
    body: 'Drag and drop containers, aggregates, entities, and services on the canvas. Organise complex systems visually and keep your domain model structures synchronized.',
    steps: [
      'Design context boundaries and domain events',
      'Load pre-built Strategic Shipping templates',
      'Move, group, and connect nested domain aggregates',
      'Persist all tactical model states in local storage'
    ],
    stepColor: '#3b82f6',
    videoSrc: dddDemoVideo
  },
  {
    tag: 'Visual Integrations',
    tagColor: '#f59e0b',
    headline: 'Build Apache Camel routes visually, export YAML',
    body: 'Construct enterprise integration patterns (EIP) by dragging direct endpoints, choices, and loggers onto the canvas. Wire them together, then export clean Camel YAML DSL code.',
    steps: [
      'Drag and connect visual EIP components',
      'Load File Archiver or REST API route templates',
      'Auto-arrange routes with one-click auto-layout',
      'Export production Camel YAML for Spring Boot/Quarkus'
    ],
    stepColor: '#f59e0b',
    videoSrc: camelDemoVideo
  }
];

const SLIDE_DURATION = 7000;

function Carousel() {
  const [idx, setIdx]       = useState(0);
  const [paused, setPaused] = useState(false);
  const [phase, setPhase]   = useState('in');
  const [dir, setDir]       = useState(1);
  const touchX              = useRef(null);
  const timerRef            = useRef(null);

  const go = useCallback((nextIdx, direction = 1) => {
    setDir(direction);
    setPhase('out');
    setTimeout(() => { setIdx(nextIdx); setPhase('in'); }, 320);
  }, []);

  const goNext = useCallback(() => go((idx + 1) % SLIDES.length,  1), [idx, go]);
  const goPrev = useCallback(() => go((idx - 1 + SLIDES.length) % SLIDES.length, -1), [idx, go]);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setTimeout(goNext, SLIDE_DURATION);
    return () => clearTimeout(timerRef.current);
  }, [paused, goNext, idx]);

  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 44) dx < 0 ? goNext() : goPrev();
    touchX.current = null;
  };

  const slide = SLIDES[idx];
  const exiting = phase === 'out';
  const textX   = exiting ? `${dir * -52}px`  : '0px';
  const visualX = exiting ? `${dir * -24}px`  : '0px';
  const opacity = exiting ? 0 : 1;

  return (
    <section className="carousel-section reveal" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="section-header" style={{ marginBottom: '2rem', textAlign: 'left' }}>
        <h2>How engineers use it</h2>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Three workflows that cover most diagramming needs.</p>
      </div>

      <div className="carousel-stage" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="carousel-progress">
          <div key={`${idx}-${paused}`} className={`carousel-progress-fill ${paused ? 'paused' : ''}`} style={{ '--slide-duration': `${SLIDE_DURATION}ms`, background: slide.tagColor }} />
        </div>

        <div className="carousel-slide">
          <div className="carousel-text" style={{ opacity, transform: `translateX(${textX})`, transition: exiting ? 'opacity 0.28s ease, transform 0.32s ease' : 'opacity 0.38s ease 0.05s, transform 0.42s cubic-bezier(0.22,1,0.36,1) 0.05s' }}>
            <div className="carousel-tag" style={{ background:`${slide.tagColor}20`, border:`1px solid ${slide.tagColor}50`, color:slide.tagColor }}>{slide.tag}</div>
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
          <div className="carousel-visual" style={{ opacity, transform: `translateX(${visualX})`, transition: exiting ? 'opacity 0.28s ease, transform 0.42s ease' : 'opacity 0.38s ease 0.05s, transform 0.55s cubic-bezier(0.22,1,0.36,1) 0.05s' }}>
            <VideoVisual src={slide.videoSrc} />
          </div>
        </div>

        <button className="carousel-arrow carousel-arrow-left"  onClick={goPrev} aria-label="Previous"><ChevronLeft  size={18}/></button>
        <button className="carousel-arrow carousel-arrow-right" onClick={goNext} aria-label="Next"><ChevronRight size={18}/></button>
      </div>

      <div className="carousel-dots">
        {SLIDES.map((s, i) => (
          <button key={i} className={`carousel-dot ${i === idx ? 'active' : ''}`} style={{ '--dot-color': s.tagColor }} onClick={() => go(i, i > idx ? 1 : -1)} aria-label={s.tag} />
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
  { id:'ddd',     label:'Domain-Driven Design',  icon:<Boxes size={20}/>,    color:'#3b82f6', dim:'#1e3a5f', desc:'Model bounded contexts, aggregates, entities, and domain events with the full DDD toolkit.', Mockup:DddMockup, screenshot: dddScreenshot },
  { id:'diagram', label:'System Architecture',   icon:<Network size={20}/>,  color:'#10b981', dim:'#064e3b', desc:'Drag servers, databases, and cloud services onto the canvas. Auto-layout handles the rest.', Mockup:ArchMockup, screenshot: archScreenshot },
  { id:'cad',     label:'Code as Diagram',       icon:<Code2 size={20}/>,    color:'#8b5cf6', dim:'#2e1065', desc:'Monaco editor with live Mermaid preview, 26+ diagram types, error checking, and instant export.', Mockup:CadMockup, screenshot: cadScreenshot },
  { id:'eip',     label:'Apache Camel EIP',      icon:<Workflow size={20}/>, color:'#f59e0b', dim:'#78350f', desc:'Design integration routes visually, export production Camel YAML for Spring Boot or Quarkus.', Mockup:EipMockup, screenshot: camelScreenshot },
  { id:'draw',    label:'Free-form Draw',        icon:<Pencil size={20}/>,   color:'#ec4899', dim:'#500724', desc:'Freehand pencil, shapes, and sticky notes for brainstorming and whiteboard-style sessions.', Mockup:DrawMockup, screenshot: drawScreenshot },
];

const FEATURES = [
  { icon:<Bot size={22}/>,       accent:'#7c3aed', title:'AI-Ready Workflows',        desc:'Export JSON, paste Mermaid code from any AI tool, or copy your story text.' },
  { icon:<Code2 size={22}/>,     accent:'#8b5cf6', title:'26+ Diagram Types',         desc:'Flowchart, Sequence, C4, Class, State, ER, Gantt, Mindmap, Timeline, Kanban, and more.' },
  { icon:<Download size={22}/>,  accent:'#10b981', title:'Every Export Format',        desc:'PNG (retina), SVG, JSON, YAML, .mermaid, Camel YAML DSL. Import back too.' },
  { icon:<Share2 size={22}/>,    accent:'#3b82f6', title:'One-Click Share Link',       desc:'A link that encodes your entire diagram. Anyone opens it, no account needed.' },
  { icon:<Palette size={22}/>,   accent:'#ec4899', title:'13 Diagram Themes',          desc:'Ocean, Midnight, Emerald, Amethyst, Rose, Sunrise, Slate, Mono, Corporate.' },
  { icon:<Zap size={22}/>,       accent:'#f59e0b', title:'Auto-Layout Engine',         desc:'One-click LR or TB Dagre layout respecting containers and nesting.' },
  { icon:<Layers size={22}/>,    accent:'#a855f7', title:'40+ Templates',              desc:'AWS Architecture, K8s, OAuth Flow, Zero Trust, C4 diagrams, ER schemas.' },
  { icon:<Shield size={22}/>,    accent:'#22c55e', title:'Local-First & Private',      desc:'Everything in your browser. Auto-saves to localStorage. Works offline.' },
];

/* ── Video Visual Renderer ─────────────────────────────────────── */
const VideoVisual = ({ src }) => (
  <div style={{
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0f111a',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    aspectRatio: '16/9'
  }}>
    <video
      src={src}
      autoPlay
      loop
      muted
      playsInline
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
  </div>
);

/* ── Workspace Preview Gallery ────────────────────────────────── */
function WorkspaceGallery() {
  const [activeTab, setActiveTab] = useState('cad');
  const tabs = [
    { id: 'cad', label: 'Code as Diagram', img: cadScreenshot, color: '#8b5cf6', bullet: 'Write code in Monaco editor, render 26+ Mermaid & C4 diagram types, double-click tabs to rename, and auto-cache your progress notepad-style.' },
    { id: 'diagram', label: 'System Diagrams', img: archScreenshot, color: '#10b981', bullet: 'Drag cloud servers, databases, and network elements. Draw smart arrows and use one-click auto-layout to arrange them.' },
    { id: 'ddd', label: 'Domain Driven', img: dddScreenshot, color: '#3b82f6', bullet: 'Model bounded contexts, aggregate roots, entities, and events. Group tactical components inside container boundaries.' },
    { id: 'eip', label: 'Camel / EIP', img: camelScreenshot, color: '#f59e0b', bullet: 'Visually construct Enterprise Integration Patterns (EIP) routes, and export production-ready Camel YAML DSL.' },
    { id: 'draw', label: 'Freehand Draw', img: drawScreenshot, color: '#ec4899', bullet: 'Sketch wireframes and designs. Toggle sketchy Rough.js styling, drop sticky notes, and export vector SVG/PNG.' },
  ];
  const cur = tabs.find(t => t.id === activeTab);
  
  return (
    <section className="gallery-section reveal">
      <div className="section-header" style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h2>Explore Workspaces</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Click through each tab to preview our professional design workspaces in high fidelity.</p>
      </div>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '20px' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: activeTab === t.id ? `${t.color}15` : 'transparent',
              color: activeTab === t.id ? t.color : 'var(--text-secondary)',
              borderColor: activeTab === t.id ? t.color : 'var(--border-color)',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '0.85rem',
              transition: 'all 0.2s ease',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      
      <div style={{
        background: '#0f111a',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        padding: '16px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-color)', background: '#020205' }}>
          <img src={cur.img} alt={cur.label} style={{ width: '100%', display: 'block', maxHeight: '550px', objectFit: 'contain' }} />
        </div>
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: '1.6', textAlign: 'center', fontWeight: '500' }}>
          <span style={{ color: cur.color, fontWeight: '700' }}>{cur.label}:</span> {cur.bullet}
        </p>
      </div>
    </section>
  );
}

/* ── Landing Page ──────────────────────────────────────────────── */
function LandingPage({ onLaunch }) {
  useScrollReveal();
  const gh = useGitHubStats();

  return (
    <div className="landing-container" data-theme="dark">

      {/* Nav */}
      <nav className="landing-nav">
        <div className="nav-logo"><MSLogo size={34}/><span>Model Studio</span></div>
        <div className="nav-links">
          <a href="#how-it-works">How It Works</a>
          <a href="#workspaces">Workspaces</a>
          <a href="#features">Features</a>
          <a href="https://github.com/geekpratyush/ModelStudio" target="_blank" rel="noopener noreferrer" className="github-link nav-icon" title="GitHub"><GitHubIcon size={20}/></a>
          <button className="btn btn-primary nav-cta" onClick={onLaunch}>Launch Studio</button>
        </div>
      </nav>

      {/* Hero */}
      <header className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">Open source, browser-based diagramming</div>
          <h1>Diagrams for<br />software engineers.</h1>
          <p>
            Five purpose-built workspaces for architecture, Mermaid code, Apache Camel routes, 
            domain-driven design, and freehand sketching. Paste code from any AI tool, export to anything, share with a link.
          </p>
          <div className="hero-actions">
            <button className="btn btn-lg btn-primary" onClick={onLaunch}>
              Open Studio <ArrowRight size={20}/>
            </button>
            <a href="https://github.com/geekpratyush/ModelStudio" target="_blank" rel="noopener noreferrer" className="btn btn-lg btn-outline">
              <GitHubIcon size={18}/> View on GitHub
            </a>
          </div>
          <div className="hero-stats-bar">
            <span className="stat"><Star size={14}/> {gh.stars} stars</span>
            <span className="stat"><GitFork size={14}/> {gh.forks} forks</span>
            <span className="stat">Updated {gh.updated}</span>
            <span className="stat">MIT License</span>
          </div>
        </div>
        <div className="hero-visual" style={{ width: '100%', maxWidth: '600px', display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: '100%',
            background: '#0a0e1a',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: '#0d0d18', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#eab308' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }} />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '12px', fontWeight: '500' }}>Code as Diagram Workspace</span>
            </div>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', overflow: 'hidden', background: '#020205' }}>
              <video
                src={cadDemoVideo}
                autoPlay
                loop
                muted
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>
          <div className="visual-glow"/>
        </div>
      </header>

      <SectionDivider />

      {/* Workspace Preview Gallery */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
        <WorkspaceGallery />
      </div>

      <SectionDivider />

      {/* Carousel */}
      <div id="how-it-works">
        <Carousel />
      </div>

      <SectionDivider />

      {/* Workspaces */}
      <section id="workspaces" className="workspaces-section">
        <div className="section-header reveal">
          <h2>Five Workspaces</h2>
          <p>Each built for a specific kind of diagramming. Switch between them, your work persists.</p>
        </div>
        <div className="workspaces-grid">
          {WORKSPACES.map((ws, i) => (
            <div key={ws.id} className={`workspace-card reveal ${i % 2 === 0 ? 'reveal-left' : 'reveal-right'}`}
              style={{ '--ws-color':ws.color, '--ws-dim':ws.dim, transitionDelay:`${i * 80}ms` }}>
              <div className="ws-preview" style={{ padding: 0, overflow: 'hidden', display: 'flex', alignItems: 'stretch' }}>
                <img src={ws.screenshot} alt={ws.label} className="ws-screenshot" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top left', opacity: 0.72, transition: 'all 0.3s ease' }} />
              </div>
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
          <h2>Built for people who ship</h2>
          <p>No onboarding, no account, no subscription. Just open and start diagramming.</p>
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
          <h2>Open it. Use it. Done.</h2>
          <p>Runs entirely in your browser. Your diagrams stay on your machine.</p>
          <div style={{ display:'flex', gap:'1rem', justifyContent:'center', flexWrap:'wrap' }}>
            <button className="btn btn-lg btn-primary" onClick={onLaunch}>Launch Studio <ArrowRight size={20}/></button>
            <a href="https://github.com/geekpratyush/ModelStudio" target="_blank" rel="noopener noreferrer" className="btn btn-lg btn-outline">
              <GitHubIcon size={18}/> Star on GitHub
            </a>
          </div>
          <div className="cta-footer">
            <span>Built by <a href="https://www.linkedin.com/in/leadtherightway" target="_blank" rel="noopener noreferrer">Pratyush Ranjan Mishra</a></span>
            <span className="sep">·</span>
            <span className="made-with"><Heart size={12}/> Open source</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="nav-logo"><MSLogo size={24}/><span>Model Studio</span></div>
          <div className="footer-links">
            <a href="https://www.linkedin.com/in/leadtherightway" target="_blank" rel="noopener noreferrer" className="github-link"><LinkedInIcon size={18}/></a>
            <a href="https://github.com/geekpratyush/ModelStudio" target="_blank" rel="noopener noreferrer" className="github-link"><GitHubIcon size={20}/></a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
