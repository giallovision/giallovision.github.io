export function registerPortfolioNode() {
    function PortfolioNode() {
        this.addInput("Render Pipeline", "pipeline");
        this.title = "Portfolio";
        this.color = "#b0460038"; 
        this.size = [320, 100]; 
        
        // Track whether the mouse is actively hovering over our custom button
        this.is_hovering_btn = false; 
    }

    PortfolioNode.title = "Documents/Portfolio";

    PortfolioNode.prototype.onDrawForeground = function(ctx) {
        if (this.flags.collapsed) return;

        var btn_x = 20;
        var btn_y = 30;
        var btn_w = this.size[0] - 40;
        var btn_h = this.size[1] - 50;

        // Button Background & Border Logic
        if (this.is_hovering_btn) {
            ctx.fillStyle = "#ffb703"; // Solid Gold Hover Fill
            ctx.fillRect(btn_x, btn_y, btn_w, btn_h);
            ctx.fillStyle = "#000000"; // Black Text
        } else {
            ctx.fillStyle = "#111111"; // Dark Idle Fill
            ctx.fillRect(btn_x, btn_y, btn_w, btn_h);
            ctx.strokeStyle = "#ffb703"; // Gold Border
            ctx.lineWidth = 2;
            ctx.strokeRect(btn_x, btn_y, btn_w, btn_h);
            ctx.fillStyle = "#ffb703"; // Gold Text
        }

        // Button Text & Affordance Arrows
        ctx.textAlign = "center";
        ctx.font = "bold 16px 'Roboto', sans-serif";
        ctx.fillText(this.is_hovering_btn ? ">> INITIALIZE PORTFOLIO <<" : "INITIALIZE PORTFOLIO", this.size[0] / 2, btn_y + (btn_h / 2) + 6);
        ctx.textAlign = "left"; 
    };

    // Track Mouse Movements to trigger the hover state
    PortfolioNode.prototype.onMouseMove = function(e, local_pos) {
        var btn_x = 20, btn_y = 30;
        var btn_w = this.size[0] - 40, btn_h = this.size[1] - 50;
        
        let is_inside = (local_pos[0] > btn_x && local_pos[0] < btn_x + btn_w &&
                         local_pos[1] > btn_y && local_pos[1] < btn_y + btn_h);
        
        if (is_inside !== this.is_hovering_btn) {
            this.is_hovering_btn = is_inside;
            this.setDirtyCanvas(true, true); // Force UI Redraw
        }
    };

    // Clear hover state if mouse leaves the node entirely
    PortfolioNode.prototype.onMouseLeave = function(e) {
        if (this.is_hovering_btn) {
            this.is_hovering_btn = false;
            this.setDirtyCanvas(true, true);
        }
    };

    // Execute action on click
    PortfolioNode.prototype.onMouseDown = function(e, local_pos) {
        var btn_x = 20, btn_y = 30;
        var btn_w = this.size[0] - 40, btn_h = this.size[1] - 50;

        if (local_pos[0] > btn_x && local_pos[0] < btn_x + btn_w &&
            local_pos[1] > btn_y && local_pos[1] < btn_y + btn_h) {
            
            // Navigate in the SAME tab to share the active, stable SSL connection
            window.location.href = "portfolio.html";
            return true; 
        }
    };

    LiteGraph.registerNodeType("giallovision/Portfolio", PortfolioNode);
}