import macro from 'vtk.js/Sources/macros';
import vtkWebGPUBindGroup from 'vtk.js/Sources/Rendering/WebGPU/BindGroup';
import vtkWebGPUPipeline from 'vtk.js/Sources/Rendering/WebGPU/Pipeline';
import vtkWebGPUShaderCache from 'vtk.js/Sources/Rendering/WebGPU/ShaderCache';
import vtkWebGPUShaderDescription from 'vtk.js/Sources/Rendering/WebGPU/ShaderDescription';
import vtkWebGPUVertexInput from 'vtk.js/Sources/Rendering/WebGPU/VertexInput';

const vtkWebGPUMapperHelperVS = `
//VTK::Renderer::Dec

//VTK::Color::Dec

//VTK::Normal::Dec

//VTK::TCoord::Dec

//VTK::Select::Dec

//VTK::Mapper::Dec

//VTK::IOStructs::Dec

[[stage(vertex)]]
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

const vtkWebGPUMapperHelperFS = `
//VTK::Renderer::Dec

//VTK::Color::Dec

//VTK::Normal::Dec

//VTK::TCoord::Dec

//VTK::Select::Dec

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
// vtkWebGPUMapperHelper methods
// ----------------------------------------------------------------------------

function vtkWebGPUMapperHelper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUMapperHelper');

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
    fDesc.addBuiltinInput('bool', '[[builtin(front_facing)]] frontFacing');
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
    vDesc.addBuiltinOutput('vec4<f32>', '[[builtin(position)]] Position');
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

  publicAPI.renderForPipeline = (renderEncoder) => {
    const pipeline = renderEncoder.getBoundPipeline();

    // bind the mapper bind group
    renderEncoder.activateBindGroup(model.bindGroup);

    // bind the vertex input
    pipeline.bindVertexInput(renderEncoder, model.vertexInput);
    renderEncoder.draw(model.numberOfVertices, model.numberOfInstances, 0, 0);
  };

  publicAPI.registerToDraw = () => {
    if (model.pipeline) {
      model.WebGPURenderer.registerPipelineCallback(
        model.pipeline,
        publicAPI.renderForPipeline
      );
    }
  };

  publicAPI.render = (renderEncoder, device) => {
    publicAPI.build(renderEncoder, device);
    renderEncoder.setPipeline(model.pipeline);
    if (model.WebGPURenderer) {
      model.WebGPURenderer.bindUBO(renderEncoder);
    }
    publicAPI.renderForPipeline(renderEncoder);
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

  publicAPI.build = (renderEncoder, device) => {
    // handle per primitive type
    model.renderEncoder = renderEncoder;

    model.pipeline = device.getPipeline(model.pipelineHash);

    model.bindGroup.setBindables(publicAPI.getBindables());

    // build VBO for this primitive
    // build the pipeline if needed
    if (!model.pipeline) {
      model.pipeline = vtkWebGPUPipeline.newInstance();
      model.pipeline.setDevice(device);

      if (model.WebGPURenderer) {
        model.pipeline.addBindGroupLayout(model.WebGPURenderer.getBindGroup());
      }

      model.pipeline.addBindGroupLayout(model.bindGroup);

      publicAPI.generateShaderDescriptions(
        model.pipelineHash,
        model.pipeline,
        model.vertexInput
      );
      model.pipeline.setTopology(model.topology);
      model.pipeline.setRenderEncoder(renderEncoder);
      model.pipeline.setVertexState(
        model.vertexInput.getVertexInputInformation()
      );
      device.createPipeline(model.pipelineHash, model.pipeline);
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
  macro.obj(publicAPI, model);

  model.textureViews = [];
  model.vertexInput = vtkWebGPUVertexInput.newInstance();

  model.bindGroup = vtkWebGPUBindGroup.newInstance();
  model.bindGroup.setName('mapperBG');

  model.additionalBindables = [];

  model.fragmentShaderTemplate =
    model.fragmentShaderTemplate || vtkWebGPUMapperHelperFS;
  model.vertexShaderTemplate =
    model.vertexShaderTemplate || vtkWebGPUMapperHelperVS;

  model.shaderReplacements = new Map();

  // Build VTK API
  macro.get(publicAPI, model, ['vertexInput']);
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
  vtkWebGPUMapperHelper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkWebGPUMapperHelper');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
