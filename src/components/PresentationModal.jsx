import { useState, useRef, useCallback, useEffect } from 'react';
import { ReactFlow, Controls, Background, useViewport, useReactFlow, getNodesBounds, getViewportForBounds } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng, toSvg } from 'html-to-image';
import { X, StickyNote, MessageCircle, Highlighter, Trash2, ChevronDown, MousePointer2, Sun, Moon, Grid3X3, Sparkles, Download, FileJson, Image, FileText } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import CustomNode from '../CustomNode';
import CustomEdge from '../CustomEdge';

const nodeTypes = { custom: CustomNode };
const edgeTypes = { custom: CustomEdge };

const HIGHLIGHT_COLORS = ['#facc15', '#f87171', '#4ade80', '#60a5fa', '#c084fc'];
const STICKY_COLORS = ['#fef08a', '#bbf7d0', '#bfdbfe', '#fecdd3', '#e9d5ff'];
const NEON_COLORS = ['#00ffff', '#ff00ff', '#00ff88', '#ff6600', '#ff0055', '#aaff00', '#bf00ff', '#00bfff'];

// Reports viewport to parent and exposes setViewport/getViewport via controlRef
function ViewportController({ onViewport, controlRef }) {
  const vp = useViewport();
  const { setViewport, getViewport } = useReactFlow();
  useEffect(() => { onViewport(vp); }, [vp, onViewport]);
  useEffect(() => {
    if (controlRef) controlRef.current = { setViewport, getViewport };
  }, [setViewport, getViewport, controlRef]);
  return null;
}

