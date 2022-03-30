import Constants from 'vtk.js/Sources/Common/Core/DataArray/Constants';
import * as macro from 'vtk.js/Sources/macros';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

const { DefaultDataType } = Constants;
const TUPLE_HOLDER = [];

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

// Original source from https://www.npmjs.com/package/compute-range
// Modified to accept type arrays
function fastComputeRange(arr, offset, numberOfComponents) {
  const len = arr.length;
  let min;
  let max;
  let x;
  let i;

  if (len === 0) {
    return { min: Number.MAX_VALUE, max: -Number.MAX_VALUE };
  }
  min = arr[offset];
  max = min;
  for (i = offset; i < len; i += numberOfComponents) {
    x = arr[i];
    if (x < min) {
      min = x;
    } else if (x > max) {
      max = x;
    }
  }
  return { min, max };
}

/**
 * @deprecated please use fastComputeRange instead
 */
function createRangeHelper() {
  let min = Number.MAX_VALUE;
  let max = -Number.MAX_VALUE;
  let count = 0;
  let sum = 0;

  return {
    add(value) {
      if (min > value) {
        min = value;
      }
      if (max < value) {
        max = value;
      }
      count++;
      sum += value;
    },
    get() {
      return { min, max, count, sum, mean: sum / count };
    },
    getRange() {
      return { min, max };
    },
  };
}

function computeRange(values, component = 0, numberOfComponents = 1) {
  if (component < 0 && numberOfComponents > 1) {
    // Compute magnitude
    const size = values.length;
    const numberOfValues = size / numberOfComponents;
    const data = new Float64Array(numberOfValues);
    for (let i = 0, j = 0; i < numberOfValues; ++i) {
      for (let nextJ = j + numberOfComponents; j < nextJ; ++j) {
        data[i] += values[j] * values[j];
      }
      data[i] **= 0.5;
    }
    return fastComputeRange(data, 0, 1);
  }

  return fastComputeRange(
    values,
    component < 0 ? 0 : component,
    numberOfComponents
  );
}

function ensureRangeSize(rangeArray, size = 0) {
  const ranges = rangeArray || [];
  // Pad ranges with null value to get the
  while (ranges.length <= size) {
    ranges.push(null);
  }
  return ranges;
}

function getDataType(typedArray) {
  // Expects toString() to return "[object ...Array]"
  return Object.prototype.toString.call(typedArray).slice(8, -1);
}

function getMaxNorm(normArray) {
  const numComps = normArray.getNumberOfComponents();
  let maxNorm = 0.0;
  for (let i = 0; i < normArray.getNumberOfTuples(); ++i) {
    const norm = vtkMath.norm(normArray.getTuple(i), numComps);
    if (norm > maxNorm) {
      maxNorm = norm;
    }
  }
  return maxNorm;
}

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

export const STATIC = {
  computeRange,
  createRangeHelper,
  fastComputeRange,
  getDataType,
  getMaxNorm,
};

// ----------------------------------------------------------------------------
// vtkDataArray methods
// ----------------------------------------------------------------------------

