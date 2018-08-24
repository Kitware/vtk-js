import 'vtk.js/Sources/favicon';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkBoxWidget from 'vtk.js/Sources/Interaction/Widgets2/BoxWidget';
import vtkWidgetManager from 'vtk.js/Sources/Interaction/Widgets2/WidgetManager';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();
const openGLRenderWindow = fullScreenRenderer.getOpenGLRenderWindow();

// ----------------------------------------------------------------------------
// Widget manager
// ----------------------------------------------------------------------------

const widgetManager = vtkWidgetManager.newInstance();
widgetManager.setRenderingContext(openGLRenderWindow, renderer);

const widget = vtkBoxWidget.newInstance();
const viewWidget = widgetManager.registerWidget(widget);

renderer.resetCamera();
renderWindow.render();
widgetManager.enablePicking();

global.viewWidget = viewWidget;
