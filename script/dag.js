let N = 10; // Number of nodes

class Dag {
    constructor() {
        this.adj = Array.from({ length: N }, () => Array(10).fill(false));
        this.visit = Array(N).fill(false);
        this.order = Array(N).fill(null);
        this.t = 0;
        this.cycle = false;
    }

    DFS(i) {
        if (this.visit[i] === 1) { this.cycle = true; return; }
        if (this.visit[i] === 2) return;

        this.visit[i] = 1;

        for (let j = 0; j < N; ++j) {
            if (this.adj[i][j]) this.DFS(j);
        }

        this.visit[i] = 2;
        this.order[this.t++] = i;  // Fixing `s` to `i`
    }

    topological_ordering() {
        this.visit.fill(0);  // Reset visit array
        
        for (let i = 0; i < N; i++) {
            if (!this.visit[i]) this.DFS(i);
        }

        if (this.cycle) {
            /* console.log("Ｏ"); */
        } else {
            /* console.log("拓撲排序:"); */
            for (let i = N - 1; i >= 0; i--) {
                console.log(this.order[i]);
            }
        }
    }
}

let dag = new Dag();
setInterval(dag.topological_ordering(), 60000);