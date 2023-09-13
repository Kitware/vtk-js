import test from 'tape';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';

import baseline1 from './testLargeScalars.png';

test.onlyIfWebGL('Test Volume Rendering of Large Scalar Values', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('rendering', 'vtkOpenGLVolumeMapper LargeScalars');
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
  mapper.setSampleDistance(0.7);
  actor.setMapper(mapper);

  // create a synthetic volume
  const id = vtkImageData.newInstance();
  id.setExtent(0, 99, 0, 99, 0, 99);

  const floatData = new Float32Array(100 * 100 * 100);

  actor.getProperty().setComponentWeight(0, 1.0);
  actor.getProperty().setIndependentComponents(true);

  const scaleFactor = 10000.0;

  const baseValue = 40.0 * scaleFactor;
  const xOffset = 3.0;
  const xDiv = 20.0;
  const yDiv = 10.0;
  const zDiv = 5.0;

  const radius = 45;

  let i = 0;
  for (let z = 0; z <= 99; z++) {
    for (let y = 0; y <= 99; y++) {
      for (let x = 0; x <= 99; x++) {
        const dist = Math.sqrt((x - 50) ** 2 + (y - 50) ** 2 + (z - 50) ** 2);
        if (dist < radius) {
          floatData[i] =
            baseValue *
            (xOffset +
              Math.cos(x / xDiv) +
              Math.cos(y / yDiv) +
              Math.cos(z / zDiv));
        } else {
          floatData[i] = 0.0;
        }
        i += 1;
      }
    }
  }

  const da = vtkDataArray.newInstance({
    numberOfComponents: 1,
    values: floatData,
  });
  da.setName('scalars');

  const dataRange = da.getRange(0);
  console.log(`Scalar data range: ${dataRange}`);

  const cpd = id.getPointData();
  cpd.setScalars(da);

  mapper.setInputData(id);

  // create color and opacity transfer functions
  const ctfun = vtkColorTransferFunction.newInstance();
  ctfun.addRGBPoint(0, 0.0, 0.5, 1.0);
  ctfun.addRGBPoint(255.0 * scaleFactor, 1.0, 1.0, 0.0);
  const ofun = vtkPiecewiseFunction.newInstance();
  ofun.addPoint(0.0, 0.0);
  ofun.addPoint(250.0 * scaleFactor, 0.2);
  actor.getProperty().setRGBTransferFunction(0, ctfun);
  actor.getProperty().setScalarOpacity(0, ofun);
  actor.getProperty().setScalarOpacityUnitDistance(0, 3.0);
  actor.getProperty().setComponentWeight(0, 1.0);

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

  renderer.addVolume(actor);
  renderer.resetCamera();
  renderer.getActiveCamera().zoom(1.5);
  renderer.getActiveCamera().elevation(70);
  renderer.resetCameraClippingRange();

  glwindow.captureNextImage().then((image) => {
    testUtils.compareImages(
      image,
      [baseline1],
      'Rendering/OpenGL/VolumeMapper/testLargeScalarsVolume',
      t,
      1.5,
      gc.releaseResources
    );
  });
  renderWindow.render();
});
