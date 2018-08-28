import Constants from 'vtk.js/Sources/Common/Core/DataArray/Constants';
import macro from 'vtk.js/Sources/macro';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';

const { DefaultDataType } = Constants;
const TUPLE_HOLDER = [];

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

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
  const helper = createRangeHelper();
  const size = values.length;
  let value = 0;

  if (component < 0 && numberOfComponents > 1) {
    // Compute magnitude
    for (let i = 0; i < size; i += numberOfComponents) {
      value = 0;
      for (let j = 0; j < numberOfComponents; j++) {
        value += values[i + j] * values[i + j];
      }
      value **= 0.5;
      helper.add(value);
    }
    return helper.getRange();
  }

  const offset = component < 0 ? 0 : component;
  for (let i = offset; i < size; i += numberOfComponents) {
    helper.add(values[i]);
  }

  return helper.getRange();
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
  return Object.prototype.toString
    .call(typedArray)
    .split(' ')[1]
    .slice(0, -1);
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
    const jsonArchive = Object.assign({}, model, {
      vtkClass: publicAPI.getClassName(),
    });

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
    model.values = new window[model.dataType](model.size);
  } else if (Array.isArray(model.values)) {
    model.values = window[model.dataType].from(model.values);
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

export default Object.assign({ newInstance, extend }, STATIC, Constants);
