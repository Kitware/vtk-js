import macro from 'vtk.js/Sources/macros';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';

const FACTORY = {
  vtkDataArray,
  vtkCellArray,
  vtkPoints,
};

function createDefaultTypedArrayHandler() {
  const arrays = [];

  function write(array) {
    const id = arrays.length;
    arrays.push(array);
    return id;
  }

  function read(arrayId) {
    return arrays[arrayId];
  }

  return {
    write,
    read,
    arrays,
  };
}

function vtkArraySerializer(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkArraySerializer');
  if (!model.typedArrayHandler) {
    model.typedArrayHandler = createDefaultTypedArrayHandler();
  }

  publicAPI.serialize = (obj) => {
    const name = obj.getName();
    const numberOfTuples = obj.getNumberOfTuples();
    const vtkClass = obj.getClassName();
    const rawData = obj.getData();
    return {
      id: model.typedArrayHandler.write(rawData),
      name,
      numberOfTuples,
      vtkClass,
    };
  };

  publicAPI.deserialize = (obj) => {
    const values = model.typedArrayHandler.read(obj.id);
    const { name, numberOfTuples } = obj;
    return FACTORY[obj.vtkClass].newInstance({ name, numberOfTuples, values });
  };
}

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, initialValues);

  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, ['typedArrayHandler']);

  // Object specific methods
  vtkArraySerializer(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkArraySerializer');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
