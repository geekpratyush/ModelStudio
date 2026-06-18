import { useCallback, useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

/*
 * Live SVG preview for non-flowchart Mermaid diagrams (sequence, class, state,
 * ER, gantt, pie, C4, mindmap, timeline, etc.). Uses the official Mermaid
 * library (MIT licensed), loaded lazily so it stays out of the main bundle.
 *
 * Flowcharts are NOT rendered here — they use the interactive React Flow canvas.
 */

let mermaidPromise = null;
let mermaidInitialized = false;

const loadAndInitializeMermaid = async (theme) => {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then((m) => m.default || m);
  }
  const mermaid = await mermaidPromise;
  if (!mermaidInitialized) {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
      fontFamily: "'Inter', system-ui, sans-serif",
      flowchart: { htmlLabels: true },
      // Initialization is global, so we set defaults here.
      // Theme specific variables are updated in render if possible or handled via theme property.
    });
    mermaidInitialized = true;
  }
  return mermaid;
};

let renderSeq = 0;

const getRenderedSvgDimensions = (svgText) => {
  const viewBox = svgText.match(/\sviewBox=["']([^"']+)["']/i)?.[1]?.trim().split(/\s+/).map(Number);
  if (viewBox?.length === 4 && viewBox[2] && viewBox[3]) {
    return { width: viewBox[2], height: viewBox[3] };
  }

  const width = parseFloat(svgText.match(/\swidth=["']([^"']+)["']/i)?.[1]);
  const height = parseFloat(svgText.match(/\sheight=["']([^"']+)["']/i)?.[1]);
  if (width && height) return { width, height };
  return null;
};

const normalizeRenderedSvg = (svgText, width, height) => {
  if (!width || !height) return svgText;
  return svgText
    .replace(/\swidth=["'][^"']*["']/i, ` width="${width}"`)
    .replace(/\sheight=["'][^"']*["']/i, ` height="${height}"`)
    .replace(/<svg\b(?![^>]*\sheight=)/i, `<svg height="${height}"`)
    .replace(/<svg\b(?![^>]*\swidth=)/i, `<svg width="${width}"`)
    .replace(/\sstyle=["'][^"']*["']/i, ` style="width:${width}px;height:${height}px;max-width:none;"`);
};

