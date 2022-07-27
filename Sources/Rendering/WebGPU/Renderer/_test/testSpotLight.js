import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Geometry';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkLight from 'vtk.js/Sources/Rendering/Core/Light';
import vtkPlaneSource from 'vtk.js/Sources/Filters/Sources/PlaneSource';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

const plane = vtkPlaneSource.newInstance({
  center: [0, 0, 0],
});

const mapper = vtkMapper.newInstance();
mapper.setInputConnection(plane.getOutputPort());

const actor = vtkActor.newInstance();
actor.setOrigin(0.5, 0.5, 0);
actor.rotateZ(45);
actor.setScaleFrom([2, 2, 1]);

actor.getProperty().setRoughness(0.3);
actor.setMapper(mapper);

// -----------------------------------------------------------
// Lights
// -----------------------------------------------------------
const spotLight1 = vtkLight.newInstance({
  position: [0.0, 0.0, 0.2],
  color: [1, 1, 1],
  positional: true,
  intensity: 0.09,
  coneAngle: 60,
  coneFalloff: 5,
});
spotLight1.setDirection([-0.8, -0.8, 1]);
const spotLight2 = vtkLight.newInstance({
  position: [1.0, 0.0, 0.5],
  color: [1, 0, 0],
  positional: true,
  intensity: 0.11,
  coneAngle: 45,
  coneFalloff: 10,
});
spotLight2.setDirection([0.5, -0.5, 1]);
const spotLight3 = vtkLight.newInstance({
  position: [0.0, 1.0, 0.5],
  color: [0, 1, 0],
  positional: true,
  intensity: 0.12,
  coneAngle: 30,
  coneFalloff: 15,
});
spotLight3.setDirection([-0.2, 0.2, 1]);
const spotLight4 = vtkLight.newInstance({
  position: [1.0, 1.0, 0.5],
  color: [0, 0, 1],
  positional: true,
  intensity: 0.075,
  coneAngle: 15,
  coneFalloff: 20,
});
spotLight4.setDirection([0.1, 0.1, 1]);

renderer.addLight(spotLight1);
renderer.addLight(spotLight2);
renderer.addLight(spotLight3);
renderer.addLight(spotLight4);

renderer.addActor(actor);
renderer.resetCamera();
renderWindow.render();
