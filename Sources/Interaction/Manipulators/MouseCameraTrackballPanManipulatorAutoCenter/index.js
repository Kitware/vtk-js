import macro from 'vtk.js/Sources/macros';
import vtkMouseCameraTrackballPanManipulator from 'vtk.js/Sources/Interaction/Manipulators/MouseCameraTrackballPanManipulator';
import { mat4, vec3 } from 'gl-matrix';

// ----------------------------------------------------------------------------
// Helper functions for center of rotation adjustment
// ----------------------------------------------------------------------------

/**
 * Transforms a vector by the transformation delta between two matrices.
 *
 * @param {Object} tempObjects - Temporary matrices/vectors for computation
 * @param {mat4} beforeMatrix - Matrix before transformation
 * @param {mat4} afterMatrix - Matrix after transformation
 * @param {Array} vector - Vector to transform [x, y, z]
 * @returns {Array} Transformed vector [x, y, z]
 */
function transformVectorByTransformation(
  tempObjects,
  beforeMatrix,
  afterMatrix,
  vector
) {
  const { matrixA, matrixB, newCenter } = tempObjects;

  // The view matrix from vtk.js is row-major, but gl-matrix expects column-major.
  // We need to transpose them before use.
  mat4.transpose(matrixA, beforeMatrix);

  mat4.transpose(matrixB, afterMatrix);
  mat4.invert(matrixB, matrixB);

  // Compute delta transformation matrix
  mat4.multiply(matrixA, matrixB, matrixA);

  vec3.transformMat4(newCenter, vector, matrixA);
  return newCenter;
}

/**
 * Computes the new center of rotation based on camera movement.
 * When the camera moves (pan), the center of rotation should move
 * by the same transformation.
 *
 * @param {Object} tempObjects - Temporary matrices/vectors for computation
 * @param {Object} renderer - VTK renderer
 * @param {mat4} beforeCameraMatrix - Camera view matrix before movement
 * @param {Array} oldCenterOfRotation - Previous center of rotation [x, y, z]
 * @returns {Array} New center of rotation [x, y, z]
 */
function computeNewCenterOfRotation(
  tempObjects,
  renderer,
  beforeCameraMatrix,
  oldCenterOfRotation
) {
  const cam = renderer.getActiveCamera();
  if (!cam || !beforeCameraMatrix) {
    return oldCenterOfRotation;
  }
  const afterMatrixRowMajor = cam.getViewMatrix();

  return transformVectorByTransformation(
    tempObjects,
    beforeCameraMatrix,
    afterMatrixRowMajor,
    oldCenterOfRotation
  );
}

function getCameraMatrix(renderer, tempMatrix) {
  const cam = renderer.getActiveCamera();
  if (cam) {
    mat4.copy(tempMatrix, cam.getViewMatrix());
    return tempMatrix;
  }
  return null;
}

function vtkMouseCameraTrackballPanManipulatorAutoCenter(publicAPI, model) {
  model.classHierarchy.push('vtkMouseCameraTrackballPanManipulatorAutoCenter');

  const tempCameraMatrix = mat4.create();
  const tempComputeObjects = {
    matrixA: mat4.create(),
    matrixB: mat4.create(),
    newCenter: vec3.create(),
  };

  const superOnMouseMove = publicAPI.onMouseMove;

  publicAPI.onMouseMove = (interactor, renderer, position) => {
    if (!position) {
      return;
    }
    const beforeCameraMatrix = getCameraMatrix(renderer, tempCameraMatrix);

    superOnMouseMove(interactor, renderer, position);

    if (beforeCameraMatrix && model.center) {
      const newCenter = computeNewCenterOfRotation(
        tempComputeObjects,
        renderer,
        beforeCameraMatrix,
        model.center
      );
      publicAPI.setCenter(newCenter);

      const style = interactor.getInteractorStyle();
      if (style && style.setCenterOfRotation) {
        style.setCenterOfRotation(newCenter);
      }
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkMouseCameraTrackballPanManipulator.extend(publicAPI, model, initialValues);

  // Object specific methods
  vtkMouseCameraTrackballPanManipulatorAutoCenter(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkMouseCameraTrackballPanManipulatorAutoCenter'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
