import * as macro from '../../../macro';
import vtkViewNode from '../../SceneGraph/ViewNode';

// ----------------------------------------------------------------------------
// vtkOpenGLActor methods
// ----------------------------------------------------------------------------

function vtkOpenGLActor2D(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLActor2D');

  // Builds myself.
  publicAPI.buildPass = (prepass) => {
    if (prepass) {
      if (!model.renderable) {
        return;
      }
      model.openGLRenderer = publicAPI.getFirstAncestorOfType(
        'vtkOpenGLRenderer'
      );
      publicAPI.prepareNodes();
      publicAPI.addMissingNodes(model.renderable.getTextures());
      publicAPI.addMissingNode(model.renderable.getMapper());
      publicAPI.removeUnusedNodes();
    }
  };

  // we draw textures, then mapper, then post pass textures
  publicAPI.traverseOpaquePass = (renderPass) => {
    if (
      !model.renderable ||
      !model.renderable.getVisibility() ||
      !model.renderable.getIsOpaque() ||
      (model.openGLRenderer.getSelector() && !model.renderable.getPickable())
    ) {
      return;
    }

    publicAPI.apply(renderPass, true);
    model.children.forEach((child) => {
      if (!child.isA('vtkOpenGLTexture')) {
        child.traverse(renderPass);
      }
    });
    publicAPI.apply(renderPass, false);
  };

  // we draw textures, then mapper, then post pass textures
  publicAPI.traverseTranslucentPass = (renderPass) => {
    if (
      !model.renderable ||
      !model.renderable.getVisibility() ||
      model.renderable.getIsOpaque() ||
      (model.openGLRenderer.getSelector() && !model.renderable.getPickable())
    ) {
      return;
    }

    publicAPI.apply(renderPass, true);
    model.children.forEach((child) => {
      if (!child.isA('vtkOpenGLTexture')) {
        child.traverse(renderPass);
      }
    });
    publicAPI.apply(renderPass, false);
  };

  publicAPI.activateTextures = () => {
    // always traverse textures first, then mapper
    model.activeTextures = [];
    model.children.forEach((child) => {
      if (child.isA('vtkOpenGLTexture')) {
        child.render();
        if (child.getHandle()) {
          model.activeTextures.push(child);
        }
      }
    });
  };

  // Renders myself
  publicAPI.opaquePass = (prepass, renderPass) => {
    if (prepass) {
      model.context = publicAPI
        .getFirstAncestorOfType('vtkOpenGLRenderWindow')
        .getContext();
      model.context.depthMask(true);
      publicAPI.activateTextures();
    } else {
      // deactivate textures
      model.activeTextures.forEach((child) => {
        child.deactivate();
      });
    }
  };

  // Renders myself
  publicAPI.translucentPass = (prepass, renderPass) => {
    if (prepass) {
      model.context = publicAPI
        .getFirstAncestorOfType('vtkOpenGLRenderWindow')
        .getContext();
      model.context.depthMask(false);
      publicAPI.activateTextures();
    } else {
      // deactivate textures
      model.activeTextures.forEach((child) => {
        child.deactivate();
      });
      model.context.depthMask(true);
    }
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
  vtkViewNode.extend(publicAPI, model, initialValues);

  // Build VTK API
  macro.setGet(publicAPI, model, ['context']);

  macro.get(publicAPI, model, ['activeTextures']);

  // Object methods
  vtkOpenGLActor2D(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
