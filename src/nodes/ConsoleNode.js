export function registerConsoleNode() {
    function ConsoleNode() {
        this.addOutput("Render Pipeline", "pipeline");
        this.title = "Console / Boot Sequence";
        this.size = [320, 260]; // Keep it a bit taller to fit the errors
        this.color = "#111111"; 

        this.boot_sequence = [
            "INIT: Giallovision Core v2.4.1",
            "Loading Linux Kernel...",
            "Mounting TrueNAS Scale [OK]",
            "Initializing Proxmox VM Routing [OK]",
            "Establishing OSC Protocols [OK]",
            "Probing NVIDIA CUDA Cores...",
            "GPU0: RTX Active, 96GiB VRAM Allocated",
            "GPU1: RTX Active, 96GiB VRAM Allocated",
            "System Status: PIPELINE READY"
        ];
        
        this.displayed_lines = [];
        this.line_index = 0;
        this.boot_timeout = null;
        this.is_oom = false;

        // GLOBAL FLAG: Lock the pipeline until VRAM is ready
        window.giallo_vram_ready = false;

        var that = this;
        
        function bootText() {
            if (that.line_index < that.boot_sequence.length) {
                that.displayed_lines.push(that.boot_sequence[that.line_index]);
                
                // --- NEW: dynamically trigger the OSC cable connection ---
                if (that.line_index === 4) {
                    window.dispatchEvent(new Event('giallo_osc_ready'));
                }

                // If we just printed the VRAM line (index 6), unlock the KSampler
                if (that.line_index >= 7) {
                    window.giallo_vram_ready = true;
                }

                that.line_index++;
                that.setDirtyCanvas(true, true); 
                that.boot_timeout = setTimeout(bootText, Math.random() * 300 + 150);
            }
        }
        
        that.boot_timeout = setTimeout(bootText, 500);

        // EASTER EGG LISTENER
        window.addEventListener('giallo_oom_error', () => {
            if (that.is_oom) return; // Prevent spam-clicking
            that.is_oom = true;
            
            // Stop the normal boot sequence dead in its tracks
            clearTimeout(that.boot_timeout);
            
            // Inject the PyTorch OOM panic into the terminal
            that.displayed_lines.push("");
            that.displayed_lines.push("torch.cuda.OutOfMemoryError:");
            that.displayed_lines.push("CUDA out of memory.");
            that.displayed_lines.push("Tried to allocate 114.50 GiB");
            that.displayed_lines.push("FATAL KERNEL PANIC. REBOOTING...");
            that.setDirtyCanvas(true, true);

            // Wait 3 seconds, wipe the screen, and start over
            setTimeout(() => {
                that.displayed_lines = [];
                that.line_index = 0;
                that.is_oom = false;
                window.giallo_vram_ready = false; // Relock the VRAM
                that.setDirtyCanvas(true, true);
                bootText();
            }, 3000);
        });
    }

    ConsoleNode.title = "Infrastructure/Console";
    
    ConsoleNode.prototype.onDrawBackground = function(ctx) {
        var margin = 10;
        var top_offset = 35;
        ctx.fillStyle = "#050505";
        ctx.fillRect(margin, top_offset, this.size[0] - margin * 2, this.size[1] - top_offset - margin);
        
        ctx.font = "12px 'Courier New', Courier, monospace";
        
        for (var i = 0; i < this.displayed_lines.length; i++) {
            var line = this.displayed_lines[i];
            
            // If the line is an OOM error, paint it blood red
            if (line.includes("OutOfMemory") || line.includes("CUDA out") || line.includes("Tried to") || line.includes("FATAL")) {
                ctx.fillStyle = "#ff3333";
            } else {
                ctx.fillStyle = "#35ff5e"; // Standard Hacker Green
            }
            
            ctx.fillText(line, margin + 10, top_offset + 20 + (i * 18));
        }
        
        // Draw a blinking cursor
        if (this.line_index >= this.boot_sequence.length && !this.is_oom && Math.floor(Date.now() / 500) % 2 === 0) {
            ctx.fillStyle = "#35ff5e";
            ctx.fillText("_", margin + 10, top_offset + 20 + (this.displayed_lines.length * 18));
            this.setDirtyCanvas(true, true); 
        }
    };

    LiteGraph.registerNodeType("giallovision/console", ConsoleNode);
}