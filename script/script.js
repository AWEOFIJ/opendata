const apiTC = "https://datacenter.taichung.gov.tw/swagger/OpenData/c923ad20-2ec6-43b9-b3ab-54527e99f7bc";
const apiKC = "https://openapi.kcg.gov.tw/Api/Service/Get/aaf4ce4b-4ca8-43de-bfaf-6dc97e89cac0";

const apiSource = [
    { id: 'tc', name: '台中市', url: apiTC },
    { id: 'kc', name: '高雄市', url: apiKC }
];

var curlat, curlng, fylat = 24.2543403, fylng = 120.7226995, map;

var goldIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
var redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
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

    let userMarkers;

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
        userMarkers = L.markerClusterGroup().addTo(map);

        userMarkers.addLayer(L.marker([lat, lng], { icon: redIcon }).bindPopup("定位完成!"));

    } else {
        map.setView([lat, lng], 17);
        userMarkers.clearLayers();
    }
}

function loadData() {

    apiSource.forEach(function (api) {
        $.ajax({
            url: api.url,
            type: 'GET',
            dataType: 'json',
            success: function (jsonData) {

                let truckMarkers = L.markerClusterGroup().addTo(map);

                data = jsonData.data !== undefined ? jsonData.data : jsonData;

                for (let i in data) {
                    if (data[i].time !== undefined) { data[i].time = formatTimestamp(data[i].time); }
                }

                data.forEach(function (item) {

                    truckMarkers.addLayer(
                        L.marker([item.Y, item.X], { icon: blueIcon })
                            .bindPopup('<div class="card"><div class="card-head"><h5 class="card-title">' + item.car + '</h5></div><div class="card-body"><p>車號：' + item.car + '</p><p>地點：' + item.location + '</p><p>更新時間：' + item.time + '</p></div></div>')
                    );

                });

                map.addLayer(truckMarkers);
            }
        })
    });

    console.log("time stamp: " + new Date().toString());   /* timeStamp */
}

function formatTimestamp(ts) {
    const [datePart, timePart] = ts.split('T');

    const yearStr = datePart.slice(0, 4);
    const monthStr = datePart.slice(4, 6);
    const dayStr = datePart.slice(6, 8);

    const hourStr = timePart.slice(0, 2);
    const minStr = timePart.slice(2, 4);
    const secStr = timePart.slice(4, 6);

    const year = parseInt(yearStr, 10);
    const monthIndex = parseInt(monthStr, 10) - 1; 
    const day = parseInt(dayStr, 10);
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minStr, 10);
    const second = parseInt(secStr, 10);

    const dateObj = new Date(year, monthIndex, day, hour, minute, second);

    return `${dateObj.getFullYear()}/${String((monthIndex + 1)).padStart(2, '0')}/${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
}

function startAutoRefresh(intervalMs = 60) {

    setInterval(function () {
        loadData();
    }, intervalMs * 1000);

}

function getLocation(position) {
    curlat = position.coords.latitude;
    curlng = position.coords.longitude;

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

    navigator.geolocation.getCurrentPosition(getLocation, defaultloCation);

});