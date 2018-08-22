import macro from 'vtk.js/Sources/macro';

const DEFAULT_LABEL = 'default';

// ----------------------------------------------------------------------------

function vtkWidgetState(publicAPI, model) {
  model.classHierarchy.push('vtkWidgetState');
  const subscriptions = [];
  model.labels = {};

  // --------------------------------------------------------------------------

  publicAPI.bindState = (nested, labels = [DEFAULT_LABEL]) => {
    subscriptions.push(nested.onModified(publicAPI.modified));
    for (let i = 0; i < labels.length; i++) {
      const label = labels[i];
      if (!model.labels[label]) {
        model.labels[label] = [];
      }
      model.labels[label].push(nested);
    }
  };

  publicAPI.unbindAll = () => {
    while (subscriptions.length) {
      subscriptions.pop().unsubscribe();
    }
  };

  publicAPI.activate = () => publicAPI.setActive(true);
  publicAPI.desactivate = () => publicAPI.setActive(false);

  publicAPI.getListForLabel = (name) => model.labels[name];

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
