import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRTAnalyticSource from 'vtk.js/Sources/Filters/Sources/RTAnalyticSource';
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkPointPicker from 'vtk.js/Sources/Rendering/Core/PointPicker';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkLineSource from 'vtk.js/Sources/Filters/Sources/LineSource';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import { Representation } from 'vtk.js/Sources/Rendering/Core/Property/Constants';
import { areEquals } from 'vtk.js/Sources/Common/Core/Math';

const { SlicingMode } = vtkImageMapper;

test('Test vtkPointPicker image mapper', (t) => {
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
  const glwindow = gc.registerResource(renderWindow.newAPISpecificView());
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
  const expectedPosition = [64.33654020304944, 75.54505613923392, 12.0];
  t.assert(
    areEquals(xyz, expectedPosition),
    'Float-compare picked position to expected.'
  );

  const ijk = picker.getPointIJK();
  t.equal(ijk[0], 64);
  t.equal(ijk[1], 76);
  t.equal(ijk[2], 12);

  gc.releaseResources();
});

test.onlyIfWebGL('Test vtkPointPicker line source', (t) => {
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
  const lineSource = vtkLineSource.newInstance();
  lineSource.set({
    point1: [0, 0, 0],
    point2: [100, 0, 0],
    resolution: 10,
  });

  const mapper = vtkMapper.newInstance();
  mapper.setInputConnection(lineSource.getOutputPort());

  const actor = vtkActor.newInstance();
  actor.getProperty().setPointSize(1);
  actor.getProperty().setRepresentation(Representation.WIREFRAME);
  actor.setMapper(mapper);
  renderer.addActor(actor);

  // now create something to view it, in this case webgl
  const glwindow = gc.registerResource(renderWindow.newAPISpecificView());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  renderWindow.render();

  // Test picker
  const picker = vtkPointPicker.newInstance();
  picker.setPickFromList(1);
  picker.initializePickList();
  picker.addPickList(actor);
  picker.setTolerance(1.0);

  const pFirst = [380 + 0.5, 200, 0];
  picker.pick(pFirst, renderer);

  const actorsFirstPoint = picker.getActors();
  t.equal(actorsFirstPoint.length, 1, 'pick at (380.5, 200)');
  t.equal(actorsFirstPoint[0], actor);

  const idFirstPoint = picker.getPointId();
  t.equal(idFirstPoint, 10, 'point id');

  const pLast = [20, 200 + 0.5, 0];
  picker.pick(pLast, renderer);

  const actorsLastPoint = picker.getActors();
  t.equal(actorsLastPoint.length, 1, 'pick at (20, 200.5)');
  t.equal(actorsLastPoint[0], actor);

  const idLastPoint = picker.getPointId();
  t.equal(idLastPoint, 0, 'point id');

  gc.releaseResources();
});

test('Test vtkPointPicker instance', (t) => {
  t.ok(vtkPointPicker, 'Make sure the class definition exists');
  const instance = vtkPointPicker.newInstance();
  t.ok(instance);
  t.end();
});
