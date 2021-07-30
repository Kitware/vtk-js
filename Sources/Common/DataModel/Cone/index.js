import macro from 'vtk.js/Sources/macros';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// vtkCone methods
// ----------------------------------------------------------------------------

function vtkCone(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkCone');

  publicAPI.evaluateFunction = (x) => {
    const tanTheta = Math.tan(vtkMath.radiansFromDegrees(model.angle));
    const retVal =
      x[1] * x[1] + x[2] * x[2] - x[0] * x[0] * tanTheta * tanTheta;

    return retVal;
  };

  publicAPI.evaluateGradient = (x) => {
    const tanTheta = Math.tan(vtkMath.radiansFromDegrees(model.angle));
    const retVal = [-2.0 * x[0] * tanTheta * tanTheta, 2.0 * x[1], 2.0 * x[2]];
    return retVal;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------
const DEFAULT_VALUES = {
  angle: 15.0,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, ['angle']);

  vtkCone(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkCone');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
