import { mat3, mat4 } from 'gl-matrix';

import * as macro from 'vtk.js/Sources/macros';
import vtkViewNode from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';

import { registerOverride } from 'vtk.js/Sources/Rendering/OpenGL/ViewNodeFactory';

// ----------------------------------------------------------------------------
// vtkOpenGLCamera methods
// ----------------------------------------------------------------------------

function vtkOpenGLCamera(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLCamera');

  publicAPI.buildPass = (prepass) => {
    if (prepass) {
      model.openGLRenderer =
        publicAPI.getFirstAncestorOfType('vtkOpenGLRenderer');
      model._openGLRenderWindow = model.openGLRenderer.getParent();
      model.context = model._openGLRenderWindow.getContext();
    }
  };

  // Renders myself
  publicAPI.opaquePass = (prepass) => {
    if (prepass) {
      const tsize = model.openGLRenderer.getTiledSizeAndOrigin();
      model.context.viewport(
        tsize.lowerLeftU,
        tsize.lowerLeftV,
        tsize.usize,
        tsize.vsize
      );
      model.context.scissor(
        tsize.lowerLeftU,
        tsize.lowerLeftV,
        tsize.usize,
        tsize.vsize
      );
    }
  };
  publicAPI.translucentPass = publicAPI.opaquePass;
  publicAPI.opaqueZBufferPass = publicAPI.opaquePass;
  publicAPI.volumePass = publicAPI.opaquePass;

  publicAPI.getKeyMatrices = (ren) => {
    // has the camera changed?
    if (
      ren !== model.lastRenderer ||
      model._openGLRenderWindow.getMTime() > model.keyMatrixTime.getMTime() ||
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

      const aspectRatio = model.openGLRenderer.getAspectRatio();

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
      model.lastRenderer = ren;
    }

    return model.keyMatrices;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  context: null,
  lastRenderer: null,
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
  vtkOpenGLCamera(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };

// Register ourself to OpenGL backend if imported
registerOverride('vtkCamera', newInstance);
