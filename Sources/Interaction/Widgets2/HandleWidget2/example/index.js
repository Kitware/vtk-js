import 'vtk.js/Sources/favicon';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkHandleWidget from 'vtk.js/Sources/Interaction/Widgets2/HandleWidget2';

// ----------------------------------------------------------------------------
// USER AVAILABLE INTERACTIONS
// ----------------------------------------------------------------------------
// Sphere can be translated by clicking with mouse left on it

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Create widget
// ----------------------------------------------------------------------------
const widget = vtkHandleWidget.newInstance();
widget.setInteractor(renderWindow.getInteractor());
widget.setEnabled(true);

renderWindow.render();

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.renderer = renderer;
global.renderWindow = renderWindow;
global.widget = widget;
