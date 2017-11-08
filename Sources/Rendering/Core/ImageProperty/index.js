import macro from 'vtk.js/Sources/macro';

// ----------------------------------------------------------------------------
// vtkImageProperty methods
// ----------------------------------------------------------------------------

function vtkImageProperty(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkImageProperty');
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------
const DEFAULT_VALUES = {
  colorWindow: 255,
  colorLevel: 127.5,
  ambient: 1.0,
  diffuse: 0.0,
  opacity: 1.0,
  rGBTransferFunction: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);

  macro.setGet(publicAPI, model, [
    'colorWindow',
    'colorLevel',
    'ambient',
    'diffuse',
    'opacity',
    'rGBTransferFunction',
  ]);

  publicAPI.getMTime = () => {
    let mTime = model.mtime;
    if (model.rGBTransferFunction !== null) {
      const time = model.rGBTransferFunction.getMTime();
      mTime = (time > mTime ? time : mTime);
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
