import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import '@kitware/vtk.js/Rendering/Profiles/Molecule'; // vtkSphereMapper

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkCalculator from '@kitware/vtk.js/Filters/General/Calculator';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkPlaneSource from '@kitware/vtk.js/Filters/Sources/PlaneSource';
import vtkSphereMapper from '@kitware/vtk.js/Rendering/Core/SphereMapper';

import { AttributeTypes } from '@kitware/vtk.js/Common/DataModel/DataSetAttributes/Constants';
import {
  FieldDataTypes,
  FieldAssociations,
} from '@kitware/vtk.js/Common/DataModel/DataSet/Constants';

import { throttle } from '@kitware/vtk.js/macros';

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

const planeSource = vtkPlaneSource.newInstance();
const simpleFilter = vtkCalculator.newInstance();
const mapper = vtkSphereMapper.newInstance();
const actor = vtkActor.newInstance();

simpleFilter.setFormula({
  getArrays: (inputDataSets) => ({
    input: [{ location: FieldDataTypes.COORDINATE }], // Require point coordinates as input
    output: [
      // Generate two output arrays:
      {
        location: FieldDataTypes.POINT, // This array will be point-data ...
        name: 'pressure', // ... with the given name ...
        dataType: 'Float32Array', // ... of this type ...
        numberOfComponents: 1, // ... with this many components ...
      },
      {
        location: FieldDataTypes.POINT, // This array will be field data ...
        name: 'temperature', // ... with the given name ...
        dataType: 'Float32Array', // ... of this type ...
        attribute: AttributeTypes.SCALARS, // ... and will be marked as the default scalars.
        numberOfComponents: 1, // ... with this many components ...
      },
    ],
  }),
  evaluate: (arraysIn, arraysOut) => {
    // Convert in the input arrays of vtkDataArrays into variables
    // referencing the underlying JavaScript typed-data arrays:
    const [coords] = arraysIn.map((d) => d.getData());
    const [press, temp] = arraysOut.map((d) => d.getData());

    // Since we are passed coords as a 3-component array,
    // loop over all the points and compute the point-data output:
    for (let i = 0, sz = coords.length / 3; i < sz; ++i) {
      press[i] =
        ((coords[3 * i] - 0.5) * (coords[3 * i] - 0.5) +
          (coords[3 * i + 1] - 0.5) * (coords[3 * i + 1] - 0.5) +
          0.125) *
        0.1;
      temp[i] = coords[3 * i + 1];
    }
    // Mark the output vtkDataArray as modified
    arraysOut.forEach((x) => x.modified());
  },
});

// The generated 'temperature' array will become the default scalars, so the plane mapper will color by 'temperature':
simpleFilter.setInputConnection(planeSource.getOutputPort());

mapper.setInputConnection(simpleFilter.getOutputPort());
mapper.setScaleArray('pressure');

actor.setMapper(mapper);

renderer.addActor(actor);
renderer.resetCamera();
renderWindow.render();

const interactor = renderWindow.getInteractor();
const apiSpecificRenderWindow = interactor.getView();
const hwSelector = apiSpecificRenderWindow.getSelector();
hwSelector.setCaptureZValues(true);
hwSelector.setFieldAssociation(FieldAssociations.FIELD_ASSOCIATION_CELLS);

function eventToWindowXY(event) {
  // We know we are full screen => window.innerXXX
  // Otherwise we can use pixel device ratio or else...
  const { clientX, clientY } = event;
  const [width, height] = apiSpecificRenderWindow.getSize();
  const x = Math.round((width * clientX) / window.innerWidth);
  const y = Math.round(height * (1 - clientY / window.innerHeight)); // Need to flip Y
  return [x, y];
}

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

fullScreenRenderer.addController(controlPanel);
const attributeIdDiv = document.querySelector('#attributeID');

function pickOnMouseEvent(event) {
  if (interactor.isAnimating()) {
    // We should not do picking when interacting with the scene
    return;
  }
  const [x, y] = eventToWindowXY(event);

  hwSelector.getSourceDataAsync(renderer, x, y, x, y).then((result) => {
    const selections = result?.generateSelection(x, y, x, y);
    if (selections && selections.length >= 1) {
      const selection = selections[0];
      const props = selection.get().properties;
      attributeIdDiv.textContent = props.attributeID;
    } else {
      attributeIdDiv.textContent = '';
    }
  });
}

document.addEventListener('mousemove', throttle(pickOnMouseEvent, 20));

['xResolution', 'yResolution'].forEach((propertyName) => {
  document.querySelector(`.${propertyName}`).addEventListener('input', (e) => {
    const value = Number(e.target.value);
    planeSource.set({ [propertyName]: value });
    renderWindow.render();
  });
});

document.querySelector('.scaleFactor').addEventListener('input', (e) => {
  const value = Number(e.target.value);
  mapper.setScaleFactor(value);
  renderWindow.render();
});

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.planeSource = planeSource;
global.mapper = mapper;
global.actor = actor;
global.renderer = renderer;
global.renderWindow = renderWindow;
