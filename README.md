# OpenData Trash Truck Map (Taichung & Kaohsiung)

即時（或定期）整合台中 / 高雄垃圾車動態位置，前端使用 Leaflet 地圖與叢集視覺化，後端（重構目標）採用 **Koa + MVC + SQLite**，週期抓取來源資料並保存近 30 天。This project visualizes municipal trash truck positions for Taichung & Kaohsiung cities, planning a Koa MVC backend with persistence and data normalization.

## Demo (Static Front-End)
GitHub Pages (front-end only preview): https://aweofij.github.io/opendata/

> 注意：目前倉庫仍包含舊版 `Express server.js` 與純前端腳本。接下來的重構將替換為 Koa 架構並加入週期抓取與清理機制。

## Features / 功能
- 多來源 API 合併（台中、 高雄）
- Leaflet 地圖 + Marker Cluster 顯示車輛位置
- 時間戳格式標準化（多 API 式樣）
- 位置自動定位 + 基準紅色定位點
- （規劃中）Koa 後端週期抓取（每 5 分鐘）
- （規劃中）資料保留 30 天 + 自動 Prune（每日）
- （規劃中）統一查詢 API（全部 / BBox / 最新）
- （規劃中）GoJS 節點視覺摘要（車輛互動）

## Tech Stack / 技術棧
| Layer | Stack |
|-------|-------|
| Front-End | HTML5, jQuery, Leaflet, MarkerCluster, (Future) GoJS |
| Back-End (Target) | Node.js, Koa 2, @koa/router, @koa/cors, koa-bodyparser |
| Persistence | SQLite3 (簡易嵌入式 / file-based) |
| Data Fetch | node-fetch (或原生 fetch)、定時排程 setInterval / cron-like |
| Utility | md5, 時間戳正規化函式 |

## Planned Project Structure / 規劃目錄
```
api/
	app.js                # Koa 啟動入口（取代現有 server.js）
	config/
		database.js         # SQLite 初始化與連線
		sources.js          # 開放資料來源設定（URL、城市代碼）
	models/
		Vehicle.js          # 資料表 CRUD 封裝
		Hash.js             # 儲存訪問／IP Hash（若仍需要）
	services/
		fetchService.js     # 週期抓取與正規化
		pruneService.js     # 清理超過保留天數資料
	controllers/
		vehicleController.js
		hashController.js
	routes/
		index.js            # 聚合全部子路由
		vehicle.js          # /api/vehicles*
		hash.js             # /api/hashes*（可選）
	middleware/
		errorHandler.js     # 統一錯誤輸出
		logger.js           # 請求記錄與耗時
script/
	script.js             # 前端地圖 + 載入與刷新邏輯
	call_server.js        # 舊版前端呼叫（待評估是否保留）
db/
	sqlite.db             # SQLite 實體檔案（或重建）
index.html              # 主前端頁面
README.md               # 專案說明
```

## Current Structure (Pre-Refactor) / 目前現況（尚未完成 Koa 重構）
```
index.html             # 前端主頁（載入地圖與 jQuery 腳本）
script/
	script.js            # 直接呼叫二個外部 OpenData API，Leaflet 顯示 + 定期刷新（純前端）
	call_server.js       # 嘗試呼叫後端儲存 IP Hash（目前指向舊 Express 路徑）
api/
	server.js            # Express + sqlite3，提供 /api/store-ip-hash 與 /api/get-hashes（僅 Hash 功能）
db/
	sqlite.db            # 目前地圖數據尚未入庫（僅可能儲存 Hash）
img/                   # （資源檔，尚未整合進打包流程）
README.md              # 專案說明（已加入重構計畫）
.gitignore             # 基本忽略規則
```

### 現況限制
- 地圖資料直接前端抓取：無緩存 / 無歷史 / 無後端校正。
- Express 僅處理 IP Hash：與主要垃圾車功能分離。
- 無分層 / 無測試 / 無 API 統一格式。
- 無錯誤集中處理、無速率控制、無 Swagger。

