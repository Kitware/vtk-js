import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import macro from '@kitware/vtk.js/macros';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkCalculator from '@kitware/vtk.js/Filters/General/Calculator';
import vtkDataSet from '@kitware/vtk.js/Common/DataModel/DataSet';
import vtkLookupTable from '@kitware/vtk.js/Common/Core/LookupTable';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkPlaneSource from '@kitware/vtk.js/Filters/Sources/PlaneSource';
import vtkPoints from '@kitware/vtk.js/Common/Core/Points';
import vtkPolyData from '@kitware/vtk.js/Common/DataModel/PolyData';
import vtkWarpScalar from '@kitware/vtk.js/Filters/General/WarpScalar';

import GUI from 'lil-gui';

const { ColorMode, ScalarMode } = vtkMapper;
const { FieldDataTypes } = vtkDataSet;
const { vtkErrorMacro } = macro;

let formulaIdx = 0;
const FORMULA = [
  '((x[0] - 0.5) * (x[0] - 0.5)) + ((x[1] - 0.5) * (x[1] - 0.5)) + 0.125',
  '0.25 * Math.sin(Math.sqrt(((x[0] - 0.5) * (x[0] - 0.5)) + ((x[1] - 0.5) * (x[1] - 0.5)))*50)',
];

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

const lookupTable = vtkLookupTable.newInstance({ hueRange: [0.666, 0] });

const planeSource = vtkPlaneSource.newInstance({
  xResolution: 25,
  yResolution: 25,
});
const planeMapper = vtkMapper.newInstance({
  interpolateScalarsBeforeMapping: true,
  colorMode: ColorMode.DEFAULT,
  scalarMode: ScalarMode.DEFAULT,
  useLookupTableScalarRange: true,
  lookupTable,
});
const planeActor = vtkActor.newInstance();
planeActor.getProperty().setEdgeVisibility(true);

const simpleFilter = vtkCalculator.newInstance();
simpleFilter.setFormulaSimple(
  FieldDataTypes.POINT, // Generate an output array defined over points.
  [], // We don't request any point-data arrays because point coordinates are made available by default.
  'z', // Name the output array "z"
  (x) => (x[0] - 0.5) * (x[0] - 0.5) + (x[1] - 0.5) * (x[1] - 0.5) + 0.125
); // Our formula for z

const warpScalar = vtkWarpScalar.newInstance();
const warpMapper = vtkMapper.newInstance({
  interpolateScalarsBeforeMapping: true,
  useLookupTableScalarRange: true,
  lookupTable,
});
const warpActor = vtkActor.newInstance();

// The generated 'z' array will become the default scalars, so the plane mapper will color by 'z':
simpleFilter.setInputConnection(planeSource.getOutputPort());

// We will also generate a surface whose points are displaced from the plane by 'z':
warpScalar.setInputConnection(simpleFilter.getOutputPort());
warpScalar.setInputArrayToProcess(0, 'z', 'PointData', 'Scalars');

planeMapper.setInputConnection(simpleFilter.getOutputPort());
planeActor.setMapper(planeMapper);

warpMapper.setInputConnection(warpScalar.getOutputPort());
warpActor.setMapper(warpMapper);

renderer.addActor(planeActor);
renderer.addActor(warpActor);

renderer.resetCamera();
renderWindow.render();

// ----------------------------------------------------------------------------
// UI control handling
// ----------------------------------------------------------------------------

const gui = new GUI();
const params = {
  xResolution: 50,
  yResolution: 50,
  scaleFactor: 1,
  planeVisible: true,
  formula: FORMULA[0],
  min: 0,
  max: 1,
};

function updateScalarRange() {
  const min = Number(params.min);
  const max = Number(params.max);
  if (!Number.isNaN(min) && !Number.isNaN(max)) {
    lookupTable.setMappingRange(min, max);
    renderWindow.render();
  }
}

function applyFormula() {
  const formulaStr = params.formula;
  let fn = null;
  try {
    /* eslint-disable no-new-func */
    fn = new Function('x,y', `return ${formulaStr}`);
    /* eslint-enable no-new-func */
  } catch (exc) {
    if (!('name' in exc && exc.name === 'SyntaxError')) {
      vtkErrorMacro(`Unexpected exception ${exc}`);
      return;
    }
  }
  if (fn) {
    const formulaObj = simpleFilter.createSimpleFormulaObject(
      FieldDataTypes.POINT,
      [],
      'z',
      fn
    );

    // See if the formula is actually valid by invoking "formulaObj" on
    // a dataset containing a single point.
    planeSource.update();
    const arraySpec = formulaObj.getArrays(planeSource.getOutputData());
    const testData = vtkPolyData.newInstance();
    const testPts = vtkPoints.newInstance({
      name: 'coords',
      numberOfComponents: 3,
      size: 3,
      values: [0, 0, 0],
    });
    testData.setPoints(testPts);
    const testOut = vtkPolyData.newInstance();
    testOut.shallowCopy(testData);
    const testArrays = simpleFilter.prepareArrays(arraySpec, testData, testOut);
    try {
      formulaObj.evaluate(testArrays.arraysIn, testArrays.arraysOut);

      // We evaluated 1 point without exception... it's safe to update the
      // filter and re-render.
      simpleFilter.setFormula(formulaObj);

      simpleFilter.update();

      // Update UI with new range
      const [min, max] = simpleFilter
        .getOutputData()
        .getPointData()
        .getScalars()
        .getRange();
      params.min = min;
      params.max = max;
      lookupTable.setMappingRange(min, max);

      renderWindow.render();
      return;
    } catch (exc) {
      vtkErrorMacro(`Unexpected exception ${exc}`);
    }
  }
}

gui
  .add(params, 'xResolution', 2, 100, 1)
  .name('X resolution')
  .onChange((value) => {
    planeSource.set({ xResolution: Number(value) });
    renderWindow.render();
  });

gui
  .add(params, 'yResolution', 2, 100, 1)
  .name('Y resolution')
  .onChange((value) => {
    planeSource.set({ yResolution: Number(value) });
    renderWindow.render();
  });

gui
  .add(params, 'scaleFactor', 0, 2, 0.1)
  .name('Displacement scale')
  .onChange((value) => {
    warpScalar.set({ scaleFactor: Number(value) });
    renderWindow.render();
  });

gui
  .add(params, 'planeVisible')
  .name('Plane visibility')
  .onChange((value) => {
    planeActor.setVisibility(!!value);
    renderWindow.render();
  });

gui
  .add(params, 'formula')
  .name('Formula')
  .onFinishChange(() => {
    applyFormula();
  });

const rangeFolder = gui.addFolder('Scalar range');
rangeFolder
  .add(params, 'min')
  .name('Min')
  .onFinishChange(() => updateScalarRange());
rangeFolder
  .add(params, 'max')
  .name('Max')
  .onFinishChange(() => updateScalarRange());

gui
  .add(
    {
      next: () => {
        formulaIdx = (formulaIdx + 1) % FORMULA.length;
        params.formula = FORMULA[formulaIdx];
        gui.controllers.forEach((c) => c.updateDisplay?.());
        applyFormula();
        renderWindow.render();
      },
    },
    'next'
  )
  .name('Next formula');

// Eecompute scalar range
applyFormula();

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.setLoggerFunction = macro.setLoggerFunction;
global.planeSource = planeSource;
global.planeMapper = planeMapper;
global.planeActor = planeActor;
global.simpleFilter = simpleFilter;
global.warpMapper = warpMapper;
global.warpActor = warpActor;
global.renderer = renderer;
global.renderWindow = renderWindow;
global.lookupTable = lookupTable;
