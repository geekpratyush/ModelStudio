import { useState, useEffect, useRef } from 'react';
import { X, MousePointer2, Hand, Square, Circle as CircleIcon, Diamond, Triangle, Cloud, ArrowUpRight, Minus, Type, Pencil, Eraser, StickyNote, Paintbrush, Lock, Layers, Download, Upload, Share2, Code, GitBranch, Workflow, Box, Database, Server, Network, ZoomIn, ZoomOut, Maximize2, Grid3X3, Info, ChevronRight, Play, RotateCcw } from 'lucide-react';

/* ─── Shared helpers ──────────────────────────────────────────── */
const Kbd = ({ k }) => (
  <kbd style={{ display:'inline-block', padding:'1px 6px', fontSize:'0.7rem', fontFamily:'monospace', fontWeight:700, background:'var(--bg-tertiary)', border:'1px solid var(--border-color)', borderRadius:'4px', color:'var(--text-primary)', lineHeight:'1.6', whiteSpace:'nowrap' }}>{k}</kbd>
);
const Row = ({ label, children }) => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid var(--border-color)' }}>
    <span style={{ fontSize:'0.82rem', color:'var(--text-secondary)' }}>{label}</span>
    <div style={{ display:'flex', gap:'4px', flexWrap:'wrap', justifyContent:'flex-end' }}>{children}</div>
  </div>
);
const Section = ({ title, children }) => (
  <div style={{ marginBottom:'22px' }}>
    <div style={{ fontSize:'0.68rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-secondary)', marginBottom:'10px', paddingBottom:'4px', borderBottom:'2px solid var(--border-color)' }}>{title}</div>
    {children}
  </div>
);
const Chip = ({ color='#3b82f6', children }) => (
  <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', padding:'2px 8px', borderRadius:'999px', fontSize:'0.72rem', fontWeight:600, background:`${color}18`, border:`1px solid ${color}40`, color }}>{children}</span>
);
const Feature = ({ icon, title, desc }) => (
  <div style={{ display:'flex', gap:'10px', padding:'8px 0', borderBottom:'1px solid var(--border-color)' }}>
    <div style={{ flexShrink:0, marginTop:'2px', color:'var(--text-secondary)' }}>{icon}</div>
    <div>
      <div style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--text-primary)', marginBottom:'2px' }}>{title}</div>
      <div style={{ fontSize:'0.78rem', color:'var(--text-secondary)', lineHeight:'1.5' }}>{desc}</div>
    </div>
  </div>
);

