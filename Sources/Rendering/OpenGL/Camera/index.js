import * as macro from '../../../macro';
import ViewNode from '../../SceneGraph/ViewNode';
import { mat4 } from 'gl-matrix';

// ----------------------------------------------------------------------------
// vtkOpenGLCamera methods
// ----------------------------------------------------------------------------

function openglCamera(publicAPI, model) {
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
    // ren.getTiledSizeAndOrigin(&usize, &vsize, lowerLeft, lowerLeft+1);
    // sconst gl = model.context;
    // gl.viewport(lowerLeft[0], lowerLeft[1], usize, vsize);
  };

  publicAPI.getKeyMatrices = (ren) => {
    // has the camera changed?
    if (ren !== model.lastRenderer ||
      publicAPI.getMTime() > model.keyMatrixTime.getMTime() ||
      ren.getMTime() > model.keyMatrixTime.getMTime()) {
      model.WCVCMatrix = model.renderable.getViewTransformMatrix();

      // for(int i = 0; i < 3; ++i)
      //   {
      //   for (int j = 0; j < 3; ++j)
      //     {
      //     this->NormalMatrix->SetElement(i, j, this->WCVCMatrix->GetElement(i, j));
      //     }
      //   }
      // this->NormalMatrix->Invert();

      mat4.transpose(model.WCVCMatrix, model.WCVCMatrix);

      // double aspect[2];
      // int  lowerLeft[2];
      // let usize;
      // let vsize;
      //  ren.getTiledSizeAndOrigin(&usize, &vsize, lowerLeft, lowerLeft+1);

      // ren->ComputeAspect();
      // ren->GetAspect(aspect);
      // double aspect2[2];
      // ren->vtkViewport::ComputeAspect();
      // ren->vtkViewport::GetAspect(aspect2);
      // double aspectModification = aspect[0] * aspect2[1] / (aspect[1] * aspect2[0]);

    //  if (usize && vsize) {
      model.VCDCMatrix = model.renderable.getProjectionTransformMatrix(
//                           aspectModification * usize / vsize, -1, 1);
                           1.0, -1, 1);
      mat4.transpose(model.VCDCMatrix, model.VCDCMatrix);
    //  }

      model.WCDCMatrix = mat4.create();
      mat4.multiply(model.WCDCMatrix, model.WCVCMatrix, model.VCDCMatrix);

      model.keyMatrixTime.modified();
      model.lastRenderer = ren;
    }

    return { wcvc: model.WCVCMatrix, normMat: model.normalMatrix, vcdc: model.VCDCMatrix, wcdc: model.WCDCMatrix };
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  context: null,
  lastRenderer: null,
  keyMatrixTime: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  ViewNode.extend(publicAPI, model);

  model.keyMatrixTime = {};
  macro.obj(model.keyMatrixTime);

  // Build VTK API
  macro.setGet(publicAPI, model, [
    'context',
    'keyMatrixTime',
  ]);

  // Object methods
  openglCamera(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
