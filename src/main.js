import { registerConsoleNode } from './nodes/ConsoleNode.js';
import { registerPortfolioNode } from './nodes/PortfolioNode.js';
import { registerOutdoorSphereNode } from './nodes/OutdoorSphereNode.js';
import { registerIndoorSphereNode } from './nodes/IndoorSphereNode.js';
import { registerKSamplerNode } from './nodes/KSamplerNode.js';
import { registerContactNode } from './nodes/ContactNode.js';
import { registerOSCNode } from './nodes/OSCNode.js';
import { registerVAENode } from './nodes/VAENode.js';
import { registerVHSNode } from './nodes/VHSNode.js';
import { registerLoadVAENode } from './nodes/LoadVAENode.js';

const graph = new LGraph();

// FIX: Strictly bind the internal canvas resolution to the window dimensions 
// before initializing LiteGraph to prevent stretched visuals and broken hitboxes.
const canvasEl = document.getElementById("mycanvas");
canvasEl.width = window.innerWidth;
canvasEl.height = window.innerHeight;

const canvas = new LGraphCanvas("#mycanvas", graph);

canvas.render_info = false; 
canvas.allow_searchbox = false;

LiteGraph.NODE_DEFAULT_COLOR = "#2b2b2b";
LiteGraph.NODE_DEFAULT_BGCOLOR = "#1c1c1c";

// --- CUSTOM CABLE COLORS ---
LGraphCanvas.link_type_colors = {
    "pipeline": "#35ff5e", 
    "signal": "#7b0060",   
    "latent": "#ff3399",   
    "vae": "#ff5555",      
    "image": "#3399ff"     
};

registerConsoleNode();
registerPortfolioNode();
registerKSamplerNode();
registerContactNode();
registerOutdoorSphereNode();
registerIndoorSphereNode();
registerOSCNode();
registerVAENode();
registerVHSNode();
registerLoadVAENode();

// --- NODE PLACEMENT & GRID ALIGNMENT ---
// Expanded horizontal gutters for optimal breathing room
const col1 = 50;
const col2 = 460; 
const col3 = 870;

// COLUMN 1 (Left) - Expanded vertical margins
const node_console = LiteGraph.createNode("giallovision/console");
node_console.pos = [col1, 50];
node_console.removable = false; node_console.cloneable = false;
graph.add(node_console);

const node_res = LiteGraph.createNode("giallovision/Portfolio");
node_res.pos = [col1, 350]; 
node_res.removable = false; node_res.cloneable = false;
graph.add(node_res);

const node_contact = LiteGraph.createNode("giallovision/contact");
node_contact.pos = [col1, 490]; 
node_contact.removable = false; node_contact.cloneable = false;
graph.add(node_contact);

const node_osc = LiteGraph.createNode("giallovision/osc");
node_osc.pos = [col1, 630]; 
node_osc.removable = false; node_osc.cloneable = false;
graph.add(node_osc);

// COLUMN 2 (Middle) - Shifted down to align with Column 1
const node_loadvae = LiteGraph.createNode("giallovision/loadvae");
node_loadvae.pos = [col2, 50]; 
node_loadvae.removable = false; node_loadvae.cloneable = false;
graph.add(node_loadvae);

const node_gen = LiteGraph.createNode("giallovision/generator");
node_gen.pos = [col2, 170];
node_gen.removable = false; node_gen.cloneable = false;
graph.add(node_gen);

const node_outdoor_sphere = LiteGraph.createNode("giallovision/outdoorsphere");
node_outdoor_sphere.pos = [col2, 350]; 
node_outdoor_sphere.removable = false; node_outdoor_sphere.cloneable = false;
graph.add(node_outdoor_sphere);

const node_indoor_sphere = LiteGraph.createNode("giallovision/indoorsphere");
node_indoor_sphere.pos = [col2, 590];
node_indoor_sphere.removable = false; node_indoor_sphere.cloneable = false;
graph.add(node_indoor_sphere);

// COLUMN 3 (Right)
const node_vae = LiteGraph.createNode("giallovision/vae");
node_vae.pos = [col3, 50];
node_vae.removable = false; node_vae.cloneable = false;
graph.add(node_vae);

