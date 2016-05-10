import * as macro from '../../../macro';
import ViewNode from '../../SceneGraph/ViewNode';

const GET_FIELDS = [
  'shaderCache',
];

// ----------------------------------------------------------------------------

export function webGLActor(publicAPI, model) {
  // Builds myself.
  publicAPI.build = (prepass) => {
    if (prepass) {
      if (!model.renderable) {
        return;
      }

      publicAPI.prepareNodes();
      publicAPI.addMissingNode(model.renderble.getMapper());
      publicAPI.removeUnusedNodes();
    }
  };


  // Renders myself
  publicAPI.render = (prepass) => {
    if (prepass) {
      // make current
    } else {
    // post
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
};

// ----------------------------------------------------------------------------

function newInstance(initialValues = {}) {
  const model = Object.assign({}, ViewNode.DEFAULT_VALUES, DEFAULT_VALUES, initialValues);
  const publicAPI = {};

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, GET_FIELDS);

  // Object methods
  ViewNode.viewNode(publicAPI, model);
  webGLActor(publicAPI, model);

  return Object.freeze(publicAPI);
}

// ----------------------------------------------------------------------------

export default { newInstance };