function vtkDataArray(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkDataArray');

  function dataChange() {
    model.ranges = null;
    publicAPI.modified();
  }

  publicAPI.getElementComponentSize = () => model.values.BYTES_PER_ELEMENT;

  // Description:
  // Return the data component at the location specified by tupleIdx and
  // compIdx.
  publicAPI.getComponent = (tupleIdx, compIdx = 0) =>
    model.values[tupleIdx * model.numberOfComponents + compIdx];

  // Description:
  // Set the data component at the location specified by tupleIdx and compIdx
  // to value.
  // Note that i is less than NumberOfTuples and j is less than
  //  NumberOfComponents. Make sure enough memory has been allocated
  // (use SetNumberOfTuples() and SetNumberOfComponents()).
  publicAPI.setComponent = (tupleIdx, compIdx, value) => {
    if (value !== model.values[tupleIdx * model.numberOfComponents + compIdx]) {
      model.values[tupleIdx * model.numberOfComponents + compIdx] = value;
      dataChange();
    }
  };

  publicAPI.getData = () => model.values;

  publicAPI.getRange = (componentIndex = -1) => {
    const rangeIdx =
      componentIndex < 0 ? model.numberOfComponents : componentIndex;
    let range = null;

    if (!model.ranges) {
      model.ranges = ensureRangeSize(model.ranges, model.numberOfComponents);
    }
    range = model.ranges[rangeIdx];

    if (range) {
      model.rangeTuple[0] = range.min;
      model.rangeTuple[1] = range.max;
      return model.rangeTuple;
    }

    // Need to compute ranges...
    range = computeRange(
      model.values,
      componentIndex,
      model.numberOfComponents
    );
    model.ranges[rangeIdx] = range;
    model.rangeTuple[0] = range.min;
    model.rangeTuple[1] = range.max;
    return model.rangeTuple;
  };

  publicAPI.setRange = (rangeValue, componentIndex) => {
    if (!model.ranges) {
      model.ranges = ensureRangeSize(model.ranges, model.numberOfComponents);
    }
    const range = { min: rangeValue.min, max: rangeValue.max };

    model.ranges[componentIndex] = range;
    model.rangeTuple[0] = range.min;
    model.rangeTuple[1] = range.max;

    return model.rangeTuple;
  };

  publicAPI.setTuple = (idx, tuple) => {
    const offset = idx * model.numberOfComponents;
    for (let i = 0; i < model.numberOfComponents; i++) {
      model.values[offset + i] = tuple[i];
    }
  };

  publicAPI.getTuple = (idx, tupleToFill = TUPLE_HOLDER) => {
    const numberOfComponents = model.numberOfComponents || 1;
    if (tupleToFill.length !== numberOfComponents) {
      tupleToFill.length = numberOfComponents;
    }
    const offset = idx * numberOfComponents;
    // Check most common component sizes first
    // to avoid doing a for loop if possible
    if (numberOfComponents === 1) {
      tupleToFill[0] = model.values[offset];
    } else if (numberOfComponents === 2) {
      tupleToFill[0] = model.values[offset];
      tupleToFill[1] = model.values[offset + 1];
    } else if (numberOfComponents === 3) {
      tupleToFill[0] = model.values[offset];
      tupleToFill[1] = model.values[offset + 1];
      tupleToFill[2] = model.values[offset + 2];
    } else if (numberOfComponents === 4) {
      tupleToFill[0] = model.values[offset];
      tupleToFill[1] = model.values[offset + 1];
      tupleToFill[2] = model.values[offset + 2];
      tupleToFill[3] = model.values[offset + 3];
    } else {
      for (let i = 0; i < numberOfComponents; i++) {
        tupleToFill[i] = model.values[offset + i];
      }
    }
    return tupleToFill;
  };

  publicAPI.getTupleLocation = (idx = 1) => idx * model.numberOfComponents;
  publicAPI.getNumberOfComponents = () => model.numberOfComponents;
  publicAPI.getNumberOfValues = () => model.values.length;
  publicAPI.getNumberOfTuples = () =>
    model.values.length / model.numberOfComponents;
  publicAPI.getDataType = () => model.dataType;
  /* eslint-disable no-use-before-define */
  publicAPI.newClone = () =>
    newInstance({
      empty: true,
      name: model.name,
      dataType: model.dataType,
      numberOfComponents: model.numberOfComponents,
    });
  /* eslint-enable no-use-before-define */

  publicAPI.getName = () => {
    if (!model.name) {
      publicAPI.modified();
      model.name = `vtkDataArray${publicAPI.getMTime()}`;
    }
    return model.name;
  };

  publicAPI.setData = (typedArray, numberOfComponents) => {
    model.values = typedArray;
    model.size = typedArray.length;
    model.dataType = getDataType(typedArray);
    if (numberOfComponents) {
      model.numberOfComponents = numberOfComponents;
    }
    if (model.size % model.numberOfComponents !== 0) {
      model.numberOfComponents = 1;
    }
    dataChange();
  };

  // Override serialization support
  publicAPI.getState = () => {
    if (model.deleted) {
      return null;
    }
    const jsonArchive = { ...model, vtkClass: publicAPI.getClassName() };

    // Convert typed array to regular array
    jsonArchive.values = Array.from(jsonArchive.values);
    delete jsonArchive.buffer;

    // Clean any empty data
    Object.keys(jsonArchive).forEach((keyName) => {
      if (!jsonArchive[keyName]) {
        delete jsonArchive[keyName];
      }
    });

    // Sort resulting object by key name
    const sortedObj = {};
    Object.keys(jsonArchive)
      .sort()
      .forEach((name) => {
        sortedObj[name] = jsonArchive[name];
      });

    // Remove mtime
    if (sortedObj.mtime) {
      delete sortedObj.mtime;
    }

    return sortedObj;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  name: '',
  numberOfComponents: 1,
  size: 0,
  dataType: DefaultDataType,
  rangeTuple: [0, 0],
  // values: null,
  // ranges: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  if (!model.empty && !model.values && !model.size) {
    throw new TypeError(
      'Cannot create vtkDataArray object without: size > 0, values'
    );
  }

  if (!model.values) {
    model.values = macro.newTypedArray(model.dataType, model.size);
  } else if (Array.isArray(model.values)) {
    model.values = macro.newTypedArrayFrom(model.dataType, model.values);
  }

  if (model.values) {
    model.size = model.values.length;
    model.dataType = getDataType(model.values);
  }

  // Object methods
  macro.obj(publicAPI, model);
  macro.set(publicAPI, model, ['name', 'numberOfComponents']);

  // Object specific methods
  vtkDataArray(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkDataArray');

// ----------------------------------------------------------------------------

export default { newInstance, extend, ...STATIC, ...Constants };
