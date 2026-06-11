const systemState = {
    nodes: [],
    connections: [],
    zoom: 1.0,
    panX: 0,
    panY: 0,
    selectedIds: [],
    interactionMode: 'move', // 'move', 'pan', 'select', 'pencil', 'rect', 'circle', 'diamond', 'arrow', 'dline', 'text', 'eraser'
    sketches: [],
    activeSketch: null,
    draggedItemData: null,
    activeTheme: 'default',
    sketchToolbarVisible: false,
    sketchSettings: {
        color: '#60a5fa',
        width: 2,
        style: 'hand-drawn', // 'hand-drawn', 'simple', 'double'
        pattern: 'solid', // 'solid', 'dashed', 'dotted'
        animated: false
    }
};

let roughCanvas = null;

// --- 1. Icon Helper ---
function getIconHtml(icon, color = '', isLarge = false) {
    if (!icon) return '';
    const size = isLarge ? '3.5rem' : '1.3rem';
    if (icon.startsWith('http') || icon.startsWith('data:image')) {
        return `<img src="${icon}" style="width:${size}; height:${size}; object-fit:contain; vertical-align:middle;">`;
    }
    const hasStyleClass = icon.includes('fa-solid') || icon.includes('fa-brands') || icon.includes('fa-regular') || icon.includes('fa-light') || icon.includes('fa-thin') || icon.includes('fa-duotone');
    const fullClass = hasStyleClass ? icon : `fa-solid ${icon}`;
    const style = `style="${color ? `color: ${color};` : ''} font-size: ${size}; vertical-align:middle;"`;
    return `<i class="${fullClass}" ${style}></i>`;
}

