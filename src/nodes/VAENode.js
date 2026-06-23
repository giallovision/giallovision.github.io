export function registerVAENode() {
    function VAENode() {
        // Pink input
        this.addInput("samples", "latent", { color_off: "#ff3399", color_on: "#ff66b2" });
        // VAE input
        this.addInput("vae", "vae", { color_off: "#ff5555", color_on: "#ff8888" });
        // Blue output
        this.addOutput("IMAGE", "image", { color_off: "#3399ff", color_on: "#66b2ff" });
        
        this.title = "VAE Decode";
        this.color = "#67000068"; // ComfyUI VAE brownish-red
        this.size = [200, 60];
    }
    
    VAENode.title = "Latent/VAE Decode";
    LiteGraph.registerNodeType("giallovision/vae", VAENode);
}