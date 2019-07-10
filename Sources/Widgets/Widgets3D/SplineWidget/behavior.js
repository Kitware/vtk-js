import macro from 'vtk.js/Sources/macro';
import { vec3 } from 'gl-matrix';

export default function widgetBehavior(publicAPI, model) {
  model.classHierarchy.push('vtkSplineWidgetProp');

  // --------------------------------------------------------------------------
  // Display 2D
  // --------------------------------------------------------------------------

  publicAPI.setDisplayCallback = (callback) =>
    model.representations[0].setDisplayCallback(callback);

  // --------------------------------------------------------------------------
  // Public methods
  // --------------------------------------------------------------------------

  publicAPI.getPoints = () =>
    model.representations[1]
      .getOutputData()
      .getPoints()
      .getData();

  // --------------------------------------------------------------------------

  publicAPI.reset = () => {
    model.widgetState.clearHandleList();

    model.lastHandle = null;
  };

  // --------------------------------------------------------------------------

  publicAPI.setFreehandMinDistance = (distance) => {
    model.freehandMinDistance = distance;
  };

  // --------------------------------------------------------------------------
  // Private methods
  // --------------------------------------------------------------------------

  publicAPI.addPoint = () => {
    // Commit handle to location
    if (
      !model.lastHandle ||
      !model.freeHand ||
      vec3.squaredDistance(
        model.moveHandle.getOrigin(),
        model.lastHandle.getOrigin()
      ) >
        model.freehandMinDistance * model.freehandMinDistance
    ) {
      model.lastHandle = model.widgetState.addHandle();
      model.lastHandle.setOrigin(...model.moveHandle.getOrigin());
      model.lastHandle.setColor(model.moveHandle.getColor());
      model.lastHandle.setScale1(model.moveHandle.getScale1());
    }
  };

  // --------------------------------------------------------------------------

  publicAPI.removePoint = (origin) => {
    const handles = model.widgetState.getHandleList();
    handles.forEach((handle) => {
      if (
        handle !== model.moveHandle &&
        vec3.squaredDistance(origin, handle.getOrigin()) <
          model.freehandMinDistance * model.freehandMinDistance
      ) {
        model.widgetState.removeHandle(handle);
      }
    });
  };

  // --------------------------------------------------------------------------

  publicAPI.updateResolution = () => {
    if (
      (model.keysDown[model.renderPoly.key] &&
        model.renderPoly.status === 'down') ||
      (!model.keysDown[model.renderPoly.key] &&
        model.renderPoly.status === 'up')
    ) {
      model.representations[1].setResolution(1);
    } else {
      model.representations[1].setResolution(model.resolution);
    }
  };

  // --------------------------------------------------------------------------
  // Right click: Delete handle
  // --------------------------------------------------------------------------

  publicAPI.handleRightButtonPress = (e) => {
    if (
      !model.activeState ||
      !model.activeState.getActive() ||
      !model.pickable
    ) {
      return macro.VOID;
    }

    if (model.activeState !== model.moveHandle) {
      model.interactor.requestAnimation(publicAPI);
      model.activeState.deactivate();
      model.widgetState.removeHandle(model.activeState);
      model.activeState = null;
      model.interactor.cancelAnimation(publicAPI);
    } else {
      const origin = model.moveHandle.getOrigin();
      publicAPI.removePoint(origin);
    }

    publicAPI.invokeInteractionEvent();

    return macro.EVENT_ABORT;
  };

  // --------------------------------------------------------------------------
  // Left press: Add new point
  // --------------------------------------------------------------------------

  publicAPI.handleLeftButtonPress = (e) => {
    if (
      !model.activeState ||
      !model.activeState.getActive() ||
      !model.pickable
    ) {
      return macro.VOID;
    }

    if (model.activeState === model.moveHandle) {
      if (model.widgetState.getHandleList().length === 0) {
        publicAPI.invokeStartInteractionEvent();
        publicAPI.addPoint();
      } else if (
        vec3.squaredDistance(
          model.moveHandle.getOrigin(),
          model.lastHandle.getOrigin()
        ) < model.moveHandle.getScale1()
      ) {
        publicAPI.invokeEndInteractionEvent();
        model.interactor.render();
      } else {
        publicAPI.addPoint();
      }

      model.freeHand = model.allowFreehand;
    } else {
      model.isDragging = true;
      model.openGLRenderWindow.setCursor('grabbing');
      model.interactor.requestAnimation(publicAPI);
    }

    return macro.EVENT_ABORT;
  };

  // --------------------------------------------------------------------------
  // Left release
  // --------------------------------------------------------------------------

  publicAPI.handleLeftButtonRelease = (e) => {
    if (model.isDragging) {
      model.openGLRenderWindow.setCursor('pointer');
      model.widgetState.deactivate();
      model.interactor.cancelAnimation(publicAPI);
    } else if (model.activeState !== model.moveHandle) {
      model.widgetState.deactivate();
    }

    if (
      (model.hasFocus && !model.activeState) ||
      (model.activeState && !model.activeState.getActive())
    ) {
      model.widgetManager.enablePicking();
      model.interactor.render();
    }

    model.freeHand = false;
    model.isDragging = false;

    return model.hasFocus ? macro.EVENT_ABORT : macro.VOID;
  };

  // --------------------------------------------------------------------------
  // Mouse move: Drag selected handle / Handle follow the mouse
  // --------------------------------------------------------------------------

  publicAPI.handleMouseMove = (callData) => {
    if (
      !model.activeState ||
      !model.activeState.getActive() ||
      !model.pickable
    ) {
      return macro.VOID;
    }

    const worldCoords = model.manipulator.handleEvent(
      callData,
      model.openGLRenderWindow
    );

    model.manipulator.setOrigin(worldCoords);
    model.manipulator.setNormal(model.camera.getDirectionOfProjection());

    if (model.lastHandle) {
      model.lastHandle.setVisible(true);
    }

    if (model.isDragging || model.activeState === model.moveHandle) {
      model.activeState.setOrigin(worldCoords);
      if (model.freeHand) {
        publicAPI.addPoint();
      }
    } else if (model.hasFocus) {
      model.widgetManager.disablePicking();
    }

    return model.hasFocus ? macro.EVENT_ABORT : macro.VOID;
  };

  // --------------------------------------------------------------------------
  // Mofifier keys
  // --------------------------------------------------------------------------

  publicAPI.handleKeyDown = ({ key }) => {
    model.keysDown[key] = true;
    publicAPI.updateResolution();

    if (model.hasFocus) {
      if (key === 'Escape') {
        if (model.lastHandle) {
          model.lastHandle.setVisible(true);
        }
        publicAPI.loseFocus();
      } else if (key === 'Delete' || key === 'Backspace') {
        if (model.lastHandle) {
          model.widgetState.removeHandle(model.lastHandle);

          const handleList = model.widgetState.getHandleList();
          model.lastHandle = handleList[handleList.length - 1];
        }
      }
    }
  };

  // --------------------------------------------------------------------------

  publicAPI.handleKeyUp = ({ key }) => {
    model.keysDown[key] = false;
    publicAPI.updateResolution();
  };

  // --------------------------------------------------------------------------
  // Focus API - modeHandle follow mouse when widget has focus
  // --------------------------------------------------------------------------

  publicAPI.grabFocus = () => {
    if (!model.hasFocus) {
      model.moveHandle.activate();
      model.moveHandle.setVisible(true);
      model.activeState = model.moveHandle;
      model.interactor.requestAnimation(publicAPI);
      publicAPI.updateResolution();
    }

    model.hasFocus = true;
  };

  // --------------------------------------------------------------------------

  publicAPI.loseFocus = () => {
    if (model.hasFocus) {
      model.interactor.cancelAnimation(publicAPI);
    }

    model.widgetState.deactivate();
    model.moveHandle.deactivate();
    model.moveHandle.setVisible(false);
    model.activeState = null;
    model.interactor.render();
    model.widgetManager.enablePicking();

    model.hasFocus = false;
  };
}
