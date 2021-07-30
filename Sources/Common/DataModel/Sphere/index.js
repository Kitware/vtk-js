import macro from 'vtk.js/Sources/macros';
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';

const VTK_SMALL_NUMBER = 1e-12;

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

function isPointIn3DEllipse(point, bounds) {
  const center = vtkBoundingBox.getCenter(bounds);
  let scale3 = vtkBoundingBox.computeScale3(bounds);
  scale3 = scale3.map((x) => Math.max(Math.abs(x), VTK_SMALL_NUMBER));

  const radius = [
    (point[0] - center[0]) / scale3[0],
    (point[1] - center[1]) / scale3[1],
    (point[2] - center[2]) / scale3[2],
  ];

  return (
    radius[0] * radius[0] + radius[1] * radius[1] + radius[2] * radius[2] <= 1
  );
}

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

export const STATIC = {
  evaluate,
  isPointIn3DEllipse,
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

export default { newInstance, extend, ...STATIC };
