import { useState, useCallback, useMemo } from 'react';
import { Plus, Trash2, ChevronDown } from 'lucide-react';

// ── Shape definitions ─────────────────────────────────────────────────────────
const SHAPES = [
  { id: 'rect',       label: 'Rectangle',    open: '[',   close: ']',   preview: '▭' },
  { id: 'rounded',    label: 'Rounded',       open: '(',   close: ')',   preview: '⬭' },
  { id: 'stadium',    label: 'Stadium/Pill',  open: '([',  close: '])',  preview: '⬬' },
  { id: 'circle',     label: 'Circle',        open: '((',  close: '))',  preview: '●' },
  { id: 'diamond',    label: 'Diamond',       open: '{',   close: '}',   preview: '◆' },
  { id: 'hexagon',    label: 'Hexagon',       open: '{{',  close: '}}',  preview: '⬡' },
  { id: 'subroutine', label: 'Subroutine',    open: '[[',  close: ']]',  preview: '▬' },
  { id: 'cylinder',   label: 'Cylinder/DB',   open: '[(', close: ')]',   preview: '⌭' },
  { id: 'flag',       label: 'Flag/Asymm.',   open: '>',   close: ']',   preview: '⯈' },
  { id: 'parallelR',  label: 'Parallelogram', open: '[/',  close: '/]',  preview: '▱' },
  { id: 'trapezoid',  label: 'Trapezoid',     open: '[/',  close: '\\]', preview: '⏢' },
];

// Detect shape from node definition body (the part after the ID)
function detectShapeId(body) {
  if (!body) return 'rect';
  if (/^\(\[.*\]\)$/s.test(body))   return 'stadium';
  if (/^\[\[.*\]\]$/s.test(body))   return 'subroutine';
  if (/^\[\(.*\)\]$/s.test(body))   return 'cylinder';
  if (/^\(\(.*\)\)$/s.test(body))   return 'circle';
  if (/^\{\{.*\}\}$/s.test(body))   return 'hexagon';
  if (/^\{.*\}$/s.test(body))       return 'diamond';
  if (/^\[\/.*\/\]$/s.test(body))   return 'parallelR';
  if (/^\[\/.*\\\]$/s.test(body))   return 'trapezoid';
  if (/^>.*\]$/s.test(body))        return 'flag';
  if (/^\(.*\)$/s.test(body))       return 'rounded';
  return 'rect';
}

function extractLabel(body) {
  if (!body) return '';
  // strip outer brackets
  const inner = body.replace(/^[\[({>\/\\]+/, '').replace(/[\])}\/\\]+$/, '');
  return inner.replace(/^["']/, '').replace(/["']$/, '').trim();
}

function buildNodeBody(shapeId, label) {
  const s = SHAPES.find(s => s.id === shapeId) || SHAPES[0];
  const needsQuotes = /[^A-Za-z0-9 _-]/.test(label);
  const inner = needsQuotes ? `"${label}"` : label;
  return `${s.open}${inner}${s.close}`;
}

// ── Parse nodes from mermaid code ─────────────────────────────────────────────
// Returns [{id, label, shapeId, body, line}]
function parseNodes(code) {
  const lines = code.split('\n');
  const reserved = new Set(['flowchart','graph','sequenceDiagram','classDiagram','stateDiagram','erDiagram','journey','gantt','pie','subgraph','end','direction','classDef','class','style','linkStyle','click','note','participant','actor','loop','alt','else','opt','par','critical','break','rect','over','lr','td','tb','rl','bt']);
  const nodeMap = new Map();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('%%') || trimmed.startsWith('classDef') || trimmed.startsWith('class ') || trimmed.startsWith('style ') || trimmed.startsWith('linkStyle') || trimmed.startsWith('subgraph') || trimmed === 'end') continue;

    // match node tokens: ID optionally followed by shape body, before any edge connector
    const nodeRe = /\b([A-Za-z][A-Za-z0-9_-]*)(\(\[.*?\]\)|\[\[.*?\]\]|\[\(.*?\)\]|\(\(.*?\)\)|\{\{.*?\}\}|\{.*?\}|\[\/.*?\/\]|\[\/.*?\\\]|>.*?\]|\(.*?\)|\[.*?\])?(?:::([A-Za-z0-9_-]+))?/g;
    let m;
    while ((m = nodeRe.exec(trimmed)) !== null) {
      const id = m[1];
      if (reserved.has(id.toLowerCase()) || reserved.has(id)) continue;
      // skip if followed by connector chars that indicate it's a "plain reference in edge"
      const after = trimmed.slice(m.index + m[0].length).trimStart();
      if (!m[2] && /^(-+>|={2,}>|\.+>|--x|--o|<-->|\|)/.test(after)) continue;
      const body = m[2] || null;
      if (!nodeMap.has(id)) {
        nodeMap.set(id, { id, body, shapeId: detectShapeId(body), label: body ? extractLabel(body) : id });
      }
    }
  }
  return [...nodeMap.values()];
}

