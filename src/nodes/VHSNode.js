export function registerVHSNode() {
    function VHSNode() {
        this.addInput("IMAGE", "image", { color_off: "#3399ff", color_on: "#66b2ff" });
        
        this.title = "Video Combine (VHS)";
        this.color = "#2a363b"; 
        
        this.addWidget("number", "frame_rate", 60, null, {min: 1, max: 120, step: 1});
        this.addWidget("toggle", "save_output", true, null);
        this.addWidget("combo", "format", "video/mp4", null, {values: ["video/mp4", "video/webm", "image/gif"]});
        this.addWidget("combo", "video_codec", "libx264", null, {values: ["libx264", "libx265", "prores_ks"]});
        
        this.size = [700, 500]; 

        this.active_type = null; 
        
        // Video Configuration
        this.video_el = document.createElement("video");
        this.video_el.muted = true;
        this.video_el.loop = true;
        this.video_el.setAttribute("playsinline", "");
        this.video_el.crossOrigin = "anonymous"; 

        // Image Configuration
        this.img_el = new Image();
        this.img_el.crossOrigin = "anonymous";

        var that = this;

        // FORCE REDRAWS WHEN ASYNC MEDIA FINISHES DOWNLOADING
        this.img_el.onload = function() {
            that.setDirtyCanvas(true, true);
        };
        this.video_el.oncanplay = function() {
            that.setDirtyCanvas(true, true);
        };

        window.addEventListener('giallo_video_start', () => {
            that.active_type = null;
            that.video_el.pause();
            that.setDirtyCanvas(true, true);
        });

        window.addEventListener('giallo_video_complete', () => {
            var assets = [
                "./assets/videos/ControlPose.mp4",
                "./assets/videos/Diff1.mp4",
                "./assets/videos/Diff2.mp4",
                "./assets/videos/Diff3.mp4",
                "./assets/videos/GVIS-WAN1.mp4",
                "./assets/videos/Jacket-WAN.mp4",
                "./assets/videos/LarysaAnimaAtmos.mp4",
                "./assets/videos/LarysaPan.mp4",
                "./assets/videos/LarysaZoomOut.mp4",
                "./assets/videos/OrpheusAtmos.mp4",
                "./assets/videos/OrpheusBG.mp4",
                "./assets/videos/OrpheusPan.mp4",
                "./assets/videos/SceneShift.mp4",
                "./assets/images/Duality1.png",
                "./assets/images/Intuition1.png",
                "./assets/images/Intuition2.png",
                "./assets/images/Logic1.png",
                "./assets/images/Oprheus2.png",
                "./assets/images/OprheusZoom.png",
                "./assets/images/Orpheus1.png"
            ];
            
            let src = assets[Math.floor(Math.random() * assets.length)];
            
            if (src.toLowerCase().endsWith('.mp4')) {
                that.active_type = 'video';
                that.video_el.src = src;
                that.video_el.play().catch(e => console.warn("Autoplay blocked:", e));
            } else {
                that.active_type = 'image';
                that.img_el.src = src;
            }
            that.setDirtyCanvas(true, true);
        });
    }

    VHSNode.title = "Video/Video Combine";

    VHSNode.prototype.onDrawBackground = function(ctx) {
        var margin = 10;
        var top_offset = 150; 
        var v_width = this.size[0] - margin * 2;
        var v_height = this.size[1] - top_offset - margin;

        if (v_height > 0) {
            ctx.fillStyle = "#000";
            ctx.fillRect(margin, top_offset, v_width, v_height);

            let intrinsicWidth = 0;
            let intrinsicHeight = 0;
            let isReady = false;

            if (this.active_type === 'video' && this.video_el.readyState >= 2) {
                intrinsicWidth = this.video_el.videoWidth;
                intrinsicHeight = this.video_el.videoHeight;
                isReady = true;
            } else if (this.active_type === 'image' && this.img_el.complete && this.img_el.width > 0) {
                intrinsicWidth = this.img_el.width;
                intrinsicHeight = this.img_el.height;
                isReady = true;
            }

            if (isReady && intrinsicWidth > 0 && intrinsicHeight > 0) {
                let scale = Math.min(v_width / intrinsicWidth, v_height / intrinsicHeight);
                let targetWidth = intrinsicWidth * scale;
                let targetHeight = intrinsicHeight * scale;
                
                let targetX = margin + (v_width - targetWidth) / 2;
                let targetY = top_offset + (v_height - targetHeight) / 2;

                if (this.active_type === 'video') {
                    ctx.drawImage(this.video_el, targetX, targetY, targetWidth, targetHeight);
                    this.setDirtyCanvas(true, true); // Keep looping frames for video
                } else {
                    ctx.drawImage(this.img_el, targetX, targetY, targetWidth, targetHeight);
                }
            } 
            else if (this.active_type === null) {
                ctx.fillStyle = "#111";
                ctx.fillRect(margin, top_offset, v_width, v_height);
                ctx.strokeStyle = "#333";
                ctx.strokeRect(margin, top_offset, v_width, v_height);
                
                ctx.fillStyle = "#444";
                ctx.font = "14px sans-serif";
                ctx.textAlign = "center";
                ctx.fillText("Awaiting Render Pipeline...", this.size[0]/2, top_offset + (v_height/2));
                ctx.textAlign = "left";
            }
        }
    };

    LiteGraph.registerNodeType("giallovision/vhs", VHSNode);
}