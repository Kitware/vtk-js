import macro from 'vtk.js/Sources/macro';

// ----------------------------------------------------------------------------

function vtkOriginMixin(publicAPI, model) {
  publicAPI.translate = (dx, dy, dz) => {
    const [x, y, z] = publicAPI.getOriginByReference();
    publicAPI.setOrigin(x + dx, y + dy, z + dz);
  };
}

// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  origin: [0, 0, 0],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);
  macro.setGetArray(publicAPI, model, ['origin'], 3);
  vtkOriginMixin(publicAPI, model);
}

// ----------------------------------------------------------------------------

export default { extend };
