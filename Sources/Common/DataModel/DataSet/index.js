import * as macro     from '../../../macro';
import vtkBoundingBox from '../BoundingBox';
import vtkDataSetAttributes from '../DataSetAttributes';
import vtkMath from '../../Core/Math';

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

function getBounds(dataset) {
  if (dataset.bounds) {
    return dataset.bounds;
  }
  if (dataset.type && dataset[dataset.type]) {
    const ds = dataset[dataset.type];
    if (ds.bounds) {
      return ds.bounds;
    }
    if (ds.Points && ds.Points.bounds) {
      return ds.Points.bounds;
    }

    if (ds.Points && ds.Points.values) {
      const array = ds.Points.values;
      const bbox = vtkBoundingBox.newInstance();
      const size = array.length;
      const delta = ds.Points.tuple ? ds.Points.tuple : 3;
      for (let idx = 0; idx < size; idx += delta) {
        bbox.addPoint(array[idx * delta], array[idx * delta + 1], array[idx * delta + 2]);
      }
      ds.Points.bounds = bbox.getBounds();
      return ds.Points.bounds;
    }
  }
  return vtkMath.createUninitializedBouds();
}

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

export const STATIC = {
  getBounds,
};

// ----------------------------------------------------------------------------
// vtkDataSet methods
// ----------------------------------------------------------------------------

function vtkDataSet(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkDataSet');

  // Expose dataset
  const dataset = model.type ? model[model.type] || {} : {};
  publicAPI.dataset = dataset;

  if (!model.pointData) {
    model.pointData = vtkDataSetAttributes.newInstance({ dataArrays: dataset.PointData });
  }
  if (!model.cellData) {
    model.cellData = vtkDataSetAttributes.newInstance({ dataArrays: dataset.CellData });
  }
  if (!model.fieldData) {
    model.fieldData = vtkDataSetAttributes.newInstance({ dataArrays: dataset.FieldData });
  }
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, ['pointData', 'cellData', 'fieldData']);

  // Object specific methods
  vtkDataSet(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkDataSet');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend }, STATIC);