/* ─── Draw demo ───────────────────────────────────────────────── */
function DrawDemo() {
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const timerRef = useRef(null);
  const STEPS = 7;

  const start = () => { setStep(0); setRunning(true); };
  useEffect(() => {
    if (!running) return;
    timerRef.current = setInterval(() => {
      setStep(s => {
        if (s >= STEPS - 1) { setRunning(false); return s; }
        return s + 1;
      });
    }, 900);
    return () => clearInterval(timerRef.current);
  }, [running]);

  const shapes = [
    { label:'Rectangle', visible: step >= 1, x:40,  y:40,  w:100, h:60,  fill:'#3b82f620', stroke:'#3b82f6', r:6,    type:'rect' },
    { label:'Circle',    visible: step >= 2, x:180, y:40,  w:70,  h:70,  fill:'#22c55e20', stroke:'#22c55e', r:35,   type:'circle' },
    { label:'Diamond',   visible: step >= 3, x:300, y:40,  w:80,  h:60,  fill:'#f59e0b20', stroke:'#f59e0b',         type:'diamond' },
    { label:'Cloud',     visible: step >= 4, x:40,  y:140, w:110, h:60,  fill:'#a855f720', stroke:'#a855f7',         type:'cloud' },
    { label:'Triangle',  visible: step >= 5, x:190, y:140, w:70,  h:60,  fill:'#ef444420', stroke:'#ef4444',         type:'triangle' },
    { label:'Arrow',     visible: step >= 6, x:300, y:150,                                  type:'arrow' },
    { label:'Text',      visible: step >= 7, x:40,  y:240,                                  type:'text' },
  ];

  return (
    <div style={{ background:'var(--bg-tertiary)', borderRadius:'12px', border:'1px solid var(--border-color)', padding:'16px', marginBottom:'16px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
        <span style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Canvas Demo</span>
        <div style={{ display:'flex', gap:'8px' }}>
          <button className="btn btn-icon-only" onClick={start} title="Play demo" style={{ padding:'4px 8px', fontSize:'0.72rem', display:'flex', alignItems:'center', gap:'4px' }}>
            {running ? <><span style={{ display:'inline-block', width:8, height:8, background:'currentColor', borderRadius:'1px' }} /> Stop</> : <><Play size={12} /> Play</>}
          </button>
          <button className="btn btn-icon-only" onClick={() => { setStep(0); setRunning(false); }} title="Reset" style={{ padding:'4px 6px' }}><RotateCcw size={12} /></button>
        </div>
      </div>
      <svg width="100%" viewBox="0 0 420 310" style={{ background:'var(--bg-primary)', borderRadius:'8px', border:'1px solid var(--border-color)' }}>
        {/* grid dots */}
        <defs>
          <pattern id="help-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="0.8" fill="currentColor" opacity="0.12" />
          </pattern>
        </defs>
        <rect width="420" height="310" fill="url(#help-dots)" />

        {shapes.map((s, i) => {
          if (!s.visible) return null;
          const labelY = (s.y || 0) + (s.h || 0) + 14;
          if (s.type === 'rect') return (
            <g key={i}>
              <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={s.r} fill={s.fill} stroke={s.stroke} strokeWidth="2" style={{ animation:'fadeIn 0.3s ease' }} />
              <text x={s.x + s.w/2} y={s.y + s.h/2 + 5} textAnchor="middle" fontSize="11" fill={s.stroke} fontWeight="600">Box</text>
              <text x={s.x + s.w/2} y={labelY} textAnchor="middle" fontSize="9" fill="currentColor" opacity="0.5">{s.label}</text>
            </g>
          );
          if (s.type === 'circle') return (
            <g key={i}>
              <ellipse cx={s.x + s.w/2} cy={s.y + s.h/2} rx={s.w/2} ry={s.h/2} fill={s.fill} stroke={s.stroke} strokeWidth="2" style={{ animation:'fadeIn 0.3s ease' }} />
              <text x={s.x + s.w/2} y={s.y + s.h/2 + 5} textAnchor="middle" fontSize="11" fill={s.stroke} fontWeight="600">○</text>
              <text x={s.x + s.w/2} y={labelY} textAnchor="middle" fontSize="9" fill="currentColor" opacity="0.5">{s.label}</text>
            </g>
          );
          if (s.type === 'diamond') {
            const cx = s.x + s.w/2, cy = s.y + s.h/2;
            const pts = `${cx},${s.y} ${s.x+s.w},${cy} ${cx},${s.y+s.h} ${s.x},${cy}`;
            return (
              <g key={i}>
                <polygon points={pts} fill={s.fill} stroke={s.stroke} strokeWidth="2" style={{ animation:'fadeIn 0.3s ease' }} />
                <text x={cx} y={cy+5} textAnchor="middle" fontSize="10" fill={s.stroke} fontWeight="600">?</text>
                <text x={cx} y={labelY} textAnchor="middle" fontSize="9" fill="currentColor" opacity="0.5">{s.label}</text>
              </g>
            );
          }
          if (s.type === 'cloud') {
            return (
              <g key={i} style={{ animation:'fadeIn 0.3s ease' }}>
                <ellipse cx={s.x+30} cy={s.y+35} rx={30} ry={22} fill={s.fill} stroke={s.stroke} strokeWidth="2" />
                <ellipse cx={s.x+60} cy={s.y+28} rx={24} ry={18} fill={s.fill} stroke={s.stroke} strokeWidth="2" />
                <ellipse cx={s.x+85} cy={s.y+36} rx={22} ry={16} fill={s.fill} stroke={s.stroke} strokeWidth="2" />
                <rect x={s.x+12} y={s.y+36} width={86} height={22} fill={s.fill} stroke="none" />
                <line x1={s.x+12} y1={s.y+57} x2={s.x+98} y2={s.y+57} stroke={s.stroke} strokeWidth="2" />
                <text x={s.x+55} y={s.y+50} textAnchor="middle" fontSize="9" fill="currentColor" opacity="0.5">{s.label}</text>
              </g>
            );
          }
          if (s.type === 'triangle') {
            const cx = s.x + s.w/2;
            const pts = `${cx},${s.y} ${s.x+s.w},${s.y+s.h} ${s.x},${s.y+s.h}`;
            return (
              <g key={i}>
                <polygon points={pts} fill={s.fill} stroke={s.stroke} strokeWidth="2" style={{ animation:'fadeIn 0.3s ease' }} />
                <text x={cx} y={s.y + s.h/2 + 14} textAnchor="middle" fontSize="9" fill="currentColor" opacity="0.5">{s.label}</text>
              </g>
            );
          }
          if (s.type === 'arrow') return (
            <g key={i} style={{ animation:'fadeIn 0.3s ease' }}>
              <defs><marker id="ah" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#94a3b8"/></marker></defs>
              <line x1={s.x} y1={s.y} x2={s.x+80} y2={s.y} stroke="#94a3b8" strokeWidth="2" markerEnd="url(#ah)" />
              <text x={s.x+40} y={s.y+20} textAnchor="middle" fontSize="9" fill="currentColor" opacity="0.5">Arrow / Line</text>
            </g>
          );
          if (s.type === 'text') return (
            <g key={i} style={{ animation:'fadeIn 0.3s ease' }}>
              <text x={s.x} y={s.y} fontSize="15" fontWeight="700" fill="var(--text-primary)" opacity="0.85">Title or label text</text>
              <text x={s.x} y={s.y+18} fontSize="9" fill="currentColor" opacity="0.5">Text tool</text>
            </g>
          );
          return null;
        })}

        {step === 0 && (
          <text x="210" y="155" textAnchor="middle" fontSize="13" fill="currentColor" opacity="0.35">Press Play to see shapes appear →</text>
        )}
      </svg>
      <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginTop:'10px' }}>
        {['Rectangle','Circle','Diamond','Cloud','Triangle','Arrow / Line','Text / Label','Sticky Note','Pencil','Eraser'].map(t => (
          <Chip key={t} color="#64748b">{t}</Chip>
        ))}
      </div>
    </div>
  );
}

