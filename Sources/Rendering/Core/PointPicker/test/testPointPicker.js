import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRTAnalyticSource from 'vtk.js/Sources/Filters/Sources/RTAnalyticSource';
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkPointPicker from 'vtk.js/Sources/Rendering/Core/PointPicker';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkLineSource from 'vtk.js/Sources/Filters/Sources/LineSource';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkXMLPolyDataReader from 'vtk.js/Sources/IO/XML/XMLPolyDataReader';
import vtkBase64 from 'vtk.js/Sources/Common/Core/Base64';
import { Representation } from 'vtk.js/Sources/Rendering/Core/Property/Constants';

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
  t.equal(xyz[1], 75.65265009452136);
  t.equal(xyz[2], 12.000000145434939);

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
    point0: [0, 0, 0],
    point1: [100, 0, 0],
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
  const glwindow = gc.registerResource(vtkOpenGLRenderWindow.newInstance());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  renderWindow.render();

  // Test picker
  const picker = vtkPointPicker.newInstance();
  picker.setPickFromList(1);
  picker.initializePickList();
  picker.addPickList(actor);
  picker.setTolerance(10.0);

  const pFirst = [380, 200, 0];
  picker.pick(pFirst, renderer);
  
  const actorsFirstPoint = picker.getActors();
  t.equal(actorsFirstPoint.length, 1);
  t.equal(actorsFirstPoint[0], actor); 
  
  const idFirstPoint = picker.getPointId();
  t.equal(idFirstPoint, 0);
  
  
  const pLast = [20, 200, 0];
  picker.pick(pLast, renderer);
  
  const actorsLastPoint = picker.getActors();
  t.equal(actorsLastPoint.length, 1);
  t.equal(actorsLastPoint[0], actor);
  
  const idLastPoint = picker.getPointId();
  t.equal(idLastPoint, 10);

  gc.releaseResources();
});


