import macro from 'vtk.js/Sources/macros';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkCollection methods
// ----------------------------------------------------------------------------

function vtkCollection(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkCollection');

  publicAPI.addItem = (item) => {
    model.collection.push(item);
    publicAPI.modified();
  };

  publicAPI.insertItem = (idx, item) => {
    if (idx < 0 || model.collection.length < idx) {
      vtkErrorMacro('idx out of bounds for insertion.');
    }
    model.collection.splice(idx, 0, item);
    publicAPI.modified();
  };

  publicAPI.replaceItem = (idx, item) => {
    model.collection.splice(idx, 1, item);
    publicAPI.modified();
  };

  publicAPI.removeItem = (inValue) => {
    const idx =
      typeof inValue === 'number' ? inValue : model.collection.indexOf(inValue);
    if (idx >= 0 && idx < model.collection.length) {
      model.collection.splice(idx, 1);
      publicAPI.modified();
    } else {
      vtkErrorMacro('idx out of bounds for removeItem.');
    }
  };

  publicAPI.removeAllItems = () => {
    model.collection = [];
    publicAPI.modified();
  };

  publicAPI.isItemPresent = (item) => model.collection.includes(item);

  publicAPI.getNumberOfItems = () => model.collection.length;

  publicAPI.empty = () => model.collection.length === 0;

  publicAPI.getItem = (idx) => model.collection[idx];

  publicAPI.forEach = (ftor) => {
    model.collection.forEach(ftor);
    // Call modified() for the collection, since ftor could have modified the elements.
    publicAPI.updateMTimeWithElements();
  };

  publicAPI.reduce = (ftor, initialValue) =>
    model.collection.reduce(ftor, initialValue);

  publicAPI.map = (ftor) => model.collection.map(ftor);

  publicAPI.updateMTimeWithElements = () => {
    let maxMTimeOfItems = 0; // we expect time values to be positive numbers
    for (let i = 0; i < model.collection.length; ++i) {
      const elem = model.collection[i];
      maxMTimeOfItems = Math.max(maxMTimeOfItems, elem.getMTime());
    }

    if (maxMTimeOfItems > publicAPI.getMTime()) {
      publicAPI.modified();
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  collection: [],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);

  // Object specific methods
  vtkCollection(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkCollection');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