/* ─── Tab content ─────────────────────────────────────────────── */
function DiagramsHelp() {
  return (
    <div>
      <p style={{ fontSize:'0.85rem', color:'var(--text-secondary)', lineHeight:'1.6', marginBottom:'18px' }}>
        A drag-and-drop canvas for building system architecture, domain, and flow diagrams. Nodes connect with smart edges and auto-layout keeps things tidy.
      </p>
      <Section title="Core Features">
        <Feature icon={<MousePointer2 size={15}/>} title="Drag & Drop Palette" desc="Drag any shape from the left sidebar onto the canvas. Hover over a node to see connection handles and draw edges between nodes." />
        <Feature icon={<Network size={15}/>} title="Smart Edges" desc="Click a handle to start a connection. Edges support labels, custom colors, dashed/dotted styles, and animated flow." />
        <Feature icon={<ArrowUpRight size={15}/>} title="Auto Layout" desc="Use LR (left-right) or TB (top-bottom) auto-layout buttons to instantly organise a messy diagram using Dagre." />
        <Feature icon={<StickyNote size={15}/>} title="Sticky Notes & Text" desc="Add floating sticky notes for annotations or text headers for section titles using the toolbar." />
        <Feature icon={<Layers size={15}/>} title="Templates" desc="Load a pre-built architecture pattern from the Templates gallery. Covers microservices, cloud, security, data, and more." />
        <Feature icon={<Code size={15}/>} title="Model Source" desc="View and import your diagram as JSON or YAML. Great for version control or sharing diagram state." />
      </Section>
      <Section title="Keyboard Shortcuts">
        <Row label="Select / Move tool"><Kbd k="V" /></Row>
        <Row label="Pan canvas"><Kbd k="H" /></Row>
        <Row label="Open Templates"><Kbd k="T" /></Row>
        <Row label="Delete selected"><Kbd k="Del" /><span style={{margin:'0 4px',color:'var(--text-secondary)'}}>or</span><Kbd k="Backspace" /></Row>
        <Row label="Select all"><Kbd k="Ctrl" /><Kbd k="A" /></Row>
        <Row label="Undo / Redo"><Kbd k="Ctrl+Z" /><Kbd k="Ctrl+Y" /></Row>
        <Row label="Duplicate node"><Kbd k="Ctrl+D" /></Row>
        <Row label="Copy / Paste"><Kbd k="Ctrl+C" /><Kbd k="Ctrl+V" /></Row>
        <Row label="Zoom in / out"><Kbd k="Scroll" /><span style={{margin:'0 4px',color:'var(--text-secondary)'}}>or</span><Kbd k="Ctrl +/-" /></Row>
        <Row label="Fit diagram to view"><Kbd k="Controls: ⊡" /></Row>
      </Section>
      <Section title="Tips">
        <div style={{ fontSize:'0.8rem', color:'var(--text-secondary)', lineHeight:'1.8', display:'flex', flexDirection:'column', gap:'4px' }}>
          <div>• Double-click a node to edit its label inline.</div>
          <div>• Right-click any node for context menu: clone, delete, style.</div>
          <div>• Hold <Kbd k="Shift" /> and click to multi-select nodes.</div>
          <div>• Use the <b>Share</b> button to copy a link that restores the exact diagram.</div>
          <div>• Export as PNG or SVG with custom background colour via Export menu.</div>
        </div>
      </Section>
    </div>
  );
}

