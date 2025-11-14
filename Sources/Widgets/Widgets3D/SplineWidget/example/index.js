/* eslint-disable no-unused-expressions */
import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/All';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkInteractorStyleImage from '@kitware/vtk.js/Interaction/Style/InteractorStyleImage';
import vtkSplineWidget from '@kitware/vtk.js/Widgets/Widgets3D/SplineWidget';
import vtkWidgetManager from '@kitware/vtk.js/Widgets/Core/WidgetManager';

import { splineKind } from '@kitware/vtk.js/Common/DataModel/Spline3D/Constants';

import GUI from 'lil-gui';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();
const iStyle = vtkInteractorStyleImage.newInstance();
renderWindow.getInteractor().setInteractorStyle(iStyle);

// ----------------------------------------------------------------------------
// Widget manager
// ----------------------------------------------------------------------------

const widgetManager = vtkWidgetManager.newInstance();
widgetManager.setRenderer(renderer);

const widget = vtkSplineWidget.newInstance();

const widgetRepresentation = widgetManager.addWidget(widget);

renderer.resetCamera();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

const gui = new GUI();
const params = {
  Kind: 'Kochanek',
  Tension: 0,
  Bias: 0,
  Continuity: 0,
  Resolution: 20,
  HandleSize: 20,
  AllowFreehand: true,
  FreehandDistance: 0.2,
  Closed: true,
  BoundaryCondition: 0,
  BoundaryConditionValueX: 0,
  BoundaryConditionValueY: 0,
  Border: true,
  PlaceWidget: () => {
    widgetRepresentation.reset();
    widgetManager.grabFocus(widget);
  },
};

// Helper to enable/disable GUI controllers
const guiControllers = [];
function updateGuiControllers() {
  // Find controllers by name
  const tensionController = guiControllers.find((c) => c._name === 'Tension');
  const biasController = guiControllers.find((c) => c._name === 'Bias');
  const continuityController = guiControllers.find(
    (c) => c._name === 'Continuity'
  );
  const bcController = guiControllers.find(
    (c) => c._name === 'Boundary condition'
  );
  const bcValueXController = guiControllers.find(
    (c) => c._name === 'BC value X'
  );
  const bcValueYController = guiControllers.find(
    (c) => c._name === 'BC value Y'
  );

  // Disable Tension, Bias, Continuity if Kind is Cardinal
  const isCardinal = params.Kind === 'Cardinal';
  tensionController && tensionController.enable(!isCardinal);
  biasController && biasController.enable(!isCardinal);
  continuityController && continuityController.enable(!isCardinal);

  // Disable BC value X/Y if Closed or BC is default
  const isClosed = params.Closed;
  const isDefaultBC = params.BoundaryCondition === 0;
  const disableBCValues = isClosed || isDefaultBC;

  bcController && bcController.enable(!isClosed);
  bcValueXController && bcValueXController.enable(!disableBCValues);
  bcValueYController && bcValueYController.enable(!disableBCValues);
}

// Patch GUI add to track controllers
const origAdd = gui.add.bind(gui);
gui.add = function add(...args) {
  const controller = origAdd(...args);
  guiControllers.push(controller);
  return controller;
};

function applyKind() {
  const isKochanek = params.Kind === 'Kochanek';
  const kind = isKochanek
    ? splineKind.KOCHANEK_SPLINE
    : splineKind.CARDINAL_SPLINE;
  widget.getWidgetState().setSplineKind(kind);
  renderWindow.render();
}

function applyClosedAndBoundary() {
  const widgetState = widget.getWidgetState();
  const isClosed = params.Closed;
  widgetState.setSplineClosed(isClosed);

  const isDefault = params.BoundaryCondition === 0;
  const disableValues = isClosed || isDefault;

  // Update boundary condition type
  widgetState.setSplineBoundaryCondition(params.BoundaryCondition);

  // Apply boundary condition values when enabled
  if (!disableValues) {
    widgetState.setSplineBoundaryConditionValues([
      params.BoundaryConditionValueX,
      params.BoundaryConditionValueY,
      0,
    ]);
  }

  renderWindow.render();
}

gui
  .add(params, 'Kind', ['Kochanek', 'Cardinal'])
  .name('Kind')
  .onChange(() => {
    applyKind();
    updateGuiControllers();
  });

gui
  .add(params, 'Tension', -1, 1, 0.1)
  .name('Tension')
  .onChange((value) => {
    widget.getWidgetState().setSplineTension(parseFloat(value));
    renderWindow.render();
  });

gui
  .add(params, 'Bias', -1, 1, 0.1)
  .name('Bias')
  .onChange((value) => {
    widget.getWidgetState().setSplineBias(parseFloat(value));
    renderWindow.render();
  });

gui
  .add(params, 'Continuity', -1, 1, 0.1)
  .name('Continuity')
  .onChange((value) => {
    widget.getWidgetState().setSplineContinuity(parseFloat(value));
    renderWindow.render();
  });

gui
  .add(params, 'Resolution', 1, 32, 1)
  .name('Resolution')
  .onChange((value) => {
    widgetRepresentation.setResolution(value);
    renderWindow.render();
  });

gui
  .add(params, 'HandleSize', 10, 50, 1)
  .name('Handle size')
  .onChange((value) => {
    widgetRepresentation.setHandleSizeInPixels(value);
    renderWindow.render();
  });

gui
  .add(params, 'AllowFreehand')
  .name('Drag (freehand)')
  .onChange((value) => {
    widgetRepresentation.setAllowFreehand(!!value);
    renderWindow.render();
  });

gui
  .add(params, 'FreehandDistance', 0.05, 1.0, 0.05)
  .name('Freehand distance')
  .onChange((value) => {
    widgetRepresentation.setFreehandMinDistance(value);
    renderWindow.render();
  });

gui
  .add(params, 'Closed')
  .name('Closed spline')
  .onChange(() => {
    applyClosedAndBoundary();
    updateGuiControllers();
  });

gui
  .add(params, 'BoundaryCondition', {
    default: 0,
    derivative: 1,
    '2nd derivative': 2,
    '2nd derivative interior point': 3,
  })
  .name('Boundary condition')
  .onChange(() => {
    applyClosedAndBoundary();
    updateGuiControllers();
  });

gui
  .add(params, 'BoundaryConditionValueX', -2, 2, 0.1)
  .name('BC value X')
  .onChange(() => applyClosedAndBoundary());

gui
  .add(params, 'BoundaryConditionValueY', -2, 2, 0.1)
  .name('BC value Y')
  .onChange(() => applyClosedAndBoundary());

gui
  .add(params, 'Border')
  .name('Border')
  .onChange((value) => {
    widgetRepresentation.setOutputBorder(!!value);
    renderWindow.render();
  });

gui.add(params, 'PlaceWidget').name('Place widget');

applyKind();
applyClosedAndBoundary();
updateGuiControllers();
