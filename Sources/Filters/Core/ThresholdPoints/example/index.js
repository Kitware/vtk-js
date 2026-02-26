import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import '@kitware/vtk.js/Rendering/Profiles/Glyph';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkHttpDataSetReader from '@kitware/vtk.js/IO/Core/HttpDataSetReader';
import vtkLookupTable from '@kitware/vtk.js/Common/Core/LookupTable';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkThresholdPoints from '@kitware/vtk.js/Filters/Core/ThresholdPoints';
import vtkCalculator from '@kitware/vtk.js/Filters/General/Calculator';
import { FieldDataTypes } from '@kitware/vtk.js/Common/DataModel/DataSet/Constants';
import { AttributeTypes } from '@kitware/vtk.js/Common/DataModel/DataSetAttributes/Constants';
import vtkScalarBarActor from '@kitware/vtk.js/Rendering/Core/ScalarBarActor';

import GUI from 'lil-gui';

const { ColorMode, ScalarMode } = vtkMapper;

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0.9, 0.9, 0.9],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

const lookupTable = vtkLookupTable.newInstance({ hueRange: [0.666, 0] });

const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });

const calc = vtkCalculator.newInstance();
calc.setInputConnection(reader.getOutputPort());
calc.setFormula({
  getArrays: (inputDataSets) => ({
    input: [{ location: FieldDataTypes.COORDINATE }], // Require point coordinates as input
    output: [
      // Generate two output arrays:
      {
        location: FieldDataTypes.POINT, // This array will be point-data ...
        name: 'sine wave', // ... with the given name ...
        dataType: 'Float64Array', // ... of this type ...
        attribute: AttributeTypes.SCALARS, // ... and will be marked as the default scalars.
      },
      {
        location: FieldDataTypes.UNIFORM, // This array will be field data ...
        name: 'global', // ... with the given name ...
        dataType: 'Float32Array', // ... of this type ...
        numberOfComponents: 1, // ... with this many components ...
        tuples: 1, // ... and this many tuples.
      },
    ],
  }),
  evaluate: (arraysIn, arraysOut) => {
    // Convert in the input arrays of vtkDataArrays into variables
    // referencing the underlying JavaScript typed-data arrays:
    const [coords] = arraysIn.map((d) => d.getData());
    const [sine, glob] = arraysOut.map((d) => d.getData());

    // Since we are passed coords as a 3-component array,
    // loop over all the points and compute the point-data output:
    for (let i = 0, sz = coords.length / 3; i < sz; ++i) {
      const dx = coords[3 * i] - 0.5;
      const dy = coords[3 * i + 1] - 0.5;
      sine[i] = 10 * dx * dx + dy * dy;
    }
    // Use JavaScript's reduce method to sum the output
    // point-data array and set the uniform array's value:
    glob[0] = sine.reduce((result, value) => result + value, 0);
    // Mark the output vtkDataArray as modified
    arraysOut.forEach((x) => x.modified());
  },
});

const mapper = vtkMapper.newInstance({
  interpolateScalarsBeforeMapping: true,
  colorMode: ColorMode.DEFAULT,
  scalarMode: ScalarMode.DEFAULT,
  useLookupTableScalarRange: true,
  lookupTable,
});
const actor = vtkActor.newInstance();
actor.getProperty().setEdgeVisibility(true);

const scalarBarActor = vtkScalarBarActor.newInstance();
const defaultAutoLayout = scalarBarActor.getAutoLayout();
scalarBarActor.setAutoLayout((helper) => {
  defaultAutoLayout({
    ...helper,
    recomputeBarSegments: (textSizes) => {
      helper.getBoxSizeByReference()[1] = 1;
      helper.recomputeBarSegments(textSizes);
    },
  });
});
scalarBarActor.setScalarsToColors(lookupTable);
renderer.addActor(scalarBarActor);

const thresholder = vtkThresholdPoints.newInstance();
thresholder.setInputConnection(calc.getOutputPort());

mapper.setInputConnection(thresholder.getOutputPort());
actor.setMapper(mapper);
renderer.addActor(actor);

// ----------------------------------------------------------------------------
// UI control handling
// ----------------------------------------------------------------------------

const gui = new GUI();
const params = {
  thresholdArray: 'sine wave',
  thresholdOperation: 'Above',
  thresholdValue: 30,
};
function updateCriterias(arrayName, operation, value) {
  thresholder.setCriterias([
    {
      arrayName,
      fieldAssociation: arrayName === 'sine wave' ? 'PointData' : 'Points',
      operation,
      value: Number(value),
    },
  ]);
}
function onCriteriaChanged(event) {
  updateCriterias(
    params.thresholdArray,
    params.thresholdOperation,
    params.thresholdValue
  );
  if (event != null) {
    renderWindow.render();
  }
}
function onArrayChanged(event) {
  if (params.thresholdArray === 'x' || params.thresholdArray === 'y') {
    params.thresholdValue = 0;
  } else if (params.thresholdArray === 'z') {
    params.thresholdValue = 0;
  } else {
    params.thresholdValue = 30;
  }
  onCriteriaChanged(event);
}

gui
  .add(params, 'thresholdArray', ['sine wave', 'x', 'y', 'z'])
  .name('Array')
  .onChange((value) => {
    params.thresholdArray = value;
    onArrayChanged(true);
  });

gui
  .add(params, 'thresholdOperation', ['Above', 'Below'])
  .name('Operation')
  .onChange(() => onCriteriaChanged(true));

gui
  .add(params, 'thresholdValue')
  .name('Threshold value')
  .onChange(() => onCriteriaChanged(true));

reader.setUrl(`${__BASE_PATH__}/data/cow.vtp`).then(() => {
  reader.loadData().then(() => {
    renderer.resetCamera();
    onCriteriaChanged(true);
    renderWindow.render();
  });
});
// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.mapper = mapper;
global.actor = actor;
global.source = reader;
global.renderer = renderer;
global.renderWindow = renderWindow;
global.lookupTable = lookupTable;
global.thresholder = thresholder;
