import macro from 'vtk.js/Sources/macros';
import vtkViewNode from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';
import vtkWebGPUBindGroup from 'vtk.js/Sources/Rendering/WebGPU/BindGroup';
import vtkWebGPUPipeline from 'vtk.js/Sources/Rendering/WebGPU/Pipeline';
import vtkWebGPUShaderCache from 'vtk.js/Sources/Rendering/WebGPU/ShaderCache';
import vtkWebGPUShaderDescription from 'vtk.js/Sources/Rendering/WebGPU/ShaderDescription';
import vtkWebGPUVertexInput from 'vtk.js/Sources/Rendering/WebGPU/VertexInput';

const vtkWebGPUSimpleMapperVS = `
//VTK::Renderer::Dec

//VTK::Color::Dec

//VTK::Normal::Dec

//VTK::TCoord::Dec

//VTK::Select::Dec

//VTK::Mapper::Dec

//VTK::IOStructs::Dec

@stage(vertex)
fn main(
//VTK::IOStructs::Input
)
//VTK::IOStructs::Output
{
  var output : vertexOutput;

  // var vertex: vec4<f32> = vertexBC;

  //VTK::Color::Impl

  //VTK::Normal::Impl

  //VTK::TCoord::Impl

  //VTK::Select::Impl

  //VTK::Position::Impl

  return output;
}
`;

const vtkWebGPUSimpleMapperFS = `
//VTK::Renderer::Dec

//VTK::Color::Dec

//VTK::Normal::Dec

//VTK::TCoord::Dec

//VTK::Select::Dec

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

  //VTK::Color::Impl

  //VTK::Normal::Impl

  //VTK::Light::Impl

  //VTK::TCoord::Impl

  //VTK::Select::Impl

  // var computedColor:vec4<f32> = vec4<f32>(1.0,0.5,0.5,1.0);

  //VTK::RenderEncoder::Impl
  return output;
}
`;

// ----------------------------------------------------------------------------
// vtkWebGPUSimpleMapper methods
// ----------------------------------------------------------------------------

function vtkWebGPUSimpleMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUSimpleMapper');

  publicAPI.generateShaderDescriptions = (hash, pipeline, vertexInput) => {
    // create the shader descriptions
    const vDesc = vtkWebGPUShaderDescription.newInstance({
      type: 'vertex',
      hash,
      code: model.vertexShaderTemplate,
    });
    const fDesc = vtkWebGPUShaderDescription.newInstance({
      type: 'fragment',
      hash,
      code: model.fragmentShaderTemplate,
    });

    // add them to the pipeline
    const sdrs = pipeline.getShaderDescriptions();
    sdrs.push(vDesc);
    sdrs.push(fDesc);

    // look for replacements to invoke
    const scode = model.vertexShaderTemplate + model.fragmentShaderTemplate;
    // eslint-disable-next-line prefer-regex-literals
    const re = new RegExp('//VTK::[^:]*::', 'g');
    const unique = scode.match(re).filter((v, i, a) => a.indexOf(v) === i);
    const fnames = unique.map(
      (v) => `replaceShader${v.substring(7, v.length - 2)}`
    );

    // now invoke shader replacement functions
    for (let i = 0; i < fnames.length; i++) {
      const fname = fnames[i];
      if (
        fname !== 'replaceShaderIOStructs' &&
        model.shaderReplacements.has(fname)
      ) {
        model.shaderReplacements.get(fname)(hash, pipeline, vertexInput);
      }
    }

    // always replace the IOStructs last as other replacement funcs may
    // add inputs or outputs
    publicAPI.replaceShaderIOStructs(hash, pipeline, vertexInput);

    // console.log(vDesc.getCode());
    // console.log(fDesc.getCode());
  };

  publicAPI.replaceShaderIOStructs = (hash, pipeline, vertexInput) => {
    const vDesc = pipeline.getShaderDescription('vertex');
    vDesc.replaceShaderCode(null, vertexInput);
    const fDesc = pipeline.getShaderDescription('fragment');
    fDesc.replaceShaderCode(vDesc);
  };

  publicAPI.replaceShaderRenderEncoder = (hash, pipeline, vertexInput) => {
    model.renderEncoder.replaceShaderCode(pipeline);
  };
  model.shaderReplacements.set(
    'replaceShaderRenderEncoder',
    publicAPI.replaceShaderRenderEncoder
  );

  publicAPI.replaceShaderRenderer = (hash, pipeline, vertexInput) => {
    if (!model.WebGPURenderer) {
      return;
    }
    const ubocode = model.WebGPURenderer.getBindGroup().getShaderCode(pipeline);

    const vDesc = pipeline.getShaderDescription('vertex');
    let code = vDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Renderer::Dec', [
      ubocode,
    ]).result;
    vDesc.setCode(code);

    const fDesc = pipeline.getShaderDescription('fragment');
    code = fDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Renderer::Dec', [
      ubocode,
    ]).result;
    fDesc.setCode(code);
  };
  model.shaderReplacements.set(
    'replaceShaderRenderer',
    publicAPI.replaceShaderRenderer
  );

  publicAPI.replaceShaderMapper = (hash, pipeline, vertexInput) => {
    const ubocode = model.bindGroup.getShaderCode(pipeline);
    const vDesc = pipeline.getShaderDescription('vertex');
    let code = vDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Mapper::Dec', [
      ubocode,
    ]).result;
    vDesc.setCode(code);

    const fDesc = pipeline.getShaderDescription('fragment');
    fDesc.addBuiltinInput('bool', '@builtin(front_facing) frontFacing');
    code = fDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Mapper::Dec', [
      ubocode,
    ]).result;
    fDesc.setCode(code);
  };
  model.shaderReplacements.set(
    'replaceShaderMapper',
    publicAPI.replaceShaderMapper
  );

  publicAPI.replaceShaderPosition = (hash, pipeline, vertexInput) => {
    const vDesc = pipeline.getShaderDescription('vertex');
    vDesc.addBuiltinOutput('vec4<f32>', '@builtin(position) Position');
    let code = vDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Position::Impl', [
      '    output.Position = rendererUBO.SCPCMatrix*vertexBC;',
    ]).result;
    vDesc.setCode(code);
  };
  model.shaderReplacements.set(
    'replaceShaderPosition',
    publicAPI.replaceShaderPosition
  );

  publicAPI.replaceShaderTCoord = (hash, pipeline, vertexInput) => {
    const vDesc = pipeline.getShaderDescription('vertex');
    vDesc.addOutput('vec2<f32>', 'tcoordVS');
  };
  model.shaderReplacements.set(
    'replaceShaderTCoord',
    publicAPI.replaceShaderTCoord
  );

  publicAPI.addTextureView = (view) => {
    // is it already there?
    if (model.textureViews.includes(view)) {
      return;
    }
    model.textureViews.push(view);
  };

  // do everything required for this mapper to be rerady to draw
  // but do not bind or do the actual draw commands as the pipeline
  // is not neccessarily bound yet
  publicAPI.prepareToDraw = (renderEncoder) => {
    model.renderEncoder = renderEncoder;

    // do anything needed to get our input data up to date
    publicAPI.updateInput();

    // make sure buffers are created and up to date
    publicAPI.updateBuffers();

    // update bindings and bind groups/layouts
    // does not acutally bind them, that is done in draw(...)
    publicAPI.updateBindings();

    // update the pipeline, includes computing the hash, and if needed
    // creating the pipeline, shader code etc
    publicAPI.updatePipeline();
  };

  publicAPI.updateInput = () => {};

  publicAPI.updateBuffers = () => {};

  publicAPI.updateBindings = () => {
    // bindings can change without a pipeline change
    // as long as their layout remains the same.
    // That is why this is done even when the pipeline
    // hash doesn't change.
    model.bindGroup.setBindables(publicAPI.getBindables());
  };

  publicAPI.computePipelineHash = () => {};

  publicAPI.registerDrawCallback = (encoder) => {
    encoder.registerDrawCallback(model.pipeline, publicAPI.draw);
  };

  publicAPI.prepareAndDraw = (encoder) => {
    publicAPI.prepareToDraw(encoder);
    encoder.setPipeline(model.pipeline);
    publicAPI.draw(encoder);
  };

  // do the rest of the calls required to draw this mapper
  // at this point the command encouder and pipeline are
  // created and bound
  publicAPI.draw = (renderEncoder) => {
    const pipeline = renderEncoder.getBoundPipeline();

    // bind the mapper bind group
    renderEncoder.activateBindGroup(model.bindGroup);

    // bind the vertex input
    pipeline.bindVertexInput(renderEncoder, model.vertexInput);
    const indexBuffer = model.vertexInput.getIndexBuffer();
    if (indexBuffer) {
      renderEncoder.drawIndexed(
        indexBuffer.getIndexCount(),
        model.numberOfInstances,
        0,
        0,
        0
      );
    } else {
      renderEncoder.draw(model.numberOfVertices, model.numberOfInstances, 0, 0);
    }
  };

  publicAPI.getBindables = () => {
    const bindables = [...model.additionalBindables];
    if (model.UBO) {
      bindables.push(model.UBO);
    }

    if (model.SSBO) {
      bindables.push(model.SSBO);
    }

    // add texture BindGroupLayouts
    for (let t = 0; t < model.textureViews.length; t++) {
      bindables.push(model.textureViews[t]);
      const samp = model.textureViews[t].getSampler();
      if (samp) {
        bindables.push(samp);
      }
    }

    return bindables;
  };

  publicAPI.updatePipeline = () => {
    publicAPI.computePipelineHash();
    model.pipeline = model.device.getPipeline(model.pipelineHash);

    // build the pipeline if needed
    if (!model.pipeline) {
      model.pipeline = vtkWebGPUPipeline.newInstance();
      model.pipeline.setDevice(model.device);

      if (model.WebGPURenderer) {
        model.pipeline.addBindGroupLayout(model.WebGPURenderer.getBindGroup());
        model.pipeline.addDrawCallback(model.WebGPURenderer.bindUBO);
      }

      model.pipeline.addBindGroupLayout(model.bindGroup);

      publicAPI.generateShaderDescriptions(
        model.pipelineHash,
        model.pipeline,
        model.vertexInput
      );
      model.pipeline.setTopology(model.topology);
      model.pipeline.setRenderEncoder(model.renderEncoder);
      model.pipeline.setVertexState(
        model.vertexInput.getVertexInputInformation()
      );
      model.device.createPipeline(model.pipelineHash, model.pipeline);
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  additionalBindables: undefined,
  bindGroup: null,
  device: null,
  fragmentShaderTemplate: null,
  numberOfInstances: 1,
  numberOfVertices: 0,
  pipelineHash: null,
  shaderReplacements: null,
  SSBO: null,
  textureViews: null,
  topology: 'triangle-list',
  UBO: null,
  vertexShaderTemplate: null,
  WebGPURenderer: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkViewNode.extend(publicAPI, model, initialValues);

  model.textureViews = [];
  model.vertexInput = vtkWebGPUVertexInput.newInstance();

  model.bindGroup = vtkWebGPUBindGroup.newInstance({ label: 'mapperBG' });

  model.additionalBindables = [];

  model.fragmentShaderTemplate =
    model.fragmentShaderTemplate || vtkWebGPUSimpleMapperFS;
  model.vertexShaderTemplate =
    model.vertexShaderTemplate || vtkWebGPUSimpleMapperVS;

  model.shaderReplacements = new Map();

  // Build VTK API
  macro.get(publicAPI, model, ['pipeline', 'vertexInput']);
  macro.setGet(publicAPI, model, [
    'additionalBindables',
    'device',
    'fragmentShaderTemplate',
    'interpolate',
    'numberOfInstances',
    'numberOfVertices',
    'pipelineHash',
    'shaderReplacements',
    'SSBO',
    'textureViews',
    'topology',
    'UBO',
    'vertexShaderTemplate',
    'WebGPURenderer',
  ]);

  // Object methods
  vtkWebGPUSimpleMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkWebGPUSimpleMapper');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
