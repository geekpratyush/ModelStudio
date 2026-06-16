import { useState, useCallback, useRef, useEffect } from 'react';
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
import { Download, Upload, FileJson, Image, PlayCircle, Box, Diamond, Server, Trash2, Database, Cloud, MousePointer2, Hand, Grid3X3, Code, ChevronLeft, ChevronRight, ChevronsDown, ChevronsUp, Filter, ListOrdered, FileText, ShieldCheck, MessageSquare, Send, Skull, Mail, Clock, GitMerge, GitBranch, Workflow, Network, ArrowRightLeft, Route, FilePlus, RefreshCw, Radio, Share2, ListChecks, Scale, Settings2, ArrowDownUp, TerminalSquare, CheckCircle2, PackageOpen, Package, FileArchive, MessageCircle, RadioTower, Webhook, Hexagon, Building2, CloudLightning, BoxSelect, Plug, Zap, Cpu, User, File, Type, Table, Building, Layers, Search, X, Target, Eraser, StickyNote, Info, Pencil, Paintbrush, AlignLeft, AlignCenter, AlignRight, AlignStartVertical, AlignCenterVertical, AlignEndVertical, Triangle, ArrowUpRight, Minus, Circle as CircleIcon, Square } from 'lucide-react';
import ThemeToggle from './components/ThemeToggle';
import { useTheme } from './contexts/ThemeContext';
import * as AllIcons from 'lucide-react';

