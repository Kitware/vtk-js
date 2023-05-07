import vtk from 'vtk.js/Sources/vtk';
import macro from 'vtk.js/Sources/macros';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';

const { vtkErrorMacro, vtkWarningMacro } = macro;

// ----------------------------------------------------------------------------
// vtkFieldData methods
// ----------------------------------------------------------------------------

function vtkFieldData(publicAPI, model) {
  model.classHierarchy.push('vtkFieldData');
  const superGetState = publicAPI.getState;

  // Decode serialized data if any
  if (model.arrays) {
    model.arrays = model.arrays.map((item) => ({ data: vtk(item.data) }));
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
    model.copyFieldFlags = other.getCopyFieldFlags().map((x) => x); // Deep-copy
    model.arrays = other.arrays().map((x) => ({ array: x })); // Deep-copy
    // TODO: Copy array information objects (once we support information objects)
  };

  publicAPI.getNumberOfArrays = () => model.arrays.length;
  publicAPI.getNumberOfActiveArrays = () => model.arrays.length;
  publicAPI.addArray = (arr) => {
    const name = arr.getName();
    const { array, index } = publicAPI.getArrayWithIndex(name);
    if (array != null) {
      model.arrays[index] = { data: arr };
      return index;
    }
    model.arrays = [].concat(model.arrays, { data: arr });
    return model.arrays.length - 1;
  };
  publicAPI.removeAllArrays = () => {
    model.arrays = [];
  };
  publicAPI.removeArray = (arrayName) => {
    const index = model.arrays.findIndex(
      (array) => array.data.getName() === arrayName
    );
    return publicAPI.removeArrayByIndex(index);
  };
  publicAPI.removeArrayByIndex = (arrayIdx) => {
    if (arrayIdx !== -1 && arrayIdx < model.arrays.length) {
      model.arrays.splice(arrayIdx, 1);
      // TBD modified() ?
      return true;
    }
    return false;
  };
  publicAPI.getArrays = () => model.arrays.map((entry) => entry.data);
  publicAPI.getArray = (arraySpec) =>
    typeof arraySpec === 'number'
      ? publicAPI.getArrayByIndex(arraySpec)
      : publicAPI.getArrayByName(arraySpec);
  publicAPI.getArrayByName = (arrayName) =>
    model.arrays.reduce(
      (a, b, i) => (b.data.getName() === arrayName ? b.data : a),
      null
    );
  publicAPI.getArrayWithIndex = (arrayName) => {
    const index = model.arrays.findIndex(
      (array) => array.data.getName() === arrayName
    );
    return { array: index !== -1 ? model.arrays[index].data : null, index };
  };
  publicAPI.getArrayByIndex = (idx) =>
    idx >= 0 && idx < model.arrays.length ? model.arrays[idx].data : null;
  publicAPI.hasArray = (arrayName) =>
    publicAPI.getArrayWithIndex(arrayName).index >= 0;
  publicAPI.getArrayName = (idx) => {
    const arr = model.arrays[idx];
    return arr ? arr.data.getName() : '';
  };
  publicAPI.getCopyFieldFlags = () => model.copyFieldFlags;
  publicAPI.getFlag = (arrayName) => model.copyFieldFlags[arrayName];
  publicAPI.passData = (other, fromId = -1, toId = -1) => {
    other.getArrays().forEach((arr) => {
      const copyFlag = publicAPI.getFlag(arr.getName());
      if (
        copyFlag !== false &&
        !(model.doCopyAllOff && copyFlag !== true) &&
        arr
      ) {
        let destArr = publicAPI.getArrayByName(arr.getName());
        if (!destArr) {
          if (fromId < 0 || fromId > arr.getNumberOfTuples()) {
            // TBD: should this be a deep or a shallow copy?
            publicAPI.addArray(arr);
            other.getAttributes(arr).forEach((attrType) => {
              publicAPI.setAttribute(arr, attrType);
            });
          } else {
            const ncomps = arr.getNumberOfComponents();
            let newSize = arr.getNumberOfValues();
            const tId = toId > -1 ? toId : fromId;
            if (newSize <= tId * ncomps) {
              newSize = (tId + 1) * ncomps;
            }
            destArr = vtkDataArray.newInstance({
              name: arr.getName(),
              dataType: arr.getDataType(),
              numberOfComponents: ncomps,
              values: macro.newTypedArray(arr.getDataType(), newSize),
              size: 0,
            });
            destArr.insertTuple(tId, arr.getTuple(fromId));
            publicAPI.addArray(destArr);
            other.getAttributes(arr).forEach((attrType) => {
              publicAPI.setAttribute(destArr, attrType);
            });
          }
        } else if (
          arr.getNumberOfComponents() === destArr.getNumberOfComponents()
        ) {
          if (fromId > -1 && fromId < arr.getNumberOfTuples()) {
            const tId = toId > -1 ? toId : fromId;
            destArr.insertTuple(tId, arr.getTuple(fromId));
          } else {
            // if `fromId` is not provided, just copy all (or as much possible)
            // from `arr` to `destArr`.
            destArr.insertTuples(0, arr.getTuples());
          }
        } else {
          vtkErrorMacro('Unhandled case in passData');
        }
      }
    });
  };

  publicAPI.interpolateData = (
    other,
    fromId1 = -1,
    fromId2 = -1,
    toId = -1,
    t = 0.5
  ) => {
    other.getArrays().forEach((arr) => {
      const copyFlag = publicAPI.getFlag(arr.getName());
      if (
        copyFlag !== false &&
        !(model.doCopyAllOff && copyFlag !== true) &&
        arr
      ) {
        let destArr = publicAPI.getArrayByName(arr.getName());
        if (!destArr) {
          if (fromId1 < 0 || fromId2 < 0 || fromId1 > arr.getNumberOfTuples()) {
            // TBD: should this be a deep or a shallow copy?
            publicAPI.addArray(arr);
            other.getAttributes(arr).forEach((attrType) => {
              publicAPI.setAttribute(arr, attrType);
            });
          } else {
            const ncomps = arr.getNumberOfComponents();
            let newSize = arr.getNumberOfValues();
            // TODO: Is this supposed to happen?
            const tId = toId > -1 ? toId : fromId1;
            if (newSize <= tId * ncomps) {
              newSize = (tId + 1) * ncomps;
            }
            destArr = vtkDataArray.newInstance({
              name: arr.getName(),
              dataType: arr.getDataType(),
              numberOfComponents: ncomps,
              values: macro.newTypedArray(arr.getDataType(), newSize),
              size: 0,
            });
            destArr.interpolateTuple(tId, arr, fromId1, arr, fromId2, t);
            publicAPI.addArray(destArr);
            other.getAttributes(arr).forEach((attrType) => {
              publicAPI.setAttribute(destArr, attrType);
            });
          }
        } else if (
          arr.getNumberOfComponents() === destArr.getNumberOfComponents()
        ) {
          if (fromId1 > -1 && fromId1 < arr.getNumberOfTuples()) {
            const tId = toId > -1 ? toId : fromId1;
            destArr.interpolateTuple(tId, arr, fromId1, arr, fromId2, t);
            vtkWarningMacro('Unexpected case in interpolateData');
          } else {
            // if `fromId` is not provided, just copy all (or as much possible)
            // from `arr` to `destArr`.
            destArr.insertTuples(arr.getTuples());
          }
        } else {
          vtkErrorMacro('Unhandled case in interpolateData');
        }
      }
    });
  };
  publicAPI.copyFieldOn = (arrayName) => {
    model.copyFieldFlags[arrayName] = true;
  };
  publicAPI.copyFieldOff = (arrayName) => {
    model.copyFieldFlags[arrayName] = false;
  };
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
  publicAPI.copyFlags = (other) => other.getCopyFieldFlags().map((x) => x);
  // TODO: publicAPI.squeeze = () => model.arrays.forEach(entry => entry.data.squeeze());
  publicAPI.reset = () => model.arrays.forEach((entry) => entry.data.reset());
  // TODO: getActualMemorySize
  publicAPI.getMTime = () =>
    model.arrays.reduce(
      (a, b) => (b.data.getMTime() > a ? b.data.getMTime() : a),
      model.mtime
    );
  // TODO: publicAPI.getField = (ids, other) => { copy ids from other into this model's arrays }
  // TODO: publicAPI.getArrayContainingComponent = (component) => ...
  publicAPI.getNumberOfComponents = () =>
    model.arrays.reduce((a, b) => a + b.data.getNumberOfComponents(), 0);
  publicAPI.getNumberOfTuples = () =>
    model.arrays.length > 0 ? model.arrays[0].getNumberOfTuples() : 0;

  publicAPI.getState = () => {
    const result = superGetState();
    if (result) {
      result.arrays = model.arrays.map((item) => ({
        data: item.data.getState(),
      }));
    }
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
