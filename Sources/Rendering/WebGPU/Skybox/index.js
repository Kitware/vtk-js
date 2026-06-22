import { mat4 } from 'gl-matrix';

import macro from 'vtk.js/Sources/macros';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkViewNode from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';
import vtkWebGPUFullScreenQuad from 'vtk.js/Sources/Rendering/WebGPU/FullScreenQuad';
import vtkWebGPUShaderCache from 'vtk.js/Sources/Rendering/WebGPU/ShaderCache';
import vtkWebGPUTexture from 'vtk.js/Sources/Rendering/WebGPU/Texture';
import vtkWebGPUUniformBuffer from 'vtk.js/Sources/Rendering/WebGPU/UniformBuffer';

import { registerOverride } from 'vtk.js/Sources/Rendering/WebGPU/ViewNodeFactory';

const { VtkDataTypes } = vtkDataArray;
const { vtkErrorMacro } = macro;

const backgroundFragTemplate = `
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

  var computedColor: vec4<f32> = textureSampleLevel(sbtexture, sbtextureSampler, input.tcoordVS, 0.0);

  //VTK::RenderEncoder::Impl
  return output;
}
`;

const boxFragTemplate = `
fn remapCubeCoord(dir: vec3<f32>) -> vec3<f32> {
  var tc = normalize(dir);
  if (abs(tc.z) < max(abs(tc.x), abs(tc.y))) {
    tc = vec3<f32>(1.0, 1.0, -1.0) * tc;
  } else {
    tc = vec3<f32>(-1.0, 1.0, 1.0) * tc;
  }
  return tc;
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

  let clipPos = vec4<f32>(input.vertexVC.xy, 1.0, 1.0);
  let worldPos = mapperUBO.IMCPCMatrix * clipPos;
  let direction = remapCubeCoord(worldPos.xyz / worldPos.w - mapperUBO.CameraPosition.xyz);
  var computedColor: vec4<f32> = textureSampleLevel(sbtexture, sbtextureSampler, direction, 0.0);

  //VTK::RenderEncoder::Impl
  return output;
}
`;

const _imcpc = new Float64Array(16);

function getTextureFormat(dataArray) {
  const numComp = dataArray.getNumberOfComponents();
  let format = 'rgba';

  if (numComp === 1) {
    format = 'r';
  } else if (numComp === 2) {
    format = 'rg';
  }

  switch (dataArray.getDataType()) {
    case VtkDataTypes.UNSIGNED_CHAR:
      return `${format}8unorm`;
    case VtkDataTypes.FLOAT:
    case VtkDataTypes.UNSIGNED_INT:
    case VtkDataTypes.INT:
    case VtkDataTypes.DOUBLE:
    case VtkDataTypes.UNSIGNED_SHORT:
    case VtkDataTypes.SHORT:
    default:
      return `${format}16float`;
  }
}

function flipTextureRowsY(dataArray, width, height, numComponents) {
  const flipped = macro.newTypedArray(
    dataArray.constructor.name,
    dataArray.length
  );
  const rowSize = width * numComponents;

  for (let y = 0; y < height; ++y) {
    const dstOffset = y * rowSize;
    const srcOffset = (height - y - 1) * rowSize;
    flipped.set(dataArray.subarray(srcOffset, srcOffset + rowSize), dstOffset);
  }

  return flipped;
}

