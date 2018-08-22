import 'vtk.js/Sources/favicon';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkHandleWidget from 'vtk.js/Sources/Interaction/Widgets2/HandleWidget2';
import vtkSphereHandleRepresentation from 'vtk.js/Sources/Interaction/Widgets2/SphereHandleRepresentation';
import vtkCubeHandleRepresentation from 'vtk.js/Sources/Interaction/Widgets2/CubeHandleRepresentation';
import vtkPlanePointManipulator from 'vtk.js/Sources/Interaction/Widgets2/PlanePointManipulator';
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
const interactor = renderWindow.getInteractor();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

// State
const compositeState = vtkStateBuilder
  .createBuilder()
  .add(['all', 'a'], 'sphere', 'a', {
    radius: 0.5,
    position: [0, 0, 0],
  })
  .build();

// Representation
const widgetSphereRep = vtkSphereHandleRepresentation.newInstance();
widgetSphereRep.setInputData(compositeState);
widgetSphereRep.setLabels(['all']);
widgetSphereRep.getActors().forEach(renderer.addActor);

const widgetCubeRep = vtkCubeHandleRepresentation.newInstance();
widgetCubeRep.setInputData(compositeState);
widgetCubeRep.setLabels('all');
widgetCubeRep.getActors().forEach(renderer.addActor);

const reps = { sphere: widgetSphereRep, cube: widgetCubeRep };

renderer.resetCamera();
renderWindow.render();

// Manipulator
const planePointManipulator = vtkPlanePointManipulator.newInstance({
  interactor,
});
planePointManipulator.setPlaneNormal(0, 0, 1);
planePointManipulator.setPlaneOrigin(0, 0, 0);

// Widget
const handleWidget = vtkHandleWidget.newInstance({
  widgetState: compositeState,
  manipulator: planePointManipulator,
});

window.handleWidget = handleWidget;

// -----------------------------------------------------------
// Interaction events
// -----------------------------------------------------------

compositeState.onModified(() => {
  renderer.resetCameraClippingRange();
  interactor.render();
});

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
    const { field, rep } = e.currentTarget.dataset;
    const strValue = e.currentTarget.value;
    const numValue = Number(strValue);
    const arrayValue = strValue.split(',');
    const value = Number.isNaN(numValue) ? strValue : numValue;
    reps[rep || 'sphere'].set({
      [field]: arrayValue.length > 1 ? arrayValue : value,
    });
    renderWindow.render();
  });
}

// -----------------------------------------------------------
