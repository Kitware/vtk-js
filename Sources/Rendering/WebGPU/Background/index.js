import { mat4 } from 'gl-matrix';

import macro from 'vtk.js/Sources/macros';
import { areEquals } from 'vtk.js/Sources/Common/Core/Math';
import vtkWebGPUFullScreenQuad from 'vtk.js/Sources/Rendering/WebGPU/FullScreenQuad';
import vtkWebGPUUniformBuffer from 'vtk.js/Sources/Rendering/WebGPU/UniformBuffer';

const solidFragTemplate = `
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

const gradientFragTemplate = `
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

  let t = clamp(input.tcoordVS.y, 0.0, 1.0);
  var computedColor: vec4<f32> = mix(mapperUBO.BackgroundColor2, mapperUBO.BackgroundColor, t);

  //VTK::RenderEncoder::Impl
  return output;
}
`;

const textureFragTemplate = `
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

  var computedColor: vec4<f32> = textureSampleLevel(BackgroundTexture, BackgroundTextureSampler, input.tcoordVS, 0.0);

  //VTK::RenderEncoder::Impl
  return output;
}
`;

const environmentFragTemplate = `
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
  var V: vec4<f32> = normalize(mapperUBO.FSQMatrix * tcoord);
  var background = textureSampleLevel(EnvironmentTexture, EnvironmentTextureSampler, vecToRectCoord(V.xyz), 0.0);
  var computedColor: vec4<f32> = vec4<f32>(background.rgb, 1.0);

  //VTK::RenderEncoder::Impl
  return output;
}
`;

const _fsqMat4 = new Float64Array(16);
const _tNormalMat4 = new Float64Array(16);

function vtkWebGPUBackground(publicAPI, model) {
  model.classHierarchy.push('vtkWebGPUBackground');

  publicAPI.getMode = (renderer) => {
    if (
      renderer.getTexturedBackground?.() &&
      renderer.getBackgroundTexture?.().getImageLoaded?.()
    ) {
      return {
        mode: 'texture',
        texture: renderer.getBackgroundTexture(),
        textureName: 'BackgroundTexture',
        pipelineHash: 'backgroundTexture',
      };
    }

    if (
      renderer.getUseEnvironmentTextureAsBackground?.() &&
      renderer.getEnvironmentTexture?.().getImageLoaded?.()
    ) {
      return {
        mode: 'environment',
        texture: renderer.getEnvironmentTexture(),
        textureName: 'EnvironmentTexture',
        pipelineHash: 'backgroundEnvironment',
      };
    }

    const isGradientBackground = renderer.getGradientBackground?.();
    const background = renderer.getBackgroundByReference?.() ?? [0, 0, 0, 1];
    const background2 = renderer.getBackground2ByReference?.() ?? [0, 0, 0];
    const background2rgba = [...background2, 1.0];
    if (isGradientBackground && !areEquals(background, background2rgba)) {
      return {
        mode: 'gradient',
        texture: null,
        textureName: null,
        pipelineHash: 'backgroundGradient',
      };
    }

    return {
      mode: 'solid',
      texture: null,
      textureName: null,
      pipelineHash: 'backgroundSolid',
    };
  };

  publicAPI.ensureQuad = (device) => {
    if (model.quad) {
      return;
    }

    model.quad = vtkWebGPUFullScreenQuad.newInstance();
    model.quad.setDevice(device);

    model.UBO = vtkWebGPUUniformBuffer.newInstance({ label: 'mapperUBO' });
    model.UBO.addEntry('FSQMatrix', 'mat4x4<f32>');
    model.UBO.addEntry('BackgroundColor', 'vec4<f32>');
    model.UBO.addEntry('BackgroundColor2', 'vec4<f32>');
    model.quad.setUBO(model.UBO);
  };

  publicAPI.getFragmentTemplate = (mode) => {
    switch (mode) {
      case 'gradient':
        return gradientFragTemplate;
      case 'texture':
        return textureFragTemplate;
      case 'environment':
        return environmentFragTemplate;
      case 'solid':
      default:
        return solidFragTemplate;
    }
  };

  publicAPI.updateTexture = (device, texture, textureName) => {
    if (!texture || !textureName) {
      model.quad.setTextureViews([]);
      return;
    }

    const webgpuTexture = device
      .getTextureManager()
      .getTextureForVTKTexture(texture, textureName);
    if (!webgpuTexture.getReady()) {
      model.quad.setTextureViews([]);
      return;
    }

    const tview = webgpuTexture.createView(textureName);
    const interpolate = texture.getInterpolate?.() ? 'linear' : 'nearest';
    let options = {
      minFilter: interpolate,
      magFilter: interpolate,
    };
    if (textureName === 'EnvironmentTexture') {
      options = {
        addressModeU: 'repeat',
        addressModeV: 'clamp-to-edge',
        addressModeW: 'repeat',
        minFilter: interpolate,
        magFilter: interpolate,
        mipmapFilter: 'linear',
      };
    }
    tview.addSampler(device, options);
    model.quad.setTextureViews([tview]);
  };

  publicAPI.updateUBO = (device, rendererNode, renderer) => {
    const background = renderer.getBackgroundByReference?.() ?? [0, 0, 0, 1];
    const background2 = renderer.getBackground2ByReference?.() ?? [0, 0, 0];
    model.UBO.setArray('BackgroundColor', background);
    model.UBO.setArray('BackgroundColor2', [...background2, 1.0]);

    const keyMats = model.webgpuCamera.getKeyMatrices(rendererNode);
    mat4.transpose(_tNormalMat4, keyMats.normalMatrix);
    mat4.mul(_fsqMat4, keyMats.scvc, keyMats.pcsc);
    mat4.mul(_fsqMat4, _tNormalMat4, _fsqMat4);
    model.UBO.setArray('FSQMatrix', _fsqMat4);
    model.UBO.sendIfNeeded(device);
  };

  publicAPI.render = (renderEncoder, rendererNode) => {
    const renderer = rendererNode.getRenderable();
    const device = rendererNode.getParent().getDevice();
    publicAPI.ensureQuad(device);

    model.webgpuCamera = rendererNode.getViewNodeFor(
      renderer.getActiveCamera(),
      model.webgpuCamera
    );

    const { mode, texture, textureName, pipelineHash } =
      publicAPI.getMode(renderer);
    model.quad.setPipelineHash(pipelineHash);
    model.quad.setFragmentShaderTemplate(publicAPI.getFragmentTemplate(mode));
    publicAPI.updateTexture(device, texture, textureName);
    publicAPI.updateUBO(device, rendererNode, renderer);
    model.quad.prepareAndDraw(renderEncoder);
  };
}

const DEFAULT_VALUES = {
  quad: null,
  UBO: null,
  webgpuCamera: null,
};

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);
  macro.obj(publicAPI, model);
  vtkWebGPUBackground(publicAPI, model);
}

export const newInstance = macro.newInstance(extend, 'vtkWebGPUBackground');

export default { newInstance, extend };
