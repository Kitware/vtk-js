import globalThisShim from 'globalthis';

export const vtkGlobal = globalThisShim(); // returns native globalThis if compliant

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
    if (vtkGlobal.console && vtkGlobal.console.error) {
      vtkGlobal.console.error('Invalid VTK object');
    }
    return null;
  }
  const constructor = factoryMapping[obj.vtkClass];
  if (!constructor) {
    if (vtkGlobal.console && vtkGlobal.console.error) {
      vtkGlobal.console.error(
        `No vtk class found for Object of type ${obj.vtkClass}`
      );
    }
    return null;
  }

  // Shallow copy object
  const model = { ...obj };

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
