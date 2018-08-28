import macro from 'vtk.js/Sources/macro';
import vtk from 'vtk.js/Sources/vtk';
import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';
import vtkPointSet from 'vtk.js/Sources/Common/DataModel/PointSet';

const POLYDATA_FIELDS = ['verts', 'lines', 'polys', 'strips'];

// ----------------------------------------------------------------------------
// vtkPolyData methods
// ----------------------------------------------------------------------------

function vtkPolyData(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkPolyData');

  function camelize(str) {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (letter) => letter.toUpperCase())
      .replace(/\s+/g, '');
  }

  // build empty cell arrays and set methods
  POLYDATA_FIELDS.forEach((type) => {
    publicAPI[`getNumberOf${camelize(type)}`] = () =>
      model[type].getNumberOfCells();
    if (!model[type]) {
      model[type] = vtkCellArray.newInstance();
    } else {
      model[type] = vtk(model[type]);
    }
  });

  publicAPI.getNumberOfCells = () =>
    POLYDATA_FIELDS.reduce(
      (num, cellType) => num + model[cellType].getNumberOfCells(),
      0
    );

  const superShallowCopy = publicAPI.shallowCopy;
  publicAPI.shallowCopy = (other, debug = false) => {
    superShallowCopy(other, debug);
    POLYDATA_FIELDS.forEach((type) => {
      model[type] = vtkCellArray.newInstance();
      model[type].shallowCopy(other.getReferenceByName(type));
    });
  };
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
