import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import GUI from 'lil-gui';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkBox from '@kitware/vtk.js/Common/DataModel/Box';
import vtkCone from '@kitware/vtk.js/Common/DataModel/Cone';
import vtkCutterMapper from '@kitware/vtk.js/Rendering/Core/CutterMapper';
import vtkCylinder from '@kitware/vtk.js/Common/DataModel/Cylinder';
import vtkCylinderSource from '@kitware/vtk.js/Filters/Sources/CylinderSource';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import HttpDataAccessHelper from '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import DataAccessHelper from '@kitware/vtk.js/IO/Core/DataAccessHelper';
import vtkHttpSceneLoader from '@kitware/vtk.js/IO/Core/HttpSceneLoader';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkPlane from '@kitware/vtk.js/Common/DataModel/Plane';
import vtkPlaneSource from '@kitware/vtk.js/Filters/Sources/PlaneSource';
import vtkProperty from '@kitware/vtk.js/Rendering/Core/Property';
import vtkSphere from '@kitware/vtk.js/Common/DataModel/Sphere';
import vtkSphereSource from '@kitware/vtk.js/Filters/Sources/SphereSource';
import vtkTransform from '@kitware/vtk.js/Common/Transform/Transform';
import { IDENTITY } from '@kitware/vtk.js/Common/Core/Math/Constants';
import vtkCubeSource from '@kitware/vtk.js/Filters/Sources/CubeSource';
import vtkConeSource from '@kitware/vtk.js/Filters/Sources/ConeSource';

// Force DataAccessHelper to have access to various data source
import '@kitware/vtk.js/IO/Core/DataAccessHelper/JSZipDataAccessHelper';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

const COLORS = {
  cut: [0.0, 1.0, 0.0],
  mesh: [0.72, 0.78, 0.86],
  plane: [0.2, 0.75, 1.0],
  sphere: [0.1, 0.55, 0.95],
  box: [0.15, 0.85, 0.45],
  cylinder: [1.0, 0.5, 0.15],
  cone: [1.0, 0.82, 0.18],
};

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

const plane = vtkPlane.newInstance();
const sphere = vtkSphere.newInstance();
const box = vtkBox.newInstance();
const cylinder = vtkCylinder.newInstance();
const cone = vtkCone.newInstance();
const coneTransform = vtkTransform.newInstance();
cone.setTransform(coneTransform);

const cutFunctions = {
  plane,
  sphere,
  box,
  cylinder,
  cone,
};

const gpuCutMapper = vtkCutterMapper.newInstance({
  cutFunction: plane,
  cutWidth: 0.5,
});
// Disable scalar coloring to use uniform property color instead
gpuCutMapper.setScalarVisibility(false);
const gpuCutActor = vtkActor.newInstance();
gpuCutActor.setMapper(gpuCutMapper);
const gpuCutProperty = gpuCutActor.getProperty();
gpuCutProperty.setLighting(false);
gpuCutProperty.setColor(...COLORS.cut);
renderer.addActor(gpuCutActor);

const meshMapper = vtkMapper.newInstance();
meshMapper.setScalarVisibility(false);
const meshActor = vtkActor.newInstance();
meshActor.setMapper(meshMapper);
const meshProperty = meshActor.getProperty();
meshProperty.setRepresentation(vtkProperty.Representation.WIREFRAME);
meshProperty.setLighting(false);
meshProperty.setColor(...COLORS.mesh);
meshProperty.setOpacity(0.1);
renderer.addActor(meshActor);

const planeDebugSource = vtkPlaneSource.newInstance({
  xResolution: 1,
  yResolution: 1,
});
const planeDebugMapper = vtkMapper.newInstance();
planeDebugMapper.setInputConnection(planeDebugSource.getOutputPort());
const planeDebugActor = vtkActor.newInstance();
planeDebugActor.setMapper(planeDebugMapper);
planeDebugActor.getProperty().setLighting(false);
planeDebugActor.getProperty().setColor(...COLORS.plane);
renderer.addActor(planeDebugActor);

const sphereDebugSource = vtkSphereSource.newInstance({
  phiResolution: 48,
  thetaResolution: 48,
});
const sphereDebugMapper = vtkMapper.newInstance();
sphereDebugMapper.setInputConnection(sphereDebugSource.getOutputPort());
const sphereDebugActor = vtkActor.newInstance();
sphereDebugActor.setMapper(sphereDebugMapper);
sphereDebugActor.getProperty().setLighting(false);
sphereDebugActor.getProperty().setColor(...COLORS.sphere);
renderer.addActor(sphereDebugActor);

