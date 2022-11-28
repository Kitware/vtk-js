import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/All';

import * as macro from '@kitware/vtk.js/macros';
import vtk from '@kitware/vtk.js/vtk';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkCalculator from '@kitware/vtk.js/Filters/General/Calculator';
import vtkConeSource from '@kitware/vtk.js/Filters/Sources/ConeSource';
import vtkDataArray from '@kitware/vtk.js/Common/Core/DataArray';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import { AttributeTypes } from '@kitware/vtk.js/Common/DataModel/DataSetAttributes/Constants';
import { FieldDataTypes } from '@kitware/vtk.js/Common/DataModel/DataSet/Constants';

import controlPanel from './controller.html';

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

const pipelineExecution = [0, 0, 0, 0];

function updateExecution(filterIdx) {
  pipelineExecution[filterIdx]++;

  pipelineExecution.forEach((value, index) => {
    const el = document.querySelector(`.filter${index}`);
    if (el) {
      el.innerHTML = `Execution #${value}`;
    }
  });
}

const coneSource = vtkConeSource.newInstance({ height: 1.0 });
const filterA = vtkCalculator.newInstance();
const filterB = vtkCalculator.newInstance();
const filterC = vtkCalculator.newInstance();

filterA.setFormula({
  getArrays: (inputDataSets) => ({
    input: [],
    output: [
      {
        location: FieldDataTypes.CELL,
        name: 'a',
        dataType: 'Float32Array',
        attribute: AttributeTypes.SCALARS,
      },
    ],
  }),
  evaluate: (arraysIn, arraysOut) => {
    updateExecution(0);
    const [scalars] = arraysOut.map((d) => d.getData());
    for (let i = 0; i < scalars.length; i++) {
      scalars[i] = Math.random();
    }
  },
});

filterB.setFormula({
  getArrays: (inputDataSets) => ({
    input: [],
    output: [
      {
        location: FieldDataTypes.CELL,
        name: 'b',
        dataType: 'Float32Array',
        attribute: AttributeTypes.SCALARS,
      },
    ],
  }),
  evaluate: (arraysIn, arraysOut) => {
    updateExecution(1);
    const [scalars] = arraysOut.map((d) => d.getData());
    for (let i = 0; i < scalars.length; i++) {
      scalars[i] = Math.random();
    }
  },
});

const randFilter = macro.newInstance((publicAPI, model) => {
  macro.obj(publicAPI, model); // make it an object
  macro.algo(publicAPI, model, 1, 1); // mixin algorithm code 1 in, 1 out
  publicAPI.requestData = (inData, outData) => {
    // implement requestData
    updateExecution(2);
    const newArray = new Float32Array(
      inData[0].getPoints().getNumberOfPoints()
    );
    for (let i = 0; i < newArray.length; i++) {
      newArray[i] = i % 2 ? 1 : 0;
    }

    const da = vtkDataArray.newInstance({ name: 'spike', values: newArray });
    const newDataSet = vtk({ vtkClass: inData[0].getClassName() });
    newDataSet.shallowCopy(inData[0]);
    newDataSet.getPointData().setScalars(da);
    outData[0] = newDataSet;
  };
})();

filterC.setFormula({
  getArrays: (inputDataSets) => ({
    input: [],
    output: [
      {
        location: FieldDataTypes.CELL,
        name: 'c',
        dataType: 'Float32Array',
        attribute: AttributeTypes.SCALARS,
      },
    ],
  }),
  evaluate: (arraysIn, arraysOut) => {
    updateExecution(3);
    const [scalars] = arraysOut.map((d) => d.getData());
    for (let i = 0; i < scalars.length; i++) {
      scalars[i] = Math.random();
    }
  },
});

filterA.setInputConnection(coneSource.getOutputPort());
filterB.setInputConnection(filterA.getOutputPort());
randFilter.setInputConnection(filterB.getOutputPort());
filterC.setInputConnection(randFilter.getOutputPort());

const mapper = vtkMapper.newInstance();
mapper.setInputConnection(filterC.getOutputPort());

const actor = vtkActor.newInstance();
actor.setMapper(mapper);

renderer.addActor(actor);
renderer.resetCamera();
renderWindow.render();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

fullScreenRenderer.addController(controlPanel);
const representationSelector = document.querySelector('.representations');
const resolutionChange = document.querySelector('.resolution');

representationSelector.addEventListener('change', (e) => {
  const newRepValue = Number(e.target.value);
  actor.getProperty().setRepresentation(newRepValue);
  renderWindow.render();
});

resolutionChange.addEventListener('input', (e) => {
  const resolution = Number(e.target.value);
  coneSource.setResolution(resolution);
  renderWindow.render();
});

const buttons = document.querySelectorAll('button');
for (let i = 0; i < buttons.length; i++) {
  buttons[i].addEventListener('click', (e) => {
    const idx = Number(e.target.name);
    if (!Number.isNaN(idx)) {
      const filter = global.filters[idx];
      filter.modified();
      renderWindow.render();
    } else {
      // Reset
      pipelineExecution.forEach((v, index) => {
        pipelineExecution[index] = 0;
      });
      updateExecution(-1);
    }
  });
}

// Update UI
updateExecution(-1);

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.source = coneSource;
global.filters = [filterA, filterB, randFilter, filterC];
global.mapper = mapper;
global.actor = actor;
global.renderer = renderer;
global.renderWindow = renderWindow;
