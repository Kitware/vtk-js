import { mat3, mat4 } from 'gl-matrix';

import macro from 'vtk.js/Sources/macro';
import vtkViewNode from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';

// ----------------------------------------------------------------------------
// vtkWebGPUActor methods
// ----------------------------------------------------------------------------

function vtkWebGPUActor(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUActor');

  // Builds myself.
  publicAPI.buildPass = (prepass) => {
    if (prepass) {
      model.WebGPURenderWindow = publicAPI.getFirstAncestorOfType(
        'vtkWebGPURenderWindow'
      );
      model.WebGPURenderer = publicAPI.getFirstAncestorOfType(
        'vtkWebGPURenderer'
      );
      model.context = model.WebGPURenderWindow.getContext();
      publicAPI.prepareNodes();
      publicAPI.addMissingNodes(model.renderable.getTextures());
      publicAPI.addMissingNode(model.renderable.getMapper());
      publicAPI.removeUnusedNodes();

      // we store textures and mapper
      model.gputextures = null;
      model.activeTextures = null;
      for (let index = 0; index < model.children.length; index++) {
        const child = model.children[index];
        if (child.isA('vtkWebGPUTexture')) {
          if (!model.gputextures) {
            model.gputextures = [];
          }
          model.gputextures.push(child);
        } else {
          model.gpumapper = child;
        }
      }
    }
  };

  // we draw textures, then mapper, then post pass textures
  publicAPI.traverseOpaquePass = (renderPass) => {
    if (
      !model.renderable ||
      !model.renderable.getVisibility() ||
      !model.renderable.getIsOpaque() ||
      (model.WebGPURenderer.getSelector() && !model.renderable.getPickable())
    ) {
      return;
    }

    publicAPI.apply(renderPass, true);

    if (model.gpumapper) {
      model.gpumapper.traverse(renderPass);
    }

    publicAPI.apply(renderPass, false);
  };

  // we draw textures, then mapper, then post pass textures
  publicAPI.traverseTranslucentPass = (renderPass) => {
    if (
      !model.renderable ||
      !model.renderable.getVisibility() ||
      model.renderable.getIsOpaque() ||
      (model.WebGPURenderer.getSelector() && !model.renderable.getPickable())
    ) {
      return;
    }

    publicAPI.apply(renderPass, true);

    model.gpumapper.traverse(renderPass);

    publicAPI.apply(renderPass, false);
  };

  publicAPI.activateTextures = () => {
    // always traverse textures first, then mapper
    if (!model.gputextures) {
      return;
    }

    model.activeTextures = [];
    for (let index = 0; index < model.gputextures.length; index++) {
      const child = model.gputextures[index];
      child.render();
      if (child.getHandle()) {
        model.activeTextures.push(child);
      }
    }
  };

  publicAPI.queryPass = (prepass, renderPass) => {
    if (prepass) {
      if (!model.renderable || !model.renderable.getVisibility()) {
        return;
      }
      if (model.renderable.getIsOpaque()) {
        renderPass.incrementOpaqueActorCount();
      } else {
        renderPass.incrementTranslucentActorCount();
      }
    }
  };

  publicAPI.opaqueZBufferPass = (prepass, renderPass) =>
    publicAPI.opaquePass(prepass, renderPass);

  publicAPI.opaquePass = (prepass, renderPass) => {
    if (prepass) {
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
      publicAPI.activateTextures();
    } else if (model.activeTextures) {
      for (let index = 0; index < model.activeTextures.length; index++) {
        model.activeTextures[index].deactivate();
      }
    }
  };

  publicAPI.getKeyMatrices = () => {
    // has the actor changed?
    if (model.renderable.getMTime() > model.keyMatrixTime.getMTime()) {
      model.renderable.computeMatrix();
      mat4.copy(model.keyMatrices.mcwc, model.renderable.getMatrix());
      mat4.transpose(model.keyMatrices.mcwc, model.keyMatrices.mcwc);

      if (model.renderable.getIsIdentity()) {
        mat3.identity(model.keyMatrices.normalMatrix);
      } else {
        mat3.fromMat4(model.keyMatrices.normalMatrix, model.keyMatrices.mcwc);
        mat3.invert(
          model.keyMatrices.normalMatrix,
          model.keyMatrices.normalMatrix
        );
        mat3.transpose(
          model.keyMatrices.normalMatrix,
          model.keyMatrices.normalMatrix
        );
      }
      model.keyMatrixTime.modified();
    }

    return model.keyMatrices;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  context: null,
  keyMatrixTime: null,
  keyMatrices: null,
  activeTextures: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkViewNode.extend(publicAPI, model, initialValues);

  model.keyMatrixTime = {};
  macro.obj(model.keyMatrixTime, { mtime: 0 });
  model.keyMatrices = {
    normalMatrix: new Float64Array(9),
    mcwc: new Float64Array(16),
  };

  // Build VTK API
  macro.setGet(publicAPI, model, ['context']);

  macro.get(publicAPI, model, ['activeTextures']);

  // Object methods
  vtkWebGPUActor(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
