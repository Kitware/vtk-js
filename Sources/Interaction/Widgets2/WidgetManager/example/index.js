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

const w1 = vtkHandleWidget2.newInstance();
const w2 = vtkHandleWidget2.newInstance();
w1
  .getWidgetState()
  .getHandle()
  .setPosition(-1, 0, 0);
w2
  .getWidgetState()
  .getHandle()
  .setPosition(1, 0, 0);
widgetManager.registerWidget(w1);
widgetManager.registerWidget(w2);

setInterval(() => {
  const {
    selectedState,
    propID,
    compositeID,
    widget,
  } = widgetManager.getSelectedData();
  if (selectedState) {
    widget.getWidgetState().activateOnly(selectedState);
    console.log(`propID(${propID}) - compositeID(${compositeID})`);
    renderWindow.render();
  } else {
    widgetManager
      .getWidgets()
      .forEach((w) => w.getWidgetState().desactivateAll());
  }
}, 100);

renderer.resetCamera();
renderWindow.render();
