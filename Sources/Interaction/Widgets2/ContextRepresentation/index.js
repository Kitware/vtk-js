import vtkWidgetRepresentation from 'vtk.js/Sources/Interaction/Widgets2/WidgetRepresentation';

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  vtkWidgetRepresentation.extend(publicAPI, model, initialValues);
  model.classHierarchy.push('vtkContextRepresentation');
}

// ----------------------------------------------------------------------------

export default { extend };
