import macro from 'vtk.js/Sources/macro';

// ----------------------------------------------------------------------------

// TODO move to macro
function prefixName(name, prefix = '') {
  return prefix ? `${prefix}${macro.capitalize(name)}` : name;
}

// ----------------------------------------------------------------------------

// TODO move to macro
function prefixObject(object, prefix = '') {
  const renamedObj = {};
  Object.keys(object).forEach((name) => {
    renamedObj[prefixName(name, prefix)] = object[name];
  });
  return renamedObj;
}

// ----------------------------------------------------------------------------

function vtkSphereState(publicAPI, model) {
  model.classHierarchy.push('vtkSphereState');

  // --------------------------------------------------------------------------

  publicAPI.translate = (dx, dy, dz) => {
    const [x, y, z] = publicAPI.getPosition();
    publicAPI.setPosition(x + dx, y + dy, z + dz);
  };
}

// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  position: [0, 0, 0],
  radius: 1,
};

// ----------------------------------------------------------------------------

export function compose(
  publicAPI,
  model,
  prefix = '',
  defaultValues = DEFAULT_VALUES
) {
  Object.assign(model, prefixObject(defaultValues, prefix));
  macro.setGet(publicAPI, model, [prefixName('radius', prefix)]);
  macro.setGetArray(publicAPI, model, [prefixName('position', prefix)], 3);
}

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  macro.obj(publicAPI, model);
  compose(publicAPI, model);

  vtkSphereState(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkSphereState');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
