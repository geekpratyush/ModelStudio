import { useState, useRef, useCallback, useEffect } from 'react';
import { useViewport } from '@xyflow/react';
import { X } from 'lucide-react';

const NEON_COLORS = ['#00ffff', '#ff00ff', '#00ff88', '#ff6600', '#ff0055', '#aaff00', '#bf00ff', '#00bfff'];

// ── Shared helper ────────────────────────────────────────────────────────────
const toFlow = (e, containerRef, vp) => {
  const r = containerRef.current?.getBoundingClientRect() ?? { x: 0, y: 0 };
  return { x: (e.clientX - r.x - vp.x) / vp.zoom, y: (e.clientY - r.y - vp.y) / vp.zoom };
};

const pts = (points) => points.map(p => `${p.x},${p.y}`).join(' ');

// ── Laser capture (pointer dot + straight line) ───────────────────────────────
function LaserCapture({ active, mode, vp, containerRef, onMove, onLeave, onLineStart, onLineDraw }) {
  const start = useRef(null);

  const onMouseMove = (e) => { if (active) onMove(toFlow(e, containerRef, vp)); };
  const onMouseDown = (e) => {
    if (!active || mode !== 'line') return;
    e.preventDefault();
    const p = toFlow(e, containerRef, vp);
    start.current = p;
    onLineStart(p);
  };
  const onMouseUp = (e) => {
    if (!active || mode !== 'line' || !start.current) return;
    onLineDraw(start.current, toFlow(e, containerRef, vp));
    start.current = null;
  };
  const onMouseLeave = () => { onLeave(); start.current = null; };

  return (
    <div onMouseMove={onMouseMove} onMouseDown={onMouseDown} onMouseUp={onMouseUp} onMouseLeave={onMouseLeave}
      style={{ position: 'absolute', inset: 0, pointerEvents: active ? 'all' : 'none', cursor: active ? 'none' : 'default', zIndex: 50 }} />
  );
}

// ── Neon pen capture (freehand, vanishes on release) ─────────────────────────
function PenCapture({ active, vp, containerRef, onStrokeUpdate, onStrokeCommit, onCursorMove, onCursorLeave }) {
  const drawing = useRef(false);
  const points = useRef([]);

  const onMouseMove = (e) => {
    if (!active) return;
    const p = toFlow(e, containerRef, vp);
    onCursorMove(p);
    if (!drawing.current) return;
    points.current = [...points.current, p];
    if (points.current.length > 1) onStrokeUpdate(points.current);
  };
  const onMouseDown = (e) => {
    if (!active) return;
    e.preventDefault();
    drawing.current = true;
    points.current = [toFlow(e, containerRef, vp)];
  };
  const onMouseUp = () => {
    if (!drawing.current) return;
    drawing.current = false;
    if (points.current.length > 1) onStrokeCommit(points.current);
    points.current = [];
  };
  const onMouseLeave = () => {
    onCursorLeave();
    if (drawing.current && points.current.length > 1) onStrokeCommit(points.current);
    drawing.current = false;
    points.current = [];
  };

  return (
    <div onMouseMove={onMouseMove} onMouseDown={onMouseDown} onMouseUp={onMouseUp} onMouseLeave={onMouseLeave}
      style={{ position: 'absolute', inset: 0, pointerEvents: active ? 'all' : 'none', cursor: 'none', zIndex: 50 }} />
  );
}

