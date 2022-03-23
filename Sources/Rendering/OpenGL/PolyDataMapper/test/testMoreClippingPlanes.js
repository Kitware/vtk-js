import test from 'tape-catch';

import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
import vtkPlaneSource from 'vtk.js/Sources/Filters/Sources/PlaneSource';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';
import testUtils from 'vtk.js/Sources/Testing/testUtils';
import baseline from './testMoreClippingPlanes.png';

test('Test PolyDataMapper Clipping Planes 2', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  // TODO switch back to onlyIfWebGL
  // Create some control UI
  const container = document.querySelector('body');
  const renderWindowContainer = gc.registerDOMElement(
    document.createElement('div')
  );
  container.appendChild(renderWindowContainer);

  // Create what we will view
  const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());
  const renderer = gc.registerResource(vtkRenderer.newInstance());
  renderWindow.addRenderer(renderer);
  renderer.setBackground(0.32, 0.34, 0.43);

  // The rest is pretty much a static test version of the interactive example _MeshClipPlane

  const sphereMapper = gc.registerResource(vtkMapper.newInstance());
  const sphereSource = gc.registerResource(
    vtkSphereSource.newInstance({
      radius: 1.0,
      phiResolution: 30,
      thetaResolution: 30,
    })
  );
  sphereMapper.setInputConnection(sphereSource.getOutputPort());
  const sphereActor = gc.registerResource(vtkActor.newInstance());
  sphereActor.setMapper(sphereMapper);
  sphereActor.getProperty().setColor(1, 0, 1);

  // This function adds a clipping plane to the scene
  // The center of the plane will be `origin`
  // The normal direction of the plane is `normal`; it's okay if it's not a unit vector
  // `scale` is the size of the plane, i.e. the side length of the square that is created
  function addClippingPlaneToScene(origin, normal, scale) {
    vtkMath.normalize(normal);

    const dir1 = [];
    const dir2 = [];
    vtkMath.perpendiculars(normal, dir1, dir2, 0);

    const corner = [];
    vtkMath.multiplyAccumulate(origin, dir1, -0.5 * scale, corner);
    vtkMath.multiplyAccumulate(corner, dir2, -0.5 * scale, corner);

    const point1 = [];
    const point2 = [];
    vtkMath.multiplyAccumulate(corner, dir1, scale, point1);
    vtkMath.multiplyAccumulate(corner, dir2, scale, point2);

    const planeSource = gc.registerResource(
      vtkPlaneSource.newInstance({
        xResolution: 1,
        yResolution: 1,
        origin: corner,
        point1,
        point2,
      })
    );

    const clipPlane = gc.registerResource(
      vtkPlane.newInstance({
        normal,
        origin,
      })
    );

    const planeMapper = gc.registerResource(vtkMapper.newInstance());
    planeMapper.setInputConnection(planeSource.getOutputPort());
    const planeActor = gc.registerResource(vtkActor.newInstance());
    planeActor.setMapper(planeMapper);
    planeActor.getProperty().setOpacity(0.2);
    renderer.addActor(planeActor);

    sphereMapper.addClippingPlane(clipPlane);
  }

  renderer.addActor(sphereActor);

  const numPlanes = 8;

  const theta = (2 * Math.PI) / numPlanes;
  const rotationMatrix = [
    [Math.cos(theta), Math.sin(theta), 0],
    [-Math.sin(theta), Math.cos(theta), 0],
    [0, 0, 1],
  ];
  const normal = [1, 0, 0];
  const origin = [0, 0, 0];

  const glwindow = gc.registerResource(vtkOpenGLRenderWindow.newInstance());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  // Render once without any clipping planes present
  // Hopefully when we render again below, the shader will be
  // rebuilt because we added clipping planes.
  renderer.resetCamera();
  renderWindow.render();

  for (let i = 0; i < 7; ++i) {
    vtkMath.multiplyAccumulate([0, 0, 0], normal, -0.8, origin);
    addClippingPlaneToScene(
      origin, // origin
      normal, // normal
      3 // scale
    );
    vtkMath.multiply3x3_vect3(rotationMatrix, normal, normal);
  }

  glwindow.captureNextImage().then((image) => {
    testUtils.compareImages(
      image,
      [baseline],
      'TestMoreClippingPlanes',
      t,
      2,
      gc.releaseResources
    );
  });
  renderWindow.render();
});
