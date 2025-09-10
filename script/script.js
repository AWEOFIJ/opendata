const dataApiTc = "https://datacenter.taichung.gov.tw/swagger/OpenData/c923ad20-2ec6-43b9-b3ab-54527e99f7bc";
const dataApiKc = "https://openapi.kcg.gov.tw/Api/Service/Get/aaf4ce4b-4ca8-43de-bfaf-6dc97e89cac0";

var curlat, curlng, fylat = 24.2543403, fylng = 120.7226995, map, markers, refreshTimer = null;
var goldIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
var blueIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// 共用解析器：兩個來源資料格式相同時使用
function parseRecords(raw) {
    if (!raw) return [];
    // 若回傳為 CKAN-style (result.records)
    if (raw.result && Array.isArray(raw.result.records)) {
        return raw.result.records.map(function (item) {
            return {
                Y: parseFloat(item.Y || item.y || item.latitude || item.lat || 0),
                X: parseFloat(item.X || item.x || item.longitude || item.lng || 0),
                car: item.car || item.車號 || item.車輛編號 || item.VehicleId || '未知',
                location: item.location || item.地點 || item.address || item.Address || '',
                time: item.time || item.更新時間 || item.UpdateTime || item.Date || ''
            };
        });
    }
    // 若回傳直接就是陣列
    if (Array.isArray(raw)) {
        return raw.map(function (item) {
            return {
                Y: parseFloat(item.Y || item.y || item.latitude || item.lat || 0),
                X: parseFloat(item.X || item.x || item.longitude || item.lng || 0),
                car: item.car || item.車號 || item.車輛編號 || item.VehicleId || '未知',
                location: item.location || item.地點 || item.address || item.Address || '',
                time: item.time || item.更新時間 || item.UpdateTime || item.Date || ''
            };
        });
    }
    // 常見包裝屬性
    if (raw.Data && Array.isArray(raw.Data)) {
        return raw.Data.map(function (item) {
            return {
                Y: parseFloat(item.Y || item.y || item.latitude || item.lat || 0),
                X: parseFloat(item.X || item.x || item.longitude || item.lng || 0),
                car: item.car || '未知',
                location: item.location || '',
                time: item.time || ''
            };
        });
    }
    if (raw.data && Array.isArray(raw.data)) {
        return raw.data.map(function (item) {
            return {
                Y: parseFloat(item.Y || item.y || item.latitude || item.lat || 0),
                X: parseFloat(item.X || item.x || item.longitude || item.lng || 0),
                car: item.car || item.車號 || item.車輛編號 || '未知',
                location: item.location || item.地點 || item.address || '',
                time: item.time || item.更新時間 || item.Date || ''
            };
        });
    }
    // fallback
    return [];
}

const apiSources = [
    { id: 'tc', name: '台中市', url: dataApiTc, parse: parseRecords },
    { id: 'kc', name: '高雄市', url: dataApiKc, parse: parseRecords }
];

function initMap(lat, lng) {
    if (!map) {
        const OpenStreetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            reuseTiles: true,
            updateWhenIdle: true,
            detectRetina: true,
            keepBuffer: 2
        });
        map = L.map('map', {
            center: [lat, lng],
            zoom: 17,
            layers: [OpenStreetMap]
        });
        markers = L.markerClusterGroup().addTo(map);
    } else {
        map.setView([lat, lng], 15);
        markers.clearLayers();
    }
}

function loadData(lat, lng) {
    $('#api-content').html('載入中...');
    fetchAllSources().then(function (allData) {
        updateMarkers(lat, lng, allData);
        $('#api-content').html('<h5>共顯示 ' + allData.length + ' 筆資料（來自 ' + apiSources.length + ' 個來源）</h5>');
    }).catch(function () {
        $('#api-content').html('<div style="color:red;">資料載入失敗</div>');
    });
}

function fetchAllSources() {
    const calls = apiSources.map(function (src) {
        return $.ajax({ url: src.url, type: 'GET', dataType: 'json' })
            .then(function (raw) {
                const parsed = src.parse(raw);
                return parsed.map(function (r) {
                    return Object.assign({}, r, { city: src.name });
                });
            })
            .catch(function () {
                return [];
            });
    });
    return Promise.all(calls).then(function (results) { return [].concat.apply([], results); });
}

function updateMarkers(lat, lng, combined) {
    markers.clearLayers();
    // 顯示使用者位置
    markers.addLayer(L.marker([lat, lng], { icon: goldIcon }).bindPopup("定位完成!"));
    for (let i = 0; i < combined.length; i++) {
        const d = combined[i];
        if (!d || isNaN(d.Y) || isNaN(d.X)) continue;
        markers.addLayer(
            L.marker([d.Y, d.X], { icon: blueIcon }).bindPopup(
                '<div class="card"><div class="card-head"><h5 class="card-title">' + (d.car || '未知') + '</h5></div><div class="card-body"><p>城市：' + (d.city || '') + '</p><p>車號：' + (d.car || '') + '</p><p>地點：' + (d.location || '') + '</p><p>更新時間：' + (d.time || '') + '</p></div></div>'
            )
        );
    }
    if (!map.hasLayer(markers)) map.addLayer(markers);
}

function startAutoRefresh(lat, lng, intervalMs) {
    if (intervalMs === undefined) intervalMs = 60 * 1000;
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(function () {
        loadData(lat, lng);
    }, intervalMs);
}

// 初始化與定位（無下拉選單，兩個來源同時顯示）
$(document).ready(function () {

    console.log("time stamp: " + new Date().toString());

    if (!navigator.geolocation) {
        initMap(fylat, fylng);
        loadData(fylat, fylng);
        startAutoRefresh(fylat, fylng);
        return;
    }
    navigator.geolocation.getCurrentPosition(
        function (pos) {
            curlat = pos.coords.latitude;
            curlng = pos.coords.longitude;
            initMap(curlat, curlng);
            loadData(curlat, curlng);
            startAutoRefresh(curlat, curlng);
        },
        function () {
            initMap(fylat, fylng);
            loadData(fylat, fylng);
            startAutoRefresh(fylat, fylng);
        }
    );
});