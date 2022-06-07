import macro from 'vtk.js/Sources/macros';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkProperty from 'vtk.js/Sources/Rendering/Core/Property';
import vtkRenderPass from 'vtk.js/Sources/Rendering/SceneGraph/RenderPass';
import vtkWebGPUBufferManager from 'vtk.js/Sources/Rendering/WebGPU/BufferManager';
import vtkWebGPUSimpleMapper from 'vtk.js/Sources/Rendering/WebGPU/SimpleMapper';
import vtkWebGPURenderEncoder from 'vtk.js/Sources/Rendering/WebGPU/RenderEncoder';
import vtkWebGPUShaderCache from 'vtk.js/Sources/Rendering/WebGPU/ShaderCache';
import vtkWebGPUTexture from 'vtk.js/Sources/Rendering/WebGPU/Texture';
import vtkWebGPUUniformBuffer from 'vtk.js/Sources/Rendering/WebGPU/UniformBuffer';
import vtkWebGPUFullScreenQuad from 'vtk.js/Sources/Rendering/WebGPU/FullScreenQuad';
import vtkWebGPUVolumePassFSQ from 'vtk.js/Sources/Rendering/WebGPU/VolumePassFSQ';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

const { Representation } = vtkProperty;
const { BufferUsage, PrimitiveTypes } = vtkWebGPUBufferManager;

// The volume rendering pass consists of two sub passes. The first
// (depthRange) renders polygonal cubes for the volumes to compute min and
// max bounds in depth for the image. This is then fed into the second pass
// (final) which actually does the raycasting between those bounds sampling
// the volumes along the way. So the first pass tends to be very fast whicle
// the second is where most of the work is done.

// given x then y then z ordering
//
//     2-----3
//   / |   / |
//  6-----7  |
//  |  |  |  |
//  |  0-----1
//  |/    |/
//  4-----5
//
const cubeFaceTriangles = [
  [0, 4, 6],
  [0, 6, 2],
  [1, 3, 7],
  [1, 7, 5],
  [0, 5, 4],
  [0, 1, 5],
  [2, 6, 7],
  [2, 7, 3],
  [0, 3, 1],
  [0, 2, 3],
  [4, 5, 7],
  [4, 7, 6],
];

const DepthBoundsFS = `
//VTK::Renderer::Dec

//VTK::Select::Dec

//VTK::VolumePass::Dec

//VTK::TCoord::Dec

//VTK::RenderEncoder::Dec

//VTK::Mapper::Dec

//VTK::IOStructs::Dec

@stage(fragment)
fn main(
//VTK::IOStructs::Input
)
//VTK::IOStructs::Output
{
  var output : fragmentOutput;

  //VTK::Select::Impl

  //VTK::TCoord::Impl

  //VTK::VolumePass::Impl

  // use the maximum (closest) of the current value and the zbuffer
  // the blend func will then take the min to find the farthest stop value
  var stopval: f32 = max(input.fragPos.z, textureLoad(opaquePassDepthTexture, vec2<i32>(i32(input.fragPos.x), i32(input.fragPos.y)), 0));

  //VTK::RenderEncoder::Impl
  return output;
}
`;

const volumeCopyFragTemplate = `
//VTK::Renderer::Dec

//VTK::Mapper::Dec

//VTK::TCoord::Dec

//VTK::RenderEncoder::Dec

//VTK::IOStructs::Dec

@stage(fragment)
fn main(
//VTK::IOStructs::Input
)
//VTK::IOStructs::Output
{
  var output: fragmentOutput;

  var computedColor: vec4<f32> = textureSample(volumePassColorTexture,
    volumePassColorTextureSampler, mapperUBO.tscale*input.tcoordVS);

  //VTK::RenderEncoder::Impl
  return output;
}
`;

/* eslint-disable no-undef */
/* eslint-disable no-bitwise */

// ----------------------------------------------------------------------------

