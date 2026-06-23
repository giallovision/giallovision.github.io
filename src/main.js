import { registerConsoleNode } from './nodes/ConsoleNode.js';
import { registerPortfolioNode } from './nodes/PortfolioNode.js';
import { registerOutdoorSphereNode } from './nodes/OutdoorSphereNode.js';
import { registerIndoorSphereNode } from './nodes/IndoorSphereNode.js';
import { registerKSamplerNode } from './nodes/KSamplerNode.js';
import { registerContactNode } from './nodes/ContactNode.js';
import { registerOSCNode } from './nodes/OSCNode.js';
import { registerVAENode } from './nodes/VAENode.js';
import { registerVHSNode } from './nodes/VHSNode.js';
import { registerLoadVAENode } from './nodes/LoadVAENode.js'; // <-- NEW IMPORT

const graph = new LGraph();
const canvas = new LGraphCanvas("#mycanvas", graph);

canvas.render_info = false; 
canvas.allow_searchbox = false;
window.addEventListener("resize", () => canvas.resize());
canvas.resize();

LiteGraph.NODE_DEFAULT_COLOR = "#2b2b2b";
LiteGraph.NODE_DEFAULT_BGCOLOR = "#1c1c1c";

// --- CUSTOM CABLE COLORS ---
// This tells LiteGraph to color the connecting lines based on the slot's data type
LGraphCanvas.link_type_colors = {
    "pipeline": "#35ff5e", // Green (Main Infrastructure)
    "signal": "#7b0060",   // Neon Pink/Red (OSC Modulator)
    "latent": "#ff3399",   // Hot Pink (Latent Space)
    "vae": "#ff5555",      // Bright Red (VAE Model)
    "image": "#3399ff"     // Light Blue (Pixel Image)
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

const parent_x = 100;
const parent_y = 200;

const node_console = LiteGraph.createNode("giallovision/console");
node_console.pos = [parent_x, parent_y];
node_console.removable = false; node_console.cloneable = false;
graph.add(node_console);

const child_x = 500; 
const child_y = parent_y;

const node_osc = LiteGraph.createNode("giallovision/osc");
node_osc.pos = [parent_x, parent_y + 300]; 
node_osc.removable = false; node_osc.cloneable = false;
graph.add(node_osc);

const node_gen = LiteGraph.createNode("giallovision/generator");
node_gen.pos = [child_x, child_y];
node_gen.removable = false; node_gen.cloneable = false;
graph.add(node_gen);

const node_outdoor_sphere = LiteGraph.createNode("giallovision/outdoorsphere");
node_outdoor_sphere.pos = [child_x, child_y + 130]; 
node_outdoor_sphere.removable = false; node_outdoor_sphere.cloneable = false;
graph.add(node_outdoor_sphere);

const node_indoor_sphere = LiteGraph.createNode("giallovision/indoorsphere");
node_indoor_sphere.pos = [child_x, child_y + 380];
node_indoor_sphere.removable = false; node_indoor_sphere.cloneable = false;
graph.add(node_indoor_sphere);

const node_res = LiteGraph.createNode("giallovision/Portfolio");
node_res.pos = [parent_x, child_y + 490]; 
node_res.removable = false; node_res.cloneable = false;
graph.add(node_res);

const node_contact = LiteGraph.createNode("giallovision/contact");
node_contact.pos = [parent_x, child_y + 600]; 
node_contact.removable = false; node_contact.cloneable = false;
graph.add(node_contact);

const grandchild_x = child_x + 400; 

// Placed slightly above the VAE Decode node
const node_loadvae = LiteGraph.createNode("giallovision/loadvae");
node_loadvae.pos = [child_x, child_y - 120]; 
node_loadvae.removable = false; node_loadvae.cloneable = false;
graph.add(node_loadvae);

const node_vae = LiteGraph.createNode("giallovision/vae");
node_vae.pos = [grandchild_x, child_y - 120];
node_vae.removable = false; node_vae.cloneable = false;
graph.add(node_vae);

const node_vhs = LiteGraph.createNode("giallovision/vhs");
node_vhs.pos = [grandchild_x, child_y]; 
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

// Plug the OSC cable in when the terminal establishes the protocol
window.addEventListener('giallo_osc_ready', () => {
    node_osc.connect(0, node_gen, 1);
});

// Unplug the OSC cable if the user triggers the OOM crash!
window.addEventListener('giallo_oom_error', () => {
    node_osc.disconnectOutput(0); 
});

// --- DYNAMIC EVENT ROUTING ---

window.addEventListener('giallo_osc_ready', () => {
    node_osc.connect(0, node_gen, 1);
});

window.addEventListener('giallo_oom_error', () => {
    node_osc.disconnectOutput(0); 
});

graph.start();

// --- RESPONSIVE CAMERA AUTO-FRAMING ---
// This adjusts LiteGraph's internal scale (zoom) and offset (pan) 
// to perfectly frame your layout on any device.
function autoCenterCamera() {
    const screenWidth = window.innerWidth;
    
    // Your graph is roughly 1600px wide (from x=200 to the edge of the VHS node)
    const estimatedGraphWidth = 1700; 

    if (screenWidth < 1024) { 
        // Mobile & Portrait Tablets: Zoom out to fit the entire width into the screen
        canvas.ds.scale = screenWidth / estimatedGraphWidth; 
        
        // Push the graph slightly down from the top edge
        canvas.ds.offset = [20, 100]; 
    } else {
        // Desktop & Laptops: 100% scale
        canvas.ds.scale = 1.0; 
        
        // Dynamically center the graph on ultra-wide monitors, but never clip the left side
        let xOffset = Math.max(50, (screenWidth - estimatedGraphWidth) / 2);
        canvas.ds.offset = [xOffset, 100]; 
    }
    
    // Force the canvas to redraw with the new camera position
    canvas.setDirty(true, true);
}

// Frame the camera when the page first loads
autoCenterCamera();

// Re-frame the camera if the user resizes their desktop browser or rotates their phone
window.addEventListener("resize", () => {
    autoCenterCamera();
});

graph.start();