import macro from 'vtk.js/Sources/macros';

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

function defaultValues(initialValues) {
  return {
    // overrides: {},
    ...initialValues,
  };
}

// ----------------------------------------------------------------------------
// vtkViewNodeFactory methods
// ----------------------------------------------------------------------------

function vtkViewNodeFactory(publicAPI, model) {
  // Make sure our overrides is just for our instance not shared with everyone...
  if (!model.overrides) {
    model.overrides = {};
  }

  // Set our className
  model.classHierarchy.push('vtkViewNodeFactory');

  publicAPI.createNode = (dataObject) => {
    if (dataObject.isDeleted()) {
      return null;
    }

    let cpt = 0;
    let className = dataObject.getClassName(cpt++);
    let isObject = false;
    const keys = Object.keys(model.overrides);
    while (className && !isObject) {
      if (keys.indexOf(className) !== -1) {
        isObject = true;
      } else {
        className = dataObject.getClassName(cpt++);
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

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(initialValues, defaultValues(initialValues));

  // Build VTK API
  macro.obj(publicAPI, model);

  // Object methods
  vtkViewNodeFactory(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkViewNodeFactory',
  true
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
