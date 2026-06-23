export function registerContactNode() {
    function ContactNode() {
        this.addInput("Render Pipeline", "pipeline");
        this.title = "Clear Comms";
        this.color = "#21364d83"; // Deep Blue/Steel tint

        this.addWidget("button", "Contact", null, function() {
            const modal = document.getElementById("contactModal");
            if (modal) {
                modal.style.display = "flex"; // Triggers the modal popup
            }
        });

        this.size = this.computeSize(); 
        this.size[0] = Math.max(this.size[0], 320);
    }
    ContactNode.title = "Comms/Contact";
    LiteGraph.registerNodeType("giallovision/contact", ContactNode);
}