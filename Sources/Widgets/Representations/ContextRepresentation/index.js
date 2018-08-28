import vtkWidgetRepresentation from 'vtk.js/Sources/Interaction/Widgets2/WidgetRepresentation';
import { Behavior } from 'vtk.js/Sources/Interaction/Widgets2/WidgetRepresentation/Constants';

// ----------------------------------------------------------------------------
// vtkWidgetRepresentation
// ----------------------------------------------------------------------------

function vtkContextRepresentation(publicAPI, model) {
  model.classHierarchy.push('vtkContextRepresentation');
  model.behavior = Behavior.CONTEXT;
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
