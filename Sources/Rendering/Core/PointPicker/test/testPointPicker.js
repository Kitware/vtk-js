import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRTAnalyticSource from 'vtk.js/Sources/Filters/Sources/RTAnalyticSource';
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkPointPicker from 'vtk.js/Sources/Rendering/Core/PointPicker';

const { SlicingMode } = vtkImageMapper;

test.onlyIfWebGL('Test vtkPointPicker image mapper', (t) => {
  // Create some control UI
  const gc = testUtils.createGarbageCollector(t);
  const container = document.querySelector('body');
  const renderWindowContainer = gc.registerDOMElement(
    document.createElement('div')
  );
  container.appendChild(renderWindowContainer);

  // create what we will view
  const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());
  const renderer = gc.registerResource(vtkRenderer.newInstance());
  renderWindow.addRenderer(renderer);

  // create what we will view
  const rtSource = vtkRTAnalyticSource.newInstance();
  rtSource.setWholeExtent(0, 200, 0, 200, 0, 200);
  rtSource.setCenter(100, 100, 100);
  rtSource.setStandardDeviation(0.3);

  const mapper = vtkImageMapper.newInstance();
  mapper.setInputConnection(rtSource.getOutputPort());
  mapper.setSlicingMode(SlicingMode.K);
  mapper.setSlice(12);

  const actor = vtkImageSlice.newInstance();
  actor.getProperty().setColorWindow(100);
  actor.getProperty().setColorLevel(50);
  actor.setMapper(mapper);
  renderer.addActor(actor);

  // now create something to view it, in this case webgl
  const glwindow = gc.registerResource(vtkOpenGLRenderWindow.newInstance());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  renderWindow.render();

  // Test picker
  const picker = vtkPointPicker.newInstance();

  const p = [165, 176, 0];
  picker.pick(p, renderer);

  const actors = picker.getActors();
  t.equal(actors.length, 1);
  t.equal(actors[0], actor);

  const positions = picker.getPickedPositions();
  t.equal(positions.length, 1);
  const xyz = positions[0];
  t.equal(xyz[0], 64.49344014125458);
  t.equal(xyz[1], 75.65264146187872);
  t.equal(xyz[2], 12.000000145434939);

  const ijk = picker.getPointIJK();
  t.equal(ijk[0], 64);
  t.equal(ijk[1], 76);
  t.equal(ijk[2], 12);

  gc.releaseResources();
});

test('Test vtkPointPicker instance', (t) => {
  t.ok(vtkPointPicker, 'Make sure the class definition exists');
  const instance = vtkPointPicker.newInstance();
  t.ok(instance);
  t.end();
});
