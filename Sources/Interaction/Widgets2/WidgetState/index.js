import macro from 'vtk.js/Sources/macro';

const DEFAULT_LABEL = 'default';

function removeObjectInArray(array, obj) {
  const idx = array.indexOf(obj);
  if (idx !== -1) {
    array.splice(idx, 1);
  }
}

// ----------------------------------------------------------------------------

function vtkWidgetState(publicAPI, model) {
  model.classHierarchy.push('vtkWidgetState');
  const subscriptions = [];
  model.labels = {};
  model.nestedStates = [];

  // --------------------------------------------------------------------------
  // labels can be a string or an array of strings.
  // If nothing (or empty array) provided the default label will be used.
  // --------------------------------------------------------------------------

  publicAPI.bindState = (nested, labels = [DEFAULT_LABEL]) => {
    model.nestedStates.push(nested);
    subscriptions.push(nested.onModified(publicAPI.modified));

    if (Array.isArray(labels) && labels.length) {
      for (let i = 0; i < labels.length; i++) {
        const label = labels[i];
        if (!model.labels[label]) {
          model.labels[label] = [];
        }
        model.labels[label].push(nested);
      }
    } else {
      // Need to bind to a label
      const labelToUse = Array.isArray(labels)
        ? DEFAULT_LABEL
        : labels || DEFAULT_LABEL;
      if (!model.labels[labelToUse]) {
        model.labels[labelToUse] = [];
      }
      model.labels[labelToUse].push(nested);
    }
  };

  // --------------------------------------------------------------------------

  publicAPI.unbindState = (nested) => {
    while (subscriptions.length) {
      subscriptions.pop().unsubscribe();
    }
    removeObjectInArray(model.nestedStates, nested);
    for (let i = 0; i < model.nestedStates.length; i++) {
      subscriptions.push(model.nestedStates[i].onModified(publicAPI.modified));
    }

    Object.keys(model.labels).forEach((label) => {
      const list = model.labels[label];
      removeObjectInArray(list, nested);
    });
  };

  // --------------------------------------------------------------------------

  publicAPI.unbindAll = () => {
    while (subscriptions.length) {
      subscriptions.pop().unsubscribe();
    }
    model.nestedStates = [];
  };

  // --------------------------------------------------------------------------
  // Active flag API
  // --------------------------------------------------------------------------

  publicAPI.activate = () => publicAPI.setActive(true);

  publicAPI.deactivate = (excludingState) => {
    if (excludingState !== publicAPI) {
      publicAPI.setActive(false);
    }
    for (let i = 0; i < model.nestedStates.length; i++) {
      model.nestedStates[i].deactivate(excludingState);
    }
  };

  publicAPI.activateOnly = (subState) => {
    if (subState) {
      subState.setActive(true);
    }
    // deactivate current state, but exclude the sub-state
    publicAPI.deactivate(subState);
  };

  // --------------------------------------------------------------------------
  // Nested state methods
  // --------------------------------------------------------------------------

  publicAPI.getStatesWithLabel = (name) => model.labels[name];

  publicAPI.getAllNestedStates = () => model.nestedStates;

  // --------------------------------------------------------------------------
  // Clean on delete
  // --------------------------------------------------------------------------

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