// ── SVG rendering layer ───────────────────────────────────────────────────────
function OverlaySVG({ vp, tool, neonColor, neonSize, neonMode, laserPos, laserLine, fadingStrokes, liveStroke, penCursorPos }) {
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none', zIndex: 49 }}>
      <defs>
        <filter id="nlg-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2"  result="b1" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="6"  result="b2" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="b3" />
          <feMerge><feMergeNode in="b3" /><feMergeNode in="b2" /><feMergeNode in="b1" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <style>{`
          @keyframes nlg-fade {
            0%   { opacity: 1; }
            50%  { opacity: 0.55; }
            100% { opacity: 0; }
          }
          .nlg-fading { animation: nlg-fade 0.9s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
        `}</style>
      </defs>

      <g transform={`translate(${vp.x}, ${vp.y}) scale(${vp.zoom})`}>

        {/* Live neon pen stroke while drawing */}
        {tool === 'pen' && liveStroke && liveStroke.length > 1 && (
          <g filter="url(#nlg-glow)">
            <polyline points={pts(liveStroke)} fill="none"
              stroke={neonColor} strokeWidth={(neonSize * 4) / vp.zoom} strokeOpacity={0.25} strokeLinecap="round" strokeLinejoin="round" />
            <polyline points={pts(liveStroke)} fill="none"
              stroke={neonColor} strokeWidth={neonSize / vp.zoom} strokeOpacity={1} strokeLinecap="round" strokeLinejoin="round" />
            <polyline points={pts(liveStroke)} fill="none"
              stroke="#ffffff" strokeWidth={(neonSize * 0.3) / vp.zoom} strokeOpacity={0.8} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}

        {/* Pen cursor dot */}
        {tool === 'pen' && penCursorPos && (
          <g>
            <circle cx={penCursorPos.x} cy={penCursorPos.y} r={(neonSize * 2.5) / vp.zoom} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={1 / vp.zoom} />
            <circle cx={penCursorPos.x} cy={penCursorPos.y} r={(neonSize * 1.2) / vp.zoom} fill={neonColor} opacity={0.9} />
          </g>
        )}

        {/* Laser pointer dot */}
        {tool === 'laser' && neonMode === 'pointer' && laserPos && (
          <g filter="url(#nlg-glow)">
            <circle cx={laserPos.x} cy={laserPos.y} r={(neonSize * 4) / vp.zoom} fill={neonColor} opacity={0.3} />
            <circle cx={laserPos.x} cy={laserPos.y} r={(neonSize * 1.8) / vp.zoom} fill={neonColor} opacity={1} />
            <circle cx={laserPos.x} cy={laserPos.y} r={(neonSize * 0.6) / vp.zoom} fill="#ffffff" opacity={0.95} />
          </g>
        )}

        {/* Laser live line */}
        {tool === 'laser' && neonMode === 'line' && laserLine && (
          <g filter="url(#nlg-glow)">
            <line x1={laserLine.x1} y1={laserLine.y1} x2={laserLine.x2} y2={laserLine.y2}
              stroke={neonColor} strokeWidth={(neonSize * 4) / vp.zoom} strokeOpacity={0.25} strokeLinecap="round" />
            <line x1={laserLine.x1} y1={laserLine.y1} x2={laserLine.x2} y2={laserLine.y2}
              stroke={neonColor} strokeWidth={neonSize / vp.zoom} strokeOpacity={1} strokeLinecap="round" />
            <line x1={laserLine.x1} y1={laserLine.y1} x2={laserLine.x2} y2={laserLine.y2}
              stroke="#ffffff" strokeWidth={(neonSize * 0.3) / vp.zoom} strokeOpacity={0.9} strokeLinecap="round" />
            <circle cx={laserLine.x1} cy={laserLine.y1} r={(neonSize * 1.5) / vp.zoom} fill={neonColor} opacity={0.9} />
            <circle cx={laserLine.x2} cy={laserLine.y2} r={(neonSize * 1.5) / vp.zoom} fill={neonColor} opacity={0.9} />
          </g>
        )}

        {/* Fading strokes (straight lines + pen polylines) — dissolve animation */}
        {fadingStrokes.map(s => s.points ? (
          <g key={s.id} className="nlg-fading" filter="url(#nlg-glow)">
            <polyline points={pts(s.points)} fill="none"
              stroke={s.color} strokeWidth={(s.size * 4) / vp.zoom} strokeOpacity={0.25} strokeLinecap="round" strokeLinejoin="round" />
            <polyline points={pts(s.points)} fill="none"
              stroke={s.color} strokeWidth={s.size / vp.zoom} strokeOpacity={1} strokeLinecap="round" strokeLinejoin="round" />
            <polyline points={pts(s.points)} fill="none"
              stroke="#ffffff" strokeWidth={(s.size * 0.3) / vp.zoom} strokeOpacity={0.9} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ) : (
          <g key={s.id} className="nlg-fading" filter="url(#nlg-glow)">
            <line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
              stroke={s.color} strokeWidth={(s.size * 4) / vp.zoom} strokeOpacity={0.25} strokeLinecap="round" />
            <line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
              stroke={s.color} strokeWidth={s.size / vp.zoom} strokeOpacity={1} strokeLinecap="round" />
            <line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
              stroke="#ffffff" strokeWidth={(s.size * 0.3) / vp.zoom} strokeOpacity={0.9} strokeLinecap="round" />
          </g>
        ))}

      </g>
    </svg>
  );
}

