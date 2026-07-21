import macro from 'vtk.js/Sources/macros';
import vtkRenderPass from 'vtk.js/Sources/Rendering/SceneGraph/RenderPass';
import vtkWebGPUFullScreenQuad from 'vtk.js/Sources/Rendering/WebGPU/FullScreenQuad';
import vtkWebGPURenderEncoder from 'vtk.js/Sources/Rendering/WebGPU/RenderEncoder';
import vtkWebGPUTexture from 'vtk.js/Sources/Rendering/WebGPU/Texture';
import vtkWebGPUTextureView from 'vtk.js/Sources/Rendering/WebGPU/TextureView';
import vtkWebGPUUniformBuffer from 'vtk.js/Sources/Rendering/WebGPU/UniformBuffer';

const { vtkErrorMacro } = macro;

const finalBlitFragTemplate = `
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

  let dims = textureDimensions(convolutionPassColorTexture);
  let coord = min(
    vec2<i32>(input.tcoordVS * vec2<f32>(dims)),
    vec2<i32>(dims) - vec2<i32>(1)
  );
  var computedColor: vec4<f32> = clamp(
    textureLoad(convolutionPassColorTexture, coord, 0),
    vec4<f32>(0.0),
    vec4<f32>(1.0)
  );

  //VTK::RenderEncoder::Impl
  return output;
}
`;

function createConvolutionFragTemplate(kernelDimension) {
  const kernelLength = kernelDimension * kernelDimension;
  const halfDim = Math.floor(kernelDimension / 2);
  const code = [
    '//VTK::Mapper::Dec',
    '',
    '//VTK::TCoord::Dec',
    '',
    '//VTK::RenderEncoder::Dec',
    '',
    '//VTK::IOStructs::Dec',
    '',
    '@fragment',
    'fn main(',
    '//VTK::IOStructs::Input',
    ')',
    '//VTK::IOStructs::Output',
    '{',
    '  var output: fragmentOutput;',
    '',
    '  let dims = textureDimensions(convolutionInputTexture);',
    '  let maxCoord = vec2<i32>(dims) - vec2<i32>(1);',
    '  let center = min(',
    '    vec2<i32>(input.tcoordVS * vec2<f32>(dims)),',
    '    maxCoord',
    '  );',
    '  let sourceAlpha = textureLoad(convolutionInputTexture, center, 0).a;',
    '  var colorSum: vec4<f32> =',
  ];

  let kernelIdx = 0;
  for (let y = -halfDim; y <= halfDim; y++) {
    for (let x = -halfDim; x <= halfDim; x++) {
      code.push(
        `    textureLoad(convolutionInputTexture, clamp(center + vec2<i32>(${x}, ${y}), vec2<i32>(0), maxCoord), 0) * mapperUBO.Kernel${kernelIdx}${
          kernelIdx === kernelLength - 1 ? ';' : ' +'
        }`
      );
      kernelIdx++;
    }
  }

  code.push(
    '',
    '  var computedColor: vec4<f32> = vec4<f32>(',
    '    (colorSum / max(mapperUBO.KernelWeight, 0.000001)).rgb,',
    '    sourceAlpha',
    '  );',
    '',
    '  //VTK::RenderEncoder::Impl',
    '  return output;',
    '}'
  );

  return code.join('\n');
}

// ----------------------------------------------------------------------------

