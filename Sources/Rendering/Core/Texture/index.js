/* eslint-disable no-bitwise */
import macro from 'vtk.js/Sources/macros';

const { vtkErrorMacro, vtkWarningMacro } = macro;

// ----------------------------------------------------------------------------
// vtkTexture methods
// ----------------------------------------------------------------------------

function vtkTexture(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkTexture');

  publicAPI.imageLoaded = () => {
    model.image.removeEventListener('load', publicAPI.imageLoaded);
    model.imageLoaded = true;
    publicAPI.modified();
  };

  publicAPI.setJsImageData = (imageData) => {
    if (model.jsImageData === imageData) {
      return;
    }

    // clear other entries
    if (imageData !== null) {
      publicAPI.setInputData(null);
      publicAPI.setInputConnection(null);
      model.image = null;
      model.canvas = null;
      model.imageBitmap = null;
    }

    model.jsImageData = imageData;
    model.imageLoaded = true;
    publicAPI.modified();
  };

  publicAPI.setImageBitmap = (imageBitmap) => {
    if (model.imageBitmap === imageBitmap) {
      return;
    }

    // clear other entries
    if (imageBitmap !== null) {
      publicAPI.setInputData(null);
      publicAPI.setInputConnection(null);
      model.image = null;
      model.canvas = null;
      model.jsImageData = null;
    }

    model.imageBitmap = imageBitmap;
    model.imageLoaded = true;

    publicAPI.modified();
  };

  publicAPI.setCanvas = (canvas) => {
    if (model.canvas === canvas) {
      return;
    }

    // clear other entries
    if (canvas !== null) {
      publicAPI.setInputData(null);
      publicAPI.setInputConnection(null);
      model.image = null;
      model.imageBitmap = null;
      model.jsImageData = null;
    }

    model.canvas = canvas;
    publicAPI.modified();
  };

  publicAPI.setImage = (image) => {
    if (model.image === image) {
      return;
    }

    // clear other entries
    if (image !== null) {
      publicAPI.setInputData(null);
      publicAPI.setInputConnection(null);
      model.canvas = null;
      model.jsImageData = null;
      model.imageBitmap = null;
    }

    model.image = image;
    model.imageLoaded = false;

    if (image.complete) {
      publicAPI.imageLoaded();
    } else {
      image.addEventListener('load', publicAPI.imageLoaded);
    }

    publicAPI.modified();
  };

  publicAPI.getDimensionality = () => {
    let width = 0;
    let height = 0;
    let depth = 1;

    if (publicAPI.getInputData()) {
      const data = publicAPI.getInputData();
      width = data.getDimensions()[0];
      height = data.getDimensions()[1];
      depth = data.getDimensions()[2];
    }
    if (model.jsImageData) {
      width = model.jsImageData.width;
      height = model.jsImageData.height;
    }
    if (model.canvas) {
      width = model.canvas.width;
      height = model.canvas.height;
    }
    if (model.image) {
      width = model.image.width;
      height = model.image.height;
    }
    if (model.imageBitmap) {
      width = model.imageBitmap.width;
      height = model.imageBitmap.height;
    }

    const dimensionality = (width > 1) + (height > 1) + (depth > 1);
    return dimensionality;
  };

  publicAPI.getInputAsJsImageData = () => {
    if (!model.imageLoaded || publicAPI.getInputData()) return null;

    if (model.jsImageData) {
      return model.jsImageData;
    }

    if (model.imageBitmap) {
      return model.imageBitmap;
    }

    if (model.canvas) {
      const context = model.canvas.getContext('2d');
      const imageData = context.getImageData(
        0,
        0,
        model.canvas.width,
        model.canvas.height
      );
      return imageData;
    }

    if (model.image) {
      const width = model.image.width;
      const height = model.image.height;
      const canvas = new OffscreenCanvas(width, height);
      const context = canvas.getContext('2d');
      context.translate(0, height);
      context.scale(1, -1);
      context.drawImage(model.image, 0, 0, width, height);
      const imageData = context.getImageData(0, 0, width, height);
      return imageData;
    }

    return null;
  };
}

/**
 * Generates mipmaps for a given GPU texture using a compute shader.
 *
 * This function iteratively generates each mip level for the provided texture,
 * using a bilinear downsampling compute shader implemented in WGSL. It creates
 * the necessary pipeline, bind groups, and dispatches compute passes for each
 * mip level.
 *
 * @param {GPUDevice} device - The WebGPU device used to create resources and submit commands.
 * @param {GPUTexture} texture - The GPU texture for which mipmaps will be generated. Must be created with mip levels.
 * @param {number} mipLevelCount - The total number of mip levels to generate (including the base level).
 */