const allIconNames = Object.keys(AllIcons).filter(k => k[0] === k[0].toUpperCase() && k !== 'LucideIcon' && k !== 'Icon');
import CustomNode from './CustomNode';
import CustomEdge from './CustomEdge';
import LandingPage from './LandingPage';
import './App.css';

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
        { id: "e-ship-bill", source: "core-shipping", target: "gen-billing", label: "Customer/Supplier", animated: true, type: "custom" },
        { id: "e-cat-ship", source: "supp-catalog", target: "core-shipping", label: "ACL", animated: true, type: "custom" }
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
        { id: "e-1", source: "node-cli", target: "node-web", animated: true, type: "custom", label: "HTTP" },
        { id: "e-2", source: "node-web", target: "node-db-inst", animated: true, type: "custom", label: "SQL Connect" }
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
        { id: "e-client-gw", source: "node-client", target: "node-gateway", animated: true, type: "custom", label: "HTTPS" },
        { id: "e-gw-app", source: "node-gateway", target: "node-app", animated: true, type: "custom", label: "gRPC" },
        { id: "e-app-db", source: "node-app", target: "node-db", animated: true, type: "custom", label: "SQL Connect" }
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
        { id: "e-lb-gw", source: "node-lb", target: "node-gw", animated: true, type: "custom" },
        { id: "e-gw-orders", source: "node-gw", target: "node-orders", animated: true, type: "custom" },
        { id: "e-gw-cat", source: "node-gw", target: "node-catalog", animated: true, type: "custom" },
        { id: "e-orders-db", source: "node-orders", target: "node-order-db", animated: true, type: "custom" },
        { id: "e-cat-db", source: "node-catalog", target: "node-catalog-db", animated: true, type: "custom" },
        { id: "e-orders-broker", source: "node-orders", target: "node-broker", animated: true, type: "custom", label: "Publishes" },
        { id: "e-broker-cat", source: "node-broker", target: "node-catalog", animated: true, type: "custom", label: "Consumes" }
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
        { id: "ae-1", source: "ac-cli", target: "ac-dns", animated: true, type: "custom" },
        { id: "ae-2", source: "ac-dns", target: "ac-alb", animated: true, type: "custom" },
        { id: "ae-3", source: "ac-alb", target: "ac-ecs1", animated: true, type: "custom" },
        { id: "ae-4", source: "ac-alb", target: "ac-ecs2", animated: true, type: "custom" },
        { id: "ae-5", source: "ac-ecs1", target: "ac-redis", animated: true, type: "custom", label: "Cache" },
        { id: "ae-6", source: "ac-ecs2", target: "ac-redis", animated: true, type: "custom", label: "Cache" },
        { id: "ae-7", source: "ac-ecs1", target: "ac-pg-prim", animated: true, type: "custom", label: "Write" },
        { id: "ae-8", source: "ac-ecs2", target: "ac-pg-prim", animated: true, type: "custom", label: "Write" },
        { id: "ae-9", source: "ac-pg-prim", target: "ac-pg-rep", animated: true, type: "custom", label: "Replicate", style: { strokeWidth: 3, stroke: '#f59e0b' } }
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
        { id: "e-ftp-log", source: "node-ftp", target: "node-logger-out", animated: true, type: "custom" }
      ]
    },
    {
      name: "2. Content-Based Router Route (Medium)",
      description: "Classic Camel EIP pattern routing a timer-triggered request to a SQL Database or a logger, depending on message body structure.",
      nodes: [
        { id: "node-timer", type: 'custom', position: { x: 50, y: 200 }, data: { label: "Timer", icon: "Clock", color: "#3b82f6", isEip: true } },
        { id: "node-choice", type: 'custom', position: { x: 300, y: 200 }, data: { label: "Choice", icon: "GitBranch", color: "#8b5cf6", isEip: true } },
        { id: "node-when", type: 'custom', position: { x: 550, y: 120 }, data: { label: "When", icon: "Filter", color: "#eab308", isEip: true, expressionType: "simple", expression: "${body} != null" } },
        { id: "node-otherwise", type: 'custom', position: { x: 550, y: 280 }, data: { label: "Otherwise", icon: "RefreshCw", color: "#94a3b8", isEip: true } },
        { id: "node-db", type: 'custom', position: { x: 800, y: 120 }, data: { label: "Database", icon: "Database", color: "#10b981", isEip: true } },
        { id: "node-log", type: 'custom', position: { x: 800, y: 280 }, data: { label: "Log", icon: "TerminalSquare", color: "#ef4444", isEip: true } }
      ],
      edges: [
        { id: "e-timer-choice", source: "node-timer", target: "node-choice", animated: true, type: "custom" },
        { id: "e-choice-when", source: "node-choice", target: "node-when", animated: true, type: "custom" },
        { id: "e-choice-oth", source: "node-choice", target: "node-otherwise", animated: true, type: "custom" },
        { id: "e-when-db", source: "node-when", target: "node-db", animated: true, type: "custom" },
        { id: "e-oth-log", source: "node-otherwise", target: "node-log", animated: true, type: "custom" }
      ]
    },
    {
      name: "3. Wire Tap & Enrich Pipeline (Complex)",
      description: "Diverts incoming message to an Audit Log channel (via Wire Tap) while processing it through a body enricher into a message queue.",
      nodes: [
        { id: "node-trigger", type: 'custom', position: { x: 50, y: 150 }, data: { label: "Timer Trigger", icon: "Clock", color: "#3b82f6", isEip: true } },
        { id: "node-tap", type: 'custom', position: { x: 300, y: 150 }, data: { label: "Wire Tap", icon: "Radio", color: "#d946ef", isEip: true } },
        { id: "node-audit", type: 'custom', position: { x: 550, y: 50 }, data: { label: "Audit Logger", icon: "TerminalSquare", color: "#ef4444", isEip: true } },
        { id: "node-enrich", type: 'custom', position: { x: 550, y: 250 }, data: { label: "setBody Enricher", icon: "Box", color: "#10b981", isEip: true, expressionType: "simple", expression: "Hello from anti-gravity!" } },
        { id: "node-queue", type: 'custom', position: { x: 800, y: 250 }, data: { label: "ActiveMQ Queue", icon: "MessageSquare", color: "#0ea5e9", isEip: true } }
      ],
      edges: [
        { id: "e-t-w", source: "node-trigger", target: "node-tap", animated: true, type: "custom" },
        { id: "e-w-audit", source: "node-tap", target: "node-audit", animated: true, type: "custom", label: "Tapped Copy" },
        { id: "e-w-enrich", source: "node-tap", target: "node-enrich", animated: true, type: "custom", label: "Primary Flow" },
        { id: "e-e-q", source: "node-enrich", target: "node-queue", animated: true, type: "custom" }
      ]
    },
    {
      name: "4. Transactional Saga Pipeline (Very Complex)",
      description: "A highly complex Camel pipeline using Http, Splitters, Choices, Kafka/ActiveMQ messaging, Message Aggregation and final DB storage.",
      nodes: [
        { id: "ts-http", type: 'custom', position: { x: 50, y: 150 }, data: { label: "REST API", icon: "Webhook", color: "#06b6d4", isEip: true } },
        { id: "ts-split", type: 'custom', position: { x: 330, y: 150 }, data: { label: "Splitter", icon: "Workflow", color: "#a855f7", isEip: true } },
        { id: "ts-choice", type: 'custom', position: { x: 610, y: 150 }, data: { label: "Choice (Router)", icon: "GitBranch", color: "#f59e0b", isEip: true } },
        
        { id: "ts-when", type: 'custom', position: { x: 890, y: 70 }, data: { label: "When", icon: "Filter", color: "#eab308", isEip: true, expressionType: "simple", expression: "${body.isPriority} == true" } },
        { id: "ts-other", type: 'custom', position: { x: 890, y: 230 }, data: { label: "Otherwise", icon: "RefreshCw", color: "#94a3b8", isEip: true } },
        
        { id: "ts-kafka", type: 'custom', position: { x: 1170, y: 70 }, data: { label: "Kafka Topic", icon: "RadioTower", color: "#a855f7", isEip: true } },
        { id: "ts-activemq", type: 'custom', position: { x: 1170, y: 230 }, data: { label: "ActiveMQ", icon: "MessageCircle", color: "#ef4444", isEip: true } },
        
        { id: "ts-agg", type: 'custom', position: { x: 1450, y: 150 }, data: { label: "Aggregator", icon: "GitMerge", color: "#8b5cf6", isEip: true } },
        { id: "ts-db", type: 'custom', position: { x: 1730, y: 150 }, data: { label: "Database / JDBC", icon: "Database", color: "#10b981", isEip: true } }
      ],
      edges: [
        { id: "te-1", source: "ts-http", target: "ts-split", animated: true, type: "custom" },
        { id: "te-2", source: "ts-split", target: "ts-choice", animated: true, type: "custom" },
        { id: "te-3", source: "ts-choice", target: "ts-when", animated: true, type: "custom" },
        { id: "te-4", source: "ts-choice", target: "ts-other", animated: true, type: "custom" },
        { id: "te-5", source: "ts-when", target: "ts-kafka", animated: true, type: "custom" },
        { id: "te-6", source: "ts-other", target: "ts-activemq", animated: true, type: "custom" },
        { id: "te-7", source: "ts-kafka", target: "ts-agg", animated: true, type: "custom" },
        { id: "te-8", source: "ts-activemq", target: "ts-agg", animated: true, type: "custom" },
        { id: "te-9", source: "ts-agg", target: "ts-db", animated: true, type: "custom" }
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

function FlowCanvas() {
  const { theme } = useTheme();
  const reactFlowWrapper = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingColor, setDrawingColor] = useState('#3b82f6');
  const [drawFillColor, setDrawFillColor] = useState('transparent');
  const [drawOpacity, setDrawOpacity] = useState(100);
  const [drawingStrokeWidth, setDrawingStrokeWidth] = useState(3);
  const [drawStrokeStyle, setDrawStrokeStyle] = useState('solid'); // 'solid', 'dashed', 'dotted'
  const [currentPath, setCurrentPath] = useState([]);
  const [brandSearch, setBrandSearch] = useState('');

  // Separate states for DDD vs Diagram vs EIP workspaces
  const [dddNodes, setDddNodes, onDddNodesChange] = useNodesState(loadState('dddNodes', initialNodes));
  const [dddEdges, setDddEdges, onDddEdgesChange] = useEdgesState(loadState('dddEdges', initialEdges));
  const [diagramNodes, setDiagramNodes, onDiagramNodesChange] = useNodesState(loadState('diagramNodes', []));
  const [diagramEdges, setDiagramEdges, onDiagramEdgesChange] = useEdgesState(loadState('diagramEdges', []));
  const [drawNodes, setDrawNodes, onDrawNodesChange] = useNodesState(loadState('drawNodes', []));
  const [drawEdges, setDrawEdges, onDrawEdgesChange] = useEdgesState(loadState('drawEdges', []));
  const [eipNodes, setEipNodes, onEipNodesChange] = useNodesState(loadState('eipNodes', []));
  const [eipEdges, setEipEdges, onEipEdgesChange] = useEdgesState(loadState('eipEdges', []));

  const [workspace, setWorkspace] = useState(localStorage.getItem('workspace') || 'ddd');
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
    draw_brands: true
  });

  const toggleSection = (key) => setSectionsOpen(prev => ({ ...prev, [key]: !prev[key] }));
  const expandAll = () => setSectionsOpen({ ddd_strategic: true, ddd_tactical: true, ddd_event: true, flowchart: true, sysarch: true, uml: true, er: true, mindmap: true, eip_core: true, eip_endpoints: true, eip_transforms: true, eip_logic: true, draw_sketch: true, draw_shapes: true, draw_annotations: true, draw_brands: true });
  const collapseAll = () => setSectionsOpen({ ddd_strategic: false, ddd_tactical: false, ddd_event: false, flowchart: false, sysarch: false, uml: false, er: false, mindmap: false, eip_core: false, eip_endpoints: false, eip_transforms: false, eip_logic: false, draw_sketch: false, draw_shapes: false, draw_annotations: false, draw_brands: false });

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const clearCanvas = () => {
    setShowClearConfirm(true);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const key = e.key.toLowerCase();

      // Global hotkeys
      if (key === 'v') { setActiveTool('select'); setIsDrawingMode(false); setInteractionMode('move'); return; }
      if (key === 'h') { setInteractionMode('pan'); return; }

      if (workspace !== 'draw') return;

      switch (key) {
        case '1': setActiveTool('select'); setIsDrawingMode(false); setInteractionMode('move'); break;
        case '2': case 'r': setActiveTool('rectangle'); setIsDrawingMode(false); break;
        case '3': case 'd': setActiveTool('diamond'); setIsDrawingMode(false); break;
        case '4': case 'o': setActiveTool('circle'); setIsDrawingMode(false); break;
        case '5': setActiveTool('arrow'); setIsDrawingMode(false); break;
        case '6': setActiveTool('line'); setIsDrawingMode(false); break;
        case '7': case 'p': setActiveTool('pencil'); setIsDrawingMode(true); break;
        case '8': setActiveTool('text'); setIsDrawingMode(false); break;
        case '9': setActiveTool('note'); setIsDrawingMode(false); break;
        case '0': setActiveTool('triangle'); setIsDrawingMode(false); break;
        case 'c': setActiveTool('cloud'); setIsDrawingMode(false); break;
        case 'l': setActiveTool('line'); setIsDrawingMode(false); break;
        case 'a': setActiveTool('arrow'); setIsDrawingMode(false); break;
        case 'b': toggleSection('draw_brands'); break;
        case 'x': clearCanvas(); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [workspace]);

  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [editorContent, setEditorContent] = useState('');
  const [autoArrangeOnImport, setAutoArrangeOnImport] = useState(true);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [diagramTitle, setDiagramTitle] = useState(() => {
    return localStorage.getItem(`${workspace}-title`) || (
      workspace === 'ddd' ? 'Domain-Driven Design Blueprint' :
      workspace === 'diagram' ? 'System Architecture Topology' :
      workspace === 'draw' ? 'Free-form Draw & Sketch' : 'Camel Route Pipeline'
    );
  });

  useEffect(() => {
    localStorage.setItem('workspace', workspace);
  }, [workspace]);

  const [isRoughGlobal, setIsRoughGlobal] = useState(loadState('isRoughGlobal', true));

  useEffect(() => {
    localStorage.setItem('isRoughGlobal', JSON.stringify(isRoughGlobal));
    // Apply global rough mode ONLY when the setting is toggled, and only to Draw nodes
    if (workspace === 'draw') {
      setDrawNodes(nds => nds.map(n => ({
        ...n,
        data: { ...n.data, isRough: isRoughGlobal }
      })));
    }
  }, [isRoughGlobal]);

  useEffect(() => {
    localStorage.setItem(`${workspace}-title`, diagramTitle);
  }, [diagramTitle, workspace]);
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

  const nodes = workspace === 'ddd' ? dddNodes : (workspace === 'diagram' ? diagramNodes : (workspace === 'draw' ? drawNodes : eipNodes));
  const edges = workspace === 'ddd' ? dddEdges : (workspace === 'diagram' ? diagramEdges : (workspace === 'draw' ? drawEdges : eipEdges));
  const setNodes = workspace === 'ddd' ? setDddNodes : (workspace === 'diagram' ? setDiagramNodes : (workspace === 'draw' ? setDrawNodes : setEipNodes));
  const setEdges = workspace === 'ddd' ? setDddEdges : (workspace === 'diagram' ? setDiagramEdges : (workspace === 'draw' ? setDrawEdges : setEipEdges));
  const onNodesChange = workspace === 'ddd' ? onDddNodesChange : (workspace === 'diagram' ? onDiagramNodesChange : (workspace === 'draw' ? onDrawNodesChange : onEipNodesChange));
  const onEdgesChange = workspace === 'ddd' ? onDddEdgesChange : (workspace === 'diagram' ? onDiagramEdgesChange : (workspace === 'draw' ? onDrawEdgesChange : onEipEdgesChange));

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
  }, [nodes, onNodesChange, setEdges, setNodes]);
  
  const { zoom } = useViewport();

  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  const onMoveEnd = useCallback((event, viewport) => {
    localStorage.setItem('flow-viewport', JSON.stringify(viewport));
  }, []);

  const initialViewport = loadState('flow-viewport', { x: 0, y: 0, zoom: 1 });

  const [bgVariant, setBgVariant] = useState('dots'); // 'dots' or 'plain'
  const [showJson, setShowJson] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge({ ...params, type: 'custom', animated: true, style: { strokeWidth: 3, stroke: '#94a3b8' } }, eds)), [setEdges]);

  const [selectedNodeId, setSelectedNodeId] = useState(null);
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
      const childWidth = 160;
      const gapX = 50;
      const gapY = 50;

      children.forEach((child, index) => {
        const colIndex = index % cols;
        const rowIndex = Math.floor(index / cols);
        
        let posY = 70; // Start below the header
        for (let r = 0; r < rowIndex; r++) {
          const rowChildren = children.slice(r * cols, (r + 1) * cols);
          const rowMaxHeight = Math.max(80, ...rowChildren.map(c => {
            if (c.data?.shape === 'class') return 120;
            if (c.data?.shape === 'actor') return 90;
            return 80;
          }));
          posY += rowMaxHeight + gapY;
        }

        const childInUpdated = updatedNodes.find(un => un.id === child.id);
        if (childInUpdated) {
          childInUpdated.position = {
            x: 40 + colIndex * (childWidth + gapX),
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
        
        let nodeHeight = 80;
        if (child.data?.shape === 'class') nodeHeight = 120;
        else if (child.data?.shape === 'actor') nodeHeight = 90;

        const rightSide = posX + childWidth;
        const bottomSide = posY + nodeHeight;
        
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
      const w = parseInt(updatedNode?.style?.width || 180, 10);
      const h = parseInt(updatedNode?.style?.height || 100, 10);
      
      if (!levelMaxDim[depth]) {
        levelMaxDim[depth] = { width: 0, height: 0 };
      }
      if (w > levelMaxDim[depth].width) levelMaxDim[depth].width = w;
      if (h > levelMaxDim[depth].height) levelMaxDim[depth].height = h;
    });

    const depthOffset = {};
    let currentOffset = 100;
    const maxDepth = Math.max(-1, ...topLevelNodes.map(n => depths[n.id]));
    
    for (let i = 0; i <= maxDepth; i++) {
      depthOffset[i] = currentOffset;
      const maxDim = levelMaxDim[i] || { width: 180, height: 100 };
      currentOffset += (direction === 'LR' ? maxDim.width : maxDim.height) + 150;
    }

    const levelCounts = {};
    topLevelNodes.forEach(n => {
      const depth = depths[n.id];
      levelCounts[depth] = (levelCounts[depth] || 0) + 1;
      const index = levelCounts[depth] - 1;
      
      const updatedNode = updatedNodes.find(un => un.id === n.id);
      if (updatedNode) {
        if (direction === 'LR') {
          updatedNode.position = {
            x: depthOffset[depth],
            y: 100 + index * (levelMaxDim[depth].height + 100)
          };
        } else {
          updatedNode.position = {
            x: 100 + index * (levelMaxDim[depth].width + 120),
            y: depthOffset[depth]
          };
        }
      }
    });

    setNodes(updatedNodes);
    
    setTimeout(() => {
      if (reactFlowInstance) reactFlowInstance.fitView({ padding: 0.2, duration: 800 });
    }, 50);
  };
  const [contextMenu, setContextMenu] = useState(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
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
  const [dragStartPos, setDragStartPos] = useState(null);
  const [ghostNode, setGhostNode] = useState(null);

  const handlePaneMouseDown = useCallback((e) => {
    if (workspace !== 'draw' || activeTool === 'select' || activeTool === 'pencil' || isDrawingMode) return;
    
    const wrapperEl = reactFlowWrapper.current;
    if (!wrapperEl || !reactFlowInstance) return;
    
    const flowPos = reactFlowInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY });
    
    setDragStartPos(flowPos);
    
    // For arrow/line tools, we draw an SVG line overlay, not a ghost node
    if (activeTool === 'arrow' || activeTool === 'line') {
      const id = `ghost-${uuidv4()}`;
      const newGhost = {
        id,
        type: 'custom',
        position: flowPos,
        style: { width: 1, height: 1 },
        data: {
          label: '',
          shape: activeTool,
          isRough: isRoughGlobal,
          fillStyle: 'hachure',
          color: drawingColor,
          strokeWidth: drawingStrokeWidth,
          strokeStyle: drawStrokeStyle,
          opacity: drawOpacity,
          isGhost: true,
          arrowStart: { x: 0, y: 0 },
          arrowEnd: { x: 0, y: 0 }
        }
      };
      setGhostNode(newGhost);
      setDrawNodes(nds => nds.concat(newGhost));
      return;
    }
    
    const id = `ghost-${uuidv4()}`;
    const newGhost = {
      id,
      type: 'custom',
      position: flowPos,
      style: { width: 1, height: 1 },
      data: {
        label: '',
        shape: activeTool,
        isRough: isRoughGlobal,
        fillStyle: 'hachure',
        color: drawingColor,
        fillColor: drawFillColor,
        strokeWidth: drawingStrokeWidth,
        strokeStyle: drawStrokeStyle,
        opacity: drawOpacity,
        isGhost: true
      }
    };
    setGhostNode(newGhost);
    setDrawNodes(nds => nds.concat(newGhost));
  }, [workspace, activeTool, isDrawingMode, isRoughGlobal, drawingColor, drawFillColor, drawingStrokeWidth, drawStrokeStyle, drawOpacity, reactFlowInstance]);

  const handlePaneMouseMove = useCallback((e) => {
    if (!dragStartPos || !ghostNode) return;
    
    const flowPos = reactFlowInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY });
    
    // For arrow/line, update the endpoint coordinates
    if (ghostNode.data.shape === 'arrow' || ghostNode.data.shape === 'line') {
      const x = Math.min(flowPos.x, dragStartPos.x);
      const y = Math.min(flowPos.y, dragStartPos.y);
      const width = Math.abs(flowPos.x - dragStartPos.x);
      const height = Math.abs(flowPos.y - dragStartPos.y);
      
      setDrawNodes(nds => nds.map(n => {
        if (n.id === ghostNode.id) {
          return {
            ...n,
            position: { x, y },
            style: { width: Math.max(width, 2), height: Math.max(height, 2) },
            data: {
              ...n.data,
              arrowStart: { x: dragStartPos.x - x, y: dragStartPos.y - y },
              arrowEnd: { x: flowPos.x - x, y: flowPos.y - y }
            }
          };
        }
        return n;
      }));
      return;
    }
    
    const width = Math.abs(flowPos.x - dragStartPos.x);
    const height = Math.abs(flowPos.y - dragStartPos.y);
    const x = Math.min(flowPos.x, dragStartPos.x);
    const y = Math.min(flowPos.y, dragStartPos.y);
    
    setDrawNodes(nds => nds.map(n => {
      if (n.id === ghostNode.id) {
        return {
          ...n,
          position: { x, y },
          style: { width, height }
        };
      }
      return n;
    }));
  }, [dragStartPos, ghostNode, reactFlowInstance]);

  const handlePaneMouseUp = useCallback(() => {
    if (!ghostNode) return;
    
    // Enforce minimum size or use default and finalize
    setDrawNodes(nds => nds.map(n => {
      if (n.id === ghostNode.id) {
        let w = n.style?.width || 0;
        let h = n.style?.height || 0;
        
        // If it's just a click (very small drag), give it a default size
        if (w < 5 && h < 5 && n.data.shape !== 'arrow' && n.data.shape !== 'line') {
          w = n.data.shape === 'note' ? 160 : 150;
          h = n.data.shape === 'note' ? 160 : 80;
        } else if (w < 10 && h < 10 && n.data.shape !== 'arrow' && n.data.shape !== 'line') {
          return null; // Accidental small drag, remove
        }

        return { 
          ...n, 
          data: { ...n.data, isGhost: false },
          style: { 
            ...n.style, 
            width: Math.max(w, 20), 
            height: Math.max(h, 20) 
          }
        };
      }
      return n;
    }).filter(Boolean));
    
    setSelectedNodeId(ghostNode.id);
    setDragStartPos(null);
    setGhostNode(null);
  }, [ghostNode]);

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
        fillStyle: 'hachure'
      }
    };

    if (shapeType === 'note') {
      newNode.style = { width: 160, height: 160 };
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
        fillStyle: 'hachure',
        color: colorOverride || drawingColor,
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

  const handleDrawingStart = (e) => {
    e.preventDefault();
    const wrapperEl = reactFlowWrapper.current;
    if (!wrapperEl || !reactFlowInstance) return;
    const rect = wrapperEl.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const flowPos = reactFlowInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY });
    
    setCurrentPath([{ screenX, screenY, flowX: flowPos.x, flowY: flowPos.y }]);
    setIsDrawing(true);
  };

  const handleDrawingMove = (e) => {
    if (!isDrawing || !reactFlowInstance) return;
    const wrapperEl = reactFlowWrapper.current;
    if (!wrapperEl) return;
    const rect = wrapperEl.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const flowPos = reactFlowInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY });
    
    setCurrentPath((prev) => {
      const last = prev[prev.length - 1];
      if (last && Math.abs(last.flowX - flowPos.x) < 0.5 && Math.abs(last.flowY - flowPos.y) < 0.5) return prev;
      return [...prev, { screenX, screenY, flowX: flowPos.x, flowY: flowPos.y }];
    });
  };

  const handleDrawingEnd = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    if (currentPath.length < 2) {
      setCurrentPath([]);
      return;
    }

    // Try to detect if drawing connects two nodes
    const firstPoint = currentPath[0];
    const lastPoint = currentPath[currentPath.length - 1];
    
    const currentNodes = reactFlowInstance.getNodes();
    
    const findClosestNode = (point) => {
      let closest = null;
      let minDistance = 120; // threshold
      
      currentNodes.forEach((node) => {
        let w = node.style?.width || (node.data?.shape === 'note' ? 160 : 120);
        let h = node.style?.height || (node.data?.shape === 'note' ? 160 : 60);
        if (typeof w === 'string') w = parseInt(w) || 120;
        if (typeof h === 'string') h = parseInt(h) || 60;
        
        const centerX = node.position.x + w / 2;
        const centerY = node.position.y + h / 2;
        
        const dist = Math.sqrt(
          Math.pow(point.flowX - centerX, 2) + Math.pow(point.flowY - centerY, 2)
        );
        
        if (dist < minDistance) {
          minDistance = dist;
          closest = node;
        }
      });
      
      return closest;
    };

    const startNode = findClosestNode(firstPoint);
    const endNode = findClosestNode(lastPoint);

    if (startNode && endNode && startNode.id !== endNode.id) {
      // Convert to connector (edge)
      const newEdge = {
        id: `pencil-edge-${uuidv4()}`,
        source: startNode.id,
        target: endNode.id,
        animated: true,
        type: 'custom',
        label: 'Connector'
      };
      setEdges((eds) => eds.concat(newEdge));
    } else {
      // Keep as freehand sketch node
      const flowPoints = currentPath.map(p => ({ x: p.flowX, y: p.flowY }));
      const minX = Math.min(...flowPoints.map(p => p.x));
      const maxX = Math.max(...flowPoints.map(p => p.x));
      const minY = Math.min(...flowPoints.map(p => p.y));
      const maxY = Math.max(...flowPoints.map(p => p.y));
      
      const width = maxX - minX;
      const height = maxY - minY;
      
      // Normalize local points
      const localPoints = flowPoints.map(p => [
        p.x - minX,
        p.y - minY
      ]);

      const newNode = {
        id: `drawing-${uuidv4()}`,
        type: 'custom',
        position: { x: minX, y: minY },
        style: { width: Math.max(width, 20), height: Math.max(height, 20) },
        data: {
          shape: 'drawing',
          points: localPoints,
          color: drawingColor,
          strokeWidth: drawingStrokeWidth,
          label: 'Freehand Sketch',
          isRough: isRoughGlobal,
          fillStyle: 'hachure'
        }
      };
      
      setNodes((nds) => nds.concat(newNode));
    }
    
    setCurrentPath([]);
  };

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
    let shape = 'box';

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

    const newNode = {
      id: uuidv4(),
      type: 'custom',
      position: {
        x: targetNode.position.x + (direction === 'after' ? 200 : -200),
        y: targetNode.position.y
      },
      data: { label, icon, color, shape, isEip: workspace === 'eip' },
    };

    setNodes((nds) => nds.concat(newNode));

    if (direction === 'after') {
      const outgoingEdge = edges.find(e => e.source === targetNodeId);
      if (outgoingEdge) {
        setEdges(eds => eds.map(e => e.id === outgoingEdge.id ? { ...e, source: newNode.id } : e));
      }
      setEdges((eds) => addEdge({ source: targetNodeId, target: newNode.id, ...defaultEdgeOptions }, eds));
    } else {
      const incomingEdge = edges.find(e => e.target === targetNodeId);
      if (incomingEdge) {
        setEdges(eds => eds.map(e => e.id === incomingEdge.id ? { ...e, target: newNode.id } : e));
      }
      setEdges((eds) => addEdge({ source: newNode.id, target: targetNodeId, ...defaultEdgeOptions }, eds));
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
            position.y = lastNode.position.y + 120;
          }

          const newNodeId = uuidv4();
          const newNode = {
            id: newNodeId,
            type: 'custom',
            position,
            parentId,
            extent: parentId ? 'parent' : undefined,
            data: { ...data, isEip: true },
          };

          const newEdge = {
            id: uuidv4(),
            source: lastNode.id,
            target: newNodeId,
            ...defaultEdgeOptions
          };

          // Special handling for Choice
          if (data.label.includes('Choice')) {
             const whenNode = {
               id: uuidv4(), type: 'custom',
               position: { x: position.x + 160, y: position.y - 60 },
               data: { label: 'When', icon: 'Filter', color: '#eab308', shape: '', isEip: true }
             };
             const otherwiseNode = {
               id: uuidv4(), type: 'custom',
               position: { x: position.x + 160, y: position.y + 60 },
               data: { label: 'Otherwise', icon: 'RefreshCw', color: '#94a3b8', shape: '', isEip: true }
             };
             setNodes(nds => nds.concat(newNode, whenNode, otherwiseNode));
             setEdges(eds => eds.concat(
               newEdge,
               { id: uuidv4(), source: newNodeId, target: whenNode.id, ...defaultEdgeOptions },
               { id: uuidv4(), source: newNodeId, target: otherwiseNode.id, ...defaultEdgeOptions }
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
        style: data.isContainer ? { width: 400, height: 300, zIndex: -1 } : (data.shape === 'note' ? { width: 160, height: 160 } : (data.shape === 'callout' ? { width: 200, height: 80 } : (data.shape === 'brand' ? { width: 80, height: 80 } : undefined))),
        data: { ...data, isRough: workspace === 'draw' ? isRoughGlobal : false },
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
  }, [setNodes]);

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
      reactFlowInstance.fitView({ padding: 0.2, duration: 800, minZoom: 1, maxZoom: 1 });
    }
  };

  const exportLayout = (format) => {
    const data = { nodes, edges };
    let payloadStr;
    let mimeType;
    let filename;

    const baseName = diagramTitle.toLowerCase().replace(/\s+/g, '-');

    if (format === 'json') {
      payloadStr = JSON.stringify(data, null, 2);
      mimeType = 'application/json';
      filename = `${baseName}-layout.json`;
    } else {
      payloadStr = yaml.dump(data, { indent: 2, skipInvalid: true });
      mimeType = 'text/yaml';
      filename = `${baseName}-layout.yaml`;
    }

    const blob = new Blob([payloadStr], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportCamelRoute = () => {
    const payloadStr = generateYaml();
    const baseName = diagramTitle.toLowerCase().replace(/\s+/g, '-');
    const filename = `${baseName}-routes.yaml`;

    const blob = new Blob([payloadStr], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
        }, 100);
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
          }, 100);
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
    }, 100);
  };

  const exportAsPng = () => {
    if (nodes.length === 0) return;
    const nodesBounds = getNodesBounds(nodes);
    const padding = 50;
    const width = nodesBounds.width + padding * 2;
    const height = nodesBounds.height + padding * 2;
    
    const transform = {
      x: -nodesBounds.x + padding,
      y: -nodesBounds.y + padding,
      zoom: 1
    };

    const viewportEl = document.querySelector('.react-flow__viewport');
    if (!viewportEl) return;

    toPng(viewportEl, {
      backgroundColor: theme === 'dark' ? '#0f111a' : '#ffffff',
      width: width,
      height: height,
      style: {
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
      },
    })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `${diagramTitle.toLowerCase().replace(/\s+/g, '-')}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((error) => {
        console.error('Error exporting PNG:', error);
      });
  };

  const exportAsSvg = () => {
    if (nodes.length === 0) return;
    const nodesBounds = getNodesBounds(nodes);
    const padding = 50;
    const width = nodesBounds.width + padding * 2;
    const height = nodesBounds.height + padding * 2;
    
    const transform = {
      x: -nodesBounds.x + padding,
      y: -nodesBounds.y + padding,
      zoom: 1
    };

    const viewportEl = document.querySelector('.react-flow__viewport');
    if (!viewportEl) return;

    toSvg(viewportEl, {
      backgroundColor: theme === 'dark' ? '#0f111a' : '#ffffff',
      width: width,
      height: height,
      style: {
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
      },
    })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `${diagramTitle.toLowerCase().replace(/\s+/g, '-')}.svg`;
        link.href = dataUrl;
        link.click();
      })
      .catch((error) => {
        console.error('Error exporting SVG:', error);
      });
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
    <div className="app-container">
      {workspace !== 'draw' && (
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
            {workspace === 'draw' ? (
              <div className="draw-sidebar-inner" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                  <button 
                    className={`draw-tool-btn ${activeTool === 'select' ? 'active' : ''}`}
                    onClick={() => { setActiveTool('select'); setIsDrawingMode(false); setInteractionMode('move'); }}
                    data-tooltip="Selection (V)"
                  >
                    <MousePointer2 size={20} />
                  </button>
                  <button 
                    className={`draw-tool-btn ${activeTool === 'pencil' ? 'active' : ''}`}
                    onClick={() => { setActiveTool('pencil'); setIsDrawingMode(true); }}
                    data-tooltip="Pencil (P)"
                  >
                    <Pencil size={20} />
                  </button>
                  <div style={{ width: '30px', height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />
                  
                  <button className={`draw-tool-btn ${activeTool === 'rectangle' ? 'active' : ''}`} onClick={() => setActiveTool('rectangle')} data-tooltip="Rectangle (R)"><Box size={20} /></button>
                  <button className={`draw-tool-btn ${activeTool === 'diamond' ? 'active' : ''}`} onClick={() => setActiveTool('diamond')} data-tooltip="Diamond (D)"><Diamond size={20} /></button>
                  <button className={`draw-tool-btn ${activeTool === 'circle' ? 'active' : ''}`} onClick={() => setActiveTool('circle')} data-tooltip="Circle (O)"><PlayCircle size={20} /></button>
                  <button className={`draw-tool-btn ${activeTool === 'triangle' ? 'active' : ''}`} onClick={() => setActiveTool('triangle')} data-tooltip="Triangle (T)"><Hexagon size={20} style={{ transform: 'rotate(90deg)' }} /></button>
                  <button className={`draw-tool-btn ${activeTool === 'cloud' ? 'active' : ''}`} onClick={() => setActiveTool('cloud')} data-tooltip="Cloud (C)"><Cloud size={20} /></button>
                  <button className={`draw-tool-btn ${activeTool === 'note' ? 'active' : ''}`} onClick={() => setActiveTool('note')} data-tooltip="Sticky Note (S)"><StickyNote size={20} /></button>
                  
                  <div style={{ width: '30px', height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />
                  
                  <button className={`draw-tool-btn ${activeTool === 'text' ? 'active' : ''}`} onClick={() => setActiveTool('text')} data-tooltip="Text (T)"><Type size={20} /></button>
                  <button className="draw-tool-btn" onClick={() => imageInputRef.current?.click()} data-tooltip="Insert Image"><Image size={20} /></button>
                </div>
                
                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '20px' }}>
                   <div style={{ width: '30px', height: '1px', background: 'var(--border-color)', margin: '4px auto' }} />
                   <button 
                     className={`draw-tool-btn ${isRoughGlobal ? 'active' : ''}`}
                     onClick={() => setIsRoughGlobal(!isRoughGlobal)}
                     data-tooltip="Toggle Hand-drawn Look"
                   >
                     <Paintbrush size={20} />
                   </button>
                   <button className="draw-tool-btn" onClick={clearCanvas} data-tooltip="Clear Canvas" style={{ color: '#ef4444' }}><Eraser size={20} /></button>
                   
                   <div style={{ width: '30px', height: '1px', background: 'var(--border-color)', margin: '4px auto' }} />
                   <button className="draw-tool-btn" onClick={() => toggleSection('draw_brands')} data-tooltip="Brand Library & Tech Icons"><Package size={20} /></button>
                </div>
                
                {sectionsOpen.draw_brands && (
                  <div style={{ position: 'fixed', left: '60px', top: '200px', width: '220px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', boxShadow: '10px 0 30px rgba(0,0,0,0.3)', zIndex: 200 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Brand Library</span>
                      <X size={14} style={{ cursor: 'pointer' }} onClick={() => toggleSection('draw_brands')} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '4px 8px', marginBottom: '8px' }}>
                      <Search size={14} style={{ marginRight: '6px', color: 'var(--text-secondary)' }} />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={brandSearch}
                        onChange={(e) => setBrandSearch(e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.8rem', outline: 'none', width: '100%' }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
                      {BRAND_ICONS.filter(b => b.name.toLowerCase().includes(brandSearch.toLowerCase()) || b.tags.toLowerCase().includes(brandSearch.toLowerCase())).map((b) => (
                        <div
                          key={b.name}
                          onClick={() => {
                            addDrawNode('brand', b.name, null, b.svg, b.color);
                            toggleSection('draw_brands');
                          }}
                          style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center'
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.borderColor = b.color; e.currentTarget.style.background = `${b.color}11`; }}
                          onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
                        >
                          <div style={{ width: 24, height: 24, marginBottom: '4px' }} dangerouslySetInnerHTML={{ __html: b.svg }} />
                          <span style={{ fontSize: '0.6rem', color: 'var(--text-primary)', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden' }}>{b.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
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

                {/* General Annotations & Widgets */}
                <CollapsibleSection title="Annotations & Notes" isOpen={sectionsOpen.annotations} onToggle={() => toggleSection('annotations')}>
                  <PaletteItem label="Title / Header" icon={Type} color="var(--text-primary)" type="Type" shape="text" />
                  <PaletteItem label="Sticky Note" icon={StickyNote} color="#fef08a" type="StickyNote" shape="note" />
                </CollapsibleSection>
              </>
            )}
          </div>
        </div>
      </aside>
      )}
      
      <main className={`canvas-area ${theme === 'dark' ? 'theme-dark' : 'theme-light'}`} ref={reactFlowWrapper}>
        {(isDrawingMode || (workspace === 'draw' && activeTool !== 'select') || ghostNode) && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 10,
              cursor: 'crosshair',
              pointerEvents: 'auto'
            }}
            onMouseDown={(e) => {
              if (isDrawingMode) handleDrawingStart(e);
              else handlePaneMouseDown(e);
            }}
            onMouseMove={(e) => {
              if (isDrawingMode) handleDrawingMove(e);
              else handlePaneMouseMove(e);
            }}
            onMouseUp={() => {
              if (isDrawingMode) handleDrawingEnd();
              else handlePaneMouseUp();
            }}
            onMouseLeave={() => {
              if (isDrawingMode) handleDrawingEnd();
              else handlePaneMouseUp();
            }}
          >
            {currentPath.length > 1 && (
              <svg
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                  overflow: 'visible'
                }}
              >
                <path
                  d={`M ${currentPath.map(p => `${p.screenX} ${p.screenY}`).join(' L ')}`}
                  fill="none"
                  stroke={drawingColor}
                  strokeWidth={drawingStrokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        )}

        <ReactFlow
          nodes={nodes}
          proOptions={{ hideAttribution: true }}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeContextMenu={onNodeContextMenu}
          onPaneClick={() => { setContextMenu(null); setShowJson(false); }}
          onMoveEnd={onMoveEnd}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          panOnDrag={!isDrawingMode && interactionMode === 'pan'}
          selectionOnDrag={!isDrawingMode && interactionMode === 'move'}
          nodesDraggable={!isDrawingMode}
          nodesConnectable={!isDrawingMode}
          elementsSelectable={!isDrawingMode}
          zoomOnScroll={true}
          panOnScroll={false}
          defaultViewport={initialViewport}
          colorMode={theme}
          defaultEdgeOptions={defaultEdgeOptions}
          deleteKeyCode={['Backspace', 'Delete']}
          >
          {bgVariant === 'dots' && <Background color={theme === 'dark' ? '#fff' : '#000'} gap={16} size={1} opacity={theme === 'dark' ? 0.1 : 0.05} variant="dots" />}
          <Controls />

          {/* Interaction & Background Toolbar */}
          <Panel position="bottom-center">
            <div className="toolbar" style={{ position: 'relative', top: 0, right: 0, marginBottom: '20px' }}>

               <button
                 className={`btn btn-icon-only ${interactionMode === 'move' ? 'btn-primary' : ''}`}
 
                onClick={() => setInteractionMode('move')}
                title="Select & Move (V)"
              >
                <MousePointer2 size={18} />
              </button>
              <button 
                className={`btn btn-icon-only ${interactionMode === 'pan' ? 'btn-primary' : ''}`} 
                onClick={() => setInteractionMode('pan')}
                title="Pan Canvas (H)"
              >
                <Hand size={18} />
              </button>
              
              <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 4px' }}></div>
              
              <button 
                className={`btn btn-icon-only ${bgVariant === 'dots' ? 'btn-primary' : ''}`} 
                onClick={() => setBgVariant(bgVariant === 'dots' ? 'plain' : 'dots')}
                title="Toggle Canvas Background"
              >
                <Grid3X3 size={18} />
              </button>

              <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 4px' }}></div>
              
              <button 
                className="btn btn-icon-only" 
                onClick={() => autoLayout('LR')}
                title="Auto Layout (Left to Right)"
              >
                <ArrowRightLeft size={18} />
              </button>
              <button 
                className="btn btn-icon-only" 
                onClick={() => autoLayout('TB')}
                title="Auto Layout (Top to Bottom)"
              >
                <ArrowDownUp size={18} />
              </button>

              <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 4px' }}></div>
              
              <button 
                className="btn btn-icon-only" 
                onClick={resetZoom}
                title="Reset Zoom to 100%"
              >
                <Target size={18} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                {Math.round(zoom * 100)}%
              </div>
            </div>
          </Panel>
           {workspace === 'draw' && (
             <Panel position="top-center" style={{ top: '10px', zIndex: 1000 }}>
               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                 {/* Main Drawing Tools Toolbar */}
                 <div className="toolbar draw-tool-palette" style={{
                   background: 'var(--bg-secondary)',
                   padding: '4px',
                   borderRadius: '12px',
                   display: 'flex',
                   gap: '2px',
                   alignItems: 'center',
                   boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
                   border: '1px solid var(--border-color)',
                   backdropFilter: 'blur(8px)'
                 }}>

                   {/* 1 - Selection */}
                   <button 
                     className={`draw-excali-btn ${(!isDrawingMode && activeTool === 'select') ? 'active' : ''}`}
                     onClick={() => { setActiveTool('select'); setIsDrawingMode(false); setInteractionMode('move'); }}
                     title="Selection — V or 1"
                   >
                     <MousePointer2 size={18} />
                   </button>
                   {/* Hand/Pan */}
                   <button 
                     className={`draw-excali-btn ${interactionMode === 'pan' ? 'active' : ''}`}
                     onClick={() => { setInteractionMode(interactionMode === 'pan' ? 'move' : 'pan'); }}
                     title="Hand (pan) — H"
                   >
                     <Hand size={18} />
                   </button>

                   <div className="draw-excali-separator" />

                   {/* 2 - Rectangle */}
                   <button 
                     className={`draw-excali-btn ${activeTool === 'rectangle' ? 'active' : ''}`}
                     onClick={() => { setActiveTool('rectangle'); setIsDrawingMode(false); setInteractionMode('move'); }}
                     title="Rectangle — R or 2"
                   >
                     <Square size={18} />
                   </button>
                   {/* 3 - Diamond */}
                   <button 
                     className={`draw-excali-btn ${activeTool === 'diamond' ? 'active' : ''}`}
                     onClick={() => { setActiveTool('diamond'); setIsDrawingMode(false); setInteractionMode('move'); }}
                     title="Diamond — D or 3"
                   >
                     <Diamond size={18} />
                   </button>
                   {/* 4 - Ellipse */}
                   <button 
                     className={`draw-excali-btn ${activeTool === 'circle' ? 'active' : ''}`}
                     onClick={() => { setActiveTool('circle'); setIsDrawingMode(false); setInteractionMode('move'); }}
                     title="Ellipse — O or 4"
                   >
                     <CircleIcon size={18} />
                   </button>
                   {/* 5 - Arrow */}
                   <button 
                     className={`draw-excali-btn ${activeTool === 'arrow' ? 'active' : ''}`}
                     onClick={() => { setActiveTool('arrow'); setIsDrawingMode(false); setInteractionMode('move'); }}
                     title="Arrow — A or 5"
                   >
                     <ArrowUpRight size={18} />
                   </button>
                   {/* 6 - Line */}
                   <button 
                     className={`draw-excali-btn ${activeTool === 'line' ? 'active' : ''}`}
                     onClick={() => { setActiveTool('line'); setIsDrawingMode(false); setInteractionMode('move'); }}
                     title="Line — L or 6"
                   >
                     <Minus size={18} />
                   </button>

                   <div className="draw-excali-separator" />

                   {/* 7 - Pencil / Freedraw */}
                   <button 
                     className={`draw-excali-btn ${isDrawingMode ? 'active' : ''}`}
                     onClick={() => { setActiveTool('pencil'); setIsDrawingMode(true); }}
                     title="Freedraw — P or 7"
                   >
                     <Pencil size={18} />
                   </button>
                   {/* 8 - Text */}
                   <button 
                     className={`draw-excali-btn ${activeTool === 'text' ? 'active' : ''}`}
                     onClick={() => { setActiveTool('text'); setIsDrawingMode(false); setInteractionMode('move'); }}
                     title="Text — 8"
                   >
                     <Type size={18} />
                   </button>

                   <div className="draw-excali-separator" />

                   {/* Extra shapes */}
                   <button 
                     className={`draw-excali-btn ${activeTool === 'triangle' ? 'active' : ''}`}
                     onClick={() => { setActiveTool('triangle'); setIsDrawingMode(false); setInteractionMode('move'); }}
                     title="Triangle — 0"
                   >
                     <Triangle size={18} />
                   </button>
                   <button 
                     className={`draw-excali-btn ${activeTool === 'cloud' ? 'active' : ''}`}
                     onClick={() => { setActiveTool('cloud'); setIsDrawingMode(false); setInteractionMode('move'); }}
                     title="Cloud — C"
                   >
                     <Cloud size={18} />
                   </button>
                   {/* 9 - Sticky Note */}
                   <button 
                     className={`draw-excali-btn ${activeTool === 'note' ? 'active' : ''}`}
                     onClick={() => { setActiveTool('note'); setIsDrawingMode(false); setInteractionMode('move'); }}
                     title="Sticky Note — 9"
                   >
                     <StickyNote size={18} />
                   </button>

                   <div className="draw-excali-separator" />

                   {/* Insert Image */}
                   <button className="draw-excali-btn" onClick={() => imageInputRef.current?.click()} title="Insert Image">
                     <Image size={18} />
                   </button>
                   {/* Brand Library */}
                   <button className="draw-excali-btn" onClick={() => setShowIconPicker(true)} title="Brand Library — B">
                     <Package size={18} />
                   </button>

                   <div className="draw-excali-separator" />

                   {/* Rough mode toggle */}
                   <button 
                     className={`draw-excali-btn ${isRoughGlobal ? 'active' : ''}`}
                     onClick={() => setIsRoughGlobal(!isRoughGlobal)}
                     title="Hand-drawn style"
                   >
                     <Paintbrush size={18} />
                   </button>
                   {/* Clear */}
                   <button className="draw-excali-btn" onClick={clearCanvas} title="Clear Canvas" style={{ color: '#ef4444' }}>
                     <Eraser size={18} />
                   </button>
                 </div>
               </div>
             </Panel>
           )}

           {workspace === 'draw' && activeTool !== 'select' && (
             <Panel position="top-left" style={{ top: '60px', left: '10px', zIndex: 1000 }}>
               <div className="draw-style-panel" style={{
                 background: 'var(--bg-secondary)',
                 padding: '12px 16px',
                 borderRadius: '10px',
                 display: 'flex',
                 flexDirection: 'column',
                 gap: '12px',
                 alignItems: 'flex-start',
                 boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                 border: '1px solid var(--border-color)',
                 backdropFilter: 'blur(8px)',
                 fontSize: '0.75rem',
                 width: '200px'
               }}>
                 {/* Stroke Color */}
                 <div style={{ width: '100%' }}>
                   <div style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '6px' }}>Stroke</div>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                     {['#1e1e1e', '#e03131', '#2f9e44', '#1971c2', '#f08c00', '#6741d9', '#e8590c', '#f783ac'].map(c => (
                       <button 
                         key={c}
                         onClick={() => setDrawingColor(c)}
                         style={{ 
                           width: '100%', aspectRatio: '1', borderRadius: '4px', border: drawingColor === c ? '2px solid var(--accent-blue)' : '1px solid var(--border-color)', 
                           background: c, cursor: 'pointer', padding: 0, transition: 'transform 0.15s',
                           transform: drawingColor === c ? 'scale(1.15)' : 'scale(1)'
                         }}
                       />
                     ))}
                   </div>
                   <input 
                     type="color" value={drawingColor} onChange={(e) => setDrawingColor(e.target.value)}
                     style={{ width: '100%', height: '24px', padding: 0, border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', background: 'transparent', marginTop: '6px' }}
                     title="Custom color"
                   />
                 </div>

                 {/* Fill Color */}
                 {!['pencil', 'arrow', 'line', 'text'].includes(activeTool) && (
                   <div style={{ width: '100%', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                     <div style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '6px' }}>Fill</div>
                     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                       <button 
                         onClick={() => setDrawFillColor('transparent')}
                         style={{ 
                           width: '100%', aspectRatio: '1', borderRadius: '4px', 
                           border: drawFillColor === 'transparent' ? '2px solid var(--accent-blue)' : '1px solid var(--border-color)', 
                           background: 'repeating-conic-gradient(#ccc 0% 25%, white 0% 50%) 50% / 8px 8px',
                           cursor: 'pointer', padding: 0
                         }}
                         title="No fill"
                       />
                       {['#ffc9c9', '#b2f2bb', '#a5d8ff', '#ffec99', '#d0bfff', '#ffd8a8'].map(c => (
                         <button 
                           key={c}
                           onClick={() => setDrawFillColor(c)}
                           style={{ 
                             width: '100%', aspectRatio: '1', borderRadius: '4px', border: drawFillColor === c ? '2px solid var(--accent-blue)' : '1px solid var(--border-color)', 
                             background: c, cursor: 'pointer', padding: 0
                           }}
                         />
                       ))}
                     </div>
                   </div>
                 )}

                 {/* Stroke Width */}
                 <div style={{ width: '100%', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                   <div style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '6px' }}>Width</div>
                   <div style={{ display: 'flex', gap: '3px' }}>
                     {[1, 2, 4, 6].map(w => (
                       <button 
                         key={w}
                         onClick={() => setDrawingStrokeWidth(w)}
                         className={`draw-excali-btn-sm ${drawingStrokeWidth === w ? 'active' : ''}`}
                         title={`${w}px`}
                         style={{ flex: 1 }}
                       >
                         {w}
                       </button>
                     ))}
                   </div>
                 </div>

                 {/* Stroke Style */}
                 <div style={{ width: '100%', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                   <div style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '6px' }}>Style</div>
                   <div style={{ display: 'flex', gap: '3px' }}>
                     {['solid', 'dashed', 'dotted'].map(s => (
                       <button 
                         key={s}
                         onClick={() => setDrawStrokeStyle(s)}
                         className={`draw-excali-btn-sm ${drawStrokeStyle === s ? 'active' : ''}`}
                         title={s}
                         style={{ flex: 1, textTransform: 'capitalize', fontSize: '0.65rem' }}
                       >
                         {s}
                       </button>
                     ))}
                   </div>
                 </div>

                 {/* Opacity */}
                 <div style={{ width: '100%', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                     <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Opacity</span>
                     <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>{drawOpacity}%</span>
                   </div>
                   <input 
                     type="range" 
                     min="10" max="100" 
                     value={drawOpacity} 
                     onChange={(e) => setDrawOpacity(parseInt(e.target.value))}
                     style={{ width: '100%', accentColor: '#3b82f6', height: '3px' }}
                   />
                 </div>
               </div>
             </Panel>
           )}

          <Panel position="top-left" style={{ margin: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', backdropFilter: 'blur(8px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRight: '1px solid var(--border-color)', paddingRight: '12px', marginRight: '4px' }}>
                <Box size={20} color="#3b82f6" />
                <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>Modeler Studio</span>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {['ddd', 'diagram', 'draw', 'eip'].map((ws) => (
                  <button
                    key={ws}
                    onClick={() => setWorkspace(ws)}
                    className={`btn ${workspace === ws ? 'btn-primary' : ''}`}
                    style={{ 
                      fontSize: '0.75rem', 
                      padding: '4px 10px', 
                      textTransform: 'none',
                      background: workspace === ws ? undefined : 'transparent',
                      border: workspace === ws ? undefined : 'none'
                    }}
                  >
                    {ws === 'ddd' ? 'Domain Driven Design' : (ws === 'eip' ? 'Camel' : (ws === 'diagram' ? 'Diagrams' : 'Draw'))}
                  </button>
                ))}
              </div>
            </div>
          </Panel>

          <Panel position="top-right">
            <div className="toolbar" style={{ position: 'relative' }}>
              <button className="btn" onClick={() => setShowTemplatesModal(true)} style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid var(--accent-blue)', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa' }}>
                <Layers size={14} /> Templates
              </button>
              
              {workspace !== 'eip' && (
                <>
                  <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 4px' }}></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button className="btn btn-icon-only" onClick={() => addCanvasWidget('text')} style={{ border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }} title="Insert Title / Text Header">
                      <Type size={16} />
                    </button>
                    <button className="btn btn-icon-only" onClick={() => addCanvasWidget('note')} style={{ border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }} title="Insert Sticky Note">
                      <StickyNote size={16} />
                    </button>
                    <button className="btn btn-icon-only" onClick={() => addCanvasWidget('callout')} style={{ border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }} title="Insert Callout Box">
                      <Info size={16} />
                    </button>
                  </div>
                </>
              )}
              
              <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 4px' }}></div>
              
              <button className="btn btn-icon-only" onClick={() => setShowJson(!showJson)} title="View Model Source (JSON/YAML)">
                <Code size={16} />
              </button>
              <button className="btn btn-icon-only" onClick={clearCanvas} title="Clear Everything (Reset Canvas)">
                <Eraser size={16} />
              </button>
              <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 4px' }}></div>

              <ThemeToggle />
              <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 4px' }}></div>

              <button className="btn btn-icon-only" onClick={() => setShowTextEditor(true)} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: theme === 'dark' ? '#fff' : 'var(--text-primary)' }} title="Import diagram from JSON/YAML text">

                <FilePlus size={16} />
              </button>
              <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 4px' }}></div>
              <button className="btn" onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} title="Load JSON/YAML diagram from disk">
                <Upload size={14} /> Import
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImportFile} 
                accept=".json,.yaml,.yml" 
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
                    <button className="btn" onClick={() => { exportLayout('json'); setShowExportDropdown(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left', width: '100%', border: 'none', padding: '8px 12px', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.8rem', cursor: 'pointer' }}>
                      <FileJson size={14} /> Export Layout (JSON)
                    </button>
                    <button className="btn" onClick={() => { exportLayout('yaml'); setShowExportDropdown(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left', width: '100%', border: 'none', padding: '8px 12px', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.8rem', cursor: 'pointer' }}>
                      <FileText size={14} /> Export Layout (YAML)
                    </button>
                    {workspace === 'eip' && (
                      <button className="btn" onClick={() => { exportCamelRoute(); setShowExportDropdown(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left', width: '100%', border: 'none', padding: '8px 12px', background: 'transparent', color: '#f59e0b', fontSize: '0.8rem', cursor: 'pointer' }}>
                        <Workflow size={14} /> Export Camel Route (YAML)
                      </button>
                    )}
                    <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }}></div>
                    <button className="btn" onClick={() => { exportAsPng(); setShowExportDropdown(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left', width: '100%', border: 'none', padding: '8px 12px', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.8rem', cursor: 'pointer' }}>
                      <Image size={14} /> Export Image (PNG)
                    </button>
                    <button className="btn" onClick={() => { exportAsSvg(); setShowExportDropdown(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left', width: '100%', border: 'none', padding: '8px 12px', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.8rem', cursor: 'pointer' }}>
                      <FileText size={14} /> Export Image (SVG)
                    </button>
                  </div>
                )}
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
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-icon-only" onClick={() => setShowJson(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}>
                  <X size={20} />
                </button>
              </div>
            </div>
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#0a0a0a' }}>
              <pre style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, margin: 0, padding: '24px', overflow: 'auto', color: '#a78bfa', fontFamily: '"Fira Code", monospace', fontSize: '0.85rem', lineHeight: '1.6' }}>
                {workspace === 'eip' ? generateYaml() : JSON.stringify({ nodes, edges }, null, 2)}
              </pre>
            </div>
            <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'rgba(255,255,255,0.02)' }}>
              <button className="btn" onClick={() => {
                const blob = new Blob([workspace === 'eip' ? generateYaml() : JSON.stringify({ nodes, edges }, null, 2)], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `model-source.${workspace === 'eip' ? 'yaml' : 'json'}`;
                a.click();
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
              <div className="json-viewer-overlay" style={{ width: '280px', padding: '20px', margin: 0, maxHeight: 'none' }}>
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
              <div className="json-viewer-overlay" style={{ width: '280px', padding: '20px', margin: 0, maxHeight: 'none' }}>
                <div className="json-viewer-header" style={{ marginBottom: '16px' }}>
                  <span>Edit Properties</span>
                  <button onClick={() => setSelectedNodeId(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>&times;</button>
                </div>
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

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Label / Text</label>
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
                        style={{ width: '100%', padding: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '0.9rem', outline: 'none' }}
                      />
                    )}
                  </div>
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
              <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }}></div>
              <button className="btn" onClick={deleteContextMenuNode} style={{ textAlign: 'left', width: '100%', border: 'none', padding: '8px 12px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trash2 size={16} /> Delete Node
              </button>
            </div>
          )}
        </ReactFlow>

        {nodes.length === 0 && (
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
                {workspace === 'draw' && "Drag and drop shapes, annotation widgets, or brand tech icons from the sidebar, or toggle Draw Mode to sketch freehand."}
                {workspace === 'eip' && "Drag and drop Enterprise Camel Patterns from the sidebar to begin building your Camel route."}
              </p>
            </div>
          </div>
        )}
        
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {(templates[workspace] || []).map((tpl, idx) => (
                <div 
                  key={idx} 
                  onClick={() => loadTemplate(tpl)}
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.02)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '12px', 
                    padding: '16px', 
                    cursor: 'pointer', 
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-blue)';
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '1.05rem' }}>{tpl.name}</span>
                    <span style={{ fontSize: '0.75rem', color: '#60a5fa', background: 'rgba(59,130,246,0.15)', padding: '4px 10px', borderRadius: '9999px', fontWeight: 'bold' }}>Load Pattern</span>
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{tpl.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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

export default function App() {
  const [showStudio, setShowStudio] = useState(false);

  return (
    <>
      {showStudio ? (
        <ReactFlowProvider>
          <FlowCanvas />
        </ReactFlowProvider>
      ) : (
        <LandingPage onLaunch={() => setShowStudio(true)} />
      )}
    </>
  );
}