const boxDebugSource = vtkCubeSource.newInstance();
const boxDebugMapper = vtkMapper.newInstance();
boxDebugMapper.setInputConnection(boxDebugSource.getOutputPort());
const boxDebugActor = vtkActor.newInstance();
boxDebugActor.setMapper(boxDebugMapper);
boxDebugActor.getProperty().setLighting(false);
boxDebugActor.getProperty().setColor(...COLORS.box);
renderer.addActor(boxDebugActor);

const cylinderDebugSource = vtkCylinderSource.newInstance({
  resolution: 64,
  capping: false,
});
const cylinderDebugMapper = vtkMapper.newInstance();
cylinderDebugMapper.setInputConnection(cylinderDebugSource.getOutputPort());
const cylinderDebugActor = vtkActor.newInstance();
cylinderDebugActor.setMapper(cylinderDebugMapper);
cylinderDebugActor.getProperty().setLighting(false);
cylinderDebugActor.getProperty().setColor(...COLORS.cylinder);
renderer.addActor(cylinderDebugActor);

const coneDebugSource = vtkConeSource.newInstance({
  resolution: 64,
  capping: false,
  direction: [1.0, 0.0, 0.0],
});
const coneDebugMapper = vtkMapper.newInstance();
coneDebugMapper.setInputConnection(coneDebugSource.getOutputPort());
const coneDebugActor = vtkActor.newInstance();
coneDebugActor.setMapper(coneDebugMapper);
coneDebugActor.getProperty().setLighting(false);
coneDebugActor.getProperty().setColor(...COLORS.cone);
renderer.addActor(coneDebugActor);

const coneDebugSourceBack = vtkConeSource.newInstance({
  resolution: 64,
  capping: false,
  direction: [-1.0, 0.0, 0.0],
});
const coneDebugMapperBack = vtkMapper.newInstance();
coneDebugMapperBack.setInputConnection(coneDebugSourceBack.getOutputPort());
const coneDebugActorBack = vtkActor.newInstance();
coneDebugActorBack.setMapper(coneDebugMapperBack);
coneDebugActorBack.getProperty().setLighting(false);
coneDebugActorBack.getProperty().setColor(...COLORS.cone);
renderer.addActor(coneDebugActorBack);

let modelBounds = [-1, 1, -1, 1, -1, 1];
let modelLength = 2.5;
let modelCenter = [0.0, 0.0, 0.0];
let modelHalfExtents = [1.0, 1.0, 1.0];

const state = {
  showGPU: true,
  gpuWidth: 0.5,
  debugOpacity: 0.2,
  cutType: 'plane',
  planeOriginX: 0.0,
  planeOriginY: 0.0,
  planeOriginZ: 0.0,
  planeNormalX: 1.0,
  planeNormalY: 0.0,
  planeNormalZ: 0.0,
  sphereCenterX: 0.0,
  sphereCenterY: 0.0,
  sphereCenterZ: 0.0,
  sphereRadius: 0.35,
  boxCenterX: 0.0,
  boxCenterY: 0.0,
  boxCenterZ: 0.0,
  boxSizeX: 0.6,
  boxSizeY: 0.35,
  boxSizeZ: 0.35,
  cylinderCenterX: 0.0,
  cylinderCenterY: 0.0,
  cylinderCenterZ: 0.0,
  cylinderAxisX: 1.0,
  cylinderAxisY: 0.0,
  cylinderAxisZ: 0.0,
  cylinderRadius: 0.2,
  coneCenterX: 0.0,
  coneCenterY: 0.0,
  coneCenterZ: 0.0,
  coneAngle: 18.0,
  coneRotateY: 0.0,
  coneRotateZ: 0.0,
};

function normalizeVector3(x, y, z, fallback = [1.0, 0.0, 0.0]) {
  const length = Math.hypot(x, y, z);
  if (length <= 1e-6) {
    return fallback;
  }
  return [x / length, y / length, z / length];
}

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function getOffsetPosition(x, y, z) {
  return [modelCenter[0] + x, modelCenter[1] + y, modelCenter[2] + z];
}