// Each texture logs a cube map message one time only, because the render
// backends call useCubeMap for each build of the texture.
const cubeMapMessageTextures = new WeakSet();

function logCubeMapMessageOnce(texture, log, message) {
  if (!cubeMapMessageTextures.has(texture)) {
    cubeMapMessageTextures.add(texture);
    log(message);
  }
}

/**
 * Return true when a render backend must upload the texture as a cube map.
 * This is true when the cubeMap flag is set and the six input ports have
 * image data with scalars. Six faces without the cubeMap flag also give a
 * cube map, with a warning, so that code which did not set the flag works.
 */
const useCubeMap = (texture) => {
  let numberOfFaces = 0;
  for (let i = 0; i < 6; i++) {
    if (texture.getInputData(i)?.getPointData().getScalars()) {
      numberOfFaces++;
    }
  }
  if (texture.getCubeMap()) {
    if (numberOfFaces < 6) {
      logCubeMapMessageOnce(
        texture,
        vtkErrorMacro,
        `The texture is a cube map but only ${numberOfFaces} of the 6 faces have image data. The texture is used as a 2D texture.`
      );
      return false;
    }
    return true;
  }
  if (numberOfFaces === 6) {
    logCubeMapMessageOnce(
      texture,
      vtkWarningMacro,
      'The texture has 6 inputs and is used as a cube map. Call setCubeMap(true) on the texture to remove this warning.'
    );
    return true;
  }
  return false;
};

// Color formats that a render pass can write and that sample as float.
// generateMipmaps makes the mip chain of these formats only.
const MIPMAP_FORMATS = new Set([
  'r8unorm',
  'rg8unorm',
  'rgba8unorm',
  'rgba8unorm-srgb',
  'bgra8unorm',
  'bgra8unorm-srgb',
  'rgb10a2unorm',
  'r16float',
  'rg16float',
  'rgba16float',
  'r32float',
  'rg32float',
  'rgba32float',
]);

const canGenerateMipmaps = (format) => MIPMAP_FORMATS.has(format);

// Each output texel is the bilinear mix of the four nearest texels of the
// level above. textureLoad does not need a filtering sampler, so the
// unfilterable float formats work also.
const mipmapShaderCode = `
  struct VertexOutput {
    @builtin(position) position: vec4<f32>,
  };

  @group(0) @binding(0) var inputTexture: texture_2d<f32>;

  @vertex
  fn vertexMain(@builtin(vertex_index) index: u32) -> VertexOutput {
    var positions = array<vec2<f32>, 3>(
      vec2<f32>(-1.0, -1.0),
      vec2<f32>(3.0, -1.0),
      vec2<f32>(-1.0, 3.0)
    );
    var output: VertexOutput;
    output.position = vec4<f32>(positions[index], 0.0, 1.0);
    return output;
  }

  @fragment
  fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
    let inputSize = vec2<i32>(textureDimensions(inputTexture));
    let outputSize = vec2<i32>(max(inputSize / 2, vec2<i32>(1, 1)));
    let scale = vec2<f32>(inputSize) / vec2<f32>(outputSize);
    let srcCoord = input.position.xy * scale - 0.5;

    let x0 = clamp(i32(floor(srcCoord.x)), 0, inputSize.x - 1);
    let x1 = min(x0 + 1, inputSize.x - 1);
    let y0 = clamp(i32(floor(srcCoord.y)), 0, inputSize.y - 1);
    let y1 = min(y0 + 1, inputSize.y - 1);
    let wx = clamp(srcCoord.x - f32(x0), 0.0, 1.0);
    let wy = clamp(srcCoord.y - f32(y0), 0.0, 1.0);

    let c00 = textureLoad(inputTexture, vec2<i32>(x0, y0), 0);
    let c10 = textureLoad(inputTexture, vec2<i32>(x1, y0), 0);
    let c01 = textureLoad(inputTexture, vec2<i32>(x0, y1), 0);
    let c11 = textureLoad(inputTexture, vec2<i32>(x1, y1), 0);
    return mix(mix(c00, c10, wx), mix(c01, c11, wx), wy);
  }
`;

// The pipelines of each GPUDevice, keyed by the texture format
const mipmapPipelines = new WeakMap();

