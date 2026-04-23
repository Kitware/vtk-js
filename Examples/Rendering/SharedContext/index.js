import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkCellArray from '@kitware/vtk.js/Common/Core/CellArray';
import vtkPoints from '@kitware/vtk.js/Common/Core/Points';
import vtkPolyData from '@kitware/vtk.js/Common/DataModel/PolyData';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkConeSource from '@kitware/vtk.js/Filters/Sources/ConeSource';
import vtkSphereSource from '@kitware/vtk.js/Filters/Sources/SphereSource';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkRenderer from '@kitware/vtk.js/Rendering/Core/Renderer';
import vtkRenderWindow from '@kitware/vtk.js/Rendering/Core/RenderWindow';
import vtkLight from '@kitware/vtk.js/Rendering/Core/Light';
import vtkSharedRenderWindow from '@kitware/vtk.js/Rendering/OpenGL/SharedRenderWindow';
import { mat4, vec3 } from 'gl-matrix';

// ----------------------------------------------------------------------------
// Alpine marker data for geo-positioned cones on terrain
// ----------------------------------------------------------------------------

const cities = [
  { name: 'Seefeld', lng: 11.1871, lat: 47.3305, color: [1.0, 0.5, 0.0] },
  { name: 'Innsbruck', lng: 11.4041, lat: 47.2692, color: [0.5, 1.0, 0.0] },
  {
    name: 'Hall in Tirol',
    lng: 11.5079,
    lat: 47.2839,
    color: [0.0, 0.5, 1.0],
  },
];

const CONE_HEIGHT_METERS = 900.0;
const CONE_CENTER_HEIGHT_RATIO = 0.25;
const SPHERE_CENTER_HEIGHT_RATIO = 1.05;

function createRouteActor() {
  const points = vtkPoints.newInstance({ dataType: 'Float64Array' });
  const pointValues = new Float64Array(cities.length * 3);

  points.setData(pointValues, 3);
  const polyData = vtkPolyData.newInstance();
  polyData.setPoints(points);
  polyData.setLines(
    vtkCellArray.newInstance({
      values: Uint16Array.from([cities.length, 0, 1, 2]),
    })
  );

  const mapper = vtkMapper.newInstance();
  mapper.setInputData(polyData);

  const actor = vtkActor.newInstance();
  actor.setMapper(mapper);
  actor.getProperty().setColor(0.95, 0.15, 0.15);
  actor.getProperty().setLighting(false);
  actor.getProperty().setLineWidth(3.0);

  return { actor, points, polyData };
}

function createCityActors(city) {
  const coneSource = vtkConeSource.newInstance({
    height: 1.0,
    radius: 0.3,
    resolution: 12,
    direction: [0, 0, -1],
    capping: true,
  });
  const coneMapper = vtkMapper.newInstance();
  coneMapper.setInputConnection(coneSource.getOutputPort());
  const coneActor = vtkActor.newInstance();
  coneActor.setMapper(coneMapper);
  coneActor.getProperty().setColor(...city.color);
  coneActor.getProperty().setAmbient(0.4);
  coneActor.getProperty().setDiffuse(0.6);

  const sphereSource = vtkSphereSource.newInstance({
    radius: 0.3,
    thetaResolution: 32,
    phiResolution: 32,
  });
  const sphereMapper = vtkMapper.newInstance();
  sphereMapper.setInputConnection(sphereSource.getOutputPort());
  const sphereActor = vtkActor.newInstance();
  sphereActor.setMapper(sphereMapper);
  sphereActor.getProperty().setColor(...city.color);
  sphereActor.getProperty().setAmbient(0.0);
  sphereActor.getProperty().setDiffuse(1.0);

  return { city, coneActor, sphereActor };
}

// ----------------------------------------------------------------------------
// Load MapLibre GL JS dynamically
// ----------------------------------------------------------------------------

