import macro from 'vtk.js/Sources/macros';
import { vec3 } from 'gl-matrix';

export default function widgetBehavior(publicAPI, model) {
  const state = model.widgetState;
  const moveHandle = state.getMoveHandle();
  const centerHandle = state.getCenterHandle();
  const borderHandle = state.getBorderHandle();
  const shapeHandle = state.getSphereHandle();

  // Set while moving the center or border handle.
  model.isDragging = false;
  // The last world coordinate of the mouse cursor during dragging.
  model.previousPosition = null;

  model.classHierarchy.push('vtkSphereWidgetProp');

  moveHandle.setVisible(true);
  centerHandle.setVisible(false);
  borderHandle.setVisible(false);
  shapeHandle.setVisible(true);

  function isValidHandle(handle) {
    return (
      handle === centerHandle ||
      handle === borderHandle ||
      handle === moveHandle
    );
  }

  function isPlaced() {
    return !!centerHandle.getOrigin() && !!borderHandle.getOrigin();
  }

  // Update the sphereHandle parameters from {center,border}Handle.
  function updateSphere() {
    const center = centerHandle.getOrigin();
    if (!center) return;

    centerHandle.setVisible(true);
    let border = borderHandle.getOrigin();
    if (border) {
      borderHandle.setVisible(true);
    } else {
      border = moveHandle.getOrigin();
      if (!border) return;
    }
    if (isPlaced()) {
      moveHandle.setVisible(false);
    }
    const radius = vec3.distance(center, border);
    shapeHandle.setVisible(true);
    shapeHandle.setOrigin(center);
    shapeHandle.setScale1(radius * 2);
    model._interactor.render();
  }

  function currentWorldCoords(e) {
    const manipulator =
      model.activeState?.getManipulator?.() ?? model.manipulator;
    return manipulator.handleEvent(e, model._apiSpecificRenderWindow);
  }

  // Update the sphere's center and radius.  Example:
  // handle.setCenterAndRadius([1,2,3], 10);
  publicAPI.setCenterAndRadius = (newCenter, newRadius) => {
    const oldCenter = centerHandle.getOrigin();
    const oldBorder = borderHandle.getOrigin();
    let newBorder = [newCenter[0] + newRadius, newCenter[1], newCenter[2]];
    if (oldBorder) {
      // Move the boundary handle to reflect the new radius, while preserving
      // its direction relative to the center.
      const direction = vec3.sub(vec3.create(), oldBorder, oldCenter);
      const oldRadius = vec3.length(direction);
      if (oldRadius > 1e-10) {
        newBorder = vec3.add(
          vec3.create(),
          newCenter,
          vec3.scale(vec3.create(), direction, newRadius / oldRadius)
        );
      }
    }
    centerHandle.setOrigin(newCenter);
    borderHandle.setOrigin(newBorder);
    updateSphere();
    model._widgetManager.enablePicking();
  };

  publicAPI.handleLeftButtonPress = (e) => {
    if (!isValidHandle(model.activeState)) {
      model.activeState = null;
      return macro.VOID;
    }
    const worldCoords = currentWorldCoords(e);

    if (model.activeState === moveHandle) {
      // Initial sphere placement.
      if (!centerHandle.getOrigin()) {
        centerHandle.setOrigin(worldCoords);
      } else if (!borderHandle.getOrigin()) {
        borderHandle.setOrigin(worldCoords);
      }
      updateSphere();
    }
    model.isDragging = true;
    model._apiSpecificRenderWindow.setCursor('grabbing');
    model.previousPosition = [...currentWorldCoords(e)];
    publicAPI.invokeStartInteractionEvent();
    return macro.EVENT_ABORT;
  };

  publicAPI.handleLeftButtonRelease = (e) => {
    if (!model.isDragging) {
      model.activeState = null;
      return macro.VOID;
    }
    if (isPlaced()) {
      model.previousPosition = null;
      model._widgetManager.enablePicking();
      model._apiSpecificRenderWindow.setCursor('pointer');
      model.isDragging = false;
      model.activeState = null;
      state.deactivate();
    }
    publicAPI.invokeEndInteractionEvent();
    return macro.EVENT_ABORT;
  };

  publicAPI.handleMouseMove = (e) => {
    if (!model.isDragging) {
      model.activeState = null;
      return macro.VOID;
    }
    if (!model.activeState) throw Error('no activestate');
    const worldCoords = currentWorldCoords(e);
    model.activeState.setOrigin(worldCoords);
    if (model.activeState === centerHandle) {
      // When the sphere is fully placed, and the user is moving the
      // center, we move the whole sphere.
      if (borderHandle.getOrigin()) {
        if (!model.previousPosition) {
          // !previousPosition here happens only immediately
          // after grabFocus, but grabFocus resets
          // borderHandle.origin.
          throw Error(`no pos ${model.activeState} ${model.previousPosition}`);
        }
        const translation = vec3.sub(
          vec3.create(),
          worldCoords,
          model.previousPosition
        );
        borderHandle.setOrigin(
          vec3.add(vec3.create(), borderHandle.getOrigin(), translation)
        );
      }
    }
    model.previousPosition = worldCoords;
    updateSphere();
    return macro.VOID;
  };

  publicAPI.grabFocus = () => {
    moveHandle.setVisible(true);
    centerHandle.setVisible(false);
    borderHandle.setVisible(false);
    centerHandle.setOrigin(null);
    borderHandle.setOrigin(null);
    model.isDragging = true;
    model.activeState = moveHandle;
    model._interactor.render();
  };

  publicAPI.loseFocus = () => {
    model.isDragging = false;
    model.activeState = null;
  };
}
