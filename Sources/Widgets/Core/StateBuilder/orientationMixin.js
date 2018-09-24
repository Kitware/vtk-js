import macro from 'vtk.js/Sources/macro';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';

// ----------------------------------------------------------------------------

function vtkOrientationMixin(publicAPI, model) {
  publicAPI.normalize = () => {
    vtkMath.normalize(model.up);
    vtkMath.normalize(model.right);
    vtkMath.normalize(model.direction);
    publicAPI.modified();
  };

  publicAPI.updateFromOriginRighUp = (o, p1, p2) => {
    console.log('updateFromOriginRighUp', o, p1, p2);
    model.up = [p2[0] - o[0], p2[1] - o[1], p2[2] - o[2]];
    model.right = [p1[0] - o[0], p1[1] - o[1], p1[2] - o[2]];
    vtkMath.cross(model.up, model.right, model.direction);
    vtkMath.cross(model.direction, model.up, model.right);
    publicAPI.normalize();
    publicAPI.modified();
  };
}

// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  up: [0, 1, 0],
  right: [1, 0, 0],
  direction: [0, 0, 1],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);
  macro.setGetArray(publicAPI, model, ['up', 'right', 'direction'], 3);
  vtkOrientationMixin(publicAPI, model);
}

// ----------------------------------------------------------------------------

export default { extend };
