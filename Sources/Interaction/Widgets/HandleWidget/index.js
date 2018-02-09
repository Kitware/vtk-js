import macro from 'vtk.js/Sources/macro';
import vtkAbstractWidget from 'vtk.js/Sources/Interaction/Widgets/AbstractWidget';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkSphereHandleRepresentation from 'vtk.js/Sources/Interaction/Widgets/SphereHandleRepresentation';
import vtkHandleRepresentation from 'vtk.js/Sources/Interaction/Widgets/HandleRepresentation';
import Constants from 'vtk.js/Sources/Interaction/Widgets/HandleWidget/Constants';

const { VOID, EVENT_ABORT } = macro;
const { IntersectionState } = vtkHandleRepresentation;
const { WidgetState } = Constants;

// ----------------------------------------------------------------------------
// vtkHandleWidget methods
// ----------------------------------------------------------------------------

function vtkHandleWidget(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkHandleWidget');

  function usePointerCursor(showPointer) {
    const cursor = showPointer ? 'pointer' : 'default';
    model.interactor.getView().setCursor(cursor);
  }

  function getStartDepth(state, renderer) {
    if (state === IntersectionState.HANDLE) {
      const worldPos = model.widgetRep.getWorldPosition();
      const viewFocus = publicAPI.computeWorldToDisplay(
        renderer,
        worldPos[0],
        worldPos[1],
        worldPos[2]
      );
      return viewFocus[2];
    }
    return 0;
  }

  function startState(callData, state) {
    if (model.state !== WidgetState.START) {
      return VOID;
    }
    const ren = callData.pokedRenderer;
    const pos = callData.position;
    const intersect = model.widgetRep.getIntersectionState(pos, ren);
    if (intersect === IntersectionState.OUTSIDE) {
      return VOID;
    }
    model.startDepth = getStartDepth(intersect, ren);
    model.previousPosition = callData.position;
    model.state = state;
    model.widgetRep.setSelected(true);
    usePointerCursor(true);
    publicAPI.invokeStartInteractionEvent();
    publicAPI.render();
    model.interactor.requestAnimation(publicAPI);
    return EVENT_ABORT;
  }

  function endState(state) {
    if (model.state !== state) {
      return VOID;
    }
    model.state = WidgetState.START;
    model.widgetRep.setSelected(false);
    usePointerCursor(false);
    publicAPI.invokeEndInteractionEvent();
    model.interactor.cancelAnimation(publicAPI);
    publicAPI.render();
    return EVENT_ABORT;
  }

  function startSelect(callData) {
    return startState(callData, WidgetState.SELECTING);
  }

  function startTranslate(callData) {
    return startState(callData, WidgetState.TRANSLATING);
  }

  function startScale(callData) {
    if (!model.allowHandleResize) {
      return VOID;
    }
    return startState(callData, WidgetState.SCALING);
  }

  function endSelect(callData) {
    return endState(WidgetState.SELECTING);
  }

  function endTranslate(callData) {
    return endState(WidgetState.TRANSLATING);
  }

  function endScale(callData) {
    return endState(WidgetState.SCALING);
  }

  function translate(from, to) {
    const pos = model.widgetRep.getWorldPosition();
    pos[0] += to[0] - from[0];
    pos[1] += to[1] - from[1];
    pos[2] += to[2] - from[2];
    model.widgetRep.setWorldPosition(pos);
  }

  function scale(from, to, position) {
    if (!model.allowHandleResize) {
      endState(WidgetState.SCALING);
    }
    const v = [];
    v[0] = to[0] - from[0];
    v[1] = to[1] - from[1];
    v[2] = to[2] - from[2];
    const bounds = model.widgetRep.getBounds();
    let scaleFactor =
      vtkMath.norm(v) /
      Math.sqrt(
        (bounds[1] - bounds[0]) * (bounds[1] - bounds[0]) +
          (bounds[3] - bounds[2]) * (bounds[3] - bounds[2]) +
          (bounds[5] - bounds[4]) * (bounds[5] - bounds[4])
      );

    if (position.y > model.previousPosition.y) {
      scaleFactor += 1.0;
    } else {
      scaleFactor = 1.0 - scaleFactor;
    }

    let handleSize = model.widgetRep.getHandleSize();
    handleSize *= scaleFactor;
    if (handleSize < 1) {
      handleSize = 1;
    }
    model.widgetRep.setHandleSize(handleSize);
  }

  function move(callData) {
    const ren = callData.pokedRenderer;
    const pos = callData.position;
    if (model.state === WidgetState.START) {
      const intersect = model.widgetRep.getIntersectionState(pos, ren);
      const onHandle = intersect !== IntersectionState.OUTSIDE;
      usePointerCursor(onHandle);
      return VOID;
    }

    const pos3d = publicAPI.computeDisplayToWorld(
      ren,
      pos.x,
      pos.y,
      model.startDepth
    );
    const previousPos3d = publicAPI.computeDisplayToWorld(
      ren,
      model.previousPosition.x,
      model.previousPosition.y,
      model.startDepth
    );
    switch (model.state) {
      case WidgetState.SELECTING:
      case WidgetState.TRANSLATING: {
        translate(previousPos3d, pos3d);
        break;
      }
      case WidgetState.SCALING: {
        scale(previousPos3d, pos3d, pos);
        break;
      }
      default:
        return VOID;
    }
    model.previousPosition = pos;
    publicAPI.invokeInteractionEvent();
    return EVENT_ABORT;
  }

  // Overriden method
  publicAPI.createDefaultRepresentation = () => {
    if (!model.widgetRep) {
      model.widgetRep = vtkSphereHandleRepresentation.newInstance();
    }
  };

  publicAPI.handleMouseMove = (callData) => move(callData);

  publicAPI.handleLeftButtonPress = (callData) => startSelect(callData);

  publicAPI.handleLeftButtonRelease = (callData) => endSelect(callData);

  publicAPI.handleMiddleButtonPress = (callData) => startTranslate(callData);

  publicAPI.handleMiddleButtonRelease = (callData) => endTranslate(callData);

  publicAPI.handleRightButtonPress = (callData) => startScale(callData);

  publicAPI.handleRightButtonRelease = (callData) => endScale(callData);
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  allowHandleResize: 1,
  state: WidgetState.START,
  startDepth: 0,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkAbstractWidget.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, ['allowHandleResize']);

  // Object methods
  vtkHandleWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkHandleWidget');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend }, Constants);
