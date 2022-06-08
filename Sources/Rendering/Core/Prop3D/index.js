import { quat, mat4 } from 'gl-matrix';

import macro from 'vtk.js/Sources/macros';
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkProp from 'vtk.js/Sources/Rendering/Core/Prop';

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

  publicAPI.setOrientation = (x, y, z) => {
    if (
      model.orientation &&
      x === model.orientation[0] &&
      y === model.orientation[1] &&
      z === model.orientation[2]
    ) {
      return false;
    }
    model.orientation = [x, y, z];
    if (!model.rotation) model.rotation = mat4.identity(new Float64Array(16));
    mat4.identity(model.rotation);
    publicAPI.rotateZ(z);
    publicAPI.rotateX(x);
    publicAPI.rotateY(y);
    publicAPI.modified();
    return true;
  };

  publicAPI.setUserMatrix = (matrix) => {
    if (!matrix) {
      model.userMatrix = null;
    } else {
      if (!model.userMatrix)
        model.userMatrix = mat4.identity(new Float64Array(16));
      mat4.copy(model.userMatrix, matrix);
    }
    publicAPI.modified();
  };

  publicAPI.getMatrix = () => {
    publicAPI.computeMatrix();
    return model.matrix;
  };

  publicAPI.computeMatrix = () => {
    // check whether or not need to rebuild the matrix
    if (!model.matrixMTime) {
      return;
    }
    if (publicAPI.getMTime() > model.matrixMTime.getMTime()) {
      mat4.identity(model.matrix);
      if (model.userMatrix) {
        mat4.multiply(model.matrix, model.matrix, model.userMatrix);
      }
      if (model.position && model.origin && model.scale && model.rotation) {
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
      }

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

function defaultValues(initialValues) {
  return {
    origin: [0, 0, 0],
    position: [0, 0, 0],
    orientation: [0, 0, 0],
    scale: [1, 1, 1],
    bounds: [1, -1, 1, -1, 1, -1],

    matrix: mat4.identity(new Float64Array(16)),
    rotation: mat4.identity(new Float64Array(16)),
    userMatrix: mat4.identity(new Float64Array(16)),
    transform: null,
    matrixMTime: macro.obj({}),

    userMatrixMTime: null,

    cachedProp3D: null,
    isIdentity: true,
    ...initialValues,
  };
}

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(initialValues, defaultValues(initialValues));

  // Inheritance
  vtkProp.extend(publicAPI, model, initialValues);

  // Build VTK API
  macro.get(publicAPI, model, ['bounds', 'isIdentity']);
  macro.getArray(publicAPI, model, ['orientation']);
  macro.setGetArray(publicAPI, model, ['origin', 'position', 'scale'], 3);

  // Object methods
  vtkProp3D(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkProp3D');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
