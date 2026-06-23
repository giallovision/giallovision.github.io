export function registerOSCNode() {
    function OSCNode() {
        this.addOutput("Control Data (OSC)", "signal", { color_off: "#7b0060", color_on: "#a80083" });
        this.title = "Touchdesigner / OSC Input";
        this.color = "#7b006049"; 
        this.size = [320, 140];
        
        this.data_buffer = new Array(60).fill(0); 

        // Sample & Hold state variables
        this.hold_counter = 0;
        this.hold_duration = 10; 
        this.current_val = 0;
        this.skew_slope = 0;
        
        // NEW: Throttle counter to slow down the frame rate
        this.tick = 0;
    }

    OSCNode.title = "Input/OSC";

    OSCNode.prototype.onDrawBackground = function(ctx) {
        
        var margin = 15;
        var top_offset = 40;
        var height = this.size[1] - top_offset - margin;
        var max_amp = (height / 2) - 2; 

        // 1. Update the data buffer (Only advance every 4th frame)
        this.tick++;
        var speed_divider = 3; // Change to 3 for slightly faster, 5 for even slower

        if (this.tick % speed_divider === 0) {
            this.hold_counter++;
            
            if (this.hold_counter >= this.hold_duration) {
                this.hold_counter = 0;
                this.hold_duration = Math.floor(Math.random() * 11) + 4;
                this.current_val = (Math.random() * (max_amp * 2)) - max_amp; 
                this.skew_slope = (Math.random() * 1.6) - 0.8; 
            }

            this.current_val += this.skew_slope;
            this.current_val = Math.max(Math.min(this.current_val, max_amp), -max_amp);

            var noise = (Math.random() * 4) - 2; 
            var new_signal = this.current_val + noise;

            this.data_buffer.shift(); 
            this.data_buffer.push(new_signal); 
        }

        // 2. Draw the oscilloscope background
        var width = this.size[0] - margin * 2;
        var mid_y = top_offset + (height / 2);

        ctx.fillStyle = "#0a0a0a";
        ctx.fillRect(margin, top_offset, width, height);

        // 3. Draw the center zero-line
        ctx.beginPath();
        ctx.strokeStyle = "#333333";
        ctx.lineWidth = 1;
        ctx.moveTo(margin, mid_y);
        ctx.lineTo(margin + width, mid_y);
        ctx.stroke();

        // 4. Draw the S&H waveform
        ctx.beginPath();
        ctx.strokeStyle = "#7b0060"; 
        ctx.lineWidth = 2;
        ctx.lineJoin = "bevel"; 
        
        for(let i = 0; i < this.data_buffer.length; i++) {
            let x = margin + (i / (this.data_buffer.length - 1)) * width;
            let y = mid_y + this.data_buffer[i];
            
            if(i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();

        this.setDirtyCanvas(true, true);
    };

    LiteGraph.registerNodeType("giallovision/osc", OSCNode);
}