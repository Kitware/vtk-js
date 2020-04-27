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
    model.representations[1].getOutputData().getPoints().getData();

  // --------------------------------------------------------------------------

  publicAPI.sethandleSizeInPixels = (handleSizeInPixels) => {
    model.handleSizeInPixels = handleSizeInPixels;
  };

  // --------------------------------------------------------------------------

  publicAPI.updateHandlesSize = () => {
    if (model.handleSizeInPixels !== null) {
      const scale =
        model.handleSizeInPixels *
        vec3.distance(
          model.openGLRenderWindow.displayToWorld(0, 0, 0, model.renderer),
          model.openGLRenderWindow.displayToWorld(1, 0, 0, model.renderer)
        );

      model.moveHandle.setScale1(scale);
      model.widgetState.getHandleList().forEach((handle) => {
        handle.setScale1(scale);
      });
    }
  };

  // --------------------------------------------------------------------------

  publicAPI.reset = () => {
    model.widgetState.clearHandleList();

    model.lastHandle = null;
    model.firstHandle = null;
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
      model.keysDown.Control ||
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

      if (!model.firstHandle) {
        model.firstHandle = model.lastHandle;
      }

      model.openGLRenderWindow.setCursor('grabbing');
    }
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

  publicAPI.getHoveredHandle = () => {
    const handles = model.widgetState.getHandleList();

    return handles.reduce(
      ({ closestHandle, closestDistance }, handle) => {
        const distance = vec3.squaredDistance(
          model.moveHandle.getOrigin(),
          handle.getOrigin()
        );
        if (handle !== model.moveHandle) {
          return {
            closestHandle: distance < closestDistance ? handle : closestHandle,
            closestDistance:
              distance < closestDistance ? distance : closestDistance,
          };
        }

        return {
          closestHandle,
          closestDistance,
        };
      },
      {
        closestHandle: null,
        closestDistance:
          model.moveHandle.getScale1() * model.moveHandle.getScale1(),
      }
    ).closestHandle;
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
      const handle = publicAPI.getHoveredHandle();
      if (handle) {
        model.widgetState.removeHandle(handle);
      } else if (model.lastHandle) {
        model.widgetState.removeHandle(model.lastHandle);
        const handles = model.widgetState.getHandleList();
        model.lastHandle = handles[handles.length - 1];
      }
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
      } else {
        const hoveredHandle = publicAPI.getHoveredHandle();
        if (hoveredHandle && !model.keysDown.Control) {
          model.moveHandle.deactivate();
          model.moveHandle.setVisible(false);
          model.activeState = hoveredHandle;
          hoveredHandle.activate();
          model.isDragging = true;
          model.lastHandle.setVisible(true);
        } else {
          publicAPI.addPoint();
        }
      }

      model.freeHand = model.allowFreehand && !model.isDragging;
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
      if (!model.hasFocus) {
        model.openGLRenderWindow.setCursor(model.defaultCursor);
        model.widgetState.deactivate();
        model.interactor.cancelAnimation(publicAPI);
      } else {
        model.moveHandle.setOrigin(...model.activeState.getOrigin());
        model.activeState.deactivate();
        model.moveHandle.activate();
        model.activeState = model.moveHandle;

        if (!model.draggedPoint) {
          if (
            vec3.squaredDistance(
              model.moveHandle.getOrigin(),
              model.lastHandle.getOrigin()
            ) <
              model.moveHandle.getScale1() * model.moveHandle.getScale1() ||
            vec3.squaredDistance(
              model.moveHandle.getOrigin(),
              model.firstHandle.getOrigin()
            ) <
              model.moveHandle.getScale1() * model.moveHandle.getScale1()
          ) {
            model.lastHandle.setVisible(true);
            publicAPI.invokeEndInteractionEvent();
          }
        }

        model.interactor.render();
      }
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
    model.draggedPoint = false;

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

    const hoveredHandle = publicAPI.getHoveredHandle();
    if (hoveredHandle) {
      model.moveHandle.setVisible(false);
      model.openGLRenderWindow.setCursor('grabbing');
    } else if (!model.isDragging && model.hasFocus) {
      model.moveHandle.setVisible(true);
      model.openGLRenderWindow.setCursor(model.defaultCursor);
    }

    model.manipulator.setOrigin(worldCoords);
    model.manipulator.setNormal(model.camera.getDirectionOfProjection());

    if (model.lastHandle) {
      model.lastHandle.setVisible(true);
    }

    if (model.isDragging || model.activeState === model.moveHandle) {
      model.activeState.setOrigin(worldCoords);
      if (model.isDragging) {
        model.draggedPoint = true;
      }
      if (model.freeHand && model.activeState === model.moveHandle) {
        publicAPI.addPoint();
      }
    }

    return model.hasFocus ? macro.EVENT_ABORT : macro.VOID;
  };

  // --------------------------------------------------------------------------
  // Mofifier keys
  // --------------------------------------------------------------------------

  publicAPI.handleKeyDown = ({ key }) => {
    model.keysDown[key] = true;
    publicAPI.updateResolution();

    if (key === 'Enter') {
      if (model.widgetState.getHandleList().length > 0) {
        publicAPI.invokeEndInteractionEvent();
        model.interactor.render();
      }
    } else if (model.hasFocus) {
      if (key === 'Escape') {
        publicAPI.reset();
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
      publicAPI.updateHandlesSize();
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
