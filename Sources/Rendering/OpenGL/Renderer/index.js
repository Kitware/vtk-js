import * as macro from '../../../macro';
import vtkViewNode from '../../SceneGraph/ViewNode';

// ----------------------------------------------------------------------------
// vtkOpenGLRenderer methods
// ----------------------------------------------------------------------------

export function vtkOpenGLRenderer(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLRenderer');

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
      publicAPI.updateLights();
      publicAPI.prepareNodes();
      publicAPI.addMissingNode(model.renderable.getActiveCamera());
      publicAPI.addMissingNodes(model.renderable.getActors());
      publicAPI.addMissingNodes(model.renderable.getActors2D());
      publicAPI.addMissingNodes(model.renderable.getVolumes());
      publicAPI.removeUnusedNodes();
    }
  };

  publicAPI.updateLights = () => {
    let count = 0;

    model.renderable.getLights().forEach(light => {
      if (light.getSwitch() > 0.0) {
        count++;
      }
    });

    if (!count) {
      vtkDebugMacro('No lights are on, creating one.');
      model.renderable.createLight();
    }

    return count;
  };

  // Renders myself
  publicAPI.render = (prepass) => {
    if (prepass) {
      model.context = publicAPI.getFirstAncestorOfType('vtkOpenGLRenderWindow').getContext();
      publicAPI.clear();
    } else {
      // else
    }
  };

  publicAPI.getAspectRatio = () => {
    const size = model.parent.getSize();
    const viewport = model.renderable.getViewport();
    return size[0] * (viewport[2] - viewport[0]) / ((viewport[3] - viewport[1]) * size[1]);
  };

  publicAPI.clear = () => {
    let clearMask = 0;
    const gl = model.context;

    if (! model.renderable.getTransparent()) {
      const background = model.renderable.getBackground();
      model.context.clearColor(background[0], background[1], background[2], 1.0);
      clearMask |= gl.COLOR_BUFFER_BIT;
    }

    if (!model.renderable.getPreserveDepthBuffer()) {
      gl.clearDepth(1.0);
      clearMask |= gl.DEPTH_BUFFER_BIT;
      gl.depthMask(true);
    }

    gl.colorMask(true, true, true, true);
    gl.clear(clearMask);

    gl.enable(gl.DEPTH_TEST);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  context: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkViewNode.extend(publicAPI, model);

  // Build VTK API
  macro.get(publicAPI, model, ['shaderCache']);

  macro.setGet(publicAPI, model, [
    'context',
  ]);

  // Object methods
  vtkOpenGLRenderer(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
