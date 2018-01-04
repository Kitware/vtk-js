import macro from 'vtk.js/Sources/macro';

// ----------------------------------------------------------------------------
// vtkProgressHandler methods
// ----------------------------------------------------------------------------

function vtkProgressHandler(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkProgressHandler');

  publicAPI.startWork = () => {
    model.workCount += 1;
    if (model.workCount === 1) {
      publicAPI.invokeChange(true);
    }
  };

  publicAPI.stopWork = () => {
    model.workCount -= 1;
    if (model.workCount === 0) {
      publicAPI.invokeChange(false);
    }
  };

  publicAPI.isWorking = () => !!model.workCount;

  publicAPI.wrapPromise = (promise) => {
    publicAPI.startWork();
    return new Promise((resolve, reject) => {
      promise.then(
        (...resolveArgs) => {
          publicAPI.stopWork();
          resolve(...resolveArgs);
        },
        (...rejectArgs) => {
          publicAPI.stopWork();
          reject(...rejectArgs);
        }
      );
    });
  };

  publicAPI.wrapPromiseFunction = (fn) => (...args) =>
    publicAPI.wrapPromise(fn(...args));
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  workCount: 0,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);
  macro.event(publicAPI, model, 'change');
  macro.get(publicAPI, model, ['workCount']);

  // Object specific methods
  vtkProgressHandler(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkProgressHandler');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
