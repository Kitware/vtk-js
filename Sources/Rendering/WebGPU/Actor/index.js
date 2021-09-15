import { mat4 } from 'gl-matrix';

import macro from 'vtk.js/Sources/macros';
import vtkViewNode from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';

import { registerOverride } from 'vtk.js/Sources/Rendering/WebGPU/ViewNodeFactory';

// ----------------------------------------------------------------------------
// vtkWebGPUActor methods
// ----------------------------------------------------------------------------

function vtkWebGPUActor(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUActor');

  // Builds myself.
  publicAPI.buildPass = (prepass) => {
    if (prepass) {
      model.WebGPURenderer =
        publicAPI.getFirstAncestorOfType('vtkWebGPURenderer');
      model.WebGPURenderWindow = model.WebGPURenderer.getFirstAncestorOfType(
        'vtkWebGPURenderWindow'
      );
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

  publicAPI.getBufferShift = (wgpuRen) => {
    publicAPI.getKeyMatrices(wgpuRen);
    return model.bufferShift;
  };

  publicAPI.getKeyMatrices = (wgpuRen) => {
    // has the actor or stabilization center changed?
    if (
      Math.max(model.renderable.getMTime(), wgpuRen.getStabilizedTime()) >
      model.keyMatricesTime.getMTime()
    ) {
      model.renderable.computeMatrix();

      const mcwc = model.renderable.getMatrix();

      // compute the net shift
      const center = wgpuRen.getStabilizedCenterByReference();
      model.bufferShift[0] = mcwc[3] - center[0];
      model.bufferShift[1] = mcwc[7] - center[1];
      model.bufferShift[2] = mcwc[11] - center[2];

      mat4.transpose(model.keyMatrices.bcwc, mcwc);

      if (model.renderable.getIsIdentity()) {
        mat4.identity(model.keyMatrices.normalMatrix);
      } else {
        // we use bcwc BEFORE the translate below (just to get transposed mcvc)
        mat4.copy(model.keyMatrices.normalMatrix, model.keyMatrices.bcwc);
        // zero out translation
        model.keyMatrices.normalMatrix[3] = 0.0;
        model.keyMatrices.normalMatrix[7] = 0.0;
        model.keyMatrices.normalMatrix[11] = 0.0;
        mat4.invert(
          model.keyMatrices.normalMatrix,
          model.keyMatrices.normalMatrix
        );
        mat4.transpose(
          model.keyMatrices.normalMatrix,
          model.keyMatrices.normalMatrix
        );
      }

      // only meed the buffer shift to get to world
      mat4.translate(model.keyMatrices.bcwc, model.keyMatrices.bcwc, [
        -model.bufferShift[0],
        -model.bufferShift[1],
        -model.bufferShift[2],
      ]);

      // to get to stabilized we also need the center
      mat4.translate(model.keyMatrices.bcsc, model.keyMatrices.bcwc, [
        -center[0],
        -center[1],
        -center[2],
      ]);

      model.keyMatricesTime.modified();
    }

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
  vtkWebGPUActor(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };

// Register ourself to WebGPU backend if imported
registerOverride('vtkActor', newInstance);
