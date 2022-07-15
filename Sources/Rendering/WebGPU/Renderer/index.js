import { vec3, mat4 } from 'gl-matrix';
import * as macro from 'vtk.js/Sources/macros';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkViewNode from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';
import vtkWebGPUBindGroup from 'vtk.js/Sources/Rendering/WebGPU/BindGroup';
import vtkWebGPUFullScreenQuad from 'vtk.js/Sources/Rendering/WebGPU/FullScreenQuad';
import vtkWebGPUStorageBuffer from 'vtk.js/Sources/Rendering/WebGPU/StorageBuffer';
import vtkWebGPUUniformBuffer from 'vtk.js/Sources/Rendering/WebGPU/UniformBuffer';

import { registerOverride } from 'vtk.js/Sources/Rendering/WebGPU/ViewNodeFactory';

const { vtkDebugMacro } = macro;

const clearFragColorTemplate = `
//VTK::Renderer::Dec

//VTK::Mapper::Dec

//VTK::TCoord::Dec

//VTK::RenderEncoder::Dec

//VTK::IOStructs::Dec

@fragment
fn main(
//VTK::IOStructs::Input
)
//VTK::IOStructs::Output
{
  var output: fragmentOutput;

  var computedColor: vec4<f32> = mapperUBO.BackgroundColor;

  //VTK::RenderEncoder::Impl
  return output;
}
`;

const clearFragTextureTemplate = `
fn vecToRectCoord(dir: vec3<f32>) -> vec2<f32> {
  var tau: f32 = 6.28318530718;
  var pi: f32 = 3.14159265359;
  var out: vec2<f32> = vec2<f32>(0.0);

  out.x = atan2(dir.z, dir.x) / tau;
  out.x += 0.5;

  var phix: f32 = length(vec2(dir.x, dir.z));
  out.y = atan2(dir.y, phix) / pi + 0.5;

  return out;
}

//VTK::Renderer::Dec

//VTK::Mapper::Dec

//VTK::TCoord::Dec

//VTK::RenderEncoder::Dec

//VTK::IOStructs::Dec

@fragment
fn main(
//VTK::IOStructs::Input
)
//VTK::IOStructs::Output
{
  var output: fragmentOutput;

  var tcoord: vec4<f32> = vec4<f32>(input.vertexVC.xy, -1, 1);
  var V: vec4<f32> = normalize(mapperUBO.FSQMatrix * tcoord); // vec2<f32>((input.tcoordVS.x - 0.5) * 2, -(input.tcoordVS.y - 0.5) * 2);
  // textureSampleLevel gets rid of some ugly artifacts
  var background = textureSampleLevel(EnvironmentTexture, EnvironmentTextureSampler, vecToRectCoord(V.xyz), 0);
  var computedColor: vec4<f32> = vec4<f32>(background.rgb, 1);

  //VTK::RenderEncoder::Impl
  return output;
}
`;

const _fsqClearMat4 = new Float64Array(16);
const _tNormalMat4 = new Float64Array(16);

