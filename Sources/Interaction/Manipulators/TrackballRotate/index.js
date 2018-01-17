import { vec3, mat4 } from 'gl-matrix';
import macro from 'vtk.js/Sources/macro';
import vtkCameraManipulator from 'vtk.js/Sources/Interaction/Manipulators/CameraManipulator';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';

// ----------------------------------------------------------------------------
// vtkTrackballRotate methods
// ----------------------------------------------------------------------------

function vtkTrackballRotate(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkTrackballRotate');

  publicAPI.onAnimation = (interactor, renderer) => {
    const lastPtr = interactor.getPointerIndex();
    const pos = interactor.getAnimationEventPosition(lastPtr);
    const lastPos = interactor.getLastAnimationEventPosition(lastPtr);

    if (!pos || !lastPos || !renderer) {
      return;
    }

    const camera = renderer.getActiveCamera();
    const cameraPos = camera.getPosition();
    const cameraFp = camera.getFocalPoint();

    const trans = mat4.create();
    mat4.identity(trans);

    const { center, rotationFactor } = model;

    // Translate to center
    mat4.translate(
      trans,
      trans,
      vec3.fromValues(center[0], center[1], center[2])
    );

    const dx = lastPos.x - pos.x;
    const dy = lastPos.y - pos.y;

    const size = interactor.getView().getSize();

    // Azimuth
    const viewUp = camera.getViewUp();
    mat4.rotate(
      trans,
      trans,
      vtkMath.radiansFromDegrees(360.0 * dx / size[0] * rotationFactor),
      vec3.fromValues(viewUp[0], viewUp[1], viewUp[2])
    );

    // Elevation
    const v2 = [0, 0, 0];
    vtkMath.cross(camera.getDirectionOfProjection(), viewUp, v2);
    mat4.rotate(
      trans,
      trans,
      vtkMath.radiansFromDegrees(-360.0 * dy / size[1] * rotationFactor),
      vec3.fromValues(v2[0], v2[1], v2[2])
    );

    // Translate back
    mat4.translate(
      trans,
      trans,
      vec3.fromValues(-center[0], -center[1], -center[2])
    );

    const newCamPos = vec3.create();
    const newFp = vec3.create();
    const newViewUp = vec3.create();

    // Apply transformation to camera position, focal point, and view up
    vec3.transformMat4(
      newCamPos,
      vec3.fromValues(cameraPos[0], cameraPos[1], cameraPos[2]),
      trans
    );
    vec3.transformMat4(
      newFp,
      vec3.fromValues(cameraFp[0], cameraFp[1], cameraFp[2]),
      trans
    );
    vec3.transformMat4(
      newViewUp,
      vec3.fromValues(
        viewUp[0] + cameraPos[0],
        viewUp[1] + cameraPos[1],
        viewUp[2] + cameraPos[2]
      ),
      trans
    );

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
  vtkTrackballRotate(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkTrackballRotate');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend });
