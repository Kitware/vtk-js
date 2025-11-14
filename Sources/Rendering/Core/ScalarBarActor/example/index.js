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
import GUI from 'lil-gui';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Add a cone sources: one for linear, one for log
// ----------------------------------------------------------------------------
const gui = new GUI();
const params = {
  min: 0.1,
  max: 1000,
  automated: true,
  axisLabel: 'Scalar Value',
  drawNanAnnotation: true,
  drawBelowRangeSwatch: true,
  drawAboveRangeSwatch: true,
  interpolateScalars: false,
  useColorTransferFunction: false,
  discretize: false,
  numberOfColors: 256,
  log: false,
};

const linSteps = 40;
const linearCone = vtkConeSource.newInstance({ resolution: linSteps });
linearCone.update();
const npts = linearCone.getOutputData().getPoints().getNumberOfPoints();

const minValue = 0.1;
const maxValue = 1000;
params.min = minValue;
params.max = maxValue;

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

const onMinChanged = () => {
  mapper.setUseLookupTableScalarRange(true);
  lut.setRange(parseFloat(params.min), lut.getRange()[1]);
  renderWindow.render();
};

const onMaxChanged = () => {
  mapper.setUseLookupTableScalarRange(true);
  lut.setRange(lut.getRange()[0], parseFloat(params.max));
  renderWindow.render();
};
onMinChanged();
onMaxChanged();

function updateScalarBarActor() {
  const useColorTransferFunction = params.useColorTransferFunction;
  const discretize = params.discretize;
  const numberOfColors = params.numberOfColors;

  const scale = params.log ? Scale.LOG10 : Scale.LINEAR;
  if (useColorTransferFunction) {
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

  lut.setRange(parseFloat(params.min), parseFloat(params.max));

  scalarBarActor.setScalarsToColors(lut);
  scalarBarActor.modified();
  renderWindow.render();
}

gui.add(params, 'min').name('Min').onFinishChange(onMinChanged);

gui.add(params, 'max').name('Max').onFinishChange(onMaxChanged);

gui
  .add(params, 'automated')
  .name('Automated')
  .onChange((value) => {
    scalarBarActor.setAutomated(value);
    renderWindow.render();
  });

gui
  .add(params, 'axisLabel')
  .name('Axis label')
  .onChange((value) => {
    scalarBarActor.setAxisLabel(value);
    renderWindow.render();
  });

gui
  .add(params, 'drawNanAnnotation')
  .name('Draw NaN annotation')
  .onChange((value) => {
    scalarBarActor.setDrawNanAnnotation(value);
    renderWindow.render();
  });

gui
  .add(params, 'drawBelowRangeSwatch')
  .name('Draw below swatch')
  .onChange((value) => {
    scalarBarActor.setDrawBelowRangeSwatch(value);
    renderWindow.render();
  });

gui
  .add(params, 'drawAboveRangeSwatch')
  .name('Draw above swatch')
  .onChange((value) => {
    scalarBarActor.setDrawAboveRangeSwatch(value);
    renderWindow.render();
  });

gui
  .add(params, 'interpolateScalars')
  .name('Interpolate scalars')
  .onChange((value) => {
    mapper.setInterpolateScalarsBeforeMapping(value);
    renderWindow.render();
  });

gui
  .add(params, 'useColorTransferFunction')
  .name('Use ColorTransferFunction')
  .onChange(updateScalarBarActor);

gui
  .add(params, 'discretize')
  .name('Discretize')
  .onChange((value) => {
    params.discretize = value;
    if (lut.isA('vtkColorTransferFunction')) {
      lut.setDiscretize(value);
      renderWindow.render();
    } else {
      updateScalarBarActor();
    }
  });

gui
  .add(params, 'numberOfColors', 1, 512, 1)
  .name('Number of colors')
  .onChange((value) => {
    params.numberOfColors = Number(value);
    updateScalarBarActor();
  });

gui
  .add(params, 'log')
  .name('Log')
  .onChange((useLog) => {
    scalarBarActor.setGenerateTicks(generateTicks(10, useLog));
    updateScalarBarActor();
  });
