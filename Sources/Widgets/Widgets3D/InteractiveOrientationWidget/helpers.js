import * as vtkMath from '@kitware/vtk.js/Common/Core/Math';
import vtkOrientationMarkerWidget from '@kitware/vtk.js/Interaction/Widgets/OrientationMarkerWidget';
import vtkAxesActor from '@kitware/vtk.js/Rendering/Core/AxesActor';
import vtkInteractiveOrientationWidget from '@kitware/vtk.js/Widgets/Widgets3D/InteractiveOrientationWidget';

export function majorAxis(vec3, idxA, idxB) {
  const axis = [0, 0, 0];
  const idx = Math.abs(vec3[idxA]) > Math.abs(vec3[idxB]) ? idxA : idxB;
  const value = vec3[idx] > 0 ? 1 : -1;
  axis[idx] = value;
  return axis;
}

export function createOrientationMarkerWidget(interactor, parentRenderer) {
  const axes = vtkAxesActor.newInstance();

  const orientationWidget = vtkOrientationMarkerWidget.newInstance({
    actor: axes,
    interactor,
    interactiveRenderer: true,
    viewportSize: 0.1,
    minPixelSize: 100,
    maxPixelSize: 300,
    parentRenderer,
  });
  orientationWidget.setEnabled(true);
  orientationWidget.setViewportCorner(
    vtkOrientationMarkerWidget.Corners.BOTTOM_LEFT
  );

  return orientationWidget;
}

export function createInteractiveOrientationWidget(bounds) {
  const widget = vtkInteractiveOrientationWidget.newInstance();
  widget.placeWidget(bounds);
  widget.setBounds(bounds.map((v) => v * 0.45));

  return widget;
}

export function createInteractiveOrientationMarkerWidget(
  widgetManager,
  interactor,
  mainRenderer
) {
  const orientationMarkerWidget = createOrientationMarkerWidget(
    interactor,
    mainRenderer
  );
  interactor.getInteractorStyle().setFocusedRenderer(mainRenderer);

  widgetManager.setRenderer(orientationMarkerWidget.getRenderer());

  const widget = createInteractiveOrientationWidget(
    orientationMarkerWidget.getActor().getBounds()
  );

  return {
    interactiveOrientationWidget: widget,
    orientationMarkerWidget,
  };
}

export function alignCameraOnViewWidgetOrientationChange(
  viewWidget,
  camera,
  orientationMarkerWidget,
  widgetManager,
  render
) {
  return viewWidget.onOrientationChange(({ up, direction, action, event }) => {
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

    orientationMarkerWidget.updateMarkerOrientation();
    render();
  });
}
