import test               from 'tape-catch';

import vtkAppendPolyData  from 'vtk.js/Sources/Filters/General/AppendPolyData';
import vtkConeSource      from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkCylinderSource  from 'vtk.js/Sources/Filters/Sources/CylinderSource';

import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';

const PointPrecision = vtkAppendPolyData;

test('Test vtkAppendPolyData instance', (t) => {
  t.ok(vtkAppendPolyData, 'Make sure the class definition exists.');
  const instance = vtkAppendPolyData.newInstance();
  t.ok(instance, 'Make sure an instance can be created.');

  t.end();
});

test('Test vtkAppendPolyData execution', (t) => {
  const cone = vtkConeSource.newInstance({ resolution: 6, capping: true });
  const cylinder = vtkCylinderSource.newInstance({ resolution: 6, capping: true });
  const filter = vtkAppendPolyData.newInstance();
  filter.setInputConnection(cone.getOutputPort(), 0);
  filter.addInputConnection(cylinder.getOutputPort());
  filter.setOutputPointsPrecision(PointPrecision.DEFAULT);

  const outPD = filter.getOutputData();

  t.ok((outPD.getPoints().getNumberOfPoints() === 31),
      'Make sure the number of points is correct.');
  t.ok((outPD.getPoints().getDataType() === VtkDataTypes.FLOAT),
       'Make sure the output data type is correct.');
  const expNumPolys = [cone, cylinder].reduce(
    (count, c) => count + c.getOutputData().getPolys().getNumberOfCells(), 0,
  );
  const outNumPolys = outPD.getPolys().getNumberOfCells();
  t.ok((outNumPolys === expNumPolys),
       'Make sure the number of polys is correct.');

  t.end();
});

test.onlyIfWebGL('Test vtkAppendPolyData rendering', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('rendering', 'vtkAppendPolyData Rendering');

  // Create some control UI
  const container = document.querySelector('body');
  const renderWindowContainer = gc.registerDOMElement(document.createElement('div'));
  container.appendChild(renderWindowContainer);

  // create what we will view
  const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());
  const renderer = gc.registerResource(vtkRenderer.newInstance());
  renderWindow.addRenderer(renderer);
  renderer.setBackground(0.32, 0.34, 0.43);

  const actor = gc.registerResource(vtkActor.newInstance());
  renderer.addActor(actor);

  const mapper = gc.registerResource(vtkMapper.newInstance());
  actor.setMapper(mapper);

  const plane = vtkPlaneSource.newInstance({ xResolution: 5, yResolution: 10 });
  const plane2 = vtkPlaneSource.newInstance({ xResolution: 10, yResolution: 5 });
  plane2.setOrigin(0.5, 0, -0.5);
  plane2.setPoint1(0.5, 0, 0.5);
  plane2.setPoint2(0.5, 1, -0.5);

  const filter = vtkAppendPolyData.newInstance();
  filter.setInputConnection(plane.getOutputPort());
  filter.addInputConnection(plane2.getOutputPort());
  mapper.setInputConnection(filter.getOutputPort());

  // now create something to view it, in this case webgl
  const glwindow = gc.registerResource(vtkOpenGLRenderWindow.newInstance());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  const camera = renderer.getActiveCamera();
  camera.yaw(40);
  camera.roll(40);
  camera.azimuth(40);
  renderer.resetCamera();

  const image = glwindow.captureImage();
  testUtils.compareImages(image, [baseline], 'Filters/General/AppendPolyData/testAppendPolyData', t, 2.5, gc.releaseResources);
});
