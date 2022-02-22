import * as macro from 'vtk.js/Sources/macros';
import vtkViewNode from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';

import { registerOverride } from 'vtk.js/Sources/Rendering/OpenGL/ViewNodeFactory';

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
      model._openGLRenderWindow = publicAPI.getFirstAncestorOfType(
        'vtkOpenGLRenderWindow'
      );
      model.openGLRenderer =
        publicAPI.getFirstAncestorOfType('vtkOpenGLRenderer');
      model.context = model._openGLRenderWindow.getContext();
      publicAPI.prepareNodes();
      publicAPI.addMissingNodes(model.renderable.getTextures());
      publicAPI.addMissingNode(model.renderable.getMapper());
      publicAPI.removeUnusedNodes();

      // we store textures and mapper
      model.ogltextures = null;
      model.activeTextures = null;
      for (let index = 0; index < model.children.length; index++) {
        const child = model.children[index];
        if (child.isA('vtkOpenGLTexture')) {
          if (!model.ogltextures) {
            model.ogltextures = [];
          }
          model.ogltextures.push(child);
        } else {
          model.oglmapper = child;
        }
      }
    }
  };

  publicAPI.queryPass = (prepass, renderPass) => {
    if (prepass) {
      if (!model.renderable || !model.renderable.getVisibility()) {
        return;
      }
      renderPass.incrementOverlayActorCount();
    }
  };

  // we draw textures, then mapper, then post pass textures
  publicAPI.traverseOpaquePass = (renderPass) => {
    if (
      !model.oglmapper ||
      !model.renderable ||
      !model.renderable.getNestedVisibility() ||
      !model.renderable.getIsOpaque() ||
      (model.openGLRenderer.getSelector() &&
        !model.renderable.getNestedPickable())
    ) {
      return;
    }

    publicAPI.apply(renderPass, true);
    model.oglmapper.traverse(renderPass);

    publicAPI.apply(renderPass, false);
  };

  // we draw textures, then mapper, then post pass textures
  publicAPI.traverseTranslucentPass = (renderPass) => {
    if (
      !model.oglmapper ||
      !model.renderable ||
      !model.renderable.getNestedVisibility() ||
      model.renderable.getIsOpaque() ||
      (model.openGLRenderer.getSelector() &&
        !model.renderable.getNestedPickable())
    ) {
      return;
    }

    publicAPI.apply(renderPass, true);
    model.oglmapper.traverse(renderPass);

    publicAPI.apply(renderPass, false);
  };

  publicAPI.traverseOverlayPass = (renderPass) => {
    if (
      !model.oglmapper ||
      !model.renderable ||
      !model.renderable.getNestedVisibility() ||
      (model.openGLRenderer.getSelector() &&
        !model.renderable.getNestedPickable)
    ) {
      return;
    }
    publicAPI.apply(renderPass, true);
    model.oglmapper.traverse(renderPass);

    publicAPI.apply(renderPass, false);
  };

  publicAPI.activateTextures = () => {
    // always traverse textures first, then mapper
    if (!model.ogltextures) {
      return;
    }

    model.activeTextures = [];
    for (let index = 0; index < model.ogltextures.length; index++) {
      const child = model.ogltextures[index];
      child.render();
      if (child.getHandle()) {
        model.activeTextures.push(child);
      }
    }
  };

  // Renders myself
  publicAPI.opaquePass = (prepass, renderPass) => {
    if (prepass) {
      model.context.depthMask(true);
      publicAPI.activateTextures();
    } else if (model.activeTextures) {
      // deactivate textures
      for (let index = 0; index < model.activeTextures.length; index++) {
        model.activeTextures[index].deactivate();
      }
    }
  };

  // Renders myself
  publicAPI.translucentPass = (prepass, renderPass) => {
    if (prepass) {
      model.context.depthMask(false);
      publicAPI.activateTextures();
    } else if (model.activeTextures) {
      for (let index = 0; index < model.activeTextures.length; index++) {
        model.activeTextures[index].deactivate();
      }
    }
  };

  // Renders myself
  publicAPI.overlayPass = (prepass, renderPass) => {
    if (prepass) {
      model.context.depthMask(true);
      publicAPI.activateTextures();
    } else if (model.activeTextures) {
      // deactivate textures
      for (let index = 0; index < model.activeTextures.length; index++) {
        model.activeTextures[index].deactivate();
      }
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  context: null,
  activeTextures: null,
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

// Register ourself to OpenGL backend if imported
registerOverride('vtkActor2D', newInstance);
