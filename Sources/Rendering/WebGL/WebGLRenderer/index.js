import * as macro from '../../../macro';
import ViewNode from '../../SceneGraph/ViewNode';

// ----------------------------------------------------------------------------
// vtkWebGLPolyDataMapper methods
// ----------------------------------------------------------------------------

export function webGLRenderer(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGLRenderer');

  // Builds myself.
  publicAPI.build = (prepass) => {
    if (prepass) {
      if (!model.renderable) {
        return;
      }

      // make sure we have a camera
      if (!model.renderable.isActiveCameraCreated()) {
        model.renderable.resetCamera();
      }

      publicAPI.prepareNodes();
      publicAPI.addMissingNodes(model.renderble.getActors());
      publicAPI.removeUnusedNodes();
    }
  };


  // Renders myself
  publicAPI.render = (prepass) => {
    if (prepass) {
      // make current
    } else {
      model.clear();
    }
  };

  publicAPI.clear = () => {
    let clearMask = 0;
    const gl = model.context;

    if (! model.renderable.getTransparent()) {
      const background = model.renderable.getBackground();
      model.context.clearColor(background[0], background[1], background[2], 0.0);
      clearMask |= gl.COLOR_BUFFER_BIT;
    }

    if (!model.renderable.getPreserveDepthBuffer()) {
      gl.clearDepth(1.0);
      clearMask |= gl.DEPTH_BUFFER_BIT;
      gl.depthMask(gl.TRUE);
    }

    gl.colorMask(gl.TRUE, gl.TRUE, gl.TRUE, gl.TRUE);
    gl.clear(clearMask);

    gl.enable(gl.DEPTH_TEST);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  ViewNode.extend(publicAPI, model);

  // Build VTK API
  macro.get(publicAPI, model, ['shaderCache']);

  // Object methods
  webGLRenderer(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
