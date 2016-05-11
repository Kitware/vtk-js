import * as macro from '../../../macro';

// ----------------------------------------------------------------------------
// vtkViewNodeFactory methods
// ----------------------------------------------------------------------------

function viewNodeFactory(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkViewNodeFactory');

  publicAPI.createNode = (dataObject) => {
    if (model.overrides.indexOf(dataObject) !== -1) {
      return null;
    }
    const vn = model.overrides[dataObject.getClassName()]();
    vn.setMyFactory(publicAPI);
    return vn;
  };

  publicAPI.registerOverride = (className, func) => {
    model.overrides[className] = func;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  overrides: {},
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);

  // Object methods
  viewNodeFactory(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
