import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkProperty from '@kitware/vtk.js/Rendering/Core/Property';
import vtkCamera from '@kitware/vtk.js/Rendering/Core/Camera';
import vtkPlanes from '@kitware/vtk.js/Common/DataModel/Planes';
import vtkFrustumSource from '@kitware/vtk.js/Filters/Sources/FrustumSource';
import vtkShrinkPolyData from '@kitware/vtk.js/Filters/General/ShrinkPolyData';
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

const frustum = vtkFrustumSource.newInstance();
const actor = vtkActor.newInstance();
const mapper = vtkMapper.newInstance();

const camera = vtkCamera.newInstance();
camera.setClippingRange(0.1, 0.4);

const planesArray = camera.getFrustumPlanes(1.0);
const planes = vtkPlanes.newInstance();
planes.setFrustumPlanes(planesArray);

frustum.setPlanes(planes);
frustum.setShowLines(false);

const backProperty = vtkProperty.newInstance();
backProperty.setColor(1, 1, 50 / 255);

const shrink = vtkShrinkPolyData.newInstance();
shrink.setShrinkFactor(0.9);
shrink.setInputConnection(frustum.getOutputPort());
mapper.setInputConnection(shrink.getOutputPort());
mapper.setScalarVisibility(false);
actor.setMapper(mapper);
actor.getProperty().setColor(255 / 255, 99 / 255, 71 / 255);
actor.getProperty().setEdgeVisibility(true);
actor.setBackfaceProperty(backProperty);
renderer.addActor(actor);

renderer.getActiveCamera().setPosition(1, 0, 0);
renderer.getActiveCamera().setFocalPoint(0, 0, 0);
renderer.getActiveCamera().setViewUp(0, 1, 0);
renderer.getActiveCamera().azimuth(30);
renderer.getActiveCamera().elevation(30);

renderer.resetCamera();
renderWindow.render();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

fullScreenRenderer.addController(controlPanel);

['showLines'].forEach((propertyName) => {
  document.querySelector(`.${propertyName}`).addEventListener('input', (e) => {
    const value = e.target.checked;
    frustum.set({ [propertyName]: value });
    renderWindow.render();
  });
});

['shrinkFactor'].forEach((propertyName) => {
  document.querySelector(`.${propertyName}`).addEventListener('input', (e) => {
    const value = Number(e.target.value);
    shrink.set({ [propertyName]: value });
    renderWindow.render();
  });
});
