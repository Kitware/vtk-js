import test from 'tape';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkPolydata from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkPlaneSource from 'vtk.js/Sources/Filters/Sources/PlaneSource';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
import { FieldAssociations } from 'vtk.js/Sources/Common/DataModel/DataSet/Constants';

test.onlyIfWebGL('Test HardwareSelector Points', (tapeContext) => {
  const gc = testUtils.createGarbageCollector(tapeContext);
  tapeContext.ok('rendering', 'vtkHardwareSelector TestHardwareSelectorPoints');

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

  // Plane in the middle ----------------------------------
  const PlaneSource = gc.registerResource(
    vtkPlaneSource.newInstance({ xResolution: 5, yResolution: 10 })
  );

  const mapper = gc.registerResource(vtkMapper.newInstance());
  mapper.setInputConnection(PlaneSource.getOutputPort());

  const actor = gc.registerResource(vtkActor.newInstance());
  actor.setMapper(mapper);

  renderer.addActor(actor);

  // Sphere lower left ----------------------------------
  const SphereSource = gc.registerResource(vtkSphereSource.newInstance());

  const mapper2 = gc.registerResource(vtkMapper.newInstance());
  mapper2.setInputConnection(SphereSource.getOutputPort());

  const actor2 = gc.registerResource(vtkActor.newInstance());
  actor2.setMapper(mapper2);

  renderer.addActor(actor2);

  // Sphere edges upper right ----------------------------------
  const mapper3 = gc.registerResource(vtkMapper.newInstance());
  mapper3.setInputConnection(SphereSource.getOutputPort());

  const actor3 = gc.registerResource(vtkActor.newInstance());
  actor3.setMapper(mapper3);
  actor3.getProperty().setEdgeVisibility(true);
  actor3.getProperty().setEdgeColor(1.0, 0.5, 0.5);
  actor3.getProperty().setDiffuseColor(0.5, 1.0, 0.5);
  actor3.setPosition(1.0, 1.0, 1.0);

  renderer.addActor(actor3);

  // Square polyline upper left with triangle poly inside --------------------------------
  // Triangle polyline lower right -----------------------------
  const mapper4 = gc.registerResource(vtkMapper.newInstance());
  const polygon = gc.registerResource(vtkPolydata.newInstance());
  const squarePoints = [-0.25, 1.25, 0, 0, 1.25, 0, 0, 1, 0, -0.25, 1, 0];
  const trianglePoints = [1, 0, 0, 1, -0.25, 0, 1.25, -0.125, 0];
  const polyPoints = [-0.2, 1.05, 0, -0.05, 1.05, 0, -0.125, 1.2, 0];
  polygon
    .getPoints()
    .setData(
      Float32Array.from([...squarePoints, ...trianglePoints, ...polyPoints]),
      3
    );
  polygon
    .getLines()
    .setData(Uint16Array.from([5, 0, 1, 2, 3, 0, 4, 4, 5, 6, 4]));
  polygon.getPolys().setData(Uint16Array.from([3, 7, 8, 9]));
  mapper4.setInputData(polygon);

  const actor4 = gc.registerResource(vtkActor.newInstance());
  actor4.setMapper(mapper4);

  renderer.addActor(actor4);

  // now create something to view it, in this case webgl
  const glwindow = gc.registerResource(renderWindow.newAPISpecificView());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);
  renderWindow.render();

  const sel = glwindow.getSelector();
  sel.setFieldAssociation(FieldAssociations.FIELD_ASSOCIATION_POINTS);
  sel.setCaptureZValues(true);

  const promises = [];

  // Test picking points
  // On a point of the plane
  promises.push(
    sel.selectAsync(renderer, 210, 199, 211, 200).then((res) => {
      tapeContext.ok(res[0].getProperties().propID === 4);
      tapeContext.ok(res[0].getProperties().attributeID === 33);
    })
  );
  // On a point of the lower sphere
  promises.push(
    sel.selectAsync(renderer, 145, 140, 146, 141).then((res) => {
      tapeContext.ok(res[0].getProperties().propID === 5);
      tapeContext.ok(res[0].getProperties().attributeID === 0);
    })
  );
  // On a point of the upper sphere covered by an edge
  promises.push(
    sel.selectAsync(renderer, 294, 264, 295, 265).then((res) => {
      tapeContext.ok(res[0].getProperties().propID === 6);
      tapeContext.ok(res[0].getProperties().attributeID === 2);
    })
  );

  sel.setFieldAssociation(FieldAssociations.FIELD_ASSOCIATION_CELLS);

  // Test picking cells
  // In the middle of the plane
  promises.push(
    sel.selectAsync(renderer, 200, 200, 201, 201).then((res) => {
      tapeContext.ok(res[0].getProperties().propID === 4);
      tapeContext.ok(res[0].getProperties().attributeID === 27);
    })
  );
  // On a point of the upper sphere covered by some edges
  promises.push(
    sel.selectAsync(renderer, 265, 265, 266, 266).then((res) => {
      tapeContext.ok(res[0].getProperties().propID === 6);
      const attribID = res[0].getProperties().attributeID;
      tapeContext.ok(attribID >= 0 && attribID <= 7);
    })
  );
  // On an edge of the upper sphere
  promises.push(
    sel.selectAsync(renderer, 250, 265, 250, 265).then((res) => {
      tapeContext.ok(res[0].getProperties().propID === 6);
      const attribID = res[0].getProperties().attributeID;
      tapeContext.ok(attribID === 3 || attribID === 4);
    })
  );
  // On a edge of the polyline square
  promises.push(
    sel.selectAsync(renderer, 133, 278, 133, 278).then((res) => {
      tapeContext.ok(res[0].getProperties().propID === 7);
      tapeContext.ok(res[0].getProperties().attributeID === 0);
    })
  );
  // On an edge of the polyline triangle
  promises.push(
    sel.selectAsync(renderer, 265, 128, 265, 128).then((res) => {
      tapeContext.ok(res[0].getProperties().propID === 7);
      tapeContext.ok(res[0].getProperties().attributeID === 1);
    })
  );
  // On the triangle of the actor 4 inside the square
  promises.push(
    sel.selectAsync(renderer, 134, 265, 134, 265).then((res) => {
      tapeContext.ok(res[0].getProperties().propID === 7);
      tapeContext.ok(res[0].getProperties().attributeID === 2);
    })
  );
  Promise.all(promises).then(() => {
    gc.releaseResources();
  });
});