// ── Draggable annotation in flow-space ───────────────────────────────────────
function Annotation({ id, type, flowX, flowY, color, text, selected, onRemove, onMoveFlow, onTextChange, vp, overlayRect }) {
  const dragging = useRef(false);
  const dragStart = useRef(null); // { mouseX, mouseY, flowX, flowY }

  // Convert a screen position to flow coords
  const toFlow = (sx, sy) => ({
    x: (sx - overlayRect.x - vp.x) / vp.zoom,
    y: (sy - overlayRect.y - vp.y) / vp.zoom,
  });

  const onMouseDown = (e) => {
    if (e.target.tagName === 'TEXTAREA' || e.target.closest('button')) return;
    dragging.current = true;
    dragStart.current = { mouseX: e.clientX, mouseY: e.clientY, flowX, flowY };
    e.preventDefault();
    e.stopPropagation();
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current || !dragStart.current) return;
      const dx = (e.clientX - dragStart.current.mouseX) / vp.zoom;
      const dy = (e.clientY - dragStart.current.mouseY) / vp.zoom;
      onMoveFlow(id, dragStart.current.flowX + dx, dragStart.current.flowY + dy);
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [id, vp.zoom, flowX, flowY, onMoveFlow]);

  const isCloud = type === 'cloud';
  const SCALE = 1 / vp.zoom; // annotations rendered at a fixed visual size regardless of zoom

  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        position: 'absolute',
        left: flowX, top: flowY,
        // Scale up annotations inversely to zoom so they always appear the same visual size
        transform: `scale(${SCALE})`,
        transformOrigin: 'top left',
        cursor: 'grab',
        userSelect: 'none',
        filter: selected ? 'drop-shadow(0 0 6px #3b82f6)' : 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))',
        zIndex: 10,
        pointerEvents: 'all',
      }}
    >
      {isCloud ? (
        <div style={{ position: 'relative', minWidth: 160 }}>
          <svg width="160" height="70" viewBox="0 0 160 70" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
            <path d="M20,52 Q5,52 5,40 Q5,28 16,26 Q14,10 32,10 Q40,2 52,8 Q60,2 72,6 Q87,0 97,10 Q112,8 120,20 Q134,18 140,30 Q150,32 150,44 Q150,56 136,56 Q80,60 20,52 Z" fill={color} />
            <path d="M38,56 Q32,66 22,68 Q30,58 36,56" fill={color} />
          </svg>
          <div style={{ position: 'relative', padding: '10px 16px 22px' }}>
            <textarea value={text} onChange={e => onTextChange(id, e.target.value)} placeholder="Cloud note…"
              style={{ background: 'transparent', border: 'none', outline: 'none', resize: 'none', fontSize: '0.78rem', fontWeight: 600, color: '#1e293b', width: 126, height: 38, fontFamily: 'inherit', cursor: 'text' }} />
          </div>
          <button onClick={() => onRemove(id)} style={{ position: 'absolute', top: -8, right: -8, background: '#ef4444', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', padding: 0 }}>
            <X size={11} />
          </button>
        </div>
      ) : (
        <div style={{ position: 'relative', width: 164, minHeight: 120, background: color, borderRadius: '2px 2px 2px 0', padding: '8px 10px 14px', boxSizing: 'border-box' }}>
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: 0, height: 0, borderTop: '12px solid rgba(0,0,0,0.12)', borderRight: '12px solid transparent' }} />
          <textarea value={text} onChange={e => onTextChange(id, e.target.value)} placeholder="Sticky note…"
            style={{ background: 'transparent', border: 'none', outline: 'none', resize: 'none', fontSize: '0.8rem', color: '#1e293b', width: '100%', height: 90, fontFamily: "'Segoe UI', sans-serif", cursor: 'text' }} />
          <button onClick={() => onRemove(id)} style={{ position: 'absolute', top: -8, right: -8, background: '#ef4444', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', padding: 0 }}>
            <X size={11} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Pointer overlay — arrow at rest, crosshair+rubber-band while dragging ────
function PointerOverlay({ onSelect, onDeselect }) {
  const [dragRect, setDragRect] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const start = useRef(null);
  const ref = useRef(null);

  const getPos = (e) => {
    const r = ref.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onMouseDown = (e) => {
    if (e.target.closest('[data-annotation]')) return;
    start.current = getPos(e);
    setIsDragging(false);
  };

  const onMouseMove = (e) => {
    if (!start.current) return;
    const p = getPos(e);
    const w = Math.abs(p.x - start.current.x);
    const h = Math.abs(p.y - start.current.y);
    if (w > 4 || h > 4) {
      setIsDragging(true);
      setDragRect({ x: Math.min(start.current.x, p.x), y: Math.min(start.current.y, p.y), w, h });
    }
  };

  const onMouseUp = (e) => {
    if (!start.current) return;
    const p = getPos(e);
    const w = Math.abs(p.x - start.current.x);
    const h = Math.abs(p.y - start.current.y);
    const rect = { x: Math.min(start.current.x, p.x), y: Math.min(start.current.y, p.y), w, h };
    const wasDrag = w > 4 || h > 4;
    start.current = null;
    setIsDragging(false);
    setDragRect(null);
    if (wasDrag) onSelect(rect);
    else onDeselect();
  };

  return (
    <div ref={ref} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}
      style={{ position: 'absolute', inset: 0, zIndex: 12, cursor: isDragging ? 'crosshair' : 'default' }}>
      {isDragging && dragRect && dragRect.w > 2 && (
        <div style={{
          position: 'absolute', left: dragRect.x, top: dragRect.y, width: dragRect.w, height: dragRect.h,
          border: '1.5px dashed #3b82f6', background: 'rgba(59,130,246,0.07)',
          pointerEvents: 'none', boxSizing: 'border-box', borderRadius: 2,
        }} />
      )}
    </div>
  );
}

// ── Highlight freehand capture — screen space → flow space ───────────────────
function HighlightCapture({ active, color, size, opacity, vp, overlayRect, onStrokeAdd }) {
  const drawing = useRef(false);
  const currentPoints = useRef([]);

  const toFlow = (e) => {
    const r = overlayRect;
    return { x: (e.clientX - r.x - vp.x) / vp.zoom, y: (e.clientY - r.y - vp.y) / vp.zoom };
  };

  const onMouseDown = (e) => {
    if (!active) return;
    e.preventDefault();
    drawing.current = true;
    currentPoints.current = [toFlow(e)];
  };
  const onMouseMove = (e) => {
    if (!active || !drawing.current) return;
    e.preventDefault();
    currentPoints.current = [...currentPoints.current, toFlow(e)];
    onStrokeAdd(null, currentPoints.current);
  };
  const onMouseUp = () => {
    if (!drawing.current) return;
    drawing.current = false;
    if (currentPoints.current.length > 1) onStrokeAdd('commit', currentPoints.current);
    currentPoints.current = [];
  };

  return (
    <div onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
      style={{ position: 'absolute', inset: 0, zIndex: 20, cursor: active ? 'crosshair' : 'default', pointerEvents: active ? 'all' : 'none' }} />
  );
}

// ── Neon laser capture — pointer dot or straight line, both transient ─────────
function NeonCapture({ active, mode, vp, overlayRect, onPointerMove, onPointerLeave, onLineStart, onLineDraw }) {
  const lineStart = useRef(null);

  const toFlow = (e) => {
    const r = overlayRect;
    return { x: (e.clientX - r.x - vp.x) / vp.zoom, y: (e.clientY - r.y - vp.y) / vp.zoom };
  };

  const onMouseMove = (e) => {
    if (!active) return;
    onPointerMove(toFlow(e));
  };

  const onMouseDown = (e) => {
    if (!active || mode !== 'line') return;
    e.preventDefault();
    const p = toFlow(e);
    lineStart.current = p;
    onLineStart(p);
  };

  const onMouseUp = (e) => {
    if (!active || mode !== 'line' || !lineStart.current) return;
    onLineDraw(lineStart.current, toFlow(e));
    lineStart.current = null;
  };

  const onMouseLeave = () => {
    onPointerLeave();
    lineStart.current = null;
  };

  return (
    <div
      onMouseMove={onMouseMove}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      style={{ position: 'absolute', inset: 0, zIndex: 20, pointerEvents: active ? 'all' : 'none', cursor: active ? 'none' : 'default' }}
    />
  );
}

// ── Neon freehand pen capture ────────────────────────────────────────────────
function NeonPenCapture({ active, vp, overlayRect, onStrokeUpdate, onStrokeCommit }) {
  const drawing = useRef(false);

  const toFlow = (e) => {
    const r = overlayRect;
    return { x: (e.clientX - r.x - vp.x) / vp.zoom, y: (e.clientY - r.y - vp.y) / vp.zoom };
  };

  const onMouseDown = (e) => {
    if (!active) return;
    e.preventDefault();
    drawing.current = true;
    const p = toFlow(e);
    onStrokeUpdate([p]);
  };

  const onMouseMove = (e) => {
    if (!active || !drawing.current) return;
    const p = toFlow(e);
    onStrokeUpdate(prev => [...(prev || []), p]);
  };

  const onMouseUp = (e) => {
    if (!active || !drawing.current) return;
    drawing.current = false;
    onStrokeCommit();
  };

  const onMouseLeave = () => {
    if (drawing.current) { drawing.current = false; onStrokeCommit(); }
  };

  return (
    <div onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseLeave}
      style={{ position: 'absolute', inset: 0, zIndex: 20, pointerEvents: active ? 'all' : 'none', cursor: active ? 'crosshair' : 'default' }}
    />
  );
}

// ── Main modal ───────────────────────────────────────────────────────────────
export default function PresentationModal({ nodes, edges, visible, onClose }) {
  const { theme: appTheme } = useTheme();
  const [canvasTheme, setCanvasTheme] = useState(appTheme);
  const [showBackground, setShowBackground] = useState(true);
  const [tool, setTool] = useState('pan');
  const [highlightColor, setHighlightColor] = useState(HIGHLIGHT_COLORS[0]);
  const [highlightSize, setHighlightSize] = useState(20);
  const [highlightOpacity, setHighlightOpacity] = useState(0.35);
  const [neonColor, setNeonColor] = useState(NEON_COLORS[0]);
  const [neonSize, setNeonSize] = useState(1);
  const [neonMode, setNeonMode] = useState('pointer'); // 'pointer' | 'line' | 'pen'
  const [laserPos, setLaserPos] = useState(null);       // flow coords of pointer dot
  const [laserLine, setLaserLine] = useState(null);     // { x1,y1,x2,y2 } transient line
  const [fadingLines, setFadingLines] = useState([]);   // lines fading out after release
  const [liveNeonStroke, setLiveNeonStroke] = useState(null); // points being drawn
  const [stickyColor, setStickyColor] = useState(STICKY_COLORS[0]);
  const [annotations, setAnnotations] = useState([]);
  const [strokes, setStrokes] = useState([]);
  const [liveStroke, setLiveStroke] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectedStrokeIds, setSelectedStrokeIds] = useState(new Set());
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [vp, setVp] = useState({ x: 0, y: 0, zoom: 1 });

  const annotationIdRef = useRef(0);
  const strokeIdRef = useRef(0);
  const overlayRef = useRef(null);
  const rfControlRef = useRef(null); // { setViewport, getViewport } from inside ReactFlow

  const isHighlighting = tool === 'highlight';
  const isNeon = tool === 'neon';
  const isAnnotating = tool === 'sticky' || tool === 'cloud';
  const isSelecting = tool === 'select';

  useEffect(() => { setCanvasTheme(appTheme); }, [appTheme]);

  // Delete selected items on Delete/Backspace key; Ctrl+Z undoes neon pen strokes
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && !e.ctrlKey && !e.metaKey) {
        setAnnotations(prev => prev.filter(a => !selectedIds.has(a.id)));
        setStrokes(prev => prev.filter(s => !selectedStrokeIds.has(s.id)));
        setSelectedIds(new Set());
        setSelectedStrokeIds(new Set());
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selectedIds, selectedStrokeIds]);

  const getOverlayRect = () => overlayRef.current?.getBoundingClientRect() ?? { x: 0, y: 0 };

  // Convert screen position to flow coordinates
  const toFlow = useCallback((sx, sy) => {
    const r = getOverlayRect();
    return { x: (sx - r.x - vp.x) / vp.zoom, y: (sy - r.y - vp.y) / vp.zoom };
  }, [vp]);

  const handleCanvasClick = useCallback((e) => {
    if (!isAnnotating) return;
    if (e.target.closest('[data-annotation]')) return;
    const flow = toFlow(e.clientX, e.clientY);
    const id = ++annotationIdRef.current;
    setAnnotations(prev => [...prev, { id, type: tool, flowX: flow.x - 82 / vp.zoom, flowY: flow.y - 44 / vp.zoom, color: stickyColor, text: '' }]);
  }, [isAnnotating, tool, stickyColor, toFlow, vp.zoom]);

  const removeAnnotation = useCallback((id) => setAnnotations(prev => prev.filter(a => a.id !== id)), []);
  const moveAnnotationFlow = useCallback((id, fx, fy) => setAnnotations(prev => prev.map(a => a.id === id ? { ...a, flowX: fx, flowY: fy } : a)), []);
  const changeAnnotationText = useCallback((id, text) => setAnnotations(prev => prev.map(a => a.id === id ? { ...a, text } : a)), []);

  // Highlight freehand stroke callbacks
  const handleStroke = useCallback((type, points) => {
    if (type === null) {
      setLiveStroke(points);
    } else {
      setLiveStroke(null);
      const id = ++strokeIdRef.current;
      setStrokes(prev => [...prev, { id, color: highlightColor, size: highlightSize, opacity: highlightOpacity, points }]);
    }
  }, [highlightColor, highlightSize, highlightOpacity]);

  // Neon laser callbacks
  const handleNeonPointerMove = useCallback((flowPos) => {
    setLaserPos(flowPos);
    setLaserLine(prev => prev ? { ...prev, x2: flowPos.x, y2: flowPos.y } : null);
  }, []);

  const handleNeonPointerLeave = useCallback(() => {
    setLaserPos(null);
    setLaserLine(null);
  }, []);

  const handleNeonLineStart = useCallback((start) => {
    setLaserLine({ x1: start.x, y1: start.y, x2: start.x, y2: start.y });
  }, []);

  const handleNeonLineDraw = useCallback((start, end) => {
    const id = ++strokeIdRef.current;
    const line = { id, x1: start.x, y1: start.y, x2: end.x, y2: end.y };
    setFadingLines(prev => [...prev, line]);
    setLaserLine(null);
    setTimeout(() => setFadingLines(prev => prev.filter(l => l.id !== id)), 900);
  }, []);

  const handleNeonPenUpdate = useCallback((pointsOrUpdater) => {
    setLiveNeonStroke(prev => typeof pointsOrUpdater === 'function' ? pointsOrUpdater(prev) : pointsOrUpdater);
  }, []);

  const handleNeonPenCommit = useCallback(() => {
    setLiveNeonStroke(prev => {
      if (prev && prev.length > 1) {
        const id = ++strokeIdRef.current;
        setFadingLines(fl => [...fl, { id, points: prev, color: neonColor, size: neonSize }]);
        setTimeout(() => setFadingLines(fl => fl.filter(l => l.id !== id)), 900);
      }
      return null;
    });
  }, [neonColor, neonSize]);

  // Selection: highlight items overlapping the rubber-band rect (in screen coords)
  const handleSelection = useCallback((screenRect) => {
    const r = getOverlayRect();
    const fX1 = (screenRect.x - vp.x - r.x) / vp.zoom;
    const fY1 = (screenRect.y - vp.y - r.y) / vp.zoom;
    const fX2 = fX1 + screenRect.w / vp.zoom;
    const fY2 = fY1 + screenRect.h / vp.zoom;

    const NOTE_W = 164 / vp.zoom;
    const NOTE_H = 120 / vp.zoom;

    const hitAnnotations = annotations.filter(a =>
      a.flowX < fX2 && a.flowX + NOTE_W > fX1 && a.flowY < fY2 && a.flowY + NOTE_H > fY1
    );
    const hitStrokes = strokes.filter(s =>
      s.points.some(p => p.x >= fX1 && p.x <= fX2 && p.y >= fY1 && p.y <= fY2)
    );

    setSelectedIds(new Set(hitAnnotations.map(a => a.id)));
    setSelectedStrokeIds(new Set(hitStrokes.map(s => s.id)));
  }, [annotations, strokes, vp]);

  const handleDeselect = useCallback(() => {
    setSelectedIds(new Set());
    setSelectedStrokeIds(new Set());
  }, []);

  const clearAll = () => {
    setAnnotations([]);
    setStrokes([]);
    setLiveStroke(null);
    setLiveNeonStroke(null);
    setFadingLines([]);
    setSelectedIds(new Set());
    setSelectedStrokeIds(new Set());
  };

  // ── Export helpers ──────────────────────────────────────────────────────────
  const getSanitizedName = () => 'presentation-' + new Date().toISOString().slice(0, 10);

  const exportJson = () => {
    const payload = {
      version: 1,
      type: 'modelstudio-presentation',
      diagram: { nodes, edges },
      overlays: { annotations, strokes },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${getSanitizedName()}.presentation.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setShowExportDropdown(false);
  };

  // Set ReactFlow viewport to 100% zoom fitting all nodes, capture, then restore.
  const captureAt100 = async (captureFn) => {
    const ctrl = rfControlRef.current;
    if (!ctrl) return;

    const savedVp = ctrl.getViewport();
    const bounds = getNodesBounds(nodes);
    const w = Math.round(bounds.width);
    const h = Math.round(bounds.height);
    // Force zoom=1 (100%) — min and max both set to 1
    const targetVp = getViewportForBounds(bounds, w, h, 1, 1, 0);

    ctrl.setViewport(targetVp, { duration: 0 });
    // Two rAF cycles: first lets ReactFlow apply the viewport, second lets
    // React flush the vp state update so SVG overlay + annotation transforms update
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

    try {
      await captureFn(w, h);
    } finally {
      ctrl.setViewport(savedVp, { duration: 300 });
    }
  };

  const exportPng = async () => {
    setShowExportDropdown(false);
    await new Promise(r => setTimeout(r, 80)); // let dropdown close/re-render
    await captureAt100(async (w, h) => {
      const dataUrl = await toPng(overlayRef.current, {
        width: w, height: h, pixelRatio: 2, skipFonts: true,
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${getSanitizedName()}.png`;
      a.click();
    });
  };

  const exportSvg = async () => {
    setShowExportDropdown(false);
    await new Promise(r => setTimeout(r, 80));
    await captureAt100(async (w, h) => {
      const dataUrl = await toSvg(overlayRef.current, {
        width: w, height: h, skipFonts: true,
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${getSanitizedName()}.svg`;
      a.click();
    });
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && visible) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, visible]);

  const toolBtn = (id, icon, label) => (
    <button onClick={() => setTool(id)}
      style={{
        display: 'flex', alignItems: 'center', gap: 5, padding: '5px 9px',
        background: tool === id ? 'var(--accent, #3b82f6)' : 'transparent',
        color: tool === id ? '#fff' : (canvasTheme === 'dark' ? '#e2e8f0' : '#1e293b'),
        border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: '0.76rem',
        fontWeight: 600, transition: 'background 0.15s', whiteSpace: 'nowrap',
      }}
    >{icon}{label}</button>
  );

  const bgColor = canvasTheme === 'dark' ? '#0f111a' : '#f1f5f9';
  const gridColor = canvasTheme === 'dark' ? '#1e293b' : '#cbd5e1';

  // Build SVG polyline points string
  const pointsStr = (pts) => pts.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, background: bgColor,
      display: visible ? 'flex' : 'none', flexDirection: 'column',
    }}>
      {/* ── Toolbar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px',
        background: canvasTheme === 'dark' ? 'rgba(15,17,26,0.97)' : 'rgba(255,255,255,0.97)',
        borderBottom: `1px solid ${canvasTheme === 'dark' ? '#1e293b' : '#e2e8f0'}`,
        backdropFilter: 'blur(8px)', zIndex: 30, flexShrink: 0, flexWrap: 'wrap',
      }}>
        <span style={{ fontWeight: 800, fontSize: '0.85rem', color: canvasTheme === 'dark' ? '#e2e8f0' : '#1e293b', marginRight: 4, letterSpacing: '-0.3px' }}>Present</span>
        <div style={{ width: 1, height: 22, background: 'rgba(128,128,128,0.3)', margin: '0 4px' }} />

        {toolBtn('pan', null, '✋ Pan')}
        {toolBtn('select', <MousePointer2 size={13} />, 'Pointer')}
        {toolBtn('sticky', <StickyNote size={13} />, 'Sticky')}
        {toolBtn('cloud', <MessageCircle size={13} />, 'Cloud Note')}
        {toolBtn('highlight', <Highlighter size={13} />, 'Highlight')}
        {/* Neon pen button with glow styling */}
        <button onClick={() => setTool('neon')}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '5px 9px',
            background: isNeon ? 'transparent' : 'transparent',
            border: isNeon ? `1px solid ${neonColor}` : 'none',
            borderRadius: 7, cursor: 'pointer', fontSize: '0.76rem', fontWeight: 700,
            color: neonColor,
            boxShadow: isNeon ? `0 0 8px ${neonColor}, 0 0 16px ${neonColor}44` : 'none',
            transition: 'all 0.15s', whiteSpace: 'nowrap',
            textShadow: isNeon ? `0 0 8px ${neonColor}` : 'none',
          }}
        >
          <Sparkles size={13} /> Neon
        </button>

        {/* Tool options panel */}
        {(isHighlighting || isAnnotating || isNeon) && (
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 5, marginLeft: 6, borderLeft: '1px solid rgba(128,128,128,0.25)', paddingLeft: 8 }}>
            {/* Color swatch */}
            <button onClick={() => setShowColorPicker(p => !p)}
              style={{
                width: 24, height: 24, borderRadius: 6,
                background: isHighlighting ? highlightColor : isNeon ? neonColor : stickyColor,
                border: isNeon ? `2px solid ${neonColor}` : '2px solid rgba(128,128,128,0.3)',
                boxShadow: isNeon ? `0 0 6px ${neonColor}` : 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
              <ChevronDown size={9} color={isNeon ? '#000' : '#fff'} />
            </button>
            {showColorPicker && (
              <div style={{ position: 'absolute', top: 32, left: 0, background: canvasTheme === 'dark' ? '#0f172a' : '#fff', border: '1px solid rgba(128,128,128,0.3)', borderRadius: 10, padding: 8, display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: 200, zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
                {(isHighlighting ? HIGHLIGHT_COLORS : isNeon ? NEON_COLORS : STICKY_COLORS).map(c => (
                  <button key={c} onClick={() => {
                    if (isHighlighting) setHighlightColor(c);
                    else if (isNeon) setNeonColor(c);
                    else setStickyColor(c);
                    setShowColorPicker(false);
                  }}
                    style={{
                      width: 22, height: 22, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
                      outline: (isHighlighting ? highlightColor : isNeon ? neonColor : stickyColor) === c ? '2px solid #3b82f6' : 'none',
                      outlineOffset: 2,
                      boxShadow: isNeon ? `0 0 6px ${c}, 0 0 12px ${c}` : 'none',
                    }} />
                ))}
              </div>
            )}
            {/* Highlight options */}
            {isHighlighting && (
              <>
                <label style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.67rem', color: canvasTheme === 'dark' ? '#94a3b8' : '#64748b', whiteSpace: 'nowrap' }}>
                  Size <input type="range" min={4} max={60} value={highlightSize} onChange={e => setHighlightSize(+e.target.value)} style={{ width: 58, accentColor: highlightColor }} />
                  <span style={{ minWidth: 16 }}>{highlightSize}</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.67rem', color: canvasTheme === 'dark' ? '#94a3b8' : '#64748b', whiteSpace: 'nowrap' }}>
                  Opacity <input type="range" min={5} max={100} value={Math.round(highlightOpacity * 100)} onChange={e => setHighlightOpacity(+e.target.value / 100)} style={{ width: 58, accentColor: highlightColor }} />
                  <span style={{ minWidth: 26 }}>{Math.round(highlightOpacity * 100)}%</span>
                </label>
              </>
            )}
            {/* Neon options */}
            {isNeon && (
              <>
                {/* Sub-mode: pointer vs line */}
                {[['pointer', '· Dot'], ['line', '— Line'], ['pen', '✏ Pen']].map(([m, label]) => (
                  <button key={m} onClick={() => setNeonMode(m)}
                    style={{ padding: '3px 8px', border: `1px solid ${neonMode === m ? neonColor : 'rgba(128,128,128,0.3)'}`, borderRadius: 6, background: neonMode === m ? `${neonColor}22` : 'transparent', color: neonColor, cursor: 'pointer', fontSize: '0.68rem', fontWeight: 700, boxShadow: neonMode === m ? `0 0 6px ${neonColor}66` : 'none' }}>
                    {label}
                  </button>
                ))}
                <label style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.67rem', color: neonColor, whiteSpace: 'nowrap', textShadow: `0 0 6px ${neonColor}` }}>
                  Size <input type="range" min={1} max={16} value={neonSize} onChange={e => setNeonSize(+e.target.value)} style={{ width: 54, accentColor: neonColor }} />
                  <span style={{ minWidth: 14 }}>{neonSize}</span>
                </label>
              </>
            )}
          </div>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
          <button onClick={() => setShowBackground(p => !p)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: showBackground ? 'rgba(59,130,246,0.12)' : 'transparent', border: '1px solid rgba(128,128,128,0.25)', borderRadius: 7, cursor: 'pointer', fontSize: '0.7rem', color: showBackground ? '#3b82f6' : (canvasTheme === 'dark' ? '#94a3b8' : '#64748b'), fontWeight: 600 }}>
            <Grid3X3 size={12} /> Grid
          </button>
          <button onClick={() => setCanvasTheme(t => t === 'dark' ? 'light' : 'dark')}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: 'transparent', border: '1px solid rgba(128,128,128,0.25)', borderRadius: 7, cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600, color: canvasTheme === 'dark' ? '#94a3b8' : '#64748b' }}>
            {canvasTheme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
            {canvasTheme === 'dark' ? 'Light' : 'Dark'}
          </button>
          <div style={{ width: 1, height: 18, background: 'rgba(128,128,128,0.2)' }} />
          <button onClick={clearAll}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: 'transparent', border: '1px solid rgba(128,128,128,0.25)', borderRadius: 7, cursor: 'pointer', fontSize: '0.7rem', color: '#f87171', fontWeight: 600 }}>
            <Trash2 size={12} /> Clear
          </button>
          {/* Export dropdown */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowExportDropdown(p => !p)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: '#3b82f6', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#fff', fontWeight: 700, fontSize: '0.78rem' }}>
              <Download size={13} /> Export
            </button>
            {showExportDropdown && (
              <div style={{ position: 'absolute', top: '110%', right: 0, background: canvasTheme === 'dark' ? '#1e293b' : '#fff', border: '1px solid rgba(128,128,128,0.25)', borderRadius: 10, padding: 6, zIndex: 200, minWidth: 210, boxShadow: '0 10px 30px rgba(0,0,0,0.35)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: canvasTheme === 'dark' ? '#64748b' : '#94a3b8', padding: '4px 10px 2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Save presentation</div>
                <button onClick={exportJson}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'transparent', border: 'none', borderRadius: 7, cursor: 'pointer', color: '#60a5fa', fontSize: '0.8rem', fontWeight: 600, textAlign: 'left' }}>
                  <FileJson size={14} /> JSON (diagram + overlays)
                </button>
                <div style={{ height: 1, background: 'rgba(128,128,128,0.15)', margin: '2px 0' }} />
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: canvasTheme === 'dark' ? '#64748b' : '#94a3b8', padding: '4px 10px 2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Screenshot</div>
                <button onClick={exportPng}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'transparent', border: 'none', borderRadius: 7, cursor: 'pointer', color: canvasTheme === 'dark' ? '#e2e8f0' : '#1e293b', fontSize: '0.8rem', textAlign: 'left' }}>
                  <Image size={14} /> PNG (with overlays)
                </button>
                <button onClick={exportSvg}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'transparent', border: 'none', borderRadius: 7, cursor: 'pointer', color: canvasTheme === 'dark' ? '#e2e8f0' : '#1e293b', fontSize: '0.8rem', textAlign: 'left' }}>
                  <FileText size={14} /> SVG (with overlays)
                </button>
              </div>
            )}
          </div>
          <button onClick={onClose}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: '#ef4444', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#fff', fontWeight: 700, fontSize: '0.78rem' }}>
            <X size={14} /> Exit
          </button>
        </div>
      </div>

      {/* ── Canvas area ── */}
      <div
        ref={overlayRef}
        onClick={handleCanvasClick}
        style={{ flex: 1, position: 'relative', overflow: 'hidden' }}
      >
        <ReactFlow
          nodes={nodes} edges={edges}
          nodeTypes={nodeTypes} edgeTypes={edgeTypes}
          nodesDraggable={false} nodesConnectable={false} elementsSelectable={false}
          panOnDrag={!isHighlighting && !isNeon && !isAnnotating}
          zoomOnScroll={true}
          zoomOnPinch={true} panOnScroll={false}
          fitView fitViewOptions={{ padding: 0.1 }}
          style={{ background: bgColor }}
        >
          <ViewportController onViewport={setVp} controlRef={rfControlRef} />
          <Controls />
          {showBackground && <Background color={gridColor} gap={20} size={1} />}
        </ReactFlow>

        {/* ── Overlay layer — same transform as ReactFlow viewport ── */}
        <div style={{
          position: 'absolute', inset: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}>
          {/* SVG overlay — highlights + laser effects — rendered in flow space */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}>
            <defs>
              <filter id="pres-neon-glow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur1" />
                <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur2" />
                <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="blur3" />
                <feMerge>
                  <feMergeNode in="blur3" />
                  <feMergeNode in="blur2" />
                  <feMergeNode in="blur1" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <style>{`
                @keyframes neon-fade {
                  0%   { opacity: 1; }
                  60%  { opacity: 0.7; }
                  100% { opacity: 0; }
                }
                @keyframes neon-dot-pulse {
                  0%, 100% { r: ${(neonSize * 3) / vp.zoom}px; opacity: 0.35; }
                  50%       { r: ${(neonSize * 4) / vp.zoom}px; opacity: 0.55; }
                }
                .neon-fading { animation: neon-fade 0.9s cubic-bezier(0.4,0,0.6,1) forwards; }
              `}</style>
            </defs>
            <g transform={`translate(${vp.x}, ${vp.y}) scale(${vp.zoom})`}>

              {/* Live neon pen stroke */}
              {liveNeonStroke && liveNeonStroke.length > 1 && (
                <g filter="url(#pres-neon-glow)">
                  <polyline points={pointsStr(liveNeonStroke)} fill="none"
                    stroke={neonColor} strokeWidth={(neonSize * 4) / vp.zoom} strokeOpacity={0.25} strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points={pointsStr(liveNeonStroke)} fill="none"
                    stroke={neonColor} strokeWidth={neonSize / vp.zoom} strokeOpacity={1} strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points={pointsStr(liveNeonStroke)} fill="none"
                    stroke="#ffffff" strokeWidth={(neonSize * 0.3) / vp.zoom} strokeOpacity={0.8} strokeLinecap="round" strokeLinejoin="round" />
                </g>
              )}

              {/* Persistent highlight strokes */}
              {strokes.map(s => (
                <polyline key={s.id} points={pointsStr(s.points)} fill="none" stroke={s.color}
                  strokeWidth={s.size / vp.zoom} strokeOpacity={s.opacity} strokeLinecap="round" strokeLinejoin="round" />
              ))}

              {/* Highlight live preview */}
              {liveStroke && (
                <polyline points={pointsStr(liveStroke)} fill="none" stroke={highlightColor}
                  strokeWidth={highlightSize / vp.zoom} strokeOpacity={highlightOpacity} strokeLinecap="round" strokeLinejoin="round" />
              )}

              {/* Laser pointer dot */}
              {isNeon && neonMode === 'pointer' && laserPos && (
                <g filter="url(#pres-neon-glow)">
                  <circle cx={laserPos.x} cy={laserPos.y} r={(neonSize * 4) / vp.zoom} fill={neonColor} opacity={0.3} />
                  <circle cx={laserPos.x} cy={laserPos.y} r={(neonSize * 1.8) / vp.zoom} fill={neonColor} opacity={1} />
                  <circle cx={laserPos.x} cy={laserPos.y} r={(neonSize * 0.6) / vp.zoom} fill="#ffffff" opacity={0.95} />
                </g>
              )}

              {/* Laser line — being drawn live */}
              {isNeon && neonMode === 'line' && laserLine && (
                <g filter="url(#pres-neon-glow)">
                  <line x1={laserLine.x1} y1={laserLine.y1} x2={laserLine.x2} y2={laserLine.y2}
                    stroke={neonColor} strokeWidth={(neonSize * 4) / vp.zoom} strokeOpacity={0.25} strokeLinecap="round" />
                  <line x1={laserLine.x1} y1={laserLine.y1} x2={laserLine.x2} y2={laserLine.y2}
                    stroke={neonColor} strokeWidth={neonSize / vp.zoom} strokeOpacity={1} strokeLinecap="round" />
                  <line x1={laserLine.x1} y1={laserLine.y1} x2={laserLine.x2} y2={laserLine.y2}
                    stroke="#ffffff" strokeWidth={(neonSize * 0.3) / vp.zoom} strokeOpacity={0.9} strokeLinecap="round" />
                  {/* endpoint dots */}
                  <circle cx={laserLine.x1} cy={laserLine.y1} r={(neonSize * 1.5) / vp.zoom} fill={neonColor} opacity={0.9} />
                  <circle cx={laserLine.x2} cy={laserLine.y2} r={(neonSize * 1.5) / vp.zoom} fill={neonColor} opacity={0.9} />
                </g>
              )}

              {/* Fading strokes after release — CSS animation dissolve */}
              {fadingLines.map(l => {
                const c = l.color ?? neonColor;
                const sz = l.size ?? neonSize;
                return l.points ? (
                  <g key={l.id} className="neon-fading" filter="url(#pres-neon-glow)">
                    <polyline points={pointsStr(l.points)} fill="none"
                      stroke={c} strokeWidth={(sz * 4) / vp.zoom} strokeOpacity={0.25} strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points={pointsStr(l.points)} fill="none"
                      stroke={c} strokeWidth={sz / vp.zoom} strokeOpacity={1} strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points={pointsStr(l.points)} fill="none"
                      stroke="#ffffff" strokeWidth={(sz * 0.3) / vp.zoom} strokeOpacity={0.9} strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                ) : (
                  <g key={l.id} className="neon-fading" filter="url(#pres-neon-glow)">
                    <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                      stroke={c} strokeWidth={(sz * 4) / vp.zoom} strokeOpacity={0.25} strokeLinecap="round" />
                    <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                      stroke={c} strokeWidth={sz / vp.zoom} strokeOpacity={1} strokeLinecap="round" />
                    <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                      stroke="#ffffff" strokeWidth={(sz * 0.3) / vp.zoom} strokeOpacity={0.9} strokeLinecap="round" />
                  </g>
                );
              })}

            </g>
          </svg>

          {/* Annotations rendered in flow space */}
          <div style={{
            position: 'absolute', inset: 0,
            transform: `translate(${vp.x}px, ${vp.y}px) scale(${vp.zoom})`,
            transformOrigin: 'top left',
            pointerEvents: 'none',
          }}>
            {annotations.map(a => (
              <div key={a.id} data-annotation="true">
                <Annotation
                  {...a}
                  selected={selectedIds.has(a.id)}
                  vp={vp}
                  overlayRect={overlayRef.current?.getBoundingClientRect() ?? { x: 0, y: 0 }}
                  onRemove={removeAnnotation}
                  onMoveFlow={moveAnnotationFlow}
                  onTextChange={changeAnnotationText}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Highlight freehand capture */}
        <HighlightCapture
          active={isHighlighting}
          color={highlightColor}
          size={highlightSize}
          opacity={highlightOpacity}
          vp={vp}
          overlayRect={overlayRef.current?.getBoundingClientRect() ?? { x: 0, y: 0 }}
          onStrokeAdd={handleStroke}
        />

        {/* Neon laser capture */}
        <NeonCapture
          active={isNeon && neonMode !== 'pen'}
          mode={neonMode}
          vp={vp}
          overlayRect={overlayRef.current?.getBoundingClientRect() ?? { x: 0, y: 0 }}
          onPointerMove={handleNeonPointerMove}
          onPointerLeave={handleNeonPointerLeave}
          onLineStart={handleNeonLineStart}
          onLineDraw={handleNeonLineDraw}
        />
        <NeonPenCapture
          active={isNeon && neonMode === 'pen'}
          vp={vp}
          overlayRect={overlayRef.current?.getBoundingClientRect() ?? { x: 0, y: 0 }}
          onStrokeUpdate={handleNeonPenUpdate}
          onStrokeCommit={handleNeonPenCommit}
        />

        {/* Rubber-band selection overlay */}
        {isSelecting && <PointerOverlay onSelect={handleSelection} onDeselect={handleDeselect} />}
      </div>
    </div>
  );
}
