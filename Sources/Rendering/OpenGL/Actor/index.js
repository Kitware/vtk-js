import { mat3, mat4 } from 'gl-matrix';

import * as macro from '../../../macro';
import vtkViewNode from '../../SceneGraph/ViewNode';

// ----------------------------------------------------------------------------
// vtkOpenGLActor methods
// ----------------------------------------------------------------------------

function vtkOpenGLActor(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLActor');

  // Builds myself.
  publicAPI.build = (prepass) => {
    if (prepass) {
      if (!model.renderable) {
        return;
      }

      publicAPI.prepareNodes();
      publicAPI.addMissingNodes(model.renderable.getTextures());
      publicAPI.addMissingNode(model.renderable.getMapper());
      publicAPI.removeUnusedNodes();
    }
  };

  // we draw textures, then mapper, then post pass textures
  publicAPI.traverse = operation => {
    publicAPI.apply(operation, true);

    model.activeTextures = [];
    model.children.forEach(child => {
      child.apply(operation, true);
      if (child.isA('vtkOpenGLTexture') && operation === 'Render') {
        model.activeTextures.push(child);
      }
    });

    model.children.forEach(child => {
      child.apply(operation, false);
    });

    publicAPI.apply(operation, false);
  };

  // Renders myself
  publicAPI.render = (prepass) => {
    if (prepass) {
      model.context = publicAPI.getFirstAncestorOfType('vtkOpenGLRenderWindow').getContext();
      publicAPI.preRender();
    } else {
      // deactivate textures
      model.children.forEach(child => {
        if (child.isA('vtkOpenGLTexture')) {
          child.deactivate();
        }
      });
      const opaque = (model.renderable.getIsOpaque() !== 0);
      if (!opaque) {
        model.context.depthMask(true);
      }
    }
  };

  publicAPI.preRender = () => {
    // get opacity
    const opaque = (model.renderable.getIsOpaque() !== 0);
    if (opaque) {
      model.context.depthMask(true);
    } else {
      model.context.depthMask(false);
    }
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
  context: null,
  keyMatrixTime: null,
  normalMatrix: null,
  MCWCMatrix: null,
  activeTextures: [],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkViewNode.extend(publicAPI, model);

  model.keyMatrixTime = {};
  macro.obj(model.keyMatrixTime);
  model.normalMatrix = mat3.create();
  model.MCWCMatrix = mat4.create();

  // Build VTK API
  macro.setGet(publicAPI, model, [
    'context',
  ]);

  macro.get(publicAPI, model, [
    'activeTextures',
  ]);

  // Object methods
  vtkOpenGLActor(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
