import macro from 'vtk.js/Sources/macros';

// ----------------------------------------------------------------------------
// vtkSourceProxy methods
// ----------------------------------------------------------------------------

function vtkSourceProxy(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkSourceProxy');

  // API ----------------------------------------------------------------------

  publicAPI.setInputProxy = (source) => {
    if (model.inputSubscription) {
      model.inputSubscription();
      model.inputSubscription = null;
    }
    model.inputProxy = source;
    if (model.inputProxy) {
      model.inputSubscription = source.onModified(
        publicAPI.update,
        -1
      ).unsubscribe; // Trigger at next cycle
    }
    publicAPI.update();
  };

  // --------------------------------------------------------------------------

  publicAPI.setInputData = (ds, type) => {
    if (model.dataset !== ds) {
      model.dataset = ds;
      model.type = type || ds.getClassName();
      publicAPI.modified();
      publicAPI.invokeDatasetChange();
    }
  };

  // --------------------------------------------------------------------------

  publicAPI.setInputAlgorithm = (algo, type, autoUpdate = true) => {
    model.type = type;
    if (model.algo !== algo) {
      model.algo = algo;
      if (model.algoSubscription) {
        model.algoSubscription();
        model.algoSubscription = null;
      }
      if (algo && autoUpdate) {
        model.algoSubscription = algo.onModified(() => {
          publicAPI.update();
        }, -1).unsubscribe; // Trigger at next cycle
        publicAPI.update();
      }
    }
  };

  // --------------------------------------------------------------------------

  publicAPI.update = () => {
    if (model.algo && model.inputProxy) {
      model.algo.setInputData(model.inputProxy.getDataset());
    }
    if (model.updateDomain && model.inputProxy) {
      model.updateDomain(publicAPI, model.inputProxy.getDataset());
    }
    if (model.algo) {
      publicAPI.setInputData(model.algo.getOutputData(), model.type);
    }
  };

  publicAPI.getUpdate = () => model.algo.getMTime() > model.dataset.getMTime();

  // --------------------------------------------------------------------------

  publicAPI.delete = macro.chain(() => {
    if (model.algoSubscription) {
      model.algoSubscription();
      model.algoSubscription = null;
    }
    if (model.inputSubscription) {
      model.inputSubscription();
      model.inputSubscription = null;
    }
  }, publicAPI.delete);

  // --------------------------------------------------------------------------
  // Initialisation
  // --------------------------------------------------------------------------

  if (model.inputProxy) {
    model.inputSubscription = model.inputProxy.onModified(() => {
      publicAPI.update();
    }, -1).unsubscribe; // Trigger at next cycle
  }
  if (model.algoFactory) {
    publicAPI.setInputAlgorithm(
      model.algoFactory.newInstance(),
      null,
      model.autoUpdate
    );
  }
  publicAPI.update();
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
  macro.set(publicAPI, model, ['name']);
  macro.event(publicAPI, model, 'DatasetChange');
  macro.proxy(publicAPI, model);

  // Object specific methods
  vtkSourceProxy(publicAPI, model);

  if (model.proxyPropertyMapping) {
    macro.proxyPropertyMapping(publicAPI, model, model.proxyPropertyMapping);
  }
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkSourceProxy');

// ----------------------------------------------------------------------------

export default {
  newInstance,
  extend,
};
