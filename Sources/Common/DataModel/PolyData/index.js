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

  function camelize(str) {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (letter, index) =>
      (index === 0 ? letter.toLowerCase() : letter.toUpperCase())).replace(/\s+/g, '');
  }

  // build empty cell arrays and set methods
  POLYDATA_FIELDS.forEach((type) => {
    publicAPI[`getNumberOf${camelize(type)}`] = () => model[type].getNumberOfCells();
    if (!model[type]) {
      model[type] = vtkDataArray.newInstance({ empty: true });
    } else {
      model[type] = vtk(model[type]);
    }
  });

  publicAPI.getNumberOfCells = () => POLYDATA_FIELDS.reduce(
    (num, cellType) => num + model[cellType].getNumberOfCells(), 0);
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
