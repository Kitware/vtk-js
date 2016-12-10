import vtkFullScreenRenderWindow  from '../../../../../Sources/Testing/FullScreenRenderWindow';

import vtkActor                   from '../../../../../Sources/Rendering/Core/Actor';
import vtkSphereSource            from '../../../../../Sources/Filters/Sources/SphereSource';
import vtkMapper                  from '../../../../../Sources/Rendering/Core/Mapper';

import controlPanel from './controlPanel.html';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({ background: [0, 0, 0] });
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

fullScreenRenderer.addController(controlPanel);

['radius', 'thetaResolution', 'startTheta', 'endTheta', 'phiResolution', 'startPhi', 'endPhi'].forEach((propertyName) => {
  document.querySelector(`.${propertyName}`).addEventListener('input', (e) => {
    const value = Number(e.target.value);
    sphereSource.set({ [propertyName]: value });
    renderWindow.render();
  });
});

document.querySelector('.edgeVisibility').addEventListener('change', (e) => {
  const edgeVisibility = !!(e.target.checked);
  actor.getProperty().setEdgeVisibility(edgeVisibility);
  renderWindow.render();
});
