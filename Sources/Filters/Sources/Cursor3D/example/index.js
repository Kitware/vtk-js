import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkSphereSource from '@kitware/vtk.js/Filters/Sources/SphereSource';
import vtkCursor3D from '@kitware/vtk.js/Filters/Sources/Cursor3D';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';

import GUI from 'lil-gui';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------
const cursor3D = vtkCursor3D.newInstance();
cursor3D.setFocalPoint([0, 0, 0]);
cursor3D.setModelBounds([-10, 10, -10, 10, -10, 10]);
const cursor3DMapper = vtkMapper.newInstance();
cursor3DMapper.setInputConnection(cursor3D.getOutputPort());
const cursor3DActor = vtkActor.newInstance();
cursor3DActor.setMapper(cursor3DMapper);

const sphereSource = vtkSphereSource.newInstance();
const sphererMapper = vtkMapper.newInstance();
sphererMapper.setInputConnection(sphereSource.getOutputPort());
const sphereActor = vtkActor.newInstance();
sphereActor.setMapper(sphererMapper);

renderer.addActor(cursor3DActor);
renderer.addActor(sphereActor);
renderer.resetCamera();
renderWindow.render();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

const gui = new GUI();
const params = {
  focalPointX: 0,
  focalPointY: 0,
  focalPointZ: 0,
  modelBoundsXMin: -10,
  modelBoundsXMax: 10,
  modelBoundsYMin: -10,
  modelBoundsYMax: 10,
  modelBoundsZMin: -10,
  modelBoundsZMax: 10,
  outline: true,
  axes: true,
  xShadows: true,
  yShadows: true,
  zShadows: true,
  wrap: false,
  translationMode: false,
};

function applyFocalPoint() {
  cursor3D.setFocalPoint([
    params.focalPointX,
    params.focalPointY,
    params.focalPointZ,
  ]);
  renderer.resetCameraClippingRange();
  renderWindow.render();
}

function applyModelBounds() {
  cursor3D.setModelBounds([
    params.modelBoundsXMin,
    params.modelBoundsXMax,
    params.modelBoundsYMin,
    params.modelBoundsYMax,
    params.modelBoundsZMin,
    params.modelBoundsZMax,
  ]);
  renderer.resetCameraClippingRange();
  renderWindow.render();
}

function applyFlags() {
  cursor3D.set({
    outline: params.outline,
    axes: params.axes,
    xShadows: params.xShadows,
    yShadows: params.yShadows,
    zShadows: params.zShadows,
    wrap: params.wrap,
    translationMode: params.translationMode,
  });
  renderer.resetCameraClippingRange();
  renderWindow.render();
}

const focalFolder = gui.addFolder('Focal point');
focalFolder
  .add(params, 'focalPointX', -10, 10, 1)
  .name('X')
  .onChange((value) => {
    params.focalPointX = Number(value);
    applyFocalPoint();
  });
focalFolder
  .add(params, 'focalPointY', -10, 10, 1)
  .name('Y')
  .onChange((value) => {
    params.focalPointY = Number(value);
    applyFocalPoint();
  });
focalFolder
  .add(params, 'focalPointZ', -10, 10, 1)
  .name('Z')
  .onChange((value) => {
    params.focalPointZ = Number(value);
    applyFocalPoint();
  });

const boundsFolder = gui.addFolder('Model bounds');
boundsFolder
  .add(params, 'modelBoundsXMin', -10, 10, 1)
  .name('X min')
  .onChange((value) => {
    params.modelBoundsXMin = Number(value);
    applyModelBounds();
  });
boundsFolder
  .add(params, 'modelBoundsXMax', -10, 10, 1)
  .name('X max')
  .onChange((value) => {
    params.modelBoundsXMax = Number(value);
    applyModelBounds();
  });
boundsFolder
  .add(params, 'modelBoundsYMin', -10, 10, 1)
  .name('Y min')
  .onChange((value) => {
    params.modelBoundsYMin = Number(value);
    applyModelBounds();
  });
boundsFolder
  .add(params, 'modelBoundsYMax', -10, 10, 1)
  .name('Y max')
  .onChange((value) => {
    params.modelBoundsYMax = Number(value);
    applyModelBounds();
  });
boundsFolder
  .add(params, 'modelBoundsZMin', -10, 10, 1)
  .name('Z min')
  .onChange((value) => {
    params.modelBoundsZMin = Number(value);
    applyModelBounds();
  });
boundsFolder
  .add(params, 'modelBoundsZMax', -10, 10, 1)
  .name('Z max')
  .onChange((value) => {
    params.modelBoundsZMax = Number(value);
    applyModelBounds();
  });

const flagsFolder = gui.addFolder('Display');
flagsFolder
  .add(params, 'outline')
  .name('Outline')
  .onChange((value) => {
    params.outline = !!value;
    applyFlags();
  });
flagsFolder
  .add(params, 'axes')
  .name('Axes')
  .onChange((value) => {
    params.axes = !!value;
    applyFlags();
  });
flagsFolder
  .add(params, 'xShadows')
  .name('X shadows')
  .onChange((value) => {
    params.xShadows = !!value;
    applyFlags();
  });
flagsFolder
  .add(params, 'yShadows')
  .name('Y shadows')
  .onChange((value) => {
    params.yShadows = !!value;
    applyFlags();
  });
flagsFolder
  .add(params, 'zShadows')
  .name('Z shadows')
  .onChange((value) => {
    params.zShadows = !!value;
    applyFlags();
  });
flagsFolder
  .add(params, 'wrap')
  .name('Wrap')
  .onChange((value) => {
    params.wrap = !!value;
    applyFlags();
  });
flagsFolder
  .add(params, 'translationMode')
  .name('Translation mode')
  .onChange((value) => {
    params.translationMode = !!value;
    applyFlags();
  });

applyFocalPoint();
applyModelBounds();
applyFlags();
