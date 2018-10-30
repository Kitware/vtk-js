import macro from 'vtk.js/Sources/macro';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkCellPicker from 'vtk.js/Sources/Rendering/Core/CellPicker';
import vtkHandleRepresentation from 'vtk.js/Sources/Interaction/Widgets/HandleRepresentation';
import vtkInteractorObserver from 'vtk.js/Sources/Rendering/Core/InteractorObserver';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkProperty from 'vtk.js/Sources/Rendering/Core/Property';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
import { InteractionState } from '../HandleRepresentation/Constants';

// ----------------------------------------------------------------------------
// vtkSphereHandleRepresentation methods
// ----------------------------------------------------------------------------

function vtkSphereHandleRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkSphereHandleRepresentation');

  const superClass = Object.assign({}, publicAPI);

  publicAPI.getActors = () => [model.actor];
  publicAPI.getNestedProps = () => publicAPI.getActors();

  publicAPI.placeWidget = (...bounds) => {
    let boundsArray = [];

    if (Array.isArray(bounds[0])) {
      boundsArray = bounds[0];
    } else {
      for (let i = 0; i < bounds.length; i++) {
        boundsArray.push(bounds[i]);
      }
    }

    if (boundsArray.length !== 6) {
      return;
    }

    const newBounds = [];
    const center = [];
    publicAPI.adjustBounds(boundsArray, newBounds, center);
    publicAPI.setWorldPosition(center);
    for (let i = 0; i < 6; i++) {
      model.initialBounds[i] = newBounds[i];
    }
    model.initialLength = Math.sqrt(
      (newBounds[1] - newBounds[0]) * (newBounds[1] - newBounds[0]) +
        (newBounds[3] - newBounds[2]) * (newBounds[3] - newBounds[2]) +
        (newBounds[5] - newBounds[4]) * (newBounds[5] - newBounds[4])
    );
  };

  publicAPI.setSphereRadius = (radius) => {
    model.sphere.setRadius(radius);
    publicAPI.modified();
  };

  publicAPI.getSphereRadius = () => model.sphere.getRadius();

  publicAPI.getBounds = () => {
    const radius = model.sphere.getRadius();
    const center = model.sphere.getCenter();
    const bounds = [];
    bounds[0] = model.placeFactor * (center[0] - radius);
    bounds[1] = model.placeFactor * (center[0] + radius);
    bounds[2] = model.placeFactor * (center[1] - radius);
    bounds[3] = model.placeFactor * (center[1] + radius);
    bounds[4] = model.placeFactor * (center[2] - radius);
    bounds[5] = model.placeFactor * (center[2] + radius);
    return bounds;
  };

  publicAPI.setWorldPosition = (position) => {
    model.sphere.setCenter(position);
    superClass.setWorldPosition(model.sphere.getCenter());
  };

  publicAPI.setDisplayPosition = (position) => {
    superClass.setDisplayPosition(position);
    publicAPI.setWorldPosition(model.worldPosition.getValue());
  };

  publicAPI.setHandleSize = (size) => {
    superClass.setHandleSize(size);
    model.currentHandleSize = model.handleSize;
  };

  publicAPI.computeInteractionState = (pos) => {
    model.visibility = 1;
    const pos3d = [pos[0], pos[1], 0.0];
    model.cursorPicker.pick(pos3d, model.renderer);
    const pickedActor = model.cursorPicker.getDataSet();
    if (pickedActor) {
      model.interactionState = InteractionState.SELECTING;
    } else {
      model.interactionState = InteractionState.OUTSIDE;
      if (model.activeRepresentation) {
        model.visibility = 0;
      }
    }
    return model.interactionState;
  };

  publicAPI.determineConstraintAxis = (constraint, x) => {
    // Look for trivial cases
    if (!model.constrained) {
      return -1;
    }

    if (constraint >= 0 && constraint < 3) {
      return constraint;
    }

    // Okay, figure out constraint. First see if the choice is
    // outside the hot spot
    if (!model.waitingForMotion) {
      const pickedPosition = model.cursorPicker.getPickPosition();
      const d2 = vtkMath.distance2BetweenPoints(
        pickedPosition,
        model.startEventPosition
      );
      const tol = model.hotSpotSize * model.initialLength;
      if (d2 > tol * tol) {
        model.waitingForMotion = 0;
        return model.cursorPicker.getCellId();
      }
      model.waitingForMotion = 1;
      model.waitCount = 0;
      return -1;
    }

    if (model.waitingForMotion && x) {
      model.waitingForMotion = 0;
      const v = [];
      v[0] = Math.abs(x[0] - model.startEventPosition[0]);
      v[1] = Math.abs(x[1] - model.startEventPosition[1]);
      v[2] = Math.abs(x[2] - model.startEventPosition[2]);
      if (v[0] > v[1]) {
        return v[0] > v[2] ? 0 : 2;
      }
      return v[1] > v[2] ? 1 : 2;
    }
    return -1;
  };

  publicAPI.startComplexWidgetInteraction = (startEventPos) => {
    // Record the current event position, and the rectilinear wipe position.
    model.startEventPosition[0] = startEventPos[0];
    model.startEventPosition[1] = startEventPos[1];
    model.startEventPosition[2] = 0.0;

    model.lastEventPosition[0] = startEventPos[0];
    model.lastEventPosition[1] = startEventPos[1];

    const pos = [startEventPos[0], startEventPos[1], 0];
    model.cursorPicker.pick(pos, model.renderer);
    const pickedActor = model.cursorPicker.getDataSet();
    if (pickedActor) {
      model.interactionState = InteractionState.SELECTING;
      model.constraintAxis = publicAPI.determineConstraintAxis(-1, null);
      model.lastPickPosition = model.cursorPicker.getPickPosition();
    } else {
      model.interactionState = InteractionState.OUTSIDE;
      model.constraintAxis = -1;
    }
  };

  publicAPI.displayToWorld = (eventPos, z) =>
    vtkInteractorObserver.computeDisplayToWorld(
      model.renderer,
      eventPos[0],
      eventPos[1],
      z
    );

  publicAPI.complexWidgetInteraction = (eventPos) => {
    const focalPoint = vtkInteractorObserver.computeWorldToDisplay(
      model.renderer,
      model.lastPickPosition[0],
      model.lastPickPosition[1],
      model.lastPickPosition[2]
    );

    const z = focalPoint[2];

    const prevPickPoint = publicAPI.displayToWorld(model.lastEventPosition, z);
    const pickPoint = publicAPI.displayToWorld(eventPos, z);

    if (
      model.interactionState === InteractionState.SELECTING ||
      model.interactionState === InteractionState.TRANSLATING
    ) {
      if (!model.waitingForMotion || model.waitCount++ > 3) {
        model.constraintAxis = publicAPI.determineConstraintAxis(
          model.constraintAxis,
          pickPoint
        );
        if (
          model.interactionState === InteractionState.SELECTING &&
          !model.translationMode
        ) {
          publicAPI.moveFocus(prevPickPoint, pickPoint);
        } else {
          publicAPI.translate(prevPickPoint, pickPoint);
        }
      }
    } else if (model.interactionState === InteractionState.SCALING) {
      publicAPI.scale(prevPickPoint, pickPoint, eventPos);
    }

    model.lastEventPosition[0] = eventPos[0];
    model.lastEventPosition[1] = eventPos[1];
    publicAPI.modified();
  };

  publicAPI.moveFocus = (p1, p2) => {
    // get the motion vector
    const v = [];
    v[0] = p2[0] - p1[0];
    v[1] = p2[1] - p1[1];
    v[2] = p2[2] - p1[2];

    const focus = model.sphere.getCenter();
    if (model.constraintAxis >= 0) {
      focus[model.constraintAxis] += v[model.constraintAxis];
    } else {
      focus[0] += v[0];
      focus[1] += v[1];
      focus[2] += v[2];
    }

    publicAPI.setWorldPosition(focus);
  };

  publicAPI.translate = (p1, p2) => {
    // get the motion vector
    const v = [];
    v[0] = p2[0] - p1[0];
    v[1] = p2[1] - p1[1];
    v[2] = p2[2] - p1[2];

    const pos = model.sphere.getCenter();
    if (model.constraintAxis >= 0) {
      // move along axis
      for (let i = 0; i < 3; i++) {
        if (i !== model.constraintAxis) {
          v[i] = 0.0;
        }
      }
    }

    const newFocus = [];
    for (let i = 0; i < 3; i++) {
      newFocus[i] = pos[i] + v[i];
    }
    publicAPI.setWorldPosition(newFocus);

    let radius = publicAPI.sizeHandlesInPixels(1.0, newFocus);
    radius *= model.currentHandleSize / model.handleSize;
    model.sphere.setRadius(radius);
  };

  publicAPI.sizeBounds = () => {
    const center = model.sphere.getCenter();
    let radius = publicAPI.sizeHandlesInPixels(1.0, center);
    radius *= model.currentHandleSize / model.handleSize;
    model.sphere.setRadius(radius);
  };

  publicAPI.scale = (p1, p2, eventPos) => {
    // get the motion vector
    const v = [];
    v[0] = p2[0] - p1[0];
    v[1] = p2[1] - p1[1];
    v[2] = p2[2] - p1[2];

    const bounds = publicAPI.getBounds();

    // Compute the scale factor
    let sf =
      vtkMath.norm(v) /
      Math.sqrt(
        (bounds[1] - bounds[0]) * (bounds[1] - bounds[0]) +
          (bounds[3] - bounds[2]) * (bounds[3] - bounds[2]) +
          (bounds[5] - bounds[4]) * (bounds[5] - bounds[4])
      );

    if (eventPos[1] > model.lastEventPosition[1]) {
      sf += 1.0;
    } else {
      sf = 1.0 - sf;
    }

    model.currentHandleSize *= sf;
    model.currentHandleSize =
      model.currentHandleSize < 0.001 ? 0.001 : model.currentHandleSize;
    publicAPI.sizeBounds();
  };

  publicAPI.highlight = (highlight) => {
    if (highlight) {
      publicAPI.applyProperty(model.selectProperty);
    } else {
      publicAPI.applyProperty(model.property);
    }
  };

  publicAPI.buildRepresentation = () => {
    if (model.renderer) {
      if (!model.placed) {
        model.validPick = 1;
        model.placed = 1;
      }

      publicAPI.sizeBounds();
      model.sphere.update();
      publicAPI.modified();
    }
  };

  publicAPI.applyProperty = (property) => {
    model.actor.setProperty(property);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  actor: null,
  mapper: null,
  sphere: null,
  cursorPicker: null,
  lastPickPosition: [0, 0, 0],
  lastEventPosition: [0, 0],
  constraintAxis: -1,
  translationMode: 1,
  property: null,
  selectProperty: null,
  placeFactor: 1,
  waitingForMotion: 0,
  hotSpotSize: 0.05,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkHandleRepresentation.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, [
    'translationMode',
    'property',
    'selectProperty',
  ]);
  macro.get(publicAPI, model, ['actor']);

  model.sphere = vtkSphereSource.newInstance();
  model.sphere.setThetaResolution(16);
  model.sphere.setPhiResolution(8);
  model.mapper = vtkMapper.newInstance();
  model.mapper.setInputConnection(model.sphere.getOutputPort());
  model.actor = vtkActor.newInstance();
  model.actor.setMapper(model.mapper);

  publicAPI.setHandleSize(15);
  model.currentHandleSize = model.handleSize;

  model.cursorPicker = vtkCellPicker.newInstance();
  model.cursorPicker.setPickFromList(1);
  model.cursorPicker.initializePickList();
  model.cursorPicker.addPickList(model.actor);

  model.property = vtkProperty.newInstance();
  model.property.setColor(1, 1, 1);
  model.selectProperty = vtkProperty.newInstance();
  model.selectProperty.setColor(0, 1, 0);
  model.actor.setProperty(model.property);

  // Object methods
  vtkSphereHandleRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkSphereHandleRepresentation'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