function DrawHelp() {
  return (
    <div>
      <p style={{ fontSize:'0.85rem', color:'var(--text-secondary)', lineHeight:'1.6', marginBottom:'18px' }}>
        A freeform sketching canvas. Draw shapes, arrows, text, and freehand paths — optionally with a hand-drawn Rough.js aesthetic.
      </p>
      <DrawDemo />
      <Section title="Tool Shortcuts">
        <Row label="Select / Move"><Kbd k="V" /><Kbd k="1" /></Row>
        <Row label="Rectangle"><Kbd k="R" /><Kbd k="2" /></Row>
        <Row label="Diamond"><Kbd k="D" /><Kbd k="3" /></Row>
        <Row label="Circle / Oval"><Kbd k="O" /><Kbd k="4" /></Row>
        <Row label="Arrow"><Kbd k="A" /><Kbd k="5" /></Row>
        <Row label="Line"><Kbd k="L" /><Kbd k="6" /></Row>
        <Row label="Pencil (freehand)"><Kbd k="P" /><Kbd k="7" /></Row>
        <Row label="Text"><Kbd k="8" /></Row>
        <Row label="Triangle"><Kbd k="0" /></Row>
        <Row label="Cloud"><Kbd k="C" /></Row>
        <Row label="Eraser"><Kbd k="E" /></Row>
        <Row label="Sticky Note"><Kbd k="N" /></Row>
        <Row label="Clear canvas"><Kbd k="X" /></Row>
        <Row label="Undo / Redo"><Kbd k="Ctrl+Z" /><Kbd k="Ctrl+Y" /></Row>
        <Row label="Copy / Paste / Cut"><Kbd k="Ctrl+C" /><Kbd k="Ctrl+V" /><Kbd k="Ctrl+X" /></Row>
        <Row label="Select all"><Kbd k="Ctrl+A" /></Row>
        <Row label="Duplicate selected"><Kbd k="Ctrl+D" /></Row>
        <Row label="Font size +/-"><Kbd k="Ctrl+Shift+." /><Kbd k="Ctrl+Shift+," /></Row>
      </Section>
      <Section title="Features">
        <Feature icon={<Paintbrush size={15}/>} title="Hand-drawn Style" desc="Toggle the Paintbrush button to switch all shapes to a Rough.js sketchy aesthetic. Great for low-fidelity wireframes." />
        <Feature icon={<Lock size={15}/>} title="Tool Lock" desc="Lock the current tool so it stays active after drawing. By default it resets to Select after each shape." />
        <Feature icon={<Pencil size={15}/>} title="Freehand Pencil" desc="Draw smooth freehand paths. Adjust stroke width, color, opacity, and dash style in the style panel." />
        <Feature icon={<StickyNote size={15}/>} title="Sticky Notes" desc="Press N to add a resizable sticky note anywhere on the canvas. Double-click to edit text." />
        <Feature icon={<Download size={15}/>} title="Export" desc="Export the current sketch as PNG or SVG with transparency or custom background." />
      </Section>
    </div>
  );
}