function updatePlane() {
  const [nx, ny, nz] = normalizeVector3(
    state.planeNormalX,
    state.planeNormalY,
    state.planeNormalZ
  );
  const origin = getOffsetPosition(
    state.planeOriginX,
    state.planeOriginY,
    state.planeOriginZ
  );
  const normal = [nx, ny, nz];
  const tangentSeed = Math.abs(nz) < 0.9 ? [0.0, 0.0, 1.0] : [0.0, 1.0, 0.0];
  const tangent1 = normalizeVector3(
    ...cross(normal, tangentSeed),
    [1.0, 0.0, 0.0]
  );
  const tangent2 = normalizeVector3(
    ...cross(normal, tangent1),
    [0.0, 1.0, 0.0]
  );
  const halfSize = modelLength * 0.3;
  plane.setOrigin(origin[0], origin[1], origin[2]);
  plane.setNormal(nx, ny, nz);
  planeDebugSource.setOrigin(
    origin[0] - tangent1[0] * halfSize - tangent2[0] * halfSize,
    origin[1] - tangent1[1] * halfSize - tangent2[1] * halfSize,
    origin[2] - tangent1[2] * halfSize - tangent2[2] * halfSize
  );
  planeDebugSource.setPoint1(
    origin[0] + tangent1[0] * halfSize - tangent2[0] * halfSize,
    origin[1] + tangent1[1] * halfSize - tangent2[1] * halfSize,
    origin[2] + tangent1[2] * halfSize - tangent2[2] * halfSize
  );
  planeDebugSource.setPoint2(
    origin[0] - tangent1[0] * halfSize + tangent2[0] * halfSize,
    origin[1] - tangent1[1] * halfSize + tangent2[1] * halfSize,
    origin[2] - tangent1[2] * halfSize + tangent2[2] * halfSize
  );
}

function updateSphere() {
  const center = getOffsetPosition(
    state.sphereCenterX,
    state.sphereCenterY,
    state.sphereCenterZ
  );
  sphere.setCenter(center[0], center[1], center[2]);
  sphere.setRadius(state.sphereRadius);
  sphereDebugSource.setCenter(center[0], center[1], center[2]);
  sphereDebugSource.setRadius(state.sphereRadius);
}

function updateBox() {
  const center = getOffsetPosition(
    state.boxCenterX,
    state.boxCenterY,
    state.boxCenterZ
  );
  const halfSizeX = state.boxSizeX / 2;
  const halfSizeY = state.boxSizeY / 2;
  const halfSizeZ = state.boxSizeZ / 2;
  box.setBounds([
    center[0] - halfSizeX,
    center[0] + halfSizeX,
    center[1] - halfSizeY,
    center[1] + halfSizeY,
    center[2] - halfSizeZ,
    center[2] + halfSizeZ,
  ]);
  boxDebugSource.setBounds([
    center[0] - halfSizeX,
    center[0] + halfSizeX,
    center[1] - halfSizeY,
    center[1] + halfSizeY,
    center[2] - halfSizeZ,
    center[2] + halfSizeZ,
  ]);
}

function updateCylinder() {
  const [axisX, axisY, axisZ] = normalizeVector3(
    state.cylinderAxisX,
    state.cylinderAxisY,
    state.cylinderAxisZ
  );
  const center = getOffsetPosition(
    state.cylinderCenterX,
    state.cylinderCenterY,
    state.cylinderCenterZ
  );
  cylinder.setCenter(center[0], center[1], center[2]);
  cylinder.setAxis(axisX, axisY, axisZ);
  cylinder.setRadius(state.cylinderRadius);

  cylinderDebugSource.setCenter(center[0], center[1], center[2]);
  cylinderDebugSource.setRadius(state.cylinderRadius);
  cylinderDebugSource.setHeight(modelLength * 1.2);
  cylinderDebugSource.setDirection(axisX, axisY, axisZ);
}

