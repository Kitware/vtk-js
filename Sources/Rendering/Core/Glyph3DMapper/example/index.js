import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import '@kitware/vtk.js/Rendering/Profiles/Glyph'; // vtkGlyph3DMapper

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkCalculator from '@kitware/vtk.js/Filters/General/Calculator';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkPlaneSource from '@kitware/vtk.js/Filters/Sources/PlaneSource';
import vtkConeSource from '@kitware/vtk.js/Filters/Sources/ConeSource';
import vtkGlyph3DMapper from '@kitware/vtk.js/Rendering/Core/Glyph3DMapper';
import vtkTransform from '@kitware/vtk.js/Common/Transform/Transform';

import { AttributeTypes } from '@kitware/vtk.js/Common/DataModel/DataSetAttributes/Constants';
import { FieldDataTypes } from '@kitware/vtk.js/Common/DataModel/DataSet/Constants';

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
const mapper = vtkGlyph3DMapper.newInstance();
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
        numberOfComponents: 3, // ... with this many components ...
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
      press[i * 3] = (coords[3 * i] - 0.5) * (coords[3 * i] - 0.5);
      press[i * 3 + 1] =
        ((coords[3 * i + 1] - 0.5) * (coords[3 * i + 1] - 0.5) + 0.125) * 0.1;
      press[i * 3 + 2] =
        ((coords[3 * i] - 0.5) * (coords[3 * i] - 0.5) +
          (coords[3 * i + 1] - 0.5) * (coords[3 * i + 1] - 0.5) +
          0.125) *
        0.1;
      temp[i] = coords[3 * i + 1] * 0.1;
    }

    // Mark the output vtkDataArray as modified
    arraysOut.forEach((x) => x.modified());
  },
});

// The generated 'temperature' array will become the default scalars, so the plane mapper will color by 'temperature':
simpleFilter.setInputConnection(planeSource.getOutputPort());

mapper.setInputConnection(simpleFilter.getOutputPort(), 0);

const coneSource = vtkConeSource.newInstance();
coneSource.setResolution(12);
mapper.setInputConnection(coneSource.getOutputPort(), 1);
mapper.setOrientationArray('pressure');
mapper.setScalarRange(0.0, 0.1);

actor.setMapper(mapper);

const transform = vtkTransform.newInstance();
transform.scale(1, 2, 1);

renderer.addActor(actor);
renderer.resetCamera();
renderer.getActiveCamera().setModelTransformMatrix(transform.getMatrix());
renderWindow.render();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

fullScreenRenderer.addController(controlPanel);
['xResolution', 'yResolution'].forEach((propertyName) => {
  document.querySelector(`.${propertyName}`).addEventListener('input', (e) => {
    const value = Number(e.target.value);
    planeSource.set({ [propertyName]: value });
    renderWindow.render();
  });
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
