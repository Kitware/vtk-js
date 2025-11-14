import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkCylinderSource from '@kitware/vtk.js/Filters/Sources/CylinderSource';
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

function createCylinderPipeline() {
  const cylinderSource = vtkCylinderSource.newInstance();
  const actor = vtkActor.newInstance();
  const mapper = vtkMapper.newInstance();

  actor.setMapper(mapper);
  mapper.setInputConnection(cylinderSource.getOutputPort());

  renderer.addActor(actor);
  return { cylinderSource, mapper, actor };
}

const pipelines = [createCylinderPipeline(), createCylinderPipeline()];

// Create red wireframe baseline
pipelines[0].actor.getProperty().setRepresentation(1);
pipelines[0].actor.getProperty().setColor(1, 0, 0);

renderer.resetCamera();
renderWindow.render();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

const gui = new GUI();
const params = {
  height: 1.0,
  radius: 1.0,
  resolution: 6,
  capping: true,
  centerX: 0,
  centerY: 0,
  centerZ: 0,
};

function updateDimensions() {
  pipelines.forEach(({ cylinderSource }) => {
    cylinderSource.set({
      height: params.height,
      radius: params.radius,
      resolution: params.resolution,
      capping: params.capping,
    });
  });
  renderWindow.render();
}

function updateTransformedCylinder() {
  const center = [params.centerX, params.centerY, params.centerZ];
  pipelines[1].cylinderSource.set({ center });
  renderWindow.render();
}

gui
  .add(params, 'height', 0.5, 2.0, 0.1)
  .name('Height')
  .onChange((value) => {
    params.height = Number(value);
    updateDimensions();
  });

gui
  .add(params, 'radius', 0.5, 2.0, 0.1)
  .name('Radius')
  .onChange((value) => {
    params.radius = Number(value);
    updateDimensions();
  });

gui
  .add(params, 'resolution', 4, 100, 1)
  .name('Resolution')
  .onChange((value) => {
    params.resolution = Number(value);
    updateDimensions();
  });

gui
  .add(params, 'capping')
  .name('Capping')
  .onChange((value) => {
    params.capping = !!value;
    updateDimensions();
  });

gui
  .add(params, 'centerX', -1.0, 1.0, 0.1)
  .name('Center X')
  .onChange(updateTransformedCylinder);
gui
  .add(params, 'centerY', -1.0, 1.0, 0.1)
  .name('Center Y')
  .onChange(updateTransformedCylinder);
gui
  .add(params, 'centerZ', -1.0, 1.0, 0.1)
  .name('Center Z')
  .onChange(updateTransformedCylinder);

updateDimensions();

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.pipelines = pipelines;
global.renderer = renderer;
global.renderWindow = renderWindow;
