import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

let mermaidModule = null;
let mermaidTheme = null;
const getMermaid = (theme) => {
  const wantTheme = theme === 'dark' ? 'dark' : 'default';
  const noMaxWidth = { useMaxWidth: false };
  const config = {
    startOnLoad: false,
    securityLevel: 'loose',
    fontFamily: "'Inter', system-ui, sans-serif",
    theme: wantTheme,
    // Disable max-width for every diagram type so all output explicit pixel dimensions
    flowchart:    { htmlLabels: true, useMaxWidth: false },
    sequence:     noMaxWidth,
    gantt:        noMaxWidth,
    pie:          noMaxWidth,
    er:           noMaxWidth,
    classDiagram: noMaxWidth,
    stateDiagram: noMaxWidth,
    journey:      noMaxWidth,
    gitGraph:     noMaxWidth,
    sankey:       noMaxWidth,
    xychart:      noMaxWidth,
    block:        noMaxWidth,
    quadrantChart: noMaxWidth,
    timeline:     noMaxWidth,
    mindmap:      noMaxWidth,
    kanban:       noMaxWidth,
  };
  if (!mermaidModule) {
    mermaidModule = import('mermaid').then((m) => {
      const mmd = m.default || m;
      mmd.initialize(config);
      mermaidTheme = wantTheme;
      return mmd;
    });
  } else if (mermaidTheme !== wantTheme) {
    mermaidModule = mermaidModule.then((mmd) => {
      mmd.initialize(config);
      mermaidTheme = wantTheme;
      return mmd;
    });
  }
  return mermaidModule;
};

let renderSeq = 0;

