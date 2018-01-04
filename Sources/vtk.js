const factoryMapping = {
  vtkObject: () => null,
};

export default function vtk(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (obj.isA) {
    return obj;
  }
  if (!obj.vtkClass) {
    if (global.console && global.console.error) {
      global.console.error('Invalid VTK object');
    }
    return null;
  }
  const constructor = factoryMapping[obj.vtkClass];
  if (!constructor) {
    if (global.console && global.console.error) {
      global.console.error(
        `No vtk class found for Object of type ${obj.vtkClass}`
      );
    }
    return null;
  }

  // Shallow copy object
  const model = Object.assign({}, obj);

  // Convert into vtkObject any nested key
  Object.keys(model).forEach((keyName) => {
    if (
      model[keyName] &&
      typeof model[keyName] === 'object' &&
      model[keyName].vtkClass
    ) {
      model[keyName] = vtk(model[keyName]);
    }
  });

  // Return the root
  const newInst = constructor(model);
  if (newInst && newInst.modified) {
    newInst.modified();
  }
  return newInst;
}

function register(vtkClassName, constructor) {
  factoryMapping[vtkClassName] = constructor;
}

// Nest register method under the vtk function
vtk.register = register;
