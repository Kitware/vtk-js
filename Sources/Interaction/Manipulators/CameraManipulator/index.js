import * as macro from '../../../macro';

// ----------------------------------------------------------------------------
// vtkCameraManipulator methods
// ----------------------------------------------------------------------------

function vtkCameraManipulator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkCameraManipulator');

  publicAPI.startInteraction = () => {};
  publicAPI.endInteraction = () => {};
  publicAPI.onButtonDown = (x, y, ren, rwi) => {};
  publicAPI.onButtonUp = (x, y, ren, rwi) => {};
  publicAPI.onMouseMove = (x, y, ren, rwi) => {};
  publicAPI.onKeyUp = (rwi) => {};
  publicAPI.onKeyDown = (rwi) => {};

  //-------------------------------------------------------------------------
  publicAPI.computeDisplayCenter = (iObserver) => {
    const pt = iObserver.computeWorldToDisplay(model.center[0], model.center[1], model.center[2]);
    model.displayCenter[0] = pt[0];
    model.displayCenter[1] = pt[1];
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  manipulatorName: 'goldschlager',

  button: 1,
  shift: false,
  control: false,

  center: [0, 0, 0],
  rotationFactor: 1,
  displayCenter: [0, 0],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);

  // Create get-set macros
  macro.setGet(publicAPI, model, [
    'manipulatorName',
    'button',
    'shift',
    'control',
    'rotationFactor',
  ]);

  macro.setGetArray(publicAPI, model, [
    'displayCenter',
  ], 2);

  macro.setGetArray(publicAPI, model, [
    'center',
  ], 3);

  // Object specific methods
  vtkCameraManipulator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend });
