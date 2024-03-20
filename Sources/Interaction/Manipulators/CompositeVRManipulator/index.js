import macro from 'vtk.js/Sources/macros';
import {
  Device,
  Input,
} from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor/Constants';

// ----------------------------------------------------------------------------
// vtkCompositeVRManipulator methods
// ----------------------------------------------------------------------------

function vtkCompositeVRManipulator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkCompositeVRManipulator');

  publicAPI.onButton3D = (interactorStyle, renderer, state, eventData) => {};
  publicAPI.onMove3D = (interactorStyle, renderer, state, eventData) => {};
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  // device: null, // Device.RightController
  // input: null, // Input.TrackPad
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Create get-set macros
  macro.setGet(publicAPI, model, ['device', 'input']);

  // Object specific methods
  vtkCompositeVRManipulator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export default { extend, Device, Input };
