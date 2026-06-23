export function registerOutdoorSphereNode() {
    function OutdoorSphereNode() {
        this.addInput("Render Pipeline", "pipeline");
        this.title = "Exosphere Render (Exterior)";
        this.color = "#473c0064"; // Slate background
        this.size = [320, 200];
    }

    OutdoorSphereNode.title = "Sphere/Exosphere Render";

    OutdoorSphereNode.prototype.onDrawBackground = function(ctx) {
        var mid_x = this.size[0] / 2;
        var mid_y = (this.size[1] / 2) + 35;
        
        var R = 90; // Canvas radius
        // 366ft height / 258ft radius = 1.418 total height ratio.
        // It extends exactly 0.418 * Radius below the center equator.
        var bottom_cutoff = R * 0.418; 

        // 1. Create the architectural clipping box
        ctx.save();
        ctx.beginPath();
        ctx.rect(mid_x - R - 5, mid_y - R - 5, (R * 2) + 10, R + bottom_cutoff + 5);
        ctx.clip();

        var time = Date.now() / 1000;

        // 2. Draw rotating Meridians (Longitudes)
        for(let i = 0; i < 6; i++) {
            let angle = (time * 0.4 + i * (Math.PI / 6)) % Math.PI;
            let width = Math.abs(Math.cos(angle)) * R;
            ctx.beginPath();
            ctx.ellipse(mid_x, mid_y, Math.max(width, 0.1), R, 0, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(255, 183, 3, 0.4)"; // Amber/Gold
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        
        // 3. Draw static Parallels (Latitudes)
        for(let i = -4; i <= 2; i++) { 
            let y_offset = i * (R / 4.5);
            let lat_width = Math.sqrt(R*R - y_offset*y_offset);
            ctx.beginPath();
            ctx.ellipse(mid_x, mid_y + y_offset, lat_width, lat_width * 0.15, 0, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(255, 183, 3, 0.4)";
            ctx.stroke();
        }

        // 4. Draw the actual structural base curve at the cutoff point
        var cut_width = Math.sqrt(R*R - bottom_cutoff*bottom_cutoff);
        ctx.beginPath();
        // Draw just the front edge of the sliced ellipse
        ctx.ellipse(mid_x, mid_y + bottom_cutoff, cut_width, cut_width * 0.15, 0, 0, Math.PI, false);
        ctx.strokeStyle = "#ffb703"; // Solid Gold lip
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore(); // Remove clipping mask
        this.setDirtyCanvas(true, true);
    };

    LiteGraph.registerNodeType("giallovision/outdoorsphere", OutdoorSphereNode);
}