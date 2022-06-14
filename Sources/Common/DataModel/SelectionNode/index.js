import macro from 'vtk.js/Sources/macros';
import Constants from 'vtk.js/Sources/Common/DataModel/SelectionNode/Constants';

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

function defaultValues(initialValues) {
  return {
    contentType: -1,
    fieldType: -1,
    selectionList: [],
    ...initialValues,
  };
}

// ----------------------------------------------------------------------------
// vtkSelectionNode methods
// ----------------------------------------------------------------------------

function vtkSelectionNode(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkSelectionNode');

  publicAPI.getBounds = () => model.points.getBounds();
}

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(initialValues, defaultValues(initialValues));

  // Inheritance
  macro.obj(publicAPI, model);
  initialValues.properties = {};
  macro.setGet(publicAPI, model, [
    'contentType',
    'fieldType',
    'properties',
    'selectionList',
  ]);

  // Object specific methods
  vtkSelectionNode(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkSelectionNode', true);

// ----------------------------------------------------------------------------

export default { newInstance, extend, ...Constants };
