import * as macro from '../../../macro';
import vtkBoundingBox from '../BoundingBox';
import vtkDataArray from '../../Core/DataArray';
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
// vtkDataArray methods
// ----------------------------------------------------------------------------

function vtkDataSet(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkDataSet');

  // Expose dataset
  const dataset = model[model.type];
  publicAPI.dataset = dataset;

  // Provide getPoints() if available
  if (dataset.Points) {
    const points = vtkDataArray.newInstance(dataset.Points);
    publicAPI.getPoints = () => points;
  }

  ['PointData', 'CellData', 'FieldData'].forEach(dataCategoryName => {
    const arrays = {};
    if (dataset[dataCategoryName]) {
      Object.keys(dataset[dataCategoryName]).forEach(name => {
        if (dataset[dataCategoryName][name].type === 'DataArray') {
          arrays[name] = vtkDataArray.newInstance(dataset[dataCategoryName][name]);
        }
      });
    }
    // FIXME: missing active arrays...
    publicAPI[`get${dataCategoryName}`] = () => vtkDataSetAttributes.newInstance({ arrays });
  });

  // UnstructuredGrid Cells + Types
  if (model.type === 'UnstructuredGrid') {
    ['Cells', 'CellsTypes'].forEach(arrayName => {
      if (dataset[arrayName].type === 'DataArray') {
        const dataArray = vtkDataArray.newInstance(dataset[arrayName]);
        publicAPI[`get${arrayName}`] = () => dataArray;
      }
    });
  }

  // PolyData Cells
  if (model.type === 'PolyData') {
    ['Verts', 'Lines', 'Polys', 'Strips'].forEach(cellName => {
      if (dataset.Cells[cellName]) {
        const dataArray = vtkDataArray.newInstance(dataset.Cells[cellName]);
        publicAPI[`get${cellName}`] = () => dataArray;
      } else {
        const dataArray = vtkDataArray.newInstance({ empty: true });
        publicAPI[`get${cellName}`] = () => dataArray;
      }
    });
  }

  // Push getBounds on root API
  if (publicAPI.getPoints) {
    publicAPI.getBounds = publicAPI.getPoints().getBounds;
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

  // Object specific methods
  vtkDataSet(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend }, STATIC);
