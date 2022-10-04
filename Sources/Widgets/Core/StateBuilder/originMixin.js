import macro from 'vtk.js/Sources/macros';

// ----------------------------------------------------------------------------

function vtkOriginMixin(publicAPI, model) {
  publicAPI.translate = (dx, dy, dz) => {
    const [x, y, z] = publicAPI.getOriginByReference();
    publicAPI.setOrigin(x + dx, y + dy, z + dz);
  };
}

// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  origin: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);
  macro.setGetArray(publicAPI, model, ['origin'], 3);
  vtkOriginMixin(publicAPI, model);
}

// ----------------------------------------------------------------------------

export default { extend };
