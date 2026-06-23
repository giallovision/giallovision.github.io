export function registerKSamplerNode() {
    function KSamplerNode() {
        // Green input (Optional: you can also color this one to match if you want!)
        this.addInput("Render Pipeline", "pipeline", { color_off: "#35ff5e", color_on: "#5dff7e" });
        
        // CUSTOM COLORED OSC INPUT DOT
        this.addInput("OSC Modulator", "signal", { color_off: "#7b0060", color_on: "#a80083" });
        
        // PINK OUTPUT DOT (LATENT)
        this.addOutput("LATENT", "latent", { color_off: "#ff3399", color_on: "#ff66b2" });
        
        this.title = "KSampler";
        this.color = "#ff33994c";

        this.is_generating = false;
        this.progress = 0;
        var that = this; 

        // 1. ADD THE WIDGET FIRST
        this.addWidget("button", "Queue Prompt", null, function() {
            if (that.is_generating) return; 
            
            // --- EASTER EGG CHECK ---
            if (typeof window.giallo_vram_ready !== 'undefined' && !window.giallo_vram_ready) {
                window.dispatchEvent(new Event('giallo_oom_error'));
                return; // Abort the generation
            }

            that.is_generating = true;
            that.progress = 0;
            
            // Wirelessly tell the VHS node to clear its screen
            window.dispatchEvent(new Event('giallo_video_start'));
            
            var num_steps = Math.floor(Math.random() * 2) + 3; 
            var current_step = 0;
            var milestones = [];
            
            for(let i = 1; i <= num_steps; i++) {
                if(i === num_steps) milestones.push(1.0); 
                else {
                    let base = i / num_steps; 
                    let jitter = (Math.random() * 0.20) - 0.05; 
                    milestones.push(Math.min(Math.max(base + jitter, 0.2), 0.95));
                }
            }
            
            function nextStep() {
                if (current_step < milestones.length) {
                    that.progress = milestones[current_step];
                    that.setDirtyCanvas(true, true); 
                    current_step++;
                    setTimeout(nextStep, Math.random() * 400 + 200);
                } else {
                    that.is_generating = false;
                    that.progress = 0; 
                    that.setDirtyCanvas(true, true);
                    
                    // Wirelessly tell the VHS node to play the video!
                    window.dispatchEvent(new Event('giallo_video_complete'));
                }
            }
            setTimeout(nextStep, Math.random() * 200 + 100);
        });

        // 2. FORCE THE SIZE LAST
        // This overrides the widget's attempt to shrink the node
        this.size = this.computeSize(); 
        this.size[0] = Math.max(this.size[0], 320); 
    }

    KSamplerNode.prototype.onDrawBackground = function(ctx) {
        if (this.is_generating) {
            ctx.fillStyle = "#35ff5e"; 
            var barHeight = 8; 
            ctx.fillRect(0, 0, this.size[0] * this.progress, barHeight);
        }
    };

    LiteGraph.registerNodeType("giallovision/generator", KSamplerNode);
}