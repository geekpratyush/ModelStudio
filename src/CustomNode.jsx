import { useState, useEffect, useRef } from 'react';
import { Handle, Position, NodeToolbar, NodeResizer, useReactFlow } from '@xyflow/react';
import * as LucideIcons from 'lucide-react';

export default function CustomNode({ id, data, selected, ...props }) {
  const { setNodes, setEdges, getNodes } = useReactFlow();
  const [isEditing, setIsEditing] = useState(!!data.isNew);
  const canvasRef = useRef(null);
  
  // Use measured dimensions if available, otherwise style dimensions, finally defaults.
  // Ensure we don't fallback to 150/80 when the value is intentionally 0 (during drag start).
  const width = Math.max(1, data.width ?? props.width ?? (props.style?.width !== undefined ? parseInt(props.style.width, 10) : 150));
  const height = Math.max(1, data.height ?? props.height ?? (props.style?.height !== undefined ? parseInt(props.style.height, 10) : 80));

  const isRoughActive = data.isRough && window.rough;

  useEffect(() => {
    if (isRoughActive && canvasRef.current) {
      const canvas = canvasRef.current;
      const rc = window.rough.canvas(canvas);
      const ctx = canvas.getContext('2d');
      
      const w = width;
      const h = height;
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;
      
      ctx.clearRect(0, 0, w, h);
      
      const stroke = data.color || '#3b82f6';
      const isDrawing = data.shape === 'drawing';
      
      const options = {
        stroke,
        strokeWidth: data.strokeWidth || 2,
        roughness: isDrawing ? 0.8 : 1.5,
        bowing: isDrawing ? 0 : 1.5,
        fill: data.hideFill ? undefined : (data.fillColor || `${stroke}33`),
        fillStyle: data.fillStyle || 'hachure',
        fillWeight: 1.5,
        hachureGap: 4,
        strokeLineDash: data.strokeStyle === 'dashed' ? [8, 4] : (data.strokeStyle === 'dotted' ? [2, 2] : undefined),
        seed: id.split('-').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 1000
      };

      if (data.shape === 'rectangle' || !data.shape || data.shape === 'box' || data.shape === 'note') {
        rc.rectangle(2, 2, Math.max(1, w - 4), Math.max(1, h - 4), options);
      } else if (data.shape === 'circle' || data.shape === 'oval') {
        rc.ellipse(w / 2, h / 2, Math.max(1, w - 10), Math.max(1, h - 10), options);
      } else if (data.shape === 'diamond') {
        rc.polygon([
          [w / 2, 2],
          [w - 2, h / 2],
          [w / 2, h - 2],
          [2, h / 2]
        ], options);
      } else if (data.shape === 'triangle') {
        rc.polygon([
          [w / 2, 2],
          [w - 2, h - 2],
          [2, h - 2]
        ], options);
      } else if (data.shape === 'cloud') {
        rc.path(`M ${w*0.25} ${h*0.3} Q ${w*0.1} ${h*0.3} ${w*0.1} ${h*0.5} Q ${w*0.1} ${h*0.7} ${w*0.25} ${h*0.7} L ${w*0.75} ${h*0.7} Q ${w*0.9} ${h*0.7} ${w*0.9} ${h*0.5} Q ${w*0.9} ${h*0.3} ${w*0.75} ${h*0.3} Q ${w*0.75} ${h*0.1} ${w*0.5} ${h*0.1} Q ${w*0.25} ${h*0.1} ${w*0.25} ${h*0.3} Z`, options);
      } else if (data.shape === 'drawing' && data.points && data.points.length > 1) {
        rc.curve(data.points, options);
      }
    }
  }, [data.shape, data.isRough, data.color, data.fillColor, data.fillStyle, data.hideFill, data.strokeStyle, data.strokeWidth, data.points, width, height, id]);

  const IconComponent = LucideIcons[data.icon] || LucideIcons.Box;
  const geometricShapes = ['rectangle', 'circle', 'oval', 'diamond', 'triangle', 'cylinder', 'box', 'diamond-tactical', 'layers', 'server', 'database', 'settings', 'building', 'message', 'zap', 'workflow', 'filetext', 'boxselect', 'table', 'type', 'cloud', 'playcircle', 'plug', 'shuffle'];
  const isGeometric = geometricShapes.includes(data.shape?.toLowerCase()) || data.isEip;
  const color = data.color || '#3b82f6';
  
  const textAlign = data.textAlign || 'center';
  const verticalAlign = data.verticalAlign || 'middle';
  const flexAlign = textAlign === 'left' ? 'flex-start' : (textAlign === 'right' ? 'flex-end' : 'center');
  const flexJustify = verticalAlign === 'top' ? 'flex-start' : (verticalAlign === 'bottom' ? 'flex-end' : 'center');

  const onDelete = () => {
    const allNodes = getNodes();
    const idsSet = new Set([id]);
    const queue = [id];
    while (queue.length > 0) {
      const currentId = queue.shift();
      allNodes.forEach(node => {
        if (node.parentId === currentId && !idsSet.has(node.id)) {
          idsSet.add(node.id);
          queue.push(node.id);
        }
      });
    }

    setNodes((nodes) => nodes.filter((n) => !idsSet.has(n.id)));
    setEdges((edges) => edges.filter((e) => !idsSet.has(e.source) && !idsSet.has(e.target)));
  };

  const onColorChange = (newColor) => {
    setNodes((nodes) =>
      nodes.map((n) => {
        if (n.id === id) {
          return { ...n, data: { ...n.data, color: newColor } };
        }
        return n;
      })
    );
  };

  const onLabelChange = () => {
    const newLabel = window.prompt("Enter new label:", data.label);
    if (newLabel !== null) {
      setNodes((nodes) =>
        nodes.map((n) => {
          if (n.id === id) {
            return { ...n, data: { ...n.data, label: newLabel } };
          }
          return n;
        })
      );
    }
  };

  const presetColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#94a3b8'];

  const toolbar = (
    <NodeToolbar 
      isVisible={selected} 
      position={Position.Top} 
      className="node-toolbar"
    >
      <div className="toolbar-inner">
        <div className="color-presets">
          {presetColors.map((c) => (
            <button 
              key={c} 
              className="color-dot" 
              style={{ backgroundColor: c }} 
              onClick={() => onColorChange(c)}
            />
          ))}
        </div>
        <div className="toolbar-divider" />
        <button className="toolbar-btn" onClick={onLabelChange} title="Edit Label">
          <LucideIcons.Pencil size={14} />
        </button>
        <button className="toolbar-btn delete-btn" onClick={onDelete} title="Delete Node">
          <LucideIcons.Trash2 size={14} />
        </button>
      </div>
    </NodeToolbar>
  );

  const resizer = selected && (
    <NodeResizer 
      minWidth={40} 
      minHeight={40} 
      lineStyle={{ borderColor: color, borderWidth: 1 }}
      handleStyle={{ width: 8, height: 8, background: '#fff', border: `1.5px solid ${color}`, borderRadius: '2px' }}
    />
  );

  if (data.shape === 'dummy') {
    return (
      <div 
        style={{ 
          width: '100%', 
          height: '100%', 
          pointerEvents: 'auto', 
          border: selected ? '2px dashed var(--accent-blue, #3b82f6)' : '1px dashed transparent', 
          borderRadius: '8px',
          boxSizing: 'border-box'
        }} 
      />
    );
  }

  if (data.isContainer) {
    return (
      <>
        {resizer}
        {toolbar}
        <div 
          className={`custom-node container-node ${data.isRough ? 'rough-font' : ''}`}
          style={{ 
            width: '100%', 
            height: '100%', 
            borderColor: color, 
            backgroundColor: `${color}11`, 
            borderWidth: 2,
            borderStyle: 'dashed',
            display: 'flex',
            flexDirection: 'column',
            alignItems: flexAlign,
            justifyContent: flexJustify,
            padding: 12,
            position: 'relative'
          }}
        >
          <Handle type="target" position={Position.Top} />
          <Handle type="target" position={Position.Left} id="left" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color, marginBottom: 8, pointerEvents: 'none' }}>
            {data.icon && IconComponent && <IconComponent size={16} color={color} />}
            <span style={{ fontWeight: 'bold', fontSize: '0.8rem', textAlign: textAlign }}>{data.label}</span>
          </div>
          <Handle type="source" position={Position.Right} />
          <Handle type="source" position={Position.Bottom} id="bottom" />
        </div>
      </>
    );
  }

  const getSvgFill = () => {
    if (data.hideFill) return 'none';
    if (data.fillType === 'gradient') return `url(#grad-${id})`;
    return data.fillColor || `${color}11`;
  };

  const renderGradientDef = () => {
    if (data.fillType !== 'gradient') return null;
    const c1 = data.gradientColor1 || '#ffffff';
    const c2 = data.gradientColor2 || color;
    // Calculate simple x/y vectors for standard angles
    const angle = parseInt(data.gradientAngle) || 90;
    const rad = (angle - 90) * (Math.PI / 180);
    const x1 = Math.round(50 + Math.cos(rad) * 50) + "%";
    const y1 = Math.round(50 + Math.sin(rad) * 50) + "%";
    const x2 = Math.round(50 + Math.cos(rad + Math.PI) * 50) + "%";
    const y2 = Math.round(50 + Math.sin(rad + Math.PI) * 50) + "%";
    
    return (
      <defs>
        <linearGradient id={`grad-${id}`} x1={x1} y1={y1} x2={x2} y2={y2}>
          <stop offset="0%" stopColor={c1} />
          <stop offset="100%" stopColor={c2} />
        </linearGradient>
      </defs>
    );
  };

  if (isGeometric) {
    return (
      <>
        {resizer}
        {toolbar}
        <div 
          className={`custom-node shape-${data.shape || (data.isEip ? 'eip' : 'rectangle')} ${data.isRough ? 'rough-font' : ''}`}
          style={{ 
            width: '100%', 
            height: '100%', 
            borderColor: (data.hideBorder || isRoughActive || data.shape === 'diamond' || data.shape === 'triangle' || data.shape === 'cloud') ? 'transparent' : color, 
            background: (data.hideBorder || isRoughActive || data.shape === 'diamond' || data.shape === 'triangle' || data.shape === 'cloud') ? 'transparent' : (data.fillType === 'gradient' && !data.hideFill ? `linear-gradient(${data.gradientAngle || 90}deg, ${data.gradientColor1 || '#ffffff'}, ${data.gradientColor2 || color})` : undefined),
            boxShadow: (data.hideBorder || isRoughActive || data.shape === 'diamond' || data.shape === 'triangle' || data.shape === 'cloud') ? 'none' : undefined,
            '--accent-color': color,
            display: 'flex',
            flexDirection: 'column',
            alignItems: flexAlign,
            justifyContent: flexJustify,
            padding: (data.shape === 'diamond' || data.shape === 'triangle' || data.shape === 'cloud') ? 0 : 8,
            position: 'relative',
            overflow: 'visible'
          }}
        >
          <Handle type="target" position={Position.Left} id="left" />
          <Handle type="target" position={Position.Top} id="top" />
          
          {isRoughActive ? (
            <canvas 
              ref={canvasRef} 
              width={parseInt(width)} 
              height={parseInt(height)} 
              style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 0 }} 
            />
          ) : (
            <>
              {(data.shape === 'rectangle' || !data.shape || data.shape === 'box' || data.shape === 'note') && (
                 <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: `2px solid ${color}`, background: data.hideFill ? 'transparent' : (data.fillType === 'gradient' ? `linear-gradient(${data.gradientAngle || 90}deg, ${data.gradientColor1 || '#ffffff'}, ${data.gradientColor2 || color})` : (data.fillColor || `${color}11`)), borderRadius: data.shape === 'note' ? 0 : 4, zIndex: 0 }} />
              )}
              {data.shape === 'diamond' && (
                <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, zIndex: 0, overflow: 'visible' }}>
                  {renderGradientDef()}
                  <polygon 
                    points={`${width/2},2 ${width-2},${height/2} ${width/2},${height-2} 2,${height/2}`} 
                    fill={getSvgFill()} 
                    stroke={color} 
                    strokeWidth={data.strokeWidth || 2}
                    strokeDasharray={data.strokeStyle === 'dashed' ? '5,5' : (data.strokeStyle === 'dotted' ? '2,2' : 'none')}
                    style={{ opacity: data.opacity ? data.opacity / 100 : 1 }}
                  />
                </svg>
              )}

              {data.shape === 'triangle' && (
                <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, zIndex: 0, overflow: 'visible' }}>
                  {renderGradientDef()}
                  <polygon 
                    points={`${width/2},2 ${width-2},${height-2} 2,${height-2}`} 
                    fill={getSvgFill()} 
                    stroke={color} 
                    strokeWidth={data.strokeWidth || 2}
                    strokeDasharray={data.strokeStyle === 'dashed' ? '5,5' : (data.strokeStyle === 'dotted' ? '2,2' : 'none')}
                    style={{ opacity: data.opacity ? data.opacity / 100 : 1 }}
                  />
                </svg>
              )}

              {data.shape === 'cloud' && (
                <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, zIndex: 0, overflow: 'visible' }}>
                  {renderGradientDef()}
                  <path 
                    d={`M ${width*0.25} ${height*0.3} Q ${width*0.1} ${height*0.3} ${width*0.1} ${height*0.5} Q ${width*0.1} ${height*0.7} ${width*0.25} ${height*0.7} L ${width*0.75} ${height*0.7} Q ${width*0.9} ${height*0.7} ${width*0.9} ${height*0.5} Q ${width*0.9} ${height*0.3} ${width*0.75} ${height*0.3} Q ${width*0.75} ${height*0.1} ${width*0.5} ${height*0.1} Q ${width*0.25} ${height*0.1} ${width*0.25} ${height*0.3} Z`} 
                    fill={getSvgFill()} 
                    stroke={color} 
                    strokeWidth={data.strokeWidth || 2}
                    strokeDasharray={data.strokeStyle === 'dashed' ? '5,5' : (data.strokeStyle === 'dotted' ? '2,2' : 'none')}
                    style={{ opacity: data.opacity ? data.opacity / 100 : 1 }}
                  />
                </svg>
              )}

              {(data.shape === 'circle' || data.shape === 'oval') && (
                <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, zIndex: 0, overflow: 'visible' }}>
                  {renderGradientDef()}
                  <ellipse 
                    cx={width/2} cy={height/2} rx={width/2 - 5} ry={height/2 - 5}
                    fill={getSvgFill()} 
                    stroke={color} 
                    strokeWidth={data.strokeWidth || 2}
                    strokeDasharray={data.strokeStyle === 'dashed' ? '5,5' : (data.strokeStyle === 'dotted' ? '2,2' : 'none')}
                    style={{ opacity: data.opacity ? data.opacity / 100 : 1 }}
                  />
                </svg>
              )}

              {data.shape === 'cylinder' && (
                <>
                  <div className="cylinder-top" style={{ backgroundColor: color, opacity: 0.2, borderColor: color }} />
                  <div className="cylinder-bottom" style={{ backgroundColor: color, opacity: 0.1, borderColor: color }} />
                </>
              )}
            </>
          )}

          <div className={`is-geometric-content ${isEditing ? 'nodrag' : ''}`} style={{ 
            pointerEvents: 'auto', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: flexAlign,
            justifyContent: flexJustify,
            zIndex: 1, 
            width: '100%', 
            height: '100%',
            gap: (data.icon && data.label) ? 4 : 0
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
          >
            {data.icon && IconComponent && <IconComponent size={Math.max(20, 24)} color={color} style={{ flexShrink: 0 }} />}
            <div className="node-label" style={{ 
              fontSize: data.fontSize || '0.75rem', 
              fontFamily: data.fontFamily === 'virgil' ? 'Virgil, cursive' : (data.fontFamily || 'inherit'),
              textAlign: textAlign, 
              fontWeight: 'bold', 
              color: 'var(--text-primary)', 
              wordBreak: 'break-word', 
              maxWidth: '100%',
              flex: 'none',
              width: '100%'
            }}>
              {isEditing ? (
                <textarea
                  value={data.label || ''}
                  onChange={(e) => {
                    setNodes((nodes) =>
                      nodes.map((n) => {
                        if (n.id === id) {
                          return { ...n, data: { ...n.data, label: e.target.value } };
                        }
                        return n;
                      })
                    );
                  }}
                  onBlur={() => setIsEditing(false)}
                  onKeyDown={(e) => {
                    // Let Shift+Enter add a new line, but Enter completes editing
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      setIsEditing(false);
                    }
                  }}
                  autoFocus
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'inherit',
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    fontWeight: 'inherit',
                    textAlign: textAlign,
                    width: '100%',
                    padding: 0,
                    resize: 'none',
                    overflow: 'hidden',
                    minHeight: '2em'
                  }}
                />
              ) : (
                <span title="Double click to edit text" style={{ cursor: 'text', display: 'inline-block', width: '100%', minHeight: '1em' }}>{data.label}</span>
              )}
            </div>
          </div>

          <Handle type="source" position={Position.Right} id="right" />
          <Handle type="source" position={Position.Bottom} id="bottom" />
        </div>
      </>
    );
  }

  if (data.shape === 'class') {
    return (
      <>
        {resizer}
        {toolbar}
        <div className="custom-node class-node" style={{ padding: 0, flexDirection: 'column', width: '100%', height: '100%', overflow: 'hidden', borderColor: data.hideBorder ? 'transparent' : color, '--accent-color': color, background: data.hideBorder ? 'transparent' : 'var(--bg-secondary)', border: data.hideBorder ? 'none' : undefined, boxShadow: data.hideBorder ? 'none' : undefined }}>
          <Handle type="target" position={Position.Top} />
          <Handle type="target" position={Position.Left} id="left" />
          <div style={{ backgroundColor: data.hideBorder ? 'transparent' : `${color}33`, padding: '5px 8px', borderBottom: data.hideBorder ? 'none' : `1px solid ${color}`, textAlign: 'center', width: '100%', fontWeight: 'bold', fontSize: '0.65rem', color: 'var(--text-primary)' }}>
            <IconComponent size={11} color={color} style={{ marginRight: 6, verticalAlign: 'middle', display: 'inline-block' }} />
            {data.label}
          </div>
          <div style={{ padding: '6px 8px', fontSize: '0.55rem', color: 'var(--text-secondary)', minHeight: '36px', width: '100%', textAlign: 'left', lineHeight: '1.4', overflow: 'hidden' }}>
            {(data.fields || '+ id: string\n+ name: string').split('\n').map((line, i) => <div key={'f'+i}>{line}</div>)}
            <hr style={{ borderColor: `${color}44`, margin: '4px 0', display: data.hideBorder ? 'none' : 'block' }} />
            {(data.methods || '+ save()\n+ load()').split('\n').map((line, i) => <div key={'m'+i}>{line}</div>)}
          </div>
          <Handle type="source" position={Position.Right} id="right" />
          <Handle type="source" position={Position.Bottom} id="bottom" />
        </div>
      </>
    );
  }

  if (data.shape === 'actor') {
    return (
      <>
      {resizer}
      {toolbar}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', padding: '10px', position: 'relative' }}>
          <Handle type="target" position={Position.Top} />
          <Handle type="target" position={Position.Left} id="left" />
          <LucideIcons.User size={Math.min(34, 48)} color={color} strokeWidth={1.5} style={{ flexShrink: 0 }} />
          <div style={{ marginTop: '6px', fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--text-primary)', textAlign: 'center', background: data.hideBorder ? 'transparent' : 'var(--bg-glass)', padding: '2px 6px', borderRadius: '4px', wordBreak: 'break-word', maxWidth: '100%' }}>{data.label}</div>
          <Handle type="source" position={Position.Right} id="right" />
          <Handle type="source" position={Position.Bottom} id="bottom" />
        </div>
      </>
    );
  }

  if (data.shape === 'text') {
    return (
      <>
        {resizer}
        {toolbar}
        <div 
          className="custom-node text-node" 
          style={{ 
            padding: '8px 12px', 
            width: '100%',
            height: '100%',
            borderColor: selected ? 'var(--accent-blue)' : 'transparent',
            backgroundColor: selected ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
            borderStyle: selected ? 'dashed' : 'solid',
            borderWidth: 1,
            boxShadow: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: flexAlign,
            justifyContent: flexJustify,
            position: 'relative'
          }}
        >
          <Handle type="target" position={Position.Top} id="top" style={{ opacity: selected ? 0.5 : 0 }} />
          <Handle type="target" position={Position.Left} id="left" style={{ opacity: selected ? 0.5 : 0 }} />
          <div style={{ 
            fontSize: data.fontSize || '1.4rem', 
            fontWeight: 'bold', 
            color: color || 'var(--text-primary)',
            textAlign: textAlign,
            width: '100%',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.2,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: flexAlign,
            gap: '8px',
            fontFamily: data.fontFamily === 'virgil' ? 'Virgil, cursive' : (data.fontFamily || 'inherit'),
          }}>
            {data.showIcon && <IconComponent size={24} color={color || 'var(--text-primary)'} />}
            {isEditing ? (
              <input
                value={data.label}
                onChange={(e) => {
                  setNodes((nodes) =>
                    nodes.map((n) => {
                      if (n.id === id) {
                        return { ...n, data: { ...n.data, label: e.target.value } };
                      }
                      return n;
                    })
                  );
                }}
                onBlur={() => setIsEditing(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setIsEditing(false);
                }}
                autoFocus
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'inherit',
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                  fontWeight: 'inherit',
                  textAlign: 'center',
                  width: '100%',
                  padding: 0
                }}
              />
            ) : (
              <span 
                onDoubleClick={() => setIsEditing(true)}
                title="Double click to edit title"
                style={{ cursor: 'text' }}
              >
                {data.label}
              </span>
            )}
          </div>
          <Handle type="source" position={Position.Right} id="right" style={{ opacity: selected ? 0.5 : 0 }} />
          <Handle type="source" position={Position.Bottom} id="bottom" style={{ opacity: selected ? 0.5 : 0 }} />
        </div>
      </>
    );
  }

  if (data.shape === 'note') {
    return (
      <>
        {resizer}
        {toolbar}
        <div 
          className={`custom-node note-node ${data.isRough ? 'rough-font' : ''}`} 
          style={{ 
            padding: '16px', 
            width: '100%', 
            height: '100%',
            '--note-color': color || '#fef08a',
            background: data.isRough ? 'transparent' : undefined,
            boxShadow: data.isRough ? 'none' : undefined,
            borderRadius: '4px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: flexAlign,
            justifyContent: flexJustify,
            color: '#1e293b',
            position: 'relative'
          }}
        >
          {data.isRough && (
            <canvas 
              ref={canvasRef} 
              width={parseInt(width)} 
              height={parseInt(height)} 
              style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 0 }} 
            />
          )}
          <Handle type="target" position={Position.Top} id="top" style={{ opacity: selected ? 0.5 : 0 }} />
          <Handle type="target" position={Position.Left} id="left" style={{ opacity: selected ? 0.5 : 0 }} />
          <div style={{ 
            fontSize: data.fontSize || '0.85rem', 
            fontWeight: '500', 
            width: '100%',
            height: '100%',
            whiteSpace: 'pre-wrap',
            overflow: 'hidden',
            lineHeight: 1.4,
            textAlign: textAlign,
            zIndex: 1,
            fontFamily: data.fontFamily === 'virgil' ? 'Virgil, cursive' : (data.fontFamily || 'inherit'),
          }}>
            {isEditing ? (
              <textarea
                value={data.label}
                onChange={(e) => {
                  setNodes((nodes) =>
                    nodes.map((n) => {
                      if (n.id === id) {
                        return { ...n, data: { ...n.data, label: e.target.value } };
                      }
                      return n;
                    })
                  );
                }}
                onBlur={() => setIsEditing(false)}
                autoFocus
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'inherit',
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                  fontWeight: 'inherit',
                  resize: 'none',
                  padding: 0,
                  margin: 0,
                  lineHeight: 'inherit'
                }}
              />
            ) : (
              <div 
                onDoubleClick={() => setIsEditing(true)}
                title="Double click to edit note"
                style={{ 
                  width: '100%',
                  height: '100%',
                  cursor: 'text'
                }}
              >
                {data.label}
              </div>
            )}
          </div>
          <Handle type="source" position={Position.Right} id="right" style={{ opacity: selected ? 0.5 : 0 }} />
          <Handle type="source" position={Position.Bottom} id="bottom" style={{ opacity: selected ? 0.5 : 0 }} />
        </div>
      </>
    );
  }

  if (data.shape === 'callout') {
    return (
      <>
        {resizer}
        {toolbar}
        <div 
          className="custom-node callout-node" 
          style={{ 
            padding: '12px 16px', 
            width: '100%', 
            height: '100%',
            borderColor: selected ? 'var(--accent-blue)' : 'rgba(0,0,0,0.1)', 
            borderLeft: `4px solid ${color}`,
            backgroundColor: 'var(--bg-secondary)', 
            boxShadow: 'var(--shadow)',
            borderWidth: selected ? 2 : 1,
            borderLeftWidth: 4,
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            position: 'relative'
          }}
        >
          <Handle type="target" position={Position.Top} id="top" style={{ opacity: selected ? 0.5 : 0 }} />
          <Handle type="target" position={Position.Left} id="left" style={{ opacity: selected ? 0.5 : 0 }} />
          <div className="node-icon-bg" style={{ backgroundColor: `${color}22`, width: 28, height: 28, flexShrink: 0 }}>
            <IconComponent size={14} color={color} />
          </div>
          <div style={{ 
            fontSize: '0.8rem', 
            fontWeight: '500', 
            flex: 1,
            color: 'var(--text-primary)',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.3,
            textAlign: 'left'
          }}>
            {isEditing ? (
              <textarea
                value={data.label}
                onChange={(e) => {
                  setNodes((nodes) =>
                    nodes.map((n) => {
                      if (n.id === id) {
                        return { ...n, data: { ...n.data, label: e.target.value } };
                      }
                      return n;
                    })
                  );
                }}
                onBlur={() => setIsEditing(false)}
                autoFocus
                style={{
                  width: '100%',
                  minHeight: '40px',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'inherit',
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                  fontWeight: 'inherit',
                  resize: 'vertical',
                  padding: 0,
                  margin: 0,
                  lineHeight: 'inherit'
                }}
              />
            ) : (
              <div 
                onDoubleClick={() => setIsEditing(true)}
                title="Double click to edit note"
                style={{ 
                  width: '100%',
                  height: '100%',
                  cursor: 'text'
                }}
              >
                {data.label}
              </div>
            )}
          </div>
          <Handle type="source" position={Position.Right} id="right" style={{ opacity: selected ? 0.5 : 0 }} />
          <Handle type="source" position={Position.Bottom} id="bottom" style={{ opacity: selected ? 0.5 : 0 }} />
        </div>
      </>
    );
  }

  if (data.shape === 'drawing') {
    const points = data.points || [];
    const strokeColor = data.color || '#3b82f6';
    const strokeWidth = data.strokeWidth || 3;
    let pathData = '';
    if (points.length > 0) {
      pathData = `M ${points.map(p => `${p[0]} ${p[1]}`).join(' L ')}`;
    }

    return (
      <div 
        style={{ 
          width: '100%', 
          height: '100%', 
          position: 'relative',
          overflow: 'visible',
          pointerEvents: 'all'
        }}
      >
        <Handle type="target" position={Position.Top} id="top" style={{ opacity: 0 }} />
        <Handle type="target" position={Position.Left} id="left" style={{ opacity: 0 }} />
        
        {selected && (
          <div style={{ position: 'absolute', top: -4, left: -4, right: -4, bottom: -4, border: '1px dashed #3b82f6', borderRadius: 4, pointerEvents: 'none' }} />
        )}
        
        {isRoughActive ? (
          <canvas 
            ref={canvasRef} 
            width={parseInt(width)} 
            height={parseInt(height)} 
            style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 0 }} 
          />
        ) : (
          <svg 
            style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%', 
              overflow: 'visible' 
            }}
          >
            <path 
              d={pathData} 
              fill="none" 
              stroke={strokeColor} 
              strokeWidth={strokeWidth} 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              style={{ opacity: (data.opacity != null ? data.opacity : 100) / 100 }}
            />
          </svg>
        )}
        <Handle type="source" position={Position.Right} id="right" style={{ opacity: 0 }} />
        <Handle type="source" position={Position.Bottom} id="bottom" style={{ opacity: 0 }} />
      </div>
    );
  }

  // Arrow and Line shapes (Excalidraw-style)
  if (data.shape === 'arrow' || data.shape === 'line') {
    const strokeColor = data.color || '#3b82f6';
    const strokeWidth = data.strokeWidth || 3;
    const start = data.arrowStart || { x: 0, y: 0 };
    const end = data.arrowEnd || { x: width, y: height };
    const isArrow = data.shape === 'arrow';
    const nodeOpacity = (data.opacity != null ? data.opacity : 100) / 100;
    const dashArray = data.strokeStyle === 'dashed' ? `${strokeWidth * 3} ${strokeWidth * 2}` : (data.strokeStyle === 'dotted' ? `${strokeWidth} ${strokeWidth * 2}` : 'none');
    
    // Calculate arrowhead points
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const angle = Math.atan2(dy, dx);
    const headLen = Math.max(12, strokeWidth * 4);
    const headAngle = Math.PI / 6;

    return (
      <>
        {selected && (
          <div style={{ position: 'absolute', top: -4, left: -4, right: -4, bottom: -4, border: '1px dashed #3b82f6', borderRadius: 4, pointerEvents: 'none', zIndex: 0 }} />
        )}
        {toolbar}
        <div 
          style={{ 
            width: '100%', 
            height: '100%', 
            position: 'relative',
            overflow: 'visible',
            opacity: nodeOpacity,
          }}
        >
          <Handle type="target" position={Position.Top} id="top" style={{ opacity: selected ? 0.5 : 0 }} />
          <Handle type="target" position={Position.Left} id="left" style={{ opacity: selected ? 0.5 : 0 }} />
          <svg 
            style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%', 
              overflow: 'visible',
              pointerEvents: 'none'
            }}
          >
            <line 
              x1={start.x} y1={start.y} 
              x2={end.x} y2={end.y}
              stroke={strokeColor} 
              strokeWidth={strokeWidth} 
              strokeLinecap="round"
              strokeDasharray={dashArray}
            />
            {isArrow && (
              <polygon
                points={`${end.x},${end.y} ${end.x - headLen * Math.cos(angle - headAngle)},${end.y - headLen * Math.sin(angle - headAngle)} ${end.x - headLen * Math.cos(angle + headAngle)},${end.y - headLen * Math.sin(angle + headAngle)}`}
                fill={strokeColor}
                stroke={strokeColor}
                strokeWidth={1}
              />
            )}
          </svg>
          <Handle type="source" position={Position.Right} id="right" style={{ opacity: selected ? 0.5 : 0 }} />
          <Handle type="source" position={Position.Bottom} id="bottom" style={{ opacity: selected ? 0.5 : 0 }} />
        </div>
      </>
    );
  }

  if (data.shape === 'brand') {
    return (
      <>
      {resizer}
      {toolbar}
        <div 
          className="custom-node brand-node" 
          style={{ 
            width: '100%', 
            height: '100%',
            borderColor: selected ? 'var(--accent-blue)' : 'var(--border-color)',
            borderStyle: selected ? 'dashed' : 'solid',
            borderWidth: 1,
            borderRadius: '8px',
            background: 'var(--bg-secondary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            boxSizing: 'border-box',
            gap: '8px',
            position: 'relative'
          }}
        >
          <Handle type="target" position={Position.Top} id="top" style={{ opacity: selected ? 0.5 : 0 }} />
          <Handle type="target" position={Position.Left} id="left" style={{ opacity: selected ? 0.5 : 0 }} />
          
          <div 
            dangerouslySetInnerHTML={{ __html: data.svgHtml }} 
            style={{ 
              width: '50%', 
              height: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              pointerEvents: 'none'
            }} 
          />
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-primary)', pointerEvents: 'none' }}>
            {data.label}
          </span>
          
          <Handle type="source" position={Position.Right} id="right" style={{ opacity: selected ? 0.5 : 0 }} />
          <Handle type="source" position={Position.Bottom} id="bottom" style={{ opacity: selected ? 0.5 : 0 }} />
        </div>
      </>
    );
  }

  if (data.shape === 'image') {
    return (
      <>
      {resizer}
      {toolbar}
        <div 
          className="custom-node image-node" 
          style={{ 
            width: '100%', 
            height: '100%',
            borderColor: selected ? 'var(--accent-blue)' : 'transparent',
            borderStyle: selected ? 'dashed' : 'none',
            borderWidth: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Handle type="target" position={Position.Top} id="top" style={{ opacity: selected ? 0.5 : 0 }} />
          <Handle type="target" position={Position.Left} id="left" style={{ opacity: selected ? 0.5 : 0 }} />
          
          <img 
            src={data.imageUrl} 
            alt={data.label || 'Imported Image'} 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain',
              pointerEvents: 'none'
            }} 
          />
          
          <Handle type="source" position={Position.Right} id="right" style={{ opacity: selected ? 0.5 : 0 }} />
          <Handle type="source" position={Position.Bottom} id="bottom" style={{ opacity: selected ? 0.5 : 0 }} />
        </div>
      </>
    );
  }

  return (
    <>
      {resizer}
      {toolbar}
      <div 
        className={`custom-node ${data.shape ? 'shape-' + data.shape : ''} ${data.isRough ? 'rough-font' : ''}`}
        style={{ 
          width: '100%',
          height: '100%',
          borderColor: data.hideBorder ? 'transparent' : color, 
          '--accent-color': color, 
          background: data.hideBorder ? 'transparent' : undefined, 
          boxShadow: data.hideBorder ? 'none' : undefined,
          display: 'flex',
          flexDirection: 'column',
          alignItems: flexAlign,
          justifyContent: flexJustify,
          padding: data.shape === 'diamond' ? 0 : 12,
        }}
      >
        <Handle type="target" position={Position.Top} id="top" />
        <Handle type="target" position={Position.Left} id="left" />
        
        {data.shape === 'cylinder' && (
          <>
            <div className="cylinder-top" style={{ backgroundColor: color, opacity: 0.2, borderColor: color }} />
            <div className="cylinder-bottom" style={{ backgroundColor: color, opacity: 0.1, borderColor: color }} />
          </>
        )}

        {isGeometric ? (
          <div className="is-geometric-content" style={{ 
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: flexAlign,
            justifyContent: flexJustify,
            width: '100%',
            height: '100%',
            zIndex: 1
          }}>
            {data.icon && IconComponent && <IconComponent size={Math.max(20, 24)} color={color} style={{ marginBottom: 4 }} />}
            <div className="node-label" style={{ fontSize: '0.75rem', textAlign: textAlign, fontWeight: 'bold', color: 'var(--text-primary)', wordBreak: 'break-word', maxWidth: '100%' }}>
              {data.label}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: flexAlign, justifyContent: flexJustify, width: '100%', height: '100%', pointerEvents: 'none' }}>
            <div className="node-icon-bg" style={{ backgroundColor: `${color}22`, width: 30, height: 30, marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconComponent size={16} color={color} />
            </div>
            <div className="node-label" style={{ fontSize: '0.7rem', textAlign: textAlign }}>
              {data.shape === 'interface' && <div style={{ fontSize: '0.5rem', opacity: 0.7, marginBottom: '2px', fontWeight: 'normal' }}>&lt;&lt;interface&gt;&gt;</div>}
              {data.label}
            </div>
          </div>
        )}

        <Handle type="source" position={Position.Right} id="right" />
        <Handle type="source" position={Position.Bottom} id="bottom" />
      </div>
    </>
  );
}
