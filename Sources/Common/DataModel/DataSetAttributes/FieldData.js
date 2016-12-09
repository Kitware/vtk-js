import * as macro from '../../../macro';

/* eslint-disable no-unused-vars */
// Needed so the VTK factory is filled with them
import vtkDataArray from '../../../Common/Core/DataArray';

import vtk from '../../../vtk';

// ----------------------------------------------------------------------------
// vtkDataSetAttributes methods
// ----------------------------------------------------------------------------

function vtkFieldData(publicAPI, model) {
  model.classHierarchy.push('vtkFieldData');
  const superGetState = publicAPI.getState;

  // Decode serialized data if any
  if (model.arrays) {
    model.arrays = model.arrays.map(item => ({ data: vtk(item.data) }));
  }

  publicAPI.initialize = () => {
    publicAPI.initializeFields();
    publicAPI.copyAllOn();
    publicAPI.clearFieldFlags();
  };

  publicAPI.initializeFields = () => {
    model.arrays = [];
    model.copyFieldFlags = {};
    publicAPI.modified();
  };

  publicAPI.copyStructure = (other) => {
    publicAPI.initializeFields();
    model.copyFieldFlags = other.getCopyFieldFlags().map(x => x); // Deep-copy
    model.arrays = other.arrays().map(x => ({ array: x })); // Deep-copy
    // TODO: Copy array information objects (once we support information objects)
  };

  publicAPI.getNumberOfArrays = () => model.arrays.length;
  publicAPI.getNumberOfActiveArrays = () => model.arrays.length;
  publicAPI.addArray = (arr) => { model.arrays = [].concat(model.arrays, { data: arr }); return model.arrays.length - 1; };
  publicAPI.removeArray = (arrayName) => {
    model.arrays = model.arrays.filter(entry => arrayName === entry.data.getName());
  };
  publicAPI.removeArrayByIndex = (arrayIdx) => {
    model.arrays = model.arrays.filter((entry, idx) => idx === arrayIdx);
  };
  publicAPI.getArrays = () => model.arrays.map(entry => entry.data);
  publicAPI.getArray = arraySpec =>
    (typeof arraySpec === 'number' ?
      publicAPI.getArrayByIndex(arraySpec) :
      publicAPI.getArrayByName(arraySpec));
  publicAPI.getArrayByName = arrayName => model.arrays.reduce((a, b, i) => (b.data.getName() === arrayName ? b.data : a), null);
  publicAPI.getArrayWithIndex = arrayName => model.arrays.reduce(
    (a, b, i) => (b.data && b.data.getName() === arrayName ? { array: b.data, index: i } : a), { array: null, index: -1 });
  publicAPI.getArrayByIndex = idx => (idx >= 0 && idx < model.arrays.length ? model.arrays[idx].data : null);
  publicAPI.hasArray = arrayName => publicAPI.getArrayWithIndex(arrayName).index >= 0;
  publicAPI.getArrayName = (idx) => {
    const arr = model.arrays[idx];
    return arr ? arr.data.getName() : '';
  };
  publicAPI.getCopyFieldFlags = () => model.copyFieldFlags;
  publicAPI.getFlag = arrayName => model.copyFieldFlags[arrayName];
  publicAPI.passData = (other) => {
    other.getArrays().forEach((arr, idx) => {
      const copyFlag = publicAPI.getFlag(arr.getName());
      if (copyFlag !== false && !(model.doCopyAllOff && copyFlag !== true) && arr) {
        publicAPI.addArray(arr);
      }
    });
  };
  publicAPI.copyFieldOn = (arrayName) => { model.copyFieldFlags[arrayName] = true; };
  publicAPI.copyFieldOff = (arrayName) => { model.copyFieldFlags[arrayName] = false; };
  publicAPI.copyAllOn = () => {
    if (!model.doCopyAllOn || model.doCopyAllOff) {
      model.doCopyAllOn = true;
      model.doCopyAllOff = false;
      publicAPI.modified();
    }
  };
  publicAPI.copyAllOff = () => {
    if (model.doCopyAllOn || !model.doCopyAllOff) {
      model.doCopyAllOn = false;
      model.doCopyAllOff = true;
      publicAPI.modified();
    }
  };
  publicAPI.clearFieldFlags = () => {
    model.copyFieldFlags = {};
  };
  publicAPI.deepCopy = (other) => {
    model.arrays = other.getArrays().map((arr) => {
      const arrNew = arr.newClone();
      arrNew.deepCopy(arr);
      return { data: arrNew };
    });
  };
  publicAPI.createShallowCopy = () => {
    const other = publicAPI.newInstance();
    model.arrays.forEach((arr) => { other.addArray(arr); });
    other.copyFlags(publicAPI);
  };
  publicAPI.copyFlags = other => other.getCopyFieldFlags().map(x => x);
  // TODO: publicAPI.squeeze = () => model.arrays.forEach(entry => entry.data.squeeze());
  publicAPI.reset = () => model.arrays.forEach(entry => entry.data.reset());
  // TODO: getActualMemorySize
  publicAPI.getMTime = () => model.arrays.reduce((a, b) => (b.data.getMTime() > a ? b.data.getMTime() : a), model.mtime);
  // TODO: publicAPI.getField = (ids, other) => { copy ids from other into this model's arrays }
  // TODO: publicAPI.getArrayContainingComponent = (component) => ...
  publicAPI.getNumberOfComponents = () => model.arrays.reduce((a, b) => a + b.data.getNumberOfComponents(), 0);
  publicAPI.getNumberOfTuples = () => (model.arrays.length > 0 ? model.arrays[0].getNumberOfTuples() : 0);

  publicAPI.getState = () => {
    const result = superGetState();
    result.arrays = model.arrays.map(item => ({ data: item.data.getState() }));
    return result;
  };
}

const DEFAULT_VALUES = {
  arrays: [],
  copyFieldFlags: [], // fields not to copy
  doCopyAllOn: true,
  doCopyAllOff: false,
};


export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  macro.obj(publicAPI, model);

  vtkFieldData(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkFieldData');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
