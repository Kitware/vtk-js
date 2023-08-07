import _defineProperty from '@babel/runtime/helpers/defineProperty';
import Constants from './DataArray/Constants.js';
import { newInstance as newInstance$1, newTypedArray, newTypedArrayFrom, obj, set, vtkErrorMacro as vtkErrorMacro$1 } from '../../macros.js';
import { n as norm } from './Math/index.js';

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
var vtkErrorMacro = vtkErrorMacro$1;
var DefaultDataType = Constants.DefaultDataType; // ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------
// Original source from https://www.npmjs.com/package/compute-range
// Modified to accept type arrays

function fastComputeRange(arr, offset, numberOfComponents) {
  var len = arr.length;
  var min;
  var max;
  var x;
  var i;

  if (len === 0) {
    return {
      min: Number.MAX_VALUE,
      max: -Number.MAX_VALUE
    };
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

  return {
    min: min,
    max: max
  };
}
/**
 * @deprecated please use fastComputeRange instead
 */


function createRangeHelper() {
  var min = Number.MAX_VALUE;
  var max = -Number.MAX_VALUE;
  var count = 0;
  var sum = 0;
  return {
    add: function add(value) {
      if (min > value) {
        min = value;
      }

      if (max < value) {
        max = value;
      }

      count++;
      sum += value;
    },
    get: function get() {
      return {
        min: min,
        max: max,
        count: count,
        sum: sum,
        mean: sum / count
      };
    },
    getRange: function getRange() {
      return {
        min: min,
        max: max
      };
    }
  };
}

function computeRange(values) {
  var component = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  var numberOfComponents = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;

  if (component < 0 && numberOfComponents > 1) {
    // Compute magnitude
    var size = values.length;
    var numberOfValues = size / numberOfComponents;
    var data = new Float64Array(numberOfValues);

    for (var i = 0, j = 0; i < numberOfValues; ++i) {
      var _i;

      for (var nextJ = j + numberOfComponents; j < nextJ; ++j) {
        data[i] += values[j] * values[j];
      }

      _i = i, data[_i] = Math.pow(data[_i], 0.5);
    }

    return fastComputeRange(data, 0, 1);
  }

  return fastComputeRange(values, component < 0 ? 0 : component, numberOfComponents);
}

function ensureRangeSize(rangeArray) {
  var size = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  var ranges = rangeArray || []; // Pad ranges with null value to get the

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
  var numComps = normArray.getNumberOfComponents();
  var maxNorm = 0.0;
  var tuple = new Array(numComps);

  for (var i = 0; i < normArray.getNumberOfTuples(); ++i) {
    normArray.getTuple(i, tuple);
    var norm$1 = norm(tuple, numComps);

    if (norm$1 > maxNorm) {
      maxNorm = norm$1;
    }
  }

  return maxNorm;
} 

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------


var STATIC = {
  computeRange: computeRange,
  createRangeHelper: createRangeHelper,
  fastComputeRange: fastComputeRange,
  getDataType: getDataType,
  getMaxNorm: getMaxNorm,
  // createDataArray: createDataArray,
}; // ----------------------------------------------------------------------------
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

    var numComps = publicAPI.getNumberOfComponents();
    var curNumTuples = model.values.length / (numComps > 0 ? numComps : 1);

    if (requestedNumTuples === curNumTuples) {
      return true;
    }

    if (requestedNumTuples > curNumTuples) {
      // Requested size is bigger than current size.  Allocate enough
      // memory to fit the requested size and be more than double the
      // currently allocated memory.
      var oldValues = model.values;
      model.values = newTypedArray(model.dataType, (requestedNumTuples + curNumTuples) * numComps);
      model.values.set(oldValues);
      return true;
    } // Requested size is smaller than currently allocated size


    if (model.size > requestedNumTuples * numComps) {
      model.size = requestedNumTuples * numComps;
      publicAPI.dataChange();
    }

    return true;
  }

  publicAPI.dataChange = function () {
    model.ranges = null;
    publicAPI.modified();
  };
  
  publicAPI.resize = function (requestedNumTuples) {
    resize(requestedNumTuples);
    var newSize = requestedNumTuples * publicAPI.getNumberOfComponents();

    if (model.size !== newSize) {
      model.size = newSize;
      publicAPI.dataChange();
      return true;
    }

    return false;
  }; // FIXME, to rename into "clear()" or "reset()"


  publicAPI.initialize = function () {
    publicAPI.resize(0);
  };

  publicAPI.getElementComponentSize = function () {
    return model.values.BYTES_PER_ELEMENT;
  }; // Description:
  // Return the data component at the location specified by tupleIdx and
  // compIdx.


  publicAPI.getComponent = function (tupleIdx) {
    var compIdx = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    console.log("getComponent tupleIdx = ", tupleIdx);
    console.log("getComponent compIdx = ", compIdx); 
    console.log("getComponent arguments = ", arguments); 
    console.log("getComponent model.values = ", model.values);
    console.log("getComponent model.numberOfComponents = ", model.numberOfComponents);
    return model.values[tupleIdx * model.numberOfComponents + compIdx];
  }; 
  // Description:
  // Set the data component at the location specified by tupleIdx and compIdx
  // to value.
  // Note that i is less than NumberOfTuples and j is less than
  //  NumberOfComponents. Make sure enough memory has been allocated
  // (use SetNumberOfTuples() and SetNumberOfComponents()).


  publicAPI.setComponent = function (tupleIdx, compIdx, value) {
    if (value !== model.values[tupleIdx * model.numberOfComponents + compIdx]) {
      model.values[tupleIdx * model.numberOfComponents + compIdx] = value;
      publicAPI.dataChange();
    }
  };

  publicAPI.getValue = function (valueIdx) {
    var idx = valueIdx / model.numberOfComponents;
    var comp = valueIdx % model.numberOfComponents;
    return publicAPI.getComponent(idx, comp);
  };

  publicAPI.setValue = function (valueIdx, value) {
    var idx = valueIdx / model.numberOfComponents;
    var comp = valueIdx % model.numberOfComponents;
    publicAPI.setComponent(idx, comp, value);
  };

  publicAPI.getData = function () {
    return model.size === model.values.length ? model.values : model.values.subarray(0, model.size);
  };

  publicAPI.getRange = function () {
    var componentIndex = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : -1;
    var rangeIdx = componentIndex;

    if (rangeIdx < 0) {
      // If scalar data, then store in slot 0 (same as componentIndex = 0).
      // If vector data, then store in last slot.
      rangeIdx = model.numberOfComponents === 1 ? 0 : model.numberOfComponents;
    }

    var range = null;

    if (!model.ranges) {
      model.ranges = ensureRangeSize(model.ranges, model.numberOfComponents);
    }

    range = model.ranges[rangeIdx];

    if (range) {
      model.rangeTuple[0] = range.min;
      model.rangeTuple[1] = range.max;
      return model.rangeTuple;
    } // Need to compute ranges...


    range = computeRange(publicAPI.getData(), componentIndex, model.numberOfComponents);
    model.ranges[rangeIdx] = range;
    model.rangeTuple[0] = range.min;
    model.rangeTuple[1] = range.max;
    return model.rangeTuple;
  };

  publicAPI.setRange = function (rangeValue, componentIndex) {
    if (!model.ranges) {
      model.ranges = ensureRangeSize(model.ranges, model.numberOfComponents);
    }

    var range = {
      min: rangeValue.min,
      max: rangeValue.max
    };
    model.ranges[componentIndex] = range;
    model.rangeTuple[0] = range.min;
    model.rangeTuple[1] = range.max;
    return model.rangeTuple;
  };

  publicAPI.setTuple = function (idx, tuple) {
    var offset = idx * model.numberOfComponents;

    for (var i = 0; i < model.numberOfComponents; i++) {
      model.values[offset + i] = tuple[i];
    }
  };

  publicAPI.setTuples = function (idx, tuples) {
    var i = idx * model.numberOfComponents;
    var last = Math.min(tuples.length, model.size - i);

    for (var j = 0; j < last;) {
      model.values[i++] = tuples[j++];
    }
  };

  publicAPI.insertTuple = function (idx, tuple) {
    if (model.size <= idx * model.numberOfComponents) {
      model.size = (idx + 1) * model.numberOfComponents;
      resize(idx + 1);
    }

    publicAPI.setTuple(idx, tuple);
    return idx;
  };

  publicAPI.insertTuples = function (idx, tuples) {
    var end = idx + tuples.length / model.numberOfComponents;

    if (model.size < end * model.numberOfComponents) {
      model.size = end * model.numberOfComponents;
      resize(end);
    }

    publicAPI.setTuples(idx, tuples);
    return end;
  };

  publicAPI.insertNextTuple = function (tuple) {
    var idx = model.size / model.numberOfComponents;
    return publicAPI.insertTuple(idx, tuple);
  };

  publicAPI.insertNextTuples = function (tuples) {
    var idx = model.size / model.numberOfComponents;
    return publicAPI.insertTuples(idx, tuples);
  };

  publicAPI.getTuple = function (idx) {
    var tupleToFill = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
    var numberOfComponents = model.numberOfComponents || 1;
    var offset = idx * numberOfComponents; // Check most common component sizes first
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
        for (var i = numberOfComponents - 1; i >= 0; --i) {
          tupleToFill[i] = model.values[offset + i];
        }

    }

    return tupleToFill;
  };

  publicAPI.getTuples = function (fromId, toId) {
    var from = (fromId !== null && fromId !== void 0 ? fromId : 0) * model.numberOfComponents;
    var to = (toId !== null && toId !== void 0 ? toId : publicAPI.getNumberOfTuples()) * model.numberOfComponents;
    var arr = publicAPI.getData().subarray(from, to);
    return arr.length > 0 ? arr : null;
  };

  publicAPI.getTupleLocation = function () {
    var idx = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
    return idx * model.numberOfComponents;
  };

  publicAPI.getNumberOfComponents = function () {
    return model.numberOfComponents;
  };

  publicAPI.getNumberOfValues = function () {
    return model.size;
  };

  publicAPI.getNumberOfTuples = function () {
    return model.size / model.numberOfComponents;
  };

  publicAPI.getDataType = function () {
    return model.dataType;
  };
  /* eslint-disable no-use-before-define */


  publicAPI.newClone = function () {
    return newInstance({
      empty: true,
      name: model.name,
      dataType: model.dataType,
      numberOfComponents: model.numberOfComponents
    });
  };
  /* eslint-enable no-use-before-define */


  publicAPI.getName = function () {
    if (!model.name) {
      publicAPI.modified();
      model.name = "vtkDataArray".concat(publicAPI.getMTime());
    }

    return model.name;
  };

  publicAPI.setData = function (typedArray, numberOfComponents) {
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
  }; // Override serialization support


  publicAPI.getState = function () {
    if (model.deleted) {
      return null;
    }

    var jsonArchive = _objectSpread(_objectSpread({}, model), {}, {
      vtkClass: publicAPI.getClassName()
    }); // Convert typed array to regular array


    jsonArchive.values = Array.from(jsonArchive.values);
    delete jsonArchive.buffer; // Clean any empty data

    Object.keys(jsonArchive).forEach(function (keyName) {
      if (!jsonArchive[keyName]) {
        delete jsonArchive[keyName];
      }
    }); // Sort resulting object by key name

    var sortedObj = {};
    Object.keys(jsonArchive).sort().forEach(function (name) {
      sortedObj[name] = jsonArchive[name];
    }); // Remove mtime

    if (sortedObj.mtime) {
      delete sortedObj.mtime;
    }

    return sortedObj;
  };

  publicAPI.deepCopy = function (other) {
    publicAPI.shallowCopy(other);
    publicAPI.setData(other.getData().slice());
  };

  publicAPI.interpolateTuple = function (idx, source1, source1Idx, source2, source2Idx, t) {
    var numberOfComponents = model.numberOfComponents || 1;

    if (numberOfComponents !== source1.getNumberOfComponents() || numberOfComponents !== source2.getNumberOfComponents()) {
      vtkErrorMacro('numberOfComponents must match');
    }

    var tuple1 = source1.getTuple(source1Idx);
    var tuple2 = source2.getTuple(source2Idx);
    var out = [];
    out.length = numberOfComponents; // Check most common component sizes first
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
        for (var i = 0; i < numberOfComponents; i++) {
          out[i] = tuple1[i] + (tuple2[i] - tuple1[i]) * t;
        }

    }

    return publicAPI.insertTuple(idx, out);
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------
// size: The current size of the dataArray.
// NOTE: The underlying typed array may be larger than 'size'.


