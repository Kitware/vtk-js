import * as macro from '../../../macro';

// ----------------------------------------------------------------------------
// vtkDataSetAttributes methods
// ----------------------------------------------------------------------------

function vtkDataSetAttributes(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkDataSetAttributes');

  publicAPI.getScalars = () => {
    const scalarArray = model.arrays[model.activeScalar];
    if (scalarArray) {
      return scalarArray;
    }
    return null;
  };

  publicAPI.getNormals = () => {
    const scalarArray = model.arrays.Normals;
    if (scalarArray) {
      return scalarArray;
    }
    return null;
  };

  publicAPI.getTCoords = () => {
    const scalarArray = model.arrays.TCoords; // FIXME is it the right array name?
    if (scalarArray) {
      return scalarArray;
    }
    return null;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  activeScalar: '',
  activeVector: '',
  activeTensor: '',
  arrays: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, [
    'activeScalar',
    'activeVector',
    'activeTensor',
  ]);

  if (!model.arrays) {
    model.arrays = {};
  }

  // Object specific methods
  vtkDataSetAttributes(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