function loadMapLibre() {
  return new Promise((resolve, reject) => {
    if (window.maplibregl) {
      resolve(window.maplibregl);
      return;
    }

    const link = document.createElement('link');
    link.href = 'https://unpkg.com/maplibre-gl@5.21.1/dist/maplibre-gl.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/maplibre-gl@5.21.1/dist/maplibre-gl.js';
    script.onload = () => resolve(window.maplibregl);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// ----------------------------------------------------------------------------
// Setup page layout
// ----------------------------------------------------------------------------

document.body.style.margin = '0';
document.body.style.padding = '0';

const mapContainer = document.createElement('div');
mapContainer.id = 'map';
mapContainer.style.width = '100vw';
mapContainer.style.height = '100vh';
document.body.appendChild(mapContainer);

const MAPLIBRE_NORTH_UP = [0, -1, 0];
function computeCameraTargetMercator(maplibregl, transform) {
  return maplibregl.MercatorCoordinate.fromLngLat(
    transform.center,
    transform.elevation
  );
}

function computeCameraMercator(targetMercator, transform) {
  const cameraToCenterDistanceMeters =
    transform.cameraToCenterDistance / transform.pixelsPerMeter;
  const metersToMercator = targetMercator.meterInMercatorCoordinateUnits();
  const cameraToCenterDistanceMercator =
    cameraToCenterDistanceMeters * metersToMercator;
  const dzMercator =
    cameraToCenterDistanceMercator * Math.cos(transform.pitchInRadians);
  const dhMercator = Math.sqrt(
    Math.max(
      0,
      cameraToCenterDistanceMercator * cameraToCenterDistanceMercator -
        dzMercator * dzMercator
    )
  );

  return {
    x: targetMercator.x + dhMercator * Math.sin(-transform.bearingInRadians),
    y: targetMercator.y + dhMercator * Math.cos(-transform.bearingInRadians),
    z: targetMercator.z + dzMercator,
  };
}

function computeViewUp(transform) {
  const cameraToWorldRotation = new Float64Array(16);
  const viewUp = vec3.fromValues(...MAPLIBRE_NORTH_UP);

  mat4.identity(cameraToWorldRotation);
  mat4.rotateZ(
    cameraToWorldRotation,
    cameraToWorldRotation,
    transform.bearingInRadians
  );
  mat4.rotateX(
    cameraToWorldRotation,
    cameraToWorldRotation,
    -transform.pitchInRadians
  );
  mat4.rotateZ(
    cameraToWorldRotation,
    cameraToWorldRotation,
    transform.rollInRadians
  );
  vec3.transformMat4(viewUp, viewUp, cameraToWorldRotation);
  vec3.normalize(viewUp, viewUp);

  return viewUp;
}

function computeViewMatrix(cameraMercator, targetMercator, viewUp) {
  const eye = vec3.fromValues(
    cameraMercator.x,
    cameraMercator.y,
    cameraMercator.z
  );
  const target = vec3.fromValues(
    targetMercator.x,
    targetMercator.y,
    targetMercator.z
  );
  const viewMatrix = new Float64Array(16);

  mat4.lookAt(viewMatrix, eye, target, viewUp);
  return viewMatrix;
}

// ----------------------------------------------------------------------------
// Main initialization
// ----------------------------------------------------------------------------

async function init() {
  const maplibregl = await loadMapLibre();

  // Create MapLibre map
  const map = new maplibregl.Map({
    container: 'map',
    zoom: 12,
    center: [11.39085, 47.27574],
    pitch: 70,
    maxZoom: 18,
    maxPitch: 85,
    antialias: true,
    style: {
      version: 8,
      sources: {
        osm: {
          type: 'raster',
          tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '&copy; OpenStreetMap Contributors',
          maxzoom: 19,
        },
        terrainSource: {
          type: 'raster-dem',
          url: 'https://demotiles.maplibre.org/terrain-tiles/tiles.json',
          tileSize: 256,
        },
        hillshadeSource: {
          type: 'raster-dem',
          url: 'https://demotiles.maplibre.org/terrain-tiles/tiles.json',
          tileSize: 256,
        },
      },
      layers: [
        {
          id: 'osm',
          type: 'raster',
          source: 'osm',
        },
        {
          id: 'hills',
          type: 'hillshade',
          source: 'hillshadeSource',
          layout: { visibility: 'visible' },
          paint: { 'hillshade-shadow-color': '#473B24' },
        },
      ],
      terrain: {
        source: 'terrainSource',
        exaggeration: 1,
      },
    },
  });

  await new Promise((resolve) => {
    map.on('load', resolve);
  });

  // Create VTK render window and renderer
  const renderWindow = vtkRenderWindow.newInstance();
  const renderer = vtkRenderer.newInstance();
  renderer.setBackground(0, 0, 0, 0);
  renderer.setPreserveColorBuffer(true);
  renderer.setPreserveDepthBuffer(true);
  // Shared-context rendering uses a MapLibre-provided matrix, so bypass
  // vtk.js automatic headlights and drive a camera-following scene light.
  renderer.setAutomaticLightCreation(false);
  renderWindow.addRenderer(renderer);

  const viewLight = vtkLight.newInstance();
  viewLight.setLightTypeToSceneLight();
  viewLight.setPositional(false);
  renderer.addLight(viewLight);

  const cityActors = cities.map((city) => {
    const actors = createCityActors(city);
    actors.coneActor.setVisibility(false);
    actors.sphereActor.setVisibility(false);
    renderer.addActor(actors.coneActor);
    renderer.addActor(actors.sphereActor);
    return actors;
  });
  const route = createRouteActor();
  route.actor.setVisibility(false);
  renderer.addActor(route.actor);
  let scenePlaced = false;

  function placeSceneOnTerrain() {
    if (scenePlaced) {
      return;
    }

    const routePointValues = new Float64Array(cities.length * 3);

    cityActors.forEach(({ city, coneActor, sphereActor }, index) => {
      const elevation = map.queryTerrainElevation([city.lng, city.lat]) || 0;
      const mercator = maplibregl.MercatorCoordinate.fromLngLat(
        [city.lng, city.lat],
        elevation
      );
      const scale =
        mercator.meterInMercatorCoordinateUnits() * CONE_HEIGHT_METERS;
      const sphereCenterZ = mercator.z + scale * SPHERE_CENTER_HEIGHT_RATIO;

      coneActor.setPosition(
        mercator.x,
        mercator.y,
        mercator.z + scale * CONE_CENTER_HEIGHT_RATIO
      );
      coneActor.setScale(scale, scale, scale);
      coneActor.setVisibility(true);

      sphereActor.setPosition(mercator.x, mercator.y, sphereCenterZ);
      sphereActor.setScale(scale * 0.9, -scale * 0.9, scale * 0.9);
      sphereActor.setVisibility(true);

      routePointValues.set([mercator.x, mercator.y, sphereCenterZ], index * 3);
    });

    route.points.setData(routePointValues, 3);
    route.polyData.modified();
    route.actor.setVisibility(true);
    scenePlaced = true;
    map.triggerRepaint();
  }

  // Store VTK objects that will be initialized in onAdd
  let openglRenderWindow = null;

  // Use CustomLayerInterface for proper matrix access
  const vtkLayer = {
    id: 'vtk-cones',
    type: 'custom',
    renderingMode: '3d',

    onAdd(mapInstance, gl) {
      const canvas = mapInstance.getCanvas();
      openglRenderWindow = vtkSharedRenderWindow.createFromContext(canvas, gl);
      renderWindow.addView(openglRenderWindow);
    },

    render(renderGl, args) {
      if (!openglRenderWindow || !scenePlaced) return;
      const camera = renderer.getActiveCamera();
      const transform = map.transform;
      const targetMercator = computeCameraTargetMercator(maplibregl, transform);
      const cameraMercator = computeCameraMercator(targetMercator, transform);
      const viewMatrix = computeViewMatrix(
        cameraMercator,
        targetMercator,
        computeViewUp(transform)
      );
      const inverseViewMatrix = new Float64Array(16);
      const projectionMatrix = new Float64Array(16);

      viewLight.setPosition(
        cameraMercator.x,
        cameraMercator.y,
        cameraMercator.z
      );
      viewLight.setFocalPoint(
        targetMercator.x,
        targetMercator.y,
        targetMercator.z
      );

      mat4.invert(inverseViewMatrix, viewMatrix);
      mat4.multiply(
        projectionMatrix,
        args.defaultProjectionData.mainMatrix,
        inverseViewMatrix
      );

      camera.setViewMatrix(viewMatrix);
      camera.setProjectionMatrix(projectionMatrix);
      camera.modified();

      // Shared rendering does not preserve host GL state, so restore any state
      // this layer changes after vtk.js renders.
      // MapLibre's projection includes a handedness flip, so compensate while
      // rendering vtk.js geometry in the shared context.
      const previousFrontFace = renderGl.getParameter(renderGl.FRONT_FACE);
      renderGl.frontFace(renderGl.CW);
      try {
        openglRenderWindow.renderShared();
      } finally {
        renderGl.frontFace(previousFrontFace);
      }
    },
  };

  map.addLayer(vtkLayer);
  map.once('idle', placeSceneOnTerrain);
}

init();
