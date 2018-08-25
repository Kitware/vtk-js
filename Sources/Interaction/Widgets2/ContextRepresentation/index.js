import vtkWidgetRepresentation from 'vtk.js/Sources/Interaction/Widgets2/WidgetRepresentation';
import { RenderingTypes } from 'vtk.js/Sources/Interaction/Widgets2/WidgetManager/Constants';

// ----------------------------------------------------------------------------
// vtkWidgetRepresentation
// ----------------------------------------------------------------------------

function vtkContextRepresentation(publicAPI, model) {
  model.classHierarchy.push('vtkContextRepresentation');

  publicAPI.updateActorVisibility = (
    renderingType,
    widgetVisible,
    ctxVisible,
    handleVisible
  ) => {
    const visibilityFlag =
      widgetVisible &&
      renderingType === RenderingTypes.FRONT_BUFFER &&
      ctxVisible;
    for (let i = 0; i < model.actors.length; i++) {
      model.actors[i].setVisibility(visibilityFlag);
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  vtkWidgetRepresentation.extend(publicAPI, model, initialValues);
  vtkContextRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export default { extend };
