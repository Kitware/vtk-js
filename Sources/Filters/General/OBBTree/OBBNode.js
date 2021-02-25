import macro from 'vtk.js/Sources/macro';

// ----------------------------------------------------------------------------
// vtkOBBNode methods
// ----------------------------------------------------------------------------

function vtkOBBNode(publicAPI, model) {
  // Set our classname
  model.classHierarchy.push('vtkOBBNode');
}

// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  model.corner = [0, 0, 0]; // center point of this node
  model.axes = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ]; // the axes defining the OBB - ordered from long->short
  model.parent = null; // parent node; nullptr if root
  model.kids = null; // two children of this node; nullptr if leaf
  model.cells = []; // list of cells in node

  // Build VTK API
  macro.setGet(publicAPI, model, ['parent', 'cells', 'kids']);

  macro.setGetArray(publicAPI, model, ['corner', 'axes'], 3);

  // Make this a VTK object
  macro.obj(publicAPI, model);

  // Object specific methods
  vtkOBBNode(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkOBBNode');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
