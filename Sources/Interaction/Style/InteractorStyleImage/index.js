import * as macro from '../../../macro';
import vtkInteractorStyleTrackballCamera from '../InteractorStyleTrackballCamera';
import vtkMath from './../../../Common/Core/Math';
import { States } from '../../../Rendering/Core/InteractorStyle/Constants';

// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------

function vtkInteractorStyleImage(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkInteractorStyleImage');

  //----------------------------------------------------------------------------
  publicAPI.startWindowLevel = () => {
    if (model.state !== States.IS_NONE) {
      return;
    }
    publicAPI.startState(States.IS_WINDOW_LEVEL);

    // Get the last (the topmost) image
    publicAPI.setCurrentImageNumber(model.currentImageNumber);

    if (model.handleObservers &&
        typeof publicAPI.invokeStartWindowLevelEvent === 'function') {
      publicAPI.invokeStartWindowLevelEvent({ type: 'StartWindowLevelEvent', style: publicAPI });
    } else if (model.currentImageProperty) {
      const property = model.currentImageProperty;
      model.windowLevelInitial[0] = property.getColorWindow();
      model.windowLevelInitial[1] = property.getColorLevel();
    }
  };

  //----------------------------------------------------------------------------
  publicAPI.endWindowLevel = () => {
    if (model.state !== States.IS_WINDOW_LEVEL) {
      return;
    }
    if (model.handleObservers &&
        typeof publicAPI.invokeEndWindowLevelEvent === 'function') {
      publicAPI.invokeEndWindowLevelEvent({ type: 'EndWindowLevelEvent', style: publicAPI });
    }
    publicAPI.stopState();
  };

  //----------------------------------------------------------------------------
  publicAPI.startSlice = () => {
    if (model.state !== States.IS_NONE) {
      return;
    }
    publicAPI.startState(States.IS_SLICE);
  };

  //----------------------------------------------------------------------------
  publicAPI.endSlice = () => {
    if (model.state !== States.IS_SLICE) {
      return;
    }
    publicAPI.stopState();
  };

  // Public API methods
  publicAPI.superHandleMouseMove = publicAPI.handleMouseMove;
  publicAPI.handleMouseMove = () => {
    const pos = model.interactor.getEventPosition(model.interactor.getPointerIndex());

    switch (model.state) {
      case States.IS_WINDOW_LEVEL:
        publicAPI.findPokedRenderer(pos.x, pos.y);
        publicAPI.windowLevel();
        publicAPI.invokeInteractionEvent({ type: 'InteractionEvent' });
        break;

      case States.IS_SLICE:
        publicAPI.findPokedRenderer(pos.x, pos.y);
        publicAPI.slice();
        publicAPI.invokeInteractionEvent({ type: 'InteractionEvent' });
        break;

      default:
        break;
    }
    publicAPI.superHandleMouseMove();
  };

  //----------------------------------------------------------------------------
  publicAPI.superHandleLeftButtonPress = publicAPI.handleLeftButtonPress;
  publicAPI.handleLeftButtonPress = () => {
    const pos = model.interactor.getEventPosition(model.interactor.getPointerIndex());
    publicAPI.findPokedRenderer(pos.x, pos.y);
    if (model.currentRenderer === null) {
      return;
    }

    publicAPI.grabFocus(model.eventCallbackCommand);
    if (!model.interactor.getShiftKey() && !model.interactor.getControlKey()) {
      model.windowLevelStartPosition[0] = pos.x;
      model.windowLevelStartPosition[1] = pos.y;
      publicAPI.startWindowLevel();
    } else if (model.interactionMode === 'IMAGE3D' &&
             model.interactor.getShiftKey()) {
      // If shift is held down, do a rotation
      publicAPI.startRotate();
    } else if (model.interactionMode === 'IMAGE_SLICING' &&
             model.interactor.getControlKey()) {
      // If ctrl is held down in slicing mode, slice the image
      publicAPI.startSlice();
    } else {
      // The rest of the button + key combinations remain the same
      publicAPI.superHandleLeftButtonPress();
    }
  };

  //--------------------------------------------------------------------------
  publicAPI.superHandleLeftButtonRelease = publicAPI.handleLeftButtonRelease;
  publicAPI.handleLeftButtonRelease = () => {
    switch (model.state) {
      case States.IS_WINDOW_LEVEL:
        publicAPI.endWindowLevel();
        if (model.interactor) {
          publicAPI.releaseFocus();
        }
        break;

      case States.IS_SLICE:
        publicAPI.endSlice();
        if (model.interactor) {
          publicAPI.releaseFocus();
        }
        break;

      default:
        break;
    }
    publicAPI.superHandleLeftButtonRelease();
  };

  //----------------------------------------------------------------------------
  publicAPI.windowLevel = () => {
    const pos = model.interactor.getEventPosition(model.interactor.getPointerIndex());

    model.windowLevelCurrentPosition[0] = pos.x;
    model.windowLevelCurrentPosition[1] = pos.y;
    const rwi = model.interactor;

    if (model.handleObservers &&
        typeof publicAPI.invokeWindowLevelEvent === 'function') {
      publicAPI.invokeWindowLevelEvent({ type: 'WindowLevelEvent', style: publicAPI });
    } else if (model.currentImageProperty) {
      const size = rwi.getView().getViewportSize(model.currentRenderer);

      const mWindow = model.windowLevelInitial[0];
      const level = model.windowLevelInitial[1];

      // Compute normalized delta
      let dx = (model.windowLevelCurrentPosition[0] -
                   model.windowLevelStartPosition[0]) * 4.0 / size[0];
      let dy = (model.windowLevelStartPosition[1] -
                   model.windowLevelCurrentPosition[1]) * 4.0 / size[1];

      // Scale by current values
      if (Math.abs(mWindow) > 0.01) {
        dx *= mWindow;
      } else {
        dx *= (mWindow < 0 ? -0.01 : 0.01);
      }
      if (Math.abs(level) > 0.01) {
        dy *= level;
      } else {
        dy *= (level < 0 ? -0.01 : 0.01);
      }

      // Abs so that direction does not flip
      if (mWindow < 0.0) {
        dx *= -1;
      }
      if (level < 0.0) {
        dy *= -1;
      }

      // Compute new mWindow level
      let newWindow = dx + mWindow;
      const newLevel = level - dy;

      if (newWindow < 0.01) {
        newWindow = 0.01;
      }

      model.currentImageProperty.setColorWindow(newWindow);
      model.currentImageProperty.setColorLevel(newLevel);

      rwi.render();
    }
  };

  //----------------------------------------------------------------------------
  publicAPI.slice = () => {
    if (model.currentRenderer === null) {
      return;
    }

    const rwi = model.interactor;

    const lastPtr = model.interactor.getPointerIndex();
    const pos = model.interactor.getEventPosition(lastPtr);
    const lastPos = model.interactor.getLastEventPosition(lastPtr);

    const dy = pos.y - lastPos.y;

    const camera = model.currentRenderer.getActiveCamera();
    const range = camera.getClippingRange();
    let distance = camera.getDistance();

    // scale the interaction by the height of the viewport
    let viewportHeight = 0.0;
    if (camera.getParallelProjection()) {
      viewportHeight = camera.getParallelScale();
    } else {
      const angle = vtkMath.radiansFromDegrees(camera.getViewAngle());
      viewportHeight = 2.0 * distance * Math.tan(0.5 * angle);
    }

    const size = rwi.getView().getViewportSize(model.currentRenderer);
    const delta = dy * viewportHeight / size[1];
    distance += delta;

    // clamp the distance to the clipping range
    if (distance < range[0]) {
      distance = range[0] + (viewportHeight * 1e-3);
    }
    if (distance > range[1]) {
      distance = range[1] - (viewportHeight * 1e-3);
    }
    camera.setDistance(distance);

    rwi.render();
  };


  //----------------------------------------------------------------------------
  // This is a way of dealing with images as if they were layers.
  // It looks through the renderer's list of props and sets the
  // interactor ivars from the Nth image that it finds.  You can
  // also use negative numbers, i.e. -1 will return the last image,
  // -2 will return the second-to-last image, etc.
  publicAPI.setCurrentImageNumber = (i) => {
    model.currentImageNumber = i;

    if (!model.currentRenderer) {
      return;
    }

    function propMatch(j, prop, targetIndex) {
      if (prop.isA('vtkImageSlice') &&
        j === targetIndex && prop.getPickable()) {
        return true;
      }
      return false;
    }

    const props = model.currentRenderer.getViewProps();
    let targetIndex = i;
    if (i < 0) {
      targetIndex += props.length;
    }
    let imageProp = null;
    let foundImageProp = false;
    for (let j = 0; j < props.length && !foundImageProp; j++) {
      if (propMatch(j, props[j], targetIndex)) {
        foundImageProp = true;
        imageProp = props[j];
      }
    }

    if (imageProp) {
      model.currentImageProperty = imageProp.getProperty();
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  motionFactor: 10.0,
  windowLevelStartPosition: [0, 0],
  windowLevelCurrentPosition: [0, 0],
  windowLevelInitial: [1.0, 0.5],
  currentImageProperty: 0,
  currentImageNumber: -1,
  interactionMode: 'IMAGE2D',
  xViewRightVector: [0, 1, 0],
  xViewUpVector: [0, 0, -1],
  yViewRightVector: [1, 0, 0],
  yViewUpVector: [0, 0, -1],
  zViewRightVector: [1, 0, 0],
  zViewUpVector: [0, 1, 0],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkInteractorStyleTrackballCamera.extend(publicAPI, model);

  // Create get-set macros
  macro.setGet(publicAPI, model, ['motionFactor']);

  // For more macro methods, see "Sources/macro.js"

  // Object specific methods
  vtkInteractorStyleImage(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend });
