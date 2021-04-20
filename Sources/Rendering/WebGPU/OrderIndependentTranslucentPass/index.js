import macro from 'vtk.js/Sources/macro';
import vtkWebGPUTexture from 'vtk.js/Sources/Rendering/WebGPU/Texture';
import vtkWebGPURenderEncoder from 'vtk.js/Sources/Rendering/WebGPU/RenderEncoder';
import vtkWebGPUShaderCache from 'vtk.js/Sources/Rendering/WebGPU/ShaderCache';
import vtkRenderPass from 'vtk.js/Sources/Rendering/SceneGraph/RenderPass';
import vtkWebGPUFullScreenQuad from 'vtk.js/Sources/Rendering/WebGPU/FullScreenQuad';

// ----------------------------------------------------------------------------

const oitpFragTemplate = `
//VTK::TCoord::Dec

//VTK::RenderEncoder::Dec

[[stage(fragment)]]
fn main() -> void
{
  var reveal: f32 = textureSample(Texture1, Sampler1, tcoordVS).r;
  if (reveal == 1.0) { discard; }
  var tcolor: vec4<f32> = textureSample(Texture0, Sampler0, tcoordVS);
  var total: f32 = max(tcolor.a, 0.01);
  var computedColor: vec4<f32> = vec4<f32>(tcolor.r/total, tcolor.g/total, tcolor.b/total, 1.0 - reveal);

  //VTK::RenderEncoder::Impl
}
`;

