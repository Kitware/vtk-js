import macro from 'vtk.js/Sources/macros';

// ----------------------------------------------------------------------------
// vtkAbstractManipulator methods
// ----------------------------------------------------------------------------

function vtkAbstractManipulator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkAbstractManipulator');

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
