import { mat4 } from 'gl-matrix';

import macro from 'vtk.js/Sources/macros';
import vtkViewNode from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';

import { registerOverride } from 'vtk.js/Sources/Rendering/WebGPU/ViewNodeFactory';

// ----------------------------------------------------------------------------
// vtkWebGPUVolume methods
// ----------------------------------------------------------------------------

function vtkWebGPUVolume(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUVolume');

  // Builds myself.
  publicAPI.buildPass = (prepass) => {
    if (!model.renderable || !model.renderable.getVisibility()) {
      return;
    }
    if (prepass) {
      model.WebGPURenderer = publicAPI.getFirstAncestorOfType(
        'vtkWebGPURenderer'
      );
      model.WebGPURenderWindow = model.WebGPURenderer.getFirstAncestorOfType(
        'vtkWebGPURenderWindow'
      );
      // for the future if we support hardware selection of volumes
      if (model.propID === undefined) {
        model.propID = model.WebGPURenderWindow.getUniquePropID();
      }
      publicAPI.prepareNodes();
      model.renderable.getMapper().update();
      // publicAPI.addMissingNode(model.renderable.getMapper());
      publicAPI.removeUnusedNodes();
    }
  };

  publicAPI.queryPass = (prepass, renderPass) => {
    if (prepass) {
      if (!model.renderable || !model.renderable.getVisibility()) {
        return;
      }

      // Check for the special case when the mapper's bounds are unknown
      const bds = model.renderable.getMapper().getBounds();
      if (!bds || bds.length !== 6 || bds[0] > bds[1]) {
        return;
      }

      renderPass.addVolume(publicAPI);
    }
  };

  publicAPI.getBoundingCubePoints = (result, offset) => {
    const bounds = model.renderable.getMapper().getBounds();
    const m = model.renderable.getMatrix();

    let count = 0;
    for (let iz = 4; iz < 6; iz++) {
      const z = bounds[iz];
      for (let iy = 2; iy < 4; iy++) {
        const y = bounds[iy];
        for (let ix = 0; ix < 2; ix++) {
          const x = bounds[ix];
          let poffset = offset + count * 3;
          result[poffset++] = m[0] * x + m[1] * y + m[2] * z + m[3];
          result[poffset++] = m[4] * x + m[5] * y + m[6] * z + m[7];
          result[poffset++] = m[8] * x + m[9] * y + m[10] * z + m[11];
          count++;
        }
      }
    }
  };

  publicAPI.traverseVolumePass = (renderPass) => {
    if (
      !model.renderable ||
      !model.renderable.getNestedVisibility() ||
      (model.WebGPURenderer.getSelector() &&
        !model.renderable.getNestedPickable())
    ) {
      return;
    }

    publicAPI.apply(renderPass, true);

    model.children[0].traverse(renderPass);

    publicAPI.apply(renderPass, false);
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
      mat4.transpose(model.keyMatrices.bcwc, mcwc);

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
  propID: undefined,
  keyMatricesTime: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkViewNode.extend(publicAPI, model, initialValues);

  model.keyMatricesTime = {};
  macro.obj(model.keyMatricesTime, { mtime: 0 });
  model.keyMatrices = {
    bcwc: new Float64Array(16),
    bcsc: new Float64Array(16),
  };

  macro.get(publicAPI, model, ['propID', 'keyMatricesTime']);

  // Object methods
  vtkWebGPUVolume(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkWebGPUVolume');

// ----------------------------------------------------------------------------

export default { newInstance, extend };

// Register ourself to WebGPU backend if imported
registerOverride('vtkVolume', newInstance);
