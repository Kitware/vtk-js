import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkOpenGLHardwareSelector from 'vtk.js/Sources/Rendering/OpenGL/HardwareSelector';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkPlaneSource from 'vtk.js/Sources/Filters/Sources/PlaneSource';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
import { FieldAssociations } from 'vtk.js/Sources/Common/DataModel/DataSet/Constants';

test.onlyIfWebGL('Test HardwareSelector', (tapeContext) => {
  const gc = testUtils.createGarbageCollector(tapeContext);
  tapeContext.ok('rendering', 'vtkOpenGLHardwareSelector TestHardwareSelector');

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
  const glwindow = gc.registerResource(vtkOpenGLRenderWindow.newInstance());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);
  glwindow.traverseAllPasses();

  const sel = gc.registerResource(vtkOpenGLHardwareSelector.newInstance());
  sel.setFieldAssociation(FieldAssociations.FIELD_ASSOCIATION_POINTS);
  sel.attach(glwindow, renderer);
  sel.setCaptureZValues(true);

  sel.setArea(200, 200, 300, 300);
  const res = sel.select();
  // console.log(res[0].getProperties());
  // console.log(res[1].getProperties());
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

  gc.releaseResources();
});
