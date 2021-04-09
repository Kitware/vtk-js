import * as macro from 'vtk.js/Sources/macro';
import vtkWebGPUShaderCache from 'vtk.js/Sources/Rendering/WebGPU/ShaderCache';

// methods we forward to the handle
const forwarded = ['setBindGroup', 'setVertexBuffer', 'draw'];

// ----------------------------------------------------------------------------
// vtkWebGPURenderEncoder methods
// ----------------------------------------------------------------------------
function vtkWebGPURenderEncoder(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPURenderEncoder');

  publicAPI.begin = (encoder) => {
    model.handle = encoder.beginRenderPass(model.description);
  };

  publicAPI.end = () => {
    model.handle.endPass();
  };

  publicAPI.replaceShaderCode = (pipeline) => {
    model.replaceShaderCodeFunction(pipeline);
  };

  publicAPI.setColorTexture = (idx, tex) => {
    if (model.colorTextures[idx] === tex) {
      return;
    }
    model.colorTextures[idx] = tex;
    model.colorTextureViews[idx] = tex.createView();
  };

  publicAPI.setColorTextureView = (idx, view) => {
    if (model.colorTextureViews[idx] === view) {
      return;
    }
    model.colorTextures[idx] = view.getTexture();
    model.colorTextureViews[idx] = view;
  };

  publicAPI.attachTextureViews = () => {
    // for each texture create a view if we do not already have one
    for (let i = 0; i < model.colorTextureViews.length; i++) {
      if (!model.description.colorAttachments[i]) {
        model.description.colorAttachments[i] = {
          attachment: model.colorTextureViews[i].getHandle(),
        };
      } else {
        model.description.colorAttachments[
          i
        ].attachment = model.colorTextureViews[i].getHandle();
      }
    }
    if (model.depthTextureView) {
      model.description.depthStencilAttachment.attachment = model.depthTextureView.getHandle();
    }
  };

  publicAPI.setDepthTexture = (tex) => {
    if (model.depthTexture === tex) {
      return;
    }
    model.depthTexture = tex;
    model.depthTextureView = tex.createView();
  };

  publicAPI.setDepthTextureView = (view) => {
    if (model.depthTextureView === view) {
      return;
    }
    model.depthTexture = view.getTexture();
    model.depthTextureView = view;
  };

  // simple forwarders
  for (let i = 0; i < forwarded.length; i++) {
    publicAPI[forwarded[i]] = (...args) => model.handle[forwarded[i]](...args);
  }
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------
const DEFAULT_VALUES = {
  description: null,
  handle: null,
  pipelineHash: null,
  pipelineSettings: null,
  replaceShaderCodeFunction: null,
  depthTexture: null,
  depthTextureView: null,
};

// ----------------------------------------------------------------------------
export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);

  model.description = {
    colorAttachments: [
      {
        attachment: undefined,
        loadValue: [0.3, 0.3, 0.3, 1],
      },
    ],
    depthStencilAttachment: {
      attachment: undefined,
      depthLoadValue: 1.0,
      depthStoreOp: 'store',
      stencilLoadValue: 0,
      stencilStoreOp: 'store',
    },
  };

  // default shader code just writes out the computedColor
  model.replaceShaderCodeFunction = (pipeline) => {
    const fDesc = pipeline.getShaderDescription('fragment');
    let code = fDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::RenderEncoder::Dec', [
      '[[location(0)]] var<out> outColor : vec4<f32>;',
    ]).result;
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::RenderEncoder::Impl', [
      'outColor = computedColor;',
    ]).result;
    fDesc.setCode(code);
  };

  // default pipeline settings
  model.pipelineSettings = {
    primitive: { cullMode: 'none' },
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: 'less',
      format: 'depth24plus-stencil8',
    },
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
  };

  model.colorTextures = [];
  model.colorTextureViews = [];

  macro.get(publicAPI, model, [
    'colorTextures',
    'colorTextureViews',
    'depthTexture',
    'depthTextureView',
  ]);

  macro.setGet(publicAPI, model, [
    'description',
    'handle',
    'pipelineHash',
    'pipelineSettings',
    'replaceShaderCodeFunction',
  ]);

  // For more macro methods, see "Sources/macro.js"
  // Object specific methods
  vtkWebGPURenderEncoder(publicAPI, model);
}

// ----------------------------------------------------------------------------
export const newInstance = macro.newInstance(extend, 'vtkWebGPURenderEncoder');

// ----------------------------------------------------------------------------
export default { newInstance, extend };
