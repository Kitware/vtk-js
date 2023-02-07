import '@kitware/vtk.js/favicon';
import * as d3 from 'd3-scale';
import { formatDefaultLocale } from 'd3-format';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkConeSource from '@kitware/vtk.js/Filters/Sources/ConeSource';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkScalarBarActor from '@kitware/vtk.js/Rendering/Core/ScalarBarActor';
import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';
import vtkLookupTable from '@kitware/vtk.js/Common/Core/LookupTable';
import vtkDataArray from '@kitware/vtk.js/Common/Core/DataArray';
import controlPanel from './controlPanel.html';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();
fullScreenRenderer.addController(controlPanel);

// ----------------------------------------------------------------------------
// Add a cube source
// ----------------------------------------------------------------------------
const cone = vtkConeSource.newInstance();
cone.update();
const npts = cone.getOutputData().getPoints().getNumberOfPoints();
const scalars = vtkDataArray.newInstance({ size: npts });
for (let i = 0; i < npts; ++i) {
  scalars.setTuple(i, [i / npts]);
}
cone.getOutputData().getPointData().setScalars(scalars);

const mapper = vtkMapper.newInstance();
mapper.setInputData(cone.getOutputData());
let lut = mapper.getLookupTable();

const actor = vtkActor.newInstance();
actor.setMapper(mapper);

renderer.addActor(actor);
renderer.resetCamera();
renderWindow.render();

const scalarBarActor = vtkScalarBarActor.newInstance();
renderer.addActor(scalarBarActor);
scalarBarActor.setScalarsToColors(lut);

// Change the number of ticks (TODO: add numberOfTicks to ScalarBarActor)
function generateTicks(numberOfTicks) {
  return (helper) => {
    const lastTickBounds = helper.getLastTickBounds();
    // compute tick marks for axes
    const scale = d3
      .scaleLinear()
      .domain([0.0, 1.0])
      .range([lastTickBounds[0], lastTickBounds[1]]);
    const samples = scale.ticks(numberOfTicks);
    const ticks = samples.map((tick) => scale(tick));
    // Replace minus "\u2212" with hyphen-minus "\u002D" so that parseFloat() works
    formatDefaultLocale({ minus: '\u002D' });
    const format = scale.tickFormat(
      ticks[0],
      ticks[ticks.length - 1],
      numberOfTicks
    );
    const tickStrings = ticks
      .map(format)
      .map((tick) => Number(parseFloat(tick).toPrecision(12)).toPrecision()); // d3 sometimes adds unwanted whitespace
    helper.setTicks(ticks);
    helper.setTickStrings(tickStrings);
  };
}
scalarBarActor.setGenerateTicks(generateTicks(10));

const minInput = document.querySelector('#min');
const onMinChanged = () => {
  lut.setRange(parseFloat(minInput.value), lut.getRange()[1]);
  renderWindow.render();
};
minInput.addEventListener('input', onMinChanged);
onMinChanged();

const maxInput = document.querySelector('#max');
const onMaxChanged = () => {
  lut.setRange(lut.getRange()[0], parseFloat(maxInput.value));
  renderWindow.render();
};
maxInput.addEventListener('input', onMaxChanged);
onMaxChanged();

document.querySelector('#automated').addEventListener('change', (event) => {
  scalarBarActor.setAutomated(event.target.checked);
  renderWindow.render();
});
document.querySelector('#axisLabel').addEventListener('change', (event) => {
  scalarBarActor.setAxisLabel(event.target.value);
  renderWindow.render();
});
document
  .querySelector('#drawNanAnnotation')
  .addEventListener('change', (event) => {
    scalarBarActor.setDrawNanAnnotation(event.target.checked);
    renderWindow.render();
  });
document
  .querySelector('#drawBelowRangeSwatch')
  .addEventListener('change', (event) => {
    scalarBarActor.setDrawBelowRangeSwatch(event.target.checked);
    renderWindow.render();
  });
document
  .querySelector('#drawAboveRangeSwatch')
  .addEventListener('change', (event) => {
    scalarBarActor.setDrawAboveRangeSwatch(event.target.checked);
    renderWindow.render();
  });
document
  .querySelector('#interpolateScalars')
  .addEventListener('change', (event) => {
    mapper.setInterpolateScalarsBeforeMapping(event.target.checked);
    renderWindow.render();
  });

document
  .querySelector('#useColorTransferFunction')
  .addEventListener('change', (event) => {
    if (event.target.checked) {
      const discretize = document.querySelector('#discretize').checked;
      const numberOfValues = parseInt(
        document.querySelector('#numberOfColors').value,
        10
      );
      const ctf = vtkColorTransferFunction.newInstance({
        discretize,
        numberOfValues,
      });
      ctf.addRGBPoint(1.0, 0.0, 1.0, 0.0);
      ctf.addRGBPoint(0.0, 0.0, 0.0, 1.0);
      mapper.setLookupTable(ctf);
    } else {
      const numberOfColors = parseInt(
        document.querySelector('#numberOfColors').value,
        10
      );
      mapper.setLookupTable(vtkLookupTable.newInstance({ numberOfColors }));
    }
    lut = mapper.getLookupTable();
    scalarBarActor.setScalarsToColors(lut);
    renderWindow.render();
  });
document.querySelector('#discretize').addEventListener('change', (event) => {
  if (lut.isA('vtkColorTransferFunction')) {
    lut.setDiscretize(event.target.checked);
    renderWindow.render();
  }
});
document
  .querySelector('#numberOfColors')
  .addEventListener('change', (event) => {
    if (lut.isA('vtkLookupTable')) {
      lut.setNumberOfColors(parseInt(event.target.value, 10));
      lut.modified();
      lut.build();
    } else {
      lut.setNumberOfValues(parseInt(event.target.value, 10));
    }
    lut.modified();
    scalarBarActor.setScalarsToColors(lut);
    scalarBarActor.modified();
    renderWindow.render();
  });
