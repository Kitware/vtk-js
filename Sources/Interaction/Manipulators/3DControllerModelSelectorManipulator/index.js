import macro from 'vtk.js/Sources/macros';
import vtkCompositeVRManipulator from 'vtk.js/Sources/Interaction/Manipulators/CompositeVRManipulator';
import {
  Device,
  Input,
} from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor/Constants';
import { vec3, mat4, quat } from 'gl-matrix';

// ----------------------------------------------------------------------------
// vtk3DControllerModelSelectorManipulator methods
// ----------------------------------------------------------------------------

function vtk3DControllerModelSelectorManipulator(publicAPI, model) {
  model.classHierarchy.push('vtk3DControllerModelSelectorManipulator');

  // The current prop we are manipulating, if any.
  let pickedProp;

  function positionProp(prop, worldPosition, orientation) {
    const translation = vec3.subtract(
      [],
      worldPosition,
      model.lastWorldPosition
    );

    const lastOrientationConjugated = quat.conjugate([], model.lastOrientation);

    const newOrientation = quat.multiply(
      [],
      orientation,
      lastOrientationConjugated
    );
    quat.normalize(newOrientation, newOrientation);

    const newOrientationAxis = [];
    const newOrientationAngle = quat.getAxisAngle(
      newOrientationAxis,
      newOrientation
    );

    // lookup the prop internal matrix
    const matrix = [...mat4.transpose([], prop.getMatrix())];

    // compute our transform
    const transform = mat4.create();
    mat4.translate(transform, transform, worldPosition);
    mat4.rotate(transform, transform, newOrientationAngle, newOrientationAxis);
    mat4.translate(transform, transform, vec3.negate([], worldPosition));
    mat4.translate(transform, transform, translation);

    // multiply our transform by the prop internal matrix
    mat4.multiply(transform, transform, matrix);

    // Multiply the transform with the current prop orientation to get the delta
    // that we have to apply to the prop
    const matRotation = mat4.getRotation([], transform);
    const propCurrentOrientation = prop.getOrientationQuaternion();
    const propCurrentOrientationConjugated = quat.conjugate(
      [],
      propCurrentOrientation
    );
    const propNewOrientation = quat.multiply(
      [],
      propCurrentOrientationConjugated,
      matRotation
    );

    quat.normalize(propNewOrientation, propNewOrientation);

    const matTranslation = mat4.getTranslation([], transform);
    const matScaling = mat4.getScaling([], transform);

    // Update the prop internal matrix
    prop.setPosition(...matTranslation);
    prop.setScale(...matScaling);
    prop.rotateQuaternion(propNewOrientation);
  }

  publicAPI.onButton3D = (
    _interactorStyle,
    renderer,
    _state,
    _device,
    _input,
    pressed,
    targetPosition,
    targetOrientation
  ) => {
    // If the button is not pressed, clear the state
    if (!pressed) {
      model.lastOrientation = null;
      model.lastWorldPosition = null;
      pickedProp = null;
      return;
    }

    const camera = renderer.getActiveCamera();
    const physicalToWorldMatrix = [];
    camera.getPhysicalToWorldMatrix(physicalToWorldMatrix);

    // Since the targetPosition we get is in physical coordinates,
    // transform it using the physicalToWorldMatrix to get it in woorld coordinates
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
    model.picker.pick3DPoint(rayPoint1, rayPoint2, renderer);
    const props = model.picker.getActors();

    // If we have picked props, store the first one.
    if (props.length > 0) {
      pickedProp = props[0];
    }
  };

  publicAPI.onMove3D = (_interactorStyle, renderer, _state, eventData) => {
    // If we are not interacting with any prop, we have nothing to do.
    if (pickedProp == null) {
      return;
    }

    const camera = renderer.getActiveCamera();
    const physicalToWorldMatrix = [];
    camera.getPhysicalToWorldMatrix(physicalToWorldMatrix);

    const { targetPosition } = eventData;

    const targetRayWorldPosition = vec3.transformMat4(
      [],
      [targetPosition.x, targetPosition.y, targetPosition.z],
      physicalToWorldMatrix
    );

    // this is a unit quaternion
    const targetRayOrientation = quat.fromValues(
      eventData.targetOrientation.x,
      eventData.targetOrientation.y,
      eventData.targetOrientation.z,
      eventData.targetOrientation.w
    );

    if (model.lastWorldPosition && model.lastOrientation) {
      positionProp(pickedProp, targetRayWorldPosition, targetRayOrientation);
    }

    model.lastWorldPosition = [...targetRayWorldPosition];
    model.lastOrientation = [...targetRayOrientation];
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
