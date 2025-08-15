const dataAPI = "https://datacenter.taichung.gov.tw/swagger/OpenData/c923ad20-2ec6-43b9-b3ab-54527e99f7bc";
var curlat, curlng, fylat, fylng, Mapdata, map, markers;
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

// 站前廣場/@24.2542089,120.7219762,337

fylat = 24.2543403;
fylng = 120.7226995;

function initMap(lat, lng) {

    const OpenStreetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });

    map = L.map('map', {
        center: [lat, lng],
        zoom: 17,
        layers: [OpenStreetMap]
    });

    markers = L.markerClusterGroup().addTo(map);

    map.addLayer(markers);

    var initmap = { openStreetMap: OpenStreetMap, map: map, markers: markers };

    return initmap;
}

function show(data) {

    map = data.map;
    markers = data.markers;
    markers.clearLayers();
    markers.addLayer(L.marker([data.latitude, data.longitude], {icon: goldIcon}).bindPopup("定位完成!"));

    for (let i = 0; i < data.length; i++) {
        markers.addLayer(L.marker([data[i].Y, data[i].X], { blueIcon }).bindPopup('<div class="card"><div class="card-head"><h5 class="card-title">' + data[i].car + '</h5></div><div class="card-body"><p>車號：' + data[i].car + '</p><p>地點：' + data[i].location + '</p><p>更新時間：' + data[i].time + '</p></div></div>'));
    }

    map.addLayer(markers);
}

function success(position) {

    curlat = position.coords.latitude;
    curlng = position.coords.longitude;
    Mapdata = initMap(curlat, curlng);

    $.ajax({
        type: "GET",
        url: dataAPI,
        dataType: "json",
        success: function (data) {

            data.latitude = curlat;
            data.longitude = curlng;
            data.map = Mapdata.map;
            data.markers = Mapdata.markers;

            show(data);
        },
        error: function () {
            alert("opendata error");
        }
    });
}

function locateFailed(fylat, fylng, data, Mapdata) {

    data.latitude = fylat;
    data.longitude = fylng;
    data.map = Mapdata.map;
    data.markers = Mapdata.markers;

    show(data);
}

function fail() {

    Mapdata = initMap(fylat, fylng);

    $.ajax({
        type: "GET",
        url: dataAPI,
        dataType: "json",
        success: function (data) {
            locateFailed(fylat, fylng, data, Mapdata);
        },
        error: function () {
            alert("opendata error");
        }
    });
}

$(document).ready(function () {
    if (!navigator.geolocation) {
        alert("對不起，您的瀏覽器不支援定位功能!");
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

    const time = new Date();
    const timeStamp = time.toUTCString();

    console.log("Current time: ", time);
    console.log("Current time (UTC): ", timeStamp);

    navigator.geolocation.watchPosition(success, fail, { maximumAge: 0, enableHighAccuracy: true, timeout: 6000 });  //maximumAge: 600000 = 10 minutes, enableHighAccuracy: true, timeout: 3000 = 3 seconds
    document.getElementById("map").innerHTML = map;
});