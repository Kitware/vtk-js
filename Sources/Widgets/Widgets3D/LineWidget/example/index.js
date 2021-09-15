import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Geometry';
import 'vtk.js/Sources/Rendering/Profiles/Glyph';

import DeepEqual from 'deep-equal';
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

let widget = null;

let lineWidget = null;
let selectedWidgetIndex = 0;

let getHandle = {};

renderer.resetCamera();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

fullScreenRenderer.addController(controlPanel);

// Text Modifiers ------------------------------------------

function updateLinePos() {
  const input = document.getElementById('linePos').value;
  const subState = lineWidget.getWidgetState().getPositionOnLine();
  subState.setPosOnLine(input / 100);
  lineWidget.placeText();
  renderWindow.render();
}

function updateText() {
  const input = document.getElementById('txtIpt').value;
  lineWidget.setText(input);
  renderWindow.render();
}
document.querySelector('#txtIpt').addEventListener('keyup', updateText);
// updateText();

function observeDistance() {
  lineWidget.onInteractionEvent(() => {
    document.getElementById('distance').innerHTML = widget
      .getDistance()
      .toFixed(2);
  });

  lineWidget.onEndInteractionEvent(() => {
    document.getElementById('distance').innerHTML = widget
      .getDistance()
      .toFixed(2);
  });
}

// setDistance();
document.querySelector('#linePos').addEventListener('input', updateLinePos);
// updateLinePos();

// Handle Sources ------------------------------------------

function updateCheckBoxes(handleId, shape) {
  if (shape === 'voidSphere') {
    document
      .getElementById(`visiH${handleId}`)
      .setAttribute('disabled', 'disabled');
  } else if (
    shape !== 'voidSphere' &&
    document.getElementById(`visiH${handleId}`).getAttribute('disabled') ===
      'disabled'
  ) {
    document.getElementById(`visiH${handleId}`).removeAttribute('disabled');
  }
}

function updateHandleShape(handleId) {
  const e = document.getElementById(`idh${handleId}`);
  const shape = e.options[e.selectedIndex].value;
  const handle = getHandle[handleId];
  if (handle) {
    handle.setShape(shape);
    lineWidget.updateHandleVisibility(handleId - 1);
    lineWidget.getInteractor().render();
    updateCheckBoxes(handleId, shape);
    observeDistance();
  }
}

function setWidgetColor(currentWidget, color) {
  currentWidget.getWidgetState().getHandle1().setColor(color);
  currentWidget.getWidgetState().getHandle2().setColor(color);
  currentWidget.getWidgetState().getMoveHandle().setColor(color);
}

const inputHandle1 = document.getElementById('idh1');
const inputHandle2 = document.getElementById('idh2');

inputHandle1.addEventListener('input', updateHandleShape.bind(null, 1));
inputHandle2.addEventListener('input', updateHandleShape.bind(null, 2));
// inputHandle1.value =
//   getHandle[1].getShape() === '' ? 'sphere' : getHandle[1].getShape();
// inputHandle2.value =
//   getHandle[2].getShape() === '' ? 'sphere' : getHandle[2].getShape();
// updateCheckBoxes(1, getHandles[1].getShape());
// updateCheckBoxes(2, getHandles[2].getShape());

// document.getElementById(
//   'visiH1'
// ).checked = lineWidget.getWidgetState().getHandle1().getVisible();
// document.getElementById(
//   'visiH2'
// ).checked = lineWidget.getWidgetState().getHandle2().getVisible();

const checkBoxes = ['visiH1', 'visiH2'].map((id) =>
  document.getElementById(id)
);

const handleCheckBoxInput = (e) => {
  if (lineWidget == null) {
    return;
  }
  if (e.target.id === 'visiH1') {
    lineWidget.getWidgetState().getHandle1().setVisible(e.target.checked);
    lineWidget.updateHandleVisibility(0);
  } else {
    lineWidget.getWidgetState().getHandle2().setVisible(e.target.checked);
    lineWidget.updateHandleVisibility(1);
  }
  lineWidget.getInteractor().render();
  renderWindow.render();
};
checkBoxes.forEach((checkBox) =>
  checkBox.addEventListener('input', handleCheckBoxInput)
);

document.querySelector('#addWidget').addEventListener('click', () => {
  let currentHandle = null;
  widgetManager.releaseFocus(widget);
  widget = vtkLineWidget.newInstance();
  // widget.placeWidget(cube.getOutputData().getBounds());
  currentHandle = widgetManager.addWidget(widget);
  lineWidget = currentHandle;

  getHandle = {
    1: lineWidget.getWidgetState().getHandle1(),
    2: lineWidget.getWidgetState().getHandle2(),
  };

  updateHandleShape(1);
  updateHandleShape(2);

  observeDistance();

  widgetManager.grabFocus(widget);

  currentHandle.onStartInteractionEvent(() => {
    const index = widgetManager.getWidgets().findIndex((cwidget) => {
      if (DeepEqual(currentHandle.getWidgetState(), cwidget.getWidgetState()))
        return 1;
      return 0;
    });
    getHandle = {
      1: currentHandle.getWidgetState().getHandle1(),
      2: currentHandle.getWidgetState().getHandle2(),
    };
    setWidgetColor(widgetManager.getWidgets()[selectedWidgetIndex], 0.5);
    setWidgetColor(widgetManager.getWidgets()[index], 0.2);
    selectedWidgetIndex = index;
    lineWidget = currentHandle;
    document.getElementById('idh1').value =
      getHandle[1].getShape() === '' ? 'sphere' : getHandle[1].getShape();
    document.getElementById('idh2').value =
      getHandle[1].getShape() === '' ? 'sphere' : getHandle[2].getShape();
    document.getElementById('visiH1').checked = lineWidget
      .getWidgetState()
      .getHandle1()
      .getVisible();
    document.getElementById('visiH2').checked = lineWidget
      .getWidgetState()
      .getHandle2()
      .getVisible();
    document.getElementById('txtIpt').value = lineWidget
      .getWidgetState()
      .getText()
      .getText();
  });
});

document.querySelector('#removeWidget').addEventListener('click', () => {
  widgetManager.removeWidget(widgetManager.getWidgets()[selectedWidgetIndex]);
  if (widgetManager.getWidgets().length !== 0) {
    selectedWidgetIndex = widgetManager.getWidgets().length - 1;
    setWidgetColor(widgetManager.getWidgets()[selectedWidgetIndex], 0.2);
  }
});

// -----------------------------------------------------------
// globals
// -----------------------------------------------------------

global.widget = widget;
global.renderer = renderer;
global.fullScreenRenderer = fullScreenRenderer;
global.renderWindow = renderWindow;
global.widgetManager = widgetManager;
global.line = lineWidget;
