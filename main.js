
import * as THREE from 'three';

import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import { SVGLoader } from "three/addons/loaders/SVGLoader";
import { STLExporter } from 'three/addons/exporters/STLExporter.js';


THREE.Cache.enabled = true;

let container;

let camera, scene, renderer, controls;

let group, textMesh1, dateTextMesh, yearTextMesh, unitTextMesh, textGeo, unitTextGeo, dateTextGeo, yearTextGeo, materials, bbox, namebbox;

let svgMesh, svgGeometry, exporter, textMaterials;

let xMinLimit = -52;
let xMaxLimit = 0;


let today = formatDate(new Date());
let dateText = today[0];
let yearText = today[1];

let shapes = [];

let material = new THREE.MeshPhongMaterial({ color: 0xff4800, flatShading: true });

let text = 'Your Name',

    bevelEnabled = false,

    font = undefined,

    fontName = 'optimer', // helvetiker, optimer, gentilis, droid sans, droid serif
    fontWeight = 'bold'; // normal bold

let unitText = 'Your Unit';

let height = 2,
    size = 8,
    curveSegments = 12,

    bevelThickness = 0.75,
    bevelSize = 0.2;

let dateSize = 6;

const fontMap = {
    'helvetiker': 0,
    'optimer': 1,
    'gentilis': 2,
    'droid/droid_sans': 3,
    'droid/droid_serif': 4

};

const weightMap = {
    'regular': 0,
    'bold': 1
};

const reverseFontMap = [];
const reverseWeightMap = [];

for ( const i in fontMap ) reverseFontMap[ fontMap[ i ] ] = i;
for ( const i in weightMap ) reverseWeightMap[ weightMap[ i ] ] = i;

let fontIndex = 1;

init();
loadSVG();
animate();

function init() {

    container = document.createElement( 'div' );
    document.body.appendChild( container );

    // RENDERER

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild( renderer.domElement );

    // CAMERA

    camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 1, 2000 );
    camera.position.set( 0, -80, 250 );

    // SCENE

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xe0e0e0 );

    // LIGHTS

    const dirLight = new THREE.DirectionalLight( 0xffffff, 1.0);
    dirLight.position.set( -20, 400, 0 ).normalize();
    dirLight.castShadow = true;
    scene.add( dirLight );
    
    const ambientLight = new THREE.AmbientLight( 0xffffff,0.1);
    scene.add( ambientLight );

    const followLight = new THREE.DirectionalLight( 0xffffff, 0.8 );
    followLight.position.set(40, 40, 0);

    camera.add( followLight );
    scene.add( camera );

    materials = [
        new THREE.MeshPhongMaterial( { color: 0xff4800, flatShading: true } ), // front
        new THREE.MeshPhongMaterial( { color: 0xff4800} ) // side
    ];

    textMaterials = [
        new THREE.MeshPhongMaterial( { color: 0x882800, flatShading: true } ), // front
        new THREE.MeshPhongMaterial( { color: 0x882800} ) // side
    ];

    group = new THREE.Group();
    group.position.y = 0;
    group.castShadow = true;
    group.receiveShadow = true;

    scene.add( group );


    loadFont();

    const helper = new THREE.GridHelper( 200, 20 );
    helper.position.y = 0;
    helper.material.opacity = 0.8;
    helper.material.transparent = true;
    helper.rotateX(Math.PI / 2);
    scene.add( helper );

    // CONTROLS

    controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = 200;
    controls.maxDistance = 800;
    controls.minAzimuthAngle = -Math.PI / 2;
    controls.maxAzimuthAngle = Math.PI / 2;
    controls.maxPolarAngle = Math.PI;

    // EVENTS

    container.style.touchAction = 'none';

    createGUI();

    window.addEventListener( 'resize', onWindowResize );

}

function onWindowResize() {
    windowHalfX = window.innerWidth / 2;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
}

