import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Volume';

// Force DataAccessHelper to have access to various data source
import 'vtk.js/Sources/IO/Core/DataAccessHelper/HtmlDataAccessHelper';
import 'vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import 'vtk.js/Sources/IO/Core/DataAccessHelper/JSZipDataAccessHelper';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';
import controlPanel from './controller.html';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0.3, 0.3, 0.3],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

fullScreenRenderer.addController(controlPanel);

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------
// Server is not sending the .gz and with the compress header
// Need to fetch the true file name and uncompress it locally
// ----------------------------------------------------------------------------

const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });

const actor = vtkVolume.newInstance();
const mapper = vtkVolumeMapper.newInstance();
mapper.setSampleDistance(1.3);
mapper.setPreferSizeOverAccuracy(true);
actor.setMapper(mapper);

// create color and opacity transfer functions
const ofun = vtkPiecewiseFunction.newInstance();
ofun.addPoint(-3024, 0.1);
ofun.addPoint(-637.62, 0.1);
ofun.addPoint(700, 0.5);
ofun.addPoint(3071, 0.9);

const ctfun = vtkColorTransferFunction.newInstance();
ctfun.addRGBPoint(-3024, 0, 0, 0);
ctfun.addRGBPoint(-637.62, 0, 0, 0);
ctfun.addRGBPoint(700, 1, 1, 1);
ctfun.addRGBPoint(3071, 1, 1, 1);

actor.getProperty().setRGBTransferFunction(0, ctfun);
actor.getProperty().setScalarOpacity(0, ofun);
actor.getProperty().setScalarOpacityUnitDistance(0, 3.0);
actor.getProperty().setInterpolationTypeToLinear();
actor.getProperty().setShade(true);
actor.getProperty().setAmbient(0.1);
actor.getProperty().setDiffuse(0.9);
actor.getProperty().setSpecular(0.2);
actor.getProperty().setSpecularPower(10.0);

mapper.setInputConnection(reader.getOutputPort());

function updateBlendMode(event) {
  const blendMode = parseInt(event.target.value, 10);
  const ipScalarEls = document.querySelectorAll('.ipScalar');

  mapper.setBlendMode(blendMode);
  mapper.setIpScalarRange(0.0, 1.0);

  // if average or additive blend mode
  if (blendMode === 3 || blendMode === 4) {
    // Show scalar ui
    for (let i = 0; i < ipScalarEls.length; i += 1) {
      const el = ipScalarEls[i];
      el.style.display = 'table-row';
    }
  } else {
    // Hide scalar ui
    for (let i = 0; i < ipScalarEls.length; i += 1) {
      const el = ipScalarEls[i];
      el.style.display = 'none';
    }
  }

  renderWindow.render();
}

function updateScalarMin(event) {
  mapper.setIpScalarRange(event.target.value, mapper.getIpScalarRange()[1]);
  renderWindow.render();
}

function updateScalarMax(event) {
  mapper.setIpScalarRange(mapper.getIpScalarRange()[0], event.target.value);
  renderWindow.render();
}

reader.setUrl(`${__BASE_PATH__}/data/volume/headsq.vti`).then(() => {
  reader.loadData().then(() => {
    renderer.addVolume(actor);
    const interactor = renderWindow.getInteractor();
    interactor.setDesiredUpdateRate(15.0);
    renderer.resetCamera();
    renderer.getActiveCamera().elevation(-70);
    renderWindow.render();

    const el = document.querySelector('.blendMode');
    el.addEventListener('change', updateBlendMode);
    const scalarMinEl = document.querySelector('.scalarMin');
    scalarMinEl.addEventListener('input', updateScalarMin);
    const scalarMaxEl = document.querySelector('.scalarMax');
    scalarMaxEl.addEventListener('input', updateScalarMax);
  });
});

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.source = reader;
global.mapper = mapper;
global.actor = actor;
global.ofun = ofun;
global.renderer = renderer;
global.renderWindow = renderWindow;
