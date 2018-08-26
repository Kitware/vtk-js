import macro from 'vtk.js/Sources/macro';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkWidgetRepresentation
// ----------------------------------------------------------------------------

function vtkWidgetRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWidgetRepresentation');
  // Internal cache
  const cache = { mtimes: {}, states: [] };

  publicAPI.setLabels = (...labels) => {
    if (labels.length === 1) {
      model.labels = [].concat(labels[0]);
    } else {
      model.labels = labels;
    }
    publicAPI.modified();
  };

  publicAPI.getRepresentationStates = (input = model.inputData[0]) => {
    if (
      cache.mtimes.representation === publicAPI.getMTime() &&
      cache.mtimes.input === input.getMTime()
    ) {
      return cache.states;
    }

    // Reinitialize cache
    cache.mtimes.representation = publicAPI.getMTime();
    cache.mtimes.input = input.getMTime();
    cache.states = [];

    // Fill states that are going to be used in the representation
    model.labels.forEach((name) => {
      cache.states = cache.states.concat(input.getStatesWithLabel(name) || []);
    });

    return cache.states;
  };

  publicAPI.getSelectedState = (prop, compositeID) => {
    const representationStates = publicAPI.getRepresentationStates();
    if (compositeID < representationStates.length) {
      return representationStates[compositeID];
    }
    vtkErrorMacro(
      `Representation ${publicAPI.getClassName()} should implement getSelectedState(prop, compositeID) method.`
    );
    return null;
  };

  // Make sure setting the labels at build time works with string/array...
  publicAPI.setLabels(model.labels);
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
