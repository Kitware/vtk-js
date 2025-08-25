import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
// import vtkPolyData from '@kitware/vtk.js/Common/DataModel/PolyData';
import vtkConeSource from '@kitware/vtk.js/Filters/Sources/ConeSource';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';

import controlPanel from './controlPanel.html';

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

fullScreenRenderer.addController(controlPanel);

['height', 'radius', 'resolution'].forEach((propertyName) => {
  document.querySelector(`.${propertyName}`).addEventListener('input', (e) => {
    const value = Number(e.target.value);
    // pipelines[0].coneSource.set({ [propertyName]: value });
    pipelines[1].coneSource.set({ [propertyName]: value });
    renderWindow.render();
  });
});

document.querySelector('.capping').addEventListener('change', (e) => {
  const capping = !!e.target.checked;
  pipelines[0].coneSource.set({ capping });
  pipelines[1].coneSource.set({ capping });
  renderWindow.render();
});

const centerElems = document.querySelectorAll('.center');
const directionElems = document.querySelectorAll('.direction');

function updateTransformedCone() {
  const center = [0, 0, 0];
  const direction = [1, 0, 0];
  for (let i = 0; i < 3; i++) {
    center[Number(centerElems[i].dataset.index)] = Number(centerElems[i].value);
    direction[Number(directionElems[i].dataset.index)] = Number(
      directionElems[i].value
    );
  }
  console.log('updateTransformedCone', center, direction);
  pipelines[1].coneSource.set({ center, direction });
  renderWindow.render();
}

for (let i = 0; i < 3; i++) {
  centerElems[i].addEventListener('input', updateTransformedCone);
  directionElems[i].addEventListener('input', updateTransformedCone);
}

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.pipelines = pipelines;
global.renderer = renderer;
global.renderWindow = renderWindow;
