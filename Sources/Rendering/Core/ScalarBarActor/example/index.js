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
import { Scale } from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction/Constants';
import vtkLookupTable from '@kitware/vtk.js/Common/Core/LookupTable';
import vtkAppendPolyData from '@kitware/vtk.js/Filters/General/AppendPolyData';
import vtkColorMaps from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction/ColorMaps';
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
// Add a cone sources: one for linear, one for log
// ----------------------------------------------------------------------------
const minInput = document.querySelector('#min');
const maxInput = document.querySelector('#max');

const linSteps = 40;
const linearCone = vtkConeSource.newInstance({ resolution: linSteps });
linearCone.update();
const npts = linearCone.getOutputData().getPoints().getNumberOfPoints();

const minValue = 0.1;
const maxValue = 1000;
minInput.value = minValue;
maxInput.value = maxValue;

// Linearly spaced points
const linStep = (maxValue - minValue) / (linSteps - 1);
const scalars = vtkDataArray.newInstance({ size: npts });
for (let i = 0; i < npts; ++i) {
  scalars.setTuple(i, [minValue + (i - 1) * linStep]);
}
scalars.setTuple(0, [undefined]);

linearCone.getOutputData().getPointData().setScalars(scalars);

const logSteps = 40;
const logCone = vtkConeSource.newInstance({
  resolution: logSteps,
  direction: [-1.0, 0.0, 0.0],
  center: [-1.0, 0.0, 0.0],
  height: 0.5,
});
logCone.update();
const nptsLog = logCone.getOutputData().getPoints().getNumberOfPoints();

// Define the output range
const minOutput = Math.log10(minValue || 0.0001);
const maxOutput = Math.log10(maxValue);

const powersCounts = maxOutput - minOutput + 1;

const scalarsLog = vtkDataArray.newInstance({ size: nptsLog });
const stepDivisor = nptsLog / powersCounts;
for (let i = 0; i < nptsLog; ++i) {
  // Logarithmically spaced points
  const power = minOutput + Math.floor(i / stepDivisor);
  scalarsLog.setTuple(i, [10 ** power]);
}
// Point 0 is at the top of the cone, make it undefined
scalarsLog.setTuple(0, [undefined]);
logCone.getOutputData().getPointData().setScalars(scalarsLog);

const appendPolyData = vtkAppendPolyData.newInstance();
appendPolyData.setInputConnection(linearCone.getOutputPort());
appendPolyData.addInputConnection(logCone.getOutputPort());

const mapper = vtkMapper.newInstance();
mapper.setInputData(appendPolyData.getOutputData());

let lut = mapper.getLookupTable();

const actor = vtkActor.newInstance();
actor.getProperty().setAmbient(0.6);
actor.getProperty().setDiffuse(0.4);
actor.setMapper(mapper);
renderer.addActor(actor);
renderer.resetCamera();
renderWindow.render();

const scalarBarActor = vtkScalarBarActor.newInstance();

renderer.addActor(scalarBarActor);
scalarBarActor.setScalarsToColors(lut);

// Change the number of ticks (TODO: add numberOfTicks to ScalarBarActor)
function generateTicks(numberOfTicks, useLogScale = false) {
  return (helper) => {
    const lastTickBounds = helper.getLastTickBounds();
    // compute tick marks for axes
    const scale = useLogScale ? d3.scaleLog() : d3.scaleLinear();
    scale.domain([lastTickBounds[0], lastTickBounds[1]]).range([0, 1]);

    const ticks = scale.ticks(numberOfTicks);
    const tickPositions = ticks.map((tick) => scale(tick));

    // Replace minus "\u2212" with hyphen-minus "\u002D" so that parseFloat() works
    formatDefaultLocale({ minus: '\u002D' });
    const format = scale.tickFormat(ticks[0], ticks[ticks.length - 1]);
    const tickStrings = ticks.map(format).map((tick) => {
      if (tick === '') {
        return '';
      }
      return Number(parseFloat(tick).toPrecision(12)).toPrecision();
    }); // d3 sometimes adds unwanted whitespace

    helper.setTicks(ticks);
    helper.setTickStrings(tickStrings);
    helper.setTickPositions(tickPositions);
  };
}

scalarBarActor.setGenerateTicks(generateTicks(10, false));

const logInput = document.querySelector('#log');
const updateMinInputColor = () => {
  minInput.style.color =
    logInput.checked && parseFloat(minInput.value) === 0 ? 'red' : null;
};

const onMinChanged = () => {
  mapper.setUseLookupTableScalarRange(true);
  lut.setRange(parseFloat(minInput.value), lut.getRange()[1]);
  updateMinInputColor();
  renderWindow.render();
};
minInput.addEventListener('input', onMinChanged);
onMinChanged();

const onMaxChanged = () => {
  mapper.setUseLookupTableScalarRange(true);
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

const useColorTransferFunctionInput = document.querySelector(
  '#useColorTransferFunction'
);

function updateScalarBarActor() {
  const useColorTransferFunction = useColorTransferFunctionInput.checked;

  const discretizeInput = document.querySelector('#discretize');
  discretizeInput.disabled = !useColorTransferFunction;
  logInput.disabled = !useColorTransferFunction;
  const numberOfColorsInput = document.querySelector('#numberOfColors');
  const numberOfColors = parseInt(numberOfColorsInput.value, 10);

  const scale = logInput.checked ? Scale.LOG10 : Scale.LINEAR;
  if (useColorTransferFunction) {
    const discretize = discretizeInput.checked;
    console.log(
      `Create colorTransferFunction with, scale: ${scale}, discretize: ${discretize}, numberOfColors: ${numberOfColors}`
    );
    const ctf = vtkColorTransferFunction.newInstance({
      discretize,
      numberOfValues: numberOfColors,
      scale,
    });
    const preset = vtkColorMaps.getPresetByName('Rainbow Desaturated');
    ctf.applyColorMap(preset);
    // white (transparent) color for values below the range, is transparency working for scalarbar?
    ctf.setNanColor([1, 1, 1, 1]);

    mapper.setLookupTable(ctf);
  } else {
    mapper.setLookupTable(vtkLookupTable.newInstance({ numberOfColors }));
  }
  lut = mapper.getLookupTable();

  lut.setRange(parseFloat(minInput.value), parseFloat(maxInput.value));

  scalarBarActor.setScalarsToColors(lut);
  scalarBarActor.modified();
  renderWindow.render();
}

useColorTransferFunctionInput.addEventListener('change', () => {
  updateScalarBarActor();
});

document.querySelector('#discretize').addEventListener('change', (event) => {
  if (lut.isA('vtkColorTransferFunction')) {
    lut.setDiscretize(event.target.checked);
    renderWindow.render();
  }
});

logInput.addEventListener('change', (event) => {
  const useLog = event.target.checked;
  if (useLog && parseFloat(minInput.value) === 0) {
    minInput.value = minValue || 0.0001;
  }
  if (useLog && parseFloat(maxInput.value) < 1) {
    maxInput.value = maxValue;
  }

  scalarBarActor.setGenerateTicks(generateTicks(10, useLog));

  updateMinInputColor();
  updateScalarBarActor();
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
