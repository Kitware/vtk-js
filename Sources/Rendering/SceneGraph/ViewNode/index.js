import macro from 'vtk.js/Sources/macros';

const { vtkErrorMacro } = macro;

const PASS_TYPES = ['Build', 'Render'];

// ----------------------------------------------------------------------------
// vtkViewNode methods
// ----------------------------------------------------------------------------

function vtkViewNode(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkViewNode');

  /**
   * Puts child right after the run of children that addMissingNodes keeps in
   * order, model.children[run.start, run.end), and extends the run over it.
   * A child already in the run is listed twice and stays where it is.
   * @param {*} run the start and end of the run, updated in place
   * @param {*} child the child to add to the run
   */
  function appendToRun(run, child) {
    const { children } = model;
    if (run.end === undefined) {
      // The first child starts the run wherever it is
      run.start = children.lastIndexOf(child);
      run.end = run.start + 1;
      return;
    }
    if (children[run.end] === child) {
      run.end++;
      return;
    }
    // The child is usually just after the run, so look there first
    let from = children.indexOf(child, run.end + 1);
    if (from < 0) {
      from = children.indexOf(child);
    }
    if (from >= run.start && from < run.end) {
      // Listed twice: it keeps its first place
      return;
    }
    if (run.end >= children.length) {
      // Nothing follows the run, so the child comes from before it: closing
      // its slot shifts the run down by one, and the child goes on the end.
      children.splice(from, 1);
      children.push(child);
      run.start--;
      return;
    }
    children[from] = children[run.end];
    children[run.end] = child;
    run.end++;
  }

  // Builds myself.
  publicAPI.build = (prepass) => {};

  // Renders myself
  publicAPI.render = (prepass) => {};

  publicAPI.traverse = (renderPass) => {
    // we can choose to do special
    // traversal here based on pass
    const passTraversal = renderPass.getTraverseOperation();
    const fn = publicAPI[passTraversal];
    if (fn) {
      fn(renderPass);
      return;
    }

    // default traversal
    publicAPI.apply(renderPass, true);

    for (let index = 0; index < model.children.length; index++) {
      model.children[index].traverse(renderPass);
    }

    publicAPI.apply(renderPass, false);
  };

  publicAPI.apply = (renderPass, prepass) => {
    const customRenderPass = publicAPI[renderPass.getOperation()];
    if (customRenderPass) {
      customRenderPass(prepass, renderPass);
    }
  };

  publicAPI.getViewNodeFor = (dataObject, hint = null) => {
    if (hint && hint.renderable === dataObject) {
      return hint;
    }

    if (model.renderable === dataObject) {
      return publicAPI;
    }

    for (let index = 0; index < model.children.length; ++index) {
      const child = model.children[index];
      const vn = child.getViewNodeFor(dataObject);
      if (vn) {
        return vn;
      }
    }
    return undefined;
  };

  publicAPI.getFirstAncestorOfType = (type) => {
    if (!model._parent) {
      return null;
    }
    if (model._parent.isA(type)) {
      return model._parent;
    }
    return model._parent.getFirstAncestorOfType(type);
  };

  publicAPI.getLastAncestorOfType = (type) => {
    if (!model._parent) {
      return null;
    }
    const lastAncestor = model._parent.getLastAncestorOfType(type);
    if (lastAncestor) {
      return lastAncestor;
    }
    if (model._parent.isA(type)) {
      return model._parent;
    }
    return null;
  };

  // add a missing node/child for the passed in renderables. This should
  // be called only in between prepareNodes and removeUnusedNodes
  publicAPI.addMissingNode = (dobj) => {
    if (!dobj) {
      return undefined;
    }

    // if found just mark as visited
    const result = model._renderableChildMap.get(dobj);
    if (result !== undefined) {
      result.setVisited(true);
      return result;
    }

    // otherwise create a node
    const newNode = publicAPI.createViewNode(dobj);
    if (newNode) {
      newNode.setParent(publicAPI);
      newNode.setVisited(true);
      model._renderableChildMap.set(dobj, newNode);
      model.children.push(newNode);
      return newNode;
    }

    return undefined;
  };

  // add missing nodes/children for the passed in renderables. This should
  // be called only in between prepareNodes and removeUnusedNodes
  publicAPI.addMissingNodes = (dataObjs, enforceOrder = false) => {
    if (!dataObjs || !dataObjs.length) {
      return;
    }

    const run = {};
    for (let index = 0; index < dataObjs.length; ++index) {
      const dobj = dataObjs[index];
      const node = publicAPI.addMissingNode(dobj);
      if (enforceOrder && node !== undefined) {
        appendToRun(run, node);
      }
    }
  };

  // ability to add children that have no renderable use in the same manner
  // as addMissingNodes This case is when a normal viewnode wants to
  // delegate passes to a helper or child that doeasn't map to a clear
  // renderable or any renderable
  publicAPI.addMissingChildren = (children) => {
    if (!children || !children.length) {
      return;
    }

    for (let index = 0; index < children.length; ++index) {
      const child = children[index];
      const cindex = model.children.indexOf(child);
      if (cindex === -1) {
        child.setParent(publicAPI);
        model.children.push(child);
        const childRenderable = child.getRenderable();
        if (childRenderable) {
          model._renderableChildMap.set(childRenderable, child);
        }
      }
      child.setVisited(true);
    }
  };

  publicAPI.removeNode = (child) => {
    const childIdx = model.children.findIndex((x) => x === child);
    if (childIdx < 0) {
      return false;
    }
    const renderable = child.getRenderable();
    if (renderable) {
      model._renderableChildMap.delete(renderable);
    }
    child.delete();
    model.children.splice(childIdx, 1);
    return true;
  };

  publicAPI.prepareNodes = () => {
    for (let index = 0; index < model.children.length; ++index) {
      model.children[index].setVisited(false);
    }
  };

  publicAPI.setVisited = (val) => {
    model.visited = val;
  };

  publicAPI.removeUnusedNodes = () => {
    let visitedCount = 0;
    for (let index = 0; index < model.children.length; ++index) {
      const child = model.children[index];
      const visited = child.getVisited();
      if (visited) {
        model.children[visitedCount++] = child;
        child.setVisited(false);
      } else {
        const renderable = child.getRenderable();
        if (renderable) {
          model._renderableChildMap.delete(renderable);
        }
        child.delete();
      }
    }

    model.children.length = visitedCount;
  };

  publicAPI.createViewNode = (dataObj) => {
    if (!model.myFactory) {
      vtkErrorMacro('Cannot create view nodes without my own factory');
      return null;
    }
    const ret = model.myFactory.createNode(dataObj);
    if (ret) {
      ret.setRenderable(dataObj);
    }
    return ret;
  };

  const parentDelete = publicAPI.delete;
  publicAPI.delete = () => {
    for (let i = 0; i < model.children.length; i++) {
      model.children[i].delete();
    }
    parentDelete();
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  // _parent: null,
  renderable: null,
  myFactory: null,
  children: [],
  visited: false,
};

// ----------------------------------------------------------------------------

function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.event(publicAPI, model, 'event');

  model._renderableChildMap = new Map();

  macro.get(publicAPI, model, ['visited']);
  macro.setGet(publicAPI, model, ['_parent', 'renderable', 'myFactory']);
  macro.getArray(publicAPI, model, ['children']);
  macro.moveToProtected(publicAPI, model, ['parent']);

  // Object methods
  vtkViewNode(publicAPI, model);
}

// ----------------------------------------------------------------------------

const newInstance = macro.newInstance(extend, 'vtkViewNode');

// ----------------------------------------------------------------------------

export default { newInstance, extend, PASS_TYPES };
