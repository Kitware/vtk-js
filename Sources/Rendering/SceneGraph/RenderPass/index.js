import macro from 'vtk.js/Sources/macros';

// ----------------------------------------------------------------------------

function vtkRenderPass(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkRenderPass');

  publicAPI.getOperation = () => model.currentOperation;

  publicAPI.setCurrentOperation = (val) => {
    model.currentOperation = val;
    model.currentTraverseOperation = `traverse${macro.capitalize(
      model.currentOperation
    )}`;
  };

  publicAPI.getTraverseOperation = () => model.currentTraverseOperation;

  // by default this class will traverse all of its
  // preDelegateOperations, then call its delegate render passes
  // the traverse all of its postDelegateOperations
  // any of those three arrays can be empty
  publicAPI.traverse = (viewNode, parent = null) => {
    if (model.deleted) {
      return;
    }

    // we just render our delegates in order
    model.currentParent = parent;

    model.preDelegateOperations.forEach((val) => {
      publicAPI.setCurrentOperation(val);
      viewNode.traverse(publicAPI);
    });
    model.delegates.forEach((val) => {
      val.traverse(viewNode, publicAPI);
    });
    model.postDelegateOperations.forEach((val) => {
      publicAPI.setCurrentOperation(val);
      viewNode.traverse(publicAPI);
    });
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  delegates: [],
  currentOperation: null,
  preDelegateOperations: [],
  postDelegateOperations: [],
  currentParent: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, ['currentOperation']);
  macro.setGet(publicAPI, model, [
    'delegates',
    'currentParent',
    'preDelegateOperations',
    'postDelegateOperations',
  ]);

  // Object methods
  vtkRenderPass(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkRenderPass');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
