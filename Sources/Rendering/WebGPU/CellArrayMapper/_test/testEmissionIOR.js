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

for (let x = 0; x < 5; x++) {
  for (let y = 0; y < 5; y++) {
    const sphere = vtkSphereSource.newInstance({
      center: [0, 0, 0],
      thetaResolution: 32,
      phiResolution: 16,
    });
    const mapper = vtkMapper.newInstance();
    mapper.setInputConnection(sphere.getOutputPort());

    const actor = vtkActor.newInstance();
    actor.setPosition(x * 1.2, y * 1.2, 0);
    actor.getProperty().setEmission(x / 5);
    actor.getProperty().setBaseIOR(1 + (y + 1) / 3);
    actor.setMapper(mapper);

    renderer.addActor(actor);
  }
}

const sunLight1 = vtkLight.newInstance({
  color: [1, 0.8, 0.7],
  positional: false,
  intensity: 0.7,
});
sunLight1.setDirection([1, 0, 0.2]);
const sunLight2 = vtkLight.newInstance({
  color: [1, 0.3, 0.4],
  positional: false,
  intensity: 0.5,
});
sunLight2.setDirection([0.9, 0.8, -0.3]);
const sunLight3 = vtkLight.newInstance({
  color: [0.2, 0.4, 1],
  positional: false,
  intensity: 0.5,
});
sunLight3.setDirection([-0.9, 0, -0.6]);

renderer.addLight(sunLight1);
renderer.addLight(sunLight2);
renderer.addLight(sunLight3);
renderer.resetCamera();
renderWindow.render();
