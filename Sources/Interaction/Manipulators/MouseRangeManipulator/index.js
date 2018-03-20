import macro from 'vtk.js/Sources/macro';
import vtkCompositeMouseManipulator from 'vtk.js/Sources/Interaction/Manipulators/CompositeMouseManipulator';

// ----------------------------------------------------------------------------
// vtkMouseRangeManipulator methods
// ----------------------------------------------------------------------------

function vtkMouseRangeManipulator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkMouseRangeManipulator');

  // Keep track of delta that is below the value
  // of one step to progressively increment it
  model.incrementalDelta = {};

  // Internal methods
  //-------------------------------------------------------------------------
  function scaleDeltaToRange(listener, normalizedDelta) {
    return (
      normalizedDelta * ((listener.max - listener.min) / listener.step + 1)
    );
  }

  //-------------------------------------------------------------------------
  function processDelta(listener, delta) {
    const oldValue = listener.getValue();
    let value = oldValue + delta + model.incrementalDelta[listener];

    const difference = value - listener.min;
    const stepsToDifference = Math.round(difference / listener.step);
    value = listener.min + listener.step * stepsToDifference;
    value = Math.max(value, listener.min);
    value = Math.min(value, listener.max);

    // Check if value will change or if we need to store
    // the delta to append at the next iteration
    if (value !== oldValue) {
      listener.setValue(value);
      model.incrementalDelta[listener] = 0;
    } else if (value !== listener.min && value !== listener.max) {
      model.incrementalDelta[listener] += delta;
    }
  }

  // Public API methods
  //-------------------------------------------------------------------------
  publicAPI.setHorizontalListener = (min, max, step, getValue, setValue) => {
    const getFn = Number.isFinite(getValue) ? () => getValue : getValue;
    model.horizontalListener = { min, max, step, getValue: getFn, setValue };
    model.incrementalDelta[model.horizontalListener] = 0;
    publicAPI.modified();
  };

  //-------------------------------------------------------------------------
  publicAPI.setVerticalListener = (min, max, step, getValue, setValue) => {
    const getFn = Number.isFinite(getValue) ? () => getValue : getValue;
    model.verticalListener = { min, max, step, getValue: getFn, setValue };
    model.incrementalDelta[model.verticalListener] = 0;
    publicAPI.modified();
  };

  //-------------------------------------------------------------------------
  publicAPI.setScrollListener = (min, max, step, getValue, setValue) => {
    const getFn = Number.isFinite(getValue) ? () => getValue : getValue;
    model.scrollListener = { min, max, step, getValue: getFn, setValue };
    model.incrementalDelta[model.scrollListener] = 0;
    publicAPI.modified();
  };

  //-------------------------------------------------------------------------
  publicAPI.removeHorizontalListener = () => {
    if (model.verticalListener) {
      delete model.verticalListener;
      publicAPI.modified();
    }
  };

  //-------------------------------------------------------------------------
  publicAPI.removeVerticalListener = () => {
    if (model.horizontalListener) {
      delete model.horizontalListener;
      publicAPI.modified();
    }
  };

  //-------------------------------------------------------------------------
  publicAPI.removeScrollListener = () => {
    if (model.scrollListener) {
      delete model.scrollListener;
      publicAPI.modified();
    }
  };

  //-------------------------------------------------------------------------
  publicAPI.removeAllListeners = () => {
    publicAPI.removeHorizontalListener();
    publicAPI.removeVerticalListener();
    publicAPI.removesCrollListener();
  };

  //-------------------------------------------------------------------------
  publicAPI.onButtonDown = (interactor, renderer, position) => {
    model.previousPosition = position;
  };

  //-------------------------------------------------------------------------
  publicAPI.onMouseMove = (interactor, renderer, position) => {
    if (!model.verticalListener && !model.horizontalListener) {
      return;
    }
    if (!position) {
      return;
    }

    // Normalize by viewport size
    const size = interactor.getView().getViewportSize(renderer);

    if (model.horizontalListener) {
      const dxNorm = (position.x - model.previousPosition.x) / size[0];
      const dx = scaleDeltaToRange(model.horizontalListener, dxNorm);
      processDelta(model.horizontalListener, dx);
    }
    if (model.verticalListener) {
      const dyNorm = (position.y - model.previousPosition.y) / size[1];
      const dy = scaleDeltaToRange(model.verticalListener, dyNorm);
      processDelta(model.verticalListener, dy);
    }

    model.previousPosition = position;
  };

  let prevValue = 0;
  //-------------------------------------------------------------------------
  publicAPI.onScroll = (interactor, renderer, delta) => {
    if (!delta) {
      return;
    }
    processDelta(model.scrollListener, delta * model.scrollListener.step);
    const val = model.scrollListener.getValue();
    const steps = Math.round(
      Math.abs(prevValue - val) / model.scrollListener.step
    );
    prevValue = val;
    console.log(`slice: ${val}, steps: ${steps}`);
  };
  publicAPI.onStartScroll = publicAPI.onScroll;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  horizontalListener: null,
  verticalListener: null,
  scrollListener: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  macro.obj(publicAPI, model);
  vtkCompositeMouseManipulator.extend(publicAPI, model, initialValues);

  // Object specific methods
  vtkMouseRangeManipulator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkMouseRangeManipulator'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
