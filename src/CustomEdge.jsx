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
  selected,
  label,
}) {
  const { setEdges } = useReactFlow();
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

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        {selected && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
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
            {label && (
              <div style={{
                marginTop: '4px',
                background: 'var(--bg-secondary)',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '0.7rem',
                color: '#fff',
                border: '1px solid var(--border-color)',
                textAlign: 'center'
              }}>
                {label}
              </div>
            )}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}
