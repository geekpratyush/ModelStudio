// Shared solver for Excalidraw-style arrow/line bindings in the Draw workspace.
//
// A bound arrow stores `data.startBinding` / `data.endBinding` = the id of the
// shape each endpoint is attached to. This recomputes those endpoints so they
// sit on the target shape's border, along the line toward the opposite endpoint,
// and rewrites the arrow node's bounding box + local endpoint coords to match.
//
// `skipId` is the node currently being manipulated (dragged / resized) — it is
// left untouched so the solver never fights the direct interaction on that node.
export function recomputeArrowBindings(nodes, skipId) {
  const byId = new Map(nodes.map(n => [n.id, n]));
  const borderPoint = (shape, from) => {
    const w = shape.data?.width ?? (shape.style?.width ? parseFloat(shape.style.width) : 100);
    const h = shape.data?.height ?? (shape.style?.height ? parseFloat(shape.style.height) : 60);
    const cx = shape.position.x + w / 2, cy = shape.position.y + h / 2;
    let dx = from.x - cx, dy = from.y - cy;
    if (dx === 0 && dy === 0) dy = -1;
    const s = Math.min(dx !== 0 ? (w / 2) / Math.abs(dx) : Infinity, dy !== 0 ? (h / 2) / Math.abs(dy) : Infinity);
    return { x: cx + dx * s, y: cy + dy * s };
  };
  return nodes.map(n => {
    if (n.id === skipId) return n;
    if (n.data?.shape !== 'arrow' && n.data?.shape !== 'line') return n;
    const sB = n.data.startBinding, eB = n.data.endBinding;
    if ((!sB || !byId.has(sB)) && (!eB || !byId.has(eB))) return n;
    const pos = n.position;
    let A = { x: pos.x + (n.data.arrowStart?.x || 0), y: pos.y + (n.data.arrowStart?.y || 0) };
    let B = { x: pos.x + (n.data.arrowEnd?.x || 0), y: pos.y + (n.data.arrowEnd?.y || 0) };
    if (sB && byId.has(sB)) A = borderPoint(byId.get(sB), B);
    if (eB && byId.has(eB)) B = borderPoint(byId.get(eB), A);
    const nx = Math.min(A.x, B.x), ny = Math.min(A.y, B.y);
    const nw = Math.max(Math.abs(B.x - A.x), 1), nh = Math.max(Math.abs(B.y - A.y), 1);
    return {
      ...n, position: { x: nx, y: ny }, style: { ...n.style, width: nw, height: nh },
      data: { ...n.data, width: nw, height: nh, arrowStart: { x: A.x - nx, y: A.y - ny }, arrowEnd: { x: B.x - nx, y: B.y - ny } },
    };
  });
}
