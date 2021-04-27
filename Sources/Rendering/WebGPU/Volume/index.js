import { mat3, mat4 } from 'gl-matrix';

import macro from 'vtk.js/Sources/macro';
import vtkViewNode from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';

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
      publicAPI.addMissingNode(model.renderable.getMapper());
      publicAPI.removeUnusedNodes();
    }
  };

  publicAPI.queryPass = (prepass, renderPass) => {
    if (prepass) {
      if (!model.renderable || !model.renderable.getVisibility()) {
        return;
      }
      renderPass.incrementVolumeCount();
    }
  };

  publicAPI.traverseVolumePass = (renderPass) => {
    if (
      !model.renderable ||
      !model.renderable.getVisibility() ||
      (model.WebGPURenderer.getSelector() && !model.renderable.getPickable())
    ) {
      return;
    }

    publicAPI.apply(renderPass, true);

    model.children[0].traverse(renderPass);

    publicAPI.apply(renderPass, false);
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
  propID: undefined,
  // keyMatrixTime: null,
  // normalMatrix: null,
  // MCWCMatrix: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkViewNode.extend(publicAPI, model, initialValues);

  model.keyMatrixTime = {};
  macro.obj(model.keyMatrixTime, { mtime: 0 });
  // always set by getter
  model.normalMatrix = new Float64Array(9);
  model.MCWCMatrix = new Float64Array(16);

  macro.get(publicAPI, model, ['propID']);

  // Object methods
  vtkWebGPUVolume(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkWebGPUVolume');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
