import { vec3, mat4 }       from 'gl-matrix';
import macro                from 'vtk.js/Sources/macro';
import vtkCameraManipulator from 'vtk.js/Sources/Interaction/Manipulators/CameraManipulator';
import vtkMath              from 'vtk.js/Sources/Common/Core/Math';

// ----------------------------------------------------------------------------
// vtkTrackballRoll methods
// ----------------------------------------------------------------------------

function vtkTrackballRoll(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkTrackballRoll');

  publicAPI.onAnimation = (interactor, renderer) => {
    const lastPtr = interactor.getPointerIndex();
    const pos = interactor.getAnimationEventPosition(lastPtr);
    const lastPos = interactor.getLastAnimationEventPosition(lastPtr);

    if (!pos || !lastPos || !renderer) {
      return;
    }

    const camera = renderer.getActiveCamera();

    // compute view vector (rotation axis)
    const cameraPos = camera.getPosition();
    const cameraFp = camera.getFocalPoint();
    const viewUp = camera.getViewUp();

    const axis = [cameraFp[0] - cameraPos[0], cameraFp[1] - cameraPos[1], cameraFp[2] - cameraPos[2]];

    // compute the angle of rotation
    // - first compute the two vectors (center to mouse)
    publicAPI.computeDisplayCenter(interactor.getInteractorStyle());

    const x1 = lastPos.x - model.displayCenter[0];
    const x2 = pos.x - model.displayCenter[0];
    const y1 = lastPos.y - model.displayCenter[1];
    const y2 = pos.y - model.displayCenter[1];
    if ((x2 === 0 && y2 === 0) || (x1 === 0 && y1 === 0)) {
      // don't ever want to divide by zero
      return;
    }

    // - divide by magnitudes to get angle
    const angle = vtkMath.degreesFromRadians(((x1 * y2) - (y1 * x2)) /
      (Math.sqrt((x1 * x1) + (y1 * y1)) * Math.sqrt((x2 * x2) + (y2 * y2))));

    const center = model.center;
    const transform = mat4.create();
    mat4.identity(transform);

    // Translate to center
    mat4.translate(transform, transform, vec3.fromValues(center[0], center[1], center[2]));

    // roll
    mat4.rotate(transform, transform, vtkMath.radiansFromDegrees(angle), vec3.fromValues(axis[0], axis[1], axis[2]));

    // Translate back
    mat4.translate(transform, transform, vec3.fromValues(-center[0], -center[1], -center[2]));

    const newCamPos = vec3.create();
    const newFp = vec3.create();
    const newViewUp = vec3.create();

    // Apply transformation to camera position, focal point, and view up
    vec3.transformMat4(newCamPos, vec3.fromValues(cameraPos[0], cameraPos[1], cameraPos[2]), transform);
    vec3.transformMat4(newFp, vec3.fromValues(cameraFp[0], cameraFp[1], cameraFp[2]), transform);
    vec3.transformMat4(newViewUp, vec3.fromValues(viewUp[0] + cameraPos[0], viewUp[1] + cameraPos[1], viewUp[2] + cameraPos[2]), transform);

    camera.setPosition(newCamPos[0], newCamPos[1], newCamPos[2]);
    camera.setFocalPoint(newFp[0], newFp[1], newFp[2]);
    camera.setViewUp(newViewUp[0] - newCamPos[0], newViewUp[1] - newCamPos[1], newViewUp[2] - newCamPos[2]);
    camera.orthogonalizeViewUp();

    renderer.resetCameraClippingRange();
    interactor.render();
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
  vtkCameraManipulator.extend(publicAPI, model, initialValues);

  // Object specific methods
  vtkTrackballRoll(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkTrackballRoll');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend });
