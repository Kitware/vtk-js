import test from 'tape-catch';

import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRTAnalyticSource from 'vtk.js/Sources/Filters/Sources/RTAnalyticSource';
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkCellPicker from 'vtk.js/Sources/Rendering/Core/CellPicker';

const { SlicingMode } = vtkImageMapper;

test('Test vtkCellPicker instance', (t) => {
  t.ok(vtkCellPicker, 'Make sure the class definition exists');
  const instance = vtkCellPicker.newInstance();
  t.ok(instance);
  t.end();
});

test.onlyIfWebGL('Test vtkCellPicker image mapper', (t) => {
  // Create some control UI
  const container = document.querySelector('body');
  const renderWindowContainer = document.createElement('div');
  container.appendChild(renderWindowContainer);

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

  const renderer = vtkRenderer.newInstance();
  renderer.addActor(actor);

  const renderWindow = vtkRenderWindow.newInstance();
  renderWindow.addRenderer(renderer);

  // now create something to view it, in this case webgl
  const glwindow = vtkOpenGLRenderWindow.newInstance();
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  renderWindow.render();

  // Test picker
  const picker = vtkCellPicker.newInstance();

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

  const ijk = picker.getCellIJK();
  t.equal(ijk[0], 64);
  t.equal(ijk[1], 75);
  t.equal(ijk[2], 12);

  t.end();
});
