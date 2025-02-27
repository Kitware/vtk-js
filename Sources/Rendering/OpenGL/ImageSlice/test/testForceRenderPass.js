import test from 'tape';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkImageGridSource from 'vtk.js/Sources/Filters/Sources/ImageGridSource';
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';

import forceOpaqueBaseline from './testForceOpaque.png';
import forceTranslucentBaseline from './testForceTranslucent.png';
import { SlicingMode } from '../../../Core/ImageMapper/Constants';

const setupSlices = (t) => {
  const gc = testUtils.createGarbageCollector();
  t.ok('rendering', 'vtkOpenGLImageMapper testImage');

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

  // ----------------------------------------------------------------------------
  // Test code
  // ----------------------------------------------------------------------------

  const gridSource = gc.registerResource(vtkImageGridSource.newInstance());
  const extent = 200;
  const gridSpacing = 32;
  const dataSpacing = 4;
  const origin = 16;
  gridSource.setDataExtent(0, extent, 0, extent, 0, 4);
  gridSource.setDataSpacing(dataSpacing, dataSpacing, dataSpacing);
  gridSource.setGridSpacing(gridSpacing, gridSpacing, gridSpacing);
  gridSource.setGridOrigin(origin, origin, 1);
  const direction = [0.866, 0.5, 0, -0.5, 0.866, 0, 0, 0, 1];
  gridSource.setDataDirection(...direction);

  const slice = 0;

  // mapperAbove should show above mapperBelow
  // scalars, however, should be correct
  const mapperBelow = gc.registerResource(vtkImageMapper.newInstance());
  mapperBelow.setInputConnection(gridSource.getOutputPort());
  mapperBelow.setSlicingMode(SlicingMode.Z);
  mapperBelow.setSlice(slice * dataSpacing);

  const mapperAbove = gc.registerResource(vtkImageMapper.newInstance());
  mapperAbove.setInputConnection(gridSource.getOutputPort());
  mapperAbove.setSlicingMode(SlicingMode.Z);
  mapperAbove.setSlice(slice * dataSpacing);

  const actorBelow = gc.registerResource(vtkImageSlice.newInstance());
  const rgb = vtkColorTransferFunction.newInstance();
  rgb.addRGBPoint(0, 0, 1, 0);
  rgb.addRGBPoint(255, 0, 1, 0);
  actorBelow.getProperty().setRGBTransferFunction(rgb);
  actorBelow.setMapper(mapperBelow);
  actorBelow.setPosition(100, 100, 0);

  const actorAbove = gc.registerResource(vtkImageSlice.newInstance());
  actorAbove.setMapper(mapperAbove);
  actorAbove.setPosition(-100, 0, 0);

  renderer.addActor(actorBelow);
  renderer.addActor(actorAbove);
  renderer.resetCamera();

  // create something to view it, in this case webgl
  const glWindow = gc.registerResource(vtkOpenGLRenderWindow.newInstance());
  glWindow.setContainer(renderWindowContainer);
  renderWindow.addView(glWindow);
  glWindow.setSize(400, 400);

  return { glWindow, renderWindow, actorAbove, actorBelow, gc };
};

test.onlyIfWebGL('Test ImageMapper forceOpaque', (t) => {
  const { glWindow, renderWindow, actorBelow, gc } = setupSlices(t);

  // If this actor is simply just made transparent, then it will show above the actorAbove
  actorBelow.getProperty().setOpacity(0.5);
  // Make actorBelow get rendered in same pass as actorAbove
  actorBelow.setForceOpaque(true);

  const promise = glWindow
    .captureNextImage()
    .then((image) =>
      testUtils.compareImages(
        image,
        [forceOpaqueBaseline],
        'Rendering/OpenGL/ImageSlice',
        t,
        0.5
      )
    )
    .finally(gc.releaseResources);
  renderWindow.render();
  return promise;
});

test.onlyIfWebGL('Test ImageMapper forceTranslucent', (t) => {
  const { glWindow, renderWindow, actorAbove, actorBelow, gc } = setupSlices(t);

  actorBelow.getProperty().setOpacity(0.9);
  actorAbove.getProperty().setOpacity(1);
  // keep translucent blending
  actorAbove.setForceTranslucent(true);

  const promise = glWindow
    .captureNextImage()
    .then((image) =>
      testUtils.compareImages(
        image,
        [forceTranslucentBaseline],
        'Rendering/OpenGL/ImageSlice',
        t,
        0.5
      )
    )
    .finally(gc.releaseResources);
  renderWindow.render();
  return promise;
});
