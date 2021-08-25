import macro from 'vtk.js/Sources/macros';

import vtkCompositeCameraManipulator from 'vtk.js/Sources/Interaction/Manipulators/CompositeCameraManipulator';
import vtkCompositeGestureManipulator from 'vtk.js/Sources/Interaction/Manipulators/CompositeGestureManipulator';
import vtkInteractorStyleManipulator from 'vtk.js/Sources/Interaction/Style/InteractorStyleManipulator';

// ----------------------------------------------------------------------------
// vtkGestureCameraManipulator methods
// ----------------------------------------------------------------------------

function vtkGestureCameraManipulator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkGestureCameraManipulator');

  //--------------------------------------------------------------------------

  publicAPI.onStartPinch = (interactor, scale) => {
    model.previousScale = scale;
  };

  //---------------------------------------------------------------------------

  publicAPI.onStartRotate = (interactor, rotation) => {
    model.previousRotation = rotation;
  };

  //---------------------------------------------------------------------------

  publicAPI.onStartPan = (interactor, translation) => {
    model.previousTranslation = translation;
  };

  //---------------------------------------------------------------------------

  publicAPI.onPinch = (interactor, renderer, scale) => {
    vtkInteractorStyleManipulator.dollyByFactor(
      interactor,
      renderer,
      scale / model.previousScale
    );
    model.previousScale = scale;
  };

  //---------------------------------------------------------------------------

  publicAPI.onPan = (interactor, renderer, translation) => {
    const camera = renderer.getActiveCamera();
    const style = interactor.getInteractorStyle();

    // Calculate the focal depth since we'll be using it a lot
    let viewFocus = camera.getFocalPoint();

    viewFocus = style.computeWorldToDisplay(
      renderer,
      viewFocus[0],
      viewFocus[1],
      viewFocus[2]
    );
    const focalDepth = viewFocus[2];

    const trans = translation;
    const lastTrans = model.previousTranslation;
    const newPickPoint = style.computeDisplayToWorld(
      renderer,
      viewFocus[0] + trans[0] - lastTrans[0],
      viewFocus[1] + trans[1] - lastTrans[1],
      focalDepth
    );

    // Has to recalc old mouse point since the viewport has moved,
    // so can't move it outside the loop
    const oldPickPoint = style.computeDisplayToWorld(
      renderer,
      viewFocus[0],
      viewFocus[1],
      focalDepth
    );

    // Camera motion is reversed
    const motionVector = [];
    motionVector[0] = oldPickPoint[0] - newPickPoint[0];
    motionVector[1] = oldPickPoint[1] - newPickPoint[1];
    motionVector[2] = oldPickPoint[2] - newPickPoint[2];

    viewFocus = camera.getFocalPoint();
    const viewPoint = camera.getPosition();
    camera.setFocalPoint(
      motionVector[0] + viewFocus[0],
      motionVector[1] + viewFocus[1],
      motionVector[2] + viewFocus[2]
    );

    camera.setPosition(
      motionVector[0] + viewPoint[0],
      motionVector[1] + viewPoint[1],
      motionVector[2] + viewPoint[2]
    );

    if (interactor.getLightFollowCamera()) {
      renderer.updateLightsGeometryToFollowCamera();
    }

    camera.orthogonalizeViewUp();

    model.previousTranslation = translation;
  };

  //---------------------------------------------------------------------------

  publicAPI.onRotate = (interactor, renderer, rotation) => {
    const camera = renderer.getActiveCamera();
    camera.roll(rotation - model.previousRotation);
    camera.orthogonalizeViewUp();
    model.previousRotation = rotation;
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
  vtkCompositeGestureManipulator.extend(publicAPI, model, initialValues);
  vtkCompositeCameraManipulator.extend(publicAPI, model, initialValues);

  // Object specific methods
  vtkGestureCameraManipulator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkGestureCameraManipulator'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
