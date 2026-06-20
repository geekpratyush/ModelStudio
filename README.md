# Model Studio

A browser-based diagramming tool built with React and Vite. Create, edit, and export professional diagrams entirely in your browser — no account, no server, no data leaves your machine.

**Live app:** https://geekpratyush.github.io/ModelStudio/

## Features

- **Freehand Draw** — sketch diagrams with rough/pencil strokes, shapes, arrows, and sticky notes
- **Flow Diagrams** — drag-and-drop node editor with custom node types and edge styles
- **Code as Diagram** — paste Mermaid or C4 code and get an instant live preview (26+ diagram types)
- **Apache Camel / EIP** — design integration routes visually and export production Camel YAML DSL
- **3D Architecture** — isometric architecture diagrams
- **Org Charts** — hierarchy diagrams with story/org filters
- Export as PNG, SVG, JSON, YAML, `.mmd`, or Camel DSL
- Share via URL — entire diagram encoded in the link, no backend needed
- Local-first: all state auto-saved to `localStorage`, works fully offline

## Tech Stack

- [React 19](https://react.dev/)
- [Vite 8](https://vitejs.dev/)
- [React Flow / xyflow](https://reactflow.dev/)
- [Mermaid](https://mermaid.js.org/)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [Rough.js](https://roughjs.com/)

## Development

```bash
npm install
npm run dev
```

## Build & Deploy

```bash
npm run build   # outputs to dist/
```

Deployed automatically to GitHub Pages via `.github/workflows/build.yml` on every push to `main`.

## License

MIT © 2026 Pratyush Ranjan Mishra
