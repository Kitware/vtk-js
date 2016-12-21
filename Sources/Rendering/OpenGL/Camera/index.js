import { mat3, mat4 } from 'gl-matrix';

import * as macro from '../../../macro';
import vtkViewNode from '../../SceneGraph/ViewNode';

// ----------------------------------------------------------------------------
// vtkOpenGLCamera methods
// ----------------------------------------------------------------------------

function vtkOpenGLCamera(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLCamera');

  // Builds myself.
  publicAPI.build = (prepass) => {
    if (prepass) {
      if (!model.renderable) {
        return;
      }
    }
  };

  // Renders myself
  publicAPI.render = (prepass) => {
    if (prepass) {
      model.context = publicAPI.getFirstAncestorOfType('vtkOpenGLRenderWindow').getContext();
      const ren = publicAPI.getFirstAncestorOfType('vtkOpenGLRenderer');
      publicAPI.preRender(ren);
    }
  };

  publicAPI.preRender = (ren) => {
    const tsize = ren.getTiledSizeAndOrigin();
    model.context.viewport(tsize.lowerLeftU, tsize.lowerLeftV, tsize.usize, tsize.vsize);
  };

  publicAPI.getKeyMatrices = (ren) => {
    // has the camera changed?
    if (ren !== model.lastRenderer ||
      publicAPI.getFirstAncestorOfType('vtkOpenGLRenderWindow').getMTime() > model.keyMatrixTime.getMTime() ||
      publicAPI.getMTime() > model.keyMatrixTime.getMTime() ||
      ren.getMTime() > model.keyMatrixTime.getMTime()) {
      model.WCVCMatrix = model.renderable.getViewTransformMatrix();

      mat3.fromMat4(model.normalMatrix, model.WCVCMatrix);
      mat3.invert(model.normalMatrix, model.normalMatrix);
      mat4.transpose(model.WCVCMatrix, model.WCVCMatrix);

      const oglren = publicAPI.getFirstAncestorOfType('vtkOpenGLRenderer');
      const aspectRatio = oglren.getAspectRatio();

      model.VCDCMatrix = model.renderable.getProjectionTransformMatrix(
                           aspectRatio, -1, 1);
      mat4.transpose(model.VCDCMatrix, model.VCDCMatrix);

      model.WCDCMatrix = mat4.create();
      mat4.multiply(model.WCDCMatrix, model.VCDCMatrix, model.WCVCMatrix);
//      mat4.multiply(model.WCDCMatrix, model.WCVCMatrix, model.VCDCMatrix);

      model.keyMatrixTime.modified();
      model.lastRenderer = ren;
    }

    return { wcvc: model.WCVCMatrix, normalMatrix: model.normalMatrix, vcdc: model.VCDCMatrix, wcdc: model.WCDCMatrix };
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  context: null,
  lastRenderer: null,
  keyMatrixTime: null,
  normalMatrix: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkViewNode.extend(publicAPI, model, initialValues);

  model.keyMatrixTime = {};
  model.normalMatrix = mat3.create();
  macro.obj(model.keyMatrixTime);

  // Build VTK API
  macro.setGet(publicAPI, model, [
    'context',
    'keyMatrixTime',
  ]);

  // Object methods
  vtkOpenGLCamera(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