function getMipmapPipeline(device, format) {
  let pipelines = mipmapPipelines.get(device);
  if (!pipelines) {
    const module = device.createShaderModule({
      label: 'MipmapShaderModule',
      code: mipmapShaderCode,
    });
    const bindGroupLayout = device.createBindGroupLayout({
      label: 'MipmapBindGroupLayout',
      entries: [
        {
          binding: 0,
          // eslint-disable-next-line no-undef
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: 'unfilterable-float' },
        },
      ],
    });
    pipelines = { module, bindGroupLayout, byFormat: new Map() };
    mipmapPipelines.set(device, pipelines);
  }
  let pipeline = pipelines.byFormat.get(format);
  if (!pipeline) {
    pipeline = device.createRenderPipeline({
      label: `MipmapPipeline-${format}`,
      layout: device.createPipelineLayout({
        bindGroupLayouts: [pipelines.bindGroupLayout],
      }),
      vertex: { module: pipelines.module, entryPoint: 'vertexMain' },
      fragment: {
        module: pipelines.module,
        entryPoint: 'fragmentMain',
        targets: [{ format }],
      },
      primitive: { topology: 'triangle-list' },
    });
    pipelines.byFormat.set(format, pipeline);
  }
  return pipeline;
}

/**
 * Make the mip levels 1 to mipLevelCount - 1 of a 2D GPUTexture from its
 * level 0. Each array layer (for example each face of a cube map) gets its
 * own mip chain. The texture must have the RENDER_ATTACHMENT and
 * TEXTURE_BINDING usages and a format that canGenerateMipmaps accepts.
 */
const generateMipmaps = (device, texture, mipLevelCount) => {
  if (texture.dimension !== '2d' || !canGenerateMipmaps(texture.format)) {
    vtkErrorMacro(
      `Cannot generate mipmaps of a ${texture.dimension} ${texture.format} texture.`
    );
    return;
  }
  const levelCount = Math.min(mipLevelCount, texture.mipLevelCount);
  if (levelCount < 2) {
    return;
  }
  const pipeline = getMipmapPipeline(device, texture.format);
  const commandEncoder = device.createCommandEncoder({
    label: 'MipmapGenerateCommandEncoder',
  });
  for (let layer = 0; layer < texture.depthOrArrayLayers; layer++) {
    for (let mipLevel = 1; mipLevel < levelCount; mipLevel++) {
      const srcView = texture.createView({
        dimension: '2d',
        baseMipLevel: mipLevel - 1,
        mipLevelCount: 1,
        baseArrayLayer: layer,
        arrayLayerCount: 1,
      });
      const dstView = texture.createView({
        dimension: '2d',
        baseMipLevel: mipLevel,
        mipLevelCount: 1,
        baseArrayLayer: layer,
        arrayLayerCount: 1,
      });
      const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [{ binding: 0, resource: srcView }],
      });
      const renderPass = commandEncoder.beginRenderPass({
        colorAttachments: [
          { view: dstView, loadOp: 'clear', storeOp: 'store' },
        ],
      });
      renderPass.setPipeline(pipeline);
      renderPass.setBindGroup(0, bindGroup);
      renderPass.draw(3);
      renderPass.end();
    }
  }
  device.queue.submit([commandEncoder.finish()]);
};

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  image: null,
  canvas: null,
  jsImageData: null,
  imageBitmap: null,
  imageLoaded: false,
  repeat: false,
  interpolate: false,
  edgeClamp: false,
  mipLevel: 0,
  wrapS: null, // per-axis wrap: 'repeat', 'clamp-to-edge', or 'mirror-repeat'
  wrapT: null,
  wrapR: null,
  // Sampler overrides. null uses the value from interpolate and mipLevel.
  minFilter: null, // 'nearest' or 'linear'
  magFilter: null, // 'nearest' or 'linear'
  mipmapFilter: null, // 'nearest' or 'linear'
  minLOD: null, // lowest mip level to sample, null for 0
  maxLOD: null, // highest mip level to sample, null for the last level
  maxAnisotropy: 1,
  resizable: false, // must be set at construction time if the texture can be resizable
  cubeMap: false, // true: the six input ports are the faces +X, -X, +Y, -Y, +Z, -Z
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.algo(publicAPI, model, 6, 0);

  macro.get(publicAPI, model, [
    'canvas',
    'image',
    'jsImageData',
    'imageBitmap',
    'imageLoaded',
    'resizable',
  ]);

  macro.setGet(publicAPI, model, [
    'repeat',
    'edgeClamp',
    'interpolate',
    'mipLevel',
    'wrapS',
    'wrapT',
    'wrapR',
    'minFilter',
    'magFilter',
    'mipmapFilter',
    'minLOD',
    'maxLOD',
    'maxAnisotropy',
    'cubeMap',
  ]);

  vtkTexture(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkTexture');
export const STATIC = { generateMipmaps, canGenerateMipmaps, useCubeMap };

// ----------------------------------------------------------------------------

export default { newInstance, extend, ...STATIC };
