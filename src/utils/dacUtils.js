import { v4 as uuidv4 } from 'uuid';

/* -------------------------------------------------------------------------- */
/*  Mermaid flowchart parser                                                  */
/*                                                                            */
/*  Supports:                                                                 */
/*   - directions: graph/flowchart TD|TB|BT|LR|RL                            */
/*   - node shapes: [] () ([]) [[]] [()] (()) {} {{}} >] [/ /] [\ \]          */
/*   - multi-hop chains: A --> B --> C                                        */
/*   - edge kinds: -->  ---  -.->  -.-  ==>  ===  --x  --o  <-->              */
/*   - edge labels: A -->|text| B   and   A -- text --> B                     */
/*   - subgraphs -> container nodes (children get parentId)                   */
/*   - styling: classDef / class / style / A:::klass                          */
/*   - comments: %% ...                                                       */
/* -------------------------------------------------------------------------- */

const DEFAULT_COLOR = '#3b82f6';

// Map a mermaid shape wrapper to our CustomNode shape + label.
// Order matters: longer/compound wrappers must be tested before single ones.
const SHAPE_MATCHERS = [
  { re: /^\(\[(.*)\]\)$/s, shape: 'rectangle', rounded: true }, // ([text]) stadium
  { re: /^\[\[(.*)\]\]$/s, shape: 'rectangle' },                // [[text]] subroutine
  { re: /^\[\((.*)\)\]$/s, shape: 'cylinder' },                 // [(text)] database
  { re: /^\(\((.*)\)\)$/s, shape: 'circle' },                   // ((text)) circle
  { re: /^\{\{(.*)\}\}$/s, shape: 'diamond' },                  // {{text}} hexagon -> diamond
  { re: /^\{(.*)\}$/s, shape: 'diamond' },                      // {text} decision
  { re: /^\[\/(.*)\/\]$/s, shape: 'rectangle' },                // [/text/] parallelogram
  { re: /^\[\\(.*)\\\]$/s, shape: 'rectangle' },                // [\text\]
  { re: /^>(.*)\]$/s, shape: 'rectangle' },                     // >text] flag
  { re: /^\((.*)\)$/s, shape: 'rectangle', rounded: true },     // (text) rounded
  { re: /^\[(.*)\]$/s, shape: 'rectangle' },                    // [text] rectangle
];

const cleanLabel = (raw) => {
  if (raw == null) return '';
  let l = String(raw).trim();
  // strip a single surrounding pair of quotes
  if ((l.startsWith('"') && l.endsWith('"')) || (l.startsWith("'") && l.endsWith("'"))) {
    l = l.slice(1, -1);
  }
  // mermaid uses <br> / <br/> for line breaks
  l = l.replace(/<br\s*\/?>/gi, '\n');
  return l.trim();
};

// Parse a node token like  A["Label"]  or  A{Decision}  or  A
// Returns { id, label, shape, rounded, klass } or null.
const parseNodeToken = (tokenRaw) => {
  const token = tokenRaw.trim();
  if (!token) return null;

  // capture id, then any class assignment (:::klass), then the optional shape body
  const idMatch = token.match(/^([A-Za-z0-9_.-]+)/);
  if (!idMatch) return null;
  const id = idMatch[1];
  let rest = token.slice(id.length).trim();

  // inline class:  A:::important[Label]   or   A:::important
  let klass = null;
  const classMatch = rest.match(/^:::([A-Za-z0-9_-]+)/);
  if (classMatch) {
    klass = classMatch[1];
    rest = rest.slice(classMatch[0].length).trim();
  }

  let shape = 'rectangle';
  let rounded = false;
  let label = id;

  if (rest) {
    let matched = false;
    for (const m of SHAPE_MATCHERS) {
      const r = rest.match(m.re);
      if (r) {
        shape = m.shape;
        rounded = !!m.rounded;
        label = cleanLabel(r[1]);
        matched = true;
        break;
      }
    }
    if (!matched) label = cleanLabel(rest);
  }

  return { id, label: label || id, shape, rounded, klass };
};

// Connector matcher. Captures the link operator and an optional |pipe label|.
const CONNECTOR = /(<?[ox]?[-.=]{2,}[ox]?>?)(?:\|([^|]*)\|)?/g;

// Convert  A -- text --> B   into   A -->|text| B   so the splitter sees a label.
const normalizeInlineLabels = (stmt) =>
  stmt.replace(/([-.=]{2,})\s+([^>|]+?)\s+([-.=]{2,}[>xo])/g, '$3|$2|');

