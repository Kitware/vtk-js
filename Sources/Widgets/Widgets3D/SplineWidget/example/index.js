import 'vtk.js/Sources/favicon';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkSplineWidget from 'vtk.js/Sources/Widgets/Widgets3D/SplineWidget';
import vtkWidgetManager from 'vtk.js/Sources/Widgets/Core/WidgetManager';

import controlPanel from './controlPanel.html';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();

// ----------------------------------------------------------------------------
// Widget manager
// ----------------------------------------------------------------------------

const widgetManager = vtkWidgetManager.newInstance();
widgetManager.setRenderer(renderer);

const widget = vtkSplineWidget.newInstance();

widgetManager.addWidget(widget);

renderer.resetCamera();
widgetManager.enablePicking();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

fullScreenRenderer.addController(controlPanel);

document.querySelector('button').addEventListener('click', () => {
  widgetManager.grabFocus(widget);
});
