const dataAPI = "https://datacenter.taichung.gov.tw/swagger/OpenData/c923ad20-2ec6-43b9-b3ab-54527e99f7bc";
var curlat, curlng, fylat = 24.2543403, fylng = 120.7226995, map, markers;
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
            zoom: 15,
            layers: [OpenStreetMap]
        });
        markers = L.markerClusterGroup().addTo(map);
        map.addLayer(markers);
    } else {
        map.setView([lat, lng], 15);
        markers.clearLayers();
    }
}

function updateMarkers(lat, lng, data) {
    markers.clearLayers();
    markers.addLayer(L.marker([lat, lng], { icon: goldIcon }).bindPopup("定位完成!"));
    for (let i = 0; i < data.length; i++) {
        markers.addLayer(
            L.marker([data[i].Y, data[i].X], { icon: blueIcon })
                .bindPopup('<div class="card"><div class="card-head"><h5 class="card-title">' + data[i].car + '</h5></div><div class="card-body"><p>車號：' + data[i].car + '</p><p>地點：' + data[i].location + '</p><p>更新時間：' + data[i].time + '</p></div></div>')
        );
    }
    map.addLayer(markers);
}

function loadData(lat, lng) {
    $.ajax({
        type: "GET",
        url: dataAPI,
        dataType: "json",
        success: function (data) {
            // 假設 data 為陣列，依實際格式調整
            updateMarkers(lat, lng, data);
        },
        error: function () {
            alert("opendata error");
        }
    });
}

var refreshTimer = null;

function startAutoRefresh(lat, lng) {
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(function () {
        loadData(lat, lng);
    }, 60 * 1000); // 1分鐘 (60000ms)，如需2分鐘改為120000
}

$(document).ready(function () {
    if (!navigator.geolocation) {
        alert("對不起，這個瀏覽器不支援定位功能!");
        return;
    }
    if (!L || !L.map) {
        alert("對不起，Leaflet地圖庫載入錯誤!");
        return;
    }
    if (!L.markerClusterGroup) {
        alert("對不起，Leaflet Marker Cluster載入錯誤!");
        return;
    }

    // 只定位一次，初始化地圖
    navigator.geolocation.getCurrentPosition(
        function (position) {
            curlat = position.coords.latitude;
            curlng = position.coords.longitude;
            initMap(curlat, curlng);
            loadData(curlat, curlng);
            startAutoRefresh(curlat, curlng); // 加這行
        },
        function () {
            initMap(fylat, fylng);
            loadData(fylat, fylng);
            startAutoRefresh(fylat, fylng); // 加這行
        }
    );
});