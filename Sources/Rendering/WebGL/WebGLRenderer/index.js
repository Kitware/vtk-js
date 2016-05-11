import * as macro from '../../../macro';
import ViewNode from '../../SceneGraph/ViewNode';

// ----------------------------------------------------------------------------
// vtkWebGLPolyDataMapper methods
// ----------------------------------------------------------------------------

export function webGLRenderer(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGLRenderer');

  // Builds myself.
  publicAPI.build = (prepass) => {
    if (prepass) {
      if (!model.renderable) {
        return;
      }

      publicAPI.prepareNodes();
      publicAPI.addMissingNodes(model.renderble.getActors());
      publicAPI.removeUnusedNodes();
    }
  };


  // Renders myself
  publicAPI.render = (prepass) => {
    if (prepass) {
      // make current
    } else {
      // else
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, initialValues = {}) {
  const model = Object.assign(initialValues, DEFAULT_VALUES);

  // Inheritance
  ViewNode.extend(publicAPI, model);

  // Build VTK API
  macro.get(publicAPI, model, ['shaderCache']);

  // Object methods
  webGLRenderer(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
