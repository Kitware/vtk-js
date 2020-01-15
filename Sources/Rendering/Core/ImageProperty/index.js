import macro from 'vtk.js/Sources/macro';
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

      // Opacity MTimes
      if (model.componentData[index].scalarOpacity) {
        // time that Scalar opacity transfer function was last modified
        time = model.componentData[index].scalarOpacity.getMTime();
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
    }
  };

  // Get the currently set RGB transfer function.
  publicAPI.getRGBTransferFunction = (index) => {
    // backwards compatible call without the component index
    let idx = index;
    if (!Number.isInteger(index)) {
      idx = 0;
    }

    return model.componentData[idx].rGBTransferFunction;
  };

  // Set the scalar opacity of a volume to a transfer function
  publicAPI.setScalarOpacity = (index, func) => {
    // backwards compatible call without the component index
    let idx = index;
    let transferFunc = func;
    if (!Number.isInteger(index)) {
      transferFunc = index;
      idx = 0;
    }
    if (model.componentData[idx].scalarOpacity !== transferFunc) {
      model.componentData[idx].scalarOpacity = transferFunc;
      publicAPI.modified();
    }
  };

  // Get the scalar opacity transfer function.
  publicAPI.getScalarOpacity = (index) => {
    // backwards compatible call without the component index
    let idx = index;
    if (!Number.isInteger(index)) {
      idx = 0;
    }

    return model.componentData[idx].scalarOpacity;
  };

  publicAPI.setComponentWeight = (index, value) => {
    if (index < 0 || index >= VTK_MAX_VRCOMP) {
      vtkErrorMacro('Invalid index');
      return;
    }

    const val = Math.min(1, Math.max(0, value));
    if (model.componentData[index].componentWeight !== val) {
      model.componentData[index].componentWeight = val;
      publicAPI.modified();
    }
  };

  publicAPI.getComponentWeight = (index) => {
    if (index < 0 || index >= VTK_MAX_VRCOMP) {
      vtkErrorMacro('Invalid index');
      return 0.0;
    }

    return model.componentData[index].componentWeight;
  };

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
  independentComponents: 0,
  interpolationType: InterpolationType.LINEAR,
  colorWindow: 255,
  colorLevel: 127.5,
  ambient: 1.0,
  diffuse: 0.0,
  opacity: 1.0,
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
        scalarOpacity: null,
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
  ]);

  // Object methods
  vtkImageProperty(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkImageProperty');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