// ── Parse edges from mermaid code ─────────────────────────────────────────────
// Returns [{idx, from, to, connector, label, rawLine, lineIdx}]
const EDGE_RE = /([A-Za-z][A-Za-z0-9_-]*)\s*(-->|---|-\.->|-\.-|==>|===|--x|--o|<-->|--+>?)\|?([^|]*?)\|?\s*([A-Za-z][A-Za-z0-9_-]*)/g;
// Also: A -- label --> B  and  A -->|label| B
const EDGE_PIPE_RE = /([A-Za-z][A-Za-z0-9_-]*)\s*(--|-->|==>|-\.->|-\.-|--x|--o|<-->)\s*\|([^|]*)\|\s*([A-Za-z][A-Za-z0-9_-]*)/g;
const EDGE_DASH_RE = /([A-Za-z][A-Za-z0-9_-]*)\s*--\s+([^-]+?)\s+-->\s*([A-Za-z][A-Za-z0-9_-]*)/g;

// Node token: ID optionally followed by shape brackets
const NT = `[A-Za-z][A-Za-z0-9_-]*(?:(?:\\(\\[|\\[\\[|\\[\\(|\\(\\(|\\{\\{)[^)\\]]*(?:\\]\\)|\\]\\]|\\)\\]|\\)\\)|\\}\\})|(?:[\\[\\({>][^\\]\\)}>]*[\\]\\)}>]))?`;
const CONN = `-->|---|==>|-\\.->|-\\.-|--x|--o|<-->`;

function nodeId(token) { return token.match(/^([A-Za-z][A-Za-z0-9_-]*)/)?.[1] || token; }