// Light type index gives either 0, 1, or 2 which indicates what type of light there is.
// While technically, there are only spot and directional lights, within the CellArrayMapper
// there is a third, positional light. It is technically just a variant of a spot light with
// a cone angle of 90 or above, however certain calculations can be skipped if it is treated
// separately.
// The mappings are shown below:
// 0 -> positional light
// 1 -> directional light
// 2 -> spot light
function getLightTypeIndex(light) {
  if (light.getPositional()) {
    if (light.getConeAngle() >= 90) {
      return 0;
    }
    return 2;
  }
  return 1;
}

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

      model.camera = model.renderable.getActiveCamera();

      publicAPI.updateLights();
      publicAPI.prepareNodes();
      publicAPI.addMissingNode(model.camera);
      publicAPI.addMissingNodes(model.renderable.getViewPropsWithNestedProps());
      publicAPI.removeUnusedNodes();

      model.webgpuCamera = publicAPI.getViewNodeFor(model.camera);
      publicAPI.updateStabilizedMatrix();
    }
  };

  publicAPI.updateStabilizedMatrix = () => {
    // This method is designed to help with floating point
    // issues when rendering datasets that push the limits of
    // resolutions on float.
    //
    // One of the most common cases is when the dataset is located far
    // away from the origin relative to the clipping range we are looking
    // at. For that case we want to perform the floating point sensitive
    // multiplications on the CPU in double. To this end we want the
    // vertex rendering ops to look something like
    //
    // Compute shifted points and load those into the VBO
    // pointCoordsSC = WorldToStabilizedMatrix * pointCoords;
    //
    // In the vertex shader do the following
    // positionVC = StabilizedToDeviceMatrix * ModelToStabilizedMatrix*vertexIn;
    //
    // We use two matrices because it is expensive to change the
    // WorldToStabilized matrix as we have to reupload all pointCoords
    // So that matrix (MCSCMatrix) is fairly static, the Stabilized to
    // Device matrix is the one that gets updated every time the camera
    // changes.
    //
    // The basic idea is that we should translate the data so that
    // when the center of the view frustum moves a lot
    // we recenter it. The center of the view frustum is roughly
    // camPos + dirOfProj*(far + near)*0.5
    const clipRange = model.camera.getClippingRange();
    const pos = model.camera.getPositionByReference();
    const dop = model.camera.getDirectionOfProjectionByReference();
    const center = [];
    const offset = [];
    vec3.scale(offset, dop, 0.5 * (clipRange[0] + clipRange[1]));
    vec3.add(center, pos, offset);
    vec3.sub(offset, center, model.stabilizedCenter);
    const length = vec3.len(offset);
    if (length / (clipRange[1] - clipRange[0]) > model.recenterThreshold) {
      model.stabilizedCenter = center;
      model.stabilizedTime.modified();
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

  publicAPI.updateUBO = () => {
    // make sure the data is up to date
    // has the camera changed?
    const utime = model.UBO.getSendTime();
    if (
      model._parent.getMTime() > utime ||
      publicAPI.getMTime() > utime ||
      model.camera.getMTime() > utime ||
      model.renderable.getMTime() > utime
    ) {
      const keyMats = model.webgpuCamera.getKeyMatrices(publicAPI);
      model.UBO.setArray('WCVCMatrix', keyMats.wcvc);
      model.UBO.setArray('SCPCMatrix', keyMats.scpc);
      model.UBO.setArray('PCSCMatrix', keyMats.pcsc);
      model.UBO.setArray('SCVCMatrix', keyMats.scvc);
      model.UBO.setArray('VCPCMatrix', keyMats.vcpc);
      model.UBO.setArray('WCVCNormals', keyMats.normalMatrix);
      model.UBO.setValue('LightCount', model.renderable.getLights().length);
      model.UBO.setValue(
        'MaxEnvironmentMipLevel',
        model.renderable.getEnvironmentTexture()?.getMipLevel()
      );
      model.UBO.setValue(
        'BackgroundDiffuseStrength',
        model.renderable.getEnvironmentTextureDiffuseStrength()
      );
      model.UBO.setValue(
        'BackgroundSpecularStrength',
        model.renderable.getEnvironmentTextureSpecularStrength()
      );

      const tsize = publicAPI.getYInvertedTiledSizeAndOrigin();
      model.UBO.setArray('viewportSize', [tsize.usize, tsize.vsize]);
      model.UBO.setValue(
        'cameraParallel',
        model.camera.getParallelProjection()
      );

      const device = model._parent.getDevice();
      model.UBO.sendIfNeeded(device);
    }
  };

  publicAPI.updateSSBO = () => {
    const lights = model.renderable.getLights();
    const keyMats = model.webgpuCamera.getKeyMatrices(publicAPI);

    let lightTimeString = `${model.renderable.getMTime()}`;
    for (let i = 0; i < lights.length; i++) {
      lightTimeString += lights[i].getMTime();
    }

    if (lightTimeString !== model.lightTimeString) {
      const lightPosArray = new Float32Array(lights.length * 4);
      const lightDirArray = new Float32Array(lights.length * 4);
      const lightColorArray = new Float32Array(lights.length * 4);
      const lightTypeArray = new Float32Array(lights.length * 4);

      for (let i = 0; i < lights.length; i++) {
        const offset = i * 4;

        // Position
        const viewCoordinatePosition = lights[i].getPosition();
        vec3.transformMat4(
          viewCoordinatePosition,
          viewCoordinatePosition,
          keyMats.wcvc
        );
        // viewCoordinatePosition
        lightPosArray[offset] = viewCoordinatePosition[0];
        lightPosArray[offset + 1] = viewCoordinatePosition[1];
        lightPosArray[offset + 2] = viewCoordinatePosition[2];
        lightPosArray[offset + 3] = 0;

        // Rotation (All are negative to correct for -Z being forward)
        lightDirArray[offset] = -lights[i].getDirection()[0];
        lightDirArray[offset + 1] = -lights[i].getDirection()[1];
        lightDirArray[offset + 2] = -lights[i].getDirection()[2];
        lightDirArray[offset + 3] = 0;

        // Color
        lightColorArray[offset] = lights[i].getColor()[0];
        lightColorArray[offset + 1] = lights[i].getColor()[1];
        lightColorArray[offset + 2] = lights[i].getColor()[2];
        lightColorArray[offset + 3] = lights[i].getIntensity() * 5; // arbitrary multiplication to fix the dullness of low value PBR lights

        // Type
        lightTypeArray[offset] = getLightTypeIndex(lights[i]); // Type
        lightTypeArray[offset + 1] = Math.cos(
          vtkMath.radiansFromDegrees(lights[i].getConeAngle())
        ); // Inner Phi, should probably do some check on these to make sure they dont excede limits
        lightTypeArray[offset + 2] = Math.cos(
          vtkMath.radiansFromDegrees(
            lights[i].getConeAngle() + lights[i].getConeFalloff()
          )
        ); // Outer Phi
        lightTypeArray[offset + 3] = 0;
      }

      // Im not sure how correct this is, but this is what the example does
      // https://kitware.github.io/vtk-js/api/Rendering_WebGPU_VolumePassFSQ.html
      model.SSBO.clearData();
      model.SSBO.setNumberOfInstances(lights.length);

      model.SSBO.addEntry('LightPos', 'vec4<f32>'); // Position
      model.SSBO.addEntry('LightDir', 'vec4<f32>'); // Direction
      model.SSBO.addEntry('LightColor', 'vec4<f32>'); // Color (r, g, b, intensity)
      model.SSBO.addEntry('LightData', 'vec4<f32>'); // Other data (type, etc, etc, etc)

      model.SSBO.setAllInstancesFromArray('LightPos', lightPosArray);
      model.SSBO.setAllInstancesFromArray('LightDir', lightDirArray);
      model.SSBO.setAllInstancesFromArray('LightColor', lightColorArray);
      model.SSBO.setAllInstancesFromArray('LightData', lightTypeArray);

      const device = model._parent.getDevice();
      model.SSBO.send(device);
    }

    model.lightTimeString = lightTimeString;
  };

  publicAPI.scissorAndViewport = (encoder) => {
    const tsize = publicAPI.getYInvertedTiledSizeAndOrigin();
    encoder
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
    encoder
      .getHandle()
      .setScissorRect(
        tsize.lowerLeftU,
        tsize.lowerLeftV,
        tsize.usize,
        tsize.vsize
      );
  };

  publicAPI.bindUBO = (renderEncoder) => {
    renderEncoder.activateBindGroup(model.bindGroup);
  };

  // Renders myself
  publicAPI.opaquePass = (prepass) => {
    if (prepass) {
      model.renderEncoder.begin(model._parent.getCommandEncoder());
      publicAPI.updateUBO();
      publicAPI.updateSSBO();
    } else {
      publicAPI.scissorAndViewport(model.renderEncoder);
      publicAPI.clear();
      model.renderEncoder.end();
    }
  };

  publicAPI.clear = () => {
    if (model.renderable.getTransparent() || model.suppressClear) {
      return;
    }

    const device = model._parent.getDevice();
    // Normal Solid Color
    if (!model.clearFSQ) {
      model.clearFSQ = vtkWebGPUFullScreenQuad.newInstance();
      model.clearFSQ.setDevice(device);
      model.clearFSQ.setPipelineHash('clearfsq');
      model.clearFSQ.setFragmentShaderTemplate(clearFragColorTemplate);
      const ubo = vtkWebGPUUniformBuffer.newInstance({ label: 'mapperUBO' });
      ubo.addEntry('FSQMatrix', 'mat4x4<f32>');
      ubo.addEntry('BackgroundColor', 'vec4<f32>');
      model.clearFSQ.setUBO(ubo);

      model.backgroundTex = model.renderable.getEnvironmentTexture();
    }
    // Textured Background
    if (
      model.clearFSQ.getPipelineHash() !== 'clearfsqwithtexture' &&
      model.renderable.getUseEnvironmentTextureAsBackground() &&
      model.backgroundTex?.getImageLoaded()
    ) {
      model.clearFSQ.setFragmentShaderTemplate(clearFragTextureTemplate);
      const ubo = vtkWebGPUUniformBuffer.newInstance({ label: 'mapperUBO' });
      ubo.addEntry('FSQMatrix', 'mat4x4<f32>');
      ubo.addEntry('BackgroundColor', 'vec4<f32>');
      model.clearFSQ.setUBO(ubo);

      const environmentTextureHash = device
        .getTextureManager()
        .getTextureForVTKTexture(model.backgroundTex);
      if (environmentTextureHash.getReady()) {
        const tview = environmentTextureHash.createView(`EnvironmentTexture`);
        model.clearFSQ.setTextureViews([tview]);
        model.backgroundTexLoaded = true;
        const interpolate = model.backgroundTex.getInterpolate()
          ? 'linear'
          : 'nearest';
        tview.addSampler(device, {
          addressModeU: 'repeat',
          addressModeV: 'clamp-to-edge',
          addressModeW: 'repeat',
          minFilter: interpolate,
          magFilter: interpolate,
          mipmapFilter: 'linear',
        });
      }
      model.clearFSQ.setPipelineHash('clearfsqwithtexture');
    } else if (
      model.clearFSQ.getPipelineHash() === 'clearfsqwithtexture' &&
      !model.renderable.getUseEnvironmentTextureAsBackground()
    ) {
      // In case the mode is changed at runtime
      model.clearFSQ = vtkWebGPUFullScreenQuad.newInstance();
      model.clearFSQ.setDevice(device);
      model.clearFSQ.setPipelineHash('clearfsq');
      model.clearFSQ.setFragmentShaderTemplate(clearFragColorTemplate);
      const ubo = vtkWebGPUUniformBuffer.newInstance({ label: 'mapperUBO' });
      ubo.addEntry('FSQMatrix', 'mat4x4<f32>');
      ubo.addEntry('BackgroundColor', 'vec4<f32>');
      model.clearFSQ.setUBO(ubo);
    }

    const keyMats = model.webgpuCamera.getKeyMatrices(publicAPI);
    const background = model.renderable.getBackgroundByReference();

    model.clearFSQ.getUBO().setArray('BackgroundColor', background);
    mat4.transpose(_tNormalMat4, keyMats.normalMatrix);
    mat4.mul(_fsqClearMat4, keyMats.scvc, keyMats.pcsc);
    mat4.mul(_fsqClearMat4, _tNormalMat4, _fsqClearMat4);
    model.clearFSQ.getUBO().setArray('FSQMatrix', _fsqClearMat4);

    model.clearFSQ.getUBO().sendIfNeeded(device);
    model.clearFSQ.prepareAndDraw(model.renderEncoder);
  };

  publicAPI.translucentPass = (prepass) => {
    if (prepass) {
      model.renderEncoder.begin(model._parent.getCommandEncoder());
    } else {
      publicAPI.scissorAndViewport(model.renderEncoder);
      model.renderEncoder.end();
    }
  };

  publicAPI.volumeDepthRangePass = (prepass) => {
    if (prepass) {
      model.renderEncoder.begin(model._parent.getCommandEncoder());
    } else {
      publicAPI.scissorAndViewport(model.renderEncoder);
      model.renderEncoder.end();
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

  publicAPI.convertToOpenGLDepth = (val) =>
    model.webgpuCamera.convertToOpenGLDepth(val);

  publicAPI.getYInvertedTiledSizeAndOrigin = () => {
    const res = publicAPI.getTiledSizeAndOrigin();
    const size = model._parent.getSizeByReference();
    res.lowerLeftV = size[1] - res.vsize - res.lowerLeftV;
    return res;
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

  publicAPI.getPropFromID = (id) => {
    for (let i = 0; i < model.children.length; i++) {
      const res = model.children[i].getPropID
        ? model.children[i].getPropID()
        : -1;
      if (res === id) {
        return model.children[i];
      }
    }
    return null;
  };

  publicAPI.getStabilizedTime = () => model.stabilizedTime.getMTime();

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
  bindGroup: null,
  selector: null,
  renderEncoder: null,
  recenterThreshold: 20.0,
  suppressClear: false,
  stabilizedCenter: [0.0, 0.0, 0.0],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkViewNode.extend(publicAPI, model, initialValues);

  // UBO
  model.UBO = vtkWebGPUUniformBuffer.newInstance({ label: 'rendererUBO' });
  model.UBO.addEntry('WCVCMatrix', 'mat4x4<f32>');
  model.UBO.addEntry('SCPCMatrix', 'mat4x4<f32>');
  model.UBO.addEntry('PCSCMatrix', 'mat4x4<f32>');
  model.UBO.addEntry('SCVCMatrix', 'mat4x4<f32>');
  model.UBO.addEntry('VCPCMatrix', 'mat4x4<f32>');
  model.UBO.addEntry('WCVCNormals', 'mat4x4<f32>');
  model.UBO.addEntry('viewportSize', 'vec2<f32>');
  model.UBO.addEntry('LightCount', 'i32');
  model.UBO.addEntry('MaxEnvironmentMipLevel', 'f32');
  model.UBO.addEntry('BackgroundDiffuseStrength', 'f32');
  model.UBO.addEntry('BackgroundSpecularStrength', 'f32');
  model.UBO.addEntry('cameraParallel', 'u32');

  // SSBO (Light data)
  model.SSBO = vtkWebGPUStorageBuffer.newInstance({
    label: 'rendererLightSSBO',
  });
  model.lightTimeString = '';

  model.bindGroup = vtkWebGPUBindGroup.newInstance({ label: 'rendererBG' });
  model.bindGroup.setBindables([model.UBO, model.SSBO]);

  model.tmpMat4 = mat4.identity(new Float64Array(16));

  model.stabilizedTime = {};
  macro.obj(model.stabilizedTime, { mtime: 0 });

  // Build VTK API
  macro.get(publicAPI, model, ['bindGroup', 'stabilizedTime']);
  macro.getArray(publicAPI, model, ['stabilizedCenter']);
  macro.setGet(publicAPI, model, [
    'renderEncoder',
    'selector',
    'suppressClear',
    'UBO',
  ]);

  // Object methods
  vtkWebGPURenderer(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkWebGPURenderer');

// ----------------------------------------------------------------------------

export default { newInstance, extend };

// Register ourself to WebGPU backend if imported
registerOverride('vtkRenderer', newInstance);
