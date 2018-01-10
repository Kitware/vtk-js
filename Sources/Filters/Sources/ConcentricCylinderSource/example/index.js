import 'vtk.js/Sources/favicon';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkConcentricCylinderSource from 'vtk.js/Sources/Filters/Sources/ConcentricCylinderSource';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';

// import { ColorMode, ScalarMode }    from 'vtk.js/Sources/Rendering/Core/Mapper/Constants';

import controlPanel from './controlPanel.html';

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

fullScreenRenderer.addController(controlPanel);

document.querySelector('.skipInnerFaces').addEventListener('change', (e) => {
  const skipInnerFaces = !!e.target.checked;
  cylinder.setSkipInnerFaces(skipInnerFaces);
  renderWindow.render();
});

const masksButtons = document.querySelectorAll('.mask');
let count = masksButtons.length;
while (count--) {
  masksButtons[count].addEventListener('change', (e) => {
    const mask = !!e.target.checked;
    const index = Number(e.target.dataset.layer);
    cylinder.setMaskLayer(index, mask);
    renderWindow.render();
  });
}
['startTheta', 'endTheta', 'resolution'].forEach((propertyName) => {
  document.querySelector(`.${propertyName}`).addEventListener('input', (e) => {
    const value = Number(e.target.value);
    cylinder.set({ [propertyName]: value });
    renderWindow.render();
  });
});

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.cylinder = cylinder;
global.renderer = renderer;
global.renderWindow = renderWindow;
