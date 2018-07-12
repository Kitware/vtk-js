import 'vtk.js/Sources/favicon';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkLineWidget from 'vtk.js/Sources/Interaction/Widgets/LineWidget';

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

const widget = vtkLineWidget.newInstance();
widget.setInteractor(renderWindow.getInteractor());
widget.setEnabled(1);
widget.setWidgetStateToStart();

renderer.resetCamera();
renderer.resetCameraClippingRange();
renderWindow.render();

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.renderer = renderer;
global.renderWindow = renderWindow;
global.widget = widget;
