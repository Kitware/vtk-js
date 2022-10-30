import 'vtk.js/Sources/favicon';
import * as d3 from 'd3-scale';
import { formatDefaultLocale } from 'd3-format';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Geometry';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkScalarBarActor from 'vtk.js/Sources/Rendering/Core/ScalarBarActor';
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
const mapper = vtkMapper.newInstance();
mapper.setInputData(cone.getOutputData());
const actor = vtkActor.newInstance();
actor.setMapper(mapper);
actor.getProperty().setColor(0.0, 0.0, 1.0);
actor.getProperty().setOpacity(0.5);

renderer.addActor(actor);
renderer.resetCamera();
renderWindow.render();

const scalarBarActor = vtkScalarBarActor.newInstance();
renderer.addActor(scalarBarActor);
const lut = mapper.getLookupTable();
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
