import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkCubeSource from '@kitware/vtk.js/Filters/Sources/CubeSource';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';

import GUI from 'lil-gui';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

function createCubePipeline() {
  const cubeSource = vtkCubeSource.newInstance();
  const actor = vtkActor.newInstance();
  const mapper = vtkMapper.newInstance();

  actor.setMapper(mapper);
  mapper.setInputConnection(cubeSource.getOutputPort());

  renderer.addActor(actor);
  return { cubeSource, mapper, actor };
}

const pipelines = [createCubePipeline(), createCubePipeline()];

// Create red wireframe baseline
pipelines[0].actor.getProperty().setRepresentation(1);
pipelines[0].actor.getProperty().setColor(1, 0, 0);

renderer.resetCamera();
renderer.resetCameraClippingRange();
renderWindow.render();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

const gui = new GUI();
const params = {
  xLength: 1,
  yLength: 1,
  zLength: 1,
  centerX: 0,
  centerY: 0,
  centerZ: 0,
  rotationX: 0,
  rotationY: 0,
  rotationZ: 0,
  reset: () => {
    params.xLength = 1;
    params.yLength = 1;
    params.zLength = 1;
    params.centerX = 0;
    params.centerY = 0;
    params.centerZ = 0;
    params.rotationX = 0;
    params.rotationY = 0;
    params.rotationZ = 0;
    gui.controllers.forEach((c) => c.updateDisplay?.());
    // eslint-disable-next-line no-use-before-define
    updateLengths();
    // eslint-disable-next-line no-use-before-define
    updateTransformedCube();
    renderer.resetCamera();
    renderer.resetCameraClippingRange();
    renderWindow.render();
  },
};

function updateLengths() {
  pipelines.forEach(({ cubeSource }) => {
    cubeSource.set({
      xLength: params.xLength,
      yLength: params.yLength,
      zLength: params.zLength,
    });
  });
  renderer.resetCameraClippingRange();
  renderWindow.render();
}

function updateTransformedCube() {
  const center = [params.centerX, params.centerY, params.centerZ];
  const rotations = [params.rotationX, params.rotationY, params.rotationZ];
  pipelines[1].cubeSource.set({ center, rotations });
  renderer.resetCameraClippingRange();
  renderWindow.render();
}

gui
  .add(params, 'xLength', 1.0, 5.0, 0.5)
  .name('X length')
  .onChange(updateLengths);
gui
  .add(params, 'yLength', 1.0, 5.0, 0.5)
  .name('Y length')
  .onChange(updateLengths);
gui
  .add(params, 'zLength', 1.0, 5.0, 0.5)
  .name('Z length')
  .onChange(updateLengths);

gui
  .add(params, 'centerX', -1.0, 1.0, 0.1)
  .name('Center X')
  .onChange(updateTransformedCube);
gui
  .add(params, 'centerY', -1.0, 1.0, 0.1)
  .name('Center Y')
  .onChange(updateTransformedCube);
gui
  .add(params, 'centerZ', -1.0, 1.0, 0.1)
  .name('Center Z')
  .onChange(updateTransformedCube);

gui
  .add(params, 'rotationX', 0.0, 90.0, 5.0)
  .name('Rotation X')
  .onChange(updateTransformedCube);
gui
  .add(params, 'rotationY', 0.0, 90.0, 5.0)
  .name('Rotation Y')
  .onChange(updateTransformedCube);
gui
  .add(params, 'rotationZ', 0.0, 90.0, 5.0)
  .name('Rotation Z')
  .onChange(updateTransformedCube);

gui.add(params, 'reset').name('Reset');

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.pipelines = pipelines;
global.renderer = renderer;
global.renderWindow = renderWindow;
