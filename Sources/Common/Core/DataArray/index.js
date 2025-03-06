import Constants from 'vtk.js/Sources/Common/Core/DataArray/Constants';
import * as macro from 'vtk.js/Sources/macros';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

const { vtkErrorMacro } = macro;
const { DefaultDataType } = Constants;

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------
const EPSILON = 1e-6;

// Original source from https://www.npmjs.com/package/compute-range
// Modified to accept type arrays
function fastComputeRange(arr, offset, numberOfComponents) {
  const len = arr.length;
  let min = Number.MAX_VALUE;
  let max = -Number.MAX_VALUE;
  let x;
  let i;

  // find first non-NaN value
  for (i = offset; i < len; i += numberOfComponents) {
    if (!Number.isNaN(arr[i])) {
      min = arr[i];
      max = min;
      break;
    }
  }

  for (; i < len; i += numberOfComponents) {
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
  const tuple = new Array(numComps);
  for (let i = 0; i < normArray.getNumberOfTuples(); ++i) {
    normArray.getTuple(i, tuple);
    const norm = vtkMath.norm(tuple, numComps);
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

  /**
   * Resize model.values and copy the old values to the new array.
   * @param {Number} requestedNumTuples Final expected number of tuples; must be >= 0
   * @returns {Boolean} True if a resize occured, false otherwise
   */
  function resize(requestedNumTuples) {
    if (requestedNumTuples < 0) {
      return false;
    }

    const numComps = publicAPI.getNumberOfComponents();
    const curNumTuples = model.values.length / (numComps > 0 ? numComps : 1);
    if (requestedNumTuples === curNumTuples) {
      return true;
    }

    if (requestedNumTuples > curNumTuples) {
      // Requested size is bigger than current size.  Allocate enough
      // memory to fit the requested size and be more than double the
      // currently allocated memory.
      const oldValues = model.values;
      model.values = macro.newTypedArray(
        model.dataType,
        (requestedNumTuples + curNumTuples) * numComps
      );
      model.values.set(oldValues);
      return true;
    }

    // Requested size is smaller than currently allocated size
    if (model.size > requestedNumTuples * numComps) {
      model.size = requestedNumTuples * numComps;
      publicAPI.dataChange();
    }

    return true;
  }

  publicAPI.dataChange = () => {
    model.ranges = null;
    publicAPI.modified();
  };

  publicAPI.resize = (requestedNumTuples) => {
    resize(requestedNumTuples);
    const newSize = requestedNumTuples * publicAPI.getNumberOfComponents();
    if (model.size !== newSize) {
      model.size = newSize;
      publicAPI.dataChange();
      return true;
    }
    return false;
  };

  // FIXME, to rename into "clear()" or "reset()"
  publicAPI.initialize = () => {
    publicAPI.resize(0);
  };

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
      publicAPI.dataChange();
    }
  };

  publicAPI.getValue = (valueIdx) => {
    const idx = valueIdx / model.numberOfComponents;
    const comp = valueIdx % model.numberOfComponents;
    return publicAPI.getComponent(idx, comp);
  };

  publicAPI.setValue = (valueIdx, value) => {
    const idx = valueIdx / model.numberOfComponents;
    const comp = valueIdx % model.numberOfComponents;
    publicAPI.setComponent(idx, comp, value);
  };

  publicAPI.getData = () =>
    model.size === model.values.length
      ? model.values
      : model.values.subarray(0, model.size);

  publicAPI.getRange = (componentIndex = -1) => {
    let rangeIdx = componentIndex;
    if (rangeIdx < 0) {
      // If scalar data, then store in slot 0 (same as componentIndex = 0).
      // If vector data, then store in last slot.
      rangeIdx = model.numberOfComponents === 1 ? 0 : model.numberOfComponents;
    }

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
      publicAPI.getData(),
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

  publicAPI.getRanges = (computeRanges = true) => {
    if (!computeRanges) {
      return structuredClone(model.ranges);
    }
    /** @type {import('../../../interfaces').vtkRange[]} */
    const ranges = [];
    for (let i = 0; i < model.numberOfComponents; i++) {
      const [min, max] = publicAPI.getRange(i);
      /** @type {import('../../../interfaces').vtkRange} */
      const range = {
        min,
        max,
        component: i,
      };
      ranges.push(range);
    }
    // where the number of components is greater than 1, the last element in
    // the range array is the min,max magnitude of the entire dataset.
    if (model.numberOfComponents > 1) {
      /** @type {import('../../../interfaces').vtkRange} */
      const [min, max] = publicAPI.getRange(-1);
      const range = {
        min,
        max,
        component: -1,
      };
      ranges.push(range);
    }
    return ranges;
  };

  publicAPI.setTuple = (idx, tuple) => {
    const offset = idx * model.numberOfComponents;
    for (let i = 0; i < model.numberOfComponents; i++) {
      model.values[offset + i] = tuple[i];
    }
  };

  publicAPI.setTuples = (idx, tuples) => {
    let i = idx * model.numberOfComponents;
    const last = Math.min(tuples.length, model.size - i);
    for (let j = 0; j < last; ) {
      model.values[i++] = tuples[j++];
    }
  };

  publicAPI.insertTuple = (idx, tuple) => {
    if (model.size <= idx * model.numberOfComponents) {
      model.size = (idx + 1) * model.numberOfComponents;
      resize(idx + 1);
    }
    publicAPI.setTuple(idx, tuple);
    return idx;
  };

  publicAPI.insertTuples = (idx, tuples) => {
    const end = idx + tuples.length / model.numberOfComponents;
    if (model.size < end * model.numberOfComponents) {
      model.size = end * model.numberOfComponents;
      resize(end);
    }
    publicAPI.setTuples(idx, tuples);
    return end;
  };

  publicAPI.insertNextTuple = (tuple) => {
    const idx = model.size / model.numberOfComponents;
    return publicAPI.insertTuple(idx, tuple);
  };

  publicAPI.insertNextTuples = (tuples) => {
    const idx = model.size / model.numberOfComponents;
    return publicAPI.insertTuples(idx, tuples);
  };

  publicAPI.findTuple = (tuple, precision = EPSILON) => {
    for (let i = 0; i < model.size; i += model.numberOfComponents) {
      if (Math.abs(tuple[0] - model.values[i]) <= precision) {
        let match = true;
        for (let j = 1; j < model.numberOfComponents; ++j) {
          if (Math.abs(tuple[j] - model.values[i + j]) > precision) {
            match = false;
            break;
          }
        }
        if (match) {
          return i / model.numberOfComponents;
        }
      }
    }
    return -1;
  };

  publicAPI.getTuple = (idx, tupleToFill = []) => {
    const numberOfComponents = model.numberOfComponents || 1;
    const offset = idx * numberOfComponents;
    // Check most common component sizes first
    // to avoid doing a for loop if possible
    switch (numberOfComponents) {
      case 4:
        tupleToFill[3] = model.values[offset + 3];
      // eslint-disable-next-line no-fallthrough
      case 3:
        tupleToFill[2] = model.values[offset + 2];
      // eslint-disable-next-line no-fallthrough
      case 2:
        tupleToFill[1] = model.values[offset + 1];
      // eslint-disable-next-line no-fallthrough
      case 1:
        tupleToFill[0] = model.values[offset];
        break;
      default:
        for (let i = numberOfComponents - 1; i >= 0; --i) {
          tupleToFill[i] = model.values[offset + i];
        }
    }
    return tupleToFill;
  };

  publicAPI.getTuples = (fromId, toId) => {
    const from = (fromId ?? 0) * model.numberOfComponents;
    const to =
      (toId ?? publicAPI.getNumberOfTuples()) * model.numberOfComponents;
    const arr = publicAPI.getData().subarray(from, to);
    return arr.length > 0 ? arr : null;
  };

  publicAPI.getTupleLocation = (idx = 1) => idx * model.numberOfComponents;
  publicAPI.getNumberOfComponents = () => model.numberOfComponents;
  publicAPI.getNumberOfValues = () => model.size;
  publicAPI.getNumberOfTuples = () => model.size / model.numberOfComponents;
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
    publicAPI.dataChange();
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

  publicAPI.deepCopy = (other) => {
    // Retain current dataType and array reference before shallowCopy call.
    const currentType = publicAPI.getDataType();
    const currentArray = model.values;
    publicAPI.shallowCopy(other);

    // Avoid array reallocation if size already sufficient
    // and dataTypes match.
    if (
      currentArray?.length >= other.getNumberOfValues() &&
      currentType === other.getDataType()
    ) {
      currentArray.set(other.getData());
      model.values = currentArray;
      publicAPI.dataChange();
    } else {
      publicAPI.setData(other.getData().slice());
    }
  };

  publicAPI.interpolateTuple = (
    idx,
    source1,
    source1Idx,
    source2,
    source2Idx,
    t
  ) => {
    const numberOfComponents = model.numberOfComponents || 1;
    if (
      numberOfComponents !== source1.getNumberOfComponents() ||
      numberOfComponents !== source2.getNumberOfComponents()
    ) {
      vtkErrorMacro('numberOfComponents must match');
    }

    const tuple1 = source1.getTuple(source1Idx);
    const tuple2 = source2.getTuple(source2Idx);
    const out = [];
    out.length = numberOfComponents;

    // Check most common component sizes first
    // to avoid doing a for loop if possible
    switch (numberOfComponents) {
      case 4:
        out[3] = tuple1[3] + (tuple2[3] - tuple1[3]) * t;
      // eslint-disable-next-line no-fallthrough
      case 3:
        out[2] = tuple1[2] + (tuple2[2] - tuple1[2]) * t;
      // eslint-disable-next-line no-fallthrough
      case 2:
        out[1] = tuple1[1] + (tuple2[1] - tuple1[1]) * t;
      // eslint-disable-next-line no-fallthrough
      case 1:
        out[0] = tuple1[0] + (tuple2[0] - tuple1[0]) * t;
        break;
      default:
        for (let i = 0; i < numberOfComponents; i++) {
          out[i] = tuple1[i] + (tuple2[i] - tuple1[i]) * t;
        }
    }

    return publicAPI.insertTuple(idx, out);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

// size: The current size of the dataArray.
// NOTE: The underlying typed array may be larger than 'size'.
const DEFAULT_VALUES = {
  name: '',
  numberOfComponents: 1,
  dataType: DefaultDataType,
  rangeTuple: [0, 0],
  // size: undefined,
  // values: null,
  // ranges: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  if (
    Array.isArray(initialValues.values) &&
    initialValues.dataType === undefined
  ) {
    console.warn(
      'vtkDataArray.newInstance: no dataType provided, converting to Float32Array'
    );
  }

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
    // Takes the size if provided (can be lower than `model.values`) otherwise the actual length of `values`.
    model.size = model.size ?? model.values.length;
    model.dataType = getDataType(model.values);
  }

  // Object methods
  macro.obj(publicAPI, model);
  macro.set(publicAPI, model, ['name', 'numberOfComponents']);

  if (model.size % model.numberOfComponents !== 0) {
    throw new RangeError(
      'model.size is not a multiple of model.numberOfComponents'
    );
  }

  // Object specific methods
  vtkDataArray(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkDataArray');

// ----------------------------------------------------------------------------

export default { newInstance, extend, ...STATIC, ...Constants };
