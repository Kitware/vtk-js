import * as macro from '../../../macro';
import { VTK_DEFAULT_DATATYPE } from './Constants';

const TUPLE_HOLDER = [];

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

function computeRange(values, component = 0, tuple = 1) {
  const range = { min: Number.MAX_VALUE, max: Number.MIN_VALUE };

  if (component < 0) {
    // Compute magnitude
    console.log('vtkDataArray: Compute magnitude - NOT IMPLEMENTED');
    return range;
  }

  const size = values.length;
  for (let i = component; i < size; i += tuple) {
    const value = values[i];
    if (range.min > value) {
      range.min = value;
    }
    if (range.max < value) {
      range.max = value;
    }
  }

  return range;
}

function ensureRangeSize(rangeArray, size = 0) {
  const ranges = rangeArray || [];
  // Pad ranges with null value to get the
  while (ranges.length <= size) {
    ranges.push(null);
  }
  return ranges;
}

function extractCellSizes(cellArray) {
  let currentIdx = 0;
  return cellArray.filter((value, index) => {
    if (index === currentIdx) {
      currentIdx += value + 1;
      return true;
    }
    return false;
  });
}

function getNumberOfCells(cellArray) {
  return extractCellSizes(cellArray).length;
}

function getDataType(typedArray) {
  return Object.prototype.toString.call(typedArray).split(' ')[1].slice(0, -1);
}

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

export const STATIC = {
  computeRange,
  extractCellSizes,
  getNumberOfCells,
  getDataType,
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
    model.values[(tupleIdx * model.numberOfComponents) + compIdx];

  // Description:
  // Set the data component at the location specified by tupleIdx and compIdx
  // to value.
  // Note that i is less than NumberOfTuples and j is less than
  //  NumberOfComponents. Make sure enough memory has been allocated
  // (use SetNumberOfTuples() and SetNumberOfComponents()).
  publicAPI.setComponent = (tupleIdx, compIdx, value) => {
    if (value !== model.values[(tupleIdx * model.numberOfComponents) + compIdx]) {
      model.values[(tupleIdx * model.numberOfComponents) + compIdx] = value;
      dataChange();
    }
  };

  publicAPI.getData = () => model.values;

  publicAPI.getRange = (componentIndex = 0) => {
    const rangeIdx = componentIndex < 0 ? model.numberOfComponents : componentIndex;
    let range = null;

    if (!model.ranges) {
      model.ranges = ensureRangeSize(model.ranges, model.numberOfComponents);
    }
    range = model.ranges[rangeIdx];

    if (range) {
      return [range.min, range.max];
    }

    // Need to compute ranges...
    range = model.ranges[rangeIdx] = computeRange(model.values, componentIndex, model.numberOfComponents);
    return [range.min, range.max];
  };

  publicAPI.setTuple = (idx, tuple) => {
    const offset = idx * model.numberOfComponents;
    for (let i = 0; i < model.numberOfComponents; i++) {
      model.values[offset + i] = tuple[i];
    }
  };

  publicAPI.getTuple = (idx, tupleToFill = TUPLE_HOLDER) => {
    const numberOfComponents = model.numberOfComponents || 1;
    if (tupleToFill.length) {
      tupleToFill.length = numberOfComponents;
    }
    const offset = idx * numberOfComponents;
    for (let i = 0; i < numberOfComponents; i++) {
      tupleToFill[i] = model.values[offset + i];
    }
    return tupleToFill;
  };

  publicAPI.getTupleLocation = (idx = 1) => idx * model.numberOfComponents;
  publicAPI.getNumberOfComponents = () => model.numberOfComponents;
  publicAPI.getNumberOfValues = () => model.values.length;
  publicAPI.getNumberOfTuples = () => model.values.length / model.numberOfComponents;
  publicAPI.getDataType = () => model.dataType;
  /* eslint-disable no-use-before-define */
  publicAPI.newClone = () => newInstance({
    empty: true,
    name: model.name,
    dataType: model.dataType,
    numberOfComponents: model.numberOfComponents,
  });
  /* eslint-enable no-use-before-define */

  publicAPI.getNumberOfCells = () => {
    if (model.numberOfCells !== undefined) {
      return model.numberOfCells;
    }

    model.cellSizes = extractCellSizes(model.values);
    model.numberOfCells = model.cellSizes.length;
    return model.numberOfCells;
  };

  publicAPI.getCellSizes = () => {
    if (model.cellSizes !== undefined) {
      return model.cellSizes;
    }

    model.cellSizes = extractCellSizes(model.values);
    return model.cellSizes;
  };

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

  /* eslint-disable no-use-before-define */
  publicAPI.shallowCopy = () => newInstance(Object.assign({}, model));
  /* eslint-enable no-use-before-define */

  // Override serialization support
  publicAPI.getState = () => {
    const jsonArchive = Object.assign({}, model, { vtkClass: publicAPI.getClassName() });

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
    Object.keys(jsonArchive).sort().forEach((name) => {
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
  dataType: VTK_DEFAULT_DATATYPE,
  // values: null,
  // ranges: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  if ((!model.empty && !model.values && !model.size)) {
    throw new TypeError('Can not create vtkDataArray object without: size > 0, values');
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
  macro.set(publicAPI, model, ['name']);

  // Object specific methods
  vtkDataArray(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkDataArray');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend }, STATIC);
