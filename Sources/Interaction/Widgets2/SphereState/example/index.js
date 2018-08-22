import 'vtk.js/Sources/favicon';

import macro from 'vtk.js/Sources/macro';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkSphereHandleRepresentation from 'vtk.js/Sources/Interaction/Widgets2/SphereHandleRepresentation';
import vtkSphereState from 'vtk.js/Sources/Interaction/Widgets2/SphereState';
import vtkWidgetState from 'vtk.js/Sources/Interaction/Widgets2/WidgetState';

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
const compositeState = {};
const compositeStateModel = {
  a: vtkSphereState.newInstance(),
  b: vtkSphereState.newInstance(),
  c: vtkSphereState.newInstance(),
};
vtkWidgetState.extend(compositeState, compositeStateModel);
macro.setGet(compositeState, compositeStateModel, ['a', 'b', 'c']);
compositeState.bindState(compositeStateModel.a);
compositeState.bindState(compositeStateModel.b);
compositeState.bindState(compositeStateModel.c);

// Representation
const widgetRep = vtkSphereHandleRepresentation.newInstance();
widgetRep.setWidgetState(compositeState, ['a', 'b', 'c']);
widgetRep.getActors().forEach(renderer.addActor);

renderer.resetCamera();
renderWindow.render();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

fullScreenRenderer.addController(controlPanel);

const fieldsElems = document.querySelectorAll('.stateField');

function updateState(e) {
  const { name, field, index } = e.currentTarget.dataset;
  const value = Number(e.currentTarget.value);
  console.log('field', field, name, value);
  const stateObj = compositeStateModel[field];
  if (name) {
    stateObj.set({ [name]: value });
  } else {
    const center = stateObj.getPosition();
    center[Number(index)] = value;
    stateObj.setPosition(center);
  }

  renderWindow.render();
}

for (let i = 0; i < fieldsElems.length; i++) {
  fieldsElems[i].addEventListener('input', updateState);
}

// -----------------------------------------------------------
