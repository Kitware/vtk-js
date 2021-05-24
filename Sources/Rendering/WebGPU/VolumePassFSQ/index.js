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

fn processVolume(vNum: i32, posSC: vec4<f32>, tfunRows: f32) -> vec4<f32>
{
  var outColor: vec4<f32> = vec4<f32>(0.0, 0.0, 0.0, 0.0);

  // convert to tcoords and reject if outside the volume
  var tpos: vec4<f32> = volumeSSBO.values[vNum].SCTCMatrix*posSC;
  // var tpos: vec4<f32> = posSC*0.003;
  if (tpos.x < 0.0 || tpos.y < 0.0 || tpos.z < 0.0 ||
      tpos.x > 1.0 || tpos.y > 1.0 || tpos.z > 1.0) { return outColor; }

  var scalar: f32 = 512.0 * f32(vNum) + 180.0 * tpos.z;

  // todo correct V coord calcs based on components etc
  var coord: vec2<f32> =
    vec2<f32>(scalar * volumeSSBO.values[vNum].cScale + volumeSSBO.values[vNum].cShift,
      (0.5 + 2.0 * f32(vNum)) / tfunRows);
  var color: vec4<f32> = textureSampleLevel(tfunTexture, tfunTextureSampler, coord, 0.0);
  coord.x = scalar * volumeSSBO.values[vNum].oScale + volumeSSBO.values[vNum].oShift;
  var opacity: f32 = textureSampleLevel(ofunTexture, tfunTextureSampler, coord, 0.0).r;
  outColor = vec4<f32>(color.rgb, opacity);

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

    // how many rows (tfuns) do we have in our tfunTexture
    var tfunRows: f32 = f32(textureDimensions(tfunTexture).y);

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
      calls.push(
        `      sampleColor = processVolume(${i}, rayPosSC, tfunRows);`
      );
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

  publicAPI.updateLUTImage = (device) => {
    // rebuild color tfun?
    // const toString = `${vprop.getMTime()}`;
    // if (model.colorTextureString !== toString) {

    // first determine how large the image should be
    model.numRows = 0;
    for (let vidx = 0; vidx < model.volumes.length; vidx++) {
      const webgpuvol = model.volumes[vidx];
      const actor = webgpuvol.getRenderable();
      const volMapr = actor.getMapper();
      const vprop = actor.getProperty();
      const image = volMapr.getInputData();
      const scalars = image.getPointData() && image.getPointData().getScalars();

      const numComp = scalars.getNumberOfComponents();
      const iComps = vprop.getIndependentComponents();
      const numIComps = iComps ? numComp : 1;
      model.numRows += numIComps;
    }

    // allocate the image array
    const colorArray = new Uint8Array(model.numRows * 2 * model.rowLength * 4);
    const opacityArray = new Float32Array(model.numRows * 2 * model.rowLength);

    let imgRow = 0;
    const tmpTable = new Float32Array(model.rowLength * 3);
    const rowLength = model.rowLength;
    for (let vidx = 0; vidx < model.volumes.length; vidx++) {
      const webgpuvol = model.volumes[vidx];
      const actor = webgpuvol.getRenderable();
      const volMapr = actor.getMapper();
      const vprop = actor.getProperty();
      const image = volMapr.getInputData();
      const scalars = image.getPointData() && image.getPointData().getScalars();

      const numComp = scalars.getNumberOfComponents();
      const iComps = vprop.getIndependentComponents();
      const numIComps = iComps ? numComp : 1;

      for (let c = 0; c < numIComps; ++c) {
        const cfun = vprop.getRGBTransferFunction(c);
        const cRange = cfun.getRange();
        cfun.getTable(cRange[0], cRange[1], rowLength, tmpTable, 1);
        let ioffset = imgRow * rowLength * 4;
        for (let i = 0; i < rowLength; ++i) {
          colorArray[ioffset + i * 4] = 255.0 * tmpTable[i * 3];
          colorArray[ioffset + i * 4 + 1] = 255.0 * tmpTable[i * 3 + 1];
          colorArray[ioffset + i * 4 + 2] = 255.0 * tmpTable[i * 3 + 2];
          colorArray[ioffset + i * 4 + 3] = 255.0;
          for (let co = 0; co < 4; co++) {
            colorArray[ioffset + (rowLength + i) * 4 + co] =
              colorArray[ioffset + i * 4 + co];
          }
        }

        const ofun = vprop.getScalarOpacity(c);
        const opacityFactor =
          model.sampleDist / vprop.getScalarOpacityUnitDistance(c);

        const oRange = ofun.getRange();
        ofun.getTable(oRange[0], oRange[1], rowLength, tmpTable, 1);
        // adjust for sample distance etc
        ioffset = imgRow * rowLength;
        for (let i = 0; i < rowLength; ++i) {
          opacityArray[ioffset + i] =
            1.0 - (1.0 - tmpTable[i]) ** opacityFactor;
          opacityArray[ioffset + i + rowLength] = opacityArray[ioffset + i];
        }
        imgRow += 2;
      }
    }

    {
      const treq = {
        nativeArray: colorArray,
        width: model.rowLength,
        height: model.numRows * 2,
        depth: 1,
        format: 'rgba8unorm',
      };
      const newTex = device.getTextureManager().getTexture(treq);
      const tview = newTex.createView();
      tview.setName('tfunTexture');
      model.textureViews[2] = tview;
      tview.addSampler(device, {
        minFilter: 'linear',
        maxFilter: 'linear',
      });
    }

    {
      const treq = {
        nativeArray: opacityArray,
        width: model.rowLength,
        height: model.numRows * 2,
        depth: 1,
        format: 'r32float',
      };
      const newTex = device.getTextureManager().getTexture(treq);
      const tview = newTex.createView();
      tview.setName('ofunTexture');
      model.textureViews[3] = tview;
    }

    model.colorTextureString = toString;
  };

  publicAPI.updateBuffers = (device) => {
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
    if (model.sampleDist !== sampleDist) {
      model.sampleDist = sampleDist;
      model.UBO.setValue('SampleDistance', sampleDist);
      model.UBO.sendIfNeeded(device);
    }

    // depends on
    // - center time
    // - volumes array (length and values)
    // - matrix of each volume
    // - worldtoindex of each volume mapper's data
    const center = model.WebGPURenderer.getStabilizedCenterByReference();
    if (publicAPI.getMTime() > model.SSBO.getSendTime()) {
      // todo need a good check here for everything
      // that can change, break into pieces each with their
      // own check move out of this block
      publicAPI.updateLUTImage(device);

      model.SSBO.clearData();
      model.SSBO.setNumberOfInstances(model.volumes.length);

      // create SCTC matrices  SC -> world -> model -> index -> tcoord
      //
      // when doing coord conversions from A to C recall
      // the order is mat4.mult(AtoC, BtoC, AtoB);
      //
      const marray = new Float64Array(model.volumes.length * 16);
      const cScaleArray = new Float64Array(model.numRows);
      const cShiftArray = new Float64Array(model.numRows);
      const oScaleArray = new Float64Array(model.numRows);
      const oShiftArray = new Float64Array(model.numRows);
      let rowIdx = 0;
      for (let vidx = 0; vidx < model.volumes.length; vidx++) {
        const webgpuvol = model.volumes[vidx];
        const actor = webgpuvol.getRenderable();
        const volMapr = actor.getMapper();
        const vprop = actor.getProperty();
        const image = volMapr.getInputData();
        const scalars =
          image.getPointData() && image.getPointData().getScalars();

        const numComp = scalars.getNumberOfComponents();
        const iComps = vprop.getIndependentComponents();
        // const numIComps = iComps ? numComp : 1;

        const volInfo = { scale: [1.0], offset: [0.0] };
        // three levels of shift scale combined into one
        // for performance in the fragment shader
        for (let compIdx = 0; compIdx < numComp; compIdx++) {
          const target = iComps ? compIdx : 0;
          const sscale = volInfo.scale[compIdx];
          const ofun = vprop.getScalarOpacity(target);
          const oRange = ofun.getRange();
          const oscale = sscale / (oRange[1] - oRange[0]);
          const oshift =
            (volInfo.offset[compIdx] - oRange[0]) / (oRange[1] - oRange[0]);
          oShiftArray[rowIdx] = oshift;
          oScaleArray[rowIdx] = oscale;

          const cfun = vprop.getRGBTransferFunction(target);
          const cRange = cfun.getRange();
          cShiftArray[rowIdx] =
            (volInfo.offset[compIdx] - cRange[0]) / (cRange[1] - cRange[0]);
          cScaleArray[rowIdx] = sscale / (cRange[1] - cRange[0]);
          rowIdx++;
        }

        mat4.identity(tmpMat4);
        mat4.translate(tmpMat4, tmpMat4, center);
        // tmpMat4 is now SC->World

        const vol = model.volumes[vidx];
        const mcwcmat = vol.getRenderable().getMatrix();
        mat4.transpose(tmp2Mat4, mcwcmat);
        mat4.invert(tmp2Mat4, tmp2Mat4);
        // tmp2Mat4 is now world to model

        mat4.multiply(tmpMat4, tmp2Mat4, tmpMat4);
        // tmp4Mat is now SC->Model

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
          marray[vidx * 16 + j] = tmpMat4[j];
        }
      }

      model.SSBO.addEntry('SCTCMatrix', 'mat4x4<f32>');
      model.SSBO.addEntry('cScale', 'f32');
      model.SSBO.addEntry('cShift', 'f32');
      model.SSBO.addEntry('oScale', 'f32');
      model.SSBO.addEntry('oShift', 'f32');
      model.SSBO.setAllInstancesFromArray('SCTCMatrix', marray);
      model.SSBO.setAllInstancesFromArray('cScale', cScaleArray);
      model.SSBO.setAllInstancesFromArray('cShift', cShiftArray);
      model.SSBO.setAllInstancesFromArray('oScale', oScaleArray);
      model.SSBO.setAllInstancesFromArray('oShift', oShiftArray);
      model.SSBO.send(device);
    }
  };

  publicAPI.computePipelineHash = () => {
    model.pipelineHash = `volfsq${model.volumes.length}`;
  };

  const superclassBuild = publicAPI.build;
  publicAPI.build = (renderEncoder, device) => {
    publicAPI.computePipelineHash();
    publicAPI.updateBuffers(device);

    superclassBuild(renderEncoder, device);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  volumes: null,
  rowLength: 1024,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkWebGPUFullScreenQuad.extend(publicAPI, model, initialValues);

  model.fragmentShaderTemplate = volFragTemplate;

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
