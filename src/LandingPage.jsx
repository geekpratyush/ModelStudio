import {
  ArrowRight, Code2, Layers, Workflow, Pencil, Layout,
  Download, FileCode2, Palette, Boxes, Zap, Shield,
  GitBranch, BarChart3, Network, BookTemplate
} from 'lucide-react';
import MSLogo from './components/MSLogo';
import './LandingPage.css';

const GitHubIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 -0.5 25 25" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="m12.301 0h.093c2.242 0 4.34.613 6.137 1.68l-.055-.031c1.871 1.094 3.386 2.609 4.449 4.422l.031.058c1.04 1.769 1.654 3.896 1.654 6.166 0 5.406-3.483 10-8.327 11.658l-.087.026c-.063.02-.135.031-.209.031-.162 0-.312-.054-.433-.144l.002.001c-.128-.115-.208-.281-.208-.466 0-.005 0-.01 0-.014v.001q0-.048.008-1.226t.008-2.154c.007-.075.011-.161.011-.249 0-.792-.323-1.508-.844-2.025.618-.061 1.176-.163 1.718-.305l-.076.017c.573-.16 1.073-.373 1.537-.642l-.031.017c.508-.28.938-.636 1.292-1.058l.006-.007c.372-.476.663-1.036.84-1.645l.009-.035c.209-.683.329-1.468.329-2.281 0-.045 0-.091-.001-.136v.007c0-.022.001-.047.001-.072 0-1.248-.482-2.383-1.269-3.23l.003.003c.168-.44.265-.948.265-1.479 0-.649-.145-1.263-.404-1.814l.011.026c-.115-.022-.246-.035-.381-.035-.334 0-.649.078-.929.216l.012-.005c-.568.21-1.054.448-1.512.726l.038-.022-.609.384c-.922-.264-1.981-.416-3.075-.416s-2.153.152-3.157.436l.081-.02q-.256-.176-.681-.433c-.373-.214-.814-.421-1.272-.595l-.066-.022c-.293-.154-.64-.244-1.009-.244-.124 0-.246.01-.364.03l.013-.002c-.248.524-.393 1.139-.393 1.788 0 .531.097 1.04.275 1.509l-.01-.029c-.785.844-1.266 1.979-1.266 3.227 0 .025 0 .051.001.076v-.004c-.001.039-.001.084-.001.13 0 .809.12 1.591.344 2.327l-.015-.057c.189.643.476 1.202.85 1.693l-.009-.013c.354.435.782.793 1.267 1.062l.022.011c.432.252.933.465 1.46.614l.046.011c.466.125 1.024.227 1.595.284l.046.004c-.431.428-.718 1-.784 1.638l-.001.012c-.207.101-.448.183-.699.236l-.021.004c-.256.051-.549.08-.85.08h-.066c-.394-.008-.756-.136-1.055-.348l.006.004c-.371-.259-.671-.595-.881-.986l-.007-.015c-.198-.336-.459-.614-.768-.827l-.009-.006c-.225-.169-.49-.301-.776-.38l-.016-.004-.32-.048c-.023-.002-.05-.003-.077-.003-.14 0-.273.028-.394.077l.007-.003q-.128.072-.08.184c.039.086.087.16.145.225l-.001-.001c.061.072.13.135.205.19l.003.002.112.08c.283.148.516.354.693.603l.004.006c.191.237.359.505.494.792l.01.024.16.368c.135.402.38.738.7.981l.005.004c.3.234.662.402 1.057.478l.016.002c.33.064.714.104 1.106.112h.007c.045.002.097.002.15.002.261 0 .517-.021.767-.062l-.027.004.368-.064q0 .609.008 1.418t.008.873v.014c0 .185-.08.351-.208.466h-.001c-.119.089-.268.143-.431.143-.075 0-.147-.011-.214-.032l.005.001c-4.929-1.689-8.409-6.283-8.409-11.69 0-2.268.612-4.393 1.681-6.219l-.032.058c1.094-1.871 2.609-3.386 4.422-4.449l.058-.031c1.739-1.034 3.835-1.645 6.073-1.645h.098z" />
  </svg>
);

const LinkedInIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

