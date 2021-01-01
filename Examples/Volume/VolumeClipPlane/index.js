import 'vtk.js/Sources/favicon';

import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';
import vtkMatrixBuilder from 'vtk.js/Sources/Common/Core/MatrixBuilder';
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

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------
// Server is not sending the .gz and with the compress header
// Need to fetch the true file name and uncompress it locally
// ----------------------------------------------------------------------------

const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });

const actor = vtkVolume.newInstance();
const mapper = vtkVolumeMapper.newInstance();
mapper.setSampleDistance(1.1);
actor.setMapper(mapper);

const clipPlane1 = vtkPlane.newInstance();
const clipPlane2 = vtkPlane.newInstance();
let clipPlane1Position = 0;
let clipPlane2Position = 0;
let clipPlane1RotationAngle = 0;
let clipPlane2RotationAngle = 0;
const clipPlane1Normal = [-1, 1, -1];
const clipPlane2Normal = [1, 0, 0];
const rotationNormal = [0, 0, 1];

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

mapper.setInputConnection(reader.getOutputPort());

reader.setUrl(`${__BASE_PATH__}/data/volume/headsq.vti`).then(() => {
  reader.loadData().then(() => {
    const data = reader.getOutputData();
    const extent = data.getExtent();
    const spacing = data.getSpacing();
    const size = extent[1] * spacing[0];

    clipPlane1Position = 0;
    clipPlane2Position = size / 2;
    const clipPlane1Origin = [
      clipPlane1Position,
      clipPlane1Position,
      clipPlane1Position,
    ];
    const clipPlane2Origin = [
      clipPlane2Position,
      clipPlane2Position,
      clipPlane2Position,
    ];

    clipPlane1.setNormal(clipPlane1Normal);
    clipPlane1.setOrigin(clipPlane1Origin);
    clipPlane2.setNormal(clipPlane2Normal);
    clipPlane2.setOrigin(clipPlane2Origin);
    mapper.addClippingPlane(clipPlane1);
    mapper.addClippingPlane(clipPlane2);

    renderer.addVolume(actor);
    const interactor = renderWindow.getInteractor();
    interactor.setDesiredUpdateRate(15.0);
    renderer.resetCamera();
    renderer.getActiveCamera().elevation(70);
    renderWindow.render();

    let el = document.querySelector('.plane1Position');
    el.setAttribute('min', -size);
    el.setAttribute('max', size);
    el.setAttribute('value', clipPlane1Position);

    el = document.querySelector('.plane2Position');
    el.setAttribute('min', -size);
    el.setAttribute('max', size);
    el.setAttribute('value', clipPlane2Position);

    el = document.querySelector('.plane1Rotation');
    el.setAttribute('min', 0);
    el.setAttribute('max', 180);
    el.setAttribute('value', clipPlane1RotationAngle);

    el = document.querySelector('.plane2Rotation');
    el.setAttribute('min', 0);
    el.setAttribute('max', 180);
    el.setAttribute('value', clipPlane2RotationAngle);
  });
});

document.querySelector('.plane1Position').addEventListener('input', (e) => {
  clipPlane1Position = Number(e.target.value);
  clipPlane1.setOrigin([
    clipPlane1Position,
    clipPlane1Position,
    clipPlane1Position,
  ]);
  renderWindow.render();
});

document.querySelector('.plane1Rotation').addEventListener('input', (e) => {
  const changedDegree = Number(e.target.value) - clipPlane1RotationAngle;
  clipPlane1RotationAngle = Number(e.target.value);
  vtkMatrixBuilder
    .buildFromDegree()
    .rotate(changedDegree, rotationNormal)
    .apply(clipPlane1Normal);
  clipPlane1.setNormal(clipPlane1Normal);
  renderWindow.render();
});

document.querySelector('.plane2Position').addEventListener('input', (e) => {
  clipPlane2Position = Number(e.target.value);
  clipPlane2.setOrigin([
    clipPlane2Position,
    clipPlane2Position,
    clipPlane2Position,
  ]);
  renderWindow.render();
});

document.querySelector('.plane2Rotation').addEventListener('input', (e) => {
  const changedDegree = Number(e.target.value) - clipPlane2RotationAngle;
  clipPlane2RotationAngle = Number(e.target.value);
  vtkMatrixBuilder
    .buildFromDegree()
    .rotate(changedDegree, rotationNormal)
    .apply(clipPlane2Normal);
  clipPlane2.setNormal(clipPlane2Normal);
  renderWindow.render();
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
global.clipPlane1 = clipPlane1;
global.clipPlane2 = clipPlane2;