function vtkWebGPUSkybox(publicAPI, model) {
  model.classHierarchy.push('vtkWebGPUSkybox');

  function getTextureInterpolation(texture) {
    return texture.getInterpolate?.() ? 'linear' : 'nearest';
  }

  function getCachedTextureView(device, texture, webgpuTexture, format) {
    const interpolate = getTextureInterpolation(texture);

    if (format === 'background') {
      if (
        model.backgroundTextureView &&
        model.backgroundWebGPUTexture === webgpuTexture &&
        model.backgroundInterpolate === interpolate
      ) {
        return model.backgroundTextureView;
      }

      const tview = webgpuTexture.createView('sbtexture');
      tview.addSampler(device, {
        minFilter: interpolate,
        magFilter: interpolate,
      });
      model.backgroundWebGPUTexture = webgpuTexture;
      model.backgroundInterpolate = interpolate;
      model.backgroundTextureView = tview;
      return tview;
    }

    if (
      model.boxTextureView &&
      model.boxWebGPUTexture === webgpuTexture &&
      model.boxInterpolate === interpolate
    ) {
      return model.boxTextureView;
    }

    const tview = webgpuTexture.createView('sbtexture', {
      dimension: 'cube',
    });
    tview.addSampler(device, {
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
      addressModeW: 'clamp-to-edge',
      minFilter: interpolate,
      magFilter: interpolate,
    });
    model.boxWebGPUTexture = webgpuTexture;
    model.boxInterpolate = interpolate;
    model.boxTextureView = tview;
    return tview;
  }

  publicAPI.buildPass = (prepass) => {
    if (prepass) {
      model.WebGPURenderer =
        publicAPI.getFirstAncestorOfType('vtkWebGPURenderer');
      model.WebGPURenderWindow = model.WebGPURenderer?.getFirstAncestorOfType(
        'vtkWebGPURenderWindow'
      );

      if (model.WebGPURenderer) {
        const renderer = model.WebGPURenderer.getRenderable();
        model.webgpuCamera = model.WebGPURenderer.getViewNodeFor(
          renderer.getActiveCamera(),
          model.webgpuCamera
        );
      }
    }
  };

  publicAPI.queryPass = (prepass, renderPass) => {
    if (prepass) {
      if (!model.renderable || !model.renderable.getVisibility()) {
        return;
      }
      renderPass.incrementOpaqueActorCount();
    }
  };

  publicAPI.ensureQuad = (device) => {
    if (model.quad) {
      return;
    }

    model.quad = vtkWebGPUFullScreenQuad.newInstance();
    model.quad.setDevice(device);
    model.quad.setWebGPURenderer(model.WebGPURenderer);

    model.UBO = vtkWebGPUUniformBuffer.newInstance({ label: 'mapperUBO' });
    model.UBO.addEntry('IMCPCMatrix', 'mat4x4<f32>');
    model.UBO.addEntry('CameraPosition', 'vec4<f32>');
    model.quad.setUBO(model.UBO);

    const replaceSkyboxShaderPosition = (hash, pipeline) => {
      const vDesc = pipeline.getShaderDescription('vertex');
      vDesc.addBuiltinOutput('vec4<f32>', '@builtin(position) Position');
      if (!vDesc.hasOutput('vertexVC')) {
        vDesc.addOutput('vec4<f32>', 'vertexVC');
      }
      if (!vDesc.hasOutput('tcoordVS')) {
        vDesc.addOutput('vec2<f32>', 'tcoordVS');
      }

      let code = vDesc.getCode();
      code = vtkWebGPUShaderCache.substitute(code, '//VTK::Position::Impl', [
        'output.tcoordVS = vec2<f32>(vertexBC.x * 0.5 + 0.5, vertexBC.y * 0.5 + 0.5);',
        'output.Position = vec4<f32>(vertexBC.x, vertexBC.y, 1.0, 1.0);',
        'output.vertexVC = vec4<f32>(vertexBC.x, vertexBC.y, 1.0, 1.0);',
      ]).result;
      vDesc.setCode(code);
    };
    model.quad
      .getShaderReplacements()
      .set('replaceShaderPosition', replaceSkyboxShaderPosition);
  };

  publicAPI.getTexture = () => model.renderable.getTextures?.()?.[0] ?? null;

  publicAPI.getCubeTextureHash = (texture) => {
    let hash = `${texture.getMTime()}-skybox-cube`;
    for (let i = 0; i < 6; i++) {
      const imageData = texture.getInputData(i);
      if (!imageData) {
        return null;
      }

      hash += `-${imageData.getMTime()}`;
      const scalars = imageData.getPointData().getScalars();
      if (scalars) {
        hash += `-${scalars.getMTime()}`;
      }
    }
    return hash;
  };

  publicAPI.getCubeTexture = (device, texture) => {
    const hash = publicAPI.getCubeTextureHash(texture);
    if (!hash) {
      return null;
    }

    return device.getCachedObject(hash, () => {
      const firstImage = texture.getInputData(0);
      const firstScalars = firstImage.getPointData().getScalars();
      const dims = firstImage.getDimensions();
      const webgpuTexture = vtkWebGPUTexture.newInstance({
        label: 'sbtexture',
      });
      webgpuTexture.create(device, {
        width: dims[0],
        height: dims[1],
        depth: 6,
        dimension: '2d',
        format: getTextureFormat(firstScalars),
      });

      for (let i = 0; i < 6; i++) {
        const imageData = texture.getInputData(i);
        const faceDims = imageData.getDimensions();
        const scalars = imageData.getPointData().getScalars();
        const faceData = flipTextureRowsY(
          scalars.getData(),
          faceDims[0],
          faceDims[1],
          scalars.getNumberOfComponents()
        );
        webgpuTexture.writeImageData({
          nativeArray: faceData,
          width: faceDims[0],
          height: faceDims[1],
          depth: 1,
          originZ: i,
        });
      }

      return webgpuTexture;
    });
  };

  publicAPI.updateTexture = (device) => {
    const texture = publicAPI.getTexture();
    if (!texture) {
      model.quad.setTextureViews([]);
      return false;
    }

    if (model.renderable.getFormat() === 'background') {
      const webgpuTexture = device
        .getTextureManager()
        .getTextureForVTKTexture(texture, 'sbtexture');
      if (!webgpuTexture.getReady()) {
        model.quad.setTextureViews([]);
        return false;
      }

      const tview = getCachedTextureView(
        device,
        texture,
        webgpuTexture,
        'background'
      );
      model.quad.setTextureViews([tview]);
      return true;
    }

    if (model.renderable.getFormat() === 'box') {
      const webgpuTexture = publicAPI.getCubeTexture(device, texture);
      if (!webgpuTexture?.getReady()) {
        model.quad.setTextureViews([]);
        return false;
      }

      const tview = getCachedTextureView(device, texture, webgpuTexture, 'box');
      model.quad.setTextureViews([tview]);
      return true;
    }

    vtkErrorMacro(
      `Unsupported vtkSkybox format ${model.renderable.getFormat()}`
    );
    model.quad.setTextureViews([]);
    return false;
  };

  publicAPI.updateUBO = (device) => {
    const camera = model.WebGPURenderer.getRenderable().getActiveCamera();
    const keyMats = model.webgpuCamera.getKeyMatrices(model.WebGPURenderer);
    const stabilizedCenter =
      model.WebGPURenderer.getStabilizedCenterByReference();
    mat4.copy(_imcpc, keyMats.pcsc);
    model.UBO.setArray('IMCPCMatrix', _imcpc);
    model.UBO.setArray('CameraPosition', [
      camera.getPositionByReference()[0] - stabilizedCenter[0],
      camera.getPositionByReference()[1] - stabilizedCenter[1],
      camera.getPositionByReference()[2] - stabilizedCenter[2],
      1.0,
    ]);
    model.UBO.sendIfNeeded(device);
  };

  publicAPI.releaseGraphicsResources = () => {
    model.quad?.releaseGraphicsResources?.();
    model.quad = null;
    model.UBO = null;
    model.backgroundTextureView = null;
    model.backgroundWebGPUTexture = null;
    model.backgroundInterpolate = null;
    model.boxTextureView = null;
    model.boxWebGPUTexture = null;
    model.boxInterpolate = null;
    model.lastFormat = null;
    model.webgpuCamera = null;
    model.WebGPURenderer = null;
    model.WebGPURenderWindow = null;
  };

  publicAPI.opaquePass = (prepass) => {
    if (
      !prepass ||
      !model.renderable ||
      !model.renderable.getVisibility() ||
      model.WebGPURenderer?.getSelector()
    ) {
      return;
    }

    const device = model.WebGPURenderWindow.getDevice();
    publicAPI.ensureQuad(device);
    model.quad.setWebGPURenderer(model.WebGPURenderer);

    const format = model.renderable.getFormat();
    if (model.lastFormat !== format) {
      model.quad.setPipelineHash(`skybox-${format}`);
      model.quad.setFragmentShaderTemplate(
        format === 'background' ? backgroundFragTemplate : boxFragTemplate
      );
      model.lastFormat = format;
    }

    if (!publicAPI.updateTexture(device)) {
      return;
    }

    publicAPI.updateUBO(device);
    model.quad.prepareToDraw(model.WebGPURenderer.getRenderEncoder());
    model.quad.registerDrawCallback(model.WebGPURenderer.getRenderEncoder());
  };
}

const DEFAULT_VALUES = {
  backgroundInterpolate: null,
  backgroundTextureView: null,
  backgroundWebGPUTexture: null,
  boxInterpolate: null,
  boxTextureView: null,
  boxWebGPUTexture: null,
  lastFormat: null,
  quad: null,
  UBO: null,
  webgpuCamera: null,
  WebGPURenderer: null,
  WebGPURenderWindow: null,
};

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkViewNode.extend(publicAPI, model, initialValues);

  vtkWebGPUSkybox(publicAPI, model);
}

export const newInstance = macro.newInstance(extend, 'vtkWebGPUSkybox');

export default { newInstance, extend };

registerOverride('vtkSkybox', newInstance);
