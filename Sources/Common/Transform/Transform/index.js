import macro from 'vtk.js/Sources/macros';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import { IDENTITY } from 'vtk.js/Sources/Common/Core/Math/Constants';
import { mat3, mat4, quat, vec3 } from 'gl-matrix';

const { vtkWarningMacro } = macro;

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

  /**
   * Create a translation matrix and concatenate it with the current
   * transformation according to preMultiply or postMultiply semantics.
   * @param {Number} x X component of the translation
   * @param {Number} y Y component of the translation
   * @param {Number} z Z component of the translation
   */
  publicAPI.translate = (x, y, z) => {
    if (x === 0 && y === 0 && z === 0) {
      return;
    }
    const tMat = mat4.create();
    mat4.fromTranslation(tMat, [x, y, z]);
    if (model.preMultiplyFlag) {
      mat4.multiply(model.matrix, model.matrix, tMat);
    } else {
      mat4.multiply(model.matrix, tMat, model.matrix);
    }
    publicAPI.modified();
  };

  /**
   * Create a rotation matrix and concatenate it with the current transformation
   * according to preMultiply or postMultiply semantics.
   * The angle is expressed in degrees.
   * @param {Number} angle Angle in degrees
   * @param {Number} x X component of the rotation axis
   * @param {Number} y Y component of the rotation axis
   * @param {Number} z Z component of the rotation axis
   */
  publicAPI.rotateWXYZ = (degrees, x, y, z) => {
    if (x === 0.0 && y === 0.0 && z === 0.0) {
      vtkWarningMacro('No rotation applied, axis is zero vector.');
      return;
    }
    if (degrees === 0.0) {
      return;
    }

    // convert to radians
    const angle = vtkMath.radiansFromDegrees(degrees);

    const q = quat.create();
    quat.setAxisAngle(q, [x, y, z], angle);

    const quatMat = new Float64Array(16);
    mat4.fromQuat(quatMat, q);

    if (model.preMultiplyFlag) {
      mat4.multiply(model.matrix, model.matrix, quatMat);
    } else {
      mat4.multiply(model.matrix, quatMat, model.matrix);
    }
    publicAPI.modified();
  };

  /**
   * Create a rotation matrix about the X, Y, or Z axis and concatenate it with
   * the current transformation according to preMultiply or postMultiply
   * semantics.
   * The angle is expressed in degrees.
   * @param {Number} angle Angle in degrees
   */
  publicAPI.rotateX = (angle) => {
    publicAPI.rotateWXYZ(angle, 1, 0, 0);
  };

  /**
   * Create a rotation matrix about the X, Y, or Z axis and concatenate it with
   * the current transformation according to preMultiply or postMultiply
   * semantics.
   * @param {Number} angle Angle in degrees
   */
  publicAPI.rotateY = (angle) => {
    publicAPI.rotateWXYZ(angle, 0, 1, 0);
  };

  /**
   * Create a rotation matrix about the X, Y, or Z axis and concatenate it with
   * the current transformation according to preMultiply or postMultiply
   * semantics.
   * @param {Number} angle Angle in degrees
   */
  publicAPI.rotateZ = (angle) => {
    publicAPI.rotateWXYZ(angle, 0, 0, 1);
  };

  /**
   * Create a scale matrix (i.e. set the diagonal elements to x, y, z) and
   * concatenate it with the current transformation according to preMultiply or
   * postMultiply semantics.
   * @param {Number} x Diagonal element for X axis
   * @param {Number} y Diagonal element for Y axis
   * @param {Number} z Diagonal element for Z axis
   */
  publicAPI.scale = (x, y, z) => {
    if (x === 1 && y === 1 && z === 1) {
      return;
    }
    const sMat = mat4.create();
    mat4.fromScaling(sMat, [x, y, z]);
    if (model.preMultiplyFlag) {
      mat4.multiply(model.matrix, model.matrix, sMat);
    } else {
      mat4.multiply(model.matrix, sMat, model.matrix);
    }
    publicAPI.modified();
  };

  /**
   * Apply the transformation to a normal.
   * @param {vec3} inNormal The normal vector to transform
   * @param {vec3} outNormal The output vector
   * @returns {vec3} The transformed normal vector
   */
  publicAPI.transformNormal = (inNormal, outNormal = []) => {
    const matrix3x3 = mat3.fromMat4(mat3.create(), model.matrix);
    // Invert the upper 3x3 part of the matrix
    const invMat3 = mat3.create();
    mat3.invert(invMat3, matrix3x3);
    // Transpose
    const tMat3 = mat3.create();
    mat3.transpose(tMat3, invMat3);
    // Multiply normal
    publicAPI.transformVector(inNormal, outNormal, tMat3);
    // Ensure the output normal is normalized
    vtkMath.normalize(outNormal);
    return outNormal;
  };

  /**
   * Apply the transformation to a series of normals, and append the results to
   * outNormals.
   * @param {vtkDataArray} inNormals The normal vectors to transform
   * @param {vtkDataArray} outNormals The output array
   */
  publicAPI.transformNormals = (inNormals, outNormals) => {
    const inArr = inNormals.getData();
    const outArr = outNormals.getData();
    const tmp = [0, 0, 0];

    const matrix3x3 = mat3.fromMat4(mat3.create(), model.matrix);
    // Invert the upper 3x3 part of the matrix
    const invMat3 = mat3.create();
    mat3.invert(invMat3, matrix3x3);
    // Transpose
    const tMat3 = mat3.create();
    mat3.transpose(tMat3, invMat3);

    for (let i = 0; i < inArr.length; i += 3) {
      tmp[0] = inArr[i];
      tmp[1] = inArr[i + 1];
      tmp[2] = inArr[i + 2];
      // matrix has been transposed & inverted, so use transformVector directly
      // to apply the transformation
      publicAPI.transformVector(tmp, tmp, tMat3);
      vtkMath.normalize(tmp);

      outArr[i] = tmp[0];
      outArr[i + 1] = tmp[1];
      outArr[i + 2] = tmp[2];
    }
  };

  /**
   * Apply the transformation to a vector.
   * @param {vec3} inVector The vector to transform
   * @param {vec3} outVector The output vector
   * @param {mat3} [matrix=null] if null (default), the Transform matrix is being used.
   * @returns {vec3} The transformed vector
   */
  publicAPI.transformVector = (inVector, outVector = [], matrix = null) => {
    const matrix3x3 = matrix || mat3.fromMat4(mat3.create(), model.matrix);
    vec3.transformMat3(outVector, inVector, matrix3x3);
    return outVector;
  };

  /**
   * Apply the transformation to a series of vectors, and append the results to
   * outVectors.
   * @param {vtkDataArray} inVectors The vectors to transform
   * @param {vtkDataArray} outVectors The output array
   */
  publicAPI.transformVectors = (inVectors, outVectors) => {
    const inArr = inVectors.getData();
    const outArr = outVectors.getData();
    const tmp = [0, 0, 0];
    for (let i = 0; i < inArr.length; i += 3) {
      tmp[0] = inArr[i];
      tmp[1] = inArr[i + 1];
      tmp[2] = inArr[i + 2];
      publicAPI.transformVector(tmp, tmp);
      vtkMath.normalize(tmp);
      outArr[i] = tmp[0];
      outArr[i + 1] = tmp[1];
      outArr[i + 2] = tmp[2];
    }
  };

  /**
   * Transform points, normals, and vectors simultaneously.
   * @param {vtkPoints} inPoints Input points
   * @param {vtkPoints} outPoints Output points
   * @param {vtkDataArray} inNormals Input normals
   * @param {vtkDataArray} outNormals Output normals
   * @param {vtkDataArray} inVectors Input vectors
   * @param {vtkDataArray} outVectors Output vectors
   * @param {Array<vtkDataArray>} inVectorsArr Optional input vector arrays
   * @param {Array<vtkDataArray>} outVectorsArr Optional output vector arrays
   */
  publicAPI.transformPointsNormalsVectors = (
    inPoints,
    outPoints,
    inNormals,
    outNormals,
    inVectors,
    outVectors,
    inVectorsArr = null,
    outVectorsArr = null
  ) => {
    const n = inPoints.getNumberOfPoints();
    const nOptionalVectors = inVectorsArr?.length ?? 0;

    const point = new Float64Array(3);
    const oldPoint = new Float64Array(3);
    const oldVector = new Float64Array(3);
    const oldNormal = new Float64Array(3);

    let modifiedPoint = false;
    let modifiedVector = false;
    let modifiedNormal = false;
    const modifiedVectorsArr = [];

    for (let ptId = 0; ptId < n; ptId++) {
      // Transform point
      inPoints.getPoint(ptId, point);
      oldPoint.set(point);
      publicAPI.transformPoint(point, point);
      outPoints.setPoint(ptId, ...point);
      if (!vtkMath.areEquals(oldPoint, point)) {
        modifiedPoint = true;
      }

      // Transform vectors
      if (inVectors) {
        const inData = inVectors.getData();
        const outData = outVectors.getData();
        point[0] = inData[ptId * 3];
        point[1] = inData[ptId * 3 + 1];
        point[2] = inData[ptId * 3 + 2];
        oldVector.set(point);
        publicAPI.transformVector(point, point);
        outData[ptId * 3] = point[0];
        outData[ptId * 3 + 1] = point[1];
        outData[ptId * 3 + 2] = point[2];
        if (!vtkMath.areEquals(oldVector, point)) {
          modifiedVector = true;
        }
      }

      // Transform normals
      if (inNormals) {
        const inData = inNormals.getData();
        const outData = outNormals.getData();
        point[0] = inData[ptId * 3];
        point[1] = inData[ptId * 3 + 1];
        point[2] = inData[ptId * 3 + 2];
        oldNormal.set(point);
        publicAPI.transformNormal(point, point);
        outData[ptId * 3] = point[0];
        outData[ptId * 3 + 1] = point[1];
        outData[ptId * 3 + 2] = point[2];
        if (!vtkMath.areEquals(oldNormal, point)) {
          modifiedNormal = true;
        }
      }

      // Transform optional vectors
      if (inVectorsArr) {
        for (let iArr = 0; iArr < nOptionalVectors; iArr++) {
          const inData = inVectorsArr[iArr].getData();
          const outData = outVectorsArr[iArr].getData();
          point[0] = inData[ptId * 3];
          point[1] = inData[ptId * 3 + 1];
          point[2] = inData[ptId * 3 + 2];
          oldVector.set(point);
          publicAPI.transformVector(point, point);
          outData[ptId * 3] = point[0];
          outData[ptId * 3 + 1] = point[1];
          outData[ptId * 3 + 2] = point[2];
          if (
            !vtkMath.arrayEqual(oldVector, point) &&
            !modifiedVectorsArr.includes(iArr)
          ) {
            modifiedVectorsArr.push(iArr);
          }
        }
      }
    }

    if (modifiedPoint) {
      outPoints.modified();
    }
    if (modifiedVector) {
      outVectors.modified();
    }
    if (modifiedNormal) {
      outNormals.modified();
    }
    modifiedVectorsArr.forEach((idx) => outVectorsArr[idx].modified());
  };
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
