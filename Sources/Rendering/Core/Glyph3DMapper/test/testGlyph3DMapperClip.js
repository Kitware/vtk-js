import test from 'tape';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkGlyph3DMapper from 'vtk.js/Sources/Rendering/Core/Glyph3DMapper';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';

import baseline from './testGlyph3DMapperClip.png';

test.onlyIfWebGL('Test vtkGlyph3DMapper Clipping', (t) => {
  const gc = testUtils.createGarbageCollector();
  t.ok('rendering', 'vtkGlyph3DMapper Clipping');

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

  const coneSource = vtkConeSource.newInstance({
    resolution: 12,
  });
  const sphereSource = vtkSphereSource.newInstance({
    radius: 5.0,
    phiResolution: 8,
    thetaResolution: 8,
  });
  sphereSource.update();

  const points = sphereSource.getOutputData();
  const numPoints = points.getNumberOfPoints();

  // Create scalars to color the glyphs
  const scalars = new Float32Array(numPoints);

  vtkMath.randomSeed(9290391);
  for (let i = 0; i < numPoints; i++) {
    // Assign a random scalar value for coloring
    scalars[i] = vtkMath.random();
  }

  // Add the scalar array to the point data
  points.getPointData().setScalars(
    vtkDataArray.newInstance({
      name: 'scalars',
      values: scalars,
    })
  );
  const mapper = vtkGlyph3DMapper.newInstance();
  const actor = vtkActor.newInstance();

  mapper.setInputConnection(sphereSource.getOutputPort(), 0);

  mapper.setInputConnection(coneSource.getOutputPort(), 1);
  mapper.setOrientationArray('Normals');
  mapper.setScaleFactor(2);

  const pdMapper = vtkMapper.newInstance();
  pdMapper.setInputConnection(sphereSource.getOutputPort());
  const pdActor = vtkActor.newInstance();
  pdActor.setMapper(pdMapper);
  pdActor.getProperty().setOpacity(0.6);

  // clipping planes
  const plane = vtkPlane.newInstance({
    origin: [0, 0, 0],
    normal: [0.5, -0.5, -0.5],
  });
  mapper.setClippingPlanes(plane);
  pdMapper.setClippingPlanes(plane);

  actor.setMapper(mapper);
  renderer.addActor(actor);
  renderer.addActor(pdActor);
  renderer.resetCamera();
  renderer.getActiveCamera().zoom(1.3);

  // now create something to view it, in this case webgl
  const glwindow = gc.registerResource(renderWindow.newAPISpecificView());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  renderWindow.render();

  const promise = glwindow
    .captureNextImage()
    .then((image) =>
      testUtils.compareImages(
        image,
        [baseline],
        'Rendering/Core/Glyph3DMapper/testGlyph3DMapperClip',
        t,
        1.0
      )
    )
    .finally(gc.releaseResources);
  renderWindow.render();
  return promise;
});
