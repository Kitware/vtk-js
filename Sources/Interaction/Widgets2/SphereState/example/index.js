import 'vtk.js/Sources/favicon';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkSphereHandleRepresentation from 'vtk.js/Sources/Interaction/Widgets2/SphereHandleRepresentation';
import vtkStateBuilder from 'vtk.js/Sources/Interaction/Widgets2/StateBuilder';

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

// State
const compositeState = vtkStateBuilder
  .createBuilder()
  .add('sphere', 'a', { radius: 0.5, position: [-1, 0, 0] })
  .add('sphere', 'b', { radius: 0.5, position: [0, 0, 0] })
  .add('sphere', 'c', { radius: 0.5, position: [1, 0, 0] })
  .build();

// Representation
const widgetRep = vtkSphereHandleRepresentation.newInstance();
widgetRep.setInputData(compositeState);
widgetRep.setSphereStates(['a', 'b', 'c']);
widgetRep.getActors().forEach(renderer.addActor);

renderer.resetCamera();
renderWindow.render();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

fullScreenRenderer.addController(controlPanel);

function updateState(e) {
  const { name, field, index } = e.currentTarget.dataset;
  const value = Number(e.currentTarget.value);
  const stateObj = compositeState.get(field)[field];
  if (name) {
    stateObj.set({ [name]: value });
  } else {
    const center = stateObj.getPosition();
    center[Number(index)] = value;
    stateObj.setPosition(center);
  }

  renderWindow.render();
}

const fieldsElems = document.querySelectorAll('.stateField');
for (let i = 0; i < fieldsElems.length; i++) {
  fieldsElems[i].addEventListener('input', updateState);
}

const toggleElems = document.querySelectorAll('.active');
for (let i = 0; i < toggleElems.length; i++) {
  toggleElems[i].addEventListener('change', (e) => {
    const { field } = e.currentTarget.dataset;
    const active = !!e.target.checked;
    const stateObj = compositeState.get(field)[field];
    stateObj.set({ active });

    renderWindow.render();
  });
}

const glyphElems = document.querySelectorAll('.glyph');
for (let i = 0; i < glyphElems.length; i++) {
  glyphElems[i].addEventListener('input', (e) => {
    const { field } = e.currentTarget.dataset;
    const value = Number(e.currentTarget.value);
    widgetRep.set({ [field]: value });
    renderWindow.render();
  });
}

// -----------------------------------------------------------
