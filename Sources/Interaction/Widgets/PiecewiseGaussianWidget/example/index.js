import vtkColorTransferFunction   from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkFullScreenRenderWindow  from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkHttpDataSetReader       from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkPiecewiseFunction       from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkPiecewiseGaussianWidget from 'vtk.js/Sources/Interaction/Widgets/PiecewiseGaussianWidget';
import vtkVolume                  from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper            from 'vtk.js/Sources/Rendering/Core/VolumeMapper';

import macro            from 'vtk.js/Sources/macro';

import presets from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps.json';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({ background: [0, 0, 0] });
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();
const render = renderWindow.render;
const resetCamera = renderer.resetCamera;

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

const body = document.querySelector('body');

// Create Widget container
const container = document.createElement('div');
container.style.position = 'absolute';
container.style.top = 'calc(10px + 1em)';
container.style.left = '5px';
container.style.background = 'rgba(255, 255, 255, 0.3)';
body.appendChild(container);

// Create Label for preset
const labelContainer = document.createElement('div');
labelContainer.style.position = 'absolute';
labelContainer.style.top = '5px';
labelContainer.style.left = '5px';
labelContainer.style.width = '400px';
labelContainer.style.color = 'white';
labelContainer.style.textAlign = 'center';
labelContainer.style.userSelect = 'none';
labelContainer.style.cursor = 'pointer';
body.appendChild(labelContainer);

let presetIndex = 1;
const globalDataRange = [0, 255];
const lookupTable = vtkColorTransferFunction.newInstance();

function changePreset(delta = 1) {
  presetIndex = (presetIndex + delta + presets.length) % presets.length;
  lookupTable.applyColorMap(presets[presetIndex]);
  lookupTable.setMappingRange(...globalDataRange);
  lookupTable.updateRange();
  labelContainer.innerHTML = presets[presetIndex].Name;
}

let intervalID = null;
function stopInterval() {
  if (intervalID !== null) {
    clearInterval(intervalID);
    intervalID = null;
  }
}

labelContainer.addEventListener('click', (event) => {
  if (event.pageX < 200) {
    stopInterval();
    changePreset(-1);
  } else {
    stopInterval();
    changePreset(1);
  }
});

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------


const widget = vtkPiecewiseGaussianWidget.newInstance({ numberOfBins: 256, size: [400, 150] });
widget.updateStyle({
  backgroundColor: 'rgba(255, 255, 255, 0.6)',
  histogramColor: 'rgba(100, 100, 100, 0.5)',
  strokeColor: 'rgb(0, 0, 0)',
  activeColor: 'rgb(255, 255, 255)',
  handleColor: 'rgb(50, 150, 50)',
  buttonDisableFillColor: 'rgba(255, 255, 255, 0.5)',
  buttonDisableStrokeColor: 'rgba(0, 0, 0, 0.5)',
  buttonStrokeColor: 'rgba(0, 0, 0, 1)',
  buttonFillColor: 'rgba(255, 255, 255, 1)',
  strokeWidth: 2,
  activeStrokeWidth: 3,
  buttonStrokeWidth: 1.5,
  handleWidth: 3,
  iconSize: 20, // Can be 0 if you want to remove buttons (dblClick for (+) / rightClick for (-))
  padding: 10,
});

const piecewiseFunction = vtkPiecewiseFunction.newInstance();

const actor = vtkVolume.newInstance();
const mapper = vtkVolumeMapper.newInstance({ sampleDistance: 1.1 });
const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });


reader.setUrl(`${__BASE_PATH__}/data/volume/LIDC2.vti`).then(() => {
  reader.loadData().then(() => {
    const imageData = reader.getOutputData();
    const dataArray = imageData.getPointData().getScalars();
    const dataRange = dataArray.getRange();
    globalDataRange[0] = dataRange[0];
    globalDataRange[1] = dataRange[1];

    // Update Lookup table
    changePreset();

    // Automatic switch to next preset every 5s
    intervalID = setInterval(changePreset, 5000);

    widget.setDataArray(dataArray.getData(), 1.5);
    widget.applyOpacity(piecewiseFunction);

    widget.setColorTransferFunction(lookupTable);
    lookupTable.onModified(() => {
      widget.render();
      render();
    });

    renderer.addVolume(actor);
    renderWindow.getInteractor().setDesiredUpdateRate(15.0);
    resetCamera();
    renderer.getActiveCamera().elevation(70);
    render();
  });
});

actor.setMapper(mapper);
mapper.setInputConnection(reader.getOutputPort());

actor.getProperty().setRGBTransferFunction(0, lookupTable);
actor.getProperty().setScalarOpacity(0, piecewiseFunction);
actor.getProperty().setInterpolationTypeToFastLinear();

// ----------------------------------------------------------------------------
// Default setting Piecewise function widget
// ----------------------------------------------------------------------------

widget.addGaussian(0.425, 0.5, 0.2, 0.3, 0.2);
widget.addGaussian(0.75, 1, 0.3, 0, 0);

widget.setContainer(container);
widget.bindMouseListeners();

widget.onOpacityChange(macro.debounce(() => {
  widget.applyOpacity(piecewiseFunction);
  render();
}), 1000);

// ----------------------------------------------------------------------------
// Expose variable to global namespace
// ----------------------------------------------------------------------------

global.widget = widget;