/* ── Mini SVG diagram mockups shown in the workspace cards ── */
const DddMockup = () => (
  <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
    <rect x="8" y="8" width="84" height="104" rx="6" fill="#3b82f620" stroke="#3b82f6" strokeWidth="1.2" strokeDasharray="4 2" />
    <rect x="16" y="18" width="68" height="28" rx="4" fill="#3b82f630" stroke="#3b82f6" strokeWidth="1" />
    <text x="50" y="37" textAnchor="middle" fontSize="8" fill="#93c5fd" fontWeight="600">Order Entity</text>
    <rect x="16" y="54" width="68" height="28" rx="4" fill="#3b82f620" stroke="#3b82f660" strokeWidth="1" />
    <text x="50" y="73" textAnchor="middle" fontSize="8" fill="#93c5fd">Address VO</text>
    <rect x="108" y="8" width="84" height="104" rx="6" fill="#8b5cf620" stroke="#8b5cf6" strokeWidth="1.2" strokeDasharray="4 2" />
    <rect x="116" y="18" width="68" height="28" rx="4" fill="#8b5cf630" stroke="#8b5cf6" strokeWidth="1" />
    <text x="150" y="37" textAnchor="middle" fontSize="8" fill="#c4b5fd" fontWeight="600">User Service</text>
    <rect x="116" y="54" width="68" height="28" rx="4" fill="#8b5cf620" stroke="#8b5cf660" strokeWidth="1" />
    <text x="150" y="73" textAnchor="middle" fontSize="8" fill="#c4b5fd">Domain Event</text>
    <line x1="84" y1="60" x2="108" y2="60" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="3 2" markerEnd="url(#a)" />
    <defs><marker id="a" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#60a5fa" /></marker></defs>
    <text x="96" y="56" textAnchor="middle" fontSize="6" fill="#60a5fa">ACL</text>
  </svg>
);

const ArchMockup = () => (
  <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
    <circle cx="28" cy="60" r="16" fill="#8b5cf620" stroke="#8b5cf6" strokeWidth="1.2" />
    <text x="28" y="64" textAnchor="middle" fontSize="7" fill="#c4b5fd">User</text>
    <rect x="60" y="44" width="44" height="32" rx="4" fill="#3b82f620" stroke="#3b82f6" strokeWidth="1.2" />
    <text x="82" y="64" textAnchor="middle" fontSize="7" fill="#93c5fd">API GW</text>
    <rect x="124" y="24" width="44" height="28" rx="4" fill="#10b98120" stroke="#10b981" strokeWidth="1.2" />
    <text x="146" y="41" textAnchor="middle" fontSize="7" fill="#6ee7b7">Service A</text>
    <rect x="124" y="68" width="44" height="28" rx="4" fill="#10b98120" stroke="#10b981" strokeWidth="1.2" />
    <text x="146" y="85" textAnchor="middle" fontSize="7" fill="#6ee7b7">Service B</text>
    <line x1="44" y1="60" x2="60" y2="60" stroke="#60a5fa" strokeWidth="1.2" markerEnd="url(#b)" />
    <line x1="104" y1="52" x2="124" y2="38" stroke="#34d399" strokeWidth="1.2" markerEnd="url(#c)" />
    <line x1="104" y1="68" x2="124" y2="80" stroke="#34d399" strokeWidth="1.2" markerEnd="url(#c)" />
    <defs>
      <marker id="b" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#60a5fa" /></marker>
      <marker id="c" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#34d399" /></marker>
    </defs>
  </svg>
);

