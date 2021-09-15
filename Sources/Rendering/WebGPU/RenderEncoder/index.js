import * as macro from 'vtk.js/Sources/macros';
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

  publicAPI.setPipeline = (pl) => {
    model.handle.setPipeline(pl.getHandle());
    const pd = pl.getPipelineDescription();

    // check attachment state
    if (model.colorTextureViews.length !== pd.fragment.targets.length) {
      console.log(
        `mismatched attachment counts on pipeline ${pd.fragment.targets.length} while encoder has ${model.colorTextureViews.length}`
      );
      console.trace();
    } else {
      for (let i = 0; i < model.colorTextureViews.length; i++) {
        const fmt = model.colorTextureViews[i].getTexture().getFormat();
        if (fmt !== pd.fragment.targets[i].format) {
          console.log(
            `mismatched attachments for attachment ${i} on pipeline ${pd.fragment.targets[i].format} while encoder has ${fmt}`
          );
          console.trace();
        }
      }
    }

    // check depth buffer
    if (!model.depthTextureView !== !('depthStencil' in pd)) {
      console.log('mismatched depth attachments');
      console.trace();
    } else if (model.depthTextureView) {
      const dfmt = model.depthTextureView.getTexture().getFormat();
      if (dfmt !== pd.depthStencil.format) {
        console.log(
          `mismatched depth attachments on pipeline ${pd.depthStencil.format} while encoder has ${dfmt}`
        );
        console.trace();
      }
    }
    model.boundPipeline = pl;
  };

  publicAPI.replaceShaderCode = (pipeline) => {
    model.replaceShaderCodeFunction(pipeline);
  };

  publicAPI.setColorTextureView = (idx, view) => {
    if (model.colorTextureViews[idx] === view) {
      return;
    }
    model.colorTextureViews[idx] = view;
  };

  publicAPI.activateBindGroup = (bg) => {
    const device = model.boundPipeline.getDevice();
    const midx = model.boundPipeline.getBindGroupLayoutCount(bg.getName());
    model.handle.setBindGroup(midx, bg.getBindGroup(device));
    // verify bind group layout matches
    const bgl1 = device.getBindGroupLayoutDescription(
      bg.getBindGroupLayout(device)
    );
    const bgl2 = device.getBindGroupLayoutDescription(
      model.boundPipeline.getBindGroupLayout(midx)
    );
    if (bgl1 !== bgl2) {
      console.log(
        `renderEncoder ${model.pipelineHash} mismatched bind group layouts bind group has\n${bgl1}\n versus pipeline\n${bgl2}\n`
      );
      console.trace();
    }
  };

  publicAPI.attachTextureViews = () => {
    // for each texture create a view if we do not already have one
    for (let i = 0; i < model.colorTextureViews.length; i++) {
      if (!model.description.colorAttachments[i]) {
        model.description.colorAttachments[i] = {
          view: model.colorTextureViews[i].getHandle(),
        };
      } else {
        model.description.colorAttachments[i].view =
          model.colorTextureViews[i].getHandle();
      }
    }
    if (model.depthTextureView) {
      model.description.depthStencilAttachment.view =
        model.depthTextureView.getHandle();
    }
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
  boundPipeline: null,
  pipelineHash: null,
  pipelineSettings: null,
  replaceShaderCodeFunction: null,
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
        view: undefined,
        loadValue: 'load',
        storeOp: 'store',
      },
    ],
    depthStencilAttachment: {
      view: undefined,
      depthLoadValue: 1.0,
      depthStoreOp: 'store',
      stencilLoadValue: 0,
      stencilStoreOp: 'store',
    },
  };

  // default shader code just writes out the computedColor
  model.replaceShaderCodeFunction = (pipeline) => {
    const fDesc = pipeline.getShaderDescription('fragment');
    fDesc.addOutput('vec4<f32>', 'outColor');
    let code = fDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::RenderEncoder::Impl', [
      'output.outColor = computedColor;',
    ]).result;
    fDesc.setCode(code);
  };

  // default pipeline settings
  model.pipelineSettings = {
    primitive: { cullMode: 'none' },
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: 'less-equal',
      format: 'depth32float',
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

  model.colorTextureViews = [];

  macro.get(publicAPI, model, ['boundPipeline', 'colorTextureViews']);

  macro.setGet(publicAPI, model, [
    'depthTextureView',
    'description',
    'handle',
    'pipelineHash',
    'pipelineSettings',
    'replaceShaderCodeFunction',
  ]);

  // For more macro methods, see "Sources/macros.js"
  // Object specific methods
  vtkWebGPURenderEncoder(publicAPI, model);
}

// ----------------------------------------------------------------------------
export const newInstance = macro.newInstance(extend, 'vtkWebGPURenderEncoder');

// ----------------------------------------------------------------------------
export default { newInstance, extend };
