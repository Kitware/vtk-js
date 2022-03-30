import { mat3, mat4 } from 'gl-matrix';

import * as macro from 'vtk.js/Sources/macros';
import vtkViewNode from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';

import { registerOverride } from 'vtk.js/Sources/Rendering/OpenGL/ViewNodeFactory';

// ----------------------------------------------------------------------------
// vtkOpenGLVolume methods
// ----------------------------------------------------------------------------

function vtkOpenGLVolume(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLVolume');

  // Builds myself.
  publicAPI.buildPass = (prepass) => {
    if (!model.renderable || !model.renderable.getVisibility()) {
      return;
    }
    if (prepass) {
      model._openGLRenderWindow = publicAPI.getFirstAncestorOfType(
        'vtkOpenGLRenderWindow'
      );
      model.openGLRenderer =
        publicAPI.getFirstAncestorOfType('vtkOpenGLRenderer');
      model.context = model._openGLRenderWindow.getContext();
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
      !model.renderable.getNestedVisibility() ||
      (model.openGLRenderer.getSelector() &&
        !model.renderable.getNestedPickable())
    ) {
      return;
    }

    publicAPI.apply(renderPass, true);

    model.children[0].traverse(renderPass);

    publicAPI.apply(renderPass, false);
  };

  // Renders myself
  publicAPI.volumePass = (prepass) => {
    if (!model.renderable || !model.renderable.getVisibility()) {
      return;
    }
    model.context.depthMask(!prepass);
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
  // _openGLRenderWindow: null,
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

  // Build VTK API
  macro.setGet(publicAPI, model, ['context']);

  // Object methods
  vtkOpenGLVolume(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkOpenGLVolume');

// ----------------------------------------------------------------------------

export default { newInstance, extend };

// Register ourself to OpenGL backend if imported
registerOverride('vtkVolume', newInstance);
