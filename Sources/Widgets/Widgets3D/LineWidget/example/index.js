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

const sceneLine = widgetManager.addWidget(widget);

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

document.querySelector('#txtIpt').addEventListener('keyup', () => {
  const input = document.getElementById('txtIpt').value;
  widget.updateTextValue(input);
  renderWindow.render();
});

document.querySelector('#linePos').addEventListener('input', (ev) => {
  const input = document.getElementById('linePos').value;
  widget.updateTextProps(input, 'positionOnLine');
  widgetManager.addWidget(widget);
  renderWindow.render();
});

// Handle Sources ------------------------------------------

document.querySelector('#idh1').addEventListener('input', (ev) => {
  const e = document.getElementById('idh1');
  const input = e.options[e.selectedIndex].value;
  widget.updateHandleFromUI(input, 1);
  widgetManager.removeWidget(widget);
  widgetManager.addWidget(widget);
  widgetManager.getWidgets()[0].setHandleDirection();
  renderWindow.render();
});

document.querySelector('#idh2').addEventListener('input', (ev) => {
  const e = document.getElementById('idh2');
  const input = e.options[e.selectedIndex].value;
  widget.updateHandleFromUI(input, 2);
  widgetManager.removeWidget(widget);
  widgetManager.addWidget(widget);
  widgetManager.getWidgets()[0].setHandleDirection();
  renderWindow.render();
});

// -----------------------------------------------------------
// globals
// -----------------------------------------------------------

global.widget = widget;
global.renderer = renderer;
global.fullScreenRenderer = fullScreenRenderer;
global.renderWindow = renderWindow;
global.widgetManager = widgetManager;
global.line = sceneLine;
