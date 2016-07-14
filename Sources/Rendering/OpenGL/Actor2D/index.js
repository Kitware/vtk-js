import * as macro from '../../../macro';
import vtkViewNode from '../../SceneGraph/ViewNode';

// ----------------------------------------------------------------------------
// vtkOpenGLActor methods
// ----------------------------------------------------------------------------

function vtkOpenGLActor2D(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLActor2D');

  // Builds myself.
  publicAPI.build = (prepass) => {
    if (prepass) {
      if (!model.renderable) {
        return;
      }

      publicAPI.prepareNodes();
      publicAPI.addMissingNodes(model.renderable.getTextures());
      publicAPI.addMissingNode(model.renderable.getMapper());
      publicAPI.removeUnusedNodes();
    }
  };

  // we draw textures, then mapper, then post pass textures
  publicAPI.traverse = operation => {
    publicAPI.apply(operation, true);

    model.activeTextures = [];
    model.children.forEach(child => {
      child.apply(operation, true);
      if (child.isA('vtkOpenGLTexture') && operation === 'Render') {
        model.activeTextures.push(child);
      }
    });

    model.children.forEach(child => {
      child.apply(operation, false);
    });

    publicAPI.apply(operation, false);
  };

  // Renders myself
  publicAPI.render = (prepass) => {
    if (prepass) {
      model.context = publicAPI.getFirstAncestorOfType('vtkOpenGLRenderWindow').getContext();
      publicAPI.preRender();
    } else {
      // deactivate textures
      model.children.forEach(child => {
        if (child.isA('vtkOpenGLTexture')) {
          child.deactivate();
        }
      });
      const opaque = (model.renderable.getIsOpaque() !== 0);
      if (!opaque) {
        model.context.depthMask(true);
      }
    }
  };

  publicAPI.preRender = () => {
    model.context.depthMask(false);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  context: null,
  activeTextures: [],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkViewNode.extend(publicAPI, model);

  // Build VTK API
  macro.setGet(publicAPI, model, [
    'context',
  ]);

  macro.get(publicAPI, model, [
    'activeTextures',
  ]);

  // Object methods
  vtkOpenGLActor2D(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