var DEFAULT_VALUES = {
  name: '',
  numberOfComponents: 1,
  dataType: DefaultDataType,
  rangeTuple: [0, 0] // size: undefined,
  // values: null,
  // ranges: null,

}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {

  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // console.log("arguments = ", arguments);
  // console.log("initialValues = ", initialValues);
  // console.log("model = ", model);
  // console.log("model.values = ", model.values);
  // console.log("model.empty = ", model.empty);
  // console.log("model.size = ", model.size)

  if (!model.empty && !model.values && !model.size) {
    throw new TypeError('Cannot create vtkDataArray object without: size > 0, values');
  }

  if (!model.values) {
    model.values = newTypedArray(model.dataType, model.size);
  } else if (Array.isArray(model.values)) {
    model.values = newTypedArrayFrom(model.dataType, model.values);
  }

  if (model.values) {
    var _model$size;

    // Takes the size if provided (can be lower than `model.values`) otherwise the actual length of `values`.
    model.size = (_model$size = model.size) !== null && _model$size !== void 0 ? _model$size : model.values.length;
    model.dataType = getDataType(model.values);
  } // Object methods


  obj(publicAPI, model);
  set(publicAPI, model, ['name', 'numberOfComponents']); // Object specific methods

  vtkDataArray(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = newInstance$1(extend, 'vtkDataArray'); // ----------------------------------------------------------------------------

var vtkDataArray$1 = _objectSpread(_objectSpread({
  newInstance: newInstance,
  extend: extend
}, STATIC), Constants);

export { STATIC, vtkDataArray$1 as default, extend, newInstance };
