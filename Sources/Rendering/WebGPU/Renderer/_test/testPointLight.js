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
const pointLight1 = vtkLight.newInstance({
  position: [0.0, 0.0, 0.5],
  color: [1, 1, 1],
  positional: true,
  intensity: 0.15,
  coneAngle: 90,
});
const pointLight2 = vtkLight.newInstance({
  position: [1.0, 0.0, 0.5],
  color: [1, 0, 0],
  positional: true,
  intensity: 0.05,
  coneAngle: 90,
});
const pointLight3 = vtkLight.newInstance({
  position: [0.0, 1.0, 0.5],
  color: [0, 1, 0],
  positional: true,
  intensity: 0.1,
  coneAngle: 90,
});
const pointLight4 = vtkLight.newInstance({
  position: [1.0, 1.0, 0.5],
  color: [0, 0, 1],
  positional: true,
  intensity: 0.075,
  coneAngle: 90,
});

renderer.addLight(pointLight1);
renderer.addLight(pointLight2);
renderer.addLight(pointLight3);
renderer.addLight(pointLight4);

renderer.addActor(actor);
renderer.resetCamera();
renderWindow.render();
