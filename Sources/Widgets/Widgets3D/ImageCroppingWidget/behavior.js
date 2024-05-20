import macro from 'vtk.js/Sources/macros';

import {
  AXES,
  transformVec3,
  handleTypeFromName,
  calculateDirection,
  calculateCropperCenter,
} from 'vtk.js/Sources/Widgets/Widgets3D/ImageCroppingWidget/helpers';

export default function widgetBehavior(publicAPI, model) {
  model._isDragging = false;

  publicAPI.setDisplayCallback = (callback) =>
    model.representations[0].setDisplayCallback(callback);

  publicAPI.handleLeftButtonPress = () => {
    if (
      !model.activeState ||
      !model.activeState.getActive() ||
      !model.pickable
    ) {
      return macro.VOID;
    }
    if (model.dragable) {
      model._isDragging = true;
      model._apiSpecificRenderWindow.setCursor('grabbing');
      model._interactor.requestAnimation(publicAPI);
    }
    return macro.EVENT_ABORT;
  };

  publicAPI.handleMouseMove = (callData) => {
    if (model._isDragging) {
      return publicAPI.handleEvent(callData);
    }
    return macro.VOID;
  };

  publicAPI.handleLeftButtonRelease = () => {
    if (
      !model.activeState ||
      !model.activeState.getActive() ||
      !model.pickable
    ) {
      return macro.VOID;
    }

    if (model._isDragging) {
      model._isDragging = false;
      model._interactor.cancelAnimation(publicAPI);
      model.widgetState.deactivate();
    }

    return macro.EVENT_ABORT;
  };

  publicAPI.handleEvent = (callData) => {
    if (model.pickable && model.activeState && model.activeState.getActive()) {
      const manipulator = model.activeState.getManipulator();
      if (manipulator) {
        const name = model.activeState.getName();
        const type = handleTypeFromName(name);
        const index = name.split('').map((l) => AXES.indexOf(l));
        const planes = model.widgetState.getCroppingPlanes().getPlanes();
        const indexToWorldT = model.widgetState.getIndexToWorldT();

        let worldCoords = [];

        if (type === 'corners') {
          // manipulator should be a plane manipulator
          worldCoords = manipulator.handleEvent(
            callData,
            model._apiSpecificRenderWindow
          ).worldCoords;
        }

        if (type === 'faces') {
          // get center of current crop box
          const worldCenter = calculateCropperCenter(planes, indexToWorldT);

          manipulator.setHandleOrigin(worldCenter);
          manipulator.setHandleNormal(
            calculateDirection(model.activeState.getOrigin(), worldCenter)
          );
          worldCoords = manipulator.handleEvent(
            callData,
            model._apiSpecificRenderWindow
          ).worldCoords;
        }

        if (type === 'edges') {
          // constrain to a plane with a normal parallel to the edge
          const edgeAxis = index.map((a) => (a === 1 ? a : 0));
          const faceName = edgeAxis.map((i) => AXES[i + 1]).join('');
          const handle = model.widgetState.getStatesWithLabel(faceName)[0];
          // get center of current crop box
          const worldCenter = calculateCropperCenter(planes, indexToWorldT);

          manipulator.setHandleNormal(
            calculateDirection(handle.getOrigin(), worldCenter)
          );
          worldCoords = manipulator.handleEvent(
            callData,
            model._apiSpecificRenderWindow
          ).worldCoords;
        }

        if (worldCoords.length) {
          // transform worldCoords to indexCoords, and then update the croppingPlanes() state with setPlanes().
          const worldToIndexT = model.widgetState.getWorldToIndexT();
          const indexCoords = transformVec3(worldCoords, worldToIndexT);

          for (let i = 0; i < 3; i++) {
            if (index[i] === 0) {
              planes[i * 2] = indexCoords[i];
            } else if (index[i] === 2) {
              planes[i * 2 + 1] = indexCoords[i];
            }
          }

          model.activeState.setOrigin(...worldCoords);
          model.widgetState.getCroppingPlanes().setPlanes(...planes);

          return macro.EVENT_ABORT;
        }
      }
    }
    return macro.VOID;
  };

  // --------------------------------------------------------------------------
  // initialization
  // --------------------------------------------------------------------------

  model._camera = model._renderer.getActiveCamera();

  model.classHierarchy.push('vtkImageCroppingWidgetProp');
}
