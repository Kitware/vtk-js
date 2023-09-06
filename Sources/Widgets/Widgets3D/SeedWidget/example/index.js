import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import '@kitware/vtk.js/Rendering/Profiles/Glyph';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkConeSource from '@kitware/vtk.js/Filters/Sources/ConeSource';
import vtkPickerManipulator from '@kitware/vtk.js/Widgets/Manipulators/PickerManipulator';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkSeedWidget from '@kitware/vtk.js/Widgets/Widgets3D/SeedWidget';
import vtkWidgetManager from '@kitware/vtk.js/Widgets/Core/WidgetManager';

import controlPanel from './controlPanel.html';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

const cone = vtkConeSource.newInstance();
cone.setResolution(50);
const mapper = vtkMapper.newInstance();
const actor = vtkActor.newInstance();

// Create an instance of vtkPickerManipulator to constrain movement to a target actor
const manipulator = vtkPickerManipulator.newInstance();
// Set the target actor, which is representing a cone
manipulator.getPicker().addPickList(actor);

actor.setMapper(mapper);
mapper.setInputConnection(cone.getOutputPort());
actor.getProperty().setOpacity(0.5);

renderer.addActor(actor);

// ----------------------------------------------------------------------------
// Widget manager
// ----------------------------------------------------------------------------

const widgetManager = vtkWidgetManager.newInstance();
widgetManager.setRenderer(renderer);

let widget = null;
let widgetHandle = null;

renderer.resetCamera();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

fullScreenRenderer.addController(controlPanel);

document.querySelector('#addWidget').addEventListener('click', () => {
  widgetManager.releaseFocus(widget);
  widget = vtkSeedWidget.newInstance();

  // Important: set the manipulator of the widget to constrain movement to the actor
  widget.setManipulator(manipulator);
  // Set the color of the seed (random color)
  widget
    .getWidgetState()
    .getMoveHandle()
    .setColor3(
      Math.round(Math.random() * 255),
      Math.round(Math.random() * 255),
      Math.round(Math.random() * 255)
    );

  // Start placement interaction
  widget.placeWidget(cone.getOutputData().getBounds());
  widgetHandle = widgetManager.addWidget(widget);
  widgetManager.grabFocus(widget);
});

document.querySelector('#removeWidget').addEventListener('click', () => {
  const widgets = widgetManager.getWidgets();
  if (!widgets.length) return;
  widgetManager.removeWidget(widgets[widgets.length - 1]);
});

// -----------------------------------------------------------
// globals
// -----------------------------------------------------------

global.widget = widget;
global.renderer = renderer;
global.fullScreenRenderer = fullScreenRenderer;
global.renderWindow = renderWindow;
global.widgetManager = widgetManager;
global.widgetHandle = widgetHandle;
