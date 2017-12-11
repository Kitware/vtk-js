import macro from 'vtk.js/Sources/macro';
import { Device, Input }  from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor/Constants';

// ----------------------------------------------------------------------------
// vtkCameraManipulator methods
// ----------------------------------------------------------------------------

function vtkCamera3DManipulator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkCamera3DManipulator');

  publicAPI.onButton3D = (interactor, renderer, state, device, input, pressed) => {};
  publicAPI.onMove3D = (interactor, renderer, state, device, input, pressed) => {};
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  manipulatorName: 'goldschlager3D',
  // device: null, // Device.RightController
  // input: null, // Input.TrackPad
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);

  // Create get-set macros
  macro.setGet(publicAPI, model, [
    'device',
    'input',
  ]);

  // Object specific methods
  vtkCamera3DManipulator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkCamera3DManipulator');

// ----------------------------------------------------------------------------

export default { newInstance, extend, Device, Input };