// --- 2. General Helpers ---
function makeDraggable(el, handle) {
    if (!el || !handle) return;
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    handle.onmousedown = (e) => {
        e.stopPropagation(); pos3 = e.clientX; pos4 = e.clientY;
        const mm = (me) => { 
            pos1 = pos3 - me.clientX; pos2 = pos4 - me.clientY; pos3 = me.clientX; pos4 = me.clientY; 
            el.style.top = (el.offsetTop - pos2) + "px"; el.style.left = (el.offsetLeft - pos1) + "px"; 
        };
        const mu = () => { window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', mu); };
        window.addEventListener('mousemove', mm); window.addEventListener('mouseup', mu);
    };
}

function getPortCoords(node, dir) {
    const el = document.getElementById(node.id);
    const nw = el ? el.offsetWidth : (node.width || 140), nh = el ? el.offsetHeight : (node.height || 65);
    let x = node.x, y = node.y;
    if (dir === 'right') { x += nw; y += nh / 2; } 
    else if (dir === 'left') { y += nh / 2; } 
    else if (dir === 'top') { x += nw / 2; } 
    else if (dir === 'bottom') { x += nw / 2; y += nh; }
    return { x, y };
}

// --- 3. Rendering ---
function renderConnections() {
    const svg = document.getElementById('svg-edge-layer');
    if (!svg) return;
    Array.from(svg.children).forEach(child => {
        if (child.tagName.toLowerCase() !== 'defs') child.remove();
    });
    systemState.connections.forEach(wire => {
        const src = systemState.nodes.find(n => n.id === wire.from), dest = systemState.nodes.find(n => n.id === wire.to);
        if (!src || !dest) return;
        const start = getPortCoords(src, wire.fromPort), end = getPortCoords(dest, wire.toPort);
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute('class', `wire-group ${systemState.selectedIds.includes(wire.id) ? 'selected' : ''}`);
        svg.appendChild(g);
        const cp1x = start.x + (wire.fromPort === 'right' ? 50 : (wire.fromPort === 'left' ? -50 : 0)), cp1y = start.y + (wire.fromPort === 'bottom' ? 50 : (wire.fromPort === 'top' ? -50 : 0));
        const cp2x = end.x + (wire.toPort === 'right' ? 50 : (wire.toPort === 'left' ? -50 : 0)), cp2y = end.y + (wire.toPort === 'bottom' ? 50 : (wire.toPort === 'top' ? -50 : 0));
        const d = `M ${start.x} ${start.y} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${end.x} ${end.y}`;
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute('d', d); path.setAttribute('class', 'static-base-line'); path.setAttribute('stroke', wire.color || '#60a5fa'); path.setAttribute('stroke-width', '2'); path.setAttribute('fill', 'none');
        if (wire.pattern === 'dotted') path.setAttribute('stroke-dasharray', '2,4');
        else if (wire.pattern === 'dashed') path.setAttribute('stroke-dasharray', '8,4');
        if (wire.direction === 'forward' || wire.direction === 'both') path.setAttribute('marker-end', 'url(#arrowhead)');
        const hit = document.createElementNS("http://www.w3.org/2000/svg", "path");
        hit.setAttribute('d', d); hit.setAttribute('class', 'wire-hit-area');
        hit.onclick = (e) => { e.stopPropagation(); if (e.shiftKey || e.ctrlKey || e.metaKey) { if (systemState.selectedIds.includes(wire.id)) systemState.selectedIds = systemState.selectedIds.filter(id => id !== wire.id); else systemState.selectedIds.push(wire.id); } else { openInspector(wire.id, 'wire'); } renderSubsystemsTopologyCanvas(); };
        hit.oncontextmenu = (e) => { e.preventDefault(); e.stopPropagation(); systemState.selectedIds = [wire.id]; renderSubsystemsTopologyCanvas(); const menu = document.getElementById('context-menu'); if (menu) { document.getElementById('cm-anim-toggle').style.display = 'flex'; document.getElementById('cm-convert').style.display = 'none'; document.getElementById('cm-edit').style.display = 'flex'; document.getElementById('cm-exit').style.display = 'none'; document.getElementById('cm-add-context').style.display = 'none'; menu.style.display = 'flex'; menu.style.left = e.clientX + 'px'; menu.style.top = e.clientY + 'px'; } };
        g.appendChild(path);
        if (wire.animated !== false) {
            const anim = document.createElementNS("http://www.w3.org/2000/svg", "path");
            anim.setAttribute('d', d); anim.setAttribute('class', 'animated-flow-line'); anim.setAttribute('stroke', wire.color || '#60a5fa'); anim.setAttribute('fill', 'none'); anim.setAttribute('stroke-width', '2');
            if (wire.pattern === 'dotted') anim.setAttribute('stroke-dasharray', '2,2');
            else if (wire.pattern === 'dashed') anim.setAttribute('stroke-dasharray', '6,4');
            g.appendChild(anim);
        }
        g.appendChild(hit);
        if (wire.label || wire.payload) {
            const midX = 0.125 * start.x + 0.375 * cp1x + 0.375 * cp2x + 0.125 * end.x, midY = 0.125 * start.y + 0.375 * cp1y + 0.375 * cp2y + 0.125 * end.y;
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute('class', 'wire-label'); text.setAttribute('x', midX); text.setAttribute('y', midY + 4);
            let labelText = wire.label || ''; if (wire.payload) labelText += (labelText ? ' | ' : '') + wire.payload;
            text.textContent = labelText;
            const charWidth = 6.8, bgW = Math.max(30, labelText.length * charWidth + 18), bgH = 18;
            const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            bg.setAttribute('class', 'wire-label-bg'); bg.setAttribute('x', midX - bgW / 2); bg.setAttribute('y', midY - bgH / 2); bg.setAttribute('width', bgW); bg.setAttribute('height', bgH);
            g.appendChild(bg); g.appendChild(text);
        }
    });
}

function renderSketches() {
    const svg = document.getElementById('svg-sketch-layer');
    if (!svg) return;
    svg.innerHTML = '';
    if (!roughCanvas) return;
    const allSketches = [...systemState.sketches];
    if (systemState.activeSketch) allSketches.push(systemState.activeSketch);
    allSketches.forEach(s => {
        let node;
        const isSelected = systemState.selectedIds.includes(s.id);
        const options = { stroke: isSelected ? '#fb923c' : (s.color || '#60a5fa'), strokeWidth: isSelected ? (parseInt(s.strokeWidth) + 2) : (parseInt(s.strokeWidth) || 2), roughness: s.style === 'hand-drawn' ? 1.5 : (s.style === 'double' ? 2.5 : 0.2), bowing: s.style === 'hand-drawn' ? 1.5 : 0, strokeLineDash: s.pattern === 'dashed' ? [8, 4] : (s.pattern === 'dotted' ? [2, 4] : []) };
        if (s.type === 'pencil') { if (s.points && s.points.length >= 2) { const d = `M ${s.points.map(p => `${p.x} ${p.y}`).join(' L ')}`; node = roughCanvas.path(d, options); s.svgPath = d; } }
        else if (s.type === 'rect') { let nx = s.w < 0 ? s.x + s.w : s.x, ny = s.h < 0 ? s.y + s.h : s.y; node = roughCanvas.rectangle(nx, ny, Math.abs(s.w), Math.abs(s.h), options); }
        else if (s.type === 'circle') { const r = Math.sqrt(s.w*s.w + s.h*s.h); node = roughCanvas.circle(s.x, s.y, r * 2, options); }
        else if (s.type === 'diamond') { let nx = s.w < 0 ? s.x + s.w : s.x, ny = s.h < 0 ? s.y + s.h : s.y, nw = Math.abs(s.w), nh = Math.abs(s.h), pts = [[nx + nw/2, ny], [nx + nw, ny + nh/2], [nx + nw/2, ny + nh], [nx, ny + nh/2]]; node = roughCanvas.polygon(pts, options); }
        else if (s.type === 'arrow') {
            node = roughCanvas.line(s.x1, s.y1, s.x2, s.y2, options);
            const angle = Math.atan2(s.y2 - s.y1, s.x2 - s.x1), headLen = 15;
            const p1 = [s.x2 - headLen * Math.cos(angle - Math.PI / 6), s.y2 - headLen * Math.sin(angle - Math.PI / 6)], p2 = [s.x2 - headLen * Math.cos(angle + Math.PI / 6), s.y2 - headLen * Math.sin(angle + Math.PI / 6)];
            const head = roughCanvas.polygon([[s.x2, s.y2], p1, p2], { ...options, fill: options.stroke, fillStyle: 'solid' });
            svg.appendChild(head);
        } else if (s.type === 'dline') {
            const gap = 6, angle = Math.atan2(s.y2 - s.y1, s.x2 - s.x1) + Math.PI / 2, dx = gap * Math.cos(angle), dy = gap * Math.sin(angle);
            const line1 = roughCanvas.line(s.x1 - dx, s.y1 - dy, s.x2 - dx, s.y2 - dy, options), line2 = roughCanvas.line(s.x1 + dx, s.y1 + dy, s.x2 + dx, s.y2 + dy, options);
            svg.appendChild(line1); svg.appendChild(line2); return;
        } else if (s.type === 'text') {
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute('x', s.x); text.setAttribute('y', s.y); text.setAttribute('fill', isSelected ? '#fb923c' : (s.color || '#60a5fa'));
            text.style.fontFamily = s.style === 'hand-drawn' ? "'Permanent Marker', cursive" : "'Inter', sans-serif";
            text.style.fontSize = (s.fontSize || 16) + 'px'; text.style.pointerEvents = 'auto'; text.style.cursor = 'pointer'; text.textContent = s.text || 'Text';
            text.setAttribute('data-id', s.id);
            text.onclick = (e) => { e.stopPropagation(); if (systemState.interactionMode === 'eraser') { deleteSelectedObject(s.id, 'sketch'); return; } if (e.shiftKey || e.ctrlKey || e.metaKey) { if (systemState.selectedIds.includes(s.id)) systemState.selectedIds = systemState.selectedIds.filter(id => id !== s.id); else systemState.selectedIds.push(s.id); } else systemState.selectedIds = [s.id]; renderSubsystemsTopologyCanvas(); };
            text.ondblclick = (e) => { e.stopPropagation(); openInlineTextEditor(s.id, 'sketch'); };
            svg.appendChild(text); return;
        }
        if (node) {
            node.setAttribute('data-id', s.id); node.style.pointerEvents = s === systemState.activeSketch ? 'none' : 'auto'; node.style.cursor = 'pointer';
            if (s.animated) node.classList.add('animated-flow-line');
            node.onclick = (e) => { e.stopPropagation(); if (systemState.interactionMode === 'eraser') { deleteSelectedObject(s.id, 'sketch'); return; } if (e.shiftKey || e.ctrlKey || e.metaKey) { if (systemState.selectedIds.includes(s.id)) systemState.selectedIds = systemState.selectedIds.filter(id => id !== s.id); else systemState.selectedIds.push(s.id); } else systemState.selectedIds = [s.id]; renderSubsystemsTopologyCanvas(); };
            svg.appendChild(node);
        }
    });
}

function renderSubsystemsTopologyCanvas(skipPanel = false) {
    const surface = document.getElementById('canvas-surface'); if (!surface) return;
    surface.style.transform = `translate(${systemState.panX}px, ${systemState.panY}px) scale(${systemState.zoom})`;
    const emptyState = document.getElementById('empty-state');
    if (emptyState) {
        const hasCanvasContent = systemState.nodes.length > 0 || systemState.connections.length > 0 || systemState.sketches.length > 0 || !!systemState.activeSketch;
        emptyState.style.display = hasCanvasContent ? 'none' : 'flex';
    }
    
    // Auto-resize containers to fit children
    systemState.nodes.filter(n => n.isContainer).forEach(container => {
        const children = systemState.nodes.filter(n => n.parentContainerId === container.id);
        if (children.length > 0) {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            children.forEach(c => { const cel = document.getElementById(c.id), cW = cel ? cel.offsetWidth : (c.width || 140), cH = cel ? cel.offsetHeight : (c.height || 65); minX = Math.min(minX, c.x); minY = Math.min(minY, c.y); maxX = Math.max(maxX, c.x + cW); maxY = Math.max(maxY, c.y + cH); });
            const pad = 30, h_off = 25; if (!container.width) container.width = 480; if (!container.height) container.height = 320;
            if (minX < container.x + pad) { const diff = (container.x + pad) - minX; container.x -= diff; container.width += diff; }
            if (minY < container.y + pad + h_off) { const diff = (container.y + pad + h_off) - minY; container.y -= diff; container.height += diff; }
            if (maxX > container.x + container.width - pad) container.width = (maxX - container.x) + pad;
            if (maxY > container.y + container.height - pad) container.height = (maxY - container.y) + pad;
        }
    });

    const nodeIds = new Set(systemState.nodes.map(n => n.id));
    Array.from(surface.querySelectorAll('.node')).forEach(el => { if (!nodeIds.has(el.id)) el.remove(); });

    systemState.nodes.forEach(n => {
        let el = document.getElementById(n.id);
        if (!el) {
            el = document.createElement('div'); el.id = n.id; el.className = 'node';
            if (n.type === 'icon-only') el.innerHTML = `<div class="node-context-hud"><div class="hud-color-btn"><i class="fa-solid fa-palette"></i><input type="color" value="${n.color || '#94a3b8'}"></div><button class="hud-btn hud-exit"><i class="fa-solid fa-arrow-up-right-from-square"></i></button><button class="hud-btn hud-del"><i class="fa-solid fa-trash-can"></i></button></div><div style="display:flex; flex-direction:column; align-items:center; justify-content:center; width:100%; height:100%;"><div class="node-icon-wrapper"></div><div class="node-text-title" style="font-size:0.7rem; color:var(--text-secondary); margin-top:8px; text-align:center;"></div></div>`;
            else el.innerHTML = `<div class="node-context-hud"><div class="hud-color-btn"><i class="fa-solid fa-palette"></i><input type="color" value="${n.color || '#2563eb'}"></div><button class="hud-btn edit"><i class="fa-solid fa-sliders"></i></button><button class="hud-btn hud-exit"><i class="fa-solid fa-arrow-up-right-from-square"></i></button><button class="hud-btn hud-del"><i class="fa-solid fa-trash-can"></i></button></div><div class="node-header-wrap"><div class="node-icon-wrapper"></div><div class="node-text-title"></div></div><div class="node-fields-container"></div><div class="port port-top"></div><div class="port port-right"></div><div class="port port-bottom"></div><div class="port port-left"></div>`;
            if (n.isContainer) { const r = document.createElement('div'); r.className = 'resize-handle'; el.appendChild(r); }
            surface.appendChild(el);
            
            // Set up basic events for the new element
            const exitBtn = el.querySelector('.hud-btn.hud-exit'), delBtn = el.querySelector('.hud-btn.hud-del'), editBtn = el.querySelector('.hud-btn.edit'), colorInput = el.querySelector('.hud-color-btn input');
            if (exitBtn) exitBtn.onclick = (e) => { e.stopPropagation(); exitContext(n.id); }; 
            if (delBtn) delBtn.onclick = (e) => { e.stopPropagation(); deleteSelectedObject(n.id, 'node'); }; 
            if (editBtn) editBtn.onclick = (e) => { e.stopPropagation(); openInspector(n.id, 'node'); };
            if (colorInput) colorInput.oninput = (e) => { n.color = e.target.value; renderSubsystemsTopologyCanvas(true); saveState(); };
            
            const resizer = el.querySelector('.resize-handle'); 
            if (resizer) { 
                resizer.onmousedown = (e) => { 
                    e.stopPropagation(); let sx = e.clientX, sy = e.clientY, sw = n.width || 480, sh = n.height || 320; 
                    const mm = (me) => { 
                        n.width = Math.max(200, sw + (me.clientX - sx) / systemState.zoom); 
                        n.height = Math.max(150, sh + (me.clientY - sy) / systemState.zoom); 
                        pushContainer(n.id, 0, 0, new Set([n.id]), true); 
                        renderSubsystemsTopologyCanvas(true); 
                    }; 
                    const mu = () => { window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', mu); saveState(); }; 
                    window.addEventListener('mousemove', mm); window.addEventListener('mouseup', mu); 
                }; 
            }

            el.querySelectorAll('.port').forEach(port => { 
                port.onmousedown = (e) => { 
                    e.stopPropagation(); const portDir = port.className.split('port-')[1], startCoords = getPortCoords(n, portDir), svg = document.getElementById('svg-edge-layer'), canvasContainer = document.getElementById('canvas-container'); 
                    const tempPath = document.createElementNS("http://www.w3.org/2000/svg", "path"); 
                    tempPath.setAttribute('stroke', '#60a5fa'); tempPath.setAttribute('stroke-width', '2'); tempPath.setAttribute('fill', 'none'); tempPath.setAttribute('stroke-dasharray', '2,2'); 
                    svg.appendChild(tempPath); 
                    const mm = (me) => { 
                        const rect = canvasContainer.getBoundingClientRect(); 
                        const curX = (me.clientX - rect.left - systemState.panX) / systemState.zoom, curY = (me.clientY - rect.top - systemState.panY) / systemState.zoom; 
                        const d = `M ${startCoords.x} ${startCoords.y} C ${startCoords.x + (portDir === 'right' ? 50 : (portDir === 'left' ? -50 : 0))} ${startCoords.y + (portDir === 'bottom' ? 50 : (portDir === 'top' ? -50 : 0))} ${curX} ${curY} ${curX} ${curY}`; 
                        tempPath.setAttribute('d', d); 
                    }; 
                    const mu = (me) => { 
                        tempPath.remove(); window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', mu); 
                        const targetEl = document.elementFromPoint(me.clientX, me.clientY), portEl = targetEl ? targetEl.closest('.port') : null; 
                        if (portEl) { 
                            const targetNodeEl = portEl.closest('.node'); 
                            if (targetNodeEl && targetNodeEl.id !== n.id) { 
                                const targetPortDir = portEl.className.split('port-')[1]; 
                                const wire = { id: 'w_' + Date.now(), from: n.id, fromPort: portDir, to: targetNodeEl.id, toPort: targetPortDir, pattern: 'dotted', direction: 'forward', animated: true }; 
                                systemState.connections.push(wire); AudioFX.play('snap'); saveState(); renderSubsystemsTopologyCanvas(); 
                            } 
                        } 
                    }; 
                    window.addEventListener('mousemove', mm); window.addEventListener('mouseup', mu); 
                }; 
            });

            el.oncontextmenu = (e) => { 
                e.preventDefault(); e.stopPropagation(); systemState.selectedIds = [n.id]; renderSubsystemsTopologyCanvas(); 
                const menu = document.getElementById('context-menu'); 
                if (menu) { 
                    document.getElementById('cm-anim-toggle').style.display = 'none'; 
                    const isIcon = n.type === 'icon-only'; 
                    document.getElementById('cm-convert').style.display = isIcon ? 'flex' : 'none'; 
                    document.getElementById('cm-edit').style.display = isIcon ? 'none' : 'flex'; 
                    
                    const cmExit = document.getElementById('cm-exit');
                    if (cmExit) cmExit.style.display = n.parentContainerId ? 'flex' : 'none';
                    
                    const cmAdd = document.getElementById('cm-add-context');
                    if (cmAdd) {
                        if (!n.parentContainerId) {
                            cmAdd.style.display = 'flex';
                            const subMenu = document.getElementById('cm-add-context-list');
                            if (subMenu) {
                                subMenu.innerHTML = '';
                                const targetContexts = systemState.nodes.filter(c => c.isContainer && c.id !== n.id && !isAncestor(c.id, n.id));
                                if (targetContexts.length > 0) {
                                    targetContexts.forEach(c => {
                                        const item = document.createElement('div');
                                        item.className = 'context-menu-item';
                                        item.textContent = c.label || c.id;
                                        item.onclick = (ev) => {
                                            ev.stopPropagation();
                                            addToContext(n.id, c.id);
                                            menu.style.display = 'none';
                                        };
                                        subMenu.appendChild(item);
                                    });
                                } else {
                                    const noItem = document.createElement('div');
                                    noItem.className = 'context-menu-item';
                                    noItem.style.opacity = '0.5';
                                    noItem.style.pointerEvents = 'none';
                                    noItem.textContent = 'No available contexts';
                                    subMenu.appendChild(noItem);
                                }
                            }
                        } else {
                            cmAdd.style.display = 'none';
                        }
                    }
                    
                    menu.style.display = 'flex'; menu.style.left = e.clientX + 'px'; menu.style.top = e.clientY + 'px'; 
                } 
            };

            el.ondblclick = (e) => { e.stopPropagation(); openInlineTextEditor(n.id, 'node'); };

            el.onmousedown = (e) => {
                if (systemState.interactionMode !== 'move' || e.target.classList.contains('port') || e.target.classList.contains('resize-handle') || e.target.closest('.hud-btn')) return;
                e.stopPropagation(); 
                const isMulti = e.shiftKey || e.ctrlKey || e.metaKey; 
                if (!isMulti && !systemState.selectedIds.includes(n.id)) systemState.selectedIds = [n.id]; 
                else if (isMulti) { 
                    if (systemState.selectedIds.includes(n.id)) systemState.selectedIds = systemState.selectedIds.filter(id => id !== n.id); 
                    else systemState.selectedIds.push(n.id); 
                }
                const startX = e.clientX, startY = e.clientY, dragStates = systemState.nodes.filter(node => systemState.selectedIds.includes(node.id)).map(node => ({ node, ox: node.x, oy: node.y }));
                const mm = (me) => {
                    const dx = (me.clientX - startX) / systemState.zoom, dy = (me.clientY - startY) / systemState.zoom, visited = new Set();
                    dragStates.forEach(s => { 
                        if (visited.has(s.node.id)) return; 
                        if (s.node.isContainer) { 
                            const curDx = (Math.round((s.ox + dx) / 10) * 10) - s.node.x, curDy = (Math.round((s.oy + dy) / 10) * 10) - s.node.y; 
                            if (curDx !== 0 || curDy !== 0) pushContainer(s.node.id, curDx, curDy, visited, true); 
                        } else { 
                            let nx = Math.round((s.ox + dx) / 10) * 10, ny = Math.round((s.oy + dy) / 10) * 10; 
                            autoParentNodes(); 
                            if (s.node.parentContainerId) { 
                                const p = systemState.nodes.find(node => node.id === s.node.parentContainerId); 
                                if (p) { 
                                    const pad = 30, h_off = 25, cel = document.getElementById(s.node.id), nw = cel ? cel.offsetWidth : (n.width || 140), nh = cel ? cel.offsetHeight : (n.height || 65); 
                                    let npx = p.x, npy = p.y, npw = p.width, nph = p.height, expanded = false; 
                                    if (nx < p.x + pad) { const diff = (p.x + pad) - nx; npx -= diff; npw += diff; expanded = true; } 
                                    if (ny < p.y + pad + h_off) { const diff = (p.y + pad + h_off) - ny; npy -= diff; nph += diff; expanded = true; } 
                                    if (nx + nw > p.x + p.width - pad) { npw = (nx + nw - p.x) + pad; expanded = true; } 
                                    if (ny + nh > p.y + p.height - pad) { nph = (ny + nh - p.y) + pad; expanded = true; } 
                                    if (expanded) { p.x = npx; p.y = npy; p.width = npw; p.height = nph; pushContainer(p.id, 0, 0, new Set([p.id]), true); } 
                                    nx = Math.max(p.x + pad, Math.min(nx, p.x + p.width - nw - pad)); ny = Math.max(p.y + pad + h_off, Math.min(ny, p.y + p.height - nh - pad)); 
                                } 
                            } 
                            s.node.x = nx; s.node.y = ny; enforcePhysics(); visited.add(s.node.id); 
                        } 
                    });
                    renderSubsystemsTopologyCanvas(true);
                };
                const mu = () => { window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', mu); saveState(); renderSubsystemsTopologyCanvas(); };
                window.addEventListener('mousemove', mm); window.addEventListener('mouseup', mu);
            };
        }

        // Update properties
        const hasFields = n.fields && n.fields.length > 0;
        el.className = `node ${n.isContainer ? 'node-actor-container' : ''} ${systemState.selectedIds.includes(n.id) ? 'selected' : ''} ${n.type === 'icon-only' ? 'icon-only-node' : ''} ${hasFields ? 'has-fields' : ''}`;
        el.style.left = n.x + 'px'; el.style.top = n.y + 'px'; el.style.borderLeftColor = n.color;
        if (n.isContainer) { el.style.width = (n.width || 480) + 'px'; el.style.height = (n.height || 320) + 'px'; }
        el.querySelector('.node-text-title').textContent = n.label;
        const exitBtn = el.querySelector('.hud-btn.hud-exit');
        if (exitBtn) { exitBtn.style.display = n.parentContainerId ? '' : 'none'; }
        const wrapper = el.querySelector('.node-icon-wrapper'); if (wrapper) wrapper.innerHTML = getIconHtml(n.icon, n.color, n.type === 'icon-only');
        const fc = el.querySelector('.node-fields-container');
        if (fc) {
            fc.innerHTML = ''; const eType = n.editorType || (['Message','Table','Collection','Record'].includes(n.label) ? n.label : 'Generic');
            if (eType === 'Message') { (n.headers || []).slice(0, 3).forEach(h => { const row = document.createElement('div'); row.className = 'node-field-row'; row.innerHTML = `<span class="node-field-name">${h.key}</span>: <span class="node-field-value">${h.value}</span>`; fc.appendChild(row); }); if (n.payload) { const row = document.createElement('div'); row.className = 'node-field-row'; row.style.opacity = '0.6'; row.innerHTML = `<span>Payload: ${n.payload.substring(0, 20)}...</span>`; fc.appendChild(row); } }
            else if (eType === 'Table') { const header = document.createElement('div'); header.className = 'node-field-row'; header.style.borderBottom = '1px solid var(--border-color)'; header.innerHTML = (n.columns || []).slice(0, 3).map(c => `<span style="flex:1; font-weight:bold; overflow:hidden; text-overflow:ellipsis;">${c.name}</span>`).join(''); fc.appendChild(header); (n.rows || []).slice(0, 2).forEach(r => { const row = document.createElement('div'); row.className = 'node-field-row'; row.innerHTML = (n.columns || []).slice(0, 3).map(c => `<span style="flex:1; overflow:hidden; text-overflow:ellipsis;">${r[c.name]||''}</span>`).join(''); fc.appendChild(row); }); }
            else if (eType === 'Collection') { try { const data = JSON.parse(n.collectionData || '[]'); const count = Array.isArray(data) ? data.length : Object.keys(data).length; const row = document.createElement('div'); row.className = 'node-field-row'; row.innerHTML = `<i class="fa-solid fa-layer-group"></i> <span>${count} items</span>`; fc.appendChild(row); } catch(e) {} }
            else { (n.fields || []).forEach(f => { const row = document.createElement('div'); row.className = 'node-field-row'; row.innerHTML = `<i class="fa-solid fa-circle-info"></i><span class="node-field-name">${f.name}</span>: <span class="node-field-value">${f.value||'...'}</span>`; fc.appendChild(row); }); }
        }
    });

    requestAnimationFrame(() => { 
        renderConnections(); 
        renderSketches(); 
        showGlobalSelectionHUD(); 
    });
    if (!skipPanel) updatePropertiesPanel();
    const telZoom = document.getElementById('telemetry-zoom'); if (telZoom) telZoom.textContent = `Scale: ${Math.round(systemState.zoom * 100)}%`;
    const tbZoom = document.getElementById('toolbar-zoom-percent'); if (tbZoom) tbZoom.textContent = `${Math.round(systemState.zoom * 100)}%`;
}

// --- 4. Logic & Physics ---
function pushContainer(containerId, dx, dy, visited = new Set(), force = false) {
    if (visited.has(containerId)) return;
    visited.add(containerId);
    const container = systemState.nodes.find(n => n.id === containerId);
    if (!container) return;

    if (dx !== 0 || dy !== 0) {
        container.x += dx; container.y += dy;
        systemState.nodes.forEach(n => { 
            if (n.parentContainerId === containerId) { 
                if (n.isContainer) pushContainer(n.id, dx, dy, visited, force); 
                else { n.x += dx; n.y += dy; } 
            } 
        });
    }

    if (dx !== 0 || dy !== 0 || force) {
        const cw = container.width || 480, ch = container.height || 320, pad = 15;
        systemState.nodes.forEach(other => {
            if (other.isContainer && other.id !== containerId && !visited.has(other.id)) {
                const ow = other.width || 480, oh = other.height || 320;
                const overlapX = (container.x < other.x + ow + pad) && (container.x + cw + pad > other.x), overlapY = (container.y < other.y + oh + pad) && (container.y + ch + pad > other.y);
                if (overlapX && overlapY) {
                    let pdx = 0, pdy = 0;
                    if (dx !== 0 || dy !== 0) { pdx = dx; pdy = dy; } 
                    else {
                        const midX = container.x + cw / 2, midY = container.y + ch / 2, omidX = other.x + ow / 2, omidY = other.y + oh / 2;
                        if (Math.abs(omidX - midX) > Math.abs(omidY - midY)) pdx = omidX > midX ? 10 : -10; else pdy = omidY > midY ? 10 : -10;
                    }
                    pushContainer(other.id, pdx, pdy, visited, force);
                }
            }
        });
    }
}

function isAncestor(nodeId, potentialAncestorId) {
    let cur = systemState.nodes.find(n => n.id === nodeId);
    while (cur && cur.parentContainerId) {
        if (cur.parentContainerId === potentialAncestorId) return true;
        cur = systemState.nodes.find(n => n.id === cur.parentContainerId);
    }
    return false;
}

function addToContext(nodeId, contextId) {
    const n = systemState.nodes.find(node => node.id === nodeId);
    const p = systemState.nodes.find(node => node.id === contextId);
    if (n && p) {
        if (n.isContainer) {
            const dx = (p.x + 45) - n.x;
            const dy = (p.y + 60) - n.y;
            pushContainer(n.id, dx, dy, new Set(), true);
        } else {
            n.x = p.x + 45;
            n.y = p.y + 60;
        }
        n.parentContainerId = p.id;
        AudioFX.play('snap');
        enforcePhysics();
        renderSubsystemsTopologyCanvas();
        saveState();
    }
}

function exitContext(nodeId) {
    const n = systemState.nodes.find(node => node.id === nodeId);
    if (!n) return;
    let p = n.parentContainerId ? systemState.nodes.find(node => node.id === n.parentContainerId) : null;
    if (!p) {
        const el = document.getElementById(n.id), nw = el ? el.offsetWidth : (n.width || 140), nh = el ? el.offsetHeight : (n.height || 65), cx = n.x + nw / 2, cy = n.y + nh / 2;
        p = systemState.nodes.find(cnt => cnt.isContainer && cnt.id !== n.id && cx >= cnt.x && cx <= cnt.x + (cnt.width || 480) && cy >= cnt.y && cy <= cnt.y + (cnt.height || 320));
    }
    if (p) {
        const el = document.getElementById(n.id), nw = el ? el.offsetWidth : (n.width || 140), nh = el ? el.offsetHeight : (n.height || 65), pw = p.width || 480, ph = p.height || 320, buffer = 60;
        const opts = [{ dir: 'L', val: p.x - nw - buffer, diff: (n.x + nw) - p.x },{ dir: 'R', val: p.x + pw + buffer, diff: (p.x + pw) - n.x },{ dir: 'T', val: p.y - nh - buffer, diff: (n.y + nh) - p.y },{ dir: 'B', val: p.y + ph + buffer, diff: (p.y + ph) - n.y }];
        opts.sort((a, b) => a.diff - b.diff); const best = opts[0];
        
        let newX = n.x, newY = n.y;
        if (best.dir === 'L' || best.dir === 'R') newX = best.val; else newY = best.val;
        const dx = newX - n.x;
        const dy = newY - n.y;
        
        // Move container n and all its descendants by the delta!
        pushContainer(n.id, dx, dy, new Set(), true);
        
        n.parentContainerId = null; AudioFX.play('exit');
        if (el) { el.classList.add('pop-out-anim'); setTimeout(() => el.classList.remove('pop-out-anim'), 500); }
        enforcePhysics(); renderSubsystemsTopologyCanvas(); saveState();
    }
}

function autoParentNodes() { 
    systemState.nodes.forEach(node => { 
        if (!node.isContainer && !node.parentContainerId) { 
            const cel = document.getElementById(node.id), nw = cel ? cel.offsetWidth : (node.width || 140), nh = cel ? cel.offsetHeight : (node.height || 65), cx = node.x + nw / 2, cy = node.y + nh / 2;
            const p = systemState.nodes.find(p => p.isContainer && p.id !== node.id && cx >= p.x && cx <= p.x + (p.width || 480) && cy >= p.y && cy <= p.y + (p.height || 320)); 
            if (p) node.parentContainerId = p.id; 
        } 
    }); 
}

function enforcePhysics() {
    systemState.nodes.forEach(node => {
        if (node.isContainer) return;
        const cel = document.getElementById(node.id), nw = cel ? cel.offsetWidth : (node.width || 140), nh = cel ? cel.offsetHeight : (node.height || 65);
        if (!node.parentContainerId) {
            systemState.nodes.forEach(p => {
                if (p.isContainer && p.id !== node.id) {
                    const pw = p.width || 480, ph = p.height || 320, buffer = 15;
                    const overlapX = (node.x + nw > p.x) && (node.x < p.x + pw), overlapY = (node.y + nh > p.y) && (node.y < p.y + ph);
                    if (overlapX && overlapY) {
                        const distLeft = p.x - nw - buffer, distRight = p.x + pw + buffer, distTop = p.y - nh - buffer, distBottom = p.y + ph + buffer;
                        const opts = [{ dir: 'L', val: distLeft, diff: Math.abs(distLeft - node.x) },{ dir: 'R', val: distRight, diff: Math.abs(distRight - node.x) },{ dir: 'T', val: distTop, diff: Math.abs(distTop - node.y) },{ dir: 'B', val: distBottom, diff: Math.abs(distBottom - node.y) }];
                        opts.sort((a, b) => a.diff - b.diff); const best = opts[0];
                        if (best.dir === 'L' || best.dir === 'R') node.x = best.val; else node.y = best.val;
                    }
                }
            });
        }
    });
}

// --- 5. Persistence ---
function saveState() { localStorage.setItem('ddd_model_state', JSON.stringify({ nodes: systemState.nodes, connections: systemState.connections, sketches: systemState.sketches, zoom: systemState.zoom, panX: systemState.panX, panY: systemState.panY, sketchToolbarVisible: systemState.sketchToolbarVisible, sketchSettings: systemState.sketchSettings })); }
function loadState() {
    const saved = localStorage.getItem('ddd_model_state');
    if (saved) {
        try {
            const s = JSON.parse(saved); systemState.nodes = s.nodes || []; systemState.connections = s.connections || []; systemState.sketches = s.sketches || []; systemState.zoom = s.zoom || 1.0; systemState.panX = s.panX || 0; systemState.panY = s.panY || 0; systemState.sketchToolbarVisible = s.sketchToolbarVisible || false; 
            if (s.sketchSettings) systemState.sketchSettings = s.sketchSettings;
            return true;
        } catch(e) { console.error("Load state failed", e); }
    }
    return false;
}

// --- 6. Interaction Helpers ---
function collectDescendantNodeIds(parentId, collected = new Set()) {
    systemState.nodes.forEach(node => {
        if (node.parentContainerId === parentId && !collected.has(node.id)) {
            collected.add(node.id);
            collectDescendantNodeIds(node.id, collected);
        }
    });
    return collected;
}

function deleteSelectedObject(id, type) {
    if (type === 'node') {
        const deletedNodeIds = collectDescendantNodeIds(id);
        deletedNodeIds.add(id);
        const deletedConnectionIds = new Set(
            systemState.connections
                .filter(c => deletedNodeIds.has(c.from) || deletedNodeIds.has(c.to))
                .map(c => c.id)
        );
        systemState.nodes = systemState.nodes.filter(n => !deletedNodeIds.has(n.id));
        systemState.connections = systemState.connections.filter(c => !deletedNodeIds.has(c.from) && !deletedNodeIds.has(c.to));
        systemState.selectedIds = systemState.selectedIds.filter(sid => !deletedNodeIds.has(sid) && !deletedConnectionIds.has(sid));
        AudioFX.play('trash');
    }
    else if (type === 'sketch') { systemState.sketches = systemState.sketches.filter(s => s.id !== id); AudioFX.play('trash'); }
    else { systemState.connections = systemState.connections.filter(c => c.id !== id); }
    systemState.selectedIds = systemState.selectedIds.filter(sid => sid !== id);
    renderSubsystemsTopologyCanvas(); saveState();
}

function openInspector(id, type) {
    systemState.selectedIds = [id]; const panel = document.getElementById('floating-prop-panel');
    if (panel) panel.classList.add('active');
    updatePropertiesPanel();
}

function setInteractionMode(mode) {
    systemState.interactionMode = mode; document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('tool-' + mode), sbtn = document.getElementById('tool-s-' + mode);
    if (btn) btn.classList.add('active'); if (sbtn) sbtn.classList.add('active');
    const container = document.getElementById('canvas-container');
    if (mode === 'pan') container.style.cursor = 'grab';
    else if (mode === 'select' || ['pencil', 'rect', 'circle', 'diamond', 'arrow', 'dline', 'text'].includes(mode)) container.style.cursor = 'crosshair';
    else if (mode === 'eraser') container.style.cursor = 'cell';
    else container.style.cursor = 'default';
}

function updateSketchToolbarVisibility() {
    const container = document.getElementById('sketch-toolbar-container'); if (container) container.style.display = systemState.sketchToolbarVisible ? 'flex' : 'none';
    const btn = document.getElementById('btn-toggle-sketch'); if (btn) btn.classList.toggle('active', systemState.sketchToolbarVisible);
}

function getLayoutSize(node) {
    const el = document.getElementById(node.id);
    if (node.isContainer) {
        return {
            w: Math.max(480, node.width || 480),
            h: Math.max(320, node.height || 320)
        };
    }
    return {
        w: Math.max(node.type === 'icon-only' ? 80 : 160, el ? el.offsetWidth : (node.width || 160)),
        h: Math.max(node.type === 'icon-only' ? 80 : 80, el ? el.offsetHeight : (node.height || 80))
    };
}

function moveDescendants(nodeId, dx, dy) {
    systemState.nodes.forEach(node => {
        if (node.parentContainerId === nodeId) {
            node.x += dx;
            node.y += dy;
            moveDescendants(node.id, dx, dy);
        }
    });
}

function moveLayoutItem(node, x, y) {
    const dx = x - node.x;
    const dy = y - node.y;
    node.x = x;
    node.y = y;
    if (node.isContainer) moveDescendants(node.id, dx, dy);
}

function detectFlowDirection() {
    let horizontalPorts = 0;
    let verticalPorts = 0;
    systemState.connections.forEach(conn => {
        if (['left', 'right'].includes(conn.fromPort) || ['left', 'right'].includes(conn.toPort)) {
            horizontalPorts++;
        }
        if (['top', 'bottom'].includes(conn.fromPort) || ['top', 'bottom'].includes(conn.toPort)) {
            verticalPorts++;
        }
    });
    return horizontalPorts >= verticalPorts;
}

function layoutFlow(items, startX, startY, gapX, gapY, isHorizontal) {
    if (items.length === 0) return { w: 0, h: 0 };

    // 1. Build adjacency list of dependencies among items
    const itemIds = items.map(item => item.node.id);
    const itemMap = {};
    items.forEach(item => {
        itemMap[item.node.id] = item;
    });

    // Get all descendant node IDs + self for each item
    const itemDescendants = {};
    items.forEach(item => {
        itemDescendants[item.node.id] = getDescendantsAndSelf(item.node);
    });

    function getDescendantsAndSelf(node) {
        if (node.isContainer) {
            const desc = Array.from(collectDescendantNodeIds(node.id));
            desc.push(node.id);
            return desc;
        }
        return [node.id];
    }

    const adj = new Map();
    itemIds.forEach(id => adj.set(id, []));

    for (let i = 0; i < items.length; i++) {
        for (let j = 0; j < items.length; j++) {
            if (i === j) continue;
            const uId = items[i].node.id;
            const vId = items[j].node.id;

            const uNodes = itemDescendants[uId];
            const vNodes = itemDescendants[vId];

            // Check if there is a connection from u's descendants to v's descendants
            const connected = systemState.connections.some(conn =>
                uNodes.includes(conn.from) && vNodes.includes(conn.to)
            );

            if (connected) {
                adj.get(uId).push(vId);
            }
        }
    }

    // 2. Cycle breaking and topological sort using DFS
    const visited = new Set();
    const tempStack = new Set();
    const order = [];
    const backEdges = new Set();

    function dfs(uId) {
        visited.add(uId);
        tempStack.add(uId);

        const neighbors = adj.get(uId) || [];
        for (const vId of neighbors) {
            if (tempStack.has(vId)) {
                backEdges.add(`${uId}->${vId}`);
            } else if (!visited.has(vId)) {
                dfs(vId);
            }
        }

        tempStack.delete(uId);
        order.push(uId);
    }

    itemIds.forEach(id => {
        if (!visited.has(id)) {
            dfs(id);
        }
    });
    order.reverse();

    // 3. Compute longest path ranks (layers)
    const rank = {};
    itemIds.forEach(id => { rank[id] = 0; });

    order.forEach(uId => {
        const neighbors = adj.get(uId) || [];
        neighbors.forEach(vId => {
            if (!backEdges.has(`${uId}->${vId}`)) {
                rank[vId] = Math.max(rank[vId], rank[uId] + 1);
            }
        });
    });

    // Group items by rank
    const rankGroups = {};
    items.forEach(item => {
        const r = rank[item.node.id];
        if (!rankGroups[r]) rankGroups[r] = [];
        rankGroups[r].push(item);
    });

    const sortedRanks = Object.keys(rankGroups).map(Number).sort((a, b) => a - b);
    const layers = sortedRanks.map(r => rankGroups[r]);

    // Sort items within each layer for stable rendering
    layers.forEach(layer => {
        layer.sort((a, b) =>
            Number(b.node.isContainer || false) - Number(a.node.isContainer || false) ||
            (a.node.label || '').localeCompare(b.node.label || '')
        );
    });

    // 4. Position items based on flow direction
    if (isHorizontal) {
        // Left-to-Right Layout
        // Calculate dimensions of each column (layer)
        const colWidths = layers.map(layer => Math.max(...layer.map(item => item.size.w)));
        const colHeights = layers.map(layer =>
            layer.reduce((sum, item) => sum + item.size.h, 0) + (layer.length - 1) * gapY
        );

        const maxColHeight = Math.max(...colHeights, 0);

        // Position items
        let currentX = startX;
        for (let c = 0; c < layers.length; c++) {
            const layer = layers[c];
            const startYOffset = (maxColHeight - colHeights[c]) / 2;
            let currentY = startY + startYOffset;

            for (let i = 0; i < layer.length; i++) {
                const item = layer[i];
                // Move item and its descendants
                moveLayoutItem(item.node, currentX, currentY);
                currentY += item.size.h + gapY;
            }
            currentX += colWidths[c] + gapX;
        }

        return {
            w: currentX - startX - (layers.length > 0 ? gapX : 0),
            h: maxColHeight
        };
    } else {
        // Top-to-Bottom Layout
        // Calculate dimensions of each row (layer)
        const rowHeights = layers.map(layer => Math.max(...layer.map(item => item.size.h)));
        const rowWidths = layers.map(layer =>
            layer.reduce((sum, item) => sum + item.size.w, 0) + (layer.length - 1) * gapX
        );

        const maxRowWidth = Math.max(...rowWidths, 0);

        // Position items
        let currentY = startY;
        for (let r = 0; r < layers.length; r++) {
            const layer = layers[r];
            const startXOffset = (maxRowWidth - rowWidths[r]) / 2;
            let currentX = startX + startXOffset;

            for (let i = 0; i < layer.length; i++) {
                const item = layer[i];
                // Move item and its descendants
                moveLayoutItem(item.node, currentX, currentY);
                currentX += item.size.w + gapX;
            }
            currentY += rowHeights[r] + gapY;
        }

        return {
            w: maxRowWidth,
            h: currentY - startY - (layers.length > 0 ? gapY : 0)
        };
    }
}

function layoutContainerInterior(container) {
    const INNER_PAD = 46;
    const HEADER_CLEARANCE = 64;
    const CHILD_GAP_X = 54;
    const CHILD_GAP_Y = 44;
    const MIN_W = 480;
    const MIN_H = 320;

    const children = systemState.nodes
        .filter(node => node.parentContainerId === container.id)
        .sort((a, b) => Number(b.isContainer) - Number(a.isContainer) || (a.label || '').localeCompare(b.label || ''));

    children.forEach(child => {
        if (child.isContainer) layoutContainerInterior(child);
    });

    if (children.length === 0) {
        container.width = Math.max(MIN_W, container.width || MIN_W);
        container.height = Math.max(MIN_H, container.height || MIN_H);
        return getLayoutSize(container);
    }

    const items = children.map(child => ({ node: child, size: getLayoutSize(child) }));
    const isHorizontal = detectFlowDirection();
    const used = layoutFlow(items, container.x + INNER_PAD, container.y + HEADER_CLEARANCE, CHILD_GAP_X, CHILD_GAP_Y, isHorizontal);

    container.width = Math.max(MIN_W, used.w + INNER_PAD * 2);
    container.height = Math.max(MIN_H, used.h + HEADER_CLEARANCE + INNER_PAD);
    return getLayoutSize(container);
}

function tidyCanvas() {
    const START_X = 100;
    const START_Y = 100;
    const STRUCTURAL_GAP_X = 100;
    const STRUCTURAL_GAP_Y = 90;

    // Check if there is an active selection
    const selectedNodes = systemState.nodes.filter(n => systemState.selectedIds.includes(n.id));

    if (selectedNodes.length > 0) {
        // Collect starting node IDs (selected nodes and all their descendants if containers)
        const startNodeIds = new Set();
        selectedNodes.forEach(node => {
            startNodeIds.add(node.id);
            if (node.isContainer) {
                collectDescendantNodeIds(node.id).forEach(id => startNodeIds.add(id));
            }
        });

        // Traverse downstream connections to find reachable nodes
        const L = new Set(startNodeIds);
        let queue = Array.from(startNodeIds);
        while (queue.length > 0) {
            const currentId = queue.shift();
            const outgoing = systemState.connections.filter(c => c.from === currentId);
            outgoing.forEach(c => {
                if (!L.has(c.to)) {
                    L.add(c.to);
                    queue.push(c.to);
                    const targetNode = systemState.nodes.find(n => n.id === c.to);
                    if (targetNode && targetNode.isContainer) {
                        collectDescendantNodeIds(targetNode.id).forEach(id => {
                            if (!L.has(id)) {
                                L.add(id);
                                queue.push(id);
                            }
                        });
                    }
                }
            });
        }

        // Nodes to position (reachable nodes minus the start nodes, which remain fixed)
        const P = new Set(L);
        startNodeIds.forEach(id => P.delete(id));

        if (P.size === 0) {
            // Nothing to tidy downstream
            AudioFX.play('snap');
            return;
        }

        // Calculate distance ranks from start nodes using longest path propagation
        queue = Array.from(startNodeIds);
        const dist = {};
        L.forEach(id => { dist[id] = startNodeIds.has(id) ? 0 : -1; });

        while (queue.length > 0) {
            const u = queue.shift();
            const outgoing = systemState.connections.filter(c => c.from === u && L.has(c.to));
            outgoing.forEach(c => {
                const v = c.to;
                if (dist[u] + 1 > dist[v]) {
                    dist[v] = dist[u] + 1;
                    queue.push(v);
                }
            });
        }

        // Calculate start nodes bounding box to find positioning baseline
        let startMinX = Infinity, startMinY = Infinity, startMaxX = -Infinity, startMaxY = -Infinity;
        systemState.nodes.forEach(node => {
            if (startNodeIds.has(node.id)) {
                const size = getLayoutSize(node);
                startMinX = Math.min(startMinX, node.x);
                startMinY = Math.min(startMinY, node.y);
                startMaxX = Math.max(startMaxX, node.x + size.w);
                startMaxY = Math.max(startMaxY, node.y + size.h);
            }
        });

        // Group P by rank (dist)
        const rankGroups = {};
        systemState.nodes.forEach(node => {
            if (P.has(node.id)) {
                const r = dist[node.id] > 0 ? dist[node.id] : 1;
                if (!rankGroups[r]) rankGroups[r] = [];
                rankGroups[r].push(node);
            }
        });

        const sortedRanks = Object.keys(rankGroups).map(Number).sort((a, b) => a - b);
        const isHorizontal = detectFlowDirection();

        if (isHorizontal) {
            // Layout downstream columns to the right of start nodes, centered vertically
            const startCenterY = startMinY + (startMaxY - startMinY) / 2;
            let currentX = startMaxX + STRUCTURAL_GAP_X;

            sortedRanks.forEach(r => {
                const layerNodes = rankGroups[r];
                const layerItems = layerNodes.map(node => ({ node, size: getLayoutSize(node) }));
                layerItems.sort((a, b) =>
                    Number(b.node.isContainer || false) - Number(a.node.isContainer || false) ||
                    (a.node.label || '').localeCompare(b.node.label || '')
                );

                const colHeight = layerItems.reduce((sum, item) => sum + item.size.h, 0) + (layerItems.length - 1) * STRUCTURAL_GAP_Y;
                let currentY = startCenterY - colHeight / 2;
                const colWidth = Math.max(...layerItems.map(item => item.size.w), 0);

                layerItems.forEach(item => {
                    moveLayoutItem(item.node, currentX, currentY);
                    currentY += item.size.h + STRUCTURAL_GAP_Y;
                });
                currentX += colWidth + STRUCTURAL_GAP_X;
            });
        } else {
            // Layout downstream rows below start nodes, centered horizontally
            const startCenterX = startMinX + (startMaxX - startMinX) / 2;
            let currentY = startMaxY + STRUCTURAL_GAP_Y;

            sortedRanks.forEach(r => {
                const layerNodes = rankGroups[r];
                const layerItems = layerNodes.map(node => ({ node, size: getLayoutSize(node) }));
                layerItems.sort((a, b) =>
                    Number(b.node.isContainer || false) - Number(a.node.isContainer || false) ||
                    (a.node.label || '').localeCompare(b.node.label || '')
                );

                const rowWidth = layerItems.reduce((sum, item) => sum + item.size.w, 0) + (layerItems.length - 1) * STRUCTURAL_GAP_X;
                let currentX = startCenterX - rowWidth / 2;
                const rowHeight = Math.max(...layerItems.map(item => item.size.h), 0);

                layerItems.forEach(item => {
                    moveLayoutItem(item.node, currentX, currentY);
                    currentX += item.size.w + STRUCTURAL_GAP_X;
                });
                currentY += rowHeight + STRUCTURAL_GAP_Y;
            });
        }

        // Tidy interior of downstream containers
        systemState.nodes.forEach(node => {
            if (P.has(node.id) && node.isContainer) {
                layoutContainerInterior(node);
            }
        });

        autoParentNodes(); enforcePhysics();
        renderSubsystemsTopologyCanvas(); saveState(); AudioFX.play('snap');
        return;
    }

    // Default global canvas tidy
    const rootNodes = systemState.nodes
        .filter(node => !node.parentContainerId)
        .sort((a, b) => Number(b.isContainer) - Number(a.isContainer) || (a.label || '').localeCompare(b.label || ''));

    rootNodes.forEach(node => {
        if (node.isContainer) layoutContainerInterior(node);
    });

    const items = rootNodes.map(node => ({ node, size: getLayoutSize(node) }));
    const isHorizontal = detectFlowDirection();
    layoutFlow(items, START_X, START_Y, STRUCTURAL_GAP_X, STRUCTURAL_GAP_Y, isHorizontal);

    autoParentNodes(); enforcePhysics();
    renderSubsystemsTopologyCanvas(); saveState(); AudioFX.play('snap');
}

function clearCanvas() {
    systemState.nodes = [];
    systemState.connections = [];
    systemState.sketches = [];
    systemState.activeSketch = null;
    systemState.selectedIds = [];
    systemState.draggedItemData = null;
    systemState.zoom = 1.0;
    systemState.panX = 0;
    systemState.panY = 0;

    const menu = document.getElementById('context-menu');
    if (menu) menu.style.display = 'none';

    const marquee = document.getElementById('selection-marquee');
    if (marquee) marquee.style.display = 'none';

    const panel = document.getElementById('floating-prop-panel');
    if (panel) panel.classList.remove('active');

    renderSubsystemsTopologyCanvas();
    saveState();
}

function showGlobalSelectionHUD() {
    let hud = document.getElementById('global-selection-hud');
    if (systemState.selectedIds.length <= 1) { if (hud) hud.remove(); return; }
    if (!hud) {
        hud = document.createElement('div'); hud.id = 'global-selection-hud';
        hud.className = 'selection-hud';
        hud.innerHTML = `<span class="hud-count"></span> items selected <button class="btn-icon-small hud-del"><i class="fa-solid fa-trash"></i></button>`;
        document.body.appendChild(hud);
    }
    const countSpan = hud.querySelector('.hud-count'); if (countSpan) countSpan.textContent = systemState.selectedIds.length;
    hud.querySelector('.hud-del').onclick = () => {
        if (confirm(`Delete ${systemState.selectedIds.length} selected items?`)) {
            const ids = [...systemState.selectedIds];
            ids.forEach(id => {
                if (systemState.nodes.find(n => n.id === id)) deleteSelectedObject(id, 'node');
                else if (systemState.connections.find(c => c.id === id)) deleteSelectedObject(id, 'wire');
                else if (systemState.sketches.find(s => s.id === id)) deleteSelectedObject(id, 'sketch');
            });
            systemState.selectedIds = []; renderSubsystemsTopologyCanvas();
        }
    };
    // Position HUD above the selection center
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    systemState.selectedIds.forEach(id => {
        const el = document.getElementById(id); if (!el) return;
        const r = el.getBoundingClientRect(); minX = Math.min(minX, r.left); minY = Math.min(minY, r.top); maxX = Math.max(maxX, r.right); maxY = Math.max(maxY, r.bottom);
    });
    hud.style.left = (minX + (maxX - minX) / 2 - 80) + 'px'; hud.style.top = (minY - 50) + 'px';
}

function openInlineTextEditor(id, type) {
    const el = document.getElementById(id);
    let targetObj = type === 'node' ? systemState.nodes.find(n => n.id === id) : systemState.sketches.find(s => s.id === id);
    if (!targetObj) return;

    const overlay = document.createElement('div');
    overlay.style.position = 'fixed'; overlay.style.top = '0'; overlay.style.left = '0'; overlay.style.width = '100%'; overlay.style.height = '100%'; overlay.style.zIndex = '9999';
    const input = document.createElement('textarea');
    input.className = 'inline-text-editor';
    input.value = type === 'node' ? targetObj.label : targetObj.text;
    
    const rect = el ? el.getBoundingClientRect() : { top: targetObj.y, left: targetObj.x, width: 200, height: 40 };
    input.style.top = rect.top + 'px'; input.style.left = rect.left + 'px'; input.style.width = rect.width + 'px'; input.style.height = Math.max(40, rect.height) + 'px';
    
    overlay.appendChild(input); document.body.appendChild(overlay);
    input.focus(); input.select();

    const save = () => {
        if (type === 'node') targetObj.label = input.value; else targetObj.text = input.value;
        renderSubsystemsTopologyCanvas(); saveState(); cleanup();
    };
    const cleanup = () => { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); };
    input.onblur = save;
    input.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); } if (e.key === 'Escape') cleanup(); };
}

