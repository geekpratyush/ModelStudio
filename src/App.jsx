import React, { useState, useCallback, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { parseMermaid, serializeMermaid, serializePlantUML, serializeD2, validateMermaid, detectDiagramKind } from './utils/cadUtils';
import { registerMermaidLanguage } from './utils/monacoMermaid';
import cadTemplates from './templates/cadTemplates.json';
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Panel,
  useOnSelectionChange,
  MarkerType,
  useViewport,
  getNodesBounds
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng, toSvg } from 'html-to-image';
import { v4 as uuidv4 } from 'uuid';
import yaml from 'js-yaml';
import { Download, Upload, FileJson, Image, PlayCircle, Box, Diamond, Server, Trash2, Database, Cloud, MousePointer2, Hand, Grid3X3, Code, ChevronLeft, ChevronRight, ChevronsDown, ChevronsUp, Filter, ListOrdered, FileText, Shield, ShieldCheck, MessageSquare, Send, Skull, Mail, Clock, GitMerge, GitBranch, Workflow, Network, ArrowRightLeft, Route, FilePlus, RefreshCw, Radio, Share2, ListChecks, Scale, Settings2, ArrowDownUp, TerminalSquare, CheckCircle2, PackageOpen, Package, FileArchive, MessageCircle, RadioTower, Webhook, Hexagon, Building2, CloudLightning, BoxSelect, Plug, Zap, Cpu, User, File, Type, Table, Building, Layers, Search, X, Target, Eraser, StickyNote, Info, Pencil, Paintbrush, AlignLeft, AlignCenter, AlignRight, AlignStartVertical, AlignCenterVertical, AlignEndVertical, Triangle, ArrowUpRight, Minus, Circle as CircleIcon, Square, LayoutGrid, Copy, Columns, PanelTopOpen, PanelLeftClose, Plus, Palette, Shapes, Globe, Lock, Wifi, Monitor, Smartphone, Terminal, HardDrive, Users, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import ThemeToggle from './components/ThemeToggle';
import MSLogo from './components/MSLogo';
import { useTheme } from './contexts/ThemeContext';
import * as AllIcons from 'lucide-react';
import CustomNode from './CustomNode';
import CustomEdge from './CustomEdge';
import LandingPage from './LandingPage';
import HelpModal from './HelpModal';
import './App.css';

const allIconNames = Object.keys(AllIcons).filter(k => k[0] === k[0].toUpperCase() && k !== 'LucideIcon' && k !== 'Icon');

// ── Mermaid rendering for CAD workspace ──────────────────────────────────────
let _mmdModule = null, _mmdTheme = null;
const getMMD = (theme) => {
  const want = theme === 'dark' ? 'dark' : 'default';
  const noMaxWidth = { useMaxWidth: false };
  const cfg = {
    startOnLoad: false, securityLevel: 'loose',
    fontFamily: "'Inter', system-ui, sans-serif", theme: want,
    // Dark theme: override variables for good contrast on all diagram types including C4
    themeVariables: want === 'dark' ? {
      primaryColor:        '#1e3a5f',
      primaryTextColor:    '#e2e8f0',
      primaryBorderColor:  '#3b82f6',
      secondaryColor:      '#1e293b',
      tertiaryColor:       '#0f172a',
      background:          '#0f111a',
      lineColor:           '#94a3b8',
      edgeLabelBackground: '#1e293b',
      clusterBkg:          '#1e293b',
      clusterBorder:       '#3b82f6',
      titleColor:          '#e2e8f0',
      nodeBorder:          '#3b82f6',
      nodeTextColor:       '#e2e8f0',
      labelBackground:     '#1e293b',
      labelTextColor:      '#e2e8f0',
      relationColor:       '#94a3b8',
      relationLabelColor:  '#cbd5e1',
    } : undefined,
    flowchart: { htmlLabels: true, useMaxWidth: false },
    sequence: noMaxWidth, gantt: noMaxWidth, pie: noMaxWidth,
    er: noMaxWidth, classDiagram: noMaxWidth, stateDiagram: noMaxWidth,
    journey: noMaxWidth, gitGraph: noMaxWidth, sankey: noMaxWidth,
    xychart: noMaxWidth, block: noMaxWidth, quadrantChart: noMaxWidth,
    timeline: noMaxWidth, mindmap: noMaxWidth, kanban: noMaxWidth,
  };
  if (!_mmdModule) {
    _mmdModule = import('mermaid').then(m => { const d = m.default||m; d.initialize(cfg); _mmdTheme=want; return d; });
  } else if (_mmdTheme !== want) {
    _mmdModule = _mmdModule.then(d => { d.initialize(cfg); _mmdTheme=want; return d; });
  }
  return _mmdModule;
};
const parseCadSvg = (raw) => {
  let hintW = null;
  const text = raw.replace(/(<svg\b[^>]*?\bstyle=["'])([^"']*)["']/i, (_, pre, inner) => {
    const cleaned = inner.split(';').filter(s => {
      const t = s.trim().toLowerCase();
      if (t.startsWith('max-width')) { const v=parseFloat(t.split(':')[1]); if(v>0) hintW=v; return false; }
      return true;
    }).join(';');
    return `${pre}${cleaned}"`;
  });
  let w=0, h=0;
  try {
    const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
    const el  = doc.querySelector('svg');
    if (el) {
      const vb = el.getAttribute('viewBox');
      if (vb) { const p=vb.trim().split(/[\s,]+/).map(Number); if(p.length>=4&&p[2]>0&&p[3]>0){w=p[2];h=p[3];} }
      if (!w) { const wa=el.getAttribute('width')||'', ha=el.getAttribute('height')||'';
        if(!wa.includes('%')&&!ha.includes('%')){w=parseFloat(wa)||0;h=parseFloat(ha)||0;} }
      if (!w && hintW) { w=hintW; h=parseFloat(el.getAttribute('height'))||0; }
    }
  } catch {}
  return { text, w: w||800, h: h||600 };
};
let _mmdSeq = 0;

const BRAND_ICONS = [
  { 
    name: 'Docker', 
    tags: 'docker container containerization vm virtualization whale', 
    color: '#0db7ed',
    svg: '<svg viewBox="0 0 24 24" width="36" height="36" fill="#0db7ed"><path d="M13.983 11.078h2.119c.102 0 .186-.083.186-.185V8.99c0-.102-.084-.185-.186-.185h-2.119c-.103 0-.186.083-.186.185v1.902c0 .102.083.185.186.185zM11.261 11.078h2.119c.102 0 .185-.083.185-.185V8.99c0-.102-.083-.185-.185-.185h-2.119c-.102 0-.185.083-.185.185v1.902c0 .102.083.185.185.185zM11.261 8.402h2.119c.102 0 .185-.083.185-.186V6.315c0-.103-.083-.186-.185-.186h-2.119c-.102 0-.185.083-.185.186v1.902c0 .103.083.186.185.186zM8.539 11.078h2.119c.103 0 .186-.083.186-.185V8.99c0-.102-.083-.185-.186-.185H8.539c-.102 0-.186.083-.186.185v1.902c0 .102.084.185.186.185zM8.539 8.402h2.119c.103 0 .186-.083.186-.186V6.315c0-.103-.083-.186-.186-.186H8.539c-.102 0-.186.083-.186.186v1.902c0 .103.084.186.186.186zM5.816 11.078h2.119c.103 0 .186-.083.186-.185V8.99c0-.102-.083-.185-.186-.185H5.816c-.102 0-.186.083-.186.185v1.902c0 .102.084.185.186.185zM2.23 13.435c.023.11.116.19.228.19h18.545c.117 0 .213-.082.228-.197.516-3.975-2.22-6.81-4.72-6.81-1.485 0-2.755.736-3.6 1.724-.316-.027-.638-.043-.963-.043-1.5 0-2.87.386-3.922 1.025l-.387-.387a.188.188 0 00-.265 0l-.97.97a.188.188 0 000 .265l.307.307c-.814.734-1.43 1.66-1.8 2.688l-.33-.33a.188.188 0 00-.265 0l-.97.97a.188.188 0 000 .265l.386.387c-.368.514-.658 1.1-.864 1.725z"/></svg>'
  },
  { 
    name: 'Kubernetes', 
    tags: 'k8s kubernetes container orchestration engine cluster cloud google', 
    color: '#326ce5',
    svg: '<svg viewBox="0 0 24 24" width="36" height="36" fill="#326ce5"><path d="M12 1.6l9.5 5.5v11L12 23.6l-9.5-5.5v-11L12 1.6zm0 2.3L4.8 8.2v7.6l7.2 4.2 7.2-4.2V8.2L12 3.9zm0 2.7l4.8 2.8v5.6l-4.8 2.8-4.8-2.8V9.4l4.8-2.8z"/></svg>'
  },
  { 
    name: 'React', 
    tags: 'react frontend ui web framework library javascript js component facebook', 
    color: '#00d8ff',
    svg: '<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="#00d8ff" stroke-width="1.5"><ellipse rx="10" ry="4.5" transform="rotate(0)" cx="12" cy="12"/><ellipse rx="10" ry="4.5" transform="rotate(60)" cx="12" cy="12"/><ellipse rx="10" ry="4.5" transform="rotate(120)" cx="12" cy="12"/><circle cx="12" cy="12" r="2" fill="#00d8ff"/></svg>'
  },
  { 
    name: 'AWS', 
    tags: 'aws amazon cloud infrastructure service server simple smile web hosting', 
    color: '#ff9900',
    svg: '<svg viewBox="0 0 24 24" width="36" height="36" fill="#ff9900"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-3-9h6c.55 0 1-.45 1-1s-.45-1-1-1H9c-.55 0-1 .45-1 1s.45 1 1 1zm0 4h6c.55 0 1-.45 1-1s-.45-1-1-1H9c-.55 0-1 .45-1 1s.45 1 1 1z"/></svg>'
  },
  { 
    name: 'Google Cloud', 
    tags: 'gcp google cloud platform computing storage machine learning api', 
    color: '#4285f4',
    svg: '<svg viewBox="0 0 24 24" width="36" height="36"><path fill="#4285F4" d="M12,10.6l-5.6,3.3l-5.6-3.3v-6.5l5.6-3.3l5.6,3.3V10.6z M12,20l-5.6,3.3l-5.6-3.3v-6.5l5.6-3.3l5.6,3.3V20z M22,10.6l-5.6,3.3l-5.6-3.3v-6.5l5.6-3.3l5.6,3.3V10.6z"/></svg>'
  },
  { 
    name: 'Azure', 
    tags: 'azure microsoft cloud platform windows enterprise infrastructure service', 
    color: '#0078d4',
    svg: '<svg viewBox="0 0 24 24" width="36" height="36" fill="#0078d4"><path d="M5.483 21.3l6.156-8.912L3.982 7.53 0 19.387h5.483zM24 19.387L13.734 3 8.358 13.916l6.233 7.384H24z"/></svg>'
  },
  { 
    name: 'Oracle', 
    tags: 'oracle database db enterprise java cloud business', 
    color: '#F80000',
    svg: '<svg viewBox="0 0 24 24" width="36" height="36" fill="#F80000"><path d="M12 4C5.373 4 0 7.582 0 12s5.373 8 12 8 12-3.582 12-8-5.373-8-12-8zm0 12c-4.418 0-8-1.791-8-4s3.582-4 8-4 8 1.791 8 4-3.582 4-8 4z"/></svg>'
  },
  { 
    name: 'Nginx', 
    tags: 'nginx server web proxy load balancer reverse proxy', 
    color: '#009639',
    svg: '<svg viewBox="0 0 24 24" width="36" height="36" fill="#009639"><path d="M12 0L1.5 6v12L12 24l10.5-6V6L12 0z M12 4l7.5 4.3v7.4L12 20l-7.5-4.3V8.3L12 4z"/></svg>'
  },
  { 
    name: 'Slack', 
    tags: 'slack chat communication team collaboration message workplace channel', 
    color: '#4a154b',
    svg: '<svg viewBox="0 0 24 24" width="36" height="36" fill="#4a154b"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523 2.528 2.528 0 0 1-2.522-2.523 2.528 2.528 0 0 1 2.522-2.52h2.52v2.52zm1.261 0a2.528 2.528 0 0 1 2.52-2.52h5.043a2.528 2.528 0 0 1 2.522 2.52v5.042a2.528 2.528 0 0 1-2.522 2.52H8.823a2.528 2.528 0 0 1-2.52-2.52v-5.042zM8.823 5.043a2.528 2.528 0 0 1-2.52-2.52A2.528 2.528 0 0 1 8.823 0a2.528 2.528 0 0 1 2.52 2.522v2.52h-2.52zm0 1.261a2.528 2.528 0 0 1 2.52 2.52v5.043a2.528 2.528 0 0 1-2.52 2.522H3.78a2.528 2.528 0 0 1-2.52-2.522V8.824a2.528 2.528 0 0 1 2.52-2.52h5.043zm10.135 3.78a2.528 2.528 0 0 1 2.52-2.522 2.528 2.528 0 0 1 2.522 2.522 2.528 2.528 0 0 1-2.522 2.52h-2.52v-2.52zm-1.262 0a2.528 2.528 0 0 1-2.52 2.52h-5.043a2.528 2.528 0 0 1-2.522-2.52V3.78a2.528 2.528 0 0 1 2.522-2.52h5.043a2.528 2.528 0 0 1 2.52 2.52v5.043zm-2.52 10.135a2.528 2.528 0 0 1 2.52 2.52 2.528 2.528 0 0 1-2.52 2.522 2.528 2.528 0 0 1-2.522-2.522v-2.52h2.522zm0-1.262a2.528 2.528 0 0 1-2.522-2.52v-5.043a2.528 2.528 0 0 1 2.522-2.52H20.22a2.528 2.528 0 0 1 2.52 2.52v5.043a2.528 2.528 0 0 1-2.52 2.52h-5.043z"/></svg>'
  },
  { 
    name: 'Java', 
    tags: 'java backend coffee cup server enterprise development', 
    color: '#e76f51',
    svg: '<svg viewBox="0 0 24 24" width="36" height="36" fill="#e76f51"><path d="M2 21h16v-2H2v2zm12-9c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3H7c-1.66 0-3 1.34-3 3v4c0 1.66 1.34 3 3 3h7zm3-7h1v4h-1V5z"/></svg>'
  },
  { 
    name: 'Python', 
    tags: 'python script scripting django flask data science script backend language machine learning', 
    color: '#3776ab',
    svg: '<svg viewBox="0 0 24 24" width="36" height="36"><path fill="#3776ab" d="M12 2A6 6 0 006 8v2h6v2H6a4 4 0 00-4 4v4a4 4 0 004 4h4a4 4 0 004-4v-2H8v-2h6a6 6 0 006-6V8a6 6 0 00-6-6h-2z"/></svg>'
  },
  { 
    name: 'Node.js', 
    tags: 'node nodejs runtime server backend javascript backend runtime development js api V8', 
    color: '#339933',
    svg: '<svg viewBox="0 0 24 24" width="36" height="36" fill="#339933"><path d="M12 2L3 7.2v10.4l9 5.2 9-5.2V7.2L12 2zm6 14.5l-6 3.5-6-3.5V9.5l6-3.5 6 3.5v7z"/></svg>'
  },
  { 
    name: 'GitHub', 
    tags: 'github repository repo git social coding hosting profile workspace hub', 
    color: '#181717',
    svg: '<svg viewBox="0 0 24 24" width="36" height="36" fill="#181717"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.193 22 16.44 22 12.017 22 6.484 17.522 2 12 2z"/></svg>'
  },
  { 
    name: 'PostgreSQL', 
    tags: 'postgres postgresql database db relational rdbms elephant sql query relational data store', 
    color: '#336791',
    svg: '<svg viewBox="0 0 24 24" width="36" height="36" fill="#336791"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5.67-1.5 1.5-1.5 1.5.67 1.5 1.5zm0-4c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5.67-1.5 1.5-1.5 1.5.67 1.5 1.5z"/></svg>'
  },
  { 
    name: 'MongoDB', 
    tags: 'mongo mongodb database db nosql document leaf store', 
    color: '#47A248',
    svg: '<svg viewBox="0 0 24 24" width="36" height="36" fill="#47A248"><path d="M12 2C9.5 6.5 8 11.5 8 15c0 3 2.5 5 4 5s4-2 4-5c0-3.5-1.5-8.5-4-13z"/></svg>'
  },
  { 
    name: 'Redis', 
    tags: 'redis cache caching database store memory in-memory cluster db red box', 
    color: '#D82C20',
    svg: '<svg viewBox="0 0 24 24" width="36" height="36" fill="#D82C20"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/></svg>'
  },
  { 
    name: 'Kafka', 
    tags: 'kafka apache messaging broker pubsub event stream queue streaming telemetry log broker stream', 
    color: '#007ACC',
    svg: '<svg viewBox="0 0 24 24" width="36" height="36" fill="#007ACC"><path d="M4 6h16V4H4v2zm0 5h16V9H4v2zm0 5h16v-2H4v2zm0 4h16v-2H4v2z"/></svg>'
  },
  { 
    name: 'Slack', 
    tags: 'slack chat communication team collaboration message workplace channel', 
    color: '#4a154b',
    svg: '<svg viewBox="0 0 24 24" width="36" height="36" fill="#4a154b"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523 2.528 2.528 0 0 1-2.522-2.523 2.528 2.528 0 0 1 2.522-2.52h2.52v2.52zm1.261 0a2.528 2.528 0 0 1 2.52-2.52h5.043a2.528 2.528 0 0 1 2.522 2.52v5.042a2.528 2.528 0 0 1-2.522 2.52H8.823a2.528 2.528 0 0 1-2.52-2.52v-5.042zM8.823 5.043a2.528 2.528 0 0 1-2.52-2.52A2.528 2.528 0 0 1 8.823 0a2.528 2.528 0 0 1 2.52 2.522v2.52h-2.52zm0 1.261a2.528 2.528 0 0 1 2.52 2.52v5.043a2.528 2.528 0 0 1-2.52 2.522H3.78a2.528 2.528 0 0 1-2.52-2.522V8.824a2.528 2.528 0 0 1 2.52-2.52h5.043zm10.135 3.78a2.528 2.528 0 0 1 2.52-2.522 2.528 2.528 0 0 1 2.522 2.522 2.528 2.528 0 0 1-2.522 2.52h-2.52v-2.52zm-1.262 0a2.528 2.528 0 0 1-2.52 2.52h-5.043a2.528 2.528 0 0 1-2.522-2.52V3.78a2.528 2.528 0 0 1 2.522-2.52h5.043a2.528 2.528 0 0 1 2.52 2.52v5.043zm-2.52 10.135a2.528 2.528 0 0 1 2.52 2.52 2.528 2.528 0 0 1-2.52 2.522 2.528 2.528 0 0 1-2.522-2.522v-2.52h2.522zm0-1.262a2.528 2.528 0 0 1-2.522-2.52v-5.043a2.528 2.528 0 0 1 2.522-2.52H20.22a2.528 2.528 0 0 1 2.52 2.52v5.043a2.528 2.528 0 0 1-2.52 2.52h-5.043z"/></svg>'
  }
];

const nodeTypes = { custom: CustomNode };
const edgeTypes = { custom: CustomEdge };

const initialNodes = [];
const initialEdges = [];

const defaultEdgeOptions = {
  type: 'custom',
  animated: true,
  style: { strokeWidth: 3, stroke: '#94a3b8' }
};

const templates = {
  ddd: [
    {
      name: "1. Basic Strategic Context (Simple)",
      description: "A minimal strategic design defining a single Bounded Context containing one Entity and one Value Object. Ideal for beginners.",
      nodes: [
        { id: "ctx-simple", type: 'custom', position: { x: 50, y: 50 }, style: { width: 450, height: 350, zIndex: -1 }, data: { label: "Order context", icon: "BoxSelect", isContainer: true, color: "#3b82f6", textAlign: "left", verticalAlign: "top" } },
        { id: "ent-order", type: 'custom', parentId: "ctx-simple", extent: "parent", position: { x: 40, y: 70 }, data: { label: "Order Entity", icon: "Package", color: "#3b82f6" } },
        { id: "vo-addr", type: 'custom', parentId: "ctx-simple", extent: "parent", position: { x: 40, y: 195 }, data: { label: "Address VO", icon: "Layers", color: "#3b82f6" } },
        { id: "note-1", type: 'custom', position: { x: 550, y: 50 }, data: { label: "STRATEGIC OVERVIEW:\nThis template shows a single Bounded Context. In DDD, a context is a linguistic boundary where terms have specific meanings.", shape: "note", color: "#fef08a" }, style: { width: 250, height: 200 } }
      ],
      edges: []
    },
    {
      name: "2. Strategic Shipping & Logistics (Complex)",
      description: "A comprehensive strategic map showing Core, Generic, and Supporting subdomains with Bounded Contexts and Context Mapping.",
      nodes: [
        { id: "core-shipping", type: 'custom', position: { x: 50, y: 50 }, style: { width: 400, height: 300, zIndex: -1 }, data: { label: "CORE: Shipping Context", icon: "Target", isContainer: true, color: "#ef4444", textAlign: "left", verticalAlign: "top" } },
        { id: "gen-billing", type: 'custom', position: { x: 500, y: 50 }, style: { width: 350, height: 300, zIndex: -1 }, data: { label: "GENERIC: Billing Context", icon: "Grid3X3", isContainer: true, color: "#94a3b8", textAlign: "left", verticalAlign: "top" } },
        { id: "supp-catalog", type: 'custom', position: { x: 50, y: 400 }, style: { width: 350, height: 300, zIndex: -1 }, data: { label: "SUPPORTING: Catalog Context", icon: "BoxSelect", isContainer: true, color: "#3b82f6", textAlign: "left", verticalAlign: "top" } },
        { id: "note-strat", type: 'custom', position: { x: 500, y: 400 }, data: { label: "STRATEGIC DESIGN:\n1. Core (Red): Competitive advantage.\n2. Generic (Grey): Standard industry needs.\n3. Supporting (Blue): Necessary but not core.", shape: "note", color: "#fef08a" }, style: { width: 350, height: 200 } }
      ],
      edges: [
        { id: "e-ship-bill", source: "core-shipping", target: "gen-billing", label: "Customer/Supplier", animated: true, type: "custom", sourceHandle: "right", targetHandle: "left" },
        { id: "e-cat-ship", source: "supp-catalog", target: "core-shipping", label: "ACL", animated: true, type: "custom", sourceHandle: "right", targetHandle: "left" }
      ]
    },
    {
      name: "3. Tactical: Rich vs Anemic Domain Model",
      description: "Compares an Anemic Domain Model (antipattern) with a Rich Domain Model (DDD best practice).",
      nodes: [
        { id: "ctx-anemic", type: 'custom', position: { x: 50, y: 50 }, style: { width: 400, height: 400, zIndex: -1 }, data: { label: "ANEMIC MODEL (Antipattern)", icon: "Skull", isContainer: true, color: "#64748b", textAlign: "left", verticalAlign: "top" } },
        { id: "ent-data", type: 'custom', parentId: "ctx-anemic", extent: "parent", position: { x: 40, y: 70 }, data: { label: "Data-Only Entity\n(Getters/Setters)", icon: "Package", color: "#64748b" } },
        { id: "svc-proc", type: 'custom', parentId: "ctx-anemic", extent: "parent", position: { x: 40, y: 220 }, data: { label: "Procedural Service\n(Logic here)", icon: "Zap", color: "#64748b" } },
        
        { id: "ctx-rich", type: 'custom', position: { x: 550, y: 50 }, style: { width: 400, height: 400, zIndex: -1 }, data: { label: "RICH MODEL (Best Practice)", icon: "ShieldCheck", isContainer: true, color: "#10b981", textAlign: "left", verticalAlign: "top" } },
        { id: "ent-rich", type: 'custom', parentId: "ctx-rich", extent: "parent", position: { x: 40, y: 70 }, data: { label: "Smart Entity\n(Data + Logic)", icon: "Package", color: "#10b981" } },
        { id: "vo-rich", type: 'custom', parentId: "ctx-rich", extent: "parent", position: { x: 40, y: 220 }, data: { label: "Value Object\n(Validation/Invariants)", icon: "Layers", color: "#10b981" } },
        
        { id: "note-rich-v-anemic", type: 'custom', position: { x: 50, y: 500 }, data: { label: "RICH vs ANEMIC:\nIn a Rich Model, logic stays within the Entity to protect invariants. In an Anemic model, logic is pulled out into services, breaking encapsulation.", shape: "note", color: "#fef08a" }, style: { width: 900, height: 150 } }
      ],
      edges: []
    }
  ],
  diagram: [
    {
      name: "1. Simple Web App Server (Simple)",
      description: "A simple client to web application and database diagram.",
      nodes: [
        { id: "node-cli", type: 'custom', position: { x: 50, y: 150 }, data: { label: "Client Actor", icon: "User", color: "#8b5cf6", shape: "actor" } },
        { id: "node-web", type: 'custom', position: { x: 300, y: 150 }, data: { label: "Web Server", icon: "Server", color: "#3b82f6", shape: "box" } },
        { id: "node-db-inst", type: 'custom', position: { x: 550, y: 150 }, data: { label: "Database", icon: "Database", color: "#10b981", shape: "cylinder" } }
      ],
      edges: [
        { id: "e-1", source: "node-cli", target: "node-web", animated: true, type: "custom", sourceHandle: "right", targetHandle: "left", label: "HTTP" },
        { id: "e-2", source: "node-web", target: "node-db-inst", animated: true, type: "custom", sourceHandle: "right", targetHandle: "left", label: "SQL Connect" }
      ]
    },
    {
      name: "2. Three-Tier Architecture (Medium)",
      description: "Classical client-server diagram depicting Web Client actor, API Gateway route proxy, Server class modeling, and Database tier.",
      nodes: [
        { id: "node-client", type: 'custom', position: { x: 50, y: 150 }, data: { label: "User Client", icon: "User", color: "#8b5cf6", shape: "actor" } },
        { id: "node-gateway", type: 'custom', position: { x: 300, y: 150 }, data: { label: "API Gateway", icon: "Network", color: "#3b82f6", shape: "box" } },
        { id: "node-app", type: 'custom', position: { x: 580, y: 110 }, data: { label: "App Server", icon: "Cpu", color: "#10b981", shape: "class", fields: "+ processData()\n+ validateUser()", methods: "+ startService()" } },
        { id: "node-db", type: 'custom', position: { x: 860, y: 150 }, data: { label: "User Database", icon: "Database", color: "#f59e0b", shape: "cylinder" } }
      ],
      edges: [
        { id: "e-client-gw", source: "node-client", target: "node-gateway", animated: true, type: "custom", sourceHandle: "right", targetHandle: "left", label: "HTTPS" },
        { id: "e-gw-app", source: "node-gateway", target: "node-app", animated: true, type: "custom", sourceHandle: "right", targetHandle: "left", label: "gRPC" },
        { id: "e-app-db", source: "node-app", target: "node-db", animated: true, type: "custom", sourceHandle: "right", targetHandle: "left", label: "SQL Connect" }
      ]
    },
    {
      name: "3. Microservice Topology (Complex)",
      description: "Advanced distributed system blueprint utilizing API Gateway routing, microservices, databases, and a RabbitMQ broker.",
      nodes: [
        { id: "node-lb", type: 'custom', position: { x: 50, y: 150 }, data: { label: "Load Balancer", icon: "Shuffle", color: "#3b82f6", shape: "box" } },
        { id: "node-gw", type: 'custom', position: { x: 300, y: 150 }, data: { label: "API Gateway", icon: "Network", color: "#3b82f6", shape: "box" } },
        
        { id: "node-orders", type: 'custom', position: { x: 580, y: 80 }, data: { label: "Orders Service", icon: "Cpu", color: "#10b981", shape: "box" } },
        { id: "node-catalog", type: 'custom', position: { x: 580, y: 240 }, data: { label: "Catalog Service", icon: "Cpu", color: "#10b981", shape: "box" } },
        
        { id: "node-broker", type: 'custom', position: { x: 860, y: 150 }, data: { label: "RabbitMQ Broker", icon: "MessageSquare", color: "#a855f7", shape: "box" } },
        
        { id: "node-order-db", type: 'custom', position: { x: 860, y: 10 }, data: { label: "Orders DB", icon: "Database", color: "#eab308", shape: "cylinder" } },
        { id: "node-catalog-db", type: 'custom', position: { x: 860, y: 290 }, data: { label: "Catalog DB", icon: "Database", color: "#eab308", shape: "cylinder" } }
      ],
      edges: [
        { id: "e-lb-gw", source: "node-lb", target: "node-gw", animated: true, type: "custom", sourceHandle: "right", targetHandle: "left" },
        { id: "e-gw-orders", source: "node-gw", target: "node-orders", animated: true, type: "custom", sourceHandle: "right", targetHandle: "left" },
        { id: "e-gw-cat", source: "node-gw", target: "node-catalog", animated: true, type: "custom", sourceHandle: "right", targetHandle: "left" },
        { id: "e-orders-db", source: "node-orders", target: "node-order-db", animated: true, type: "custom", sourceHandle: "right", targetHandle: "left" },
        { id: "e-cat-db", source: "node-catalog", target: "node-catalog-db", animated: true, type: "custom", sourceHandle: "right", targetHandle: "left" },
        { id: "e-orders-broker", source: "node-orders", target: "node-broker", animated: true, type: "custom", sourceHandle: "right", targetHandle: "left", label: "Publishes" },
        { id: "e-broker-cat", source: "node-broker", target: "node-catalog", animated: true, type: "custom", sourceHandle: "right", targetHandle: "left", label: "Consumes" }
      ]
    },
    {
      name: "4. HA Cloud Deployment Topology (Very Complex)",
      description: "Enterprise scale multi-AZ deployment showing load balancers, container systems, Redis cache clusters, and PostgreSQL Primary/Replica databases.",
      nodes: [
        { id: "ac-cli", type: 'custom', position: { x: 50, y: 180 }, data: { label: "Client Traffic", icon: "User", color: "#8b5cf6", shape: "actor" } },
        { id: "ac-dns", type: 'custom', position: { x: 270, y: 180 }, data: { label: "Route 53 DNS", icon: "Network", color: "#3b82f6", shape: "box" } },
        { id: "ac-alb", type: 'custom', position: { x: 570, y: 180 }, data: { label: "AWS ALB", icon: "Shuffle", color: "#3b82f6", shape: "box" } },
        
        { id: "ac-ecs1", type: 'custom', position: { x: 860, y: 80 }, data: { label: "ECS Container A", icon: "Cpu", color: "#10b981", shape: "box" } },
        { id: "ac-ecs2", type: 'custom', position: { x: 860, y: 280 }, data: { label: "ECS Container B", icon: "Cpu", color: "#10b981", shape: "box" } },
        
        { id: "ac-redis", type: 'custom', position: { x: 1180, y: 80 }, data: { label: "Redis Cluster", icon: "Database", color: "#ec4899", shape: "cylinder" } },
        { id: "ac-pg-prim", type: 'custom', position: { x: 1180, y: 280 }, data: { label: "Postgres Primary", icon: "Database", color: "#f59e0b", shape: "cylinder" } },
        { id: "ac-pg-rep", type: 'custom', position: { x: 1510, y: 280 }, data: { label: "Postgres Replica", icon: "Database", color: "#94a3b8", shape: "cylinder" } }
      ],
      edges: [
        { id: "ae-1", source: "ac-cli", target: "ac-dns", animated: true, type: "custom", sourceHandle: "right", targetHandle: "left" },
        { id: "ae-2", source: "ac-dns", target: "ac-alb", animated: true, type: "custom", sourceHandle: "right", targetHandle: "left" },
        { id: "ae-3", source: "ac-alb", target: "ac-ecs1", animated: true, type: "custom", sourceHandle: "right", targetHandle: "left" },
        { id: "ae-4", source: "ac-alb", target: "ac-ecs2", animated: true, type: "custom", sourceHandle: "right", targetHandle: "left" },
        { id: "ae-5", source: "ac-ecs1", target: "ac-redis", animated: true, type: "custom", sourceHandle: "right", targetHandle: "left", label: "Cache" },
        { id: "ae-6", source: "ac-ecs2", target: "ac-redis", animated: true, type: "custom", sourceHandle: "right", targetHandle: "left", label: "Cache" },
        { id: "ae-7", source: "ac-ecs1", target: "ac-pg-prim", animated: true, type: "custom", sourceHandle: "right", targetHandle: "left", label: "Write" },
        { id: "ae-8", source: "ac-ecs2", target: "ac-pg-prim", animated: true, type: "custom", sourceHandle: "right", targetHandle: "left", label: "Write" },
        { id: "ae-9", source: "ac-pg-prim", target: "ac-pg-rep", animated: true, type: "custom", sourceHandle: "right", targetHandle: "left", label: "Replicate", style: { strokeWidth: 3, stroke: '#f59e0b' } }
      ]
    }
  ],
  eip: [
    {
      name: "1. File Archiver Pipeline (Simple)",
      description: "A basic Camel route taking input from an FTP directory and placing it directly into a log output.",
      nodes: [
        { id: "node-ftp", type: 'custom', position: { x: 50, y: 150 }, data: { label: "File Archive", icon: "FileArchive", color: "#eab308", isEip: true } },
        { id: "node-logger-out", type: 'custom', position: { x: 300, y: 150 }, data: { label: "Log", icon: "Code", color: "#64748b", isEip: true } }
      ],
      edges: [
        { id: "e-ftp-log", source: "node-ftp", target: "node-logger-out", animated: true, type: "custom", sourceHandle: "right", targetHandle: "left" }
      ]
    },
    {
      name: "2. Content-Based Router Route (Medium)",
      description: "Classic Camel EIP pattern routing a timer-triggered request to a SQL Database or a logger, depending on message body structure.",
      nodes: [
        { id: "node-timer", type: 'custom', position: { x: 50, y: 200 }, style: { width: 120, height: 60 }, data: { label: "Timer", icon: "Clock", color: "#3b82f6", isEip: true } },
        { id: "node-choice", type: 'custom', position: { x: 200, y: 200 }, style: { width: 120, height: 60 }, data: { label: "Choice", icon: "GitBranch", color: "#8b5cf6", isEip: true } },
        { id: "node-when", type: 'custom', position: { x: 350, y: 140 }, style: { width: 120, height: 60 }, data: { label: "When", icon: "Filter", color: "#eab308", isEip: true, expressionType: "simple", expression: "${body} != null" } },
        { id: "node-otherwise", type: 'custom', position: { x: 350, y: 260 }, style: { width: 120, height: 60 }, data: { label: "Otherwise", icon: "RefreshCw", color: "#94a3b8", isEip: true } },
        { id: "node-db", type: 'custom', position: { x: 500, y: 140 }, style: { width: 120, height: 60 }, data: { label: "Database", icon: "Database", color: "#10b981", isEip: true } },
        { id: "node-log", type: 'custom', position: { x: 500, y: 260 }, style: { width: 120, height: 60 }, data: { label: "Log", icon: "TerminalSquare", color: "#ef4444", isEip: true } }
      ],
      edges: [
        { id: "e-timer-choice", source: "node-timer", target: "node-choice", animated: true, type: "custom", sourceHandle: "right", targetHandle: "left" },
        { id: "e-choice-when", source: "node-choice", target: "node-when", animated: true, type: "custom", sourceHandle: "right", targetHandle: "left" },
        { id: "e-choice-oth", source: "node-choice", target: "node-otherwise", animated: true, type: "custom", sourceHandle: "right", targetHandle: "left" },
        { id: "e-when-db", source: "node-when", target: "node-db", animated: true, type: "custom", sourceHandle: "right", targetHandle: "left" },
        { id: "e-oth-log", source: "node-otherwise", target: "node-log", animated: true, type: "custom", sourceHandle: "right", targetHandle: "left" }
      ]
    },
    {
      name: "3. Wire Tap & Enrich Pipeline (Complex)",
      description: "Diverts incoming message to an Audit Log channel (via Wire Tap) while processing it through a body enricher into a message queue.",
      nodes: [
        { id: "node-trigger", type: 'custom', position: { x: 50, y: 150 }, style: { width: 120, height: 60 }, data: { label: "Timer Trigger", icon: "Clock", color: "#3b82f6", isEip: true } },
        { id: "node-tap", type: 'custom', position: { x: 200, y: 150 }, style: { width: 120, height: 60 }, data: { label: "Wire Tap", icon: "Radio", color: "#d946ef", isEip: true } },
        { id: "node-audit", type: 'custom', position: { x: 350, y: 70 }, style: { width: 120, height: 60 }, data: { label: "Audit Logger", icon: "TerminalSquare", color: "#ef4444", isEip: true } },
        { id: "node-enrich", type: 'custom', position: { x: 350, y: 230 }, style: { width: 120, height: 60 }, data: { label: "setBody Enricher", icon: "Box", color: "#10b981", isEip: true, expressionType: "simple", expression: "Hello from anti-gravity!" } },
        { id: "node-queue", type: 'custom', position: { x: 500, y: 230 }, style: { width: 120, height: 60 }, data: { label: "ActiveMQ Queue", icon: "MessageSquare", color: "#0ea5e9", isEip: true } }
      ],
      edges: [
        { id: "e-t-w", source: "node-trigger", target: "node-tap", animated: true, type: "custom", sourceHandle: "right", targetHandle: "left" },
        { id: "e-w-audit", source: "node-tap", target: "node-audit", animated: true, type: "custom", sourceHandle: "right", targetHandle: "left", label: "Tapped Copy" },
        { id: "e-w-enrich", source: "node-tap", target: "node-enrich", animated: true, type: "custom", sourceHandle: "right", targetHandle: "left", label: "Primary Flow" },
        { id: "e-e-q", source: "node-enrich", target: "node-queue", animated: true, type: "custom", sourceHandle: "right", targetHandle: "left" }
      ]
    },
    {
      name: "4. Transactional Saga Pipeline (Very Complex)",
      description: "A highly complex Camel pipeline using Http, Splitters, Choices, Kafka/ActiveMQ messaging, Message Aggregation and final DB storage.",
      nodes: [
        { id: "ts-http", type: 'custom', position: { x: 50, y: 150 }, style: { width: 120, height: 60 }, data: { label: "REST API", icon: "Webhook", color: "#06b6d4", isEip: true } },
        { id: "ts-split", type: 'custom', position: { x: 200, y: 150 }, style: { width: 120, height: 60 }, data: { label: "Splitter", icon: "Workflow", color: "#a855f7", isEip: true } },
        { id: "ts-choice", type: 'custom', position: { x: 350, y: 150 }, style: { width: 120, height: 60 }, data: { label: "Choice (Router)", icon: "GitBranch", color: "#f59e0b", isEip: true } },
        
        { id: "ts-when", type: 'custom', position: { x: 500, y: 90 }, style: { width: 120, height: 60 }, data: { label: "When", icon: "Filter", color: "#eab308", isEip: true, expressionType: "simple", expression: "${body.isPriority} == true" } },
        { id: "ts-other", type: 'custom', position: { x: 500, y: 210 }, style: { width: 120, height: 60 }, data: { label: "Otherwise", icon: "RefreshCw", color: "#94a3b8", isEip: true } },
        
        { id: "ts-kafka", type: 'custom', position: { x: 650, y: 90 }, style: { width: 120, height: 60 }, data: { label: "Kafka Topic", icon: "RadioTower", color: "#a855f7", isEip: true } },
        { id: "ts-activemq", type: 'custom', position: { x: 650, y: 210 }, style: { width: 120, height: 60 }, data: { label: "ActiveMQ", icon: "MessageCircle", color: "#ef4444", isEip: true } },
        
        { id: "ts-agg", type: 'custom', position: { x: 800, y: 150 }, style: { width: 120, height: 60 }, data: { label: "Aggregator", icon: "GitMerge", color: "#8b5cf6", isEip: true } },
        { id: "ts-db", type: 'custom', position: { x: 950, y: 150 }, style: { width: 120, height: 60 }, data: { label: "Database / JDBC", icon: "Database", color: "#10b981", isEip: true } }
      ],
      edges: [
        { id: "te-1", source: "ts-http", target: "ts-split", animated: true, type: "custom", sourceHandle: "right", targetHandle: "left" },
        { id: "te-2", source: "ts-split", target: "ts-choice", animated: true, type: "custom", sourceHandle: "right", targetHandle: "left" },
        { id: "te-3", source: "ts-choice", target: "ts-when", animated: true, type: "custom", sourceHandle: "right", targetHandle: "left" },
        { id: "te-4", source: "ts-choice", target: "ts-other", animated: true, type: "custom", sourceHandle: "right", targetHandle: "left" },
        { id: "te-5", source: "ts-when", target: "ts-kafka", animated: true, type: "custom", sourceHandle: "right", targetHandle: "left" },
        { id: "te-6", source: "ts-other", target: "ts-activemq", animated: true, type: "custom", sourceHandle: "right", targetHandle: "left" },
        { id: "te-7", source: "ts-kafka", target: "ts-agg", animated: true, type: "custom", sourceHandle: "right", targetHandle: "left" },
        { id: "te-8", source: "ts-activemq", target: "ts-agg", animated: true, type: "custom", sourceHandle: "right", targetHandle: "left" },
        { id: "te-9", source: "ts-agg", target: "ts-db", animated: true, type: "custom", sourceHandle: "right", targetHandle: "left" }
      ]
    }
  ]
};

const PaletteItem = ({ label, icon: Icon, color, type, shape, isContainer, isEip, textAlign, verticalAlign }) => {
  const onDragStart = (event) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ 
      label, 
      icon: type, 
      color, 
      shape, 
      isContainer, 
      isEip,
      textAlign: textAlign || 'center',
      verticalAlign: verticalAlign || 'middle'
    }));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="palette-item" onDragStart={onDragStart} draggable>
      <div className="palette-icon" style={{ color }}>
        <Icon size={20} />
      </div>
      <span>{label}</span>
    </div>
  );
};

