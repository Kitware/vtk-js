import macro from 'vtk.js/Sources/macros';
import vtkWebGPUTexture from 'vtk.js/Sources/Rendering/WebGPU/Texture';
import vtkWebGPURenderEncoder from 'vtk.js/Sources/Rendering/WebGPU/RenderEncoder';
import vtkWebGPUShaderCache from 'vtk.js/Sources/Rendering/WebGPU/ShaderCache';
import vtkRenderPass from 'vtk.js/Sources/Rendering/SceneGraph/RenderPass';
import vtkWebGPUFullScreenQuad from 'vtk.js/Sources/Rendering/WebGPU/FullScreenQuad';

// ----------------------------------------------------------------------------

const oitpFragTemplate = `
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

  var tcoord: vec2<i32> = vec2<i32>(i32(input.fragPos.x), i32(input.fragPos.y));
  var reveal: f32 = textureLoad(oitpAccumTexture, tcoord, 0).r;
  if (reveal == 1.0) { discard; }
  var tcolor: vec4<f32> = textureLoad(oitpColorTexture, tcoord, 0);
  var total: f32 = max(tcolor.a, 0.01);
  var computedColor: vec4<f32> = vec4<f32>(tcolor.r/total, tcolor.g/total, tcolor.b/total, 1.0 - reveal);

  //VTK::RenderEncoder::Impl
  return output;
}
`;

function vtkWebGPUOrderIndependentTranslucentPass(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUOrderIndependentTranslucentPass');

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
      model.translucentColorTexture = vtkWebGPUTexture.newInstance({
        label: 'translucentPassColor',
      });
      model.translucentColorTexture.create(device, {
        width: viewNode.getCanvas().width,
        height: viewNode.getCanvas().height,
        format: 'rgba16float',
        /* eslint-disable no-undef */
        /* eslint-disable no-bitwise */
        usage:
          GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
      });
      const v1 = model.translucentColorTexture.createView('oitpColorTexture');
      model.translucentRenderEncoder.setColorTextureView(0, v1);

      model.translucentAccumulateTexture = vtkWebGPUTexture.newInstance({
        label: 'translucentPassAccumulate',
      });
      model.translucentAccumulateTexture.create(device, {
        width: viewNode.getCanvas().width,
        height: viewNode.getCanvas().height,
        format: 'r16float',
        /* eslint-disable no-undef */
        /* eslint-disable no-bitwise */
        usage:
          GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
      });
      const v2 =
        model.translucentAccumulateTexture.createView('oitpAccumTexture');
      model.translucentRenderEncoder.setColorTextureView(1, v2);
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

    model.translucentFinalEncoder.begin(viewNode.getCommandEncoder());
    renNode.scissorAndViewport(model.translucentFinalEncoder);
    model.fullScreenQuad.prepareAndDraw(model.translucentFinalEncoder);
    model.translucentFinalEncoder.end();
  };

  publicAPI.getTextures = () => [
    model.translucentColorTexture,
    model.translucentAccumulateTexture,
  ];

  publicAPI.createRenderEncoder = () => {
    model.translucentRenderEncoder = vtkWebGPURenderEncoder.newInstance({
      label: 'translucentRender',
    });
    const rDesc = model.translucentRenderEncoder.getDescription();
    rDesc.colorAttachments = [
      {
        view: undefined,
        clearValue: [0.0, 0.0, 0.0, 0.0],
        loadOp: 'clear',
        storeOp: 'store',
      },
      {
        view: undefined,
        clearValue: [1.0, 0.0, 0.0, 0.0],
        loadOp: 'clear',
        storeOp: 'store',
      },
    ];
    rDesc.depthStencilAttachment = {
      view: undefined,
      depthLoadOp: 'load',
      depthStoreOp: 'store',
    };

    model.translucentRenderEncoder.setReplaceShaderCodeFunction((pipeline) => {
      const fDesc = pipeline.getShaderDescription('fragment');
      fDesc.addOutput('vec4<f32>', 'outColor');
      fDesc.addOutput('f32', 'outAccum');
      fDesc.addBuiltinInput('vec4<f32>', '@builtin(position) fragPos');
      let code = fDesc.getCode();

      code = vtkWebGPUShaderCache.substitute(
        code,
        '//VTK::RenderEncoder::Impl',
        [
          // very simple depth weighting in w z ranges from 1.0 near to 0.0
          'var w: f32 = computedColor.a * pow(0.1 + input.fragPos.z, 2.0);',
          'output.outColor = vec4<f32>(computedColor.rgb*w, w);',
          'output.outAccum = computedColor.a;',
        ]
      ).result;
      fDesc.setCode(code);
    });
    model.translucentRenderEncoder.setPipelineHash('oitpr');
    model.translucentRenderEncoder.setPipelineSettings({
      primitive: { cullMode: 'none' },
      depthStencil: {
        depthWriteEnabled: false,
        depthCompare: 'greater',
        format: 'depth32float',
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
                dstFactor: 'one-minus-src',
              },
              alpha: { srcfactor: 'one', dstFactor: 'one-minus-src-alpha' },
            },
          },
        ],
      },
    });
  };

  publicAPI.createFinalEncoder = () => {
    model.translucentFinalEncoder = vtkWebGPURenderEncoder.newInstance({
      label: 'translucentFinal',
    });
    model.translucentFinalEncoder.setDescription({
      colorAttachments: [
        {
          view: null,
          loadOp: 'load',
          storeOp: 'store',
        },
      ],
    });
    model.translucentFinalEncoder.setReplaceShaderCodeFunction((pipeline) => {
      const fDesc = pipeline.getShaderDescription('fragment');
      fDesc.addOutput('vec4<f32>', 'outColor');
      fDesc.addBuiltinInput('vec4<f32>', '@builtin(position) fragPos');
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
  vtkWebGPUOrderIndependentTranslucentPass(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkWebGPUOrderIndependentTranslucentPass'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
