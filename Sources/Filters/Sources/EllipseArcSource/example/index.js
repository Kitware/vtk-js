import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkEllipseArcSource from '@kitware/vtk.js/Filters/Sources/EllipseArcSource';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';

import controlPanel from './controlPanel.html';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

const arcSource = vtkEllipseArcSource.newInstance();
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

fullScreenRenderer.addController(controlPanel);

['startAngle', 'segmentAngle', 'resolution', 'ratio'].forEach(
  (propertyName) => {
    document
      .querySelector(`.${propertyName}`)
      .addEventListener('input', (e) => {
        const value = Number(e.target.value);
        arcSource.set({ [propertyName]: value });
        renderer.resetCamera();
        renderWindow.render();
      });
  }
);

document.querySelector('.close').addEventListener('change', (e) => {
  const value = e.target.checked;
  arcSource.set({ close: value });
  renderer.resetCamera();
  renderWindow.render();
});
