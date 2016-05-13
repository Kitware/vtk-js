import * as macro from '../../../macro';

// ----------------------------------------------------------------------------
// vtkDataSetAttributes methods
// ----------------------------------------------------------------------------

function vtkDataSetAttributes(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkDataSetAttributes');

  publicAPI.getScalars = () => {
    const array = model.arrays[model.activeScalars];
    if (array) {
      return array;
    }
    return null;
  };

  publicAPI.getVectors = () => {
    const array = model.arrays[model.activeVectors];
    if (array) {
      return array;
    }
    return null;
  };

  publicAPI.getNormals = () => {
    const array = model.arrays.Normals;
    if (array) {
      return array;
    }
    return null;
  };

  publicAPI.getTCoords = () => {
    const array = model.arrays.TCoords; // FIXME is it the right array name?
    if (array) {
      return array;
    }
    return null;
  };

  publicAPI.getGlobalIds = () => {
    const array = model.arrays[model.activeGlobalIds];
    if (array) {
      return array;
    }
    return null;
  };

  publicAPI.getPedigreeIds = () => {
    const array = model.arrays[model.activePedigreeIds];
    if (array) {
      return array;
    }
    return null;
  };

  publicAPI.addArray = array => {
    if (model.arrays[array.getName()]) {
      throw new Error('Array with same name already exist', array, model.arrays);
    }
    model.arrays[array.getName()] = array;
  };

  publicAPI.removeArray = (name) => {
    const array = model.arrays[name];
    delete model.arrays[name];
    return array;
  };

  publicAPI.getArrayNames = () => Object.keys(model.arrays);
  publicAPI.getArray = name => model.arrays[name];
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  activeScalars: '',
  activeVectors: '',
  activeTensors: '',
  activeGlobalIds: '',
  activePedigreeIds: '',
  arrays: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, [
    'activeScalars',
    'activeVectors',
    'activeTensors',
    'activeGlobalIds',
    'activePedigreeIds',
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
