import 'vtk.js/Sources/favicon';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkImplicitPlaneRepresentation from 'vtk.js/Sources/Widgets/Representations/ImplicitPlaneRepresentation';

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
// State / Representation
// ----------------------------------------------------------------------------

const representation = vtkImplicitPlaneRepresentation.newInstance();

const state = vtkImplicitPlaneRepresentation.generateState();
representation.setInputData(state);

representation.getActors().forEach(renderer.addActor);

renderer.resetCamera();
renderer.resetCameraClippingRange();
renderWindow.render();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

fullScreenRenderer.addController(controlPanel);

function updateValue(e) {
  const value = Number(e.target.value);
  const name = e.currentTarget.dataset.name;
  const index = Number(e.currentTarget.dataset.index);
  const array = state.get(name)[name].slice(); // To make sure state get modified
  array[index] = value;
  state.set({ [name]: array });
  renderWindow.render();
}

const elems = document.querySelectorAll('.slider');
for (let i = 0; i < elems.length; i++) {
  elems[i].addEventListener('input', updateValue);
}
