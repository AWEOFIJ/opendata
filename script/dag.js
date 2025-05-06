class Dag {
    constructor() {
        this.adj = Array.from({ length: 10 }, () => Array(10).fill(false));
        this.visit = Array(10).fill(false);
        this.order = Array(10).fill(null);
        this.t = 0;
        this.cycle = false;
    }

    DFS(i) {
        if (this.visit[i] === 1) { this.cycle = true; return; }
        if (this.visit[i] === 2) return;

        this.visit[i] = 1;

        for (let j = 0; j < 10; ++j) {
            if (this.adj[i][j]) this.DFS(j);
        }

        this.visit[i] = 2;
        this.order[this.t++] = i;  // Fixing `s` to `i`
    }

    topological_ordering() {
        this.visit.fill(0);  // Reset visit array
        
        for (let i = 0; i < 10; i++) {
            if (!this.visit[i]) this.DFS(i);
        }

        if (this.cycle) {
            console.log("圖上有環");
        } else {
            console.log("拓撲排序:");
            for (let i = 10 - 1; i >= 0; i--) {
                console.log(this.order[i]);
            }
        }
    }
}

let dag = new Dag();
dag.topological_ordering();