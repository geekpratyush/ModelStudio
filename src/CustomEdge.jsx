import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
} from '@xyflow/react';
import { Trash2, Pencil } from 'lucide-react';

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  markerStart,
  selected,
  label,
  labelStyle = {},
  labelBgStyle = {},
  showLabel = true,
  data = {},
  ...props
}) {
  const { setEdges, getNodes } = useReactFlow();

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const onEdgeDelete = () => {
    setEdges((edges) => edges.filter((edge) => edge.id !== id));
  };

  const onLabelChange = () => {
    const newLabel = window.prompt("Enter new edge label:", label || "");
    if (newLabel !== null) {
      setEdges((edges) =>
        edges.map((edge) => {
          if (edge.id === id) {
            return { ...edge, label: newLabel };
          }
          return edge;
        })
      );
    }
  };

  const onColorChange = (newColor) => {
    setEdges((edges) =>
      edges.map((edge) => {
        if (edge.id === id) {
          const updatedEdge = {
            ...edge,
            style: { ...edge.style, stroke: newColor },
          };
          if (edge.markerEnd) {
            updatedEdge.markerEnd = { ...edge.markerEnd, color: newColor };
          }
          if (edge.markerStart) {
            updatedEdge.markerStart = { ...edge.markerStart, color: newColor };
          }
          return updatedEdge;
        }
        return edge;
      })
    );
  };

  const presetColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#94a3b8'];

  const hexToRgba = (hex, alpha) => {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex.substring(1, 3), 16);
      g = parseInt(hex.substring(3, 5), 16);
      b = parseInt(hex.substring(5, 7), 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const isLabelVisible = (showLabel !== false) && (data.showLabel !== false) && (props.showLabel !== false);
  const labelTextColor = labelStyle?.fill || data.labelColor || '#ffffff';
  const labelBgColor = labelBgStyle?.fill || data.labelBgColor || '#1e293b';
  const labelBgOpacity = labelBgStyle?.fillOpacity !== undefined ? labelBgStyle.fillOpacity : (data.labelBgAlpha !== undefined ? data.labelBgAlpha : 1.0);
  const rgbaBg = labelBgColor.startsWith('#') ? hexToRgba(labelBgColor, labelBgOpacity) : labelBgColor;

  return (
    <>
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        markerStart={markerStart} 
        style={{
          ...style,
          strokeWidth: selected ? 4 : (style.strokeWidth || 3),
          stroke: selected ? '#3b82f6' : (style.stroke || '#94a3b8'),
          filter: data.isRough ? 'url(#rough-filter)' : undefined,
          transition: 'stroke-width 0.2s, stroke 0.2s'
        }} 
      />
      <EdgeLabelRenderer>
        {selected && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -100%) translate(${labelX}px,${labelY - 15}px)`,
              pointerEvents: 'all',
              zIndex: 10,
            }}
            className="nodrag nopan"
          >
            <div className="node-toolbar" style={{ padding: '4px 8px' }}>
              <div className="toolbar-inner">
                <div className="color-presets" style={{ gap: '4px' }}>
                  {presetColors.map((c) => (
                    <button
                      key={c}
                      className="color-dot"
                      style={{ backgroundColor: c, width: '12px', height: '12px' }}
                      onClick={() => onColorChange(c)}
                    />
                  ))}
                </div>
                <div className="toolbar-divider" />
                <button
                  className="toolbar-btn"
                  onClick={onLabelChange}
                  title="Edit Label"
                >
                  <Pencil size={12} />
                </button>
                <button
                  className="toolbar-btn delete-btn"
                  onClick={onEdgeDelete}
                  title="Delete Edge"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>
        )}

        {label && isLabelVisible && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              zIndex: 5,
            }}
            className="nodrag nopan"
          >
            <div style={{
              background: rgbaBg,
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              color: labelTextColor,
              border: `1px solid ${labelTextColor}33`,
              textAlign: 'center',
              fontWeight: '500',
              fontFamily: data.isRough ? 'Virgil, cursive' : 'inherit',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              pointerEvents: 'none',
              userSelect: 'none',
            }}>
              {label}
            </div>
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}
