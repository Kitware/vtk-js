import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkConcentricCylinderSource from '@kitware/vtk.js/Filters/Sources/ConcentricCylinderSource';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';

// import { ColorMode, ScalarMode }    from '@kitware/vtk.js/Rendering/Core/Mapper/Constants';

import GUI from 'lil-gui';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0.5, 0.5, 0.5],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

const cylinder = vtkConcentricCylinderSource.newInstance({
  height: 0.25,
  radius: [0.2, 0.3, 0.4, 0.6, 0.7, 0.8, 0.9, 1],
  cellFields: [0, 0.2, 0.4, 0.6, 0.7, 0.8, 0.9, 1],
  resolution: 60,
  skipInnerFaces: true,
});
const actor = vtkActor.newInstance();
const mapper = vtkMapper.newInstance();

actor.setMapper(mapper);
mapper.setInputConnection(cylinder.getOutputPort());

const lut = mapper.getLookupTable();
lut.setValueRange(0.2, 1);
lut.setHueRange(0.666, 0);

renderer.addActor(actor);
renderer.resetCamera();
renderWindow.render();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

const gui = new GUI();
const params = {
  skipInnerFaces: true,
  startTheta: 0,
  endTheta: 360,
  resolution: 60,
  hideLayer0: false,
  hideLayer1: false,
  hideLayer2: false,
  hideLayer3: false,
  hideLayer4: false,
  hideLayer5: false,
  hideLayer6: false,
  hideLayer7: false,
};

gui
  .add(params, 'skipInnerFaces')
  .name('Skip inner cells')
  .onChange((value) => {
    cylinder.setSkipInnerFaces(!!value);
    renderWindow.render();
  });

gui
  .add(params, 'startTheta', 0, 360, 1)
  .name('Start theta')
  .onChange((value) => {
    cylinder.set({ startTheta: Number(value) });
    renderWindow.render();
  });

gui
  .add(params, 'endTheta', 0, 360, 1)
  .name('End theta')
  .onChange((value) => {
    cylinder.set({ endTheta: Number(value) });
    renderWindow.render();
  });

gui
  .add(params, 'resolution', 3, 120, 1)
  .name('Resolution')
  .onChange((value) => {
    cylinder.set({ resolution: Number(value) });
    renderWindow.render();
  });

function updateLayerMask(layerIndex, hidden) {
  cylinder.setMaskLayer(layerIndex, !!hidden);
  renderWindow.render();
}

gui
  .add(params, 'hideLayer0')
  .name('Hide layer 0')
  .onChange((value) => updateLayerMask(0, value));
gui
  .add(params, 'hideLayer1')
  .name('Hide layer 1')
  .onChange((value) => updateLayerMask(1, value));
gui
  .add(params, 'hideLayer2')
  .name('Hide layer 2')
  .onChange((value) => updateLayerMask(2, value));
gui
  .add(params, 'hideLayer3')
  .name('Hide layer 3')
  .onChange((value) => updateLayerMask(3, value));
gui
  .add(params, 'hideLayer4')
  .name('Hide layer 4')
  .onChange((value) => updateLayerMask(4, value));
gui
  .add(params, 'hideLayer5')
  .name('Hide layer 5')
  .onChange((value) => updateLayerMask(5, value));
gui
  .add(params, 'hideLayer6')
  .name('Hide layer 6')
  .onChange((value) => updateLayerMask(6, value));
gui
  .add(params, 'hideLayer7')
  .name('Hide layer 7')
  .onChange((value) => updateLayerMask(7, value));

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.cylinder = cylinder;
global.renderer = renderer;
global.renderWindow = renderWindow;
