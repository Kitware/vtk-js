import macro from 'vtk.js/Sources/macro';
import Constants from 'vtk.js/Sources/Rendering/Core/ImageProperty/Constants';

const { InterpolationType } = Constants;

// ----------------------------------------------------------------------------
// vtkImageProperty methods
// ----------------------------------------------------------------------------

function vtkImageProperty(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkImageProperty');

  publicAPI.setInterpolationTypeToNearest = () => {
    publicAPI.setInterpolationType(InterpolationType.NEAREST);
  };

  publicAPI.setInterpolationTypeToLinear = () => {
    publicAPI.setInterpolationType(InterpolationType.LINEAR);
  };

  publicAPI.getInterpolationTypeAsString = () =>
    macro.enumToString(InterpolationType, model.interpolationType);
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------
const DEFAULT_VALUES = {
  interpolationType: InterpolationType.LINEAR,
  colorWindow: 255,
  colorLevel: 127.5,
  ambient: 1.0,
  diffuse: 0.0,
  opacity: 1.0,
  rGBTransferFunction: null,
  scalarOpacity: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);

  macro.setGet(publicAPI, model, [
    'interpolationType',
    'colorWindow',
    'colorLevel',
    'ambient',
    'diffuse',
    'opacity',
    'rGBTransferFunction',
    'scalarOpacity',
  ]);

  publicAPI.getMTime = () => {
    let mTime = model.mtime;
    if (model.rGBTransferFunction) {
      const time = model.rGBTransferFunction.getMTime();
      mTime = time > mTime ? time : mTime;
    }

    return mTime;
  };

  // Object methods
  vtkImageProperty(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkImageProperty');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
