# Koa + MVC Refactor Plan

## 1. Goals / 目標
- 將現有前端直接抓取多來源 API 的模式改為後端集中抓取與正規化。
- 提供穩定、可擴充、分層清晰的 Koa MVC 架構。
- 引入資料持久化（SQLite），保留 30 天垃圾車位置資料，支援自動清理。
- 統一 API 響應格式與錯誤處理，改善前端負載與擴充性。
- 為後續功能（BBox 查詢、Swagger、測試、容器化、快取）鋪路。

## 2. Scope / 範圍
In scope:
- 建立 Koa 基礎啟動 `app.js` 與分層目錄。
- 資料來源設定、正規化邏輯、週期抓取與寫入。
- Models / Services / Controllers / Routes 清晰分工。
- 排程：每 5 分鐘抓取、每日清除過期 (>30 天) 資料。
- API：`GET /api/vehicles`, `GET /api/vehicles/bbox`, `POST /api/vehicles/refresh`。
- Hash 功能評估保留或抽離。

Out of scope (follow-up phases):
- WebSocket 即時推送。
- Redis 快取。
- Docker / CI / CD。
- 高級監控 / APM / Rate limiting。
- i18n / PWA / Notification / History playback。

## 3. Non-Goals / 非目標
- 不針對 UI 進行大型重寫（僅調整後端呼叫方式）。
- 不引入複雜 ORM（使用原生 sqlite3 驅動）。
- 不做高併發優化（後續可再擴展）。

## 4. Target Architecture / 目標架構
```
api/
  app.js                # 啟動 / 中介註冊 / 排程觸發
  config/
    database.js         # SQLite 連線 + schema 初始化
    sources.js          # 各城市資料來源陣列 (city, url)
  models/
    Vehicle.js          # 針對 vehicles table 的操作
    Hash.js             # (可選) 訪問或 IP Hash
  services/
    fetchService.js     # 抓取 → 正規化 → 寫入
    pruneService.js     # 過期資料清除
  controllers/
    vehicleController.js
    hashController.js
  routes/
    index.js            # 匯總路由
    vehicle.js          # /api/vehicles*
    hash.js             # /api/hashes*
  middleware/
    errorHandler.js     # 統一錯誤輸出
    logger.js           # 請求紀錄 + 耗時
script/
  script.js             # 前端改為呼叫 /api/vehicles
```

## 5. Data Model / 資料模型
Table: vehicles
| Column    | Type     | Note                        |
|-----------|----------|----------------------------|
| id        | INTEGER  | PK AUTOINCREMENT           |
| city      | TEXT     | 城市代碼（tc/kc 等）        |
| car       | TEXT     | 車號 / 識別               |
| lat       | REAL     | 緯度                       |
| lng       | REAL     | 經度                       |
| location  | TEXT     | 地點描述                   |
| time      | TEXT     | 原始或轉換後時間           |
| raw       | TEXT     | 原始紀錄 JSON (選擇性)     |
| stored_at | DATETIME | DEFAULT CURRENT_TIMESTAMP  |

## 6. API Design / API 設計
Base path: `/api`
| Method | Path | Params | Description |
|--------|------|--------|-------------|
| GET | `/api/vehicles` | `limit?` | 取全部或限制筆數最新資料 |
| GET | `/api/vehicles/bbox` | `minLat,maxLat,minLng,maxLng` | 地圖視窗內資料 |
| POST | `/api/vehicles/refresh` | none | 立即觸發抓取（管理用途） |
| GET | `/api/hashes` | (可選) | 若保留 Hash 模組則提供 |

Response 格式（成功）:
```json
{
  "status": "ok",
  "data": [...],
  "count": 123
}
```
錯誤格式：
```json
{
  "status": "error",
  "error": { "code": "INTERNAL", "message": "..." }
}
```

## 7. Normalization Logic / 正規化邏輯
來源常見欄位：`x|X`, `y|Y`, `time`, `car`, `location`
轉換規則：
- 緯度：`Y or y` → `lat`
- 經度：`X or x` → `lng`
- 時間：支援 `YYYYMMDDTHHMMSS` / `YYYY-MM-DDTHH:MM:SS` → 格式化 `YYYY/MM/DD HH:MM:SS`
- 缺失欄位以 `null` 儲存，不製造虛構值。

## 8. Scheduling / 排程
- `fetchService.startAutoFetch(intervalMs = 300000)`：每 5 分鐘抓取全部來源。
- `pruneService.startDailyPrune(retentionDays = 30)`：每日清除過期。
- 若 Node process 重啟 → 初始化時立即執行一次抓取。

## 9. Error Handling / 錯誤處理
- 中介層 `errorHandler.js` 捕捉同步/非同步錯誤。
- 分類：來源抓取失敗 / DB 寫入失敗 / 參數驗證錯誤。
- 將詳細 stack 僅在開發模式輸出；生產模式隱藏細節。

## 10. Logging / 紀錄
- `logger.js`：記錄 method, path, 狀態碼, 耗時(ms)。
- 抓取服務記錄每次來源 URL 與筆數；失敗時附錯誤訊息。

## 11. Migration Strategy / 遷移策略
1. 新增 Koa 架構並共存舊 Express `server.js`。
2. 完成基本 `/api/vehicles` 能回傳資料後，前端 `script.js` 改寫呼叫新 API。
3. 確認穩定後移除舊 `server.js`（改為 `app.js`）。
4. 可選：Hash 功能整合或獨立路由；若不再需要則標記棄用。

## 12. Testing Strategy / 測試策略（後續擴展）
- 單元測試：Normalization, Model insert/select。
- 整合測試：模擬抓取；使用 mock API 回應。
- E2E：前端呼叫 `/api/vehicles` 取得資料並渲染。

## 13. Deployment Considerations / 佈署考量
- 單檔 SQLite：若資料增長可轉換至外部 DB（Postgres）。
- 建議加入 Docker：多階段建置 Node 映像。
- 排程透過應用程式層；若需穩健改用外部排程（cron job/Kubernetes CronJob）。

## 14. Risk & Mitigation / 風險與緩解
| Risk | 描述 | 緩解 |
|------|------|------|
| API 格式變動 | 政府開放資料欄位突然調整 | 在 normalization 加保守判斷與 fallback |
| 抓取失敗 | 網路或來源暫時性錯誤 | 自動重試 (簡單 3 次) + 記錄 |
| SQLite 鎖定 | 高頻寫入導致 BUSY | 寫入批次處理，減少每筆交易 |
| 資料膨脹 | 長期無清理 | 定期 prune + retentionDays configurable |

## 15. Phase Plan / 階段計畫
| Phase | 內容 | 完成標記 |
|-------|------|----------|
| P1 | 架構目錄 + Koa 啟動 |  |
| P2 | DB 初始化 + Model |  |
| P3 | Normalization + 抓取服務 |  |
| P4 | Controllers + Routes |  |
| P5 | 前端改呼叫新 API |  |
| P6 | Prune 排程 + Logging |  |
| P7 | 移除舊 Express |  |
| P8 | 基礎測試 + 文件 |  |

## 16. Immediate Next Steps / 立即下一步
1. 建立 `package.json` 並安裝依賴。
2. 新增 `api/app.js` + `config/database.js` + `config/sources.js`。
3. 撰寫 `models/Vehicle.js` 與初始化 schema。
4. 建立 `services/fetchService.js`（先手動觸發函式）。
5. 加入 `/api/vehicles` 基礎回傳（暫回傳空陣列）→ 前端改呼叫。

---
此文件將跟進進度更新；完成各階段後可在表格打勾。歡迎調整或補充後再繼續執行重構。