function vtkOrderIndependentTranslucentPass(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOrderIndependentTranslucentPass');

  // this pass implements a forward rendering pipeline
  // if both volumes and opaque geometry are present
  // it will mix the two together by capturing a zbuffer
  // first
  publicAPI.traverse = (renNode, viewNode) => {
    if (model.deleted) {
      return;
    }

    // we just render our delegates in order
    model.currentParent = viewNode;

    const device = viewNode.getDevice();

    if (!model.translucentRenderEncoder) {
      publicAPI.createRenderEncoder();
      publicAPI.createFinalEncoder();
      model.translucentColorTexture = vtkWebGPUTexture.newInstance();
      model.translucentColorTexture.create(device, {
        width: viewNode.getCanvas().width,
        height: viewNode.getCanvas().height,
        format: 'rgba16float',
        /* eslint-disable no-undef */
        /* eslint-disable no-bitwise */
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.SAMPLED,
      });
      model.translucentAccumulateTexture = vtkWebGPUTexture.newInstance();
      model.translucentAccumulateTexture.create(device, {
        width: viewNode.getCanvas().width,
        height: viewNode.getCanvas().height,
        format: 'r16float',
        /* eslint-disable no-undef */
        /* eslint-disable no-bitwise */
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.SAMPLED,
      });
      model.translucentRenderEncoder.setColorTexture(
        0,
        model.translucentColorTexture
      );
      model.translucentRenderEncoder.setColorTexture(
        1,
        model.translucentAccumulateTexture
      );
      model.fullScreenQuad = vtkWebGPUFullScreenQuad.newInstance();
      model.fullScreenQuad.setDevice(viewNode.getDevice());
      model.fullScreenQuad.setPipelineHash('oitpfsq');
      model.fullScreenQuad.setTextureViews(
        model.translucentRenderEncoder.getColorTextureViews()
      );
      model.fullScreenQuad.setFragmentShaderTemplate(oitpFragTemplate);
    } else {
      model.translucentColorTexture.resizeToMatch(
        model.colorTextureView.getTexture()
      );
      model.translucentAccumulateTexture.resizeToMatch(
        model.colorTextureView.getTexture()
      );
    }

    model.translucentRenderEncoder.setDepthTextureView(model.depthTextureView);
    model.translucentRenderEncoder.attachTextureViews();
    const renDesc = model.translucentRenderEncoder.getDescription();
    renDesc.colorAttachments[0].loadValue = [0.0, 0.0, 0.0, 0.0];
    renDesc.colorAttachments[1].loadValue = [1.0, 0.0, 0.0, 0.0];
    publicAPI.setCurrentOperation('translucentPass');
    renNode.setRenderEncoder(model.translucentRenderEncoder);
    renNode.traverse(publicAPI);
    publicAPI.finalPass(viewNode, renNode);
  };

  publicAPI.finalPass = (viewNode, renNode) => {
    model.translucentFinalEncoder.setColorTextureView(
      0,
      model.colorTextureView
    );
    model.translucentFinalEncoder.attachTextureViews();
    renNode.setRenderEncoder(model.translucentFinalEncoder);
    model.translucentFinalEncoder.begin(viewNode.getCommandEncoder());
    // set viewport
    const tsize = renNode.getTiledSizeAndOrigin();
    model.translucentFinalEncoder
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
    model.translucentFinalEncoder
      .getHandle()
      .setScissorRect(
        tsize.lowerLeftU,
        tsize.lowerLeftV,
        tsize.usize,
        tsize.vsize
      );
    model.fullScreenQuad.render(
      model.translucentFinalEncoder,
      viewNode.getDevice()
    );
    model.translucentFinalEncoder.end();
  };

  publicAPI.getTextures = () => [
    model.translucentColorTexture,
    model.translucentAccumulateTexture,
  ];

  publicAPI.createRenderEncoder = () => {
    model.translucentRenderEncoder = vtkWebGPURenderEncoder.newInstance();
    const rDesc = model.translucentRenderEncoder.getDescription();
    rDesc.depthStencilAttachment = {
      attachment: undefined,
      depthLoadValue: 'load',
      depthStoreOp: 'store',
      stencilLoadValue: 'load',
      stencilStoreOp: 'store',
    };

    model.translucentRenderEncoder.setReplaceShaderCodeFunction((pipeline) => {
      const fDesc = pipeline.getShaderDescription('fragment');
      let code = fDesc.getCode();
      code = vtkWebGPUShaderCache.substitute(
        code,
        '//VTK::RenderEncoder::Dec',
        [
          '[[location(0)]] var<out> outColor : vec4<f32>;',
          '[[location(1)]] var<out> outAccum : f32;',
          '[[builtin(frag_coord)]] var<in> fragPos : vec4<f32>;',
        ]
      ).result;
      code = vtkWebGPUShaderCache.substitute(
        code,
        '//VTK::RenderEncoder::Impl',
        [
          // very simple depth weighting in w
          'var w: f32 = 1.0 - fragPos.z * 0.9;',
          'outColor = vec4<f32>(computedColor.rgb*computedColor.a, computedColor.a) * w;',
          'outAccum = computedColor.a;',
        ]
      ).result;
      fDesc.setCode(code);
    });
    model.translucentRenderEncoder.setPipelineHash('oitpr');
    model.translucentRenderEncoder.setPipelineSettings({
      primitive: { cullMode: 'none' },
      depthStencil: {
        depthWriteEnabled: false,
        depthCompare: 'less',
        format: 'depth24plus-stencil8',
      },
      fragment: {
        targets: [
          {
            format: 'rgba16float',
            blend: {
              color: {
                srcFactor: 'one',
                dstFactor: 'one',
              },
              alpha: { srcfactor: 'one', dstFactor: 'one' },
            },
          },
          {
            format: 'r16float',
            blend: {
              color: {
                srcFactor: 'zero',
                dstFactor: 'one-minus-src-color',
              },
              alpha: { srcfactor: 'one', dstFactor: 'one-minus-src-alpha' },
            },
          },
        ],
      },
    });
  };

  publicAPI.createFinalEncoder = () => {
    model.translucentFinalEncoder = vtkWebGPURenderEncoder.newInstance();
    model.translucentFinalEncoder.setDescription({
      colorAttachments: [
        {
          attachment: null,
          loadValue: 'load',
        },
      ],
    });
    model.translucentFinalEncoder.setReplaceShaderCodeFunction((pipeline) => {
      const fDesc = pipeline.getShaderDescription('fragment');
      let code = fDesc.getCode();
      code = vtkWebGPUShaderCache.substitute(
        code,
        '//VTK::RenderEncoder::Dec',
        ['[[location(0)]] var<out> outColor : vec4<f32>;']
      ).result;
      code = vtkWebGPUShaderCache.substitute(
        code,
        '//VTK::RenderEncoder::Impl',
        [
          'outColor = vec4<f32>(computedColor.rgb*computedColor.a, computedColor.a);',
        ]
      ).result;
      fDesc.setCode(code);
    });
    model.translucentFinalEncoder.setPipelineHash('oitpf');
    model.translucentFinalEncoder.setPipelineSettings({
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
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  colorTextureView: null,
  depthTextureView: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  vtkRenderPass.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, ['colorTextureView', 'depthTextureView']);

  // Object methods
  vtkOrderIndependentTranslucentPass(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkOrderIndependentTranslucentPass'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
