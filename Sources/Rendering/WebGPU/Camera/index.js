import { mat3, mat4 } from 'gl-matrix';

import * as macro from '../../../macro';
import vtkViewNode from '../../SceneGraph/ViewNode';

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
      webGPURenderWindow.getMTime() > model.keyMatrixTime.getMTime() ||
      publicAPI.getMTime() > model.keyMatrixTime.getMTime() ||
      ren.getMTime() > model.keyMatrixTime.getMTime() ||
      model.renderable.getMTime() > model.keyMatrixTime.getMTime()
    ) {
      mat4.copy(model.keyMatrices.wcvc, model.renderable.getViewMatrix());

      mat3.fromMat4(model.keyMatrices.normalMatrix, model.keyMatrices.wcvc);
      mat3.invert(
        model.keyMatrices.normalMatrix,
        model.keyMatrices.normalMatrix
      );
      mat4.transpose(model.keyMatrices.wcvc, model.keyMatrices.wcvc);

      const aspectRatio = webGPURenderer.getAspectRatio();

      mat4.copy(
        model.keyMatrices.vcpc,
        model.renderable.getProjectionMatrix(aspectRatio, -1, 1)
      );
      mat4.transpose(model.keyMatrices.vcpc, model.keyMatrices.vcpc);

      mat4.multiply(
        model.keyMatrices.wcpc,
        model.keyMatrices.vcpc,
        model.keyMatrices.wcvc
      );

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
  macro.obj(model.keyMatrixTime);

  // values always get set by the get method
  model.keyMatrices = {
    normalMatrix: new Float64Array(9),
    vcpc: new Float64Array(16),
    wcvc: new Float64Array(16),
    wcpc: new Float64Array(16),
  };

  // Build VTK API
  macro.setGet(publicAPI, model, ['context', 'keyMatrixTime']);

  // Object methods
  vtkWebGPUCamera(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
