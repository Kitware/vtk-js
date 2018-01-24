import macro from 'vtk.js/Sources/macro';

// ----------------------------------------------------------------------------
// vtkSourceProxy methods
// ----------------------------------------------------------------------------

function vtkSourceProxy(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkSourceProxy');

  function updateDataset() {
    if (model.algo) {
      publicAPI.setDataset(model.algo.getOutputData(), model.type);
    }
  }

  // API ----------------------------------------------------------------------

  publicAPI.setInputData = (ds, type) => {
    if (model.dataset !== ds) {
      model.dataset = ds;
      model.type = type || ds.getClassName();
      publicAPI.modified();
    }
  };

  // --------------------------------------------------------------------------

  publicAPI.setInputAlgorithm = (algo, type) => {
    if (model.algo !== algo) {
      model.algo = algo;
      if (model.algoSubscription) {
        model.algoSubscription();
        model.algoSubscription = null;
      }
      if (algo) {
        publicAPI.setInputData(algo.getOutputData(), type);
        model.algoSubscription = algo.onModified(updateDataset, -1).unsubscribe; // Trigger at next cycle
      }
    }
  };

  // --------------------------------------------------------------------------

  publicAPI.delete = macro.chain(() => {
    if (model.algoSubscription) {
      model.algoSubscription();
      model.algoSubscription = null;
    }
  }, publicAPI.delete);
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  name: 'Default source',
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, [
    'name',
    'type',
    'dataset',
    'algo',
    'inputProxy',
  ]);
  macro.set(publicAPI, model, ['name', 'inputProxy']);

  // Object specific methods
  vtkSourceProxy(publicAPI, model);
  macro.proxy(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkSourceProxy');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
