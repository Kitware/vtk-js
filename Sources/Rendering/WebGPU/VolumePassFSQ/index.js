import macro from 'vtk.js/Sources/macros';
import { mat4 } from 'gl-matrix';
import vtkWebGPUFullScreenQuad from 'vtk.js/Sources/Rendering/WebGPU/FullScreenQuad';
import vtkWebGPUUniformBuffer from 'vtk.js/Sources/Rendering/WebGPU/UniformBuffer';
import vtkWebGPUShaderCache from 'vtk.js/Sources/Rendering/WebGPU/ShaderCache';
import vtkWebGPUStorageBuffer from 'vtk.js/Sources/Rendering/WebGPU/StorageBuffer';
import vtkWebGPUSampler from 'vtk.js/Sources/Rendering/WebGPU/Sampler';
import vtkWebGPUTypes from 'vtk.js/Sources/Rendering/WebGPU/Types';

import { BlendMode } from 'vtk.js/Sources/Rendering/Core/VolumeMapper/Constants';

const volFragTemplate = `
//VTK::Renderer::Dec

//VTK::Mapper::Dec

//VTK::TCoord::Dec

//VTK::Volume::TraverseDec

//VTK::RenderEncoder::Dec

//VTK::IOStructs::Dec

fn getTextureValue(vTex: texture_3d<f32>, tpos: vec4<f32>) -> f32
{
  // todo multicomponent support
  return textureSampleLevel(vTex, clampSampler, tpos.xyz, 0.0).r;
}

fn getGradient(vTex: texture_3d<f32>, tpos: vec4<f32>, vNum: i32, scalar: f32) -> vec4<f32>
{
  var result: vec4<f32>;

  var tstep: vec4<f32> = volumeSSBO.values[vNum].tstep;
  result.x = getTextureValue(vTex, tpos + vec4<f32>(tstep.x, 0.0, 0.0, 1.0)) - scalar;
  result.y = getTextureValue(vTex, tpos + vec4<f32>(0.0, tstep.y, 0.0, 1.0)) - scalar;
  result.z = getTextureValue(vTex, tpos + vec4<f32>(0.0, 0.0, tstep.z, 1.0)) - scalar;
  result.w = 0.0;

  // divide by spacing as that is our delta
  result = result / volumeSSBO.values[vNum].spacing;
  // now we have a gradient in unit tcoords

  var grad: f32 = length(result.xyz);
  if (grad > 0.0)
  {
    // rotate to View Coords, needed for lighting and shading
    var nMat: mat4x4<f32> = rendererUBO.SCVCMatrix * volumeSSBO.values[vNum].planeNormals;
    result = nMat * result;
    result = result / length(result);
  }

  // store gradient magnitude in .w
  result.w = grad;

  return result;
}

fn processVolume(vTex: texture_3d<f32>, vNum: i32, cNum: i32, posSC: vec4<f32>, tfunRows: f32) -> vec4<f32>
{
  var outColor: vec4<f32> = vec4<f32>(0.0, 0.0, 0.0, 0.0);

  // convert to tcoords and reject if outside the volume
  var tpos: vec4<f32> = volumeSSBO.values[vNum].SCTCMatrix*posSC;
  if (tpos.x < 0.0 || tpos.y < 0.0 || tpos.z < 0.0 ||
      tpos.x > 1.0 || tpos.y > 1.0 || tpos.z > 1.0) { return outColor; }

  var scalar: f32 = getTextureValue(vTex, tpos);

  var coord: vec2<f32> =
    vec2<f32>(scalar * componentSSBO.values[cNum].cScale + componentSSBO.values[cNum].cShift,
      (0.5 + 2.0 * f32(vNum)) / tfunRows);
  var color: vec4<f32> = textureSampleLevel(tfunTexture, clampSampler, coord, 0.0);

  var gofactor: f32 = 1.0;
  var normal: vec4<f32> = vec4<f32>(0.0,0.0,0.0,0.0);
  if (componentSSBO.values[cNum].gomin <  1.0 || volumeSSBO.values[vNum].shade[0] > 0.0)
  {
    normal = getGradient(vTex, tpos, vNum, scalar);
    if (componentSSBO.values[cNum].gomin <  1.0)
    {
      gofactor = clamp(normal.a*componentSSBO.values[cNum].goScale + componentSSBO.values[cNum].goShift,
      componentSSBO.values[cNum].gomin, componentSSBO.values[cNum].gomax);
    }
  }

  coord.x = (scalar * componentSSBO.values[cNum].oScale + componentSSBO.values[cNum].oShift);
  var opacity: f32 = textureSampleLevel(ofunTexture, clampSampler, coord, 0.0).r;

  if (volumeSSBO.values[vNum].shade[0] > 0.0)
  {
    color = color*abs(normal.z);
  }

  outColor = vec4<f32>(color.rgb, gofactor * opacity);

  return outColor;
}

// adjust the start and end point of a raycast such that it intersects the unit cube.
// This function is used to take a raycast starting point and step vector
// and numSteps and return the startijng and ending steps for intersecting the
// unit cube. Recall for a 3D texture, the unit cube is the range of texture coordsinates
// that have valid values. So this funtion can be used to take a ray in texture coordinates
// and bound it to intersecting the texture.
//
fn adjustBounds(tpos: vec4<f32>, tstep: vec4<f32>, numSteps: f32) -> vec2<f32>
{
  var result: vec2<f32> = vec2<f32>(0.0, numSteps);
  var tpos2: vec4<f32> = tpos + tstep*numSteps;

  // move tpos to the start of the volume
  var adjust: f32 =
    min(
      max(tpos.x/tstep.x, (tpos.x - 1.0)/tstep.x),
      min(
        max((tpos.y - 1.0)/tstep.y, tpos.y/tstep.y),
        max((tpos.z - 1.0)/tstep.z, tpos.z/tstep.z)));
  if (adjust < 0.0)
  {
    result.x = result.x - adjust;
  }

  // adjust length to the end
  adjust =
    max(
      min(tpos2.x/tstep.x, (tpos2.x - 1.0)/tstep.x),
      max(
        min((tpos2.y - 1.0)/tstep.y, tpos2.y/tstep.y),
        min((tpos2.z - 1.0)/tstep.z, tpos2.z/tstep.z)));
  if (adjust > 0.0)
  {
    result.y = result.y - adjust;
  }

  return result;
}

fn getSimpleColor(scalar: f32, vNum: i32, cNum: i32) -> vec4<f32>
{
  // how many rows (tfuns) do we have in our tfunTexture
  var tfunRows: f32 = f32(textureDimensions(tfunTexture).y);

  var coord: vec2<f32> =
    vec2<f32>(scalar * componentSSBO.values[cNum].cScale + componentSSBO.values[cNum].cShift,
      (0.5 + 2.0 * f32(vNum)) / tfunRows);
  var color: vec4<f32> = textureSampleLevel(tfunTexture, clampSampler, coord, 0.0);
  coord.x = (scalar * componentSSBO.values[cNum].oScale + componentSSBO.values[cNum].oShift);
  var opacity: f32 = textureSampleLevel(ofunTexture, clampSampler, coord, 0.0).r;
  return vec4<f32>(color.rgb, opacity);
}

fn traverseMax(vTex: texture_3d<f32>, vNum: i32, cNum: i32, rayLengthSC: f32, minPosSC: vec4<f32>, rayStepSC: vec4<f32>)
{
  // convert to tcoords and reject if outside the volume
  var numSteps: f32 = rayLengthSC/mapperUBO.SampleDistance;
  var tpos: vec4<f32> = volumeSSBO.values[vNum].SCTCMatrix*minPosSC;
  var tpos2: vec4<f32> = volumeSSBO.values[vNum].SCTCMatrix*(minPosSC + rayStepSC);
  var tstep: vec4<f32> = tpos2 - tpos;

  var rayBounds: vec2<f32> = adjustBounds(tpos, tstep, numSteps);

  // did we hit anything
  if (rayBounds.x >= rayBounds.y)
  {
    traverseVals[vNum] = vec4<f32>(0.0,0.0,0.0,0.0);
    return;
  }

  tpos = tpos + tstep*rayBounds.x;
  var curDist: f32 = rayBounds.x;
  var maxVal: f32 = -1.0e37;
  loop
  {
    var scalar: f32 = getTextureValue(vTex, tpos);
    if (scalar > maxVal)
    {
      maxVal = scalar;
    }

    // increment position
    curDist = curDist + 1.0;
    tpos = tpos + tstep;

    // check if we have reached a terminating condition
    if (curDist > rayBounds.y) { break; }
  }

  // process to get the color and opacity
  traverseVals[vNum] = getSimpleColor(maxVal, vNum, cNum);
}

fn traverseMin(vTex: texture_3d<f32>, vNum: i32, cNum: i32, rayLengthSC: f32, minPosSC: vec4<f32>, rayStepSC: vec4<f32>)
{
  // convert to tcoords and reject if outside the volume
  var numSteps: f32 = rayLengthSC/mapperUBO.SampleDistance;
  var tpos: vec4<f32> = volumeSSBO.values[vNum].SCTCMatrix*minPosSC;
  var tpos2: vec4<f32> = volumeSSBO.values[vNum].SCTCMatrix*(minPosSC + rayStepSC);
  var tstep: vec4<f32> = tpos2 - tpos;

  var rayBounds: vec2<f32> = adjustBounds(tpos, tstep, numSteps);

  // did we hit anything
  if (rayBounds.x >= rayBounds.y)
  {
    traverseVals[vNum] = vec4<f32>(0.0,0.0,0.0,0.0);
    return;
  }

  tpos = tpos + tstep*rayBounds.x;
  var curDist: f32 = rayBounds.x;
  var minVal: f32 = 1.0e37;
  loop
  {
    var scalar: f32 = getTextureValue(vTex, tpos);
    if (scalar < minVal)
    {
      minVal = scalar;
    }

    // increment position
    curDist = curDist + 1.0;
    tpos = tpos + tstep;

    // check if we have reached a terminating condition
    if (curDist > rayBounds.y) { break; }
  }

  // process to get the color and opacity
  traverseVals[vNum] = getSimpleColor(minVal, vNum, cNum);
}

fn traverseAverage(vTex: texture_3d<f32>, vNum: i32, cNum: i32, rayLengthSC: f32, minPosSC: vec4<f32>, rayStepSC: vec4<f32>)
{
  // convert to tcoords and reject if outside the volume
  var numSteps: f32 = rayLengthSC/mapperUBO.SampleDistance;
  var tpos: vec4<f32> = volumeSSBO.values[vNum].SCTCMatrix*minPosSC;
  var tpos2: vec4<f32> = volumeSSBO.values[vNum].SCTCMatrix*(minPosSC + rayStepSC);
  var tstep: vec4<f32> = tpos2 - tpos;

  var rayBounds: vec2<f32> = adjustBounds(tpos, tstep, numSteps);

  // did we hit anything
  if (rayBounds.x >= rayBounds.y)
  {
    traverseVals[vNum] = vec4<f32>(0.0,0.0,0.0,0.0);
    return;
  }

  let ipRange: vec4<f32> = volumeSSBO.values[vNum].ipScalarRange;
  tpos = tpos + tstep*rayBounds.x;
  var curDist: f32 = rayBounds.x;
  var avgVal: f32 = 0.0;
  var sampleCount: f32 = 0.0;
  loop
  {
    var sample: f32 = getTextureValue(vTex, tpos);
    // right now leave filtering off until WebGL changes get merged
    // if (ipRange.z == 0.0 || sample >= ipRange.x && sample <= ipRange.y)
    // {
      avgVal = avgVal + sample;
      sampleCount = sampleCount + 1.0;
    // }

    // increment position
    curDist = curDist + 1.0;
    tpos = tpos + tstep;

    // check if we have reached a terminating condition
    if (curDist > rayBounds.y) { break; }
  }

  if (sampleCount <= 0.0)
  {
    traverseVals[vNum] = vec4<f32>(0.0,0.0,0.0,0.0);
  }

  // process to get the color and opacity
  traverseVals[vNum] = getSimpleColor(avgVal/sampleCount, vNum, cNum);
}

fn traverseAdditive(vTex: texture_3d<f32>, vNum: i32, cNum: i32, rayLengthSC: f32, minPosSC: vec4<f32>, rayStepSC: vec4<f32>)
{
  // convert to tcoords and reject if outside the volume
  var numSteps: f32 = rayLengthSC/mapperUBO.SampleDistance;
  var tpos: vec4<f32> = volumeSSBO.values[vNum].SCTCMatrix*minPosSC;
  var tpos2: vec4<f32> = volumeSSBO.values[vNum].SCTCMatrix*(minPosSC + rayStepSC);
  var tstep: vec4<f32> = tpos2 - tpos;

  var rayBounds: vec2<f32> = adjustBounds(tpos, tstep, numSteps);

  // did we hit anything
  if (rayBounds.x >= rayBounds.y)
  {
    traverseVals[vNum] = vec4<f32>(0.0,0.0,0.0,0.0);
    return;
  }

  let ipRange: vec4<f32> = volumeSSBO.values[vNum].ipScalarRange;
  tpos = tpos + tstep*rayBounds.x;
  var curDist: f32 = rayBounds.x;
  var sumVal: f32 = 0.0;
  loop
  {
    var sample: f32 = getTextureValue(vTex, tpos);
    // right now leave filtering off until WebGL changes get merged
    // if (ipRange.z == 0.0 || sample >= ipRange.x && sample <= ipRange.y)
    // {
      sumVal = sumVal + sample;
    // }

    // increment position
    curDist = curDist + 1.0;
    tpos = tpos + tstep;

    // check if we have reached a terminating condition
    if (curDist > rayBounds.y) { break; }
  }

  // process to get the color and opacity
  traverseVals[vNum] = getSimpleColor(sumVal, vNum, cNum);
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
//VTK::Volume::TraverseCalls

  loop
  {
    // for each volume, sample and accumulate color
//VTK::Volume::CompositeCalls

    // increment position
    curDist = curDist + mapperUBO.SampleDistance;
    rayPosSC = rayPosSC + rayStepSC;

    // check if we have reached a terminating condition
    if (curDist > rayLengthSC) { break; }
    if (computedColor.a > 0.98) { break; }
  }
  return computedColor;
}

@stage(fragment)
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
    // compute start and end ray positions in view coordinates
    var minPosSC: vec4<f32> = rendererUBO.PCSCMatrix*vec4<f32>(2.0 * input.tcoordVS.x - 1.0, 1.0 - 2.0 * input.tcoordVS.y, rayMax, 1.0);
    minPosSC = minPosSC * (1.0 / minPosSC.w);
    var maxPosSC: vec4<f32> = rendererUBO.PCSCMatrix*vec4<f32>(2.0 * input.tcoordVS.x - 1.0, 1.0 - 2.0 * input.tcoordVS.y, rayMin, 1.0);
    maxPosSC = maxPosSC * (1.0 / maxPosSC.w);

    var rayLengthSC: f32 = distance(minPosSC.xyz, maxPosSC.xyz);
    var rayStepSC: vec4<f32> = (maxPosSC - minPosSC)*(mapperUBO.SampleDistance/rayLengthSC);
    rayStepSC.w = 0.0;

    var computedColor: vec4<f32>;

//VTK::Volume::Loop

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
    vDesc.addBuiltinOutput('vec4<f32>', '@builtin(position) Position');
    let code = vDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Position::Impl', [
      'output.tcoordVS = vec2<f32>(vertexBC.x * 0.5 + 0.5, 1.0 - vertexBC.y * 0.5 - 0.5);',
      'output.Position = vec4<f32>(vertexBC, 1.0);',
    ]).result;
    vDesc.setCode(code);
    const fDesc = pipeline.getShaderDescription('fragment');
    fDesc.addBuiltinInput('vec4<f32>', '@builtin(position) fragPos');
  };
  model.shaderReplacements.set(
    'replaceShaderPosition',
    publicAPI.replaceShaderPosition
  );

  publicAPI.replaceShaderVolume = (hash, pipeline, vertexInput) => {
    const fDesc = pipeline.getShaderDescription('fragment');
    let code = fDesc.getCode();
    const compositeCalls = [];
    const traverseCalls = [];
    for (let i = 0; i < model.volumes.length; i++) {
      // todo pass rowPos
      const blendMode = model.volumes[i]
        .getRenderable()
        .getMapper()
        .getBlendMode();
      if (blendMode === BlendMode.COMPOSITE_BLEND) {
        compositeCalls.push(
          `    sampleColor = processVolume(volTexture${i}, ${i}, ${model.rowStarts[i]}, rayPosSC, tfunRows);`
        );
        compositeCalls.push(`    computedColor = vec4<f32>(
          sampleColor.a * sampleColor.rgb * (1.0 - computedColor.a) + computedColor.rgb,
          (1.0 - computedColor.a)*sampleColor.a + computedColor.a);`);
      } else {
        traverseCalls.push(`  sampleColor = traverseVals[${i}];`);
        traverseCalls.push(`  computedColor = vec4<f32>(
          sampleColor.a * sampleColor.rgb * (1.0 - computedColor.a) + computedColor.rgb,
          (1.0 - computedColor.a)*sampleColor.a + computedColor.a);`);
      }
    }
    code = vtkWebGPUShaderCache.substitute(
      code,
      '//VTK::Volume::CompositeCalls',
      compositeCalls
    ).result;
    code = vtkWebGPUShaderCache.substitute(
      code,
      '//VTK::Volume::TraverseCalls',
      traverseCalls
    ).result;
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Volume::TraverseDec', [
      `var<private> traverseVals: array<vec4<f32>,${model.volumes.length}>;`,
    ]).result;

    // call the full and partial methods as needed
    let compositeWhileTraversing = false;
    for (let vidx = 0; vidx < model.volumes.length; vidx++) {
      const blendMode = model.volumes[vidx]
        .getRenderable()
        .getMapper()
        .getBlendMode();
      if (blendMode === BlendMode.COMPOSITE_BLEND) {
        compositeWhileTraversing = true;
      } else if (blendMode === BlendMode.MAXIMUM_INTENSITY_BLEND) {
        code = vtkWebGPUShaderCache.substitute(code, '//VTK::Volume::Loop', [
          `    traverseMax(volTexture${vidx}, ${vidx}, ${vidx}, rayLengthSC, minPosSC, rayStepSC);`,
          `    computedColor = traverseVals[${vidx}];`,
          '//VTK::Volume::Loop',
        ]).result;
      } else if (blendMode === BlendMode.MINIMUM_INTENSITY_BLEND) {
        code = vtkWebGPUShaderCache.substitute(code, '//VTK::Volume::Loop', [
          `    traverseMin(volTexture${vidx}, ${vidx}, ${vidx}, rayLengthSC, minPosSC, rayStepSC);`,
          `    computedColor = traverseVals[${vidx}];`,
          '//VTK::Volume::Loop',
        ]).result;
      } else if (blendMode === BlendMode.AVERAGE_INTENSITY_BLEND) {
        code = vtkWebGPUShaderCache.substitute(code, '//VTK::Volume::Loop', [
          `    traverseAverage(volTexture${vidx}, ${vidx}, ${vidx}, rayLengthSC, minPosSC, rayStepSC);`,
          `    computedColor = traverseVals[${vidx}];`,
          '//VTK::Volume::Loop',
        ]).result;
      } else if (blendMode === BlendMode.ADDITIVE_INTENSITY_BLEND) {
        code = vtkWebGPUShaderCache.substitute(code, '//VTK::Volume::Loop', [
          `    traverseAdditive(volTexture${vidx}, ${vidx}, ${vidx}, rayLengthSC, minPosSC, rayStepSC);`,
          `    computedColor = traverseVals[${vidx}];`,
          '//VTK::Volume::Loop',
        ]).result;
      }
    }
    if (compositeWhileTraversing) {
      code = vtkWebGPUShaderCache.substitute(code, '//VTK::Volume::Loop', [
        '    computedColor = composite(rayLengthSC, minPosSC, rayStepSC);',
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
      const tview = newTex.createView('tfunTexture');
      model.textureViews[2] = tview;
    }

    {
      const treq = {
        nativeArray: opacityArray,
        width: model.rowLength,
        height: model.numRows * 2,
        depth: 1,
        format: 'r16float',
      };
      const newTex = device.getTextureManager().getTexture(treq);
      const tview = newTex.createView('ofunTexture');
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
      const volMapr = vol.getMapper();
      const image = volMapr.getInputData();
      mtime = Math.max(
        mtime,
        vol.getMTime(),
        image.getMTime(),
        volMapr.getMTime()
      );
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
    const vPlaneArray = new Float64Array(model.volumes.length * 16);
    const tstepArray = new Float64Array(model.volumes.length * 4);
    const shadeArray = new Float64Array(model.volumes.length * 4);
    const spacingArray = new Float64Array(model.volumes.length * 4);
    const ipScalarRangeArray = new Float64Array(model.volumes.length * 4);
    for (let vidx = 0; vidx < model.volumes.length; vidx++) {
      const webgpuvol = model.volumes[vidx];
      const actor = webgpuvol.getRenderable();
      const volMapr = actor.getMapper();
      const image = volMapr.getInputData();

      mat4.identity(tmpMat4);
      mat4.translate(tmpMat4, tmpMat4, center);
      // tmpMat4 is now SC->World

      const mcwcmat = actor.getMatrix();
      mat4.transpose(tmp2Mat4, mcwcmat);
      mat4.invert(tmp2Mat4, tmp2Mat4);
      // tmp2Mat4 is now world to model

      mat4.multiply(tmpMat4, tmp2Mat4, tmpMat4);
      // tmp4Mat is now SC->Model

      // the method on the data is world to index but the volume is in
      // model coordinates so really in this context it is model to index
      const modelToIndex = image.getWorldToIndex();
      mat4.multiply(tmpMat4, modelToIndex, tmpMat4);
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

      mat4.invert(tmpMat4, tmpMat4);
      // now it is Tcoord To SC

      for (let j = 0; j < 4; j++) {
        vPlaneArray[vidx * 16 + j * 4] = tmpMat4[j * 4];
        vPlaneArray[vidx * 16 + j * 4 + 1] = tmpMat4[j * 4 + 1];
        vPlaneArray[vidx * 16 + j * 4 + 2] = tmpMat4[j * 4 + 2];
        vPlaneArray[vidx * 16 + j * 4 + 3] = 0.0;
      }

      tstepArray[vidx * 4] = 1.0 / dims[0];
      tstepArray[vidx * 4 + 1] = 1.0 / dims[1];
      tstepArray[vidx * 4 + 2] = 1.0 / dims[2];
      tstepArray[vidx * 4 + 3] = 1.0;

      shadeArray[vidx * 4] = actor.getProperty().getShade() ? 1.0 : 0.0;

      const spacing = image.getSpacing();
      spacingArray[vidx * 4] = spacing[0];
      spacingArray[vidx * 4 + 1] = spacing[1];
      spacingArray[vidx * 4 + 2] = spacing[2];
      spacingArray[vidx * 4 + 3] = 1.0;

      // handle filteringMode
      const tScale = model.textureViews[vidx + 4].getTexture().getScale();
      const ipScalarRange = volMapr.getIpScalarRange();
      ipScalarRangeArray[vidx * 4] = ipScalarRange[0] / tScale;
      ipScalarRangeArray[vidx * 4 + 1] = ipScalarRange[1] / tScale;
      ipScalarRangeArray[vidx * 4 + 2] = volMapr.getFilterMode();
    }
    model.SSBO.addEntry('SCTCMatrix', 'mat4x4<f32>');
    model.SSBO.addEntry('planeNormals', 'mat4x4<f32>');
    model.SSBO.addEntry('shade', 'vec4<f32>');
    model.SSBO.addEntry('tstep', 'vec4<f32>');
    model.SSBO.addEntry('spacing', 'vec4<f32>');
    model.SSBO.addEntry('ipScalarRange', 'vec4<f32>');
    model.SSBO.setAllInstancesFromArray('SCTCMatrix', marray);
    model.SSBO.setAllInstancesFromArray('planeNormals', vPlaneArray);
    model.SSBO.setAllInstancesFromArray('shade', shadeArray);
    model.SSBO.setAllInstancesFromArray('tstep', tstepArray);
    model.SSBO.setAllInstancesFromArray('spacing', spacingArray);
    model.SSBO.setAllInstancesFromArray('ipScalarRange', ipScalarRangeArray);
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

      // half float?
      const tformat = model.textureViews[vidx + 4].getTexture().getFormat();
      const tDetails = vtkWebGPUTypes.getDetailsFromTextureFormat(tformat);
      const halfFloat =
        tDetails.elementSize === 2 && tDetails.sampleType === 'float';

      const volInfo = { scale: [255.0], offset: [0.0] };
      if (halfFloat) {
        volInfo.scale[0] = 1.0;
      }

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

  const superClassUpdateBuffers = publicAPI.updateBuffers;
  publicAPI.updateBuffers = () => {
    superClassUpdateBuffers();
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
      model.UBO.sendIfNeeded(model.device);
    }

    // add in 3d volume textures
    for (let vidx = 0; vidx < model.volumes.length; vidx++) {
      const webgpuvol = model.volumes[vidx];
      const actor = webgpuvol.getRenderable();
      const volMapr = actor.getMapper();
      const image = volMapr.getInputData();

      const newTex = model.device
        .getTextureManager()
        .getTextureForImageData(image);
      if (
        !model.textureViews[vidx + 4] ||
        model.textureViews[vidx + 4].getTexture() !== newTex
      ) {
        const tview = newTex.createView(`volTexture${vidx}`);
        model.textureViews[vidx + 4] = tview;
      }
    }

    // clear any old leftovers
    if (model.volumes.length < model.lastVolumeLength) {
      // we may have gaps in the array right now so no splice
      for (let i = model.volumes.length; i < model.lastVolumeLength; i++) {
        model.textureViews.pop();
      }
    }
    model.lastVolumeLength = model.volumes.length;

    publicAPI.updateLUTImage(model.device);

    publicAPI.updateSSBO(model.device);

    if (!model.clampSampler) {
      model.clampSampler = vtkWebGPUSampler.newInstance({
        label: 'clampSampler',
      });
      model.clampSampler.create(model.device, {
        minFilter: 'linear',
        magFilter: 'linear',
      });
    }
  };

  publicAPI.computePipelineHash = () => {
    model.pipelineHash = 'volfsq';
    for (let vidx = 0; vidx < model.volumes.length; vidx++) {
      const blendMode = model.volumes[vidx]
        .getRenderable()
        .getMapper()
        .getBlendMode();
      model.pipelineHash += `${blendMode}`;
    }
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
  lastVolumeLength: 0,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkWebGPUFullScreenQuad.extend(publicAPI, model, initialValues);

  model.fragmentShaderTemplate = volFragTemplate;

  model.UBO = vtkWebGPUUniformBuffer.newInstance({ label: 'mapperUBO' });
  model.UBO.addEntry('SampleDistance', 'f32');

  model.SSBO = vtkWebGPUStorageBuffer.newInstance({ label: 'volumeSSBO' });

  model.componentSSBO = vtkWebGPUStorageBuffer.newInstance({
    label: 'componentSSBO',
  });

  model.lutBuildTime = {};
  macro.obj(model.lutBuildTime, { mtime: 0 });

  // Object methods
  vtkWebGPUVolumePassFSQ(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkWebGPUVolumePassFSQ');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
