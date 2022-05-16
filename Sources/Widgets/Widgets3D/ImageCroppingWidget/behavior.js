import macro from 'vtk.js/Sources/macros';

import {
  AXES,
  transformVec3,
  rotateVec3,
  handleTypeFromName,
} from 'vtk.js/Sources/Widgets/Widgets3D/ImageCroppingWidget/helpers';

export default function widgetBehavior(publicAPI, model) {
  let isDragging = null;

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
    isDragging = true;
    model._interactor.requestAnimation(publicAPI);
    return macro.EVENT_ABORT;
  };

  publicAPI.handleMouseMove = (callData) => {
    if (isDragging && model.pickable && model.dragable) {
      return publicAPI.handleEvent(callData);
    }
    return macro.VOID;
  };

  publicAPI.handleLeftButtonRelease = () => {
    if (isDragging && model.pickable) {
      isDragging = false;
      model._interactor.cancelAnimation(publicAPI);
      model.widgetState.deactivate();
    }
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
          );
        }

        if (type === 'faces') {
          // constraint axis is line defined by the index and center point.
          // Since our index point is defined inside a box [0, 2, 0, 2, 0, 2],
          // center point is [1, 1, 1].
          const constraintAxis = [1 - index[0], 1 - index[1], 1 - index[2]];

          // get center of current crop box
          const center = [
            (planes[0] + planes[1]) / 2,
            (planes[2] + planes[3]) / 2,
            (planes[4] + planes[5]) / 2,
          ];

          // manipulator should be a line manipulator
          manipulator.setHandleOrigin(transformVec3(center, indexToWorldT));
          manipulator.setHandleNormal(
            rotateVec3(constraintAxis, indexToWorldT)
          );
          worldCoords = manipulator.handleEvent(
            callData,
            model._apiSpecificRenderWindow
          );
        }

        if (type === 'edges') {
          // constrain to a plane with a normal parallel to the edge
          const edgeAxis = index.map((a) => (a === 1 ? a : 0));

          manipulator.setHandleNormal(rotateVec3(edgeAxis, indexToWorldT));
          worldCoords = manipulator.handleEvent(
            callData,
            model._apiSpecificRenderWindow
          );
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
