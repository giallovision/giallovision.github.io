export function registerPortfolioNode() {
    function PortfolioNode() {
        this.addInput("Render Pipeline", "pipeline");
        this.title = "Portfolio";
        this.color = "#b0460038"; 

        this.addWidget("button", "Initialize Portfolio", null, function() {
            // Opens the new scrollytelling Portfolio in a new tab
            window.open("Portfolio.html", "_blank");
        });

        this.size = this.computeSize(); 
        this.size[0] = Math.max(this.size[0], 320);
    }
    PortfolioNode.title = "Documents/Portfolio";
    LiteGraph.registerNodeType("giallovision/Portfolio", PortfolioNode);
}