function parseEdges(code) {
  const edges = [];
  const SKIP = new Set(['flowchart','graph','subgraph','end','direction','classDef','class','style','linkStyle','lr','td','tb','rl','bt']);
  const lines = code.split('\n');

  const addEdge = (lineIdx, rawLine, from, connector, label, to) => {
    if (SKIP.has(from.toLowerCase()) || SKIP.has(to.toLowerCase())) return;
    if (!edges.find(e => e.lineIdx === lineIdx && e.from === from && e.to === to))
      edges.push({ from, connector, label, to, rawLine, lineIdx });
  };

  lines.forEach((rawLine, lineIdx) => {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('%%') || SKIP.has(trimmed.split(/[\s[({]/)[0]?.toLowerCase())) return;

    // pipe-style: A[x] -->|label| B[y]  — handles chains by backtracking lastIndex to start of to-token
    const pipe = new RegExp(`(${NT})\\s*(${CONN})\\s*\\|([^|]*)\\|\\s*(${NT})`, 'g');
    let m;
    while ((m = pipe.exec(trimmed)) !== null) {
      addEdge(lineIdx, rawLine, nodeId(m[1]), m[2], m[3].trim(), nodeId(m[4]));
      pipe.lastIndex = m.index + m[0].length - m[4].length; // backtrack to start of to-token
    }
    // dash-style: A -- label --> B
    const dash = new RegExp(`(${NT})\\s*--\\s+([^-\\n]+?)\\s+-+>\\s*(${NT})`, 'g');
    while ((m = dash.exec(trimmed)) !== null) {
      addEdge(lineIdx, rawLine, nodeId(m[1]), '-->', m[2].trim(), nodeId(m[3]));
      dash.lastIndex = m.index + m[0].length - m[3].length;
    }
    // no-label edges: A[x] --> B[y]
    const noLabel = new RegExp(`(${NT})\\s*(${CONN})\\s*(${NT})`, 'g');
    while ((m = noLabel.exec(trimmed)) !== null) {
      addEdge(lineIdx, rawLine, nodeId(m[1]), m[2], '', nodeId(m[3]));
      noLabel.lastIndex = m.index + m[0].length - m[3].length;
    }
  });
  return edges;
}

// Rewrite a node's shape in the code
function rewriteNodeShape(code, nodeId, newShapeId, newLabel) {
  const lines = code.split('\n');
  const reserved = new Set(['flowchart','graph','subgraph','end','direction','classDef','class','style','linkStyle','click']);
  // We need to find every occurrence of this node ID with a shape body and rewrite it
  const newBody = buildNodeBody(newShapeId, newLabel || nodeId);
  return lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('%%') || reserved.has(trimmed.split(/\s/)[0]?.toLowerCase())) return line;
    // replace nodeId[...] or nodeId(...) etc. with new body
    return line.replace(
      new RegExp(`\\b(${nodeId})(\\(\\[.*?\\]\\)|\\[\\[.*?\\]\\]|\\[\\(.*?\\)\\]|\\(\\(.*?\\)\\)|\\{\\{.*?\\}\\}|\\{.*?\\}|\\[\\/.*?\\/\\]|\\[\\/.*?\\\\\\]|>.*?\\]|\\(.*?\\)|\\[.*?\\])`,'gs'),
      (_, id, _body) => `${id}${newBody}`
    );
  }).join('\n');
}

// Node token pattern (ID + optional shape body) for use in rewrite regexes
const NTP = `[A-Za-z][A-Za-z0-9_-]*(?:(?:\\(\\[|\\[\\[|\\[\\(|\\(\\(|\\{\\{)[^\\]\\)}>]*(?:\\]\\)|\\]\\]|\\)\\]|\\)\\)|\\}\\})|(?:[\\[\\({>][^\\]\\)}>]*[\\]\\)}>]))?`;

// Rewrite an edge's label in the code — handles A[Label] --> B style tokens
function rewriteEdgeLabel(code, lineIdx, fromId, toId, connector, newLabel) {
  const lines = code.split('\n');
  const line = lines[lineIdx];
  const CONN_PAT = `-->|---|==>|-\\.->|-\\.-|--x|--o|<-->`;
  // Match: <from-token> <conn> [|label|] <to-token>
  const full = new RegExp(
    `(${fromId}(?:(?:\\(\\[|\\[\\[|\\[\\(|\\(\\(|\\{\\{)[^\\]\\)}>]*(?:\\]\\)|\\]\\]|\\)\\]|\\)\\)|\\}\\})|(?:[\\[\\({>][^\\]\\)}>]*[\\]\\)}>]))?)`+
    `(\\s*)(${CONN_PAT})(\\s*)(?:\\|[^|]*\\|\\s*)?`+
    `(${toId}(?:(?:\\(\\[|\\[\\[|\\[\\(|\\(\\(|\\{\\{)[^\\]\\)}>]*(?:\\]\\)|\\]\\]|\\)\\]|\\)\\)|\\}\\})|(?:[\\[\\({>][^\\]\\)}>]*[\\]\\)}>]))?)`,
    'g'
  );
  lines[lineIdx] = line.replace(full, (_, fromTok, sp1, conn, sp2, toTok) => {
    if (newLabel) return `${fromTok}${sp1}${conn}|${newLabel}|${sp2}${toTok}`;
    return `${fromTok}${sp1}${conn}${sp2}${toTok}`;
  });
  return lines.join('\n');
}

// ── classDef helpers ───────────────────────────────────────────────────────────
const CLASSDEFS_RE = /^classDef\s+([A-Za-z0-9_-]+)\s+(.*)$/gim;
const CLASS_ASSIGN_RE = /^class\s+([A-Za-z0-9_,.\s-]+)\s+([A-Za-z0-9_-]+)$/gim;