function CADHelp() {
  const diagTypes = [
    ['Flowchart','flowchart TD\\n  A --> B'],
    ['Sequence','sequenceDiagram\\n  A->>B: msg'],
    ['Class','classDiagram\\n  class Foo {}'],
    ['State','stateDiagram-v2\\n  [*] --> A'],
    ['ER','erDiagram\\n  A ||--o{ B : rel'],
    ['C4 Context','C4Context\\n  Person(u,"User","...")'],
    ['C4 Container','C4Container\\n  Container_Boundary(b,"B") {}'],
    ['C4 Component','C4Component\\n  Component(c,"C","T","D")'],
    ['C4 Dynamic','C4Dynamic\\n  Rel(a,b,"action")'],
    ['C4 Deployment','C4Deployment\\n  Deployment_Node(n,"N","T") {}'],
    ['C4 Landscape','C4Context\\n  Enterprise_Boundary(e,"E") {}'],
    ['Gantt','gantt\\n  title S\\n  section A\\n    T :a1, 2024-01-01, 7d'],
    ['Pie','pie title T\\n  "A" : 50'],
    ['Git Graph','gitGraph\\n  commit\\n  branch dev'],
    ['Mindmap','mindmap\\n  root((R))\\n    A\\n    B'],
    ['Timeline','timeline\\n  title T\\n  2024 : Event'],
    ['Quadrant','quadrantChart\\n  x-axis L --> R\\n  y-axis B --> T'],
    ['XY Chart','xychart-beta\\n  bar [1,2,3]'],
    ['Sankey','sankey-beta\\n  A,B,10'],
    ['Kanban','kanban\\n  Todo\\n    t1[Task]'],
    ['Radar','radar-beta\\n  axis a[A],b[B]\\n  curve x[X]{50,70}'],
    ['Block','block-beta\\n  A --> B'],
    ['Packet','packet-beta\\n  0-7: "Field"'],
    ['Architecture','architecture-beta\\n  service s(server)[S]'],
    ['Journey','journey\\n  title T\\n  section S\\n    Task: 5: A'],
    ['Requirement','requirementDiagram\\n  requirement r {}'],
  ];
  return (
    <div>
      <p style={{ fontSize:'0.85rem', color:'var(--text-secondary)', lineHeight:'1.6', marginBottom:'18px' }}>
        Write <b>Mermaid</b> diagram code in the left editor and see a live preview instantly. Supports every Mermaid diagram type plus C4 architecture diagrams.
      </p>
      <Section title="Supported Diagram Types">
        <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginBottom:'8px' }}>
          {diagTypes.map(([name]) => <Chip key={name} color="#3b82f6">{name}</Chip>)}
        </div>
      </Section>
      <Section title="Editor Features">
        <Feature icon={<Code size={15}/>} title="Monaco Editor" desc="VS Code-grade editor with Mermaid syntax highlighting, autocomplete, bracket matching, and error squiggles for syntax mistakes." />
        <Feature icon={<ZoomIn size={15}/>} title="Live Preview" desc="Diagram re-renders 350ms after you stop typing. Scroll-to-zoom and drag-to-pan work directly on the preview canvas." />
        <Feature icon={<Layers size={15}/>} title="Template Gallery" desc="Press T or click Templates to browse 40+ pre-built diagrams grouped by type. Arrow keys + Enter to select." />
        <Feature icon={<Palette size={15}/>} title="Custom Themes" desc="Use %%{init: {'theme': 'base', 'themeVariables': {...}}}%% at the top of any diagram to apply custom colours." />
        <Feature icon={<Download size={15}/>} title="Export" desc="Export the rendered diagram as PNG, SVG, or the raw .mermaid file." />
      </Section>
      <Section title="Quick Syntax Reference">
        <div style={{ fontFamily:'monospace', fontSize:'0.75rem', lineHeight:'2', color:'var(--text-secondary)', background:'var(--bg-tertiary)', borderRadius:'8px', padding:'12px', overflowX:'auto' }}>
          {[
            ['Flowchart', 'flowchart LR / TD / BT / RL'],
            ['Sequence',  'sequenceDiagram + A->>B: msg / A-->>B: reply'],
            ['C4',        'C4Context / C4Container / C4Component / C4Dynamic / C4Deployment'],
            ['Class',     'classDiagram + class Foo { +method() void }'],
            ['State',     'stateDiagram-v2 + [*] --> State : trigger'],
            ['ER',        'erDiagram + ENTITY ||--o{ OTHER : "rel"'],
            ['Gantt',     'gantt + section Name + Task :done, id, date, dur'],
            ['Mindmap',   'mindmap + root((Label)) + SubNode'],
          ].map(([type, syn]) => (
            <div key={type} style={{ display:'flex', gap:'12px' }}>
              <span style={{ color:'#60a5fa', minWidth:'80px', fontWeight:700 }}>{type}</span>
              <span>{syn}</span>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Keyboard Shortcuts">
        <Row label="Open Templates"><Kbd k="T" /></Row>
        <Row label="Zoom canvas in/out"><Kbd k="Scroll" /></Row>
        <Row label="Fit diagram to view"><Kbd k="Controls: ⊡" /></Row>
        <Row label="Comment line (Monaco)"><Kbd k="Ctrl+/" /></Row>
        <Row label="Find & replace (Monaco)"><Kbd k="Ctrl+H" /></Row>
      </Section>
    </div>
  );
}

// Reuse Lucide Palette for CADHelp
function Palette(props) { return <svg {...props} width={props.size||15} height={props.size||15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>; }

function CamelHelp() {
  return (
    <div>
      <p style={{ fontSize:'0.85rem', color:'var(--text-secondary)', lineHeight:'1.6', marginBottom:'18px' }}>
        A visual builder for <b>Apache Camel</b> integration routes using Enterprise Integration Patterns (EIP). Design message flows and export ready-to-use Camel YAML DSL.
      </p>
      <Section title="What is Apache Camel?">
        <div style={{ fontSize:'0.82rem', color:'var(--text-secondary)', lineHeight:'1.7', padding:'10px 14px', background:'var(--bg-tertiary)', borderRadius:'8px', borderLeft:'3px solid #f59e0b' }}>
          Apache Camel is an open-source integration framework implementing EIP. It lets you connect systems with hundreds of components (Kafka, HTTP, File, database, cloud…) using a route-based DSL.
        </div>
      </Section>
      <Section title="EIP Component Categories">
        {[
          { color:'#3b82f6', label:'Messaging Channels', items:['Direct','Timer','SEDA','VM'] },
          { color:'#22c55e', label:'Message Routers',    items:['Choice','Filter','Split','Aggregate','LoadBalance'] },
          { color:'#a855f7', label:'Message Endpoints',  items:['REST','File','Kafka','JMS','HTTP','JDBC'] },
          { color:'#f59e0b', label:'Message Transform',  items:['SetBody','SetHeader','ConvertBody','Marshal','Unmarshal'] },
          { color:'#ef4444', label:'Error Handling',     items:['OnException','DeadLetter','Redelivery','CircuitBreaker'] },
          { color:'#14b8a6', label:'Processing',         items:['Bean','Process','Enrich','PollEnrich','ToDynamic'] },
        ].map(({ color, label, items }) => (
          <div key={label} style={{ marginBottom:'10px' }}>
            <div style={{ fontSize:'0.75rem', fontWeight:700, color, marginBottom:'6px' }}>{label}</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
              {items.map(i => <Chip key={i} color={color}>{i}</Chip>)}
            </div>
          </div>
        ))}
      </Section>
      <Section title="Building a Route">
        <Feature icon={<span style={{fontWeight:700,fontSize:'0.8rem',color:'#f59e0b'}}>1</span>} title="Add a Consumer (From)" desc="Every route starts with a From endpoint — a Timer, REST endpoint, Kafka consumer, File watcher, etc." />
        <Feature icon={<span style={{fontWeight:700,fontSize:'0.8rem',color:'#f59e0b'}}>2</span>} title="Add Processors / Routers" desc="Connect Choice (if/when/otherwise), Filter, Split, Aggregate, or Transform nodes to build your message flow." />
        <Feature icon={<span style={{fontWeight:700,fontSize:'0.8rem',color:'#f59e0b'}}>3</span>} title="Add a Producer (To)" desc="End with a To endpoint — send to Kafka, call an HTTP API, write to a File, insert into a DB." />
        <Feature icon={<Download size={15}/>} title="Export Camel YAML" desc="Use Export → Camel Route (YAML) to get a runnable Camel YAML DSL file you can drop into a Camel project." />
      </Section>
      <Section title="Tips">
        <div style={{ fontSize:'0.8rem', color:'var(--text-secondary)', lineHeight:'1.8', display:'flex', flexDirection:'column', gap:'4px' }}>
          <div>• Drag components from the palette onto the canvas, then connect them.</div>
          <div>• Double-click any node to edit its URI, label, or properties.</div>
          <div>• Use <b>Choice</b> for content-based routing (like a switch statement).</div>
          <div>• Use <b>Split → Aggregate</b> for scatter-gather patterns.</div>
          <div>• Load a template with <Kbd k="T" /> to see a full example route.</div>
        </div>
      </Section>
    </div>
  );
}

function DDDHelp() {
  return (
    <div>
      <p style={{ fontSize:'0.85rem', color:'var(--text-secondary)', lineHeight:'1.6', marginBottom:'18px' }}>
        A canvas for designing <b>Domain-Driven Design</b> architecture. Model strategic and tactical DDD patterns — bounded contexts, aggregates, events, and services.
      </p>
      <Section title="Strategic DDD Patterns">
        {[
          { name:'Bounded Context', color:'#3b82f6', desc:'An explicit boundary within which a domain model applies. Names have precise meaning inside the context.' },
          { name:'Context Map', color:'#6366f1', desc:'Shows how bounded contexts relate — Upstream/Downstream, Partnership, Shared Kernel, ACL.' },
          { name:'Subdomain', color:'#8b5cf6', desc:'Core, Supporting, or Generic — classifies the business importance of each domain area.' },
          { name:'Domain Event', color:'#ec4899', desc:'Something that happened in the domain (past tense). Crosses context boundaries via event bus.' },
          { name:'Integration Event', color:'#f59e0b', desc:'Event published outside a bounded context for async integration with other systems.' },
        ].map(p => (
          <div key={p.name} style={{ display:'flex', gap:'10px', padding:'7px 0', borderBottom:'1px solid var(--border-color)' }}>
            <Chip color={p.color}>{p.name}</Chip>
            <span style={{ fontSize:'0.78rem', color:'var(--text-secondary)', lineHeight:'1.5' }}>{p.desc}</span>
          </div>
        ))}
      </Section>
      <Section title="Tactical DDD Patterns">
        {[
          { name:'Aggregate Root', color:'#22c55e', desc:'The only entry point to a cluster of objects. Enforces invariants and owns the transaction boundary.' },
          { name:'Entity', color:'#10b981', desc:'An object with a unique identity (ID) that persists across time. E.g. Order, Customer, Product.' },
          { name:'Value Object', color:'#34d399', desc:'Defined only by its attributes, no identity. Immutable. E.g. Money, Address, DateRange.' },
          { name:'Repository', color:'#0ea5e9', desc:'Abstraction for retrieving and persisting aggregate roots. Hides storage details from the domain.' },
          { name:'Domain Service', color:'#38bdf8', desc:'Business logic that doesn\'t naturally fit inside an entity or value object. Stateless.' },
          { name:'Application Service', color:'#7dd3fc', desc:'Orchestrates use cases — coordinates domain objects, publishes events, handles transactions.' },
          { name:'Factory', color:'#a78bfa', desc:'Creates complex aggregates or entities, encapsulating construction logic.' },
        ].map(p => (
          <div key={p.name} style={{ display:'flex', gap:'10px', padding:'7px 0', borderBottom:'1px solid var(--border-color)' }}>
            <Chip color={p.color}>{p.name}</Chip>
            <span style={{ fontSize:'0.78rem', color:'var(--text-secondary)', lineHeight:'1.5' }}>{p.desc}</span>
          </div>
        ))}
      </Section>
      <Section title="Tips">
        <div style={{ fontSize:'0.8rem', color:'var(--text-secondary)', lineHeight:'1.8', display:'flex', flexDirection:'column', gap:'4px' }}>
          <div>• Start with a Context Map to discover bounded contexts before going tactical.</div>
          <div>• Use <b>Bounded Context</b> as a container node to group aggregates inside it.</div>
          <div>• Connect contexts with <b>Integration Events</b> (async) or <b>ACL</b> (anti-corruption layer).</div>
          <div>• Each aggregate root should own at most one transaction boundary.</div>
          <div>• Load the DDD template with <Kbd k="T" /> to see a full worked example.</div>
        </div>
      </Section>
    </div>
  );
}

/* ─── Main modal ──────────────────────────────────────────────── */
const TABS = [
  { id:'diagrams', label:'Diagrams',        icon:'🗂️' },
  { id:'draw',     label:'Draw',            icon:'✏️' },
  { id:'cad',      label:'Code as Diagram', icon:'⌨️' },
  { id:'eip',      label:'Camel / EIP',     icon:'⚡' },
  { id:'ddd',      label:'Domain Driven',   icon:'🏛️' },
];

export default function HelpModal({ onClose, initialTab = 'diagrams' }) {
  const [tab, setTab] = useState(initialTab);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const content = {
    diagrams: <DiagramsHelp />,
    draw:     <DrawHelp />,
    cad:      <CADHelp />,
    eip:      <CamelHelp />,
    ddd:      <DDDHelp />,
  };

  return (
    <div
      onClick={onClose}
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:4000, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background:'var(--bg-secondary)', borderRadius:'16px', border:'1px solid var(--border-color)', boxShadow:'0 25px 60px rgba(0,0,0,0.5)', width:'min(880px,95vw)', height:'min(680px,90vh)', display:'flex', flexDirection:'column', overflow:'hidden' }}
      >
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid var(--border-color)', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <Info size={18} color="#3b82f6" />
            <span style={{ fontWeight:700, fontSize:'1rem', color:'var(--text-primary)' }}>Model Studio — Help & Reference</span>
          </div>
          <button className="btn btn-icon-only" onClick={onClose} style={{ background:'transparent', border:'none', color:'var(--text-secondary)' }}><X size={18} /></button>
        </div>

        <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
          {/* Sidebar tabs */}
          <div style={{ width:'170px', flexShrink:0, borderRight:'1px solid var(--border-color)', display:'flex', flexDirection:'column', gap:'2px', padding:'12px 8px', background:'var(--bg-primary)', overflowY:'auto' }}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  display:'flex', alignItems:'center', gap:'8px',
                  padding:'8px 10px', borderRadius:'8px', border:'none', cursor:'pointer',
                  background: tab === t.id ? 'rgba(59,130,246,0.12)' : 'transparent',
                  color: tab === t.id ? '#60a5fa' : 'var(--text-secondary)',
                  fontWeight: tab === t.id ? 700 : 400,
                  fontSize:'0.82rem', textAlign:'left', width:'100%',
                  borderLeft: tab === t.id ? '2px solid #3b82f6' : '2px solid transparent',
                  transition:'all 0.15s',
                }}
              >
                <span style={{ fontSize:'1rem' }}>{t.icon}</span>
                <span>{t.label}</span>
                {tab === t.id && <ChevronRight size={12} style={{ marginLeft:'auto' }} />}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>
            {content[tab]}
          </div>
        </div>
      </div>
    </div>
  );
}
