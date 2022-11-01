import { vec3 } from 'gl-matrix';
import macro from 'vtk.js/Sources/macros';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import { IDENTITY } from 'vtk.js/Sources/Common/Core/Math/Constants';

// ----------------------------------------------------------------------------
// vtkTransform methods
// ----------------------------------------------------------------------------
// eslint-disable-next-line import/no-mutable-exports
let newInstance;

function vtkTransform(publicAPI, model) {
  // Set our className
  model.classHierarchy.push(
    'vtkAbstractTransform',
    'vtkHomogeneousTransform',
    'vtkTransform'
  );

  publicAPI.transformPoint = (point, out) => {
    vec3.transformMat4(out, point, model.matrix);
    return out;
  };

  publicAPI.getInverse = () =>
    newInstance({
      matrix: vtkMath.invertMatrix(Array.from(model.matrix), [], 4),
    });
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  matrix: [...IDENTITY],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);
  macro.obj(publicAPI, model);

  macro.setGetArray(publicAPI, model, ['matrix'], 16);

  vtkTransform(publicAPI, model);
}

// ----------------------------------------------------------------------------
newInstance = macro.newInstance(extend, 'vtkTransform');
export { newInstance };

// ----------------------------------------------------------------------------

export default { newInstance, extend };
