import * as macro from '../../../macro';
import vtkDataSet from '../DataSet';


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

function vtkImageData(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkImageData');

  publicAPI.getBounds = () => {
    const res = [];
    res[0] = model.origin[0] + (model.extent[0] * model.spacing[0]);
    res[1] = model.origin[0] + (model.extent[1] * model.spacing[0]);
    res[2] = model.origin[1] + (model.extent[2] * model.spacing[1]);
    res[3] = model.origin[1] + (model.extent[3] * model.spacing[1]);
    res[4] = model.origin[2] + (model.extent[4] * model.spacing[2]);
    res[5] = model.origin[2] + (model.extent[5] * model.spacing[2]);
    return res;
  };

  /* eslint-disable no-use-before-define */
  publicAPI.shallowCopy = () => {
    const modelInstance = {};
    const fieldList = [
      'pointData', 'cellData', 'fieldData', // Dataset
    ];

    // Start to shallow copy each piece
    fieldList.forEach(field => {
      modelInstance[field] = model[field].shallowCopy();
    });

    // Create instance
    const newImage = newInstance(modelInstance);

    // Reset mtime to original value
    newImage.set({ mtime: model.mtime });

    return newImage;
  };
  /* eslint-enable no-use-before-define */
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  ImageData: null,
  spacing: [1.0, 1.0, 1.0],
  origin: [0.0, 0.0, 0.0],
  extent: [0, -1, 0, -1, 0, -1],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkDataSet.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, ['verts', 'lines', 'polys', 'strips']);

  macro.setGetArray(publicAPI, model, [
    'origin',
    'spacing',
  ], 3);

  macro.setGetArray(publicAPI, model, [
    'extent',
  ], 6);

  // Object specific methods
  vtkImageData(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkPolyData');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend }, STATIC);
