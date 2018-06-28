import 'vtk.js/Sources/favicon';

import vtkDistanceWidget from 'vtk.js/Sources/Interaction/Widgets/DistanceWidget';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';

import controlPanel from './controlPanel.html';

// ----------------------------------------------------------------------------
// USER AVAILABLE INTERACTIONS
// ----------------------------------------------------------------------------
// Sphere can be translated by clicking with mouse left on it
// Sphere can be scaled by clicking with mouse right

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();
renderWindow.getInteractor().setInteractorStyle(null);

// ----------------------------------------------------------------------------
// Create widget
// ----------------------------------------------------------------------------

const widget = vtkDistanceWidget.newInstance();
widget.setInteractor(renderWindow.getInteractor());
widget.setEnabled(1);
widget.setWidgetStateToStart();

renderer.resetCamera();
renderer.resetCameraClippingRange();
renderWindow.render();

fullScreenRenderer.addController(controlPanel);

document.querySelector('.visibility').addEventListener('change', (e) => {
  const representation = widget.getWidgetRep();
  if (representation) {
    representation.setLabelVisibility(e.target.checked);
    renderWindow.render();
  }
});

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.renderer = renderer;
global.renderWindow = renderWindow;
global.widget = widget;
