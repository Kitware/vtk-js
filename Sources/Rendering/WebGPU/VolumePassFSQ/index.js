import macro from 'vtk.js/Sources/macro';
import { mat4 } from 'gl-matrix';
import vtkWebGPUFullScreenQuad from 'vtk.js/Sources/Rendering/WebGPU/FullScreenQuad';
import vtkWebGPUUniformBuffer from 'vtk.js/Sources/Rendering/WebGPU/UniformBuffer';
import vtkWebGPUShaderCache from 'vtk.js/Sources/Rendering/WebGPU/ShaderCache';
import vtkWebGPUStorageBuffer from 'vtk.js/Sources/Rendering/WebGPU/StorageBuffer';

const volFragTemplate = `
//VTK::Renderer::Dec

//VTK::Mapper::Dec

//VTK::TCoord::Dec

//VTK::RenderEncoder::Dec

//VTK::IOStructs::Dec

fn processVolume(vNum: i32, posSC: vec4<f32>) -> vec4<f32>
{
  var outColor: vec4<f32> = vec4<f32>(0.0, 0.0, 0.0, 0.0);

  // convert to tcoords and reject if outside the volume
  var tpos: vec4<f32> = volumeSSBO.values[vNum].SCTCMatrix*posSC;
  // var tpos: vec4<f32> = posSC*0.003;
  if (tpos.x < 0.0 || tpos.y < 0.0 || tpos.z < 0.0 ||
      tpos.x > 1.0 || tpos.y > 1.0 || tpos.z > 1.0) { return outColor; }

  outColor = vec4<f32>(f32(vNum), 0.0, 1.0 - f32(vNum), 0.01);

  //VTK::Volume::Process

  return outColor;
}

[[stage(fragment)]]
fn main(
//VTK::IOStructs::Input
)
//VTK::IOStructs::Output
{
  var output: fragmentOutput;

  var rayMax: f32 = textureSample(maxTexture, maxTextureSampler, input.tcoordVS).r;
  var rayMin: f32 = textureSample(minTexture, minTextureSampler, input.tcoordVS).r;

  // discard empty rays
  if (rayMax <= rayMin) { discard; }
  else
  {
    var winDimsI32: vec2<i32> = textureDimensions(minTexture);
    var winDims: vec2<f32> = vec2<f32>(f32(winDimsI32.x), f32(winDimsI32.y));

    // compute start and end ray positions in view coordinates
    var minPosSC: vec4<f32> = rendererUBO.PCSCMatrix*vec4<f32>(2.0*input.fragPos.x/winDims.x - 1.0, 1.0 - 2.0 * input.fragPos.y/winDims.y, rayMin, 1.0);
    minPosSC = minPosSC * (1.0 / minPosSC.w);
    var maxPosSC: vec4<f32> = rendererUBO.PCSCMatrix*vec4<f32>(2.0*input.fragPos.x/winDims.x - 1.0, 1.0 - 2.0 * input.fragPos.y/winDims.y, rayMax, 1.0);
    maxPosSC = maxPosSC * (1.0 / maxPosSC.w);

    // initial ray position is at the beginning
    var rayPosSC: vec4<f32> = minPosSC;
    var rayLengthSC: f32 = distance(minPosSC.xyz, maxPosSC.xyz);
    var rayStepSC: vec4<f32> = (maxPosSC - minPosSC)*(mapperUBO.SampleDistance/rayLengthSC);
    rayStepSC.w = 0.0;

    var curDist: f32 = 0.0;
    var computedColor: vec4<f32> = vec4<f32>(0.0, 0.0, 0.0, 0.0);
    var sampleColor: vec4<f32>;
    loop
    {
      // for each volume, sample and accumulate color

//VTK::Volume::Calls

      // increment position
      curDist = curDist + mapperUBO.SampleDistance;
      rayPosSC = rayPosSC + rayStepSC;

      // check if we have reached a terminating condition
      if (curDist > rayLengthSC) { break; }
      if (computedColor.a > 0.98) { break; }
    }

  // var computedColor: vec4<f32> = vec4<f32>(rayMin, rayMax, 0.0, min(100.0*(rayMax - rayMin), 1.0));
  // computedColor = vec4<f32>(rayLengthSC / 500.0, 1.0, 0.0, 1.0);
  // computedColor = vec4<f32>(maxPosSC.xyz*0.01, 1.0);

  //VTK::RenderEncoder::Impl
  }

  return output;
}
`;

const tmpMat4 = new Float64Array(16);
const tmp2Mat4 = new Float64Array(16);

// ----------------------------------------------------------------------------
// vtkWebGPUVolumePassFSQ methods
// ----------------------------------------------------------------------------

