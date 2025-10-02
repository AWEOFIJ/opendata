const dataAPITC = "https://datacenter.taichung.gov.tw/swagger/OpenData/c923ad20-2ec6-43b9-b3ab-54527e99f7bc";
const dataAPIKC = "https://openapi.kcg.gov.tw/Api/Service/Get/aaf4ce4b-4ca8-43de-bfaf-6dc97e89cac0";
const dataAPI = [{ name: "臺中市", url: dataAPITC }, { name: "高雄市", url: dataAPIKC }];

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

const apiSources = [
    { id: 'tc', name: '台中市', url: dataApiTc },
    { id: 'kc', name: '高雄市', url: dataApiKc }
];

/* 這是對的 */
function initMap(lat, lng) {
    if (!map) {
        const OpenStreetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            reuseTiles: true,
            updateWhenIdle: true,
            keepBuffer: 2
        });
        map = L.map('map', {
            center: [lat, lng],
            zoom: 17,
            layers: [OpenStreetMap]
        });
        markers = L.markerClusterGroup().addTo(map);

        markers.clearLayers();
        // 顯示使用者位置
        markers.addLayer(L.marker([curlat, curlng], { icon: goldIcon }).bindPopup("定位完成!"));

    } else {
        map.setView([lat, lng], 17);
        markers.clearLayers();
    }
}

function loadData() {

    dataAPI.forEach(
        $.ajax({
            url: dataAPI.url,
            type: 'GET',
            dataType: 'json',
            success: function (data) {

                data = data.data ? data.data : data;

                updateMarkers(curlat, curlng, data);
            }
        })
    );

    console.log("time stamp: " + new Date().toString());   /* timeStamp */
}

/* 這是對的 */
function updateMarkers(curlat, curlng, data) {

    for (let i = 0; i < data.length; i++) {
        markers.addLayer(
            L.marker([data[i].Y, data[i].X], { icon: blueIcon })
                .bindPopup('<div class="card"><div class="card-head"><h5 class="card-title">' + data[i].car + '</h5></div><div class="card-body"><p>車號：' + data[i].car + '</p><p>地點：' + data[i].location + '</p><p>更新時間：' + data[i].time + '</p></div></div>')
        );
    }
    map.addLayer(markers);
}

function loadData(lat, lng) {

    dataAPI.forEach(
        $.ajax({
            type: "GET",
            url: dataAPI.url,
            dataType: "json",
            success: function (data) {
                data = data.data ? data.data : data;    /*  */  /* 臺中市與高雄市API回傳格式不同 */
                updateMarkers(lat, lng, data);
            },
            error: function () {
                alert("opendata error");
            }
        })
    );
}

function startAutoRefresh(lat, lng) {
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(function () {
        loadData();
    }, intervalMs);
}

function getLocation(curlat, curlng) {
    initMap(curlat, curlng);
    loadData();
    startAutoRefresh();
}

function defaultloCation() {
    initMap(fylat, fylng);
    loadData();
    startAutoRefresh();
}

$(document).ready(function () {

    navigator.geolocation.getCurrentPosition(getLocation(curlat, curlng), defaultloCation);

});