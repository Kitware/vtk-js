import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/All';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
import vtkPlaneSource from 'vtk.js/Sources/Filters/Sources/PlaneSource';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';
import controlPanel from './controlPanel.html';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0.33, 0.4, 0.4],
});
fullScreenRenderer.addController(controlPanel);
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

const sphereMapper = vtkMapper.newInstance();
const sphereSource = vtkSphereSource.newInstance({
  radius: 1.0,
  phiResolution: 30,
  thetaResolution: 30,
});
sphereMapper.setInputConnection(sphereSource.getOutputPort());
const sphereActor = vtkActor.newInstance();
sphereActor.setMapper(sphereMapper);
sphereActor.getProperty().setColor(1, 0, 1);

// Add a clipping plane to the scene
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

  const planeSource = vtkPlaneSource.newInstance({
    xResolution: 1,
    yResolution: 1,
    origin: corner,
    point1,
    point2,
  });

  const clipPlane = vtkPlane.newInstance({
    normal,
    origin,
  });

  const planeMapper = vtkMapper.newInstance();
  planeMapper.setInputConnection(planeSource.getOutputPort());
  const planeActor = vtkActor.newInstance();
  planeActor.setMapper(planeMapper);
  planeActor.getProperty().setOpacity(0.2);
  renderer.addActor(planeActor);

  sphereMapper.addClippingPlane(clipPlane);
}

renderer.addActor(sphereActor);

renderer.resetCamera();
renderWindow.render();

const numPlanes = 8;

const theta = (2 * Math.PI) / numPlanes;
const rotationMatrix = [
  [Math.cos(theta), Math.sin(theta), 0],
  [-Math.sin(theta), Math.cos(theta), 0],
  [0, 0, 1],
];
const normal = [1, 0, 0];
const origin = [0, 0, 0];

document.querySelector('.addClippingPlane').addEventListener('click', (e) => {
  vtkMath.multiplyAccumulate([0, 0, 0], normal, -0.8, origin);
  addClippingPlaneToScene(
    origin, // origin
    normal, // normal
    3 // scale
  );
  vtkMath.multiply3x3_vect3(rotationMatrix, normal, normal);
  renderWindow.render();
});

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.renderer = renderer;
global.renderWindow = renderWindow;
global.vtkMapper = vtkMapper;
global.vtkRenderWindow = vtkRenderWindow;
