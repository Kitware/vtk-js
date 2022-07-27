import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Geometry';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkLight from 'vtk.js/Sources/Rendering/Core/Light';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

const sphere = vtkSphereSource.newInstance({
  center: [0, 0, 0],
  thetaResolution: 32,
  phiResolution: 16,
});

const mapper = vtkMapper.newInstance();
mapper.setInputConnection(sphere.getOutputPort());

const actor = vtkActor.newInstance();

actor.getProperty().setRoughness(0.3);
actor.setMapper(mapper);

// -----------------------------------------------------------
// Lights
// -----------------------------------------------------------
const sunLight1 = vtkLight.newInstance({
  position: [10000, 0, 0],
  color: [1, 1, 1],
  positional: false,
  intensity: 0.5,
});
sunLight1.setDirection([1, 0, 0.8]);
const sunLight2 = vtkLight.newInstance({
  position: [0, 10000, 0],
  color: [1, 0, 0],
  positional: false,
  intensity: 0.5,
});
sunLight2.setDirection([0.7, 1, 0]);
const sunLight3 = vtkLight.newInstance({
  position: [10000, 0, 10000],
  color: [0, 1, 0],
  positional: false,
  intensity: 0.5,
});
sunLight3.setDirection([-1, 0, -0.8]);
const sunLight4 = vtkLight.newInstance({
  position: [0, 10000, 10000],
  color: [0, 0, 1],
  positional: false,
  intensity: 0.5,
});
sunLight4.setDirection([-0.5, -1, -0.8]);

renderer.addLight(sunLight1);
renderer.addLight(sunLight2);
renderer.addLight(sunLight3);
renderer.addLight(sunLight4);

renderer.addActor(actor);
renderer.resetCamera();
renderWindow.render();
