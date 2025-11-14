import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkArcSource from '@kitware/vtk.js/Filters/Sources/ArcSource';
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

const arcSource = vtkArcSource.newInstance();
const actor = vtkActor.newInstance();
const mapper = vtkMapper.newInstance();

mapper.setInputConnection(arcSource.getOutputPort());
actor.setMapper(mapper);

renderer.addActor(actor);
renderer.resetCamera();
renderWindow.render();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

const gui = new GUI();
const params = {
  angle: 90.0,
  resolution: 6,
  useNormalAndAngle: false,
};

gui
  .add(params, 'angle', 0.5, 360.0, 0.1)
  .name('Angle')
  .onChange((value) => {
    arcSource.set({ angle: Number(value) });
    renderer.resetCamera();
    renderWindow.render();
  });

gui
  .add(params, 'resolution', 1, 100, 1)
  .name('Resolution')
  .onChange((value) => {
    arcSource.set({ resolution: Number(value) });
    renderer.resetCamera();
    renderWindow.render();
  });

gui
  .add(params, 'useNormalAndAngle')
  .name('Use normal and angle')
  .onChange((value) => {
    arcSource.set({ useNormalAndAngle: !!value });
    renderer.resetCamera();
    renderWindow.render();
  });
