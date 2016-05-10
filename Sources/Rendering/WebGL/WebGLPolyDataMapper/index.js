import * as macro from '../../../macro';
import ViewNode from '../../SceneGraph/ViewNode';

const GET_FIELDS = [
  'shaderCache',
];

// ----------------------------------------------------------------------------

export function webGLPolyDataMapper(publicAPI, model) {
  // Builds myself.
  publicAPI.build = (prepass) => {
    if (prepass) {
      if (!model.renderable) {
        return;
      }
    }
  };

  // Renders myself
  publicAPI.render = (prepass) => {
    if (prepass) {
      // draw the polydata
    } else {
      // something
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
  webGLPolyDataMapper(publicAPI, model);

  return Object.freeze(publicAPI);
}

// ----------------------------------------------------------------------------

export default { newInstance };
