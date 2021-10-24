import macro from 'vtk.js/Sources/macros';

// ----------------------------------------------------------------------------
// vtkOBBNode methods
// ----------------------------------------------------------------------------

function vtkOBBNode(publicAPI, model) {
  // Set our classname
  model.classHierarchy.push('vtkOBBNode');

  /**
   * Copy a vtkOBBNode into an other one
   * @param {vtkOBBNode} nodeSource
   * @param {vtkOBBNode} nodeTarget
   */
  publicAPI.deepCopy = (nodeSource) => {
    publicAPI.setCorner(nodeSource.getCorner());
    const axes = nodeSource.getAxes();
    publicAPI.setAxes([[...axes[0]], [...axes[1]], [...axes[2]]]);
    publicAPI.setCells([...nodeSource.getCells()]);

    if (nodeSource.getKids()) {
      const kids0 = vtkOBBNode.newInstance();
      kids0.setParent(publicAPI);
      const kids1 = vtkOBBNode.newInstance();
      kids1.setParent(publicAPI);

      kids0.deepCopy(nodeSource.getKids()[0]);
      kids1.deepCopy(nodeSource.getKids()[1], kids1);

      publicAPI.setKids(kids0, kids1);
    }
  };

  publicAPI.getAxis = (axis) => model.axes[axis];
}

// ----------------------------------------------------------------------------

function defaultValues(initialValues) {
  return {
    corner: [0, 0, 0], // center point of this node
    axes: [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ], // the axes defining the OBB - ordered from long->short
    cells: [], // list of cells in node
    // parent: null, null if root
    // kids: null, two children of this node; null if leaf
    ...initialValues,
  };
}

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, defaultValues(initialValues));

  model.corner = [0, 0, 0];
  model.axes = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  model.parent = null; // parent node; null if root
  model.kids = null; // two children of this node; nullptr if leaf
  model.cells = []; // list of cells in node

  // Build VTK API
  macro.setGet(publicAPI, model, ['parent', 'cells', 'kids']);
  // macro.setGetArray(publicAPI, model, ['kids'], 2);
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