const DacMockup = () => (
  <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
    <rect x="4" y="4" width="90" height="112" rx="4" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
    <text x="10" y="20" fontSize="7" fill="#64748b" fontFamily="monospace">flowchart LR</text>
    <text x="10" y="32" fontSize="7" fill="#7c3aed" fontFamily="monospace">  A</text>
    <text x="22" y="32" fontSize="7" fill="#64748b" fontFamily="monospace">["Start"]</text>
    <text x="10" y="44" fontSize="7" fill="#64748b" fontFamily="monospace">  A --&gt; B</text>
    <text x="10" y="56" fontSize="7" fill="#7c3aed" fontFamily="monospace">  B</text>
    <text x="22" y="56" fontSize="7" fill="#64748b" fontFamily="monospace">{"{"}"Check"{"}"}</text>
    <text x="10" y="68" fontSize="7" fill="#64748b" fontFamily="monospace">  B --&gt;|Yes| C</text>
    <text x="10" y="80" fontSize="7" fill="#10b981" fontFamily="monospace">  classDef ok</text>
    <text x="10" y="92" fontSize="7" fill="#10b981" fontFamily="monospace">    fill:#22c55e</text>
    <rect x="100" y="4" width="96" height="112" rx="4" fill="#111827" stroke="#1e293b" strokeWidth="1" />
    <rect x="112" y="20" width="36" height="20" rx="10" fill="#22c55e30" stroke="#22c55e" strokeWidth="1" />
    <text x="130" y="33" textAnchor="middle" fontSize="7" fill="#6ee7b7">Start</text>
    <polygon points="148,28 164,22 164,34" fill="#f59e0b20" stroke="#f59e0b" strokeWidth="1" />
    <text x="156" y="31" textAnchor="middle" fontSize="6" fill="#fbbf24">Check</text>
    <rect x="168" y="14" width="22" height="16" rx="3" fill="#3b82f620" stroke="#3b82f6" strokeWidth="1" />
    <text x="179" y="25" textAnchor="middle" fontSize="6" fill="#93c5fd">End</text>
    <line x1="148" y1="30" x2="164" y2="28" stroke="#60a5fa" strokeWidth="0.8" />
    <line x1="164" y1="22" x2="168" y2="20" stroke="#34d399" strokeWidth="0.8" />
  </svg>
);

const EipMockup = () => (
  <svg viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
    {[['Timer', '#3b82f6', 10], ['Choice', '#8b5cf6', 60], ['When', '#f59e0b', 110], ['DB', '#10b981', 160]].map(([label, color, x]) => (
      <g key={label}>
        <rect x={x} y="26" width="40" height="28" rx="4" fill={`${color}20`} stroke={color} strokeWidth="1.2" />
        <text x={x + 20} y="43" textAnchor="middle" fontSize="8" fill={color} fontWeight="600">{label}</text>
      </g>
    ))}
    {[50, 100, 150].map(x => (
      <line key={x} x1={x} y1="40" x2={x + 10} y2="40" stroke="#60a5fa" strokeWidth="1.2" markerEnd="url(#e)" />
    ))}
    <defs><marker id="e" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#60a5fa" /></marker></defs>
  </svg>
);

const DrawMockup = () => (
  <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
    <path d="M20,90 Q40,20 80,50 Q120,80 160,30 Q180,15 190,40" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.7" />
    <rect x="30" y="60" width="50" height="35" rx="6" fill="#8b5cf620" stroke="#8b5cf6" strokeWidth="1.5" />
    <circle cx="140" cy="70" r="22" fill="#10b98115" stroke="#10b981" strokeWidth="1.5" />
    <polygon points="90,20 110,55 70,55" fill="#f59e0b15" stroke="#f59e0b" strokeWidth="1.5" />
    <text x="55" y="82" textAnchor="middle" fontSize="8" fill="#c4b5fd">Cloud</text>
    <text x="140" y="74" textAnchor="middle" fontSize="8" fill="#6ee7b7">API</text>
    <path d="M60,95 Q80,108 108,90" stroke="#60a5fa" strokeWidth="1.2" strokeDasharray="3 2" fill="none" markerEnd="url(#f)" />
    <defs><marker id="f" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 Z" fill="#60a5fa" /></marker></defs>
  </svg>
);

const WORKSPACES = [
  {
    id: 'ddd',
    label: 'Domain-Driven Design',
    icon: <Boxes size={20} />,
    color: '#3b82f6',
    dim: '#1e3a5f',
    desc: 'Bounded Contexts, Aggregates, Entities, Value Objects, Domain Events, Repositories, and Context Mapping — the full DDD tactical and strategic palette.',
    Mockup: DddMockup,
  },
  {
    id: 'diagram',
    label: 'System Architecture',
    icon: <Network size={20} />,
    color: '#10b981',
    dim: '#064e3b',
    desc: 'Drag-and-drop architecture diagrams with actors, servers, databases, cylinders, class shapes, and brand icons for AWS, K8s, Docker, and more.',
    Mockup: ArchMockup,
  },
  {
    id: 'dac',
    label: 'Code as Diagram',
    icon: <Code2 size={20} />,
    color: '#8b5cf6',
    dim: '#2e1065',
    desc: 'Monaco-powered Mermaid editor with live preview, 30+ diagram types, 13 themes, LR/TD direction toggle, error squiggles, and one-click export.',
    Mockup: DacMockup,
  },
  {
    id: 'eip',
    label: 'Apache Camel EIP',
    icon: <Workflow size={20} />,
    color: '#f59e0b',
    dim: '#78350f',
    desc: 'Design Enterprise Integration Patterns visually — timers, choices, splitters, aggregators, wire taps — and export production-ready Camel YAML routes.',
    Mockup: EipMockup,
  },
  {
    id: 'draw',
    label: 'Free-form Draw',
    icon: <Pencil size={20} />,
    color: '#ec4899',
    dim: '#500724',
    desc: 'Freehand pencil, shapes, arrows, sticky notes, and sketch mode. Mix brand icons into whiteboard-style diagrams for presentations and brainstorming.',
    Mockup: DrawMockup,
  },
];

