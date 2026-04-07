import macro from 'vtk.js/Sources/macros';
import { mat4, vec3 } from 'gl-matrix';
import vtkWebGPUFullScreenQuad from 'vtk.js/Sources/Rendering/WebGPU/FullScreenQuad';
import vtkWebGPUUniformBuffer from 'vtk.js/Sources/Rendering/WebGPU/UniformBuffer';
import vtkWebGPUShaderCache from 'vtk.js/Sources/Rendering/WebGPU/ShaderCache';
import vtkWebGPUStorageBuffer from 'vtk.js/Sources/Rendering/WebGPU/StorageBuffer';
import vtkWebGPUSampler from 'vtk.js/Sources/Rendering/WebGPU/Sampler';
import vtkWebGPUTypes from 'vtk.js/Sources/Rendering/WebGPU/Types';
import {
  addClipPlaneEntries,
  getClippingPlaneEquationsInCoords,
  MAX_CLIPPING_PLANES,
} from 'vtk.js/Sources/Rendering/WebGPU/Helpers/ClippingPlanes';

import { EPSILON } from 'vtk.js/Sources/Common/Core/Math/Constants';
import { BlendMode } from 'vtk.js/Sources/Rendering/Core/VolumeMapper/Constants';

const volFragTemplate = `
//VTK::Renderer::Dec

//VTK::Mapper::Dec

//VTK::TCoord::Dec

//VTK::Volume::TraverseDec

//VTK::RenderEncoder::Dec

//VTK::IOStructs::Dec

fn getTextureValue(vTex: texture_3d<f32>, tpos: vec4<f32>, vNum: i32) -> vec4<f32>
{
  var value = textureSampleLevel(vTex, clampSampler, tpos.xyz, 0.0);
  let forceNearestMask = i32(volumeSSBO.values[vNum].componentInfo.w);
  if (forceNearestMask == 0)
  {
    return value;
  }

  // Match the OpenGL mapper's nearest-interpolation convention: re-sample at
  // the texel center (floor(p*dims)+0.5)/dims through the clamp sampler rather
  // than a raw textureLoad. This keeps boundary behaviour identical to WebGL.
  let dims = vec3<f32>(textureDimensions(vTex, 0));
  let nearestPos = (floor(tpos.xyz * dims) + vec3<f32>(0.5)) / dims;
  let nearestValue = textureSampleLevel(vTex, clampSampler, nearestPos, 0.0);

  if ((forceNearestMask & 1) != 0) { value.x = nearestValue.x; }
  if ((forceNearestMask & 2) != 0) { value.y = nearestValue.y; }
  if ((forceNearestMask & 4) != 0) { value.z = nearestValue.z; }
  if ((forceNearestMask & 8) != 0) { value.w = nearestValue.w; }

  return value;
}

fn getComponent(v: vec4<f32>, idx: u32) -> f32
{
  if (idx == 0u) { return v.x; }
  if (idx == 1u) { return v.y; }
  if (idx == 2u) { return v.z; }
  return v.w;
}

fn getComponentValue(vTex: texture_3d<f32>, tpos: vec4<f32>, vNum: i32, component: u32) -> f32
{
  return getComponent(getTextureValue(vTex, tpos, vNum), component);
}

fn getDependentOpacityValue(sample: vec4<f32>, numComp: u32) -> f32
{
  if (numComp == 1u) { return sample.x; }
  if (numComp == 2u) { return sample.y; }
  if (numComp == 3u) { return length(sample.xyz); }
  return sample.w;
}

fn getDependentValue(vTex: texture_3d<f32>, tpos: vec4<f32>, vNum: i32, numComp: u32) -> f32
{
  return getDependentOpacityValue(getTextureValue(vTex, tpos, vNum), numComp);
}

fn getTraverseValue(sample: vec4<f32>, vNum: i32) -> f32
{
  let numComp: u32 = u32(volumeSSBO.values[vNum].componentInfo.x);
  if (volumeSSBO.values[vNum].componentInfo.y > 0.5) { return sample.x; }
  return getDependentOpacityValue(sample, numComp);
}

fn getTFunRowCoord(rowIdx: i32, tfunRows: f32) -> f32
{
  return (0.5 + 2.0 * f32(rowIdx)) / tfunRows;
}

fn intersectRayBoundsWithClipPlanes(vNum: i32, minPosSC: vec4<f32>, rayStepSC: vec4<f32>, rayBounds: vec2<f32>) -> vec2<f32>
{
  var result: vec2<f32> = rayBounds;
  let clipCount: i32 = i32(volumeSSBO.values[vNum].clipPlaneStates.x);
  if (clipCount <= 0)
  {
    return result;
  }

  ${Array.from(
    { length: MAX_CLIPPING_PLANES },
    (_, idx) => `
  if (clipCount > ${idx})
  {
    let clipPlane${idx}: vec4<f32> = volumeSSBO.values[vNum].clipPlane${idx};
    let rayDirRatio${idx}: f32 = dot(rayStepSC, clipPlane${idx});
    let equationResult${idx}: f32 = dot(minPosSC, clipPlane${idx});

    let absRayDirRatio${idx}: f32 = abs(rayDirRatio${idx});
    if (absRayDirRatio${idx} > 1e-6)
    {
      let intersection${idx}: f32 = -equationResult${idx} / rayDirRatio${idx};
      result.x = select(result.x, max(result.x, intersection${idx}), rayDirRatio${idx} > 0.0);
      result.y = select(result.y, min(result.y, intersection${idx}), rayDirRatio${idx} < 0.0);
    }
    else if (equationResult${idx} < 0.0)
    {
      result.x = result.y;
    }

    if (result.x >= result.y)
    {
      return result;
    }
  }`
  ).join('\n')}

  return result;
}

fn getGradient(vTex: texture_3d<f32>, tpos: vec4<f32>, vNum: i32, component: u32) -> vec4<f32>
{
  var result: vec4<f32>;

  var tstep: vec4<f32> = volumeSSBO.values[vNum].tstep;
  // Central differences (matches the OpenGL/WebGL mapper) for smoother normals.
  result.x = getComponentValue(vTex, tpos + vec4<f32>(tstep.x, 0.0, 0.0, 0.0), vNum, component)
           - getComponentValue(vTex, tpos - vec4<f32>(tstep.x, 0.0, 0.0, 0.0), vNum, component);
  result.y = getComponentValue(vTex, tpos + vec4<f32>(0.0, tstep.y, 0.0, 0.0), vNum, component)
           - getComponentValue(vTex, tpos - vec4<f32>(0.0, tstep.y, 0.0, 0.0), vNum, component);
  result.z = getComponentValue(vTex, tpos + vec4<f32>(0.0, 0.0, tstep.z, 0.0), vNum, component)
           - getComponentValue(vTex, tpos - vec4<f32>(0.0, 0.0, tstep.z, 0.0), vNum, component);
  result.w = 0.0;

  // central difference spans two samples, so the delta is twice the spacing
  result = result / (2.0 * volumeSSBO.values[vNum].spacing);
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

fn getDependentGradient(vTex: texture_3d<f32>, tpos: vec4<f32>, vNum: i32, numComp: u32) -> vec4<f32>
{
  var result: vec4<f32>;

  var tstep: vec4<f32> = volumeSSBO.values[vNum].tstep;
  // Central differences (matches the OpenGL/WebGL mapper) for smoother normals.
  result.x = getDependentValue(vTex, tpos + vec4<f32>(tstep.x, 0.0, 0.0, 0.0), vNum, numComp)
           - getDependentValue(vTex, tpos - vec4<f32>(tstep.x, 0.0, 0.0, 0.0), vNum, numComp);
  result.y = getDependentValue(vTex, tpos + vec4<f32>(0.0, tstep.y, 0.0, 0.0), vNum, numComp)
           - getDependentValue(vTex, tpos - vec4<f32>(0.0, tstep.y, 0.0, 0.0), vNum, numComp);
  result.z = getDependentValue(vTex, tpos + vec4<f32>(0.0, 0.0, tstep.z, 0.0), vNum, numComp)
           - getDependentValue(vTex, tpos - vec4<f32>(0.0, 0.0, tstep.z, 0.0), vNum, numComp);
  result.w = 0.0;

  // central difference spans two samples, so the delta is twice the spacing
  result = result / (2.0 * volumeSSBO.values[vNum].spacing);

  var grad: f32 = length(result.xyz);
  if (grad > 0.0)
  {
    var nMat: mat4x4<f32> = rendererUBO.SCVCMatrix * volumeSSBO.values[vNum].planeNormals;
    result = nMat * result;
    result = result / length(result);
  }

  result.w = grad;

  return result;
}

fn getSampleOpacity(vTex: texture_3d<f32>, sample: vec4<f32>, tpos: vec4<f32>, vNum: i32, rowStart: i32) -> f32
{
  let numComp: u32 = u32(volumeSSBO.values[vNum].componentInfo.x);
  let independent = volumeSSBO.values[vNum].componentInfo.y > 0.5;
  let tfunRows = f32(textureDimensions(tfunTexture).y);

  if (independent)
  {
    var alpha: f32 = 0.0;
    for (var c: u32 = 0u; c < numComp; c = c + 1u)
    {
      let rowIdx: i32 = rowStart + i32(c);
      let scalar = getComponent(sample, c);
      var opacity = getOpacity(scalar, rowIdx, tfunRows);
      if (componentSSBO.values[rowIdx].gomin < 1.0)
      {
        let normal = getGradient(vTex, tpos, vNum, c);
        let gofactor = clamp(
          normal.a * componentSSBO.values[rowIdx].goScale + componentSSBO.values[rowIdx].goShift,
          componentSSBO.values[rowIdx].gomin,
          componentSSBO.values[rowIdx].gomax
        );
        opacity = opacity * gofactor;
      }
      alpha = alpha + componentSSBO.values[rowIdx].mixWeight * opacity;
    }
    return min(alpha, 1.0);
  }

  let opacityScalar = getDependentOpacityValue(sample, numComp);
  var opacity: f32;
  if (numComp == 1u)
  {
    opacity = getOpacity(sample.r, rowStart, tfunRows);
  }
  else if (numComp == 2u)
  {
    opacity = getOpacity(sample.g, rowStart, tfunRows);
  }
  else if (numComp == 3u)
  {
    opacity = getOpacity(opacityScalar, rowStart, tfunRows);
  }
  else
  {
    opacity = getOpacity(sample.a, rowStart, tfunRows);
  }

  if (componentSSBO.values[rowStart].gomin < 1.0)
  {
    let normal = getDependentGradient(vTex, tpos, vNum, numComp);
    let gofactor = clamp(
      normal.a * componentSSBO.values[rowStart].goScale + componentSSBO.values[rowStart].goShift,
      componentSSBO.values[rowStart].gomin,
      componentSSBO.values[rowStart].gomax
    );
    opacity = opacity * gofactor;
  }

  return opacity;
}

fn getViewVector(posVC: vec3<f32>) -> vec3<f32>
{
  if (rendererUBO.cameraParallel != 0u)
  {
    return vec3<f32>(0.0, 0.0, 1.0);
  }
  return normalize(-posVC);
}

fn getRayDirection(posVC: vec3<f32>) -> vec3<f32>
{
  return -getViewVector(posVC);
}

fn phaseFunction(cosAngle: f32, vNum: i32) -> f32
{
  let anisotropy = volumeSSBO.values[vNum].scattering.z;
  if (abs(anisotropy) <= 0.000001)
  {
    return 0.5;
  }

  let anisotropy2 = volumeSSBO.values[vNum].scattering.w;
  return ((1.0 - anisotropy2) /
    pow(1.0 + anisotropy2 - 2.0 * anisotropy * cosAngle, 1.5)) *
    0.5;
}

fn getVolumeLightDirection(posVC: vec3<f32>, lightIdx: i32) -> vec3<f32>
{
  let lightType = i32(rendererLightSSBO.values[lightIdx].LightData.x);
  if (lightType == 1)
  {
    return -normalize(
      (rendererUBO.WCVCNormals *
        vec4<f32>(normalize(rendererLightSSBO.values[lightIdx].LightDir.xyz), 0.0)).xyz
    );
  }

  let lightPosVC = rendererLightSSBO.values[lightIdx].LightPos.xyz;
  let lightOffset = lightPosVC - posVC;
  let lightDistance = length(lightOffset);
  if (lightDistance <= 0.0)
  {
    return vec3<f32>(0.0, 0.0, 0.0);
  }
  return lightOffset / lightDistance;
}

fn getFragmentSeed(fragPos: vec4<f32>) -> f32
{
  let firstNoise =
    fract(sin(dot(fragPos.xy, vec2<f32>(12.9898, 78.233))) * 43758.5453);
  let x = (i32(floor(fragPos.x)) % 32 + 32) % 32;
  let y = (i32(floor(fragPos.y)) % 32 + 32) % 32;
  let secondNoise = jitterSSBO.values[y * 32 + x].value;
  let noiseSum = firstNoise + secondNoise;
  return select(noiseSum - 1.0, noiseSum, noiseSum < 1.0);
}

fn sampleDirectionUniform(fragmentSeed: f32, rayIndex: i32) -> vec3<f32>
{
  let rayRandomness = kernelSampleSSBO.values[rayIndex].value;
  var mergedRandom = rayRandomness + vec2<f32>(fragmentSeed, fragmentSeed);
  if (mergedRandom.x >= 1.0) { mergedRandom.x = mergedRandom.x - 1.0; }
  if (mergedRandom.y >= 1.0) { mergedRandom.y = mergedRandom.y - 1.0; }
  let u = mergedRandom.x;
  let v = mergedRandom.y;
  let theta = u * 6.28318530718;
  let phi = acos(2.0 * v - 1.0);
  let sinTheta = sin(theta);
  let cosTheta = cos(theta);
  let sinPhi = sin(phi);
  let cosPhi = cos(phi);
  return vec3<f32>(sinPhi * cosTheta, sinPhi * sinTheta, cosPhi);
}

fn computeLAO(vTex: texture_3d<f32>, fragPos: vec4<f32>, posVC: vec3<f32>, normalVC: vec4<f32>, originalOpacity: f32, vNum: i32, rowStart: i32) -> f32
{
  if (normalVC.w <= 0.0 || originalOpacity <= 0.05)
  {
    return 1.0;
  }

  let kernelSize = i32(volumeSSBO.values[vNum].lao.x);
  if (kernelSize <= 0)
  {
    return 1.0;
  }
  let kernelRadius = i32(volumeSSBO.values[vNum].lao.y);
  let fragmentSeed = getFragmentSeed(fragPos);

  var visibilitySum = 0.0;
  var weightSum = 0.0;
  var i: i32 = 0;
  loop
  {
    if (i >= kernelSize) { break; }
    var rayDirectionVC = sampleDirectionUniform(fragmentSeed, i);
    var normalDotRay = dot(normalVC.xyz, rayDirectionVC);
    if (normalDotRay > 0.0)
    {
      rayDirectionVC = -rayDirectionVC;
      normalDotRay = -normalDotRay;
    }

    var currTC = (volumeSSBO.values[vNum].VCTCMatrix * vec4<f32>(posVC, 1.0)).xyz;
    let rayStepTC = (volumeSSBO.values[vNum].VCTCMatrix *
      vec4<f32>(rayDirectionVC * mapperUBO.SampleDistance, 0.0)).xyz;
    var visibility = 1.0;

    var j: i32 = 0;
    loop
    {
      if (j >= kernelRadius) { break; }
      currTC = currTC + rayStepTC;
      if (any(currTC < vec3<f32>(0.0)) || any(currTC > vec3<f32>(1.0)))
      {
        break;
      }
      let sampleTC = vec4<f32>(currTC, 1.0);
      let opacity = getSampleOpacity(vTex, getTextureValue(vTex, sampleTC, vNum), sampleTC, vNum, rowStart);
      visibility = visibility * (1.0 - opacity);
      if (visibility <= 0.000001)
      {
        visibility = 0.0;
        break;
      }
      j++;
    }

    let rayWeight = -normalDotRay;
    visibilitySum = visibilitySum + visibility * rayWeight;
    weightSum = weightSum + rayWeight;
    i++;
  }

  if (weightSum == 0.0)
  {
    return 1.0;
  }

  // LAO factor is the average ray visibility (low visibility -> low ambient).
  // The 0.3 floor matches the OpenGL mapper and reduces variance/noise so that
  // heavily occluded samples never collapse to fully black.
  return clamp(visibilitySum / weightSum, 0.3, 1.0);
}

fn applySurfaceLighting(vTex: texture_3d<f32>, fragPos: vec4<f32>, tColor: vec3<f32>, alpha: f32, posVC: vec3<f32>, normalVC: vec4<f32>, vNum: i32, rowStart: i32) -> vec3<f32>
{
  if (rendererUBO.LightCount <= 0)
  {
    return tColor;
  }

  let lighting = volumeSSBO.values[vNum].lighting;
  let ambient = lighting.x;
  let diffuseCoeff = lighting.y;
  let specularCoeff = lighting.z;
  let specularPower = lighting.w;
  let viewDir = getViewVector(posVC);
  let laoFactor = computeLAO(vTex, fragPos, posVC, normalVC, alpha, vNum, rowStart);

  var diffuse = vec3<f32>(0.0);
  var specular = vec3<f32>(0.0);

  var i: i32 = 0;
  loop
  {
    if (i >= rendererUBO.LightCount) { break; }

    let lightColor =
      rendererLightSSBO.values[i].LightColor.rgb *
      (rendererLightSSBO.values[i].LightColor.w * 0.2);
    let lightType = i32(rendererLightSSBO.values[i].LightData.x);

    var lightDirection = vec3<f32>(0.0);
    var attenuation = 1.0;

    if (lightType == 0)
    {
      let lightPosVC = rendererLightSSBO.values[i].LightPos.xyz;
      let lightOffset = posVC - lightPosVC;
      let lightDistance = length(lightOffset);
      if (lightDistance <= 0.0)
      {
        i++;
        continue;
      }
      lightDirection = lightOffset / lightDistance;
    }
    else if (lightType == 1)
    {
      lightDirection = -normalize(
        (rendererUBO.WCVCNormals *
          vec4<f32>(normalize(rendererLightSSBO.values[i].LightDir.xyz), 0.0)).xyz
      );
    }
    else if (lightType == 2)
    {
      let lightPosVC = rendererLightSSBO.values[i].LightPos.xyz;
      let lightOffset = posVC - lightPosVC;
      let lightDistance = length(lightOffset);
      if (lightDistance <= 0.0)
      {
        i++;
        continue;
      }
      lightDirection = lightOffset / lightDistance;

      let spotDirVC = -normalize(
        (rendererUBO.WCVCNormals *
          vec4<f32>(normalize(rendererLightSSBO.values[i].LightDir.xyz), 0.0)).xyz
      );
      let theta = dot(spotDirVC, lightDirection);
      let innerCone = rendererLightSSBO.values[i].LightData.y;
      let outerCone = rendererLightSSBO.values[i].LightData.z;
      let coneRange = max(0.000001, innerCone - outerCone);
      attenuation = clamp((theta - outerCone) / coneRange, 0.0, 1.0);
      if (attenuation <= 0.0)
      {
        i++;
        continue;
      }
    }
    else
    {
      i++;
      continue;
    }

    let ndotL = max(dot(normalVC.xyz, lightDirection), 0.0);
    if (ndotL > 0.0)
    {
      diffuse += ndotL * attenuation * lightColor;

      let reflectDir = normalize(lightDirection - 2.0 * ndotL * normalVC.xyz);
      let vdotR = max(dot(viewDir, reflectDir), 0.0);
      if (vdotR > 0.0)
      {
        specular += pow(vdotR, specularPower) * attenuation * lightColor;
      }
    }

    i++;
  }

  return tColor * (ambient * laoFactor + diffuseCoeff * diffuse) +
    specularCoeff * specular;
}

fn applyVolumeLighting(vTex: texture_3d<f32>, tColor: vec3<f32>, posVC: vec3<f32>, vNum: i32, rowStart: i32, fragmentSeed: f32) -> vec3<f32>
{
  if (rendererUBO.LightCount <= 0)
  {
    return tColor;
  }

  let lighting = volumeSSBO.values[vNum].lighting;
  let ambient = lighting.x;
  let diffuseCoeff = lighting.y;
  let rayDir = getRayDirection(posVC);
  var diffuse = vec3<f32>(0.0);

  var i: i32 = 0;
  loop
  {
    if (i >= rendererUBO.LightCount) { break; }

    let lightDir = getVolumeLightDirection(posVC, i);
    if (dot(lightDir, lightDir) > 0.0)
    {
      let lightColor =
        rendererLightSSBO.values[i].LightColor.rgb *
        (rendererLightSSBO.values[i].LightColor.w * 0.2);
      let shadowCoeff = computeVolumeShadow(vTex, posVC, lightDir, vNum, rowStart, fragmentSeed);
      let phaseAttenuation = phaseFunction(dot(rayDir, lightDir), vNum);
      diffuse += phaseAttenuation * shadowCoeff * lightColor;
    }

    i++;
  }

  return tColor * (ambient + diffuseCoeff * diffuse);
}

fn rayIntersectTextureDistances(rayOriginTC: vec3<f32>, rayDirTC: vec3<f32>) -> vec2<f32>
{
  let invDir = 1.0 / rayDirTC;
  let distancesTo0 = invDir * (vec3<f32>(0.0) - rayOriginTC);
  let distancesTo1 = invDir * (vec3<f32>(1.0) - rayOriginTC);
  let dMinPerAxis = min(distancesTo0, distancesTo1);
  let dMaxPerAxis = max(distancesTo0, distancesTo1);
  let distanceMin = max(dMinPerAxis.x, max(dMinPerAxis.y, dMinPerAxis.z));
  let distanceMax = min(dMaxPerAxis.x, min(dMaxPerAxis.y, dMaxPerAxis.z));
  return vec2<f32>(distanceMin, distanceMax);
}

fn computeVolumeShadow(vTex: texture_3d<f32>, posVC: vec3<f32>, lightDirVC: vec3<f32>, vNum: i32, rowStart: i32, fragmentSeed: f32) -> f32
{
  // Jitter the shadow step length per fragment by a random factor in [1.5, 3.0]
  // to break up banding, matching the OpenGL mapper (mix(1.5, 3.0, fragmentSeed)).
  let shadowStepLength = volumeSSBO.values[vNum].shadow.y * mix(1.5, 3.0, fragmentSeed);
  if (shadowStepLength <= 0.0)
  {
    return 1.0;
  }

  let initialPosVC = posVC + shadowStepLength * lightDirVC;
  let rayOriginTC = (volumeSSBO.values[vNum].VCTCMatrix * vec4<f32>(initialPosVC, 1.0)).xyz;
  let lightReach = volumeSSBO.values[vNum].scattering.y * volumeSSBO.values[vNum].shadow.x;
  if (lightReach <= 0.0)
  {
    return 1.0;
  }

  let lightDirTC = (volumeSSBO.values[vNum].VCTCMatrix * vec4<f32>(lightDirVC, 0.0)).xyz;
  if (dot(lightDirTC, lightDirTC) <= 0.0)
  {
    return 1.0;
  }

  let intersectionDistances = rayIntersectTextureDistances(rayOriginTC, lightDirTC);
  if (intersectionDistances.y <= intersectionDistances.x || intersectionDistances.y <= 0.0)
  {
    return 1.0;
  }

  let startDistance = max(intersectionDistances.x, 0.0);
  let endDistance = min(intersectionDistances.y, startDistance + lightReach);
  if (endDistance <= startDistance)
  {
    return 1.0;
  }

  var currentDistance = startDistance;
  var shadow = 1.0;
  loop
  {
    if (currentDistance > endDistance) { break; }
    let sampleTC = rayOriginTC + currentDistance * lightDirTC;
    let sample = getTextureValue(vTex, vec4<f32>(sampleTC, 1.0), vNum);
    let opacity = getSampleOpacity(
      vTex,
      sample,
      vec4<f32>(sampleTC, 1.0),
      vNum,
      rowStart
    );
    shadow = shadow * (1.0 - opacity);
    if (shadow <= 0.000001)
    {
      return 0.0;
    }
    currentDistance = currentDistance + shadowStepLength;
  }

  return shadow;
}

fn applyAllLighting(vTex: texture_3d<f32>, fragPos: vec4<f32>, tColor: vec3<f32>, alpha: f32, posVC: vec3<f32>, normalVC: vec4<f32>, vNum: i32, rowStart: i32) -> vec3<f32>
{
  if (rendererUBO.LightCount <= 0)
  {
    return tColor;
  }

  // volCoeff decides how much volume shadowing vs surface shadowing to apply
  // (ported from the OpenGL mapper's applyAllLightning):
  //   0                 <= volCoeff < EPSILON       => surface shadows only
  //   EPSILON           <= volCoeff < 1 - EPSILON   => mix of surface + volume
  //   1 - EPSILON       <= volCoeff                 => volume shadows only
  // It scales the user's VolumetricScatteringBlending (scattering.x) by:
  //   (1 - alpha*0.5)            -> more transparent samples lean volumetric
  //   (1 - atan(grad) * 1/(4pi)) -> weaker gradients lean volumetric
  // normalVC.w is the gradient magnitude and 0.0795774715 == 1/(4*PI).
  let volCoeff = volumeSSBO.values[vNum].scattering.x *
    (1.0 - alpha * 0.5) *
    (1.0 - atan(normalVC.w) * 0.0795774715);

  if (volCoeff <= 0.000001)
  {
    return applySurfaceLighting(vTex, fragPos, tColor, alpha, posVC, normalVC, vNum, rowStart);
  }

  // per fragment seed shared by all lights for the shadow step jitter
  let fragmentSeed = getFragmentSeed(fragPos);
  let volumeShadedColor = applyVolumeLighting(vTex, tColor, posVC, vNum, rowStart, fragmentSeed);
  if (volCoeff >= 0.999999)
  {
    return volumeShadedColor;
  }

  let surfaceShadedColor =
    applySurfaceLighting(vTex, fragPos, tColor, alpha, posVC, normalVC, vNum, rowStart);
  return mix(surfaceShadedColor, volumeShadedColor, volCoeff);
}

fn processVolume(vTex: texture_3d<f32>, fragPos: vec4<f32>, vNum: i32, rowStart: i32, posSC: vec4<f32>, tfunRows: f32) -> vec4<f32>
{
  var outColor: vec4<f32> = vec4<f32>(0.0, 0.0, 0.0, 0.0);

  // convert to tcoords and reject if outside the volume
  var tpos: vec4<f32> = volumeSSBO.values[vNum].SCTCMatrix*posSC;
  if (tpos.x < 0.0 || tpos.y < 0.0 || tpos.z < 0.0 ||
      tpos.x > 1.0 || tpos.y > 1.0 || tpos.z > 1.0) { return outColor; }

  let numComp: u32 = u32(volumeSSBO.values[vNum].componentInfo.x);
  let independent = volumeSSBO.values[vNum].componentInfo.y > 0.5;
  let colorMixPreset = i32(volumeSSBO.values[vNum].componentInfo.z);
  let sample: vec4<f32> = getTextureValue(vTex, tpos, vNum);
  let posVC = (rendererUBO.SCVCMatrix * posSC).xyz;

  if (independent)
  {
    if (colorMixPreset == 1 && numComp >= 2u)
    {
      let scalar0 = getComponent(sample, 0u);
      let scalar1 = getComponent(sample, 1u);
      let rowIdx0 = rowStart;
      let rowIdx1 = rowStart + 1;

      let coord0 = vec2<f32>(
        scalar0 * componentSSBO.values[rowIdx0].cScale + componentSSBO.values[rowIdx0].cShift,
        getTFunRowCoord(rowIdx0, tfunRows)
      );
      let coord1 = vec2<f32>(
        scalar1 * componentSSBO.values[rowIdx1].cScale + componentSSBO.values[rowIdx1].cShift,
        getTFunRowCoord(rowIdx1, tfunRows)
      );
      var color0 = textureSampleLevel(tfunTexture, clampSampler, coord0, 0.0).rgb;
      var color1 = textureSampleLevel(tfunTexture, clampSampler, coord1, 0.0).rgb;
      var opacity0 = getOpacity(scalar0, rowIdx0, tfunRows);
      var opacity1 = getOpacity(scalar1, rowIdx1, tfunRows);

      var normal0 = vec4<f32>(0.0);
      var normal1 = vec4<f32>(0.0);
      if (componentSSBO.values[rowIdx0].gomin < 1.0 || volumeSSBO.values[vNum].shade[0] > 0.0)
      {
        normal0 = getGradient(vTex, tpos, vNum, 0u);
        if (componentSSBO.values[rowIdx0].gomin < 1.0)
        {
          opacity0 = opacity0 * clamp(
            normal0.a * componentSSBO.values[rowIdx0].goScale + componentSSBO.values[rowIdx0].goShift,
            componentSSBO.values[rowIdx0].gomin,
            componentSSBO.values[rowIdx0].gomax
          );
        }
      }
      if (componentSSBO.values[rowIdx1].gomin < 1.0 || volumeSSBO.values[vNum].shade[0] > 0.0)
      {
        normal1 = getGradient(vTex, tpos, vNum, 1u);
        if (componentSSBO.values[rowIdx1].gomin < 1.0)
        {
          opacity1 = opacity1 * clamp(
            normal1.a * componentSSBO.values[rowIdx1].goScale + componentSSBO.values[rowIdx1].goShift,
            componentSSBO.values[rowIdx1].gomin,
            componentSSBO.values[rowIdx1].gomax
          );
        }
      }

      let opacitySum = opacity0 + opacity1;
      if (opacitySum <= 0.0)
      {
        return outColor;
      }

      if (volumeSSBO.values[vNum].shade[0] > 0.0)
      {
        color0 = applyAllLighting(vTex, fragPos, color0, opacity0, posVC, normal0, vNum, rowIdx0);
        color1 = applyAllLighting(vTex, fragPos, color1, opacity1, posVC, normal1, vNum, rowIdx1);
      }

      outColor = vec4<f32>(
        (opacity0 * color0 + opacity1 * color1) / opacitySum,
        min(1.0, opacitySum)
      );
      return outColor;
    }

    if (colorMixPreset == 2 && numComp >= 2u)
    {
      let scalar0 = getComponent(sample, 0u);
      let scalar1 = getComponent(sample, 1u);
      let rowIdx0 = rowStart;
      let rowIdx1 = rowStart + 1;

      let coord0 = vec2<f32>(
        scalar0 * componentSSBO.values[rowIdx0].cScale + componentSSBO.values[rowIdx0].cShift,
        getTFunRowCoord(rowIdx0, tfunRows)
      );
      let coord1 = vec2<f32>(
        scalar1 * componentSSBO.values[rowIdx1].cScale + componentSSBO.values[rowIdx1].cShift,
        getTFunRowCoord(rowIdx1, tfunRows)
      );
      var color0 = textureSampleLevel(tfunTexture, clampSampler, coord0, 0.0).rgb;
      let colorizingColor = textureSampleLevel(tfunTexture, clampSampler, coord1, 0.0).rgb;
      var opacity0 = getOpacity(scalar0, rowIdx0, tfunRows);
      let colorizingOpacity = getOpacity(scalar1, rowIdx1, tfunRows);

      var normal0 = vec4<f32>(0.0);
      if (componentSSBO.values[rowIdx0].gomin < 1.0 || volumeSSBO.values[vNum].shade[0] > 0.0)
      {
        normal0 = getGradient(vTex, tpos, vNum, 0u);
        if (componentSSBO.values[rowIdx0].gomin < 1.0)
        {
          opacity0 = opacity0 * clamp(
            normal0.a * componentSSBO.values[rowIdx0].goScale + componentSSBO.values[rowIdx0].goShift,
            componentSSBO.values[rowIdx0].gomin,
            componentSSBO.values[rowIdx0].gomax
          );
        }
      }

      var color = color0 * mix(vec3<f32>(1.0), colorizingColor, colorizingOpacity);
      if (volumeSSBO.values[vNum].shade[0] > 0.0)
      {
        color = applyAllLighting(vTex, fragPos, color, opacity0, posVC, normal0, vNum, rowIdx0);
      }

      outColor = vec4<f32>(color, opacity0);
      return outColor;
    }

    var mixedColor: vec3<f32> = vec3<f32>(0.0, 0.0, 0.0);
    var mixedAlpha: f32 = 0.0;
    if (i32(componentSSBO.values[rowStart].opacityMode) == 1)
    {
      mixedAlpha = 1.0;
    }
    for (var c: u32 = 0u; c < numComp; c = c + 1u)
    {
      let rowIdx: i32 = rowStart + i32(c);
      let scalar = getComponent(sample, c);
      var coord: vec2<f32> =
        vec2<f32>(
          scalar * componentSSBO.values[rowIdx].cScale + componentSSBO.values[rowIdx].cShift,
          getTFunRowCoord(rowIdx, tfunRows)
        );
      var color: vec3<f32> = textureSampleLevel(tfunTexture, clampSampler, coord, 0.0).rgb;
      coord.x = scalar * componentSSBO.values[rowIdx].oScale + componentSSBO.values[rowIdx].oShift;
      var opacity: f32 = textureSampleLevel(ofunTexture, clampSampler, coord, 0.0).r;

      var gofactor: f32 = 1.0;
      var sampleAlpha = opacity;
      var normal: vec4<f32> = vec4<f32>(0.0,0.0,0.0,0.0);
      if (componentSSBO.values[rowIdx].gomin <  1.0 || volumeSSBO.values[vNum].shade[0] > 0.0)
      {
        normal = getGradient(vTex, tpos, vNum, c);
        if (componentSSBO.values[rowIdx].gomin <  1.0)
        {
          gofactor = clamp(normal.a*componentSSBO.values[rowIdx].goScale + componentSSBO.values[rowIdx].goShift,
            componentSSBO.values[rowIdx].gomin, componentSSBO.values[rowIdx].gomax);
        }
      }
      sampleAlpha = gofactor * opacity;

      if (volumeSSBO.values[vNum].shade[0] > 0.0)
      {
        color = applyAllLighting(vTex, fragPos, color, sampleAlpha, posVC, normal, vNum, rowIdx);
      }

      let mixWeight = componentSSBO.values[rowIdx].mixWeight;
      let opacityMode = i32(componentSSBO.values[rowIdx].opacityMode);
      if (opacityMode == 1)
      {
        color = color * sampleAlpha;
        mixedAlpha = mixedAlpha * mix(sampleAlpha, 1.0, 1.0 - mixWeight);
      }
      else
      {
        mixedAlpha = mixedAlpha + mixWeight * sampleAlpha;
      }
      mixedColor = mixedColor + mixWeight * color;
    }

    outColor = vec4<f32>(mixedColor, min(mixedAlpha, 1.0));
    return outColor;
  }

  let opacityScalar = getDependentOpacityValue(sample, numComp);
  var coord: vec2<f32> =
    vec2<f32>(
      0.0,
      getTFunRowCoord(rowStart, tfunRows)
    );
  var opacity: f32 = textureSampleLevel(ofunTexture, clampSampler, coord, 0.0).r;
  var color: vec3<f32>;
  if (numComp == 1u)
  {
    coord.x = sample.r * volumeSSBO.values[vNum].colorScale.x +
      volumeSSBO.values[vNum].colorShift.x;
    color = textureSampleLevel(tfunTexture, clampSampler, coord, 0.0).rgb;
    coord.x = sample.r * volumeSSBO.values[vNum].opacityScale.x +
      volumeSSBO.values[vNum].opacityShift.x;
    opacity = textureSampleLevel(ofunTexture, clampSampler, coord, 0.0).r;
  }
  else if (numComp == 2u)
  {
    color = vec3<f32>(
      sample.r * volumeSSBO.values[vNum].colorScale.x +
        volumeSSBO.values[vNum].colorShift.x
    );
    coord.x = sample.g * volumeSSBO.values[vNum].opacityScale.y +
      volumeSSBO.values[vNum].opacityShift.y;
    opacity = textureSampleLevel(ofunTexture, clampSampler, coord, 0.0).r;
  }
  else if (numComp == 3u)
  {
    color = vec3<f32>(
      sample.r * volumeSSBO.values[vNum].colorScale.x +
        volumeSSBO.values[vNum].colorShift.x,
      sample.g * volumeSSBO.values[vNum].colorScale.y +
        volumeSSBO.values[vNum].colorShift.y,
      sample.b * volumeSSBO.values[vNum].colorScale.z +
        volumeSSBO.values[vNum].colorShift.z
    );
    coord.x = opacityScalar * volumeSSBO.values[vNum].opacityScale.x +
      volumeSSBO.values[vNum].opacityShift.x;
    opacity = textureSampleLevel(ofunTexture, clampSampler, coord, 0.0).r;
  }
  else
  {
    color = vec3<f32>(
      sample.r * volumeSSBO.values[vNum].colorScale.x +
        volumeSSBO.values[vNum].colorShift.x,
      sample.g * volumeSSBO.values[vNum].colorScale.y +
        volumeSSBO.values[vNum].colorShift.y,
      sample.b * volumeSSBO.values[vNum].colorScale.z +
        volumeSSBO.values[vNum].colorShift.z
    );
    coord.x = sample.a * volumeSSBO.values[vNum].opacityScale.w +
      volumeSSBO.values[vNum].opacityShift.w;
    opacity = textureSampleLevel(ofunTexture, clampSampler, coord, 0.0).r;
  }

  var gofactor: f32 = 1.0;
  var normal: vec4<f32> = vec4<f32>(0.0,0.0,0.0,0.0);
  if (componentSSBO.values[rowStart].gomin <  1.0 || volumeSSBO.values[vNum].shade[0] > 0.0)
  {
    normal = getDependentGradient(vTex, tpos, vNum, numComp);
    if (componentSSBO.values[rowStart].gomin <  1.0)
    {
      gofactor = clamp(normal.a*componentSSBO.values[rowStart].goScale + componentSSBO.values[rowStart].goShift,
        componentSSBO.values[rowStart].gomin, componentSSBO.values[rowStart].gomax);
    }
  }

  let alpha = gofactor * opacity;
  if (volumeSSBO.values[vNum].shade[0] > 0.0)
  {
    color = applyAllLighting(vTex, fragPos, color, alpha, posVC, normal, vNum, rowStart);
  }

  outColor = vec4<f32>(color, alpha);

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

fn getSimpleColor(scalar: f32, rowIdx: i32, tfunRows: f32) -> vec4<f32>
{
  var coord: vec2<f32> =
    vec2<f32>(scalar * componentSSBO.values[rowIdx].cScale + componentSSBO.values[rowIdx].cShift,
      getTFunRowCoord(rowIdx, tfunRows));
  var color: vec4<f32> = textureSampleLevel(tfunTexture, clampSampler, coord, 0.0);
  coord.x = (scalar * componentSSBO.values[rowIdx].oScale + componentSSBO.values[rowIdx].oShift);
  var opacity: f32 = textureSampleLevel(ofunTexture, clampSampler, coord, 0.0).r;
  return vec4<f32>(color.rgb, opacity);
}

fn getOpacity(scalar: f32, rowIdx: i32, tfunRows: f32) -> f32
{
  let coord = vec2<f32>(
    scalar * componentSSBO.values[rowIdx].oScale + componentSSBO.values[rowIdx].oShift,
    getTFunRowCoord(rowIdx, tfunRows)
  );
  return textureSampleLevel(ofunTexture, clampSampler, coord, 0.0).r;
}

fn getRadonColor(scalar: f32, rowIdx: i32, tfunRows: f32) -> vec4<f32>
{
  let coord = vec2<f32>(
    scalar * componentSSBO.values[rowIdx].cScale + componentSSBO.values[rowIdx].cShift,
    getTFunRowCoord(rowIdx, tfunRows)
  );
  let color = textureSampleLevel(tfunTexture, clampSampler, coord, 0.0).rgb;
  // Radon/ output is an opaque intensity image: the accumulated
  // attenuation is already encoded in the lookup coordinate, so alpha is 1.0.
  return vec4<f32>(color, 1.0);
}

fn traverseMax(vTex: texture_3d<f32>, vNum: i32, rowIdx: i32, rayLengthSC: f32, minPosSC: vec4<f32>, rayStepSC: vec4<f32>)
{
  // convert to tcoords and reject if outside the volume
  var numSteps: f32 = rayLengthSC/mapperUBO.SampleDistance;
  var tpos: vec4<f32> = volumeSSBO.values[vNum].SCTCMatrix*minPosSC;
  var tpos2: vec4<f32> = volumeSSBO.values[vNum].SCTCMatrix*(minPosSC + rayStepSC);
  var tstep: vec4<f32> = tpos2 - tpos;

  var rayBounds: vec2<f32> = intersectRayBoundsWithClipPlanes(
    vNum,
    minPosSC,
    rayStepSC,
    adjustBounds(tpos, tstep, numSteps));

  // did we hit anything
  if (rayBounds.x >= rayBounds.y)
  {
    traverseVals[vNum] = vec4<f32>(0.0,0.0,0.0,0.0);
    return;
  }

  tpos = tpos + tstep*rayBounds.x;
  var curDist: f32 = rayBounds.x;
  var maxVal: f32 = -1.0e37;
  let tfunRows: f32 = f32(textureDimensions(tfunTexture).y);
  loop
  {
    var scalar: f32 = getTraverseValue(getTextureValue(vTex, tpos, vNum), vNum);
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
  traverseVals[vNum] = getSimpleColor(maxVal, rowIdx, tfunRows);
}

fn traverseMin(vTex: texture_3d<f32>, vNum: i32, rowIdx: i32, rayLengthSC: f32, minPosSC: vec4<f32>, rayStepSC: vec4<f32>)
{
  // convert to tcoords and reject if outside the volume
  var numSteps: f32 = rayLengthSC/mapperUBO.SampleDistance;
  var tpos: vec4<f32> = volumeSSBO.values[vNum].SCTCMatrix*minPosSC;
  var tpos2: vec4<f32> = volumeSSBO.values[vNum].SCTCMatrix*(minPosSC + rayStepSC);
  var tstep: vec4<f32> = tpos2 - tpos;

  var rayBounds: vec2<f32> = intersectRayBoundsWithClipPlanes(
    vNum,
    minPosSC,
    rayStepSC,
    adjustBounds(tpos, tstep, numSteps));

  // did we hit anything
  if (rayBounds.x >= rayBounds.y)
  {
    traverseVals[vNum] = vec4<f32>(0.0,0.0,0.0,0.0);
    return;
  }

  tpos = tpos + tstep*rayBounds.x;
  var curDist: f32 = rayBounds.x;
  var minVal: f32 = 1.0e37;
  let tfunRows: f32 = f32(textureDimensions(tfunTexture).y);
  loop
  {
    var scalar: f32 = getTraverseValue(getTextureValue(vTex, tpos, vNum), vNum);
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
  traverseVals[vNum] = getSimpleColor(minVal, rowIdx, tfunRows);
}

fn traverseAverage(vTex: texture_3d<f32>, vNum: i32, rowIdx: i32, rayLengthSC: f32, minPosSC: vec4<f32>, rayStepSC: vec4<f32>)
{
  // convert to tcoords and reject if outside the volume
  var numSteps: f32 = rayLengthSC/mapperUBO.SampleDistance;
  var tpos: vec4<f32> = volumeSSBO.values[vNum].SCTCMatrix*minPosSC;
  var tpos2: vec4<f32> = volumeSSBO.values[vNum].SCTCMatrix*(minPosSC + rayStepSC);
  var tstep: vec4<f32> = tpos2 - tpos;

  var rayBounds: vec2<f32> = intersectRayBoundsWithClipPlanes(
    vNum,
    minPosSC,
    rayStepSC,
    adjustBounds(tpos, tstep, numSteps));

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
  let tfunRows: f32 = f32(textureDimensions(tfunTexture).y);
  loop
  {
    var sample: f32 = getTraverseValue(getTextureValue(vTex, tpos, vNum), vNum);
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
    return;
  }

  // process to get the color and opacity
  traverseVals[vNum] = getSimpleColor(avgVal/sampleCount, rowIdx, tfunRows);
}

fn traverseAdditive(vTex: texture_3d<f32>, vNum: i32, rowIdx: i32, rayLengthSC: f32, minPosSC: vec4<f32>, rayStepSC: vec4<f32>)
{
  // convert to tcoords and reject if outside the volume
  var numSteps: f32 = rayLengthSC/mapperUBO.SampleDistance;
  var tpos: vec4<f32> = volumeSSBO.values[vNum].SCTCMatrix*minPosSC;
  var tpos2: vec4<f32> = volumeSSBO.values[vNum].SCTCMatrix*(minPosSC + rayStepSC);
  var tstep: vec4<f32> = tpos2 - tpos;

  var rayBounds: vec2<f32> = intersectRayBoundsWithClipPlanes(
    vNum,
    minPosSC,
    rayStepSC,
    adjustBounds(tpos, tstep, numSteps));

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
  let tfunRows: f32 = f32(textureDimensions(tfunTexture).y);
  loop
  {
    var sample: f32 = getTraverseValue(getTextureValue(vTex, tpos, vNum), vNum);
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
  traverseVals[vNum] = getSimpleColor(sumVal, rowIdx, tfunRows);
}

// Radon: accumulate attenuation along the ray to produce a
// "normalized ray intensity" that is then mapped through the transfer function
// by getRadonColor. The result is an opaque intensity image (alpha is always
// 1.0), so no opacity is composited here.
//
// Port of the OpenGL mapper's RADON_TRANSFORM_BLEND path: the ray start is
// jittered per fragment to break up banding, and the leading/trailing partial
// samples are weighted by their fractional step length so thin slabs and ray
// endpoints integrate correctly (rather than marching uniform integer steps).
fn traverseRadon(vTex: texture_3d<f32>, vNum: i32, rowIdx: i32, rayLengthSC: f32, minPosSC: vec4<f32>, rayStepSC: vec4<f32>, fragPos: vec4<f32>)
{
  // convert to tcoords and reject if outside the volume
  var numSteps: f32 = rayLengthSC/mapperUBO.SampleDistance;
  let tpos0: vec4<f32> = volumeSSBO.values[vNum].SCTCMatrix*minPosSC;
  var tpos2: vec4<f32> = volumeSSBO.values[vNum].SCTCMatrix*(minPosSC + rayStepSC);
  var tstep: vec4<f32> = tpos2 - tpos0;

  var rayBounds: vec2<f32> = adjustBounds(tpos0, tstep, numSteps);

  // did we hit anything
  if (rayBounds.x >= rayBounds.y)
  {
    traverseVals[vNum] = vec4<f32>(0.0,0.0,0.0,0.0);
    return;
  }

  let tfunRows: f32 = f32(textureDimensions(tfunTexture).y);
  let raySpan: f32 = rayBounds.y - rayBounds.x;
  let sampleDistance: f32 = mapperUBO.SampleDistance;

  // Thin volumes can intersect the ray across less than a full sample step.
  if (raySpan <= 1.0)
  {
    let scalar: f32 = getTraverseValue(getTextureValue(vTex, tpos0 + tstep*rayBounds.x, vNum), vNum);
    let intensity = 1.0 - raySpan * sampleDistance * getOpacity(scalar, rowIdx, tfunRows);
    traverseVals[vNum] = getRadonColor(intensity, rowIdx, tfunRows);
    return;
  }

  let jitter: f32 = getFragmentSeed(fragPos);
  var normalizedRayIntensity: f32 = 1.0;

  // Leading partial sample at the entry point, weighted by the jitter offset.
  var tpos: vec4<f32> = tpos0 + tstep*rayBounds.x;
  let firstScalar: f32 = getTraverseValue(getTextureValue(vTex, tpos, vNum), vNum);
  normalizedRayIntensity = normalizedRayIntensity -
    jitter * sampleDistance * getOpacity(firstScalar, rowIdx, tfunRows);

  // Offset the start by the jitter so the interior samples are dithered.
  var curStep: f32 = rayBounds.x + jitter;
  tpos = tpos + tstep*jitter;

  // Full interior steps.
  loop
  {
    if (curStep + 1.0 >= rayBounds.y) { break; }
    let scalar: f32 = getTraverseValue(getTextureValue(vTex, tpos, vNum), vNum);
    normalizedRayIntensity = normalizedRayIntensity -
      sampleDistance * getOpacity(scalar, rowIdx, tfunRows);
    curStep = curStep + 1.0;
    tpos = tpos + tstep;
  }

  // Trailing partial sample at the clamped exit point.
  let remaining: f32 = rayBounds.y - curStep;
  if (remaining > 0.0)
  {
    var endPos: vec4<f32> = tpos0 + tstep*rayBounds.y;
    endPos = vec4<f32>(clamp(endPos.xyz, vec3<f32>(0.0), vec3<f32>(1.0)), 1.0);
    let endScalar: f32 = getTraverseValue(getTextureValue(vTex, endPos, vNum), vNum);
    normalizedRayIntensity = normalizedRayIntensity -
      remaining * sampleDistance * getOpacity(endScalar, rowIdx, tfunRows);
  }

  traverseVals[vNum] = getRadonColor(normalizedRayIntensity, rowIdx, tfunRows);
}

fn composite(fragPos: vec4<f32>, rayLengthSC: f32, minPosSC: vec4<f32>, rayStepSC: vec4<f32>) -> vec4<f32>
{
  // initial ray position is at the beginning
  var rayPosSC: vec4<f32> = minPosSC;

  // how many rows (tfuns) do we have in our tfunTexture
  var tfunRows: f32 = f32(textureDimensions(tfunTexture).y);

  var curDist: f32 = 0.0;
  var computedColor: vec4<f32> = vec4<f32>(0.0, 0.0, 0.0, 0.0);
  var sampleColor: vec4<f32>;
  var numSteps: f32 = rayLengthSC/mapperUBO.SampleDistance;
//VTK::Volume::TraverseCalls
//VTK::Volume::TraverseInit

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

@fragment
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
const tmp3Mat4 = new Float64Array(16);
const tmp4Mat4 = new Float64Array(16);
const tmpVec3a = new Float64Array(3);
const tmpVec3b = new Float64Array(3);

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
    const clipInit = [];
    const traverseCalls = [];
    for (let i = 0; i < model.volumes.length; i++) {
      // todo pass rowPos
      const blendMode = model.volumes[i]
        .getRenderable()
        .getMapper()
        .getBlendMode();
      if (blendMode === BlendMode.COMPOSITE_BLEND) {
        clipInit.push(
          `  var tpos${i}: vec4<f32> = volumeSSBO.values[${i}].SCTCMatrix*minPosSC;`
        );
        clipInit.push(
          `  var tpos2_${i}: vec4<f32> = volumeSSBO.values[${i}].SCTCMatrix*(minPosSC + rayStepSC);`
        );
        clipInit.push(`  var tstep${i}: vec4<f32> = tpos2_${i} - tpos${i};`);
        clipInit.push(
          `  var rayBounds${i}: vec2<f32> = intersectRayBoundsWithClipPlanes(${i}, minPosSC, rayStepSC, adjustBounds(tpos${i}, tstep${i}, numSteps));`
        );
        compositeCalls.push(
          `    if (curDist >= rayBounds${i}.x * mapperUBO.SampleDistance && curDist <= rayBounds${i}.y * mapperUBO.SampleDistance) {`
        );
        compositeCalls.push(
          `      sampleColor = processVolume(volTexture${i}, fragPos, ${i}, ${model.rowStarts[i]}, rayPosSC, tfunRows);`
        );
        compositeCalls.push(`    computedColor = vec4<f32>(
          sampleColor.a * sampleColor.rgb * (1.0 - computedColor.a) + computedColor.rgb,
          (1.0 - computedColor.a)*sampleColor.a + computedColor.a);`);
        compositeCalls.push('    }');
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
    code = vtkWebGPUShaderCache.substitute(
      code,
      '//VTK::Volume::TraverseInit',
      clipInit
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
          `    traverseMax(volTexture${vidx}, ${vidx}, ${model.rowStarts[vidx]}, rayLengthSC, minPosSC, rayStepSC);`,
          `    computedColor = traverseVals[${vidx}];`,
          '//VTK::Volume::Loop',
        ]).result;
      } else if (blendMode === BlendMode.MINIMUM_INTENSITY_BLEND) {
        code = vtkWebGPUShaderCache.substitute(code, '//VTK::Volume::Loop', [
          `    traverseMin(volTexture${vidx}, ${vidx}, ${model.rowStarts[vidx]}, rayLengthSC, minPosSC, rayStepSC);`,
          `    computedColor = traverseVals[${vidx}];`,
          '//VTK::Volume::Loop',
        ]).result;
      } else if (blendMode === BlendMode.AVERAGE_INTENSITY_BLEND) {
        code = vtkWebGPUShaderCache.substitute(code, '//VTK::Volume::Loop', [
          `    traverseAverage(volTexture${vidx}, ${vidx}, ${model.rowStarts[vidx]}, rayLengthSC, minPosSC, rayStepSC);`,
          `    computedColor = traverseVals[${vidx}];`,
          '//VTK::Volume::Loop',
        ]).result;
      } else if (blendMode === BlendMode.ADDITIVE_INTENSITY_BLEND) {
        code = vtkWebGPUShaderCache.substitute(code, '//VTK::Volume::Loop', [
          `    traverseAdditive(volTexture${vidx}, ${vidx}, ${model.rowStarts[vidx]}, rayLengthSC, minPosSC, rayStepSC);`,
          `    computedColor = traverseVals[${vidx}];`,
          '//VTK::Volume::Loop',
        ]).result;
      } else if (blendMode === BlendMode.RADON_TRANSFORM_BLEND) {
        code = vtkWebGPUShaderCache.substitute(code, '//VTK::Volume::Loop', [
          `    traverseRadon(volTexture${vidx}, ${vidx}, ${model.rowStarts[vidx]}, rayLengthSC, minPosSC, rayStepSC, input.fragPos);`,
          `    computedColor = traverseVals[${vidx}];`,
          '//VTK::Volume::Loop',
        ]).result;
      }
    }
    if (compositeWhileTraversing) {
      code = vtkWebGPUShaderCache.substitute(code, '//VTK::Volume::Loop', [
        '    computedColor = composite(input.fragPos, rayLengthSC, minPosSC, rayStepSC);',
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
    const colorArray = new Uint8ClampedArray(
      model.numRows * 2 * model.rowLength * 4
    );
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
        const cTarget = iComps ? c : 0;
        const oTarget = iComps ? c : 0;
        const cfun = vprop.getRGBTransferFunction(cTarget);
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

        const ofun = vprop.getScalarOpacity(oTarget);
        const opacityFactor =
          model.sampleDist / vprop.getScalarOpacityUnitDistance(oTarget);

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
    const renderer = model.WebGPURenderer.getRenderable();
    const camera = renderer.getActiveCamera();
    const webgpuCamera = model.WebGPURenderer.getViewNodeFor(camera);
    const keyMats = webgpuCamera.getKeyMatrices(model.WebGPURenderer);

    let mtime = Math.max(
      publicAPI.getMTime(),
      model.WebGPURenderer.getStabilizedTime(),
      renderer.getMTime(),
      camera.getMTime(),
      webgpuCamera.getMTime()
    );
    for (let i = 0; i < model.volumes.length; i++) {
      const vol = model.volumes[i].getRenderable();
      const volMapr = vol.getMapper();
      const image = volMapr.getInputData();
      mtime = Math.max(
        mtime,
        vol.getMTime(),
        image.getMTime(),
        volMapr.getMTime(),
        volMapr.getClippingPlanesMTime()
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
    const vctcArray = new Float64Array(model.volumes.length * 16);
    const vPlaneArray = new Float64Array(model.volumes.length * 16);
    const clipPlaneArrays = Array.from(
      { length: MAX_CLIPPING_PLANES },
      () => new Float64Array(model.volumes.length * 4)
    );
    const clipPlaneStates = new Float64Array(model.volumes.length * 4);
    const tstepArray = new Float64Array(model.volumes.length * 4);
    const shadeArray = new Float64Array(model.volumes.length * 4);
    const lightingArray = new Float64Array(model.volumes.length * 4);
    const scatteringArray = new Float64Array(model.volumes.length * 4);
    const shadowArray = new Float64Array(model.volumes.length * 4);
    const laoArray = new Float64Array(model.volumes.length * 4);
    const spacingArray = new Float64Array(model.volumes.length * 4);
    const ipScalarRangeArray = new Float64Array(model.volumes.length * 4);
    const componentInfoArray = new Float64Array(model.volumes.length * 4);
    const colorScaleArray = new Float64Array(model.volumes.length * 4);
    const colorShiftArray = new Float64Array(model.volumes.length * 4);
    const opacityScaleArray = new Float64Array(model.volumes.length * 4);
    const opacityShiftArray = new Float64Array(model.volumes.length * 4);
    for (let vidx = 0; vidx < model.volumes.length; vidx++) {
      const webgpuvol = model.volumes[vidx];
      const actor = webgpuvol.getRenderable();
      const volMapr = actor.getMapper();
      const image = volMapr.getInputData();
      const scalars = image.getPointData() && image.getPointData().getScalars();
      const numComp = scalars.getNumberOfComponents();
      const vprop = actor.getProperty();

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

      mat4.invert(tmp3Mat4, keyMats.scvc);
      mat4.multiply(tmp2Mat4, tmpMat4, tmp3Mat4);
      for (let j = 0; j < 16; j++) {
        vctcArray[vidx * 16 + j] = tmp2Mat4[j];
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
      lightingArray[vidx * 4] = vprop.getAmbient();
      lightingArray[vidx * 4 + 1] = vprop.getDiffuse();
      lightingArray[vidx * 4 + 2] = vprop.getSpecular();
      lightingArray[vidx * 4 + 3] =
        vprop.getSpecularPower() === 0 ? 1.0 : vprop.getSpecularPower();
      scatteringArray[vidx * 4] = vprop.getVolumetricScatteringBlending();
      scatteringArray[vidx * 4 + 1] = vprop.getGlobalIlluminationReach();
      scatteringArray[vidx * 4 + 2] = vprop.getAnisotropy();
      scatteringArray[vidx * 4 + 3] =
        vprop.getAnisotropy() * vprop.getAnisotropy();
      mat4.multiply(tmp4Mat4, keyMats.scvc, tmpMat4);
      // diagonal length of the volume's unit tcoord box in view coords
      vec3.transformMat4(tmpVec3a, [0.0, 0.0, 0.0], tmp4Mat4);
      vec3.transformMat4(tmpVec3b, [1.0, 1.0, 1.0], tmp4Mat4);
      shadowArray[vidx * 4] = vec3.distance(tmpVec3b, tmpVec3a);
      shadowArray[vidx * 4 + 1] =
        volMapr.getSampleDistance() *
        volMapr.getVolumeShadowSamplingDistFactor();
      laoArray[vidx * 4] =
        vprop.getLocalAmbientOcclusion() && vprop.getAmbient() > 0.0
          ? vprop.getLAOKernelSize()
          : 0.0;
      laoArray[vidx * 4 + 1] = vprop.getLAOKernelRadius();

      const spacing = image.getSpacing();
      spacingArray[vidx * 4] = spacing[0];
      spacingArray[vidx * 4 + 1] = spacing[1];
      spacingArray[vidx * 4 + 2] = spacing[2];
      spacingArray[vidx * 4 + 3] = 1.0;

      // handle filteringMode
      const tScale = model.textureViews[vidx + 4].getTexture().getScale();
      const ipScalarRange = actor.getProperty().getIpScalarRange();
      ipScalarRangeArray[vidx * 4] = ipScalarRange[0] / tScale;
      ipScalarRangeArray[vidx * 4 + 1] = ipScalarRange[1] / tScale;
      ipScalarRangeArray[vidx * 4 + 2] = actor.getProperty().getFilterMode();
      ipScalarRangeArray[vidx * 4 + 3] = 0.0;
      componentInfoArray[vidx * 4] = scalars.getNumberOfComponents();
      componentInfoArray[vidx * 4 + 1] = actor
        .getProperty()
        .getIndependentComponents()
        ? 1.0
        : 0.0;
      componentInfoArray[vidx * 4 + 2] = vprop.getColorMixPreset();
      // Pack the per component ForceNearestInterpolation flags into a bitmask
      // (bit N = component N). The shader unpacks this in getTextureValue to
      // override individual components with a nearest fetch. This replaces the
      // OpenGL mapper's per component vtkComponentNForceNearest shader defines
      // with runtime SSBO data.
      let forceNearestMask = 0;
      for (let component = 0; component < numComp; component++) {
        if (vprop.getForceNearestInterpolation(component)) {
          forceNearestMask |= 1 << component;
        }
      }
      componentInfoArray[vidx * 4 + 3] = forceNearestMask;

      for (let component = 0; component < numComp; component++) {
        const sscale = tScale;
        const cfun = vprop.getRGBTransferFunction(
          vprop.getIndependentComponents() ? component : 0
        );
        const cRange = cfun.getRange();
        // Guard against degenerate (zero width) tf ranges, which
        // would otherwise produce Inf/NaN scale and shift values. A zero inverse
        // width collapses the lookup to the start of the function.
        const cWidth = cRange[1] - cRange[0];
        const cInvWidth = Math.abs(cWidth) > EPSILON ? 1.0 / cWidth : 0.0;
        colorScaleArray[vidx * 4 + component] = sscale * cInvWidth;
        colorShiftArray[vidx * 4 + component] = -cRange[0] * cInvWidth;

        const ofun = vprop.getScalarOpacity(
          vprop.getIndependentComponents() ? component : 0
        );
        const oRange = ofun.getRange();
        const oWidth = oRange[1] - oRange[0];
        const oInvWidth = Math.abs(oWidth) > EPSILON ? 1.0 / oWidth : 0.0;
        opacityScaleArray[vidx * 4 + component] = sscale * oInvWidth;
        opacityShiftArray[vidx * 4 + component] = -oRange[0] * oInvWidth;
      }

      mat4.fromTranslation(tmp2Mat4, [-center[0], -center[1], -center[2]]);
      const clipPlaneCount = getClippingPlaneEquationsInCoords(
        volMapr,
        tmp2Mat4,
        model.clipPlanes
      );
      clipPlaneStates[vidx * 4] = clipPlaneCount;
      for (let i = 0; i < clipPlaneCount; i++) {
        const clipOffset = vidx * 4;
        clipPlaneArrays[i][clipOffset] = model.clipPlanes[i][0];
        clipPlaneArrays[i][clipOffset + 1] = model.clipPlanes[i][1];
        clipPlaneArrays[i][clipOffset + 2] = model.clipPlanes[i][2];
        clipPlaneArrays[i][clipOffset + 3] = model.clipPlanes[i][3];
      }
    }
    model.SSBO.addEntry('SCTCMatrix', 'mat4x4<f32>');
    model.SSBO.addEntry('VCTCMatrix', 'mat4x4<f32>');
    model.SSBO.addEntry('planeNormals', 'mat4x4<f32>');
    model.SSBO.addEntry('shade', 'vec4<f32>');
    model.SSBO.addEntry('lighting', 'vec4<f32>');
    model.SSBO.addEntry('scattering', 'vec4<f32>');
    model.SSBO.addEntry('shadow', 'vec4<f32>');
    model.SSBO.addEntry('lao', 'vec4<f32>');
    model.SSBO.addEntry('tstep', 'vec4<f32>');
    model.SSBO.addEntry('spacing', 'vec4<f32>');
    model.SSBO.addEntry('ipScalarRange', 'vec4<f32>');
    model.SSBO.addEntry('componentInfo', 'vec4<f32>');
    model.SSBO.addEntry('colorScale', 'vec4<f32>');
    model.SSBO.addEntry('colorShift', 'vec4<f32>');
    model.SSBO.addEntry('opacityScale', 'vec4<f32>');
    model.SSBO.addEntry('opacityShift', 'vec4<f32>');
    addClipPlaneEntries(model.SSBO, 'clipPlane');
    model.SSBO.addEntry('clipPlaneStates', 'vec4<f32>');
    model.SSBO.setAllInstancesFromArray('SCTCMatrix', marray);
    model.SSBO.setAllInstancesFromArray('VCTCMatrix', vctcArray);
    model.SSBO.setAllInstancesFromArray('planeNormals', vPlaneArray);
    model.SSBO.setAllInstancesFromArray('shade', shadeArray);
    model.SSBO.setAllInstancesFromArray('lighting', lightingArray);
    model.SSBO.setAllInstancesFromArray('scattering', scatteringArray);
    model.SSBO.setAllInstancesFromArray('shadow', shadowArray);
    model.SSBO.setAllInstancesFromArray('lao', laoArray);
    model.SSBO.setAllInstancesFromArray('tstep', tstepArray);
    model.SSBO.setAllInstancesFromArray('spacing', spacingArray);
    model.SSBO.setAllInstancesFromArray('ipScalarRange', ipScalarRangeArray);
    model.SSBO.setAllInstancesFromArray('componentInfo', componentInfoArray);
    model.SSBO.setAllInstancesFromArray('colorScale', colorScaleArray);
    model.SSBO.setAllInstancesFromArray('colorShift', colorShiftArray);
    model.SSBO.setAllInstancesFromArray('opacityScale', opacityScaleArray);
    model.SSBO.setAllInstancesFromArray('opacityShift', opacityShiftArray);
    for (let i = 0; i < MAX_CLIPPING_PLANES; i++) {
      model.SSBO.setAllInstancesFromArray(`clipPlane${i}`, clipPlaneArrays[i]);
    }
    model.SSBO.setAllInstancesFromArray('clipPlaneStates', clipPlaneStates);
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
    const mixWeightArray = new Float64Array(model.numRows);
    const opacityModeArray = new Float64Array(model.numRows);

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
      const numRowsForVolume = iComps ? numComp : 1;

      // half float?
      const tformat = model.textureViews[vidx + 4].getTexture().getFormat();
      const tDetails = vtkWebGPUTypes.getDetailsFromTextureFormat(tformat);
      const halfFloat =
        tDetails.elementSize === 2 && tDetails.sampleType === 'float';

      const volInfo = { scale: halfFloat ? 1.0 : 255.0, offset: 0.0 };

      // three levels of shift scale combined into one
      // for performance in the fragment shader
      for (let compIdx = 0; compIdx < numRowsForVolume; compIdx++) {
        const cTarget = iComps ? compIdx : 0;
        // For dependent components the opacity comes from the last (alpha)
        // channel: 2-component -> 1, 4-component -> 3, otherwise 0.
        let oTarget = 0;
        if (iComps) {
          oTarget = compIdx;
        } else if (numComp === 2 || numComp === 4) {
          oTarget = numComp - 1;
        }
        const goTarget = iComps ? compIdx : 0;
        const sscale = volInfo.scale;
        const ofun = vprop.getScalarOpacity(oTarget);
        const oRange = ofun.getRange();
        const oscale = sscale / (oRange[1] - oRange[0]);
        const oshift = (volInfo.offset - oRange[0]) / (oRange[1] - oRange[0]);
        oShiftArray[rowIdx] = oshift;
        oScaleArray[rowIdx] = oscale;

        const cfun = vprop.getRGBTransferFunction(cTarget);
        const cRange = cfun.getRange();
        cShiftArray[rowIdx] =
          (volInfo.offset - cRange[0]) / (cRange[1] - cRange[0]);
        cScaleArray[rowIdx] = sscale / (cRange[1] - cRange[0]);
        mixWeightArray[rowIdx] = iComps
          ? (vprop.getComponentWeight?.(compIdx) ?? 1.0)
          : 1.0;
        opacityModeArray[rowIdx] = vprop.getOpacityMode(goTarget);

        const useGO = vprop.getUseGradientOpacity(goTarget);
        if (useGO) {
          const gomin = vprop.getGradientOpacityMinimumOpacity(goTarget);
          const gomax = vprop.getGradientOpacityMaximumOpacity(goTarget);
          gominArray[rowIdx] = gomin;
          gomaxArray[rowIdx] = gomax;
          const goRange = [
            vprop.getGradientOpacityMinimumValue(goTarget),
            vprop.getGradientOpacityMaximumValue(goTarget),
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
    model.componentSSBO.addEntry('mixWeight', 'f32');
    model.componentSSBO.addEntry('opacityMode', 'f32');
    model.componentSSBO.setAllInstancesFromArray('cScale', cScaleArray);
    model.componentSSBO.setAllInstancesFromArray('cShift', cShiftArray);
    model.componentSSBO.setAllInstancesFromArray('oScale', oScaleArray);
    model.componentSSBO.setAllInstancesFromArray('oShift', oShiftArray);
    model.componentSSBO.setAllInstancesFromArray('goScale', goscaleArray);
    model.componentSSBO.setAllInstancesFromArray('goShift', goshiftArray);
    model.componentSSBO.setAllInstancesFromArray('gomin', gominArray);
    model.componentSSBO.setAllInstancesFromArray('gomax', gomaxArray);
    model.componentSSBO.setAllInstancesFromArray('mixWeight', mixWeightArray);
    model.componentSSBO.setAllInstancesFromArray(
      'opacityMode',
      opacityModeArray
    );
    model.componentSSBO.send(device);
  };

  const superClassUpdateBuffers = publicAPI.updateBuffers;
  publicAPI.updateBuffers = () => {
    superClassUpdateBuffers();

    // 32x32 per fragment jitter noise, shared across all volume passes on this
    // device (cf. the shared jitter texture in the OpenGL mapper).
    if (!model.jitterSSBO) {
      model.jitterSSBO = model.device.getCachedObject(
        'vtkWebGPUVolumePassFSQ-jitterSSBO',
        () => {
          const ssbo = vtkWebGPUStorageBuffer.newInstance({
            label: 'jitterSSBO',
          });
          ssbo.setNumberOfInstances(32 * 32);
          ssbo.addEntry('value', 'f32');
          const jitterArray = new Float32Array(32 * 32);
          for (let i = 0; i < jitterArray.length; i++) {
            jitterArray[i] = Math.random();
          }
          ssbo.setAllInstancesFromArray('value', jitterArray);
          ssbo.send(model.device);
          return ssbo;
        }
      );
    }

    // 32 random directions for ambient-occlusion sampling, likewise shared.
    if (!model.kernelSampleSSBO) {
      model.kernelSampleSSBO = model.device.getCachedObject(
        'vtkWebGPUVolumePassFSQ-kernelSampleSSBO',
        () => {
          const ssbo = vtkWebGPUStorageBuffer.newInstance({
            label: 'kernelSampleSSBO',
          });
          ssbo.setNumberOfInstances(32);
          ssbo.addEntry('value', 'vec2<f32>');
          const kernelArray = new Float32Array(32 * 2);
          for (let i = 0; i < 32; i++) {
            kernelArray[i * 2] = Math.random();
            kernelArray[i * 2 + 1] = Math.random();
          }
          ssbo.setAllInstancesFromArray('value', kernelArray);
          ssbo.send(model.device);
          return ssbo;
        }
      );
    }

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
    bindables.push(model.jitterSSBO);
    bindables.push(model.kernelSampleSSBO);
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
  model.clipPlanes = Array.from({ length: MAX_CLIPPING_PLANES }, () => [
    0.0, 0.0, 0.0, 0.0,
  ]);

  // Object methods
  vtkWebGPUVolumePassFSQ(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkWebGPUVolumePassFSQ');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
