import macro from 'vtk.js/Sources/macros';

const TUPLE_HOLDER = [];

// ----------------------------------------------------------------------------
// vtkStringArray methods
// ----------------------------------------------------------------------------

function vtkStringArray(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkStringArray');

  // Description:
  // Return the data component at the location specified by tupleIdx and
  // compIdx.
  publicAPI.getComponent = (tupleIdx, compIdx = 0) =>
    model.values[tupleIdx * model.numberOfComponents + compIdx];

  // Description:
  // Set the data component at the location specified by tupleIdx and compIdx
  // to value.
  // Note that i is less than NumberOfTuples and j is less than
  //  NumberOfComponents. Make sure enough memory has been allocated
  // (use SetNumberOfTuples() and SetNumberOfComponents()).
  publicAPI.setComponent = (tupleIdx, compIdx, value) => {
    if (value !== model.values[tupleIdx * model.numberOfComponents + compIdx]) {
      model.values[tupleIdx * model.numberOfComponents + compIdx] = value;
      publicAPI.modified();
    }
  };

  publicAPI.getData = () => model.values;

  publicAPI.getTuple = (idx, tupleToFill = TUPLE_HOLDER) => {
    const numberOfComponents = model.numberOfComponents || 1;
    if (tupleToFill.length) {
      tupleToFill.length = numberOfComponents;
    }
    const offset = idx * numberOfComponents;
    for (let i = 0; i < numberOfComponents; i++) {
      tupleToFill[i] = model.values[offset + i];
    }
    return tupleToFill;
  };

  publicAPI.getTupleLocation = (idx = 1) => idx * model.numberOfComponents;
  publicAPI.getNumberOfComponents = () => model.numberOfComponents;
  publicAPI.getNumberOfValues = () => model.values.length;
  publicAPI.getNumberOfTuples = () =>
    model.values.length / model.numberOfComponents;
  publicAPI.getDataType = () => model.dataType;
  /* eslint-disable no-use-before-define */
  publicAPI.newClone = () =>
    newInstance({
      name: model.name,
      numberOfComponents: model.numberOfComponents,
    });
  /* eslint-enable no-use-before-define */

  publicAPI.getName = () => {
    if (!model.name) {
      publicAPI.modified();
      model.name = `vtkStringArray${publicAPI.getMTime()}`;
    }
    return model.name;
  };

  publicAPI.setData = (array, numberOfComponents) => {
    model.values = array;
    model.size = array.length;
    if (numberOfComponents) {
      model.numberOfComponents = numberOfComponents;
    }
    if (model.size % model.numberOfComponents !== 0) {
      model.numberOfComponents = 1;
    }
    publicAPI.modified();
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  name: '',
  numberOfComponents: 1,
  size: 0,
  // values: null,
  dataType: 'string',
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  if (!model.empty && !model.values && !model.size) {
    throw new TypeError(
      'Cannot create vtkStringArray object without: size > 0, values'
    );
  }

  if (!model.values) {
    model.values = [];
  } else if (Array.isArray(model.values)) {
    model.values = [...model.values];
  }

  if (model.values) {
    model.size = model.values.length;
  }

  // Object methods
  macro.obj(publicAPI, model);
  macro.set(publicAPI, model, ['name']);

  // Object specific methods
  vtkStringArray(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkStringArray');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