const FEATURES = [
  {
    icon: <BookTemplate size={22} />,
    accent: '#3b82f6',
    title: '40+ Pro Templates',
    desc: 'Jump-start with curated templates: AWS Architecture, Kubernetes Platform, Event-Driven Microservices, OAuth Flows, Zero Trust Security, C4 diagrams, ER schemas, and more.',
  },
  {
    icon: <Code2 size={22} />,
    accent: '#8b5cf6',
    title: '30+ Mermaid Diagram Types',
    desc: 'Flowcharts, Sequence, Class, State, ER, Gantt, C4 Context/Container, Mindmap, Timeline, Sankey, Kanban, Radar, Architecture-beta — all rendered live as you type.',
  },
  {
    icon: <Download size={22} />,
    accent: '#10b981',
    title: 'One-Click Export',
    desc: 'Export to PNG (2× retina), SVG, JSON, YAML, .mermaid source, or Camel route YAML. Import back from JSON, YAML, or Mermaid files.',
  },
  {
    icon: <Palette size={22} />,
    accent: '#ec4899',
    title: '13 Diagram Themes',
    desc: 'Switch between built-in Mermaid themes and custom dark presets — Ocean, Midnight, Emerald, Amethyst, Rose, Sunrise, Slate, Monochrome, Corporate — applied instantly.',
  },
  {
    icon: <Zap size={22} />,
    accent: '#f59e0b',
    title: 'Auto-Layout Engine',
    desc: 'Intelligent left-to-right and top-to-bottom graph arrangement that respects containers, nesting, and parent-child relationships with a single click.',
  },
  {
    icon: <FileCode2 size={22} />,
    accent: '#06b6d4',
    title: 'Live Code Editor',
    desc: 'Monaco editor with Mermaid syntax highlighting, bracket colorization, error squiggles, minimap, and auto-complete. Direction and theme controls in the toolbar.',
  },
  {
    icon: <Layout size={22} />,
    accent: '#a855f7',
    title: 'Rich Node Palette',
    desc: 'Boxes, actors, diamonds, cylinders, class shapes, callouts, sticky notes, containers, text, images — plus brand icons for Docker, K8s, AWS, GCP, Azure, Kafka, Redis, and more.',
  },
  {
    icon: <Shield size={22} />,
    accent: '#22c55e',
    title: 'Local-First & Private',
    desc: 'Everything runs in your browser. Auto-save to localStorage means no account, no server, no data leaves your machine. Works fully offline.',
  },
];

