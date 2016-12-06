import * as macro from '../../../macro';
import vtk from '../../../vtk';
import vtkDataSetAttributes from '../DataSetAttributes';

// import vtkBoundingBox from '../BoundingBox';
// import vtkMath from '../../Core/Math';
//
// function getBounds(dataset) {
//   if (dataset.bounds) {
//     return dataset.bounds;
//   }
//   if (dataset.type && dataset[dataset.type]) {
//     const ds = dataset[dataset.type];
//     if (ds.bounds) {
//       return ds.bounds;
//     }
//     if (ds.Points && ds.Points.bounds) {
//       return ds.Points.bounds;
//     }

//     if (ds.Points && ds.Points.values) {
//       const array = ds.Points.values;
//       const bbox = vtkBoundingBox.newInstance();
//       const size = array.length;
//       const delta = ds.Points.numberOfComponents ? ds.Points.numberOfComponents : 3;
//       for (let idx = 0; idx < size; idx += delta) {
//         bbox.addPoint(array[idx * delta], array[(idx * delta) + 1], array[(idx * delta) + 2]);
//       }
//       ds.Points.bounds = bbox.getBounds();
//       return ds.Points.bounds;
//     }
//   }
//   return vtkMath.createUninitializedBounds();
// }

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

const DATASET_FIELDS = ['pointData', 'cellData', 'fieldData'];

// ----------------------------------------------------------------------------
// vtkDataSet methods
// ----------------------------------------------------------------------------

function vtkDataSet(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkDataSet');

  // Add dataset attributes
  DATASET_FIELDS.forEach((fieldName) => {
    if (!model[fieldName]) {
      model[fieldName] = vtkDataSetAttributes.newInstance();
    } else {
      model[fieldName] = vtk(model[fieldName]);
    }
  });
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  // pointData: null,
  // cellData: null,
  // fieldData: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, DATASET_FIELDS);

  // Object specific methods
  vtkDataSet(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkDataSet');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