function updateCone() {
  cone.setAngle(state.coneAngle);
  const coneCenterX = modelCenter[0] + state.coneCenterX;
  const coneCenterY = modelCenter[1] + state.coneCenterY;
  const coneCenterZ = modelCenter[2] + state.coneCenterZ;
  coneTransform.setMatrix(IDENTITY);
  coneTransform.translate(-coneCenterX, -coneCenterY, -coneCenterZ);
  coneTransform.rotateY(-state.coneRotateY);
  coneTransform.rotateZ(-state.coneRotateZ);

  const coneHeight = modelLength * 0.7;
  // vtkCone is an infinite double cone with its apex at the local origin.
  // Each debug vtkConeSource spans from that apex to a base located one
  // coneHeight away along the axis, so the base radius must use the full
  // apex-to-base distance.
  const coneRadius = coneHeight * Math.tan((state.coneAngle * Math.PI) / 180.0);
  const [dirX, dirY, dirZ] = normalizeVector3(
    Math.cos((state.coneRotateY * Math.PI) / 180.0) *
      Math.cos((state.coneRotateZ * Math.PI) / 180.0),
    Math.sin((state.coneRotateZ * Math.PI) / 180.0),
    Math.sin((state.coneRotateY * Math.PI) / 180.0) *
      Math.cos((state.coneRotateZ * Math.PI) / 180.0)
  );
  const halfHeight = coneHeight / 2.0;
  coneDebugSource.setHeight(coneHeight);
  coneDebugSource.setRadius(coneRadius);
  coneDebugSource.setCenter(
    coneCenterX - dirX * halfHeight,
    coneCenterY - dirY * halfHeight,
    coneCenterZ - dirZ * halfHeight
  );
  coneDebugSource.setDirection(dirX, dirY, dirZ);
  coneDebugSourceBack.setHeight(coneHeight);
  coneDebugSourceBack.setRadius(coneRadius);
  coneDebugSourceBack.setCenter(
    coneCenterX + dirX * halfHeight,
    coneCenterY + dirY * halfHeight,
    coneCenterZ + dirZ * halfHeight
  );
  coneDebugSourceBack.setDirection(-dirX, -dirY, -dirZ);
}

function updateDebugActors() {
  planeDebugActor.setVisibility(state.cutType === 'plane' ? 1 : 0);
  sphereDebugActor.setVisibility(state.cutType === 'sphere' ? 1 : 0);
  boxDebugActor.setVisibility(state.cutType === 'box' ? 1 : 0);
  cylinderDebugActor.setVisibility(state.cutType === 'cylinder' ? 1 : 0);
  coneDebugActor.setVisibility(state.cutType === 'cone' ? 1 : 0);
  coneDebugActorBack.setVisibility(state.cutType === 'cone' ? 1 : 0);

  [
    planeDebugActor,
    sphereDebugActor,
    boxDebugActor,
    cylinderDebugActor,
    coneDebugActor,
    coneDebugActorBack,
  ].forEach((actor) => {
    const property = actor.getProperty();
    property.setOpacity(state.debugOpacity);
    property.setRepresentation(vtkProperty.Representation.SURFACE);
  });
}

function updateCutFunctions() {
  updatePlane();
  updateSphere();
  updateBox();
  updateCylinder();
  updateCone();
}

function updateScene() {
  updateCutFunctions();

  const cutFunction = cutFunctions[state.cutType];
  gpuCutMapper.setCutFunction(cutFunction);
  gpuCutMapper.setCutWidth(state.gpuWidth);

  gpuCutActor.setVisibility(state.showGPU);
  updateDebugActors();
  renderWindow.render();
}

const gui = new GUI();
const typeFolders = {};
const positionControllers = [];
let sphereRadiusController = null;
let cylinderRadiusController = null;
let boxSizeXController = null;
let boxSizeYController = null;
let boxSizeZController = null;

function addPositionController(folder, key, axisIndex, label) {
  const controller = folder
    .add(
      state,
      key,
      -modelHalfExtents[axisIndex],
      modelHalfExtents[axisIndex],
      0.01
    )
    .name(label)
    .onChange((value) => {
      state[key] = Number(value);
      updateScene();
    });
  positionControllers.push({ controller, axisIndex });
  return controller;
}

function updatePositionControllerRanges() {
  positionControllers.forEach(({ controller, axisIndex }) => {
    controller.min(-modelHalfExtents[axisIndex]);
    controller.max(modelHalfExtents[axisIndex]);
    controller.updateDisplay();
  });
}

function setFolderVisibility(folder, visible) {
  if (folder?.domElement) {
    folder.domElement.style.display = visible ? '' : 'none';
  }
}

function updateVisibleTypeSettings() {
  Object.entries(typeFolders).forEach(([type, folder]) => {
    setFolderVisibility(folder, type === state.cutType);
  });
}

gui
  .add(state, 'cutType', Object.keys(cutFunctions))
  .name('Cut type')
  .onChange((value) => {
    state.cutType = value;
    updateVisibleTypeSettings();
    updateScene();
  });

gui
  .add(state, 'gpuWidth', 0.5, 5.0, 0.1)
  .name('Cut width')
  .onChange((value) => {
    state.gpuWidth = Number(value);
    updateScene();
  });

