// 配置參數
var IPINFO_TOKEN = 'ff8e3f6563a459'; // 替換為您的 ipinfo.io 令牌
var STORAGE_API_ENDPOINT = '/api/store-records.js'; // 替換為您的後端 API 路徑

/**
 * 獲取客戶端 IP 地址並傳送到後端進行儲存的主函數。
 * Records contain two kinds of data: ip, coordinate
 */
function fetchAndStoreIp() {
    // 檢查 jQuery 是否載入
    if (typeof jQuery === 'undefined') {
        console.error("錯誤：jQuery 尚未載入。此腳本需要 jQuery。");
        return;
    }
    
    var ipinfoUrl = 'https://ipinfo.io/json?token=' + IPINFO_TOKEN;
    
    console.log('--- 開始獲取 IP 資訊 ---');

    // 第一步：使用 $.ajax() 獲取 IP 資訊
    $.ajax({
        url: ipinfoUrl,
        method: 'GET',
        dataType: 'json',
        
        success: function (data) {
            var clientIp = data.ip;
            console.log('步驟 1 成功：成功獲取 IP。', { ip: clientIp, country: data.country }); // 僅在控制台顯示 IP

            // 第二步：將 IP 傳送到後端 API 儲存
            storeIpOnServer(clientIp);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            // 處理 IPinfo API 錯誤
            console.error('步驟 1 失敗：IP 獲取或 API 錯誤。', { 
                status: jqXHR.status, 
                text: textStatus, 
                error: errorThrown 
            });
        }
    });
}

function fetchAndStoreCoord() {
    // 第一步：使用 $.ajax() 獲取 IP 資訊
    $.ajax({
        url: STORAGE_API_ENDPOINT,
        method: 'POST',
        dataType: 'json',
        
        success: function (data) {
            
        },
        error: function (jqXHR, textStatus, errorThrown) {
            // 處理 IPinfo API 錯誤
            console.error('步驟 1 失敗：IP 獲取或 API 錯誤。', { 
                status: jqXHR.status, 
                text: textStatus, 
                error: errorThrown 
            });
        }
    });
}

/**
 * 將 IP 地址發送到後端 API 進行加密和資料庫儲存。
 * @param {string} ip - 客戶端的 IP 地址。
 */
function storeIpOnServer(ip) {
    console.log('--- 傳輸 IP Hash 到後端 ---');
    
    // 使用 $.ajax() 將數據 POST 到您的後端
    $.ajax({
        url: STORAGE_API_ENDPOINT,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ ip_address: ip }),
        dataType: 'json',
        
        success: function (result) {
            // 成功儲存後的處理
            console.log('步驟 2 成功：IP Hash 儲存成功。', {
                ip_hash: result.ip_hash,
                timestamp: result.timestamp
            });
        },
        error: function (jqXHR, textStatus, errorThrown) {
            // 儲存失敗的處理
            console.error('步驟 2 失敗：儲存 IP Hash 失敗。', {
                status: jqXHR.status, 
                text: textStatus, 
                error: errorThrown 
            });
        }
    });
}

// 在文檔準備就緒時執行主函數
$(document).ready(function () {
    fetchAndStoreIp();
});