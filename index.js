mapboxgl.accessToken = 'pk.eyJ1IjoiemhhcmVub3dhdCIsImEiOiJjbGpsYWx6enkwZ3JlM25yN2xmdzRidmprIn0.Rh1GTK4ItzMEsORFuU3JQw';

const map = new mapboxgl.Map({
    container: 'map',
    
    // style: 'mapbox://styles/zharenowat/clth1mlzk00bn01nrbc549c0j',
     style: 'mapbox://styles/mapbox/cjf4m44iw0uza2spb3q0a7s41',
    //  style: 'mapbox://styles/mapbox/light-v11',

    center: [49.124793, 55.787952],
    maxBounds: [[49.087793, 55.767952], [49.151793, 55.803952]],
    zoom: 16,
    minZoom: 13,
    pitch: 50,
    maxZoom: 20,
    attributionControl: false,
    antialias: true
});
map.addControl(new mapboxgl.NavigationControl());

map.addControl(new mapboxgl.AttributionControl({
  customAttribution: '<a>zharenowat</a>'
}));

const mapDiv = document.getElementById('map');
if (mapDiv.style.visibility === 'visible') map.resize();

// Тут начало теней


// При загрузке страницы вызываем функцию для обновления даты и времени
window.onload = function() {
  updateDateTimeDisplay();
};

var date = new Date();
var time = date.getHours() * 60 * 60 + date.getMinutes() * 60 + date.getSeconds();
var timeInput = document.getElementById('time');
timeInput.value = time;

// Найдем элемент, в котором будет отображаться дата и время
var dateTimeDisplay = document.getElementById('dateTimeDisplay');

// Обновление даты и времени
function updateDateTimeDisplay() {
  // Форматируем дату и время
  var formattedDateTime = formatDate(date);

  // Обновляем содержимое элемента с новой датой и временем
  dateTimeDisplay.textContent = formattedDateTime;
}

// Обработчик изменения ползунка
timeInput.oninput = () => {
  // Получаем значение времени из ползунка
  time = +timeInput.value;
  date.setHours(Math.floor(time / 60 / 60));
  date.setMinutes(Math.floor(time / 60) % 60);
  date.setSeconds(time % 60);

  // Вызываем функцию для обновления даты и времени
  updateDateTimeDisplay();
};

// Обработчик изменения даты
document.getElementById('dateInput').onchange = function() {
  date = new Date(this.value + 'T' + (date.getHours() < 10 ? '0' : '') + date.getHours() + ':' + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes() + ':' + (date.getSeconds() < 10 ? '0' : '') + date.getSeconds());
  updateDateTimeDisplay();
};

  map.triggerRepaint();
// Функция для форматирования даты и времени в строку
// Функция для форматирования даты и времени в строку
function formatDate(date) {
  var year = date.getFullYear().toString();
  var month = (date.getMonth() + 1).toString().padStart(2, '0');
  var day = date.getDate().toString().padStart(2, '0');
  var hours = date.getHours().toString().padStart(2, '0');
  var minutes = date.getMinutes().toString().padStart(2, '0');
  var seconds = date.getSeconds().toString().padStart(2, '0');
  return hours + ':' + minutes + ':' + seconds + ' ' + day + '-' + month + '-' + year;
}



class BuildingShadows {
    constructor() {
        this.id = 'building-shadows';
        this.type = 'custom';
        this.renderingMode = '3d';
        this.opacity = 0.5;
    }

