const factoryMapping = {};

export default function vtk(obj) {
  if (obj.isA) {
    return obj;
  }
  if (!obj.type) {
    console.log('Invalid VTK object');
    return null;
  }
  const constructor = factoryMapping[obj.type];
  if (!constructor) {
    console.log('No vtk class found for Object of type', obj.type);
    return null;
  }

  return constructor(obj);
}

export function register(vtkClassName, constructor) {
  factoryMapping[vtkClassName] = constructor;
}

// Nest register method under the vtk function
vtk.register = register;
