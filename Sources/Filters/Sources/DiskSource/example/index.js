import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkDiskSource from '@kitware/vtk.js/Filters/Sources/DiskSource';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';

import GUI from 'lil-gui';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

const diskSource = vtkDiskSource.newInstance();
const actor = vtkActor.newInstance();
const mapper = vtkMapper.newInstance();

actor.setMapper(mapper);
actor.getProperty().setColor(1, 0, 0);
mapper.setInputConnection(diskSource.getOutputPort());

renderer.addActor(actor);

renderer.resetCamera();
renderWindow.render();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

const gui = new GUI();
const params = {
  innerRadius: 0.25,
  outerRadius: 0.5,
  radialResolution: 1,
  circumferentialResolution: 6,
};

gui
  .add(params, 'innerRadius', 0.0, 2.0, 0.1)
  .name('Inner radius')
  .onChange((value) => {
    diskSource.set({ innerRadius: Number(value) });
    renderWindow.render();
  });

gui
  .add(params, 'outerRadius', 0.5, 2.0, 0.1)
  .name('Outer radius')
  .onChange((value) => {
    diskSource.set({ outerRadius: Number(value) });
    renderWindow.render();
  });

gui
  .add(params, 'radialResolution', 1, 5, 1)
  .name('Radial resolution')
  .onChange((value) => {
    diskSource.set({ radialResolution: Number(value) });
    renderWindow.render();
  });

gui
  .add(params, 'circumferentialResolution', 6, 100, 1)
  .name('Circumferential resolution')
  .onChange((value) => {
    diskSource.set({ circumferentialResolution: Number(value) });
    renderWindow.render();
  });