function loadSVG() {
    const svgMarkup  = `<svg id="_0" data-name="0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320.82 335.69">
                            <g id="LWPOLYLINE">
                                <polygon points="160.41 .35 60.38 58.11 100.39 81.21 140.4 58.11 140.4 173.62 40.37 231.38 40.37 185.17 .35 162.07 .35 277.58 100.39 335.34 100.39 289.13 60.38 266.03 160.41 208.28 260.45 266.03 220.43 289.13 220.43 335.34 320.47 277.58 320.47 162.07 280.46 185.17 280.46 231.38 180.42 173.62 180.42 58.11 220.43 81.21 260.45 58.11 160.41 .35" style="fill: none; stroke: #000; stroke-linecap: round; stroke-linejoin: round; stroke-width: .71px;"/>
                            </g>
                        </svg>`

        
    const loader_svg = new SVGLoader();
    const svgData = loader_svg.parse(svgMarkup);

    svgData.paths.forEach((path, i) => {
        shapes = path.toShapes(true);
    });

    shapes.forEach((shape, i) => {
        svgGeometry = new THREE.ExtrudeGeometry(shape, {
            depth: 2,
            bevelEnabled: false
          });
    });

    svgMesh = new THREE.Mesh(svgGeometry, material);
    svgMesh.scale.x = 1;
    svgMesh.scale.y = 1;
    svgMesh.geometry.center();
    svgMesh.position.z = 1;

    bbox = new THREE.Box3();
    bbox.setFromObject(svgMesh);
    console.log("Bounding box details are:");
    console.log(bbox.min);
    console.log(bbox.max);

    group.add(svgMesh);
}

function loadFont() {
    const loader_font = new FontLoader();
    loader_font.load( 'fonts/' + fontName + '_' + fontWeight + '.typeface.json', function ( response ) {

        font = response;

        refreshText();
    });
}

function createText() {
    textGeo = new TextGeometry( text, {
        font: font,
        size: size,
        height: height,
        curveSegments: curveSegments,
        bevelThickness: bevelThickness,
        bevelSize: bevelSize,
        bevelEnabled: bevelEnabled
    });

    textGeo.computeBoundingBox();
    
    textMesh1 = new THREE.Mesh( textGeo, textMaterials );

    textMesh1.rotation.x = 0;
    textMesh1.rotation.y = Math.PI * 2;
    textMesh1.rotation.z = -0.523599; //-0.523599
    textMesh1.geometry.center();
    
    namebbox = new THREE.Box3();
    namebbox.setFromObject(textMesh1);

    textMesh1.position.x = -28.625;
    textMesh1.position.y = 23;
    textMesh1.position.z = 3;

    if (namebbox.max.x - namebbox.min.x > -xMinLimit) {
        var scaleFactor = (xMaxLimit - xMinLimit)/(namebbox.max.x - namebbox.min.x);
        textMesh1.scale.x = scaleFactor;
        textMesh1.scale.y = scaleFactor;
    }
    
    group.add( textMesh1 );

    unitTextGeo = new TextGeometry( unitText, {
        font: font,
        size: size,
        height: height,
        curveSegments: curveSegments,
        bevelThickness: bevelThickness,
        bevelSize: bevelSize,
        bevelEnabled: bevelEnabled
    });

    unitTextGeo.computeBoundingBox();
    
    unitTextMesh = new THREE.Mesh( unitTextGeo, textMaterials );

    unitTextMesh.rotation.x = 0;
    unitTextMesh.rotation.y = Math.PI * 2;
    unitTextMesh.rotation.z = 0.523599; //-0.523599
    unitTextMesh.geometry.center();
    
    namebbox = new THREE.Box3();
    namebbox.setFromObject(unitTextMesh);

    unitTextMesh.position.x = 28.625;
    unitTextMesh.position.y = 23;
    unitTextMesh.position.z = 3;

    if (namebbox.max.x - namebbox.min.x > -xMinLimit) {
        var scaleFactor = (xMaxLimit - xMinLimit)/(namebbox.max.x - namebbox.min.x);
        unitTextMesh.scale.x = scaleFactor;
        unitTextMesh.scale.y = scaleFactor;
    }
    
    group.add(unitTextMesh);


    dateTextGeo = new TextGeometry( dateText, {
        font: font,
        size: dateSize,
        height: height,
        curveSegments: curveSegments,
        bevelThickness: bevelThickness,
        bevelSize: bevelSize,
        bevelEnabled: bevelEnabled
    });

    dateTextGeo.computeBoundingBox();
    
    dateTextMesh = new THREE.Mesh( dateTextGeo, textMaterials );

    dateTextMesh.rotation.x = 0;
    dateTextMesh.rotation.y = Math.PI * 2;
    dateTextMesh.rotation.z = -0.523599; //-0.523599
    dateTextMesh.geometry.center();
    
    namebbox = new THREE.Box3();
    namebbox.setFromObject(dateTextMesh);

    dateTextMesh.position.x = -15;
    dateTextMesh.position.y = -44;
    dateTextMesh.position.z = 3;
    
    group.add(dateTextMesh);


    yearTextGeo = new TextGeometry( yearText, {
        font: font,
        size: dateSize,
        height: height,
        curveSegments: curveSegments,
        bevelThickness: bevelThickness,
        bevelSize: bevelSize,
        bevelEnabled: bevelEnabled
    });

    yearTextGeo.computeBoundingBox();
    
    yearTextMesh = new THREE.Mesh( yearTextGeo, textMaterials );

    yearTextMesh.rotation.x = 0;
    yearTextMesh.rotation.y = Math.PI * 2;
    yearTextMesh.rotation.z = 0.523599;
    yearTextMesh.geometry.center();
    
    namebbox = new THREE.Box3();
    namebbox.setFromObject(yearTextMesh);

    yearTextMesh.position.x = 15;
    yearTextMesh.position.y = -44;
    yearTextMesh.position.z = 3;

    group.add(yearTextMesh);
}

