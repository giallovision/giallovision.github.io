// ==========================================
// GIALLOVISION: SERVICES NODE ARCHITECTURE
// ==========================================

// Global Font Overrides to make the entire LiteGraph engine use Roboto and read larger
LiteGraph.NODE_TEXT_FONT = "700 14px 'Roboto', sans-serif"; 
LiteGraph.NODE_TITLE_COLOR = "#050505"; 

const graph = new LGraph();
const canvasEl = document.getElementById("service-canvas");
canvasEl.width = window.innerWidth;
canvasEl.height = window.innerHeight;

const canvas = new LGraphCanvas("#service-canvas", graph);
canvas.render_info = false; 
canvas.allow_searchbox = false;

LiteGraph.NODE_DEFAULT_COLOR = "#2b2b2b";
LiteGraph.NODE_DEFAULT_BGCOLOR = "#0d131a"; 

// Custom Cable Colors for Services
LGraphCanvas.link_type_colors = {
    "arch": "#3399ff",   
    "ai": "#ff3399",      
    "ops": "#00b4d8",     
    "infra": "#35ff5e"    
};

// ---------------------------------------------------------
// CUSTOM NODE 1: CENTRAL HUB
// ---------------------------------------------------------
function MasterHubNode() {
    this.addOutput("SYSTEM ARCHITECTURE", "arch", { color_off: "#3399ff", color_on: "#66b2ff" });
    this.addOutput("GENERATIVE AI", "ai", { color_off: "#ff3399", color_on: "#ff66b2" });
    this.addOutput("LIVE OPERATIONS", "ops", { color_off: "#00b4d8", color_on: "#5ce1e6" });
    this.addOutput("INFRASTRUCTURE", "infra", { color_off: "#35ff5e", color_on: "#80ff99" });
    
    this.title = "GIALLOVISION // CORE";
    this.color = "#ffb703"; 
    this.size = [420, 240]; 
    this.removable = false; 
    this.cloneable = false;
}
MasterHubNode.title = "Hub/Master";
MasterHubNode.prototype.onDrawBackground = function(ctx) {
    ctx.fillStyle = "#ffb703";
    ctx.font = "900 22px 'Roboto', sans-serif";
    ctx.fillText("MASTER SERVICE ARRAY", 25, 60); 
    
    ctx.fillStyle = "#a8b2c1"; 
    ctx.font = "500 16px 'Roboto', sans-serif";
    ctx.fillText("> System routing online.", 25, 100);
    ctx.fillText("> Data extracted from MSA.", 25, 130);
    ctx.fillText("> Awaiting parameters...", 25, 160);
};
LiteGraph.registerNodeType("services/hub", MasterHubNode);

// ---------------------------------------------------------
// CUSTOM NODE 2: DYNAMIC CATEGORY LIST
// ---------------------------------------------------------
function ServiceCategoryNode() {
    this.addInput("Data Stream", 0);
    
    this.properties = {
        title: "INIT MODULE",
        theme_color: "#ffffff",
        items: []
    };
    
    this.size = [540, 240]; 
    this.removable = false; 
    this.cloneable = false;
}
ServiceCategoryNode.title = "Services/Category";
ServiceCategoryNode.prototype.onDrawBackground = function(ctx) {
    var margin = 25;
    
    // Title
    ctx.fillStyle = this.properties.theme_color;
    ctx.font = "900 18px 'Roboto', sans-serif";
    ctx.fillText(this.properties.title.toUpperCase(), margin, 45);
    
    // Draw Divider Line
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 2;
    ctx.moveTo(margin, 65);
    ctx.lineTo(this.size[0] - margin, 65);
    ctx.stroke();

    // List Items
    for (var i = 0; i < this.properties.items.length; i++) {
        var yPos = 110 + (i * 32); 
        
        // Glowing Arrow Bullet
        ctx.fillStyle = this.properties.theme_color;
        ctx.font = "900 18px 'Roboto', sans-serif";
        ctx.fillText(">", margin, yPos);
        
        // Text
        ctx.fillStyle = "#f8fafc";
        ctx.font = "500 16px 'Roboto', sans-serif"; 
        ctx.fillText(this.properties.items[i], margin + 25, yPos);
    }
};
LiteGraph.registerNodeType("services/category", ServiceCategoryNode);

