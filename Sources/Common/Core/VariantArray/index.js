import macro from 'vtk.js/Sources/macros';

const TUPLE_HOLDER = [];

// ----------------------------------------------------------------------------
// vtkVariantArray methods
// ----------------------------------------------------------------------------

function vtkVariantArray(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkVariantArray');

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
      model.name = `vtkVariantArray${publicAPI.getMTime()}`;
    }
    return model.name;
  };

  publicAPI.setData = (array, numberOfComponents) => {
    if (Array.isArray(array)) {
      // eslint-disable-next-line no-param-reassign
      array = macro.newTypedArrayFrom(model.dataType, array);
    }

    model.values = array;
    model.size = array ? array.length : 0;

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

function defaultValues(initialValues) {
  return {
    name: '',
    numberOfComponents: 1,
    size: 0,
    // values: null,
    dataType: 'JSON',
    ...initialValues,
  };
}

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  if (!initialValues.empty && !initialValues.values && !initialValues.size) {
    throw new TypeError(
      'Cannot create vtkDataArray object without: size > 0, values'
    );
  }
  delete initialValues.empty;
  Object.assign(initialValues, defaultValues(initialValues));

  // Object methods
  macro.obj(publicAPI, model);
  macro.set(publicAPI, model, ['name', 'numberOfComponents']);

  model.dataType = initialValues.dataType ? initialValues.dataType : 'JSON';
  delete initialValues.dataType;
  if (!initialValues.values) {
    if (!initialValues.size) initialValues.values = null;
    else
      initialValues.values = macro.newTypedArray(
        model.dataType,
        initialValues.size
      );
  } else if (Array.isArray(initialValues.values)) {
    initialValues.values = macro.newTypedArrayFrom(
      model.dataType,
      initialValues.values
    );
  }

  // Object specific methods
  vtkVariantArray(publicAPI, model);

  // We call customly setData here to keep coherence between parameters before
  // the call of publicAPI.set(initialValues) in the constructor
  // Warning : setData cannot be overwritten in a child class
  publicAPI.setData(initialValues.values, initialValues.numberOfComponents);
  delete initialValues.values;
  delete initialValues.dataType;
  delete initialValues.numberOfComponents;
  delete initialValues.size;
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkVariantArray', true);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
