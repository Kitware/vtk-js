import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Geometry';

import macro from 'vtk.js/Sources/macros';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkCalculator from 'vtk.js/Sources/Filters/General/Calculator';
import vtkDataSet from 'vtk.js/Sources/Common/DataModel/DataSet';
import vtkLookupTable from 'vtk.js/Sources/Common/Core/LookupTable';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkPlaneSource from 'vtk.js/Sources/Filters/Sources/PlaneSource';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkWarpScalar from 'vtk.js/Sources/Filters/General/WarpScalar';

import controlPanel from './controlPanel.html';

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

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0.9, 0.9, 0.9],
});
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

fullScreenRenderer.addController(controlPanel);

function updateScalarRange() {
  const min = Number(document.querySelector('.min').value);
  const max = Number(document.querySelector('.max').value);
  if (!Number.isNaN(min) && !Number.isNaN(max)) {
    lookupTable.setMappingRange(min, max);
    renderWindow.render();
  }
}

function applyFormula() {
  const el = document.querySelector('.formula');
  let fn = null;
  try {
    /* eslint-disable no-new-func */
    fn = new Function('x,y', `return ${el.value}`);
    /* eslint-enable no-new-func */
  } catch (exc) {
    if (!('name' in exc && exc.name === 'SyntaxError')) {
      vtkErrorMacro(`Unexpected exception ${exc}`);
      el.style.background = '#fbb';
      return;
    }
  }
  if (fn) {
    el.style.background = '#fff';
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
      document.querySelector('.min').value = min;
      document.querySelector('.max').value = max;
      lookupTable.setMappingRange(min, max);

      renderWindow.render();
      return;
    } catch (exc) {
      vtkErrorMacro(`Unexpected exception ${exc}`);
    }
  }
  el.style.background = '#ffb';
}

['xResolution', 'yResolution'].forEach((propertyName) => {
  document.querySelector(`.${propertyName}`).addEventListener('input', (e) => {
    const value = Number(e.target.value);
    planeSource.set({ [propertyName]: value });
    renderWindow.render();
  });
});

['scaleFactor'].forEach((propertyName) => {
  document.querySelector(`.${propertyName}`).addEventListener('input', (e) => {
    const value = Number(e.target.value);
    warpScalar.set({ [propertyName]: value });
    renderWindow.render();
  });
});

// Checkbox
document.querySelector('.visibility').addEventListener('change', (e) => {
  planeActor.setVisibility(!!e.target.checked);
  renderWindow.render();
});

document.querySelector('.formula').addEventListener('input', applyFormula);

['min', 'max'].forEach((selector) => {
  document
    .querySelector(`.${selector}`)
    .addEventListener('input', updateScalarRange);
});

document.querySelector('.next').addEventListener('click', (e) => {
  formulaIdx = (formulaIdx + 1) % FORMULA.length;
  document.querySelector('.formula').value = FORMULA[formulaIdx];
  applyFormula();
  renderWindow.render();
});

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