const CollapsibleSection = ({ title, isOpen, onToggle, children }) => {
  return (
    <div className="sidebar-section">
      <div 
        className="sidebar-section-title" 
        onClick={onToggle}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
      >
        {title}
        {isOpen ? <ChevronLeft size={14} style={{ transform: 'rotate(-90deg)' }} /> : <ChevronLeft size={14} />}
      </div>
      {isOpen && <div className="sidebar-section-content">{children}</div>}
    </div>
  );
};

const camelDslKeyword = (label) => {
  if (!label) return null;
  const l = label.toLowerCase();
  if (l.includes('setbody')) return 'setBody';
  if (l.includes('setheader')) return 'setHeader';
  if (l.includes('log')) return 'log';
  if (l.includes('choice')) return 'choice';
  if (l.includes('when')) return 'when';
  if (l.includes('otherwise')) return 'otherwise';
  if (l.includes('marshal') && !l.includes('unmarshal')) return 'marshal';
  if (l.includes('unmarshal')) return 'unmarshal';
  if (l.includes('split')) return 'split';
  if (l.includes('aggregate')) return 'aggregate';
  if (l.includes('xslt') || l.includes('jslt') || l.includes('joor') || l.includes('groovy')) return 'transform';
  if (l.includes('to')) return 'to';
  return null;
};

const getUri = (label) => {
   if (!label) return 'custom:endpoint';
   const l = label.toLowerCase();
   if (l.includes('mock')) return `mock:{{mock-name}}`;
   if (l.includes('stub')) return `stub:{{stub-name}}`;
   if (l.includes('kafka')) return `kafka:{{kafka-topic}}`;
   if (l.includes('ibm mq')) return `ibmmq:{{ibmmq-queue}}`;
   if (l.includes('timer')) return `timer:{{timer-name}}?period={{timer-period}}`;
   if (l.includes('rest')) return `rest:get:{{api-path}}`;
   if (l.includes('database') || l.includes('sql') || l.includes('oracle')) return `sql:{{sql-query}}`;
   if (l.includes('mongodb')) return `mongodb:{{mongo-bean}}?database={{mongo-db}}&collection={{mongo-coll}}`;
   if (l.includes('bean')) return `bean:{{bean-name}}`;
   if (l.includes('file')) return `file:{{file-path}}`;
   if (l.includes('solace')) return `solace:queue:{{solace-queue}}`;
   if (l.includes('activemq')) return `activemq:queue:{{amq-queue}}`;
   if (l === 'to') return `{{to-endpoint}}`;
   return `kamelet:{{${l.replace(/\s+/g, '-')}-name}}`;
};

const getDefaultYamlForNode = (node) => {
  if (!node || !node.data) return '';
  const keyword = camelDslKeyword(node.data.label);
  if (!keyword && node.data.label !== 'Choice') return `- to:\n    uri: "${getUri(node.data.label)}"`;
  if (keyword === 'setBody' || keyword === 'setHeader') {
    const expType = node.data.expressionType || 'simple';
    const expVal = node.data.expression || 'TODO';
    if (expVal.includes('\n')) {
      return `- ${keyword}:\n    ${expType}: |\n` + expVal.split('\n').map(l => `      ${l}`).join('\n');
    }
    return `- ${keyword}:\n    ${expType}: "${expVal.replace(/"/g, '\\"')}"`;
  }
  if (keyword === 'log') return `- log:\n    message: "TODO"`;
  if (keyword === 'transform') {
    const lang = node.data.label.split(' ')[0].toLowerCase();
    return `- transform:\n    ${lang}: "TODO"`;
  }
  if (keyword === 'marshal' || keyword === 'unmarshal') {
    return `- ${keyword}:\n    json:\n      library: Jackson`;
  }
  if (keyword === 'choice') {
    return `- choice:\n    # when/otherwise logic is generated automatically from outgoing edges`;
  }
  return `- to:\n    uri: "${getUri(node.data.label)}"`;
};

const loadState = (key, defaultVal) => {
  const saved = localStorage.getItem(key);
  if (saved) {
    try { return JSON.parse(saved); } catch { return defaultVal; }
  }
  return defaultVal;
};

// Component palette for the "Code as Diagram" gallery. `{{idN}}` placeholders are
// replaced with fresh unique node ids when the snippet is inserted into the editor.
const CAD_SHAPES = [
  { name: 'Rectangle',     hint: 'process / step',   snippet: '{{id1}}["Rectangle"]' },
  { name: 'Rounded',       hint: 'soft process',     snippet: '{{id1}}("Rounded")' },
  { name: 'Stadium',       hint: 'start / end',      snippet: '{{id1}}(["Stadium"])' },
  { name: 'Subroutine',    hint: 'predefined',       snippet: '{{id1}}[["Subroutine"]]' },
  { name: 'Database',      hint: 'store / cylinder', snippet: '{{id1}}[("Database")]' },
  { name: 'Circle',        hint: 'state',            snippet: '{{id1}}(("Circle"))' },
  { name: 'Decision',      hint: 'branch / diamond', snippet: '{{id1}}{"Decision?"}' },
  { name: 'Hexagon',       hint: 'preparation',      snippet: '{{id1}}{{"Hexagon"}}' },
  { name: 'Parallelogram', hint: 'input / output',   snippet: '{{id1}}[/"Input"/]' },
  { name: 'Flag',          hint: 'asymmetric',       snippet: '{{id1}}>"Flag"]' },
];

const CAD_EDGES = [
  { name: 'Arrow',          hint: 'A --> B',        snippet: '{{id1}} --> {{id2}}' },
  { name: 'Open link',      hint: 'A --- B',        snippet: '{{id1}} --- {{id2}}' },
  { name: 'Dotted',         hint: 'A -.-> B',       snippet: '{{id1}} -.-> {{id2}}' },
  { name: 'Thick',          hint: 'A ==> B',        snippet: '{{id1}} ==> {{id2}}' },
  { name: 'Labelled',       hint: 'A -->|text| B',  snippet: '{{id1}} -->|label| {{id2}}' },
  { name: 'Cross end',      hint: 'A --x B',        snippet: '{{id1}} --x {{id2}}' },
  { name: 'Circle end',     hint: 'A --o B',        snippet: '{{id1}} --o {{id2}}' },
  { name: 'Bi-directional', hint: 'A <--> B',       snippet: '{{id1}} <--> {{id2}}' },
];

// Size a DaC node to fit its label so the auto-layout spacing matches the actual
// box size — this keeps connectors short and the boxes/text comfortably readable.
const estimateDacNodeSize = (node) => {
  if (node.data?.isContainer) return null; // containers are sized from their children
  const label = String(node.data?.label ?? node.id ?? '');
  const lines = label.split('\n');
  const longest = Math.max(1, ...lines.map(l => l.length));
  let w = Math.min(340, Math.max(150, Math.round(longest * 8.4 + 44)));
  let h = Math.max(60, lines.length * 20 + 30);
  switch (node.data?.shape) {
    case 'circle': { const d = Math.max(w, h, 96); w = d; h = d; break; }
    case 'diamond': { w = Math.max(w, 140); h = Math.max(h, 96); break; }
    case 'cylinder': { h = Math.max(h, 82); break; }
    default: break;
  }
  return { width: w, height: h };
};

const CAD_STRUCTURES = [
  { name: 'Subgraph',  hint: 'group of nodes',     snippet: 'subgraph {{id1}} ["Group"]\n    {{id2}}["Child"]\n  end' },
  { name: 'Class def', hint: 'reusable colour',    snippet: 'classDef hot fill:#ef444422,stroke:#ef4444\n  class {{id1}} hot' },
  { name: 'Inline style', hint: 'colour one node', snippet: '{{id1}}["Styled"]\n  style {{id1}} fill:#22c55e22,stroke:#22c55e' },
  { name: 'Comment',   hint: 'note in source',     snippet: '%% your comment here' },
];

