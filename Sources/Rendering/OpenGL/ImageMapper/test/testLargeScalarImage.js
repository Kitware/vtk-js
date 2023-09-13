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
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import Constants from 'vtk.js/Sources/Rendering/Core/ImageMapper/Constants';

import baseline1 from './testLargeScalarImage.png';

const { SlicingMode } = Constants;

test.onlyIfWebGL('Test Volume Rendering of Large Scalar Values', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('rendering', 'vtkOpenGLVolumeMapper LargeScalars');

  // DOM elements
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

  const actor = gc.registerResource(vtkImageSlice.newInstance());

  const mapper = gc.registerResource(vtkImageMapper.newInstance());
  actor.setMapper(mapper);

  // create a synthetic slice
  const id = vtkImageData.newInstance();
  id.setExtent(0, 9, 0, 9, 0, 0);

  // some (u)int16 values that exceed half float precision
  const largeScalarData = new Uint16Array(10 * 10);
  let max = -Infinity;
  let min = Infinity;
  for (
    let i = 0, value = 2 ** 16 - 1;
    i < largeScalarData.length;
    i++, value--
  ) {
    largeScalarData[i] = value;
    max = Math.max(max, value);
    min = Math.min(min, value);
  }

  const da = vtkDataArray.newInstance({
    numberOfComponents: 1,
    values: largeScalarData,
  });
  da.setName('scalars');

  const cpd = id.getPointData();
  cpd.setScalars(da);

  mapper.setInputData(id);
  mapper.setSliceAtFocalPoint(true);
  mapper.setSlicingMode(SlicingMode.Z);

  // create transfer function, and piecewise function
  const rgb = vtkColorTransferFunction.newInstance();
  rgb.addRGBPoint(min, 0, 0, 0);
  rgb.addRGBPoint(max, 1, 1, 1);

  const ofun = vtkPiecewiseFunction.newInstance();
  ofun.addPoint(0, 1);
  ofun.addPoint(max, 1);

  actor.getProperty().setRGBTransferFunction(rgb);
  actor.getProperty().setPiecewiseFunction(ofun);
  actor.getProperty().setUseLookupTableScalarRange(true);
  actor.setMapper(mapper);

  // create renderwindow
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

  renderer.addActor(actor);
  renderer.resetCamera();
  renderer.resetCameraClippingRange();
  renderer.getActiveCamera().setParallelProjection(true);

  glwindow.captureNextImage().then((image) => {
    testUtils.compareImages(
      image,
      [baseline1],
      'Rendering/OpenGL/ImageMapper/testLargeScalarsImage',
      t,
      1.5,
      gc.releaseResources
    );
  });
  renderWindow.render();
});
