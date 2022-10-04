import { mat4 } from 'gl-matrix';

import * as macro from 'vtk.js/Sources/macros';
import vtkViewNode from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';

import { registerOverride } from 'vtk.js/Sources/Rendering/OpenGL/ViewNodeFactory';

// ----------------------------------------------------------------------------
// vtkOpenGLImageSlice methods
// ----------------------------------------------------------------------------

function vtkOpenGLImageSlice(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLImageSlice');

  // Builds myself.
  publicAPI.buildPass = (prepass) => {
    if (!model.renderable || !model.renderable.getVisibility()) {
      return;
    }
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
      publicAPI.addMissingNode(model.renderable.getMapper());
      publicAPI.removeUnusedNodes();
    }
  };

  publicAPI.traverseOpaqueZBufferPass = (renderPass) => {
    publicAPI.traverseOpaquePass(renderPass);
  };

  // we draw textures, then mapper, then post pass textures
  publicAPI.traverseOpaquePass = (renderPass) => {
    if (
      !model.renderable ||
      !model.renderable.getNestedVisibility() ||
      !model.renderable.getIsOpaque() ||
      (model.openGLRenderer.getSelector() &&
        !model.renderable.getNestedPickable())
    ) {
      return;
    }

    publicAPI.apply(renderPass, true);
    model.children.forEach((child) => {
      child.traverse(renderPass);
    });
    publicAPI.apply(renderPass, false);
  };

  // we draw textures, then mapper, then post pass textures
  publicAPI.traverseTranslucentPass = (renderPass) => {
    if (
      !model.renderable ||
      !model.renderable.getNestedVisibility() ||
      model.renderable.getIsOpaque() ||
      (model.openGLRenderer.getSelector() &&
        !model.renderable.getNestedPickable())
    ) {
      return;
    }

    publicAPI.apply(renderPass, true);
    model.children.forEach((child) => {
      child.traverse(renderPass);
    });
    publicAPI.apply(renderPass, false);
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

  // Renders myself
  publicAPI.opaquePass = (prepass, renderPass) => {
    if (prepass) {
      model.context.depthMask(true);
    }
  };

  // Renders myself
  publicAPI.translucentPass = (prepass, renderPass) => {
    model.context.depthMask(!prepass);
  };

  publicAPI.getKeyMatrices = () => {
    // has the actor changed?
    if (model.renderable.getMTime() > model.keyMatrixTime.getMTime()) {
      mat4.copy(model.keyMatrices.mcwc, model.renderable.getMatrix());
      mat4.transpose(model.keyMatrices.mcwc, model.keyMatrices.mcwc);
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
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkViewNode.extend(publicAPI, model, initialValues);

  model.keyMatrixTime = {};
  macro.obj(model.keyMatrixTime, { mtime: 0 });
  model.keyMatrices = {
    mcwc: mat4.identity(new Float64Array(16)),
  };

  // Build VTK API
  macro.setGet(publicAPI, model, ['context']);

  // Object methods
  vtkOpenGLImageSlice(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkOpenGLImageSlice');

// ----------------------------------------------------------------------------

export default { newInstance, extend };

// Register ourself to OpenGL backend if imported
registerOverride('vtkImageSlice', newInstance);
