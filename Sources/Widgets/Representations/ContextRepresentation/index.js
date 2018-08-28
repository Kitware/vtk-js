import vtkWidgetRepresentation from 'vtk.js/Sources/Widgets/Representations/WidgetRepresentation';
import { Behavior } from 'vtk.js/Sources/Widgets/Representations/WidgetRepresentation/Constants';

// ----------------------------------------------------------------------------
// vtkWidgetRepresentation
// ----------------------------------------------------------------------------

function vtkContextRepresentation(publicAPI, model) {
  model.classHierarchy.push('vtkContextRepresentation');
  model.behavior = Behavior.CONTEXT;
  model.pickable = false;
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
