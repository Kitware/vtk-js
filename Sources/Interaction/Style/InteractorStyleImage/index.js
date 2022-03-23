import macro from 'vtk.js/Sources/macros';
import vtkInteractorStyleTrackballCamera from 'vtk.js/Sources/Interaction/Style/InteractorStyleTrackballCamera';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import { States } from 'vtk.js/Sources/Rendering/Core/InteractorStyle/Constants';

// ----------------------------------------------------------------------------
// vtkInteractorStyleImage methods
// ----------------------------------------------------------------------------

function vtkInteractorStyleImage(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkInteractorStyleImage');

  // Public API methods
  publicAPI.superHandleMouseMove = publicAPI.handleMouseMove;
  publicAPI.handleMouseMove = (callData) => {
    const pos = callData.position;
    const renderer = callData.pokedRenderer;

    switch (model.state) {
      case States.IS_WINDOW_LEVEL:
        publicAPI.windowLevel(renderer, pos);
        publicAPI.invokeInteractionEvent({ type: 'InteractionEvent' });
        break;

      case States.IS_SLICE:
        publicAPI.slice(renderer, pos);
        publicAPI.invokeInteractionEvent({ type: 'InteractionEvent' });
        break;

      default:
        break;
    }
    publicAPI.superHandleMouseMove(callData);
  };

  //----------------------------------------------------------------------------
  publicAPI.superHandleLeftButtonPress = publicAPI.handleLeftButtonPress;
  publicAPI.handleLeftButtonPress = (callData) => {
    const pos = callData.position;

    if (!callData.shiftKey && !callData.controlKey) {
      model.windowLevelStartPosition[0] = pos.x;
      model.windowLevelStartPosition[1] = pos.y;
      // Get the last (the topmost) image
      publicAPI.setCurrentImageNumber(model.currentImageNumber);
      const property = model.currentImageProperty;
      if (property) {
        model.windowLevelInitial[0] = property.getColorWindow();
        model.windowLevelInitial[1] = property.getColorLevel();
      }
      publicAPI.startWindowLevel();
    } else if (model.interactionMode === 'IMAGE3D' && callData.shiftKey) {
      // If shift is held down, do a rotation
      publicAPI.startRotate();
    } else if (
      model.interactionMode === 'IMAGE_SLICING' &&
      callData.controlKey
    ) {
      // If ctrl is held down in slicing mode, slice the image
      model.lastSlicePosition = pos.y;
      publicAPI.startSlice();
    } else {
      // The rest of the button + key combinations remain the same
      publicAPI.superHandleLeftButtonPress(callData);
    }
  };

  //--------------------------------------------------------------------------
  publicAPI.superHandleLeftButtonRelease = publicAPI.handleLeftButtonRelease;
  publicAPI.handleLeftButtonRelease = () => {
    switch (model.state) {
      case States.IS_WINDOW_LEVEL:
        publicAPI.endWindowLevel();
        break;

      case States.IS_SLICE:
        publicAPI.endSlice();
        break;

      default:
        publicAPI.superHandleLeftButtonRelease();
        break;
    }
  };

  //--------------------------------------------------------------------------
  publicAPI.handleStartMouseWheel = (callData) => {
    publicAPI.startSlice();
    publicAPI.handleMouseWheel(callData);
  };

  //--------------------------------------------------------------------------
  publicAPI.handleEndMouseWheel = () => {
    publicAPI.endSlice();
  };

  //--------------------------------------------------------------------------
  publicAPI.handleMouseWheel = (callData) => {
    const camera = callData.pokedRenderer.getActiveCamera();

    let distance = camera.getDistance();
    distance += callData.spinY;

    // clamp the distance to the clipping range
    const range = camera.getClippingRange();
    if (distance < range[0]) {
      distance = range[0];
    }
    if (distance > range[1]) {
      distance = range[1];
    }
    camera.setDistance(distance);
  };

  //----------------------------------------------------------------------------
  publicAPI.windowLevel = (renderer, position) => {
    model.windowLevelCurrentPosition[0] = position.x;
    model.windowLevelCurrentPosition[1] = position.y;
    const rwi = model._interactor;

    if (model.currentImageProperty) {
      const size = rwi.getView().getViewportSize(renderer);

      const mWindow = model.windowLevelInitial[0];
      const level = model.windowLevelInitial[1];

      // Compute normalized delta
      let dx =
        ((model.windowLevelCurrentPosition[0] -
          model.windowLevelStartPosition[0]) *
          4.0) /
        size[0];
      let dy =
        ((model.windowLevelStartPosition[1] -
          model.windowLevelCurrentPosition[1]) *
          4.0) /
        size[1];

      // Scale by current values
      if (Math.abs(mWindow) > 0.01) {
        dx *= mWindow;
      } else {
        dx *= mWindow < 0 ? -0.01 : 0.01;
      }
      if (Math.abs(level) > 0.01) {
        dy *= level;
      } else {
        dy *= level < 0 ? -0.01 : 0.01;
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
    }
  };

  //----------------------------------------------------------------------------
  publicAPI.slice = (renderer, position) => {
    const rwi = model._interactor;

    const dy = position.y - model.lastSlicePosition;

    const camera = renderer.getActiveCamera();
    const range = camera.getClippingRange();
    let distance = camera.getDistance();

    // scale the interaction by the height of the viewport
    let viewportHeight = 0.0;
    if (camera.getParallelProjection()) {
      viewportHeight = 2.0 * camera.getParallelScale();
    } else {
      const angle = vtkMath.radiansFromDegrees(camera.getViewAngle());
      viewportHeight = 2.0 * distance * Math.tan(0.5 * angle);
    }

    const size = rwi.getView().getViewportSize(renderer);
    const delta = (dy * viewportHeight) / size[1];
    distance += delta;

    // clamp the distance to the clipping range
    if (distance < range[0]) {
      distance = range[0] + viewportHeight * 1e-3;
    }
    if (distance > range[1]) {
      distance = range[1] - viewportHeight * 1e-3;
    }
    camera.setDistance(distance);

    model.lastSlicePosition = position.y;
  };

  //----------------------------------------------------------------------------
  // This is a way of dealing with images as if they were layers.
  // It looks through the renderer's list of props and sets the
  // interactor ivars from the Nth image that it finds.  You can
  // also use negative numbers, i.e. -1 will return the last image,
  // -2 will return the second-to-last image, etc.
  publicAPI.setCurrentImageNumber = (i) => {
    if (i === null) {
      return;
    }

    const renderer = model._interactor.getCurrentRenderer();
    if (!renderer) {
      return;
    }
    model.currentImageNumber = i;

    function propMatch(j, prop, targetIndex) {
      return j === targetIndex && prop.getNestedPickable();
    }

    const props = renderer
      .getViewProps()
      .filter((prop) => prop.isA('vtkImageSlice'));
    let targetIndex = i;
    if (i < 0) {
      targetIndex += props.length;
    }
    const imageProp = props.find((prop, index) =>
      propMatch(index, prop, targetIndex)
    );

    if (imageProp) {
      publicAPI.setCurrentImageProperty(imageProp.getProperty());
    }
  };

  //----------------------------------------------------------------------------
  publicAPI.setCurrentImageProperty = (imageProperty) => {
    model.currentImageProperty = imageProperty;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  windowLevelStartPosition: [0, 0],
  windowLevelCurrentPosition: [0, 0],
  lastSlicePosition: 0,
  windowLevelInitial: [1.0, 0.5],
  // currentImageProperty: null,
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
  vtkInteractorStyleTrackballCamera.extend(publicAPI, model, initialValues);

  // Create get-set macros
  macro.setGet(publicAPI, model, ['interactionMode']);
  macro.get(publicAPI, model, ['currentImageProperty']);

  // For more macro methods, see "Sources/macros.js"

  // Object specific methods
  vtkInteractorStyleImage(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkInteractorStyleImage');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
