import { mat3, mat4 } from 'gl-matrix';

import macro       from 'vtk.js/Sources/macro';
import vtkViewNode from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';

// ----------------------------------------------------------------------------
// vtkOpenGLActor methods
// ----------------------------------------------------------------------------

function vtkOpenGLActor(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLActor');

  // Builds myself.
  publicAPI.buildPass = (prepass) => {
    if (prepass) {
      model.context = publicAPI.getFirstAncestorOfType('vtkOpenGLRenderWindow').getContext();
      publicAPI.prepareNodes();
      publicAPI.addMissingNodes(model.renderable.getTextures(true));
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

  publicAPI.traverseOpaqueZBufferPass = (renderPass) => {
    publicAPI.traverseOpaquePass(renderPass);
  };

  // we draw textures, then mapper, then post pass textures
  publicAPI.traverseOpaquePass = (renderPass) => {
    if (!model.renderable ||
        !model.renderable.getVisibility() ||
        !model.renderable.getIsOpaque()) {
      return;
    }

    publicAPI.apply(renderPass, true);

    model.oglmapper.traverse(renderPass);

    publicAPI.apply(renderPass, false);
  };

  // we draw textures, then mapper, then post pass textures
  publicAPI.traverseTranslucentPass = (renderPass) => {
    if (!model.renderable ||
        !model.renderable.getVisibility() ||
        model.renderable.getIsOpaque()) {
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

  publicAPI.queryPass = (prepass, renderPass) => {
    if (prepass) {
      if (!model.renderable ||
          !model.renderable.getVisibility()) {
        return;
      }
      if (model.renderable.getIsOpaque()) {
        renderPass.incrementOpaqueActorCount();
      } else {
        renderPass.incrementTranslucentActorCount();
      }
    }
  };

  publicAPI.opaqueZBufferPass = (prepass, renderPass) => publicAPI.opaquePass(prepass, renderPass);

  publicAPI.opaquePass = (prepass, renderPass) => {
    if (prepass) {
      model.context.depthMask(true);
      publicAPI.activateTextures();
    } else if (model.activeTextures) {
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
      model.context.depthMask(true);
    } else {
      model.context.depthMask(true);
    }
  };

  publicAPI.getKeyMatrices = () => {
    // has the actor changed?
    if (model.renderable.getMTime() > model.keyMatrixTime.getMTime()) {
      model.renderable.computeMatrix();
      mat4.copy(model.MCWCMatrix, model.renderable.getMatrix());
      mat4.transpose(model.MCWCMatrix, model.MCWCMatrix);

      if (model.renderable.getIsIdentity()) {
        mat3.identity(model.normalMatrix);
      } else {
        mat3.fromMat4(model.normalMatrix, model.MCWCMatrix);
        mat3.invert(model.normalMatrix, model.normalMatrix);
      }
      model.keyMatrixTime.modified();
    }

    return { mcwc: model.MCWCMatrix, normalMatrix: model.normalMatrix };
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  context: null,
  keyMatrixTime: null,
  normalMatrix: null,
  MCWCMatrix: null,
  activeTextures: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkViewNode.extend(publicAPI, model, initialValues);

  model.keyMatrixTime = {};
  macro.obj(model.keyMatrixTime, { mtime: 0 });
  model.normalMatrix = mat3.create();
  model.MCWCMatrix = mat4.create();

  // Build VTK API
  macro.setGet(publicAPI, model, [
    'context',
  ]);

  macro.get(publicAPI, model, [
    'activeTextures',
  ]);

  // Object methods
  vtkOpenGLActor(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
