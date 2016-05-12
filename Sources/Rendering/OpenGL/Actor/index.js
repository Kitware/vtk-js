import * as macro from '../../../macro';
import ViewNode from '../../SceneGraph/ViewNode';

// ----------------------------------------------------------------------------
// vtkOpenGLActor methods
// ----------------------------------------------------------------------------

export function webGLActor(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLActor');

  // Builds myself.
  publicAPI.build = (prepass) => {
    if (prepass) {
      if (!model.renderable) {
        return;
      }

      publicAPI.prepareNodes();
      publicAPI.addMissingNode(model.renderable.getMapper());
      publicAPI.removeUnusedNodes();
    }
  };

  // Renders myself
  publicAPI.render = (prepass) => {
    if (prepass) {
      model.context = publicAPI.getFirstAncestorOfType('vtkOpenGLRenderWindow').getContext();
      publicAPI.preRender();
    } else {
      const opaque = (model.renderable.getIsOpaque() !== 0);
      if (!opaque) {
        model.context.depthMask(true);
      }
    }
  };

  publicAPI.preRender = (prepass) => {
    // get opacity
    const opaque = (model.renderable.getIsOpaque() !== 0);
    if (opaque) {
      model.context.depthMask(true);
    } else {
      model.context.depthMask(false);
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  context: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  ViewNode.extend(publicAPI, model);

  // Build VTK API
  macro.setGet(publicAPI, model, [
    'context',
  ]);

  // Object methods
  webGLActor(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
