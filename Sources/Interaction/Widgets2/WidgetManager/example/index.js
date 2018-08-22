import 'vtk.js/Sources/favicon';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkSphereHandleRepresentation from 'vtk.js/Sources/Interaction/Widgets2/SphereHandleRepresentation';
import vtkCubeHandleRepresentation from 'vtk.js/Sources/Interaction/Widgets2/CubeHandleRepresentation';
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
const openGLRenderWindow = fullScreenRenderer.getOpenGLRenderWindow();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

// State
const compositeState = vtkStateBuilder
  .createBuilder()
  .add(['all', 'a', 'ab', 'ac'], 'sphere', 'a', {
    radius: 0.5,
    position: [-1, 0, 0],
  })
  .add(['all', 'b', 'ab', 'bc'], 'sphere', 'b', {
    radius: 0.5,
    position: [0, 0, 0],
  })
  .add(['all', 'c', 'bc', 'ac'], 'sphere', 'c', {
    radius: 0.5,
    position: [1, 0, 0],
  })
  .add(['all', 'd'], 'cube', 'd', {
    xLength: 0.5,
    yLength: 1,
    zLength: 2,
    position: [0, 0, 2],
  })
  .build();

// Representation
const widgetSphereRep = vtkSphereHandleRepresentation.newInstance();
widgetSphereRep.setInputData(compositeState);
widgetSphereRep.setLabels(['all']);
widgetSphereRep.getActors().forEach(renderer.addActor);

const widgetCubeRep = vtkCubeHandleRepresentation.newInstance();
widgetCubeRep.setInputData(compositeState);
widgetCubeRep.setLabels('all');
widgetCubeRep.getActors().forEach(renderer.addActor);

// const reps = { sphere: widgetSphereRep, cube: widgetCubeRep };

renderer.resetCamera();
renderWindow.render();

// ----------------------------------------------------------------------------
// Widget manager
// ----------------------------------------------------------------------------

const widgetManager = vtkWidgetManager.newInstance();
widgetManager.setRenderingContext(openGLRenderWindow, renderer);
widgetManager.capture();

// For now
renderer.getActiveCamera().onModified(widgetManager.capture);
renderWindow.getInteractor().onMouseMove(({ position }) => {
  widgetManager.updateSelectionFromXY(position.x, position.y);
});
// document
//   .querySelector('body')
//   .addEventListener('mousemouve', widgetManager.updateSelectionFromMouseEvent);

// setTimeout(() => {
//   console.log(widgetManager.getSelection());
// }, 5000);

setInterval(() => {
  const selection = (widgetManager.getSelection() || [])[0];
  if (selection) {
    const { propID, compositeID } = selection.getProperties();
    console.log(`Actor ${propID} - Item ${compositeID}`);
  }
}, 1000);
