import * as macro from '../../../macro';

// ----------------------------------------------------------------------------

export const types = ['Build', 'Render'];

const SET_GET_FIELDS = [
  'parent',
  'renderable',
  'myFactory',
];

const GET_ARRAY_ONLY = ['children'];


// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------

export function viewNode(publicAPI, model) {
  // Builds myself.
  publicAPI.build = (prepass) => {
  };

  // Renders myself
  publicAPI.render = (prepass) => {
  };

  publicAPI.getViewNodeFor = (dataObject) => {
    if (model.renderable === dataObject) {
      return model;
    }

    model.children.find(child => {
      const vn = child.getViewNodeFor(dataObject);
      if (vn) {
        return vn;
      }
      return null;
    });
    return null;
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

  publicAPI.traverse = (operation) => {
    publicAPI.apply(operation, true);

    model.children.forEach(child => {
      child.traverse(operation);
    });

    publicAPI.apply(operation, false);
  };


  publicAPI.traverseAllPasses = () => {
    publicAPI.traverse('Build');
    publicAPI.traverse('Render');
  };

  publicAPI.apply = (operation, prepass) => {
    switch (operation) {
      case 'Build':
        publicAPI.build(prepass);
        break;
      case 'Render':
        publicAPI.render(prepass);
        break;
      default:
        console.log(`UNKNOWN OPERATION  ${operation}`);
    }
  };

  publicAPI.addMissingNode = (dataObj) => {
    publicAPI.addMissingNodes([dataObj]);
  };

  publicAPI.addMissingNodes = (dataObjs) => {
    model.preparedNodes.add(dataObjs);

    model.children.concat(dataObjs.filter(node => {
      if (model.children.indexOf(node) === -1) {
        const newNode = publicAPI.createViewNode(node);
        if (newNode) {
          newNode.setParent(model);
        }
        return newNode;
      }
      return null;
    }));
  };

  publicAPI.prepareNodes = () => {
    model.preparedNodes = [];
  };

  publicAPI.removeUnusedNodes = () => {
    model.children.filter(node => {
      if (model.preparedNodes.indexOf(node.getRenderable()) !== -1) {
        return true;
      }
      return false;
    });
    publicAPI.prepareNodes();
  };

  publicAPI.createViewNode = (dataObj) => {
    if (!model.myFactory) {
      console.log('Can not create view nodes without my own factory');
      return null;
    }
    const ret = model.myFactory.createNode(dataObj);
    if (ret) {
      ret.renderable = dataObj;
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

function newInstance(initialValues = {}) {
  const model = Object.assign({}, DEFAULT_VALUES, initialValues);
  const publicAPI = {};

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, SET_GET_FIELDS);
  macro.getArray(publicAPI, model, GET_ARRAY_ONLY);

  // Object methods
  viewNode(publicAPI, model);

  return Object.freeze(publicAPI);
}

// ----------------------------------------------------------------------------

export default { newInstance, viewNode, DEFAULT_VALUES };
