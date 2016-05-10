import * as macro from '../../../macro';

// ----------------------------------------------------------------------------

export function viewNodeFactory(publicAPI, model) {
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

function newInstance(initialValues = {}) {
  const model = Object.assign({}, DEFAULT_VALUES, initialValues);
  const publicAPI = {};

  // Build VTK API
  macro.obj(publicAPI, model);

  // Object methods
  viewNodeFactory(publicAPI, model);

  return Object.freeze(publicAPI);
}

// ----------------------------------------------------------------------------

export default { newInstance, viewNodeFactory, DEFAULT_VALUES };
