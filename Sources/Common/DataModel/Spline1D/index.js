import macro from 'vtk.js/Sources/macros';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkSpline1D methods
// ----------------------------------------------------------------------------

function vtkSpline1D(publicAPI, model) {
  // Set our classname
  model.classHierarchy.add('vtkSpline1D');

  // --------------------------------------------------------------------------

  publicAPI.computeCloseCoefficients = (size, work, x, y) => {
    vtkErrorMacro(
      `${model.getClassName()} should implement computeCloseCoefficients`
    );
  };

  // --------------------------------------------------------------------------

  publicAPI.computeOpenCoefficients = (size, work, x, y, options = {}) => {
    vtkErrorMacro(
      `${model.getClassName()} should implement computeOpenCoefficients`
    );
  };

  // --------------------------------------------------------------------------

  publicAPI.getValue = (intervalIndex, t) => {
    vtkErrorMacro(`${model.getClassName()} should implement getValue`);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  vtkSpline1D(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkSpline1D');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
