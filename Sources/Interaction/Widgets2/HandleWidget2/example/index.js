import 'vtk.js/Sources/favicon';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkHandleWidget from 'vtk.js/Sources/Interaction/Widgets2/HandleWidget2';
import vtkPlanePointManipulator from 'vtk.js/Sources/Interaction/Widgets2/PlanePointManipulator';
import vtkStateBuilder from 'vtk.js/Sources/Interaction/Widgets2/StateBuilder';
import vtkWidgetManager from 'vtk.js/Sources/Interaction/Widgets2/WidgetManager';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();
const interactor = renderWindow.getInteractor();
const openGLRenderWindow = fullScreenRenderer.getOpenGLRenderWindow();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

// State
const compositeState = vtkStateBuilder
  .createBuilder()
  .add(['all', 'a'], 'sphere', 'a', {
    radius: 0.5,
    position: [0, 0, 0],
  })
  .build();

renderer.resetCamera();
renderWindow.render();

// Manipulator
const planePointManipulator = vtkPlanePointManipulator.newInstance();
planePointManipulator.setPlaneNormal(0, 0, 1);
planePointManipulator.setPlaneOrigin(0, 0, 0);

// Widget
const handleWidget = vtkHandleWidget.newInstance({
  manipulator: planePointManipulator,
});
handleWidget.setInteractor(interactor);

// Widget manager
const widgetManager = vtkWidgetManager.newInstance();
widgetManager.setRenderingContext(openGLRenderWindow, renderer);
widgetManager.capture();
widgetManager.registerWidget(handleWidget);

// -----------------------------------------------------------
// Interaction events
// -----------------------------------------------------------

compositeState.onModified(() => {
  renderer.resetCameraClippingRange();
  interactor.render();
});