function refreshText() {
    group.remove(textMesh1);
    group.remove(unitTextMesh);
    group.remove(dateTextMesh);
    group.remove(yearTextMesh);
    if ( ! text ) return;
    createText();
}

function animate() {

    requestAnimationFrame( animate );
    controls.update();
    render();
}

function render() {
    renderer.render( scene, camera );
}

function exportBinary() {
    exporter = new STLExporter();
    // Configure export options
    const options = { binary: true }

    // Parse the input and generate the STL encoded output
    const result = exporter.parse( group, options );
    saveArrayBuffer( result, text + ' 3D arrow.stl' );
}

const link = document.createElement( 'a' );
link.style.display = 'none';
document.body.appendChild( link );

function save( blob, filename ) {

    link.href = URL.createObjectURL( blob );
    link.download = filename;
    link.click();
}

function saveArrayBuffer( buffer, filename ) {
    save( new Blob( [ buffer ], { type: 'application/octet-stream' } ), filename );
}

function createGUI() {
    const panel = new GUI();

    const folder1 = panel.addFolder( 'Text settings' );
    //const folder2 = panel.addFolder( 'Unit' );
    const folder3 = panel.addFolder( 'Downloader' );

    const settings = {
        'Your name': text,
        'Your unit': unitText,
        'Change font': function () {
            fontIndex ++;
            fontName = reverseFontMap[ fontIndex % reverseFontMap.length ];
            loadFont();
        },
        //'Bold font':  true,
        //'Beveled font': false,
        //'Text size': 15,
        'Download STL': exportBinary
    };

    folder1.add(settings, 'Your name').onChange(function(name){
        text = name;
        refreshText();
    });
    folder1.add(settings, 'Your unit').onChange(function(unit){
        unitText = unit;
        refreshText();
    });
    folder1.add( settings, 'Change font');
    //folder1.add( settings, 'Bold font' ).onChange( toggleBold );
    //panel.add( settings, 'Beveled font' ).onChange( toggleBevel );
    //panel.add( settings, 'Text size', 5, 20, 0.1 ).listen().onFinishChange( function (fontSize) {
    //    size = fontSize;
    //    refreshText();
   // });
    folder3.add( settings, 'Download STL');

    folder1.open();
    //folder2.open();
    folder3.open();
}


function toggleBold(bolded) {
    if (bolded) {
        fontWeight = 'bold'
    } else {
        fontWeight = 'regular'
    }
    loadFont();
}

function toggleBevel(bevelled) {
    bevelEnabled = bevelled;
    refreshText();
}

function formatDate(date) {
    if (date !== undefined && date !== "") {
      var myDate = new Date(date);
      var month = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ][myDate.getMonth()];
      var day = myDate.getDate();
      var year = myDate.getFullYear();
      return [day + " " + month, year.toString()];
    }
    return "";
  }
