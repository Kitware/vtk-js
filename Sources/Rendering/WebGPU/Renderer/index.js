import macro from 'vtk.js/Sources/macro';
import { mat4 } from 'gl-matrix';
import vtkWebGPUUniformBuffer from 'vtk.js/Sources/Rendering/WebGPU/UniformBuffer';
import vtkViewNode from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

const { vtkDebugMacro } = macro;

// ----------------------------------------------------------------------------
// vtkWebGPURenderer methods
// ----------------------------------------------------------------------------
/* eslint-disable no-bitwise */

function vtkWebGPURenderer(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPURenderer');

  // Builds myself.
  publicAPI.buildPass = (prepass) => {
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
      publicAPI.addMissingNodes(model.renderable.getViewPropsWithNestedProps());
      publicAPI.removeUnusedNodes();
    }
  };

  publicAPI.getUBOCode = () => model.UBO.getShaderCode();

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

  // register pipeline callbacks from a mapper
  publicAPI.registerPipelineCallback = (pipeline, cb) => {
    // if there is a matching pipeline just add the cb
    for (let i = 0; i < model.pipelineCallbacks.length; i++) {
      if (model.pipelineCallbacks[i].pipeline === pipeline) {
        model.pipelineCallbacks[i].callbacks.push(cb);
        return;
      }
    }

    model.pipelineCallbacks.push({ pipeline, callbacks: [cb] });
  };

  publicAPI.updateUBO = () => {
    // make sure the data is up to date
    // has the camera changed?
    const cam = model.renderable.getActiveCamera();
    const utime = model.UBO.getSendTime();
    if (
      model.parent.getMTime() > utime ||
      publicAPI.getMTime() > utime ||
      cam.getMTime() > utime ||
      model.renderable.getMTime() > utime
    ) {
      const aspectRatio = publicAPI.getAspectRatio();
      const mat = cam.getCompositeProjectionMatrix(aspectRatio, -1, 1);
      const uboData = model.UBO.getNativeView('WCDCMatrix');
      uboData[0] = mat[0];
      uboData[4] = mat[1];
      uboData[8] = mat[2];
      uboData[12] = mat[3];

      uboData[1] = mat[4];
      uboData[5] = mat[5];
      uboData[9] = mat[6];
      uboData[13] = mat[7];

      uboData[2] = 0.5 * mat[8] + 0.5 * mat[12];
      uboData[6] = 0.5 * mat[9] + 0.5 * mat[13];
      uboData[10] = 0.5 * mat[10] + 0.5 * mat[14];
      uboData[14] = 0.5 * mat[11] + 0.5 * mat[15];

      uboData[3] = mat[12];
      uboData[7] = mat[13];
      uboData[11] = mat[14];
      uboData[15] = mat[15];

      mat4.copy(model.tmpMat4, cam.getViewMatrix());
      // zero out translation
      model.tmpMat4[3] = 0.0;
      model.tmpMat4[7] = 0.0;
      model.tmpMat4[11] = 0.0;

      mat4.invert(model.tmpMat4, model.tmpMat4);
      model.UBO.setArray('WCVCNormals', model.tmpMat4);

      const device = model.parent.getDevice();
      model.UBO.sendIfNeeded(device, device.getRendererBindGroupLayout());
    }
  };

  // Renders myself
  publicAPI.opaquePass = (prepass) => {
    if (prepass) {
      const renDesc = model.renderEncoder.getDescription();
      if (!model.renderable.getTransparent()) {
        const background = model.renderable.getBackgroundByReference();
        renDesc.colorAttachments[0].loadValue = background;
      } else {
        renDesc.colorAttachments[0].loadValue = 'load';
      }

      if (!model.renderable.getPreserveDepthBuffer()) {
        renDesc.depthStencilAttachment.depthLoadValue = 1.0;
      } else {
        renDesc.depthStencilAttachment.depthLoadValue = 'load';
      }

      // clear last pipelines
      model.pipelineCallbacks = [];

      model.renderEncoder.begin(model.parent.getCommandEncoder());

      publicAPI.updateUBO();
    } else {
      // loop over registered pipelines
      for (let i = 0; i < model.pipelineCallbacks.length; i++) {
        const pStruct = model.pipelineCallbacks[i];
        const pl = pStruct.pipeline;

        pl.bind(model.renderEncoder);
        model.renderEncoder.setBindGroup(0, model.UBO.getBindGroup());
        // bind our BindGroup
        // set viewport
        const tsize = publicAPI.getTiledSizeAndOrigin();
        model.renderEncoder
          .getHandle()
          .setViewport(
            tsize.lowerLeftU,
            tsize.lowerLeftV,
            tsize.usize,
            tsize.vsize,
            0.0,
            1.0
          );
        // set scissor
        model.renderEncoder
          .getHandle()
          .setScissorRect(
            tsize.lowerLeftU,
            tsize.lowerLeftV,
            tsize.usize,
            tsize.vsize
          );

        for (let cb = 0; cb < pStruct.callbacks.length; cb++) {
          pStruct.callbacks[cb](pl);
        }
      }

      model.renderEncoder.end();
    }
  };

  publicAPI.translucentPass = (prepass) => {
    if (prepass) {
      // clear last pipelines
      model.pipelineCallbacks = [];

      model.renderEncoder.begin(model.parent.getCommandEncoder());

      publicAPI.updateUBO();
    } else {
      // loop over registered pipelines
      for (let i = 0; i < model.pipelineCallbacks.length; i++) {
        const pStruct = model.pipelineCallbacks[i];
        const pl = pStruct.pipeline;

        pl.bind(model.renderEncoder);
        model.renderEncoder.setBindGroup(0, model.UBO.getBindGroup());
        // bind our BindGroup
        // set viewport
        const tsize = publicAPI.getTiledSizeAndOrigin();
        model.renderEncoder
          .getHandle()
          .setViewport(
            tsize.lowerLeftU,
            tsize.lowerLeftV,
            tsize.usize,
            tsize.vsize,
            0.0,
            1.0
          );
        // set scissor
        model.renderEncoder
          .getHandle()
          .setScissorRect(
            tsize.lowerLeftU,
            tsize.lowerLeftV,
            tsize.usize,
            tsize.vsize
          );

        for (let cb = 0; cb < pStruct.callbacks.length; cb++) {
          pStruct.callbacks[cb](pl);
        }
      }

      model.renderEncoder.end();
    }
  };

  publicAPI.volumePass = (prepass) => {
    if (prepass) {
      // clear last pipelines
      model.pipelineCallbacks = [];

      model.renderEncoder.begin(model.parent.getCommandEncoder());

      publicAPI.updateUBO();
    } else {
      // loop over registered pipelines
      for (let i = 0; i < model.pipelineCallbacks.length; i++) {
        const pStruct = model.pipelineCallbacks[i];
        const pl = pStruct.pipeline;

        pl.bind(model.renderEncoder);
        model.renderEncoder.setBindGroup(0, model.UBO.getBindGroup());
        // bind our BindGroup
        // set viewport
        const tsize = publicAPI.getTiledSizeAndOrigin();
        model.renderEncoder
          .getHandle()
          .setViewport(
            tsize.lowerLeftU,
            tsize.lowerLeftV,
            tsize.usize,
            tsize.vsize,
            0.0,
            1.0
          );
        // set scissor
        model.renderEncoder
          .getHandle()
          .setScissorRect(
            tsize.lowerLeftU,
            tsize.lowerLeftV,
            tsize.usize,
            tsize.vsize
          );

        for (let cb = 0; cb < pStruct.callbacks.length; cb++) {
          pStruct.callbacks[cb](pl);
        }
      }

      model.renderEncoder.end();
    }
  };

  publicAPI.getAspectRatio = () => {
    const size = model.parent.getSizeByReference();
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
    if (vpu2 > tileViewPort[2] - tileViewPort[0]) {
      vpu2 = tileViewPort[2] - tileViewPort[0];
    }
    if (vpv2 > tileViewPort[3] - tileViewPort[1]) {
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
    // const ts = publicAPI.getTiledSizeAndOrigin();
    // gl.enable(gl.SCISSOR_TEST);
    // gl.scissor(ts.lowerLeftU, ts.lowerLeftV, ts.usize, ts.vsize);
    // gl.viewport(ts.lowerLeftU, ts.lowerLeftV, ts.usize, ts.vsize);
    // gl.clear(clearMask);
    // gl.enable(gl.DEPTH_TEST);
    /* eslint-enable no-bitwise */
  };

  publicAPI.getPropFromID = (id) => {
    for (let i = 0; i < model.children.length; i++) {
      const res = model.children[i].getPropID();
      if (res === id) {
        return model.children[i];
      }
    }
    return null;
  };

  publicAPI.releaseGraphicsResources = () => {
    if (model.selector !== null) {
      model.selector.releaseGraphicsResources();
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  context: null,
  selector: null,
  renderEncoder: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkViewNode.extend(publicAPI, model, initialValues);

  model.UBO = vtkWebGPUUniformBuffer.newInstance();
  model.UBO.setBinding(0);
  model.UBO.setGroup(0);
  model.UBO.setName('rendererUBO');
  model.UBO.addEntry('WCDCMatrix', 'mat4x4<f32>');
  model.UBO.addEntry('WCVCMatrix', 'mat4x4<f32>');
  model.UBO.addEntry('VCDCMatrix', 'mat4x4<f32>');
  model.UBO.addEntry('WCVCNormals', 'mat4x4<f32>');

  model.tmpMat4 = mat4.identity(new Float64Array(16));

  // Build VTK API
  macro.setGet(publicAPI, model, ['renderEncoder', 'selector', 'UBO']);

  // Object methods
  vtkWebGPURenderer(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkWebGPURenderer');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
