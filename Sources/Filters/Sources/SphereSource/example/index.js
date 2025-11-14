import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkSphereSource from '@kitware/vtk.js/Filters/Sources/SphereSource';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';

import GUI from 'lil-gui';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

const sphereSource = vtkSphereSource.newInstance();
const actor = vtkActor.newInstance();
const mapper = vtkMapper.newInstance();

actor.getProperty().setEdgeVisibility(true);

mapper.setInputConnection(sphereSource.getOutputPort());
actor.setMapper(mapper);

renderer.addActor(actor);
renderer.resetCamera();
renderWindow.render();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

const gui = new GUI();
const params = {
  radius: 1.0,
  thetaResolution: 8,
  startTheta: 0,
  endTheta: 360,
  phiResolution: 8,
  startPhi: 0,
  endPhi: 180,
  edgeVisibility: true,
};

gui
  .add(params, 'radius', 0.5, 2.0, 0.1)
  .name('Radius')
  .onChange((value) => {
    sphereSource.set({ radius: Number(value) });
    renderWindow.render();
  });

gui
  .add(params, 'thetaResolution', 4, 100, 1)
  .name('Theta resolution')
  .onChange((value) => {
    sphereSource.set({ thetaResolution: Number(value) });
    renderWindow.render();
  });

gui
  .add(params, 'startTheta', 0, 360, 1)
  .name('Start theta')
  .onChange((value) => {
    sphereSource.set({ startTheta: Number(value) });
    renderWindow.render();
  });

gui
  .add(params, 'endTheta', 0, 360, 1)
  .name('End theta')
  .onChange((value) => {
    sphereSource.set({ endTheta: Number(value) });
    renderWindow.render();
  });

gui
  .add(params, 'phiResolution', 4, 100, 1)
  .name('Phi resolution')
  .onChange((value) => {
    sphereSource.set({ phiResolution: Number(value) });
    renderWindow.render();
  });

gui
  .add(params, 'startPhi', 0, 180, 1)
  .name('Start phi')
  .onChange((value) => {
    sphereSource.set({ startPhi: Number(value) });
    renderWindow.render();
  });

gui
  .add(params, 'endPhi', 0, 180, 1)
  .name('End phi')
  .onChange((value) => {
    sphereSource.set({ endPhi: Number(value) });
    renderWindow.render();
  });

gui
  .add(params, 'edgeVisibility')
  .name('Edge visibility')
  .onChange((value) => {
    actor.getProperty().setEdgeVisibility(!!value);
    renderWindow.render();
  });
