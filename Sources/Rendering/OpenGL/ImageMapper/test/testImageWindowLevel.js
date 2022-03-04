import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkCamera from 'vtk.js/Sources/Rendering/Core/Camera';
import vtkColorMaps from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageProperty from 'vtk.js/Sources/Rendering/Core/ImageProperty';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';

import { SlicingMode } from '../../../Core/ImageMapper/Constants';
import baseline from './testImageWindowLevel.png';

test('Test ImageMapper window level', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('rendering', 'vtkOpenGLImageMapper testImage windowlevel');

  // Create some control UI
  const container = document.querySelector('body');
  const renderWindowContainer = gc.registerDOMElement(
    document.createElement('div')
  );
  container.appendChild(renderWindowContainer);

  // create what we will view
  const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());
  const ren1 = gc.registerResource(vtkRenderer.newInstance());
  ren1.setViewport(0, 0, 0.5, 1);
  ren1.setBackground(0.32, 0.34, 0.43);
  renderWindow.addRenderer(ren1);
  const ren2 = gc.registerResource(vtkRenderer.newInstance());
  ren2.setViewport(0.5, 0, 1, 1);
  ren2.setBackground(0.42, 0.34, 0.33);
  renderWindow.addRenderer(ren2);

  // ----------------------------------------------------------------------------
  // Test code
  // ----------------------------------------------------------------------------

  const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });

  // mapper2 should show above mapper1
  // scalars, however, should be correct
  const mapper1 = gc.registerResource(vtkImageMapper.newInstance());
  mapper1.setInputConnection(reader.getOutputPort());

  const mapper2 = gc.registerResource(vtkImageMapper.newInstance());
  mapper2.setInputConnection(reader.getOutputPort());

  const actor1 = gc.registerResource(vtkImageSlice.newInstance());
  actor1.setMapper(mapper1);

  const actor2 = gc.registerResource(vtkImageSlice.newInstance());
  actor2.setMapper(mapper2);

  const rgb = vtkColorTransferFunction.newInstance();
  const preset = vtkColorMaps.getPresetByName('Grayscale');
  rgb.applyColorMap(preset);
  rgb.setMappingRange(0, 4096);
  rgb.updateRange();
  const property1 = gc.registerResource(vtkImageProperty.newInstance());
  property1.setRGBTransferFunction(rgb);
  property1.setColorWindow(2000);
  property1.setColorLevel(1000);
  property1.setUseLookupTableScalarRange(false);
  const property2 = gc.registerResource(vtkImageProperty.newInstance());
  property2.setRGBTransferFunction(rgb);
  property2.setColorWindow(2000);
  property2.setColorLevel(1000);
  property2.setUseLookupTableScalarRange(true);

  actor1.setProperty(property1);
  actor2.setProperty(property2);

  const camera = gc.registerResource(vtkCamera.newInstance());
  camera.setPosition(0, 0, 0);
  camera.setFocalPoint(1, 0, 0);
  camera.setViewUp(0, 0, -1);
  camera.setParallelProjection(true);
  ren1.setActiveCamera(camera);
  ren2.setActiveCamera(camera);

  // -----------------------------------------------------------
  // Make some variables global so that you can inspect and
  // modify objects in your browser's developer console:
  // -----------------------------------------------------------

  // create something to view it, in this case webgl
  const glwindow = gc.registerResource(vtkOpenGLRenderWindow.newInstance());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);
  t.ok('rendering', 'vtkOpenGLImageMapper mapper set up');

  reader.setUrl(`${__BASE_PATH__}/Data/volume/headsq.vti`).then(() => {
    reader.loadData().then(() => {
      t.ok('rendering', 'vtkOpenGLImageMapper data loaded');
      ren1.addActor(actor1);
      ren2.addActor(actor2);
      mapper2.setSlicingMode(SlicingMode.I);
      mapper1.setSlicingMode(SlicingMode.I);
      mapper2.setSlice(40);
      mapper1.setSlice(40);
      ren1.resetCamera();
      ren2.resetCamera();
      renderWindow.render();
      glwindow.captureNextImage().then((image) => {
        testUtils.compareImages(
          image,
          [baseline],
          'Rendering/OpenGL/ImageMapperWindowLevel',
          t,
          0.05,
          gc.releaseResources
        );
      });
      renderWindow.render();
    });
  });
});