const node_vhs = LiteGraph.createNode("giallovision/vhs");
node_vhs.pos = [col3, 170]; 
node_vhs.removable = false; node_vhs.cloneable = false;
graph.add(node_vhs);

// Base Infrastructure routing
node_console.connect(0, node_gen, 0); 
node_console.connect(0, node_outdoor_sphere, 0); 
node_console.connect(0, node_indoor_sphere, 0); 
node_console.connect(0, node_res, 0); 
node_console.connect(0, node_contact, 0);

// ComfyUI Rendering Pipeline
node_loadvae.connect(0, node_vae, 1); 
node_gen.connect(0, node_vae, 0);     
node_vae.connect(0, node_vhs, 0);     

// --- DYNAMIC EVENT ROUTING ---
window.addEventListener('giallo_osc_ready', () => {
    node_osc.connect(0, node_gen, 1);
});

window.addEventListener('giallo_oom_error', () => {
    node_osc.disconnectOutput(0); 
});

// --- RESPONSIVE CAMERA AUTO-FRAMING ---
function autoCenterCamera() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const isMobile = screenWidth < 768;

    if (isMobile) {
        // Sets a clear, readable zoom floor and offset coordinates for vertical displays
        canvas.ds.scale = 0.55; 
        canvas.ds.offset = [15, 30]; 
    } else {
        // STANDARD DESKTOP LOGIC
        const estimatedGraphWidth = 1670;
        const estimatedGraphHeight = 850;

        const scaleX = screenWidth / estimatedGraphWidth;
        const scaleY = screenHeight / estimatedGraphHeight;
        
        let finalScale = Math.min(scaleX, scaleY);
        finalScale = Math.min(finalScale, 1.0);
        
        canvas.ds.scale = finalScale;

        let xOffset = Math.max(20, (screenWidth - (estimatedGraphWidth * finalScale)) / 2);
        let yOffset = Math.max(20, (screenHeight - (estimatedGraphHeight * finalScale)) / 2);
        
        if (screenWidth >= 1024) {
            yOffset = Math.min(yOffset, 80);
        }

        canvas.ds.offset = [xOffset, yOffset];
    }
    canvas.setDirty(true, true);
}

// CLEAN GRAPHICS WINDOW INITIALIZER
function updateCanvasResolution() {
    canvasEl.width = window.innerWidth;
    canvasEl.height = window.innerHeight;
    canvas.resize();
    autoCenterCamera();
}

window.addEventListener("resize", updateCanvasResolution);
updateCanvasResolution(); // Initializes operational boundaries on boot
graph.start();

// ========================================================
// DIRECT-INJECTION MOBILE TOUCH DRAG ENGINE
// ========================================================
if (window.innerWidth < 768) {
    let lastTouchX = 0;
    let lastTouchY = 0;

    canvasEl.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            lastTouchX = e.touches[0].clientX;
            lastTouchY = e.touches[0].clientY;
            
            // Forwards a mousedown initialization to handle node actions/clicks cleanly
            const touch = e.touches[0];
            const mousedownEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY,
                bubbles: true,
                cancelable: true,
                button: 0,
                buttons: 1
            });
            canvasEl.dispatchEvent(mousedownEvent);
        }
    }, { passive: false });

    canvasEl.addEventListener('touchmove', (e) => {
        e.preventDefault(); // Locks mobile overscroll window bouncing completely
        
        if (e.touches.length === 1) {
            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            
            // Extract displacement deltas from touch movements
            const deltaX = currentX - lastTouchX;
            const deltaY = currentY - lastTouchY;
            
            // Map offsets directly into LiteGraph's matrix transform registers
            canvas.ds.offset[0] += deltaX;
            canvas.ds.offset[1] += deltaY;
            
            lastTouchX = currentX;
            lastTouchY = currentY;
            
            canvas.setDirty(true, true); // Force immediate canvas repaint loop
        }
    }, { passive: false });

    canvasEl.addEventListener('touchend', (e) => {
        const mouseupEvent = new MouseEvent('mouseup', {
            bubbles: true,
            cancelable: true,
            button: 0,
            buttons: 0
        });
        canvasEl.dispatchEvent(mouseupEvent);
    }, { passive: false });
}