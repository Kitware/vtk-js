import macro from 'vtk.js/Sources/macros';
import { mat4 } from 'gl-matrix';
import vtkWebGPUFullScreenQuad from 'vtk.js/Sources/Rendering/WebGPU/FullScreenQuad';
import vtkWebGPUUniformBuffer from 'vtk.js/Sources/Rendering/WebGPU/UniformBuffer';
import vtkWebGPUShaderCache from 'vtk.js/Sources/Rendering/WebGPU/ShaderCache';
import vtkWebGPUStorageBuffer from 'vtk.js/Sources/Rendering/WebGPU/StorageBuffer';
import vtkWebGPUSampler from 'vtk.js/Sources/Rendering/WebGPU/Sampler';

import { BlendMode } from 'vtk.js/Sources/Rendering/Core/VolumeMapper/Constants';

const volFragTemplate = `
//VTK::Renderer::Dec

//VTK::Mapper::Dec

//VTK::TCoord::Dec

//VTK::RenderEncoder::Dec

//VTK::IOStructs::Dec

// dummy for now till they support 3d textures
fn getTextureValue(vTex: texture_3d<f32>, tpos: vec4<f32>, vNum: i32) -> f32
{
  return textureSampleLevel(vTex, clampSampler, tpos.xyz, 0.0).a;
  // 512.0 * f32(vNum) + 20.0 * trunc(10.0 * tpos.z);
}

fn getGradient(vTex: texture_3d<f32>, tpos: vec4<f32>, vNum: i32, scalar: f32) -> vec4<f32>
{
  var result: vec4<f32>;

  var tstep: vec4<f32> = volumeSSBO.values[vNum].tstep;
  result.x = getTextureValue(vTex, tpos + vec4<f32>(tstep.x, 0.0, 0.0, 1.0), vNum) - scalar;
  result.y = getTextureValue(vTex, tpos + vec4<f32>(0.0, tstep.y, 0.0, 1.0), vNum) - scalar;
  result.z = getTextureValue(vTex, tpos + vec4<f32>(0.0, 0.0, tstep.z, 1.0), vNum) - scalar;

  // divide by spacing
  result = result / volumeSSBO.values[vNum].spacing;

  var grad: f32 = length(result.xyz);

  // // rotate to View Coords
  // result.xyz =
  //   result.x * vPlaneNormal0 +
  //   result.y * vPlaneNormal2 +
  //   result.z * vPlaneNormal4;

  if (grad > 0.0)
  {
    result = result * (1.0 / grad);
  }

  result.w = grad;

  return result;
}

fn processVolume(vTex: texture_3d<f32>, vNum: i32, cNum: i32, posSC: vec4<f32>, tfunRows: f32) -> vec4<f32>
{
  var outColor: vec4<f32> = vec4<f32>(0.0, 0.0, 0.0, 0.0);

  // convert to tcoords and reject if outside the volume
  var tpos: vec4<f32> = volumeSSBO.values[vNum].SCTCMatrix*posSC;
  // var tpos: vec4<f32> = posSC*0.003;
  if (tpos.x < 0.0 || tpos.y < 0.0 || tpos.z < 0.0 ||
      tpos.x > 1.0 || tpos.y > 1.0 || tpos.z > 1.0) { return outColor; }

  var scalar: f32 = getTextureValue(vTex, tpos, vNum);

  var coord: vec2<f32> =
    vec2<f32>(scalar * componentSSBO.values[cNum].cScale + componentSSBO.values[cNum].cShift,
      (0.5 + 2.0 * f32(vNum)) / tfunRows);
  var color: vec4<f32> = textureSampleLevel(tfunTexture, clampSampler, coord, 0.0);
  coord.x = scalar * componentSSBO.values[cNum].oScale + componentSSBO.values[cNum].oShift;

  var gofactor: f32 = 1.0;
  if (componentSSBO.values[cNum].gomin <  1.0)
  {
    var normal: vec4<f32> = getGradient(vTex, tpos, vNum, scalar);
    gofactor = clamp(normal.a*componentSSBO.values[cNum].goScale + componentSSBO.values[cNum].goShift,
      componentSSBO.values[cNum].gomin, componentSSBO.values[cNum].gomax);
  }
  var opacity: f32 = gofactor*textureSampleLevel(ofunTexture, clampSampler, coord, 0.0).r;
  outColor = vec4<f32>(color.rgb, opacity);

  //VTK::Volume::Process

  return outColor;
}

fn composite(rayLengthSC: f32, minPosSC: vec4<f32>, rayStepSC: vec4<f32>) -> vec4<f32>
{
  // initial ray position is at the beginning
  var rayPosSC: vec4<f32> = minPosSC;

  // how many rows (tfuns) do we have in our tfunTexture
  var tfunRows: f32 = f32(textureDimensions(tfunTexture).y);

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
  return computedColor;
}

[[stage(fragment)]]
fn main(
//VTK::IOStructs::Input
)
//VTK::IOStructs::Output
{
  var output: fragmentOutput;

  var rayMax: f32 = textureSampleLevel(maxTexture, clampSampler, input.tcoordVS, 0.0).r;
  var rayMin: f32 = textureSampleLevel(minTexture, clampSampler, input.tcoordVS, 0.0).r;

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

    var rayLengthSC: f32 = distance(minPosSC.xyz, maxPosSC.xyz);
    var rayStepSC: vec4<f32> = (maxPosSC - minPosSC)*(mapperUBO.SampleDistance/rayLengthSC);
    rayStepSC.w = 0.0;

    //VTK::Volume::Loop

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
      // todo pass rowPos
      calls.push(
        `      sampleColor = processVolume(volTexture${i}, ${i}, ${model.rowStarts[i]}, rayPosSC, tfunRows);`
      );
      calls.push(`      computedColor = vec4<f32>(
        sampleColor.a * sampleColor.rgb * (1.0 - computedColor.a) + computedColor.rgb,
        (1.0 - computedColor.a)*sampleColor.a + computedColor.a);`);
    }
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Volume::Calls', calls)
      .result;
    if (model.blendMode === BlendMode.COMPOSITE_BLEND) {
      code = vtkWebGPUShaderCache.substitute(code, '//VTK::Volume::Loop', [
        'var computedColor: vec4<f32> = composite(rayLengthSC, minPosSC, rayStepSC);',
      ]).result;
    }
    fDesc.setCode(code);
  };
  model.shaderReplacements.set(
    'replaceShaderVolume',
    publicAPI.replaceShaderVolume
  );

  publicAPI.updateLUTImage = (device) => {
    // depends on
    // - volumes array (length and values) - mtime
    // - tfun arrays - renderable/property mtime

    let mtime = publicAPI.getMTime();
    for (let i = 0; i < model.volumes.length; i++) {
      const vol = model.volumes[i].getRenderable();
      const image = vol.getMapper().getInputData();
      mtime = Math.max(mtime, vol.getMTime(), image.getMTime());
    }

    if (mtime < model.lutBuildTime.getMTime()) {
      return;
    }

    // first determine how large the image should be
    model.numRows = 0;
    model.rowStarts = [];
    for (let vidx = 0; vidx < model.volumes.length; vidx++) {
      model.rowStarts.push(model.numRows);
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

    model.lutBuildTime.modified();
  };

  publicAPI.updateSSBO = (device) => {
    // if any of
    // - color or opacity tfun ranges changed - volume Mtime
    // - any volume matrix changed - volume MTime
    // - stabilized center changed - ren.stabilizedMTime
    // - any volume's input data worldtoindex or dimensions changed - input's mtime
    //
    let mtime = Math.max(
      publicAPI.getMTime(),
      model.WebGPURenderer.getStabilizedTime()
    );
    for (let i = 0; i < model.volumes.length; i++) {
      const vol = model.volumes[i].getRenderable();
      const image = vol.getMapper().getInputData();
      mtime = Math.max(mtime, vol.getMTime(), image.getMTime());
    }
    if (mtime < model.SSBO.getSendTime()) {
      return;
    }

    // create the volumeSBBO
    const center = model.WebGPURenderer.getStabilizedCenterByReference();
    model.SSBO.clearData();
    model.SSBO.setNumberOfInstances(model.volumes.length);

    // create SCTC matrices  SC -> world -> model -> index -> tcoord
    //
    // when doing coord conversions from A to C recall
    // the order is mat4.mult(AtoC, BtoC, AtoB);
    //
    const marray = new Float64Array(model.volumes.length * 16);
    const tstepArray = new Float64Array(model.volumes.length * 4);
    const spacingArray = new Float64Array(model.volumes.length * 4);
    for (let vidx = 0; vidx < model.volumes.length; vidx++) {
      const webgpuvol = model.volumes[vidx];
      const actor = webgpuvol.getRenderable();
      const volMapr = actor.getMapper();
      const image = volMapr.getInputData();

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

      tstepArray[vidx * 4] = 1.0 / dims[0];
      tstepArray[vidx * 4 + 1] = 1.0 / dims[1];
      tstepArray[vidx * 4 + 2] = 1.0 / dims[2];
      tstepArray[vidx * 4 + 3] = 1.0;

      const spacing = image.getSpacing();
      spacingArray[vidx * 4] = spacing[0];
      spacingArray[vidx * 4 + 1] = spacing[1];
      spacingArray[vidx * 4 + 2] = spacing[2];
      spacingArray[vidx * 4 + 3] = 1.0;
    }
    model.SSBO.addEntry('SCTCMatrix', 'mat4x4<f32>');
    model.SSBO.addEntry('tstep', 'vec4<f32>');
    model.SSBO.addEntry('spacing', 'vec4<f32>');
    model.SSBO.setAllInstancesFromArray('SCTCMatrix', marray);
    model.SSBO.setAllInstancesFromArray('tstep', tstepArray);
    model.SSBO.setAllInstancesFromArray('spacing', spacingArray);
    model.SSBO.send(device);

    // now create the componentSSBO
    model.componentSSBO.clearData();
    model.componentSSBO.setNumberOfInstances(model.numRows);
    const cScaleArray = new Float64Array(model.numRows);
    const cShiftArray = new Float64Array(model.numRows);
    const oScaleArray = new Float64Array(model.numRows);
    const oShiftArray = new Float64Array(model.numRows);
    const gominArray = new Float64Array(model.numRows);
    const gomaxArray = new Float64Array(model.numRows);
    const goshiftArray = new Float64Array(model.numRows);
    const goscaleArray = new Float64Array(model.numRows);

    let rowIdx = 0;
    for (let vidx = 0; vidx < model.volumes.length; vidx++) {
      const webgpuvol = model.volumes[vidx];
      const actor = webgpuvol.getRenderable();
      const volMapr = actor.getMapper();
      const vprop = actor.getProperty();
      const image = volMapr.getInputData();
      const scalars = image.getPointData() && image.getPointData().getScalars();

      const numComp = scalars.getNumberOfComponents();
      const iComps = vprop.getIndependentComponents();
      // const numIComps = iComps ? numComp : 1;

      const volInfo = { scale: [255.0], offset: [0.0] };
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

        // todo sscale for dependent should be based off of the A channel?
        // not target (which is 0 in that case)
        const useGO = vprop.getUseGradientOpacity(target);
        if (useGO) {
          const gomin = vprop.getGradientOpacityMinimumOpacity(target);
          const gomax = vprop.getGradientOpacityMaximumOpacity(target);
          gominArray[rowIdx] = gomin;
          gomaxArray[rowIdx] = gomax;
          const goRange = [
            vprop.getGradientOpacityMinimumValue(target),
            vprop.getGradientOpacityMaximumValue(target),
          ];
          goscaleArray[rowIdx] =
            (sscale * (gomax - gomin)) / (goRange[1] - goRange[0]);
          goshiftArray[rowIdx] =
            (-goRange[0] * (gomax - gomin)) / (goRange[1] - goRange[0]) + gomin;
        } else {
          gominArray[rowIdx] = 1.0;
          gomaxArray[rowIdx] = 1.0;
          goscaleArray[rowIdx] = 0.0;
          goshiftArray[rowIdx] = 1.0;
        }

        rowIdx++;
      }
    }

    model.componentSSBO.addEntry('cScale', 'f32');
    model.componentSSBO.addEntry('cShift', 'f32');
    model.componentSSBO.addEntry('oScale', 'f32');
    model.componentSSBO.addEntry('oShift', 'f32');
    model.componentSSBO.addEntry('goShift', 'f32');
    model.componentSSBO.addEntry('goScale', 'f32');
    model.componentSSBO.addEntry('gomin', 'f32');
    model.componentSSBO.addEntry('gomax', 'f32');
    model.componentSSBO.setAllInstancesFromArray('cScale', cScaleArray);
    model.componentSSBO.setAllInstancesFromArray('cShift', cShiftArray);
    model.componentSSBO.setAllInstancesFromArray('oScale', oScaleArray);
    model.componentSSBO.setAllInstancesFromArray('oShift', oShiftArray);
    model.componentSSBO.setAllInstancesFromArray('goScale', goscaleArray);
    model.componentSSBO.setAllInstancesFromArray('goShift', goshiftArray);
    model.componentSSBO.setAllInstancesFromArray('gomin', gominArray);
    model.componentSSBO.setAllInstancesFromArray('gomax', gomaxArray);
    model.componentSSBO.send(device);
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

    publicAPI.updateLUTImage(device);

    publicAPI.updateSSBO(device);

    // add in 3d volume textures
    for (let vidx = 0; vidx < model.volumes.length; vidx++) {
      const webgpuvol = model.volumes[vidx];
      const actor = webgpuvol.getRenderable();
      const volMapr = actor.getMapper();
      const image = volMapr.getInputData();

      const treq = {
        imageData: image,
        source: image,
      };
      const newTex = device.getTextureManager().getTexture(treq);
      if (
        !model.textureViews[vidx + 4] ||
        model.textureViews[vidx + 4].getTexture() !== newTex
      ) {
        const tview = newTex.createView();
        tview.setName(`volTexture${vidx}`);
        model.textureViews[vidx + 4] = tview;
      }
    }
  };

  publicAPI.computePipelineHash = () => {
    const blendMode = model.volumes[0]
      .getRenderable()
      .getMapper()
      .getBlendMode();
    model.blendMode = blendMode;

    model.pipelineHash = `volfsq${model.volumes.length}b${model.blendMode}`;
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

  const superclassBuild = publicAPI.build;
  publicAPI.build = (renderEncoder, device) => {
    publicAPI.computePipelineHash();
    publicAPI.updateBuffers(device);

    if (!model.clampSampler) {
      model.clampSampler = vtkWebGPUSampler.newInstance();
      model.clampSampler.setName('clampSampler');
      model.clampSampler.create(device, {
        minFilter: 'linear',
        maxFilter: 'linear',
      });
    }

    superclassBuild(renderEncoder, device);
  };

  const superclassGetBindables = publicAPI.getBindables;
  publicAPI.getBindables = () => {
    const bindables = superclassGetBindables();
    bindables.push(model.componentSSBO);
    bindables.push(model.clampSampler);
    return bindables;
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

  model.componentSSBO = vtkWebGPUStorageBuffer.newInstance();
  model.componentSSBO.setName('componentSSBO');

  model.lutBuildTime = {};
  macro.obj(model.lutBuildTime, { mtime: 0 });

  // Object methods
  vtkWebGPUVolumePassFSQ(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkWebGPUVolumePassFSQ');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
