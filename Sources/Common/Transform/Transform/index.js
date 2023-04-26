import { IDENTITY } from 'vtk.js/Sources/Common/Core/Math/Constants';
import { mat4, vec3 } from 'gl-matrix';
import macro from 'vtk.js/Sources/macros';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';

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

  publicAPI.transformPoints = (points, out) => {
    const inPoint = new Float64Array(3);
    const outPoint = new Float64Array(3);
    for (let i = 0; i < points.length; i += 3) {
      inPoint[0] = points[i];
      inPoint[1] = points[i + 1];
      inPoint[2] = points[i + 2];
      vec3.transformMat4(outPoint, inPoint, model.matrix);
      out[i] = outPoint[0];
      out[i + 1] = outPoint[1];
      out[i + 2] = outPoint[2];
    }
    return out;
  };

  /**
   * Sets the internal state of the transform to PreMultiply.
   * All subsequent operations will occur before those already represented in the current transformation.
   * In homogeneous matrix notation, M = M*A where M is the current transformation matrix and A is the applied matrix.
   * The default is PreMultiply.
   */
  publicAPI.preMultiply = () => {
    publicAPI.setPreMultiplyFlag(true);
  };

  /**
   * Sets the internal state of the transform to PostMultiply.
   * All subsequent operations will occur after those already represented in the current transformation.
   * In homogeneous matrix notation, M = A*M where M is the current transformation matrix and A is the applied matrix.
   * The default is PreMultiply.
   */
  publicAPI.postMultiply = () => {
    publicAPI.setPreMultiplyFlag(false);
  };

  publicAPI.transformMatrix = (matrix, out) => {
    if (model.preMultiplyFlag) {
      mat4.multiply(out, model.matrix, matrix);
    } else {
      mat4.multiply(out, matrix, model.matrix);
    }
    return out;
  };

  // Apply the transform to each matrix in the same way as transformMatrix
  // `matrices` can be a contiguous array of float or an array of array
  publicAPI.transformMatrices = (matrices, out) => {
    const inMat = new Float64Array(16);
    const outMat = new Float64Array(16);
    const transform = model.preMultiplyFlag
      ? () => mat4.multiply(outMat, model.matrix, inMat)
      : () => mat4.multiply(outMat, inMat, model.matrix);

    for (let i = 0; i < matrices.length; i += 16) {
      for (let j = 0; j < 16; ++j) {
        inMat[j] = matrices[i + j];
      }
      transform();
      for (let j = 0; j < 16; ++j) {
        out[i + j] = outMat[j];
      }
    }
    return out;
  };

  publicAPI.getInverse = () =>
    newInstance({
      matrix: vtkMath.invertMatrix(Array.from(model.matrix), [], 4),
      preMultiplyFlag: model.preMultiplyFlag,
    });
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  preMultiplyFlag: false,
  matrix: [...IDENTITY],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);
  macro.obj(publicAPI, model);

  macro.setGet(publicAPI, model, ['preMultiplyFlag']);
  macro.setGetArray(publicAPI, model, ['matrix'], 16);

  vtkTransform(publicAPI, model);
}

// ----------------------------------------------------------------------------
newInstance = macro.newInstance(extend, 'vtkTransform');
export { newInstance };

// ----------------------------------------------------------------------------

export default { newInstance, extend };
