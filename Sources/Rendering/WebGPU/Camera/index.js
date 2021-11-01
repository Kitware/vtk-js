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

  publicAPI.getProjectionMatrix = (outMat, aspect, cRange, windowCenter) => {
    mat4.identity(outMat);
    if (model.renderable.getParallelProjection()) {
      // set up a rectangular parallelipiped
      const parallelScale = model.renderable.getParallelScale();
      const width = parallelScale * aspect;
      const height = parallelScale;

      const xmin = (windowCenter[0] - 1.0) * width;
      const xmax = (windowCenter[0] + 1.0) * width;
      const ymin = (windowCenter[1] - 1.0) * height;
      const ymax = (windowCenter[1] + 1.0) * height;

      const xr = 1.0 / (xmax - xmin);
      const yr = 1.0 / (ymax - ymin);
      outMat[0] = 2.0 * xr;
      outMat[5] = 2.0 * yr;
      outMat[10] = 1.0 / (cRange[1] - cRange[0]);
      outMat[12] = (xmax + xmin) * xr;
      outMat[13] = (ymax + ymin) * yr;
      outMat[14] = cRange[1] / (cRange[1] - cRange[0]);
    } else {
      const tmp = Math.tan((Math.PI * model.renderable.getViewAngle()) / 360.0);
      let width;
      let height;
      if (model.renderable.getUseHorizontalViewAngle() === true) {
        width = cRange[0] * tmp;
        height = (cRange[0] * tmp) / aspect;
      } else {
        width = cRange[0] * tmp * aspect;
        height = cRange[0] * tmp;
      }

      const xmin = (windowCenter[0] - 1.0) * width;
      const xmax = (windowCenter[0] + 1.0) * width;
      const ymin = (windowCenter[1] - 1.0) * height;
      const ymax = (windowCenter[1] + 1.0) * height;

      outMat[0] = (2.0 * cRange[0]) / (xmax - xmin);
      outMat[5] = (2.0 * cRange[0]) / (ymax - ymin);
      outMat[12] = (xmin + xmax) / (xmax - xmin);
      outMat[13] = (ymin + ymax) / (ymax - ymin);
      outMat[10] = 0.0;
      outMat[14] = cRange[0];
      outMat[11] = -1.0;
      outMat[15] = 0.0;
    }
  };

  publicAPI.convertToOpenGLDepth = (val) => {
    if (model.renderable.getParallelProjection()) {
      return 1.0 - val;
    }
    const cRange = model.renderable.getClippingRangeByReference();
    let zval = -cRange[0] / val;
    zval =
      (cRange[0] + cRange[1]) / (cRange[1] - cRange[0]) +
      (2.0 * cRange[0] * cRange[1]) / (zval * (cRange[1] - cRange[0]));
    return 0.5 * zval + 0.5;
  };

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

      const cRange = model.renderable.getClippingRangeByReference();
      publicAPI.getProjectionMatrix(
        model.keyMatrices.vcpc,
        aspectRatio,
        cRange,
        model.renderable.getWindowCenterByReference()
      );

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
