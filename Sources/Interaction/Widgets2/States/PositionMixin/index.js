import macro from 'vtk.js/Sources/macro';

// ----------------------------------------------------------------------------

function vtkPositionMixin(publicAPI, model) {
  model.classHierarchy.push('vtkPositionMixin');

  // --------------------------------------------------------------------------

  publicAPI.translate = (dx, dy, dz) => {
    const [x, y, z] = publicAPI.getPositionByReference();
    publicAPI.setPosition(x + dx, y + dy, z + dz);
  };
}

// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  position: [0, 0, 0],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  macro.setGetArray(publicAPI, model, ['position'], 3);

  vtkPositionMixin(publicAPI, model);
}

// ----------------------------------------------------------------------------

export default { extend };
