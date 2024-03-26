let start = null; // Начальное значение для точки старта
let end = null; // Начальное значение для точки конца

// Функция для получения геокодированного адреса по координатам
async function reverseGeocode(coordinates) {
    const query = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates[0]},${coordinates[1]}.json?language=ru&access_token=${mapboxgl.accessToken}`,
        { method: 'GET' }
    );
    const json = await query.json();
    return json.features[0].place_name;
}

// create a function to make a directions request
async function getRoute(start, end) {
    // make directions request using walking profile
    const query = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/walking/${start[0]},${start[1]};${end[0]},${end[1]}?language=ru&geometries=geojson&access_token=${mapboxgl.accessToken}`,
        { method: 'GET' }
    );
    const json = await query.json();
    const data = json.routes[0];
    const route = data.geometry.coordinates;
    const geojson = {
        'type': 'Feature',
        'properties': {},
        'geometry': {
            'type': 'LineString',
            'coordinates': route
        }
    };

    // if the route already exists on the map, we'll reset it using setData
    if (map.getSource('route')) {
        map.getSource('route').setData(geojson);
    } else {
        map.addLayer({
            'id': 'route',
            'type': 'line',
            'source': {
                'type': 'geojson',
                'data': geojson
            },
            'layout': {
                'line-join': 'round',
                'line-cap': 'round'
            },
            'paint': {
                'line-color': '#3887be',
                'line-width': 3,
                'line-opacity': 0.75
            }
        });
    }

    const instructions = document.getElementById('instructions');
    const steps = data.legs[0].steps;
    const tripDistance = data.distance.toFixed(0);

    let tripInstructions = '';
    for (const step of steps) {
        tripInstructions += `<li>${step.maneuver.instruction}</li>`;
    }

    instructions.innerHTML = `<p>Продолжительность: ${Math.floor(data.duration / 60)} минут 🕜</p>&nbsp;&nbsp;
                                <p>Расстояние: ${tripDistance} метров 🏁</p>
                                <ol>${tripInstructions}</ol>`;
}

map.on('load', () => {
    // Add destination to the map
    map.addLayer({
        'id': 'point',
        'type': 'circle',
        'source': {
            'type': 'geojson',
            'data': {
                'type': 'FeatureCollection',
                'features': []
            }
        },
        'paint': {
            'circle-radius': 10,
            'circle-color': '#3887be'
        }
    });

    map.on('click', async (event) => {
        const coords = Object.keys(event.lngLat).map((key) => event.lngLat[key]);
        const clickedPoint = {
            'type': 'Feature',
            'properties': {},
            'geometry': {
                'type': 'Point',
                'coordinates': coords
            }
        };

        if (!start) {
            start = coords;
            map.getSource('point').setData(clickedPoint);
            // Обратное геокодирование для начальной точки и обновление соответствующего поля ввода
            const startAddress = await reverseGeocode(coords);
            document.getElementById('start').value = startAddress;
        } else {
            end = coords;
            // Проверка наличия слоя с маркером конечной точки и его удаление, если он существует
            if (map.getLayer('end-point')) {
                map.removeLayer('end-point');
                map.removeSource('end-point');
            }
            map.addLayer({
                'id': 'end-point',
                'type': 'circle',
                'source': {
                    'type': 'geojson',
                    'data': clickedPoint
                },
                'paint': {
                    'circle-radius': 10,
                    'circle-color': '#f30'
                }
            });
            // Обратное геокодирование для конечной точки и обновление соответствующего поля ввода
            const endAddress = await reverseGeocode(coords);
            document.getElementById('end').value = endAddress;
            getRoute(start, end);
        }
    });

    // Функция для очистки карты, поля ввода и точки на карте
    function clearMapInputAndPoint(inputId, pointId) {
        document.getElementById(inputId).value = ''; // Очистка поля ввода
        map.getSource(pointId).setData({
            'type': 'FeatureCollection',
            'features': [] // Очистка точки на карте
        });

        // Проверка и удаление слоя маршрута
        if (map.getLayer('route')) {
            map.removeLayer('route');
        }
        if (map.getSource('route')) {
            map.removeSource('route');
        }
    }

    document.getElementById('clearStart').addEventListener('click', () => {
        clearMapInputAndPoint('start', 'point');
        start = null; // Сброс значения начальной точки
    });

    document.getElementById('clearEnd').addEventListener('click', () => {
        clearMapInputAndPoint('end', 'end-point');
        end = null; // Сброс значения конечной точки
    });
});
