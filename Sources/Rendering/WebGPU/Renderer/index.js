import macro from 'vtk.js/Sources/macro';
import { mat4 } from 'gl-matrix';
import vtkWebGPUBufferManager from 'vtk.js/Sources/Rendering/WebGPU/BufferManager';
import vtkViewNode from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

const { vtkDebugMacro } = macro;
const { BufferUsage } = vtkWebGPUBufferManager;

const vtkWebGPURendererUBOCode = `
[[block]] struct renderVals
{
  [[offset(0)]] WCDCMatrix : mat4x4<f32>;
  [[offset(64)]] WCVCMatrix : mat4x4<f32>;
  [[offset(128)]] VCDCMatrix : mat4x4<f32>;
  [[offset(192)]] WCVCNormals : mat4x4<f32>;
};
[[binding(0), group(0)]] var<uniform> rendererUBO : renderVals;
`;
const vtkWebGPURenderUBOSize = 256 / 4;

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

  publicAPI.getUBOCode = () => vtkWebGPURendererUBOCode;

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
    const device = model.parent.getDevice();
    let needSend = false;

    // make sure the data is up to date
    // has the camera changed?
    const cam = model.renderable.getActiveCamera();
    const utime = model.UBOUpdateTime.getMTime();
    if (
      model.parent.getMTime() > utime ||
      publicAPI.getMTime() > utime ||
      cam.getMTime() > utime ||
      model.renderable.getMTime() > utime
    ) {
      const aspectRatio = publicAPI.getAspectRatio();
      const mat = cam.getCompositeProjectionMatrix(aspectRatio, -1, 1);
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          model.UBOData[i * 4 + j] = mat[j * 4 + i];
        }
      }
      model.UBOData[0] = mat[0];
      model.UBOData[4] = mat[1];
      model.UBOData[8] = mat[2];
      model.UBOData[12] = mat[3];

      model.UBOData[1] = mat[4];
      model.UBOData[5] = mat[5];
      model.UBOData[9] = mat[6];
      model.UBOData[13] = mat[7];

      model.UBOData[2] = 0.5 * mat[8] + 0.5 * mat[12];
      model.UBOData[6] = 0.5 * mat[9] + 0.5 * mat[13];
      model.UBOData[10] = 0.5 * mat[10] + 0.5 * mat[14];
      model.UBOData[14] = 0.5 * mat[11] + 0.5 * mat[15];

      model.UBOData[3] = mat[12];
      model.UBOData[7] = mat[13];
      model.UBOData[11] = mat[14];
      model.UBOData[15] = mat[15];

      mat4.copy(model.tmpMat4, cam.getViewMatrix());
      // zero out translation
      model.tmpMat4[3] = 0.0;
      model.tmpMat4[7] = 0.0;
      model.tmpMat4[11] = 0.0;

      mat4.invert(model.tmpMat4, model.tmpMat4);
      model.UBOData.set(model.tmpMat4, 48);
      // console.log(JSON.stringify(model.UBOData));

      model.UBOUpdateTime.modified();
      needSend = true;
    }

    // make sure the buffer is created
    if (!model.UBO) {
      const req = {
        address: model.UBOData,
        time: 0,
        usage: BufferUsage.UniformArray,
      };
      model.UBO = device.getBufferManager().getBuffer(req);
      model.UBOBindGroup = device.getHandle().createBindGroup({
        layout: device.getRendererBindGroupLayout(),
        entries: [
          {
            binding: 0,
            resource: {
              buffer: model.UBO.getHandle(),
            },
          },
        ],
      });
      needSend = false;
    }

    // send data down if needed
    if (needSend) {
      device
        .getHandle()
        .queue.writeBuffer(
          model.UBO.getHandle(),
          0,
          model.UBOData.buffer,
          model.UBOData.byteOffset,
          model.UBOData.byteLength
        );
    }
  };

  // Renders myself
  publicAPI.opaquePass = (prepass) => {
    if (prepass) {
      const renDesc = model.parent.getSwapChain().getRenderPassDescription();
      if (!model.renderable.getTransparent()) {
        const background = model.renderable.getBackgroundByReference();
        renDesc.colorAttachments[0].loadValue = background;
      } else {
        renDesc.colorAttachments[0].loadValue = [0.0, 0.0, 0.0, 0.0];
      }

      if (!model.renderable.getPreserveDepthBuffer()) {
        renDesc.depthStencilAttachment.depthLoadValue = 1.0;
        renDesc.depthStencilAttachment.depthStoreOp = 'store';
      } else {
        // todo need to handle this case
        // renDesc.depthStencilAttachment.depthStoreOp = 'store';
      }

      // clear last pipelines
      model.pipelineCallbacks = [];

      model.renderPass = model.parent
        .getCommandEncoder()
        .beginRenderPass(renDesc);

      publicAPI.updateUBO();
    } else {
      // loop over registered pipelines
      for (let i = 0; i < model.pipelineCallbacks.length; i++) {
        const pStruct = model.pipelineCallbacks[i];
        const pl = pStruct.pipeline;

        pl.bind(model.renderPass);
        model.renderPass.setBindGroup(0, model.UBOBindGroup);
        // bind our BindGroup
        // set viewport
        const tsize = publicAPI.getTiledSizeAndOrigin();
        model.renderPass.setViewport(
          tsize.lowerLeftU,
          tsize.lowerLeftV,
          tsize.usize,
          tsize.vsize,
          0.0,
          1.0
        );
        // set scissor
        model.renderPass.setScissorRect(
          tsize.lowerLeftU,
          tsize.lowerLeftV,
          tsize.usize,
          tsize.vsize
        );

        // renderPass.setPipeline(renderPipeline);

        for (let cb = 0; cb < pStruct.callbacks.length; cb++) {
          pStruct.callbacks[cb](pl);
        }
      }

      model.renderPass.endPass();
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
  UBOData: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkViewNode.extend(publicAPI, model, initialValues);

  model.UBOData = new Float32Array(vtkWebGPURenderUBOSize);
  model.UBOUpdateTime = {};
  macro.obj(model.UBOUpdateTime);

  model.tmpMat4 = mat4.identity(new Float64Array(16));

  // Build VTK API
  macro.get(publicAPI, model, ['renderPass']);

  macro.setGet(publicAPI, model, ['selector']);

  // Object methods
  vtkWebGPURenderer(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkWebGPURenderer');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
