import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';

import baseline1 from './testIntermixed.png';
import baseline2 from './testIntermixed_2.png';

test('Test Composite Volume Rendering: intermixed geometry', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('rendering', 'vtkVolumeMapper Intermixed');
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
  renderer.setBackground(0.32, 0.3, 0.43);

  const volume = gc.registerResource(vtkVolume.newInstance());

  const vmapper = gc.registerResource(vtkVolumeMapper.newInstance());
  vmapper.setSampleDistance(0.7);
  volume.setMapper(vmapper);

  const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });
  // create color and opacity transfer functions
  const ctfun = vtkColorTransferFunction.newInstance();
  ctfun.addRGBPoint(0, 85 / 255.0, 0, 0);
  ctfun.addRGBPoint(95, 1.0, 1.0, 1.0);
  ctfun.addRGBPoint(225, 0.66, 0.66, 0.5);
  ctfun.addRGBPoint(255, 0.3, 1.0, 0.5);
  const ofun = vtkPiecewiseFunction.newInstance();
  ofun.addPoint(0.0, 0.0);
  ofun.addPoint(255.0, 1.0);
  volume.getProperty().setRGBTransferFunction(0, ctfun);
  volume.getProperty().setScalarOpacity(0, ofun);
  volume.getProperty().setScalarOpacityUnitDistance(0, 3.0);
  volume.getProperty().setInterpolationTypeToFastLinear();

  vmapper.setInputConnection(reader.getOutputPort());

  // now create something to view it
  const glwindow = gc.registerResource(renderWindow.newAPISpecificView());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  const actor = gc.registerResource(vtkActor.newInstance());
  renderer.addActor(actor);

  const mapper = gc.registerResource(vtkMapper.newInstance());
  actor.setMapper(mapper);
  actor.setPosition(300, 200, 200);

  const sphereSource = gc.registerResource(
    vtkSphereSource.newInstance({
      radius: 100,
      thetaResolution: 36,
      phiResolution: 18,
    })
  );
  mapper.setInputConnection(sphereSource.getOutputPort());

  // Interactor
  const interactor = vtkRenderWindowInteractor.newInstance();
  interactor.setStillUpdateRate(0.01);
  interactor.setView(glwindow);
  interactor.initialize();
  interactor.bindEvents(renderWindowContainer);

  reader.setUrl(`${__BASE_PATH__}/Data/volume/LIDC2.vti`).then(() => {
    reader.loadData().then(() => {
      renderer.addVolume(volume);
      renderer.resetCamera();
      renderer.getActiveCamera().zoom(1.5);
      renderer.getActiveCamera().elevation(70);
      renderer.getActiveCamera().orthogonalizeViewUp();
      renderer.getActiveCamera().azimuth(-20);
      renderer.resetCameraClippingRange();

      glwindow.captureNextImage().then((image) => {
        testUtils.compareImages(
          image,
          [baseline1, baseline2],
          'Rendering/Core/VolumeMapper/testIntermixed',
          t,
          5.0,
          gc.releaseResources
        );
      });
      renderWindow.render();
    });
  });
});
