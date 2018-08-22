import macro from 'vtk.js/Sources/macro';

// ----------------------------------------------------------------------------
// vtkWidgetRepresentation
// ----------------------------------------------------------------------------

function vtkWidgetRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWidgetRepresentation');

  publicAPI.setLabels = (...labels) => {
    if (labels.length === 1) {
      model.labels = [].concat(labels[0]);
    } else {
      model.labels = labels;
    }
    publicAPI.modified();
  };

  publicAPI.getStateList = (input = model.inputData[0]) => {
    let stateList = [];
    model.labels.forEach((name) => {
      stateList = stateList.concat(input.getListForLabel(name) || []);
    });
    return stateList;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  actors: [],
  labels: [],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);
  macro.algo(publicAPI, model, 1, 1);
  macro.get(publicAPI, model, ['actors', 'labels']);

  // Object specific methods
  vtkWidgetRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export default { extend };
