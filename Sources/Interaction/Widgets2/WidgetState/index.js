import macro, { vtkErrorMacro } from 'vtk.js/Sources/macro';

function vtkWidgetState(publicAPI, model) {
  model.classHierarchy.push('vtkWidgetState');

  model.data = model.data || {};

  // --------------------------------------------------------------------------

  publicAPI.setData = (data, force = false) => {
    if (!(data instanceof Object)) {
      vtkErrorMacro('State data must be an object!');
    } else if (model.data !== data || force) {
      model.data = data;
      publicAPI.modified();
    }
  };

  // --------------------------------------------------------------------------

  publicAPI.updateData = (data) => {
    Object.assign(model.data, data);
    publicAPI.modified();
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, ['data']);

  // Object methods
  vtkWidgetState(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkHandleWidget');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
