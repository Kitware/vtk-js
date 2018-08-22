import macro from 'vtk.js/Sources/macro';

// ----------------------------------------------------------------------------

function vtkWidgetState(publicAPI, model) {
  model.classHierarchy.push('vtkWidgetState');
  const subscriptions = [];

  // --------------------------------------------------------------------------

  publicAPI.bindState = (nested) => {
    subscriptions.push(nested.onModified(publicAPI.modified));
  };

  publicAPI.unbindAll = () => {
    while (subscriptions.length) {
      subscriptions.pop().unsubscribe();
    }
  };

  publicAPI.activate = () => publicAPI.setActive(true);
  publicAPI.desactivate = () => publicAPI.setActive(false);

  publicAPI.delete = macro.chain(publicAPI.unbindAll, publicAPI.delete);
}

// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  active: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, ['active']);
  vtkWidgetState(publicAPI, model);
}

// ----------------------------------------------------------------------------

export default { extend };