// ── Floating toolbar pill ─────────────────────────────────────────────────────
function Toolbar({ tool, setTool, neonColor, setNeonColor, neonSize, setNeonSize, neonMode, setNeonMode, onClose }) {
  const [showColors, setShowColors] = useState(false);
  const isLaser = tool === 'laser';

  return (
    <div style={{
      position: 'absolute', bottom: 54, left: '50%', transform: 'translateX(-50%)',
      display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px',
      background: 'rgba(10,10,15,0.88)', borderRadius: 999,
      border: `1px solid ${neonColor}44`,
      boxShadow: `0 0 18px ${neonColor}33`,
      backdropFilter: 'blur(12px)', zIndex: 55, whiteSpace: 'nowrap',
    }}>

      {/* Tool toggle: Laser / Pen */}
      {[
        { id: 'laser', label: '✦ Laser' },
        { id: 'pen',   label: '✏ Pen'  },
      ].map(t => (
        <button key={t.id} onClick={() => setTool(t.id)}
          style={{
            padding: '3px 10px', borderRadius: 999,
            border: `1px solid ${tool === t.id ? neonColor : 'rgba(255,255,255,0.15)'}`,
            background: tool === t.id ? `${neonColor}22` : 'transparent',
            color: tool === t.id ? neonColor : 'rgba(255,255,255,0.5)',
            cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700,
            boxShadow: tool === t.id ? `0 0 8px ${neonColor}55` : 'none',
          }}>
          {t.label}
        </button>
      ))}

      <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.12)' }} />

      {/* Laser sub-modes */}
      {isLaser && ['pointer', 'line'].map(m => (
        <button key={m} onClick={() => setNeonMode(m)}
          style={{
            padding: '2px 8px', borderRadius: 999,
            border: `1px solid ${neonMode === m ? neonColor : 'rgba(255,255,255,0.12)'}`,
            background: neonMode === m ? `${neonColor}22` : 'transparent',
            color: neonMode === m ? neonColor : 'rgba(255,255,255,0.4)',
            cursor: 'pointer', fontSize: '0.68rem', fontWeight: 700,
            boxShadow: neonMode === m ? `0 0 6px ${neonColor}55` : 'none',
          }}>
          {m === 'pointer' ? '· Dot' : '— Line'}
        </button>
      ))}

      {/* Color swatch */}
      <div style={{ position: 'relative' }}>
        <button onClick={() => setShowColors(p => !p)}
          style={{
            width: 20, height: 20, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: neonColor,
            boxShadow: `0 0 8px ${neonColor}`,
            outline: showColors ? '2px solid #fff' : 'none', outlineOffset: 2,
          }} />
        {showColors && (
          <div style={{
            position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(5,5,10,0.95)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 12, padding: 8, display: 'flex', gap: 5, flexWrap: 'wrap',
            maxWidth: 180, zIndex: 60, boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
          }}>
            {NEON_COLORS.map(c => (
              <button key={c} onClick={() => { setNeonColor(c); setShowColors(false); }}
                style={{
                  width: 20, height: 20, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
                  boxShadow: `0 0 6px ${c}`,
                  outline: c === neonColor ? '2px solid #fff' : 'none', outlineOffset: 2,
                }} />
            ))}
          </div>
        )}
      </div>

      {/* Size */}
      <label style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.67rem', color: 'rgba(255,255,255,0.55)' }}>
        <input type="range" min={1} max={16} value={neonSize}
          onChange={e => setNeonSize(+e.target.value)}
          style={{ width: 52, accentColor: neonColor }} />
        <span style={{ minWidth: 20, color: neonColor }}>{neonSize}px</span>
      </label>

      <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.12)' }} />

      <button onClick={onClose}
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex', padding: 2 }}>
        <X size={13} />
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function NeonLaser({ containerRef, active: externalActive, onActiveChange }) {
  const vp = useViewport();
  const [internalActive, setInternalActive] = useState(false);
  const active = externalActive !== undefined ? externalActive : internalActive;
  const setActive = onActiveChange ?? setInternalActive;
  const [tool, setTool]     = useState('laser'); // 'laser' | 'pen'

  const [neonColor, setNeonColor] = useState(NEON_COLORS[0]);
  const [neonSize,  setNeonSize]  = useState(1);
  const [neonMode,  setNeonMode]  = useState('pointer');
  const [laserPos,  setLaserPos]  = useState(null);
  const [laserLine, setLaserLine] = useState(null);
  const [fadingStrokes, setFadingStrokes] = useState([]);
  const [liveStroke, setLiveStroke]       = useState(null);
  const [penCursorPos, setPenCursorPos]   = useState(null);

  const idRef = useRef(0);

  // Laser handlers
  const onLaserMove  = useCallback((p) => { setLaserPos(p); setLaserLine(prev => prev ? { ...prev, x2: p.x, y2: p.y } : null); }, []);
  const onLaserLeave = useCallback(() => { setLaserPos(null); setLaserLine(null); }, []);
  const onLineStart  = useCallback((s) => setLaserLine({ x1: s.x, y1: s.y, x2: s.x, y2: s.y }), []);
  const onLineDraw   = useCallback((s, e) => {
    const id = ++idRef.current;
    setFadingStrokes(prev => [...prev, { id, color: neonColor, size: neonSize, x1: s.x, y1: s.y, x2: e.x, y2: e.y }]);
    setLaserLine(null);
    setTimeout(() => setFadingStrokes(prev => prev.filter(l => l.id !== id)), 950);
  }, [neonColor, neonSize]);

  // Pen handlers — commit pushes into fadingStrokes, vanishes like laser
  const onStrokeUpdate = useCallback((points) => setLiveStroke(points), []);
  const onStrokeCommit = useCallback((points) => {
    setLiveStroke(null);
    const id = ++idRef.current;
    setFadingStrokes(prev => [...prev, { id, color: neonColor, size: neonSize, points }]);
    setTimeout(() => setFadingStrokes(prev => prev.filter(s => s.id !== id)), 950);
  }, [neonColor, neonSize]);
  const onCursorMove  = useCallback((p) => setPenCursorPos(p), []);
  const onCursorLeave = useCallback(() => { setPenCursorPos(null); setLiveStroke(null); }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (!active) return;
      if (e.key === 'Escape') setActive(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);

  return (
    <>
      {active && (
        <>
          <Toolbar
            tool={tool} setTool={setTool}
            neonColor={neonColor} setNeonColor={setNeonColor}
            neonSize={neonSize}   setNeonSize={setNeonSize}
            neonMode={neonMode}   setNeonMode={setNeonMode}
            onClose={() => setActive(false)}
          />

          <OverlaySVG
            vp={vp} tool={tool}
            neonColor={neonColor} neonSize={neonSize} neonMode={neonMode}
            laserPos={laserPos} laserLine={laserLine} fadingStrokes={fadingStrokes}
            liveStroke={liveStroke} penCursorPos={penCursorPos}
          />

          {tool === 'laser' && (
            <LaserCapture active vp={vp} mode={neonMode} containerRef={containerRef}
              onMove={onLaserMove} onLeave={onLaserLeave}
              onLineStart={onLineStart} onLineDraw={onLineDraw} />
          )}
          {tool === 'pen' && (
            <PenCapture active vp={vp} containerRef={containerRef}
              onStrokeUpdate={onStrokeUpdate} onStrokeCommit={onStrokeCommit}
              onCursorMove={onCursorMove} onCursorLeave={onCursorLeave} />
          )}
        </>
      )}
    </>
  );
}
