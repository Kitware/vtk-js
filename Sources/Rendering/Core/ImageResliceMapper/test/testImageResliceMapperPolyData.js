import test from 'tape';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkImageResliceMapper from 'vtk.js/Sources/Rendering/Core/ImageResliceMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkOutlineFilter from 'vtk.js/Sources/Filters/General/OutlineFilter';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkRTAnalyticSource from 'vtk.js/Sources/Filters/Sources/RTAnalyticSource';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';

import baseline from './testImageResliceMapperPolyData.png';

test.onlyIfWebGL('Test ImageResliceMapperPolyData', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('rendering', 'vtkImageResliceMapper testImageResliceMapperPolyData');

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

  const rtSource = gc.registerResource(vtkRTAnalyticSource.newInstance());
  rtSource.setWholeExtent(0, 199, 0, 199, 0, 199);
  rtSource.setCenter(100, 100, 100);

  const sphereSource = gc.registerResource(vtkSphereSource.newInstance());
  sphereSource.setCenter(100, 160, 100);
  sphereSource.setRadius(80);
  sphereSource.setThetaResolution(40);
  sphereSource.setPhiResolution(40);
  sphereSource.update();
  const mapper = gc.registerResource(vtkImageResliceMapper.newInstance());
  mapper.setInputConnection(rtSource.getOutputPort());
  mapper.setSlicePolyData(sphereSource.getOutputData());

  const actor = gc.registerResource(vtkImageSlice.newInstance());
  actor.getProperty().setColorWindow(255);
  actor.getProperty().setColorLevel(127);
  actor.setMapper(mapper);
  renderer.addActor(actor);

  const ppty = actor.getProperty();
  ppty.setColorWindow(255);
  ppty.setColorLevel(127.5);
  ppty.setIndependentComponents(true);

  const rgb = gc.registerResource(vtkColorTransferFunction.newInstance());
  rgb.addRGBPoint(0, 0, 0, 0);
  rgb.addRGBPoint(255, 1, 1, 1);
  ppty.setRGBTransferFunction(rgb);

  const ofun = gc.registerResource(vtkPiecewiseFunction.newInstance());
  ofun.addPoint(0, 1);
  ofun.addPoint(150, 1);
  ofun.addPoint(180, 0.5);
  ofun.addPoint(255, 0.8);
  ppty.setPiecewiseFunction(ofun);

  const oline = gc.registerResource(vtkOutlineFilter.newInstance());
  oline.setInputConnection(rtSource.getOutputPort());
  const omapper = gc.registerResource(vtkMapper.newInstance());
  omapper.setInputConnection(oline.getOutputPort());
  const oactor = gc.registerResource(vtkActor.newInstance());
  oactor.setMapper(omapper);
  renderer.addActor(oactor);

  renderer.resetCamera();
  renderWindow.render();

  // -----------------------------------------------------------
  // Make some variables global so that you can inspect and
  // modify objects in your browser's developer console:
  // -----------------------------------------------------------

  // create something to view it
  const glwindow = gc.registerResource(renderWindow.newAPISpecificView());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  glwindow.captureNextImage().then((image) => {
    testUtils.compareImages(
      image,
      [baseline],
      'Rendering/Core/ImageResliceMapper',
      t,
      1,
      gc.releaseResources
    );
  });
  renderWindow.render();
});
