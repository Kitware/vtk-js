import * as macro from '../../../macro';
import vtkViewNode from '../../SceneGraph/ViewNode';
import vtkMath from '../../../Common/Core/Math';

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

    model.renderable.getLights().forEach((light) => {
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

  publicAPI.getTiledSizeAndOrigin = () => {
    const vport = model.renderable.getViewport();

    // if there is no window assume 0 1
    const tileViewPort = [0.0, 0.0, 1.0, 1.0];

    // find the lower left corner of the viewport, taking into account the
    // lower left boundary of this tile
    const vpu = vtkMath.clampValue(vport[0] - tileViewPort[0], 0.0, 1.0);
    const vpv = vtkMath.clampValue(vport[1] - tileViewPort[1], 0.0, 1.0);

    // store the result as a pixel value
    const ndvp = model.parent.normalizedDisplayToDisplay(vpu, vpv);
    const lowerLeftU = Math.round(ndvp[0]);
    const lowerLeftV = Math.round(ndvp[1]);

    // find the upper right corner of the viewport, taking into account the
    // lower left boundary of this tile
    let vpu2 = vtkMath.clampValue(vport[2] - tileViewPort[0], 0.0, 1.0);
    let vpv2 = vtkMath.clampValue(vport[3] - tileViewPort[1], 0.0, 1.0);
    // also watch for the upper right boundary of the tile
    if (vpu2 > (tileViewPort[2] - tileViewPort[0])) {
      vpu2 = tileViewPort[2] - tileViewPort[0];
    }
    if (vpv2 > (tileViewPort[3] - tileViewPort[1])) {
      vpv2 = tileViewPort[3] - tileViewPort[1];
    }
    const ndvp2 = model.parent.normalizedDisplayToDisplay(vpu2, vpv2);

    // now compute the size of the intersection of the viewport with the
    // current tile
    let usize = Math.round(ndvp2[0]) - lowerLeftU;
    let vsize = Math.round(ndvp2[1]) - lowerLeftV;

    if (usize < 0) {
      usize = 0;
    }
    if (vsize < 0) {
      vsize = 0;
    }

    return { usize, vsize, lowerLeftU, lowerLeftV };
  };

  publicAPI.clear = () => {
    /* eslint-disable no-bitwise */
    let clearMask = 0;
    const gl = model.context;

    if (!model.renderable.getTransparent()) {
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
    /* eslint-enable no-bitwise */
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
