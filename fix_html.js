const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add Diagram Title Input
html = html.replace('<main class="canvas-viewport" id="canvas-container">', `<main class="canvas-viewport" id="canvas-container">
            <div class="diagram-title-container">
                <input type="text" id="diagram-title-input" value="Untitled Diagram" placeholder="Enter diagram title..." autocomplete="off">
            </div>`);

// 2. Add Diagrams Tab Bar
html = html.replace('<div class="floating-prop-panel" id="floating-prop-panel">', `<!-- Diagrams Tab Bar -->
            <div class="diagrams-tab-bar" id="diagrams-tab-bar">
                <div class="diagrams-scroll-area" id="diagrams-list">
                    <!-- Tabs rendered dynamically -->
                </div>
                <button class="btn-add-diagram" id="btn-add-diagram" title="New Diagram"><i class="fa-solid fa-plus"></i></button>
            </div>

        <div class="floating-prop-panel" id="floating-prop-panel">`);

// 3. Add New Diagram Modal
html = html.replace('<div class="telemetry-bar">', `<div class="modal-shade" id="new-diagram-modal">
        <div class="modal-surface" style="width: 400px;">
            <div class="modal-header">
                <h3>Create New Diagram</h3>
                <button class="btn-icon-small" id="btn-close-new-diagram"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body" style="padding: 24px 20px;">
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <button class="btn btn-primary" id="btn-create-ddd" style="justify-content: flex-start; font-size: 1rem; padding: 12px;"><i class="fa-solid fa-layer-group" style="margin-right: 12px;"></i> Domain Driven Design</button>
                    <button class="btn btn-primary" id="btn-create-mindmap" style="justify-content: flex-start; font-size: 1rem; padding: 12px; background-color: var(--accent-green); border-color: var(--accent-green);"><i class="fa-solid fa-brain" style="margin-right: 12px;"></i> Mindmap</button>
                    <button class="btn btn-primary" id="btn-create-sysarch" style="justify-content: flex-start; font-size: 1rem; padding: 12px; background-color: var(--accent-orange); border-color: var(--accent-orange);"><i class="fa-solid fa-server" style="margin-right: 12px;"></i> System Architecture</button>
                    <button class="btn btn-primary" id="btn-create-flowchart" style="justify-content: flex-start; font-size: 1rem; padding: 12px; background-color: #8b5cf6; border-color: #8b5cf6;"><i class="fa-solid fa-diagram-project" style="margin-right: 12px;"></i> Flowchart</button>
                </div>
            </div>
        </div>
    </div>

    <div class="telemetry-bar">`);

// 4. Add Quick Add to context menu
html = html.replace('<div class="context-menu-item" id="cm-delete" style="color: var(--accent-red);"><i class="fa-solid fa-trash-can"></i> Delete</div>', `<div class="context-menu-item" id="cm-quick-add" style="display:none; position: relative;">
            <i class="fa-solid fa-bolt"></i> Quick Add Node
            <div class="context-submenu" id="cm-quick-add-list" style="max-height: 300px; overflow-y: auto;"></div>
        </div>
        <div class="context-menu-item" id="cm-delete" style="color: var(--accent-red);"><i class="fa-solid fa-trash-can"></i> Delete</div>`);

fs.writeFileSync('index.html', html);
