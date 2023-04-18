import { vec3, mat4 } from 'gl-matrix';
import macro from 'vtk.js/Sources/macros';
import vtkCompositeCameraManipulator from 'vtk.js/Sources/Interaction/Manipulators/CompositeCameraManipulator';
import vtkCompositeMouseManipulator from 'vtk.js/Sources/Interaction/Manipulators/CompositeMouseManipulator';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

// ----------------------------------------------------------------------------
// vtkMouseCameraAxisRotateManipulator methods
// ----------------------------------------------------------------------------

function vtkMouseCameraAxisRotateManipulator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkMouseCameraAxisRotateManipulator');

  const negCameraDir = new Float64Array(3);
  const newCamPos = new Float64Array(3);
  const newFp = new Float64Array(3);
  const newViewUp = new Float64Array(3);
  const trans = new Float64Array(16);
  const rotation = new Float64Array(16);
  const v2 = new Float64Array(3);
  const centerNeg = new Float64Array(3);
  const negRotationAxis = new Float64Array(3);

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
    const cameraViewUp = camera.getViewUp();
    const cameraDirection = camera.getDirectionOfProjection();
    vec3.negate(negCameraDir, cameraDirection);

    mat4.identity(trans);
    mat4.identity(rotation);

    const { center, rotationFactor, rotationAxis } = model;
    vec3.negate(negRotationAxis, rotationAxis);

    const dx = model.previousPosition.x - position.x;
    const dy = model.previousPosition.y - position.y;

    const size = interactor.getView().getViewportSize(renderer);

    // Azimuth
    const azimuthDelta = vtkMath.radiansFromDegrees(
      ((360.0 * dx) / size[0]) * rotationFactor
    );
    mat4.rotate(rotation, rotation, azimuthDelta, rotationAxis);

    // Elevation
    vtkMath.cross(cameraDirection, cameraViewUp, v2);
    let elevationDelta = vtkMath.radiansFromDegrees(
      ((-360.0 * dy) / size[1]) * rotationFactor
    );
    // angle of camera to rotation axis on the positive or negative half,
    // relative to the origin.
    const angleToPosHalf = Math.acos(vec3.dot(negCameraDir, rotationAxis));
    const angleToNegHalf = Math.acos(vec3.dot(negCameraDir, negRotationAxis));

    // whether camera is in positive half of the rotation axis or neg half
    const inPosHalf = angleToPosHalf <= angleToNegHalf;
    const elevationToAxis = Math.min(angleToPosHalf, angleToNegHalf);

    if (model.useHalfAxis && !inPosHalf) {
      elevationDelta = Math.PI / 2 - angleToPosHalf;
    } else if (inPosHalf && elevationToAxis + elevationDelta < 0) {
      elevationDelta = -elevationToAxis;
      // } else if (!inPosHalf && elevationToAxis - elevationDelta < 0) {
    } else if (!inPosHalf && angleToPosHalf + elevationDelta > Math.PI) {
      elevationDelta = elevationToAxis;
    }

    mat4.rotate(rotation, rotation, elevationDelta, v2);

    // Translate from origin
    mat4.translate(trans, trans, center);

    // apply rotation
    mat4.multiply(trans, trans, rotation);

    // Translate to origin
    vec3.negate(centerNeg, center);
    mat4.translate(trans, trans, centerNeg);

    // Apply transformation to camera position, focal point, and view up
    vec3.transformMat4(newCamPos, cameraPos, trans);
    vec3.transformMat4(newFp, cameraFp, trans);

    vec3.transformMat4(newViewUp, cameraViewUp, rotation);

    camera.setPosition(newCamPos[0], newCamPos[1], newCamPos[2]);
    camera.setFocalPoint(newFp[0], newFp[1], newFp[2]);
    camera.setViewUp(newViewUp);

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
  rotationAxis: [0, 0, 1],
  useHalfAxis: true,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, ['rotationAxis', 'useHalfAxis']);
  vtkCompositeMouseManipulator.extend(publicAPI, model, initialValues);
  vtkCompositeCameraManipulator.extend(publicAPI, model, initialValues);

  // Object specific methods
  vtkMouseCameraAxisRotateManipulator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkMouseCameraAxisRotateManipulator'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