// Strip max-width from the root <svg> style attribute and return both the
// cleaned SVG text AND the extracted pixel width (if any). We capture it
// before stripping because for some diagram types it is the only width source.
const stripRootMaxWidth = (svgText) => {
  let extractedWidth = null;
  const text = svgText.replace(/(<svg\b[^>]*?\bstyle=["'])([^"']*)["']/i, (_, prefix, inner) => {
    const cleaned = inner.split(';').filter(s => {
      const t = s.trim().toLowerCase();
      if (t.startsWith('max-width')) {
        const v = parseFloat(t.split(':')[1]);
        if (v > 0) extractedWidth = v;
        return false;
      }
      return true;
    }).join(';');
    return `${prefix}${cleaned}"`;
  });
  return { text, extractedWidth };
};

// Read the natural content size of an SVG element from the live DOM.
// hintWidth is the max-width extracted from the style attribute (pre-strip).
const readSvgSize = (svgEl, hintWidth = null) => {
  if (!svgEl) return null;

  // 1. viewBox — coordinate space, unaffected by CSS — works for flowchart, gantt, ER, etc.
  const vb = svgEl.viewBox?.baseVal;
  if (vb && vb.width > 0 && vb.height > 0) return { w: vb.width, h: vb.height };

  // 2. Explicit SVGAnimatedLength — works when Mermaid sets explicit pixel width/height
  const aw = svgEl.width?.baseVal?.value;
  const ah = svgEl.height?.baseVal?.value;
  if (aw > 0 && ah > 0) return { w: aw, h: ah };

  // 3. height attribute + max-width hint — works for sequence / pie / class / state
  //    when width is absent but height is explicit and max-width was in the style
  const heightAttr = parseFloat(svgEl.getAttribute('height'));
  if (hintWidth > 0 && heightAttr > 0) return { w: hintWidth, h: heightAttr };

  // 4. height only + hint width via SVGAnimatedLength height
  if (hintWidth > 0 && ah > 0) return { w: hintWidth, h: ah };

  // 5. getBBox — content bounding box in SVG coordinate space (last resort)
  try {
    const bb = svgEl.getBBox();
    if (bb.width > 0 && bb.height > 0) return { w: bb.x + bb.width, h: bb.y + bb.height };
  } catch {}

  return null;
};

const MermaidPreview = forwardRef(function MermaidPreview(
  { code, theme = 'dark', onStatus, onDimensions, onZoomChange, containerWidth = 0, containerHeight = 0 },
  ref
) {
  const wrapRef = useRef(null);
  const svgRef  = useRef(null);
  const [svg, setSvg]         = useState('');
  const [error, setError]     = useState(null);
  const lastGoodRef           = useRef('');
  const extractedWidthRef     = useRef(null); // max-width captured before stripping
  const [pz, setPz]           = useState({ x: 0, y: 0, scale: 1 });
  const pzRef                 = useRef(pz);

  const onStatusRef     = useRef(onStatus);
  const onDimensionsRef = useRef(onDimensions);
  const onZoomChangeRef = useRef(onZoomChange);
  useEffect(() => { onStatusRef.current = onStatus; },      [onStatus]);
  useEffect(() => { onDimensionsRef.current = onDimensions; }, [onDimensions]);
  useEffect(() => { onZoomChangeRef.current = onZoomChange; }, [onZoomChange]);

  useEffect(() => { pzRef.current = pz; onZoomChangeRef.current?.(pz.scale); }, [pz]);

  const containerRef = useRef({ w: containerWidth, h: containerHeight });
  useEffect(() => { containerRef.current = { w: containerWidth, h: containerHeight }; }, [containerWidth, containerHeight]);

  // Fit the SVG to fill the preview area. Reads all dimensions from the live DOM.
  const fitToView = useCallback(() => {
    // Container dimensions
    let W = 0, H = 0;
    if (wrapRef.current) {
      const r = wrapRef.current.getBoundingClientRect();
      W = r.width; H = r.height;
    }
    if (!(W > 10 && H > 10)) { W = containerRef.current.w; H = containerRef.current.h; }
    if (!(W > 10 && H > 10)) { W = window.innerWidth * 0.55; H = window.innerHeight - 130; }
    if (!(W > 10 && H > 10)) return;

    // SVG natural size from live DOM — pass the pre-strip max-width as a hint
    const svgEl = svgRef.current?.querySelector('svg');
    const size  = readSvgSize(svgEl, extractedWidthRef.current);
    if (!size) return;

    const pad   = 40;
    const scale = Math.min((W - pad * 2) / size.w, (H - pad * 2) / size.h, 3);
    const x     = (W - size.w * scale) / 2;
    const y     = (H - size.h * scale) / 2;
    setPz({ x, y, scale });
    onDimensionsRef.current?.(size.w, size.h);
  }, []);

  useImperativeHandle(ref, () => ({
    startPan: () => ({ x: pzRef.current.x, y: pzRef.current.y }),
    applyPan: (x, y) => setPz(prev => ({ ...prev, x, y })),
    fitToView,
    zoomIn:  () => setPz(p => ({ ...p, scale: Math.min(10, p.scale * 1.2) })),
    zoomOut: () => setPz(p => ({ ...p, scale: Math.max(0.05, p.scale / 1.2) })),
  }), [fitToView]);

  // Render whenever code / theme changes
  useEffect(() => {
    let cancelled = false;
    const trimmed = (code || '').trim();
    if (!trimmed) {
      setSvg('');
      extractedWidthRef.current = null;
      setError(null);
      onStatusRef.current?.({ ok: true, message: '' });
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const mmd = await getMermaid(theme);
        const id  = `ms-mmd-${++renderSeq}`;
        const { svg: out } = await mmd.render(id, trimmed);
        if (cancelled) return;
        const { text: clean, extractedWidth } = stripRootMaxWidth(out);
        extractedWidthRef.current = extractedWidth;
        setSvg(clean);
        lastGoodRef.current = clean;
        setError(null);
        onStatusRef.current?.({ ok: true, message: 'Rendered' });
      } catch (e) {
        if (cancelled) return;
        const msg = (e?.str || e?.message || 'Render error').split('\n').find(l => l.trim()) || 'Render error';
        setError(msg);
        onStatusRef.current?.({ ok: false, message: msg });
      }
    }, 350);
    return () => { cancelled = true; clearTimeout(handle); };
  }, [code, theme]);

  // After each new SVG is painted, auto-fit. Uses double-RAF to guarantee the
  // browser has laid out the SVG before we read its dimensions.
  const svgVersionRef = useRef(0);
  useEffect(() => {
    if (!svg) return;
    const ver = ++svgVersionRef.current;
    let done  = false;

    const tryFit = () => {
      if (ver !== svgVersionRef.current || done) return;
      const r = wrapRef.current?.getBoundingClientRect();
      if (!r || r.width < 10 || r.height < 10) return;
      const svgEl = svgRef.current?.querySelector('svg');
      if (!readSvgSize(svgEl, extractedWidthRef.current)) return;
      fitToView();
      done = true;
    };

    let raf2, t1, t2, t3;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        tryFit();
        if (!done) t1 = setTimeout(() => { tryFit();
          if (!done) t2 = setTimeout(() => { tryFit();
            if (!done) t3 = setTimeout(tryFit, 500);
          }, 200);
        }, 80);
      });
    });

    const ro = new ResizeObserver(() => { if (!done) tryFit(); });
    if (wrapRef.current) ro.observe(wrapRef.current);

    return () => {
      cancelAnimationFrame(raf1); cancelAnimationFrame(raf2);
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      ro.disconnect();
    };
  }, [svg, fitToView]);

  // Wheel zoom — document-level because the overlay has pointer-events:none
  useEffect(() => {
    const onWheel = (e) => {
      if (!wrapRef.current) return;
      const rect = wrapRef.current.getBoundingClientRect();
      if (e.clientX < rect.left || e.clientX > rect.right ||
          e.clientY < rect.top  || e.clientY > rect.bottom) return;
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      setPz(prev => {
        const s = Math.max(0.05, Math.min(10, prev.scale * factor));
        return { scale: s, x: mx - (mx - prev.x) * (s / prev.scale), y: my - (my - prev.y) * (s / prev.scale) };
      });
    };
    document.addEventListener('wheel', onWheel, { passive: false });
    return () => document.removeEventListener('wheel', onWheel);
  }, []);

  // External fit trigger (toolbar button or workspace switch)
  useEffect(() => {
    const handler = () => {
      const attempt = (n = 0) => {
        const r = wrapRef.current?.getBoundingClientRect();
        if (r && r.width > 10 && r.height > 10) { fitToView(); return; }
        if (n < 8) setTimeout(() => attempt(n + 1), n < 3 ? 60 : 150);
      };
      attempt();
    };
    window.addEventListener('cad-fit-preview', handler);
    return () => window.removeEventListener('cad-fit-preview', handler);
  }, [fitToView]);

  const shown = svg || lastGoodRef.current;
  const { x, y, scale } = pz;

  const glowTheme = (() => {
    const pc = (code || '').match(/%%\{init[^%]*primaryColor['"]:\s*['"]([^'"]+)['"]/s)?.[1]?.toLowerCase();
    return pc === '#0d001a' ? 'cyberpunk' : pc === '#001a0d' ? 'neon' : null;
  })();

  return (
    <div className={`mmd-preview${glowTheme ? ` mermaid-${glowTheme}` : ''}`}>
      <div className="mmd-scroll" ref={wrapRef}>
        {shown ? (
          <div
            ref={svgRef}
            className="mmd-svg"
            style={{ transform: `translate(${x}px,${y}px) scale(${scale})`, transformOrigin: '0 0' }}
            dangerouslySetInnerHTML={{ __html: shown }}
          />
        ) : (
          <div className="mmd-empty" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}>
            Start typing to see your diagram…
          </div>
        )}
      </div>
      {error && (
        <div className="mmd-error" style={{ pointerEvents: 'auto' }}>
          <strong>Syntax error</strong><span>{error}</span>
        </div>
      )}
    </div>
  );
});

export default MermaidPreview;
