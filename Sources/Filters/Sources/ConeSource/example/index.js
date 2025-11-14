import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
// import vtkPolyData from '@kitware/vtk.js/Common/DataModel/PolyData';
import vtkConeSource from '@kitware/vtk.js/Filters/Sources/ConeSource';
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

function createConePipeline() {
  const coneSource = vtkConeSource.newInstance();
  const actor = vtkActor.newInstance();
  const mapper = vtkMapper.newInstance();

  actor.setMapper(mapper);
  mapper.setInputConnection(coneSource.getOutputPort());

  renderer.addActor(actor);

  // const polyData = vtkPolyData.newInstance();
  // const pointCount = Math.round(10000000 / 5);
  // const points = new Float32Array(3 * pointCount);
  // points.fill(1);
  // polyData.getPoints().setData(points);
  // polyData.getPoints().setRange({ min: 1, max: 1 }, 0);
  // polyData.getPoints().setRange({ min: 1, max: 1 }, 1);
  // polyData.getPoints().setRange({ min: 1, max: 1 }, 2);
  // const polys = new Uint32Array(1000);
  // polys.fill(1);
  // polyData.getPolys().setData(polys);
  // const mapper2 = vtkMapper.newInstance();
  // mapper2.setInputData(polyData);
  // const actor2 = vtkActor.newInstance();
  // actor2.setMapper(mapper2);
  // renderer.addActor(actor2);
  return { coneSource, mapper, actor };
}

const pipelines = [createConePipeline(), createConePipeline()];

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
  directionX: 1,
  directionY: 0,
  directionZ: 0,
};

function updateDimensions() {
  pipelines.forEach(({ coneSource }) => {
    coneSource.set({
      height: params.height,
      radius: params.radius,
      resolution: params.resolution,
      capping: params.capping,
    });
  });
  renderWindow.render();
}

function updateTransformedCone() {
  const center = [params.centerX, params.centerY, params.centerZ];
  const direction = [params.directionX, params.directionY, params.directionZ];
  pipelines[1].coneSource.set({ center, direction });
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
  .onChange(updateTransformedCone);
gui
  .add(params, 'centerY', -1.0, 1.0, 0.1)
  .name('Center Y')
  .onChange(updateTransformedCone);
gui
  .add(params, 'centerZ', -1.0, 1.0, 0.1)
  .name('Center Z')
  .onChange(updateTransformedCone);

gui
  .add(params, 'directionX', -1.0, 1.0, 0.1)
  .name('Direction X')
  .onChange(updateTransformedCone);
gui
  .add(params, 'directionY', -1.0, 1.0, 0.1)
  .name('Direction Y')
  .onChange(updateTransformedCone);
gui
  .add(params, 'directionZ', -1.0, 1.0, 0.1)
  .name('Direction Z')
  .onChange(updateTransformedCone);

updateDimensions();
updateTransformedCone();

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.pipelines = pipelines;
global.renderer = renderer;
global.renderWindow = renderWindow;