// --- 7. Initialization ---
function initApp() {
    initLeftDrawerTabStripSelectors(); initCanvasEvents(); initPaletteEvents(); initThemeEngine(); initModals(); 
    initPropertiesEditor(); initContextMenu(); initCustomPalette(); initIconPicker(); 
    initInteractionToolbar();

    makeDraggable(document.getElementById('floating-prop-panel'), document.getElementById('floating-prop-handle'));
    
    const sketchSvg = document.getElementById('svg-sketch-layer'); 
    if (sketchSvg && typeof rough !== 'undefined') roughCanvas = rough.svg(sketchSvg);
    
    if (loadState()) { 
        autoParentNodes(); enforcePhysics(); updateSketchToolbarVisibility(); 
    } else { 
        updateSketchToolbarVisibility(); 
    }
    
    renderSubsystemsTopologyCanvas();

    window.addEventListener('keydown', (e) => {
        if (['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) return;
        if (e.key === 'Delete' || e.key === 'Backspace') {
            systemState.selectedIds.forEach(id => {
                if (systemState.nodes.find(n => n.id === id)) deleteSelectedObject(id, 'node');
                else if (systemState.connections.find(c => c.id === id)) deleteSelectedObject(id, 'wire');
                else if (systemState.sketches.find(s => s.id === id)) deleteSelectedObject(id, 'sketch');
            });
        }
        if (e.key === 'v' || e.key === 'V') setInteractionMode('move');
        if (e.key === 'h' || e.key === 'H') setInteractionMode('pan');
        if (e.key === 'm' || e.key === 'M') setInteractionMode('select');
        if (e.key === 'p' || e.key === 'P') setInteractionMode('pencil');
        if (e.key === 'r' || e.key === 'R') setInteractionMode('rect');
        if (e.key === 'c' || e.key === 'C') setInteractionMode('circle');
        if (e.key === 'd' || e.key === 'D') setInteractionMode('diamond');
        if (e.key === 'a' || e.key === 'A') setInteractionMode('arrow');
        if (e.key === 'l' || e.key === 'L') setInteractionMode('dline');
        if (e.key === 't' || e.key === 'T') setInteractionMode('text');
        if (e.key === 'e' || e.key === 'E') setInteractionMode('eraser');
    });
}

function initLeftDrawerTabStripSelectors() { 
    document.querySelectorAll('.tab-btn').forEach(btn => { 
        btn.onclick = () => { 
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active')); 
            document.querySelectorAll('.palette-viewport').forEach(p => p.classList.remove('active')); 
            btn.classList.add('active'); 
            const target = document.getElementById(btn.dataset.target); if (target) target.classList.add('active'); 
        }; 
    }); 
}

function initCanvasEvents() {
    const container = document.getElementById('canvas-container');
    container.onwheel = (e) => { e.preventDefault(); const delta = e.deltaY > 0 ? 0.9 : 1.1; systemState.zoom = Math.max(0.1, Math.min(3.0, systemState.zoom * delta)); renderSubsystemsTopologyCanvas(); };
    container.onmousedown = (e) => {
        if (e.target.id === 'canvas-container' || e.target.id === 'canvas-surface' || e.target.tagName === 'svg' || e.target.closest('#svg-sketch-layer')) {
            const rect = container.getBoundingClientRect(), sx = (e.clientX - rect.left - systemState.panX) / systemState.zoom, sy = (e.clientY - rect.top - systemState.panY) / systemState.zoom;
            if (systemState.interactionMode === 'pan' || e.button === 1) {
                const ox = systemState.panX, oy = systemState.panY, msx = e.clientX, msy = e.clientY;
                const mm = (me) => { systemState.panX = ox + (me.clientX - msx); systemState.panY = oy + (me.clientY - msy); renderSubsystemsTopologyCanvas(true); };
                const mu = () => { window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', mu); };
                window.addEventListener('mousemove', mm); window.addEventListener('mouseup', mu);
            } else if (systemState.interactionMode === 'select' || (systemState.interactionMode === 'move' && e.target.id === 'canvas-surface')) {
                const marquee = document.getElementById('selection-marquee'); marquee.style.display = 'block';
                const mm = (me) => { const x = Math.min(e.clientX, me.clientX), y = Math.min(e.clientY, me.clientY), w = Math.abs(e.clientX - me.clientX), h = Math.abs(e.clientY - me.clientY); marquee.style.left = x + 'px'; marquee.style.top = y + 'px'; marquee.style.width = w + 'px'; marquee.style.height = h + 'px'; };
                const mu = (me) => { 
                    marquee.style.display = 'none'; const r = marquee.getBoundingClientRect(); systemState.selectedIds = []; 
                    systemState.nodes.forEach(n => {
                        const el = document.getElementById(n.id); if (el) { const nr = el.getBoundingClientRect(); if (nr.left <= r.right && nr.right >= r.left && nr.top <= r.bottom && nr.bottom >= r.top) { systemState.selectedIds.push(n.id); } }
                    }); 
                    systemState.sketches.forEach(s => {
                        let x1, x2, y1, y2;
                        if (s.type === 'pencil') { x1 = Math.min(...s.points.map(p => p.x)); x2 = Math.max(...s.points.map(p => p.x)); y1 = Math.min(...s.points.map(p => p.y)); y2 = Math.max(...s.points.map(p => p.y)); }
                        else if (s.type === 'arrow' || s.type === 'dline') { x1 = Math.min(s.x1, s.x2); x2 = Math.max(s.x1, s.x2); y1 = Math.min(s.y1, s.y2); y2 = Math.max(s.y1, s.y2); }
                        else { x1 = Math.min(s.x, s.x + (s.w||0)); x2 = Math.max(s.x, s.x + (s.w||0)); y1 = Math.min(s.y, s.y + (s.h||0)); y2 = Math.max(s.y, s.y + (s.h||0)); }
                        const mX1 = (r.left - rect.left - systemState.panX) / systemState.zoom, mX2 = (r.right - rect.left - systemState.panX) / systemState.zoom, mY1 = (r.top - rect.top - systemState.panY) / systemState.zoom, mY2 = (r.bottom - rect.top - systemState.panY) / systemState.zoom;
                        if ((x1 <= mX2) && (x2 >= mX1) && (y1 <= mY2) && (y2 >= mY1)) systemState.selectedIds.push(s.id);
                    });
                    renderSubsystemsTopologyCanvas(); window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', mu); 
                };
                window.addEventListener('mousemove', mm); window.addEventListener('mouseup', mu);
            } else if (['pencil', 'rect', 'circle', 'diamond', 'arrow', 'dline'].includes(systemState.interactionMode)) {
                let sketch = { id: 's_' + Date.now(), type: systemState.interactionMode, color: systemState.sketchSettings.color, strokeWidth: parseInt(systemState.sketchSettings.width), style: systemState.sketchSettings.style, pattern: systemState.sketchSettings.pattern, animated: systemState.sketchSettings.animated };
                if (sketch.type === 'pencil') sketch.points = [{x: sx, y: sy}]; else { sketch.x = sx; sketch.y = sy; sketch.w = 0; sketch.h = 0; sketch.x1 = sx; sketch.y1 = sy; sketch.x2 = sx; sketch.y2 = sy; }
                const mm = (me) => { 
                    const cx = (me.clientX - rect.left - systemState.panX) / systemState.zoom, cy = (me.clientY - rect.top - systemState.panY) / systemState.zoom; 
                    if (sketch.type === 'pencil') sketch.points.push({x: cx, y: cy}); else { sketch.w = cx - sx; sketch.h = cy - sy; sketch.x2 = cx; sketch.y2 = cy; } 
                    systemState.activeSketch = sketch; renderSubsystemsTopologyCanvas(true); 
                };
                const mu = () => { if (systemState.activeSketch) { systemState.sketches.push(systemState.activeSketch); systemState.activeSketch = null; saveState(); renderSubsystemsTopologyCanvas(); } window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', mu); };
                window.addEventListener('mousemove', mm); window.addEventListener('mouseup', mu);
            } else if (systemState.interactionMode === 'text') {
                const txt = prompt("Enter text:"); if (txt) { systemState.sketches.push({ id: 's_' + Date.now(), type: 'text', x: sx, y: sy, text: txt, color: systemState.sketchSettings.color, fontSize: 20, style: systemState.sketchSettings.style }); saveState(); renderSubsystemsTopologyCanvas(); }
            } else if (systemState.interactionMode === 'eraser') {
                const mm = (me) => {
                    const cx = (me.clientX - rect.left - systemState.panX) / systemState.zoom, cy = (me.clientY - rect.top - systemState.panY) / systemState.zoom;
                    systemState.sketches = systemState.sketches.filter(s => {
                        if (s.type === 'rect' || s.type === 'diamond' || s.type === 'circle') { return !(cx >= Math.min(s.x, s.x+s.w) - 15 && cx <= Math.max(s.x, s.x+s.w) + 15 && cy >= Math.min(s.y, s.y+s.h) - 15 && cy <= Math.max(s.y, s.y+s.h) + 15); }
                        if (s.type === 'pencil') { return !s.points.some(p => Math.sqrt((p.x-cx)**2 + (p.y-cy)**2) < 25); }
                        if (s.type === 'arrow' || s.type === 'dline') { return ! (Math.sqrt((s.x1-cx)**2 + (s.y1-cy)**2) < 25 || Math.sqrt((s.x2-cx)**2 + (s.y2-cy)**2) < 25); }
                        if (s.type === 'text') { return !(cx >= s.x && cx <= s.x + 100 && cy >= s.y - 20 && cy <= s.y); }
                        return true;
                    });
                    renderSubsystemsTopologyCanvas(true);
                };
                const mu = () => { saveState(); window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', mu); };
                window.addEventListener('mousemove', mm); window.addEventListener('mouseup', mu);
            } else if (systemState.interactionMode === 'move') {
                const startX = e.clientX, startY = e.clientY;
                const sketchDragStates = systemState.sketches.filter(s => systemState.selectedIds.includes(s.id)).map(s => ({ s, ox: s.x, oy: s.y, ox1: s.x1, oy1: s.y1, ox2: s.x2, oy2: s.y2, oPoints: s.points ? JSON.parse(JSON.stringify(s.points)) : null }));
                if (sketchDragStates.length > 0) {
                    const mm = (me) => {
                        const dx = (me.clientX - startX) / systemState.zoom, dy = (me.clientY - startY) / systemState.zoom;
                        sketchDragStates.forEach(ds => { if (ds.s.type === 'pencil') ds.s.points = ds.oPoints.map(p => ({ x: p.x + dx, y: p.y + dy })); else if (ds.s.type === 'arrow' || ds.s.type === 'dline') { ds.s.x1 = ds.ox1 + dx; ds.s.y1 = ds.oy1 + dy; ds.s.x2 = ds.ox2 + dx; ds.s.y2 = ds.oy2 + dy; } else { ds.s.x = ds.ox + dx; ds.s.y = ds.oy + dy; } });
                        renderSubsystemsTopologyCanvas(true);
                    };
                    const mu = () => { saveState(); window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', mu); };
                    window.addEventListener('mousemove', mm); window.addEventListener('mouseup', mu);
                }
            } else { systemState.selectedIds = []; renderSubsystemsTopologyCanvas(); }
        }
    };
    container.ondragover = (e) => e.preventDefault();
    container.ondrop = (e) => {
        e.preventDefault(); const data = systemState.draggedItemData; if (!data) return;
        const rect = container.getBoundingClientRect(), x = (e.clientX - rect.left - systemState.panX) / systemState.zoom, y = (e.clientY - rect.top - systemState.panY) / systemState.zoom;
        const newNode = { id: 'n_' + Date.now(), ...data, x: Math.round(x/10)*10, y: Math.round(y/10)*10, fields: [] };
        systemState.nodes.push(newNode); autoParentNodes(); systemState.selectedIds = [newNode.id]; renderSubsystemsTopologyCanvas(); saveState(); AudioFX.play('drop');
    };
}

function initPaletteEvents() { 
    document.querySelectorAll('.palette-item').forEach(item => { 
        item.ondragstart = () => { 
            systemState.draggedItemData = { type: item.dataset.type, icon: item.dataset.icon, label: item.dataset.label, color: item.dataset.color, isContainer: item.dataset.type === 'actor-home', editorType: item.dataset.editorType }; 
        }; 
    }); 
}

function initThemeEngine() { 
    const sel = document.getElementById('theme-selector'); 
    if (sel) { 
        sel.onchange = () => { 
            document.body.className = sel.value === 'default' ? '' : `theme-${sel.value}`; systemState.activeTheme = sel.value; saveState(); 
        }; 
    } 
}

function initModals() {
    const modals = { templates: document.getElementById('templates-modal'), code: document.getElementById('code-modal'), help: document.getElementById('help-modal'), icon: document.getElementById('icon-picker-modal'), confirm: document.getElementById('confirm-modal') };
    document.getElementById('btn-open-templates').onclick = () => modals.templates.classList.add('open');
    document.getElementById('btn-open-code').onclick = () => { modals.code.classList.add('open'); document.getElementById('topology-code-area').value = JSON.stringify({nodes: systemState.nodes, connections: systemState.connections, sketches: systemState.sketches}, null, 4); };
    document.getElementById('btn-open-help').onclick = () => modals.help.classList.add('open');
    
    document.querySelectorAll('.help-nav-item').forEach(item => {
        item.onclick = () => {
            document.querySelectorAll('.help-nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            const target = document.getElementById(item.dataset.target);
            if (target) { document.querySelectorAll('.help-topic').forEach(topic => topic.classList.remove('active')); target.classList.add('active'); }
        };
    });

    const helpSearch = document.getElementById('help-search');
    if (helpSearch) {
        helpSearch.oninput = (e) => {
            const term = e.target.value.toLowerCase();
            document.querySelectorAll('.help-topic').forEach(topic => {
                const match = topic.innerText.toLowerCase().includes(term);
                if (term.length > 0) { topic.style.display = match ? 'block' : 'none'; topic.classList.add('active'); } 
                else { topic.style.display = ''; document.querySelectorAll('.help-topic').forEach(t => t.classList.remove('active')); const activeNav = document.querySelector('.help-nav-item.active'); if (activeNav) { const t = document.getElementById(activeNav.dataset.target); if (t) t.classList.add('active'); } }
            });
        };
    }

    document.querySelectorAll('.btn-icon-small').forEach(btn => { btn.onclick = () => Object.values(modals).forEach(m => m.classList.remove('open')); });
    document.querySelectorAll('.modal-shade').forEach(m => { m.onclick = (e) => { if (e.target === m) m.classList.remove('open'); }; });
    
    document.getElementById('btn-apply-code').onclick = () => { 
        try { 
            const data = JSON.parse(document.getElementById('topology-code-area').value); 
            systemState.nodes = data.nodes || []; systemState.connections = data.connections || []; systemState.sketches = data.sketches || []; 
            autoParentNodes(); enforcePhysics(); renderSubsystemsTopologyCanvas(); modals.code.classList.remove('open'); saveState(); 
        } catch(e) { alert("Invalid JSON Blueprint"); } 
    };

    const btnTidy = document.getElementById('btn-tidy-canvas');
    if (btnTidy) btnTidy.onclick = () => tidyCanvas();

    document.querySelectorAll('.template-card').forEach(card => { 
        card.onclick = () => {
            const templateId = card.dataset.template;
            const t = INDUSTRY_TEMPLATES[templateId];
            if (t) {
                try {
                    systemState.nodes = JSON.parse(JSON.stringify(t.nodes || []));
                    systemState.connections = JSON.parse(JSON.stringify(t.connections || []));
                    systemState.sketches = JSON.parse(JSON.stringify(t.sketches || []));
                    autoParentNodes(); enforcePhysics(); renderSubsystemsTopologyCanvas(); 
                    modals.templates.classList.remove('open'); saveState();
                } catch (err) { console.error("Template Loading Error:", err); alert(`Failed to load template "${templateId}".`); }
            }
        };
    });

    document.getElementById('btn-clear-canvas').onclick = () => modals.confirm.classList.add('open');
    const btnConfirmClear = document.getElementById('btn-confirm-clear');
    if (btnConfirmClear) {
        btnConfirmClear.onclick = () => {
            clearCanvas();
            modals.confirm.classList.remove('open');
        };
    }
    const btnCancelClear = document.getElementById('btn-cancel-clear');
    if (btnCancelClear) {
        btnCancelClear.onclick = () => {
            modals.confirm.classList.remove('open');
        };
    }
    document.getElementById('btn-save-json').onclick = () => { const data = JSON.stringify({nodes: systemState.nodes, connections: systemState.connections, sketches: systemState.sketches}, null, 4); const blob = new Blob([data], {type: "application/json"}), url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = `blueprint_${Date.now()}.jc`; a.click(); };
    document.getElementById('btn-save-svg').onclick = () => {
        const svg = document.getElementById('svg-edge-layer').cloneNode(true), sketchLayer = document.getElementById('svg-sketch-layer').cloneNode(true), fullSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        fullSvg.setAttribute('xmlns', "http://www.w3.org/2000/svg"); fullSvg.setAttribute('width', '2000'); fullSvg.setAttribute('height', '2000');
        const style = document.createElementNS("http://www.w3.org/2000/svg", "style"); style.textContent = `.static-base-line { stroke-linecap: round; } .wire-label { font-family: 'Inter', sans-serif; font-size: 10px; fill: #a1a1aa; text-anchor: middle; } .wire-label-bg { fill: #111115; } text { font-family: 'Inter', sans-serif; } .animated-flow-line { stroke-dasharray: 5,5; animation: dash 3s linear infinite; } @keyframes dash { from { stroke-dashoffset: 50; } to { stroke-dashoffset: 0; } }`; fullSvg.appendChild(style);
        const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect"); bg.setAttribute('width', '100%'); bg.setAttribute('height', '100%'); bg.setAttribute('fill', '#09090b'); fullSvg.appendChild(bg);
        fullSvg.appendChild(sketchLayer); fullSvg.appendChild(svg);
        const data = new XMLSerializer().serializeToString(fullSvg), blob = new Blob([data], {type: "image/svg+xml"}), url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = `ddd_model_${Date.now()}.svg`; a.click();
    };
    
    const loadJsonBtn = document.getElementById('btn-load-json'), fileInput = document.getElementById('json-file-input');
    loadJsonBtn.onclick = () => fileInput.click();
    fileInput.onchange = (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = (evt) => { try { const data = JSON.parse(evt.target.result); systemState.nodes = data.nodes || []; systemState.connections = data.connections || []; systemState.sketches = data.sketches || []; autoParentNodes(); enforcePhysics(); renderSubsystemsTopologyCanvas(); saveState(); } catch(ex) { alert("Invalid Blueprint File!"); } }; reader.readAsText(file); };
}

function initPropertiesEditor() {
    const addBtn = document.getElementById('btn-add-field');
    if (addBtn) {
        addBtn.onclick = () => { const node = systemState.nodes.find(n => systemState.selectedIds.includes(n.id)); if (!node) return; const name = document.getElementById('new-field-name').value, type = document.getElementById('new-field-type').value, val = document.getElementById('new-field-value').value; if (name) { if (!node.fields) node.fields = []; node.fields.push({ name, type, value: val }); document.getElementById('new-field-name').value = ''; document.getElementById('new-field-value').value = ''; updatePropertiesPanel(); renderSubsystemsTopologyCanvas(); saveState(); } };
    }
    const propLabel = document.getElementById('prop-label');
    if (propLabel) propLabel.oninput = (e) => { const node = systemState.nodes.find(n => systemState.selectedIds.includes(n.id)); if (node) { node.label = e.target.value; renderSubsystemsTopologyCanvas(true); saveState(); } };
    const propIcon = document.getElementById('prop-icon');
    if (propIcon) propIcon.oninput = (e) => { const node = systemState.nodes.find(n => systemState.selectedIds.includes(n.id)); if (node) { node.icon = e.target.value; renderSubsystemsTopologyCanvas(true); saveState(); } };
    const delSelBtn = document.getElementById('btn-delete-selection');
    if (delSelBtn) delSelBtn.onclick = () => { systemState.selectedIds.forEach(id => deleteSelectedObject(id, 'node')); };
    
    document.getElementById('prop-conn-label').oninput = (e) => { const conn = systemState.connections.find(c => systemState.selectedIds.includes(c.id)); if (conn) { conn.label = e.target.value; renderSubsystemsTopologyCanvas(); saveState(); } };
    document.getElementById('prop-conn-color').oninput = (e) => { const conn = systemState.connections.find(c => systemState.selectedIds.includes(c.id)); if (conn) { conn.color = e.target.value; renderSubsystemsTopologyCanvas(); saveState(); } };
    document.getElementById('prop-conn-pattern').onchange = (e) => { const conn = systemState.connections.find(c => systemState.selectedIds.includes(c.id)); if (conn) { conn.pattern = e.target.value; renderSubsystemsTopologyCanvas(); saveState(); } };
    document.getElementById('prop-conn-direction').onchange = (e) => { const conn = systemState.connections.find(c => systemState.selectedIds.includes(c.id)); if (conn) { conn.direction = e.target.value; renderSubsystemsTopologyCanvas(); saveState(); } };
    document.getElementById('prop-conn-animated').onchange = (e) => { const conn = systemState.connections.find(c => systemState.selectedIds.includes(c.id)); if (conn) { conn.animated = e.target.checked; renderSubsystemsTopologyCanvas(); saveState(); } };
    document.getElementById('btn-delete-conn').onclick = () => { systemState.selectedIds.forEach(id => deleteSelectedObject(id, 'wire')); };
    const closeProps = document.getElementById('btn-close-props');
    if (closeProps) closeProps.onclick = () => document.getElementById('floating-prop-panel').classList.remove('active');
}

function updatePropertiesPanel() {
    const empty = document.getElementById('prop-empty-state'), nodeEd = document.getElementById('prop-active-editor'), connEd = document.getElementById('prop-conn-editor');
    if (!empty || !nodeEd || !connEd) return;
    const selectedId = systemState.selectedIds[0], node = systemState.nodes.find(n => n.id === selectedId), conn = systemState.connections.find(c => c.id === selectedId);
    empty.style.display = (!node && !conn) ? 'block' : 'none'; nodeEd.style.display = node ? 'flex' : 'none'; connEd.style.display = conn ? 'flex' : 'none';
    if (node) {
        document.getElementById('prop-type-display').value = node.type; document.getElementById('prop-label').value = node.label || ''; document.getElementById('prop-icon').value = node.icon || '';
        document.getElementById('fields-editor-block').style.display = node.type === 'icon-only' ? 'none' : 'block';
        const list = document.getElementById('fields-list'); list.innerHTML = ''; if (!node.fields) node.fields = [];
        node.fields.forEach((f, idx) => { 
            const row = document.createElement('div'); row.className = 'field-editor-row'; row.style.display = 'flex'; row.style.gap = '4px'; row.style.marginBottom = '4px'; 
            row.innerHTML = `<input type="text" class="prop-input" value="${f.name}" style="flex:1;"><input type="text" class="prop-input" value="${f.value}" style="flex:1.5;"><button class="btn-icon-small"><i class="fa-solid fa-trash"></i></button>`; 
            const inputs = row.querySelectorAll('input'); 
            inputs[0].onchange = (e) => { f.name = e.target.value; renderSubsystemsTopologyCanvas(); saveState(); }; 
            inputs[1].onchange = (e) => { f.value = e.target.value; renderSubsystemsTopologyCanvas(); saveState(); }; 
            row.querySelector('button').onclick = () => { node.fields.splice(idx, 1); updatePropertiesPanel(); renderSubsystemsTopologyCanvas(); saveState(); }; 
            list.appendChild(row); 
        });
    }
    if (conn) { document.getElementById('prop-conn-label').value = conn.label || ''; document.getElementById('prop-conn-color').value = conn.color || '#60a5fa'; document.getElementById('prop-conn-pattern').value = conn.pattern || 'solid'; document.getElementById('prop-conn-direction').value = conn.direction || 'forward'; document.getElementById('prop-conn-animated').checked = conn.animated !== false; }
}

function initContextMenu() {
    const menu = document.getElementById('context-menu'); if (!menu) return;
    window.onclick = () => menu.style.display = 'none';
    document.getElementById('cm-edit').onclick = () => { document.getElementById('floating-prop-panel').classList.add('active'); updatePropertiesPanel(); };
    document.getElementById('cm-exit').onclick = () => { if (systemState.selectedIds.length > 0) exitContext(systemState.selectedIds[0]); };
    document.getElementById('cm-delete').onclick = () => { systemState.selectedIds.forEach(id => deleteSelectedObject(id, 'node')); };
    const cmAdd = document.getElementById('cm-add-context');
    if (cmAdd) cmAdd.onclick = (e) => e.stopPropagation();
}

function initCustomPalette() {
    const btn = document.getElementById('btn-create-custom');
    if (btn) { 
        btn.onclick = () => { 
            const name = document.getElementById('cust-name').value, type = document.getElementById('cust-type').value, icon = document.getElementById('cust-icon').value, subtype = document.getElementById('cust-subtype').value; 
            if (!name) return; 
            const item = document.createElement('div'); item.className = 'palette-item'; item.draggable = true; item.dataset.type = type; item.dataset.icon = icon || 'fa-cube'; item.dataset.label = name; item.dataset.editorType = subtype; item.dataset.color = '#3b82f6'; 
            item.innerHTML = `${getIconHtml(item.dataset.icon)}<span>${name}</span>`; 
            item.ondragstart = () => { systemState.draggedItemData = { ...item.dataset, isContainer: type === 'actor-home' }; }; 
            document.getElementById('grid-custom-items-container').appendChild(item); 
        }; 
    }
}

function initIconPicker() {
    const btn = document.getElementById('btn-pick-icon'), modal = document.getElementById('icon-picker-modal'), grid = document.getElementById('icon-grid'), search = document.getElementById('icon-search');
    const custBtn = document.getElementById('btn-pick-cust-icon');
    
    const openPicker = (target) => {
        modal.classList.add('open');
        renderIconGrid('', target);
    };

    if (btn) btn.onclick = () => openPicker('inspector');
    if (custBtn) custBtn.onclick = () => openPicker('custom');

    function renderIconGrid(filter, target) { 
        if (!grid) return; grid.innerHTML = ''; 
        Object.values(ICON_CATEGORIES).flat().forEach(icon => { 
            if (!filter || icon.includes(filter)) { 
                const item = document.createElement('div'); item.className = 'icon-picker-item'; item.style.padding = '10px'; item.style.cursor = 'pointer'; item.style.textAlign = 'center'; 
                item.innerHTML = `<i class="${icon}" style="font-size: 1.5rem;"></i>`; 
                item.onclick = () => { 
                    if (target === 'inspector') {
                        const node = systemState.nodes.find(n => systemState.selectedIds.includes(n.id)); 
                        if (node) { node.icon = icon; renderSubsystemsTopologyCanvas(); saveState(); updatePropertiesPanel(); } 
                    } else {
                        document.getElementById('cust-icon').value = icon;
                    }
                    modal.classList.remove('open'); 
                }; 
                grid.appendChild(item); 
            } 
        }); 
    }
    if (search) search.oninput = (e) => renderIconGrid(e.target.value, modal.dataset.target);
}

function initInteractionToolbar() {
    ['move', 'pan', 'select'].forEach(t => { const btn = document.getElementById('tool-' + t); if (btn) { btn.onclick = () => { setInteractionMode(t); }; } });
    document.getElementById('tool-zoom-in').onclick = () => { systemState.zoom *= 1.1; renderSubsystemsTopologyCanvas(); };
    document.getElementById('tool-zoom-out').onclick = () => { systemState.zoom *= 0.9; renderSubsystemsTopologyCanvas(); };
    document.getElementById('tool-fit').onclick = () => { systemState.zoom = 1.0; systemState.panX = 0; systemState.panY = 0; renderSubsystemsTopologyCanvas(); };
}

// Start application
window.onload = initApp;
