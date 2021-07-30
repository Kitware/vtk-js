import macro from 'vtk.js/Sources/macros';

// ----------------------------------------------------------------------------

function vtkCornerMixin(publicAPI, model) {
  publicAPI.translate = (dx, dy, dz) => {
    const [x, y, z] = publicAPI.getCornerByReference();
    publicAPI.setCorner(x + dx, y + dy, z + dz);
  };
}

// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  corner: [0, 0, 0],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);
  macro.setGetArray(publicAPI, model, ['corner'], 3);
  vtkCornerMixin(publicAPI, model);
}

// ----------------------------------------------------------------------------

export default { extend };
