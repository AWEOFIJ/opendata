let N = 10;

class Dag {
    constructor(N) {
        this.N = N;
        this.adj = new Map();  // key: 節點, value: 相鄰節點陣列
        for (let i = 0; i < N; i++) {
            this.adj.set(i, []);
        }

        this.visit = new Array(N).fill(0); // 0: 未訪問, 1: 訪問中, 2: 已完成
        this.order = new Array(N).fill(null);
        this.t = 0;
        this.cycle = false;
    }

    addEdge(from, to) {
        if (this.adj.has(from)) {
            this.adj.get(from).push(to);
        }
    }

    DFS(i) {
        if (this.visit[i] === 1) {
            this.cycle = true;
            return;
        }
        if (this.visit[i] === 2) return;

        this.visit[i] = 1;
        for (let j of this.adj.get(i)) {
            this.DFS(j);
        }
        this.visit[i] = 2;
        this.order[this.t++] = i;
    }

    topological_ordering() {
        this.visit.fill(0);
        this.t = 0;
        this.cycle = false;

        for (let i of Array(N).keys()) {
            if (this.visit[i] === 0) this.DFS(i);
        }

        if (this.cycle) {
            console.log("圖中存在環，無法拓撲排序");
        } else {
            console.log("拓撲排序結果:");
            for (let i of Array.from(Array(N).keys()).reverse()) {
                console.log(this.order[i]);
            }
        }
    }
}

let dag = new Dag(6);
dag.addEdge(0, 2);
dag.addEdge(1, 2);
dag.addEdge(2, 3);
dag.addEdge(4, 5);

dag.topological_ordering();