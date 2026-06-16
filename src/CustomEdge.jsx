import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
} from '@xyflow/react';
import { Trash2, Pencil } from 'lucide-react';

const getAbsoluteNodeRect = (node, allNodes) => {
  let x = node.position.x;
  let y = node.position.y;
  let width = node.style?.width || (node.data?.isContainer ? 400 : 160);
  let height = node.style?.height || (node.data?.isContainer ? 300 : 72);
  
  if (node.data?.shape === 'class') {
    height = 120;
  } else if (node.data?.shape === 'actor') {
    width = 90;
    height = 90;
  } else if (node.data?.shape === 'diamond') {
    width = 100;
    height = 100;
  }

  width = parseInt(width, 10);
  height = parseInt(height, 10);

  let parentId = node.parentId;
  while (parentId) {
    const parentNode = allNodes.find(n => n.id === parentId);
    if (!parentNode) break;
    x += parentNode.position.x;
    y += parentNode.position.y;
    parentId = parentNode.parentId;
  }

  return { x, y, width, height };
};

const getPoints = (rect) => {
  return [
    { x: rect.x + rect.width / 2, y: rect.y, position: 'top' },
    { x: rect.x + rect.width / 2, y: rect.y + rect.height, position: 'bottom' },
    { x: rect.x, y: rect.y + rect.height / 2, position: 'left' },
    { x: rect.x + rect.width, y: rect.y + rect.height / 2, position: 'right' },
  ];
};

const getClosestPoints = (nodeA, nodeB, allNodes) => {
  const rectA = getAbsoluteNodeRect(nodeA, allNodes);
  const rectB = getAbsoluteNodeRect(nodeB, allNodes);

  const pointsA = getPoints(rectA);
  const pointsB = getPoints(rectB);

  let minDistance = Infinity;
  let bestPointA = pointsA[0];
  let bestPointB = pointsB[0];

  for (const pA of pointsA) {
    for (const pB of pointsB) {
      const dx = pA.x - pB.x;
      const dy = pA.y - pB.y;
      const distance = dx * dx + dy * dy;
      if (distance < minDistance) {
        minDistance = distance;
        bestPointA = pA;
        bestPointB = pB;
      }
    }
  }

  return {
    sourceX: bestPointA.x,
    sourceY: bestPointA.y,
    sourcePosition: bestPointA.position,
    targetX: bestPointB.x,
    targetY: bestPointB.y,
    targetPosition: bestPointB.position,
  };
};

export default function CustomEdge({
  id,
  sourceX: initialSourceX,
  sourceY: initialSourceY,
  targetX: initialTargetX,
  targetY: initialTargetY,
  sourcePosition: initialSourcePosition,
  targetPosition: initialTargetPosition,
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
  const allNodes = getNodes();

  const sourceNode = allNodes.find(n => n.id === props.source);
  const targetNode = allNodes.find(n => n.id === props.target);

  let sourceX = initialSourceX;
  let sourceY = initialSourceY;
  let sourcePosition = initialSourcePosition;
  let targetX = initialTargetX;
  let targetY = initialTargetY;
  let targetPosition = initialTargetPosition;

  if (sourceNode && targetNode) {
    const coords = getClosestPoints(sourceNode, targetNode, allNodes);
    sourceX = coords.sourceX;
    sourceY = coords.sourceY;
    sourcePosition = coords.sourcePosition;
    targetX = coords.targetX;
    targetY = coords.targetY;
    targetPosition = coords.targetPosition;
  }

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
