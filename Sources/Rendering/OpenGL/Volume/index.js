import { mat3, mat4 } from 'gl-matrix';

import macro       from 'vtk.js/Sources/macro';
import vtkViewNode from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';

// ----------------------------------------------------------------------------
// vtkOpenGLVolume methods
// ----------------------------------------------------------------------------

function vtkOpenGLVolume(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLVolume');

  // Builds myself.
  publicAPI.build = (prepass) => {
    if (!model.renderable || !model.renderable.getVisibility()) {
      return;
    }
    if (prepass) {
      if (!model.renderable) {
        return;
      }

      publicAPI.prepareNodes();
      publicAPI.addMissingNode(model.renderable.getMapper());
      publicAPI.removeUnusedNodes();
    }
  };

  // Renders myself
  publicAPI.render = (prepass) => {
    if (!model.renderable || !model.renderable.getVisibility()) {
      return;
    }
    if (prepass) {
      model.context = publicAPI.getFirstAncestorOfType('vtkOpenGLRenderWindow').getContext();
      publicAPI.preRender();
    } else {
      model.context.depthMask(true);
    }
  };

  publicAPI.preRender = () => {
    model.context.depthMask(false);
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
  // context: null,
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
  macro.obj(model.keyMatrixTime);
  model.normalMatrix = mat3.create();
  model.MCWCMatrix = mat4.create();

  // Build VTK API
  macro.setGet(publicAPI, model, [
    'context',
  ]);

  // Object methods
  vtkOpenGLVolume(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkOpenGLVolume');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
