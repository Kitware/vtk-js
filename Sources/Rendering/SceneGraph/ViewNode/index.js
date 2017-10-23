import macro from 'vtk.js/Sources/macro';

const { vtkErrorMacro } = macro;

export const PASS_TYPES = ['Build', 'Render'];

// ----------------------------------------------------------------------------
// vtkViewNode methods
// ----------------------------------------------------------------------------

function vtkViewNode(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkViewNode');

  // Builds myself.
  publicAPI.build = (prepass) => {
  };

  // Renders myself
  publicAPI.render = (prepass) => {
  };

  publicAPI.traverse = (renderPass) => {
    // we can choose to do special
    // traversal here based on pass
    const passTraversal = `traverse${macro.capitalize(renderPass.getOperation())}`;
    const fn = publicAPI[passTraversal];
    if (fn) {
      fn(renderPass);
      return;
    }

    // default traversal
    publicAPI.apply(renderPass, true);

    publicAPI.getChildren().forEach((child) => {
      child.traverse(renderPass);
    });

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

    return model.children.find((child) => {
      const vn = child.getViewNodeFor(dataObject);
      return !!vn;
    });
  };

  publicAPI.getFirstAncestorOfType = (type) => {
    if (!model.parent) {
      return null;
    }
    if (model.parent.isA(type)) {
      return model.parent;
    }
    return model.parent.getFirstAncestorOfType(type);
  };

  publicAPI.addMissingNode = (dataObj) => {
    if (dataObj) {
      publicAPI.addMissingNodes([dataObj]);
    }
  };

  publicAPI.addMissingNodes = (dataObjs) => {
    if (!dataObjs || !dataObjs.length) {
      return;
    }

    dataObjs.forEach((dobj) => {
      const result = model.renderableChildMap.get(dobj);
      // if found just mark as visited
      if (result !== undefined) {
        result.setVisited(true);
      } else { // otherwise create a node
        const newNode = publicAPI.createViewNode(dobj);
        if (newNode) {
          newNode.setParent(publicAPI);
          // newNode.setRenderable(dobj);
          newNode.setVisited(true);
          model.renderableChildMap.set(dobj, newNode);
          model.children.push(newNode);
        }
      }
    });
  };

  publicAPI.prepareNodes = () => {
    model.children.forEach(child => (child.setVisited(false)));
  };

  publicAPI.setVisited = (val) => {
    model.visited = val;
  };

  publicAPI.removeUnusedNodes = () => {
    if (!model.children.every(node => node.getVisited())) {
      model.children = model.children.filter((node) => {
        const visited = node.getVisited();
        if (!visited) {
          const renderable = node.getRenderable();
          if (renderable) {
            model.renderableChildMap.delete(renderable);
          }
        }
        return visited;
      });
    }
    publicAPI.prepareNodes();
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
  parent: null,
  renderable: null,
  myFactory: null,
  children: [],
  visited: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.event(publicAPI, model, 'event');

  model.renderableChildMap = new Map();

  macro.get(publicAPI, model, [
    'visited',
  ]);
  macro.setGet(publicAPI, model, [
    'parent',
    'renderable',
    'myFactory',
  ]);
  macro.getArray(publicAPI, model, ['children']);

  // Object methods
  vtkViewNode(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkViewNode');

// ----------------------------------------------------------------------------

export default { newInstance, extend, PASS_TYPES };
