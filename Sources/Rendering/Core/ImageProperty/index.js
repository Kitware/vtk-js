import macro from 'vtk.js/Sources/macros';
import Constants from 'vtk.js/Sources/Rendering/Core/ImageProperty/Constants';

const { InterpolationType } = Constants;
const { vtkErrorMacro } = macro;

const VTK_MAX_VRCOMP = 4;

// ----------------------------------------------------------------------------
// vtkImageProperty methods
// ----------------------------------------------------------------------------

function vtkImageProperty(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkImageProperty');

  publicAPI.getMTime = () => {
    let mTime = model.mtime;
    let time;

    for (let index = 0; index < VTK_MAX_VRCOMP; index++) {
      // Color MTimes
      if (model.componentData[index].rGBTransferFunction) {
        // time that RGB transfer function was last modified
        time = model.componentData[index].rGBTransferFunction.getMTime();
        mTime = mTime > time ? mTime : time;
      }

      // Piecewise function MTimes
      if (model.componentData[index].piecewiseFunction) {
        // time that weighting function was last modified
        time = model.componentData[index].piecewiseFunction.getMTime();
        mTime = mTime > time ? mTime : time;
      }
    }

    return mTime;
  };

  // Set the color of a volume to an RGB transfer function
  publicAPI.setRGBTransferFunction = (index, func) => {
    // backwards compatible call without the component index
    let idx = index;
    let transferFunc = func;
    if (!Number.isInteger(index)) {
      transferFunc = index;
      idx = 0;
    }
    if (model.componentData[idx].rGBTransferFunction !== transferFunc) {
      model.componentData[idx].rGBTransferFunction = transferFunc;
      publicAPI.modified();
      return true;
    }
    return false;
  };

  // Get the currently set RGB transfer function.
  publicAPI.getRGBTransferFunction = (idx = 0) =>
    model.componentData[idx].rGBTransferFunction;

  // Set the piecewise function
  publicAPI.setPiecewiseFunction = (index, func) => {
    let idx = index;
    let transferFunc = func;
    if (!Number.isInteger(index)) {
      transferFunc = index;
      idx = 0;
    }
    if (model.componentData[idx].piecewiseFunction !== transferFunc) {
      model.componentData[idx].piecewiseFunction = transferFunc;
      publicAPI.modified();
      return true;
    }
    return false;
  };

  // Get the component weighting function.
  publicAPI.getPiecewiseFunction = (idx = 0) =>
    model.componentData[idx].piecewiseFunction;

  // Alias to set the piecewise function
  publicAPI.setScalarOpacity = (index, func) => {
    // backwards compatible call without the component index
    let idx = index;
    let transferFunc = func;
    if (!Number.isInteger(index)) {
      transferFunc = index;
      idx = 0;
    }
    return publicAPI.setPiecewiseFunction(idx, transferFunc);
  };

  // Alias to get the piecewise function (backwards compatibility)
  publicAPI.getScalarOpacity = (idx = 0) => publicAPI.getPiecewiseFunction(idx);

  publicAPI.setComponentWeight = (index, value) => {
    if (index < 0 || index >= VTK_MAX_VRCOMP) {
      vtkErrorMacro('Invalid index');
      return false;
    }

    const val = Math.min(1, Math.max(0, value));
    if (model.componentData[index].componentWeight !== val) {
      model.componentData[index].componentWeight = val;
      publicAPI.modified();
      return true;
    }
    return false;
  };

  publicAPI.getComponentWeight = (index) => {
    if (index < 0 || index >= VTK_MAX_VRCOMP) {
      vtkErrorMacro('Invalid index');
      return 0.0;
    }

    return model.componentData[index].componentWeight;
  };

  publicAPI.setInterpolationTypeToNearest = () =>
    publicAPI.setInterpolationType(InterpolationType.NEAREST);

  publicAPI.setInterpolationTypeToLinear = () =>
    publicAPI.setInterpolationType(InterpolationType.LINEAR);

  publicAPI.getInterpolationTypeAsString = () =>
    macro.enumToString(InterpolationType, model.interpolationType);
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------
const DEFAULT_VALUES = {
  independentComponents: false,
  interpolationType: InterpolationType.LINEAR,
  colorWindow: 255,
  colorLevel: 127.5,
  ambient: 1.0,
  diffuse: 0.0,
  opacity: 1.0,
  useLookupTableScalarRange: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);

  if (!model.componentData) {
    model.componentData = [];
    for (let i = 0; i < VTK_MAX_VRCOMP; i++) {
      model.componentData.push({
        rGBTransferFunction: null,
        piecewiseFunction: null,
        componentWeight: 1.0,
      });
    }
  }

  macro.setGet(publicAPI, model, [
    'independentComponents',
    'interpolationType',
    'colorWindow',
    'colorLevel',
    'ambient',
    'diffuse',
    'opacity',
    'useLookupTableScalarRange',
  ]);

  // Object methods
  vtkImageProperty(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkImageProperty');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
