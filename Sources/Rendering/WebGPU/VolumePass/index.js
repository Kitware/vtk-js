import macro from 'vtk.js/Sources/macros';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkProperty from 'vtk.js/Sources/Rendering/Core/Property';
import vtkRenderPass from 'vtk.js/Sources/Rendering/SceneGraph/RenderPass';
import vtkWebGPUBufferManager from 'vtk.js/Sources/Rendering/WebGPU/BufferManager';
import vtkWebGPUMapperHelper from 'vtk.js/Sources/Rendering/WebGPU/MapperHelper';
import vtkWebGPURenderEncoder from 'vtk.js/Sources/Rendering/WebGPU/RenderEncoder';
import vtkWebGPUShaderCache from 'vtk.js/Sources/Rendering/WebGPU/ShaderCache';
import vtkWebGPUTexture from 'vtk.js/Sources/Rendering/WebGPU/Texture';
import vtkWebGPUVolumePassFSQ from 'vtk.js/Sources/Rendering/WebGPU/VolumePassFSQ';

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

[[stage(fragment)]]
fn main(
//VTK::IOStructs::Input
)
//VTK::IOStructs::Output
{
  var output : fragmentOutput;

  //VTK::Select::Impl

  //VTK::TCoord::Impl

  //VTK::VolumePass::Impl

  // use the minimum (closest) of the current value and the zbuffer
  // the blend func will then take the max to find the farthest stop value
  var stopval: f32 = min(input.fragPos.z, textureLoad(opaquePassDepthTexture, vec2<i32>(i32(input.fragPos.x), i32(input.fragPos.y)), 0));

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

  publicAPI.traverse = (renNode, viewNode) => {
    if (model.deleted) {
      return;
    }

    // we just render our delegates in order
    model.currentParent = viewNode;

    // first render the boxes to generate a min max depth
    // map for all the volumes
    publicAPI.renderDepthBounds(renNode, viewNode);

    // then perform the ray casting using the depth bounds texture
    if (!model.finalEncoder) {
      publicAPI.createFinalEncoder(viewNode);
    }
    publicAPI.finalPass(viewNode, renNode);
  };

  publicAPI.finalPass = (viewNode, renNode) => {
    model.finalEncoder.setColorTextureView(0, model.colorTextureView);
    model.finalEncoder.attachTextureViews();
    renNode.setRenderEncoder(model.finalEncoder);
    model.finalEncoder.begin(viewNode.getCommandEncoder());
    renNode.scissorAndViewport(model.finalEncoder);
    model.fullScreenQuad.setWebGPURenderer(renNode);
    model.fullScreenQuad.setVolumes(model.volumes);
    model.fullScreenQuad.render(model.finalEncoder, viewNode.getDevice());
    model.finalEncoder.end();
  };

  publicAPI.renderDepthBounds = (renNode, viewNode) => {
    publicAPI.updateDepthPolyData(renNode);

    const pd = model._boundsPoly;
    const cells = pd.getPolys();
    const hash = cells.getMTime();
    // points
    const points = pd.getPoints();
    const buffRequest = {
      hash: hash + points.getMTime(),
      dataArray: points,
      source: points,
      cells,
      primitiveType: PrimitiveTypes.Triangles,
      representation: Representation.SURFACE,
      time: Math.max(points.getMTime(), cells.getMTime()),
      usage: BufferUsage.PointArray,
      format: 'float32x4',
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
      !model._lastMTimes[model.volumes.length] ||
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
    const device = viewNode.getDevice();

    // copy current depth buffer to
    if (!model.depthRangeEncoder) {
      publicAPI.createDepthRangeEncoder();
      model.depthRangeTexture = vtkWebGPUTexture.newInstance();
      model.depthRangeTexture.create(device, {
        width: viewNode.getCanvas().width,
        height: viewNode.getCanvas().height,
        format: 'r16float',
        usage:
          GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
      });
      const maxView = model.depthRangeTexture.createView();
      maxView.setName('maxTexture');
      model.depthRangeEncoder.setColorTextureView(0, maxView);
      model.depthRangeTexture2 = vtkWebGPUTexture.newInstance();
      model.depthRangeTexture2.create(device, {
        width: viewNode.getCanvas().width,
        height: viewNode.getCanvas().height,
        format: 'r16float',
        usage:
          GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
      });
      const minView = model.depthRangeTexture2.createView();
      minView.setName('minTexture');
      model.depthRangeEncoder.setColorTextureView(1, minView);
      model._mapper.setDevice(viewNode.getDevice());
      model._mapper.setTextureViews([model.depthTextureView]);
    } else {
      model.depthRangeTexture.resizeToMatch(
        model.colorTextureView.getTexture()
      );
      model.depthRangeTexture2.resizeToMatch(
        model.colorTextureView.getTexture()
      );
    }

    model.depthRangeEncoder.attachTextureViews();

    publicAPI.setCurrentOperation('volumeDepthRangePass');
    renNode.setRenderEncoder(model.depthRangeEncoder);
    renNode.volumeDepthRangePass(true);
    model._mapper.setWebGPURenderer(renNode);

    model._mapper.build(model.depthRangeEncoder, device);
    model._mapper.registerToDraw();

    renNode.volumeDepthRangePass(false);
  };

  publicAPI.createDepthRangeEncoder = () => {
    model.depthRangeEncoder = vtkWebGPURenderEncoder.newInstance();

    model.depthRangeEncoder.setPipelineHash('volr');
    model.depthRangeEncoder.setReplaceShaderCodeFunction((pipeline) => {
      const fDesc = pipeline.getShaderDescription('fragment');
      fDesc.addOutput('vec4<f32>', 'outColor1');
      fDesc.addOutput('vec4<f32>', 'outColor2');
      let code = fDesc.getCode();
      code = vtkWebGPUShaderCache.substitute(
        code,
        '//VTK::RenderEncoder::Impl',
        [
          'output.outColor1 = vec4<f32>(stopval, 0.0, 0.0, 0.0);',
          'output.outColor2 = vec4<f32>(input.fragPos.z, 0.0, 0.0, 0.0);',
        ]
      ).result;
      fDesc.setCode(code);
    });
    model.depthRangeEncoder.setDescription({
      colorAttachments: [
        {
          view: null,
          loadValue: [0.0, 0.0, 0.0, 0.0],
          storeOp: 'store',
        },
        {
          view: null,
          loadValue: [1.0, 1.0, 1.0, 1.0],
          storeOp: 'store',
        },
      ],
    });
    model.depthRangeEncoder.setPipelineSettings({
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
  };

  publicAPI.createFinalEncoder = (viewNode) => {
    model.fullScreenQuad = vtkWebGPUVolumePassFSQ.newInstance();
    model.fullScreenQuad.setDevice(viewNode.getDevice());
    model.fullScreenQuad.setTextureViews([
      ...model.depthRangeEncoder.getColorTextureViews(),
    ]);

    model.finalEncoder = vtkWebGPURenderEncoder.newInstance();
    model.finalEncoder.setDescription({
      colorAttachments: [
        {
          view: null,
          loadValue: 'load',
          storeOp: 'store',
        },
      ],
    });
    model.finalEncoder.setReplaceShaderCodeFunction((pipeline) => {
      const fDesc = pipeline.getShaderDescription('fragment');
      fDesc.addOutput('vec4<f32>', 'outColor');
      let code = fDesc.getCode();
      code = vtkWebGPUShaderCache.substitute(
        code,
        '//VTK::RenderEncoder::Impl',
        [
          'output.outColor = vec4<f32>(computedColor.rgb*computedColor.a, computedColor.a);',
        ]
      ).result;
      fDesc.setCode(code);
    });
    model.finalEncoder.setPipelineHash('volpf');
    model.finalEncoder.setPipelineSettings({
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

  model._mapper = vtkWebGPUMapperHelper.newInstance();
  model._mapper.setFragmentShaderTemplate(DepthBoundsFS);
  model._mapper
    .getShaderReplacements()
    .set('replaceShaderVolumePass', (hash, pipeline, vertexInput) => {
      const fDesc = pipeline.getShaderDescription('fragment');
      fDesc.addBuiltinInput('vec4<f32>', '[[builtin(position)]] fragPos');
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