// ---------------------------------------------------------
// NODE INSTANTIATION & DATA INJECTION
// ---------------------------------------------------------

// 1. Hub Node
const node_hub = LiteGraph.createNode("services/hub");
graph.add(node_hub);

// 2. Systems Architecture (Blue)
const node_arch = LiteGraph.createNode("services/category");
node_arch.title = "MODULE // ARCHITECTURE"; 
node_arch.color = "#3399ff"; 
node_arch.inputs[0].type = "arch";
node_arch.inputs[0].color_off = "#3399ff";
node_arch.properties = {
    title: "Systems Architecture & Engineering",
    theme_color: "#3399ff",
    items: [
        "Vectorworks design & technical drafting blueprints",
        "Media server engineering & signal routing",
        "Multi-phase electrical load-balance calculations",
        "Real-time video canvas optimization"
    ]
};
node_arch.size = [540, 240];
graph.add(node_arch);

// 3. Generative AI (Pink)
const node_ai = LiteGraph.createNode("services/category");
node_ai.title = "MODULE // GENERATIVE_AI";
node_ai.color = "#ff3399";
node_ai.inputs[0].type = "ai";
node_ai.inputs[0].color_off = "#ff3399";
node_ai.properties = {
    title: "Generative AI & Interactive Frameworks",
    theme_color: "#ff3399",
    items: [
        "Custom ComfyUI visual rendering pipelines",
        "TouchDesigner interactive sensor frameworks",
        "Custom Python / Lua scripting logic arrays",
        "Real-time AI canvas generation & execution"
    ]
};
node_ai.size = [540, 240];
graph.add(node_ai);

// 4. Live Ops (Teal)
const node_ops = LiteGraph.createNode("services/category");
node_ops.title = "MODULE // LIVE_OPS";
node_ops.color = "#c270d2";
node_ops.inputs[0].type = "ops";
node_ops.inputs[0].color_off = "#c270d2";
node_ops.properties = {
    title: "Live Media Operations & Execution",
    theme_color: "#c270d2",
    items: [
        "Lead Systems Engineer (V1) deployments",
        "VJing & live creative content switching",
        "Active technical show-calling",
        "Resolume Arena & Touchdesigner execution"
    ]
};
node_ops.size = [540, 240];
graph.add(node_ops);

// 5. Infrastructure (Green)
const node_infra = LiteGraph.createNode("services/category");
node_infra.title = "MODULE // INFRASTRUCTURE";
node_infra.color = "#35ff5e";
node_infra.inputs[0].type = "infra";
node_infra.inputs[0].color_off = "#35ff5e";
node_infra.properties = {
    title: "Digital Infrastructure & Support",
    theme_color: "#35ff5e",
    items: [
        "Physical media server & 4K archive administration",
        "Remote troubleshooting & network management",
        "Off-site data redundancy workflows",
        "Software patching & OS maintenance"
    ]
};
node_infra.size = [540, 240];
graph.add(node_infra);

// --- WIRE THE CONNECTIONS ---
node_hub.connect(0, node_arch, 0); 
node_hub.connect(1, node_ai, 0);     
node_hub.connect(2, node_ops, 0);     
node_hub.connect(3, node_infra, 0);   

// ---------------------------------------------------------
// RESPONSIVE LAYOUT & CAMERA LOGIC
// ---------------------------------------------------------

function applyResponsiveLayout(isMobile) {
    if (isMobile) {
        // Vertical Column Layout for screens < 1024px
        node_hub.pos = [60, 440];
        node_arch.pos = [580, 60];
        node_ai.pos = [580, 340];
        node_ops.pos = [580, 620];
        node_infra.pos = [580, 900];
    } else {
        // Widescreen 2x2 Layout for Desktop
        node_hub.pos = [80, 200];
        // Top Row
        node_arch.pos = [600, 60];
        node_ai.pos = [1180, 60];
        // Bottom Row
        node_ops.pos = [600, 340];
        node_infra.pos = [1180, 340];
    }
}

