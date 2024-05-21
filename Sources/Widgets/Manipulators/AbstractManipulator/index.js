import macro from 'vtk.js/Sources/macros';
import { subtract } from 'vtk.js/Sources/Common/Core/Math';

// ----------------------------------------------------------------------------
// vtkAbstractManipulator methods
// ----------------------------------------------------------------------------

function vtkAbstractManipulator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkAbstractManipulator');

  model._prevWorldCoords = [];

  publicAPI.getOrigin = (callData) => {
    if (model.userOrigin) return model.userOrigin;
    if (model.useCameraFocalPoint)
      return callData.pokedRenderer.getActiveCamera().getFocalPoint();
    if (model.handleOrigin) return model.handleOrigin;
    if (model.widgetOrigin) return model.widgetOrigin;
    return [0, 0, 0];
  };

  publicAPI.getNormal = (callData) => {
    if (model.userNormal) return model.userNormal;
    if (model.useCameraNormal)
      return callData.pokedRenderer
        .getActiveCamera()
        .getDirectionOfProjection();
    if (model.handleNormal) return model.handleNormal;
    if (model.widgetNormal) return model.widgetNormal;
    return [0, 0, 1];
  };

  model._computeDeltaFromPrevCoords = (curWorldCoords) => {
    if (!model._prevWorldCoords?.length || !curWorldCoords?.length)
      return [0, 0, 0];
    return subtract(curWorldCoords, model._prevWorldCoords, []);
  };

  model._addWorldDeltas = (manipulatorResults) => {
    const { worldCoords: curWorldCoords } = manipulatorResults;
    const worldDelta = model._computeDeltaFromPrevCoords(curWorldCoords);
    if (curWorldCoords) model._prevWorldCoords = curWorldCoords;

    const deltas = {
      worldDelta,
    };

    return {
      ...manipulatorResults,
      ...deltas,
    };
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  // userOrigin: null,
  // handleOrigin: null,
  // widgetOrigin: null,
  // userNormal: null,
  // handleNormal: null,
  // widgetNormal: null
  useCameraFocalPoint: false,
  useCameraNormal: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, ['useCameraFocalPoint', 'useCameraNormal']);
  macro.setGetArray(
    publicAPI,
    model,
    [
      'userOrigin',
      'handleOrigin',
      'widgetOrigin',
      'userNormal',
      'handleNormal',
      'widgetNormal',
    ],
    3
  );

  vtkAbstractManipulator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkAbstractManipulator');

// ----------------------------------------------------------------------------

export default { extend, newInstance };
