import { quat, vec3 } from 'gl-matrix';
import macro from 'vtk.js/Sources/macros';
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';
import vtkPlaneManipulator from 'vtk.js/Sources/Widgets/Manipulators/PlaneManipulator';
import vtkLineManipulator from 'vtk.js/Sources/Widgets/Manipulators/LineManipulator';

export default function widgetBehavior(publicAPI, model) {
  let isDragging = false;

  model.rotationManipulator = vtkPlaneManipulator.newInstance();
  model.lineManipulator = vtkLineManipulator.newInstance();

  const rotateState = {
    startQuat: quat.create(),
    dragStartVec: [0, 0, 0],
  };
  const scaleState = {
    startDistFromOrigin: 0,
    startScale: 1,
  };
  const translateState = {
    startPos: 0,
    dragStartCoord: [0, 0, 0],
  };

  publicAPI.getBounds = () => [...vtkBoundingBox.INIT_BOUNDS];

  publicAPI.setDisplayCallback = (callback) =>
    model.representations[0].setDisplayCallback(callback);

  publicAPI.handleLeftButtonPress = (callData) => {
    if (
      !model.activeState ||
      !model.activeState.getActive() ||
      !model.pickable
    ) {
      return macro.VOID;
    }

    const [type, axis] = model.activeState.getName().split(':');
    const axisIndex = 'XYZ'.indexOf(axis);
    if (type === 'translate') {
      publicAPI.handleTranslateStartEvent(callData, axis, axisIndex);
    } else if (type === 'scale') {
      publicAPI.handleScaleStartEvent(callData, axis, axisIndex);
    } else if (type === 'rotate') {
      publicAPI.handleRotateStartEvent(callData, axis, axisIndex);
    }

    model._interactor.requestAnimation(publicAPI);
    return macro.EVENT_ABORT;
  };

  publicAPI.handleTranslateStartEvent = (callData, axis, axisIndex) => {
    model.lineManipulator.setHandleOrigin(model.activeState.getOrigin());
    model.lineManipulator.setHandleNormal(model.activeState.getDirection());

    const { worldCoords } = model.lineManipulator.handleEvent(
      callData,
      model._apiSpecificRenderWindow
    );

    if (worldCoords.length) {
      isDragging = true;
      translateState.dragStartCoord = worldCoords;
      translateState.startPos = model.widgetState
        .getTransform()
        .getTranslation()[axisIndex];
    }
  };

  publicAPI.handleScaleStartEvent = (callData, axis, axisIndex) => {
    model.lineManipulator.setHandleOrigin(model.activeState.getOrigin());
    model.lineManipulator.setHandleNormal(model.activeState.getDirection());

    const { worldCoords } = model.lineManipulator.handleEvent(
      callData,
      model._apiSpecificRenderWindow
    );

    if (worldCoords.length) {
      isDragging = true;
      scaleState.startScale = model.widgetState.getTransform().getScale()[
        axisIndex
      ];
      scaleState.startDistFromOrigin =
        vec3.dist(worldCoords, model.activeState.getOrigin()) || 0.0001;
    }
  };

  publicAPI.handleRotateStartEvent = (callData, axis) => {
    model.rotationManipulator.setHandleOrigin(model.activeState.getOrigin());
    model.rotationManipulator.setHandleNormal(model.activeState.getDirection());

    // compute unit vector from center of rotation
    // to the click point on the plane defined by
    // the center of rotation and the rotation normal.
    const { worldCoords } = model.rotationManipulator.handleEvent(
      callData,
      model._apiSpecificRenderWindow
    );

    if (worldCoords.length) {
      isDragging = true;
      vec3.sub(
        rotateState.dragStartVec,
        worldCoords,
        model.activeState.getOrigin()
      );
      vec3.normalize(rotateState.dragStartVec, rotateState.dragStartVec);

      rotateState.startQuat = model.widgetState.getTransform().getRotation();
    }
  };

  publicAPI.handleMouseMove = (callData) => {
    if (isDragging && model.pickable) {
      return publicAPI.handleEvent(callData);
    }
    return macro.VOID;
  };

  publicAPI.handleLeftButtonRelease = () => {
    if (isDragging && model.pickable) {
      model._interactor.cancelAnimation(publicAPI);
    }
    isDragging = false;
    model.widgetState.deactivate();
  };

  publicAPI.handleEvent = (callData) => {
    if (model.pickable && model.activeState && model.activeState.getActive()) {
      const [type, axis] = model.activeState.getName().split(':');
      const axisIndex = 'XYZ'.indexOf(axis);
      if (type === 'translate') {
        return publicAPI.handleTranslateEvent(callData, axis, axisIndex);
      }
      if (type === 'scale') {
        return publicAPI.handleScaleEvent(callData, axis, axisIndex);
      }
      if (type === 'rotate') {
        return publicAPI.handleRotateEvent(callData, axis, axisIndex);
      }
    }
    return macro.VOID;
  };

  publicAPI.handleTranslateEvent = (callData, axis, axisIndex) => {
    model.lineManipulator.setHandleOrigin(model.activeState.getOrigin());
    model.lineManipulator.setHandleNormal(model.activeState.getDirection());

    const { worldCoords } = model.lineManipulator.handleEvent(
      callData,
      model._apiSpecificRenderWindow
    );

    if (worldCoords.length) {
      const positiveDir = [0, 0, 0];
      positiveDir[axisIndex] = 1;

      const toWorldCoords = [0, 0, 0];
      vec3.sub(toWorldCoords, worldCoords, translateState.dragStartCoord);

      const dir = Math.sign(vec3.dot(positiveDir, toWorldCoords));
      const dist = vec3.len(toWorldCoords);
      const delta = dir * dist;

      const translation = model.widgetState.getTransform().getTranslation();
      translation[axisIndex] = translateState.startPos + delta;
      model.widgetState.getTransform().setTranslation(translation);
    }
  };

  publicAPI.handleScaleEvent = (callData, axis, axisIndex) => {
    model.lineManipulator.setHandleOrigin(model.activeState.getOrigin());
    model.lineManipulator.setHandleNormal(model.activeState.getDirection());

    const { worldCoords } = model.lineManipulator.handleEvent(
      callData,
      model._apiSpecificRenderWindow
    );

    if (worldCoords.length) {
      const dist = vec3.dist(model.activeState.getOrigin(), worldCoords);
      const scale =
        (dist / scaleState.startDistFromOrigin) * scaleState.startScale;

      const scales = model.widgetState.getTransform().getScale();
      scales[axisIndex] = scale;
      model.widgetState.getTransform().setScale(scales);
    }
  };

  publicAPI.handleRotateEvent = (callData) => {
    model.rotationManipulator.setHandleOrigin(model.activeState.getOrigin());
    model.rotationManipulator.setHandleNormal(model.activeState.getDirection());

    const { worldCoords } = model.rotationManipulator.handleEvent(
      callData,
      model._apiSpecificRenderWindow
    );

    const curPointerVec = [0, 0, 0];
    if (worldCoords.length) {
      vec3.sub(curPointerVec, worldCoords, model.activeState.getOrigin());
      vec3.normalize(curPointerVec, curPointerVec);

      const angle = vec3.angle(rotateState.dragStartVec, curPointerVec);

      const signVec = [0, 0, 0];
      vec3.cross(signVec, curPointerVec, rotateState.dragStartVec);
      vec3.normalize(signVec, signVec);
      const sign = vec3.dot(signVec, model.activeState.getDirection());

      const q = quat.create();
      quat.setAxisAngle(q, model.activeState.getDirection(), -sign * angle);

      quat.mul(q, q, rotateState.startQuat);
      quat.normalize(q, q);

      // do not amplify fp errors when editing a particular direction
      const direction = model.activeState.getDirection();
      model.widgetState.getTransform().setRotation(q);
      model.activeState.setDirection(direction);
    }

    return macro.EVENT_ABORT;
  };

  // --------------------------------------------------------------------------
  // initialization
  // --------------------------------------------------------------------------

  model.camera = model._renderer.getActiveCamera();

  model.classHierarchy.push('vtkTransformControlsWidgetProp');
}
