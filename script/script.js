const dataAPI = "https://datacenter.taichung.gov.tw/swagger/OpenData/c923ad20-2ec6-43b9-b3ab-54527e99f7bc";
var curlat, curlng, fylat, fylng, Mapdata, map;

fylat = 24.2543403;
fylng = 120.7226995;

$(function () {
    navigator.geolocation.getCurrentPosition(success, fail, { maximumAge: 500000, enableHighAccuracy: true, timeout: 6000 });
});

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

function locateFailed(fylat, fylng, data, Mapdata) {

    data.latitude = fylat;
    data.longitude = fylng;
    data.map = Mapdata.map;
    data.markers = Mapdata.markers;

    show(data);
}

function show(data) {

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

    map = data.map;
    var markers = data.markers;

    markers.addLayer(L.marker([data.latitude, data.longitude], { icon: goldIcon }).bindPopup("定位完成!"));

    for (var i = 0; i < data.length; i++) {
        markers.addLayer(L.marker([data[i].Y, data[i].X], { icon: blueIcon }).bindPopup('<div class="card"><div class="card-head"><h5 class="card-title">' + data[i].car + '</h5></div><div class="card-body"><p>車號：' + data[i].car + '</p><p>地點：' + data[i].location + '</p><p>更新時間：' + data[i].time + '</p></div></div>'));
    }

    map.addLayer(markers);

    setTimeout(() => {
        reFreshPage(data);
    }, 15000);

}

function reFreshPage(data) {

    try {

        setInterval(() => {

            const map = data.map;
            const markers = data.markers;
            const curlat = data.curlat;
            const curlng = data.curlng;

            $.ajax({
                type: "GET",
                url: dataAPI,
                dataType: "json",
                success: function (data) {

                    markers.clearLayers();

                    var blueIcon = new L.Icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowSize: [41, 41]
                    });

                    for (var i = 0; i < data.length; i++) {
                        markers.addLayer(L.marker([data[i].Y, data[i].X], { icon: blueIcon }).bindPopup('<div class="card"><div class="card-head"><h5 class="card-title">' + data[i].car + '</h5></div><div class="card-body"><p>車號：' + data[i].car + '</p><p>地點：' + data[i].location + '</p><p>更新時間：' + data[i].time + '</p></div></div>'));
                    }

                    map.addLayer(markers);
                },
                error: function () {
                    alert("opendata error");
                }
            });
        }, 60000);

    } catch (error) {
        console.error('Fetch error:', error);
        contentDiv.textContent = 'Failed to load data';
    }
}

function initMap(lat, lng) {

    var OpenStreetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    map = L.map('map', {
        center: [lat, lng],
        zoom: 17,
        layers: [OpenStreetMap]
    });

    var markers = L.markerClusterGroup().addTo(map);
    map.addLayer(markers);

    var initmap = { openStreetMap: OpenStreetMap, map: map, markers: markers };

    return initmap;
}