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
    if (model.deleted) {
      return;
    }

    // we can choose to do special
    // traversal here based on pass
    const passTraversal = `traverse${macro.capitalize(renderPass.getOperation())}`;
    if (typeof publicAPI[passTraversal] === 'function') {
      publicAPI[passTraversal](renderPass);
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
    if (typeof publicAPI[renderPass.getOperation()] === 'function') {
      publicAPI[renderPass.getOperation()](prepass, renderPass);
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

  publicAPI.addMissingPropNodes = (actorsList) => {
    if (!actorsList || !actorsList.length) {
      return;
    }
    publicAPI.addMissingPropNode(actorsList, publicAPI);
  };

  publicAPI.addMissingPropNode = (dataObjs, parent) => {
    model.preparedNodes = model.preparedNodes.concat(dataObjs);

    // if any dataObj is not a renderable of a child
    // then create child for that dataObj with renderable set to the
    // dataObj
    const childDOs = model.children.map(node => node.getRenderable());

    const newNodes =
      dataObjs
        .filter(node => (node && !node.isDeleted() && childDOs.indexOf(node) === -1))
        .map((node) => {
          const newNode = parent.createViewNode(node);
          if (newNode) {
            newNode.setParent(parent);
            newNode.setRenderable(node);
          }
          const actors = [].concat(node.getActors());
          const childs = actors.filter(actor => actor !== node);
          if (childs.length > 0) {
            newNode.addMissingPropNode(childs, newNode);
          }
          return newNode;
        });
    model.children = model.children.concat(newNodes);
  };

  publicAPI.addMissingNode = (dataObj) => {
    if (dataObj && !dataObj.isDeleted()) {
      publicAPI.addMissingNodes([dataObj]);
    }
  };

  publicAPI.addMissingNodes = (dataObjs) => {
    if (!dataObjs || !dataObjs.length) {
      return;
    }
    model.preparedNodes = model.preparedNodes.concat(dataObjs);

    // if any dataObj is not a renderable of a child
    // then create child for that dataObj with renderable set to the
    // dataObj
    const childDOs = model.children.map(node => node.getRenderable());

    const newNodes =
      dataObjs
        .filter(node => (node && !node.isDeleted() && childDOs.indexOf(node) === -1))
        .map((node) => {
          const newNode = publicAPI.createViewNode(node);
          if (newNode) {
            newNode.setParent(publicAPI);
            newNode.setRenderable(node);
          }
          return newNode;
        });

    model.children = model.children.concat(newNodes);
  };

  publicAPI.prepareNodes = () => {
    model.preparedNodes = [];
  };

  publicAPI.removeUnusedNodes = () => {
    model.children = model.children.filter(node =>
      node.isDeleted() || (model.preparedNodes.indexOf(node.getRenderable()) !== -1));
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
  preparedNodes: [],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.event(publicAPI, model, 'event');
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