function parsePropString(str) {
  const result = {};
  str.split(',').forEach(part => {
    const [k, ...vs] = part.split(':');
    if (k && vs.length) result[k.trim()] = vs.join(':').trim();
  });
  return result;
}
function buildPropString(props) {
  return Object.entries(props).filter(([, v]) => v && v.trim()).map(([k, v]) => `${k}:${v}`).join(',');
}
function parseClassDefs(code) {
  const defs = []; const seen = new Set(); let m;
  CLASSDEFS_RE.lastIndex = 0;
  while ((m = CLASSDEFS_RE.exec(code)) !== null) {
    if (seen.has(m[1])) continue; seen.add(m[1]);
    defs.push({ name: m[1], props: parsePropString(m[2]) });
  }
  return defs;
}
function parseClassAssignments(code) {
  const map = {}; let m;
  CLASS_ASSIGN_RE.lastIndex = 0;
  while ((m = CLASS_ASSIGN_RE.exec(code)) !== null) {
    const cls = m[2].trim();
    m[1].split(',').map(s => s.trim()).filter(Boolean).forEach(id => { map[id] = cls; });
  }
  return map;
}
function applyClassDefs(code, defs, assignments) {
  let result = code
    .replace(/^classDef\s+.*$/gim, '').replace(/^class\s+[A-Za-z0-9_,.\s-]+\s+[A-Za-z0-9_-]+$/gim, '')
    .replace(/\n{3,}/g, '\n\n').trimEnd();
  const classDefLines = defs.filter(d => d.name.trim()).map(d => `classDef ${d.name} ${buildPropString(d.props)}`).join('\n');
  const byClass = {};
  Object.entries(assignments).forEach(([nodeId, cls]) => { if (!byClass[cls]) byClass[cls] = []; byClass[cls].push(nodeId); });
  const classLines = Object.entries(byClass).map(([cls, ids]) => `class ${ids.join(',')} ${cls}`).join('\n');
  const suffix = [classDefLines, classLines].filter(Boolean).join('\n');
  return suffix ? `${result}\n${suffix}` : result;
}

// ── Color picker ───────────────────────────────────────────────────────────────
function ColorPick({ label, value, onChange }) {
  const hex = value?.startsWith('#') ? value.slice(0, 7) : '#888888';
  const hasNone = value === 'none' || value === 'transparent';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', minWidth: 38 }}>{label}</span>
      <div style={{ position: 'relative', width: 20, height: 20 }}>
        <input type="color" value={hasNone ? '#888888' : hex} onChange={e => onChange(e.target.value)}
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
        <div style={{ width: 20, height: 20, borderRadius: 4, background: hasNone ? 'transparent' : (value || '#888888'), border: '1.5px solid var(--border-color)', cursor: 'pointer',
          backgroundImage: hasNone ? 'linear-gradient(45deg,#ccc 25%,transparent 25%,transparent 75%,#ccc 75%),linear-gradient(45deg,#ccc 25%,transparent 25%,transparent 75%,#ccc 75%)' : undefined,
          backgroundSize: hasNone ? '6px 6px' : undefined, backgroundPosition: hasNone ? '0 0,3px 3px' : undefined }} />
      </div>
      <button onClick={() => onChange('none')} title="None/transparent"
        style={{ fontSize: '0.55rem', padding: '1px 4px', border: '1px solid var(--border-color)', borderRadius: 3, background: hasNone ? 'var(--accent-blue)' : 'var(--bg-tertiary)', color: hasNone ? '#fff' : 'var(--text-secondary)', cursor: 'pointer' }}>∅</button>
    </div>
  );
}

