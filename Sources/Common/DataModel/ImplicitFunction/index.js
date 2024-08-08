import macro from 'vtk.js/Sources/macros';

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// vtkImplicitFunction methods
// ----------------------------------------------------------------------------

function vtkImplicitFunction(publicAPI, model) {
  model.classHierarchy.push('vtkImplicitFunction');

  publicAPI.functionValue = (xyz) => {
    if (!model.transform) {
      return publicAPI.evaluateFunction(xyz);
    }
    const transformedXYZ = [];
    model.transform.transformPoint(xyz, transformedXYZ);
    return publicAPI.evaluateFunction(transformedXYZ);
  };

  publicAPI.evaluateFunction = (_xyz) => {
    macro.vtkErrorMacro('not implemented');
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------
const DEFAULT_VALUES = {
  // transform : null
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);

  macro.setGet(publicAPI, model, ['transform']);

  vtkImplicitFunction(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkImplicitFunction');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