function vtkWebGPUVolumePass(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUVolumePass');

  // create the required textures, encoders, FSQ etc
  publicAPI.initialize = (viewNode) => {
    if (!model._clearEncoder) {
      publicAPI.createClearEncoder(viewNode);
    }

    if (!model._mergeEncoder) {
      publicAPI.createMergeEncoder(viewNode);
    }

    if (!model._copyEncoder) {
      publicAPI.createCopyEncoder(viewNode);
    }

    if (!model._depthRangeEncoder) {
      publicAPI.createDepthRangeEncoder(viewNode);
    }

    if (!model.fullScreenQuad) {
      model.fullScreenQuad = vtkWebGPUVolumePassFSQ.newInstance();
      model.fullScreenQuad.setDevice(viewNode.getDevice());
      model.fullScreenQuad.setTextureViews([
        ...model._depthRangeEncoder.getColorTextureViews(),
      ]);
    }

    if (!model._volumeCopyQuadQuad) {
      model._volumeCopyQuad = vtkWebGPUFullScreenQuad.newInstance();
      model._volumeCopyQuad.setPipelineHash('volpassfsq');
      model._volumeCopyQuad.setDevice(viewNode.getDevice());
      model._volumeCopyQuad.setFragmentShaderTemplate(volumeCopyFragTemplate);
      model._copyUBO = vtkWebGPUUniformBuffer.newInstance({
        label: 'mapperUBO',
      });
      model._copyUBO.addEntry('tscale', 'vec2<f32>');
      model._volumeCopyQuad.setUBO(model._copyUBO);
      model._volumeCopyQuad.setTextureViews([model._colorTextureView]);
    }
  };

  publicAPI.traverse = (renNode, viewNode) => {
    if (model.deleted) {
      return;
    }

    // we just render our delegates in order
    model.currentParent = viewNode;

    // create stuff we need
    publicAPI.initialize(viewNode);

    // determine if we are rendering a small size
    publicAPI.computeTiming(viewNode);

    // first render the boxes to generate a min max depth
    // map for all the volumes
    publicAPI.renderDepthBounds(renNode, viewNode);

    // always mark true
    model._firstGroup = true;

    const device = viewNode.getDevice();

    // determine how many volumes we can render at a time. We subtract
    // 4 because we use know we use textures for min, max, ofun and tfun
    const maxVolumes =
      device.getHandle().limits.maxSampledTexturesPerShaderStage - 4;

    // if we have to make multiple passes then break the volumes up into groups
    // rendered from farthest to closest
    if (model.volumes.length > maxVolumes) {
      const cameraPos = renNode.getRenderable().getActiveCamera().getPosition();
      // sort from back to front based on volume centroid
      const distances = [];
      for (let v = 0; v < model.volumes.length; v++) {
        const bounds = model.volumes[v].getRenderable().getBounds();
        const centroid = [
          0.5 * (bounds[1] + bounds[0]),
          0.5 * (bounds[3] + bounds[2]),
          0.5 * (bounds[5] + bounds[4]),
        ];
        distances[v] = vtkMath.distance2BetweenPoints(centroid, cameraPos);
      }

      // sort by distance
      const volumeOrder = [...Array(model.volumes.length).keys()];
      volumeOrder.sort((a, b) => distances[b] - distances[a]);

      // render in chunks back to front
      let volumesToRender = [];
      // start with smallest chunk so that the last (closest) chunk
      // has a full maxVolumes;
      let chunkSize = volumeOrder.length % maxVolumes;
      for (let v = 0; v < volumeOrder.length; v++) {
        volumesToRender.push(model.volumes[volumeOrder[v]]);
        if (volumesToRender.length >= chunkSize) {
          publicAPI.rayCastPass(viewNode, renNode, volumesToRender);
          volumesToRender = [];
          chunkSize = maxVolumes;
          model._firstGroup = false;
        }
      }
    } else {
      // if not rendering in chunks then just draw all of them at once
      publicAPI.rayCastPass(viewNode, renNode, model.volumes);
    }

    // copy back to the original color buffer

    // final composite
    model._volumeCopyQuad.setWebGPURenderer(renNode);
    if (model._useSmallViewport) {
      const width = model._colorTextureView.getTexture().getWidth();
      const height = model._colorTextureView.getTexture().getHeight();
      model._copyUBO.setArray('tscale', [
        model._smallViewportWidth / width,
        model._smallViewportHeight / height,
      ]);
    } else {
      model._copyUBO.setArray('tscale', [1.0, 1.0]);
    }
    model._copyUBO.sendIfNeeded(device);

    model._copyEncoder.setColorTextureView(0, model.colorTextureView);
    model._copyEncoder.attachTextureViews();

    model._copyEncoder.begin(viewNode.getCommandEncoder());
    renNode.scissorAndViewport(model._copyEncoder);
    model._volumeCopyQuad.prepareAndDraw(model._copyEncoder);
    model._copyEncoder.end();
  };

  // unsubscribe from our listeners
  publicAPI.delete = macro.chain(() => {
    if (model._animationRateSubscription) {
      model._animationRateSubscription.unsubscribe();
      model._animationRateSubscription = null;
    }
  }, publicAPI.delete);

  publicAPI.computeTiming = (viewNode) => {
    model._useSmallViewport = false;
    const rwi = viewNode.getRenderable().getInteractor();

    if (rwi.isAnimating() && model._lastScale > 1.5) {
      if (!model._smallViewportHeight) {
        model._smallViewportWidth = Math.ceil(
          viewNode.getCanvas().width / Math.sqrt(model._lastScale)
        );
        model._smallViewportHeight = Math.ceil(
          viewNode.getCanvas().height / Math.sqrt(model._lastScale)
        );
      }
      model._useSmallViewport = true;
    }

    model._colorTexture.resize(
      viewNode.getCanvas().width,
      viewNode.getCanvas().height
    );

    if (!model._animationRateSubscription) {
      // when the animation frame rate changes recompute the scale factor
      model._animationRateSubscription = rwi.onAnimationFrameRateUpdate(() => {
        const firstMapper = model.volumes[0].getRenderable().getMapper();
        if (firstMapper.getAutoAdjustSampleDistances()) {
          const frate = rwi.getRecentAnimationFrameRate();
          const targetScale =
            (model._lastScale * rwi.getDesiredUpdateRate()) / frate;

          model._lastScale = targetScale;
          // clamp scale to some reasonable values.
          // Below 1.5 we will just be using full resolution as that is close enough
          // Above 400 seems like a lot so we limit to that 1/20th per axis
          if (model._lastScale > 400) {
            model._lastScale = 400;
          }
        } else {
          model._lastScale =
            firstMapper.getImageSampleDistance() *
            firstMapper.getImageSampleDistance();
        }
        if (model._lastScale < 1.5) {
          model._lastScale = 1.5;
        } else {
          model._smallViewportWidth = Math.ceil(
            viewNode.getCanvas().width / Math.sqrt(model._lastScale)
          );
          model._smallViewportHeight = Math.ceil(
            viewNode.getCanvas().height / Math.sqrt(model._lastScale)
          );
        }
      });
    }
  };

  publicAPI.rayCastPass = (viewNode, renNode, volumes) => {
    const encoder = model._firstGroup
      ? model._clearEncoder
      : model._mergeEncoder;
    encoder.attachTextureViews();
    encoder.begin(viewNode.getCommandEncoder());
    let width = model._colorTextureView.getTexture().getWidth();
    let height = model._colorTextureView.getTexture().getHeight();
    if (model._useSmallViewport) {
      width = model._smallViewportWidth;
      height = model._smallViewportHeight;
    }
    encoder.getHandle().setViewport(0, 0, width, height, 0.0, 1.0);
    // set scissor
    encoder.getHandle().setScissorRect(0, 0, width, height);

    model.fullScreenQuad.setWebGPURenderer(renNode);
    model.fullScreenQuad.setVolumes(volumes);
    model.fullScreenQuad.prepareAndDraw(encoder);
    encoder.end();
  };

  publicAPI.renderDepthBounds = (renNode, viewNode) => {
    publicAPI.updateDepthPolyData(renNode);

    const pd = model._boundsPoly;
    const points = pd.getPoints();
    const cells = pd.getPolys();

    let buffRequest = {
      hash: `vp${cells.getMTime()}`,
      usage: BufferUsage.Index,
      cells,
      numberOfPoints: points.getNumberOfPoints(),
      primitiveType: PrimitiveTypes.Triangles,
      representation: Representation.SURFACE,
    };
    const indexBuffer = viewNode
      .getDevice()
      .getBufferManager()
      .getBuffer(buffRequest);
    model._mapper.getVertexInput().setIndexBuffer(indexBuffer);

    // points
    buffRequest = {
      usage: BufferUsage.PointArray,
      format: 'float32x4',
      hash: `vp${points.getMTime()}${cells.getMTime()}`,
      dataArray: points,
      indexBuffer,
      packExtra: true,
    };
    const buff = viewNode.getDevice().getBufferManager().getBuffer(buffRequest);
    model._mapper.getVertexInput().addBuffer(buff, ['vertexBC']);
    model._mapper.setNumberOfVertices(
      buff.getSizeInBytes() / buff.getStrideInBytes()
    );

    publicAPI.drawDepthRange(renNode, viewNode);
  };

  publicAPI.updateDepthPolyData = (renNode) => {
    // check mtimes first
    let update = false;
    for (let i = 0; i < model.volumes.length; i++) {
      const mtime = model.volumes[i].getMTime();
      if (!model._lastMTimes[i] || mtime !== model._lastMTimes[i]) {
        update = true;
        model._lastMTimes[i] = mtime;
      }
    }

    // also check stabilized time
    const stime = renNode.getStabilizedTime();
    if (
      model._lastMTimes.length <= model.volumes.length ||
      stime !== model._lastMTimes[model.volumes.length]
    ) {
      update = true;
      model._lastMTimes[model.volumes.length] = stime;
    }

    // if no need to update then return
    if (!update) {
      return;
    }

    // rebuild
    const center = renNode.getStabilizedCenterByReference();
    const numPts = model.volumes.length * 8;
    const points = new Float64Array(numPts * 3);
    const numTris = model.volumes.length * 12;
    const polys = new Uint16Array(numTris * 4);

    // add points and cells
    for (let i = 0; i < model.volumes.length; i++) {
      model.volumes[i].getBoundingCubePoints(points, i * 24);
      let cellIdx = i * 12 * 4;
      const offset = i * 8;
      for (let t = 0; t < 12; t++) {
        polys[cellIdx++] = 3;
        polys[cellIdx++] = offset + cubeFaceTriangles[t][0];
        polys[cellIdx++] = offset + cubeFaceTriangles[t][1];
        polys[cellIdx++] = offset + cubeFaceTriangles[t][2];
      }
    }

    for (let p = 0; p < points.length; p += 3) {
      points[p] -= center[0];
      points[p + 1] -= center[1];
      points[p + 2] -= center[2];
    }

    model._boundsPoly.getPoints().setData(points, 3);
    model._boundsPoly.getPoints().modified();
    model._boundsPoly.getPolys().setData(polys, 1);
    model._boundsPoly.getPolys().modified();
    model._boundsPoly.modified();
  };

  publicAPI.drawDepthRange = (renNode, viewNode) => {
    // copy current depth buffer to
    model._depthRangeTexture.resizeToMatch(model.colorTextureView.getTexture());
    model._depthRangeTexture2.resizeToMatch(
      model.colorTextureView.getTexture()
    );

    model._depthRangeEncoder.attachTextureViews();

    publicAPI.setCurrentOperation('volumeDepthRangePass');
    renNode.setRenderEncoder(model._depthRangeEncoder);
    renNode.volumeDepthRangePass(true);
    model._mapper.setWebGPURenderer(renNode);

    model._mapper.prepareToDraw(model._depthRangeEncoder);
    model._mapper.registerDrawCallback(model._depthRangeEncoder);

    renNode.volumeDepthRangePass(false);
  };

  publicAPI.createDepthRangeEncoder = (viewNode) => {
    const device = viewNode.getDevice();
    model._depthRangeEncoder = vtkWebGPURenderEncoder.newInstance({
      label: 'VolumePass DepthRange',
    });
    model._depthRangeEncoder.setPipelineHash('volr');
    model._depthRangeEncoder.setReplaceShaderCodeFunction((pipeline) => {
      const fDesc = pipeline.getShaderDescription('fragment');
      fDesc.addOutput('vec4<f32>', 'outColor1');
      fDesc.addOutput('vec4<f32>', 'outColor2');
      let code = fDesc.getCode();
      code = vtkWebGPUShaderCache.substitute(
        code,
        '//VTK::RenderEncoder::Impl',
        [
          'output.outColor1 = vec4<f32>(input.fragPos.z, 0.0, 0.0, 0.0);',
          'output.outColor2 = vec4<f32>(stopval, 0.0, 0.0, 0.0);',
        ]
      ).result;
      fDesc.setCode(code);
    });
    model._depthRangeEncoder.setDescription({
      colorAttachments: [
        {
          view: null,
          clearValue: [0.0, 0.0, 0.0, 0.0],
          loadOp: 'clear',
          storeOp: 'store',
        },
        {
          view: null,
          clearValue: [1.0, 1.0, 1.0, 1.0],
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    });
    model._depthRangeEncoder.setPipelineSettings({
      primitive: { cullMode: 'none' },
      fragment: {
        targets: [
          {
            format: 'r16float',
            blend: {
              color: {
                srcFactor: 'one',
                dstFactor: 'one',
                operation: 'max',
              },
              alpha: { srcfactor: 'one', dstFactor: 'one', operation: 'max' },
            },
          },
          {
            format: 'r16float',
            blend: {
              color: {
                srcFactor: 'one',
                dstFactor: 'one',
                operation: 'min',
              },
              alpha: { srcfactor: 'one', dstFactor: 'one', operation: 'min' },
            },
          },
        ],
      },
    });

    // and the textures it needs
    model._depthRangeTexture = vtkWebGPUTexture.newInstance({
      label: 'volumePassMaxDepth',
    });
    model._depthRangeTexture.create(device, {
      width: viewNode.getCanvas().width,
      height: viewNode.getCanvas().height,
      format: 'r16float',
      usage:
        GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
    const maxView = model._depthRangeTexture.createView('maxTexture');
    model._depthRangeEncoder.setColorTextureView(0, maxView);
    model._depthRangeTexture2 = vtkWebGPUTexture.newInstance({
      label: 'volumePassDepthMin',
    });
    model._depthRangeTexture2.create(device, {
      width: viewNode.getCanvas().width,
      height: viewNode.getCanvas().height,
      format: 'r16float',
      usage:
        GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
    const minView = model._depthRangeTexture2.createView('minTexture');
    model._depthRangeEncoder.setColorTextureView(1, minView);
    model._mapper.setDevice(viewNode.getDevice());
    model._mapper.setTextureViews([model.depthTextureView]);
  };

  publicAPI.createClearEncoder = (viewNode) => {
    model._colorTexture = vtkWebGPUTexture.newInstance({
      label: 'volumePassColor',
    });
    model._colorTexture.create(viewNode.getDevice(), {
      width: viewNode.getCanvas().width,
      height: viewNode.getCanvas().height,
      format: 'bgra8unorm',
      /* eslint-disable no-undef */
      /* eslint-disable no-bitwise */
      usage:
        GPUTextureUsage.RENDER_ATTACHMENT |
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_SRC,
    });
    model._colorTextureView = model._colorTexture.createView(
      'volumePassColorTexture'
    );
    model._colorTextureView.addSampler(viewNode.getDevice(), {
      minFilter: 'linear',
      magFilter: 'linear',
    });

    model._clearEncoder = vtkWebGPURenderEncoder.newInstance({
      label: 'VolumePass Clear',
    });
    model._clearEncoder.setColorTextureView(0, model._colorTextureView);
    model._clearEncoder.setDescription({
      colorAttachments: [
        {
          view: null,
          clearValue: [0.0, 0.0, 0.0, 0.0],
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    });
    model._clearEncoder.setPipelineHash('volpf');
    model._clearEncoder.setPipelineSettings({
      primitive: { cullMode: 'none' },
      fragment: {
        targets: [
          {
            format: 'bgra8unorm',
            blend: {
              color: {
                srcFactor: 'src-alpha',
                dstFactor: 'one-minus-src-alpha',
              },
              alpha: { srcfactor: 'one', dstFactor: 'one-minus-src-alpha' },
            },
          },
        ],
      },
    });
  };

  publicAPI.createCopyEncoder = (viewNode) => {
    model._copyEncoder = vtkWebGPURenderEncoder.newInstance({
      label: 'volumePassCopy',
    });
    model._copyEncoder.setDescription({
      colorAttachments: [
        {
          view: null,
          loadOp: 'load',
          storeOp: 'store',
        },
      ],
    });
    model._copyEncoder.setPipelineHash('volcopypf');
    model._copyEncoder.setPipelineSettings({
      primitive: { cullMode: 'none' },
      fragment: {
        targets: [
          {
            format: 'bgra8unorm',
            blend: {
              color: {
                srcFactor: 'one',
                dstFactor: 'one-minus-src-alpha',
              },
              alpha: { srcfactor: 'one', dstFactor: 'one-minus-src-alpha' },
            },
          },
        ],
      },
    });
  };

  publicAPI.createMergeEncoder = (viewNode) => {
    model._mergeEncoder = vtkWebGPURenderEncoder.newInstance({
      label: 'volumePassMerge',
    });
    model._mergeEncoder.setColorTextureView(0, model._colorTextureView);
    model._mergeEncoder.setDescription({
      colorAttachments: [
        {
          view: null,
          loadOp: 'load',
          storeOp: 'store',
        },
      ],
    });
    model._mergeEncoder.setReplaceShaderCodeFunction((pipeline) => {
      const fDesc = pipeline.getShaderDescription('fragment');
      fDesc.addOutput('vec4<f32>', 'outColor');
      let code = fDesc.getCode();
      code = vtkWebGPUShaderCache.substitute(
        code,
        '//VTK::RenderEncoder::Impl',
        ['output.outColor = vec4<f32>(computedColor.rgb, computedColor.a);']
      ).result;
      fDesc.setCode(code);
    });
    model._mergeEncoder.setPipelineHash('volpf');
    model._mergeEncoder.setPipelineSettings({
      primitive: { cullMode: 'none' },
      fragment: {
        targets: [
          {
            format: 'bgra8unorm',
            blend: {
              color: {
                srcFactor: 'src-alpha',
                dstFactor: 'one-minus-src-alpha',
              },
              alpha: { srcfactor: 'one', dstFactor: 'one-minus-src-alpha' },
            },
          },
        ],
      },
    });
  };

  // marks modified when needed
  publicAPI.setVolumes = (val) => {
    if (!model.volumes || model.volumes.length !== val.length) {
      model.volumes = [...val];
      publicAPI.modified();
      return;
    }
    for (let i = 0; i < val.length; i++) {
      if (val[i] !== model.volumes[i]) {
        model.volumes = [...val];
        publicAPI.modified();
        return;
      }
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  colorTextureView: null,
  depthTextureView: null,
  volumes: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  vtkRenderPass.extend(publicAPI, model, initialValues);

  model._lastScale = 2.0;
  model._mapper = vtkWebGPUSimpleMapper.newInstance();
  model._mapper.setFragmentShaderTemplate(DepthBoundsFS);
  model._mapper
    .getShaderReplacements()
    .set('replaceShaderVolumePass', (hash, pipeline, vertexInput) => {
      const fDesc = pipeline.getShaderDescription('fragment');
      fDesc.addBuiltinInput('vec4<f32>', '@builtin(position) fragPos');
    });

  model._boundsPoly = vtkPolyData.newInstance();
  model._lastMTimes = [];

  macro.setGet(publicAPI, model, ['colorTextureView', 'depthTextureView']);

  // Object methods
  vtkWebGPUVolumePass(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkWebGPUVolumePass');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
