import * as macro from '../../../macro';
import VTK from './Constants';

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

function insureRangeSize(rangeArray, size = 0) {
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

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

export const STATIC = {
  computeRange,
  extractCellSizes,
  getNumberOfCells,
};

// ----------------------------------------------------------------------------
// vtkDataArray methods
// ----------------------------------------------------------------------------

function dataArray(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkDataArray');

  publicAPI.getElementComponentSize = () => model.values.BYTES_PER_ELEMENT;

  // Description:
  // Return the data component at the location specified by tupleIdx and
  // compIdx.
  publicAPI.getComponent = (tupleIdx, compIdx = 0) => model.values[tupleIdx * model.tuple + compIdx];

  // Description:
  // Set the data component at the location specified by tupleIdx and compIdx
  // to value.
  // Note that i is less than NumberOfTuples and j is less than
  //  NumberOfComponents. Make sure enough memory has been allocated
  // (use SetNumberOfTuples() and SetNumberOfComponents()).
  publicAPI.setComponent = (tupleIdx, compIdx, value) => {
    if (value !== model.values[tupleIdx * model.tuple + compIdx]) {
      model.values[tupleIdx * model.tuple + compIdx] = value;
      publicAPI.modified();
      model.ranges = null;
    }
  };

  publicAPI.getData = () => model.values;

  publicAPI.getRange = (componentIndex = 0) => {
    const rangeIdx = componentIndex < 0 ? model.tuple : componentIndex;
    let range = null;

    if (!model.ranges) {
      model.ranges = insureRangeSize(model.ranges, model.tuple);
    }
    range = model.ranges[rangeIdx];

    if (range) {
      return [range.min, range.max];
    }

    // Need to compute ranges...
    range = model.ranges[rangeIdx] = computeRange(model.values, componentIndex);
    return [range.min, range.max];
  };

  publicAPI.getTupleLocation = (idx = 1) => idx * model.tuple;

  publicAPI.getBounds = () => {
    if (model.tuple === 3) {
      return [].concat(
        publicAPI.getRange(0),
        publicAPI.getRange(1),
        publicAPI.getRange(2));
    }

    if (model.tuple !== 2) {
      console.error('getBounds called on an array of tuple size', model.tuple, model);
      return [1, -1, 1, -1, 1, -1];
    }

    return [].concat(
        publicAPI.getRange(0),
        publicAPI.getRange(1));
  };

  publicAPI.getNumberOfComponents = () => model.tuple;
  publicAPI.getNumberOfValues = () => model.values.length;
  publicAPI.getNumberOfTuples = () => model.values.length / model.tuple;
  publicAPI.getDataType = () => model.dataType;

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
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  type: 'DataArray',
  name: '',
  tuple: 1,
  size: 0,
  dataType: VTK.DEFAULT_DATATYPE,
  values: null,
  ranges: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  if (!model.values || (!model.size || model.empty) || model.type !== 'DataArray') {
    throw Error('Can not create DataArray object without: size > 0, values or type = DataArray');
  }

  if (!model.values) {
    model.values = new window[model.dataType](model.size);
  }

  // Object methods
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, ['name']);

  // Object specific methods
  dataArray(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend }, STATIC);
