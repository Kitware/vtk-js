import macro from 'vtk.js/Sources/macros';
import vtkInteractorStyleManipulator from 'vtk.js/Sources/Interaction/Style/InteractorStyleManipulator';
import vtk3DControllerModelSelectorManipulator from 'vtk.js/Sources/Interaction/Manipulators/3DControllerModelSelectorManipulator';

import {
  Device,
  Input,
} from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor/Constants';

function vtkInteractorStyleHMDXR(publicAPI, model) {
  model.classHierarchy.push('vtkInteractorStyleHMDXR');

  const leftHandManipulator =
    vtk3DControllerModelSelectorManipulator.newInstance({
      device: Device.LeftController,
      input: Input.A,
    });
  const rightHandManipulator =
    vtk3DControllerModelSelectorManipulator.newInstance({
      device: Device.RightController,
      input: Input.A,
    });

  publicAPI.addVRManipulator(leftHandManipulator);
  publicAPI.addVRManipulator(rightHandManipulator);
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkInteractorStyleManipulator.extend(publicAPI, model, initialValues);

  // Object specific methods
  vtkInteractorStyleHMDXR(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkInteractorStyleHMDXR');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
