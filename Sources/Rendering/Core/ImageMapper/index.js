import * as macro from '../../../macro';
import vtkMath from '../../../Common/Core/Math';

// ----------------------------------------------------------------------------
// vtkProperty2D methods
// ----------------------------------------------------------------------------

function vtkImageMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkImageMapper');

  publicAPI.update = () => {
    model.inputData[0] = null;
    publicAPI.getInputData();
  };

  publicAPI.getBounds = () => {
    const image = publicAPI.getInputData();
    if (!image) {
      return vtkMath.createUninitializedBounds();
    }
    if (!model.useCustomExtents) {
      return image.getBounds();
    }

    const origin = image.getOrigin();
    const spacing = image.getSpacing();
    const res = [];
    res[0] = origin[0] + model.customDisplayExtent[0] * spacing[0];
    res[1] = origin[0] + model.customDisplayExtent[1] * spacing[0];
    res[2] = origin[1] + model.customDisplayExtent[2] * spacing[1];
    res[3] = origin[1] + model.customDisplayExtent[3] * spacing[1];
    res[4] = origin[2] + model.zSlice * spacing[2];
    res[5] = origin[2] + model.zSlice * spacing[2];
    return res;
  };

  publicAPI.getIsOpaque = () => true;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------
const DEFAULT_VALUES = {
  displayExtent: [0, 0, 0, 0, 0, 0],
  customDisplayExtent: [0, 0, 0, 0],
  useCustomExtents: false,
  zSlice: 0,
  renderToRectangle: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.algo(publicAPI, model, 1, 0);

  macro.setGet(publicAPI, model, [
    'zSlice',
    'useCustomExtents',
    'renderToRectangle',
  ]);
  macro.setGetArray(publicAPI, model, [
    'customDisplayExtent',
  ], 4);

  // Object methods
  vtkImageMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
