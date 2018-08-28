import 'vtk.js/Sources/favicon';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkHandleWidget from 'vtk.js/Sources/Widgets/Widgets3D/HandleWidget2';
import vtkWidgetManager from 'vtk.js/Sources/Widgets/Core/WidgetManager';
import { Type } from 'vtk.js/Sources/Widgets/Widgets3D/HandleWidget2/Constants';

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
// Example code
// ----------------------------------------------------------------------------

// Widget manager
const widgetManager = vtkWidgetManager.newInstance();
widgetManager.setRenderingContext(openGLRenderWindow, renderer);

// Widget
const handleWidget = vtkHandleWidget.newInstance();
handleWidget.setType(Type.Drag);

widgetManager.registerWidget(handleWidget);

renderer.resetCamera();
renderWindow.render();
