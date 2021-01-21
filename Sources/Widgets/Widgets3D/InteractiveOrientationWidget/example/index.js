import 'vtk.js/favicon';

import vtkFullScreenRenderWindow from 'vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkOrientationMarkerWidget from 'vtk.js/Interaction/Widgets/OrientationMarkerWidget';
import vtkAxesActor from 'vtk.js/Rendering/Core/AxesActor';

import vtkInteractiveOrientationWidget from 'vtk.js/Widgets/Widgets3D/InteractiveOrientationWidget';
import vtkWidgetManager from 'vtk.js/Widgets/Core/WidgetManager';

import vtkActor from 'vtk.js/Rendering/Core/Actor';
import vtkConeSource from 'vtk.js/Filters/Sources/ConeSource';
import vtkMapper from 'vtk.js/Rendering/Core/Mapper';

import * as vtkMath from 'vtk.js/Common/Core/Math';

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
  background: [0, 0, 0],
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
orientationWidget.setViewportSize(0.15);
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
widget.setBounds(axes.getBounds());
widget.setPlaceFactor(1);

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