function autoCenterCamera(screenWidth, screenHeight, isMobile) {
    if (isMobile) {
        canvas.ds.scale = 0.35; 
        canvas.ds.offset = [30, 80]; 
    } else {
        // Wider bounding box for the 2x2 grid
        const graphWidth = 1750;
        const graphHeight = 650;

        let finalScale = Math.min(screenWidth / graphWidth, screenHeight / graphHeight);
        
        finalScale = Math.max(finalScale, 0.65); 
        finalScale = Math.min(finalScale, 1.0);  
        
        canvas.ds.scale = finalScale;

        let xOffset = (screenWidth - (graphWidth * finalScale)) / 2;
        let yOffset = (screenHeight - (graphHeight * finalScale)) / 2;
        
        canvas.ds.offset = [Math.max(xOffset, 20), Math.max(yOffset + 30, 50)];
    }
    canvas.setDirty(true, true);
}

function updateCanvasResolution() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const isMobile = screenWidth < 1024; // Breakpoint for the 2x2 grid

    canvasEl.width = screenWidth;
    canvasEl.height = screenHeight;
    canvas.resize();
    
    applyResponsiveLayout(isMobile);
    autoCenterCamera(screenWidth, screenHeight, isMobile);
}

window.addEventListener("resize", updateCanvasResolution);
updateCanvasResolution(); 
graph.start();

// =========================================================
// DIRECT-INJECTION MOBILE TOUCH DRAG & ZOOM ENGINE
// =========================================================
if (window.innerWidth < 1024) {
    let lastTouchX = 0;
    let lastTouchY = 0;
    let initialPinchDist = null;
    let initialScale = 1;

    canvasEl.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            lastTouchX = e.touches[0].clientX;
            lastTouchY = e.touches[0].clientY;
            
            const touch = e.touches[0];
            const mousedownEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY,
                bubbles: true, cancelable: true, button: 0, buttons: 1
            });
            canvasEl.dispatchEvent(mousedownEvent);
        } 
        // --- NEW: PINCH INIT ---
        else if (e.touches.length === 2) {
            initialPinchDist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            initialScale = canvas.ds.scale; // Store the scale at the start of the pinch
        }
    }, { passive: false });

    canvasEl.addEventListener('touchmove', (e) => {
        e.preventDefault(); 
        
        // --- EXISTING: 1-FINGER PAN ---
        if (e.touches.length === 1 && !initialPinchDist) {
            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            
            const deltaX = currentX - lastTouchX;
            const deltaY = currentY - lastTouchY;
            
            canvas.ds.offset[0] += deltaX;
            canvas.ds.offset[1] += deltaY;
            
            lastTouchX = currentX;
            lastTouchY = currentY;
            
            canvas.setDirty(true, true); 
        } 
        // --- NEW: 2-FINGER ZOOM ---
        else if (e.touches.length === 2 && initialPinchDist) {
            const currentDist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            
            const scaleFactor = currentDist / initialPinchDist;
            
            // Clamp the zoom scale so they can't zoom in/out too far
            const newScale = Math.min(Math.max(initialScale * scaleFactor, 0.25), 2.0);
            
            canvas.ds.scale = newScale;
            canvas.setDirty(true, true);
        }
    }, { passive: false });

    canvasEl.addEventListener('touchend', (e) => {
        // Reset pinch state if a finger is lifted
        if (e.touches.length < 2) {
            initialPinchDist = null;
        }
        
        if (e.touches.length === 0) {
            const mouseupEvent = new MouseEvent('mouseup', {
                bubbles: true, cancelable: true, button: 0, buttons: 0
            });
            canvasEl.dispatchEvent(mouseupEvent);
        }
    }, { passive: false });
}

// Expose a global zoom function for optional UI buttons
window.zoomCanvas = function(factor) {
    canvas.ds.scale = Math.min(Math.max(canvas.ds.scale * factor, 0.25), 2.0);
    canvas.setDirty(true, true);
};