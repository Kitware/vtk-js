import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/All';

import vtkCubeHandleRepresentation from 'vtk.js/Sources/Widgets/Representations/CubeHandleRepresentation';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkSphereHandleRepresentation from 'vtk.js/Sources/Widgets/Representations/SphereHandleRepresentation';
import vtkStateBuilder from 'vtk.js/Sources/Widgets/Core/StateBuilder';

import controlPanel from './controlPanel.html';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// -----------------------------------------------------------
// State
// -----------------------------------------------------------

const compositeState = vtkStateBuilder
  .createBuilder()
  .addStateFromMixin({
    labels: ['all', 'a', 'ab', 'ac'],
    mixins: ['origin', 'color', 'scale1'],
    name: 'a',
    initialValues: {
      scale1: 0.5,
      origin: [-1, 0, 0],
    },
  })
  .addStateFromMixin({
    labels: ['all', 'b', 'ab', 'bc'],
    mixins: ['origin', 'color', 'scale1'],
    name: 'b',
    initialValues: {
      scale1: 0.5,
      origin: [0, 0, 0],
    },
  })
  .addStateFromMixin({
    labels: ['all', 'c', 'bc', 'ac'],
    mixins: ['origin', 'color', 'scale1'],
    name: 'c',
    initialValues: {
      scale1: 0.5,
      origin: [1, 0, 0],
    },
  })
  .addStateFromMixin({
    labels: ['all', 'd'],
    mixins: ['origin', 'color', 'scale3'],
    name: 'd',
    initialValues: {
      scale3: [0.5, 1, 2],
      origin: [0, 0, 2],
    },
  })
  .build();

// -----------------------------------------------------------
// Representation
// -----------------------------------------------------------

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
    const center = stateObj.getOrigin();
    center[Number(index)] = value;
    stateObj.setOrigin(center);
  }

  renderWindow.render();
}

// -----------------------------------------------------------

const fieldsElems = document.querySelectorAll('.stateField');
for (let i = 0; i < fieldsElems.length; i++) {
  fieldsElems[i].addEventListener('input', updateState);
}

// -----------------------------------------------------------

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

// -----------------------------------------------------------

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
