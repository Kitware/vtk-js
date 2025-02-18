import test from 'tape';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import 'vtk.js/Sources/Rendering/OpenGL/Camera';
import 'vtk.js/Sources/Rendering/OpenGL/Renderer';
import 'vtk.js/Sources/Rendering/OpenGL/Actor';
import 'vtk.js/Sources/Rendering/OpenGL/PolyDataMapper';

import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import { FieldAssociations } from 'vtk.js/Sources/Common/DataModel/DataSet/Constants';

// Feb 2025: Github Actions takes a long time to render this dataset,
// so it could be flaky.
test('Test HardwareSelector', (tapeContext) => {
  const gc = testUtils.createGarbageCollector(tapeContext);
  tapeContext.ok('rendering', 'vtkHardwareSelector TestHardwareSelector');

  // Create some control UI
  const container = document.querySelector('body');
  const renderWindowContainer = gc.registerDOMElement(
    document.createElement('div')
  );
  container.appendChild(renderWindowContainer);

  // Create a polydata with many cells to force high24 pass
  // 17 million vert cells and one poly cell (a triangle)
  const bigPolydata = gc.registerResource(vtkPolyData.newInstance());
  const numberOfVerts = 17_000_000;
  // Points of the triangle
  const pointsData = Float32Array.from([
    ...[0, 0, 0],
    ...[1, 0, 0], // This point will be also for verts
    ...[0.5, 0.7, 0],
  ]);
  bigPolydata.getPoints().setData(pointsData, 3);
  // The triangle cell
  const polysData = Uint32Array.from([3, 0, 1, 2]);
  bigPolydata.getPolys().setData(polysData, 1);
  // The vert cells, all using the point of index 1
  const vertsData = new Uint32Array(2 * numberOfVerts);
  vertsData.fill(1);
  bigPolydata.getVerts().setData(vertsData, 1);

  // Setup the rest of the rendering pipeline, from mapper to OpenGL render window
  const mapper = gc.registerResource(vtkMapper.newInstance());
  mapper.setInputData(bigPolydata);

  const actor = gc.registerResource(vtkActor.newInstance());
  actor.setMapper(mapper);

  const renderer = gc.registerResource(vtkRenderer.newInstance());
  renderer.setBackground(0.32, 0.34, 0.43);
  renderer.addActor(actor);

  const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());
  renderWindow.addRenderer(renderer);

  const glwindow = gc.registerResource(renderWindow.newAPISpecificView());
  glwindow.setContainer(renderWindowContainer);
  glwindow.setSize(400, 400);
  renderWindow.addView(glwindow);

  // Render to make set up the rendering pipeline
  renderWindow.render();

  // Selector
  const selector = glwindow.getSelector();
  selector.setFieldAssociation(FieldAssociations.FIELD_ASSOCIATION_CELLS);
  selector.setCaptureZValues(false);
  selector.attach(glwindow, renderer);
  selector.setArea(200, 200, 200, 200);

  const bufferCaptured = selector.captureBuffers();
  tapeContext.ok(bufferCaptured, 'Selector captured buffer');

  const info = selector.getPixelInformation([200, 200], 0, [0, 0]);
  tapeContext.equal(info?.attributeID, numberOfVerts, 'Last triangle picked');

  gc.releaseResources();
});
