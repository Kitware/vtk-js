import { mat4 } from 'gl-matrix';

import macro from 'vtk.js/Sources/macros';
import vtkViewNode from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';

import { registerOverride } from 'vtk.js/Sources/Rendering/WebGPU/ViewNodeFactory';

// ----------------------------------------------------------------------------
// vtkWebGPUCamera methods
// ----------------------------------------------------------------------------

function vtkWebGPUCamera(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUCamera');

  publicAPI.getKeyMatrices = (webGPURenderer) => {
    // has the camera changed?
    const ren = webGPURenderer.getRenderable();
    const webGPURenderWindow = webGPURenderer.getParent();
    if (
      Math.max(
        webGPURenderWindow.getMTime(),
        publicAPI.getMTime(),
        ren.getMTime(),
        model.renderable.getMTime(),
        webGPURenderer.getStabilizedTime()
      ) > model.keyMatrixTime.getMTime()
    ) {
      const wcvc = model.renderable.getViewMatrix();

      mat4.copy(model.keyMatrices.normalMatrix, wcvc);
      // zero out translation
      model.keyMatrices.normalMatrix[3] = 0.0;
      model.keyMatrices.normalMatrix[7] = 0.0;
      model.keyMatrices.normalMatrix[11] = 0.0;
      mat4.invert(
        model.keyMatrices.normalMatrix,
        model.keyMatrices.normalMatrix
      );
      mat4.transpose(model.keyMatrices.wcvc, wcvc);

      const center = webGPURenderer.getStabilizedCenterByReference();
      mat4.translate(model.keyMatrices.scvc, model.keyMatrices.wcvc, center);

      const aspectRatio = webGPURenderer.getAspectRatio();

      const vcpc = model.renderable.getProjectionMatrix(aspectRatio, -1, 1);
      mat4.transpose(model.keyMatrices.vcpc, vcpc);

      // adjust due to WebGPU using a different coordinate system in Z
      model.keyMatrices.vcpc[2] = 0.5 * vcpc[8] + 0.5 * vcpc[12];
      model.keyMatrices.vcpc[6] = 0.5 * vcpc[9] + 0.5 * vcpc[13];
      model.keyMatrices.vcpc[10] = 0.5 * vcpc[10] + 0.5 * vcpc[14];
      model.keyMatrices.vcpc[14] = 0.5 * vcpc[11] + 0.5 * vcpc[15];

      mat4.multiply(
        model.keyMatrices.scpc,
        model.keyMatrices.vcpc,
        model.keyMatrices.scvc
      );

      mat4.invert(model.keyMatrices.pcsc, model.keyMatrices.scpc);

      model.keyMatrixTime.modified();
    }
    return model.keyMatrices;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  keyMatrixTime: null,
  keyMatrices: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkViewNode.extend(publicAPI, model, initialValues);

  model.keyMatrixTime = {};
  macro.obj(model.keyMatrixTime);

  // values always get set by the get method
  model.keyMatrices = {
    normalMatrix: new Float64Array(16),
    vcpc: new Float64Array(16),
    pcsc: new Float64Array(16),
    wcvc: new Float64Array(16),
    scpc: new Float64Array(16),
    scvc: new Float64Array(16),
  };

  // Build VTK API
  macro.setGet(publicAPI, model, ['keyMatrixTime']);

  // Object methods
  vtkWebGPUCamera(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };

// Register ourself to WebGPU backend if imported
registerOverride('vtkCamera', newInstance);
