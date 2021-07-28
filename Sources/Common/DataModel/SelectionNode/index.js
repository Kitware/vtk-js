import macro from 'vtk.js/Sources/macros';
import Constants from 'vtk.js/Sources/Common/DataModel/SelectionNode/Constants';

// ----------------------------------------------------------------------------
// vtkSelectionNode methods
// ----------------------------------------------------------------------------

function vtkSelectionNode(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkSelectionNode');

  publicAPI.getBounds = () => model.points.getBounds();
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  contentType: -1,
  fieldType: -1,
  properties: null,
  selectionList: [],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  macro.obj(publicAPI, model);
  model.properties = {};
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

export const newInstance = macro.newInstance(extend, 'vtkSelectionNode');

// ----------------------------------------------------------------------------

export default { newInstance, extend, ...Constants };
