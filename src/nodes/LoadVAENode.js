export function registerLoadVAENode() {
    function LoadVAENode() {
        this.addOutput("VAE", "vae", { color_off: "#ff5555", color_on: "#ff8888" });
        this.title = "Load VAE";
        this.color = "#67000068"; 
        
        // Add the widget FIRST
        this.addWidget("combo", "vae_name", "vae-ft-mse-840000.safetensors", null, {
            values: [
                "vae-ft-mse-840000.safetensors", 
                "kl-f8-anime2.ckpt", 
                "clearvae.safetensors"
            ]
        });

        // Force the size LAST
        this.size = this.computeSize(); // Tells LiteGraph to calculate what it needs
        this.size[0] = Math.max(this.size[0], 320); // Strictly enforces a minimum width of 320
    }

    LoadVAENode.title = "loaders/Load VAE";
    LiteGraph.registerNodeType("giallovision/loadvae", LoadVAENode);
}