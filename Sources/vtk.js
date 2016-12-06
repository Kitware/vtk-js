const factoryMapping = {
  vtkObject: () => null,
};

export default function vtk(obj) {
  if (obj.isA) {
    return obj;
  }
  if (!obj.vtkClass) {
    console.log('Invalid VTK object');
    return null;
  }
  const constructor = factoryMapping[obj.vtkClass];
  if (!constructor) {
    console.log('No vtk class found for Object of type', obj.vtkClass);
    return null;
  }

  // Shallow copy object
  const model = Object.assign({}, obj);

  // Convert into vtkObject any nested key
  Object.keys(model).forEach((keyName) => {
    if (typeof model[keyName] === 'object' && model[keyName].vtkClass) {
      model[keyName] = vtk(model[keyName]);
    }
  });

  // Return the root
  return constructor(model);
}

export function register(vtkClassName, constructor) {
  factoryMapping[vtkClassName] = constructor;
}

// Nest register method under the vtk function
vtk.register = register;