    onAdd(map, gl) {
        this.map = map;
        const vertexSource = `
        uniform mat4 u_matrix;
        uniform float u_height_factor;
        uniform float u_altitude;
        uniform float u_azimuth;
        attribute vec2 a_pos;
        attribute vec4 a_normal_ed;
        attribute lowp vec2 a_base;
        attribute lowp vec2 a_height;
        void main() {
            float base = max(0.0, a_base.x);
            float height = max(0.0, a_height.x);
            float t = mod(a_normal_ed.x, 2.0);
            vec4 pos = vec4(a_pos, t > 0.0 ? height : base, 1);
            float len = pos.z * u_height_factor / tan(u_altitude);
            pos.x += cos(u_azimuth) * len;
            pos.y += sin(u_azimuth) * len;
            pos.z = 0.0;
            gl_Position = u_matrix * pos;
        }
        `;
        const fragmentSource = `
        void main() {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        }
        `;
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexSource);
        gl.compileShader(vertexShader);
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentSource);
        gl.compileShader(fragmentShader);
        this.program = gl.createProgram();
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);
        gl.validateProgram(this.program);
        this.uMatrix = gl.getUniformLocation(this.program, "u_matrix");
        this.uHeightFactor = gl.getUniformLocation(this.program, "u_height_factor");
        this.uAltitude = gl.getUniformLocation(this.program, "u_altitude");
        this.uAzimuth = gl.getUniformLocation(this.program, "u_azimuth");
        this.aPos = gl.getAttribLocation(this.program, "a_pos");
        this.aNormal = gl.getAttribLocation(this.program, "a_normal_ed");
        this.aBase = gl.getAttribLocation(this.program, "a_base");
        this.aHeight = gl.getAttribLocation(this.program, "a_height");
    }



    render(gl, matrix) {
        gl.useProgram(this.program);
        const source = this.map.style.sourceCaches['composite'];
        const coords = source.getVisibleCoordinates().reverse();
        const buildingsLayer = map.getLayer('3d-buildings');
        const context = this.map.painter.context;
        const {lng, lat} = this.map.getCenter();
        const pos = SunCalc.getPosition(date, lat, lng);
        gl.uniform1f(this.uAltitude, pos.altitude);
        gl.uniform1f(this.uAzimuth, pos.azimuth + 3 * Math.PI / 2);
        map.setLight({
            anchor: 'map',
            position: [1.5, 180 + pos.azimuth * 180 / Math.PI, 90 - pos.altitude * 180 / Math.PI],
            'position-transition': {duration: 0},
            color: '#fdb'
            // color: `hsl(20, ${50 * Math.cos(pos.altitude)}%, ${ 200 * Math.sin(pos.altitude) }%)`
        }, {duration: 0});
        this.opacity = Math.sin(Math.max(pos.altitude, 0)) * 0.9;
        for (const coord of coords) {
            const tile = source.getTile(coord);
            const bucket = tile.getBucket(buildingsLayer);
            if (!bucket) continue;
            const [heightBuffer, baseBuffer] = bucket.programConfigurations.programConfigurations['3d-buildings']._buffers;
            gl.uniformMatrix4fv(this.uMatrix, false, coord.posMatrix);
            gl.uniform1f(this.uHeightFactor, Math.pow(2, coord.overscaledZ) / tile.tileSize / 8);
            for (const segment of bucket.segments.get()) {
                const numPrevAttrib = context.currentNumAttributes || 0;
                const numNextAttrib = 2;
                for (let i = numNextAttrib; i < numPrevAttrib; i++) gl.disableVertexAttribArray(i);
                const vertexOffset = segment.vertexOffset || 0;
                gl.enableVertexAttribArray(this.aPos);
                gl.enableVertexAttribArray(this.aNormal);
                gl.enableVertexAttribArray(this.aHeight);
                gl.enableVertexAttribArray(this.aBase);
                bucket.layoutVertexBuffer.bind();
                gl.vertexAttribPointer(this.aPos, 2, gl.SHORT, false, 12, 12 * vertexOffset);
                gl.vertexAttribPointer(this.aNormal, 4, gl.SHORT, false, 12, 4 + 12 * vertexOffset);
                heightBuffer.bind();
                gl.vertexAttribPointer(this.aHeight, 1, gl.FLOAT, false, 4, 4 * vertexOffset);
                baseBuffer.bind();
                gl.vertexAttribPointer(this.aBase, 1, gl.FLOAT, false, 4, 4 * vertexOffset);
                bucket.indexBuffer.bind();
                context.currentNumAttributes = numNextAttrib;
                gl.drawElements(gl.TRIANGLES, segment.primitiveLength * 3, gl.UNSIGNED_SHORT, segment.primitiveOffset * 3 * 2);
            }
        }
    }
}


