import * as macro from '../../../macro';
import vtkPointSet from '../PointSet';
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
// vtkPolyData methods
// ----------------------------------------------------------------------------

function vtkPolyData(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkPolyData');

  // Concreate Points
  if (model.vtkPolyData && model.vtkPolyData.Points) {
    model.points = vtkDataArray.newInstance(model.vtkPolyData.Points);
  }

  // Concreate Verts
  if (model.vtkPolyData && model.vtkPolyData.Verts) {
    model.verts = vtkDataArray.newInstance(model.vtkPolyData.Verts);
  } else {
    model.verts = vtkDataArray.newInstance({ empty: true });
  }

  // Concreate Lines
  if (model.vtkPolyData && model.vtkPolyData.Lines) {
    model.lines = vtkDataArray.newInstance(model.vtkPolyData.Lines);
  } else {
    model.lines = vtkDataArray.newInstance({ empty: true });
  }

  // Concreate Polys
  if (model.vtkPolyData && model.vtkPolyData.Polys) {
    model.polys = vtkDataArray.newInstance(model.vtkPolyData.Polys);
  } else {
    model.polys = vtkDataArray.newInstance({ empty: true });
  }

  // Concreate Strips
  if (model.vtkPolyData && model.vtkPolyData.Strips) {
    model.strips = vtkDataArray.newInstance(model.vtkPolyData.Strips);
  } else {
    model.strips = vtkDataArray.newInstance({ empty: true });
  }
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  PolyData: null,
  verts: null,
  lines: null,
  polys: null,
  strips: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkPointSet.extend(publicAPI, model);
  macro.get(publicAPI, model, ['verts', 'lines', 'polys', 'strips']);

  // Object specific methods
  vtkPolyData(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkPolyData');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend }, STATIC);
