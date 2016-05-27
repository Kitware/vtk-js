import * as macro   from '../../../macro';
import vtkDataSet   from '../DataSet';
import vtkDataArray from '../../Core/DataArray';

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

export const STATIC = {
};

// ----------------------------------------------------------------------------
// vtkPointSet methods
// ----------------------------------------------------------------------------

function vtkPointSet(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkPointSet');

  // Create empty points
  model.points = vtkDataArray.newInstance({ empty: true });

  publicAPI.getBounds = () => model.points.getBounds;

  publicAPI.computeBounds = () => {
    publicAPI.getBounds();
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  points: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkDataSet.extend(publicAPI, model);
  macro.setGet(publicAPI, model, ['points']);

  // Object specific methods
  vtkPointSet(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkPointSet');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend }, STATIC);
