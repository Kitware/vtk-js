import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkImageGridSource from 'vtk.js/Sources/Filters/Sources/ImageGridSource';
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';

import baseline from './testImageIntermediateZSlice.png';
import { SlicingMode } from '../../../Core/ImageMapper/Constants';

test.onlyIfWebGL('Test ImageMapper intermediate slices', (t) => {
  const gc = testUtils.createGarbageCollector(t);
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
  const offset = 1.5;

  // mapperAbove should show above mapperBelow
  // scalars, however, should be correct
  const mapperBelow = gc.registerResource(vtkImageMapper.newInstance());
  mapperBelow.setInputConnection(gridSource.getOutputPort());
  mapperBelow.setSlicingMode(SlicingMode.Z);
  mapperBelow.setSlice(slice * dataSpacing);

  const mapperAbove = gc.registerResource(vtkImageMapper.newInstance());
  mapperAbove.setInputConnection(gridSource.getOutputPort());
  mapperAbove.setSlicingMode(SlicingMode.Z);
  mapperAbove.setSlice(slice * dataSpacing + offset);

  // make sure that if both mappers were coincident,
  // mapperBelow would show above mapperAbove, breaking the test
  mapperBelow.setResolveCoincidentTopologyToPolygonOffset();
  mapperAbove.setResolveCoincidentTopologyToPolygonOffset();
  mapperBelow.setRelativeCoincidentTopologyPolygonOffsetParameters(0, -1);
  mapperAbove.setRelativeCoincidentTopologyPolygonOffsetParameters(0, 1);

  const actorBelow = gc.registerResource(vtkImageSlice.newInstance());
  const rgb = vtkColorTransferFunction.newInstance();
  rgb.addRGBPoint(0, 0, 0, 0);
  rgb.addRGBPoint(255, 0, 0, 0);
  actorBelow.getProperty().setRGBTransferFunction(rgb);
  actorBelow.setMapper(mapperBelow);
  actorBelow.setPosition(100, 100, 0);

  const actorAbove = gc.registerResource(vtkImageSlice.newInstance());
  actorAbove.setMapper(mapperAbove);
  actorAbove.setPosition(-100, 0, 0);

  renderer.addActor(actorBelow);
  renderer.addActor(actorAbove);
  renderer.resetCamera();

  // -----------------------------------------------------------
  // Make some variables global so that you can inspect and
  // modify objects in your browser's developer console:
  // -----------------------------------------------------------

  // create something to view it, in this case webgl
  const glwindow = gc.registerResource(vtkOpenGLRenderWindow.newInstance());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  glwindow.captureNextImage().then((image) => {
    testUtils.compareImages(
      image,
      [baseline],
      'Rendering/OpenGL/ImageMapper',
      t,
      0.5,
      gc.releaseResources
    );
  });
  renderWindow.render();
});
