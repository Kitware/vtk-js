import * as macro from 'vtk.js/Sources/macros';
import vtkViewNode from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';

import { registerOverride } from 'vtk.js/Sources/Rendering/OpenGL/ViewNodeFactory';

const { vtkDebugMacro } = macro;

// ----------------------------------------------------------------------------
// vtkOpenGLRenderer methods
// ----------------------------------------------------------------------------
/* eslint-disable no-bitwise */

function vtkOpenGLRenderer(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLRenderer');

  // Builds myself.
  publicAPI.buildPass = (prepass) => {
    if (prepass) {
      if (!model.renderable) {
        return;
      }

      publicAPI.updateLights();
      publicAPI.prepareNodes();
      publicAPI.addMissingNode(model.renderable.getActiveCamera());
      publicAPI.addMissingNodes(model.renderable.getViewPropsWithNestedProps());
      publicAPI.removeUnusedNodes();
    }
  };

  publicAPI.updateLights = () => {
    let count = 0;

    const lights = model.renderable.getLightsByReference();
    for (let index = 0; index < lights.length; ++index) {
      if (lights[index].getSwitch() > 0.0) {
        count++;
      }
    }

    if (!count) {
      vtkDebugMacro('No lights are on, creating one.');
      model.renderable.createLight();
    }

    return count;
  };

  publicAPI.zBufferPass = (prepass) => {
    if (prepass) {
      let clearMask = 0;
      const gl = model.context;
      if (!model.renderable.getTransparent()) {
        model.context.clearColor(1.0, 0.0, 0.0, 1.0);
        clearMask |= gl.COLOR_BUFFER_BIT;
      }

      if (!model.renderable.getPreserveDepthBuffer()) {
        gl.clearDepth(1.0);
        clearMask |= gl.DEPTH_BUFFER_BIT;
        model.context.depthMask(true);
      }

      const ts = publicAPI.getTiledSizeAndOrigin();
      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(ts.lowerLeftU, ts.lowerLeftV, ts.usize, ts.vsize);
      gl.viewport(ts.lowerLeftU, ts.lowerLeftV, ts.usize, ts.vsize);

      gl.colorMask(true, true, true, true);
      if (clearMask) {
        gl.clear(clearMask);
      }
      gl.enable(gl.DEPTH_TEST);
    }
  };

  publicAPI.opaqueZBufferPass = (prepass) => publicAPI.zBufferPass(prepass);

  // Renders myself
  publicAPI.cameraPass = (prepass) => {
    if (prepass) {
      publicAPI.clear();
    }
  };

  publicAPI.getAspectRatio = () => {
    const size = model._parent.getSizeByReference();
    const viewport = model.renderable.getViewportByReference();
    return (
      (size[0] * (viewport[2] - viewport[0])) /
      ((viewport[3] - viewport[1]) * size[1])
    );
  };

  publicAPI.getTiledSizeAndOrigin = () => {
    const vport = model.renderable.getViewportByReference();

    // if there is no window assume 0 1
    const tileViewPort = [0.0, 0.0, 1.0, 1.0];

    // find the lower left corner of the viewport, taking into account the
    // lower left boundary of this tile
    const vpu = vport[0] - tileViewPort[0];
    const vpv = vport[1] - tileViewPort[1];

    // store the result as a pixel value
    const ndvp = model._parent.normalizedDisplayToDisplay(vpu, vpv);
    const lowerLeftU = Math.round(ndvp[0]);
    const lowerLeftV = Math.round(ndvp[1]);

    // find the upper right corner of the viewport, taking into account the
    // lower left boundary of this tile
    const vpu2 = vport[2] - tileViewPort[0];
    const vpv2 = vport[3] - tileViewPort[1];
    const ndvp2 = model._parent.normalizedDisplayToDisplay(vpu2, vpv2);

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
    let clearMask = 0;
    const gl = model.context;

    if (!model.renderable.getTransparent()) {
      const background = model.renderable.getBackgroundByReference();
      // renderable ensures that background has 4 entries.
      gl.clearColor(background[0], background[1], background[2], background[3]);
      clearMask |= gl.COLOR_BUFFER_BIT;
    }

    if (!model.renderable.getPreserveDepthBuffer()) {
      gl.clearDepth(1.0);
      clearMask |= gl.DEPTH_BUFFER_BIT;
      gl.depthMask(true);
    }

    gl.colorMask(true, true, true, true);

    const ts = publicAPI.getTiledSizeAndOrigin();
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(ts.lowerLeftU, ts.lowerLeftV, ts.usize, ts.vsize);
    gl.viewport(ts.lowerLeftU, ts.lowerLeftV, ts.usize, ts.vsize);

    if (clearMask) {
      gl.clear(clearMask);
    }

    gl.enable(gl.DEPTH_TEST);
    /* eslint-enable no-bitwise */
  };

  publicAPI.releaseGraphicsResources = () => {
    if (model.selector !== null) {
      model.selector.releaseGraphicsResources();
    }
    // Releasing resources means that the next render should re-create resources
    if (model.renderable) {
      model.renderable.getViewProps().forEach((prop) => {
        prop.modified();
      });
    }
  };

  publicAPI.setOpenGLRenderWindow = (rw) => {
    if (model._openGLRenderWindow === rw) {
      return;
    }
    publicAPI.releaseGraphicsResources();
    model._openGLRenderWindow = rw;
    model.context = null;
    if (rw) {
      model.context = model._openGLRenderWindow.getContext();
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  context: null,
  _openGLRenderWindow: null,
  selector: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkViewNode.extend(publicAPI, model, initialValues);

  // Build VTK API
  macro.get(publicAPI, model, ['shaderCache']);

  macro.setGet(publicAPI, model, ['selector']);

  macro.moveToProtected(publicAPI, model, ['openGLRenderWindow']);

  // Object methods
  vtkOpenGLRenderer(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkOpenGLRenderer');

// ----------------------------------------------------------------------------

export default { newInstance, extend };

// Register ourself to OpenGL backend if imported
registerOverride('vtkRenderer', newInstance);
