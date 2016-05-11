import * as macro from '../../../macro';
import ViewNode from '../../SceneGraph/ViewNode';

// ----------------------------------------------------------------------------
// vtkWebGLActor methods
// ----------------------------------------------------------------------------

export function webGLActor(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGLActor');

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

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  ViewNode.extend(publicAPI, model);

  // Build VTK API
  macro.get(publicAPI, model, ['shaderCache']);

  // Object methods
  webGLActor(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
