import { quat, mat4 } from 'gl-matrix';

import macro from 'vtk.js/Sources/macros';
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkProp from 'vtk.js/Sources/Rendering/Core/Prop';

const VTK_EPSILON = 1e-6;

// ----------------------------------------------------------------------------
// vtkProp3D methods
// ----------------------------------------------------------------------------

function vtkProp3D(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkProp3D');

  publicAPI.addPosition = (deltaXYZ) => {
    model.position = model.position.map(
      (value, index) => value + deltaXYZ[index]
    );
    publicAPI.modified();
  };

  publicAPI.getOrientationWXYZ = () => {
    const q = quat.create();
    mat4.getRotation(q, model.rotation);
    const oaxis = new Float64Array(3);
    const w = quat.getAxisAngle(oaxis, q);
    return [vtkMath.degreesFromRadians(w), oaxis[0], oaxis[1], oaxis[2]];
  };

  publicAPI.getOrientationQuaternion = (out = []) =>
    mat4.getRotation(out, model.rotation);

  publicAPI.rotateX = (val) => {
    if (val === 0.0) {
      return;
    }
    mat4.rotateX(
      model.rotation,
      model.rotation,
      vtkMath.radiansFromDegrees(val)
    );
    publicAPI.modified();
  };

  publicAPI.rotateY = (val) => {
    if (val === 0.0) {
      return;
    }
    mat4.rotateY(
      model.rotation,
      model.rotation,
      vtkMath.radiansFromDegrees(val)
    );
    publicAPI.modified();
  };

  publicAPI.rotateZ = (val) => {
    if (val === 0.0) {
      return;
    }
    mat4.rotateZ(
      model.rotation,
      model.rotation,
      vtkMath.radiansFromDegrees(val)
    );
    publicAPI.modified();
  };

  publicAPI.rotateWXYZ = (degrees, x, y, z) => {
    if (degrees === 0.0 || (x === 0.0 && y === 0.0 && z === 0.0)) {
      return;
    }

    // convert to radians
    const angle = vtkMath.radiansFromDegrees(degrees);

    const q = quat.create();
    quat.setAxisAngle(q, [x, y, z], angle);

    const quatMat = new Float64Array(16);
    mat4.fromQuat(quatMat, q);
    mat4.multiply(model.rotation, model.rotation, quatMat);
    publicAPI.modified();
  };

  publicAPI.rotateQuaternion = (orientationQuaternion) => {
    if (Math.abs(orientationQuaternion[3]) >= 1 - VTK_EPSILON) {
      return;
    }

    const oriQuatMat = mat4.fromQuat(
      new Float64Array(16),
      orientationQuaternion
    );
    mat4.multiply(model.rotation, model.rotation, oriQuatMat);
    publicAPI.modified();
  };

  publicAPI.setOrientation = (x, y, z) => {
    if (
      x === model.orientation[0] &&
      y === model.orientation[1] &&
      z === model.orientation[2]
    ) {
      return false;
    }
    model.orientation = [x, y, z];
    mat4.identity(model.rotation);
    publicAPI.rotateZ(z);
    publicAPI.rotateX(x);
    publicAPI.rotateY(y);
    publicAPI.modified();
    return true;
  };

  publicAPI.setUserMatrix = (matrix) => {
    if (vtkMath.areMatricesEqual(model.userMatrix, matrix)) {
      return false;
    }
    mat4.copy(model.userMatrix, matrix);
    publicAPI.modified();
    return true;
  };

  publicAPI.getMatrix = () => {
    publicAPI.computeMatrix();
    return model.matrix;
  };

  publicAPI.computeMatrix = () => {
    // check whether or not need to rebuild the matrix
    if (publicAPI.getMTime() > model.matrixMTime.getMTime()) {
      mat4.identity(model.matrix);
      if (model.userMatrix) {
        mat4.multiply(model.matrix, model.matrix, model.userMatrix);
      }
      mat4.translate(model.matrix, model.matrix, model.origin);
      mat4.translate(model.matrix, model.matrix, model.position);
      mat4.multiply(model.matrix, model.matrix, model.rotation);
      mat4.scale(model.matrix, model.matrix, model.scale);
      mat4.translate(model.matrix, model.matrix, [
        -model.origin[0],
        -model.origin[1],
        -model.origin[2],
      ]);
      mat4.transpose(model.matrix, model.matrix);

      // check for identity
      model.isIdentity = true;
      for (let i = 0; i < 4; ++i) {
        for (let j = 0; j < 4; ++j) {
          if ((i === j ? 1.0 : 0.0) !== model.matrix[i + j * 4]) {
            model.isIdentity = false;
          }
        }
      }
      model.matrixMTime.modified();
    }
  };

  publicAPI.getBoundsByReference = () => {
    if (model.mapper === null) {
      return model.bounds;
    }

    // Check for the special case when the mapper's bounds are unknown
    const bds = model.mapper.getBounds();
    if (!bds || bds.length !== 6) {
      return bds;
    }

    // Check for the special case when the actor is empty.
    if (bds[0] > bds[1]) {
      // No need to copy bds, a new array is created when calling getBounds()
      model.mapperBounds = bds;
      model.bounds = [...vtkBoundingBox.INIT_BOUNDS];
      model.boundsMTime.modified();
      return bds;
    }

    // Check if we have cached values for these bounds - we cache the
    // values returned by model.mapper.getBounds() and we store the time
    // of caching. If the values returned this time are different, or
    // the modified time of this class is newer than the cached time,
    // then we need to rebuild.
    if (
      !model.mapperBounds ||
      !bds.every((_, i) => bds[i] === model.mapperBounds[i]) ||
      publicAPI.getMTime() > model.boundsMTime.getMTime()
    ) {
      macro.vtkDebugMacro('Recomputing bounds...');
      // No need to copy bds, a new array is created when calling getBounds()
      model.mapperBounds = bds;

      // Compute actor bounds from matrix and mapper bounds
      publicAPI.computeMatrix();
      const transposedMatrix = new Float64Array(16);
      mat4.transpose(transposedMatrix, model.matrix);
      vtkBoundingBox.transformBounds(bds, transposedMatrix, model.bounds);

      model.boundsMTime.modified();
    }

    return model.bounds;
  };

  publicAPI.getBounds = () => {
    const bounds = publicAPI.getBoundsByReference();
    // Handle case when bounds are not iterable (for example null or undefined)
    try {
      return [...bounds];
    } catch {
      return bounds;
    }
  };

  publicAPI.getCenter = () => vtkBoundingBox.getCenter(model.bounds);
  publicAPI.getLength = () => vtkBoundingBox.getLength(model.bounds);
  publicAPI.getXRange = () => vtkBoundingBox.getXRange(model.bounds);
  publicAPI.getYRange = () => vtkBoundingBox.getYRange(model.bounds);
  publicAPI.getZRange = () => vtkBoundingBox.getZRange(model.bounds);

  publicAPI.getUserMatrix = () => model.userMatrix;

  function updateIdentityFlag() {
    publicAPI.computeMatrix();
  }

  publicAPI.onModified(updateIdentityFlag);
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  origin: [0, 0, 0],
  position: [0, 0, 0],
  orientation: [0, 0, 0],
  rotation: null,
  scale: [1, 1, 1],
  bounds: [...vtkBoundingBox.INIT_BOUNDS],

  userMatrix: null,
  userMatrixMTime: null,

  cachedProp3D: null,
  isIdentity: true,
  matrixMTime: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkProp.extend(publicAPI, model, initialValues);

  model.matrixMTime = {};
  macro.obj(model.matrixMTime);

  // Build VTK API
  macro.get(publicAPI, model, ['isIdentity']);
  macro.getArray(publicAPI, model, ['orientation']);
  macro.setGetArray(publicAPI, model, ['origin', 'position', 'scale'], 3);

  // Object internal instance
  model.matrix = mat4.identity(new Float64Array(16));
  model.rotation = mat4.identity(new Float64Array(16));
  model.userMatrix = mat4.identity(new Float64Array(16));
  model.transform = null; // FIXME

  // Object methods
  vtkProp3D(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkProp3D');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
