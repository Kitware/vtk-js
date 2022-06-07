import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkInteractorStyleTrackballCamera from 'vtk.js/Sources/Interaction/Style/InteractorStyleTrackballCamera';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';

import baseline1 from './testLighting.png';
import baseline2 from './testLighting_2.png';

test.onlyIfWebGL('Test Lighted Volume Rendering', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('rendering', 'vtkOpenGLVolumeMapper Lighting');
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
  renderer.setBackground(0.2, 0.3, 0.4);
  renderWindow.addRenderer(renderer);

  const actor = gc.registerResource(vtkVolume.newInstance());
  // renderer.addVolume(actor);

  const mapper = gc.registerResource(vtkVolumeMapper.newInstance());
  mapper.setSampleDistance(2.0);
  actor.setMapper(mapper);

  // create color and opacity transfer functions
  const ctfun = vtkColorTransferFunction.newInstance();
  ctfun.addRGBPoint(200.0, 0.4, 0.2, 0.0);
  ctfun.addRGBPoint(2000.0, 1.0, 1.0, 1.0);
  const ofun = vtkPiecewiseFunction.newInstance();
  ofun.addPoint(200.0, 0.0);
  ofun.addPoint(1200.0, 0.5);
  ofun.addPoint(4000.0, 0.4);
  actor.getProperty().setRGBTransferFunction(0, ctfun);
  actor.getProperty().setScalarOpacity(0, ofun);
  actor.getProperty().setScalarOpacityUnitDistance(0, 4.5);
  actor.getProperty().setUseGradientOpacity(0, true);
  actor.getProperty().setGradientOpacityMinimumValue(0, 5);
  actor.getProperty().setGradientOpacityMinimumOpacity(0, 0.0);
  actor.getProperty().setGradientOpacityMaximumValue(0, 50);
  actor.getProperty().setGradientOpacityMaximumOpacity(0, 1.0);
  actor.getProperty().setShade(true);
  actor.getProperty().setAmbient(0.2);
  actor.getProperty().setDiffuse(0.7);
  actor.getProperty().setSpecular(0.3);
  actor.getProperty().setSpecularPower(3.0);
  // actor.getProperty().setInterpolationTypeToFastLinear();
  actor.getProperty().setInterpolationTypeToLinear();
  // actor.getProperty().setInterpolationTypeToNearest();

  const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });
  mapper.setInputConnection(reader.getOutputPort());

  // now create something to view it, in this case webgl
  const glwindow = gc.registerResource(vtkOpenGLRenderWindow.newInstance());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  // Interactor
  const interactor = vtkRenderWindowInteractor.newInstance();
  interactor.setStillUpdateRate(0.01);
  interactor.setView(glwindow);
  interactor.initialize();
  interactor.bindEvents(renderWindowContainer);
  interactor.setInteractorStyle(
    vtkInteractorStyleTrackballCamera.newInstance()
  );

  reader.setUrl(`${__BASE_PATH__}/Data/volume/headsq.vti`).then(() => {
    reader.loadData().then(() => {
      renderer.addVolume(actor);
      renderer.resetCamera();
      renderer.getActiveCamera().elevation(70);
      renderer.getActiveCamera().orthogonalizeViewUp();
      renderer.getActiveCamera().azimuth(-90);
      renderer.getActiveCamera().zoom(1.4);
      renderer.resetCameraClippingRange();
      renderer.updateLightsGeometryToFollowCamera();
      renderWindow.render();
      glwindow.captureNextImage().then((image) => {
        testUtils.compareImages(
          image,
          [baseline1, baseline2],
          'Rendering/OpenGL/VolumeMapper/testMultiComponentComposite',
          t,
          0.05,
          gc.releaseResources
        );
      });
      renderWindow.render();
    });
  });
});
