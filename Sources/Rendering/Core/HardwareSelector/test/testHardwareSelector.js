import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkPlaneSource from 'vtk.js/Sources/Filters/Sources/PlaneSource';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
import { FieldAssociations } from 'vtk.js/Sources/Common/DataModel/DataSet/Constants';

test('Test HardwareSelector', (tapeContext) => {
  const gc = testUtils.createGarbageCollector(tapeContext);
  tapeContext.ok('rendering', 'vtkHardwareSelector TestHardwareSelector');

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
  promises.push(
    sel.selectAsync(renderer, 200, 200, 300, 300).then((res) => {
      // res[1] should be at 1.0, 1.0, 1.5 in world coords
      const allGood =
        res.length === 2 &&
        res[0].getProperties().prop === actor &&
        res[1].getProperties().prop === actor3 &&
        Math.abs(res[1].getProperties().worldPosition[0] - 1.0) < 0.02 &&
        Math.abs(res[1].getProperties().worldPosition[1] - 1.0) < 0.02 &&
        Math.abs(res[1].getProperties().worldPosition[2] - 1.5) < 0.02;

      tapeContext.ok(res.length === 2, 'Two props selected');
      tapeContext.ok(allGood, 'Correct props were selected');
    })
  );

  // Test picking points
  promises.push(
    sel.selectAsync(renderer, 210, 199, 211, 200).then((res) => {
      tapeContext.ok(res[0].getProperties().propID === 3);
      tapeContext.ok(res[0].getProperties().attributeID === 33);
    })
  );

  promises.push(
    sel.selectAsync(renderer, 145, 140, 146, 141).then((res) => {
      tapeContext.ok(res[0].getProperties().propID === 4);
      tapeContext.ok(res[0].getProperties().attributeID === 0);
    })
  );

  promises.push(
    sel.selectAsync(renderer, 294, 264, 295, 265).then((res) => {
      tapeContext.ok(res[0].getProperties().propID === 5);
      tapeContext.ok(res[0].getProperties().attributeID === 0);
    })
  );

  sel.setFieldAssociation(FieldAssociations.FIELD_ASSOCIATION_CELLS);

  // Test picking cells
  promises.push(
    sel.selectAsync(renderer, 200, 200, 201, 201).then((res) => {
      tapeContext.ok(res[0].getProperties().propID === 3);
      tapeContext.ok(res[0].getProperties().attributeID === 27);
    })
  );

  promises.push(
    sel.selectAsync(renderer, 265, 265, 266, 266).then((res) => {
      tapeContext.ok(res[0].getProperties().propID === 5);
      tapeContext.ok(res[0].getProperties().attributeID === 0);
    })
  );
  Promise.all(promises).then(() => {
    gc.releaseResources();
  });
});
