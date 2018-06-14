import 'vtk.js/Sources/favicon';

import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';
import vtkImageCropFilter from 'vtk.js/Sources/Filters/General/ImageCropFilter';

import controlPanel from './controlPanel.html';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

fullScreenRenderer.addController(controlPanel);

function setupControlPanel(data, cropFilter) {
  const axes = ['I', 'J', 'K'];
  const minmax = ['min', 'max'];

  const extent = data.getExtent();

  axes.forEach((ax, axi) => {
    minmax.forEach((m, mi) => {
      const el = document.querySelector(`.${ax}${m}`);
      el.setAttribute('min', extent[axi * 2]);
      el.setAttribute('max', extent[axi * 2 + 1]);
      el.setAttribute('value', extent[axi * 2 + mi]);

      el.addEventListener('input', () => {
        const planes = cropFilter.getCroppingPlanes().slice();
        planes[axi * 2 + mi] = Number(el.value);
        cropFilter.setCroppingPlanes(...planes);
        console.log(planes);
        renderWindow.render();
      });
    });
  });
}

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------
// Server is not sending the .gz and whith the compress header
// Need to fetch the true file name and uncompress it locally
// ----------------------------------------------------------------------------

// create filter
const cropFilter = vtkImageCropFilter.newInstance();

const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });

const actor = vtkVolume.newInstance();
const mapper = vtkVolumeMapper.newInstance();
mapper.setSampleDistance(1.1);
actor.setMapper(mapper);

// create color and opacity transfer functions
const ctfun = vtkColorTransferFunction.newInstance();
ctfun.addRGBPoint(0, 85 / 255.0, 0, 0);
ctfun.addRGBPoint(95, 1.0, 1.0, 1.0);
ctfun.addRGBPoint(225, 0.66, 0.66, 0.5);
ctfun.addRGBPoint(255, 0.3, 1.0, 0.5);
const ofun = vtkPiecewiseFunction.newInstance();
ofun.addPoint(0.0, 0.0);
ofun.addPoint(255.0, 1.0);
actor.getProperty().setRGBTransferFunction(0, ctfun);
actor.getProperty().setScalarOpacity(0, ofun);
actor.getProperty().setScalarOpacityUnitDistance(0, 3.0);
actor.getProperty().setInterpolationTypeToLinear();
actor.getProperty().setUseGradientOpacity(0, true);
actor.getProperty().setGradientOpacityMinimumValue(0, 2);
actor.getProperty().setGradientOpacityMinimumOpacity(0, 0.0);
actor.getProperty().setGradientOpacityMaximumValue(0, 20);
actor.getProperty().setGradientOpacityMaximumOpacity(0, 1.0);
actor.getProperty().setShade(true);
actor.getProperty().setAmbient(0.2);
actor.getProperty().setDiffuse(0.7);
actor.getProperty().setSpecular(0.3);
actor.getProperty().setSpecularPower(8.0);

cropFilter.setInputConnection(reader.getOutputPort());
mapper.setInputConnection(cropFilter.getOutputPort());

reader.setUrl(`${__BASE_PATH__}/data/volume/headsq.vti`).then(() => {
  reader.loadData().then(() => {
    renderer.addVolume(actor);

    const data = reader.getOutputData();
    cropFilter.setCroppingPlanes(...data.getExtent());

    setupControlPanel(data, cropFilter);

    const interactor = renderWindow.getInteractor();
    interactor.setDesiredUpdateRate(15.0);
    renderer.resetCamera();
    renderWindow.render();

    // Ensure the volume rendering is updated with gradient opacity lighting
    // effects after the gradients have finished computing.
    interactor.requestAnimation('lighting');
    mapper.onLightingActivated(() => {
      interactor.cancelAnimation('lighting');
    });
  });
});

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.source = reader;
global.mapper = mapper;
global.actor = actor;
global.ctfun = ctfun;
global.ofun = ofun;
global.renderer = renderer;
global.renderWindow = renderWindow;
global.cropFilter = cropFilter;
