import macro from 'vtk.js/Sources/macros';

// ----------------------------------------------------------------------------
// vtkTimeStepBasedAnimationHandlerProxy methods
// ----------------------------------------------------------------------------

function vtkTimeStepBasedAnimationHandlerProxy(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkTimeStepBasedAnimationHandlerProxy');

  // Initialization ------------------------------------------------------------
  publicAPI.setTime = (time) => {
    model.handler.setCurrentTimeStep(time);
  };

  publicAPI.getFrames = () => {
    if (!model.handler) {
      return [];
    }
    return model.handler.getTimeSteps();
  };

  publicAPI.setInputAnimationHandler = (handler) => {
    model.handler = handler;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  handler: null,
};

// ----------------------------------------------------------------------------

function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, ['handler']);

  // Object specific methods
  vtkTimeStepBasedAnimationHandlerProxy(publicAPI, model);

  // Proxy handling
  macro.proxy(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkTimeStepBasedAnimationHandlerProxy'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
