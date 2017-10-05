import vtkColorTransferFunction   from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkFullScreenRenderWindow  from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkHttpDataSetReader       from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkPiecewiseFunction       from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkPiecewiseFunctionWidget from 'vtk.js/Sources/Interaction/Widgets/PiecewiseFunctionWidget';
import vtkVolume                  from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper            from 'vtk.js/Sources/Rendering/Core/VolumeMapper';

import presets from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps.json';

function getPreset(name) {
  return presets.find(p => p.Name === name);
}

const presetName = 'Black-Body Radiation';
const preset = getPreset(presetName);

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

const widget = vtkPiecewiseFunctionWidget.newInstance({ numberOfBins: 256, size: [400, 150] });

const lookupTable = vtkColorTransferFunction.newInstance();
const piecewiseFunction = vtkPiecewiseFunction.newInstance();

const actor = vtkVolume.newInstance();
const mapper = vtkVolumeMapper.newInstance({ sampleDistance: 1.1 });
const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });

reader.setUrl(`${__BASE_PATH__}/data/volume/LIDC2.vti`).then(() => {
  reader.loadData().then(() => {
    const imageData = reader.getOutputData();
    const dataArray = imageData.getPointData().getScalars();
    const dataRange = dataArray.getRange();

    lookupTable.applyColorMap(preset);
    lookupTable.setMappingRange(...dataRange);
    lookupTable.updateRange();

    widget.setDataArray(dataArray.getData());
    widget.applyOpacity(piecewiseFunction);

    renderer.addVolume(actor);
    renderWindow.getInteractor().setDesiredUpdateRate(15.0);
    resetCamera();
    // renderer.getActiveCamera().zoom(1.5);
    renderer.getActiveCamera().elevation(70);
    render();
  });
});

actor.setMapper(mapper);
mapper.setInputConnection(reader.getOutputPort());

actor.getProperty().setRGBTransferFunction(0, lookupTable);
actor.getProperty().setScalarOpacity(0, piecewiseFunction);

// Create Widget container
const body = document.querySelector('body');
const container = document.createElement('div');
container.style.position = 'absolute';
container.style.top = '5px';
container.style.left = '0';

body.appendChild(container);

// ----------------------------------------------------------------------------
// Default setting Piecewise function widget
// ----------------------------------------------------------------------------

widget.addGaussian(0.5, 0.5, 0.2, 0, 0);
widget.addGaussian(0.75, 1, 0.3, 0, 0);

widget.setContainer(container);
widget.bindMouseListeners();

widget.onOpacityChange(() => {
  widget.applyOpacity(piecewiseFunction);
  render();
});
