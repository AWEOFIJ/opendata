// 定義一個通用的API請求函數
function fetchAPI(url, method, data, successCallback, errorCallback) {
    $.ajax({
        url: url,
        method: method || 'GET',
        data: data || null,
        dataType: 'json',
        success: function(response) {
            if (successCallback) successCallback(response);
        },
        error: function(error) {
            if (errorCallback) errorCallback(error);
        }
    });
}

// 通用處理常式
function handleAPIs(apiConfigs, finalCallback) {
    let responses = [];
    let errors = [];
    let completedRequests = 0;

    apiConfigs.forEach((config, index) => {
        fetchAPI(config.url, config.method, config.data, 
            function(response) {
                responses[index] = response;
                completedRequests++;
                checkCompletion();
            }, 
            function(error) {
                errors[index] = error;
                completedRequests++;
                checkCompletion();
            }
        );
    });

    function checkCompletion() {
        if (completedRequests === apiConfigs.length) {
            finalCallback(responses, errors);
        }
    }
}

// 示例API配置列表
const apiConfigs = [
    { url: 'https://data.ntpc.gov.tw/api/datasets/edc3ad26-8ae7-4916-a00b-bc6048d19bf8/csv/file', method: 'GET' },  //新北市CSV資料
    { url: 'https://data.ntpc.gov.tw/api/datasets/edc3ad26-8ae7-4916-a00b-bc6048d19bf8/csv/file', method: 'POST', data: { key: 'value' } },  //JSON資料 高雄
    { url: 'https://data.moenv.gov.tw/api/v2/stat_p_47?api_key=9e565f9a-84dd-4e79-9097-d403cae1ea75&limit=1000&sort=ImportDate%20desc&format=XML', method: 'GET' }  // XML資料 台北
];

// 調用函數來處理API請求
handleAPIs(apiConfigs, function(responses, errors) {
    console.log('All API Responses:', responses);
    console.log('All API Errors:', errors);
    // 在這裡處理所有API的響應和錯誤
});
