import { mat4, quat, vec3, vec4 } from 'gl-matrix';
import vtkCompositeVRManipulator from 'vtk.js/Sources/Interaction/Manipulators/CompositeVRManipulator';
import vtkPicker from 'vtk.js/Sources/Rendering/Core/Picker';
import macro from 'vtk.js/Sources/macros';
import { States } from 'vtk.js/Sources/Rendering/Core/InteractorStyle/Constants';

// ----------------------------------------------------------------------------
// vtk3DControllerModelSelectorManipulator methods
// ----------------------------------------------------------------------------

function vtk3DControllerModelSelectorManipulator(publicAPI, model) {
  model.classHierarchy.push('vtk3DControllerModelSelectorManipulator');

  const picker = vtkPicker.newInstance();

  // The current prop we are manipulating, if any.
  let pickedProp;

  // pre-allocate array buffers
  const physicalToWorldMatrix = new Float64Array(16);

  // arrays holding deltas from lastWorldPosition and lastOrientation
  const translation = new Float64Array(3);
  const rotation = new Float64Array(4);
  const lastOrientationConjugate = new Float64Array(4);
  const orientationAxis = new Float64Array(3);

  // arrays holding the transform
  const computedTransform = new Float64Array(16);
  const computedTransformRotation = new Float64Array(4);

  // arrays holding the current state of pickedProp.
  const transposedPropMatrix = new Float64Array(16);
  const propCurrentOrientation = new Float64Array(4);
  const propCurrentOrientationConjugate = new Float64Array(4);

  // arrays holding the new properties that must be assigned to pickedProp.
  const propNewTranslation = new Float64Array(3);
  const propNewScaling = new Float64Array(3);
  const propNewOrientation = new Float64Array(4);

  function applyPositionAndOrientationToProp(prop, worldPosition, orientation) {
    vec3.subtract(translation, worldPosition, model.lastWorldPosition);

    quat.conjugate(lastOrientationConjugate, model.lastOrientation);

    quat.multiply(rotation, orientation, lastOrientationConjugate);
    quat.normalize(rotation, rotation);

    const rotationAngle = quat.getAxisAngle(orientationAxis, rotation);

    // reset to identity
    mat4.identity(computedTransform);

    // compute transform
    mat4.translate(computedTransform, computedTransform, worldPosition);
    mat4.rotate(
      computedTransform,
      computedTransform,
      rotationAngle,
      orientationAxis
    );
    mat4.translate(
      computedTransform,
      computedTransform,
      vec3.negate(new Float64Array(3), worldPosition)
    );
    mat4.translate(computedTransform, computedTransform, translation);

    // lookup the prop internal matrix
    mat4.transpose(transposedPropMatrix, prop.getMatrix());
    // apply the new computedTransform to the prop internal matrix
    mat4.multiply(computedTransform, computedTransform, transposedPropMatrix);

    // Multiply the computedTransform with the current prop orientation to get the delta
    // that must be applied to the prop
    mat4.getRotation(computedTransformRotation, computedTransform);
    prop.getOrientationQuaternion(propCurrentOrientation);
    quat.conjugate(propCurrentOrientationConjugate, propCurrentOrientation);
    quat.multiply(
      propNewOrientation,
      propCurrentOrientationConjugate,
      computedTransformRotation
    );

    quat.normalize(propNewOrientation, propNewOrientation);

    mat4.getTranslation(propNewTranslation, computedTransform);
    mat4.getScaling(propNewScaling, computedTransform);

    // Update the prop internal matrix
    prop.setPosition(...propNewTranslation);
    prop.setScale(...propNewScaling);
    prop.rotateQuaternion(propNewOrientation);
  }

  function releasePickedProp() {
    model.lastOrientation = null;
    model.lastWorldPosition = null;

    if (pickedProp) {
      pickedProp.setDragable(true);
    }

    pickedProp = null;
  }

  publicAPI.onButton3D = (interactorStyle, renderer, state, eventData) => {
    // If the button is not pressed, clear the state
    if (!eventData.pressed) {
      releasePickedProp();
      return macro.VOID;
    }

    const camera = renderer.getActiveCamera();
    camera.getPhysicalToWorldMatrix(physicalToWorldMatrix);

    const { targetPosition, targetOrientation } = eventData;

    // Since targetPosition is in physical coordinates,
    // transform it using the physicalToWorldMatrix to get it in world coordinates
    const targetRayWorldPosition = vec3.transformMat4(
      [],
      [targetPosition.x, targetPosition.y, targetPosition.z],
      physicalToWorldMatrix
    );

    const targetRayWorldDirection = camera.physicalOrientationToWorldDirection([
      targetOrientation.x,
      targetOrientation.y,
      targetOrientation.z,
      targetOrientation.w,
    ]);

    const dist = renderer.getActiveCamera().getClippingRange()[1];
    const rayPoint1 = [...targetRayWorldPosition, 1.0];
    const rayPoint2 = [
      rayPoint1[0] - targetRayWorldDirection[0] * dist,
      rayPoint1[1] - targetRayWorldDirection[1] * dist,
      rayPoint1[2] - targetRayWorldDirection[2] * dist,
      1.0,
    ];

    // Perform picking on the given renderer
    picker.pick3DPoint(rayPoint1, rayPoint2, renderer);
    const props = picker.getActors();

    // If we have picked props, store the first one.
    if (props.length > 0 && props[0].getNestedDragable()) {
      pickedProp = props[0];

      // prevent the prop from being dragged somewhere else
      pickedProp.setDragable(false);
    } else {
      releasePickedProp();
    }

    return macro.EVENT_ABORT;
  };

  // pre-allocation to reduce gc in onMove3D
  const currentTargetRayWorldPosition = new Float64Array(3);
  const currentTargetRayOrientation = new Float64Array(4);

  publicAPI.onMove3D = (interactorStyle, renderer, state, eventData) => {
    // If we are not interacting with any prop, we have nothing to do.
    // Also check for dragable
    if (state !== States.IS_CAMERA_POSE || pickedProp == null) {
      return macro.VOID;
    }

    const camera = renderer.getActiveCamera();
    camera.getPhysicalToWorldMatrix(physicalToWorldMatrix);

    const { targetPosition } = eventData;

    vec3.transformMat4(
      currentTargetRayWorldPosition,
      [targetPosition.x, targetPosition.y, targetPosition.z],
      physicalToWorldMatrix
    );

    // this is a unit quaternion
    vec4.set(
      currentTargetRayOrientation,
      eventData.targetOrientation.x,
      eventData.targetOrientation.y,
      eventData.targetOrientation.z,
      eventData.targetOrientation.w
    );

    if (model.lastWorldPosition && model.lastOrientation) {
      applyPositionAndOrientationToProp(
        pickedProp,
        currentTargetRayWorldPosition,
        currentTargetRayOrientation
      );
    } else {
      // allocate
      model.lastWorldPosition = new Float64Array(3);
      model.lastOrientation = new Float64Array(4);
    }

    vec3.copy(model.lastWorldPosition, currentTargetRayWorldPosition);
    vec4.copy(model.lastOrientation, currentTargetRayOrientation);

    return macro.EVENT_ABORT;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  macro.get(publicAPI, model, ['lastWorldPosition', 'lastOrientation']);
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