// ── Styles tab: classDef editor ───────────────────────────────────────────────
function ClassDefCard({ def, onChange, onDelete, nodeIds, assignments, onAssign }) {
  const [open, setOpen] = useState(true);
  const usedBy = Object.entries(assignments).filter(([, c]) => c === def.name).map(([id]) => id);
  const setProp = (k, v) => onChange({ ...def, props: { ...def.props, [k]: v } });
  return (
    <div style={{ border: '1px solid var(--border-color)', borderRadius: 8, overflow: 'hidden', background: 'var(--bg-secondary)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', cursor: 'pointer', background: 'var(--bg-tertiary)', borderBottom: open ? '1px solid var(--border-color)' : 'none' }} onClick={() => setOpen(v => !v)}>
        <div style={{ width: 14, height: 14, borderRadius: 3, flexShrink: 0, background: def.props.fill && def.props.fill !== 'none' ? def.props.fill : 'var(--bg-secondary)', border: `2px solid ${def.props.stroke || 'var(--border-color)'}` }} />
        <input value={def.name} onChange={e => onChange({ ...def, name: e.target.value })} onClick={e => e.stopPropagation()} placeholder="class name"
          style={{ flex: 1, fontSize: '0.72rem', fontWeight: 700, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', minWidth: 0 }} />
        {usedBy.length > 0 && <span style={{ fontSize: '0.58rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '1px 5px', borderRadius: 10 }}>{usedBy.length} node{usedBy.length > 1 ? 's' : ''}</span>}
        <button onClick={e => { e.stopPropagation(); onDelete(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 2, display: 'flex' }}><Trash2 size={11} /></button>
        <ChevronDown size={11} style={{ color: 'var(--text-secondary)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }} />
      </div>
      {open && (
        <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <ColorPick label="Fill" value={def.props.fill || ''} onChange={v => setProp('fill', v)} />
            <ColorPick label="Stroke" value={def.props.stroke || ''} onChange={v => setProp('stroke', v)} />
            <ColorPick label="Text" value={def.props.color || ''} onChange={v => setProp('color', v)} />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.62rem', color: 'var(--text-secondary)' }}>
              Border <input value={def.props['stroke-width'] || ''} onChange={e => setProp('stroke-width', e.target.value)} placeholder="1px"
                style={{ width: 38, fontSize: '0.62rem', padding: '2px 4px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 4, color: 'var(--text-primary)', outline: 'none' }} />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.62rem', color: 'var(--text-secondary)' }}>
              Dash <input value={def.props['stroke-dasharray'] || ''} onChange={e => setProp('stroke-dasharray', e.target.value)} placeholder="5 3"
                style={{ width: 38, fontSize: '0.62rem', padding: '2px 4px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 4, color: 'var(--text-primary)', outline: 'none' }} />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.62rem', color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={def.props['font-weight'] === 'bold'} onChange={e => setProp('font-weight', e.target.checked ? 'bold' : '')} style={{ accentColor: 'var(--accent-blue)', cursor: 'pointer' }} /> Bold
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.62rem', color: 'var(--text-secondary)' }}>
              Radius <input value={def.props['border-radius'] || ''} onChange={e => setProp('border-radius', e.target.value)} placeholder="4px"
                style={{ width: 38, fontSize: '0.62rem', padding: '2px 4px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 4, color: 'var(--text-primary)', outline: 'none' }} />
            </label>
          </div>
          {nodeIds.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 6 }}>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Assign to nodes</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {nodeIds.map(id => {
                  const assigned = assignments[id] === def.name;
                  return (
                    <button key={id} onClick={() => onAssign(id, assigned ? null : def.name)}
                      style={{ fontSize: '0.62rem', padding: '2px 8px', borderRadius: 10, cursor: 'pointer',
                        border: `1px solid ${assigned ? (def.props.stroke || 'var(--accent-blue)') : 'var(--border-color)'}`,
                        background: assigned ? (def.props.fill || 'var(--accent-blue)') + '33' : 'var(--bg-tertiary)',
                        color: assigned ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: assigned ? 700 : 400 }}>
                      {id}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Shapes tab ─────────────────────────────────────────────────────────────────
function ShapesTab({ cadCode, onCommit }) {
  const nodes = useMemo(() => parseNodes(cadCode), [cadCode]);

  const handleShapeChange = (node, newShapeId) => {
    onCommit(rewriteNodeShape(cadCode, node.id, newShapeId, node.label));
  };
  const handleLabelChange = (node, newLabel) => {
    onCommit(rewriteNodeShape(cadCode, node.id, node.shapeId, newLabel));
  };

  if (nodes.length === 0) return (
    <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-secondary)', fontSize: '0.72rem', lineHeight: 1.6 }}>
      No nodes detected.<br /><span style={{ opacity: 0.6 }}>Write some flowchart nodes in the Code tab first.</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Shape legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '6px 10px', background: 'var(--bg-tertiary)', borderRadius: 6, border: '1px solid var(--border-color)' }}>
        {SHAPES.map(s => (
          <span key={s.id} title={s.label} style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ fontSize: '0.8rem' }}>{s.preview}</span>{s.label}
          </span>
        ))}
      </div>

      {nodes.map(node => (
        <div key={node.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8 }}>
          {/* Shape preview */}
          <span style={{ fontSize: '1rem', minWidth: 20, textAlign: 'center' }}>{SHAPES.find(s => s.id === node.shapeId)?.preview || '▭'}</span>

          {/* Node ID (read-only) */}
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--accent-blue)', minWidth: 32, fontFamily: 'monospace' }}>{node.id}</span>

          {/* Label edit */}
          <input
            value={node.label === node.id ? '' : node.label}
            onChange={e => handleLabelChange(node, e.target.value || node.id)}
            placeholder={node.id}
            style={{ flex: 1, fontSize: '0.68rem', padding: '3px 6px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 5, color: 'var(--text-primary)', outline: 'none', minWidth: 0 }}
          />

          {/* Shape selector */}
          <select
            value={node.shapeId}
            onChange={e => handleShapeChange(node, e.target.value)}
            style={{ fontSize: '0.65rem', padding: '3px 4px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: 5, cursor: 'pointer', outline: 'none' }}
          >
            {SHAPES.map(s => (
              <option key={s.id} value={s.id}>{s.preview} {s.label}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}

// ── Edges tab ──────────────────────────────────────────────────────────────────
const CONNECTORS = [
  { value: '-->', label: '──▶ Arrow' },
  { value: '---', label: '─── Line' },
  { value: '===>', label: '══▶ Bold' },
  { value: '-.->', label: '···▶ Dotted' },
  { value: '--x', label: '──✕ Cross' },
  { value: '--o', label: '──○ Circle' },
  { value: '<-->', label: '◀──▶ Bidirectional' },
];

// Single edge row — uses local label state so typing isn't reset by re-parsing
function EdgeRow({ edge, cadCode, onCommit }) {
  const [label, setLabel] = useState(edge.label);

  // Sync if external code changes the label (e.g. switching tabs)
  const prevLabel = useMemo(() => edge.label, [edge.label]);
  if (label !== prevLabel && document.activeElement?.dataset?.edgeLabel !== `${edge.lineIdx}-${edge.from}-${edge.to}`) {
    // Only sync when this input isn't focused
  }

  const commitLabel = (val) => {
    onCommit(rewriteEdgeLabel(cadCode, edge.lineIdx, edge.from, edge.to, edge.connector, val));
  };

  const handleConnectorChange = (newConn) => {
    const lines = cadCode.split('\n');
    const escaped = edge.connector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    lines[edge.lineIdx] = lines[edge.lineIdx].replace(new RegExp(escaped), newConn);
    onCommit(lines.join('\n'));
  };

  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '7px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#60a5fa', fontFamily: 'monospace' }}>{edge.from}</span>
        <select value={edge.connector} onChange={e => handleConnectorChange(e.target.value)}
          style={{ fontSize: '0.62rem', padding: '2px 4px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: 5, cursor: 'pointer', outline: 'none' }}>
          {CONNECTORS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#60a5fa', fontFamily: 'monospace' }}>{edge.to}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', minWidth: 34 }}>Label</span>
        <input
          value={label}
          data-edge-label={`${edge.lineIdx}-${edge.from}-${edge.to}`}
          onChange={e => setLabel(e.target.value)}
          onBlur={e => commitLabel(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { commitLabel(label); e.target.blur(); } }}
          placeholder="Add label…"
          style={{ flex: 1, fontSize: '0.68rem', padding: '3px 7px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 5, color: 'var(--text-primary)', outline: 'none' }}
        />
        {label && (
          <button onClick={() => { setLabel(''); commitLabel(''); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 2, display: 'flex' }}>
            <Trash2 size={11} />
          </button>
        )}
      </div>
    </div>
  );
}

function EdgesTab({ cadCode, onCommit }) {
  const edges = useMemo(() => parseEdges(cadCode), [cadCode]);

  if (edges.length === 0) return (
    <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-secondary)', fontSize: '0.72rem', lineHeight: 1.6 }}>
      No edges detected.<br /><span style={{ opacity: 0.6 }}>Write connections like <code>A --&gt; B</code> first.</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', padding: '4px 2px' }}>
        Type a label and press Enter or click away to apply.
      </div>
      {edges.map((edge, i) => (
        <EdgeRow key={`${edge.lineIdx}-${edge.from}-${edge.to}-${i}`} edge={edge} cadCode={cadCode} onCommit={onCommit} />
      ))}
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'styles', label: '🎨 Styles' },
  { id: 'shapes', label: '⬡ Shapes' },
  { id: 'edges',  label: '──▶ Edges' },
];

export default function MermaidStylePanel({ cadCode, setCadCode, cadSourceRef }) {
  const [activeTab, setActiveTab] = useState('styles');

  const defs = useMemo(() => parseClassDefs(cadCode), [cadCode]);
  const assignments = useMemo(() => parseClassAssignments(cadCode), [cadCode]);
  const nodeIds = useMemo(() => parseNodes(cadCode).map(n => n.id), [cadCode]);

  const commit = useCallback((newCode) => {
    cadSourceRef.current = 'code';
    setCadCode(newCode);
  }, [setCadCode, cadSourceRef]);

  const commitStyles = useCallback((newDefs, newAssignments) => {
    cadSourceRef.current = 'code';
    setCadCode(prev => applyClassDefs(prev, newDefs, newAssignments));
  }, [setCadCode, cadSourceRef]);

  const handleDefChange = (idx, updated) => commitStyles(defs.map((d, i) => i === idx ? updated : d), assignments);
  const handleDefDelete = (idx) => {
    const deleted = defs[idx].name;
    commitStyles(defs.filter((_, i) => i !== idx), Object.fromEntries(Object.entries(assignments).filter(([, c]) => c !== deleted)));
  };
  const handleAdd = () => commitStyles([...defs, { name: `style${defs.length + 1}`, props: { fill: '#3b82f622', stroke: '#3b82f6', color: '' } }], assignments);
  const handleAssign = (nodeId, cls) => {
    const next = { ...assignments };
    if (cls === null) delete next[nodeId]; else next[nodeId] = cls;
    commitStyles(defs, next);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Sub-tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', flexShrink: 0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ flex: 1, padding: '5px 0', fontSize: '0.62rem', fontWeight: 700, border: 'none', cursor: 'pointer', background: 'transparent',
              color: activeTab === t.id ? 'var(--accent-blue, #3b82f6)' : 'var(--text-secondary)',
              borderBottom: activeTab === t.id ? '2px solid var(--accent-blue, #3b82f6)' : '2px solid transparent',
              letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {activeTab === 'styles' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Class Styles ({defs.length})</span>
              <button onClick={handleAdd} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.68rem', padding: '3px 10px', borderRadius: 6, border: '1px solid var(--accent-blue)', background: 'rgba(59,130,246,0.1)', color: '#60a5fa', cursor: 'pointer', fontWeight: 700 }}>
                <Plus size={11} /> Add style
              </button>
            </div>
            {defs.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-secondary)', fontSize: '0.72rem', lineHeight: 1.6 }}>
                No styles yet.<br /><span style={{ opacity: 0.6 }}>Click "Add style" to visually create a <code>classDef</code>.</span>
              </div>
            )}
            {defs.map((def, idx) => (
              <ClassDefCard key={idx} def={def} onChange={u => handleDefChange(idx, u)} onDelete={() => handleDefDelete(idx)}
                nodeIds={nodeIds} assignments={assignments} onAssign={handleAssign} />
            ))}
          </>
        )}

        {activeTab === 'shapes' && <ShapesTab cadCode={cadCode} onCommit={commit} />}
        {activeTab === 'edges'  && <EdgesTab  cadCode={cadCode} onCommit={commit} />}
      </div>
    </div>
  );
}
