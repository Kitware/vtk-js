import macro from 'vtk.js/Sources/macro';
import vtkWidgetRepresentation from 'vtk.js/Sources/Interaction/Widgets2/WidgetRepresentation';

import { RenderingTypes } from 'vtk.js/Sources/Interaction/Widgets2/WidgetManager/Constants';

// ----------------------------------------------------------------------------
// vtkHandleRepresentation methods
// ----------------------------------------------------------------------------

function vtkHandleRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkHandleRepresentation');

  publicAPI.updateActorVisibility = (
    renderingType,
    widgetVisible,
    ctxVisible,
    handleVisible
  ) => {
    const visibilityFlag =
      widgetVisible &&
      (renderingType === RenderingTypes.PICKING_BUFFER || handleVisible);
    for (let i = 0; i < model.actors.length; i++) {
      model.actors[i].setVisibility(visibilityFlag);
    }
    if (model.allwaysVisibleActors) {
      for (let i = 0; i < model.allwaysVisibleActors.length; i++) {
        model.allwaysVisibleActors[i].setVisibility(true);
      }
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  activeScaleFactor: 1.2,
  activeColor: 1,
  useActiveColor: true,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);
  vtkWidgetRepresentation.extend(publicAPI, model, initialValues);
  macro.setGet(publicAPI, model, [
    'activeScaleFactor',
    'activeColor',
    'useActiveColor',
  ]);

  vtkHandleRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export default { extend };