map.on('load', () => {
  console.log(date.getHours(), date.getMinutes(), date.getSeconds());
  console.log(date);


    map.removeLayer('building');
    map.removeLayer('trees');
    map.addLayer({
        'id': '3d-buildings',
        'source': 'composite',
        'source-layer': 'building',
        'type': 'fill-extrusion',
        'minzoom': 14,
        'paint': {
            'fill-extrusion-color': '#ddd',
            'fill-extrusion-height': ["number", ["get", "height"], 5],
            'fill-extrusion-base': ["number", ["get", "min_height"], 0],
            'fill-extrusion-opacity': 1
        }
    }, );


    // Пойдем от обратного, сделаем всё аналогично

    class TreeShadows {
      constructor() {
          this.id = 'tree-shadows';
          this.type = 'custom';
          this.renderingMode = '3d';
          this.opacity = 0.5;
      }
  
      onAdd(map, gl) {
          this.map = map;
          const vertexSource = `
          uniform mat4 u_matrix;
          uniform float u_height_factor;
          uniform float u_altitude;
          uniform float u_azimuth;
          attribute vec2 a_pos;
          attribute vec4 a_normal_ed;
          attribute lowp vec2 a_base;
          attribute lowp vec2 a_height;
          void main() {
              float base = max(0.0, a_base.x);
              float height = max(0.0, a_height.x);
              float t = mod(a_normal_ed.x, 2.0);
              vec4 pos = vec4(a_pos, t > 0.0 ? height : base, 1);
              float len = pos.z * u_height_factor / tan(u_altitude);
              pos.x += cos(u_azimuth) * len;
              pos.y += sin(u_azimuth) * len;
              pos.z = 0.0;
              gl_Position = u_matrix * pos;
          }
          `;
          const fragmentSource = `
          void main() {
              gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
          }
          `;
          const vertexShader = gl.createShader(gl.VERTEX_SHADER);
          gl.shaderSource(vertexShader, vertexSource);
          gl.compileShader(vertexShader);
          const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
          gl.shaderSource(fragmentShader, fragmentSource);
          gl.compileShader(fragmentShader);
          this.program = gl.createProgram();
          gl.attachShader(this.program, vertexShader);
          gl.attachShader(this.program, fragmentShader);
          gl.linkProgram(this.program);
          gl.validateProgram(this.program);
          this.uMatrix = gl.getUniformLocation(this.program, "u_matrix");
          this.uHeightFactor = gl.getUniformLocation(this.program, "u_height_factor");
          this.uAltitude = gl.getUniformLocation(this.program, "u_altitude");
          this.uAzimuth = gl.getUniformLocation(this.program, "u_azimuth");
          this.aPos = gl.getAttribLocation(this.program, "a_pos");
          this.aNormal = gl.getAttribLocation(this.program, "a_normal_ed");
          this.aBase = gl.getAttribLocation(this.program, "a_base");
          this.aHeight = gl.getAttribLocation(this.program, "a_height");
      }
  
      render(gl, matrix) {
        gl.useProgram(this.program);
        const source = this.map.style.sourceCaches['trees-source']; // Предполагается, что у вас есть источник данных для деревьев 'trees-source'
        const coords = source.getVisibleCoordinates().reverse();
        const treesLayer = map.getLayer('3d-trees'); // Имя слоя деревьев, которое вы используете
        const context = this.map.painter.context;
        const {lng, lat} = this.map.getCenter();
        const pos = SunCalc.getPosition(date, lat, lng); // Получение позиции солнца аналогично BuildingShadows
        gl.uniform1f(this.uAltitude, pos.altitude);
        gl.uniform1f(this.uAzimuth, pos.azimuth + 3 * Math.PI / 2);
        map.setLight({
            anchor: 'map',
            position: [1.5, 180 + pos.azimuth * 180 / Math.PI, 90 - pos.altitude * 180 / Math.PI],
            'position-transition': {duration: 0},
            color: '#fdb'
        }, {duration: 0});
        this.opacity = Math.sin(Math.max(pos.altitude, 0)) * 0.9;
        for (const coord of coords) {
            const tile = source.getTile(coord);
            const bucket = tile.getBucket(treesLayer); // Получаем бакет для деревьев
            if (!bucket) continue;
            const [heightBuffer, baseBuffer] = bucket.programConfigurations.programConfigurations['3d-trees']._buffers; // Предположим, что у вас есть программы конфигурации для деревьев '3d-trees'
            gl.uniformMatrix4fv(this.uMatrix, false, coord.posMatrix);
            gl.uniform1f(this.uHeightFactor, Math.pow(2, coord.overscaledZ) / tile.tileSize / 8);
            for (const segment of bucket.segments.get()) {
                const numPrevAttrib = context.currentNumAttributes || 0;
                const numNextAttrib = 2;
                for (let i = numNextAttrib; i < numPrevAttrib; i++) gl.disableVertexAttribArray(i);
                const vertexOffset = segment.vertexOffset || 0;
                gl.enableVertexAttribArray(this.aPos);
                gl.enableVertexAttribArray(this.aNormal);
                gl.enableVertexAttribArray(this.aHeight);
                gl.enableVertexAttribArray(this.aBase);
                bucket.layoutVertexBuffer.bind();
                gl.vertexAttribPointer(this.aPos, 2, gl.SHORT, false, 12, 12 * vertexOffset);
                gl.vertexAttribPointer(this.aNormal, 4, gl.SHORT, false, 12, 4 + 12 * vertexOffset);
                heightBuffer.bind();
                gl.vertexAttribPointer(this.aHeight, 1, gl.FLOAT, false, 4, 4 * vertexOffset);
                baseBuffer.bind();
                gl.vertexAttribPointer(this.aBase, 1, gl.FLOAT, false, 4, 4 * vertexOffset);
                bucket.indexBuffer.bind();
                context.currentNumAttributes = numNextAttrib;
                gl.drawElements(gl.TRIANGLES, segment.primitiveLength * 3, gl.UNSIGNED_SHORT, segment.primitiveOffset * 3 * 2);
            }
        }
    }
    
  }
  

    map.addSource('trees-source', {
      type: 'vector',
      url: 'mapbox://zharenowat.77wfiinu' // это крона
  });

  map.addSource('trunk-source', {
    type: 'vector',
    url: 'mapbox://zharenowat.dcr6aiou' // это ствол
});


    map.addLayer({
      'id': '3d-trees',
      'source': 'trees-source',
      'source-layer': 'crown_upd_f-2gpweo',
      'type': 'fill-extrusion',
      'minzoom': 15,
      'paint': {
        "fill-extrusion-color": "#3fca54",
        // "fill-extrusion-height": ["+", ["number", ["get", "height-trunk"]], 2],
         "fill-extrusion-height": ["+", ["number", ["get", "height-trunk"]], 4],
        // "fill-extrusion-base":  ["+", ["get", "height-trunk"], ["get", "height"]],
        "fill-extrusion-base": ["-", ["number", ["get", "height-trunk"]], 1],

        "fill-extrusion-opacity": 0.8,
       
    }
});

  map.addLayer({
    'id': '3d-trunk',
    'source': 'trunk-source',
    'source-layer': 'tree-trunk-f-6jn1vo',
    'type': 'fill-extrusion',
    'minzoom': 15,
    
    'paint': {
        'fill-extrusion-color': '#964b00',
        
        "fill-extrusion-height": ["-",  ["number", ["get", "triynh"]], 1],

        'fill-extrusion-base': ["number", ["get", "min_height"], 0],
        'fill-extrusion-opacity': 0.7
    }
});

    map.addLayer(new BuildingShadows(), '3d-buildings');
    map.addLayer(new TreeShadows(), '3d-trees');

  //   // 3D ДЕРЕВЬЯ!!!!!!!!!!!

  //   // parameters to ensure the model is georeferenced correctly on the map
  //   const modelOrigin = [49.124793, 55.787952];
  //   const modelAltitude = 0;
  //   const modelRotate = [Math.PI / 2, 0, 0];

  //   const modelAsMercatorCoordinate = mapboxgl.MercatorCoordinate.fromLngLat(
  //       modelOrigin,
  //       modelAltitude
  //   );

  //   // transformation parameters to position, rotate and scale the 3D model onto the map
  //   const modelTransform = {
  //       translateX: modelAsMercatorCoordinate.x,
  //       translateY: modelAsMercatorCoordinate.y,
  //       translateZ: modelAsMercatorCoordinate.z,
  //       rotateX: modelRotate[0],
  //       rotateY: modelRotate[1],
  //       rotateZ: modelRotate[2],
  //       /* Since the 3D model is in real world meters, a scale transform needs to be
  //        * applied since the CustomLayerInterface expects units in MercatorCoordinates.
  //        */
  //       scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits()
  //   };

  //   const THREE = window.THREE;

  //   // configuration of the custom layer for a 3D model per the CustomLayerInterface
  //   const customLayer = {
  //       id: '3d-model',
  //       type: 'custom',
  //       renderingMode: '3d',
  //       onAdd: function (map, gl) {
  //           this.camera = new THREE.Camera();
  //           this.scene = new THREE.Scene();

  //           // create two three.js lights to illuminate the model
  //           const directionalLight = new THREE.DirectionalLight(0xffffff);
  //           directionalLight.position.set(0, -70, 100).normalize();
  //           this.scene.add(directionalLight);

  //           const directionalLight2 = new THREE.DirectionalLight(0xffffff);
  //           directionalLight2.position.set(0, 70, 100).normalize();
  //           this.scene.add(directionalLight2);

  //           // use the three.js GLTF loader to add the 3D model to the three.js scene
  //           const loader = new THREE.GLTFLoader();
  //           loader.load(
  //               'https://raw.githubusercontent.com/MapMastermind/3DShadowExplorer/first/scene.gltf',
  //               (gltf) => {
  //                   this.scene.add(gltf.scene);
  //               }
  //           );
            
  //           // use the Mapbox GL JS map canvas for three.js
  //           this.renderer = new THREE.WebGLRenderer({
  //               canvas: map.getCanvas(),
  //               context: gl,
  //               antialias: true
  //           });

  //           this.renderer.autoClear = false;
  //       },
  //       render: function (gl, matrix) {
  //           const rotationX = new THREE.Matrix4().makeRotationAxis(
  //               new THREE.Vector3(1, 0, 0),
  //               modelTransform.rotateX
  //           );
  //           const rotationY = new THREE.Matrix4().makeRotationAxis(
  //               new THREE.Vector3(0, 1, 0),
  //               modelTransform.rotateY
  //           );
  //           const rotationZ = new THREE.Matrix4().makeRotationAxis(
  //               new THREE.Vector3(0, 0, 1),
  //               modelTransform.rotateZ
  //           );

  //           const m = new THREE.Matrix4().fromArray(matrix);
  //           const l = new THREE.Matrix4()
  //               .makeTranslation(
  //                   modelTransform.translateX,
  //                   modelTransform.translateY,
  //                   modelTransform.translateZ
  //               )
  //               .scale(
  //                   new THREE.Vector3(
  //                       modelTransform.scale,
  //                       -modelTransform.scale,
  //                       modelTransform.scale
  //                   )
  //               )
  //               .multiply(rotationX)
  //               .multiply(rotationY)
  //               .multiply(rotationZ);

  //           this.camera.projectionMatrix = m.multiply(l);
  //           this.renderer.resetState();
  //           this.renderer.render(this.scene, this.camera);
  //           this.map.triggerRepaint();
  //       }
  //   };

  //   // map.on('style.load', () => {
  //   //     map.addLayer(customLayer);
  //   // });

   
  //     map.addLayer(customLayer);
  // ;





    // Установка 'text-field' для всех меток
    let labels = ['country-label', 'state-label',
        
        'airport-label', 'poi-label', 
        'water-line-label', 'natural-point-label',
        'natural-line-label', 'waterway-label', 'road-label'
    ];

    labels.forEach(label => {
        map.setLayoutProperty(label, 'text-field', ['get', 'name_ru']);
    });
    // Удаление слоев POI
    let poiLayers = ['poi-label', 'poi-icon', 'poi-poi'];
    poiLayers.forEach(layer => {
        if (map.getLayer(layer)) {
            map.removeLayer(layer);
        }
    });

    
});











