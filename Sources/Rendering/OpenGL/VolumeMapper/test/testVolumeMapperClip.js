import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';

import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';

// Force the loading of HttpDataAccessHelper to support gzip decompression
import 'vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper';

import baseline from './testVolumeMapperClip.png';

test.onlyIfWebGL('Test Volume Mapper Clip', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('rendering', 'vtkVolumeMapper Clip');
  // testUtils.keepDOM();

  // Create some control UI
  const container = document.querySelector('body');
  const renderWindowContainer = gc.registerDOMElement(
    document.createElement('div')
  );
  container.appendChild(renderWindowContainer);

  // create what we will view
  const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());
  const renderer = gc.registerResource(vtkRenderer.newInstance());
  renderWindow.addRenderer(renderer);
  renderer.setBackground(0.32, 0.34, 0.43);

  const actor = gc.registerResource(vtkVolume.newInstance());

  const mapper = gc.registerResource(vtkVolumeMapper.newInstance());
  mapper.setSampleDistance(0.5);
  actor.setMapper(mapper);

  const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });
  // create color and opacity transfer functions
  const ctfun = vtkColorTransferFunction.newInstance();
  ctfun.addRGBPoint(0.0, 0.5, 0.0, 0.0);
  ctfun.addRGBPoint(600.0, 1.0, 0.5, 0.5);
  ctfun.addRGBPoint(1280.0, 0.9, 0.8, 0.7);
  ctfun.addRGBPoint(1960.0, 0.81, 0.87, 0.8);
  ctfun.addRGBPoint(4095.0, 0.5, 0.5, 0.5);
  const ofun = vtkPiecewiseFunction.newInstance();
  ofun.addPoint(70.0, 0.0);
  ofun.addPoint(1200, 0.5);
  ofun.addPoint(1300, 0.7);
  ofun.addPoint(2000, 0.8);
  ofun.addPoint(4095.0, 1.0);
  actor.getProperty().setRGBTransferFunction(0, ctfun);
  actor.getProperty().setScalarOpacity(0, ofun);
  actor.getProperty().setAmbient(0.5);
  actor.getProperty().setShade(1);

  actor.getProperty().setUseGradientOpacity(0, true);
  actor.getProperty().setGradientOpacityMinimumValue(0, 0);
  actor.getProperty().setGradientOpacityMaximumValue(0, 10);

  mapper.setInputConnection(reader.getOutputPort());
  const clipPlane = vtkPlane.newInstance();
  clipPlane.setNormal(0.8, 0.0, 0.0);
  mapper.addClippingPlane(clipPlane);

  // now create something to view it
  const glwindow = gc.registerResource(renderWindow.newAPISpecificView());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  // Interactor
  const interactor = vtkRenderWindowInteractor.newInstance();
  interactor.setStillUpdateRate(0.01);
  interactor.setView(glwindow);
  interactor.initialize();
  interactor.bindEvents(renderWindowContainer);

  reader.setUrl(`${__BASE_PATH__}/Data/volume/headsq.vti`).then(() => {
    reader.loadData().then(() => {
      renderer.addVolume(actor);
      actor.getProperty().setInterpolationTypeToLinear();
      const im = reader.getOutputData();
      const bds = im.getBounds();
      clipPlane.setOrigin(
        0.5 * (bds[0] + bds[1]),
        0.5 * (bds[2] + bds[3]),
        0.5 * (bds[4] + bds[5])
      );

      renderer.resetCamera();
      const cam = renderer.getActiveCamera();
      cam.setPosition(-433.55, -264.9, 6.33);
      cam.setFocalPoint(156.47, 183.3, 84.39);
      cam.setViewUp(-0.09, 0.27, -0.96);
      cam.zoom(1.2);
      renderer.resetCameraClippingRange();

      glwindow.captureNextImage().then((image) => {
        testUtils.compareImages(
          image,
          [baseline],
          'Rendering/Core/VolumeMapper/testVolumeMapperClip',
          t,
          1.5,
          gc.releaseResources
        );
      });
      renderWindow.render();
    });
  });
});
