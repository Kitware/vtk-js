import test from 'tape';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';

import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';

import baseline from './testUpdatedExtents.png';

test.onlyIfWebGL('Test Volume Mapper Updated Extents', async (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('rendering', 'vtkVolumeMapper UpdatedExtents');

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

  const sideLen = 100;

  const imageData = vtkImageData.newInstance();
  imageData.setExtent(0, sideLen - 1, 0, sideLen - 1, 0, sideLen - 1);
  const pixelData = new Float32Array(sideLen * sideLen * sideLen);

  const da = vtkDataArray.newInstance({
    numberOfComponents: 1,
    values: pixelData,
  });
  da.setName('scalars');
  imageData.getPointData().setScalars(da);

  mapper.setInputData(imageData);

  // create color and opacity transfer functions
  const ctfun = vtkColorTransferFunction.newInstance();
  ctfun.addRGBPoint(0.0, 0.0, 0.0, 0.0);
  ctfun.addRGBPoint(1.0, 1.0, 0.0, 0.5);
  const ofun = vtkPiecewiseFunction.newInstance();
  ofun.addPoint(0.0, 0.0);
  ofun.addPoint(1.0, 1.0);
  actor.getProperty().setRGBTransferFunction(0, ctfun);
  actor.getProperty().setScalarOpacity(0, ofun);
  actor.getProperty().setAmbient(0.5);
  actor.getProperty().setShade(1);

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

  renderer.addVolume(actor);
  actor.getProperty().setInterpolationTypeToLinear();

  // Initial render
  renderer.resetCamera();
  renderWindow.render();

  const mid = sideLen / 2;
  const radius = mid - 1;

  // Generate a 3D sphere
  let i = 0;
  for (let z = 0; z < sideLen; z++) {
    for (let y = 0; y < sideLen; y++) {
      for (let x = 0; x < sideLen; x++) {
        const dist = Math.sqrt(
          (x - mid) ** 2 + (y - mid) ** 2 + (z - mid) ** 2
        );
        pixelData[i++] = dist < radius ? 1 : 0;
      }
    }
  }

  // Update only a portion of the volume rendering texture
  mapper.setUpdatedExtents([
    [0, mid - 1, 0, mid - 1, 0, mid - 1],
    [mid - 1, sideLen - 1, mid - 1, sideLen - 1, mid - 1, sideLen - 1],
  ]);

  const promise = glwindow
    .captureNextImage()
    .then((image) =>
      testUtils.compareImages(
        image,
        [baseline],
        'Rendering/Core/VolumeMapper/testUpdatedExtents',
        t,
        1.5,
        gc.releaseResources
      )
    );
  renderWindow.render();
  return promise;
});