gui
  .add(state, 'showGPU')
  .name('Cut rendering')
  .onChange((value) => {
    state.showGPU = value;
    updateScene();
  });

gui
  .add(state, 'debugOpacity', 0.0, 1.0, 0.01)
  .name('Opacity')
  .onChange((value) => {
    state.debugOpacity = Number(value);
    updateScene();
  });

const planeFolder = gui.addFolder('Plane');
typeFolders.plane = planeFolder;
addPositionController(planeFolder, 'planeOriginX', 0, 'Offset X');
addPositionController(planeFolder, 'planeOriginY', 1, 'Offset Y');
addPositionController(planeFolder, 'planeOriginZ', 2, 'Offset Z');
planeFolder
  .add(state, 'planeNormalX', -1.0, 1.0, 0.01)
  .name('Normal X')
  .onChange((value) => {
    state.planeNormalX = Number(value);
    updateScene();
  });
planeFolder
  .add(state, 'planeNormalY', -1.0, 1.0, 0.01)
  .name('Normal Y')
  .onChange((value) => {
    state.planeNormalY = Number(value);
    updateScene();
  });
planeFolder
  .add(state, 'planeNormalZ', -1.0, 1.0, 0.01)
  .name('Normal Z')
  .onChange((value) => {
    state.planeNormalZ = Number(value);
    updateScene();
  });

const sphereFolder = gui.addFolder('Sphere');
typeFolders.sphere = sphereFolder;
addPositionController(sphereFolder, 'sphereCenterX', 0, 'Offset X');
addPositionController(sphereFolder, 'sphereCenterY', 1, 'Offset Y');
addPositionController(sphereFolder, 'sphereCenterZ', 2, 'Offset Z');
sphereRadiusController = sphereFolder
  .add(state, 'sphereRadius', 0.05, 1.0, 0.01)
  .name('Radius');
sphereRadiusController.onChange((value) => {
  state.sphereRadius = Number(value);
  updateScene();
});

const boxFolder = gui.addFolder('Box');
typeFolders.box = boxFolder;
addPositionController(boxFolder, 'boxCenterX', 0, 'Offset X');
addPositionController(boxFolder, 'boxCenterY', 1, 'Offset Y');
addPositionController(boxFolder, 'boxCenterZ', 2, 'Offset Z');
boxSizeXController = boxFolder
  .add(state, 'boxSizeX', 0.05, 1.5, 0.01)
  .name('Size X');
boxSizeXController.onChange((value) => {
  state.boxSizeX = Number(value);
  updateScene();
});
boxSizeYController = boxFolder
  .add(state, 'boxSizeY', 0.05, 1.5, 0.01)
  .name('Size Y');
boxSizeYController.onChange((value) => {
  state.boxSizeY = Number(value);
  updateScene();
});
boxSizeZController = boxFolder
  .add(state, 'boxSizeZ', 0.05, 1.5, 0.01)
  .name('Size Z');
boxSizeZController.onChange((value) => {
  state.boxSizeZ = Number(value);
  updateScene();
});

const cylinderFolder = gui.addFolder('Cylinder');
typeFolders.cylinder = cylinderFolder;
addPositionController(cylinderFolder, 'cylinderCenterX', 0, 'Offset X');
addPositionController(cylinderFolder, 'cylinderCenterY', 1, 'Offset Y');
addPositionController(cylinderFolder, 'cylinderCenterZ', 2, 'Offset Z');
cylinderFolder
  .add(state, 'cylinderAxisX', -1.0, 1.0, 0.01)
  .name('Axis X')
  .onChange((value) => {
    state.cylinderAxisX = Number(value);
    updateScene();
  });
cylinderFolder
  .add(state, 'cylinderAxisY', -1.0, 1.0, 0.01)
  .name('Axis Y')
  .onChange((value) => {
    state.cylinderAxisY = Number(value);
    updateScene();
  });
cylinderFolder
  .add(state, 'cylinderAxisZ', -1.0, 1.0, 0.01)
  .name('Axis Z')
  .onChange((value) => {
    state.cylinderAxisZ = Number(value);
    updateScene();
  });
cylinderRadiusController = cylinderFolder
  .add(state, 'cylinderRadius', 0.05, 1.0, 0.01)
  .name('Radius');
cylinderRadiusController.onChange((value) => {
  state.cylinderRadius = Number(value);
  updateScene();
});