test.onlyIfWebGL('Test vtkPointPicker xml PolyData source', (t) => {
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

  // read xml PolyData
  // test should fail with this PolyData
  // <?xml version ="1.0" encoding="utf-16"?><VTKFile type="PolyData"><PolyData><Piece NumberOfPoints="6" NumberOfLines="3" NumberOfPolys="0"><Points><DataArray type="Float32" Name="Points" NumberOfComponents="3" format="ascii"> 0 0 0 1 0 0 1 0 0 2 0 0 2 0 0 3 0 0</DataArray></Points><PointData><DataArray type="Int32" Name="node_ids" NumberOfComponents="1" format="ascii"> 1 3 3 4 4 2</DataArray></PointData><CellData Scalars="element_type_cell_colors"><DataArray type="Int32" Name="element_ids" NumberOfComponents="1" format="ascii">1 2 3</DataArray><DataArray type="UInt8" Name="element_type_cell_colors" NumberOfComponents="3" format="ascii"> 255 0 0 255 0 0 255 0 0</DataArray></CellData><Lines><DataArray type="Int64" Name="connectivity" format="ascii"> 0 1 2 3 4 5</DataArray><DataArray type="Int64" Name="offsets" format="ascii"> 2 4 6</DataArray></Lines></Piece></PolyData></VTKFile>
  // const base64PolyData = "PD94bWwgdmVyc2lvbiA9IjEuMCIgZW5jb2Rpbmc9InV0Zi0xNiI/PjxWVEtGaWxlIHR5cGU9IlBvbHlEYXRhIj48UG9seURhdGE+PFBpZWNlIE51bWJlck9mUG9pbnRzPSI2IiBOdW1iZXJPZkxpbmVzPSIzIiBOdW1iZXJPZlBvbHlzPSIwIj48UG9pbnRzPjxEYXRhQXJyYXkgdHlwZT0iRmxvYXQzMiIgTmFtZT0iUG9pbnRzIiBOdW1iZXJPZkNvbXBvbmVudHM9IjMiIGZvcm1hdD0iYXNjaWkiPiAwIDAgMCAxIDAgMCAxIDAgMCAyIDAgMCAyIDAgMCAzIDAgMDwvRGF0YUFycmF5PjwvUG9pbnRzPjxQb2ludERhdGE+PERhdGFBcnJheSB0eXBlPSJJbnQzMiIgTmFtZT0ibm9kZV9pZHMiIE51bWJlck9mQ29tcG9uZW50cz0iMSIgZm9ybWF0PSJhc2NpaSI+IDEgMyAzIDQgNCAyPC9EYXRhQXJyYXk+PC9Qb2ludERhdGE+PENlbGxEYXRhIFNjYWxhcnM9ImVsZW1lbnRfdHlwZV9jZWxsX2NvbG9ycyI+PERhdGFBcnJheSB0eXBlPSJJbnQzMiIgTmFtZT0iZWxlbWVudF9pZHMiIE51bWJlck9mQ29tcG9uZW50cz0iMSIgZm9ybWF0PSJhc2NpaSI+MSAyIDM8L0RhdGFBcnJheT48RGF0YUFycmF5IHR5cGU9IlVJbnQ4IiBOYW1lPSJlbGVtZW50X3R5cGVfY2VsbF9jb2xvcnMiIE51bWJlck9mQ29tcG9uZW50cz0iMyIgZm9ybWF0PSJhc2NpaSI+IDI1NSAwIDAgMjU1IDAgMCAyNTUgMCAwPC9EYXRhQXJyYXk+PC9DZWxsRGF0YT48TGluZXM+PERhdGFBcnJheSB0eXBlPSJJbnQ2NCIgTmFtZT0iY29ubmVjdGl2aXR5IiBmb3JtYXQ9ImFzY2lpIj4gMCAxIDIgMyA0IDU8L0RhdGFBcnJheT48RGF0YUFycmF5IHR5cGU9IkludDY0IiBOYW1lPSJvZmZzZXRzIiBmb3JtYXQ9ImFzY2lpIj4gMiA0IDY8L0RhdGFBcnJheT48L0xpbmVzPjwvUGllY2U+PC9Qb2x5RGF0YT48L1ZUS0ZpbGU+";
  
  // test should work with this PolyData
  // <?xml version ="1.0" encoding="utf-16"?><VTKFile type="PolyData"><PolyData><Piece NumberOfPoints="6" NumberOfLines="3" NumberOfPolys="0"><Points><DataArray type="Float32" Name="Points" NumberOfComponents="3" format="ascii"> 0 1 1 1 1 1 1 1 1 2 1 1 2 1 1 3 1 1</DataArray></Points><PointData><DataArray type="Int32" Name="node_ids" NumberOfComponents="1" format="ascii"> 1 3 3 4 4 2</DataArray></PointData><CellData Scalars="element_type_cell_colors"><DataArray type="Int32" Name="element_ids" NumberOfComponents="1" format="ascii">1 2 3</DataArray><DataArray type="UInt8" Name="element_type_cell_colors" NumberOfComponents="3" format="ascii"> 255 0 0 255 0 0 255 0 0</DataArray></CellData><Lines><DataArray type="Int64" Name="connectivity" format="ascii"> 0 1 2 3 4 5</DataArray><DataArray type="Int64" Name="offsets" format="ascii"> 2 4 6</DataArray></Lines></Piece></PolyData></VTKFile>
  const base64PolyData = "PD94bWwgdmVyc2lvbiA9IjEuMCIgZW5jb2Rpbmc9InV0Zi0xNiI/PjxWVEtGaWxlIHR5cGU9IlBvbHlEYXRhIj48UG9seURhdGE+PFBpZWNlIE51bWJlck9mUG9pbnRzPSI2IiBOdW1iZXJPZkxpbmVzPSIzIiBOdW1iZXJPZlBvbHlzPSIwIj48UG9pbnRzPjxEYXRhQXJyYXkgdHlwZT0iRmxvYXQzMiIgTmFtZT0iUG9pbnRzIiBOdW1iZXJPZkNvbXBvbmVudHM9IjMiIGZvcm1hdD0iYXNjaWkiPiAwIDEgMSAxIDEgMSAxIDEgMSAyIDEgMSAyIDEgMSAzIDEgMTwvRGF0YUFycmF5PjwvUG9pbnRzPjxQb2ludERhdGE+PERhdGFBcnJheSB0eXBlPSJJbnQzMiIgTmFtZT0ibm9kZV9pZHMiIE51bWJlck9mQ29tcG9uZW50cz0iMSIgZm9ybWF0PSJhc2NpaSI+IDEgMyAzIDQgNCAyPC9EYXRhQXJyYXk+PC9Qb2ludERhdGE+PENlbGxEYXRhIFNjYWxhcnM9ImVsZW1lbnRfdHlwZV9jZWxsX2NvbG9ycyI+PERhdGFBcnJheSB0eXBlPSJJbnQzMiIgTmFtZT0iZWxlbWVudF9pZHMiIE51bWJlck9mQ29tcG9uZW50cz0iMSIgZm9ybWF0PSJhc2NpaSI+MSAyIDM8L0RhdGFBcnJheT48RGF0YUFycmF5IHR5cGU9IlVJbnQ4IiBOYW1lPSJlbGVtZW50X3R5cGVfY2VsbF9jb2xvcnMiIE51bWJlck9mQ29tcG9uZW50cz0iMyIgZm9ybWF0PSJhc2NpaSI+IDI1NSAwIDAgMjU1IDAgMCAyNTUgMCAwPC9EYXRhQXJyYXk+PC9DZWxsRGF0YT48TGluZXM+PERhdGFBcnJheSB0eXBlPSJJbnQ2NCIgTmFtZT0iY29ubmVjdGl2aXR5IiBmb3JtYXQ9ImFzY2lpIj4gMCAxIDIgMyA0IDU8L0RhdGFBcnJheT48RGF0YUFycmF5IHR5cGU9IkludDY0IiBOYW1lPSJvZmZzZXRzIiBmb3JtYXQ9ImFzY2lpIj4gMiA0IDY8L0RhdGFBcnJheT48L0xpbmVzPjwvUGllY2U+PC9Qb2x5RGF0YT48L1ZUS0ZpbGU+";
  const buffer = vtkBase64.toArrayBuffer(base64PolyData);
  const reader = vtkXMLPolyDataReader.newInstance();
  const readerResponse = reader.parseAsArrayBuffer(buffer);
  const polyData = reader.getOutputData(0);
  
  // add mapper and actor
  const mapper = vtkMapper.newInstance();
  mapper.setInputConnection(polyData.getOutputPort());

  const actor = vtkActor.newInstance();
  actor.getProperty().setPointSize(1);
  actor.getProperty().setRepresentation(Representation.WIREFRAME);
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
  picker.setPickFromList(1);
  picker.initializePickList();
  picker.addPickList(actor);
  picker.setTolerance(1.0);

  const pFirst = [380, 200, 0];
  picker.pick(pFirst, renderer);
  
  const actorsFirstPoint = picker.getActors();
  t.equal(actorsFirstPoint.length, 1);
  t.equal(actorsFirstPoint[0], actor); 
  
  const idFirstPoint = picker.getPointId();
  t.equal(idFirstPoint, 1);
  
  const pLast = [20, 200, 0];
  picker.pick(pLast, renderer);
  
  const actorsLastPoint = picker.getActors();
  t.equal(actorsLastPoint.length, 1);
  t.equal(actorsLastPoint[0], actor);
  
  const idLastPoint = picker.getPointId();
  t.equal(idLastPoint, 2);

  gc.releaseResources();
});

test('Test vtkPointPicker instance', (t) => {
  t.ok(vtkPointPicker, 'Make sure the class definition exists');
  const instance = vtkPointPicker.newInstance();
  t.ok(instance);
  t.end();
});
