import macro from 'vtk.js/Sources/macros';
import vtkCompositeVRManipulator from 'vtk.js/Sources/Interaction/Manipulators/CompositeVRManipulator';
import {
  Device,
  Input,
} from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor/Constants';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import { vec3, vec4, mat4, quat } from 'gl-matrix';

// ----------------------------------------------------------------------------
// vtk3DControllerModelSelectorManipulator methods
// ----------------------------------------------------------------------------

function vtk3DControllerModelSelectorManipulator(publicAPI, model) {
  model.classHierarchy.push('vtk3DControllerModelSelectorManipulator');

  let pickedActor;

  function positionProp(
    prop,
    physicalPosition,
    physicalOrientation,
    physicalToWorldMatrix
  ) {
    const worldPosition = vec4.fromValues(...physicalPosition, 1.0);
    vec4.transformMat4(worldPosition, worldPosition, physicalToWorldMatrix);

    const lastWorldPosition = vec4.fromValues(
      ...model.lastPhysicalPosition,
      1.0
    );
    vec4.transformMat4(
      lastWorldPosition,
      lastWorldPosition,
      physicalToWorldMatrix
    );

    const translation = [];
    vec3.subtract(translation, worldPosition, lastWorldPosition);

    const worldOrientation = quat.normalize([], physicalOrientation);
    const lastWorldOrientation = quat.normalize(
      [],
      model.lastPhysicalOrientation
    );

    const lastWorldOrientationConjugated = quat.conjugate(
      [],
      lastWorldOrientation
    );
    const orientation = [];
    quat.multiply(
      orientation,
      worldOrientation,
      lastWorldOrientationConjugated
    );

    quat.normalize(orientation, orientation);
    const axis = [];
    const angle = quat.getAxisAngle(axis, orientation);

    const matrix = [...mat4.transpose([], prop.getMatrix())];

    const transform = mat4.create();
    mat4.translate(transform, transform, worldPosition);
    mat4.rotate(transform, transform, angle, axis);
    mat4.translate(transform, transform, vec3.negate([], worldPosition));
    mat4.translate(transform, transform, translation);

    const [currentPropW, ...currentPropOrientationAxis] = [
      ...prop.getOrientationWXYZ(),
    ];

    mat4.multiply(transform, transform, matrix);
    const matTranslation = mat4.getTranslation([], transform);
    const matScaling = mat4.getScaling([], transform);
    const matRotation = mat4.getRotation([], transform);

    const currentPropOrientation = quat.setAxisAngle(
      [],
      currentPropOrientationAxis,
      vtkMath.radiansFromDegrees(currentPropW)
    );

    const currentPropOrientationConjugated = quat.conjugate(
      [],
      currentPropOrientation
    );
    const newPropOrientation = [];
    quat.multiply(
      newPropOrientation,
      currentPropOrientationConjugated,
      matRotation
    );

    quat.normalize(newPropOrientation, newPropOrientation);

    const newPropOrientationAxis = [];
    const newPropOrientationAngle = quat.getAxisAngle(
      newPropOrientationAxis,
      newPropOrientation
    );

    // Update the prop internal matrix
    prop.setPosition(...matTranslation);
    prop.setScale(...matScaling);
    prop.rotateWXYZ(
      vtkMath.degreesFromRadians(newPropOrientationAngle),
      ...newPropOrientationAxis
    );
  }

  publicAPI.onButton3D = (
    interactorStyle,
    renderer,
    state,
    device,
    input,
    pressed,
    targetPosition,
    targetOrientation
  ) => {
    const camera = renderer.getActiveCamera();
    const physicalToWorldMatrix = [];
    camera.getPhysicalToWorldMatrix(physicalToWorldMatrix);

    const targetRayPos = vec3.fromValues(
      targetPosition.x,
      targetPosition.y,
      targetPosition.z
    );

    const targetRayDirection = camera.physicalOrientationToWorldDirection([
      targetOrientation.x,
      targetOrientation.y,
      targetOrientation.z,
      targetOrientation.w,
    ]);
    const targetRayWorldPos = [];
    vec3.transformMat4(targetRayWorldPos, targetRayPos, physicalToWorldMatrix);

    const dist = renderer.getActiveCamera().getClippingRange()[1];

    if (pressed) {
      const wp1 = [...targetRayWorldPos, 1.0];
      const wp2 = [
        wp1[0] - targetRayDirection[0] * dist,
        wp1[1] - targetRayDirection[1] * dist,
        wp1[2] - targetRayDirection[2] * dist,
        1.0,
      ];

      // do the picking, lookup picked actors and take action if we have some.
      model.picker.pick3DPoint(wp1, wp2, renderer);
      const actors = model.picker.getActors();

      if (actors.length > 0) {
        pickedActor = actors[0];
      }
    } else {
      model.lastPhysicalOrientation = null;
      model.lastPhysicalPosition = null;
      pickedActor = null;
    }
  };

  publicAPI.onMove3D = (interactorStyle, renderer, state, eventData) => {
    if (pickedActor == null) {
      return;
    }

    const camera = renderer.getActiveCamera();
    const physicalToWorldMatrix = [];
    camera.getPhysicalToWorldMatrix(physicalToWorldMatrix);

    const targetRayPosition = vec3.fromValues(
      eventData.targetPosition.x,
      eventData.targetPosition.y,
      eventData.targetPosition.z
    );

    const wxyz = quat.fromValues(
      eventData.targetOrientation.x,
      eventData.targetOrientation.y,
      eventData.targetOrientation.z,
      eventData.targetOrientation.w
    ); // orientation is a unit quaternion.

    if (model.lastPhysicalOrientation && model.lastPhysicalPosition) {
      positionProp(
        pickedActor,
        targetRayPosition,
        [...wxyz],
        physicalToWorldMatrix
      );
    }

    model.lastPhysicalOrientation = [...wxyz];
    model.lastPhysicalPosition = [...targetRayPosition];
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  device: Device.RightController,
  input: Input.TrackPad,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  macro.setGet(publicAPI, model, ['picker']);
  macro.get(publicAPI, model, ['lastPhysicalPosition', 'lastPhysicalPosition']);
  macro.obj(publicAPI, model);
  vtkCompositeVRManipulator.extend(publicAPI, model, initialValues);

  // Object specific methods
  vtk3DControllerModelSelectorManipulator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtk3DControllerModelSelectorManipulator'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
