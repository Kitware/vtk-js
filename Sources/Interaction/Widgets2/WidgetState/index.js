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

  publicAPI.delete = macro.chain(publicAPI.unbindAll, publicAPI.delete);
}

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  macro.obj(publicAPI, model);
  vtkWidgetState(publicAPI, model);
}

// ----------------------------------------------------------------------------

export default { extend };
