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
import { Download, Upload, FolderOpen, FileJson, Image, PlayCircle, Box, Diamond, Server, Trash2, Save, Database, Cloud, MousePointer2, Hand, Grid3X3, Code, ChevronLeft, ChevronRight, ChevronsDown, ChevronsUp, Filter, ListOrdered, FileText, ShieldCheck, MessageSquare, Send, Skull, Mail, Clock, GitMerge, GitBranch, Workflow, Network, ArrowRightLeft, Route, FilePlus, RefreshCw, Radio, Share2, ListChecks, Scale, Settings2, ArrowDownUp, TerminalSquare, CheckCircle2, PackageOpen, Package, FileArchive, MessageCircle, RadioTower, Webhook, Hexagon, Building2, CloudLightning, BoxSelect, Plug, Zap, Cpu, User, File, Type, Table, Building, Layers, Search, X, Target } from 'lucide-react';
import * as AllIcons from 'lucide-react';

const allIconNames = Object.keys(AllIcons).filter(k => k[0] === k[0].toUpperCase() && k !== 'LucideIcon' && k !== 'Icon');
import CustomNode from './CustomNode';
import CustomEdge from './CustomEdge';
import LandingPage from './LandingPage';
import './App.css';

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
      name: "1. Basic Aggregate (Simple)",
      description: "A minimal strategic design defining a single Bounded Context containing one Entity and one Value Object. Ideal for beginners.",
      nodes: [
        { id: "ctx-simple", type: 'custom', position: { x: 50, y: 50 }, style: { width: 350, height: 240, zIndex: -1 }, data: { label: "Order context", isContainer: true, color: "#3b82f6" } },
        { id: "ent-order", type: 'custom', parentId: "ctx-simple", extent: "parent", position: { x: 30, y: 55 }, data: { label: "Order Entity", icon: "Box", color: "#3b82f6", shape: "box" } },
        { id: "vo-addr", type: 'custom', parentId: "ctx-simple", extent: "parent", position: { x: 30, y: 125 }, data: { label: "Address VO", icon: "Layers", color: "#3b82f6", shape: "box" } }
      ],
      edges: []
    },
    {
      name: "2. E-Commerce System Map (Medium)",
      description: "A strategic Domain-Driven Design layout defining Order Processing, Payment Gateway, and Customer contexts, including entities, repos, and external APIs.",
      nodes: [
        { id: "ctx-order", type: 'custom', position: { x: 50, y: 50 }, style: { width: 350, height: 320, zIndex: -1 }, data: { label: "Order Context", isContainer: true, color: "#3b82f6" } },
        { id: "entity-order", type: 'custom', parentId: "ctx-order", extent: "parent", position: { x: 30, y: 55 }, data: { label: "Order Entity", icon: "Box", color: "#3b82f6", shape: "box" } },
        { id: "vo-orderitem", type: 'custom', parentId: "ctx-order", extent: "parent", position: { x: 30, y: 125 }, data: { label: "OrderItem ValueObject", icon: "Layers", color: "#3b82f6", shape: "box" } },
        { id: "repo-order", type: 'custom', parentId: "ctx-order", extent: "parent", position: { x: 30, y: 205 }, data: { label: "Order Repository", icon: "Database", color: "#3b82f6", shape: "box" } },
        
        { id: "ctx-payment", type: 'custom', position: { x: 550, y: 50 }, style: { width: 350, height: 170, zIndex: -1 }, data: { label: "Payment Context", isContainer: true, color: "#10b981" } },
        { id: "service-gateway", type: 'custom', parentId: "ctx-payment", extent: "parent", position: { x: 30, y: 55 }, data: { label: "Payment Processor", icon: "Cpu", color: "#10b981", shape: "box" } },

        { id: "ext-bank", type: 'custom', position: { x: 1000, y: 90 }, data: { label: "External Bank API", icon: "Building", color: "#ef4444", shape: "oval" } }
      ],
      edges: [
        { id: "e-order-payment", source: "repo-order", target: "service-gateway", animated: true, type: "custom", label: "Invokes", style: { strokeWidth: 3, stroke: '#3b82f6' } },
        { id: "e-payment-bank", source: "service-gateway", target: "ext-bank", animated: true, type: "custom", label: "REST Call", style: { strokeWidth: 3, stroke: '#10b981' } }
      ]
    },
    {
      name: "3. CQRS Pattern Blueprint (Complex)",
      description: "Advanced architecture pattern cleanly splitting command (Write) and query (Read) responsibilities via an Event Store.",
      nodes: [
        { id: "ctx-write", type: 'custom', position: { x: 50, y: 50 }, style: { width: 350, height: 320, zIndex: -1 }, data: { label: "Command Side", isContainer: true, color: "#3b82f6" } },
        { id: "w-controller", type: 'custom', parentId: "ctx-write", extent: "parent", position: { x: 30, y: 55 }, data: { label: "Write Controller", icon: "Network", color: "#3b82f6", shape: "box" } },
        { id: "w-handler", type: 'custom', parentId: "ctx-write", extent: "parent", position: { x: 30, y: 125 }, data: { label: "Command Handler", icon: "Cpu", color: "#3b82f6", shape: "box" } },
        { id: "w-repo", type: 'custom', parentId: "ctx-write", extent: "parent", position: { x: 30, y: 205 }, data: { label: "Write Repository", icon: "Database", color: "#3b82f6", shape: "box" } },
        
        { id: "evt-store", type: 'custom', position: { x: 550, y: 140 }, data: { label: "Event Store", icon: "Database", color: "#f59e0b", shape: "cylinder" } },
        
        { id: "ctx-read", type: 'custom', position: { x: 800, y: 50 }, style: { width: 350, height: 320, zIndex: -1 }, data: { label: "Query Side", isContainer: true, color: "#10b981" } },
        { id: "r-controller", type: 'custom', parentId: "ctx-read", extent: "parent", position: { x: 30, y: 55 }, data: { label: "Read Controller", icon: "Network", color: "#10b981", shape: "box" } },
        { id: "r-handler", type: 'custom', parentId: "ctx-read", extent: "parent", position: { x: 30, y: 125 }, data: { label: "Query Handler", icon: "Cpu", color: "#10b981", shape: "box" } },
        { id: "r-repo", type: 'custom', parentId: "ctx-read", extent: "parent", position: { x: 30, y: 205 }, data: { label: "Read Repository", icon: "Database", color: "#10b981", shape: "box" } }
      ],
      edges: [
        { id: "e-w-c-h", source: "w-controller", target: "w-handler", animated: true, type: "custom" },
        { id: "e-w-h-r", source: "w-handler", target: "w-repo", animated: true, type: "custom" },
        { id: "e-w-r-es", source: "w-repo", target: "evt-store", animated: true, type: "custom", label: "Appends" },
        { id: "e-es-r-r", source: "evt-store", target: "r-repo", animated: true, type: "custom", label: "Sync / Projection", style: { strokeWidth: 3, stroke: '#f59e0b' } },
        { id: "e-r-c-h", source: "r-controller", target: "r-handler", animated: true, type: "custom" },
        { id: "e-r-h-r", source: "r-handler", target: "r-repo", animated: true, type: "custom" }
      ]
    },
    {
      name: "4. Multi-Domain Context Map (Very Complex)",
      description: "A highly complex DDD context mapping covering Customer, Order, Billing, and Shipping contexts, displaying upstream/downstream and supplier relations.",
      nodes: [
        { id: "ctx-cust", type: 'custom', position: { x: 50, y: 50 }, style: { width: 350, height: 170, zIndex: -1 }, data: { label: "Customer Domain", isContainer: true, color: "#8b5cf6" } },
        { id: "agg-cust", type: 'custom', parentId: "ctx-cust", extent: "parent", position: { x: 30, y: 55 }, data: { label: "Customer Aggregate", icon: "User", color: "#8b5cf6", shape: "box" } },
        
        { id: "ctx-ord", type: 'custom', position: { x: 550, y: 50 }, style: { width: 350, height: 170, zIndex: -1 }, data: { label: "Order Domain", isContainer: true, color: "#3b82f6" } },
        { id: "agg-ord", type: 'custom', parentId: "ctx-ord", extent: "parent", position: { x: 30, y: 55 }, data: { label: "Order Aggregate Root", icon: "Box", color: "#3b82f6", shape: "box" } },
        
        { id: "ctx-bill", type: 'custom', position: { x: 50, y: 290 }, style: { width: 350, height: 170, zIndex: -1 }, data: { label: "Billing Domain", isContainer: true, color: "#f59e0b" } },
        { id: "agg-bill", type: 'custom', parentId: "ctx-bill", extent: "parent", position: { x: 30, y: 55 }, data: { label: "Billing Aggregate", icon: "Database", color: "#f59e0b", shape: "box" } },
        
        { id: "ctx-ship", type: 'custom', position: { x: 550, y: 290 }, style: { width: 350, height: 170, zIndex: -1 }, data: { label: "Shipping Domain", isContainer: true, color: "#10b981" } },
        { id: "agg-ship", type: 'custom', parentId: "ctx-ship", extent: "parent", position: { x: 30, y: 55 }, data: { label: "Shipment Aggregate", icon: "Shuffle", color: "#10b981", shape: "box" } }
      ],
      edges: [
        { id: "e-cust-ord", source: "agg-cust", target: "agg-ord", animated: true, type: "custom", label: "Upstream (U) / Downstream (D)" },
        { id: "e-ord-bill", source: "agg-ord", target: "agg-bill", animated: true, type: "custom", label: "Supplier (S) / Customer (C)" },
        { id: "e-ord-ship", source: "agg-ord", target: "agg-ship", animated: true, type: "custom", label: "Supplier (S) / Customer (C)" }
      ]
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
      description: "A highly complex Camel integration pipeline using Http, Splitters, Choices, Kafka/ActiveMQ messaging, Message Aggregation and final DB storage.",
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

const PaletteItem = ({ label, icon: Icon, color, type, shape, isContainer, isEip }) => {
  const onDragStart = (event) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ label, icon: type, color, shape, isContainer, isEip }));
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
  const reactFlowWrapper = useRef(null);
  const fileInputRef = useRef(null);
  
  // Separate states for DDD vs Diagram vs EIP workspaces
  const [dddNodes, setDddNodes, onDddNodesChange] = useNodesState(loadState('dddNodes', initialNodes));
  const [dddEdges, setDddEdges, onDddEdgesChange] = useEdgesState(loadState('dddEdges', initialEdges));
  const [diagramNodes, setDiagramNodes, onDiagramNodesChange] = useNodesState(loadState('diagramNodes', []));
  const [diagramEdges, setDiagramEdges, onDiagramEdgesChange] = useEdgesState(loadState('diagramEdges', []));
  const [eipNodes, setEipNodes, onEipNodesChange] = useNodesState(loadState('eipNodes', []));
  const [eipEdges, setEipEdges, onEipEdgesChange] = useEdgesState(loadState('eipEdges', []));

  const [workspace, setWorkspace] = useState(localStorage.getItem('workspace') || 'ddd'); // 'ddd', 'diagram', or 'eip'
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [diagramTitle, setDiagramTitle] = useState(() => {
    return localStorage.getItem(`${workspace}-title`) || (
      workspace === 'ddd' ? 'Domain-Driven Design Blueprint' : 
      (workspace === 'diagram' ? 'System Architecture Topology' : 'Camel Integration Pipeline')
    );
  });
  
  useEffect(() => {
    localStorage.setItem('workspace', workspace);
    setDiagramTitle(localStorage.getItem(`${workspace}-title`) || (
      workspace === 'ddd' ? 'Domain-Driven Design Blueprint' : 
      (workspace === 'diagram' ? 'System Architecture Topology' : 'Camel Integration Pipeline')
    ));
  }, [workspace]);

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
    localStorage.setItem('eipNodes', JSON.stringify(eipNodes));
    localStorage.setItem('eipEdges', JSON.stringify(eipEdges));
  }, [eipNodes, eipEdges]);

  const nodes = workspace === 'ddd' ? dddNodes : (workspace === 'diagram' ? diagramNodes : eipNodes);
  const edges = workspace === 'ddd' ? dddEdges : (workspace === 'diagram' ? diagramEdges : eipEdges);
  const setNodes = workspace === 'ddd' ? setDddNodes : (workspace === 'diagram' ? setDiagramNodes : setEipNodes);
  const setEdges = workspace === 'ddd' ? setDddEdges : (workspace === 'diagram' ? setDiagramEdges : setEipEdges);
  const onNodesChange = workspace === 'ddd' ? onDddNodesChange : (workspace === 'diagram' ? onDiagramNodesChange : onEipNodesChange);
  const onEdgesChange = workspace === 'ddd' ? onDddEdgesChange : (workspace === 'diagram' ? onDiagramEdgesChange : onEipEdgesChange);

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
  }, [nodes, onNodesChange, setEdges]);
  
  const { zoom } = useViewport();

  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  const onMoveEnd = useCallback((event, viewport) => {
    localStorage.setItem('flow-viewport', JSON.stringify(viewport));
  }, []);

  const initialViewport = loadState('flow-viewport', { x: 0, y: 0, zoom: 1 });

  const [interactionMode, setInteractionMode] = useState('move'); // 'move' or 'pan'
  const [bgVariant, setBgVariant] = useState('dots'); // 'dots' or 'plain'
  const [showJson, setShowJson] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
    eip_logic: true
  });

  const expandAll = () => setSectionsOpen({ ddd_strategic: true, ddd_tactical: true, ddd_event: true, flowchart: true, sysarch: true, uml: true, er: true, mindmap: true, eip_core: true, eip_endpoints: true, eip_transforms: true, eip_logic: true });
  const collapseAll = () => setSectionsOpen({ ddd_strategic: false, ddd_tactical: false, ddd_event: false, flowchart: false, sysarch: false, uml: false, er: false, mindmap: false, eip_core: false, eip_endpoints: false, eip_transforms: false, eip_logic: false });

  const toggleSection = (key) => setSectionsOpen(prev => ({ ...prev, [key]: !prev[key] }));

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
  const autoLayout = (direction = 'LR', nodesList = nodes, edgesList = edges) => {
    const inDegree = {};
    nodesList.forEach(n => inDegree[n.id] = 0);
    edgesList.forEach(e => {
      if (inDegree[e.target] !== undefined) inDegree[e.target]++;
    });

    const depths = {};
    let currentLevel = nodesList.filter(n => inDegree[n.id] === 0).map(n => n.id);
    let d = 0;
    while (currentLevel.length > 0) {
      let nextLevel = [];
      currentLevel.forEach(id => {
        depths[id] = Math.max(depths[id] || 0, d);
        edgesList.filter(e => e.source === id).forEach(e => {
          if (!nextLevel.includes(e.target)) nextLevel.push(e.target);
        });
      });
      d++;
      currentLevel = nextLevel;
      if (d > 100) break; // cycle protection
    }

    nodesList.forEach(n => { if (depths[n.id] === undefined) depths[n.id] = 0; });

    const levelCounts = {};
    const newNodes = nodesList.map(n => {
      const depth = depths[n.id];
      levelCounts[depth] = (levelCounts[depth] || 0) + 1;
      const index = levelCounts[depth] - 1;

      const dx = direction === 'LR' ? 300 : 250;
      const dy = direction === 'LR' ? 150 : 250;

      let x, y;
      if (direction === 'LR') {
        x = depth * dx + 50;
        y = index * dy + 50;
      } else {
        x = index * dx + 50;
        y = depth * dy + 50;
      }
      return { ...n, position: { x, y } };
    });

    setNodes(newNodes);
    
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
      setContextMenu({
        id: node.id,
        top: event.clientY,
        left: event.clientX,
      });
    },
    [setContextMenu]
  );

  const onPaneClick = useCallback(() => {
    setContextMenu(null);
    setShowJson(false); // also hide json if pane clicked? No, let's keep it.
  }, []);

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
    setNodes(nds => nds.map(node => {
      if (node.id === targetNodeId) {
        const parent = nds.find(n => n.id === node.parentId);
        const rest = { ...node };
        delete rest.parentId;
        delete rest.extent;
        
        let targetX = node.position.x;
        let targetY = node.position.y;
        
        if (parent) {
          const pWidth = parseInt(parent.style?.width || 300, 10);
          targetX = parent.position.x + pWidth + 50; // Place it 50px to the right of the container
          targetY = parent.position.y + node.position.y;
        }

        return { 
          ...rest, 
          position: { x: targetX, y: targetY } 
        };
      }
      return node;
    }));
    setContextMenu(null);
  };

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const dataStr = event.dataTransfer.getData('application/reactflow');
      if (!dataStr) return;

      const data = JSON.parse(dataStr);
      
      // Prevent cross-workspace dropping
      if (workspace === 'eip' && !data.isEip) return;
      if ((workspace === 'diagram' || workspace === 'ddd') && data.isEip) return;

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

      const newNode = {
        id: uuidv4(),
        type: 'custom',
        position,
        parentId,
        extent: parentId ? 'parent' : undefined,
        style: data.isContainer ? { width: 400, height: 300, zIndex: -1 } : undefined,
        data: { label: data.label, icon: data.icon, color: data.color, shape: data.shape, isContainer: data.isContainer, isEip: data.isEip },
      };

      if (data.label === 'Choice' && workspace === 'eip') {
        const whenNode = {
          id: uuidv4(), type: 'custom',
          position: { x: position.x + 150, y: position.y - 80 },
          data: { label: 'When', icon: 'Filter', color: '#eab308', shape: '', isEip: true }
        };
        const otherwiseNode = {
          id: uuidv4(), type: 'custom',
          position: { x: position.x + 150, y: position.y + 80 },
          data: { label: 'Otherwise', icon: 'RefreshCw', color: '#94a3b8', shape: '', isEip: true }
        };
        setNodes(nds => nds.concat(newNode, whenNode, otherwiseNode));
        setEdges(eds => eds.concat(
          { id: uuidv4(), source: newNode.id, target: whenNode.id, ...defaultEdgeOptions },
          { id: uuidv4(), source: newNode.id, target: otherwiseNode.id, ...defaultEdgeOptions }
        ));
      } else {
        setNodes((nds) => nds.concat(newNode));
      }
    },
    [reactFlowInstance, setNodes, setEdges, workspace]
  );

  const generateYaml = () => {
    const roots = nodes.filter(n => !edges.some(e => e.target === n.id));
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

  const clearCanvas = () => {
    setShowClearConfirm(true);
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
      backgroundColor: '#020617',
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
      backgroundColor: '#020617',
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
      const updatedNodes = nds.map(n => {
        if (n.id === nodeId) {
          const container = nds.find(c => c.id === containerId);
          if (!container) return n;
          
          // Find how many children this container already has to stack them neatly
          const existingChildren = nds.filter(child => child.parentId === containerId).length;
          const offsetX = 20 + (existingChildren % 3) * 150;
          const offsetY = 50 + Math.floor(existingChildren / 3) * 100;
          
          return { 
            ...n, 
            parentId: containerId, 
            extent: 'parent',
            position: { x: offsetX, y: offsetY } 
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
      <aside className={`sidebar ${!isSidebarOpen ? 'collapsed' : ''}`}>
        <button 
          className="sidebar-toggle-btn" 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
        <div className="sidebar-inner">
          <div className="sidebar-header" style={{ padding: 0, flexDirection: 'column', alignItems: 'stretch' }}>
            <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Box size={24} color="#3b82f6" /> Modeler Studio
            </div>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', borderTop: '1px solid var(--border-color)' }}>
              <button 
                style={{ flex: 1, padding: '12px 4px', background: workspace === 'ddd' ? 'rgba(59, 130, 246, 0.1)' : 'transparent', border: 'none', color: workspace === 'ddd' ? '#3b82f6' : 'var(--text-primary)', cursor: 'pointer', fontWeight: workspace === 'ddd' ? 'bold' : 'normal', fontSize: '0.9rem' }}
                onClick={() => setWorkspace('ddd')}
              >
                DDD
              </button>
              <button 
                style={{ flex: 1, padding: '12px 4px', background: workspace === 'diagram' ? 'rgba(59, 130, 246, 0.1)' : 'transparent', border: 'none', color: workspace === 'diagram' ? '#3b82f6' : 'var(--text-primary)', cursor: 'pointer', fontWeight: workspace === 'diagram' ? 'bold' : 'normal', borderLeft: '1px solid var(--border-color)', fontSize: '0.9rem' }}
                onClick={() => setWorkspace('diagram')}
              >
                Diagrams
              </button>
              <button 
                style={{ flex: 1, padding: '12px 4px', background: workspace === 'eip' ? 'rgba(59, 130, 246, 0.1)' : 'transparent', border: 'none', color: workspace === 'eip' ? '#3b82f6' : 'var(--text-primary)', cursor: 'pointer', fontWeight: workspace === 'eip' ? 'bold' : 'normal', borderLeft: '1px solid var(--border-color)', fontSize: '0.9rem' }}
                onClick={() => setWorkspace('eip')}
              >
                Integration
              </button>
            </div>
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
                  <PaletteItem label="Bounded Context" icon={Box} color="#3b82f6" type="Box" isContainer={true} />
                  <PaletteItem label="Core Subdomain" icon={Diamond} color="#ec4899" type="Diamond" isContainer={true} />
                  <PaletteItem label="Generic Subdomain" icon={Box} color="#94a3b8" type="Box" isContainer={true} />
                  <PaletteItem label="External System" icon={Cloud} color="#ef4444" type="Cloud" />
                  <PaletteItem label="Actor / User" icon={User} color="#eab308" type="User" shape="actor" />
                </CollapsibleSection>
                <CollapsibleSection title="Tactical DDD" isOpen={sectionsOpen.ddd_tactical} onToggle={() => toggleSection('ddd_tactical')}>
                  <PaletteItem label="Aggregate Root" icon={Layers} color="#8b5cf6" type="Layers" />
                  <PaletteItem label="Entity" icon={Server} color="#10b981" type="Server" />
                  <PaletteItem label="Value Object" icon={Diamond} color="#0ea5e9" type="Diamond" shape="diamond" />
                  <PaletteItem label="Domain Service" icon={Settings2} color="#f97316" type="Settings2" />
                  <PaletteItem label="Repository" icon={Database} color="#14b8a6" type="Database" />
                  <PaletteItem label="Factory" icon={Building2} color="#6366f1" type="Building2" />
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
          </div>
        </div>
      </aside>
      
      <main className="canvas-area" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeContextMenu={onNodeContextMenu}
          onPaneClick={onPaneClick}
          onMoveEnd={onMoveEnd}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          panOnDrag={interactionMode === 'pan'}
          selectionOnDrag={interactionMode === 'move'}
          zoomOnScroll={true}
          panOnScroll={false}
          defaultViewport={initialViewport}
          colorMode="dark"
          defaultEdgeOptions={defaultEdgeOptions}
          deleteKeyCode={['Backspace', 'Delete']}
        >
          {bgVariant === 'dots' && <Background color="#fff" gap={16} size={1} opacity={0.1} variant="dots" />}
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
          <Panel position="top-center">
            <div className="animated-title-container">
              <span className="animated-title-badge">{workspace}</span>
              <div className="animated-title-dot" />
              <input 
                type="text" 
                value={diagramTitle} 
                onChange={(e) => setDiagramTitle(e.target.value)} 
                className="animated-title-input"
                title="Click to rename diagram"
              />
            </div>
          </Panel>

          <Panel position="top-right">
            <div className="toolbar" style={{ position: 'relative' }}>
              <button className="btn" onClick={() => setShowTemplatesModal(true)} style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid var(--accent-blue)', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa' }}>
                <Layers size={14} /> Templates
              </button>
              <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 4px' }}></div>
              
              <button className="btn btn-icon-only" onClick={() => setShowJson(!showJson)} title="View Code">
                <Code size={16} />
              </button>
              <button className="btn btn-icon-only" onClick={clearCanvas} title="Clear Canvas">
                <Trash2 size={16} />
              </button>
              <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 4px' }}></div>
              
              <button className="btn" onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff' }} title="Load JSON/YAML diagram from disk">
                <Upload size={14} /> Import
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImportFile} 
                accept=".json,.yaml,.yml" 
                style={{ display: 'none' }} 
              />
              
              <div style={{ position: 'relative' }}>
                <button className="btn btn-primary" onClick={() => setShowExportDropdown(!showExportDropdown)} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px 12px' }}>
                  <Download size={14} /> Export
                </button>
                {showExportDropdown && (
                  <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', zIndex: 1000, width: '240px', padding: '6px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <button className="btn" onClick={() => { exportLayout('json'); setShowExportDropdown(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left', width: '100%', border: 'none', padding: '8px 12px', background: 'transparent', color: '#fff', fontSize: '0.8rem', cursor: 'pointer' }}>
                      <FileJson size={14} /> Export Layout (JSON)
                    </button>
                    <button className="btn" onClick={() => { exportLayout('yaml'); setShowExportDropdown(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left', width: '100%', border: 'none', padding: '8px 12px', background: 'transparent', color: '#fff', fontSize: '0.8rem', cursor: 'pointer' }}>
                      <FileText size={14} /> Export Layout (YAML)
                    </button>
                    {workspace === 'eip' && (
                      <button className="btn" onClick={() => { exportCamelRoute(); setShowExportDropdown(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left', width: '100%', border: 'none', padding: '8px 12px', background: 'transparent', color: '#f59e0b', fontSize: '0.8rem', cursor: 'pointer' }}>
                        <Workflow size={14} /> Export Camel Route (YAML)
                      </button>
                    )}
                    <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }}></div>
                    <button className="btn" onClick={() => { exportAsPng(); setShowExportDropdown(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left', width: '100%', border: 'none', padding: '8px 12px', background: 'transparent', color: '#fff', fontSize: '0.8rem', cursor: 'pointer' }}>
                      <Image size={14} /> Export Image (PNG)
                    </button>
                    <button className="btn" onClick={() => { exportAsSvg(); setShowExportDropdown(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left', width: '100%', border: 'none', padding: '8px 12px', background: 'transparent', color: '#fff', fontSize: '0.8rem', cursor: 'pointer' }}>
                      <FileText size={14} /> Export Image (SVG)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </Panel>
          {showJson && (
            <Panel position="bottom-right">
              <div className="json-viewer-overlay">
                <div className="json-viewer-header">
                  <span>{workspace === 'eip' ? 'Camel Route YAML' : 'Model JSON'}</span>
                  <button onClick={() => setShowJson(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>&times;</button>
                </div>
                <pre>{workspace === 'eip' ? generateYaml() : JSON.stringify({ nodes, edges }, null, 2)}</pre>
              </div>
            </Panel>
          )}
          {activeEdge && !activeNode && (
            <Panel position="top-right" style={{ top: '80px', right: '20px' }}>
              <div className="json-viewer-overlay" style={{ width: '280px', padding: '20px', margin: 0, maxHeight: 'none' }}>
                <div className="json-viewer-header" style={{ marginBottom: '16px' }}>
                  <span>Edit Connector</span>
                  <button onClick={() => setSelectedEdgeId(null)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>&times;</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Label</label>
                    <input 
                      value={activeEdge.label || ''} 
                      onChange={(e) => updateEdgeData('label', e.target.value)} 
                      style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px', fontSize: '0.9rem', outline: 'none' }}
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
                        style={{ flex: 1, padding: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px', fontSize: '0.85rem', outline: 'none' }}
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
                    <label htmlFor="animated-edge" style={{ fontSize: '0.85rem', color: '#fff', cursor: 'pointer' }}>Animated (Dotted Flow)</label>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Path Style</label>
                    <select 
                      value={activeEdge.type || 'smoothstep'} 
                      onChange={(e) => updateEdgeData('type', e.target.value)}
                      style={{ padding: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px', outline: 'none', fontSize: '0.85rem', width: '100%' }}
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
                      style={{ padding: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px', outline: 'none', fontSize: '0.85rem', width: '100%' }}
                    >
                      <option value="forward">Forward</option>
                      <option value="backward">Backward</option>
                      <option value="bidirectional">Bidirectional</option>
                      <option value="none">None</option>
                    </select>
                  </div>
                  <div style={{ padding: '8px', background: 'rgba(0,0,0,0.1)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '12px', fontWeight: 'bold' }}>Label Styling</div>
                    
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
                  <button onClick={() => setSelectedNodeId(null)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>&times;</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Label</label>
                    <input 
                      value={activeNode.data.label || ''} 
                      onChange={(e) => updateNodeData('label', e.target.value)} 
                      style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px', fontSize: '0.9rem', outline: 'none' }}
                    />
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
                        style={{ flex: 1, padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px', fontSize: '0.9rem', outline: 'none' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Icon Name (Lucide)</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        value={activeNode.data.icon || ''} 
                        onChange={(e) => updateNodeData('icon', e.target.value)} 
                        placeholder="e.g. Server, Database, Cloud"
                        style={{ flex: 1, padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px', fontSize: '0.9rem', outline: 'none' }}
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
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={!!activeNode.data.hideBorder} 
                      onChange={(e) => updateNodeData('hideBorder', e.target.checked)} 
                    />
                    Hide Node Border & Background
                  </label>
                  {activeNode.data.label === 'Bean' && (
                    <div style={{ marginTop: '8px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#fff', marginBottom: '8px', fontWeight: 'bold' }}>Bean Configuration</label>
                      <div style={{ marginBottom: '8px' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Bean Name</label>
                        <input 
                          value={activeNode.data.beanName || ''} 
                          onChange={(e) => updateNodeData('beanName', e.target.value)} 
                          placeholder="myBean"
                          style={{ width: '100%', padding: '8px', background: '#0a0a0a', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px', fontSize: '0.85rem', outline: 'none' }}
                        />
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Class Name</label>
                        <input 
                          value={activeNode.data.beanType || ''} 
                          onChange={(e) => updateNodeData('beanType', e.target.value)} 
                          placeholder="com.example.MyClass"
                          style={{ width: '100%', padding: '8px', background: '#0a0a0a', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px', fontSize: '0.85rem', outline: 'none' }}
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
                          style={{ width: '100%', minHeight: '60px', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', fontFamily: 'monospace' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Methods (one per line)</label>
                        <textarea 
                          value={activeNode.data.methods ?? '+ save()\n+ load()'} 
                          onChange={(e) => updateNodeData('methods', e.target.value)} 
                          style={{ width: '100%', minHeight: '60px', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', fontFamily: 'monospace' }}
                        />
                      </div>
                    </>
                  )}
                  {['setbody', 'setheader', 'when', 'log'].includes(activeNode.data.label?.toLowerCase()) && (
                    <div style={{ marginTop: '8px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#fff', marginBottom: '8px', fontWeight: 'bold' }}>Expression Editor</label>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <select 
                          value={activeNode.data.expressionType || 'simple'} 
                          onChange={(e) => updateNodeData('expressionType', e.target.value)}
                          style={{ padding: '6px', background: '#0f111a', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px', outline: 'none', fontSize: '0.8rem', width: '100%' }}
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
                      <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#fff', marginBottom: '8px', fontWeight: 'bold' }}>
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
                        if (isParentContainer) {
                          childPosition = { x: 50, y: 80 };
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

                        const updatedNodes = nodes.concat(newChildNode);
                        const updatedEdges = edges.concat(newEdge);

                        setNodes(updatedNodes);
                        setEdges(updatedEdges);
                        
                        setTimeout(() => autoLayout('LR', updatedNodes, updatedEdges), 50);
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
                        <button key={c.id} className="btn" onClick={() => moveNodeToContext(ctxNode.id, c.id)} style={{ textAlign: 'left', width: '100%', border: 'none', padding: '4px 8px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)' }}>
                          {c.data.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {isCtxContainer && looseNodes.length > 0 && (
                    <div style={{ padding: '8px 12px' }}>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold', marginBottom: '4px' }}>Add node to Context:</div>
                      {looseNodes.map(n => (
                        <button key={n.id} className="btn" onClick={() => moveNodeToContext(n.id, ctxNode.id)} style={{ textAlign: 'left', width: '100%', border: 'none', padding: '4px 8px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)' }}>
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
              <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: '#fff' }}>Canvas is Empty</h3>
              <p style={{ maxWidth: '300px', lineHeight: '1.5' }}>
                {workspace === 'ddd' && "Drag and drop Domain Driven Design elements from the sidebar to begin building your bounded contexts and aggregates."}
                {workspace === 'diagram' && "Drag and drop shapes from the sidebar to begin drawing your flowchart, UML, or system architecture."}
                {workspace === 'eip' && "Drag and drop Enterprise Integration Patterns from the sidebar to begin building your Camel route."}
              </p>
            </div>
          </div>
        )}
        
        {showIconPicker && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', width: '600px', height: '600px', display: 'flex', flexDirection: 'column', border: '1px solid var(--border-color)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, color: '#fff' }}>Select an Icon</h3>
                <button className="btn btn-icon-only" onClick={() => setShowIconPicker(false)}><X size={20} /></button>
              </div>
              <input 
                autoFocus
                placeholder="Search icons..." 
                value={iconSearch}
                onChange={(e) => setIconSearch(e.target.value)}
                style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '8px', fontSize: '1rem', outline: 'none', marginBottom: '16px' }}
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
                      style={{ padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', cursor: 'pointer', border: '1px solid transparent' }}
                      onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-blue)'}
                      onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
                    >
                      <IconComp size={24} color="#fff" />
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
              <Trash2 size={48} />
            </div>
            <h3 style={{ margin: '0 0 10px 0', color: '#fff', fontSize: '1.3rem', fontWeight: 'bold' }}>Clear Canvas?</h3>
            <p style={{ margin: '0 0 24px 0', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              Are you sure you want to clear the entire canvas? This will permanently delete all nodes and connections in your current workspace.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                className="btn" 
                onClick={() => setShowClearConfirm(false)}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
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
                style={{ background: '#ef4444', color: '#fff', padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}
              >
                Clear Everything
              </button>
            </div>
          </div>
        </div>
      )}

      {showTemplatesModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '28px', borderRadius: '16px', width: '600px', maxHeight: '80vh', overflowY: 'auto', border: '1px solid var(--border-color)', boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1.4rem', fontWeight: 'bold' }}>Load Template</h3>
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
                    <span style={{ fontWeight: 'bold', color: '#fff', fontSize: '1.05rem' }}>{tpl.name}</span>
                    <span style={{ fontSize: '0.75rem', color: '#60a5fa', background: 'rgba(59,130,246,0.15)', padding: '4px 10px', borderRadius: '9999px', fontWeight: 'bold' }}>Load Pattern</span>
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{tpl.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
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
