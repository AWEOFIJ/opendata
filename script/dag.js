let N = 10; // Number of nodes

class Dag {
    constructor() {
        this.adj = [];
        this.topo = [];
        for (let i of Array(N).keys()) {
            this.adj[i] = new Array(N).fill(false);
        }

        this.visit = new Array(N).fill(false);
        this.order = new Array(N).fill(null);

        this.t = 0;
        this.cycle = false;
    }

    DFS(i) {
        if (this.visit[i] === 1) { this.cycle = true; return; }
        if (this.visit[i] === 2) return;

        this.visit[i] = 1;

        for (let j of Array(N).keys()) {
            if (this.adj[i][j]) {
                this.DFS(j);
                // console.log(this.DFS(j));
            } 
        }

        this.visit[i] = 2;
        this.order[this.t++] = i;  // Fixing `s` to `i`
        
    }

    topological_ordering() {
        this.visit.fill(0);  // Reset visit array

        for (let i of Array(N).keys()) {
            if (!this.visit[i]) {
                this.DFS(i);
                // console.log(this.DFS(i));
            } 
        }

        if (this.cycle) {
            /* console.log("Ｏ"); */
        } else {
            /* console.log("拓撲排序:"); */
            for (let i of Array.from(Array(N).keys()).reverse()) {
                //  console.log(this.order[i]);
                this.topo.push(this.order[i]);
            }
        }
        
        console.log(this.topo);
    }
}

let dag = new Dag();
dag.topological_ordering();