import macro from 'vtk.js/Sources/macros';
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

  publicAPI.getUseWorldUpVec = () => model.unicamManipulator.getUseWorldUpVec();
  publicAPI.setUseWorldUpVec = (useWorldUpVec) => {
    model.unicamManipulator.setUseWorldUpVec(useWorldUpVec);
  };
  publicAPI.getWorldUpVec = () => model.unicamManipulator.getWorldUpVec();
  publicAPI.setWorldUpVec = (x, y, z) => {
    model.unicamManipulator.setWorldUpVec(x, y, z);
  };
  publicAPI.getUseHardwareSelector = () =>
    model.unicamManipulator.getUseHardwareSelector();
  publicAPI.setUseHardwareSelector = (useHardwareSelector) => {
    model.unicamManipulator.setUseHardwareSelector(useHardwareSelector);
  };
  publicAPI.getFocusSphereColor = () => {
    model.unicamManipulator.getFocusSphereColor();
  };
  publicAPI.setFocusSphereColor = (r, g, b) => {
    model.unicamManipulator.setFocusSphereColor(r, g, b);
  };
  publicAPI.getFocusSphereRadiusFactor = () =>
    model.unicamManipulator.getFocusSphereRadiusFactor();
  publicAPI.setFocusSphereRadiusFactor = (focusSphereRadiusFactor) => {
    model.unicamManipulator.setFocusSphereRadiusFactor(focusSphereRadiusFactor);
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
