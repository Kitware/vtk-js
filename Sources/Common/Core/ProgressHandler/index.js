import macro from 'vtk.js/Sources/macros';

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
        (rejectError) => {
          publicAPI.stopWork();
          reject(rejectError);
        }
      );
    });
  };

  publicAPI.wrapPromiseFunction =
    (fn) =>
    (...args) =>
      publicAPI.wrapPromise(fn(...args));
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

function defaultValues(initialValues) {
  return {
    workCount: 0,
    ...initialValues,
  };
}

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(initialValues, defaultValues(initialValues));

  // Object methods
  macro.obj(publicAPI, model);
  macro.event(publicAPI, model, 'change');
  macro.get(publicAPI, model, ['workCount']);

  // Object specific methods
  vtkProgressHandler(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkProgressHandler',
  true
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
