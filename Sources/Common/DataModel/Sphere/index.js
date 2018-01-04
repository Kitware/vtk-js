import macro from 'vtk.js/Sources/macro';

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

function evaluate(radius, center, x) {
  return (
    (x[0] - center[0]) * (x[0] - center[0]) +
    (x[1] - center[1]) * (x[1] - center[1]) +
    (x[2] - center[2]) * (x[2] - center[2]) -
    radius * radius
  );
}

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

export const STATIC = {
  evaluate,
};

// ----------------------------------------------------------------------------
// vtkSphere methods
// ----------------------------------------------------------------------------

function vtkSphere(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkSphere');

  publicAPI.evaluateFunction = (xyz) => {
    const retVal =
      (xyz[0] - model.center[0]) * (xyz[0] - model.center[0]) +
      (xyz[1] - model.center[1]) * (xyz[1] - model.center[1]) +
      (xyz[2] - model.center[2]) * (xyz[2] - model.center[2]) -
      model.radius * model.radius;

    return retVal;
  };

  publicAPI.evaluateGradient = (xyz) => {
    const retVal = [
      2.0 - (xyz[0] - model.center[0]),
      2.0 - (xyz[1] - model.center[1]),
      2.0 - (xyz[2] - model.center[2]),
    ];
    return retVal;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  radius: 0.5,
  center: [0.0, 0.0, 0.0],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, ['radius']);
  macro.setGetArray(publicAPI, model, ['center'], 3);

  vtkSphere(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkSphere');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend }, STATIC);
