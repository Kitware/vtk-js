import 'vtk.js/Sources/favicon';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
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
// Server is not sending the .gz and whith the compress header
// Need to fetch the true file name and uncompress it locally
// ----------------------------------------------------------------------------

const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });

const actor = vtkVolume.newInstance();
const mapper = vtkVolumeMapper.newInstance();
mapper.setSampleDistance(1.3);
actor.setMapper(mapper);

// create color and opacity transfer functions
const ofun = vtkPiecewiseFunction.newInstance();
ofun.addPoint(0.0, 0.0);
ofun.addPoint(5000, 0.3);
ofun.addPoint(30000, 1.0);

actor.getProperty().setScalarOpacity(0, ofun);
actor.getProperty().setScalarOpacityUnitDistance(0, 3.0);
actor.getProperty().setInterpolationTypeToLinear();
actor.getProperty().setShade(true);
actor.getProperty().setAmbient(0.2);
actor.getProperty().setDiffuse(0.7);
actor.getProperty().setSpecular(0.3);
actor.getProperty().setSpecularPower(8.0);

mapper.setInputConnection(reader.getOutputPort());

function updateBlendMode(event) {
  const blendMode = parseInt(event.target.value, 10);

  mapper.setBlendMode(blendMode);

  renderWindow.render();
}
reader
  .setUrl(`${__BASE_PATH__}/data/volume/QIN-HEADNECK-01-0024-PET-WB-0.vti`)
  .then(() => {
    reader.loadData().then(() => {
      renderer.addVolume(actor);
      const interactor = renderWindow.getInteractor();
      interactor.setDesiredUpdateRate(15.0);
      renderer.resetCamera();
      renderer.getActiveCamera().elevation(-70);
      renderWindow.render();

      const el = document.querySelector('.blendMode');
      el.addEventListener('change', updateBlendMode);
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
