import macro from 'vtk.js/Sources/macro';
import vtkInteractorStyleManipulator from 'vtk.js/Sources/Interaction/Style/InteractorStyleManipulator';
import vtkMouseCameraUnicamManipulator from 'vtk.js/Sources/Interaction/Manipulators/MouseCameraUnicamManipulator';

// ----------------------------------------------------------------------------
// vtkInteractorStyleUnicam methods
// ----------------------------------------------------------------------------

function vtkInteractorStyleUnicam(publicAPI, model) {
  model.classHierarchy.push('vtkInteractorStyleUnicam');

  model.unicamManipulator = vtkMouseCameraUnicamManipulator.newInstance({
    button: 1,
  });

  publicAPI.addMouseManipulator(model.unicamManipulator);

  publicAPI.getUseWorldUpVec = () => {
    return model.unicamManipulator.getUseWorldUpVec();
  };
  publicAPI.setUseWorldUpVec = (useWorldUpVec) => {
    model.unicamManipulator.setUseWorldUpVec(useWorldUpVec);
  };
  publicAPI.getWorldUpVec = () => {
    return model.unicamManipulator.getWorldUpVec();
  };
  publicAPI.setWorldUpVec = (x, y, z) => {
    model.unicamManipulator.setWorldUpVec(x, y, z);
  };
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
  vtkInteractorStyleUnicam(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkInteractorStyleUnicam'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
