import resliceCursorBehavior from 'vtk.js/Sources/Widgets/Widgets3D/ResliceCursorWidget/behavior';
import { InteractionMethodsName } from 'vtk.js/Sources/Widgets/Widgets3D/ResliceCursorWidget/Constants';
import { updateState } from 'vtk.js/Sources/Widgets/Widgets3D/ResliceCursorWidget/helpers';
import { ViewTypes } from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';
import { vec3 } from 'gl-matrix';
// import macro from 'vtk.js/Sources/macros';

export default function widgetBehavior(publicAPI, model) {
  // We inherit resliceCursorBehavior
  resliceCursorBehavior(publicAPI, model);

  const stretchPlaneName = 'Y';
  const crossPlaneName = 'Z';

  publicAPI.getActiveInteraction = () => {
    if (
      model.widgetState
        .getStatesWithLabel(`lineIn${stretchPlaneName}`)
        .includes(model.activeState)
    ) {
      return InteractionMethodsName.TranslateCenterAndUpdatePlanes;
    }
    if (
      model.widgetState
        .getStatesWithLabel(`lineIn${crossPlaneName}`)
        .includes(model.activeState) ||
      model.widgetState
        .getStatesWithLabel(`rotationIn${crossPlaneName}`)
        .includes(model.activeState)
    ) {
      return InteractionMethodsName.RotateLine;
    }
    return null;
  };

  publicAPI[InteractionMethodsName.TranslateCenterAndUpdatePlanes] = (
    calldata
  ) => {
    const manipulator =
      model.activeState?.getManipulator?.() ?? model.manipulator;

    const { worldCoords, worldDirection } = manipulator.handleEvent(
      calldata,
      model._apiSpecificRenderWindow
    );
    publicAPI.updateCenterAndPlanes(worldCoords, worldDirection);
  };

  publicAPI.updateCenterAndPlanes = (worldCoords, worldDirection) => {
    // Update center
    const newBoundedCenter = publicAPI.getBoundedCenter(worldCoords);
    model.widgetState.setCenter(newBoundedCenter);

    // Update planes if axes are given
    if (worldDirection) {
      const getAxis = (idx) =>
        vec3.normalize([], worldDirection.slice(3 * idx, 3 * idx + 3));
      const planes = model.widgetState.getPlanes();
      Object.keys(planes).forEach((viewType) => {
        switch (Number.parseInt(viewType, 10)) {
          case ViewTypes.YZ_PLANE:
            planes[viewType] = {
              normal: getAxis(0),
              viewUp: getAxis(2),
            };
            break;
          case ViewTypes.XZ_PLANE:
            planes[viewType] = {
              normal: getAxis(1),
              viewUp: getAxis(2),
            };
            break;
          case ViewTypes.XY_PLANE:
            planes[viewType] = {
              normal: getAxis(2),
              viewUp: getAxis(1),
            };
            break;
          default:
            break;
        }
      });
    }

    updateState(
      model.widgetState,
      model._factory.getScaleInPixels(),
      model._factory.getRotationHandlePosition()
    );
  };

  publicAPI.translateCenterOnPlaneDirection = (nbSteps) => {
    const handleScroll = model._factory.getManipulator()?.handleScroll;
    if (handleScroll) {
      const { worldCoords, worldDirection } = handleScroll(nbSteps);
      publicAPI.updateCenterAndPlanes(worldCoords, worldDirection);
    }
  };
}
