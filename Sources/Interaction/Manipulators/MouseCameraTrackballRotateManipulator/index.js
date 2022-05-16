import { vec3, mat4 } from 'gl-matrix';
import macro from 'vtk.js/Sources/macros';
import vtkCompositeCameraManipulator from 'vtk.js/Sources/Interaction/Manipulators/CompositeCameraManipulator';
import vtkCompositeMouseManipulator from 'vtk.js/Sources/Interaction/Manipulators/CompositeMouseManipulator';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

// ----------------------------------------------------------------------------
// vtkMouseCameraTrackballRotateManipulator methods
// ----------------------------------------------------------------------------

function vtkMouseCameraTrackballRotateManipulator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkMouseCameraTrackballRotateManipulator');

  const newCamPos = new Float64Array(3);
  const newFp = new Float64Array(3);
  const newViewUp = new Float64Array(3);
  const trans = new Float64Array(16);
  const v2 = new Float64Array(3);
  const centerNeg = new Float64Array(3);
  const direction = new Float64Array(3);

  publicAPI.onButtonDown = (interactor, renderer, position) => {
    model.previousPosition = position;
  };

  publicAPI.onMouseMove = (interactor, renderer, position) => {
    if (!position) {
      return;
    }

    const camera = renderer.getActiveCamera();
    const cameraPos = camera.getPosition();
    const cameraFp = camera.getFocalPoint();

    mat4.identity(trans);

    const { center, rotationFactor } = model;

    if (model.useFocalPointAsCenterOfRotation) {
      center[0] = cameraFp[0];
      center[1] = cameraFp[1];
      center[2] = cameraFp[2];
    }

    const dx = model.previousPosition.x - position.x;
    const dy = model.previousPosition.y - position.y;

    const size = interactor.getView().getViewportSize(renderer);

    // Azimuth
    const viewUp = camera.getViewUp();
    if (model.useWorldUpVec) {
      const centerOfRotation = new Float64Array(3);
      vec3.copy(centerOfRotation, model.worldUpVec);

      // Compute projection of cameraPos onto worldUpVec
      vtkMath.multiplyScalar(
        centerOfRotation,
        vtkMath.dot(cameraPos, model.worldUpVec) /
          vtkMath.dot(model.worldUpVec, model.worldUpVec)
      );

      vtkMath.add(center, centerOfRotation, centerOfRotation);

      mat4.translate(trans, trans, centerOfRotation);
      mat4.rotate(
        trans,
        trans,
        vtkMath.radiansFromDegrees(((360.0 * dx) / size[0]) * rotationFactor),
        model.worldUpVec
      );

      // Translate back
      centerOfRotation[0] = -centerOfRotation[0];
      centerOfRotation[1] = -centerOfRotation[1];
      centerOfRotation[2] = -centerOfRotation[2];
      mat4.translate(trans, trans, centerOfRotation);
      mat4.translate(trans, trans, center);
    } else {
      mat4.translate(trans, trans, center);
      mat4.rotate(
        trans,
        trans,
        vtkMath.radiansFromDegrees(((360.0 * dx) / size[0]) * rotationFactor),
        viewUp
      );
    }

    // Elevation
    vtkMath.cross(camera.getDirectionOfProjection(), viewUp, v2);
    mat4.rotate(
      trans,
      trans,
      vtkMath.radiansFromDegrees(((-360.0 * dy) / size[1]) * rotationFactor),
      v2
    );

    // Translate back
    centerNeg[0] = -center[0];
    centerNeg[1] = -center[1];
    centerNeg[2] = -center[2];
    mat4.translate(trans, trans, centerNeg);

    // Apply transformation to camera position, focal point, and view up
    vec3.transformMat4(newCamPos, cameraPos, trans);
    vec3.transformMat4(newFp, cameraFp, trans);
    direction[0] = viewUp[0] + cameraPos[0];
    direction[1] = viewUp[1] + cameraPos[1];
    direction[2] = viewUp[2] + cameraPos[2];
    vec3.transformMat4(newViewUp, direction, trans);

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

const DEFAULT_VALUES = {
  useWorldUpVec: false,
  // set WorldUpVector to be y-axis by default
  worldUpVec: [0, 1, 0],
  useFocalPointAsCenterOfRotation: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  macro.obj(publicAPI, model);
  vtkCompositeMouseManipulator.extend(publicAPI, model, initialValues);
  vtkCompositeCameraManipulator.extend(publicAPI, model, initialValues);

  // Create get-set macro
  macro.setGet(publicAPI, model, ['useWorldUpVec']);
  macro.setGetArray(publicAPI, model, ['worldUpVec'], 3);
  macro.setGet(publicAPI, model, ['useFocalPointAsCenterOfRotation']);

  // Object specific methods
  vtkMouseCameraTrackballRotateManipulator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkMouseCameraTrackballRotateManipulator'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
