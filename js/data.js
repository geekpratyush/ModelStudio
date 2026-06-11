const INDUSTRY_TEMPLATES = {
    ecommerce: {
        nodes: [
            { id: "bc_orders", type: "actor-home", label: "Order Context", icon: "fa-shopping-cart", x: 40, y: 100, color: "#2563eb", isContainer: true, width: 480, height: 320 },
            { id: "agg_order", type: "component", label: "Order Aggregate", icon: "fa-crown", x: 80, y: 180, color: "#d97706", parentContainerId: "bc_orders" },
            { id: "evt_placed", type: "node", label: "Order Placed", icon: "fa-bolt", x: 300, y: 190, color: "#f59e0b", parentContainerId: "bc_orders" },
            { id: "bc_logistics", type: "actor-home", label: "Logistics Context", icon: "fa-truck", x: 500, y: 100, color: "#16a34a", isContainer: true, width: 480, height: 320 },
            { id: "svc_routing", type: "component", label: "Routing Service", icon: "fa-cogs", x: 540, y: 180, color: "#6366f1", parentContainerId: "bc_logistics" },
            { id: "bc_warehouse", type: "actor-home", label: "Warehouse Context", icon: "fa-box-open", x: 960, y: 100, color: "#7c3aed", isContainer: true, width: 480, height: 320 },
            { id: "agg_inventory", type: "component", label: "Inventory", icon: "fa-crown", x: 1000, y: 180, color: "#d97706", parentContainerId: "bc_warehouse" }
        ],
        connections: [
            { id: "c1", from: "agg_order", fromPort: "right", to: "evt_placed", toPort: "left", label: "emits" },
            { id: "c2", from: "evt_placed", fromPort: "right", to: "svc_routing", toPort: "left", label: "triggers" },
            { id: "c3", from: "svc_routing", fromPort: "right", to: "agg_inventory", toPort: "left", label: "updates" }
        ]
    },
    fintech: {
        nodes: [
            { id: "bc_core", type: "actor-home", label: "Core Banking", icon: "fa-building-columns", x: 40, y: 50, color: "#0ea5e9", isContainer: true, width: 480, height: 320 },
            { id: "agg_acc", type: "component", label: "Account", icon: "fa-crown", x: 80, y: 130, color: "#d97706", parentContainerId: "bc_core" },
            { id: "cmd_transfer", type: "node", label: "Transfer Funds", icon: "fa-hand-pointer", x: 80, y: 250, color: "#3b82f6", parentContainerId: "bc_core" },
            { id: "bc_kyc", type: "actor-home", label: "KYC & Fraud", icon: "fa-shield", x: 500, y: 50, color: "#dc2626", isContainer: true, width: 550, height: 320 },
            { id: "svc_aml", type: "component", label: "AML Service", icon: "fa-cogs", x: 540, y: 130, color: "#6366f1", parentContainerId: "bc_kyc" },
            { id: "dec_fraud", type: "component", label: "Is Safe?", icon: "fa-code-branch", x: 750, y: 140, color: "#ea580c", parentContainerId: "bc_kyc" },
            { id: "evt_approved", type: "node", label: "Tx Approved", icon: "fa-bolt", x: 950, y: 80, color: "#10b981", parentContainerId: "bc_kyc" },
            { id: "evt_blocked", type: "node", label: "Tx Blocked", icon: "fa-bolt", x: 950, y: 200, color: "#dc2626", parentContainerId: "bc_kyc" }
        ],
        connections: [
            { id: "f1", from: "cmd_transfer", fromPort: "top", to: "agg_acc", toPort: "bottom", label: "execute" },
            { id: "f2", from: "agg_acc", fromPort: "right", to: "svc_aml", toPort: "left", label: "check" },
            { id: "f3", from: "svc_aml", fromPort: "right", to: "dec_fraud", toPort: "left", label: "risk" },
            { id: "f4", from: "dec_fraud", fromPort: "top", to: "evt_approved", toPort: "left", label: "approve" },
            { id: "f5", from: "dec_fraud", fromPort: "bottom", to: "evt_blocked", toPort: "left", label: "reject" }
        ]
    },
    resilience: {
        nodes: [
            { id: "bc_res", type: "actor-home", label: "Resilient Flow", icon: "fa-shield-heart", x: 50, y: 50, color: "#10b981", isContainer: true, width: 900, height: 400 },
            { id: "n_src", type: "node", label: "Input Request", icon: "fa-plug", x: 80, y: 200, color: "#3b82f6", parentContainerId: "bc_res" },
            { id: "n_cb", type: "node", label: "Circuit Breaker", icon: "fa-bolt-lightning", x: 250, y: 200, color: "#ea580c", parentContainerId: "bc_res" },
            { id: "svc_target", type: "component", label: "Target API", icon: "fa-server", x: 450, y: 120, color: "#6366f1", parentContainerId: "bc_res" },
            { id: "n_retry", type: "node", label: "Retry Policy", icon: "fa-rotate-right", x: 450, y: 280, color: "#f59e0b", parentContainerId: "bc_res" },
            { id: "q_dlq", type: "component", label: "Dead Letter Queue", icon: "fa-skull-crossbones", x: 700, y: 280, color: "#ef4444", parentContainerId: "bc_res" },
            { id: "svc_fallback", type: "component", label: "Fallback Cache", icon: "fa-database", x: 700, y: 120, color: "#10b981", parentContainerId: "bc_res" }
        ],
        connections: [
            { id: "r1", from: "n_src", fromPort: "right", to: "n_cb", toPort: "left", animated: true },
            { id: "r2", from: "n_cb", fromPort: "top", to: "svc_target", toPort: "left", label: "try", animated: true },
            { id: "r3", from: "n_cb", fromPort: "bottom", to: "n_retry", toPort: "left", label: "fail" },
            { id: "r4", from: "n_retry", fromPort: "right", to: "q_dlq", toPort: "left", label: "exhausted" },
            { id: "r5", from: "n_cb", fromPort: "right", to: "svc_fallback", toPort: "left", label: "open" }
        ]
    },
    saga: {
        nodes: [
            { id: "bc_saga", type: "actor-home", label: "Order Saga Orchestration", icon: "fa-diagram-project", x: 50, y: 50, color: "#8b5cf6", isContainer: true, width: 850, height: 450 },
            { id: "n_start", type: "node", label: "Order Request", icon: "fa-cart-shopping", x: 80, y: 220, color: "#3b82f6", parentContainerId: "bc_saga" },
            { id: "n_saga", type: "node", label: "Saga Manager", icon: "fa-clipboard-check", x: 260, y: 220, color: "#8b5cf6", parentContainerId: "bc_saga" },
            { id: "svc_inv", type: "component", label: "Inventory Service", icon: "fa-box", x: 480, y: 120, color: "#10b981", parentContainerId: "bc_saga" },
            { id: "svc_pay", type: "component", label: "Payment Service", icon: "fa-credit-card", x: 480, y: 220, color: "#f59e0b", parentContainerId: "bc_saga" },
            { id: "svc_ship", type: "component", label: "Shipping Service", icon: "fa-truck", x: 480, y: 320, color: "#3b82f6", parentContainerId: "bc_saga" },
            { id: "q_error", type: "component", label: "Compensating Tx", icon: "fa-rotate-left", x: 700, y: 220, color: "#ef4444", parentContainerId: "bc_saga" }
        ],
        connections: [
            { id: "s1", from: "n_start", fromPort: "right", to: "n_saga", toPort: "left", animated: true },
            { id: "s2", from: "n_saga", fromPort: "right", to: "svc_inv", toPort: "left", label: "reserve", animated: true },
            { id: "s3", from: "n_saga", fromPort: "right", to: "svc_pay", toPort: "left", label: "charge", animated: true },
            { id: "s4", from: "n_saga", fromPort: "right", to: "svc_ship", toPort: "left", label: "ship", animated: true },
            { id: "s5", from: "svc_pay", fromPort: "right", to: "q_error", toPort: "left", label: "failed" }
        ]
    },
    eip_scatter: {
        nodes: [
            { id: "bc_scatter", type: "actor-home", label: "Scatter-Gather Pipeline", icon: "fa-arrows-split-up-and-left", x: 50, y: 50, color: "#f59e0b", isContainer: true, width: 850, height: 400 },
            { id: "n_in", type: "node", label: "Quote Request", icon: "fa-file-invoice", x: 80, y: 180, color: "#3b82f6", parentContainerId: "bc_scatter" },
            { id: "n_scatter", type: "node", label: "Recipient List", icon: "fa-share-nodes", x: 260, y: 180, color: "#f59e0b", parentContainerId: "bc_scatter" },
            { id: "svc_v1", type: "component", label: "Vendor A", icon: "fa-building", x: 480, y: 100, color: "#10b981", parentContainerId: "bc_scatter" },
            { id: "svc_v2", type: "component", label: "Vendor B", icon: "fa-building", x: 480, y: 180, color: "#10b981", parentContainerId: "bc_scatter" },
            { id: "svc_v3", type: "component", label: "Vendor C", icon: "fa-building", x: 480, y: 260, color: "#10b981", parentContainerId: "bc_scatter" },
            { id: "n_gather", type: "node", label: "Aggregator", icon: "fa-compress", x: 700, y: 180, color: "#8b5cf6", parentContainerId: "bc_scatter" }
        ],
        connections: [
            { id: "sc1", from: "n_in", fromPort: "right", to: "n_scatter", toPort: "left", animated: true },
            { id: "sc2", from: "n_scatter", fromPort: "right", to: "svc_v1", toPort: "left" },
            { id: "sc3", from: "n_scatter", fromPort: "right", to: "svc_v2", toPort: "left" },
            { id: "sc4", from: "n_scatter", fromPort: "right", to: "svc_v3", toPort: "left" },
            { id: "sc5", from: "svc_v1", fromPort: "right", to: "n_gather", toPort: "left" },
            { id: "sc6", from: "svc_v2", fromPort: "right", to: "n_gather", toPort: "left" },
            { id: "sc7", from: "svc_v3", fromPort: "right", to: "n_gather", toPort: "left" }
        ]
    },
    eip_router: {
        nodes: [
            { id: "bc_router", type: "actor-home", label: "Content Router", icon: "fa-route", x: 50, y: 50, color: "#0ea5e9", isContainer: true, width: 850, height: 400 },
            { id: "n_in", type: "node", label: "Incoming Message", icon: "fa-envelope", x: 80, y: 200, color: "#3b82f6", parentContainerId: "bc_router" },
            { id: "n_tap", type: "node", label: "Wire Tap", icon: "fa-eye", x: 250, y: 200, color: "#6366f1", parentContainerId: "bc_router" },
            { id: "n_router", type: "node", label: "Content Router", icon: "fa-code-branch", x: 450, y: 200, color: "#0ea5e9", parentContainerId: "bc_router" },
            { id: "svc_audit", type: "component", label: "Audit Log", icon: "fa-list-check", x: 250, y: 80, color: "#94a3b8", parentContainerId: "bc_router" },
            { id: "svc_prio", type: "component", label: "Priority Queue", icon: "fa-bolt", x: 700, y: 120, color: "#f59e0b", parentContainerId: "bc_router" },
            { id: "svc_std", type: "component", label: "Standard Queue", icon: "fa-inbox", x: 700, y: 280, color: "#10b981", parentContainerId: "bc_router" }
        ],
        connections: [
            { id: "rt1", from: "n_in", fromPort: "right", to: "n_tap", toPort: "left", animated: true },
            { id: "rt2", from: "n_tap", fromPort: "top", to: "svc_audit", toPort: "bottom", pattern: "dashed" },
            { id: "rt3", from: "n_tap", fromPort: "right", to: "n_router", toPort: "left", animated: true },
            { id: "rt4", from: "n_router", fromPort: "top", to: "svc_prio", toPort: "left", label: "is_urgent", animated: true },
            { id: "rt5", from: "n_router", fromPort: "bottom", to: "svc_std", toPort: "left", label: "default" }
        ]
    },
    eip_telemetry: {
        nodes: [
            { id: "bc_telemetry", type: "actor-home", label: "Event Telemetry", icon: "fa-gauge", x: 50, y: 50, color: "#8b5cf6", isContainer: true, width: 850, height: 400 },
            { id: "n_flow", type: "node", label: "Business Flow", icon: "fa-business-time", x: 80, y: 200, color: "#3b82f6", parentContainerId: "bc_telemetry" },
            { id: "n_tap", type: "node", label: "Stats Tap", icon: "fa-eye", x: 300, y: 200, color: "#8b5cf6", parentContainerId: "bc_telemetry" },
            { id: "n_agg", type: "node", label: "Stats Aggregator", icon: "fa-compress", x: 500, y: 120, color: "#ec4899", parentContainerId: "bc_telemetry" },
            { id: "n_dash", type: "component", label: "Grafana Dash", icon: "fa-chart-column", x: 700, y: 120, color: "#f59e0b", parentContainerId: "bc_telemetry" },
            { id: "n_next", type: "node", label: "Next Step", icon: "fa-forward-step", x: 550, y: 200, color: "#3b82f6", parentContainerId: "bc_telemetry" }
        ],
        connections: [
            { id: "tm1", from: "n_flow", fromPort: "right", to: "n_tap", toPort: "left", animated: true },
            { id: "tm2", from: "n_tap", fromPort: "top", to: "n_agg", toPort: "left", pattern: "dotted", label: "copy" },
            { id: "tm3", from: "n_agg", fromPort: "right", to: "n_dash", toPort: "left", animated: true },
            { id: "tm4", from: "n_tap", fromPort: "right", to: "n_next", toPort: "left", animated: true }
        ]
    },
    eip_pipeline: {
        nodes: [
            { id: "bc_pipe", type: "actor-home", label: "Order Pipeline", icon: "fa-filter", x: 50, y: 50, color: "#10b981", isContainer: true, width: 900, height: 400 },
            { id: "n_in", type: "node", label: "Order Received", icon: "fa-cart-shopping", x: 80, y: 200, color: "#3b82f6", parentContainerId: "bc_pipe" },
            { id: "n_val", type: "node", label: "Validator", icon: "fa-check-double", x: 250, y: 200, color: "#10b981", parentContainerId: "bc_pipe" },
            { id: "n_auth", type: "node", label: "Auth Check", icon: "fa-lock", x: 450, y: 200, color: "#6366f1", parentContainerId: "bc_pipe" },
            { id: "n_proc", type: "node", label: "Processor", icon: "fa-gear", x: 650, y: 200, color: "#8b5cf6", parentContainerId: "bc_pipe" },
            { id: "q_dlq", type: "component", label: "Dead Letter Queue", icon: "fa-skull", x: 250, y: 80, color: "#ef4444", parentContainerId: "bc_pipe" }
        ],
        connections: [
            { id: "p1", from: "n_in", fromPort: "right", to: "n_val", toPort: "left", animated: true },
            { id: "p2", from: "n_val", fromPort: "top", to: "q_dlq", toPort: "bottom", label: "invalid", pattern: "dashed" },
            { id: "p3", from: "n_val", fromPort: "right", to: "n_auth", toPort: "left", animated: true },
            { id: "p4", from: "n_auth", fromPort: "right", to: "n_proc", toPort: "left", animated: true }
        ]
    },
    eip_claim: {
        nodes: [
            { id: "bc_claim", type: "actor-home", label: "Claim Check Pattern", icon: "fa-ticket", x: 50, y: 50, color: "#ec4899", isContainer: true, width: 900, height: 400 },
            { id: "n_in", type: "node", label: "Large Payload", icon: "fa-file-zipper", x: 80, y: 200, color: "#3b82f6", parentContainerId: "bc_claim" },
            { id: "n_check", type: "node", label: "Check-In", icon: "fa-arrow-down-to-bracket", x: 280, y: 200, color: "#ec4899", parentContainerId: "bc_claim" },
            { id: "n_blob", type: "component", label: "S3 / Blob Store", icon: "fa-database", x: 280, y: 80, color: "#94a3b8", parentContainerId: "bc_claim" },
            { id: "n_bus", type: "node", label: "Message Bus", icon: "fa-bridge", x: 500, y: 200, color: "#6366f1", parentContainerId: "bc_claim" },
            { id: "n_out", type: "node", label: "Check-Out", icon: "fa-arrow-up-from-bracket", x: 700, y: 200, color: "#ec4899", parentContainerId: "bc_claim" }
        ],
        connections: [
            { id: "c1", from: "n_in", fromPort: "right", to: "n_check", toPort: "left", animated: true },
            { id: "c2", from: "n_check", fromPort: "top", to: "n_blob", toPort: "bottom", label: "store" },
            { id: "c3", from: "n_check", fromPort: "right", to: "n_bus", toPort: "left", label: "token", animated: true },
            { id: "c4", from: "n_bus", fromPort: "right", to: "n_out", toPort: "left", animated: true },
            { id: "c5", from: "n_out", fromPort: "top", to: "n_blob", toPort: "right", label: "retrieve" }
        ]
    },
    eip_pm: {
        nodes: [
            { id: "bc_pm", type: "actor-home", label: "Process Manager", icon: "fa-clipboard-user", x: 50, y: 50, color: "#6366f1", isContainer: true, width: 900, height: 450 },
            { id: "n_start", type: "node", label: "Request Start", icon: "fa-play", x: 80, y: 220, color: "#3b82f6", parentContainerId: "bc_pm" },
            { id: "n_pm", type: "node", label: "Process Manager", icon: "fa-user-gear", x: 280, y: 220, color: "#6366f1", parentContainerId: "bc_pm" },
            { id: "svc_a", type: "component", label: "Service A", icon: "fa-server", x: 500, y: 120, color: "#10b981", parentContainerId: "bc_pm" },
            { id: "svc_b", type: "component", label: "Service B", icon: "fa-server", x: 500, y: 220, color: "#10b981", parentContainerId: "bc_pm" },
            { id: "svc_c", type: "component", label: "Service C", icon: "fa-server", x: 500, y: 320, color: "#10b981", parentContainerId: "bc_pm" },
            { id: "n_end", type: "node", label: "Final Result", icon: "fa-flag-checkered", x: 720, y: 220, color: "#10b981", parentContainerId: "bc_pm" }
        ],
        connections: [
            { id: "pm1", from: "n_start", fromPort: "right", to: "n_pm", toPort: "left", animated: true },
            { id: "pm2", from: "n_pm", fromPort: "right", to: "svc_a", toPort: "left", animated: true },
            { id: "pm3", from: "n_pm", fromPort: "right", to: "svc_b", toPort: "left", animated: true },
            { id: "pm4", from: "n_pm", fromPort: "right", to: "svc_c", toPort: "left", animated: true },
            { id: "pm5", from: "svc_a", fromPort: "right", to: "n_end", toPort: "left" },
            { id: "pm6", from: "svc_b", fromPort: "right", to: "n_end", toPort: "left" },
            { id: "pm7", from: "svc_c", fromPort: "right", to: "n_end", toPort: "left" }
        ]
    },
    commercial_lending: {
        nodes: [
            { id: "bc_origination", type: "actor-home", label: "Loan Origination (Strategic)", icon: "fa-file-invoice-dollar", x: 40, y: 50, color: "#d97706", isContainer: true, width: 500, height: 400 },
            { id: "agg_loan", type: "component", label: "Loan Application", icon: "fa-crown", x: 80, y: 130, color: "#f59e0b", parentContainerId: "bc_origination" },
            { id: "cmd_score", type: "node", label: "Auto-Scoring", icon: "fa-calculator", x: 80, y: 280, color: "#3b82f6", parentContainerId: "bc_origination" },
            { id: "svc_risk", type: "component", label: "Risk Engine", icon: "fa-brain", x: 300, y: 200, color: "#ea580c", parentContainerId: "bc_origination" },
            { id: "bc_limits", type: "actor-home", label: "Limit Management", icon: "fa-scale-unbalanced", x: 600, y: 50, color: "#059669", isContainer: true, width: 450, height: 400 },
            { id: "agg_limits", type: "component", label: "Credit Sublimits", icon: "fa-crown", x: 640, y: 150, color: "#10b981", parentContainerId: "bc_limits" },
            { id: "evt_exposure", type: "node", label: "Exposure Updated", icon: "fa-bolt", x: 640, y: 300, color: "#34d399", parentContainerId: "bc_limits" }
        ],
        connections: [
            { id: "cl1", from: "agg_loan", fromPort: "bottom", to: "cmd_score", toPort: "top", label: "evaluate" },
            { id: "cl2", from: "cmd_score", fromPort: "right", to: "svc_risk", toPort: "left", label: "check" },
            { id: "cl3", from: "svc_risk", fromPort: "right", to: "agg_limits", toPort: "left", label: "allocate", animated: true },
            { id: "cl4", from: "agg_limits", fromPort: "bottom", to: "evt_exposure", toPort: "top", label: "notify" }
        ]
    },
    iso_translation: {
        nodes: [
            { id: "bc_iso", type: "actor-home", label: "Message Transformation", icon: "fa-language", x: 40, y: 50, color: "#db2777", isContainer: true, width: 950, height: 450 },
            { id: "n_in", type: "node", label: "Legacy SWIFT MT", icon: "fa-file-lines", x: 80, y: 220, color: "#9ca3af", parentContainerId: "bc_iso" },
            { id: "svc_norm", type: "component", label: "ISO Normalizer", icon: "fa-wand-magic-sparkles", x: 280, y: 220, color: "#6366f1", parentContainerId: "bc_iso" },
            { id: "svc_enrich", type: "component", label: "Data Enricher", icon: "fa-database", x: 480, y: 220, color: "#0ea5e9", parentContainerId: "bc_iso" },
            { id: "dec_route", type: "node", label: "Channel Router", icon: "fa-route", x: 680, y: 220, color: "#f59e0b", parentContainerId: "bc_iso" },
            { id: "n_out", type: "node", label: "ISO 20022 XML", icon: "fa-file-code", x: 850, y: 220, color: "#10b981", parentContainerId: "bc_iso" }
        ],
        connections: [
            { id: "is1", from: "n_in", fromPort: "right", to: "svc_norm", toPort: "left", animated: true },
            { id: "is2", from: "svc_norm", fromPort: "right", to: "svc_enrich", toPort: "left", animated: true },
            { id: "is3", from: "svc_enrich", fromPort: "right", to: "dec_route", toPort: "left", animated: true },
            { id: "is4", from: "dec_route", fromPort: "right", to: "n_out", toPort: "left", animated: true }
        ]
    },
    rule_routing: {
        nodes: [
            // Source Context
            { id: "bc_source", type: "actor-home", label: "Source System", icon: "fa-right-to-bracket", x: 40, y: 100, color: "#3b82f6", isContainer: true, width: 260, height: 360 },
            { id: "msg_req", type: "node", label: "Request Message", icon: "fa-envelope", x: 80, y: 200, color: "#3b82f6", parentContainerId: "bc_source", fields: [
                { name: "accountId", type: "String", value: "ACC-9981" },
                { name: "amount", type: "Double", value: "1500.00" },
                { name: "currency", type: "String", value: "USD" }
            ] },

            // Processing Context
            { id: "bc_processing", type: "actor-home", label: "Rule Processing Engine", icon: "fa-gears", x: 360, y: 50, color: "#8b5cf6", isContainer: true, width: 540, height: 460 },
            { id: "cache_rules", type: "component", label: "In-Memory Rule Cache", icon: "fa-memory", x: 400, y: 90, color: "#a855f7", parentContainerId: "bc_processing", fields: [
                { name: "Rule 1 (VIP)", type: "Rule", value: "Balance >= 10k" },
                { name: "Rule 2 (Std)", type: "Rule", value: "500 to 10k" },
                { name: "Rule 3 (Low)", type: "Rule", value: "< 500" },
                { name: "Rule 4 (Fraud)", type: "Rule", value: "< 0" }
            ] },
            { id: "rule_router", type: "node", label: "Rule Router", icon: "fa-code-branch", x: 690, y: 240, color: "#8b5cf6", parentContainerId: "bc_processing" },
            { id: "db_account", type: "component", label: "Account Database", icon: "fa-database", x: 400, y: 320, color: "#10b981", parentContainerId: "bc_processing", fields: [
                { name: "ACC-9981", type: "Account", value: "12000.00 USD" },
                { name: "ACC-1245", type: "Account", value: "320.00 USD" },
                { name: "ACC-4321", type: "Account", value: "-50.00 USD" }
            ] },

            // Target Components
            { id: "vip_target", type: "component", label: "VIP Processing", icon: "fa-crown", x: 980, y: 60, color: "#10b981" },
            { id: "std_target", type: "component", label: "Standard Clearing", icon: "fa-money-bill-transfer", x: 980, y: 170, color: "#3b82f6" },
            { id: "low_target", type: "component", label: "Low Balance Alert", icon: "fa-bell", x: 980, y: 280, color: "#f59e0b" },
            { id: "fraud_target", type: "component", label: "Fraud Alert System", icon: "fa-shield-halved", x: 980, y: 390, color: "#ef4444" }
        ],
        connections: [
            { id: "rr1", from: "msg_req", fromPort: "right", to: "rule_router", toPort: "left", label: "1. Transaction Request", animated: true, pattern: "dotted" },
            { id: "rr2", from: "rule_router", fromPort: "bottom", to: "db_account", toPort: "top", label: "2. Fetch Balance" },
            { id: "rr3", from: "rule_router", fromPort: "top", to: "cache_rules", toPort: "bottom", label: "3. Evaluate Rules" },
            { id: "rr4", from: "rule_router", fromPort: "right", to: "vip_target", toPort: "left", label: "Route: Balance >= 10k", animated: true, pattern: "dotted" },
            { id: "rr5", from: "rule_router", fromPort: "right", to: "std_target", toPort: "left", label: "Route: 500 <= Bal < 10k" },
            { id: "rr6", from: "rule_router", fromPort: "right", to: "low_target", toPort: "left", label: "Route: Bal < 500" },
            { id: "rr7", from: "rule_router", fromPort: "right", to: "fraud_target", toPort: "left", label: "Route: Bal < 0" }
        ]
    },
    dynamic_camel: {
        nodes: [
            // Route Store Context
            { id: "bc_database", type: "actor-home", label: "Centralized Route Store", icon: "fa-database", x: 40, y: 150, color: "#10b981", isContainer: true, width: 260, height: 350 },
            { id: "db_routes", type: "component", label: "Route Config DB", icon: "fa-server", x: 80, y: 220, color: "#10b981", parentContainerId: "bc_database", fields: [
                { name: "Active Route A", type: "Camel YAML", value: "Kafka -> Rule Router -> MongoDB" },
                { name: "Active Route B", type: "Camel XML", value: "SFTP File -> Audit -> NDM Push" },
                { name: "Active Route C", type: "Camel YAML", value: "REST Trigger -> DB Check -> Partner" }
            ] },

            // IDLE Engine Context
            { id: "bc_engine", type: "actor-home", label: "Quarkus + Camel Router (IDLE Engine)", icon: "fa-microchip", x: 350, y: 50, color: "#8b5cf6", isContainer: true, width: 540, height: 550 },
            { id: "engine_loader", type: "node", label: "Route Registry Loader", icon: "fa-rotate", x: 390, y: 120, color: "#8b5cf6", parentContainerId: "bc_engine" },
            { id: "camel_ctx", type: "component", label: "Camel Execution Context", icon: "fa-diagram-project", x: 670, y: 180, color: "#a855f7", parentContainerId: "bc_engine" },
            { id: "connectors", type: "component", label: "Pre-bound Client Pools", icon: "fa-network-wired", x: 390, y: 340, color: "#6366f1", parentContainerId: "bc_engine", fields: [
                { name: "Pre-bound Pools", type: "Pools", value: "Oracle, MongoDB, Kafka" },
                { name: "Protocols", type: "Clients", value: "SFTP, NDM, HTTP REST" }
            ] },

            // Target Systems & Partners
            { id: "kafka_broker", type: "component", label: "Kafka Event Bus", icon: "fa-comments", x: 960, y: 60, color: "#ea580c" },
            { id: "sftp_server", type: "component", label: "Partner SFTP Server", icon: "fa-cloud-arrow-up", x: 960, y: 160, color: "#a855f7" },
            { id: "ndm_node", type: "component", label: "Enterprise NDM Node", icon: "fa-share-nodes", x: 960, y: 260, color: "#3b82f6" },
            { id: "partner_rest", type: "component", label: "Partner REST API", icon: "fa-globe", x: 960, y: 360, color: "#10b981" },
            { id: "oracle_audit", type: "component", label: "Oracle Audit DB", icon: "fa-database", x: 960, y: 460, color: "#6b7280" }
        ],
        connections: [
            { id: "dc1", from: "engine_loader", fromPort: "left", to: "db_routes", toPort: "right", label: "1. Pull Configs", pattern: "dashed" },
            { id: "dc2", from: "engine_loader", fromPort: "right", to: "camel_ctx", toPort: "top", label: "2. Register Routes dynamically", animated: true, pattern: "dotted" },
            { id: "dc3", from: "camel_ctx", fromPort: "left", to: "connectors", toPort: "right", label: "3. Bind Pools" },
            { id: "dc4", from: "camel_ctx", fromPort: "right", to: "kafka_broker", toPort: "left", label: "Route A: Consume", animated: true, pattern: "dotted" },
            { id: "dc5", from: "camel_ctx", fromPort: "right", to: "sftp_server", toPort: "left", label: "Route B: Poll File" },
            { id: "dc6", from: "camel_ctx", fromPort: "right", to: "ndm_node", toPort: "left", label: "Route B: Send NDM" },
            { id: "dc7", from: "camel_ctx", fromPort: "right", to: "partner_rest", toPort: "left", label: "Route C: HTTP Invoke" },
            { id: "dc8", from: "camel_ctx", fromPort: "right", to: "oracle_audit", toPort: "left", label: "Audit Logs" }
        ]
    }
};

const ICON_CATEGORIES = {
    cloud: ["fa-cloud", "fa-server", "fa-database", "fa-network-wired", "fa-shield-halved", "fa-microchip", "fa-code", "fa-terminal"],
    messaging: ["fa-envelope", "fa-paper-plane", "fa-bolt", "fa-bolt-lightning", "fa-comments", "fa-bell", "fa-share-nodes", "fa-arrows-split-up-and-left"],
    strategic: ["fa-building", "fa-users", "fa-user-group", "fa-shield", "fa-lock", "fa-key", "fa-gear", "fa-sliders"],
    tactical: ["fa-cube", "fa-cubes", "fa-puzzle-piece", "fa-diagram-project", "fa-table", "fa-list-check", "fa-crown", "fa-circle-info"],
    financial: ["fa-building-columns", "fa-file-invoice-dollar", "fa-credit-card", "fa-chart-line", "fa-scale-balanced", "fa-money-bill-transfer", "fa-wallet"]
};