function vtkWebGPUConvolution2DPass(publicAPI, model) {
  model.classHierarchy.push('vtkWebGPUConvolution2DPass');

  publicAPI.computeKernelWeight = (kernel) => {
    const weight = kernel.reduce((prev, curr) => prev + curr, 0);
    return weight <= 0 ? 1 : weight;
  };

  publicAPI.getCaptureDelegateOutput = () => true;
  publicAPI.getColorTexture = () => model.outputTexture;
  publicAPI.getColorTextureView = () => model.outputTextureView;
  publicAPI.getOpaquePass = () => publicAPI;
  publicAPI.getDepthTexture = () =>
    model.delegates[0]?.getDepthTexture?.() ??
    model.delegates[0]?.getOpaquePass?.()?.getDepthTexture?.();
  publicAPI.getDepthTextureView = () =>
    model.delegates[0]?.getDepthTextureView?.() ??
    model.delegates[0]?.getOpaquePass?.()?.getDepthTextureView?.();

  publicAPI.validateKernel = () => {
    if (model.kernelDimension % 2 !== 1) {
      vtkErrorMacro(
        'Invalid kernel dimension! Kernel dimension must be odd (e.g. 3, 5, 7, ...).'
      );
      return false;
    }

    const kernelLength = model.kernelDimension * model.kernelDimension;
    if (model.kernel === null) {
      model.kernel = new Float32Array(kernelLength);
      model.kernel[Math.floor(kernelLength / 2)] = 1;
    }

    if (model.kernel.length !== kernelLength) {
      vtkErrorMacro(
        `The given kernel is invalid. 2D convolution kernels have to be 1D arrays with ${kernelLength} components representing the ${model.kernelDimension}x${model.kernelDimension} kernel in row-major form.`
      );
      return false;
    }

    return true;
  };

  publicAPI.getDelegateColorTexture = () => {
    for (let i = 0; i < model.delegates.length; i++) {
      const delegate = model.delegates[i];
      const texture =
        delegate.getColorTexture?.() ??
        delegate.getOpaquePass?.()?.getColorTexture?.();
      if (texture) {
        return texture;
      }
    }
    return null;
  };

  publicAPI.createEncoders = (viewNode) => {
    model.convolutionEncoder = vtkWebGPURenderEncoder.newInstance({
      label: 'Convolution2DPassConvolve',
    });
    model.convolutionEncoder.setDescription({
      colorAttachments: [
        {
          view: null,
          clearValue: [0.0, 0.0, 0.0, 0.0],
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    });
    model.convolutionEncoder.setPipelineHash('conv2d-render');
    model.convolutionEncoder.setPipelineSettings({
      primitive: { cullMode: 'none' },
      fragment: {
        targets: [
          {
            format: 'rgba16float',
            blend: undefined,
          },
        ],
      },
    });

    model.finalBlitEncoder = vtkWebGPURenderEncoder.newInstance({
      label: 'Convolution2DPassFinalBlit',
    });
    model.finalBlitEncoder.setDescription({
      colorAttachments: [
        {
          view: null,
          loadOp: 'load',
          storeOp: 'store',
        },
      ],
    });
    model.finalBlitEncoder.setPipelineHash('conv2d-final-blit');
    model.finalBlitEncoder.setPipelineSettings({
      primitive: { cullMode: 'none' },
      fragment: {
        targets: [
          {
            format: viewNode.getPresentationFormat(),
            // the swap chain is configured as premultiplied while the color
            // texture holds unpremultiplied values, so scale by the source
            // alpha on the way out
            blend: {
              color: {
                srcFactor: 'src-alpha',
                dstFactor: 'one-minus-src-alpha',
              },
              alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha' },
            },
          },
        ],
      },
    });

    model.finalBlitOutputTextureView = vtkWebGPUTextureView.newInstance({
      label: 'convolutionPassSwapChainTexture',
    });
  };

  publicAPI.createOutputResources = (viewNode) => {
    const device = viewNode.getDevice();
    const width = viewNode.getCanvas().width;
    const height = viewNode.getCanvas().height;

    if (!model.outputTexture) {
      model.outputTexture = vtkWebGPUTexture.newInstance({
        label: 'convolutionPassColor',
      });
      /* eslint-disable no-undef */
      /* eslint-disable no-bitwise */
      model.outputTexture.create(device, {
        width,
        height,
        format: 'rgba16float',
        usage:
          GPUTextureUsage.RENDER_ATTACHMENT |
          GPUTextureUsage.TEXTURE_BINDING |
          GPUTextureUsage.COPY_SRC,
      });
      /* eslint-enable no-bitwise */
      /* eslint-enable no-undef */
      model.outputTextureView = model.outputTexture.createView(
        'convolutionPassColorTexture'
      );
    } else {
      model.outputTexture.resize(width, height);
    }

    model.convolutionEncoder.setColorTextureView(0, model.outputTextureView);
  };

  publicAPI.updateKernelResources = () => {
    const kernelLength = model.kernelDimension * model.kernelDimension;
    const rebuild =
      !model.kernelUBO ||
      model.previousKernelDimension !== model.kernelDimension;

    if (rebuild) {
      model.kernelUBO = vtkWebGPUUniformBuffer.newInstance({
        label: 'mapperUBO',
      });
      model.kernelUBO.addEntry('KernelWeight', 'f32');
      for (let i = 0; i < kernelLength; i++) {
        model.kernelUBO.addEntry(`Kernel${i}`, 'f32');
      }
      model.previousKernelDimension = model.kernelDimension;
    }

    // setValue only marks the buffer dirty when a component really changes,
    // so this also covers a kernel that was edited in place
    model.kernelUBO.setValue(
      'KernelWeight',
      publicAPI.computeKernelWeight(model.kernel)
    );
    for (let i = 0; i < kernelLength; i++) {
      model.kernelUBO.setValue(`Kernel${i}`, model.kernel[i]);
    }

    if (!rebuild) {
      return;
    }

    if (!model.convolutionQuad) {
      model.convolutionQuad = vtkWebGPUFullScreenQuad.newInstance();
    }
    model.convolutionQuad.setDevice(model.device);
    model.convolutionQuad.setUBO(model.kernelUBO);
    model.convolutionQuad.setPipelineHash(
      `conv2d-fsq-${model.kernelDimension}`
    );
    model.convolutionQuad.setFragmentShaderTemplate(
      createConvolutionFragTemplate(model.kernelDimension)
    );
  };

  publicAPI.createFinalBlitQuad = () => {
    model.finalBlitQuad = vtkWebGPUFullScreenQuad.newInstance();
    model.finalBlitQuad.setDevice(model.device);
    model.finalBlitQuad.setPipelineHash('conv2d-final-blit-fsq');
    model.finalBlitQuad.setFragmentShaderTemplate(finalBlitFragTemplate);
    model.finalBlitQuad.setTextureViews([model.outputTextureView]);
  };

  publicAPI.traverse = (viewNode, parent = null) => {
    if (model.deleted) {
      return;
    }

    model._currentParent = parent;

    // a nested pass hands its output texture to its parent instead of writing
    // to the swap chain. only a parent that reads that texture can stand in
    // for the blit, so a parent that does not leaves this pass in charge of
    // the final image
    const isNested = !!parent?.getCaptureDelegateOutput?.();

    if (!model.delegates.length) {
      vtkErrorMacro(
        'Convolution2DPass needs at least one delegate pass to post process.'
      );
      return;
    }

    if (!publicAPI.validateKernel()) {
      // the delegates still traverse so the scene graph stays up to date, and
      // the outermost pass hands them the swap chain so a misconfigured kernel
      // shows the unfiltered image instead of a stale one
      model.delegates.forEach((delegate) => {
        delegate.traverse(viewNode, isNested ? publicAPI : null);
      });
      return;
    }

    model.device = viewNode.getDevice();

    if (!model.convolutionEncoder || !model.finalBlitEncoder) {
      publicAPI.createEncoders(viewNode);
    }
    publicAPI.createOutputResources(viewNode);
    publicAPI.updateKernelResources();

    if (!isNested && !model.finalBlitQuad) {
      publicAPI.createFinalBlitQuad();
    }

    // the delegates render into their own color texture and skip their blit.
    // that texture is reused for every renderer of the view, so a view with
    // several renderers or layers only keeps the last one, and the convolved
    // result covers the whole canvas rather than each renderer viewport
    model.delegates.forEach((delegate) => {
      delegate.traverse(viewNode, publicAPI);
    });

    const sourceTexture = publicAPI.getDelegateColorTexture();
    if (!sourceTexture) {
      vtkErrorMacro(
        'Convolution2DPass could not find a delegate color texture to post-process.'
      );
      return;
    }

    // the view tracks the handle of its texture, so it only has to be built
    // again when the delegate hands us a different texture object
    if (model._inputSourceTexture !== sourceTexture) {
      model._inputSourceTexture = sourceTexture;
      model.inputTextureView = sourceTexture.createView(
        'convolutionInputTexture'
      );
      model.convolutionQuad.setTextureViews([model.inputTextureView]);
    }
    model.kernelUBO.sendIfNeeded(model.device);

    model.convolutionEncoder.attachTextureViews();
    model.convolutionEncoder.begin(viewNode.getCommandEncoder());
    model.convolutionEncoder
      .getHandle()
      .setViewport(
        0,
        0,
        viewNode.getCanvas().width,
        viewNode.getCanvas().height,
        0.0,
        1.0
      );
    model.convolutionEncoder
      .getHandle()
      .setScissorRect(
        0,
        0,
        viewNode.getCanvas().width,
        viewNode.getCanvas().height
      );
    model.convolutionQuad.prepareAndDraw(model.convolutionEncoder);
    model.convolutionEncoder.end();

    if (isNested) {
      return;
    }

    model.finalBlitOutputTextureView.createFromTextureHandle(
      viewNode.getCurrentTexture(),
      {
        depth: 1,
        format: viewNode.getPresentationFormat(),
      }
    );
    model.finalBlitEncoder.setColorTextureView(
      0,
      model.finalBlitOutputTextureView
    );
    model.finalBlitEncoder.attachTextureViews();
    model.finalBlitEncoder.begin(viewNode.getCommandEncoder());
    model.finalBlitEncoder
      .getHandle()
      .setViewport(
        0,
        0,
        viewNode.getCanvas().width,
        viewNode.getCanvas().height,
        0.0,
        1.0
      );
    model.finalBlitEncoder
      .getHandle()
      .setScissorRect(
        0,
        0,
        viewNode.getCanvas().width,
        viewNode.getCanvas().height
      );
    model.finalBlitQuad.prepareAndDraw(model.finalBlitEncoder);
    model.finalBlitEncoder.end();
  };

  publicAPI.releaseGraphicsResources = () => {
    model.delegates.forEach((delegate) => {
      delegate.releaseGraphicsResources?.();
    });
    model.convolutionQuad?.releaseGraphicsResources?.();
    model.finalBlitQuad?.releaseGraphicsResources?.();
    model.outputTexture?.getHandle?.()?.destroy?.();

    model.convolutionEncoder = null;
    model.convolutionQuad = null;
    model.finalBlitEncoder = null;
    model.finalBlitOutputTextureView = null;
    model.finalBlitQuad = null;
    model.inputTextureView = null;
    model.kernelUBO = null;
    model.outputTexture = null;
    model.outputTextureView = null;
    model._inputSourceTexture = null;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  convolutionEncoder: null,
  convolutionQuad: null,
  device: null,
  inputTextureView: null,
  kernel: [0, 0, 0, 0, 1, 0, 0, 0, 0],
  kernelDimension: 3,
  kernelUBO: null,
  outputTexture: null,
  outputTextureView: null,
  finalBlitEncoder: null,
  finalBlitOutputTextureView: null,
  finalBlitQuad: null,
  previousKernelDimension: 3,
  _inputSourceTexture: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkRenderPass.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, ['kernel', 'kernelDimension']);

  vtkWebGPUConvolution2DPass(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkWebGPUConvolution2DPass'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
