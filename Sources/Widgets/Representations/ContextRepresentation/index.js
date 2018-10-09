import vtkWidgetRepresentation from 'vtk.js/Sources/Widgets/Representations/WidgetRepresentation';
import { Behavior } from 'vtk.js/Sources/Widgets/Representations/WidgetRepresentation/Constants';

// ----------------------------------------------------------------------------
// vtkWidgetRepresentation
// ----------------------------------------------------------------------------

function vtkContextRepresentation(publicAPI, model) {
  model.classHierarchy.push('vtkContextRepresentation');
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  behavior: Behavior.CONTEXT,
  pickable: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  const newDefault = Object.assign({}, DEFAULT_VALUES, initialValues);
  vtkWidgetRepresentation.extend(publicAPI, model, newDefault);
  vtkContextRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export default { extend };
