import macro from 'vtk.js/Sources/macros';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

function eq(v1, v2) {
  return (
    v1.length === 3 &&
    v2.length === 3 &&
    v1[0] === v2[0] &&
    v1[1] === v2[1] &&
    v1[2] === v2[2]
  );
}

function isSame(o, p1, p2, before) {
  return eq(o, before.o) && eq(p1, before.p1) && eq(p2, before.p2);
}

// function axis(o, p1, p2) {
//   if (o[0] === p1[0] && p1[0] === p2[0]) {
//     return 'X';
//   }
//   if (o[1] === p1[1] && p1[1] === p2[1]) {
//     return 'Y';
//   }
//   if (o[2] === p1[2] && p1[2] === p2[2]) {
//     return 'Z';
//   }
//   return '?';
// }

// ----------------------------------------------------------------------------

function vtkOrientationMixin(publicAPI, model) {
  const previousPoints = { o: [], p1: [], p2: [] };

  publicAPI.normalize = () => {
    vtkMath.normalize(model.up);
    vtkMath.normalize(model.right);
    vtkMath.normalize(model.direction);
    publicAPI.modified();
  };

  publicAPI.updateFromOriginRightUp = (o, p1, p2) => {
    if (isSame(o, p1, p2, previousPoints)) {
      return;
    }
    previousPoints.o = o.slice();
    previousPoints.p1 = p1.slice();
    previousPoints.p2 = p2.slice();

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
