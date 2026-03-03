import { it, expect } from 'vitest';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRTAnalyticSource from 'vtk.js/Sources/Filters/Sources/RTAnalyticSource';
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkCellPicker from 'vtk.js/Sources/Rendering/Core/CellPicker';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import { areEquals } from 'vtk.js/Sources/Common/Core/Math';

const { SlicingMode } = vtkImageMapper;

it('Test vtkCellPicker image mapper', () => {
  // Create some control UI
  const gc = testUtils.createGarbageCollector();
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

  const mapper = gc.registerResource(vtkImageMapper.newInstance());
  mapper.setInputConnection(rtSource.getOutputPort());
  mapper.setSlicingMode(SlicingMode.K);
  mapper.setSlice(12);

  const actor = gc.registerResource(vtkImageSlice.newInstance());
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
  const picker = vtkCellPicker.newInstance();

  const p = [165, 176, 0];
  picker.pick(p, renderer);

  const actors = picker.getActors();
  expect(actors.length).toBe(1);
  expect(actors[0]).toBe(actor);

  const positions = picker.getPickedPositions();
  expect(positions.length).toBe(1);
  const xyz = positions[0];
  const expectedPosition = [64.33654020304944, 75.54505613923392, 12.0];
  expect(areEquals(xyz, expectedPosition)).toBeTruthy();

  const ijk = picker.getCellIJK();
  expect(ijk[0]).toBe(64);
  expect(ijk[1]).toBe(75);
  expect(ijk[2]).toBe(12);

  gc.releaseResources();
});

it('Test vtkCellPicker instance', () => {
  expect(vtkCellPicker).toBeTruthy();
  const instance = vtkCellPicker.newInstance();
  expect(instance).toBeTruthy();
});

it('Test vtkCellPicker on triangles', () => {
  // Create some control UI
  const gc = testUtils.createGarbageCollector();
  const container = document.querySelector('body');
  const renderWindowContainer = gc.registerDOMElement(
    document.createElement('div')
  );
  container.appendChild(renderWindowContainer);

  // Setup window
  const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());
  const renderer = gc.registerResource(vtkRenderer.newInstance());
  renderWindow.addRenderer(renderer);

  // Create what we will view
  const points = Float32Array.from([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0]);
  const polys = new Float32Array([3, 0, 1, 2, 3, 0, 2, 3]);
  const polyData = vtkPolyData.newInstance();
  polyData.getPoints().setData(points);
  polyData.getPolys().setData(polys);

  const mapper = gc.registerResource(vtkMapper.newInstance());
  mapper.setInputData(polyData);
  const actor = gc.registerResource(vtkActor.newInstance());
  actor.setMapper(mapper);

  renderer.addActor(actor);

  // now create something to view it, in this case webgl
  const glwindow = gc.registerResource(renderWindow.newAPISpecificView());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  renderer.resetCamera();
  renderWindow.render();

  // Test picker
  const picker = vtkCellPicker.newInstance();

  const p = [125, 200, 0];
  picker.pick(p, renderer);

  const actors = picker.getActors();

  expect(actors.length).toBe(1);
  expect(actors[0]).toBe(actor);

  const positions = picker.getPickedPositions();
  expect(positions.length).toBe(1);
  const xyz = positions[0];
  const expectedPosition = [0.22548094716167097, 0.5, 0];
  expect(areEquals(xyz, expectedPosition)).toBeTruthy();

  gc.releaseResources();
});

it('Test vtkCellPicker on quads', () => {
  // Create some control UI
  const gc = testUtils.createGarbageCollector();
  const container = document.querySelector('body');
  const renderWindowContainer = gc.registerDOMElement(
    document.createElement('div')
  );
  container.appendChild(renderWindowContainer);

  // Setup window
  const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());
  const renderer = gc.registerResource(vtkRenderer.newInstance());
  renderWindow.addRenderer(renderer);

  // Create what we will view
  const points = Float32Array.from([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0]);
  const polys = new Float32Array([4, 0, 1, 2, 3]);
  const polyData = gc.registerResource(vtkPolyData.newInstance());
  polyData.getPoints().setData(points);
  polyData.getPolys().setData(polys);

  const mapper = gc.registerResource(vtkMapper.newInstance());
  mapper.setInputData(polyData);
  const actor = gc.registerResource(vtkActor.newInstance());
  actor.setMapper(mapper);

  renderer.addActor(actor);

  // now create something to view it, in this case webgl
  const glwindow = gc.registerResource(renderWindow.newAPISpecificView());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  renderer.resetCamera();
  renderWindow.render();

  // Test picker
  const picker = vtkCellPicker.newInstance();

  const p = [125, 200, 0];
  picker.pick(p, renderer);
  const actors = picker.getActors();

  expect(actors.length).toBe(1);
  expect(actors[0]).toBe(actor);

  const positions = picker.getPickedPositions();
  expect(positions.length).toBe(1);
  const xyz = positions[0];
  const expectedPosition = [0.22548094716167097, 0.5, 0];
  expect(areEquals(xyz, expectedPosition)).toBeTruthy();

  gc.releaseResources();
});
