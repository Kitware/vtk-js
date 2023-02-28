import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import '@kitware/vtk.js/Rendering/Profiles/Glyph';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkOrientationMarkerWidget from '@kitware/vtk.js/Interaction/Widgets/OrientationMarkerWidget';
import vtkAxesActor from '@kitware/vtk.js/Rendering/Core/AxesActor';

import vtkInteractiveOrientationWidget from '@kitware/vtk.js/Widgets/Widgets3D/InteractiveOrientationWidget';
import vtkWidgetManager from '@kitware/vtk.js/Widgets/Core/WidgetManager';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkConeSource from '@kitware/vtk.js/Filters/Sources/ConeSource';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';

import * as vtkMath from '@kitware/vtk.js/Common/Core/Math';

// ----------------------------------------------------------------------------

function majorAxis(vec3, idxA, idxB) {
  const axis = [0, 0, 0];
  const idx = Math.abs(vec3[idxA]) > Math.abs(vec3[idxB]) ? idxA : idxB;
  const value = vec3[idx] > 0 ? 1 : -1;
  axis[idx] = value;
  return axis;
}

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0.2, 0.2, 0.2],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();
const render = renderWindow.render;

const axes = vtkAxesActor.newInstance();
const orientationWidget = vtkOrientationMarkerWidget.newInstance({
  actor: axes,
  interactor: renderWindow.getInteractor(),
});
orientationWidget.setEnabled(true);
orientationWidget.setViewportCorner(
  vtkOrientationMarkerWidget.Corners.BOTTOM_LEFT
);
orientationWidget.setViewportSize(0.1);
orientationWidget.setMinPixelSize(100);
orientationWidget.setMaxPixelSize(300);

// ----------------------------------------------------------------------------
// Add context to 3D scene for orientation
// ----------------------------------------------------------------------------

const cone = vtkConeSource.newInstance();
const mapper = vtkMapper.newInstance();
const actor = vtkActor.newInstance({ pickable: false });

actor.setMapper(mapper);
mapper.setInputConnection(cone.getOutputPort());
renderer.addActor(actor);

const camera = renderer.getActiveCamera();

// ----------------------------------------------------------------------------
// Widget manager
// ----------------------------------------------------------------------------

const widgetManager = vtkWidgetManager.newInstance();
widgetManager.setRenderer(orientationWidget.getRenderer());

const widget = vtkInteractiveOrientationWidget.newInstance();
widget.placeWidget(axes.getBounds());
widget.setBounds(axes.getBounds().map((v) => v * 0.45));

const vw = widgetManager.addWidget(widget);

// Manage user interaction
vw.onOrientationChange(({ up, direction, action, event }) => {
  const focalPoint = camera.getFocalPoint();
  const position = camera.getPosition();
  const viewUp = camera.getViewUp();

  const distance = Math.sqrt(
    vtkMath.distance2BetweenPoints(position, focalPoint)
  );
  camera.setPosition(
    focalPoint[0] + direction[0] * distance,
    focalPoint[1] + direction[1] * distance,
    focalPoint[2] + direction[2] * distance
  );

  if (direction[0]) {
    camera.setViewUp(majorAxis(viewUp, 1, 2));
  }
  if (direction[1]) {
    camera.setViewUp(majorAxis(viewUp, 0, 2));
  }
  if (direction[2]) {
    camera.setViewUp(majorAxis(viewUp, 0, 1));
  }

  orientationWidget.updateMarkerOrientation();
  widgetManager.enablePicking();
  render();
});

renderer.resetCamera();
widgetManager.enablePicking();
render();
