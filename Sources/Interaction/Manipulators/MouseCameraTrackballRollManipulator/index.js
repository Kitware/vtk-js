import { vec3, mat4 } from 'gl-matrix';
import macro from 'vtk.js/Sources/macro';
import vtkCompositeCameraManipulator from 'vtk.js/Sources/Interaction/Manipulators/CompositeCameraManipulator';
import vtkCompositeMouseManipulator from 'vtk.js/Sources/Interaction/Manipulators/CompositeMouseManipulator';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';

// ----------------------------------------------------------------------------
// vtkMouseCameraTrackballRollManipulator methods
// ----------------------------------------------------------------------------

function vtkMouseCameraTrackballRollManipulator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkMouseCameraTrackballRollManipulator');

  const axis = new Float64Array(3);
  const direction = new Float64Array(3);
  const centerNeg = new Float64Array(3);
  const transform = new Float64Array(16);
  const newCamPos = new Float64Array(3);
  const newFp = new Float64Array(3);
  const newViewUp = new Float64Array(3);

  publicAPI.onButtonDown = (interactor, renderer, position) => {
    model.previousPosition = position;
  };

  publicAPI.onMouseMove = (interactor, renderer, position) => {
    if (!position) {
      return;
    }

    const camera = renderer.getActiveCamera();

    // compute view vector (rotation axis)
    const cameraPos = camera.getPosition();
    const cameraFp = camera.getFocalPoint();
    const viewUp = camera.getViewUp();

    axis[0] = cameraFp[0] - cameraPos[0];
    axis[1] = cameraFp[1] - cameraPos[1];
    axis[2] = cameraFp[2] - cameraPos[2];

    // compute the angle of rotation
    // - first compute the two vectors (center to mouse)
    publicAPI.computeDisplayCenter(interactor.getInteractorStyle(), renderer);

    const x1 = model.previousPosition.x - model.displayCenter[0];
    const x2 = position.x - model.displayCenter[0];
    const y1 = model.previousPosition.y - model.displayCenter[1];
    const y2 = position.y - model.displayCenter[1];
    if ((x2 === 0 && y2 === 0) || (x1 === 0 && y1 === 0)) {
      // don't ever want to divide by zero
      return;
    }

    // - divide by magnitudes to get angle
    const angle = vtkMath.degreesFromRadians(
      (x1 * y2 - y1 * x2) /
        (Math.sqrt(x1 * x1 + y1 * y1) * Math.sqrt(x2 * x2 + y2 * y2))
    );

    const { center } = model;
    mat4.identity(transform);
    centerNeg[0] = -center[0];
    centerNeg[1] = -center[1];
    centerNeg[2] = -center[2];

    // Translate to center
    mat4.translate(transform, transform, center);

    // roll
    mat4.rotate(transform, transform, vtkMath.radiansFromDegrees(angle), axis);

    // Translate back
    mat4.translate(transform, transform, centerNeg);

    // Apply transformation to camera position, focal point, and view up
    vec3.transformMat4(newCamPos, cameraPos, transform);
    vec3.transformMat4(newFp, cameraFp, transform);

    direction[0] = viewUp[0] + cameraPos[0];
    direction[1] = viewUp[1] + cameraPos[1];
    direction[2] = viewUp[2] + cameraPos[2];
    vec3.transformMat4(newViewUp, direction, transform);

    camera.setPosition(newCamPos[0], newCamPos[1], newCamPos[2]);
    camera.setFocalPoint(newFp[0], newFp[1], newFp[2]);
    camera.setViewUp(
      newViewUp[0] - newCamPos[0],
      newViewUp[1] - newCamPos[1],
      newViewUp[2] - newCamPos[2]
    );
    camera.orthogonalizeViewUp();

    renderer.resetCameraClippingRange();

    if (interactor.getLightFollowCamera()) {
      renderer.updateLightsGeometryToFollowCamera();
    }

    model.previousPosition = position;
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
  macro.obj(publicAPI, model);
  vtkCompositeCameraManipulator.extend(publicAPI, model, initialValues);
  vtkCompositeMouseManipulator.extend(publicAPI, model, initialValues);

  // Object specific methods
  vtkMouseCameraTrackballRollManipulator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkMouseCameraTrackballRollManipulator'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
