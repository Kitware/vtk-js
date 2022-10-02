import macro from 'vtk.js/Sources/macros';

const { vtkErrorMacro } = macro;

const PASS_TYPES = ['Build', 'Render'];

// ----------------------------------------------------------------------------
// vtkViewNode methods
// ----------------------------------------------------------------------------

function vtkViewNode(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkViewNode');

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

  publicAPI.getViewNodeFor = (dataObject) => {
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

  // add a missing node/child for the passed in renderables. This should
  // be called only in between prepareNodes and removeUnusedNodes
  publicAPI.addMissingNode = (dobj) => {
    if (!dobj) {
      return;
    }
    const result = model._renderableChildMap.get(dobj);
    // if found just mark as visited
    if (result !== undefined) {
      result.setVisited(true);
    } else {
      // otherwise create a node
      const newNode = publicAPI.createViewNode(dobj);
      if (newNode) {
        newNode.setParent(publicAPI);
        newNode.setVisited(true);
        model._renderableChildMap.set(dobj, newNode);
        model.children.push(newNode);
      }
    }
  };

  // add missing nodes/children for the passed in renderables. This should
  // be called only in between prepareNodes and removeUnusedNodes
  publicAPI.addMissingNodes = (dataObjs) => {
    if (!dataObjs || !dataObjs.length) {
      return;
    }

    for (let index = 0; index < dataObjs.length; ++index) {
      const dobj = dataObjs[index];
      const result = model._renderableChildMap.get(dobj);
      // if found just mark as visited
      if (result !== undefined) {
        result.setVisited(true);
      } else {
        // otherwise create a node
        const newNode = publicAPI.createViewNode(dobj);
        if (newNode) {
          newNode.setParent(publicAPI);
          newNode.setVisited(true);
          model._renderableChildMap.set(dobj, newNode);
          model.children.push(newNode);
        }
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
      }
      child.setVisited(true);
    }
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
    let deleted = null;
    for (let index = 0; index < model.children.length; ++index) {
      const child = model.children[index];
      const visited = child.getVisited();
      if (!visited) {
        const renderable = child.getRenderable();
        if (renderable) {
          model._renderableChildMap.delete(renderable);
        }
        if (!deleted) {
          deleted = [];
        }
        deleted.push(child);
      } else {
        child.setVisited(false);
      }
    }

    if (deleted) {
      // slow does alloc but not as common
      model.children = model.children.filter((el) => !deleted.includes(el));
    }
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