function FlowCanvas({ onGoHome }) {
  const { theme } = useTheme();
  const reactFlowWrapper = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingColor, setDrawingColor] = useState('#3b82f6');
  const [drawFillColor, setDrawFillColor] = useState('transparent');
  const [drawOpacity, setDrawOpacity] = useState(100);
  const [drawFillOpacity, setDrawFillOpacity] = useState(100);
  const [drawStrokeOpacity, setDrawStrokeOpacity] = useState(100);
  const [drawingStrokeWidth, setDrawingStrokeWidth] = useState(1);
  const [drawStrokeStyle, setDrawStrokeStyle] = useState('solid'); // 'solid', 'dashed', 'dotted'
  const [drawShadow, setDrawShadow] = useState(false);
  const [drawShadowColor, setDrawShadowColor] = useState('#000000');
  const [drawShadowOpacity, setDrawShadowOpacity] = useState(60);
  const [drawShadowBlur, setDrawShadowBlur] = useState(8);
  const [drawCornerRadius, setDrawCornerRadius] = useState(4);
  const [currentPath, setCurrentPath] = useState([]);
  const currentPathRef = useRef([]);
  const [brandSearch, setBrandSearch] = useState('');

  // Separate states for DDD vs Diagram vs EIP workspaces
  const [dddNodes, setDddNodes, onDddNodesChange] = useNodesState(loadState('dddNodes', initialNodes));
  const [dddEdges, setDddEdges, onDddEdgesChange] = useEdgesState(loadState('dddEdges', initialEdges));
  const [diagramNodes, setDiagramNodes, onDiagramNodesChange] = useNodesState(loadState('diagramNodes', []));
  const [diagramEdges, setDiagramEdges, onDiagramEdgesChange] = useEdgesState(loadState('diagramEdges', []));
  const [drawNodes, setDrawNodes, onDrawNodesChange] = useNodesState(
    loadState('drawNodes', []).map(n => ({ ...n, data: { ...n.data, isDrawShape: true } }))
  );
  const [drawEdges, setDrawEdges, onDrawEdgesChange] = useEdgesState(loadState('drawEdges', []));
  const drawNodesRef = useRef(drawNodes);
  const drawEdgesRef = useRef(drawEdges);
  useEffect(() => { drawNodesRef.current = drawNodes; }, [drawNodes]);
  useEffect(() => { drawEdgesRef.current = drawEdges; }, [drawEdges]);

  // Draw history for undo/redo
  const drawHistoryRef = useRef([{ nodes: loadState('drawNodes', []).map(n => ({ ...n, data: { ...n.data, isDrawShape: true } })), edges: loadState('drawEdges', []) }]);
  const drawHistoryIndexRef = useRef(0);
  const drawClipboardRef = useRef([]);
  const [drawToolLock, setDrawToolLock] = useState(false);

  const pushDrawHistory = useCallback((nodes, edges) => {
    const history = drawHistoryRef.current.slice(0, drawHistoryIndexRef.current + 1);
    history.push({ nodes: nodes.map(n => ({ ...n })), edges: edges.map(e => ({ ...e })) });
    if (history.length > 60) history.shift();
    drawHistoryRef.current = history;
    drawHistoryIndexRef.current = history.length - 1;
  }, []);

  const undoDraw = useCallback(() => {
    const idx = drawHistoryIndexRef.current;
    if (idx <= 0) return;
    drawHistoryIndexRef.current = idx - 1;
    const { nodes, edges } = drawHistoryRef.current[idx - 1];
    setDrawNodes(nodes);
    setDrawEdges(edges);
  }, [setDrawNodes, setDrawEdges]);

  const redoDraw = useCallback(() => {
    const idx = drawHistoryIndexRef.current;
    const history = drawHistoryRef.current;
    if (idx >= history.length - 1) return;
    drawHistoryIndexRef.current = idx + 1;
    const { nodes, edges } = history[idx + 1];
    setDrawNodes(nodes);
    setDrawEdges(edges);
  }, [setDrawNodes, setDrawEdges]);

  const [eipNodes, setEipNodes, onEipNodesChange] = useNodesState(loadState('eipNodes', []));
  const [eipEdges, setEipEdges, onEipEdgesChange] = useEdgesState(loadState('eipEdges', []));

  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const reactFlowInstanceRef = useRef(null);

  const [workspace, setWorkspace] = useState(localStorage.getItem('workspace') || 'cad');
  const workspaceRef = useRef(workspace);
  useEffect(() => {
    workspaceRef.current = workspace;
    if (workspace === 'cad') {
      // Re-fit when switching back to CAD tab
      const t1 = setTimeout(() => reactFlowInstanceRef.current?.fitView({ padding: 0.05, duration: 400 }), 120);
      const t2 = setTimeout(() => reactFlowInstanceRef.current?.fitView({ padding: 0.05, duration: 400 }), 450);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [workspace]);

  // (CAD panel size tracking removed — ReactFlow fitView handles layout natively)

  useEffect(() => {
    const el = cadCanvasRef.current;
    if (!el) return;
    // No custom pan needed — ReactFlow handles pan/zoom natively in CAD mode
    const noop = () => {};
    return noop;
  }, []);
  const [activeTool, setActiveTool] = useState('select'); 
  const [interactionMode, setInteractionMode] = useState('move'); 
  const [sectionsOpen, setSectionsOpen] = useState({ 
    ddd_strategic: true,
    ddd_tactical: true,
    ddd_event: true,
    flowchart: true,
    sysarch: true,
    uml: true,
    er: true,
    mindmap: true,
    eip_core: true,
    eip_endpoints: true,
    eip_transforms: true,
    eip_logic: true,
    annotations: true,
    draw_sketch: true,
    draw_shapes: true,
    draw_annotations: true,
    draw_brands: true,
    draw_infra: true,
    draw_network: true,
    draw_apps: true,
    draw_middleware: true,
    draw_people: true,
  });

  const toggleSection = (key) => setSectionsOpen(prev => ({ ...prev, [key]: !prev[key] }));
  const expandAll = () => setSectionsOpen({ ddd_strategic: true, ddd_tactical: true, ddd_event: true, flowchart: true, sysarch: true, uml: true, er: true, mindmap: true, eip_core: true, eip_endpoints: true, eip_transforms: true, eip_logic: true, draw_sketch: true, draw_shapes: true, draw_annotations: true, draw_brands: true, draw_infra: true, draw_network: true, draw_apps: true, draw_middleware: true, draw_people: true, annotations: true });
  const collapseAll = () => setSectionsOpen({ ddd_strategic: false, ddd_tactical: false, ddd_event: false, flowchart: false, sysarch: false, uml: false, er: false, mindmap: false, eip_core: false, eip_endpoints: false, eip_transforms: false, eip_logic: false, draw_sketch: false, draw_shapes: false, draw_annotations: false, draw_brands: false, draw_infra: false, draw_network: false, draw_apps: false, draw_middleware: false, draw_people: false, annotations: false });

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const clearCanvas = () => {
    setShowClearConfirm(true);
  };

  const [dragStartPos, setDragStartPos] = useState(null);
  const [ghostNode, setGhostNode] = useState(null);
  const dragStartPosRef = useRef(null);
  const ghostNodeRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        if (e.ctrlKey && e.shiftKey && (e.key === '>' || e.key === '<' || e.key === '.' || e.key === ',')) {
          e.preventDefault();
          const grow = e.key === '>' || e.key === '.';
          setDrawNodes(nds => nds.map(n => {
            if (!n.selected) return n;
            const cur = parseInt(n.data.fontSize) || 16;
            const next = Math.max(8, grow ? cur + 2 : cur - 2);
            return { ...n, data: { ...n.data, fontSize: next + 'px' } };
          }));
        }
        return;
      }
      if (document.activeElement?.closest?.('.monaco-editor') || document.activeElement?.closest?.('.monaco-editor-container')) return;

      const key = e.key.toLowerCase();

      // Global hotkeys
      if (key === 'v') { setActiveTool('select'); setIsDrawingMode(false); setInteractionMode('move'); return; }
      if (key === 'h') {
        if (workspaceRef.current === 'draw') { setActiveTool('hand'); setIsDrawingMode(false); }
        setInteractionMode('pan');
        return;
      }
      if (key === 't' && workspaceRef.current !== 'draw') {
        if (workspaceRef.current === 'cad') { setShowTemplateGallery(true); } else { setTemplateFocusIdx(0); setShowTemplatesModal(true); setShowTemplateGallery(false); }
        return;
      }
      if (key === 'n' && workspaceRef.current === 'cad') {
        addCanvasWidget('note');
        return;
      }
      if (key === 'escape') {
        setActiveTool('select');
        setIsDrawingMode(false);
        setInteractionMode('move');
        setDragStartPos(null);
        setGhostNode(null);
        setCurrentPath([]);
        return;
      }

      // Ctrl+Arrow: create child node in direction
      if (e.ctrlKey && ['arrowright', 'arrowleft', 'arrowup', 'arrowdown'].includes(key)) {
        e.preventDefault();
        const dir = key === 'arrowright' ? 'right' : key === 'arrowleft' ? 'left' : key === 'arrowup' ? 'up' : 'down';
        if (workspaceRef.current === 'draw') {
          drawAddDirectionalRef.current?.(dir);
        } else {
          cadAddDirectionalRef.current?.(dir);
        }
        return;
      }

      // Draw workspace: Ctrl+Z/Y, Ctrl+C/V/X/D/A
      if (workspaceRef.current === 'draw') {
        if (e.ctrlKey && e.shiftKey && (e.key === '>' || e.key === '<' || e.key === '.' || e.key === ',')) {
          e.preventDefault();
          const grow = e.key === '>' || e.key === '.';
          setDrawNodes(nds => nds.map(n => {
            if (!n.selected) return n;
            const cur = parseInt(n.data.fontSize) || 16;
            const next = Math.max(8, grow ? cur + 2 : cur - 2);
            return { ...n, data: { ...n.data, fontSize: next + 'px' } };
          }));
          return;
        }
        if (e.ctrlKey && key === 'z' && !e.shiftKey) { e.preventDefault(); undoDraw(); return; }
        if (e.ctrlKey && (key === 'y' || (key === 'z' && e.shiftKey))) { e.preventDefault(); redoDraw(); return; }
        if (e.ctrlKey && key === 'c') {
          e.preventDefault();
          const selected = drawNodesRef.current.filter(n => n.selected);
          if (selected.length > 0) drawClipboardRef.current = selected.map(n => ({ ...n, data: { ...n.data } }));
          return;
        }
        if (e.ctrlKey && key === 'x') {
          e.preventDefault();
          const selected = drawNodesRef.current.filter(n => n.selected);
          if (selected.length === 0) return;
          drawClipboardRef.current = selected.map(n => ({ ...n, data: { ...n.data } }));
          const ids = new Set(selected.map(n => n.id));
          const newNodes = drawNodesRef.current.filter(n => !ids.has(n.id));
          const newEdges = drawEdgesRef.current.filter(ed => !ids.has(ed.source) && !ids.has(ed.target));
          setDrawNodes(newNodes);
          setDrawEdges(newEdges);
          pushDrawHistory(newNodes, newEdges);
          return;
        }
        if (e.ctrlKey && key === 'v') {
          e.preventDefault();
          if (!drawClipboardRef.current.length) return;
          const offset = 20;
          const newNodes = drawClipboardRef.current.map(n => ({
            ...n,
            id: uuidv4(),
            position: { x: n.position.x + offset, y: n.position.y + offset },
            selected: true,
            data: { ...n.data }
          }));
          drawClipboardRef.current = newNodes;
          setDrawNodes(nds => [...nds.map(n => ({ ...n, selected: false })), ...newNodes]);
          pushDrawHistory([...drawNodesRef.current.map(n => ({ ...n, selected: false })), ...newNodes], drawEdgesRef.current);
          return;
        }
        if (e.ctrlKey && key === 'd') {
          e.preventDefault();
          const selected = drawNodesRef.current.filter(n => n.selected);
          if (!selected.length) return;
          const newNodes = selected.map(n => ({
            ...n,
            id: uuidv4(),
            position: { x: n.position.x + 20, y: n.position.y + 20 },
            selected: true,
            data: { ...n.data }
          }));
          setDrawNodes(nds => [...nds.map(n => ({ ...n, selected: false })), ...newNodes]);
          pushDrawHistory([...drawNodesRef.current.map(n => ({ ...n, selected: false })), ...newNodes], drawEdgesRef.current);
          return;
        }
        if (e.ctrlKey && key === 'a') {
          e.preventDefault();
          setDrawNodes(nds => nds.map(n => ({ ...n, selected: true })));
          return;
        }
      }

      if (workspace !== 'draw') return;

      switch (key) {
        case '1': setActiveTool('select'); setIsDrawingMode(false); setInteractionMode('move'); break;
        case '2': case 'r': setActiveTool('rectangle'); setIsDrawingMode(false); break;
        case '3': case 'd': if (!e.ctrlKey) { setActiveTool('diamond'); setIsDrawingMode(false); } break;
        case '4': case 'o': setActiveTool('circle'); setIsDrawingMode(false); break;
        case '5': setActiveTool('arrow'); setIsDrawingMode(false); break;
        case '6': setActiveTool('line'); setIsDrawingMode(false); break;
        case '7': case 'p': setActiveTool('pencil'); setIsDrawingMode(true); break;
        case '8': case 't': setActiveTool('text'); setIsDrawingMode(false); break;
        case '9': setActiveTool('note'); setIsDrawingMode(false); break;
        case '0': setActiveTool('triangle'); setIsDrawingMode(false); break;
        case 'c': if (!e.ctrlKey) { setActiveTool('cloud'); setIsDrawingMode(false); } break;
        case 'l': if (!e.ctrlKey) { setActiveTool('line'); setIsDrawingMode(false); } break;
        case 'a': if (!e.ctrlKey) { setActiveTool('arrow'); setIsDrawingMode(false); } break;
        case 'e': setActiveTool('eraser'); setIsDrawingMode(false); break;
        case 'n': addCanvasWidget('note'); setActiveTool('select'); setIsDrawingMode(false); break;
        case 'b': toggleSection('draw_brands'); break;
        case 'x': if (!e.ctrlKey) clearCanvas(); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [workspace, undoDraw, redoDraw, pushDrawHistory, setDrawNodes, setDrawEdges]);

  const [showHelp, setShowHelp] = useState(false);
  const [helpTab, setHelpTab] = useState('diagrams');
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [templateFocusIdx, setTemplateFocusIdx] = useState(0);
  const templateFocusIdxRef = useRef(0);
  useEffect(() => { templateFocusIdxRef.current = templateFocusIdx; }, [templateFocusIdx]);

  const loadTemplateRef = useRef(null);
  // Keyboard navigation for templates modal (non-CAD)
  useEffect(() => {
    if (!showTemplatesModal) return;
    const list = templates[workspace] || [];
    const handler = (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setTemplateFocusIdx(i => Math.min(i + 1, list.length - 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setTemplateFocusIdx(i => Math.max(i - 1, 0)); }
      else if (e.key === 'Enter') { e.preventDefault(); const tpl = list[templateFocusIdxRef.current]; if (tpl && loadTemplateRef.current) { loadTemplateRef.current(tpl); setShowTemplatesModal(false); } }
      else if (e.key === 'Escape') { setShowTemplatesModal(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showTemplatesModal, workspace]);

  const [showTextEditor, setShowTextEditor] = useState(false);
  const [editorContent, setEditorContent] = useState('');
  const [autoArrangeOnImport, setAutoArrangeOnImport] = useState(true);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showCadEditor, setShowCadEditor] = useState(true);
  const [splitWidth, setSplitWidth] = useState(450);
  const [cadCode, setCadCode] = useState(() => {
    const cached = localStorage.getItem('cadCode') || localStorage.getItem('dacCode');
    return (cached && cached.trim()) ? cached : cadTemplates[0].code;
  });
  const [cadNodes, setCadNodes, onCadNodesChange] = useNodesState(loadState('cadNodes', loadState('dacNodes', [])));
  const [cadEdges, setCadEdges, onCadEdgesChange] = useEdgesState(loadState('cadEdges', loadState('dacEdges', [])));
  const cadNodesRef = useRef(cadNodes);
  const cadEdgesRef = useRef(cadEdges);
  useEffect(() => { cadNodesRef.current = cadNodes; }, [cadNodes]);
  useEffect(() => { cadEdgesRef.current = cadEdges; }, [cadEdges]);
  const [cadStatus, setCadStatus] = useState({ ok: true, message: '' });
const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  // 'docked' | 'collapsed' | 'float'
  const [editorMode, setEditorMode] = useState('docked');
  const [editorOpacity, setEditorOpacity] = useState(90);
  const [floatPos, setFloatPos] = useState({ x: 24, y: 60 });
  const floatDragRef = useRef(null);
  const [cadGalFilter, setCadGalFilter] = useState('All');
  const cadSigRef = useRef(null);       // last structural signature applied to canvas
  const cadSourceRef = useRef('code');  // 'code' | 'canvas' — who last changed cadCode
  const cadDirRef = useRef('TB');       // last parsed flow direction (for serialise round-trip)
  const cadIdRef = useRef(0);           // monotonic counter for generated node ids
  const cadReadyRef = useRef(false);    // true once code has been applied to the canvas at least once
  const cadEditorRef = useRef(null);    // monaco editor instance
  const cadMonacoRef = useRef(null);    // monaco namespace
  const cadCanvasRef   = useRef(null);   // diagram area div (right panel in CAD)
  const cadPreviewRef  = useRef(null);   // inner preview area (kept for layout ref)
  const cadKind = workspace === 'cad' ? detectDiagramKind(cadCode) : 'flowchart'; // 'flowchart' | 'other'
  const [cadDiagramPos, setCadDiagramPos] = useState({ x: 0, y: 0 }); // position of the whole diagram in flow space
  const [diagramTitle, setDiagramTitle] = useState(() => {
    return localStorage.getItem(`${workspace}-title`) || (
      workspace === 'ddd' ? 'Domain-Driven Design Blueprint' :
      workspace === 'diagram' ? 'System Architecture Topology' :
      workspace === 'draw' ? 'Free-form Sketch' : 'Camel Route Pipeline'
    );
  });

  useEffect(() => {
    const saved = localStorage.getItem(`${workspace}-title`);
    if (saved) {
      setDiagramTitle(saved);
    } else {
      const def = workspace === 'ddd' ? 'Domain-Driven Design Blueprint' :
                  workspace === 'diagram' ? 'System Architecture Topology' :
                  workspace === 'draw' ? 'Free-form Sketch' :
                  workspace === 'cad' ? 'Code as Diagram' : 'Camel Route Pipeline';
      setDiagramTitle(def);
    }
  }, [workspace]);

  const getSanitizedBaseName = () => {
    return diagramTitle
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  };

  useEffect(() => {
    localStorage.setItem('workspace', workspace);
    if (workspace === 'cad') setShowCadEditor(true);
  }, [workspace]);

  // Sync DaC Code -> Canvas (debounced). Preserves manual positions when the
  // graph structure is unchanged; re-lays-out cleanly when it changes.
  useEffect(() => {
    if (workspace !== 'cad') return;

    // Strict one-way code -> canvas compilation enabled.
    // If a canvas interaction tried to set the source, reset it to 'code' to prevent feedback loops.
    if (cadSourceRef.current === 'canvas') {
      cadSourceRef.current = 'code';
    }

    // For CAD workspace, React Flow maintains a dummy node (diagram drag-handle) plus sticky notes.
    const stickyNotes = cadNodesRef.current.filter(n => n.data?.shape === 'note').map(n => ({ ...n, draggable: true, selectable: true, zIndex: 9999, style: { ...n.style, zIndex: 9999 } }));
    const activeDummy = cadNodesRef.current.find(n => n.id === 'mermaid-other-node');
    const nonNoteNonDummy = cadNodesRef.current.filter(n => n.data?.shape !== 'note' && n.id !== 'mermaid-other-node');
    if (!activeDummy || nonNoteNonDummy.length > 0 || cadEdges.length > 0) {
      const pos = activeDummy?.position || { x: 0, y: 0 };
      setCadNodes([{
        id: 'mermaid-other-node',
        type: 'custom',
        position: pos,
        draggable: true,
        selectable: true,
        data: { label: '', shape: 'dummy', width: 800, height: 600 },
        style: { width: 800, height: 600 }
      }, ...stickyNotes]);
      setCadEdges([]);
    }

    // Validate Mermaid code for status display in the editor.
    const timeout = setTimeout(() => {
      const status = validateMermaid(cadCode);
      setCadStatus(status);
    }, 350);
    return () => clearTimeout(timeout);
  }, [cadCode, workspace]);

  // Render Mermaid code → SVG → update ReactFlow node → fitView (same mechanism as Diagram tab)
  useEffect(() => {
    if (workspace !== 'cad') return;
    let cancelled = false;
    const trimmed = (cadCode || '').trim();
    if (!trimmed) {
      setCadStatus({ ok: true, message: '' });
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const mmd = await getMMD(theme);
        const id  = `ms-cad-${++_mmdSeq}`;
        const { svg: raw } = await mmd.render(id, trimmed);
        if (cancelled) return;
        const { text: svgHtml, w, h } = parseCadSvg(raw);
        setCadNodes(prev => prev.map(n => {
          if (n.id !== 'mermaid-other-node') return n;
          return { ...n, style: { width: w, height: h }, data: { ...n.data, shape: 'cadSvg', svgHtml, width: w, height: h } };
        }));
        setCadStatus({ ok: true, message: 'Rendered' });
        setTimeout(() => reactFlowInstance?.fitView({ padding: 0.05, duration: 400 }), 60);
      } catch (e) {
        if (cancelled) return;
        const msg = (e?.str || e?.message || 'Render error').split('\n').find(l => l.trim()) || 'Render error';
        setCadStatus({ ok: false, message: msg });
      }
    }, 350);
    return () => { cancelled = true; clearTimeout(handle); };
  }, [cadCode, theme, workspace, reactFlowInstance]);

  // Canvas -> Code serialization removed for strict one-way code-to-diagram compilation.

  // VSCode-style error squiggles: surface parse/render errors as Monaco markers.
  useEffect(() => {
    const editor = cadEditorRef.current;
    const monaco = cadMonacoRef.current;
    if (workspace !== 'cad' || !editor || !monaco) return;
    const model = editor.getModel();
    if (!model) return;
    if (cadStatus.ok) {
      monaco.editor.setModelMarkers(model, 'mermaid', []);
      return;
    }
    const msg = cadStatus.message || 'Syntax error';
    const lineMatch = /line[s]?\s*[:#]?\s*(\d+)/i.exec(msg);
    const total = model.getLineCount();
    const line = Math.min(total, Math.max(1, lineMatch ? parseInt(lineMatch[1], 10) : 1));
    monaco.editor.setModelMarkers(model, 'mermaid', [{
      severity: monaco.MarkerSeverity.Error,
      message: msg,
      startLineNumber: line,
      startColumn: 1,
      endLineNumber: line,
      endColumn: model.getLineMaxColumn(line),
    }]);
  }, [cadStatus, workspace, cadCode]);

  const [isRoughGlobal, setIsRoughGlobal] = useState(loadState('isRoughGlobal', false));

  useEffect(() => {
    localStorage.setItem('isRoughGlobal', JSON.stringify(isRoughGlobal));
  }, [isRoughGlobal]);


  useEffect(() => {
    localStorage.setItem('dddNodes', JSON.stringify(dddNodes));
    localStorage.setItem('dddEdges', JSON.stringify(dddEdges));
  }, [dddNodes, dddEdges]);

  useEffect(() => {
    localStorage.setItem('diagramNodes', JSON.stringify(diagramNodes));
    localStorage.setItem('diagramEdges', JSON.stringify(diagramEdges));
  }, [diagramNodes, diagramEdges]);

  useEffect(() => {
    localStorage.setItem('drawNodes', JSON.stringify(drawNodes));
    localStorage.setItem('drawEdges', JSON.stringify(drawEdges));
  }, [drawNodes, drawEdges]);

  useEffect(() => {
    localStorage.setItem('eipNodes', JSON.stringify(eipNodes));
    localStorage.setItem('eipEdges', JSON.stringify(eipEdges));
  }, [eipNodes, eipEdges]);

  useEffect(() => {
    localStorage.setItem('cadNodes', JSON.stringify(cadNodes));
    localStorage.setItem('cadEdges', JSON.stringify(cadEdges));
  }, [cadNodes, cadEdges]);

  useEffect(() => {
    localStorage.setItem('cadCode', cadCode);
  }, [cadCode]);

  const nodes = workspace === 'ddd' ? dddNodes : (workspace === 'diagram' ? diagramNodes : (workspace === 'draw' ? drawNodes : eipNodes));
  const edges = workspace === 'ddd' ? dddEdges : (workspace === 'diagram' ? diagramEdges : (workspace === 'draw' ? drawEdges : eipEdges));

  // In cad workspace, we always explicitly pass only the dummy node to ReactFlow
  const reactFlowNodes = workspace === 'cad' ? cadNodes : nodes;
  const reactFlowEdges = workspace === 'cad' ? cadEdges : edges;
  const setNodes = workspace === 'ddd' ? setDddNodes : (workspace === 'diagram' ? setDiagramNodes : (workspace === 'draw' ? setDrawNodes : (workspace === 'cad' ? setCadNodes : setEipNodes)));
  const setEdges = workspace === 'ddd' ? setDddEdges : (workspace === 'diagram' ? setDiagramEdges : (workspace === 'draw' ? setDrawEdges : (workspace === 'cad' ? setCadEdges : setEipEdges)));
  const onNodesChange = workspace === 'ddd' ? onDddNodesChange : (workspace === 'diagram' ? onDiagramNodesChange : (workspace === 'draw' ? onDrawNodesChange : (workspace === 'cad' ? onCadNodesChange : onEipNodesChange)));
  const onEdgesChange = workspace === 'ddd' ? onDddEdgesChange : (workspace === 'diagram' ? onDiagramEdgesChange : (workspace === 'draw' ? onDrawEdgesChange : (workspace === 'cad' ? onCadEdgesChange : onEipEdgesChange)));

  const handleNodesChange = useCallback((changes) => {
    const removeChanges = changes.filter(c => c.type === 'remove');
    if (removeChanges.length > 0) {
      const removedIds = removeChanges.map(c => c.id);
      const idsSet = new Set(removedIds);
      const queue = [...removedIds];
      while (queue.length > 0) {
        const currentId = queue.shift();
        nodes.forEach(node => {
          if (node.parentId === currentId && !idsSet.has(node.id)) {
            idsSet.add(node.id);
            queue.push(node.id);
          }
        });
      }
      
      const extraIds = [...idsSet].filter(id => !removedIds.includes(id));
      if (extraIds.length > 0) {
        extraIds.forEach(id => {
          changes.push({ type: 'remove', id });
        });
      }
      
      setEdges(eds => eds.filter(edge => !idsSet.has(edge.source) && !idsSet.has(edge.target)));
    }
    
    onNodesChange(changes);

    const positionChanges = changes.filter(c => c.type === 'position' && c.position);
    if (positionChanges.length > 0) {
      setNodes(nds => {
        const parentIdsToUpdate = new Set();
        positionChanges.forEach(change => {
          const node = nds.find(n => n.id === change.id);
          if (node && node.parentId) {
            parentIdsToUpdate.add(node.parentId);
          }
        });

        if (parentIdsToUpdate.size === 0) return nds;

        return nds.map(n => {
          if (parentIdsToUpdate.has(n.id) && n.data?.isContainer) {
            const children = nds.filter(c => c.parentId === n.id);
            const childWidth = 160;
            
            let maxX = 0;
            let maxY = 0;
            children.forEach(c => {
              let nodeHeight = 80;
              if (c.data?.shape === 'class') nodeHeight = 120;
              else if (c.data?.shape === 'actor') nodeHeight = 90;
              
              const rightSide = c.position.x + childWidth;
              const bottomSide = c.position.y + nodeHeight;
              if (rightSide > maxX) maxX = rightSide;
              if (bottomSide > maxY) maxY = bottomSide;
            });
            
            return {
              ...n,
              style: {
                ...n.style,
                width: Math.max(400, maxX + 50),
                height: Math.max(300, maxY + 50),
                zIndex: -1
              }
            };
          }
          return n;
        });
      });
    }

    // (DaC canvas -> code serialisation is handled by the debounced canonical-diff
    //  effect, which covers drags, deletes, label/colour/shape edits and connects.)
  }, [nodes, edges, onNodesChange, setEdges, setNodes, workspace]);
  
  const { x, y, zoom } = useViewport();

  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback((e) => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e) => {
    if (isResizing) {
      setSplitWidth(Math.max(200, Math.min(e.clientX, window.innerWidth - 400)));
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  const onMoveEnd = useCallback((event, viewport) => {
    localStorage.setItem('flow-viewport', JSON.stringify(viewport));
  }, []);

  // Load shared state from URL hash on mount
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    const wsMap = {
      '#draw=': ['draw', setDrawNodes, setDrawEdges],
      '#diagram=': ['diagram', setDiagramNodes, setDiagramEdges],
      '#ddd=': ['ddd', setDddNodes, setDddEdges],
      '#eip=': ['eip', setEipNodes, setEipEdges],
      '#cad=': ['cad', setCadNodes, setCadEdges],
    };
    for (const [prefix, [ws, setN, setE]] of Object.entries(wsMap)) {
      if (hash.startsWith(prefix)) {
        try {
          const json = JSON.parse(atob(hash.slice(prefix.length)));
          if (json.nodes && json.edges) {
            setN(json.nodes);
            setE(json.edges);
            setWorkspace(ws);
            history.replaceState(null, '', window.location.pathname + window.location.search);
          }
        } catch { /* ignore malformed hash */ }
        break;
      }
    }
  }, []);

  const initialViewport = loadState('flow-viewport', { x: 0, y: 0, zoom: 1 });

  const [bgVariant, setBgVariant] = useState('dots'); // 'dots' or 'plain'
  const [showJson, setShowJson] = useState(false);
  const [jsonIncludeNotes, setJsonIncludeNotes] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge({ ...params, type: 'custom', animated: true, style: { strokeWidth: 3, stroke: '#94a3b8' } }, eds)), [setEdges]);

  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const selectedNodeIdRef = useRef(null);
  useEffect(() => { selectedNodeIdRef.current = selectedNodeId; }, [selectedNodeId]);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  useOnSelectionChange({
    onChange: ({ nodes, edges }) => {
      setSelectedNodeId(nodes.length === 1 ? nodes[0].id : null);
      setSelectedEdgeId(edges.length === 1 && nodes.length === 0 ? edges[0].id : null);
    },
  });

  const activeNode = nodes.find(n => n.id === selectedNodeId);
  const activeEdge = edges.find(e => e.id === selectedEdgeId);

  const updateNodeData = (key, value) => {
    if (!selectedNodeId) return;
    setNodes(nds => nds.map(node => {
      if (node.id === selectedNodeId) {
        return { ...node, data: { ...node.data, [key]: value } };
      }
      return node;
    }));
  };

  const updateEdgeData = (key, value) => {
    if (!selectedEdgeId) return;
    setEdges(eds => eds.map(edge => {
      if (edge.id === selectedEdgeId) {
        if (key === 'animated') return { ...edge, animated: value };
        if (key === 'label') return { ...edge, label: value };
        if (key === 'type') return { ...edge, type: value };
        if (key === 'showLabel') return { ...edge, showLabel: value };
        if (key === 'strokeWidth' || key === 'stroke') {
           const newStyle = { ...edge.style, [key]: value };
           const updatedEdge = { ...edge, style: newStyle };
           if (key === 'stroke') {
             if (edge.markerEnd) updatedEdge.markerEnd = { ...edge.markerEnd, color: value };
             if (edge.markerStart) updatedEdge.markerStart = { ...edge.markerStart, color: value };
           }
           return updatedEdge;
        }
        if (key === 'direction') {
           const color = edge.style?.stroke || '#94a3b8';
           if (value === 'forward') return { ...edge, markerEnd: { type: MarkerType.ArrowClosed, color }, markerStart: undefined };
           if (value === 'backward') return { ...edge, markerStart: { type: MarkerType.ArrowClosed, color }, markerEnd: undefined };
           if (value === 'bidirectional') return { ...edge, markerEnd: { type: MarkerType.ArrowClosed, color }, markerStart: { type: MarkerType.ArrowClosed, color } };
           if (value === 'none') return { ...edge, markerEnd: undefined, markerStart: undefined };
        }
        if (key === 'labelColor') {
           return { ...edge, labelStyle: { ...edge.labelStyle, fill: value } };
        }
        if (key === 'labelBgColor') {
           return { ...edge, labelBgStyle: { ...edge.labelBgStyle, fill: value } };
        }
        if (key === 'labelBgAlpha') {
           return { ...edge, labelBgStyle: { ...edge.labelBgStyle, fillOpacity: value } };
        }
      }
      return edge;
    }));
  };


  const deleteSelectedNode = () => {
    if (!selectedNodeId) return;
    const idsSet = new Set([selectedNodeId]);
    const queue = [selectedNodeId];
    while (queue.length > 0) {
      const currentId = queue.shift();
      nodes.forEach(node => {
        if (node.parentId === currentId && !idsSet.has(node.id)) {
          idsSet.add(node.id);
          queue.push(node.id);
        }
      });
    }
    setNodes(nds => nds.filter(node => !idsSet.has(node.id)));
    setEdges(eds => eds.filter(edge => !idsSet.has(edge.source) && !idsSet.has(edge.target)));
    setSelectedNodeId(null);
  };

  const deleteContextMenuNode = () => {
    if (!contextMenu) return;
    const targetId = contextMenu.id;
    const idsSet = new Set([targetId]);
    const queue = [targetId];
    while (queue.length > 0) {
      const currentId = queue.shift();
      nodes.forEach(node => {
        if (node.parentId === currentId && !idsSet.has(node.id)) {
          idsSet.add(node.id);
          queue.push(node.id);
        }
      });
    }
    setNodes(nds => nds.filter(node => !idsSet.has(node.id)));
    setEdges(eds => eds.filter(edge => !idsSet.has(edge.source) && !idsSet.has(edge.target)));
    if (selectedNodeId && idsSet.has(selectedNodeId)) setSelectedNodeId(null);
    setContextMenu(null);
  };

  /* ----------------------------------------------------------------------- */
  /*  Code-as-Diagram canvas mutations. Code is the source of truth, so every */
  /*  edit re-serialises back into the editor (cadSourceRef = 'canvas' keeps   */
  /*  the sync effect from clobbering the layout).                            */
  /* ----------------------------------------------------------------------- */
  const cadCommit = (newNodes, newEdges) => {
    // Keep sticky notes on top and out of the mermaid serialization
    const diagramNodes = newNodes.filter(n => n.data?.shape !== 'note');
    const noteNodes = newNodes.filter(n => n.data?.shape === 'note').map(n => ({ ...n, draggable: true, selectable: true, zIndex: 9999, style: { ...n.style, zIndex: 9999 } }));
    setCadNodes([...diagramNodes, ...noteNodes]);
    setCadEdges(newEdges);
    cadSourceRef.current = 'canvas';
    setCadCode(serializeMermaid(diagramNodes, newEdges, cadDirRef.current || 'TB'));
  };
  useEffect(() => { cadCommitRef.current = cadCommit; });

  // Allocate a fresh, unused node id of the form n1, n2, …
  const nextCadId = (existingNodes) => {
    const ids = new Set(existingNodes.map(n => n.id));
    let i = Math.max(1, cadIdRef.current + 1);
    while (ids.has(`n${i}`)) i++;
    cadIdRef.current = i;
    return `n${i}`;
  };

  // Append a palette snippet to the code; placeholders become unique ids.
  const cadInsertSnippet = (rawSnippet) => {
    const ids = new Set(cadNodes.map(n => n.id));
    const map = {};
    let i = cadIdRef.current;
    const snippet = rawSnippet.replace(/\{\{(id\d+)\}\}/g, (_, key) => {
      if (!map[key]) {
        do { i++; } while (ids.has(`n${i}`));
        ids.add(`n${i}`);
        map[key] = `n${i}`;
      }
      return map[key];
    });
    cadIdRef.current = i;
    cadSourceRef.current = 'code';
    cadSigRef.current = null;
    setCadCode(prev => {
      const trimmed = (prev || '').replace(/\s+$/, '');
      const base = trimmed || 'flowchart TB';
      return `${base}\n  ${snippet}\n`;
    });
  };

  const cadCommitRef = useRef(null);
  const cadAddDirectionalRef = useRef(null);

  // Add a new node connected from the right-clicked node.
  const cadAddConnected = (sourceId, shape, rounded = false) => {
    const src = cadNodes.find(n => n.id === sourceId);
    const newId = nextCadId(cadNodes);
    const horizontal = cadDirRef.current === 'LR' || cadDirRef.current === 'RL';
    const pos = src
      ? { x: src.position.x + (horizontal ? 240 : 40), y: src.position.y + (horizontal ? 30 : 160) }
      : { x: 120, y: 120 };
    const newNode = {
      id: newId,
      type: 'custom',
      position: pos,
      parentId: src?.parentId,
      data: { label: 'New Node', shape, rounded, color: '#3b82f6', isEip: false, fontSize: '0.82rem' },
    };
    const sz = estimateDacNodeSize(newNode);
    if (sz) { newNode.style = { width: sz.width, height: sz.height }; newNode.data.width = sz.width; newNode.data.height = sz.height; }
    const newEdge = {
      id: uuidv4(),
      source: sourceId,
      target: newId,
      label: '',
      type: 'custom',
      markerEnd: { type: MarkerType.ArrowClosed },
      sourceHandle: horizontal ? 'right' : 'bottom',
      targetHandle: horizontal ? 'left' : 'top',
      data: {},
    };
    cadCommit([...cadNodes, newNode], [...cadEdges, newEdge]);
    setContextMenu(null);
    return newId;
  };

  // Compute centered, evenly-spaced positions for all siblings (existing + new node).
  // Returns { newPos, updatedSiblings: [{id, position}] } so caller can reposition everyone.
  const computeSiblingLayout = (src, existingSiblings, newNodeId, newNW, newNH, direction) => {
    const GAP = 40;
    const srcW = parseInt(src.style?.width || src.data?.width || 150, 10);
    const srcH = parseInt(src.style?.height || src.data?.height || 80, 10);
    const srcCX = src.position.x + srcW / 2;
    const srcCY = src.position.y + srcH / 2;

    // Build full list: existing siblings + placeholder for new node
    const allItems = [
      ...existingSiblings.map(n => ({ id: n.id, w: parseInt(n.style?.width || n.data?.width || newNW, 10), h: parseInt(n.style?.height || n.data?.height || newNH, 10) })),
      { id: newNodeId, w: newNW, h: newNH },
    ];

    if (direction === 'down' || direction === 'up') {
      const totalW = allItems.reduce((s, n) => s + n.w, 0) + GAP * (allItems.length - 1);
      let curX = srcCX - totalW / 2;
      const baseY = direction === 'down' ? src.position.y + srcH + 80 : src.position.y - newNH - 80;
      const positions = allItems.map(item => {
        const pos = { x: curX, y: baseY };
        curX += item.w + GAP;
        return { id: item.id, position: pos };
      });
      const newPos = positions.find(p => p.id === newNodeId).position;
      const updatedSiblings = positions.filter(p => p.id !== newNodeId);
      return { newPos, updatedSiblings };
    } else {
      const totalH = allItems.reduce((s, n) => s + n.h, 0) + GAP * (allItems.length - 1);
      let curY = srcCY - totalH / 2;
      const baseX = direction === 'right' ? src.position.x + srcW + 80 : src.position.x - newNW - 80;
      const positions = allItems.map(item => {
        const pos = { x: baseX, y: curY };
        curY += item.h + GAP;
        return { id: item.id, position: pos };
      });
      const newPos = positions.find(p => p.id === newNodeId).position;
      const updatedSiblings = positions.filter(p => p.id !== newNodeId);
      return { newPos, updatedSiblings };
    }
  };

  // Directional child creation via Ctrl+Arrow — uses refs to avoid stale closure in keyDown.
  const cadAddDirectional = useCallback((direction) => {
    const sourceId = selectedNodeIdRef.current;
    if (!sourceId) return;
    const currentNodes = cadNodesRef.current;
    const currentEdges = cadEdgesRef.current;
    const src = currentNodes.find(n => n.id === sourceId);
    if (!src) return;
    const w = parseInt(src.style?.width || 160, 10);
    const h = parseInt(src.style?.height || 80, 10);
    // For left/up, reverse edge direction: new node→parent (left/top handles are target-only)
    const reversed = direction === 'left' || direction === 'up';
    const shMap = { right: 'right', left: 'left', down: 'bottom', up: 'top' };
    const thMap = { right: 'left', left: 'right', down: 'top', up: 'bottom' };
    const sh = shMap[direction];
    const th = thMap[direction];
    // Find siblings: nodes already placed in this direction from source
    const siblingIds = new Set(
      currentEdges
        .filter(e => reversed ? (e.target === sourceId && e.targetHandle === sh) : (e.source === sourceId && e.sourceHandle === sh))
        .map(e => reversed ? e.source : e.target)
    );
    const siblings = currentNodes.filter(n => siblingIds.has(n.id));
    const newId = nextCadId(currentNodes);
    const newNode = {
      id: newId,
      type: 'custom',
      position: { x: 0, y: 0 },
      parentId: src.parentId,
      data: { label: 'New Node', shape: src.data.shape, rounded: src.data.rounded, color: src.data.color || '#3b82f6', isEip: src.data.isEip || false, fontSize: src.data.fontSize || '0.82rem' },
    };
    const sz = estimateDacNodeSize(newNode);
    if (sz) { newNode.style = { width: sz.width, height: sz.height }; newNode.data.width = sz.width; newNode.data.height = sz.height; }
    const nw = sz?.width ?? w;
    const nh = sz?.height ?? h;
    const { newPos, updatedSiblings } = computeSiblingLayout(src, siblings, newId, nw, nh, direction);
    newNode.position = newPos;
    const newEdge = reversed
      ? { id: uuidv4(), source: newId, target: sourceId, label: '', type: 'custom', markerEnd: { type: MarkerType.ArrowClosed }, sourceHandle: th, targetHandle: sh, data: {} }
      : { id: uuidv4(), source: sourceId, target: newId, label: '', type: 'custom', markerEnd: { type: MarkerType.ArrowClosed }, sourceHandle: sh, targetHandle: th, data: {} };
    const sibPosMap = new Map(updatedSiblings.map(s => [s.id, s.position]));
    const updatedNodes = currentNodes.map(n => sibPosMap.has(n.id) ? { ...n, position: sibPosMap.get(n.id) } : n);
    cadCommitRef.current?.([...updatedNodes, newNode], [...currentEdges, newEdge]);
  }, []);

  useEffect(() => { cadAddDirectionalRef.current = cadAddDirectional; }, [cadAddDirectional]);

  const drawAddDirectionalRef = useRef(null);
  const drawAddDirectional = useCallback((direction) => {
    const sourceId = selectedNodeIdRef.current;
    if (!sourceId) return;
    const currentNodes = drawNodesRef.current;
    const currentEdges = drawEdgesRef.current;
    const src = currentNodes.find(n => n.id === sourceId);
    if (!src) return;
    const w = parseInt(src.style?.width || 150, 10);
    const h = parseInt(src.style?.height || 80, 10);
    const reversed = direction === 'left' || direction === 'up';
    const shMap = { right: 'right', left: 'left', down: 'bottom', up: 'top' };
    const thMap = { right: 'left', left: 'right', down: 'top', up: 'bottom' };
    const sh = shMap[direction];
    const th = thMap[direction];
    const siblingIds = new Set(
      currentEdges
        .filter(e => reversed ? (e.target === sourceId && e.targetHandle === sh) : (e.source === sourceId && e.sourceHandle === sh))
        .map(e => reversed ? e.source : e.target)
    );
    const siblings = currentNodes.filter(n => siblingIds.has(n.id));
    const newId = uuidv4();
    const { newPos, updatedSiblings } = computeSiblingLayout(src, siblings, newId, w, h, direction);
    const newNode = {
      id: newId,
      type: 'custom',
      position: newPos,
      style: { width: w, height: h },
      data: { ...src.data, label: '', isGhost: false, isNew: false, width: w, height: h },
    };
    const edgeStyle = { strokeWidth: src.data.strokeWidth || 2, stroke: src.data.color || '#3b82f6' };
    const newEdge = reversed
      ? { id: uuidv4(), source: newId, target: sourceId, type: 'custom', sourceHandle: th, targetHandle: sh, markerEnd: { type: MarkerType.ArrowClosed }, style: edgeStyle, data: {} }
      : { id: uuidv4(), source: sourceId, target: newId, type: 'custom', sourceHandle: sh, targetHandle: th, markerEnd: { type: MarkerType.ArrowClosed }, style: edgeStyle, data: {} };
    const sibPosMap = new Map(updatedSiblings.map(s => [s.id, s.position]));
    setDrawNodes(nds => [...nds.map(n => sibPosMap.has(n.id) ? { ...n, position: sibPosMap.get(n.id) } : n), newNode]);
    setDrawEdges(eds => [...eds, newEdge]);
  }, []);
  useEffect(() => { drawAddDirectionalRef.current = drawAddDirectional; }, [drawAddDirectional]);

  const dacUpdateNode = (nodeId, patch) => {
    const newNodes = cadNodes.map(n => n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n);
    cadCommit(newNodes, cadEdges);
  };

  const dacRenameNode = (nodeId) => {
    const node = cadNodes.find(n => n.id === nodeId);
    const next = window.prompt('Node label:', node?.data?.label || '');
    if (next == null) return;
    dacUpdateNode(nodeId, { label: next });
    setContextMenu(null);
  };

  const dacDeleteNode = (nodeId) => {
    const idsSet = new Set([nodeId]);
    const queue = [nodeId];
    while (queue.length > 0) {
      const currentId = queue.shift();
      cadNodes.forEach(node => {
        if (node.parentId === currentId && !idsSet.has(node.id)) {
          idsSet.add(node.id);
          queue.push(node.id);
        }
      });
    }
    const newNodes = cadNodes.filter(n => !idsSet.has(n.id));
    const newEdges = cadEdges.filter(e => !idsSet.has(e.source) && !idsSet.has(e.target));
    cadCommit(newNodes, newEdges);
    if (selectedNodeId && idsSet.has(selectedNodeId)) setSelectedNodeId(null);
    setContextMenu(null);
  };

  const bringToFront = () => {
    if (!contextMenu) return;
    setNodes(nds => {
      const nodeToMove = nds.find(n => n.id === contextMenu.id);
      if (!nodeToMove) return nds;
      const otherNodes = nds.filter(n => n.id !== contextMenu.id);
      return [...otherNodes, nodeToMove];
    });
    setContextMenu(null);
  };

  const sendToBack = () => {
    if (!contextMenu) return;
    setNodes(nds => {
      const nodeToMove = nds.find(n => n.id === contextMenu.id);
      if (!nodeToMove) return nds;
      const otherNodes = nds.filter(n => n.id !== contextMenu.id);
      return [nodeToMove, ...otherNodes];
    });
    setContextMenu(null);
  };

  const alignSelectedNodes = (type) => {
    const selectedNodes = nodes.filter(n => n.selected);
    if (selectedNodes.length < 2) return;
    
    setNodes(nds => {
      const selectedIds = new Set(selectedNodes.map(n => n.id));
      
      let targetValue;
      if (type === 'left') targetValue = Math.min(...selectedNodes.map(n => n.position.x));
      if (type === 'top') targetValue = Math.min(...selectedNodes.map(n => n.position.y));
      if (type === 'right') {
        const rightSides = selectedNodes.map(n => {
            const w = n.style?.width || (n.data?.isContainer ? 400 : 160);
            return n.position.x + parseInt(w, 10);
        });
        targetValue = Math.max(...rightSides);
      }
      if (type === 'bottom') {
        const bottomSides = selectedNodes.map(n => {
            const h = n.style?.height || (n.data?.isContainer ? 300 : 80);
            return n.position.y + parseInt(h, 10);
        });
        targetValue = Math.max(...bottomSides);
      }

      return nds.map(n => {
        if (!selectedIds.has(n.id)) return n;
        const newPos = { ...n.position };
        const w = n.style?.width || (n.data?.isContainer ? 400 : 160);
        const h = n.style?.height || (n.data?.isContainer ? 300 : 80);
        
        if (type === 'left') newPos.x = targetValue;
        if (type === 'top') newPos.y = targetValue;
        if (type === 'right') newPos.x = targetValue - parseInt(w, 10);
        if (type === 'bottom') newPos.y = targetValue - parseInt(h, 10);
        if (type === 'center-h') {
            const centerX = Math.min(...selectedNodes.map(sn => sn.position.x)) + (Math.max(...selectedNodes.map(sn => sn.position.x + parseInt(sn.style?.width || 160, 10))) - Math.min(...selectedNodes.map(sn => sn.position.x))) / 2;
            newPos.x = centerX - parseInt(w, 10) / 2;
        }
        if (type === 'center-v') {
            const centerY = Math.min(...selectedNodes.map(sn => sn.position.y)) + (Math.max(...selectedNodes.map(sn => sn.position.y + parseInt(sn.style?.height || 80, 10))) - Math.min(...selectedNodes.map(sn => sn.position.y))) / 2;
            newPos.y = centerY - parseInt(h, 10) / 2;
        }
        return { ...n, position: newPos };
      });
    });
    setContextMenu(null);
  };
  const autoLayout = (direction = 'LR', nodesList = nodes, edgesList = edges) => {
    // 1. Separate top-level nodes and nested child nodes
    const topLevelNodes = nodesList.filter(n => !n.parentId);
    const childNodes = nodesList.filter(n => n.parentId);

    // 2. Position children inside their respective parent containers first
    // and calculate the required size for each container.
    const updatedNodes = nodesList.map(n => ({ ...n }));

    const containers = topLevelNodes.filter(n => n.data?.isContainer);
    
    containers.forEach(container => {
      const children = childNodes.filter(c => c.parentId === container.id);
      if (children.length === 0) return;

      // Position children in a clean grid inside the container
      const cols = 2; 
      const gapX = 50;
      const gapY = 50;

      children.forEach((child, index) => {
        const colIndex = index % cols;
        const rowIndex = Math.floor(index / cols);
        
        // Get actual child width/height or use defaults
        const actualChildWidth = child.width || 160;
        let actualChildHeight = child.height || 80;
        if (child.data?.shape === 'class') actualChildHeight = child.height || 120;
        else if (child.data?.shape === 'actor') actualChildHeight = child.height || 90;
        
        let posY = 70; // Start below the header
        for (let r = 0; r < rowIndex; r++) {
          const rowChildren = children.slice(r * cols, (r + 1) * cols);
          const rowMaxHeight = Math.max(80, ...rowChildren.map(c => c.height || (c.data?.shape === 'class' ? 120 : (c.data?.shape === 'actor' ? 90 : 80))));
          posY += rowMaxHeight + gapY;
        }

        const childInUpdated = updatedNodes.find(un => un.id === child.id);
        if (childInUpdated) {
          childInUpdated.position = {
            x: 40 + colIndex * (actualChildWidth + gapX),
            y: posY
          };
        }
      });

      // Calculate container size to fit these children
      let maxX = 0;
      let maxY = 0;
      children.forEach(child => {
        const childInUpdated = updatedNodes.find(un => un.id === child.id);
        const posX = childInUpdated ? childInUpdated.position.x : 40;
        const posY = childInUpdated ? childInUpdated.position.y : 70;
        
        const actualChildWidth = child.width || 160;
        let actualChildHeight = child.height || 80;
        if (child.data?.shape === 'class') actualChildHeight = child.height || 120;
        else if (child.data?.shape === 'actor') actualChildHeight = child.height || 90;

        const rightSide = posX + actualChildWidth;
        const bottomSide = posY + actualChildHeight;
        
        if (rightSide > maxX) maxX = rightSide;
        if (bottomSide > maxY) maxY = bottomSide;
      });

      const containerInUpdated = updatedNodes.find(un => un.id === container.id);
      if (containerInUpdated) {
        containerInUpdated.style = {
          ...containerInUpdated.style,
          width: Math.max(400, maxX + 50),
          height: Math.max(300, maxY + 50),
          zIndex: -1
        };
      }
    });

    // 3. Perform layout on top-level nodes (and their container representatives)
    const topLevelEdges = edgesList.map(edge => {
      const sourceNode = nodesList.find(n => n.id === edge.source);
      const targetNode = nodesList.find(n => n.id === edge.target);
      
      const sourceParentId = sourceNode?.parentId || edge.source;
      const targetParentId = targetNode?.parentId || edge.target;
      
      return {
        ...edge,
        source: sourceParentId,
        target: targetParentId
      };
    }).filter(edge => edge.source !== edge.target);

    const inDegree = {};
    topLevelNodes.forEach(n => inDegree[n.id] = 0);
    topLevelEdges.forEach(e => {
      if (inDegree[e.target] !== undefined) inDegree[e.target]++;
    });

    const depths = {};
    let currentLevel = topLevelNodes.filter(n => inDegree[n.id] === 0).map(n => n.id);
    let d = 0;
    while (currentLevel.length > 0) {
      let nextLevel = [];
      currentLevel.forEach(id => {
        depths[id] = Math.max(depths[id] || 0, d);
        topLevelEdges.filter(e => e.source === id).forEach(e => {
          if (!nextLevel.includes(e.target)) nextLevel.push(e.target);
        });
      });
      d++;
      currentLevel = nextLevel;
      if (d > 100) break;
    }

    topLevelNodes.forEach(n => { if (depths[n.id] === undefined) depths[n.id] = 0; });

    const levelMaxDim = {};
    topLevelNodes.forEach(n => {
      const depth = depths[n.id];
      const updatedNode = updatedNodes.find(un => un.id === n.id);
      // Use actual node dimensions if available, otherwise fallback to style or defaults
      const w = updatedNode.width || parseInt(updatedNode?.style?.width || 180, 10);
      const h = updatedNode.height || parseInt(updatedNode?.style?.height || 100, 10);
      
      if (!levelMaxDim[depth]) {
        levelMaxDim[depth] = { width: 0, height: 0 };
      }
      if (w > levelMaxDim[depth].width) levelMaxDim[depth].width = w;
      if (h > levelMaxDim[depth].height) levelMaxDim[depth].height = h;
    });

    const depthOffset = {};
    let currentOffset = 100;
    const maxDepth = Math.max(-1, ...topLevelNodes.map(n => depths[n.id]));
    
    const gapOffset = workspace === 'eip' ? 20 : (workspace === 'cad' ? 60 : 150);
    
    for (let i = 0; i <= maxDepth; i++) {
      depthOffset[i] = currentOffset;
      // Use dimensions from levelMaxDim, fallback to reasonable defaults if a depth has no nodes
      const maxDim = levelMaxDim[i] || { width: 180, height: 100 };
      currentOffset += (direction === 'LR' ? maxDim.width : maxDim.height) + gapOffset;
    }

    const levelCounts = {};
    topLevelNodes.forEach(n => {
      const depth = depths[n.id];
      levelCounts[depth] = (levelCounts[depth] || 0) + 1;
      const index = levelCounts[depth] - 1;
      
      const updatedNode = updatedNodes.find(un => un.id === n.id);
      if (updatedNode) {
        // Use max dimensions for the current level for consistent spacing
        const maxDimForLevel = levelMaxDim[depth] || { width: 180, height: 100 };
        if (direction === 'LR') {
          updatedNode.position = {
            x: depthOffset[depth],
            y: 100 + index * (maxDimForLevel.height + gapOffset)
          };
        } else {
          updatedNode.position = {
            x: 100 + index * (maxDimForLevel.width + gapOffset),
            y: depthOffset[depth]
          };
        }
      }
    });

    setNodes(updatedNodes);
    
    setTimeout(() => {
      if (reactFlowInstance) reactFlowInstance.fitView({ padding: 0.2, duration: 800 });
    }, 200);
  };
  const [contextMenu, setContextMenu] = useState(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showDrawTray, setShowDrawTray] = useState(false);
  const [iconSearch, setIconSearch] = useState('');
  const onNodeContextMenu = useCallback(
   (event, node) => {
     event.preventDefault();
     const wrapperEl = reactFlowWrapper.current;
     if (!wrapperEl) return;
     const rect = wrapperEl.getBoundingClientRect();
     setContextMenu({
       id: node.id,
       top: event.clientY - rect.top,
       left: event.clientX - rect.left,
     });
   },
   [setContextMenu]
  );

  const isDraggingRef = useRef(false);

  const handlePaneMouseDown = useCallback((e) => {
    if (workspace !== 'draw' || activeTool === 'select' || activeTool === 'hand' || activeTool === 'pencil' || activeTool === 'eraser' || isDrawingMode) return;

    // Avoid starting drawing if clicking on a node or UI element
    if (e.target.closest('.react-flow__node') || e.target.closest('.toolbar') || e.target.closest('.sidebar') || e.target.closest('.btn')) return;

    // Middle mouse button → pan (handled by ReactFlow)
    if (e.button === 1) return;

    const wrapperEl = reactFlowWrapper.current;
    if (!wrapperEl || !reactFlowInstance) return;

    const clientX = e.clientX || e.nativeEvent?.clientX;
    const clientY = e.clientY || e.nativeEvent?.clientY;
    const shiftConstrain = e.shiftKey || e.nativeEvent?.shiftKey;

    const flowPos = reactFlowInstance.screenToFlowPosition({ x: clientX, y: clientY });
    const startPos = flowPos;
    const ghostId = `ghost-${uuidv4()}`;
    isDraggingRef.current = true;

    const newGhost = {
      id: ghostId,
      type: 'custom',
      position: flowPos,
      style: { width: 1, height: 1, zIndex: 1000, overflow: 'visible' },
      data: {
        label: '',
        shape: activeTool,
        width: 1,
        height: 1,
        isRough: isRoughGlobal,
        fillStyle: 'hachure',
        color: drawingColor,
        fillColor: drawFillColor,
        strokeWidth: drawingStrokeWidth,
        strokeStyle: drawStrokeStyle,
        opacity: drawOpacity,
        fillOpacity: drawFillOpacity,
        strokeOpacity: drawStrokeOpacity,
        shadow: drawShadow,
        shadowColor: drawShadowColor,
        shadowOpacity: drawShadowOpacity,
        shadowBlur: drawShadowBlur,
        cornerRadius: drawCornerRadius,
        isGhost: true,
        isDrawShape: true,
        fontFamily: 'virgil',
        ...( (activeTool === 'arrow' || activeTool === 'line') ? { arrowStart: { x: 0, y: 0 }, arrowEnd: { x: 0, y: 0 } } : {} )
      }
    };

    setGhostNode(newGhost);
    setDrawNodes(nds => [...nds, newGhost]);

    const handleMove = (ev) => {
      if (!isDraggingRef.current || !reactFlowInstance) return;
      const currentPos = reactFlowInstance.screenToFlowPosition({ x: ev.clientX, y: ev.clientY });
      const constrain = ev.shiftKey;

      setDrawNodes(nds => nds.map(n => {
        if (n.id === ghostId) {
          let rawW = Math.abs(currentPos.x - startPos.x);
          let rawH = Math.abs(currentPos.y - startPos.y);
          // Shift: constrain to square (or 45°-constrained line for arrow/line)
          if (constrain) {
            if (activeTool === 'arrow' || activeTool === 'line') {
              // snap to 45° angles
              const angle = Math.atan2(currentPos.y - startPos.y, currentPos.x - startPos.x);
              const snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
              const dist = Math.sqrt(rawW * rawW + rawH * rawH);
              const snappedEnd = {
                x: startPos.x + Math.cos(snapAngle) * dist,
                y: startPos.y + Math.sin(snapAngle) * dist
              };
              const x = Math.min(snappedEnd.x, startPos.x);
              const y = Math.min(snappedEnd.y, startPos.y);
              const width = Math.max(Math.abs(snappedEnd.x - startPos.x), 1);
              const height = Math.max(Math.abs(snappedEnd.y - startPos.y), 1);
              return { ...n, position: { x, y }, style: { ...n.style, width, height },
                data: { ...n.data, width, height, arrowStart: { x: startPos.x - x, y: startPos.y - y }, arrowEnd: { x: snappedEnd.x - x, y: snappedEnd.y - y } } };
            } else {
              const side = Math.max(rawW, rawH);
              rawW = side; rawH = side;
            }
          }
          const width = Math.max(rawW, 1);
          const height = Math.max(rawH, 1);
          const x = Math.min(currentPos.x, startPos.x);
          const y = Math.min(currentPos.y, startPos.y);

          if (activeTool === 'arrow' || activeTool === 'line') {
            return { ...n, position: { x, y }, style: { ...n.style, width, height },
              data: { ...n.data, width, height, arrowStart: { x: startPos.x - x, y: startPos.y - y }, arrowEnd: { x: currentPos.x - x, y: currentPos.y - y } } };
          }
          return { ...n, position: { x, y }, style: { ...n.style, width, height }, data: { ...n.data, width, height } };
        }
        return n;
      }));
    };

    const handleUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);

      setDrawNodes(nds => {
        const finalNodes = nds.map(n => {
          if (n.id !== ghostId) return n;
          let w = n.style?.width || 0;
          let h = n.style?.height || 0;

          if (w < 5 && h < 5 && activeTool !== 'arrow' && activeTool !== 'line') {
            w = activeTool === 'note' ? 160 : 150;
            h = activeTool === 'note' ? 160 : 80;
          } else if (w < 10 && h < 10 && activeTool !== 'arrow' && activeTool !== 'line') {
            return null;
          }
          return {
            ...n,
            data: { ...n.data, width: Math.max(w, 20), height: Math.max(h, 20), isGhost: false, isNew: (activeTool === 'text' || activeTool === 'note' || activeTool === 'callout') },
            style: { ...n.style, width: Math.max(w, 20), height: Math.max(h, 20) }
          };
        }).filter(Boolean);
        pushDrawHistory(finalNodes, drawEdgesRef.current);
        return finalNodes;
      });

      setGhostNode(null);
      if (!drawToolLock) {
        setActiveTool('select');
        setInteractionMode('move');
      }
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  }, [workspace, activeTool, isDrawingMode, isRoughGlobal, drawingColor, drawFillColor, drawingStrokeWidth, drawStrokeStyle, drawOpacity, drawFillOpacity, drawStrokeOpacity, drawShadow, drawShadowColor, drawShadowOpacity, drawShadowBlur, reactFlowInstance, setDrawNodes, pushDrawHistory, drawToolLock]);

  const eraseAtPoint = (clientX, clientY) => {
    if (!reactFlowInstance) return;
    const flowPos = reactFlowInstance.screenToFlowPosition({ x: clientX, y: clientY });
    const hitNode = drawNodesRef.current.find(n => {
      const w = n.style?.width || n.data?.width || 150;
      const h = n.style?.height || n.data?.height || 80;
      return flowPos.x >= n.position.x && flowPos.x <= n.position.x + w &&
             flowPos.y >= n.position.y && flowPos.y <= n.position.y + h;
    });
    if (hitNode) {
      const updatedNodes = drawNodesRef.current.filter(n => n.id !== hitNode.id);
      const updatedEdges = drawEdgesRef.current.filter(ed => ed.source !== hitNode.id && ed.target !== hitNode.id);
      setDrawNodes(updatedNodes);
      setDrawEdges(updatedEdges);
      pushDrawHistory(updatedNodes, updatedEdges);
    }
  };

  const addCanvasWidget = (shapeType) => {
    let x = 250;
    let y = 150;
    if (reactFlowInstance) {
      const { x: vx, y: vy, zoom } = reactFlowInstance.getViewport();
      const wrapperEl = reactFlowWrapper.current;
      if (wrapperEl) {
        const rect = wrapperEl.getBoundingClientRect();
        x = -vx / zoom + (rect.width / 2 - 80) / zoom;
        y = -vy / zoom + (rect.height / 2 - 50) / zoom;
      }
    }

    const id = uuidv4();
    let newNode = {
      id,
      type: 'custom',
      position: { x, y },
      data: {
        label: shapeType === 'text' ? 'New Title / Header' : (shapeType === 'note' ? 'Sticky Note Content' : 'Callout Annotation'),
        shape: shapeType,
        color: shapeType === 'text' ? 'var(--text-primary)' : (shapeType === 'note' ? '#fef08a' : '#3b82f6'),
        icon: shapeType === 'callout' ? 'Info' : undefined,
        isRough: workspace === 'draw' ? isRoughGlobal : false,
        isDrawShape: workspace === 'draw',
        fontFamily: workspace === 'draw' ? 'virgil' : 'inherit',
        fillStyle: 'hachure',
        ...(workspace === 'draw' ? { strokeWidth: drawingStrokeWidth, strokeStyle: drawStrokeStyle, fillColor: drawFillColor } : {}),
        isNew: true
      }
    };

    if (shapeType === 'note') {
      newNode.style = { width: 160, height: 160 };
      newNode.zIndex = 9999;
      newNode.draggable = true;
      newNode.selectable = true;
    } else if (shapeType === 'callout') {
      newNode.style = { width: 200, height: 80 };
    }

    setNodes((nds) => nds.concat(newNode));
    setSelectedNodeId(id);
  };

  const addDrawNode = (shape, label = '', icon = null, svgHtml = null, colorOverride = null) => {
    let x = 250;
    let y = 150;
    if (reactFlowInstance) {
      const { x: vx, y: vy, zoom } = reactFlowInstance.getViewport();
      const wrapperEl = reactFlowWrapper.current;
      if (wrapperEl) {
        const rect = wrapperEl.getBoundingClientRect();
        x = -vx / zoom + (rect.width / 2 - 80) / zoom;
        y = -vy / zoom + (rect.height / 2 - 50) / zoom;
      }
    }

    const id = uuidv4();
    const newNode = {
      id,
      type: 'custom',
      position: { x, y },
      style: (shape === 'note' ? { width: 160, height: 160 } : { width: 150, height: 72 }),
      data: {
        label: label || '',
        shape,
        icon,
        svgHtml,
        isRough: isRoughGlobal,
        isDrawShape: true,
        fillStyle: 'hachure',
        color: colorOverride || drawingColor,
        strokeWidth: drawingStrokeWidth,
        strokeStyle: drawStrokeStyle,
        fillColor: drawFillColor,
        fillOpacity: drawFillOpacity,
        strokeOpacity: drawStrokeOpacity,
        shadow: drawShadow,
        shadowColor: drawShadowColor,
        shadowOpacity: drawShadowOpacity,
        shadowBlur: drawShadowBlur,
        fontFamily: 'virgil',
        fontSize: '16px'
      }
    };
    
    if (shape === 'brand' || shape === 'image') {
      newNode.style = { width: 80, height: 80 };
    }
    
    setDrawNodes((nds) => nds.concat(newNode));
    setSelectedNodeId(id);
  };

  // Smooth a path using Catmull-Rom → cubic bezier conversion for the live SVG preview
  const buildSmoothSvgPath = (pts) => {
    if (pts.length < 2) return '';
    if (pts.length === 2) return `M ${pts[0].screenX} ${pts[0].screenY} L ${pts[1].screenX} ${pts[1].screenY}`;
    let d = `M ${pts[0].screenX} ${pts[0].screenY}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];
      const cp1x = p1.screenX + (p2.screenX - p0.screenX) / 6;
      const cp1y = p1.screenY + (p2.screenY - p0.screenY) / 6;
      const cp2x = p2.screenX - (p3.screenX - p1.screenX) / 6;
      const cp2y = p2.screenY - (p3.screenY - p1.screenY) / 6;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.screenX} ${p2.screenY}`;
    }
    return d;
  };

  // Build smooth local-space path data (for stored drawing nodes)
  const buildSmoothLocalPath = (pts) => {
    if (pts.length < 2) return pts;
    // Subsample to reduce point count while preserving shape (Douglas-Peucker simplified)
    const simplified = [pts[0]];
    const epsilon = 1.5;
    for (let i = 1; i < pts.length - 1; i++) {
      const prev = simplified[simplified.length - 1];
      if (Math.hypot(pts[i][0] - prev[0], pts[i][1] - prev[1]) > epsilon) {
        simplified.push(pts[i]);
      }
    }
    simplified.push(pts[pts.length - 1]);
    return simplified;
  };

  const handleDrawingStart = useCallback((e) => {
    if (e.target.closest('.react-flow__node') || e.target.closest('.toolbar') || e.target.closest('.sidebar') || e.target.closest('.btn')) return;

    const wrapperEl = reactFlowWrapper.current;
    if (!wrapperEl || !reactFlowInstance) return;
    const rect = wrapperEl.getBoundingClientRect();

    const clientX = e.clientX || e.nativeEvent?.clientX;
    const clientY = e.clientY || e.nativeEvent?.clientY;

    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;
    const flowPos = reactFlowInstance.screenToFlowPosition({ x: clientX, y: clientY });

    const initialPoint = { screenX, screenY, flowX: flowPos.x, flowY: flowPos.y };
    currentPathRef.current = [initialPoint];
    setCurrentPath([initialPoint]);
    setIsDrawing(true);
    isDraggingRef.current = true;

    const handleMove = (ev) => {
      if (!isDraggingRef.current || !reactFlowInstance) return;
      const rect2 = wrapperEl.getBoundingClientRect();
      const sX = ev.clientX - rect2.left;
      const sY = ev.clientY - rect2.top;
      const fPos = reactFlowInstance.screenToFlowPosition({ x: ev.clientX, y: ev.clientY });

      const prev = currentPathRef.current;
      const last = prev[prev.length - 1];
      if (last && Math.abs(last.flowX - fPos.x) < 0.5 && Math.abs(last.flowY - fPos.y) < 0.5) return;

      currentPathRef.current = [...prev, { screenX: sX, screenY: sY, flowX: fPos.x, flowY: fPos.y }];
      setCurrentPath(currentPathRef.current);
    };

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);

      if (!isDraggingRef.current) return;
      setIsDrawing(false);
      isDraggingRef.current = false;

      const finalPath = currentPathRef.current;
      setCurrentPath([]);
      currentPathRef.current = [];

      if (finalPath.length < 2) return;

      const flowPoints = finalPath.map(p => ({ x: p.flowX, y: p.flowY }));
      const minX = Math.min(...flowPoints.map(p => p.x));
      const maxX = Math.max(...flowPoints.map(p => p.x));
      const minY = Math.min(...flowPoints.map(p => p.y));
      const maxY = Math.max(...flowPoints.map(p => p.y));

      const pad = 4;
      const width = Math.max(maxX - minX + pad * 2, 10);
      const height = Math.max(maxY - minY + pad * 2, 10);

      const rawPoints = flowPoints.map(p => [p.x - minX + pad, p.y - minY + pad]);
      const localPoints = buildSmoothLocalPath(rawPoints);

      const newNode = {
        id: `drawing-${uuidv4()}`,
        type: 'custom',
        position: { x: minX - pad, y: minY - pad },
        style: { width, height, zIndex: 1000, overflow: 'visible' },
        data: {
          shape: 'drawing',
          points: localPoints,
          color: drawingColor || '#3b82f6',
          strokeWidth: drawingStrokeWidth || 3,
          strokeStyle: drawStrokeStyle || 'solid',
          label: '',
          isRough: isRoughGlobal,
          fillStyle: 'hachure',
          fontFamily: 'virgil'
        }
      };

      const updated = [...drawNodesRef.current, newNode];
      setDrawNodes(updated);
      pushDrawHistory(updated, drawEdgesRef.current);

      if (!drawToolLock) {
        setActiveTool('select');
        setIsDrawingMode(false);
        setInteractionMode('move');
      }
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  }, [reactFlowInstance, drawingColor, drawingStrokeWidth, drawStrokeStyle, isRoughGlobal, setDrawNodes, pushDrawHistory, drawToolLock]);

  const handleImageImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      
      let x = 200;
      let y = 150;
      if (reactFlowInstance) {
        const { x: vx, y: vy, zoom } = reactFlowInstance.getViewport();
        const wrapperEl = reactFlowWrapper.current;
        if (wrapperEl) {
          const rect = wrapperEl.getBoundingClientRect();
          x = -vx / zoom + (rect.width / 2 - 100) / zoom;
          y = -vy / zoom + (rect.height / 2 - 100) / zoom;
        }
      }

      const id = uuidv4();
      const newNode = {
        id,
        type: 'custom',
        position: { x, y },
        style: { width: 200, height: 200 },
        data: {
          shape: 'image',
          imageUrl: dataUrl,
          label: file.name
        }
      };

      setNodes((nds) => nds.concat(newNode));
      setSelectedNodeId(id);
    };
    reader.readAsDataURL(file);
  };

  const insertNode = (direction, eipType = 'processor') => {
    if (!contextMenu) return;
    const targetNodeId = contextMenu.id;
    const targetNode = nodes.find(n => n.id === targetNodeId);
    if (!targetNode) return;

    let label = 'Processor';
    let icon = 'Cpu';
    let color = '#0ea5e9';
    let shape = 'eip';

    if (eipType === 'setBody') { label = 'setBody'; icon = 'FileText'; color = '#10b981'; }
    if (eipType === 'setHeader') { label = 'setHeader'; icon = 'Code'; color = '#8b5cf6'; }
    if (eipType === 'log') { label = 'log'; icon = 'TerminalSquare'; color = '#f59e0b'; }
    if (eipType === 'to') { label = 'to'; icon = 'Send'; color = '#ef4444'; }
    if (eipType === 'marshal') { label = 'marshal'; icon = 'Package'; color = '#ec4899'; }
    if (eipType === 'unmarshal') { label = 'unmarshal'; icon = 'PackageOpen'; color = '#14b8a6'; }
    if (eipType === 'sql' || eipType === 'oracle') { label = eipType === 'oracle' ? 'Oracle DB' : 'SQL Database'; icon = 'Database'; color = '#10b981'; }
    if (eipType === 'mongodb') { label = 'MongoDB'; icon = 'Database'; color = '#22c55e'; }
    if (eipType === 'bean') { label = 'Bean'; icon = 'Box'; color = '#f59e0b'; }
    if (eipType === 'kafka') { label = 'Kafka'; icon = 'RadioTower'; color = '#a855f7'; }
    if (eipType === 'ibmmq') { label = 'IBM MQ'; icon = 'Server'; color = '#ef4444'; }
    if (eipType === 'solace') { label = 'Solace'; icon = 'Cloud'; color = '#0ea5e9'; }

    const gap = workspace === 'eip' ? 40 : 200;

    const newNode = {
      id: uuidv4(),
      type: 'custom',
      position: {
        x: targetNode.position.x + (direction === 'after' ? gap : -gap),
        y: targetNode.position.y
      },
      style: workspace === 'eip' ? { width: 120, height: 60 } : undefined,
      data: { label, icon, color, shape, isEip: workspace === 'eip' },
    };

    setNodes((nds) => nds.concat(newNode));

    if (direction === 'after') {
      const outgoingEdge = edges.find(e => e.source === targetNodeId);
      if (outgoingEdge) {
        setEdges(eds => eds.map(e => e.id === outgoingEdge.id ? { ...e, source: newNode.id } : e));
      }
      setEdges((eds) => addEdge({ source: targetNodeId, target: newNode.id, sourceHandle: 'right', targetHandle: 'left', ...defaultEdgeOptions }, eds));
    } else {
      const incomingEdge = edges.find(e => e.target === targetNodeId);
      if (incomingEdge) {
        setEdges(eds => eds.map(e => e.id === incomingEdge.id ? { ...e, target: newNode.id } : e));
      }
      setEdges((eds) => addEdge({ source: newNode.id, target: targetNodeId, sourceHandle: 'right', targetHandle: 'left', ...defaultEdgeOptions }, eds));
    }

    setContextMenu(null);
  };

  const toggleContainer = () => {
    if (!contextMenu) return;
    const targetNodeId = contextMenu.id;
    setNodes(nds => nds.map(node => {
      if (node.id === targetNodeId) {
        return { ...node, data: { ...node.data, isContainer: !node.data.isContainer }, style: { ...node.style, width: node.data.isContainer ? undefined : 300, height: node.data.isContainer ? undefined : 200 } };
      }
      return node;
    }));
    setContextMenu(null);
  };

  const exitContext = () => {
    if (!contextMenu) return;
    const targetNodeId = contextMenu.id;
    setNodes(nds => {
      const exitingNode = nds.find(n => n.id === targetNodeId);
      const parentId = exitingNode?.parentId;
      
      const updatedNodes = nds.map(node => {
        if (node.id === targetNodeId) {
          const parent = nds.find(n => n.id === node.parentId);
          const rest = { ...node };
          delete rest.parentId;
          delete rest.extent;
          
          let targetX = node.position.x;
          let targetY = node.position.y;
          
          if (parent) {
            const pWidth = parseInt(parent.style?.width || 300, 10);
            targetX = parent.position.x + pWidth + 50; 
            targetY = parent.position.y + node.position.y;
          }

          return { 
            ...rest, 
            position: { x: targetX, y: targetY } 
          };
        }
        return node;
      });

      if (parentId) {
        const remainingChildren = updatedNodes.filter(c => c.parentId === parentId && c.id !== targetNodeId);
        const childWidth = 160;
        
        let maxX = 0;
        let maxY = 0;
        remainingChildren.forEach(c => {
          let nodeHeight = 80;
          if (c.data?.shape === 'class') nodeHeight = 120;
          else if (c.data?.shape === 'actor') nodeHeight = 90;
          
          const rightSide = c.position.x + childWidth;
          const bottomSide = c.position.y + nodeHeight;
          if (rightSide > maxX) maxX = rightSide;
          if (bottomSide > maxY) maxY = bottomSide;
        });

        return updatedNodes.map(n => {
          if (n.id === parentId) {
            return {
              ...n,
              style: {
                ...n.style,
                width: Math.max(400, maxX + 50),
                height: Math.max(300, maxY + 50),
                zIndex: -1
              }
            };
          }
          return n;
        });
      }

      return updatedNodes;
    });
    setContextMenu(null);
  };

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      
      const files = event.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.type.match('image.*') || file.name.endsWith('.svg') || file.name.endsWith('.svg+xml')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target.result;
            let position = reactFlowInstance.screenToFlowPosition({
              x: event.clientX,
              y: event.clientY,
            });
            const id = uuidv4();
            const newNode = {
              id,
              type: 'custom',
              position,
              style: { width: 200, height: 200 },
              data: {
                shape: 'image',
                imageUrl: dataUrl,
                label: file.name
              }
            };
            setNodes((nds) => nds.concat(newNode));
            setSelectedNodeId(id);
          };
          reader.readAsDataURL(file);
          return;
        }
      }

      const dataStr = event.dataTransfer.getData('application/reactflow');
      if (!dataStr) return;

      const data = JSON.parse(dataStr);
      
      const isAnnotation = data.shape === 'text' || data.shape === 'note';
      if (workspace === 'eip' && isAnnotation) return;
      if (!isAnnotation) {
        if (workspace === 'eip' && !data.isEip) return;
        if ((workspace === 'diagram' || workspace === 'ddd') && data.isEip) return;
      }

      let position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      let parentId = undefined;
      if (!data.isContainer && workspace === 'ddd') {
        const currentNodes = reactFlowInstance.getNodes();
        const containers = currentNodes.filter(n => n.data?.isContainer);
        for (let i = containers.length - 1; i >= 0; i--) {
          const n = containers[i];
          const w = n.style?.width || 400;
          const h = n.style?.height || 300;
          if (position.x >= n.position.x && position.x <= n.position.x + w &&
              position.y >= n.position.y && position.y <= n.position.y + h) {
            parentId = n.id;
            position = {
              x: position.x - n.position.x,
              y: position.y - n.position.y
            };
            break;
          }
        }
      }

      if (parentId) {
        const siblings = reactFlowInstance.getNodes().filter(n => n.parentId === parentId);
        let foundOverlap = true;
        let attempts = 0;
        const childWidth = 160;
        const gapX = 50;
        const gapY = 50;
        
        while (foundOverlap && attempts < 100) {
          foundOverlap = false;
          for (const sib of siblings) {
            let sibHeight = 80;
            if (sib.data?.shape === 'class') sibHeight = 120;
            else if (sib.data?.shape === 'actor') sibHeight = 90;

            let newNodeHeight = 80;
            if (data.shape === 'class') newNodeHeight = 120;
            else if (data.shape === 'actor') newNodeHeight = 90;

            const minSpacingX = childWidth + gapX;
            const minSpacingY = Math.max(sibHeight, newNodeHeight) + gapY;

            if (Math.abs(position.x - sib.position.x) < minSpacingX - 5 &&
                Math.abs(position.y - sib.position.y) < minSpacingY - 5) {
              position.y += minSpacingY;
              foundOverlap = true;
              break;
            }
          }
          attempts++;
        }
      }

      if (workspace === 'eip' && !data.isContainer && !isAnnotation) {
        const currentNodes = reactFlowInstance.getNodes();
        const eipNodes = currentNodes.filter(n => n.data.isEip);
        
        if (eipNodes.length > 0) {
          // Find the last node (most recently added or bottom-most)
          let lastNode = eipNodes[eipNodes.length - 1];
          // Or find node closest to drop position that has no outgoing edges
          const currentEdges = reactFlowInstance.getEdges();
          const nodesWithOutgoing = new Set(currentEdges.map(e => e.source));
          const potentialTails = eipNodes.filter(n => !nodesWithOutgoing.has(n.id));
          
          if (potentialTails.length > 0) {
             // Pick the one closest to the new drop position or just the last one
             lastNode = potentialTails[potentialTails.length - 1];
          }

          // If dropped near the center or roughly below, snap it to a clean vertical flow
          if (Math.abs(position.x - lastNode.position.x) < 200 && position.y > lastNode.position.y) {
            position.x = lastNode.position.x;
            position.y = lastNode.position.y + 40;
          }

          const newNodeId = uuidv4();
          const newNode = {
            id: newNodeId,
            type: 'custom',
            position,
            parentId,
            extent: parentId ? 'parent' : undefined,
            style: { width: 120, height: 60 },
            data: { ...data, isEip: true },
          };

          const newEdge = {
            id: uuidv4(),
            source: lastNode.id,
            target: newNodeId,
            sourceHandle: 'right',
            targetHandle: 'left',
            ...defaultEdgeOptions
          };

          // Special handling for Choice
          if (data.label.includes('Choice')) {
             const whenNode = {
               id: uuidv4(), type: 'custom',
               position: { x: position.x + 100, y: position.y - 40 },
               style: { width: 120, height: 60 },
               data: { label: 'When', icon: 'Filter', color: '#eab308', shape: '', isEip: true }
             };
             const otherwiseNode = {
               id: uuidv4(), type: 'custom',
               position: { x: position.x + 100, y: position.y + 40 },
               style: { width: 120, height: 60 },
               data: { label: 'Otherwise', icon: 'RefreshCw', color: '#94a3b8', shape: '', isEip: true }
             };
             setNodes(nds => nds.concat(newNode, whenNode, otherwiseNode));
             setEdges(eds => eds.concat(
               newEdge,
               { id: uuidv4(), source: newNodeId, target: whenNode.id, sourceHandle: 'right', targetHandle: 'left', ...defaultEdgeOptions },
               { id: uuidv4(), source: newNodeId, target: otherwiseNode.id, sourceHandle: 'right', targetHandle: 'left', ...defaultEdgeOptions }
             ));
          } else {
             setNodes(nds => nds.concat(newNode));
             setEdges(eds => eds.concat(newEdge));
          }
          return;
        }
      }

      const newNode = {
        id: uuidv4(),
        type: 'custom',
        position,
        parentId,
        extent: parentId ? 'parent' : undefined,
        style: data.isContainer ? { width: 400, height: 300, zIndex: -1 } : (data.shape === 'note' ? { width: 160, height: 160 } : (data.shape === 'callout' ? { width: 200, height: 80 } : (data.shape === 'brand' ? { width: 80, height: 80 } : (data.isEip ? { width: 120, height: 60 } : undefined)))),
        data: { ...data, isRough: workspace === 'draw' ? isRoughGlobal : false, isDrawShape: workspace === 'draw', ...(workspace === 'draw' ? { strokeWidth: drawingStrokeWidth, strokeStyle: drawStrokeStyle, fillColor: data.fillColor || drawFillColor, color: data.color || drawingColor, hideBorder: data.shape === 'brand' || data.shape === 'image', shadow: drawShadow, shadowColor: drawShadowColor, shadowOpacity: drawShadowOpacity, shadowBlur: drawShadowBlur } : {}), isNew: (data.shape === 'text' || data.shape === 'note' || data.shape === 'callout') },
      };

      setNodes((nds) => {
        let updatedNodes = nds.concat(newNode);
        if (parentId) {
          const children = updatedNodes.filter(n => n.parentId === parentId);
          const childWidth = 160;
          
          let maxX = 0;
          let maxY = 0;
          children.forEach(c => {
            let nodeHeight = 80;
            if (c.data?.shape === 'class') nodeHeight = 120;
            else if (c.data?.shape === 'actor') nodeHeight = 90;
            
            const rightSide = c.position.x + childWidth;
            const bottomSide = c.position.y + nodeHeight;
            if (rightSide > maxX) maxX = rightSide;
            if (bottomSide > maxY) maxY = bottomSide;
          });
          
          updatedNodes = updatedNodes.map(n => {
            if (n.id === parentId) {
              return {
                ...n,
                style: {
                  ...n.style,
                  width: Math.max(400, maxX + 50),
                  height: Math.max(300, maxY + 50),
                  zIndex: -1
                }
              };
            }
            return n;
          });
        }
        return updatedNodes;
      });
    },
    [reactFlowInstance, setNodes, setEdges, workspace]
  );

  const onNodeDragStop = useCallback((event, node) => {
    // Push history for draw workspace moves
    if (workspaceRef.current === 'draw') {
      pushDrawHistory(drawNodesRef.current, drawEdgesRef.current);
    }
    // Persist sticky note and diagram position in CAD workspace
    if (workspaceRef.current === 'cad') {
      if (node.id === 'mermaid-other-node') {
        setCadDiagramPos(node.position);
      }
      setCadNodes(nds => nds.map(n => n.id === node.id ? { ...n, position: node.position } : n));
    }
    if (node.parentId) {
      const parentId = node.parentId;
      setNodes(nds => {
        const children = nds.filter(c => c.parentId === parentId);
        const childWidth = 160;
        
        let maxX = 0;
        let maxY = 0;
        children.forEach(c => {
          let nodeHeight = 80;
          if (c.data?.shape === 'class') nodeHeight = 120;
          else if (c.data?.shape === 'actor') nodeHeight = 90;
          
          const rightSide = c.position.x + childWidth;
          const bottomSide = c.position.y + nodeHeight;
          if (rightSide > maxX) maxX = rightSide;
          if (bottomSide > maxY) maxY = bottomSide;
        });
        
        return nds.map(n => {
          if (n.id === parentId) {
            return {
              ...n,
              style: {
                ...n.style,
                width: Math.max(400, maxX + 50),
                height: Math.max(300, maxY + 50),
                zIndex: -1
              }
            };
          }
          return n;
        });
      });
    }
  }, [setNodes, pushDrawHistory]);

  const generateYaml = () => {
    const roots = nodes.filter(n => n.data.isEip && n.data.shape !== 'text' && n.data.shape !== 'note' && !edges.some(e => e.target === n.id));
    let yaml = '';

    const buildSteps = (currentId, indentLevel) => {
      let result = '';
      const indent = ' '.repeat(indentLevel);
      let curr = currentId;

      while (curr) {
        const outgoingEdges = edges.filter(e => e.source === curr);
        if (outgoingEdges.length === 0) break;

        if (outgoingEdges.length === 1) {
          const nextNode = nodes.find(n => n.id === outgoingEdges[0].target);
          if (!nextNode) break;

          if (nextNode.data.rawYaml && nextNode.data.rawYaml.trim()) {
            const lines = nextNode.data.rawYaml.split('\n');
            for (let line of lines) {
              result += `${indent}${line}\n`;
            }
            curr = nextNode.id;
            continue;
          }

          const keyword = camelDslKeyword(nextNode.data.label);
          if (keyword === 'choice') {
            result += `${indent}- choice:\n`;
            const choiceOutgoing = edges.filter(e => e.source === nextNode.id);
            for (let edge of choiceOutgoing) {
               const branch = nodes.find(n => n.id === edge.target);
               if (!branch) continue;
               const branchKw = camelDslKeyword(branch.data.label);
               if (branchKw === 'when') {
                 const expType = branch.data.expressionType || 'simple';
                 const expVal = branch.data.expression || 'TODO';
                 result += `${indent}    when:\n`;
                 if (expVal.includes('\n')) {
                   result += `${indent}      - ${expType}: |\n`;
                   const lines = expVal.split('\n');
                   for (let line of lines) {
                     result += `${indent}          ${line}\n`;
                   }
                 } else {
                   result += `${indent}      - ${expType}: "${expVal.replace(/"/g, '\\"')}"\n`;
                 }
                 result += `${indent}        steps:\n`;
                 result += buildSteps(branch.id, indentLevel + 10);
               } else if (branchKw === 'otherwise') {
                 result += `${indent}    otherwise:\n`;
                 result += `${indent}      steps:\n`;
                 result += buildSteps(branch.id, indentLevel + 8);
               }
            }
            break; 
          } else if (keyword === 'setBody' || keyword === 'setHeader') {
            const expType = nextNode.data.expressionType || 'simple';
            const expVal = nextNode.data.expression || 'TODO';
            result += `${indent}- ${keyword}:\n`;
            if (expVal.includes('\n')) {
              result += `${indent}    ${expType}: |\n`;
              const lines = expVal.split('\n');
              for (let line of lines) {
                result += `${indent}      ${line}\n`;
              }
            } else {
              result += `${indent}    ${expType}: "${expVal.replace(/"/g, '\\"')}"\n`;
            }
          } else if (keyword === 'log') {
            result += `${indent}- log:\n`;
            result += `${indent}    message: "TODO"\n`;
          } else if (keyword === 'transform') {
            result += `${indent}- transform:\n`;
            const lang = nextNode.data.label.split(' ')[0].toLowerCase();
            result += `${indent}    ${lang}: "TODO"\n`;
          } else if (keyword === 'marshal' || keyword === 'unmarshal') {
            result += `${indent}- ${keyword}:\n`;
            result += `${indent}    json:\n`;
            result += `${indent}      library: Jackson\n`;
          } else {
             result += `${indent}- to:\n`;
             result += `${indent}    uri: "${getUri(nextNode.data.label)}"\n`;
          }
          curr = nextNode.id;
        } else {
           result += `${indent}- multicast:\n`;
           result += `${indent}    steps:\n`;
           for (let edge of outgoingEdges) {
             const nextNode = nodes.find(n => n.id === edge.target);
             if (nextNode) {
               result += `${indent}      - to:\n`;
               result += `${indent}          uri: "${getUri(nextNode.data.label)}"\n`;
             }
           }
           break;
        }
      }
      return result;
    };

    roots.forEach(root => {
      yaml += `- route:\n`;
      yaml += `    from:\n`;
      yaml += `      uri: "${getUri(root.data.label)}"\n`;
      yaml += `    steps:\n`;
      yaml += buildSteps(root.id, 6);
    });
    
    if (yaml === '') yaml = '# Connect nodes to generate camel route YAML\n- route:\n    from:\n      uri: "direct:start"\n    steps:\n      - log: "empty route"';

    const beanNodes = nodes.filter(n => n.data.label === 'Bean');
    if (beanNodes.length > 0) {
      let beansSection = '- beans:\n';
      beanNodes.forEach(bn => {
        const bName = bn.data.beanName || 'myBean';
        const bType = bn.data.beanType || 'com.example.MyClass';
        beansSection += `  - name: "${bName}"\n    type: "${bType}"\n`;
      });
      yaml = beansSection + '\n' + yaml;
    }

    return yaml;
  };

  const resetZoom = () => {
    if (reactFlowInstance) {
      if (workspace === 'cad') {
        reactFlowInstance.fitView({ padding: 0.05, duration: 400 });
      } else {
        reactFlowInstance.zoomTo(1, { duration: 300 });
      }
    }
  };

  const exportLayout = (format) => {
    const data = { nodes, edges };
    let payloadStr;
    let mimeType;
    let filename;

    const baseName = getSanitizedBaseName();

    if (format === 'json') {
      payloadStr = JSON.stringify(data, null, 2);
      mimeType = 'application/json';
      filename = `${baseName}-layout.json`;
    } else {
      payloadStr = yaml.dump(data, { indent: 2, skipInvalid: true });
      mimeType = 'text/yaml';
      filename = `${baseName}-layout.yaml`;
    }

    const a = document.createElement('a');
    a.href = `data:${mimeType};charset=utf-8,` + encodeURIComponent(payloadStr);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const exportCamelRoute = () => {
    const payloadStr = generateYaml();
    const baseName = getSanitizedBaseName();
    const filename = `${baseName}-routes.yaml`;

    const a = document.createElement('a');
    a.href = 'data:text/yaml;charset=utf-8,' + encodeURIComponent(payloadStr);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const applyTextImport = () => {
    if (!editorContent.trim()) return;
    try {
      const parsed = yaml.load(editorContent);
      if (parsed && Array.isArray(parsed.nodes)) {
        let finalNodes = parsed.nodes;
        let finalEdges = Array.isArray(parsed.edges) ? parsed.edges : [];

        if (autoArrangeOnImport) {
          // Temporarily call autoLayout-like logic or just set and then run autoLayout
          setNodes(finalNodes);
          setEdges(finalEdges);
          setShowTextEditor(false);
          setEditorContent('');
          
          // Small delay to ensure state is set before layout
          setTimeout(() => {
            autoLayout('LR', finalNodes, finalEdges);
          }, 100);
          return;
        }

        setNodes(finalNodes);
        setEdges(finalEdges);
        setShowTextEditor(false);
        setEditorContent('');
        setTimeout(() => {
          if (reactFlowInstance) reactFlowInstance.fitView({ padding: 0.2, duration: 800 });
        }, 200);
      } else {
        alert("Input does not contain a valid visual layout (nodes/edges structure). Please provide a valid JSON/YAML structure.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to parse content: " + err.message);
    }
  };

  const handleImportFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text !== 'string') return;

      if (workspace === 'cad') {
        // Direct .mermaid code file loading into the panel
        setCadCode(text);
        return;
      }

      try {
        const parsed = yaml.load(text);
        if (parsed && Array.isArray(parsed.nodes)) {
          setNodes(parsed.nodes);
          if (Array.isArray(parsed.edges)) {
            setEdges(parsed.edges);
          } else {
            setEdges([]);
          }
          setTimeout(() => {
            if (reactFlowInstance) reactFlowInstance.fitView({ padding: 0.2, duration: 800 });
          }, 200);
        } else {
          alert("Imported file does not contain a visual layout (nodes/edges structure). Please import a saved JSON/YAML diagram exported from this tool.");
        }
      } catch (err) {
        console.error(err);
        alert("Failed to parse file: " + err.message);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const loadTemplate = (template) => {
    const idMap = {};
    const newNodes = template.nodes.map(n => {
      const newId = uuidv4();
      idMap[n.id] = newId;
      return { ...n, id: newId };
    });

    newNodes.forEach(n => {
      if (n.parentId && idMap[n.parentId]) {
        n.parentId = idMap[n.parentId];
      }
    });

    const newEdges = template.edges.map(e => {
      return {
        ...e,
        id: uuidv4(),
        source: idMap[e.source] || e.source,
        target: idMap[e.target] || e.target
      };
    });

    setNodes(newNodes);
    setEdges(newEdges);
    setShowTemplatesModal(false);

    setTimeout(() => {
      if (reactFlowInstance) reactFlowInstance.fitView({ padding: 0.2, duration: 800 });
    }, 200);
  };
  loadTemplateRef.current = loadTemplate;

  const exportBgColor = theme === 'dark' ? '#0f111a' : '#ffffff';

  /* Stamp a solid background colour onto any dataURL (PNG or SVG data URI).
     Returns a Promise<string> with the final PNG dataURL. */
  const stampBackground = (dataUrl, w, h, bg) => new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const scale = 2;
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    const img = new window.Image();
    img.onload = () => { ctx.drawImage(img, 0, 0, w, h); resolve(canvas.toDataURL('image/png')); };
    img.src = dataUrl;
  });

  /* Inject a <rect> background into an SVG data-URI string and return new data-URI. */
  /* Decode an SVG data-URI into raw SVG text.
     html-to-image may emit any of:
       data:image/svg+xml;base64,<b64>
       data:image/svg+xml,<urlencoded>
       data:image/svg+xml;charset=utf-8,<urlencoded>   ← common form */
  const svgDataUriToText = (dataUri) => {
    const commaIdx = dataUri.indexOf(',');
    if (commaIdx === -1) return dataUri;
    const meta = dataUri.slice(0, commaIdx);
    const payload = dataUri.slice(commaIdx + 1);
    if (meta.includes('base64')) {
      // base64 → binary string → handle possible UTF-8 multi-byte
      try {
        const bin = atob(payload);
        const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
        return new TextDecoder('utf-8').decode(bytes);
      } catch { return atob(payload); }
    }
    return decodeURIComponent(payload);
  };

  const injectSvgBackground = (svgDataUri, w, h, bg) => {
    const svgText = svgDataUriToText(svgDataUri);
    const bgRect = `<rect width="${w}" height="${h}" fill="${bg}"/>`;
    // Insert background rect immediately after the opening <svg ...> tag
    const patched = svgText.replace(/(<svg[^>]*>)/s, `$1${bgRect}`);
    return URL.createObjectURL(new Blob([patched], { type: 'image/svg+xml;charset=utf-8' }));
  };

  /* Capture all canvas nodes by temporarily fitting them into the visible
     viewport, screenshotting the renderer element (which already carries
     the correct CSS background), then restoring the viewport.
     This avoids the bounds-computation / transform-juggling approach that
     clips rough strokes, shadows and text overflow. */
  const getDiagramBoundingBox = (rendererEl) => {
    const rendererRect = rendererEl.getBoundingClientRect();
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    const elements = rendererEl.querySelectorAll('.react-flow__node, .react-flow__edge-path');
    
    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      minX = Math.min(minX, rect.left - rendererRect.left);
      minY = Math.min(minY, rect.top - rendererRect.top);
      maxX = Math.max(maxX, rect.right - rendererRect.left);
      maxY = Math.max(maxY, rect.bottom - rendererRect.top);
    });

    if (minX === Infinity || minY === Infinity || maxX === -Infinity || maxY === -Infinity) {
      return {
        x: 0,
        y: 0,
        width: rendererRect.width,
        height: rendererRect.height
      };
    }

    const padding = 20;
    const x = Math.max(0, minX - padding);
    const y = Math.max(0, minY - padding);
    const width = Math.min(rendererRect.width - x, (maxX - minX) + padding * 2);
    const height = Math.min(rendererRect.height - y, (maxY - minY) + padding * 2);

    return { x, y, width, height };
  };

  const captureCanvasAsPng = async (filename, options = {}) => {
    const rendererEl = document.querySelector('.react-flow__renderer');
    if (!rendererEl) return;
    const savedVp = reactFlowInstance.getViewport();
    reactFlowInstance.fitView({ padding: 0.12, duration: 0 });
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    try {
      const bounds = getDiagramBoundingBox(rendererEl);
      const dataUrl = await toPng(rendererEl, { pixelRatio: 2, skipFonts: true });
      
      const img = new window.Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = dataUrl;
      });

      const canvas = document.createElement('canvas');
      const scale = 2;
      canvas.width = bounds.width * scale;
      canvas.height = bounds.height * scale;
      const ctx = canvas.getContext('2d');

      if (!options.transparent) {
        ctx.fillStyle = exportBgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(
        img,
        bounds.x * scale,
        bounds.y * scale,
        bounds.width * scale,
        bounds.height * scale,
        0,
        0,
        bounds.width * scale,
        bounds.height * scale
      );

      const pngDataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = filename;
      link.href = pngDataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) { console.error('PNG export error:', err); }
    finally { reactFlowInstance.setViewport(savedVp, { duration: 300 }); }
  };

  const captureCanvasAsSvg = async (filename, options = {}) => {
    const rendererEl = document.querySelector('.react-flow__renderer');
    if (!rendererEl) return;
    const savedVp = reactFlowInstance.getViewport();
    reactFlowInstance.fitView({ padding: 0.12, duration: 0 });
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    try {
      const bounds = getDiagramBoundingBox(rendererEl);
      const dataUri = await toSvg(rendererEl, { skipFonts: true });
      const svgText = svgDataUriToText(dataUri);
      
      const rect = rendererEl.getBoundingClientRect();
      const origWidth = rect.width;
      const origHeight = rect.height;

      let openingTag = svgText.match(/<svg([^>]*)>/s)?.[0];
      if (!openingTag) throw new Error("Could not find root SVG tag");

      let attrs = openingTag;
      attrs = attrs.replace(/\bwidth\s*=\s*"[^"]*"/gi, '');
      attrs = attrs.replace(/\bheight\s*=\s*"[^"]*"/gi, '');
      attrs = attrs.replace(/\bviewBox\s*=\s*"[^"]*"/gi, '');

      const newAttrs = ` width="${bounds.width}" height="${bounds.height}" viewBox="${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}"`;
      const newOpeningTag = attrs.replace(/<svg/i, `<svg${newAttrs}`);

      let result = svgText.replace(/<svg[^>]*>/s, newOpeningTag);

      let foreignObjectTag = result.match(/<foreignObject([^>]*)>/i)?.[0];
      if (foreignObjectTag) {
        let newForeignObjectTag = foreignObjectTag;
        newForeignObjectTag = newForeignObjectTag.replace(/\bwidth\s*=\s*"[^"]*"/gi, `width="${origWidth}"`);
        newForeignObjectTag = newForeignObjectTag.replace(/\bheight\s*=\s*"[^"]*"/gi, `height="${origHeight}"`);
        result = result.replace(foreignObjectTag, newForeignObjectTag);
      }

      if (!options.transparent) {
        const bgRect = `<rect x="${bounds.x}" y="${bounds.y}" width="${bounds.width}" height="${bounds.height}" fill="${exportBgColor}"/>`;
        result = result.replace(/(<svg[^>]*>)/s, `$1${bgRect}`);
      }

      const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(result);
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) { console.error('SVG export error:', err); }
    finally { reactFlowInstance.setViewport(savedVp, { duration: 300 }); }
  };

  const exportAsPng = (options = {}) => {
    const filename = `${getSanitizedBaseName()}.png`;
    if (reactFlowNodes.length === 0) return;
    captureCanvasAsPng(filename, options);
  };

  const exportAsSvg = (options = {}) => {
    const filename = `${getSanitizedBaseName()}.svg`;
    if (reactFlowNodes.length === 0) return;
    captureCanvasAsSvg(filename, options);
  };

  const ctxNode = contextMenu ? nodes.find(n => n.id === contextMenu.id) : null;
  const isCtxContainer = ctxNode?.data?.isContainer;
  const ctxParentId = ctxNode?.parentId;
  const allContainers = nodes.filter(n => n.data?.isContainer && n.id !== ctxNode?.id);
  const looseNodes = nodes.filter(n => !n.data?.isContainer && !n.parentId && n.id !== ctxNode?.id);

  const moveNodeToContext = (nodeId, containerId) => {
    setNodes(nds => {
      const container = nds.find(c => c.id === containerId);
      if (!container) return nds;

      const children = nds.filter(c => c.parentId === containerId && c.id !== nodeId);

      const childWidth = 160;
      const gapX = 50;
      const gapY = 50;
      const cols = 2;

      const index = children.length;
      const colIndex = index % cols;
      const rowIndex = Math.floor(index / cols);

      let offsetY = 70;
      for (let r = 0; r < rowIndex; r++) {
        const rowChildren = children.slice(r * cols, (r + 1) * cols);
        const rowMaxHeight = Math.max(80, ...rowChildren.map(c => {
          if (c.data?.shape === 'class') return 120;
          if (c.data?.shape === 'actor') return 90;
          return 80;
        }));
        offsetY += rowMaxHeight + gapY;
      }

      const offsetX = 30 + colIndex * (childWidth + gapX);

      const movingNode = nds.find(n => n.id === nodeId);
      const movingData = movingNode?.data || {};

      let nodeHeight = 80;
      if (movingData.shape === 'class') nodeHeight = 120;
      else if (movingData.shape === 'actor') nodeHeight = 90;

      let maxX = offsetX + childWidth;
      let maxY = offsetY + nodeHeight;

      children.forEach(c => {
        let ch = 80;
        if (c.data?.shape === 'class') ch = 120;
        else if (c.data?.shape === 'actor') ch = 90;

        const rightSide = c.position.x + childWidth;
        const bottomSide = c.position.y + ch;
        if (rightSide > maxX) maxX = rightSide;
        if (bottomSide > maxY) maxY = bottomSide;
      });

      const updatedNodes = nds.map(n => {
        if (n.id === nodeId) {
          return {
            ...n,
            parentId: containerId,
            extent: 'parent',
            position: { x: offsetX, y: offsetY }
          };
        }
        if (n.id === containerId) {
          return {
            ...n,
            style: {
              ...n.style,
              width: Math.max(400, maxX + 50),
              height: Math.max(300, maxY + 50),
              zIndex: -1
            }
          };
        }
        return n;
      });

      const nodeToMove = updatedNodes.find(n => n.id === nodeId);
      const otherNodes = updatedNodes.filter(n => n.id !== nodeId);
      return [...otherNodes, nodeToMove];
    });
    setContextMenu(null);
  };

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* Unified top bar — all workspaces */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 10px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', flexShrink: 0, zIndex: 1001, gap: '8px', width: '100%' }}>
        {/* Left: logo + workspace tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div onClick={onGoHome} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }} title="Go to home page">
            <MSLogo size={22} />
            <span style={{ fontWeight: 'bold', fontSize: '0.82rem', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>Model Studio</span>
          </div>
          <div style={{ width: '1px', height: '14px', background: 'var(--border-color)', margin: '0 4px' }} />
          <input
            type="text"
            value={diagramTitle}
            onChange={(e) => {
              setDiagramTitle(e.target.value);
              localStorage.setItem(`${workspace}-title`, e.target.value);
            }}
            style={{
              background: 'transparent',
              border: '1px solid transparent',
              borderRadius: '4px',
              color: 'var(--text-primary)',
              fontSize: '0.8rem',
              fontWeight: 500,
              padding: '2px 6px',
              width: '180px',
              outline: 'none',
              transition: 'all 0.2s',
            }}
            onFocus={(e) => {
              e.target.style.background = 'var(--bg-tertiary)';
              e.target.style.borderColor = 'var(--accent-blue)';
            }}
            onBlur={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.borderColor = 'transparent';
            }}
            title="Click to rename document"
          />
          <div style={{ width: '1px', height: '14px', background: 'var(--border-color)', margin: '0 4px' }} />
          <div style={{ display: 'flex', gap: '2px' }}>
            {['cad', 'diagram', 'draw', 'eip', 'ddd'].map((ws) => (
              <button key={ws} onClick={() => {
                setWorkspace(ws); setActiveTool('select'); setIsDrawingMode(false); setInteractionMode('move');
                if (ws === 'draw') setBgVariant('dots');
                if (ws === 'cad') {
                  setShowCadEditor(true);
                  [100, 300, 600].forEach(d => setTimeout(() => reactFlowInstance?.fitView({ padding: 0.05, duration: 300 }), d));
                } else {
                  setTimeout(() => reactFlowInstance?.fitView({ padding: 0.15, duration: 600 }), 80);
                }
              }} className={`btn ${workspace === ws ? 'btn-primary' : ''}`} style={{ fontSize: '0.72rem', padding: '3px 8px', textTransform: 'none', background: workspace === ws ? undefined : 'transparent', border: workspace === ws ? undefined : 'none', whiteSpace: 'nowrap' }}>
                {ws === 'ddd' ? 'Domain Driven Design' : ws === 'eip' ? 'Camel' : ws === 'diagram' ? 'Diagrams' : ws === 'cad' ? 'Code as Diagram' : 'Draw'}
              </button>
            ))}
          </div>
        </div>

        {/* Center: Draw tools (only for Draw workspace) */}
        {workspace === 'draw' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
            <button className="btn btn-icon-only" onClick={undoDraw} title="Undo (Ctrl+Z)" style={{ opacity: drawHistoryRef.current.length > 1 && drawHistoryIndexRef.current > 0 ? 1 : 0.35 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/></svg>
            </button>
            <button className="btn btn-icon-only" onClick={redoDraw} title="Redo (Ctrl+Shift+Z)" style={{ opacity: drawHistoryIndexRef.current < drawHistoryRef.current.length - 1 ? 1 : 0.35 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 019-9 9 9 0 016 2.3L21 13"/></svg>
            </button>
            <div style={{ width: '1px', height: '14px', background: 'var(--border-color)', margin: '0 2px' }} />
            <button className={`btn btn-icon-only ${activeTool === 'select' && !isDrawingMode ? 'btn-primary' : ''}`} onClick={() => { setActiveTool('select'); setIsDrawingMode(false); setInteractionMode('move'); }} title="Select / Move (V)"><MousePointer2 size={14} /></button>
            <button className={`btn btn-icon-only ${activeTool === 'hand' ? 'btn-primary' : ''}`} onClick={() => { setActiveTool('hand'); setIsDrawingMode(false); setInteractionMode('pan'); }} title="Hand / Pan (H)"><Hand size={14} /></button>
            <div style={{ width: '1px', height: '14px', background: 'var(--border-color)', margin: '0 2px' }} />
            <button className={`btn btn-icon-only ${activeTool === 'rectangle' ? 'btn-primary' : ''}`} onClick={() => { setActiveTool('rectangle'); setIsDrawingMode(false); setInteractionMode('move'); }} title="Rectangle (R)"><Square size={14} /></button>
            <button className={`btn btn-icon-only ${activeTool === 'circle' ? 'btn-primary' : ''}`} onClick={() => { setActiveTool('circle'); setIsDrawingMode(false); }} title="Circle (O)"><CircleIcon size={14} /></button>
            <button className={`btn btn-icon-only ${activeTool === 'diamond' ? 'btn-primary' : ''}`} onClick={() => { setActiveTool('diamond'); setIsDrawingMode(false); }} title="Diamond (D)"><Diamond size={14} /></button>
            <button className={`btn btn-icon-only ${activeTool === 'triangle' ? 'btn-primary' : ''}`} onClick={() => { setActiveTool('triangle'); setIsDrawingMode(false); }} title="Triangle"><Triangle size={14} /></button>
            <button className={`btn btn-icon-only ${activeTool === 'cloud' ? 'btn-primary' : ''}`} onClick={() => { setActiveTool('cloud'); setIsDrawingMode(false); }} title="Cloud (C)"><Cloud size={14} /></button>
            <button className={`btn btn-icon-only ${activeTool === 'arrow' ? 'btn-primary' : ''}`} onClick={() => { setActiveTool('arrow'); setIsDrawingMode(false); }} title="Arrow (A)"><ArrowUpRight size={14} /></button>
            <button className={`btn btn-icon-only ${activeTool === 'line' ? 'btn-primary' : ''}`} onClick={() => { setActiveTool('line'); setIsDrawingMode(false); }} title="Line (L)"><Minus size={14} /></button>
            <button className={`btn btn-icon-only ${activeTool === 'text' ? 'btn-primary' : ''}`} onClick={() => { setActiveTool('text'); setIsDrawingMode(false); }} title="Text"><Type size={14} /></button>
            <button className={`btn btn-icon-only ${isDrawingMode ? 'btn-primary' : ''}`} onClick={() => { setActiveTool('pencil'); setIsDrawingMode(true); }} title="Pencil (P)"><Pencil size={14} /></button>
            <button className={`btn btn-icon-only ${activeTool === 'eraser' ? 'btn-primary' : ''}`} onClick={() => { setActiveTool('eraser'); setIsDrawingMode(false); }} title="Eraser (E)"><Eraser size={14} /></button>
            <button className="btn btn-icon-only" onClick={() => { addCanvasWidget('note'); setActiveTool('select'); setIsDrawingMode(false); }} title="Sticky Note (N)" style={{ color: '#ca8a04' }}><StickyNote size={14} /></button>
            <div style={{ width: '1px', height: '14px', background: 'var(--border-color)', margin: '0 2px' }} />
            <button className={`btn btn-icon-only ${isRoughGlobal ? 'btn-primary' : ''}`} onClick={() => setIsRoughGlobal(!isRoughGlobal)} title="Hand-drawn Style"><Paintbrush size={14} /></button>
            <button className={`btn btn-icon-only ${drawToolLock ? 'btn-primary' : ''}`} onClick={() => setDrawToolLock(v => !v)} title={drawToolLock ? 'Tool locked' : 'Tool unlocked'}>
              {drawToolLock ? <Lock size={14} /> : <Lock size={14} style={{ opacity: 0.4 }} />}
            </button>
          </div>
        )}

        {/* Right: action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          {workspace !== 'draw' && (
            <>
              <button className={`btn btn-icon-only ${interactionMode === 'move' ? 'btn-primary' : ''}`} onClick={() => setInteractionMode('move')} title="Select & Move (V)"><MousePointer2 size={14} /></button>
              <button className={`btn btn-icon-only ${interactionMode === 'pan' ? 'btn-primary' : ''}`} onClick={() => setInteractionMode('pan')} title="Pan Canvas (H)"><Hand size={14} /></button>
              {workspace !== 'cad' && (
                <>
                  <button className="btn btn-icon-only" onClick={() => autoLayout('LR')} title="Auto Layout Left→Right"><ArrowRightLeft size={14} /></button>
                  <button className="btn btn-icon-only" onClick={() => autoLayout('TB')} title="Auto Layout Top→Bottom"><ArrowDownUp size={14} /></button>
                </>
              )}
              <div style={{ width: '1px', height: '14px', background: 'var(--border-color)', margin: '0 2px' }} />
            </>
          )}
          {workspace !== 'draw' && (
            <button className="btn" onClick={() => workspace === 'cad' ? setShowTemplateGallery(true) : setShowTemplatesModal(true)} style={{ fontSize: '0.72rem', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid var(--accent-blue)', background: 'rgba(59,130,246,0.1)', color: '#60a5fa', whiteSpace: 'nowrap' }}><Layers size={13} /> Templates</button>
          )}
          {workspace !== 'draw' && workspace !== 'cad' && (
            <>
              <div style={{ width: '1px', height: '14px', background: 'var(--border-color)', margin: '0 2px' }} />
              {workspace !== 'eip' && (
                <button className="btn btn-icon-only" onClick={() => addCanvasWidget('text')} style={{ border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }} title="Insert Title / Text Header"><Type size={14} /></button>
              )}
              <button className="btn btn-icon-only" onClick={() => addCanvasWidget('note')} style={{ border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: '#ca8a04' }} title="Insert Sticky Note"><StickyNote size={14} /></button>
            </>
          )}
          {workspace === 'cad' && (
            <button className="btn btn-icon-only" onClick={() => addCanvasWidget('note')} style={{ border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: '#ca8a04' }} title="Add Sticky Note (N)"><StickyNote size={14} /></button>
          )}
          <div style={{ width: '1px', height: '14px', background: 'var(--border-color)', margin: '0 2px' }} />
          {workspace !== 'cad' && (
            <button className="btn btn-icon-only" onClick={() => setShowJson(!showJson)} title="View Model Source (JSON/YAML)"><Code size={14} /></button>
          )}
          <button className="btn btn-icon-only" title="Share (copy link)" onClick={() => {
            try {
              const n = workspace === 'draw' ? drawNodes : workspace === 'diagram' ? diagramNodes : workspace === 'ddd' ? dddNodes : workspace === 'eip' ? eipNodes : cadNodes;
              const e = workspace === 'draw' ? drawEdges : workspace === 'diagram' ? diagramEdges : workspace === 'ddd' ? dddEdges : workspace === 'eip' ? eipEdges : cadEdges;
              const payload = btoa(JSON.stringify({ nodes: n, edges: e }));
              const url = `${window.location.origin}${window.location.pathname}#${workspace}=${payload}`;
              navigator.clipboard.writeText(url).then(() => alert('Share link copied to clipboard!')).catch(() => prompt('Copy this share link:', url));
            } catch { alert('Canvas too large to share via URL.'); }
          }}><Share2 size={14} /></button>
          <button className="btn btn-icon-only" onClick={clearCanvas} title="Clear Everything"><Eraser size={14} color="#ef4444" /></button>
          <button
            className="btn"
            onClick={() => {
              if (window.confirm("Reset Studio?\n\nThis will permanently clear all cached diagrams, code, and settings from your browser, then reload the studio with default settings.")) {
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = window.location.origin + window.location.pathname;
              }
            }}
            style={{
              fontSize: '0.72rem',
              padding: '3px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              border: '1px solid #ef4444',
              background: 'rgba(239,68,68,0.1)',
              color: '#f87171',
              whiteSpace: 'nowrap'
            }}
            title="Reset Studio — clear all cache & reload with defaults"
          >
            <RefreshCw size={13} /> Reset Studio
          </button>
          <div style={{ width: '1px', height: '14px', background: 'var(--border-color)', margin: '0 2px' }} />
          <button className={`btn btn-icon-only ${bgVariant === 'dots' ? 'btn-primary' : ''}`} onClick={() => setBgVariant(v => v === 'dots' ? 'plain' : 'dots')} title={bgVariant === 'dots' ? 'Hide canvas grid' : 'Show canvas grid'}><Grid3X3 size={14} /></button>
          <ThemeToggle />
          <button className="btn btn-icon-only" onClick={() => { setHelpTab(workspace === 'eip' ? 'eip' : workspace === 'cad' ? 'cad' : workspace); setShowHelp(true); }} title="Help & Reference (?)"><Info size={14} /></button>
          <div style={{ width: '1px', height: '14px', background: 'var(--border-color)', margin: '0 2px' }} />
          <button className="btn btn-icon-only" onClick={() => setShowTextEditor(true)} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }} title="Import diagram from text"><FilePlus size={14} /></button>
          <button className="btn" onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', padding: '3px 8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', whiteSpace: 'nowrap' }} title="Import from file"><Upload size={13} /> Import</button>
          <div style={{ position: 'relative' }}>
            <button className="btn btn-primary" onClick={() => setShowExportDropdown(!showExportDropdown)} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', padding: '3px 8px', whiteSpace: 'nowrap' }}><Download size={13} /> Export</button>
            {showExportDropdown && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', zIndex: 2000, width: '240px', padding: '6px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {workspace === 'cad' ? (
                  <button className="btn" onClick={() => { const a = document.createElement('a'); a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(cadCode); a.download = `${getSanitizedBaseName()}.mmd`; document.body.appendChild(a); a.click(); document.body.removeChild(a); setShowExportDropdown(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left', width: '100%', border: 'none', padding: '8px 12px', background: 'transparent', color: '#60a5fa', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}><Code size={14} /> Export Mermaid Code (.mmd)</button>
                ) : (
                  <>
                    <button className="btn" onClick={() => { exportLayout('json'); setShowExportDropdown(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left', width: '100%', border: 'none', padding: '8px 12px', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.8rem', cursor: 'pointer' }}><FileJson size={14} /> Export Layout (JSON)</button>
                    <button className="btn" onClick={() => { exportLayout('yaml'); setShowExportDropdown(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left', width: '100%', border: 'none', padding: '8px 12px', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.8rem', cursor: 'pointer' }}><FileText size={14} /> Export Layout (YAML)</button>
                  </>
                )}
                {workspace === 'eip' && (
                  <button className="btn" onClick={() => { exportCamelRoute(); setShowExportDropdown(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left', width: '100%', border: 'none', padding: '8px 12px', background: 'transparent', color: '#f59e0b', fontSize: '0.8rem', cursor: 'pointer' }}><Workflow size={14} /> Export Camel Route (YAML)</button>
                )}
                <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />
                <button className="btn" onClick={() => { exportAsPng({ transparent: false }); setShowExportDropdown(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left', width: '100%', border: 'none', padding: '8px 12px', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.8rem', cursor: 'pointer' }}><Image size={14} /> Export PNG (with bg)</button>
                <button className="btn" onClick={() => { exportAsPng({ transparent: true }); setShowExportDropdown(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left', width: '100%', border: 'none', padding: '8px 12px', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.8rem', cursor: 'pointer' }}><Image size={14} /> Export PNG (transparent)</button>
                <button className="btn" onClick={() => { exportAsSvg({ transparent: false }); setShowExportDropdown(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left', width: '100%', border: 'none', padding: '8px 12px', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.8rem', cursor: 'pointer' }}><FileText size={14} /> Export SVG (with bg)</button>
                <button className="btn" onClick={() => { exportAsSvg({ transparent: true }); setShowExportDropdown(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left', width: '100%', border: 'none', padding: '8px 12px', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.8rem', cursor: 'pointer' }}><FileText size={14} /> Export SVG (transparent)</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'row', flex: 1, overflow: 'hidden', width: '100%', position: 'relative' }}>
        {workspace !== 'cad' && workspace !== 'draw' && (
          <aside className={`sidebar ${!isSidebarOpen ? 'collapsed' : ''}`}>
        <button 
          className="sidebar-toggle-btn" 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
        <div className="sidebar-inner">
          <div className="sidebar-header" style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{workspace === 'eip' ? 'Camel Route Builder' : `${workspace} Palette`}</span>
          </div>
          
          <div className="sidebar-content">
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', justifyContent: 'flex-end' }}>
                  <button className="btn btn-icon-only" onClick={expandAll} title="Expand All">
                    <ChevronsDown size={16} />
                  </button>
                  <button className="btn btn-icon-only" onClick={collapseAll} title="Collapse All">
                    <ChevronsUp size={16} />
                  </button>
                </div>

                {workspace === 'ddd' && (
                  <>
                    <CollapsibleSection title="Strategic DDD" isOpen={sectionsOpen.ddd_strategic} onToggle={() => toggleSection('ddd_strategic')}>
                      <PaletteItem label="Bounded Context" icon={BoxSelect} color="#3b82f6" type="BoxSelect" isContainer={true} textAlign="left" verticalAlign="top" />
                      <PaletteItem label="Core Subdomain" icon={Target} color="#ef4444" type="Target" isContainer={true} textAlign="left" verticalAlign="top" />
                      <PaletteItem label="Generic Subdomain" icon={Grid3X3} color="#94a3b8" type="Grid3X3" isContainer={true} textAlign="left" verticalAlign="top" />
                      <PaletteItem label="External System" icon={Cloud} color="#64748b" type="Cloud" />
                      <PaletteItem label="Actor / User" icon={User} color="#eab308" type="User" shape="actor" />
                    </CollapsibleSection>
                    <CollapsibleSection title="Tactical DDD" isOpen={sectionsOpen.ddd_tactical} onToggle={() => toggleSection('ddd_tactical')}>
                      <PaletteItem label="Aggregate Root" icon={Box} color="#8b5cf6" type="Box" isContainer={true} textAlign="left" verticalAlign="top" />
                      <PaletteItem label="Entity" icon={Package} color="#3b82f6" type="Package" />
                      <PaletteItem label="Value Object" icon={Layers} color="#10b981" type="Layers" />
                      <PaletteItem label="Domain Service" icon={Zap} color="#f59e0b" type="Zap" />
                      <PaletteItem label="Repository" icon={Database} color="#14b8a6" type="Database" />
                      <PaletteItem label="Factory" icon={Settings2} color="#ec4899" type="Settings2" />
                    </CollapsibleSection>
                    <CollapsibleSection title="Event Storming" isOpen={sectionsOpen.ddd_event} onToggle={() => toggleSection('ddd_event')}>
                      <PaletteItem label="Domain Event" icon={MessageSquare} color="#f97316" type="MessageSquare" />
                      <PaletteItem label="Command" icon={Zap} color="#3b82f6" type="Zap" />
                      <PaletteItem label="Policy / Saga" icon={Workflow} color="#d946ef" type="Workflow" />
                      <PaletteItem label="Read Model" icon={FileText} color="#22c55e" type="FileText" />
                      <PaletteItem label="UI / Screen" icon={BoxSelect} color="#a855f7" type="BoxSelect" />
                    </CollapsibleSection>
                  </>
                )}
                
                {workspace === 'diagram' && (
                  <>
                    <CollapsibleSection title="Flowchart" isOpen={sectionsOpen.flowchart} onToggle={() => toggleSection('flowchart')}>
                      <PaletteItem label="Start / End" icon={PlayCircle} color="#10b981" type="PlayCircle" shape="oval" />
                      <PaletteItem label="Process" icon={Box} color="#60a5fa" type="Box" />
                      <PaletteItem label="Decision" icon={Diamond} color="#f59e0b" type="Diamond" shape="diamond" />
                      <PaletteItem label="Data" icon={Database} color="#8b5cf6" type="Database" />
                      <PaletteItem label="System" icon={Server} color="#ef4444" type="Server" />
                    </CollapsibleSection>
                    
                    <CollapsibleSection title="System Architecture" isOpen={sectionsOpen.sysarch} onToggle={() => toggleSection('sysarch')}>
                      <PaletteItem label="Cloud Infrastructure" icon={Cloud} color="#0ea5e9" type="Cloud" />
                      <PaletteItem label="Application Server" icon={Server} color="#ef4444" type="Server" />
                      <PaletteItem label="Database Storage" icon={Database} color="#10b981" type="Database" />
                      <PaletteItem label="External API" icon={Code} color="#f59e0b" type="Code" />
                    </CollapsibleSection>

                    <CollapsibleSection title="UML & Class" isOpen={sectionsOpen.uml} onToggle={() => toggleSection('uml')}>
                      <PaletteItem label="Class" icon={File} color="#8b5cf6" type="File" shape="class" />
                      <PaletteItem label="Interface" icon={Plug} color="#ec4899" type="Plug" shape="interface" />
                      <PaletteItem label="Actor" icon={User} color="#f43f5e" type="User" shape="actor" />
                    </CollapsibleSection>

                    <CollapsibleSection title="ER Diagram" isOpen={sectionsOpen.er} onToggle={() => toggleSection('er')}>
                      <PaletteItem label="Entity" icon={Table} color="#0ea5e9" type="Table" />
                      <PaletteItem label="Attribute" icon={Type} color="#14b8a6" type="Type" shape="oval" />
                      <PaletteItem label="Relationship" icon={Diamond} color="#eab308" type="Diamond" shape="diamond" />
                    </CollapsibleSection>

                    <CollapsibleSection title="Mindmap & Org" isOpen={sectionsOpen.mindmap} onToggle={() => toggleSection('mindmap')}>
                      <PaletteItem label="Central Idea" icon={Box} color="#10b981" type="Box" shape="oval" />
                      <PaletteItem label="Node" icon={Box} color="#3b82f6" type="Box" />
                      <PaletteItem label="Department" icon={Building} color="#f59e0b" type="Building" />
                    </CollapsibleSection>
                  </>
                )}

                {workspace === 'eip' && (
                  <>
                    <CollapsibleSection title="Channels & Endpoints" isOpen={sectionsOpen.endpoint} onToggle={() => toggleSection('endpoint')}>
                      <PaletteItem label="Route Start (From)" icon={PlayCircle} color="#10b981" type="PlayCircle" shape="oval" isEip={true} />
                      <PaletteItem label="Timer" icon={Clock} color="#10b981" type="Clock" shape="oval" isEip={true} />
                      <PaletteItem label="Log" icon={Code} color="#64748b" type="Code" isEip={true} />
                      <PaletteItem label="Point-to-Point" icon={Send} color="#f97316" type="Send" isEip={true} />
                      <PaletteItem label="Publish-Subscribe" icon={Network} color="#8b5cf6" type="Network" isEip={true} />
                      <PaletteItem label="Dead Letter Channel" icon={Skull} color="#ef4444" type="Skull" isEip={true} />
                      <PaletteItem label="Database / JDBC" icon={Database} color="#10b981" type="Database" isEip={true} />
                      <PaletteItem label="Http Endpoint" icon={Cloud} color="#0ea5e9" type="Cloud" isEip={true} />
                      <PaletteItem label="File / FTP" icon={FileArchive} color="#eab308" type="FileArchive" isEip={true} />
                      <PaletteItem label="IBM MQ" icon={Server} color="#ef4444" type="Server" isEip={true} />
                      <PaletteItem label="Solace" icon={Cloud} color="#0ea5e9" type="Cloud" isEip={true} />
                      <PaletteItem label="ActiveMQ / JMS" icon={MessageCircle} color="#ef4444" type="MessageCircle" isEip={true} />
                      <PaletteItem label="Kafka" icon={RadioTower} color="#a855f7" type="RadioTower" isEip={true} />
                      <PaletteItem label="REST API" icon={Webhook} color="#06b6d4" type="Webhook" isEip={true} />
                      <PaletteItem label="Bean" icon={Box} color="#f59e0b" type="Box" isEip={true} />
                      <PaletteItem label="GraphQL" icon={Hexagon} color="#ec4899" type="Hexagon" isEip={true} />
                      <PaletteItem label="SMTP / Mail" icon={Mail} color="#6366f1" type="Mail" isEip={true} />
                      <PaletteItem label="SAP / ERP" icon={Building2} color="#14b8a6" type="Building2" isEip={true} />
                      <PaletteItem label="Salesforce" icon={CloudLightning} color="#3b82f6" type="CloudLightning" isEip={true} />
                      <PaletteItem label="AWS S3" icon={BoxSelect} color="#f59e0b" type="BoxSelect" isEip={true} />
                      <PaletteItem label="TCP / UDP" icon={Plug} color="#8b5cf6" type="Plug" isEip={true} />
                      <PaletteItem label="AMQP" icon={Zap} color="#f43f5e" type="Zap" isEip={true} />
                      
                      {/* Additional Kamelets */}
                      <PaletteItem label="AWS SQS Kamelet" icon={BoxSelect} color="#f97316" type="BoxSelect" isEip={true} />
                      <PaletteItem label="Azure Storage Kamelet" icon={Database} color="#3b82f6" type="Database" isEip={true} />
                      <PaletteItem label="Github Kamelet" icon={Code} color="#64748b" type="Code" isEip={true} />
                      <PaletteItem label="Jira Kamelet" icon={CheckCircle2} color="#3b82f6" type="CheckCircle2" isEip={true} />
                      <PaletteItem label="Telegram Kamelet" icon={Send} color="#0ea5e9" type="Send" isEip={true} />
                      <PaletteItem label="Slack Kamelet" icon={MessageSquare} color="#ec4899" type="MessageSquare" isEip={true} />
                      <PaletteItem label="Webhook Kamelet" icon={Webhook} color="#a855f7" type="Webhook" isEip={true} />
                    </CollapsibleSection>

                    <CollapsibleSection title="Message Routing" isOpen={sectionsOpen.routing} onToggle={() => toggleSection('routing')}>
                      <PaletteItem label="Choice (Router)" icon={GitBranch} color="#f59e0b" type="GitBranch" shape="diamond" isEip={true} />
                      <PaletteItem label="Message Filter" icon={Filter} color="#3b82f6" type="Filter" isEip={true} />
                      <PaletteItem label="Splitter" icon={Workflow} color="#a855f7" type="Workflow" isEip={true} />
                      <PaletteItem label="Aggregator" icon={GitMerge} color="#8b5cf6" type="GitMerge" isEip={true} />
                      <PaletteItem label="Resequencer" icon={ListOrdered} color="#0ea5e9" type="ListOrdered" isEip={true} />
                      <PaletteItem label="Routing Slip" icon={Route} color="#14b8a6" type="Route" isEip={true} />
                      <PaletteItem label="Dynamic Router" icon={RefreshCw} color="#059669" type="RefreshCw" isEip={true} />
                      <PaletteItem label="Wire Tap" icon={Radio} color="#d946ef" type="Radio" isEip={true} />
                      <PaletteItem label="Multicast" icon={Share2} color="#f43f5e" type="Share2" isEip={true} />
                      <PaletteItem label="Recipient List" icon={ListChecks} color="#84cc16" type="ListChecks" isEip={true} />
                      <PaletteItem label="Load Balancer" icon={Scale} color="#eab308" type="Scale" isEip={true} />
                    </CollapsibleSection>

                    <CollapsibleSection title="Transformation" isOpen={sectionsOpen.transform} onToggle={() => toggleSection('transform')}>
                      <PaletteItem label="Processor" icon={Cpu} color="#0ea5e9" type="Cpu" isEip={true} />
                      <PaletteItem label="Content Enricher" icon={FilePlus} color="#ec4899" type="FilePlus" isEip={true} />
                      <PaletteItem label="Transform" icon={ArrowRightLeft} color="#d946ef" type="ArrowRightLeft" isEip={true} />
                      <PaletteItem label="Claim Check" icon={ShieldCheck} color="#f43f5e" type="ShieldCheck" isEip={true} />
                      <PaletteItem label="Normalizer" icon={Settings2} color="#64748b" type="Settings2" isEip={true} />
                      <PaletteItem label="Sort" icon={ArrowDownUp} color="#3b82f6" type="ArrowDownUp" isEip={true} />
                      <PaletteItem label="Script" icon={TerminalSquare} color="#10b981" type="TerminalSquare" isEip={true} />
                      <PaletteItem label="Validate" icon={CheckCircle2} color="#22c55e" type="CheckCircle2" isEip={true} />
                      <PaletteItem label="XSLT-Saxon" icon={FileText} color="#a855f7" type="FileText" isEip={true} />
                      <PaletteItem label="Unmarshal SwiftMT" icon={PackageOpen} color="#f59e0b" type="PackageOpen" isEip={true} />
                      <PaletteItem label="Marshal" icon={Package} color="#8b5cf6" type="Package" isEip={true} />
                    </CollapsibleSection>
                  </>
                )}

                {workspace === 'draw' && (
                  <>
                    <CollapsibleSection title="Infrastructure" isOpen={sectionsOpen.draw_infra} onToggle={() => toggleSection('draw_infra')}>
                      <PaletteItem label="Server / VM" icon={Server} color="#ef4444" type="Server" />
                      <PaletteItem label="Database" icon={Database} color="#10b981" type="Database" />
                      <PaletteItem label="Cloud" icon={Cloud} color="#0ea5e9" type="Cloud" />
                      <PaletteItem label="CPU / Compute" icon={Cpu} color="#8b5cf6" type="Cpu" />
                      <PaletteItem label="Storage / Disk" icon={HardDrive} color="#64748b" type="HardDrive" />
                      <PaletteItem label="Container / Pod" icon={Package} color="#06b6d4" type="Package" />
                      <PaletteItem label="Microservice" icon={Box} color="#3b82f6" type="Box" />
                    </CollapsibleSection>
                    <CollapsibleSection title="Network & Security" isOpen={sectionsOpen.draw_network} onToggle={() => toggleSection('draw_network')}>
                      <PaletteItem label="Internet / Globe" icon={Globe} color="#0ea5e9" type="Globe" />
                      <PaletteItem label="Firewall / Shield" icon={Shield} color="#22c55e" type="Shield" />
                      <PaletteItem label="Lock / Auth" icon={Lock} color="#f59e0b" type="Lock" />
                      <PaletteItem label="Network Switch" icon={Network} color="#a855f7" type="Network" />
                      <PaletteItem label="WiFi" icon={Wifi} color="#06b6d4" type="Wifi" />
                      <PaletteItem label="Radio Tower" icon={RadioTower} color="#ec4899" type="RadioTower" />
                    </CollapsibleSection>
                    <CollapsibleSection title="Applications" isOpen={sectionsOpen.draw_apps} onToggle={() => toggleSection('draw_apps')}>
                      <PaletteItem label="Browser / Desktop" icon={Monitor} color="#3b82f6" type="Monitor" />
                      <PaletteItem label="Mobile App" icon={Smartphone} color="#8b5cf6" type="Smartphone" />
                      <PaletteItem label="Terminal / CLI" icon={Terminal} color="#10b981" type="Terminal" />
                      <PaletteItem label="Code / IDE" icon={Code} color="#f59e0b" type="Code" />
                      <PaletteItem label="API" icon={Webhook} color="#ec4899" type="Webhook" />
                      <PaletteItem label="File / Doc" icon={FileText} color="#64748b" type="FileText" />
                    </CollapsibleSection>
                    <CollapsibleSection title="Middleware & Services" isOpen={sectionsOpen.draw_middleware} onToggle={() => toggleSection('draw_middleware')}>
                      <PaletteItem label="Message Queue" icon={MessageSquare} color="#f59e0b" type="MessageSquare" />
                      <PaletteItem label="Kafka / Stream" icon={RadioTower} color="#a855f7" type="RadioTower" />
                      <PaletteItem label="Load Balancer" icon={Scale} color="#0ea5e9" type="Scale" />
                      <PaletteItem label="API Gateway" icon={Layers} color="#f97316" type="Layers" />
                      <PaletteItem label="Cache / Redis" icon={Zap} color="#22c55e" type="Zap" />
                      <PaletteItem label="Search Engine" icon={Search} color="#6366f1" type="Search" />
                    </CollapsibleSection>
                    <CollapsibleSection title="People & Actors" isOpen={sectionsOpen.draw_people} onToggle={() => toggleSection('draw_people')}>
                      <PaletteItem label="User / Actor" icon={User} color="#eab308" type="User" shape="actor" />
                      <PaletteItem label="Team / Group" icon={Users} color="#3b82f6" type="Users" />
                      <PaletteItem label="Organization" icon={Building} color="#8b5cf6" type="Building" />
                      <PaletteItem label="External System" icon={Building2} color="#64748b" type="Building2" />
                    </CollapsibleSection>
                    <CollapsibleSection title="Shapes" isOpen={sectionsOpen.draw_shapes} onToggle={() => toggleSection('draw_shapes')}>
                      <PaletteItem label="Box / Rect" icon={Box} color="#60a5fa" type="Box" />
                      <PaletteItem label="Oval / Ellipse" icon={CircleIcon} color="#34d399" type="Circle" shape="oval" />
                      <PaletteItem label="Decision" icon={Diamond} color="#fbbf24" type="Diamond" shape="diamond" />
                    </CollapsibleSection>
                  </>
                )}

                {/* General Annotations & Widgets */}
                <CollapsibleSection title="Annotations & Notes" isOpen={sectionsOpen.annotations} onToggle={() => toggleSection('annotations')}>
                  <PaletteItem label="Title / Header" icon={Type} color="var(--text-primary)" type="Type" shape="text" />
                  <PaletteItem label="Sticky Note" icon={StickyNote} color="#fef08a" type="StickyNote" shape="note" />
                </CollapsibleSection>
          </div>
        </div>
      </aside>
      )}
      
      <main
        className={`canvas-area ${theme === 'dark' ? 'theme-dark' : 'theme-light'}`}
        data-drawing-active={isDrawingMode || (workspace === 'draw' && activeTool !== 'select') ? 'true' : 'false'}
        data-tool={activeTool}
        ref={reactFlowWrapper}
        style={{ display: 'flex', flexDirection: 'row', flex: 1, height: '100%' }}
      >
        {workspace === 'draw' && (
          <div
            style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 50, display: 'flex', flexDirection: 'row', alignItems: 'flex-start' }}
            onMouseDown={e => e.stopPropagation()}
            onPointerDown={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setShowDrawTray(v => !v); }}
              style={{
                width: 24, padding: '12px 4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                borderLeft: 'none', borderRadius: '0 8px 8px 0', cursor: 'pointer', color: 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', writingMode: 'vertical-rl',
                fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', gap: 6,
                boxShadow: 'var(--shadow)'
              }}
              title="System icon palette"
            >
              {showDrawTray ? '‹' : '›'} Icons
            </button>
            {showDrawTray && (
              <div style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                borderLeft: 'none', borderRadius: '0 8px 8px 0', padding: '10px 8px',
                display: 'flex', flexDirection: 'column', gap: 4, maxHeight: '70vh', overflowY: 'auto',
                boxShadow: 'var(--shadow-lg)', width: 200
              }}>
                {[
                  { group: 'Infrastructure', items: [
                    { label: 'Server / VM', icon: Server, color: '#ef4444', type: 'Server' },
                    { label: 'Database', icon: Database, color: '#10b981', type: 'Database' },
                    { label: 'Cloud', icon: Cloud, color: '#0ea5e9', type: 'Cloud' },
                    { label: 'CPU / Compute', icon: Cpu, color: '#8b5cf6', type: 'Cpu' },
                    { label: 'Storage / Disk', icon: HardDrive, color: '#64748b', type: 'HardDrive' },
                    { label: 'Container / Pod', icon: Package, color: '#06b6d4', type: 'Package' },
                    { label: 'Microservice', icon: Box, color: '#3b82f6', type: 'Box' },
                  ]},
                  { group: 'Network & Security', items: [
                    { label: 'Internet / Globe', icon: Globe, color: '#0ea5e9', type: 'Globe' },
                    { label: 'Firewall / Shield', icon: Shield, color: '#22c55e', type: 'Shield' },
                    { label: 'Lock / Auth', icon: Lock, color: '#f59e0b', type: 'Lock' },
                    { label: 'Network Switch', icon: Network, color: '#a855f7', type: 'Network' },
                    { label: 'WiFi', icon: Wifi, color: '#06b6d4', type: 'Wifi' },
                    { label: 'Radio Tower', icon: RadioTower, color: '#ec4899', type: 'RadioTower' },
                  ]},
                  { group: 'Applications', items: [
                    { label: 'Browser / Desktop', icon: Monitor, color: '#3b82f6', type: 'Monitor' },
                    { label: 'Mobile App', icon: Smartphone, color: '#8b5cf6', type: 'Smartphone' },
                    { label: 'Terminal / CLI', icon: Terminal, color: '#10b981', type: 'Terminal' },
                    { label: 'Code / IDE', icon: Code, color: '#f59e0b', type: 'Code' },
                    { label: 'API', icon: Webhook, color: '#ec4899', type: 'Webhook' },
                    { label: 'File / Doc', icon: FileText, color: '#64748b', type: 'FileText' },
                  ]},
                  { group: 'Middleware', items: [
                    { label: 'Message Queue', icon: MessageSquare, color: '#f59e0b', type: 'MessageSquare' },
                    { label: 'Kafka / Stream', icon: RadioTower, color: '#a855f7', type: 'RadioTower' },
                    { label: 'Load Balancer', icon: Scale, color: '#0ea5e9', type: 'Scale' },
                    { label: 'API Gateway', icon: Layers, color: '#f97316', type: 'Layers' },
                    { label: 'Cache / Redis', icon: Zap, color: '#22c55e', type: 'Zap' },
                    { label: 'Search Engine', icon: Search, color: '#6366f1', type: 'Search' },
                  ]},
                  { group: 'People', items: [
                    { label: 'User / Actor', icon: User, color: '#eab308', type: 'User' },
                    { label: 'Team / Group', icon: Users, color: '#3b82f6', type: 'Users' },
                    { label: 'Organization', icon: Building, color: '#8b5cf6', type: 'Building' },
                    { label: 'External System', icon: Building2, color: '#64748b', type: 'Building2' },
                  ]},
                ].map(({ group, items }) => (
                  <div key={group}>
                    <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '6px 4px 3px' }}>{group}</div>
                    {items.map(({ label, icon: Ic, color, type }) => {
                      const onDragStart = (e) => {
                        e.dataTransfer.setData('application/reactflow', JSON.stringify({ label, icon: type, color, shape: undefined, isContainer: false, isEip: false, textAlign: 'center', verticalAlign: 'middle' }));
                        e.dataTransfer.effectAllowed = 'move';
                      };
                      return (
                        <div key={label} draggable onDragStart={onDragStart} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '4px 6px', borderRadius: 6, cursor: 'grab', fontSize: '0.78rem', color: 'var(--text-secondary)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <Ic size={15} style={{ color, flexShrink: 0 }} />
                          {label}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CAD collapsed tab — visible when editor is collapsed */}
        {workspace === 'cad' && showCadEditor && editorMode === 'collapsed' && (
          <div
            className="cad-collapsed-tab"
            title="Expand editor"
            onClick={() => setEditorMode('docked')}
          >
            <span style={{ writingMode: 'vertical-rl', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--accent-blue)', textTransform: 'uppercase' }}>Editor</span>
            <ChevronRight size={14} style={{ color: 'var(--accent-blue)' }} />
          </div>
        )}

        {workspace === 'cad' && showCadEditor && editorMode !== 'collapsed' && (
          <div
            className={`cad-editor-pane${editorMode === 'float' ? ' cad-editor-float' : ''}`}
            style={editorMode === 'float'
              ? { position: 'absolute', left: floatPos.x, top: floatPos.y, width: Math.min(splitWidth, 520), height: '600px', maxHeight: 'calc(100% - 100px)', opacity: editorOpacity / 100, zIndex: 200, borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', overflow: 'hidden' }
              : { width: splitWidth }
            }
            ref={editorMode === 'float' ? (el) => {
              if (!el) return;
              // drag-to-move for float mode
              const onDown = (e) => {
                if (e.target.closest('button,select,textarea,.monaco-editor,.cad-emoji-picker')) return;
                const startX = e.clientX - floatPos.x;
                const startY = e.clientY - floatPos.y;
                const onMove = (ev) => setFloatPos({ x: ev.clientX - startX, y: ev.clientY - startY });
                const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
                window.addEventListener('mousemove', onMove);
                window.addEventListener('mouseup', onUp);
              };
              el.addEventListener('mousedown', onDown);
              floatDragRef.current = () => el.removeEventListener('mousedown', onDown);
            } : null}
          >
            <div className="cad-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="cad-logo-mark">
                  <MSLogo size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, lineHeight: 1 }}>Code&nbsp;as&nbsp;Diagram</h3>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>Mermaid · live preview</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Editor mode controls */}
                <div style={{ display: 'flex', gap: '2px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '2px' }}>
                  <button
                    className={`btn btn-icon-only${editorMode === 'docked' ? ' btn-primary' : ''}`}
                    title="Docked (split view)"
                    style={{ padding: '3px 6px' }}
                    onClick={() => setEditorMode('docked')}
                  ><Columns size={13} /></button>
                  <button
                    className={`btn btn-icon-only${editorMode === 'float' ? ' btn-primary' : ''}`}
                    title="Float editor over diagram"
                    style={{ padding: '3px 6px' }}
                    onClick={() => setEditorMode(m => m === 'float' ? 'docked' : 'float')}
                  ><PanelTopOpen size={13} /></button>
                  <button
                    className="btn btn-icon-only"
                    title="Collapse editor"
                    style={{ padding: '3px 6px' }}
                    onClick={() => setEditorMode('collapsed')}
                  ><PanelLeftClose size={13} /></button>
                </div>
                {/* Opacity slider — only in float mode */}
                {editorMode === 'float' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Opacity</span>
                    <input
                      type="range" min={20} max={100} step={5}
                      value={editorOpacity}
                      onChange={e => setEditorOpacity(Number(e.target.value))}
                      style={{ width: '72px', cursor: 'pointer', accentColor: 'var(--accent-blue)' }}
                      title={`Editor opacity: ${editorOpacity}%`}
                    />
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', minWidth: '26px' }}>{editorOpacity}%</span>
                  </div>
                )}
                {/^flowchart\b/m.test(cadCode) && (
                  <div style={{ display: 'flex', gap: '2px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '2px' }}>
                    <button
                      className={`btn btn-icon-only${/^flowchart\s+(LR|RL)/m.test(cadCode) ? ' btn-primary' : ''}`}
                      title="Left → Right layout"
                      style={{ padding: '3px 8px', fontSize: '0.68rem', fontWeight: 700 }}
                      onClick={() => { cadSourceRef.current = 'code'; setCadCode(c => c.replace(/^(flowchart\s+)(LR|TD|TB|RL|BT)/m, '$1LR')); }}
                    >LR</button>
                    <button
                      className={`btn btn-icon-only${/^flowchart\s+(TD|TB)/m.test(cadCode) ? ' btn-primary' : ''}`}
                      title="Top → Down layout"
                      style={{ padding: '3px 8px', fontSize: '0.68rem', fontWeight: 700 }}
                      onClick={() => { cadSourceRef.current = 'code'; setCadCode(c => c.replace(/^(flowchart\s+)(LR|TD|TB|RL|BT)/m, '$1TD')); }}
                    >TD</button>
                  </div>
                )}
                {/^stateDiagram/m.test(cadCode) && (
                  <div style={{ display: 'flex', gap: '2px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '2px' }}>
                    <button
                      className={`btn btn-icon-only${/^\s*direction\s+LR\s*$/m.test(cadCode) ? ' btn-primary' : ''}`}
                      title="Left → Right layout"
                      style={{ padding: '3px 8px', fontSize: '0.68rem', fontWeight: 700 }}
                      onClick={() => {
                        cadSourceRef.current = 'code';
                        setCadCode(c => {
                          if (/^\s*direction\s+(LR|TD|TB)\s*$/m.test(c))
                            return c.replace(/^(\s*direction\s+)(LR|TD|TB)(\s*)$/m, '$1LR$3');
                          return c.replace(/^(stateDiagram[^\n]*\n)/, '$1  direction LR\n');
                        });
                      }}
                    >LR</button>
                    <button
                      className={`btn btn-icon-only${!/^\s*direction\s+LR\s*$/m.test(cadCode) ? ' btn-primary' : ''}`}
                      title="Top → Down layout"
                      style={{ padding: '3px 8px', fontSize: '0.68rem', fontWeight: 700 }}
                      onClick={() => {
                        cadSourceRef.current = 'code';
                        setCadCode(c => c.replace(/^\s*direction\s+(LR|TD|TB)\s*\n?/m, ''));
                      }}
                    >TD</button>
                  </div>
                )}
                <select
                  title="Mermaid theme"
                  value={(() => {
                    const initBlock = cadCode.match(/%%\{init[^%]*%%/s)?.[0] || '';
                    if (!initBlock) return '';
                    const theme = initBlock.match(/['"]theme['"]:\s*['"](\w+)['"]/)?.[1] || '';
                    if (theme && theme !== 'base') return theme;
                    // custom 'base' themes — detect by their unique primaryColor
                    const pc = (initBlock.match(/['"]primaryColor['"]:\s*['"]([^'"]+)['"]/)?.[1] || '').toLowerCase();
                    return ({
                      '#1e3a5f':'ocean','#0f0f23':'midnight','#064e3b':'emerald',
                      '#2e1065':'amethyst','#4c0519':'rose','#431407':'sunrise',
                      '#1e293b':'slate','#1a1a1a':'mono','#dbeafe':'corporate',
                      '#0d001a':'cyberpunk','#001a0d':'neon',
                    })[pc] || (theme || '');
                  })()}
                  onChange={(e) => {
                    const key = e.target.value;
                    const THEME_DIRECTIVES = {
                      default:    `%%{init: {'theme': 'default'}}%%`,
                      dark:       `%%{init: {'theme': 'dark'}}%%`,
                      forest:     `%%{init: {'theme': 'forest'}}%%`,
                      base:       `%%{init: {'theme': 'base'}}%%`,
                      neutral:    `%%{init: {'theme': 'neutral'}}%%`,
                      ocean:      `%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#1e3a5f', 'primaryTextColor': '#93c5fd', 'primaryBorderColor': '#2563eb', 'secondaryColor': '#1e293b', 'tertiaryColor': '#0f172a', 'background': '#0a1628', 'lineColor': '#3b82f6', 'edgeLabelBackground': '#1e3a5f', 'clusterBkg': '#0f1f3d'}}}%%`,
                      midnight:   `%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#0f0f23', 'primaryTextColor': '#a5b4fc', 'primaryBorderColor': '#4f46e5', 'secondaryColor': '#1e1b4b', 'tertiaryColor': '#070714', 'background': '#020209', 'lineColor': '#6366f1', 'edgeLabelBackground': '#0f0f23', 'clusterBkg': '#0a0a1a'}}}%%`,
                      emerald:    `%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#064e3b', 'primaryTextColor': '#6ee7b7', 'primaryBorderColor': '#059669', 'secondaryColor': '#065f46', 'tertiaryColor': '#022c22', 'background': '#011c16', 'lineColor': '#10b981', 'edgeLabelBackground': '#064e3b', 'clusterBkg': '#052e20'}}}%%`,
                      amethyst:   `%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#2e1065', 'primaryTextColor': '#d8b4fe', 'primaryBorderColor': '#7c3aed', 'secondaryColor': '#3b0764', 'tertiaryColor': '#1a0535', 'background': '#0d0117', 'lineColor': '#8b5cf6', 'edgeLabelBackground': '#2e1065', 'clusterBkg': '#1e0940'}}}%%`,
                      rose:       `%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#4c0519', 'primaryTextColor': '#fda4af', 'primaryBorderColor': '#be123c', 'secondaryColor': '#881337', 'tertiaryColor': '#1c0a0e', 'background': '#0f0608', 'lineColor': '#f43f5e', 'edgeLabelBackground': '#4c0519', 'clusterBkg': '#2d0510'}}}%%`,
                      sunrise:    `%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#431407', 'primaryTextColor': '#fed7aa', 'primaryBorderColor': '#c2410c', 'secondaryColor': '#7c2d12', 'tertiaryColor': '#1c0a03', 'background': '#0e0603', 'lineColor': '#f97316', 'edgeLabelBackground': '#431407', 'clusterBkg': '#2c0e05'}}}%%`,
                      slate:      `%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#1e293b', 'primaryTextColor': '#e2e8f0', 'primaryBorderColor': '#475569', 'secondaryColor': '#334155', 'tertiaryColor': '#0f172a', 'background': '#020617', 'lineColor': '#64748b', 'edgeLabelBackground': '#1e293b', 'clusterBkg': '#0f1729'}}}%%`,
                      mono:       `%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#1a1a1a', 'primaryTextColor': '#e5e5e5', 'primaryBorderColor': '#525252', 'secondaryColor': '#262626', 'tertiaryColor': '#0a0a0a', 'background': '#000000', 'lineColor': '#737373', 'edgeLabelBackground': '#1a1a1a', 'clusterBkg': '#111111'}}}%%`,
                      cyberpunk:  `%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#0d001a', 'primaryTextColor': '#ff00ff', 'primaryBorderColor': '#ff00ff', 'secondaryColor': '#00001a', 'tertiaryColor': '#001a00', 'background': '#000000', 'lineColor': '#00ffff', 'edgeLabelBackground': '#0d001a', 'clusterBkg': '#0a000d', 'titleColor': '#ffff00', 'nodeTextColor': '#ff00ff', 'edgeLabelColor': '#00ffff', 'labelBackground': '#0d001a', 'labelTextColor': '#ff00ff', 'relationColor': '#00ffff', 'relationLabelColor': '#ffff00', 'fillType0': '#0d001a', 'fillType1': '#00001a', 'fillType2': '#001a00', 'fillType3': '#1a000d', 'fillType4': '#00101a', 'fillType5': '#1a0d00', 'fillType6': '#0d0d00', 'fillType7': '#00000d'}}}%%`,
                      neon:       `%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#001a0d', 'primaryTextColor': '#00ff88', 'primaryBorderColor': '#00ff88', 'secondaryColor': '#000d1a', 'tertiaryColor': '#0d0022', 'background': '#000000', 'lineColor': '#7700ff', 'edgeLabelBackground': '#001a0d', 'clusterBkg': '#000d07', 'titleColor': '#00ffff', 'nodeTextColor': '#00ff88', 'edgeLabelColor': '#7700ff', 'labelBackground': '#001a0d', 'labelTextColor': '#00ff88', 'relationColor': '#7700ff', 'relationLabelColor': '#00ffff'}}}%%`,
                      corporate:  `%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#dbeafe', 'primaryTextColor': '#1e3a5f', 'primaryBorderColor': '#2563eb', 'secondaryColor': '#eff6ff', 'tertiaryColor': '#f0f4ff', 'background': '#ffffff', 'lineColor': '#2563eb', 'edgeLabelBackground': '#f8fafc', 'clusterBkg': '#f0f6ff', 'titleColor': '#1e3a5f', 'edgeLabelBackground': '#ffffff', 'nodeTextColor': '#1e3a5f'}}}%%`,
                    };
                    cadSourceRef.current = 'code';
                    setCadCode(prev => {
                      const cleaned = prev.replace(/^%%\{init[^%]*%%\s*\n?/ms, '');
                      return key ? `${THEME_DIRECTIVES[key]}\n${cleaned}` : cleaned;
                    });
                  }}
                  style={{ fontSize: '0.7rem', padding: '3px 6px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: '6px', cursor: 'pointer', outline: 'none', minWidth: '100px' }}
                >
                  <option value="">Theme: auto</option>
                  <optgroup label="Built-in">
                    <option value="default">Default</option>
                    <option value="dark">Dark</option>
                    <option value="forest">Forest</option>
                    <option value="neutral">Neutral</option>
                    <option value="base">Base</option>
                  </optgroup>
                  <optgroup label="Custom Dark">
                    <option value="ocean">🌊 Ocean</option>
                    <option value="midnight">🌙 Midnight</option>
                    <option value="emerald">🌿 Emerald</option>
                    <option value="amethyst">💜 Amethyst</option>
                    <option value="rose">🌹 Rose</option>
                    <option value="sunrise">🌅 Sunrise</option>
                    <option value="slate">🪨 Slate</option>
                    <option value="mono">⬛ Monochrome</option>
                    <option value="cyberpunk">🟣 Cyberpunk</option>
                    <option value="neon">🟢 Neon</option>
                  </optgroup>
                  <optgroup label="Light">
                    <option value="corporate">🏢 Corporate</option>
                  </optgroup>
                </select>
                <button className="btn btn-primary" title="Render Diagram" onClick={() => {
                  cadSourceRef.current = 'code';
                  const current = cadCode;
                  setCadCode('');
                  setTimeout(() => setCadCode(current), 10);
                }} style={{ padding: '4px 10px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <PlayCircle size={13} /> Render
                </button>
                <button className="btn btn-icon-only" title="Templates" onClick={() => setShowTemplateGallery(true)} style={{ padding: '4px' }}>
                  <LayoutGrid size={15} />
                </button>
                <button className="btn btn-icon-only" title="Copy code" onClick={() => { navigator.clipboard?.writeText(cadCode); }} style={{ padding: '4px' }}>
                  <Copy size={15} />
                </button>
                <button
                  className={`btn btn-icon-only${showEmojiPicker ? ' active' : ''}`}
                  title="Insert emoji / icon"
                  onClick={() => setShowEmojiPicker(v => !v)}
                  style={{ padding: '4px', fontSize: '13px', background: showEmojiPicker ? 'var(--accent-blue)' : undefined, color: showEmojiPicker ? '#fff' : undefined }}
                >
                  😀
                </button>
              </div>
            </div>

            {/* Emoji / icon picker panel */}
            {showEmojiPicker && (() => {
              const EMOJI_GROUPS = [
                { label: '👤 People & Roles', icons: ['👤','👥','👑','👔','🧑‍💻','👨‍💼','👩‍💼','🧑‍🔬','🧑‍🏫','🕵️','🧑‍⚕️','🤝','👁️','🧠','🫂'] },
                { label: '🖥️ Infrastructure', icons: ['🖥️','💻','📱','🗄️','🖨️','⌨️','🖱️','📡','📺','🔌','🔋','💾','📀','💿','🧮'] },
                { label: '☁️ Cloud & Network', icons: ['☁️','🌐','🛰️','🔗','🔀','↔️','⬆️','⬇️','⬅️','➡️','🔄','🔁','🌍','🛜','📶'] },
                { label: '🗄️ Data & Storage', icons: ['🗄️','🗃️','📦','📁','📂','🗂️','📋','📊','📈','📉','📇','🗒️','📝','📄','📜'] },
                { label: '✉️ Messaging & Events', icons: ['✉️','📨','📬','📤','📥','💬','📣','🔔','🔕','📢','📡','🗣️','💭','🗨️','📩'] },
                { label: '⚙️ Process & Dev', icons: ['⚙️','🔧','🛠️','🔩','🪛','⚒️','🏗️','🧱','🔨','🪚','🔑','🗝️','🪝','🔐','🧩'] },
                { label: '✅ Status & Decisions', icons: ['✅','❌','⚠️','🚫','❓','❕','💡','🚦','🟢','🟡','🔴','⏸️','▶️','⏹️','🔃'] },
                { label: '🔒 Security', icons: ['🔒','🔓','🛡️','🔐','🔑','🗝️','🪪','🧿','⛔','🚧','🚨','🚔','🕵️','🛂','🔏'] },
                { label: '💰 Finance & Business', icons: ['💰','💳','💵','💹','📊','🏦','🏧','💸','🏆','🎯','📌','📍','🗓️','⏱️','⏰'] },
                { label: '🚀 Deployment & Ops', icons: ['🚀','🛸','🛩️','📦','🏭','🔭','🧪','🧬','⚗️','🔬','🌡️','💊','🩺','🩻','🩹'] },
                { label: '🔢 Symbols & Arrows', icons: ['→','←','↑','↓','↗','↘','↙','↖','↕','↔','⇒','⇐','⇑','⇓','⇔','①','②','③','④','⑤'] },
              ];

              const insertEmoji = (emoji) => {
                const editor = cadEditorRef.current;
                if (!editor) return;
                const selection = editor.getSelection();
                editor.executeEdits('emoji-picker', [{
                  range: selection,
                  text: emoji,
                  forceMoveMarkers: true,
                }]);
                editor.focus();
              };

              return (
                <div style={{
                  position: 'relative', zIndex: 50,
                  background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                  borderTop: 'none', padding: '10px 12px', maxHeight: '260px', overflowY: 'auto',
                }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Click any emoji to insert at cursor · Works in node labels, edge labels, subgraph titles
                  </div>
                  {EMOJI_GROUPS.map(group => (
                    <div key={group.label} style={{ marginBottom: '8px' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>{group.label}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                        {group.icons.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => insertEmoji(emoji)}
                            title={emoji}
                            style={{
                              background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
                              borderRadius: '5px', padding: '3px 5px', fontSize: '15px',
                              cursor: 'pointer', lineHeight: 1, transition: 'background 0.15s',
                              minWidth: '28px', textAlign: 'center',
                            }}
                            onMouseEnter={e => e.target.style.background = 'var(--accent-blue)'}
                            onMouseLeave={e => e.target.style.background = 'var(--bg-tertiary)'}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            <div className="monaco-editor-container" onKeyDown={(e) => e.stopPropagation()}>
              <Editor
                height="100%"
                language="mermaid"
                theme={theme === 'dark' ? 'mermaid-dark' : 'mermaid-light'}
                value={cadCode}
                beforeMount={(monaco) => registerMermaidLanguage(monaco)}
                onMount={(editor, monaco) => { cadEditorRef.current = editor; cadMonacoRef.current = monaco; }}
                onChange={(value) => { cadSourceRef.current = 'code'; setCadCode(value || ''); }}
                options={{
                  minimap: { enabled: true, scale: 1, renderCharacters: false },
                  fontSize: 14,
                  lineHeight: 22,
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 14, bottom: 14 },
                  smoothScrolling: true,
                  cursorBlinking: 'smooth',
                  cursorSmoothCaretAnimation: 'on',
                  renderLineHighlight: 'all',
                  fontLigatures: false,
                  fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Menlo, monospace",
                  bracketPairColorization: { enabled: true },
                  guides: { indentation: true, bracketPairs: true },
                  folding: true,
                  lineNumbersMinChars: 3,
                  scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
                  stickyScroll: { enabled: false },
                  tabSize: 2,
                }}
              />
            </div>
            <div className={`cad-status ${cadStatus.ok ? 'ok' : 'err'}`}>
              <span className="cad-status-dot" />
              {cadStatus.ok
                ? (cadStatus.message || 'Ready')
                : cadStatus.message}
            </div>
            <div className="cad-resizer" onMouseDown={startResizing} />
          </div>
        )}

        {workspace === 'cad' && showTemplateGallery && (
          <div className="cad-gallery-overlay" onClick={() => setShowTemplateGallery(false)}>
            <div className="cad-gallery" onClick={(e) => e.stopPropagation()} style={{ width: 'min(1100px, 95vw)', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>
              <div className="cad-gallery-head">
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Diagram Templates</h2>
                  <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                    Click a template to load it into the editor
                  </p>
                </div>
                <button className="btn btn-icon-only" onClick={() => setShowTemplateGallery(false)}><X size={18} /></button>
              </div>
              <div style={{ display: 'flex', gap: '8px', padding: '12px 22px', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
                {['All', 'Flowchart', 'OrgChart', 'Architecture', 'Sequence', 'C4', 'ER / DB', 'State & Git', 'Analytics', 'Story', 'Other'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCadGalFilter(cat)}
                    style={{
                      padding: '5px 14px', fontSize: '0.75rem', fontWeight: 600, borderRadius: '999px', cursor: 'pointer', border: '1px solid',
                      background: cadGalFilter === cat ? 'var(--accent-blue, #2563eb)' : 'transparent',
                      borderColor: cadGalFilter === cat ? 'var(--accent-blue, #2563eb)' : 'var(--border-color)',
                      color: cadGalFilter === cat ? '#fff' : 'var(--text-secondary)',
                      transition: 'all 0.15s',
                    }}
                  >{cat}</button>
                ))}
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px', alignContent: 'start' }}>
                {cadTemplates.filter(t => {
                  if (cadGalFilter === 'All') return true;
                  if (cadGalFilter === 'Flowchart') return t.type === 'Flowchart';
                  if (cadGalFilter === 'Architecture') return ['Architecture', 'Block'].includes(t.type);
                  if (cadGalFilter === 'Sequence') return t.type === 'Sequence';
                  if (cadGalFilter === 'C4') return t.type === 'C4';
                  if (cadGalFilter === 'ER / DB') return ['ER', 'Class', 'Requirement'].includes(t.type);
                  if (cadGalFilter === 'State & Git') return ['State', 'Git'].includes(t.type);
                  if (cadGalFilter === 'Analytics') return ['Pie', 'XY', 'Radar', 'Quadrant', 'Sankey', 'Gantt', 'Timeline', 'Journey', 'Kanban'].includes(t.type);
                  if (cadGalFilter === 'OrgChart') return t.type === 'OrgChart';
                  if (cadGalFilter === 'Story') return t.type === 'Story';
                  if (cadGalFilter === 'Other') return ['Mindmap', 'Packet'].includes(t.type);
                  return true;
                }).map((t) => {
                  const typeColors = {
                    Flowchart: { bg: 'rgba(37,99,235,0.10)', border: '#2563eb', text: '#3b82f6' },
                    Sequence: { bg: 'rgba(124,58,237,0.10)', border: '#7c3aed', text: '#8b5cf6' },
                    Architecture: { bg: 'rgba(8,145,178,0.10)', border: '#0891b2', text: '#06b6d4' },
                    Block: { bg: 'rgba(8,145,178,0.10)', border: '#0891b2', text: '#06b6d4' },
                    C4: { bg: 'rgba(13,148,136,0.10)', border: '#0d9488', text: '#14b8a6' },
                    Class: { bg: 'rgba(21,128,61,0.10)', border: '#15803d', text: '#16a34a' },
                    ER: { bg: 'rgba(3,105,161,0.10)', border: '#0369a1', text: '#0ea5e9' },
                    Requirement: { bg: 'rgba(220,38,38,0.10)', border: '#dc2626', text: '#ef4444' },
                    State: { bg: 'rgba(180,83,9,0.10)', border: '#b45309', text: '#d97706' },
                    Git: { bg: 'rgba(55,65,81,0.15)', border: '#374151', text: '#9ca3af' },
                    Gantt: { bg: 'rgba(190,24,93,0.10)', border: '#be185d', text: '#ec4899' },
                    Timeline: { bg: 'rgba(190,24,93,0.10)', border: '#be185d', text: '#ec4899' },
                    Sankey: { bg: 'rgba(147,51,234,0.10)', border: '#9333ea', text: '#a855f7' },
                    Pie: { bg: 'rgba(147,51,234,0.10)', border: '#9333ea', text: '#a855f7' },
                    XY: { bg: 'rgba(147,51,234,0.10)', border: '#9333ea', text: '#a855f7' },
                    Radar: { bg: 'rgba(147,51,234,0.10)', border: '#9333ea', text: '#a855f7' },
                    Quadrant: { bg: 'rgba(147,51,234,0.10)', border: '#9333ea', text: '#a855f7' },
                    Journey: { bg: 'rgba(234,88,12,0.10)', border: '#ea580c', text: '#f97316' },
                    Mindmap: { bg: 'rgba(124,58,237,0.10)', border: '#7c3aed', text: '#8b5cf6' },
                    Kanban: { bg: 'rgba(5,150,105,0.10)', border: '#059669', text: '#10b981' },
                    OrgChart: { bg: 'rgba(245,158,11,0.10)', border: '#f59e0b', text: '#fbbf24' },
                    Story: { bg: 'rgba(236,72,153,0.10)', border: '#ec4899', text: '#f472b6' },
                  };
                  const c = typeColors[t.type] || { bg: 'rgba(71,85,105,0.10)', border: '#475569', text: '#94a3b8' };
                  return (
                    <button
                      key={t.name}
                      className="cad-template-card"
                      style={{ borderTop: `3px solid ${c.border}` }}
                      onClick={() => { cadIdRef.current = 0; cadSourceRef.current = 'code'; cadSigRef.current = null; setCadCode(t.code); setShowTemplateGallery(false); }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: c.text, background: c.bg, border: `1px solid ${c.border}30`, borderRadius: '999px', padding: '2px 9px' }}>{t.type}</span>
                      </div>
                      <div className="cad-template-card-name">{t.name}</div>
                      <div className="cad-template-card-desc">{t.description}</div>
                      <pre className="cad-template-card-code">{t.code.split('\n').slice(0, 5).join('\n')}</pre>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div ref={cadCanvasRef} data-cad={workspace === 'cad' ? 'true' : undefined} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div ref={cadPreviewRef} style={{ flex: 1, position: 'relative', isolation: 'isolate', overflow: 'hidden' }}>

        <ReactFlow
          className={workspace === 'draw' && activeTool === 'hand' ? 'draw-hand-mode' : ''}
          nodes={reactFlowNodes}
          proOptions={{ hideAttribution: true }}
          edges={reactFlowEdges}
          onNodesChange={handleNodesChange} // This will only affect non-CAD nodes
          onEdgesChange={onEdgesChange}    // This will only affect non-CAD edges
          onConnect={onConnect}
          onInit={(inst) => { setReactFlowInstance(inst); reactFlowInstanceRef.current = inst; }}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeContextMenu={onNodeContextMenu}
          onPaneMouseDown={(e) => {
            if (workspace !== 'draw') return;
            if (isDrawingMode) handleDrawingStart(e);
            else handlePaneMouseDown(e);
          }}
          onPaneClick={() => { setContextMenu(null); setShowJson(false); }}
          onMoveEnd={onMoveEnd}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          panOnDrag={!isDrawingMode && interactionMode === 'pan'}
          selectionOnDrag={workspace === 'cad' ? false : (!isDrawingMode && interactionMode === 'move')}
          nodesDraggable={workspace === 'cad' ? true : (!isDrawingMode && (activeTool === 'select' || workspace !== 'draw'))}
          nodesConnectable={workspace === 'cad' ? false : (!isDrawingMode && (workspace !== 'draw' || activeTool === 'select'))}
          elementsSelectable={workspace === 'cad' ? true : (!isDrawingMode && (workspace !== 'draw' || activeTool === 'select'))}
          panOnScroll={false}
          panActivationKeyCode={null}
          zoomOnScroll={!isDrawingMode}
          minZoom={workspace === 'cad' ? 0.05 : 0.05}
          maxZoom={workspace === 'cad' ? 4 : 4}
          defaultViewport={initialViewport}
          colorMode={theme}
          style={undefined}
          defaultEdgeOptions={defaultEdgeOptions}
          deleteKeyCode={['Backspace', 'Delete']}
          >
          {bgVariant === 'dots' && <Background color={theme === 'dark' ? '#fff' : '#000'} gap={16} size={1} opacity={theme === 'dark' ? 0.1 : 0.05} variant="dots" />}

          <Controls>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '24px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)', userSelect: 'none' }}>
              {Math.round(zoom * 100)}%
            </div>
          </Controls>
          {workspace !== 'cad' && (
            <Panel position="bottom-left" style={{ margin: '0 0 8px 8px' }}>
              <div className="toolbar" style={{ flexDirection: 'column', gap: '2px', padding: '4px', borderRadius: '8px', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow)' }}>
                <button className="btn btn-icon-only" onClick={resetZoom} title="Reset to 100%">
                  <Target size={15} />
                </button>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'center', padding: '2px 0', minWidth: '32px' }}>
                  {Math.round(zoom * 100)}%
                </div>
              </div>
            </Panel>
          )}

          {/* Drawing overlay — inside ReactFlow so Panel toolbars (z:1000) sit above it (z:5) */}
          {/* Hand tool bypasses the overlay so ReactFlow can pan natively */}
          {workspace === 'draw' && activeTool !== 'select' && activeTool !== 'hand' && (
            <div
              className="drawing-interaction-layer"
              onPointerDown={(e) => {
                e.preventDefault();
                if (activeTool === 'eraser') {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  eraseAtPoint(e.clientX, e.clientY);
                  return;
                }
                if (isDrawingMode) handleDrawingStart(e);
                else handlePaneMouseDown(e);
              }}
              onPointerMove={(e) => {
                if (activeTool === 'eraser' && e.buttons === 1) {
                  eraseAtPoint(e.clientX, e.clientY);
                }
              }}
              onWheel={(e) => {
                if (!reactFlowInstance) return;
                const { x, y, zoom } = reactFlowInstance.getViewport();
                const delta = e.deltaY > 0 ? 0.9 : 1.1;
                const newZoom = Math.max(0.05, Math.min(4, zoom * delta));
                const rect = e.currentTarget.getBoundingClientRect();
                const cx = e.clientX - rect.left;
                const cy = e.clientY - rect.top;
                const newX = cx - (cx - x) * (newZoom / zoom);
                const newY = cy - (cy - y) * (newZoom / zoom);
                reactFlowInstance.setViewport({ x: newX, y: newY, zoom: newZoom });
              }}
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                zIndex: 5,
                cursor: activeTool === 'eraser' ? 'cell' : 'crosshair',
                touchAction: 'none'
              }}
            >
              {isDrawingMode && currentPath.length > 1 && (
                <svg style={{ width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}>
                  <path
                    d={buildSmoothSvgPath(currentPath)}
                    fill="none"
                    stroke={drawingColor || '#3b82f6'}
                    strokeWidth={drawingStrokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={drawStrokeStyle === 'dashed' ? `${drawingStrokeWidth * 3},${drawingStrokeWidth * 2}` : drawStrokeStyle === 'dotted' ? `${drawingStrokeWidth},${drawingStrokeWidth * 2}` : 'none'}
                  />
                </svg>
              )}
            </div>
          )}

          {/* placeholder — MermaidPreview moved outside ReactFlow to avoid overflow:hidden clipping */}

          {/* Main Drawing Tools Toolbar Removed from here */}

           <Panel position="top-left" className="ms-topbar ms-topbar-left" style={{ display: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', backdropFilter: 'blur(8px)' }}>
              <div onClick={onGoHome} style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRight: '1px solid var(--border-color)', paddingRight: '12px', marginRight: '4px', cursor: 'pointer' }} title="Go to home page">
                <MSLogo size={26} />
                <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>Model Studio</span>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {['cad', 'diagram', 'draw', 'eip', 'ddd'].map((ws) => (
                  <button
                    key={ws}
                    onClick={() => {
                        setWorkspace(ws);
                        setActiveTool('select');
                        setIsDrawingMode(false);
                        setInteractionMode('move');
                        if (ws === 'draw') setBgVariant('dots');
                        if (ws === 'cad') {
                          setShowCadEditor(true);
                          // Dispatch event so MermaidPreview retries fit until container has dimensions
                          const delays = [80, 200, 400, 800];
                          [100, 300, 600].forEach(d => setTimeout(() => reactFlowInstance?.fitView({ padding: 0.05, duration: 300 }), d));
                        } else {
                          setTimeout(() => reactFlowInstance?.fitView({ padding: 0.15, duration: 600 }), 80);
                        }
                    }}
                    className={`btn ${workspace === ws ? 'btn-primary' : ''}`}
                    style={{
                      fontSize: '0.75rem',
                      padding: '4px 10px',
                      textTransform: 'none',
                      background: workspace === ws ? undefined : 'transparent',
                      border: workspace === ws ? undefined : 'none'
                    }}
                  >
                    {ws === 'ddd' ? 'Domain Driven Design' : (ws === 'eip' ? 'Camel' : (ws === 'diagram' ? 'Diagrams' : (ws === 'cad' ? 'Code as Diagram' : 'Draw')))}
                  </button>
                ))}
              </div>
            </div>
          </Panel>

          <Panel position="top-right" className="ms-topbar ms-topbar-right" style={{ display: 'none' }}>
            <div className="toolbar" style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'flex-end' }}>
              
              {/* Draw Tools Section */}
              {workspace === 'draw' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: 'var(--bg-tertiary)', padding: '6px 10px', borderRadius: '12px', border: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
                  {/* Undo / Redo */}
                  <button className="btn btn-icon-only" onClick={undoDraw} title="Undo (Ctrl+Z)" style={{ opacity: drawHistoryRef.current.length > 1 && drawHistoryIndexRef.current > 0 ? 1 : 0.35 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/></svg>
                  </button>
                  <button className="btn btn-icon-only" onClick={redoDraw} title="Redo (Ctrl+Shift+Z)" style={{ opacity: drawHistoryIndexRef.current < drawHistoryRef.current.length - 1 ? 1 : 0.35 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 019-9 9 9 0 016 2.3L21 13"/></svg>
                  </button>
                  <div style={{ width: '1px', height: '16px', background: 'var(--border-color)', margin: '0 4px' }}></div>

                  {/* Tools */}
                  <button className={`btn btn-icon-only ${activeTool === 'select' && !isDrawingMode ? 'btn-primary' : ''}`} onClick={() => { setActiveTool('select'); setIsDrawingMode(false); setInteractionMode('move'); }} title="Select / Move (V · 1)"><MousePointer2 size={16} /></button>
                  <div style={{ width: '1px', height: '16px', background: 'var(--border-color)', margin: '0 4px' }}></div>
                  <button className={`btn btn-icon-only ${activeTool === 'rectangle' ? 'btn-primary' : ''}`} onClick={() => { setActiveTool('rectangle'); setIsDrawingMode(false); }} title="Rectangle (R · 2)"><Square size={16} /></button>
                  <button className={`btn btn-icon-only ${activeTool === 'circle' ? 'btn-primary' : ''}`} onClick={() => { setActiveTool('circle'); setIsDrawingMode(false); }} title="Circle (O · 4)"><CircleIcon size={16} /></button>
                  <button className={`btn btn-icon-only ${activeTool === 'diamond' ? 'btn-primary' : ''}`} onClick={() => { setActiveTool('diamond'); setIsDrawingMode(false); }} title="Diamond (D · 3)"><Diamond size={16} /></button>
                  <button className={`btn btn-icon-only ${activeTool === 'triangle' ? 'btn-primary' : ''}`} onClick={() => { setActiveTool('triangle'); setIsDrawingMode(false); }} title="Triangle (0)"><Triangle size={16} /></button>
                  <button className={`btn btn-icon-only ${activeTool === 'cloud' ? 'btn-primary' : ''}`} onClick={() => { setActiveTool('cloud'); setIsDrawingMode(false); }} title="Cloud (C)"><Cloud size={16} /></button>
                  <button className={`btn btn-icon-only ${activeTool === 'arrow' ? 'btn-primary' : ''}`} onClick={() => { setActiveTool('arrow'); setIsDrawingMode(false); }} title="Arrow (A · 5)"><ArrowUpRight size={16} /></button>
                  <button className={`btn btn-icon-only ${activeTool === 'line' ? 'btn-primary' : ''}`} onClick={() => { setActiveTool('line'); setIsDrawingMode(false); }} title="Line (L · 6)"><Minus size={16} /></button>
                  <button className={`btn btn-icon-only ${activeTool === 'text' ? 'btn-primary' : ''}`} onClick={() => { setActiveTool('text'); setIsDrawingMode(false); }} title="Text (8)"><Type size={16} /></button>
                  <button className={`btn btn-icon-only ${isDrawingMode ? 'btn-primary' : ''}`} onClick={() => { setActiveTool('pencil'); setIsDrawingMode(true); }} title="Pencil / Freehand (P · 7)"><Pencil size={16} /></button>
                  <button className={`btn btn-icon-only ${activeTool === 'eraser' ? 'btn-primary' : ''}`} onClick={() => { setActiveTool('eraser'); setIsDrawingMode(false); }} title="Eraser (E)"><Eraser size={16} /></button>
                  <button className="btn btn-icon-only" onClick={() => { addCanvasWidget('note'); setActiveTool('select'); setIsDrawingMode(false); }} title="Sticky Note (N)" style={{ color: '#ca8a04' }}><StickyNote size={16} /></button>
                  <div style={{ width: '1px', height: '16px', background: 'var(--border-color)', margin: '0 4px' }}></div>

                  {/* Hand-drawn & Tool lock */}
                  <button className={`btn btn-icon-only ${isRoughGlobal ? 'btn-primary' : ''}`} onClick={() => setIsRoughGlobal(!isRoughGlobal)} title="Hand-drawn Style"><Paintbrush size={16} /></button>
                  <button
                    className={`btn btn-icon-only ${drawToolLock ? 'btn-primary' : ''}`}
                    onClick={() => setDrawToolLock(v => !v)}
                    title={drawToolLock ? 'Tool locked (click to unlock — auto-return to Select after each draw)' : 'Tool unlocked (click to lock — keep current tool after draw)'}
                    style={{ fontSize: '0.65rem', fontWeight: 700 }}
                  >
                    {drawToolLock ? <Lock size={16} /> : <Lock size={16} style={{ opacity: 0.4 }} />}
                  </button>
                </div>
              )}

              {/* Templates & General Widgets Section */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', backdropFilter: 'blur(8px)' }}>
                {/* Interaction mode & canvas toggle */}
                {workspace !== 'draw' && (
                  <>
                    <button className={`btn btn-icon-only ${interactionMode === 'move' ? 'btn-primary' : ''}`} onClick={() => setInteractionMode('move')} title="Select & Move (V)">
                      <MousePointer2 size={16} />
                    </button>
                    <button className={`btn btn-icon-only ${interactionMode === 'pan' ? 'btn-primary' : ''}`} onClick={() => setInteractionMode('pan')} title="Pan Canvas (H)">
                      <Hand size={16} />
                    </button>
                    {workspace !== 'cad' && (
                      <>
                        <button className="btn btn-icon-only" onClick={() => autoLayout('LR')} title="Auto Layout Left→Right"><ArrowRightLeft size={16} /></button>
                        <button className="btn btn-icon-only" onClick={() => autoLayout('TB')} title="Auto Layout Top→Bottom"><ArrowDownUp size={16} /></button>
                      </>
                    )}
                    <div style={{ width: '1px', height: '16px', background: 'var(--border-color)', margin: '0 4px' }}></div>
                  </>
                )}
                {workspace !== 'draw' && (
                  <button className="btn" onClick={() => (workspace === 'cad' ? setShowTemplateGallery(true) : setShowTemplatesModal(true))} style={{ fontSize: '0.8rem', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid var(--accent-blue)', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa' }}>
                    <Layers size={14} /> Templates
                  </button>
                )}

                {workspace !== 'draw' && (
                  <>
                    <div style={{ width: '1px', height: '16px', background: 'var(--border-color)', margin: '0 4px' }}></div>
                    {workspace !== 'eip' && (
                      <button className="btn btn-icon-only" onClick={() => addCanvasWidget('text')} style={{ border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }} title="Insert Title / Text Header">
                        <Type size={16} />
                      </button>
                    )}
                    <button className="btn btn-icon-only" onClick={() => addCanvasWidget('note')} style={{ border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: '#ca8a04' }} title="Insert Sticky Note">
                      <StickyNote size={16} />
                    </button>
                  </>
                )}
                
                <div style={{ width: '1px', height: '16px', background: 'var(--border-color)', margin: '0 4px' }}></div>
                
                {workspace !== 'cad' && (
                  <button className="btn btn-icon-only" onClick={() => setShowJson(!showJson)} title="View Model Source (JSON/YAML)">
                    <Code size={16} />
                  </button>
                )}
                <button className="btn btn-icon-only" title="Share (copy link)" onClick={() => {
                  try {
                    const n = workspace === 'draw' ? drawNodes : workspace === 'diagram' ? diagramNodes : workspace === 'ddd' ? dddNodes : workspace === 'eip' ? eipNodes : cadNodes;
                    const e = workspace === 'draw' ? drawEdges : workspace === 'diagram' ? diagramEdges : workspace === 'ddd' ? dddEdges : workspace === 'eip' ? eipEdges : cadEdges;
                    const payload = btoa(JSON.stringify({ nodes: n, edges: e }));
                    const url = `${window.location.origin}${window.location.pathname}#${workspace}=${payload}`;
                    navigator.clipboard.writeText(url).then(() => alert('Share link copied to clipboard!')).catch(() => prompt('Copy this share link:', url));
                  } catch { alert('Canvas too large to share via URL.'); }
                }}>
                  <Share2 size={16} />
                </button>
                <button className="btn btn-icon-only" onClick={clearCanvas} title="Clear Everything (Reset Canvas)">
                  <Eraser size={16} color="#ef4444" />
                </button>
                
                <div style={{ width: '1px', height: '16px', background: 'var(--border-color)', margin: '0 4px' }}></div>
                <ThemeToggle />
                <div style={{ width: '1px', height: '16px', background: 'var(--border-color)', margin: '0 4px' }}></div>

                <button className="btn btn-icon-only" onClick={() => setShowTextEditor(true)} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: theme === 'dark' ? '#fff' : 'var(--text-primary)' }} title="Import diagram from JSON/YAML text">
                  <FilePlus size={16} />
                </button>
                <div style={{ width: '1px', height: '16px', background: 'var(--border-color)', margin: '0 4px' }}></div>
                <button className="btn" onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '4px 8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} title="Load JSON/YAML diagram from disk">
                  <Upload size={14} /> Import
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImportFile}
                  accept={workspace === 'cad' ? '.mmd,.mermaid,text/plain' : '.json,.yaml,.yml'}
                  style={{ display: 'none' }}
                />
                <input 
                  type="file" 
                  ref={imageInputRef} 
                  onChange={handleImageImport} 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                />
                
                <div style={{ position: 'relative' }}>
                  <button className="btn btn-primary" onClick={() => setShowExportDropdown(!showExportDropdown)} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px 12px' }}>
                    <Download size={14} /> Export
                  </button>
                  {showExportDropdown && (
                    <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', zIndex: 1000, width: '240px', padding: '6px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {workspace === 'cad' ? (
                        <button className="btn" onClick={() => {
                          const a = document.createElement('a');
                          a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(cadCode);
                          a.download = `${getSanitizedBaseName()}.mmd`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          setShowExportDropdown(false);
                        }} style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left', width: '100%', border: 'none', padding: '8px 12px', background: 'transparent', color: '#60a5fa', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}>
                          <Code size={14} /> Export Mermaid Code (.mmd)
                        </button>
                      ) : (
                        <>
                          <button className="btn" onClick={() => { exportLayout('json'); setShowExportDropdown(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left', width: '100%', border: 'none', padding: '8px 12px', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.8rem', cursor: 'pointer' }}>
                            <FileJson size={14} /> Export Layout (JSON)
                          </button>
                          <button className="btn" onClick={() => { exportLayout('yaml'); setShowExportDropdown(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left', width: '100%', border: 'none', padding: '8px 12px', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.8rem', cursor: 'pointer' }}>
                            <FileText size={14} /> Export Layout (YAML)
                          </button>
                        </>
                      )}
                      {workspace === 'eip' && (
                        <button className="btn" onClick={() => { exportCamelRoute(); setShowExportDropdown(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left', width: '100%', border: 'none', padding: '8px 12px', background: 'transparent', color: '#f59e0b', fontSize: '0.8rem', cursor: 'pointer' }}>
                          <Workflow size={14} /> Export Camel Route (YAML)
                        </button>
                      )}
                      <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }}></div>
                      <button className="btn" onClick={() => { exportAsPng({ transparent: false }); setShowExportDropdown(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left', width: '100%', border: 'none', padding: '8px 12px', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.8rem', cursor: 'pointer' }}>
                        <Image size={14} /> Export PNG (with bg)
                      </button>
                      <button className="btn" onClick={() => { exportAsPng({ transparent: true }); setShowExportDropdown(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left', width: '100%', border: 'none', padding: '8px 12px', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.8rem', cursor: 'pointer' }}>
                        <Image size={14} /> Export PNG (transparent)
                      </button>
                      <button className="btn" onClick={() => { exportAsSvg({ transparent: false }); setShowExportDropdown(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left', width: '100%', border: 'none', padding: '8px 12px', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.8rem', cursor: 'pointer' }}>
                        <FileText size={14} /> Export SVG (with bg)
                      </button>
                      <button className="btn" onClick={() => { exportAsSvg({ transparent: true }); setShowExportDropdown(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left', width: '100%', border: 'none', padding: '8px 12px', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.8rem', cursor: 'pointer' }}>
                        <FileText size={14} /> Export SVG (transparent)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Panel>
      {showJson && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001, backdropFilter: 'blur(5px)' }}>
          <div style={{ background: 'var(--bg-secondary)', width: '900px', height: '80vh', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Code size={20} color="#3b82f6" /> {workspace === 'eip' ? 'Camel Route YAML' : 'Model Definition (JSON/YAML)'}
              </h3>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {workspace !== 'eip' && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    <input type="checkbox" checked={jsonIncludeNotes} onChange={(e) => setJsonIncludeNotes(e.target.checked)} />
                    Include sticky notes
                  </label>
                )}
                <button className="btn btn-icon-only" onClick={() => setShowJson(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}>
                  <X size={20} />
                </button>
              </div>
            </div>
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#0a0a0a' }}>
              <pre style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, margin: 0, padding: '24px', overflow: 'auto', color: '#a78bfa', fontFamily: '"Fira Code", monospace', fontSize: '0.85rem', lineHeight: '1.6' }}>
                {workspace === 'eip' ? generateYaml() : JSON.stringify({ nodes: jsonIncludeNotes ? nodes : nodes.filter(n => n.data?.shape !== 'note'), edges }, null, 2)}
              </pre>
            </div>
            <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'rgba(255,255,255,0.02)' }}>
              <button className="btn" onClick={() => {
                const exportNodes = jsonIncludeNotes ? nodes : nodes.filter(n => n.data?.shape !== 'note');
                const content = workspace === 'eip' ? generateYaml() : JSON.stringify({ nodes: exportNodes, edges }, null, 2);
                const a = document.createElement('a');
                a.href = `data:text/plain;charset=utf-8,` + encodeURIComponent(content);
                a.download = `${getSanitizedBaseName()}-source.${workspace === 'eip' ? 'yaml' : 'json'}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              }} style={{ border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                <Download size={16} /> Download Source
              </button>
              <button className="btn btn-primary" onClick={() => setShowJson(false)} style={{ background: '#3b82f6', color: 'var(--text-primary)' }}>
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
          {activeEdge && !activeNode && (
            <Panel position="top-right" style={{ top: '80px', right: '20px' }}>
              <div className="json-viewer-overlay" style={{ width: '280px', padding: '20px', margin: 0, maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
                <div className="json-viewer-header" style={{ marginBottom: '16px' }}>
                  <span>Edit Connector</span>
                  <button onClick={() => setSelectedEdgeId(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>&times;</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Label</label>
                    <input 
                      value={activeEdge.label || ''} 
                      onChange={(e) => updateEdgeData('label', e.target.value)} 
                      style={{ width: '100%', padding: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '0.9rem', outline: 'none' }}
                      placeholder="Optional edge label"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Color</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="color" 
                        value={activeEdge.style?.stroke || '#94a3b8'} 
                        onChange={(e) => updateEdgeData('stroke', e.target.value)}
                        style={{ width: '36px', height: '36px', padding: '0', border: 'none', borderRadius: '4px', cursor: 'pointer', background: 'transparent' }}
                      />
                      <input 
                        value={activeEdge.style?.stroke || '#94a3b8'} 
                        onChange={(e) => updateEdgeData('stroke', e.target.value)}
                        style={{ flex: 1, padding: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px', fontSize: '0.85rem', outline: 'none' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input 
                      type="checkbox" 
                      id="animated-edge"
                      checked={activeEdge.animated || false}
                      onChange={(e) => updateEdgeData('animated', e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: '#3b82f6', cursor: 'pointer' }}
                    />
                    <label htmlFor="animated-edge" style={{ fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer' }}>Animated (Dotted Flow)</label>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Path Style</label>
                    <select 
                      value={activeEdge.type || 'smoothstep'} 
                      onChange={(e) => updateEdgeData('type', e.target.value)}
                      style={{ padding: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px', outline: 'none', fontSize: '0.85rem', width: '100%' }}
                    >
                      <option value="smoothstep">Smooth Step</option>
                      <option value="step">Step</option>
                      <option value="straight">Straight</option>
                      <option value="bezier">Bezier</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Thickness: {activeEdge.style?.strokeWidth || 3}px</label>
                    <input 
                      type="range" 
                      min="1" max="10" 
                      value={activeEdge.style?.strokeWidth || 3} 
                      onChange={(e) => updateEdgeData('strokeWidth', parseInt(e.target.value, 10))}
                      style={{ width: '100%', accentColor: '#3b82f6' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Arrow Direction</label>
                    <select 
                      value={activeEdge.markerEnd && activeEdge.markerStart ? 'bidirectional' : activeEdge.markerStart ? 'backward' : activeEdge.markerEnd ? 'forward' : 'none'} 
                      onChange={(e) => updateEdgeData('direction', e.target.value)}
                      style={{ padding: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px', outline: 'none', fontSize: '0.85rem', width: '100%' }}
                    >
                      <option value="forward">Forward</option>
                      <option value="backward">Backward</option>
                      <option value="bidirectional">Bidirectional</option>
                      <option value="none">None</option>
                    </select>
                  </div>
                  <div style={{ padding: '8px', background: 'rgba(0,0,0,0.1)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '12px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Label Styling</span>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: 'normal', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={activeEdge.showLabel !== false} 
                          onChange={(e) => updateEdgeData('showLabel', e.target.checked)} 
                        />
                        Show
                      </label>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Text Color</label>
                        <input 
                          type="color" 
                          value={activeEdge.labelStyle?.fill || '#ffffff'} 
                          onChange={(e) => updateEdgeData('labelColor', e.target.value)}
                          style={{ width: '100%', height: '24px', padding: '0', border: 'none', borderRadius: '4px', cursor: 'pointer', background: 'transparent' }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>BG Color</label>
                        <input 
                          type="color" 
                          value={activeEdge.labelBgStyle?.fill || '#1e293b'} 
                          onChange={(e) => updateEdgeData('labelBgColor', e.target.value)}
                          style={{ width: '100%', height: '24px', padding: '0', border: 'none', borderRadius: '4px', cursor: 'pointer', background: 'transparent' }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Background Opacity (Alpha): {activeEdge.labelBgStyle?.fillOpacity ?? 1}</label>
                      <input 
                        type="range" 
                        min="0" max="1" step="0.1"
                        value={activeEdge.labelBgStyle?.fillOpacity ?? 1} 
                        onChange={(e) => updateEdgeData('labelBgAlpha', parseFloat(e.target.value))}
                        style={{ width: '100%', accentColor: '#3b82f6' }}
                      />
                    </div>
                  </div>
                  <button className="btn" onClick={() => {
                    setEdges(eds => eds.filter(edge => edge.id !== activeEdge.id));
                    setSelectedEdgeId(null);
                  }} style={{ marginTop: '8px', border: '1px solid #ef4444', color: '#ef4444', display: 'flex', justifyContent: 'center', background: 'rgba(239, 68, 68, 0.1)' }}>
                    <Trash2 size={16} /> Delete Edge
                  </button>
                </div>
              </div>
            </Panel>
          )}
          {activeNode && (
            <Panel position="top-right" style={{ top: '80px', right: '20px' }}>
              <div className="json-viewer-overlay" style={{ width: '240px', padding: '16px', margin: 0, maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
                <div className="json-viewer-header" style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.85rem' }}>{workspace === 'draw' ? 'Element' : 'Edit Properties'}</span>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {workspace === 'draw' && (
                      <button title="Reset to defaults" onClick={() => {
                        updateNodeData('color', drawingColor);
                        updateNodeData('fillColor', drawFillColor);
                        updateNodeData('strokeWidth', drawingStrokeWidth);
                        updateNodeData('strokeStyle', drawStrokeStyle);
                        updateNodeData('strokeOpacity', drawStrokeOpacity);
                        updateNodeData('fillOpacity', drawFillOpacity);
                        updateNodeData('opacity', drawOpacity);
                        updateNodeData('shadow', drawShadow);
                        updateNodeData('cornerRadius', drawCornerRadius);
                      }} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', cursor: 'pointer', borderRadius: 4, fontSize: '0.6rem', padding: '1px 5px' }}>reset</button>
                    )}
                    <button onClick={() => setSelectedNodeId(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>&times;</button>
                  </div>
                </div>

                {/* ── DRAW workspace: styling panel ── */}
                {workspace === 'draw' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Label */}
                    {!['drawing', 'line', 'arrow'].includes(activeNode.data.shape) && (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Label</label>
                        <input value={activeNode.data.label || ''} onChange={(e) => updateNodeData('label', e.target.value)} placeholder="Double-click to edit inline" style={{ width: '100%', padding: '6px 8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                    )}
                    {/* Font */}
                    {!['drawing', 'line', 'arrow'].includes(activeNode.data.shape) && (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Font</label>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <select value={activeNode.data.fontFamily || 'virgil'} onChange={(e) => updateNodeData('fontFamily', e.target.value)} style={{ flex: 1, padding: '5px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px', fontSize: '0.75rem', outline: 'none' }}>
                            <option value="virgil">Handwriting</option>
                            <option value="sans-serif">Sans-Serif</option>
                            <option value="monospace">Monospace</option>
                          </select>
                          <input type="number" value={parseInt(activeNode.data.fontSize) || 16} onChange={(e) => updateNodeData('fontSize', e.target.value + 'px')} style={{ width: '52px', padding: '5px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px', fontSize: '0.75rem', outline: 'none' }} title="Font Size" />
                        </div>
                      </div>
                    )}
                    {/* Stroke */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Stroke</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input type="color" value={activeNode.data.color || drawingColor} onChange={(e) => updateNodeData('color', e.target.value)} style={{ width: 32, height: 28, padding: 0, border: '2px solid var(--border-color)', borderRadius: 4, cursor: 'pointer', background: 'none' }} />
                        <input type="range" min="0" max="100" value={activeNode.data.strokeOpacity ?? drawStrokeOpacity} onChange={(e) => updateNodeData('strokeOpacity', parseInt(e.target.value))} style={{ flex: 1, accentColor: '#3b82f6' }} title="Stroke Opacity" />
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', minWidth: 26, textAlign: 'right' }}>{activeNode.data.strokeOpacity ?? drawStrokeOpacity}%</span>
                      </div>
                    </div>
                    {/* Stroke Width + Style */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Stroke Width & Style</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input type="range" min="1" max="20" value={activeNode.data.strokeWidth || drawingStrokeWidth} onChange={(e) => updateNodeData('strokeWidth', parseInt(e.target.value))} style={{ flex: 1, accentColor: '#3b82f6' }} title="Stroke Width" />
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', minWidth: 22 }}>{activeNode.data.strokeWidth || drawingStrokeWidth}px</span>
                        <select value={activeNode.data.strokeStyle || drawStrokeStyle} onChange={(e) => updateNodeData('strokeStyle', e.target.value)} style={{ fontSize: '0.72rem', padding: '3px 4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: 4 }}>
                          <option value="solid">Solid</option>
                          <option value="dashed">Dashed</option>
                          <option value="dotted">Dotted</option>
                        </select>
                      </div>
                    </div>
                    {/* Corner Radius */}
                    {!['line', 'arrow', 'drawing', 'circle', 'oval', 'diamond', 'triangle', 'cloud'].includes(activeNode.data.shape) && (
                      <div>
                        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                          Corners
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{activeNode.data.cornerRadius ?? 4}px</span>
                        </label>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <button onClick={() => updateNodeData('cornerRadius', 0)} style={{ padding: '2px 8px', fontSize: '0.65rem', background: (activeNode.data.cornerRadius ?? 4) === 0 ? '#3b82f6' : 'var(--bg-secondary)', color: (activeNode.data.cornerRadius ?? 4) === 0 ? '#fff' : 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 4, cursor: 'pointer' }}>Sharp</button>
                          <input type="range" min="0" max="50" value={activeNode.data.cornerRadius ?? 4} onChange={(e) => updateNodeData('cornerRadius', parseInt(e.target.value))} style={{ flex: 1, accentColor: '#3b82f6' }} />
                          <button onClick={() => updateNodeData('cornerRadius', 50)} style={{ padding: '2px 8px', fontSize: '0.65rem', background: (activeNode.data.cornerRadius ?? 4) === 50 ? '#3b82f6' : 'var(--bg-secondary)', color: (activeNode.data.cornerRadius ?? 4) === 50 ? '#fff' : 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 4, cursor: 'pointer' }}>Round</button>
                        </div>
                      </div>
                    )}
                    {/* Fill */}
                    {!['line', 'arrow', 'drawing'].includes(activeNode.data.shape) && (
                      <div>
                        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                          Fill
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                            <input type="checkbox" checked={!activeNode.data.hideFill} onChange={(e) => updateNodeData('hideFill', !e.target.checked)} />
                            on
                          </label>
                        </label>
                        {!activeNode.data.hideFill && (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input type="color" value={activeNode.data.fillColor && activeNode.data.fillColor !== 'transparent' ? activeNode.data.fillColor : drawFillColor} onChange={(e) => updateNodeData('fillColor', e.target.value)} style={{ width: 32, height: 28, padding: 0, border: '2px solid var(--border-color)', borderRadius: 4, cursor: 'pointer', background: 'none' }} />
                            <input type="range" min="0" max="100" value={activeNode.data.fillOpacity ?? drawFillOpacity} onChange={(e) => updateNodeData('fillOpacity', parseInt(e.target.value))} style={{ flex: 1, accentColor: '#3b82f6' }} title="Fill Opacity" />
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', minWidth: 26, textAlign: 'right' }}>{activeNode.data.fillOpacity ?? drawFillOpacity}%</span>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Element Opacity */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Element Opacity</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input type="range" min="10" max="100" value={activeNode.data.opacity || drawOpacity} onChange={(e) => updateNodeData('opacity', parseInt(e.target.value))} style={{ flex: 1, accentColor: '#3b82f6' }} />
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', minWidth: 26, textAlign: 'right' }}>{activeNode.data.opacity || drawOpacity}%</span>
                      </div>
                    </div>
                    {/* Rough + Fill Style */}
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                        Hand-drawn Style
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                          <input type="checkbox" checked={!!activeNode.data.isRough} onChange={(e) => updateNodeData('isRough', e.target.checked)} />
                          rough
                        </label>
                      </label>
                      {activeNode.data.isRough && (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: 4 }}>
                          {['hachure', 'solid', 'zigzag', 'cross-hatch', 'dots', 'sunburst'].map(s => (
                            <button key={s} className={`btn ${(activeNode.data.fillStyle || 'hachure') === s ? 'btn-primary' : ''}`} onClick={() => updateNodeData('fillStyle', s)} style={{ fontSize: '0.6rem', padding: '2px 5px', textTransform: 'capitalize' }}>{s}</button>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Shadow */}
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                        Shadow
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                          <input type="checkbox" checked={!!activeNode.data.shadow} onChange={(e) => updateNodeData('shadow', e.target.checked)} />
                          on
                        </label>
                      </label>
                      {activeNode.data.shadow && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input type="color" value={activeNode.data.shadowColor || drawShadowColor} onChange={(e) => updateNodeData('shadowColor', e.target.value)} style={{ width: 32, height: 28, padding: 0, border: '2px solid var(--border-color)', borderRadius: 4, cursor: 'pointer', background: 'none' }} title="Shadow Color" />
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>color</span>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', minWidth: 26 }}>blur</span>
                            <input type="range" min="0" max="30" value={activeNode.data.shadowBlur ?? drawShadowBlur} onChange={(e) => updateNodeData('shadowBlur', parseInt(e.target.value))} style={{ flex: 1, accentColor: '#3b82f6' }} />
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', minWidth: 22 }}>{activeNode.data.shadowBlur ?? drawShadowBlur}px</span>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', minWidth: 26 }}>opac</span>
                            <input type="range" min="0" max="100" value={activeNode.data.shadowOpacity ?? drawShadowOpacity} onChange={(e) => updateNodeData('shadowOpacity', parseInt(e.target.value))} style={{ flex: 1, accentColor: '#3b82f6' }} />
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', minWidth: 26, textAlign: 'right' }}>{activeNode.data.shadowOpacity ?? drawShadowOpacity}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Text Alignment</label>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <button className={`btn ${activeNode.data.textAlign === 'left' ? 'btn-primary' : ''}`} onClick={() => updateNodeData('textAlign', 'left')} style={{ flex: 1, padding: '6px' }} title="Align Left"><AlignLeft size={16} /></button>
                      <button className={`btn ${(activeNode.data.textAlign === 'center' || !activeNode.data.textAlign) ? 'btn-primary' : ''}`} onClick={() => updateNodeData('textAlign', 'center')} style={{ flex: 1, padding: '6px' }} title="Align Center"><AlignCenter size={16} /></button>
                      <button className={`btn ${activeNode.data.textAlign === 'right' ? 'btn-primary' : ''}`} onClick={() => updateNodeData('textAlign', 'right')} style={{ flex: 1, padding: '6px' }} title="Align Right"><AlignRight size={16} /></button>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className={`btn ${activeNode.data.verticalAlign === 'top' ? 'btn-primary' : ''}`} onClick={() => updateNodeData('verticalAlign', 'top')} style={{ flex: 1, padding: '6px' }} title="Align Top"><AlignStartVertical size={16} /></button>
                      <button className={`btn ${(activeNode.data.verticalAlign === 'middle' || !activeNode.data.verticalAlign) ? 'btn-primary' : ''}`} onClick={() => updateNodeData('verticalAlign', 'middle')} style={{ flex: 1, padding: '6px' }} title="Align Middle"><AlignCenterVertical size={16} /></button>
                      <button className={`btn ${activeNode.data.verticalAlign === 'bottom' ? 'btn-primary' : ''}`} onClick={() => updateNodeData('verticalAlign', 'bottom')} style={{ flex: 1, padding: '6px' }} title="Align Bottom"><AlignEndVertical size={16} /></button>
                    </div>
                  </div>

                  {/* Label / Text Content (Always show if shape allows text) */}
                  {!['drawing', 'line', 'arrow'].includes(activeNode.data.shape) && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Text Content</label>
                      {activeNode.data.shape === 'note' || activeNode.data.shape === 'callout' ? (
                        <textarea 
                          value={activeNode.data.label || ''} 
                          onChange={(e) => updateNodeData('label', e.target.value)} 
                          rows={6}
                          style={{ width: '100%', padding: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '0.9rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.4' }}
                        />
                      ) : (
                        <input 
                          value={activeNode.data.label || ''} 
                          onChange={(e) => updateNodeData('label', e.target.value)} 
                          placeholder="Double-click node to edit directly"
                          style={{ width: '100%', padding: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '0.9rem', outline: 'none' }}
                        />
                      )}
                    </div>
                  )}

                  {/* Draw Shape Styling */}
                  {['rectangle', 'circle', 'diamond', 'triangle', 'cloud', 'arrow', 'line', 'drawing', 'oval'].includes(activeNode.data.shape) ? (
                    <>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Stroke Color</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input 
                            type="color"
                            value={activeNode.data.color || '#3b82f6'} 
                            onChange={(e) => updateNodeData('color', e.target.value)} 
                            style={{ width: '40px', height: '40px', padding: '0', background: 'none', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                          />
                          <input 
                            value={activeNode.data.color || '#3b82f6'} 
                            onChange={(e) => updateNodeData('color', e.target.value)} 
                            style={{ flex: 1, padding: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '0.9rem', outline: 'none' }}
                          />
                        </div>
                      </div>

                      {!['line', 'arrow'].includes(activeNode.data.shape) && (
                        <div>
                          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            Fill Setting
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                              <input 
                                type="checkbox" 
                                checked={!activeNode.data.hideFill} 
                                onChange={(e) => updateNodeData('hideFill', !e.target.checked)} 
                              />
                              Enable Fill
                            </label>
                          </label>
                          {!activeNode.data.hideFill && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <select 
                                value={activeNode.data.fillType || 'solid'} 
                                onChange={(e) => updateNodeData('fillType', e.target.value)} 
                                style={{ width: '100%', padding: '6px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px', fontSize: '0.8rem', outline: 'none' }}
                              >
                                <option value="solid">Solid Color</option>
                                <option value="gradient">Linear Gradient</option>
                              </select>
                              
                              {(activeNode.data.fillType === 'gradient') ? (
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <input 
                                    type="color"
                                    value={activeNode.data.gradientColor1 || '#ffffff'} 
                                    onChange={(e) => updateNodeData('gradientColor1', e.target.value)} 
                                    style={{ width: '32px', height: '32px', padding: '0', background: 'none', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    title="Start Color"
                                  />
                                  <span style={{ color: 'var(--text-secondary)' }}>to</span>
                                  <input 
                                    type="color"
                                    value={activeNode.data.gradientColor2 || '#3b82f6'} 
                                    onChange={(e) => updateNodeData('gradientColor2', e.target.value)} 
                                    style={{ width: '32px', height: '32px', padding: '0', background: 'none', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    title="End Color"
                                  />
                                  <input 
                                    type="number"
                                    value={activeNode.data.gradientAngle || 90}
                                    onChange={(e) => updateNodeData('gradientAngle', parseInt(e.target.value))}
                                    style={{ flex: 1, padding: '6px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px', fontSize: '0.8rem', outline: 'none' }}
                                    title="Gradient Angle (degrees)"
                                    placeholder="Deg"
                                  />
                                </div>
                              ) : (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <input 
                                    type="color"
                                    value={activeNode.data.fillColor || '#ffffff'} 
                                    onChange={(e) => updateNodeData('fillColor', e.target.value)} 
                                    style={{ width: '40px', height: '40px', padding: '0', background: 'none', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                  />
                                  <input 
                                    value={activeNode.data.fillColor || '#ffffff'} 
                                    onChange={(e) => updateNodeData('fillColor', e.target.value)} 
                                    style={{ flex: 1, padding: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '0.9rem', outline: 'none' }}
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Stroke Width: {activeNode.data.strokeWidth || 2}px</label>
                          <input
                            type="range"
                            min="1" max="20"
                            value={activeNode.data.strokeWidth || 2}
                            onChange={(e) => updateNodeData('strokeWidth', parseInt(e.target.value))}
                            style={{ width: '100%', accentColor: '#3b82f6' }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Stroke Style</label>
                          <select 
                            value={activeNode.data.strokeStyle || 'solid'} 
                            onChange={(e) => updateNodeData('strokeStyle', e.target.value)} 
                            style={{ width: '100%', padding: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '0.9rem', outline: 'none' }}
                          >
                            <option value="solid">Solid</option>
                            <option value="dashed">Dashed</option>
                            <option value="dotted">Dotted</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Fill Opacity: {activeNode.data.fillOpacity ?? 100}%</label>
                          <input
                            type="range"
                            min="0" max="100"
                            value={activeNode.data.fillOpacity ?? 100}
                            onChange={(e) => updateNodeData('fillOpacity', parseInt(e.target.value))}
                            style={{ width: '100%', accentColor: '#3b82f6' }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Stroke Opacity: {activeNode.data.strokeOpacity ?? 100}%</label>
                          <input
                            type="range"
                            min="0" max="100"
                            value={activeNode.data.strokeOpacity ?? 100}
                            onChange={(e) => updateNodeData('strokeOpacity', parseInt(e.target.value))}
                            style={{ width: '100%', accentColor: '#3b82f6' }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Element Opacity: {activeNode.data.opacity || 100}%</label>
                        <input
                          type="range"
                          min="10" max="100"
                          value={activeNode.data.opacity || 100}
                          onChange={(e) => updateNodeData('opacity', parseInt(e.target.value))}
                          style={{ width: '100%', accentColor: '#3b82f6' }}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Standard Node Color */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Color</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input 
                            type="color"
                            value={activeNode.data.color || '#3b82f6'} 
                            onChange={(e) => updateNodeData('color', e.target.value)} 
                            style={{ width: '40px', height: '40px', padding: '0', background: 'none', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                          />
                          <input 
                            value={activeNode.data.color || '#3b82f6'} 
                            onChange={(e) => updateNodeData('color', e.target.value)} 
                            style={{ flex: 1, padding: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '0.9rem', outline: 'none' }}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Typography Settings (Always show for text or if it has text) */}
                  {!['drawing', 'line', 'arrow'].includes(activeNode.data.shape) && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Typography</label>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <select
                          value={activeNode.data.fontFamily || 'virgil'}
                          onChange={(e) => updateNodeData('fontFamily', e.target.value)}
                          style={{ flex: 1, padding: '6px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px', outline: 'none', fontSize: '0.8rem' }}
                        >
                          <option value="virgil">Handwriting</option>
                          <option value="sans-serif">Sans-Serif</option>
                          <option value="monospace">Monospace</option>
                        </select>
                        <input
                          type="number"
                          value={parseInt(activeNode.data.fontSize) || 16}
                          onChange={(e) => updateNodeData('fontSize', e.target.value + 'px')}
                          style={{ width: '60px', padding: '6px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px', outline: 'none', fontSize: '0.8rem' }}
                          title="Font Size"
                        />
                      </div>
                    </div>
                  )}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Icon Name (Lucide)</label>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                      <input
                        value={activeNode.data.icon || ''}
                        onChange={(e) => updateNodeData('icon', e.target.value)}
                        placeholder="e.g. Server, Database, Cloud"
                        style={{ flex: 1, padding: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '0.9rem', outline: 'none' }}
                      />
                      <button
                        className="btn"
                        onClick={() => setShowIconPicker(true)}
                        style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0 12px' }}
                      >
                        <Search size={16} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Hand-drawn Settings</label>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={!!activeNode.data.isRough} 
                          onChange={(e) => updateNodeData('isRough', e.target.checked)} 
                        />
                        Rough
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={!activeNode.data.hideFill} 
                          onChange={(e) => updateNodeData('hideFill', !e.target.checked)} 
                        />
                        Fill
                      </label>
                    </div>
                    {activeNode.data.isRough && !activeNode.data.hideFill && (
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {['hachure', 'solid', 'zigzag', 'cross-hatch', 'dots', 'sunburst'].map(style => (
                          <button 
                            key={style}
                            className={`btn ${activeNode.data.fillStyle === style ? 'btn-primary' : ''}`}
                            onClick={() => updateNodeData('fillStyle', style)}
                            style={{ fontSize: '0.65rem', padding: '2px 6px', textTransform: 'capitalize' }}
                          >
                            {style}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={!!activeNode.data.hideBorder} 
                      onChange={(e) => updateNodeData('hideBorder', e.target.checked)} 
                    />
                    Hide Node Border & Background
                  </label>
                  
                  {activeNode.data.shape === 'text' && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer', marginTop: '6px' }}>
                      <input 
                        type="checkbox" 
                        checked={!!activeNode.data.showIcon} 
                        onChange={(e) => updateNodeData('showIcon', e.target.checked)} 
                      />
                      Show Icon beside Title
                    </label>
                  )}
                  {activeNode.data.label === 'Bean' && (
                    <div style={{ marginTop: '8px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '8px', fontWeight: 'bold' }}>Bean Configuration</label>
                      <div style={{ marginBottom: '8px' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Bean Name</label>
                        <input 
                          value={activeNode.data.beanName || ''} 
                          onChange={(e) => updateNodeData('beanName', e.target.value)} 
                          placeholder="myBean"
                          style={{ width: '100%', padding: '8px', background: '#0a0a0a', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px', fontSize: '0.85rem', outline: 'none' }}
                        />
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Class Name</label>
                        <input 
                          value={activeNode.data.beanType || ''} 
                          onChange={(e) => updateNodeData('beanType', e.target.value)} 
                          placeholder="com.example.MyClass"
                          style={{ width: '100%', padding: '8px', background: '#0a0a0a', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px', fontSize: '0.85rem', outline: 'none' }}
                        />
                      </div>
                    </div>
                  )}
                  {activeNode.data.shape === 'class' && (
                    <>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Fields (one per line)</label>
                        <textarea 
                          value={activeNode.data.fields ?? '+ id: string\n+ name: string'} 
                          onChange={(e) => updateNodeData('fields', e.target.value)} 
                          style={{ width: '100%', minHeight: '60px', padding: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', fontFamily: 'monospace' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Methods (one per line)</label>
                        <textarea 
                          value={activeNode.data.methods ?? '+ save()\n+ load()'} 
                          onChange={(e) => updateNodeData('methods', e.target.value)} 
                          style={{ width: '100%', minHeight: '60px', padding: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', fontFamily: 'monospace' }}
                        />
                      </div>
                    </>
                  )}
                  {['setbody', 'setheader', 'when', 'log'].includes(activeNode.data.label?.toLowerCase()) && (
                    <div style={{ marginTop: '8px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '8px', fontWeight: 'bold' }}>Expression Editor</label>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <select 
                          value={activeNode.data.expressionType || 'simple'} 
                          onChange={(e) => updateNodeData('expressionType', e.target.value)}
                          style={{ padding: '6px', background: '#0f111a', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px', outline: 'none', fontSize: '0.8rem', width: '100%' }}
                        >
                          <option value="simple">Simple</option>
                          <option value="constant">Constant</option>
                          <option value="jq">JQ</option>
                          <option value="jsonpath">JSONPath</option>
                        </select>
                      </div>
                      <textarea 
                        value={activeNode.data.expression || ''} 
                        onChange={(e) => updateNodeData('expression', e.target.value)} 
                        placeholder={activeNode.data.expressionType === 'constant' ? 'Enter text...' : '${body.field} == "value"'}
                        style={{ width: '100%', minHeight: '100px', padding: '12px', background: '#0a0a0a', border: '1px solid #3b82f6', color: '#10b981', borderRadius: '6px', fontSize: '0.9rem', outline: 'none', fontFamily: '"Fira Code", monospace', resize: 'vertical' }}
                      />
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: '1.4' }}>
                        {(!activeNode.data.expressionType || activeNode.data.expressionType === 'simple') && (
                          <><b>💡 Help:</b> Use Camel Simple Language. Example: <code>{'$'}{'{header.foo}'}</code> or <code>{'$'}{'{body.items[0]}'}</code></>
                        )}
                        {activeNode.data.expressionType === 'constant' && (
                          <><b>💡 Help:</b> Plain text string. No dynamic evaluation.</>
                        )}
                        {activeNode.data.expressionType === 'jq' && (
                          <><b>💡 Help:</b> Use JQ syntax to extract JSON. Example: <code>.store.book[0].title</code></>
                        )}
                        {activeNode.data.expressionType === 'jsonpath' && (
                          <><b>💡 Help:</b> Use JSONPath syntax. Example: <code>$.store.book[*].author</code></>
                        )}
                      </div>
                    </div>
                  )}
                  {workspace === 'eip' && (
                    <div style={{ marginTop: '8px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '8px', fontWeight: 'bold' }}>
                        <span>Raw YAML Override</span>
                        {activeNode.data.rawYaml && <span style={{color: '#f59e0b'}}>Active</span>}
                      </label>
                      <textarea 
                        value={activeNode.data.rawYaml !== undefined ? activeNode.data.rawYaml : getDefaultYamlForNode(activeNode)} 
                        onChange={(e) => updateNodeData('rawYaml', e.target.value)} 
                        placeholder={`- to:\n    uri: "sql:{{sql-query}}"`}
                        style={{ width: '100%', minHeight: '80px', padding: '10px', background: '#0a0a0a', border: '1px solid #3b82f6', color: '#3b82f6', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', fontFamily: '"Fira Code", monospace', resize: 'vertical' }}
                      />
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: '1.4' }}>
                        <b>💡 Advanced:</b> If provided, this code overrides normal YAML generation for this specific component. Use exact Camel DSL indentation.
                      </div>
                    </div>
                  )}
                  {workspace !== 'eip' && (
                    <button className="btn" onClick={() => {
                        const newId = uuidv4();
                        const isParentContainer = activeNode.data?.isContainer;
                        const childParentId = isParentContainer ? activeNode.id : activeNode.parentId;
                        const childExtent = childParentId ? 'parent' : undefined;
                        
                        let childPosition;
                        let updatedNodes = [...nodes];
                        let updatedEdges = [...edges];

                        if (childParentId) {
                          const containerId = childParentId;
                          const children = nodes.filter(c => c.parentId === containerId);

                          const childWidth = 160;
                          const gapX = 50;
                          const gapY = 50;
                          const cols = 2;

                          const index = children.length;
                          const colIndex = index % cols;
                          const rowIndex = Math.floor(index / cols);

                          let offsetY = 70;
                          for (let r = 0; r < rowIndex; r++) {
                            const rowChildren = children.slice(r * cols, (r + 1) * cols);
                            const rowMaxHeight = Math.max(80, ...rowChildren.map(c => {
                              if (c.data?.shape === 'class') return 120;
                              if (c.data?.shape === 'actor') return 90;
                              return 80;
                            }));
                            offsetY += rowMaxHeight + gapY;
                          }

                          const offsetX = 30 + colIndex * (childWidth + gapX);
                          childPosition = { x: offsetX, y: offsetY };

                          const nodeHeight = 80; // 'Add Child' always creates a 'box' which is 80px high
                          let maxX = offsetX + childWidth;
                          let maxY = offsetY + nodeHeight;

                          children.forEach(c => {
                            let ch = 80;
                            if (c.data?.shape === 'class') ch = 120;
                            else if (c.data?.shape === 'actor') ch = 90;

                            const rightSide = c.position.x + childWidth;
                            const bottomSide = c.position.y + ch;
                            if (rightSide > maxX) maxX = rightSide;
                            if (bottomSide > maxY) maxY = bottomSide;
                          });
                          
                          updatedNodes = updatedNodes.map(n => {
                            if (n.id === containerId) {
                              return {
                                ...n,
                                style: {
                                  ...n.style,
                                  width: Math.max(400, maxX + 50),
                                  height: Math.max(300, maxY + 50),
                                  zIndex: -1
                                }
                              };
                            }
                            return n;
                          });
                        } else {
                          childPosition = { x: activeNode.position.x + 200, y: activeNode.position.y };
                        }

                        const childData = { 
                          label: 'New Child', 
                          icon: 'Box', 
                          color: activeNode.data.color || '#3b82f6',
                          shape: 'box',
                          isContainer: false,
                          isEip: activeNode.data.isEip
                        };

                        const newChildNode = {
                          id: newId,
                          type: 'custom',
                          parentId: childParentId,
                          extent: childExtent,
                          position: childPosition,
                          data: childData
                        };

                        const newEdge = {
                          id: uuidv4(),
                          source: activeNode.id,
                          target: newId,
                          ...defaultEdgeOptions
                        };

                        updatedNodes = updatedNodes.concat(newChildNode);
                        updatedEdges = updatedEdges.concat(newEdge);

                        setNodes(updatedNodes);
                        setEdges(updatedEdges);
                        
                        setTimeout(() => {
                          if (reactFlowInstance) reactFlowInstance.fitView({ padding: 0.2, duration: 800 });
                        }, 50);
                    }} style={{ marginTop: '8px', border: '1px solid #10b981', color: '#10b981', display: 'flex', justifyContent: 'center', background: 'rgba(16, 185, 129, 0.1)' }}>
                      <FilePlus size={16} /> Add Child Node
                    </button>
                  )}
                  <button className="btn" onClick={deleteSelectedNode} style={{ marginTop: '8px', border: '1px solid #ef4444', color: '#ef4444', display: 'flex', justifyContent: 'center', background: 'rgba(239, 68, 68, 0.1)' }}>
                    <Trash2 size={16} /> Delete Node
                  </button>
                </div>
                )} {/* end else (non-draw) */}
              </div>
            </Panel>
          )}
          {contextMenu && (
            <div style={{ position: 'absolute', top: contextMenu.top, left: contextMenu.left, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', zIndex: 1000, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {nodes.filter(n => n.selected).length > 1 && (
                <div style={{ padding: '4px', minWidth: '180px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', padding: '4px 4px', fontWeight: 'bold' }}>Align Selected</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                    <button className="btn btn-icon-only" style={{ padding: '6px' }} onClick={() => alignSelectedNodes('left')} title="Align Left"><AlignLeft size={16}/></button>
                    <button className="btn btn-icon-only" style={{ padding: '6px' }} onClick={() => alignSelectedNodes('center-h')} title="Align Center (H)"><AlignCenterVertical size={16}/></button>
                    <button className="btn btn-icon-only" style={{ padding: '6px' }} onClick={() => alignSelectedNodes('right')} title="Align Right"><AlignRight size={16}/></button>
                    <button className="btn btn-icon-only" style={{ padding: '6px' }} onClick={() => alignSelectedNodes('top')} title="Align Top"><AlignStartVertical size={16}/></button>
                    <button className="btn btn-icon-only" style={{ padding: '6px' }} onClick={() => alignSelectedNodes('center-v')} title="Align Middle (V)"><AlignCenter size={16}/></button>
                    <button className="btn btn-icon-only" style={{ padding: '6px' }} onClick={() => alignSelectedNodes('bottom')} title="Align Bottom"><AlignEndVertical size={16}/></button>
                  </div>
                  <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }}></div>
                </div>
              )}
              {workspace === 'draw' && (
                <>
                  <button className="btn" onClick={bringToFront} style={{ textAlign: 'left', width: '100%', border: 'none', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ChevronsUp size={16} /> Bring to Front
                  </button>
                  <button className="btn" onClick={sendToBack} style={{ textAlign: 'left', width: '100%', border: 'none', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ChevronsDown size={16} /> Send to Back
                  </button>
                  <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }}></div>
                </>
              )}
              {workspace === 'eip' && (
                <div style={{ padding: '4px', minWidth: '180px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', padding: '4px 4px', fontWeight: 'bold' }}>Insert Before</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                    <button className="btn btn-icon-only" style={{ padding: '6px' }} onClick={() => insertNode('before', 'setBody')} title="setBody"><FileText size={16} color="#10b981"/></button>
                    <button className="btn btn-icon-only" style={{ padding: '6px' }} onClick={() => insertNode('before', 'setHeader')} title="setHeader"><Code size={16} color="#8b5cf6"/></button>
                    <button className="btn btn-icon-only" style={{ padding: '6px' }} onClick={() => insertNode('before', 'log')} title="log"><TerminalSquare size={16} color="#f59e0b"/></button>
                    <button className="btn btn-icon-only" style={{ padding: '6px' }} onClick={() => insertNode('before', 'to')} title="to Endpoint"><Send size={16} color="#ef4444"/></button>
                    <button className="btn btn-icon-only" style={{ padding: '6px' }} onClick={() => insertNode('before', 'processor')} title="Processor"><Cpu size={16} color="#0ea5e9"/></button>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', padding: '4px 4px', fontWeight: 'bold' }}>Insert After</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    <button className="btn btn-icon-only" style={{ padding: '6px' }} onClick={() => insertNode('after', 'setBody')} title="setBody"><FileText size={16} color="#10b981"/></button>
                    <button className="btn btn-icon-only" style={{ padding: '6px' }} onClick={() => insertNode('after', 'setHeader')} title="setHeader"><Code size={16} color="#8b5cf6"/></button>
                    <button className="btn btn-icon-only" style={{ padding: '6px' }} onClick={() => insertNode('after', 'log')} title="log"><TerminalSquare size={16} color="#f59e0b"/></button>
                    <button className="btn btn-icon-only" style={{ padding: '6px' }} onClick={() => insertNode('after', 'to')} title="to Endpoint"><Send size={16} color="#ef4444"/></button>
                    <button className="btn btn-icon-only" style={{ padding: '6px' }} onClick={() => insertNode('after', 'processor')} title="Processor"><Cpu size={16} color="#0ea5e9"/></button>
                    <button className="btn btn-icon-only" style={{ padding: '6px' }} onClick={() => insertNode('after', 'marshal')} title="marshal"><Package size={16} color="#ec4899"/></button>
                    <button className="btn btn-icon-only" style={{ padding: '6px' }} onClick={() => insertNode('after', 'unmarshal')} title="unmarshal"><PackageOpen size={16} color="#14b8a6"/></button>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', padding: '4px 4px', fontWeight: 'bold' }}>Insert Endpoints</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    <button className="btn" style={{ padding: '6px', fontSize: '0.7rem' }} onClick={() => insertNode('after', 'to')} title="Generic to"><Send size={14}/> to</button>
                    <button className="btn" style={{ padding: '6px', fontSize: '0.7rem' }} onClick={() => insertNode('after', 'sql')} title="to sql"><Database size={14}/> sql</button>
                    <button className="btn" style={{ padding: '6px', fontSize: '0.7rem' }} onClick={() => insertNode('after', 'mongodb')} title="to mongodb"><Database size={14}/> mongo</button>
                    <button className="btn" style={{ padding: '6px', fontSize: '0.7rem' }} onClick={() => insertNode('after', 'bean')} title="to bean"><Box size={14}/> bean</button>
                  </div>
                </div>
              )}
              {workspace === 'ddd' && (
                <>
                  <button className="btn" onClick={toggleContainer} style={{ textAlign: 'left', width: '100%', border: 'none', padding: '8px 12px' }}>
                    {isCtxContainer ? 'Unmark as Container' : 'Mark as Container'}
                  </button>
                  
                  {ctxParentId && (
                    <button className="btn" onClick={exitContext} style={{ textAlign: 'left', width: '100%', border: 'none', padding: '8px 12px' }}>
                      Exit Parent Context
                    </button>
                  )}

                  {!isCtxContainer && allContainers.length > 0 && (
                    <div style={{ padding: '8px 12px' }}>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold', marginBottom: '4px' }}>Move to Context:</div>
                      {allContainers.map(c => (
                        <button key={c.id} className="btn" onClick={() => moveNodeToContext(ctxNode.id, c.id)} style={{ textAlign: 'left', width: '100%', border: 'none', padding: '4px 8px', fontSize: '0.8rem', background: 'var(--bg-tertiary)' }}>
                          {c.data.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {isCtxContainer && looseNodes.length > 0 && (
                    <div style={{ padding: '8px 12px' }}>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold', marginBottom: '4px' }}>Add node to Context:</div>
                      {looseNodes.map(n => (
                        <button key={n.id} className="btn" onClick={() => moveNodeToContext(n.id, ctxNode.id)} style={{ textAlign: 'left', width: '100%', border: 'none', padding: '4px 8px', fontSize: '0.8rem', background: 'var(--bg-tertiary)' }}>
                          {n.data.label}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
              {workspace === 'cad' && (
                <div style={{ padding: '4px', minWidth: '210px' }}>
                  <button className="btn" onClick={() => dacRenameNode(contextMenu.id)} style={{ textAlign: 'left', width: '100%', border: 'none', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Pencil size={15} /> Edit Label…
                  </button>
                  <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }}></div>

                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', padding: '4px 4px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}><Shapes size={12} /> Change Shape</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                    <button className="btn btn-icon-only" style={{ padding: '6px' }} title="Rectangle" onClick={() => dacUpdateNode(contextMenu.id, { shape: 'rectangle', rounded: false })}><Square size={16} /></button>
                    <button className="btn btn-icon-only" style={{ padding: '6px' }} title="Rounded" onClick={() => dacUpdateNode(contextMenu.id, { shape: 'rectangle', rounded: true })}><Square size={16} style={{ borderRadius: 4 }} /></button>
                    <button className="btn btn-icon-only" style={{ padding: '6px' }} title="Decision (diamond)" onClick={() => dacUpdateNode(contextMenu.id, { shape: 'diamond' })}><Diamond size={16} /></button>
                    <button className="btn btn-icon-only" style={{ padding: '6px' }} title="Circle" onClick={() => dacUpdateNode(contextMenu.id, { shape: 'circle' })}><CircleIcon size={16} /></button>
                    <button className="btn btn-icon-only" style={{ padding: '6px' }} title="Database (cylinder)" onClick={() => dacUpdateNode(contextMenu.id, { shape: 'cylinder' })}><Database size={16} /></button>
                  </div>

                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', padding: '4px 4px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}><Plus size={12} /> Add Connected Node</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                    <button className="btn btn-icon-only" style={{ padding: '6px' }} title="Rectangle" onClick={() => cadAddConnected(contextMenu.id, 'rectangle')}><Square size={16} /></button>
                    <button className="btn btn-icon-only" style={{ padding: '6px' }} title="Rounded" onClick={() => cadAddConnected(contextMenu.id, 'rectangle', true)}><Square size={16} style={{ borderRadius: 4 }} /></button>
                    <button className="btn btn-icon-only" style={{ padding: '6px' }} title="Decision" onClick={() => cadAddConnected(contextMenu.id, 'diamond')}><Diamond size={16} /></button>
                    <button className="btn btn-icon-only" style={{ padding: '6px' }} title="Circle" onClick={() => cadAddConnected(contextMenu.id, 'circle')}><CircleIcon size={16} /></button>
                    <button className="btn btn-icon-only" style={{ padding: '6px' }} title="Database" onClick={() => cadAddConnected(contextMenu.id, 'cylinder')}><Database size={16} /></button>
                  </div>

                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', padding: '4px 4px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}><Palette size={12} /> Colour</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '4px', padding: '2px 4px' }}>
                    {['#3b82f6', '#22c55e', '#ef4444', '#f59e0b', '#a855f7', '#06b6d4', '#64748b'].map(c => (
                      <button key={c} onClick={() => dacUpdateNode(contextMenu.id, { color: c })} title={c} style={{ width: 18, height: 18, borderRadius: '50%', background: c, border: '2px solid var(--bg-secondary)', boxShadow: '0 0 0 1px var(--border-color)', cursor: 'pointer', padding: 0 }} />
                    ))}
                  </div>
                </div>
              )}
              <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }}></div>
              <button className="btn" onClick={() => (workspace === 'cad' ? dacDeleteNode(contextMenu.id) : deleteContextMenuNode())} style={{ textAlign: 'left', width: '100%', border: 'none', padding: '8px 12px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trash2 size={16} /> Delete Node
              </button>
            </div>
          )}
        </ReactFlow>


        {(workspace === 'cad' ? (cadCode.trim() === '') : (nodes.length === 0)) && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            pointerEvents: 'none', textAlign: 'center', color: 'var(--text-secondary)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', zIndex: 10
          }}>
            <Box size={48} opacity={0.3} />
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--text-primary)' }}>Canvas is Empty</h3>
              <p style={{ maxWidth: '300px', lineHeight: '1.5' }}>
                {workspace === 'ddd' && "Drag and drop Domain Driven Design elements from the sidebar to begin building your bounded contexts and aggregates."}
                {workspace === 'diagram' && "Drag and drop shapes from the sidebar to begin drawing your flowchart, UML, or system architecture."}
                {workspace === 'draw' && "Select a tool from the toolbar above to start drawing or sketching."}
                {workspace === 'eip' && "Drag and drop Enterprise Camel Patterns from the sidebar to begin building your Camel route."}
                {workspace === 'cad' && "Start typing in the code editor on the left to generate your diagram."}
              </p>
            </div>
          </div>
        )}
        </div>{/* end cadPreviewRef inner preview container */}
        </div>{/* end cadCanvasRef */}

        {showIconPicker && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', width: '600px', height: '600px', display: 'flex', flexDirection: 'column', border: '1px solid var(--border-color)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Select an Icon</h3>
                <button className="btn btn-icon-only" onClick={() => setShowIconPicker(false)}><X size={20} /></button>
              </div>
              <input 
                autoFocus
                placeholder="Search icons..." 
                value={iconSearch}
                onChange={(e) => setIconSearch(e.target.value)}
                style={{ width: '100%', padding: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '1rem', outline: 'none', marginBottom: '16px' }}
              />
              <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px', padding: '4px' }}>
                {allIconNames.filter(k => k.toLowerCase().includes(iconSearch.toLowerCase())).slice(0, 100).map(iconName => {
                  const IconComp = AllIcons[iconName];
                  if (!IconComp) return null;
                  return (
                    <div 
                      key={iconName}
                      onClick={() => {
                        updateNodeData('icon', iconName);
                        setShowIconPicker(false);
                      }}
                      style={{ padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'var(--bg-tertiary)', borderRadius: '8px', cursor: 'pointer', border: '1px solid transparent' }}
                      onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-blue)'}
                      onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
                    >
                      <IconComp size={24} color="var(--text-primary)" />
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textAlign: 'center', wordBreak: 'break-all' }}>{iconName}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '16px', textAlign: 'center' }}>Showing up to 100 results</div>
            </div>
          </div>
        )}
      </main>
      </div>

      {showClearConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '28px', borderRadius: '16px', width: '420px', border: '1px solid var(--border-color)', boxShadow: '0 25px 60px rgba(0,0,0,0.6)', textAlign: 'center' }}>
            <div style={{ color: '#ef4444', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
              <Eraser size={48} />
            </div>
            <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-primary)', fontSize: '1.3rem', fontWeight: 'bold' }}>Clear Canvas?</h3>
            <p style={{ margin: '0 0 24px 0', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              Are you sure you want to clear the entire canvas? This will permanently delete all nodes and connections in your current workspace.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                className="btn" 
                onClick={() => setShowClearConfirm(false)}
                style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                Cancel
              </button>
              <button 
                className="btn" 
                onClick={() => {
                  setNodes([]);
                  setEdges([]);
                  setShowClearConfirm(false);
                }}
                style={{ background: '#ef4444', color: 'var(--text-primary)', padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}
              >
                Clear Everything
              </button>
            </div>
          </div>
        </div>
      )}

      {showTextEditor && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(5px)' }}>
          <div style={{ background: 'var(--bg-secondary)', width: '800px', height: '600px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Code size={20} color="#3b82f6" /> Import Diagram from JSON/YAML
              </h3>
              <button className="btn btn-icon-only" onClick={() => setShowTextEditor(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Paste your diagram's JSON or YAML structure below. This should be a structure exported from this tool containing "nodes" and "edges".
              </p>
              <textarea 
                value={editorContent}
                onChange={(e) => setEditorContent(e.target.value)}
                placeholder='Paste JSON or YAML here... (e.g. { "nodes": [], "edges": [] })'
                style={{ flex: 1, background: '#0a0a0a', color: '#3b82f6', border: '1px solid #1e293b', borderRadius: '8px', padding: '16px', fontFamily: '"Fira Code", monospace', fontSize: '0.85rem', outline: 'none', resize: 'none' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="checkbox" 
                  id="auto-arrange-check" 
                  checked={autoArrangeOnImport} 
                  onChange={(e) => setAutoArrangeOnImport(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="auto-arrange-check" style={{ color: 'var(--text-primary)', fontSize: '0.85rem', cursor: 'pointer' }}>
                  Auto-arrange nodes and containers after import (recommended for messy diagrams)
                </label>
              </div>
            </div>
            <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'rgba(255,255,255,0.02)' }}>
              <button className="btn" onClick={() => setShowTextEditor(false)} style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={applyTextImport} style={{ background: '#3b82f6', color: 'var(--text-primary)' }}>
                Apply Diagram
              </button>
            </div>
          </div>
        </div>
      )}

      {showTemplatesModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '28px', borderRadius: '16px', width: '600px', maxHeight: '80vh', overflowY: 'auto', border: '1px solid var(--border-color)', boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.4rem', fontWeight: 'bold' }}>Load Template</h3>
              <button className="btn btn-icon-only" onClick={() => setShowTemplatesModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>
            <p style={{ margin: '0 0 24px 0', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              Select a pre-configured architecture pattern for the <b>{workspace.toUpperCase()}</b> workspace. Loading a template will replace your current workspace canvas.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(templates[workspace] || []).map((tpl, idx) => (
                <div
                  key={idx}
                  onClick={() => { loadTemplate(tpl); setShowTemplatesModal(false); }}
                  onMouseEnter={() => setTemplateFocusIdx(idx)}
                  style={{
                    background: templateFocusIdx === idx ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${templateFocusIdx === idx ? 'var(--accent-blue, #2563eb)' : 'var(--border-color)'}`,
                    borderRadius: '12px',
                    padding: '14px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    outline: 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '1rem' }}>{tpl.name}</span>
                    <span style={{ fontSize: '0.72rem', color: '#60a5fa', background: 'rgba(59,130,246,0.15)', padding: '3px 10px', borderRadius: '9999px', fontWeight: 'bold' }}>
                      {templateFocusIdx === idx ? '↵ Enter to load' : 'Load'}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{tpl.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} initialTab={helpTab} />}

      {/* Hand-drawn aesthetic filter */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <filter id="rough-filter">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
        </filter>
      </svg>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) {
      return <div style={{ color: 'red', padding: 32, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
        <b>Runtime error:</b>{'\n'}{this.state.error?.message}{'\n'}{this.state.error?.stack}
      </div>;
    }
    return this.props.children;
  }
}

export default function App() {
  const hasShareHash = () => {
    const hash = window.location.hash;
    return hash && (
      hash.startsWith('#draw=') ||
      hash.startsWith('#diagram=') ||
      hash.startsWith('#ddd=') ||
      hash.startsWith('#eip=') ||
      hash.startsWith('#cad=')
    );
  };
  const [showStudio, setShowStudio] = useState(hasShareHash());

  return (
    <>
      {showStudio ? (
        <ErrorBoundary>
          <ReactFlowProvider>
            <FlowCanvas onGoHome={() => setShowStudio(false)} />
          </ReactFlowProvider>
        </ErrorBoundary>
      ) : (
        <LandingPage onLaunch={() => setShowStudio(true)} />
      )}
    </>
  );
}
