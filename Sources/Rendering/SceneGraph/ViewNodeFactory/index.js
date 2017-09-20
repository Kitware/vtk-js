import macro from 'vtk.js/Sources/macro';

// ----------------------------------------------------------------------------
// vtkViewNodeFactory methods
// ----------------------------------------------------------------------------

function vtkViewNodeFactory(publicAPI, model) {
  // Make sure our overrides is just for our instance not shared with everyone...
  model.overrides = {};

  // Set our className
  model.classHierarchy.push('vtkViewNodeFactory');

  publicAPI.createNode = (dataObject) => {
    if (dataObject.isDeleted()) {
      return null;
    }
    // if (Object.keys(model.overrides).indexOf(dataObject.getClassName()) === -1) {
    //   return null;
    // }

    const hierarchy = dataObject.getHierarchy();
    let isObject = false;
    let className = '';
    for (let i = hierarchy.length - 1; i > 0; i--) {
      if (Object.keys(model.overrides).indexOf(hierarchy[i]) !== -1) {
        isObject = true;
        className = hierarchy[i];
        break;
      }
    }
    if (!isObject) {
      return null;
    }
    const vn = model.overrides[className]();
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
  // overrides: {},
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);

  // Object methods
  vtkViewNodeFactory(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkViewNodeFactory');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
