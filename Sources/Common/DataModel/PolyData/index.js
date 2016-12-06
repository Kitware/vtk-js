import * as macro from '../../../macro';
import vtk from '../../../vtk';

import vtkPointSet from '../PointSet';
import vtkDataArray from '../../Core/DataArray';

// ----------------------------------------------------------------------------

const POLYDATA_FIELDS = ['verts', 'lines', 'polys', 'strips'];

// ----------------------------------------------------------------------------
// vtkPolyData methods
// ----------------------------------------------------------------------------

function vtkPolyData(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkPolyData');

  // build empty cell arrays and set methods
  POLYDATA_FIELDS.forEach((type) => {
    if (!model[type]) {
      model[type] = vtkDataArray.newInstance({ empty: true });
    } else {
      model[type] = vtk(model[type]);
    }
  });

  /* eslint-disable no-use-before-define */
  publicAPI.shallowCopy = macro.shallowCopyBuilder(model, newInstance);
  /* eslint-enable no-use-before-define */
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  // verts: null,
  // lines: null,
  // polys: null,
  // strips: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkPointSet.extend(publicAPI, model, initialValues);
  macro.setGet(publicAPI, model, ['verts', 'lines', 'polys', 'strips']);

  // Object specific methods
  vtkPolyData(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkPolyData');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
