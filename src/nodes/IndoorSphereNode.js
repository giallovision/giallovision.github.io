export function registerIndoorSphereNode() {
    function IndoorSphereNode() {
        this.addInput("Render Pipeline", "pipeline");
        this.title = "Canopy Render (16K Interior)";
        this.color = "#006c7e36"; // Slate background
        this.size = [320, 200];
    }

    IndoorSphereNode.title = "Sphere/Canopy Render";

    IndoorSphereNode.prototype.onDrawBackground = function(ctx) {
        var mid_x = this.size[0] / 2;
        var R = 105; 
        var base_y = (this.size[1] / 2) + 60; // Pushed down to leave room for the overhead canopy

        // 1. Draw the physical LED canopy boundary
        ctx.beginPath();
        ctx.arc(mid_x, base_y, R, Math.PI, 0); // 180-degree arch
        ctx.strokeStyle = "#00b4d8"; // Solid Teal boundary
        ctx.lineWidth = 2;
        ctx.stroke();

        // 2. Set clipping mask to keep lines inside the dome
        ctx.save();
        ctx.beginPath();
        ctx.arc(mid_x, base_y, R, Math.PI, 0);
        ctx.clip();

        var time = Date.now() / 1000;
        var spacing = 14; // Distance between horizontal rows
        var offset = (time * 30) % spacing; // Speed of upward movement

        // 3. Draw curved horizontal bands moving upward
        for (var y = base_y; y > base_y - R - spacing; y -= spacing) {
            var curr_y = y - offset;
            if (curr_y > base_y) continue; 
            
            // Calculate how wide the dome is at this specific height
            var progress = (base_y - curr_y) / R;
            var width = Math.sqrt(1 - progress * progress) * R;
            
            ctx.beginPath();
            // Curve the horizontal line downward slightly to fake 3D depth
            ctx.ellipse(mid_x, curr_y, width, width * 0.15, 0, 0, Math.PI, false);
            ctx.strokeStyle = "rgba(0, 180, 216, 0.5)"; // Soft Teal
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // 4. Add vertical support structure lines
        for(let i = 1; i < 4; i++) {
            let angle = i * (Math.PI / 4);
            let x_offset = Math.cos(angle) * R;
            ctx.beginPath();
            ctx.moveTo(mid_x, base_y - R); // Zenith
            // Curve down to the base to follow the fisheye distortion
            ctx.quadraticCurveTo(mid_x + x_offset, base_y - R/2, mid_x + x_offset, base_y);
            ctx.strokeStyle = "rgba(0, 180, 216, 0.2)";
            ctx.stroke();
        }

        ctx.restore(); // Remove clipping mask
        this.setDirtyCanvas(true, true);
    };

    LiteGraph.registerNodeType("giallovision/indoorsphere", IndoorSphereNode);
}