const classifyEdge = (op) => {
  const animated = op.includes('.');
  const thick = op.includes('=');
  let arrowEnd = 'arrowclosed';
  if (op.endsWith('o')) arrowEnd = null;        // circle end -> no marker
  else if (op.endsWith('x')) arrowEnd = 'arrow';
  const bidirectional = op.startsWith('<');
  return { animated, thick, arrowEnd, bidirectional };
};

// Decide whether a snippet is a flowchart (rendered on the interactive React
// Flow canvas) or one of the many other Mermaid diagram types (rendered as SVG
// by the official Mermaid library). Returns 'flowchart' | 'other'.
export const detectDiagramKind = (code) => {
  const lines = (code || '').split('\n');
  let inFrontmatter = false;
  for (let raw of lines) {
    let line = raw.replace(/%%\{[^}]*\}%%/g, '').replace(/%%.*$/, '').trim();
    if (!line) continue;
    if (line === '---') { inFrontmatter = !inFrontmatter; continue; } // yaml frontmatter
    if (inFrontmatter) continue;
    const first = line.split(/[\s({:[]/)[0].toLowerCase();
    if (first === 'flowchart' || first === 'graph') return 'flowchart';
    return 'other';
  }
  return 'flowchart';
};

export const parseMermaid = (code) => {
  const nodes = [];
  const edges = [];
  const nodeMap = new Map();
  const classDefs = {};        // klass -> color
  const nodeClasses = {};       // nodeId -> color (from class/style/:::)
  let direction = 'TB';

  const subgraphStack = [];     // active container ids (nesting)

  const ensureNode = (parsed) => {
    if (!parsed) return null;
    let node = nodeMap.get(parsed.id);
    if (!node) {
      node = {
        id: parsed.id,
        type: 'custom',
        position: { x: 0, y: 0 },
        data: {
          label: parsed.label,
          shape: parsed.shape,
          color: DEFAULT_COLOR,
          rounded: parsed.rounded,
          isEip: false,
        },
      };
      if (subgraphStack.length > 0) node.parentId = subgraphStack[subgraphStack.length - 1];
      nodeMap.set(parsed.id, node);
      nodes.push(node);
    } else {
      // a later, richer definition overrides shape/label
      if (parsed.label && parsed.label !== parsed.id) node.data.label = parsed.label;
      if (parsed.shape && parsed.shape !== 'rectangle') node.data.shape = parsed.shape;
      if (parsed.rounded) node.data.rounded = true;
    }
    if (parsed.klass) nodeClasses[parsed.id] = parsed.klass;
    return node;
  };

  const lines = code.split('\n');

  for (let raw of lines) {
    // strip comments
    let line = raw.replace(/%%.*$/, '').trim();
    if (!line) continue;

    // direction / graph header
    const header = line.match(/^(?:flowchart|graph)\s+(TB|TD|BT|RL|LR)\b/i);
    if (header) {
      direction = header[1].toUpperCase() === 'TD' ? 'TB' : header[1].toUpperCase();
      continue;
    }
    if (/^(?:flowchart|graph)\b/i.test(line)) continue;
    if (/^direction\s+/i.test(line)) {
      const d = line.split(/\s+/)[1];
      if (d) direction = d.toUpperCase() === 'TD' ? 'TB' : d.toUpperCase();
      continue;
    }

    // subgraph open:  subgraph id [Title]   |  subgraph Title  | subgraph id
    const sub = line.match(/^subgraph\s+(.*)$/i);
    if (sub) {
      const body = sub[1].trim();
      let sgId, sgTitle;
      const titled = body.match(/^([A-Za-z0-9_.-]+)\s*\[(.*)\]$/);
      if (titled) {
        sgId = titled[1];
        sgTitle = cleanLabel(titled[2]);
      } else {
        sgId = body.replace(/[^A-Za-z0-9_]/g, '_') || `sg_${nodes.length}`;
        sgTitle = cleanLabel(body) || sgId;
      }
      const container = {
        id: sgId,
        type: 'custom',
        position: { x: 0, y: 0 },
        data: { label: sgTitle, isContainer: true, shape: 'rectangle', color: '#64748b' },
        style: { width: 400, height: 300, zIndex: -1 },
      };
      if (subgraphStack.length > 0) container.parentId = subgraphStack[subgraphStack.length - 1];
      if (!nodeMap.has(sgId)) {
        nodeMap.set(sgId, container);
        nodes.push(container);
      }
      subgraphStack.push(sgId);
      continue;
    }
    if (/^end$/i.test(line)) {
      subgraphStack.pop();
      continue;
    }

    // classDef name fill:#fff,stroke:#000
    const cd = line.match(/^classDef\s+([A-Za-z0-9_-]+)\s+(.*)$/i);
    if (cd) {
      const fill = cd[2].match(/fill\s*:\s*([^,;\s]+)/i);
      if (fill) classDefs[cd[1]] = fill[1];
      continue;
    }
    // class A,B name
    const cls = line.match(/^class\s+([A-Za-z0-9_,.\s-]+)\s+([A-Za-z0-9_-]+)$/i);
    if (cls) {
      cls[1].split(',').map(s => s.trim()).filter(Boolean).forEach(id => { nodeClasses[id] = cls[2]; });
      continue;
    }
    // style A fill:#fff
    const st = line.match(/^style\s+([A-Za-z0-9_.-]+)\s+(.*)$/i);
    if (st) {
      const fill = st[2].match(/fill\s*:\s*([^,;\s]+)/i);
      if (fill) nodeClasses[st[1]] = `__direct:${fill[1]}`;
      continue;
    }
    if (/^(linkStyle|click|%%\{)/i.test(line)) continue;

    // --- statement with (possibly chained) edges -------------------------
    const stmt = normalizeInlineLabels(line);
    CONNECTOR.lastIndex = 0;
    const segments = [];
    const links = [];
    let lastIndex = 0;
    let m;
    while ((m = CONNECTOR.exec(stmt)) !== null) {
      if (m[0].length === 0) { CONNECTOR.lastIndex++; continue; }
      segments.push(stmt.slice(lastIndex, m.index));
      links.push({ op: m[1], label: m[2] });
      lastIndex = CONNECTOR.lastIndex;
    }
    segments.push(stmt.slice(lastIndex));

    if (links.length === 0) {
      ensureNode(parseNodeToken(stmt));
      continue;
    }

    const parsedSegs = segments.map(parseNodeToken);
    parsedSegs.forEach(ensureNode);

    for (let i = 0; i < links.length; i++) {
      const a = parsedSegs[i];
      const b = parsedSegs[i + 1];
      if (!a || !b) continue;
      const kind = classifyEdge(links[i].op);
      edges.push({
        id: uuidv4(),
        source: a.id,
        target: b.id,
        label: cleanLabel(links[i].label),
        animated: kind.animated,
        type: 'custom',
        sourceHandle: direction === 'LR' || direction === 'RL' ? 'right' : 'bottom',
        targetHandle: direction === 'LR' || direction === 'RL' ? 'left' : 'top',
        markerEnd: kind.arrowEnd ? { type: kind.arrowEnd } : undefined,
        data: { thick: kind.thick, bidirectional: kind.bidirectional },
      });
    }
  }

  // resolve colors from classDef / class / style
  Object.entries(nodeClasses).forEach(([id, klass]) => {
    const node = nodeMap.get(id);
    if (!node) return;
    let color = null;
    if (klass.startsWith('__direct:')) color = klass.slice('__direct:'.length);
    else if (classDefs[klass]) color = classDefs[klass];
    if (color) node.data.color = color;
  });

  return { nodes, edges, direction };
};

/* -------------------------------------------------------------------------- */
/*  Serializers (canvas -> code)                                              */
/* -------------------------------------------------------------------------- */

const wrapShape = (label, shape, rounded) => {
  const safe = (label || '').replace(/"/g, "'").replace(/\n/g, '<br>');
  const body = `"${safe}"`;
  switch (shape) {
    case 'diamond': return `{${body}}`;
    case 'circle':
    case 'oval': return `((${body}))`;
    case 'cylinder':
    case 'database': return `[(${body})]`;
    default: return rounded ? `(${body})` : `[${body}]`;
  }
};

export const serializeMermaid = (nodes, edges, direction = 'LR') => {
  let out = `flowchart ${direction}\n`;
  const sanitize = (id) => String(id).replace(/[^a-zA-Z0-9_]/g, '_');

  const renderable = nodes.filter(
    n => !n.data?.isGhost && n.data?.shape !== 'drawing'
  );
  const containers = renderable.filter(n => n.data?.isContainer);
  const plainNodes = renderable.filter(n => !n.data?.isContainer);
  const usedNodes = new Set();

  const nodeDecl = (n) =>
    `${sanitize(n.id)}${n.data?.label ? wrapShape(n.data.label, n.data.shape, n.data.rounded) : ''}`;

  const renderEdge = (e) => {
    const src = nodes.find(n => n.id === e.source);
    const tgt = nodes.find(n => n.id === e.target);
    if (!src || !tgt || src.data?.isGhost || tgt.data?.isGhost) return '';
    if (src.data?.shape === 'drawing' || tgt.data?.shape === 'drawing') return '';
    usedNodes.add(src.id);
    usedNodes.add(tgt.id);
    const op = e.animated ? '-.->' : (e.data?.thick ? '==>' : '-->');
    const lbl = e.label ? `|"${String(e.label).replace(/"/g, "'")}"|` : '';
    return `  ${nodeDecl(src)} ${op}${lbl} ${nodeDecl(tgt)}`;
  };

  // group child nodes/edges under their container as subgraphs
  containers.forEach(c => {
    out += `  subgraph ${sanitize(c.id)} ["${(c.data.label || c.id).replace(/"/g, "'")}"]\n`;
    plainNodes.filter(n => n.parentId === c.id).forEach(n => {
      out += `    ${nodeDecl(n)}\n`;
      usedNodes.add(n.id);
    });
    out += `  end\n`;
  });

  edges.forEach(e => {
    const line = renderEdge(e);
    if (line) out += line + '\n';
  });

  plainNodes.forEach(n => {
    if (!usedNodes.has(n.id)) out += `  ${nodeDecl(n)}\n`;
  });

  // emit color styles
  plainNodes.forEach(n => {
    if (n.data?.color && n.data.color !== DEFAULT_COLOR) {
      out += `  style ${sanitize(n.id)} fill:${n.data.color}22,stroke:${n.data.color}\n`;
    }
  });

  return out;
};

export const serializePlantUML = (nodes, edges) => {
  let out = "@startuml\n";
  out += "skinparam componentStyle rectangle\n";

  nodes.forEach(n => {
    if (!n.data.isContainer && n.data.shape !== 'drawing' && !n.data.isGhost) {
      const shape = (n.data.shape === 'database' || n.data.shape === 'cylinder') ? 'database' : 'rectangle';
      out += `${shape} "${(n.data.label || n.id).replace(/\n/g, '\\n')}" as ${n.id.replace(/[^a-zA-Z0-9]/g, '')}\n`;
    }
  });

  edges.forEach(e => {
    const srcNode = nodes.find(n => n.id === e.source);
    const tgtNode = nodes.find(n => n.id === e.target);
    if (srcNode && tgtNode && !srcNode.data.isGhost && !tgtNode.data.isGhost) {
       const src = e.source.replace(/[^a-zA-Z0-9]/g, '');
       const tgt = e.target.replace(/[^a-zA-Z0-9]/g, '');
       const edgeStr = e.animated ? '.>' : '-->';
       const edgeLabel = e.label ? ` : ${e.label}` : '';
       out += `${src} ${edgeStr} ${tgt}${edgeLabel}\n`;
    }
  });

  out += "@enduml\n";
  return out;
};

export const serializeD2 = (nodes, edges) => {
  let out = "direction: right\n";

  nodes.forEach(n => {
    if (!n.data.isContainer && n.data.shape !== 'drawing' && !n.data.isGhost) {
      const shape = (n.data.shape === 'database' || n.data.shape === 'cylinder') ? 'cylinder'
        : (n.data.shape === 'circle' ? 'circle' : (n.data.shape === 'diamond' ? 'diamond' : 'rectangle'));
      const label = (n.data.label || n.id).split('\n').join('\\n');
      out += `${n.id.replace(/[^a-zA-Z0-9]/g, '')}: "${label}" {\n  shape: ${shape}\n}\n`;
    }
  });

  edges.forEach(e => {
    const srcNode = nodes.find(n => n.id === e.source);
    const tgtNode = nodes.find(n => n.id === e.target);
    if (srcNode && tgtNode && !srcNode.data.isGhost && !tgtNode.data.isGhost) {
        const src = e.source.replace(/[^a-zA-Z0-9]/g, '');
        const tgt = e.target.replace(/[^a-zA-Z0-9]/g, '');
        const edgeLabel = e.label ? ` { label: "${e.label}" }` : '';
        out += `${src} -> ${tgt}${edgeLabel}\n`;
    }
  });

  return out;
};

/* -------------------------------------------------------------------------- */
/*  A lightweight validity check used to surface parse errors in the UI       */
/* -------------------------------------------------------------------------- */

export const validateMermaid = (code) => {
  const trimmed = (code || '').trim();
  if (!trimmed) return { ok: true, message: '' };
  if (detectDiagramKind(trimmed) !== 'flowchart') {
    return { ok: true, message: 'Ready' };
  }
  const open = (trimmed.match(/\bsubgraph\b/gi) || []).length;
  const close = (trimmed.match(/^\s*end\s*$/gim) || []).length;
  if (open > close) return { ok: false, message: `Unclosed subgraph (${open - close} missing "end")` };
  if (close > open) return { ok: false, message: `Unexpected "end" (${close - open} extra)` };
  try {
    const { nodes } = parseMermaid(code);
    if (nodes.length === 0) return { ok: false, message: 'No nodes recognised — check your syntax' };
    return { ok: true, message: `${nodes.length} node${nodes.length === 1 ? '' : 's'}` };
  } catch (e) {
    return { ok: false, message: e.message || 'Parse error' };
  }
};