function vtkWebGPUVolumePassFSQ(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUVolumePassFSQ');

  publicAPI.replaceShaderPosition = (hash, pipeline, vertexInput) => {
    const vDesc = pipeline.getShaderDescription('vertex');
    vDesc.addBuiltinOutput('vec4<f32>', '[[builtin(position)]] Position');
    let code = vDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Position::Impl', [
      'output.tcoordVS = vec2<f32>(vertexBC.x * 0.5 + 0.5, 1.0 - vertexBC.y * 0.5 - 0.5);',
      'output.Position = vec4<f32>(vertexBC, 1.0);',
    ]).result;
    vDesc.setCode(code);
    const fDesc = pipeline.getShaderDescription('fragment');
    fDesc.addBuiltinInput('vec4<f32>', '[[builtin(position)]] fragPos');
  };
  model.shaderReplacements.set(
    'replaceShaderPosition',
    publicAPI.replaceShaderPosition
  );

  publicAPI.replaceShaderVolume = (hash, pipeline, vertexInput) => {
    const fDesc = pipeline.getShaderDescription('fragment');
    let code = fDesc.getCode();
    const calls = [];
    for (let i = 0; i < model.volumes.length; i++) {
      calls.push(`      sampleColor = processVolume(${i}, rayPosSC);`);
      calls.push(`      computedColor = vec4<f32>(
        sampleColor.a * sampleColor.rgb * (1.0 - computedColor.a) + computedColor.rgb,
        (1.0 - computedColor.a)*sampleColor.a + computedColor.a);`);
    }
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Volume::Calls', calls)
      .result;
    fDesc.setCode(code);
  };
  model.shaderReplacements.set(
    'replaceShaderVolume',
    publicAPI.replaceShaderVolume
  );

  publicAPI.updateUBO = (device) => {
    const utime = model.UBO.getSendTime();
    if (publicAPI.getMTime() > utime) {
      const center = model.WebGPURenderer.getStabilizedCenterByReference();

      // compute the min step size
      let sampleDist = model.volumes[0]
        .getRenderable()
        .getMapper()
        .getSampleDistance();
      for (let i = 0; i < model.volumes.length; i++) {
        const vol = model.volumes[i];
        const volMapr = vol.getRenderable().getMapper();
        const sd = volMapr.getSampleDistance();
        if (sd < sampleDist) {
          sampleDist = sd;
        }
      }
      model.UBO.setValue('SampleDistance', sampleDist);
      model.UBO.sendIfNeeded(device);

      model.SSBO.clearData();
      model.SSBO.setNumberOfInstances(model.volumes.length);

      // create SCTC matrices
      //
      // SC -> world -> model -> index -> tcoord
      // when doing coord conversions from A to C
      // the order is mat4.mult(AtoC, BtoC, AtoB);
      //
      const marray = new Float64Array(model.volumes.length * 16);
      for (let i = 0; i < model.volumes.length; i++) {
        mat4.identity(tmpMat4);
        mat4.translate(tmpMat4, tmpMat4, center);
        // tmpMat4 is now SC->World

        const vol = model.volumes[i];
        const mcwcmat = vol.getRenderable().getMatrix();
        mat4.transpose(tmp2Mat4, mcwcmat);
        mat4.invert(tmp2Mat4, tmp2Mat4);
        // tmp2Mat4 is now world to model

        mat4.multiply(tmpMat4, tmp2Mat4, tmpMat4);
        // tmp4Mat is now SC->Model

        const volMapr = vol.getRenderable().getMapper();
        const image = volMapr.getInputData();
        // the method on the data is world to index but the volume is in
        // model coordinates so really in this context it is model to index
        const modelToIndex = image.getWorldToIndex();
        mat4.transpose(tmp2Mat4, modelToIndex);
        mat4.multiply(tmpMat4, tmp2Mat4, tmpMat4);
        // tmpMat4 is now SC -> Index

        const dims = image.getDimensions();
        mat4.identity(tmp2Mat4);
        mat4.scale(tmp2Mat4, tmp2Mat4, [
          1.0 / dims[0],
          1.0 / dims[1],
          1.0 / dims[2],
        ]);
        mat4.multiply(tmpMat4, tmp2Mat4, tmpMat4);
        // tmpMat4 is now SC -> Tcoord

        for (let j = 0; j < 16; j++) {
          marray[i * 16 + j] = tmpMat4[j];
        }
      }
      model.SSBO.addEntry('SCTCMatrix', 'mat4x4<f32>');
      model.SSBO.setAllInstancesFromArray('SCTCMatrix', marray);
      model.SSBO.send(device);
    }
  };

  const superclassBuild = publicAPI.build;
  publicAPI.build = (renderEncoder, device) => {
    publicAPI.updateUBO(device);
    superclassBuild(renderEncoder, device);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  volumes: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkWebGPUFullScreenQuad.extend(publicAPI, model, initialValues);

  model.fragmentShaderTemplate = volFragTemplate;

  // todo need to compute a hash in this class as
  // the pipeline will change due to num volumes etc
  publicAPI.setPipelineHash('volfsq');

  model.UBO = vtkWebGPUUniformBuffer.newInstance();
  model.UBO.setName('mapperUBO');
  model.UBO.addEntry('SampleDistance', 'f32');

  model.SSBO = vtkWebGPUStorageBuffer.newInstance();
  model.SSBO.setName('volumeSSBO');

  macro.setGet(publicAPI, model, ['volumes']);

  // Object methods
  vtkWebGPUVolumePassFSQ(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkWebGPUVolumePassFSQ');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
