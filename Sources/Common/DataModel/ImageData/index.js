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
