import { Handle, Position, NodeToolbar, useReactFlow } from '@xyflow/react';
import * as LucideIcons from 'lucide-react';

export default function CustomNode({ id, data, selected }) {
  const { setNodes, setEdges, getNodes } = useReactFlow();
  const IconComponent = LucideIcons[data.icon] || LucideIcons.Box;
  const isGeometric = data.shape === 'diamond' || data.shape === 'oval';
  const color = data.color || '#3b82f6';

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
  
  if (data.isContainer) {
    return (
      <>
        {toolbar}
        <div 
          className="custom-node container-node"
          style={{ 
            width: '100%', 
            height: '100%', 
            borderColor: color, 
            backgroundColor: `${color}11`, // very light tint
            borderWidth: 2,
            borderStyle: 'dashed',
            alignItems: 'flex-start',
            padding: 8
          }}
        >
          <Handle type="target" position={Position.Top} />
          <Handle type="target" position={Position.Left} id="left" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color }}>
            <IconComponent size={20} />
            <span style={{ fontWeight: 'bold' }}>{data.label}</span>
          </div>
          <Handle type="source" position={Position.Right} />
          <Handle type="source" position={Position.Bottom} id="bottom" />
        </div>
      </>
    );
  }

  if (data.shape === 'class') {
    return (
      <>
        {toolbar}
        <div className="custom-node class-node" style={{ padding: 0, flexDirection: 'column', width: 160, overflow: 'hidden', borderColor: data.hideBorder ? 'transparent' : color, '--accent-color': color, background: data.hideBorder ? 'transparent' : 'var(--bg-secondary)', border: data.hideBorder ? 'none' : undefined, boxShadow: data.hideBorder ? 'none' : undefined }}>
          <Handle type="target" position={Position.Top} />
          <Handle type="target" position={Position.Left} id="left" />
          <div style={{ backgroundColor: data.hideBorder ? 'transparent' : `${color}33`, padding: '8px', borderBottom: data.hideBorder ? 'none' : `1px solid ${color}`, textAlign: 'center', width: '100%', fontWeight: 'bold', fontSize: '0.8rem', color: '#fff' }}>
            <IconComponent size={14} color={color} style={{ marginRight: 6, verticalAlign: 'middle', display: 'inline-block' }} />
            {data.label}
          </div>
          <div style={{ padding: '8px', fontSize: '0.7rem', color: 'var(--text-secondary)', minHeight: '40px', width: '100%', textAlign: 'left', lineHeight: '1.4' }}>
            {(data.fields || '+ id: string\n+ name: string').split('\n').map((line, i) => <div key={'f'+i}>{line}</div>)}
            <hr style={{ borderColor: `${color}44`, margin: '4px 0', display: data.hideBorder ? 'none' : 'block' }} />
            {(data.methods || '+ save()\n+ load()').split('\n').map((line, i) => <div key={'m'+i}>{line}</div>)}
          </div>
          <Handle type="source" position={Position.Right} />
          <Handle type="source" position={Position.Bottom} id="bottom" />
        </div>
      </>
    );
  }

  if (data.shape === 'actor') {
    return (
      <>
        {toolbar}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px' }}>
          <Handle type="target" position={Position.Top} />
          <Handle type="target" position={Position.Left} id="left" />
          <LucideIcons.User size={40} color={color} strokeWidth={1.5} />
          <div style={{ marginTop: '8px', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-primary)', textAlign: 'center', background: data.hideBorder ? 'transparent' : 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '4px' }}>{data.label}</div>
          <Handle type="source" position={Position.Right} />
          <Handle type="source" position={Position.Bottom} id="bottom" />
        </div>
      </>
    );
  }

  return (
    <>
      {toolbar}
      <div 
        className={`custom-node ${data.shape ? 'shape-' + data.shape : ''}`}
        style={{ borderColor: data.hideBorder ? 'transparent' : color, '--accent-color': color, background: data.hideBorder ? 'transparent' : undefined, boxShadow: data.hideBorder ? 'none' : undefined }}
      >
        <Handle type="target" position={Position.Top} id="top" />
        <Handle type="target" position={Position.Left} id="left" />
        
        {data.shape === 'diamond' && <div className="diamond-inner" style={{ borderColor: color }} />}

        {isGeometric ? (
          <div className="is-geometric-content" style={{ pointerEvents: 'none' }}>
            <IconComponent size={24} color={color} style={{ marginBottom: 4 }} />
            <div className="node-label" style={{ fontSize: '0.75rem', textAlign: 'center' }}>
              {data.label}
            </div>
          </div>
        ) : (
          <>
            <div className="node-icon-bg" style={{ backgroundColor: `${color}22` }}>
              <IconComponent size={20} color={color} />
            </div>
            <div className="node-label">
              {data.shape === 'interface' && <div style={{ fontSize: '0.65rem', opacity: 0.7, marginBottom: '2px', fontWeight: 'normal' }}>&lt;&lt;interface&gt;&gt;</div>}
              {data.label}
            </div>
          </>
        )}

        <Handle type="source" position={Position.Right} id="right" />
        <Handle type="source" position={Position.Bottom} id="bottom" />
      </div>
    </>
  );
}
