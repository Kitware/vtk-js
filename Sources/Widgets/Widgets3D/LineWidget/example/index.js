import 'vtk.js/Sources/favicon';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkCubeSource from 'vtk.js/Sources/Filters/Sources/CubeSource';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkLineWidget from 'vtk.js/Sources/Widgets/Widgets3D/LineWidget';
import vtkWidgetManager from 'vtk.js/Sources/Widgets/Core/WidgetManager';

import controlPanel from './controlPanel.html';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

const cube = vtkCubeSource.newInstance();
const mapper = vtkMapper.newInstance();
const actor = vtkActor.newInstance();

actor.setMapper(mapper);
mapper.setInputConnection(cube.getOutputPort());
actor.getProperty().setOpacity(0.5);

renderer.addActor(actor);

// ----------------------------------------------------------------------------
// Widget manager
// ----------------------------------------------------------------------------

const widgetManager = vtkWidgetManager.newInstance();
widgetManager.setRenderer(renderer);

const widget = vtkLineWidget.newInstance();
widget.placeWidget(cube.getOutputData().getBounds());

let lineWidget = widgetManager.addWidget(widget);

renderer.resetCamera();
widgetManager.enablePicking();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

fullScreenRenderer.addController(controlPanel);

document.querySelector('#focus').addEventListener('click', () => {
  widgetManager.grabFocus(widget);
});

// Text Modifiers ------------------------------------------

function updateText() {
  const input = document.getElementById('txtIpt').value;
  lineWidget.setText(input);
  renderWindow.render();
}
document.querySelector('#txtIpt').addEventListener('keyup', updateText);
updateText();

function updateLinePos() {
  const input = document.getElementById('linePos').value;
  lineWidget.setPositionOnLine(input / 100);
  renderWindow.render();
}
document.querySelector('#linePos').addEventListener('input', updateLinePos);
updateLinePos();

// Handle Sources ------------------------------------------
function updateHandleShape(handleId) {
  const e = document.getElementById(`idh${handleId}`);
  const shape = e.options[e.selectedIndex].value;
  if (handleId === 1) {
    lineWidget.getWidgetState().setHandle1Shape(shape);
  } else {
    lineWidget.getWidgetState().setHandle2Shape(shape);
  }
  widget.initializeHandleRepresentations();
  widget.getRepresentationsForViewType(0);
  widgetManager.removeWidget(widget);
  lineWidget = widgetManager.addWidget(widget);
  widgetManager.getWidgets()[0].updateHandleDirections();
  lineWidget
    .getRepresentations()[0]
    .setHandleVisibility(lineWidget.getWidgetState().getHandle1Visibility());
  lineWidget
    .getRepresentations()[1]
    .setHandleVisibility(lineWidget.getWidgetState().getHandle2Visibility());
  lineWidget.rotateHandlesToFaceCamera();
  lineWidget.getInteractor().render();
  renderWindow.render();

  lineWidget.onInteractionEvent(() => {
    document.getElementById(
      'distance'
    ).innerHTML = widget.getDistance().toFixed(2);
  });

  lineWidget.onEndInteractionEvent(() => {
    document.getElementById(
      'distance'
    ).innerHTML = widget.getDistance().toFixed(2);
  });
}

document
  .querySelector('#idh1')
  .addEventListener('input', updateHandleShape.bind(null, 1));

document
  .querySelector('#idh2')
  .addEventListener('input', updateHandleShape.bind(null, 2));

updateHandleShape(1);
updateHandleShape(2);

// -----------------------------------------------------------
// globals
// -----------------------------------------------------------

global.widget = widget;
global.renderer = renderer;
global.fullScreenRenderer = fullScreenRenderer;
global.renderWindow = renderWindow;
global.widgetManager = widgetManager;
global.line = lineWidget;