### 重構必要性摘要
| 面向 | 現況 | 重構目標 |
|------|------|----------|
| 資料抓取 | 前端多次直接呼叫 | 後端統一週期抓取 + 正規化 |
| 持久化 | 無（僅 Hash） | SQLite 保存 30 天資料 |
| 架構 | 單檔 Express 雜湊 | Koa MVC 分層清晰 |
| 效能 | 每次全量 API 載入 | 後端集中抓取→前端精簡請求 |
| 擴充性 | 難以新增新城市 | 新增來源只改 `sources.js` + service |
| 可觀測性 | Console 粗粒度 | 中介層 logger + 統一錯誤格式 |
| 查詢能力 | 無範圍過濾 | 支援 BBox / 最新 / 條件查詢 |

## Data Flow / 資料流程（重構後）
1. 定時服務呼叫來源 API（台中、高雄）→ 回傳 JSON。
2. `fetchService` 正規化欄位：統一 `lat`, `lng`, `time`, `car`, `location`。
3. 寫入 `vehicles` 資料表（加入 `stored_at` Timestamp）。
4. 前端呼叫 `/api/vehicles` 取得最新合併資料。
5. 每日 `pruneService` 刪除超過 30 天資料。
6. （選擇性）使用 `bbox` 查詢地圖視窗範圍車輛。

## Database Schema (Planned)
```sql
CREATE TABLE vehicles (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	city TEXT NOT NULL,
	car TEXT,
	lat REAL,
	lng REAL,
	location TEXT,
	time TEXT,              -- 原始或格式化時間
	raw TEXT,               -- 原始來源 JSON (可選)
	stored_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_vehicles_city ON vehicles(city);
CREATE INDEX idx_vehicles_stored_at ON vehicles(stored_at);
```

## API Endpoints (Target Design)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/vehicles` | 取得全部（可加限制）最新車輛資料 |
| GET | `/api/vehicles/bbox?minLat=&maxLat=&minLng=&maxLng=` | 指定視窗範圍內車輛 |
| POST | `/api/vehicles/refresh` | 觸發立即抓取（管理用途） |
| GET | `/api/hashes` | （若保留）列出訪問 Hash 紀錄 |
| POST | `/api/store-ip-hash` | （沿用舊功能）儲存訪問 IP Hash |

> 現有 Express 路由將被替換；重構過程會逐步遷移與驗證。

## Setup / 開發環境
Prerequisites:
- Node.js >= 18 建議（具備原生 fetch）
- SQLite 自帶（無需額外服務）

Install & Run (after refactor applied):
```bash
npm install
npm run dev        # nodemon 或直接 node api/app.js
```

Current (before refactor) start (Express):
```bash
node api/server.js
```

## Scripts (Planned)
| Script | Purpose |
|--------|---------|
| `dev` | 啟動 Koa（可搭配 nodemon） |
| `fetch:once` | 手動測試單次抓取 |
| `prune` | 手動執行資料清理 |

## Roadmap / 重構里程碑
- [ ] 建立 `package.json` 與依賴
- [ ] 新增 `api/app.js` Koa 啟動（取代 Express）
- [ ] 建立 config / models / services / controllers / routes / middleware
- [ ] 實作週期抓取（5 分鐘）
- [ ] 實作每日清理（30 天保留）
- [ ] 前端改為呼叫後端統一 API
- [ ] 加入 BBox 查詢端點
- [ ] GoJS 節點互動（點節點定位地圖）
- [ ] 加入 Swagger / OpenAPI 說明檔
- [ ] 加入 Dockerfile + 容器化流程
- [ ] 加入 CI / Lint / 基礎測試

## Contributing
歡迎提出 Issue 與 PR。建議先討論資料欄位調整或 API 擴充。請保持 PR 專注於單一目的（功能或修正）。

## License
MIT (保留原 LICENSE)。

---
需要優先進行的下一步：建立 `package.json` 並安裝依賴，接著加入 `api/app.js` 與資料庫初始化模組。若同意我將繼續。
