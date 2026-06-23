export function registerContactNode() {
    function ContactNode() {
        this.addInput("Render Pipeline", "pipeline");
        this.title = "Clear Comms";
        this.color = "#21364d83"; 
        this.size = [320, 100]; 
        
        this.is_hovering_btn = false;
    }

    ContactNode.title = "Comms/Contact";

    ContactNode.prototype.onDrawForeground = function(ctx) {
        if (this.flags.collapsed) return;

        var btn_x = 20;
        var btn_y = 30;
        var btn_w = this.size[0] - 40;
        var btn_h = this.size[1] - 50;

        if (this.is_hovering_btn) {
            ctx.fillStyle = "#00b4d8"; // Solid Teal Hover Fill
            ctx.fillRect(btn_x, btn_y, btn_w, btn_h);
            ctx.fillStyle = "#000000"; // Black Text
        } else {
            ctx.fillStyle = "#111111"; // Dark Idle Fill
            ctx.fillRect(btn_x, btn_y, btn_w, btn_h);
            ctx.strokeStyle = "#00b4d8"; // Teal Border
            ctx.lineWidth = 2;
            ctx.strokeRect(btn_x, btn_y, btn_w, btn_h);
            ctx.fillStyle = "#00b4d8"; // Teal Text
        }

        ctx.textAlign = "center";
        ctx.font = "bold 16px 'Roboto', sans-serif";
        ctx.fillText(this.is_hovering_btn ? ">> OPEN CONTACT FORM <<" : "OPEN CONTACT FORM", this.size[0] / 2, btn_y + (btn_h / 2) + 6);
        ctx.textAlign = "left"; 
    };

    ContactNode.prototype.onMouseMove = function(e, local_pos) {
        var btn_x = 20, btn_y = 30;
        var btn_w = this.size[0] - 40, btn_h = this.size[1] - 50;
        
        let is_inside = (local_pos[0] > btn_x && local_pos[0] < btn_x + btn_w &&
                         local_pos[1] > btn_y && local_pos[1] < btn_y + btn_h);
        
        if (is_inside !== this.is_hovering_btn) {
            this.is_hovering_btn = is_inside;
            this.setDirtyCanvas(true, true);
        }
    };

    ContactNode.prototype.onMouseLeave = function(e) {
        if (this.is_hovering_btn) {
            this.is_hovering_btn = false;
            this.setDirtyCanvas(true, true);
        }
    };

    ContactNode.prototype.onMouseDown = function(e, local_pos) {
        var btn_x = 20, btn_y = 30;
        var btn_w = this.size[0] - 40, btn_h = this.size[1] - 50;

        if (local_pos[0] > btn_x && local_pos[0] < btn_x + btn_w &&
            local_pos[1] > btn_y && local_pos[1] < btn_y + btn_h) {
            
            const modal = document.getElementById("contactModal");
            if (modal) {
                modal.style.display = "flex"; 
            }
            return true; 
        }
    };

    LiteGraph.registerNodeType("giallovision/contact", ContactNode);
}