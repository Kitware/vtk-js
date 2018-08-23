import 'vtk.js/Sources/favicon';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkHandleWidget2 from 'vtk.js/Sources/Interaction/Widgets2/HandleWidget2';
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

for (let i = 0; i < 50; i++) {
  const widget = vtkHandleWidget2.newInstance();
  widget
    .getRepresentationsForViewType(0)
    .forEach((rep) => rep.setGlyphResolution(30));
  widgetManager.registerWidget(widget);

  const localState = widget.getWidgetState().getHandle();
  localState.setPosition(Math.random(), Math.random(), Math.random());
  localState.setRadius(0.5 + Math.random());
  localState.setColor(Math.random());
}

renderer.resetCamera();
renderWindow.render();