const LandingPage = ({ onLaunch }) => (
  <div className="landing-container" data-theme="dark">

    {/* ── Nav ── */}
    <nav className="landing-nav">
      <div className="nav-logo">
        <MSLogo size={34} />
        <span>Model Studio</span>
      </div>
      <div className="nav-links">
        <a href="#workspaces">Workspaces</a>
        <a href="#features">Features</a>
        <a href="https://www.linkedin.com/in/leadtherightway" target="_blank" rel="noopener noreferrer" className="github-link" title="Pratyush Ranjan Mishra on LinkedIn">
          <LinkedInIcon size={20} />
        </a>
        <a href="https://github.com/geekpratyush/ModelStudio" target="_blank" rel="noopener noreferrer" className="github-link">
          <GitHubIcon size={20} />
        </a>
        <button className="btn btn-primary nav-cta" onClick={onLaunch}>
          Launch Studio
        </button>
      </div>
    </nav>

    {/* ── Hero ── */}
    <header className="hero-section">
      <div className="hero-content">
        <div className="hero-badge">Professional System Design Tool · Open Source</div>
        <h1>Model Complex Systems.<br /><span className="text-gradient">Ship Better Architecture.</span></h1>
        <p>
          Five specialized workspaces — Domain-Driven Design, System Architecture,
          Code-as-Diagram, Apache Camel EIP, and Free-form Draw — in a single
          browser-based studio. No account needed.
        </p>
        <div className="hero-actions">
          <button className="btn btn-lg btn-primary" onClick={onLaunch}>
            Open Studio <ArrowRight size={20} />
          </button>
          <div className="hero-stats">
            <span>5 Workspaces</span>
            <div className="divider" />
            <span>40+ Templates</span>
            <div className="divider" />
            <span>30+ Diagram Types</span>
            <div className="divider" />
            <span>Open Source</span>
          </div>
        </div>
      </div>

      <div className="hero-visual">
        <div className="hero-mockup-grid">
          {WORKSPACES.slice(0, 3).map((ws) => (
            <div key={ws.id} className="hero-mini-card" style={{ borderColor: `${ws.color}40`, background: `${ws.dim}30` }}>
              <div className="hero-mini-header" style={{ color: ws.color }}>
                {ws.icon} <span>{ws.label}</span>
              </div>
              <div className="hero-mini-preview">
                <ws.Mockup />
              </div>
            </div>
          ))}
        </div>
        <div className="visual-glow" />
      </div>
    </header>

    {/* ── Workspaces ── */}
    <section id="workspaces" className="workspaces-section">
      <div className="section-header">
        <h2>Five Specialized <span className="text-gradient">Workspaces</span></h2>
        <p>Each workspace is purpose-built for a different modeling discipline — switch instantly, canvas state persists.</p>
      </div>
      <div className="workspaces-grid">
        {WORKSPACES.map((ws) => (
          <div key={ws.id} className="workspace-card" style={{ '--ws-color': ws.color, '--ws-dim': ws.dim }}>
            <div className="ws-preview">
              <ws.Mockup />
            </div>
            <div className="ws-body">
              <div className="ws-icon" style={{ background: `${ws.color}18`, color: ws.color }}>
                {ws.icon}
              </div>
              <h3 style={{ color: ws.color }}>{ws.label}</h3>
              <p>{ws.desc}</p>
            </div>
            <div className="ws-launch" style={{ borderColor: `${ws.color}30` }}>
              <button onClick={onLaunch} style={{ color: ws.color }}>
                Open workspace <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>

    {/* ── Features ── */}
    <section id="features" className="features-section">
      <div className="section-header">
        <h2>Everything an Architect <span className="text-gradient">Actually Needs</span></h2>
        <p>No subscriptions. No onboarding. Just open the browser and start designing.</p>
      </div>
      <div className="features-grid">
        {FEATURES.map((f) => (
          <div key={f.title} className="feature-item">
            <div className="feature-icon" style={{ background: `${f.accent}15`, color: f.accent }}>
              {f.icon}
            </div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* ── CTA ── */}
    <section className="cta-section">
      <div className="cta-box">
        <div className="cta-glow" />
        <MSLogo size={52} />
        <h2 className="text-gradient-animated">Start Designing Right Now</h2>
        <p>No sign-up. No install. Runs entirely in your browser — your diagrams stay on your machine.</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-lg btn-primary" onClick={onLaunch}>
            Launch Studio <ArrowRight size={20} />
          </button>
          <a
            href="https://github.com/geekpratyush/ModelStudio"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-lg btn-outline"
          >
            <GitHubIcon size={18} /> View on GitHub
          </a>
        </div>
      </div>
    </section>

    {/* ── Footer ── */}
    <footer className="landing-footer">
      <div className="footer-content">
        <div className="nav-logo">
          <MSLogo size={24} />
          <span>Model Studio</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <a href="https://www.linkedin.com/in/leadtherightway" target="_blank" rel="noopener noreferrer" className="github-link" style={{ color: 'var(--text-secondary)' }} title="LinkedIn">
            <LinkedInIcon size={18} />
          </a>
          <a href="https://github.com/geekpratyush/ModelStudio" target="_blank" rel="noopener noreferrer" className="github-link" style={{ color: 'var(--text-secondary)' }} title="GitHub">
            <GitHubIcon size={18} />
          </a>
          <p>&copy; 2026 <strong style={{ color: 'var(--text-primary)' }}>Pratyush Ranjan Mishra</strong> &middot; Model Studio &middot; MIT License</p>
        </div>
      </div>
    </footer>
  </div>
);

export default LandingPage;
