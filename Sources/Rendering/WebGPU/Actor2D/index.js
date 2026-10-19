import { mat4 } from 'gl-matrix';

import macro from 'vtk.js/Sources/macros';
import vtkViewNode from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';

import { registerOverride } from 'vtk.js/Sources/Rendering/WebGPU/ViewNodeFactory';
import { getWebGPUContext } from 'vtk.js/Sources/Rendering/WebGPU/Helpers/Context';

// ----------------------------------------------------------------------------
// vtkWebGPUActor methods
// ----------------------------------------------------------------------------

function vtkWebGPUActor2D(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUActor2D');

  // Builds myself.
  publicAPI.buildPass = (prepass) => {
    if (prepass) {
      const { renderer, renderWindow } = getWebGPUContext(publicAPI);
      model.WebGPURenderer = renderer;
      model.WebGPURenderWindow = renderWindow;
      if (model.propID === undefined) {
        model.propID = model.WebGPURenderWindow.getUniquePropID();
      }
      publicAPI.prepareNodes();
      publicAPI.addMissingNode(model.renderable.getMapper());
      publicAPI.removeUnusedNodes();
    }
  };

  // we draw textures, then mapper, then post pass textures
  publicAPI.traverseOpaquePass = (renderPass) => {
    if (
      !model.renderable ||
      !model.renderable.getNestedVisibility() ||
      !model.renderable.getIsOpaque() ||
      (model.WebGPURenderer.getSelector() &&
        !model.renderable.getNestedPickable())
    ) {
      return;
    }

    publicAPI.apply(renderPass, true);

    if (model.children[0]) {
      model.children[0].traverse(renderPass);
    }

    publicAPI.apply(renderPass, false);
  };

  // we draw textures, then mapper, then post pass textures
  publicAPI.traverseTranslucentPass = (renderPass) => {
    if (
      !model.renderable ||
      !model.renderable.getNestedVisibility() ||
      model.renderable.getIsOpaque() ||
      (model.WebGPURenderer.getSelector() &&
        !model.renderable.getNestedPickable())
    ) {
      return;
    }

    publicAPI.apply(renderPass, true);

    if (model.children[0]) {
      model.children[0].traverse(renderPass);
    }

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

  publicAPI.getBufferShift = () => model.bufferShift;

  // A 2D actor draws its points in viewport pixels, as the OpenGL
  // backend does. The actor position moves them. The coordinate system of
  // the prop is not used, and there is no buffer shift.
  publicAPI.getKeyMatrices = (wgpuRen) => {
    const ren = wgpuRen.getRenderable();
    const actorPos = model.renderable
      .getActualPositionCoordinate()
      .getComputedDoubleViewportValue(ren);
    mat4.fromTranslation(model.keyMatrices.bcwc, [
      Math.round(actorPos[0]),
      Math.round(actorPos[1]),
      0.0,
    ]);
    mat4.copy(model.keyMatrices.bcsc, model.keyMatrices.bcwc);
    mat4.identity(model.keyMatrices.normalMatrix);
    return model.keyMatrices;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  keyMatricesTime: null,
  keyMatrices: null,
  propID: undefined,
  bufferShift: undefined,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkViewNode.extend(publicAPI, model, initialValues);

  model.keyMatricesTime = {};
  macro.obj(model.keyMatricesTime, { mtime: 0 });
  model.keyMatrices = {
    normalMatrix: new Float64Array(16),
    bcwc: new Float64Array(16),
    bcsc: new Float64Array(16),
  };

  macro.get(publicAPI, model, ['propID', 'keyMatricesTime']);

  model.bufferShift = [0, 0, 0, 0];

  // Object methods
  vtkWebGPUActor2D(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };

// Register ourself to WebGPU backend if imported
registerOverride('vtkActor2D', newInstance);
