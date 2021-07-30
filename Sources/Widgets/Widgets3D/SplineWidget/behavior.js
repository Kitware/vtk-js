import macro from 'vtk.js/Sources/macros';
import { vec3 } from 'gl-matrix';

export default function widgetBehavior(publicAPI, model) {
  model.classHierarchy.push('vtkSplineWidgetProp');

  model.keysDown = {};
  model.moveHandle = model.widgetState.getMoveHandle();

  // --------------------------------------------------------------------------
  // Private methods
  // --------------------------------------------------------------------------

  const updateHandlesSize = () => {
    if (model.handleSizeInPixels != null) {
      const scale =
        model.handleSizeInPixels *
        vec3.distance(
          model.apiSpecificRenderWindow.displayToWorld(0, 0, 0, model.renderer),
          model.apiSpecificRenderWindow.displayToWorld(1, 0, 0, model.renderer)
        );

      model.moveHandle.setScale1(scale);
      model.widgetState.getHandleList().forEach((handle) => {
        handle.setScale1(scale);
      });
    }
  };

  // --------------------------------------------------------------------------

  const addPoint = () => {
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
      model.lastHandle.setVisible(false);
      model.lastHandle.setOrigin(...model.moveHandle.getOrigin());
      model.lastHandle.setColor(model.moveHandle.getColor());
      model.lastHandle.setScale1(model.moveHandle.getScale1());

      if (!model.firstHandle) {
        model.firstHandle = model.lastHandle;
      }

      model.apiSpecificRenderWindow.setCursor('grabbing');
    }
  };

  // --------------------------------------------------------------------------

  const getHoveredHandle = () => {
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
  // Display 2D
  // --------------------------------------------------------------------------

  publicAPI.setDisplayCallback = (callback) =>
    model.representations[0].setDisplayCallback(callback);

  // --------------------------------------------------------------------------
  // Public methods
  // --------------------------------------------------------------------------

  macro.setGet(publicAPI, model, [
    'freehandMinDistance',
    'allowFreehand',
    'resolution',
    'defaultCursor',
    'handleSizeInPixels',
  ]);

  // --------------------------------------------------------------------------

  publicAPI.setHandleSizeInPixels = (size) => {
    model.factory.setHandleSizeInPixels(size);
    updateHandlesSize();
  };
  publicAPI.setHandleSizeInPixels(model.factory.getHandleSizeInPixels()); // set initial value

  // --------------------------------------------------------------------------

  publicAPI.setResolution = (resolution) => {
    model.factory.setResolution(resolution);
    model.representations[1].setResolution(resolution);
  };
  publicAPI.setResolution(model.factory.getResolution()); // set initial value

  // --------------------------------------------------------------------------

  publicAPI.getPoints = () =>
    model.representations[1].getOutputData().getPoints().getData();

  // --------------------------------------------------------------------------

  publicAPI.reset = () => {
    model.widgetState.clearHandleList();

    model.lastHandle = null;
    model.firstHandle = null;
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
      const handle = getHoveredHandle();
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
        addPoint();
      } else {
        const hoveredHandle = getHoveredHandle();
        if (hoveredHandle && !model.keysDown.Control) {
          model.moveHandle.deactivate();
          model.moveHandle.setVisible(false);
          model.activeState = hoveredHandle;
          hoveredHandle.activate();
          model.isDragging = true;
          model.lastHandle.setVisible(true);
        } else {
          addPoint();
        }
      }

      model.freeHand = model.allowFreehand && !model.isDragging;
    } else {
      model.isDragging = true;
      model.apiSpecificRenderWindow.setCursor('grabbing');
      model.interactor.requestAnimation(publicAPI);
      publicAPI.invokeStartInteractionEvent();
    }

    return macro.EVENT_ABORT;
  };

  // --------------------------------------------------------------------------
  // Left release
  // --------------------------------------------------------------------------

  publicAPI.handleLeftButtonRelease = (e) => {
    if (model.isDragging) {
      if (!model.hasFocus) {
        model.apiSpecificRenderWindow.setCursor(model.defaultCursor);
        model.widgetState.deactivate();
        model.interactor.cancelAnimation(publicAPI);
        publicAPI.invokeEndInteractionEvent();
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
            publicAPI.loseFocus();
          }
        }

        model.interactor.render();
      }
    } else if (model.activeState !== model.moveHandle) {
      model.widgetState.deactivate();
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
      !model.pickable ||
      !model.manipulator
    ) {
      return macro.VOID;
    }
    model.manipulator.setNormal(model.camera.getDirectionOfProjection());

    const worldCoords = model.manipulator.handleEvent(
      callData,
      model.apiSpecificRenderWindow
    );

    const hoveredHandle = getHoveredHandle();
    if (hoveredHandle) {
      model.moveHandle.setVisible(false);
      if (hoveredHandle !== model.firstHandle) {
        model.apiSpecificRenderWindow.setCursor('grabbing');
      }
    } else if (!model.isDragging && model.hasFocus) {
      model.moveHandle.setVisible(true);
      model.apiSpecificRenderWindow.setCursor(model.defaultCursor);
    }

    if (model.lastHandle) {
      model.lastHandle.setVisible(true);
    }

    if (
      worldCoords.length &&
      (model.isDragging || model.activeState === model.moveHandle)
    ) {
      model.activeState.setOrigin(worldCoords);
      if (model.isDragging) {
        model.draggedPoint = true;
      }
      if (model.freeHand && model.activeState === model.moveHandle) {
        addPoint();
      }
    }

    return model.hasFocus ? macro.EVENT_ABORT : macro.VOID;
  };

  // --------------------------------------------------------------------------
  // Mofifier keys
  // --------------------------------------------------------------------------

  publicAPI.handleKeyDown = ({ key }) => {
    model.keysDown[key] = true;

    if (!model.hasFocus) {
      return;
    }

    if (key === 'Enter') {
      if (model.widgetState.getHandleList().length > 0) {
        publicAPI.loseFocus();
      }
    } else if (key === 'Escape') {
      publicAPI.reset();
      publicAPI.loseFocus();
    } else if (key === 'Delete' || key === 'Backspace') {
      if (model.lastHandle) {
        model.widgetState.removeHandle(model.lastHandle);

        const handleList = model.widgetState.getHandleList();
        model.lastHandle = handleList[handleList.length - 1];
      }
    }
  };

  // --------------------------------------------------------------------------

  publicAPI.handleKeyUp = ({ key }) => {
    model.keysDown[key] = false;
  };

  // --------------------------------------------------------------------------
  // Focus API - modeHandle follow mouse when widget has focus
  // --------------------------------------------------------------------------

  publicAPI.grabFocus = () => {
    if (!model.hasFocus) {
      model.activeState = model.moveHandle;
      model.activeState.activate();
      model.activeState.setVisible(true);
      model.interactor.requestAnimation(publicAPI);
      publicAPI.invokeStartInteractionEvent();
      updateHandlesSize();
    }

    model.hasFocus = true;
  };

  // --------------------------------------------------------------------------

  publicAPI.loseFocus = () => {
    if (model.hasFocus) {
      model.interactor.cancelAnimation(publicAPI);
      publicAPI.invokeEndInteractionEvent();
    }

    model.widgetState.deactivate();
    model.moveHandle.deactivate();
    model.moveHandle.setVisible(false);
    model.activeState = null;
    model.interactor.render();

    model.hasFocus = false;
  };
}