export default function MermaidPreview({ code, theme = 'dark', onStatus, viewport, reactFlowInstance, onDimensions }) {
  const hostRef = useRef(null);
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(null);
  const [svgSize, setSvgSize] = useState(null);
  const lastGoodRef = useRef('');
  const svgDimensionsRef = useRef({ width: 0, height: 0 });
  const statusRef = useRef(onStatus);
  const dimensionsRef = useRef(onDimensions);
  const viewportRef = useRef(viewport);

  useEffect(() => {
    statusRef.current = onStatus;
  }, [onStatus]);

  useEffect(() => {
    dimensionsRef.current = onDimensions;
  }, [onDimensions]);

  useEffect(() => {
    viewportRef.current = viewport;
  }, [viewport]);

  const getSvgDimensions = useCallback(() => {
    const svgEl = hostRef.current?.querySelector('svg');
    if (!svgEl) return null;

    const viewBox = svgEl.viewBox?.baseVal;
    if (viewBox?.width && viewBox?.height) {
      return { width: viewBox.width, height: viewBox.height };
    }

    const widthAttr = parseFloat(svgEl.getAttribute('width'));
    const heightAttr = parseFloat(svgEl.getAttribute('height'));
    if (widthAttr && heightAttr) return { width: widthAttr, height: heightAttr };

    try {
      const box = svgEl.getBBox();
      if (box.width && box.height) return { width: box.width, height: box.height };
    } catch {
      // getBBox can fail for detached or hidden SVGs; fall back below.
    }

    const rect = svgEl.getBoundingClientRect();
    return { width: rect.width || 800, height: rect.height || 600 };
  }, []);

  const fitSvgToView = useCallback((duration = 400) => {
    if (!hostRef.current || !reactFlowInstance) return;
    const dims = getSvgDimensions();
    if (!dims?.width || !dims?.height) return;

    const bounds = hostRef.current.getBoundingClientRect();
    const availableWidth = Math.max(1, bounds.width - 96);
    const availableHeight = Math.max(1, bounds.height - 120);
    const nextZoom = Math.max(0.08, Math.min(2.5, Math.min(
      availableWidth / dims.width,
      availableHeight / dims.height
    )));
    const x = Math.round((bounds.width - dims.width * nextZoom) / 2);
    const y = Math.round((bounds.height - dims.height * nextZoom) / 2);
    const current = viewportRef.current || {};
    if (
      Math.abs((current.x ?? 0) - x) < 1 &&
      Math.abs((current.y ?? 0) - y) < 1 &&
      Math.abs((current.zoom ?? 1) - nextZoom) < 0.001
    ) {
      return;
    }

    reactFlowInstance.setViewport({ x, y, zoom: nextZoom }, { duration });
  }, [getSvgDimensions, reactFlowInstance]);

  useEffect(() => {
    let cancelled = false;
    const trimmed = (code || '').trim();
    if (!trimmed) { setSvg(''); setSvgSize(null); setError(null); statusRef.current?.({ ok: true, message: '' }); return; }

    const handle = setTimeout(async () => {
      try {
        const mermaid = await loadAndInitializeMermaid(theme);
        
        // Re-initialize for theme changes if needed (mermaid.initialize is global)
        mermaid.initialize({
          theme: theme === 'dark' ? 'dark' : 'default',
          themeVariables: theme === 'dark' ? { background: 'transparent', primaryColor: '#1e293b' } : {},
        });

        const id = `ms-mmd-${++renderSeq}`;
        // mermaid.parse throws on invalid syntax with a helpful message
        await mermaid.parse(trimmed);
        const { svg: out } = await mermaid.render(id, trimmed);
        if (cancelled) return;
        const renderedDims = getRenderedSvgDimensions(out);
        const normalizedSvg = renderedDims ? normalizeRenderedSvg(out, renderedDims.width, renderedDims.height) : out;
        setSvgSize(renderedDims);
        setSvg(normalizedSvg);
        lastGoodRef.current = normalizedSvg;
        setError(null);
        statusRef.current?.({ ok: true, message: 'Rendered' });

        // Extract SVG dimensions to fit view nicely
        setTimeout(() => {
          if (hostRef.current && reactFlowInstance) {
            const svgEl = hostRef.current.querySelector('svg');
            if (svgEl) {
              const dims = getSvgDimensions() || { width: 800, height: 600 };
              const { width, height } = dims;
              svgDimensionsRef.current = { width, height };

              dimensionsRef.current?.(width, height);
              
              // Give React a tick to commit the SVG, then center-fit its real bounds.
              setTimeout(() => {
                fitSvgToView(400);
              }, 40);
            }
          }
        }, 80);

      } catch (e) {
        if (cancelled) return;
        const msg = (e && (e.str || e.message)) ? String(e.str || e.message).split('\n')[0] : 'Render error';
        setError(msg);
        statusRef.current?.({ ok: false, message: msg });
      }
    }, 300);

    return () => { cancelled = true; clearTimeout(handle); };
  }, [code, theme, reactFlowInstance, getSvgDimensions, fitSvgToView]);

  useEffect(() => {
    const handleFitRequest = () => fitSvgToView(400);
    window.addEventListener('dac-fit-preview', handleFitRequest);
    return () => window.removeEventListener('dac-fit-preview', handleFitRequest);
  }, [fitSvgToView]);

  const shown = svg || lastGoodRef.current;
  const currentZoom = viewport?.zoom || 1;
  const currentX = viewport?.x || 0;
  const currentY = viewport?.y || 0;

  const handleZoom = (factor) => {
    if (!reactFlowInstance || !hostRef.current) return;
    const nextZoom = Math.max(0.3, Math.min(3, +(currentZoom + factor).toFixed(2)));
    reactFlowInstance.zoomTo(nextZoom, { duration: 300 });
  };

  const resetViewport = () => {
    fitSvgToView(400);
  };

  return (
    <div className="mmd-preview">
      <div className="mmd-toolbar">
        <button className="btn btn-icon-only" title="Zoom out" onClick={() => handleZoom(-0.15)}><ZoomOut size={15} /></button>
        <span className="mmd-zoom">{Math.round(currentZoom * 100)}%</span>
        <button className="btn btn-icon-only" title="Zoom in" onClick={() => handleZoom(0.15)}><ZoomIn size={15} /></button>
        <button className="btn btn-icon-only" title="Reset zoom" onClick={resetViewport}><Maximize2 size={15} /></button>
      </div>
      <div className="mmd-scroll" ref={hostRef}>
        {shown ? (
          <div
            className="mmd-svg"
            style={{
              width: svgSize?.width ? `${svgSize.width}px` : undefined,
              height: svgSize?.height ? `${svgSize.height}px` : undefined,
              transform: `translate(${currentX}px, ${currentY}px) scale(${currentZoom})`
            }}
            dangerouslySetInnerHTML={{ __html: shown }}
          />
        ) : (
          <div className="mmd-empty">Start typing to see your diagram…</div>
        )}
      </div>
      {error && (
        <div className="mmd-error" style={{ pointerEvents: 'auto' }}>
          <strong>Syntax error</strong>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
