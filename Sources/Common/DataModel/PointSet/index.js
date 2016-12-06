import * as macro   from '../../../macro';
import vtk   from '../../../vtk';

import vtkDataSet from '../DataSet';
import vtkPoints from '../../Core/Points';

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// vtkPointSet methods
// ----------------------------------------------------------------------------

function vtkPointSet(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkPointSet');

  // Create empty points
  if (!model.points) {
    model.points = vtkPoints.newInstance();
  } else {
    model.points = vtk(model.points);
  }

  publicAPI.getBounds = () => model.points.getBounds();

  publicAPI.computeBounds = () => {
    publicAPI.getBounds();
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  // points: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkDataSet.extend(publicAPI, model, initialValues);
  macro.setGet(publicAPI, model, ['points']);

  // Object specific methods
  vtkPointSet(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkPointSet');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
