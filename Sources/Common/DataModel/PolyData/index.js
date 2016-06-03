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

  // build empty cell arrays and set methods
  ['Verts', 'Lines', 'Polys', 'Strips'].forEach(type => {
    const lowerType = type.toLowerCase();
    // Don't create array if already available
    if (model[lowerType]) {
      return;
    }
    if (model.vtkPolyData && model.vtkPolyData[type]) {
      model[lowerType] = vtkDataArray.newInstance(model.vtkPolyData[type]);
    } else {
      model[lowerType] = vtkDataArray.newInstance({ empty: true });
    }
  });

  /* eslint-disable no-use-before-define */
  publicAPI.shallowCopy = () => {
    const modelInstance = {};
    const fieldList = [
      'pointData', 'cellData', 'fieldData', // Dataset
      'points',                             // PointSet
      'verts', 'lines', 'polys', 'strips',  // PolyData
    ];

    // Start to shallow copy each piece
    fieldList.forEach(field => {
      modelInstance[field] = model[field].shallowCopy();
    });

    // Create instance
    const newPoly = newInstance(modelInstance);

    // Reset mtime to original value
    newPoly.set({ mtime: model.mtime });

    return newPoly;
  };
  /* eslint-enable no-use-before-define */
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
  vtkPointSet.extend(publicAPI, model, initialValues);
  macro.setGet(publicAPI, model, ['verts', 'lines', 'polys', 'strips']);

  // Object specific methods
  vtkPolyData(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkPolyData');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend }, STATIC);
