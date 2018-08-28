import 'vtk.js/Sources/favicon';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkHandleWidget2 from 'vtk.js/Sources/Widgets/Widgets3D/HandleWidget2';
import vtkWidgetManager from 'vtk.js/Sources/Widgets/Core/WidgetManager';

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

const masterWidgets = [];
const NB_HANDLES = 50;
for (let i = 0; i < NB_HANDLES; i++) {
  const widget = vtkHandleWidget2.newInstance();
  const viewWidget = widgetManager.registerWidget(widget);
  masterWidgets.push(widget);

  // console.log(
  //   widget.getWidgetForView({ viewId: widgetManager.getViewId() }) ===
  //     viewWidget
  // );

  viewWidget.getRepresentations().forEach((rep) => {
    rep.setGlyphResolution(12);
    rep.setActiveScaleFactor(0.5);
  });

  const localState = widget.getWidgetState().getHandle();
  localState.setOrigin(
    Math.random() * Math.sqrt(NB_HANDLES),
    Math.random() * Math.sqrt(NB_HANDLES),
    0
  );
  localState.setScale1(0.75 + 0.25 * Math.random());
  localState.setColor(Math.random() - 0.2); // Noone can get the active color 1.
}

renderer.resetCamera();
renderWindow.render();
widgetManager.enablePicking();

setInterval(() => {
  if (masterWidgets.length) {
    widgetManager.unregisterWidget(masterWidgets.pop());
  }
}, 2000);

setInterval(() => {
  widgetManager.getWidgets();
  if (widgetManager.getWidgets().length) {
    widgetManager.unregisterWidget(widgetManager.getWidgets()[0]);
  }
}, 3000);