const coneFolder = gui.addFolder('Cone');
typeFolders.cone = coneFolder;
addPositionController(coneFolder, 'coneCenterX', 0, 'Offset X');
addPositionController(coneFolder, 'coneCenterY', 1, 'Offset Y');
addPositionController(coneFolder, 'coneCenterZ', 2, 'Offset Z');
coneFolder
  .add(state, 'coneAngle', 5.0, 60.0, 0.5)
  .name('Angle')
  .onChange((value) => {
    state.coneAngle = Number(value);
    updateScene();
  });
coneFolder
  .add(state, 'coneRotateY', -180.0, 180.0, 1.0)
  .name('Rotate Y')
  .onChange((value) => {
    state.coneRotateY = Number(value);
    updateScene();
  });
coneFolder
  .add(state, 'coneRotateZ', -180.0, 180.0, 1.0)
  .name('Rotate Z')
  .onChange((value) => {
    state.coneRotateZ = Number(value);
    updateScene();
  });

updateVisibleTypeSettings();

HttpDataAccessHelper.fetchBinary(
  `${__BASE_PATH__}/data/StanfordDragon.vtkjs`,
  {}
).then((zipContent) => {
  const dataAccessHelper = DataAccessHelper.get('zip', {
    zipContent,
    callback: () => {
      const sceneImporter = vtkHttpSceneLoader.newInstance({
        renderer,
        dataAccessHelper,
      });
      sceneImporter.setUrl('index.json');
      sceneImporter.onReady(() => {
        sceneImporter.getScene()[0].actor.setVisibility(false);

        const source = sceneImporter.getScene()[0].source;
        meshMapper.setInputConnection(source.getOutputPort());
        gpuCutMapper.setInputConnection(source.getOutputPort());
        const inputData = source.getOutputData();
        if (inputData?.getBounds) {
          modelBounds = inputData.getBounds();
          const dx = modelBounds[1] - modelBounds[0];
          const dy = modelBounds[3] - modelBounds[2];
          const dz = modelBounds[5] - modelBounds[4];
          modelLength = Math.hypot(dx, dy, dz);
          const centerX = (modelBounds[0] + modelBounds[1]) / 2;
          const centerY = (modelBounds[2] + modelBounds[3]) / 2;
          const centerZ = (modelBounds[4] + modelBounds[5]) / 2;
          modelCenter = [centerX, centerY, centerZ];
          modelHalfExtents = [
            Math.max(dx / 2, 0.01),
            Math.max(dy / 2, 0.01),
            Math.max(dz / 2, 0.01),
          ];
          const maxSpan = Math.max(dx, dy, dz);

          state.planeOriginX = 0.0;
          state.planeOriginY = 0.0;
          state.planeOriginZ = 0.0;
          state.sphereCenterX = 0.0;
          state.sphereCenterY = 0.0;
          state.sphereCenterZ = 0.0;
          state.sphereRadius = maxSpan * 0.22;
          if (sphereRadiusController) {
            sphereRadiusController.min(maxSpan * 0.02);
            sphereRadiusController.max(maxSpan * 0.6);
            sphereRadiusController.updateDisplay();
          }
          state.boxCenterX = 0.0;
          state.boxCenterY = 0.0;
          state.boxCenterZ = 0.0;
          state.boxSizeX = maxSpan * 0.42;
          state.boxSizeY = maxSpan * 0.42;
          state.boxSizeZ = maxSpan * 0.42;
          [boxSizeXController, boxSizeYController, boxSizeZController].forEach(
            (controller) => {
              if (controller) {
                controller.min(maxSpan * 0.02);
                controller.max(maxSpan * 0.8);
                controller.updateDisplay();
              }
            }
          );
          state.cylinderCenterX = 0.0;
          state.cylinderCenterY = 0.0;
          state.cylinderCenterZ = 0.0;
          state.cylinderRadius = maxSpan * 0.18;
          if (cylinderRadiusController) {
            cylinderRadiusController.min(maxSpan * 0.02);
            cylinderRadiusController.max(maxSpan * 0.5);
            cylinderRadiusController.updateDisplay();
          }
          state.coneCenterX = 0.0;
          state.coneCenterY = 0.0;
          state.coneCenterZ = 0.0;
          state.coneAngle = 28.0;
          updatePositionControllerRanges();
        }
        renderer.resetCamera();
        updateScene();
      });
    },
  });
});
