const apiTC = "https://datacenter.taichung.gov.tw/swagger/OpenData/c923ad20-2ec6-43b9-b3ab-54527e99f7bc";
const apiKC = "https://openapi.kcg.gov.tw/Api/Service/Get/aaf4ce4b-4ca8-43de-bfaf-6dc97e89cac0";

const apiSource = [
    { id: 'tc', name: '台中市', url: apiTC },
    { id: 'kc', name: '高雄市', url: apiKC }
];

var curlat, curlng, fylat = 24.2543403, fylng = 120.7226995, map, Markers = L.markerClusterGroup();

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

        Markers.addLayer(L.marker([lat, lng], { icon: redIcon }).bindPopup("定位完成!"));
        Markers.addTo(map);

    } else {
        map.setView([lat, lng], 17);
        Markers.clearLayers();
    }
}

function loadData(lat, lng, intervalMs = 60) {

    apiSource.forEach(function (api) {
        $.ajax({
            url: api.url,
            type: 'GET',
            dataType: 'json',
            success: function (jsonData) {

                data = jsonData.data !== undefined ? jsonData.data : jsonData;

                for (let i in data) {
                    data[i].time = data[i].time !== undefined ? formatTimestamp(data[i].time) : data[i].time;
                    data[i].X = data[i].x !== undefined ? data[i].x : data[i].X;
                    data[i].Y = data[i].y !== undefined ? data[i].y : data[i].Y;
                }

                data.forEach(function (item) {
                    let Marker = L.marker([item.Y, item.X], { icon: blueIcon }).bindPopup('<div class="card"><div class="card-head"><h5 class="card-title">' + item.car + '</h5></div><div class="card-body"><p>車號：' + item.car + '</p><p>地點：' + item.location + '</p><p>更新時間：' + item.time + '</p></div></div>');
                    Markers.addLayer(Marker);
                });

                Markers.addTo(map);
            }
        })
    });

    console.log("time stamp: " + new Date().toString());   /* timeStamp */

    setInterval(function () {
        
        Markers.clearLayers();
        Markers.addLayer(L.marker([lat, lng], { icon: redIcon }).bindPopup("定位完成!"));
        Markers.addTo(map);

        apiSource.forEach(function (api) {
            $.ajax({
                url: api.url,
                type: 'GET',
                dataType: 'json',
                success: function (jsonData) {

                    data = jsonData.data !== undefined ? jsonData.data : jsonData;

                    for (let i in data) {
                        if (data[i].time !== undefined) { data[i].time = formatTimestamp(data[i].time); }
                        if (data[i].x !== undefined) { data[i].X = data[i].x; delete data[i].x; }
                        if (data[i].y !== undefined) { data[i].Y = data[i].y; delete data[i].y; }
                    }

                    data.forEach(function (item) {
                        let Marker = L.marker([item.Y, item.X], { icon: blueIcon }).bindPopup('<div class="card"><div class="card-head"><h5 class="card-title">' + item.car + '</h5></div><div class="card-body"><p>車號：' + item.car + '</p><p>地點：' + item.location + '</p><p>更新時間：' + item.time + '</p></div></div>');
                        Markers.addLayer(Marker);
                    });

                    Markers.addTo(map);
                }
            })
        });
        console.log("time stamp: " + new Date().toString());   /* timeStamp */
    }, intervalMs * 1000);

}

function formatTimestamp(ts) {
    let year, month, day, hour, minute, second;

    if (/^\d{8}T\d{6}$/.test(ts)) {
        year = parseInt(ts.slice(0, 4), 10);
        month = parseInt(ts.slice(4, 6), 10);
        day = parseInt(ts.slice(6, 8), 10);
        hour = parseInt(ts.slice(9, 11), 10);
        minute = parseInt(ts.slice(11, 13), 10);
        second = parseInt(ts.slice(13, 15), 10);
    } else {
        const [datePart, timePart] = ts.split('T');
        const [yearStr, monthStr, dayStr] = datePart.split('-');
        const [hourStr, minStr, secStr] = timePart.split(':');

        year = parseInt(yearStr, 10);
        month = parseInt(monthStr, 10);
        day = parseInt(dayStr, 10);
        hour = parseInt(hourStr, 10);
        minute = parseInt(minStr, 10);
        second = parseInt(secStr, 10);
    }

    const dateObj = new Date(year, month - 1, day, hour, minute, second);

    return `${dateObj.getFullYear()}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
}

function getLocation(position) {
    curlat = position.coords.latitude;
    curlng = position.coords.longitude;

    initMap(curlat, curlng);
    loadData(curlat, curlng);
}

function defaultloCation() {
    initMap(fylat, fylng);
    loadData(fylat, fylng);
}

$(document).ready(function () {

    navigator.geolocation.getCurrentPosition(getLocation, defaultloCation);

});