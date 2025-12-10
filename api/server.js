// 引入所需模組
var express = require('express');
var sqlite3 = require('sqlite3').verbose();
var md5 = require('md5'); // 用於 IP 地址的 MD5 加密
var cors = require('cors'); // 用於處理跨域請求
var app = express();
var PORT = 3000; // 伺服器監聽的端口

// --- 設置中介軟體 (Middleware) ---

// 啟用 CORS：允許所有來源的跨域請求 (在開發環境中常用)
app.use(cors());

// 讓 Express 可以解析前端傳來的 JSON 格式的請求主體 (body)
app.use(express.json());


// --- 資料庫初始化 ---

// 開啟或創建 SQLite 資料庫文件
var DB_FILE = './ip_records.db';
var db = new sqlite3.Database(DB_FILE, function (err) {
    if (err) {
        console.error('資料庫連接錯誤:', err.message);
    } else {
        console.log('✅ 成功連接到 SQLite 資料庫:', DB_FILE);

        // 創建資料表 (如果不存在)
        db.run('CREATE TABLE IF NOT EXISTS access_hashes (id INTEGER PRIMARY KEY AUTOINCREMENT, \
                                            hash_value TEXT NOT NULL, \
                                            timestamp TEXT NOT NULL, \
                                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP)',
            function (err) {
                if (err) {
                    console.error('資料表創建錯誤:', err.message);
                } else {
                    console.log('✅ 資料表 access_hashes 已就緒。');
                }
            });
    }
});


// --- 核心 API 路由處理函數 ---

/**
 * 處理來自前端的 POST 請求，執行加密和儲存操作。
 * 路由: POST /api/store-hash
 */
function handleStoreIpHash(req, res) {
    var rawIp = req.body.ip_address;
    console.log(`收到請求。原始 IP: ${rawIp}`);

    // 1. 參數檢查
    if (!rawIp) {
        console.warn('請求無效：缺少 ip_address 參數。');
        // 返回 400 Bad Request 響應
        return res.status(400).json({
            error: '參數錯誤',
            message: '請求主體中缺少 ip_address 參數。'
        });
    }

    // 2. MD5 加密
    var ipHash = md5(rawIp);

    // 3. 獲取時間戳記 (修正為 ISO 8601 UTC 格式)
    var currentTimestamp = new Date().toISOString();
    console.log('使用的 UTC 時間戳記:', currentTimestamp); // 輸出 UTC 時間以供確認

    // 4. 儲存到 SQLite3
    var SQL_INSERT = 'INSERT INTO access_hashes (hash_value, timestamp) \
                      VALUES (?, ?)';

    db.run(SQL_INSERT, [ipHash, currentTimestamp], function (err) {
        if (err) {
            console.error('資料庫插入錯誤:', err.message);
            // 返回 500 Internal Server Error 響應
            return res.status(500).json({
                error: '伺服器內部錯誤',
                message: '資料庫儲存失敗',
                details: err.message
            });
        }

        // 5. 返回成功響應
        res.json({
            status: 'success',
            message: 'IP Hash 成功儲存。',
            record_id: this.lastID,
            ip_hash: ipHash,
            timestamp: currentTimestamp // 返回 UTC 時間
        });
        console.log(`✅ 成功儲存紀錄 ID: ${this.lastID}`);
    });
}

// --- API 路由定義 ---

// 將處理函數掛載到您前端程式碼中指定的路徑
app.post('/api/store-ip-hash', handleStoreIpHash);

// 額外的 GET 路由範例：獲取所有儲存的 Hash (用於測試/檢查)
app.get('/api/get-hashes', function (req, res) {
    // 數據庫中的 timestamp 欄位現在儲存的是 ISO 8601 格式的 UTC 時間
    db.all('SELECT hash_value, timestamp, created_at FROM access_hashes ORDER BY created_at DESC', function (err, rows) {
        if (err) {
            return res.status(500).json({ error: '無法讀取數據' });
        }
        res.json({
            count: rows.length,
            records: rows
        });
    });
});


// --- 啟動伺服器 ---

app.listen(PORT, function () {
    console.log(`--- 伺服器啟動 ---`);
    console.log(`🌐 服務器正在監聽端口 ${PORT}`);
    console.log(`📢 儲存 API 端點: http://localhost:${PORT}/api/store-ip-hash (POST)`);
    console.log(`📢 檢查數據端點: http://localhost:${PORT}/api/get-hashes (GET)`);
    console.log('--------------------');
});