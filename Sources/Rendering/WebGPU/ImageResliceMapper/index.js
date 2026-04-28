import { mat3, mat4, vec3 } from 'gl-matrix';

import macro from 'vtk.js/Sources/macros';
import vtkClosedPolyLineToSurfaceFilter from 'vtk.js/Sources/Filters/General/ClosedPolyLineToSurfaceFilter';
import vtkCutter from 'vtk.js/Sources/Filters/Core/Cutter';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageDataOutlineFilter from 'vtk.js/Sources/Filters/General/ImageDataOutlineFilter';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkTransform from 'vtk.js/Sources/Common/Transform/Transform';
import vtkWebGPUImageMapper from 'vtk.js/Sources/Rendering/WebGPU/ImageMapper';
import vtkWebGPUShaderCache from 'vtk.js/Sources/Rendering/WebGPU/ShaderCache';
import { getTextureChannelMode } from 'vtk.js/Sources/Rendering/WebGPU/Helpers/ImageSampling';

import {
  TextureChannelMode,
  TextureSlot,
} from 'vtk.js/Sources/Rendering/WebGPU/ImageMapper/Constants';

import { InterpolationType } from 'vtk.js/Sources/Rendering/Core/ImageProperty/Constants';
import {
  PrimitiveTypes,
  BufferUsage,
} from 'vtk.js/Sources/Rendering/WebGPU/BufferManager/Constants';
import { Representation } from 'vtk.js/Sources/Rendering/Core/Property/Constants';
import { registerOverride } from 'vtk.js/Sources/Rendering/WebGPU/ViewNodeFactory';

const { vtkErrorMacro, vtkWarningMacro } = macro;

const tmpMat4 = new Float64Array(16);
const tmpMat3 = new Float64Array(9);
const tmpColorScale = new Float32Array(4);
const tmpColorShift = new Float32Array(4);
const tmpOpacityScale = new Float32Array(4);
const tmpOpacityShift = new Float32Array(4);
const tmpComponentWeight = new Float32Array(4);
const COMPONENT_NAMES = ['r', 'g', 'b', 'a'];
const tmpOutlineTangent1 = [0, 0, 0];
const tmpOutlineTangent2 = [0, 0, 0];
const tmpOutlineTexelSize = [0, 0, 0];
const tmpOutlineVec3a = vec3.create();
const tmpOutlineVec3b = vec3.create();
const tmpAxisAlignedN = [0, 0, 0];
const tmpPlaneNormal = [0, 0, 1];
const tmpOutlineVec4 = new Float32Array(4);
const tmpVec4 = new Float32Array(4);
const ZERO_OUTLINE_VEC4 = new Float32Array(4);
const MAX_TEXTURE_INPUTS = 4;

function getOutlineTangent1Name(index) {
  return `OutlineTangent1_${index}`;
}

function getOutlineTangent2Name(index) {
  return `OutlineTangent2_${index}`;
}

function getOutlineTexelSizeName(index) {
  return `OutlineTexelSize_${index}`;
}

function getInputProperty(actor, inputIndex) {
  if (!actor) return null;
  return actor.getProperty(inputIndex) || actor.getProperty();
}

function collectValidInputs(actor, renderable) {
  const currentValidInputs = [];
  const labelOutlineProperties = [];
  const numberOfInputs = renderable.getNumberOfInputPorts();

  for (let inputIndex = 0; inputIndex < numberOfInputs; ++inputIndex) {
    const imageData = renderable.getInputData(inputIndex);
    if (imageData && !imageData.isDeleted()) {
      const arrayIndex = currentValidInputs.length;
      currentValidInputs.push({ imageData, inputIndex });

      const property = getInputProperty(actor, inputIndex);
      if (property?.getUseLabelOutline()) {
        labelOutlineProperties.push({ property, arrayIndex });
      }
    }
  }

  return { currentValidInputs, labelOutlineProperties };
}

function getTextureSlotForInput(index) {
  return index;
}

function getTextureLabelForInput(index) {
  return index === 0 ? 'imgTexture' : `imgTexture${index + 1}`;
}

function getWCTCMatrixName(index) {
  return index === 0 ? 'SCTCMatrix' : `WCTCMatrix${index}`;
}

function getColorTextureSlot(model) {
  return model.multiTexturePerVolumeEnabled
    ? model.currentValidInputs.length
    : TextureSlot.COLOR_LUT;
}

function getOpacityTextureSlot(model) {
  return getColorTextureSlot(model) + 1;
}

function getLabelOutlineThicknessSlot(model) {
  return getOpacityTextureSlot(model) + 1;
}

function getLabelOutlineOpacitySlot(model) {
  return getLabelOutlineThicknessSlot(model) + 1;
}

function getOutlineFlagString(actor, currentValidInputs) {
  return currentValidInputs
    .map(({ inputIndex }) =>
      getInputProperty(actor, inputIndex)?.getUseLabelOutline() ? '1' : '0'
    )
    .join('');
}

function getTransferFunctionHash(
  actor,
  currentValidInputs,
  independentComponents,
  numberOfRows,
  kind
) {
  if (!currentValidInputs.length) {
    return '0';
  }
  const fnName =
    kind === 'color' ? 'getRGBTransferFunction' : 'getPiecewiseFunction';
  const rows = [];
  for (let i = 0; i < numberOfRows; i++) {
    const property = independentComponents
      ? getInputProperty(actor, currentValidInputs[i].inputIndex)
      : getInputProperty(actor, currentValidInputs[0].inputIndex);
    const fn = property?.[fnName]?.(independentComponents ? 0 : i);
    rows.push(`${property?.getMTime?.() ?? 0}:${fn?.getMTime?.() ?? 0}`);
  }
  return rows.join('|');
}

function isVectorAxisAligned(n) {
  vtkMath.normalize(n);
  for (let i = 0; i < 3; ++i) {
    vec3.zero(tmpAxisAlignedN);
    tmpAxisAlignedN[i] = 1.0;
    const dotP = vtkMath.dot(n, tmpAxisAlignedN);
    if (dotP < -0.999999 || dotP > 0.999999) {
      return [true, i];
    }
  }
  return [false, 2];
}

function buildOrderedInputIndices(numberOfComponents, labelRows) {
  const orderedInputs = [];
  for (let i = 0; i < numberOfComponents; i++) {
    if (!labelRows.has(i)) {
      orderedInputs.push(i);
    }
  }
  for (let i = 0; i < numberOfComponents; i++) {
    if (labelRows.has(i)) {
      orderedInputs.push(i);
    }
  }
  return orderedInputs;
}

function setTmpVec4(vec4Array, x, y, z, w = 0) {
  vec4Array[0] = x;
  vec4Array[1] = y;
  vec4Array[2] = z;
  vec4Array[3] = w;
  return vec4Array;
}

function copyVec3(out, values) {
  out[0] = values[0];
  out[1] = values[1];
  out[2] = values[2];
  return out;
}

/**
 * Fill a packed xyz normal array with one plane normal.
 */
function fillPackedNormals(values, normal, numberOfPoints) {
  for (let i = 0; i < numberOfPoints; ++i) {
    values[3 * i] = normal[0];
    values[3 * i + 1] = normal[1];
    values[3 * i + 2] = normal[2];
  }
}

/**
 * Reset geometry buffers
 */
function clearGeometryBuffers(publicAPI, model) {
  model.vertexInput.setIndexBuffer(null);
  model.vertexInput.removeBufferIfPresent('vertexBC');
  model.vertexInput.removeBufferIfPresent('vertexNormal');
  publicAPI.setNumberOfVertices(0);
}

function getCachedInputTexture(model, imageData, index) {
  const scalars = imageData.getPointData().getScalars();
  const currentMTime = scalars.getMTime();
  const cachedInfo = model.scalarTextures[index];
  if (cachedInfo && cachedInfo.mtime === currentMTime) {
    return cachedInfo.texture;
  }

  const texture = model.device
    .getTextureManager()
    .getTextureForImageData(imageData);
  model.scalarTextures[index] = {
    texture,
    mtime: currentMTime,
  };
  return texture;
}

function getInterpolationFilter(property) {
  return property?.getInterpolationType() === InterpolationType.NEAREST
    ? 'nearest'
    : 'linear';
}

function updateInputTextureView(
  publicAPI,
  model,
  actor,
  imageData,
  inputIndex,
  index
) {
  const textureSlot = getTextureSlotForInput(index);
  const textureName = getTextureLabelForInput(index);
  const texture = getCachedInputTexture(model, imageData, index);

  if (
    !model.textureViews[textureSlot] ||
    model.textureViews[textureSlot].getTexture() !== texture
  ) {
    model.textureViews[textureSlot] = texture.createView(textureName);
  }

  const ppty = getInputProperty(actor, inputIndex);
  const iType = getInterpolationFilter(ppty);
  publicAPI.ensureTextureSampler(model.textureViews[textureSlot], {
    minFilter: iType,
    magFilter: iType,
  });
}

function getTextureBindingUsage() {
  /* eslint-disable no-undef */
  /* eslint-disable no-bitwise */
  const textureUsage =
    GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST;
  /* eslint-enable no-undef */
  /* eslint-enable no-bitwise */
  return textureUsage;
}

/**
 * Build the LabelOutline texture hash.
 */
function getLabelOutlineTextureParameters(
  labelOutlineProperties,
  getDataArray
) {
  const dataArrays = [];
  const hashParts = [];
  let width = 0;

  for (let row = 0; row < labelOutlineProperties.length; row++) {
    const dataArray = getDataArray(labelOutlineProperties[row].property);
    dataArrays.push(dataArray);
    hashParts.push(dataArray.join('-'));
    width = Math.max(width, dataArray.length);
  }

  return {
    dataArrays,
    hash: hashParts.join('|'),
    width,
    height: dataArrays.length,
  };
}

/**
 * Pack ragged per input label outline rows into a rectangular texture table.
 */
function fillLabelOutlineTextureTable(table, dataArrays, width) {
  for (let row = 0; row < dataArrays.length; row++) {
    const dataArray = dataArrays[row];
    const rowOffset = row * width;
    for (let col = 0; col < width; col++) {
      table[rowOffset + col] = dataArray[col] ?? dataArray[0];
    }
  }
  return table;
}

function getSampleCoordSuffix(dimensions) {
  return dimensions === 2 ? 'xy' : 'xyz';
}

function buildShaderSamplingContext(dimensions) {
  if (dimensions === 2) {
    return {
      sampleCoordType: 'vec2<f32>',
      coordFromWorldNeg: '(mapperUBO.SCTCMatrix * vec4<f32>(worldNeg, 1.0)).xy',
      coordFromWorldPos: '(mapperUBO.SCTCMatrix * vec4<f32>(worldPos, 1.0)).xy',
      coordBounds:
        'all(sampleCoord >= vec2<f32>(0.0)) && all(sampleCoord <= vec2<f32>(1.0))',
      negBounds:
        'all(coordNeg >= vec2<f32>(0.0)) && all(coordNeg <= vec2<f32>(1.0))',
      posBounds:
        'all(coordPos >= vec2<f32>(0.0)) && all(coordPos <= vec2<f32>(1.0))',
    };
  }

  return {
    sampleCoordType: 'vec3<f32>',
    coordFromWorldNeg: '(mapperUBO.SCTCMatrix * vec4<f32>(worldNeg, 1.0)).xyz',
    coordFromWorldPos: '(mapperUBO.SCTCMatrix * vec4<f32>(worldPos, 1.0)).xyz',
    coordBounds:
      'all(sampleCoord >= vec3<f32>(0.0)) && all(sampleCoord <= vec3<f32>(1.0))',
    negBounds:
      'all(coordNeg >= vec3<f32>(0.0)) && all(coordNeg <= vec3<f32>(1.0))',
    posBounds:
      'all(coordPos >= vec3<f32>(0.0)) && all(coordPos <= vec3<f32>(1.0))',
  };
}

function buildMultiInputSampleExpr(model, numInputs, worldPosExpr) {
  const comps = [];
  const coordSuffix = getSampleCoordSuffix(model.dimensions);
  for (let i = 0; i < MAX_TEXTURE_INPUTS; i++) {
    if (i < numInputs) {
      const texName = getTextureLabelForInput(i);
      const matrixName = getWCTCMatrixName(i);
      const coordExpr = `(mapperUBO.${matrixName} * vec4<f32>(${worldPosExpr}, 1.0)).${coordSuffix}`;
      comps.push(
        `textureSampleLevel(${texName}, ${texName}Sampler, ${coordExpr}, 0.0).r`
      );
    } else {
      comps.push('0.0');
    }
  }
  return `vec4<f32>(${comps.join(', ')})`;
}

function getSlabCompositeDecLines() {
  return [
    'fn vtkCompositeSlab(currVal: vec4<f32>, valToComp: vec4<f32>, slabType: i32, trapezoid: i32) -> vec4<f32> {',
    '  if (slabType == 0) { return min(currVal, valToComp); }',
    '  if (slabType == 1) { return max(currVal, valToComp); }',
    '  if (trapezoid > 0) { return currVal + 0.5 * valToComp; }',
    '  return currVal + valToComp;',
    '}',
  ];
}

function buildInitialImageSampleLines(
  model,
  samplingCtx,
  multiInputSampleExpr
) {
  const useSlab = model.renderable.getSlabThickness() > 0.0;
  const rawSampleLine = model.multiTexturePerVolumeEnabled
    ? `      var rawValue: vec4<f32> = ${multiInputSampleExpr(
        'input.worldPosVS'
      )};`
    : '      var rawValue: vec4<f32> = textureSampleLevel(imgTexture, imgTextureSampler, sampleCoord, 0.0);';

  const lines = [
    `    let sampleCoord: ${samplingCtx.sampleCoordType} = input.tcoordVS;`,
    '    var computedColor: vec4<f32>;',
    `    if (!(${samplingCtx.coordBounds})) {`,
    '      computedColor = mapperUBO.BackgroundColor;',
    '    } else {',
    rawSampleLine,
  ];

  if (useSlab) {
    let negSlabSample =
      'textureSampleLevel(imgTexture, imgTextureSampler, coordNeg, 0.0)';
    let posSlabSample =
      'textureSampleLevel(imgTexture, imgTextureSampler, coordPos, 0.0)';
    if (model.multiTexturePerVolumeEnabled) {
      negSlabSample = multiInputSampleExpr('worldNeg');
      posSlabSample = multiInputSampleExpr('worldPos');
    }

    lines.push(
      '      if (mapperUBO.SlabThickness > 0.0) {',
      '        var numSlices: i32 = 1;',
      '        var distTraveled: f32 = mapperUBO.SlabSampleStep;',
      '        var trapezoid: i32 = 0;',
      '        let slabNormal: vec3<f32> = normalize(input.normalWC);',
      '        while (distTraveled < mapperUBO.SlabThickness * 0.5) {',
      '          distTraveled = distTraveled + mapperUBO.SlabSampleStep;',
      '          let fnumSlices: f32 = f32(numSlices);',
      '          var localStep: f32 = fnumSlices * mapperUBO.SlabSampleStep;',
      '          if (distTraveled > mapperUBO.SlabThickness * 0.5) {',
      '            localStep = mapperUBO.SlabThickness * 0.5;',
      '            trapezoid = i32(mapperUBO.SlabTrapezoid);',
      '          }',
      '          let worldNeg: vec3<f32> = input.worldPosVS - localStep * slabNormal;',
      `          let coordNeg: ${samplingCtx.sampleCoordType} = ${samplingCtx.coordFromWorldNeg};`,
      `          if (${samplingCtx.negBounds}) {`,
      `            rawValue = vtkCompositeSlab(rawValue, ${negSlabSample}, i32(mapperUBO.SlabType), trapezoid);`,
      '            numSlices += 1;',
      '          }',
      '          let worldPos: vec3<f32> = input.worldPosVS + localStep * slabNormal;',
      `          let coordPos: ${samplingCtx.sampleCoordType} = ${samplingCtx.coordFromWorldPos};`,
      `          if (${samplingCtx.posBounds}) {`,
      `            rawValue = vtkCompositeSlab(rawValue, ${posSlabSample}, i32(mapperUBO.SlabType), trapezoid);`,
      '            numSlices += 1;',
      '          }',
      '        }',
      '        if (i32(mapperUBO.SlabType) == 2) {',
      '          rawValue = rawValue / f32(numSlices);',
      '        }',
      '      }'
    );
  }

  lines.push(
    '      computedColor = rawValue;',
    '      //VTK::Image::Sample',
    '    }'
  );

  return lines;
}

function buildSingleComponentSampleLines(model, samplingCtx, useLabelOutline) {
  const coordSuffix = getSampleCoordSuffix(model.dimensions);
  if (useLabelOutline) {
    return [
      '      let centerValue: f32 = computedColor.r;',
      '      let segmentIndex: u32 = u32(centerValue * 255.0);',
      '      if (segmentIndex == 0u) {',
      '        computedColor = vec4<f32>(0.0, 0.0, 0.0, 0.0);',
      '      } else {',
      '        let textureCoordinate: f32 = f32(segmentIndex - 1u) / 255.0;',
      '        let labelmapRow: f32 = 0.5 / f32(textureDimensions(labelOutlineThickness, 0).y);',
      '        let thicknessValue: f32 = textureSampleLevel(labelOutlineThickness, labelOutlineThicknessSampler, vec2<f32>(textureCoordinate, labelmapRow), 0.0).r;',
      '        let outlineOpacity: f32 = textureSampleLevel(labelOutlineOpacity, labelOutlineOpacitySampler, vec2<f32>(textureCoordinate, labelmapRow), 0.0).r;',
      '        let actualThickness: i32 = i32(thicknessValue * 255.0);',
      '        let scalar: f32 = centerValue;',
      '        let colorCoord: vec2<f32> = vec2<f32>(scalar * mapperUBO.cScale.r + mapperUBO.cShift.r, 0.5);',
      '        let tColor: vec4<f32> = textureSampleLevel(tfunTexture, tfunTextureSampler, colorCoord, 0.0);',
      '        let opacityCoord: vec2<f32> = vec2<f32>(scalar * mapperUBO.oScale.r + mapperUBO.oShift.r, 0.5);',
      '        let scalarOpacity: f32 = textureSampleLevel(ofunTexture, ofunTextureSampler, opacityCoord, 0.0).r;',
      '        var pixelOnBorder: bool = false;',
      '        for (var i: i32 = -actualThickness; i <= actualThickness; i++) {',
      '          for (var j: i32 = -actualThickness; j <= actualThickness; j++) {',
      '            if (i == 0 && j == 0) { continue; }',
      `            let neighborCoord: ${samplingCtx.sampleCoordType} = sampleCoord + f32(i) * mapperUBO.OutlineTangent1_0.${coordSuffix} * mapperUBO.OutlineTexelSize_0.${coordSuffix} + f32(j) * mapperUBO.OutlineTangent2_0.${coordSuffix} * mapperUBO.OutlineTexelSize_0.${coordSuffix};`,
      `            if (!(${samplingCtx.coordBounds.replace(
        /sampleCoord/g,
        'neighborCoord'
      )})) {`,
      '              pixelOnBorder = true;',
      '              break;',
      '            }',
      '            let neighborValue: f32 = textureSampleLevel(imgTexture, imgTextureSampler, neighborCoord, 0.0).r;',
      '            if (neighborValue != centerValue) {',
      '              pixelOnBorder = true;',
      '              break;',
      '            }',
      '          }',
      '          if (pixelOnBorder) { break; }',
      '        }',
      '        if (pixelOnBorder) {',
      '          computedColor = vec4<f32>(tColor.rgb, outlineOpacity);',
      '        } else {',
      '          computedColor = vec4<f32>(tColor.rgb, scalarOpacity * mapperUBO.Opacity);',
      '        }',
      '      }',
    ];
  }

  return [
    '      let scalar: f32 = computedColor.r;',
    '      let colorCoord: vec2<f32> = vec2<f32>(scalar * mapperUBO.cScale.r + mapperUBO.cShift.r, 0.5);',
    '      let tColor: vec4<f32> = textureSampleLevel(tfunTexture, tfunTextureSampler, colorCoord, 0.0);',
    '      let opacityCoord: vec2<f32> = vec2<f32>(scalar * mapperUBO.oScale.r + mapperUBO.oShift.r, 0.5);',
    '      let scalarOpacity: f32 = textureSampleLevel(ofunTexture, ofunTextureSampler, opacityCoord, 0.0).r;',
    '      computedColor = vec4<f32>(tColor.rgb, scalarOpacity * mapperUBO.Opacity);',
  ];
}

function buildIndependentComponentSampleLines(model, samplingCtx) {
  const labelRows = new Map(
    model.labelOutlineProperties.map(({ arrayIndex }, row) => [arrayIndex, row])
  );
  const orderedInputs = buildOrderedInputIndices(
    model.numberOfComponents,
    labelRows
  );
  const coordSuffix = getSampleCoordSuffix(model.dimensions);
  const lines = ['      var convergentColor: vec4<f32> = vec4<f32>(0.0);'];

  for (let i = 0; i < model.numberOfComponents; i++) {
    const rowExpr = `${
      2 * i
    }.0 / f32(textureDimensions(tfunTexture, 0).y) + 0.5 / f32(textureDimensions(tfunTexture, 0).y)`;
    lines.push(
      `      let scalar${i}: f32 = computedColor.${COMPONENT_NAMES[i]};`,
      `      let colorCoord${i}: vec2<f32> = vec2<f32>(scalar${i} * mapperUBO.cScale[${i}] + mapperUBO.cShift[${i}], ${rowExpr});`,
      `      let tColor${i}: vec4<f32> = textureSampleLevel(tfunTexture, tfunTextureSampler, colorCoord${i}, 0.0);`,
      `      let opacityCoord${i}: vec2<f32> = vec2<f32>(scalar${i} * mapperUBO.oScale[${i}] + mapperUBO.oShift[${i}], ${rowExpr});`,
      `      let alpha${i}: f32 = textureSampleLevel(ofunTexture, ofunTextureSampler, opacityCoord${i}, 0.0).r * mapperUBO.componentWeight[${i}] * mapperUBO.Opacity;`
    );
  }

  for (let orderedIdx = 0; orderedIdx < orderedInputs.length; orderedIdx++) {
    const i = orderedInputs[orderedIdx];
    if (labelRows.has(i)) {
      const texName = getTextureLabelForInput(i);
      const row = labelRows.get(i);
      lines.push(
        `      if (scalar${i} > 0.0) {`,
        `        let sampleCoord${i}: ${
          samplingCtx.sampleCoordType
        } = (mapperUBO.${getWCTCMatrixName(
          i
        )} * vec4<f32>(input.worldPosVS, 1.0)).${coordSuffix};`,
        `        let segmentIndex${i}: u32 = u32(scalar${i} * 255.0);`,
        `        let textureCoordinate${i}: f32 = f32(segmentIndex${i} - 1u) / 255.0;`,
        `        let labelmapRow${i}: f32 = (${row}.0 + 0.5) / f32(textureDimensions(labelOutlineThickness, 0).y);`,
        `        let thickness${i}: i32 = i32(textureSampleLevel(labelOutlineThickness, labelOutlineThicknessSampler, vec2<f32>(textureCoordinate${i}, labelmapRow${i}), 0.0).r * 255.0);`,
        `        let outlineOpacity${i}: f32 = textureSampleLevel(labelOutlineOpacity, labelOutlineOpacitySampler, vec2<f32>(textureCoordinate${i}, labelmapRow${i}), 0.0).r;`,
        `        var pixelOnBorder${i}: bool = false;`,
        `        for (var ii${i}: i32 = -thickness${i}; ii${i} <= thickness${i}; ii${i}++) {`,
        `          for (var jj${i}: i32 = -thickness${i}; jj${i} <= thickness${i}; jj${i}++) {`,
        `            if (ii${i} == 0 && jj${i} == 0) { continue; }`,
        `            let neighborCoord${i}: ${
          samplingCtx.sampleCoordType
        } = sampleCoord${i} + f32(ii${i}) * mapperUBO.${getOutlineTangent1Name(
          i
        )}.${coordSuffix} * mapperUBO.${getOutlineTexelSizeName(
          i
        )}.${coordSuffix} + f32(jj${i}) * mapperUBO.${getOutlineTangent2Name(
          i
        )}.${coordSuffix} * mapperUBO.${getOutlineTexelSizeName(
          i
        )}.${coordSuffix};`,
        `            if (!(${samplingCtx.coordBounds.replace(
          /sampleCoord/g,
          `neighborCoord${i}`
        )})) { pixelOnBorder${i} = true; break; }`,
        `            let neighborValue${i}: f32 = textureSampleLevel(${texName}, ${texName}Sampler, neighborCoord${i}, 0.0).r;`,
        `            if (neighborValue${i} != scalar${i}) { pixelOnBorder${i} = true; break; }`,
        '          }',
        `          if (pixelOnBorder${i}) { break; }`,
        '        }',
        `        let finalAlpha${i}: f32 = select(alpha${i}, outlineOpacity${i}, pixelOnBorder${i});`,
        `        convergentColor = vec4<f32>(mix(convergentColor.rgb, tColor${i}.rgb, finalAlpha${i}), max(convergentColor.a, finalAlpha${i}));`,
        '      }'
      );
    } else {
      lines.push(
        `      convergentColor = vec4<f32>(mix(convergentColor.rgb, tColor${i}.rgb, alpha${i}), max(convergentColor.a, alpha${i}));`
      );
    }
  }

  lines.push('      computedColor = convergentColor;');
  return lines;
}

function buildDependentComponentSampleLines(textureChannelMode) {
  switch (textureChannelMode) {
    case TextureChannelMode.DEPENDENT_LA:
      return [
        '      let rawColor: vec4<f32> = computedColor;',
        '      let intensity: f32 = rawColor.r * mapperUBO.cScale.r + mapperUBO.cShift.r;',
        '      let tColor: vec4<f32> =',
        '        textureSampleLevel(tfunTexture, tfunTextureSampler, vec2<f32>(intensity, 0.5), 0.0);',
        '      computedColor = vec4<f32>(',
        '        tColor.rgb,',
        '        rawColor.g * mapperUBO.oScale.r + mapperUBO.oShift.r);',
      ];
    case TextureChannelMode.DEPENDENT_RGB:
      return [
        '      let rawColor: vec4<f32> =',
        '        computedColor * vec4<f32>(mapperUBO.cScale.x) + vec4<f32>(mapperUBO.cShift.x);',
        '      computedColor = vec4<f32>(',
        '        textureSampleLevel(tfunTexture, tfunTextureSampler, vec2<f32>(rawColor.r, 0.5), 0.0).r,',
        '        textureSampleLevel(tfunTexture, tfunTextureSampler, vec2<f32>(rawColor.g, 0.5), 0.0).r,',
        '        textureSampleLevel(tfunTexture, tfunTextureSampler, vec2<f32>(rawColor.b, 0.5), 0.0).r,',
        '        mapperUBO.Opacity);',
      ];
    case TextureChannelMode.DEPENDENT_RGBA:
      return [
        '      let rawColor: vec4<f32> =',
        '        computedColor * vec4<f32>(mapperUBO.cScale.x) + vec4<f32>(mapperUBO.cShift.x);',
        '      computedColor = vec4<f32>(',
        '        textureSampleLevel(tfunTexture, tfunTextureSampler, vec2<f32>(rawColor.r, 0.5), 0.0).r,',
        '        textureSampleLevel(tfunTexture, tfunTextureSampler, vec2<f32>(rawColor.g, 0.5), 0.0).r,',
        '        textureSampleLevel(tfunTexture, tfunTextureSampler, vec2<f32>(rawColor.b, 0.5), 0.0).r,',
        '        rawColor.a);',
      ];
    default:
      return [
        '      let scalar: f32 = computedColor.r;',
        '      let colorCoord: vec2<f32> = vec2<f32>(scalar * mapperUBO.cScale.r + mapperUBO.cShift.r, 0.5);',
        '      computedColor = textureSampleLevel(tfunTexture, tfunTextureSampler, colorCoord, 0.0);',
      ];
  }
}

function updateResliceMatrixUBO(model) {
  const image = model.currentInput;
  mat4.copy(tmpMat4, image.getIndexToWorld());
  mat4.translate(tmpMat4, tmpMat4, [-0.5, -0.5, -0.5]);
  mat4.scale(tmpMat4, tmpMat4, image.getDimensions());
  mat4.invert(tmpMat4, tmpMat4);
  model.UBO.setArray('SCTCMatrix', tmpMat4);

  for (let i = 1; i < MAX_TEXTURE_INPUTS; i++) {
    const imageData = model.currentValidInputs[i]?.imageData;
    if (imageData) {
      mat4.copy(tmpMat4, imageData.getIndexToWorld());
      mat4.translate(tmpMat4, tmpMat4, [-0.5, -0.5, -0.5]);
      mat4.scale(tmpMat4, tmpMat4, imageData.getDimensions());
      mat4.invert(tmpMat4, tmpMat4);
      model.UBO.setArray(getWCTCMatrixName(i), tmpMat4);
    } else {
      model.UBO.setArray(getWCTCMatrixName(i), mat4.identity(tmpMat4));
    }
  }
}

function updateOutlineBasisUBO(model, slicePlane) {
  tmpPlaneNormal[0] = 0;
  tmpPlaneNormal[1] = 0;
  tmpPlaneNormal[2] = 1;
  if (slicePlane) {
    const slicePlaneNormal = slicePlane.getNormal();
    tmpPlaneNormal[0] = slicePlaneNormal[0];
    tmpPlaneNormal[1] = slicePlaneNormal[1];
    tmpPlaneNormal[2] = slicePlaneNormal[2];
  }
  vtkMath.normalize(tmpPlaneNormal);
  model.UBO.setArray(
    'PlaneNormalWC',
    setTmpVec4(tmpVec4, tmpPlaneNormal[0], tmpPlaneNormal[1], tmpPlaneNormal[2])
  );

  tmpOutlineTangent1[0] = 0;
  tmpOutlineTangent1[1] = 0;
  tmpOutlineTangent1[2] = 0;
  tmpOutlineTangent2[0] = 0;
  tmpOutlineTangent2[1] = 0;
  tmpOutlineTangent2[2] = 0;

  if (slicePlane) {
    vtkMath.perpendiculars(
      tmpPlaneNormal,
      tmpOutlineTangent1,
      tmpOutlineTangent2,
      0
    );
    // Validate tangents are non-zero
    const t1Len = vtkMath.norm(tmpOutlineTangent1);
    const t2Len = vtkMath.norm(tmpOutlineTangent2);
    if (t1Len < 1e-6 || t2Len < 1e-6) {
      vtkWarningMacro('Invalid tangent vectors, using defaults');
      tmpOutlineTangent1[0] = 1;
      tmpOutlineTangent1[1] = 0;
      tmpOutlineTangent1[2] = 0;
      tmpOutlineTangent2[0] = 0;
      tmpOutlineTangent2[1] = 1;
      tmpOutlineTangent2[2] = 0;
    }
  } else {
    tmpOutlineTangent1[0] = 1;
    tmpOutlineTangent2[1] = 1;
  }

  for (let i = 0; i < MAX_TEXTURE_INPUTS; i++) {
    const imageData = model.currentValidInputs[i]?.imageData;
    if (imageData) {
      mat3.set(tmpMat3, ...imageData.getDirection());
      mat3.invert(tmpMat3, tmpMat3);

      vec3.transformMat3(tmpOutlineVec3a, tmpOutlineTangent1, tmpMat3);
      vec3.transformMat3(tmpOutlineVec3b, tmpOutlineTangent2, tmpMat3);

      const inputDims = imageData.getDimensions();
      const inputSpacing = imageData.getSpacing();
      const minSpacing = Math.min(
        Math.abs(inputSpacing[0]),
        Math.abs(inputSpacing[1]),
        Math.abs(inputSpacing[2])
      );
      tmpOutlineTexelSize[0] =
        minSpacing / (inputDims[0] * Math.abs(inputSpacing[0]));
      tmpOutlineTexelSize[1] =
        minSpacing / (inputDims[1] * Math.abs(inputSpacing[1]));
      tmpOutlineTexelSize[2] =
        minSpacing / (inputDims[2] * Math.abs(inputSpacing[2]));

      model.UBO.setArray(
        getOutlineTangent1Name(i),
        setTmpVec4(
          tmpOutlineVec4,
          tmpOutlineVec3a[0],
          tmpOutlineVec3a[1],
          tmpOutlineVec3a[2]
        )
      );
      model.UBO.setArray(
        getOutlineTangent2Name(i),
        setTmpVec4(
          tmpOutlineVec4,
          tmpOutlineVec3b[0],
          tmpOutlineVec3b[1],
          tmpOutlineVec3b[2]
        )
      );
      model.UBO.setArray(
        getOutlineTexelSizeName(i),
        setTmpVec4(
          tmpOutlineVec4,
          tmpOutlineTexelSize[0],
          tmpOutlineTexelSize[1],
          tmpOutlineTexelSize[2]
        )
      );
    } else {
      model.UBO.setArray(getOutlineTangent1Name(i), ZERO_OUTLINE_VEC4);
      model.UBO.setArray(getOutlineTangent2Name(i), ZERO_OUTLINE_VEC4);
      model.UBO.setArray(getOutlineTexelSizeName(i), ZERO_OUTLINE_VEC4);
    }
  }
}

function updateTransferFunctionUBO(model, actor, ppty, imageState) {
  tmpColorScale.fill(1);
  tmpColorShift.fill(0);
  tmpOpacityScale.fill(1);
  tmpOpacityShift.fill(0);
  tmpComponentWeight.fill(1);

  const { numberOfComponents: numComp, independentComponents: iComps } =
    imageState;

  for (let i = 0; i < numComp; i++) {
    const textureSlot = model.multiTexturePerVolumeEnabled
      ? getTextureSlotForInput(i)
      : TextureSlot.IMAGE;
    const tScale = model.textureViews[textureSlot].getTexture().getScale();
    let inputProperty = ppty;
    if (model.multiTexturePerVolumeEnabled && model.currentValidInputs[i]) {
      inputProperty = getInputProperty(
        actor,
        model.currentValidInputs[i].inputIndex
      );
    }
    let cw = inputProperty.getColorWindow();
    let cl = inputProperty.getColorLevel();
    let target = 0;
    if (!model.multiTexturePerVolumeEnabled && iComps) {
      target = i;
    }
    const cfun = inputProperty.getRGBTransferFunction(target);
    if (cfun && inputProperty.getUseLookupTableScalarRange()) {
      const cRange = cfun.getRange();
      cw = cRange[1] - cRange[0];
      cl = 0.5 * (cRange[1] + cRange[0]);
    }

    tmpColorScale[i] = tScale / cw;
    tmpColorShift[i] = -cl / cw + 0.5;

    let opacityScale = 1.0;
    let opacityShift = 0.0;
    const pwfun = inputProperty.getPiecewiseFunction(target);
    if (pwfun) {
      const pwfRange = pwfun.getRange();
      const length = pwfRange[1] - pwfRange[0];
      const mid = 0.5 * (pwfRange[0] + pwfRange[1]);
      opacityScale = tScale / length;
      opacityShift = -mid / length + 0.5;
    }
    tmpOpacityScale[i] = opacityScale;
    tmpOpacityShift[i] = opacityShift;
    tmpComponentWeight[i] = inputProperty.getComponentWeight(target);
  }

  model.UBO.setArray('cScale', tmpColorScale);
  model.UBO.setArray('cShift', tmpColorShift);
  model.UBO.setArray('oScale', tmpOpacityScale);
  model.UBO.setArray('oShift', tmpOpacityShift);
  model.UBO.setArray('componentWeight', tmpComponentWeight);
  model.UBO.setValue('Opacity', ppty.getOpacity());
}

function vtkWebGPUImageResliceMapper(publicAPI, model) {
  model.classHierarchy.push('vtkWebGPUImageResliceMapper');

  publicAPI.buildPass = (prepass) => {
    if (!prepass) {
      return;
    }
    model.WebGPUImageSlice = publicAPI.getFirstAncestorOfType(
      'vtkWebGPUImageSlice'
    );
    model.WebGPURenderer =
      model.WebGPUImageSlice.getFirstAncestorOfType('vtkWebGPURenderer');
    model.WebGPURenderWindow = model.WebGPURenderer.getParent();
    model.device = model.WebGPURenderWindow.getDevice();
  };

  publicAPI.render = () => {
    model.renderable.update();

    const actor = model.WebGPUImageSlice.getRenderable();
    const { currentValidInputs, labelOutlineProperties } = collectValidInputs(
      actor,
      model.renderable
    );
    model.currentValidInputs = currentValidInputs;

    if (!model.currentValidInputs.length) {
      vtkErrorMacro('No input!');
      return;
    }

    model.labelOutlineProperties = labelOutlineProperties;

    // Determine number of components and multi-texture mode
    const numberOfValidInputs = model.currentValidInputs.length;
    const firstImageData = model.currentValidInputs[0].imageData;
    const firstScalars = firstImageData.getPointData().getScalars();
    model.multiTexturePerVolumeEnabled = numberOfValidInputs > 1;
    model.numberOfComponents = model.multiTexturePerVolumeEnabled
      ? numberOfValidInputs
      : firstScalars.getNumberOfComponents();

    model.currentInput = firstImageData;
    publicAPI.updateResliceGeometry();
    publicAPI.prepareToDraw(model.WebGPURenderer.getRenderEncoder());
    if (!model.numberOfVertices) {
      return;
    }
    model.renderEncoder.registerDrawCallback(model.pipeline, publicAPI.draw);
  };

  publicAPI.computePipelineHash = () => {
    const ext = model.currentInput.getExtent();
    const imageState = publicAPI.getImageState();
    const actor = model.WebGPUImageSlice.getRenderable();
    if (ext[0] === ext[1] || ext[2] === ext[3] || ext[4] === ext[5]) {
      model.dimensions = 2;
      model.pipelineHash = 'reslice2';
    } else {
      model.dimensions = 3;
      model.pipelineHash = 'reslice3';
    }
    model.pipelineHash += imageState.textureChannelMode;
    if (imageState.useLabelOutline) {
      model.pipelineHash += 'outline';
    }
    model.pipelineHash += `ind${imageState.independentComponents ? 1 : 0}`;
    model.pipelineHash += `slab${
      model.renderable.getSlabThickness() > 0.0 ? 1 : 0
    }`;
    model.pipelineHash += `norm${
      model.vertexInput.hasAttribute('vertexNormal') ? 1 : 0
    }`;
    if (model.multiTexturePerVolumeEnabled) {
      model.pipelineHash += `multi${model.numberOfComponents}`;
    }
    model.pipelineHash += `in${model.currentValidInputs.length}`;
    model.pipelineHash += `lbl${getOutlineFlagString(
      actor,
      model.currentValidInputs
    )}`;
    model.pipelineHash += `comp${model.numberOfComponents}`;
    model.pipelineHash += model.renderEncoder.getPipelineHash();
  };

  publicAPI.updateResliceGeometry = () => {
    let resGeomString = '';
    const firstImageData = model.currentInput;
    const imageBounds = firstImageData?.getBounds();
    let orthoSlicing = true;
    let orthoAxis = 2;
    const slicePD = model.renderable.getSlicePolyData();
    let slicePlane = model.renderable.getSlicePlane();

    if (slicePD) {
      resGeomString = `PolyData${slicePD.getMTime()}`;
    } else if (slicePlane) {
      resGeomString = `Plane${slicePlane.getMTime()}`;
      if (firstImageData) {
        resGeomString = `${resGeomString}Image${firstImageData.getMTime()}`;
        mat3.set(tmpMat3, ...firstImageData.getDirection());
        mat3.invert(tmpMat3, tmpMat3);
        copyVec3(tmpOutlineVec3a, slicePlane.getNormal());
        vec3.transformMat3(tmpOutlineVec3a, tmpOutlineVec3a, tmpMat3);
        [orthoSlicing, orthoAxis] = isVectorAxisAligned(tmpOutlineVec3a);
      }
    } else {
      slicePlane = vtkPlane.newInstance();
      slicePlane.setNormal(0, 0, 1);
      let bds = [0, 1, 0, 1, 0, 1];
      if (firstImageData) {
        bds = imageBounds;
      }
      slicePlane.setOrigin(bds[0], bds[2], 0.5 * (bds[4] + bds[5]));
      model.renderable.setSlicePlane(slicePlane);
      resGeomString = `Plane${slicePlane.getMTime()}Image${
        firstImageData?.getMTime?.() ?? 0
      }`;
    }

    if (model.resliceGeom && model.resliceGeomUpdateString === resGeomString) {
      return;
    }

    if (slicePD) {
      if (!model.resliceGeom) {
        model.resliceGeom = vtkPolyData.newInstance();
      }
      model.resliceGeom.getPoints().setData(slicePD.getPoints().getData(), 3);
      model.resliceGeom.getPolys().setData(slicePD.getPolys().getData(), 1);
      model.resliceGeom
        .getPointData()
        .setNormals(slicePD.getPointData().getNormals());
    } else if (slicePlane && firstImageData) {
      if (!orthoSlicing) {
        model.outlineFilter.setInputData(firstImageData);
        model.cutter.setInputConnection(model.outlineFilter.getOutputPort());
        model.cutter.setCutFunction(slicePlane);
        model.lineToSurfaceFilter.setInputConnection(
          model.cutter.getOutputPort()
        );
        model.lineToSurfaceFilter.update();
        const planePD = model.lineToSurfaceFilter.getOutputData();
        if (!model.resliceGeom) {
          model.resliceGeom = vtkPolyData.newInstance();
        }
        model.resliceGeom.getPoints().setData(planePD.getPoints().getData(), 3);
        model.resliceGeom.getPolys().setData(planePD.getPolys().getData(), 1);

        copyVec3(tmpPlaneNormal, slicePlane.getNormal());
        vtkMath.normalize(tmpPlaneNormal);
        const npts = model.resliceGeom.getNumberOfPoints();
        const normalsData = new Float32Array(npts * 3);
        fillPackedNormals(normalsData, tmpPlaneNormal, npts);
        const normals = vtkDataArray.newInstance({
          numberOfComponents: 3,
          values: normalsData,
          name: 'Normals',
        });
        model.resliceGeom.getPointData().setNormals(normals);
      } else {
        const ptsArray = new Float32Array(12);
        const indexSpacePlaneOrigin = firstImageData.worldToIndex(
          slicePlane.getOrigin(),
          [0, 0, 0]
        );
        const otherAxes = [(orthoAxis + 1) % 3, (orthoAxis + 2) % 3].sort();
        const ext = firstImageData.getSpatialExtent();
        let ptIdx = 0;
        for (let i = 0; i < 2; ++i) {
          for (let j = 0; j < 2; ++j) {
            ptsArray[ptIdx + orthoAxis] = indexSpacePlaneOrigin[orthoAxis];
            ptsArray[ptIdx + otherAxes[0]] = ext[2 * otherAxes[0] + j];
            ptsArray[ptIdx + otherAxes[1]] = ext[2 * otherAxes[1] + i];
            ptIdx += 3;
          }
        }
        model.transform.setMatrix(firstImageData.getIndexToWorld());
        model.transform.transformPoints(ptsArray, ptsArray);

        const cellArray = new Uint16Array([3, 0, 1, 3, 3, 0, 3, 2]);
        copyVec3(tmpPlaneNormal, slicePlane.getNormal());
        vtkMath.normalize(tmpPlaneNormal);
        const normalsData = new Float32Array(12);
        fillPackedNormals(normalsData, tmpPlaneNormal, 4);

        if (!model.resliceGeom) {
          model.resliceGeom = vtkPolyData.newInstance();
        }
        model.resliceGeom.getPoints().setData(ptsArray, 3);
        model.resliceGeom.getPolys().setData(cellArray, 1);
        model.resliceGeom.getPointData().setNormals(
          vtkDataArray.newInstance({
            numberOfComponents: 3,
            values: normalsData,
            name: 'Normals',
          })
        );
      }
    } else {
      vtkErrorMacro('Unable to build reslice geometry.');
      return;
    }

    model.resliceGeomUpdateString = resGeomString;
    model.resliceGeom.modified();
  };

  publicAPI.updateGeometryBuffers = () => {
    const poly = model.resliceGeom;
    const points = poly?.getPoints();
    const polys = poly?.getPolys();
    if (!points || !polys || !polys.getNumberOfValues()) {
      clearGeometryBuffers(publicAPI, model);
      return;
    }

    const device = model.device;
    const indexBuffer = device.getBufferManager().getBuffer({
      hash: `ResliceIdx${polys.getMTime()}${points.getNumberOfPoints()}`,
      usage: BufferUsage.Index,
      cells: polys,
      numberOfPoints: points.getNumberOfPoints(),
      primitiveType: PrimitiveTypes.Triangles,
      representation: Representation.SURFACE,
    });
    if (
      !indexBuffer ||
      !indexBuffer.getFlatSize() ||
      !indexBuffer.getIndexCount()
    ) {
      clearGeometryBuffers(publicAPI, model);
      return;
    }
    model.vertexInput.setIndexBuffer(indexBuffer);
    model.vertexInput.addBuffer(
      device.getBufferManager().getBuffer({
        hash: `ReslicePts${points.getMTime()}I${indexBuffer.getMTime()}float32x4`,
        usage: BufferUsage.PointArray,
        format: 'float32x4',
        dataArray: points,
        indexBuffer,
        shift: 0,
        packExtra: true,
      }),
      ['vertexBC']
    );

    const useSlab = model.renderable.getSlabThickness() > 0.0;
    const normals = useSlab ? poly.getPointData().getNormals() : null;
    if (useSlab && normals) {
      model.vertexInput.addBuffer(
        device.getBufferManager().getBuffer({
          hash: `ResliceNorm${normals.getMTime()}I${indexBuffer.getMTime()}float32x3`,
          usage: BufferUsage.PointArray,
          format: 'float32x3',
          dataArray: normals,
          indexBuffer,
        }),
        ['vertexNormal']
      );
    } else {
      model.vertexInput.removeBufferIfPresent('vertexNormal');
    }

    publicAPI.setTopology('triangle-list');
    publicAPI.setNumberOfVertices(indexBuffer.getIndexCount());
  };

  publicAPI.updateUBO = () => {
    const actor = model.WebGPUImageSlice.getRenderable();
    const ppty = getInputProperty(
      actor,
      model.currentValidInputs[0].inputIndex
    );
    const mapper = actor.getMapper();
    const slicePlane = mapper.getSlicePlane();

    const center = model.WebGPURenderer.getStabilizedCenterByReference();
    const imageState = publicAPI.getImageState();

    updateResliceMatrixUBO(model);
    model.UBO.setArray(
      'StabilizedCenter',
      setTmpVec4(tmpVec4, center[0], center[1], center[2])
    );

    model.UBO.setArray(
      'BackgroundColor',
      model.renderable.getBackgroundColorByReference()
    );

    const spacing = model.currentInput.getSpacing();
    const sampleStep = 0.5 * Math.min(spacing[0], spacing[1], spacing[2]);
    model.UBO.setValue('SlabThickness', mapper.getSlabThickness());
    model.UBO.setValue('SlabType', mapper.getSlabType());
    model.UBO.setValue('SlabTrapezoid', mapper.getSlabTrapezoidIntegration());
    model.UBO.setValue('SlabSampleStep', sampleStep);

    updateOutlineBasisUBO(model, slicePlane);
    updateTransferFunctionUBO(model, actor, ppty, imageState);
    model.UBO.setValue('PropID', model.WebGPUImageSlice.getPropID());
    const cp = publicAPI.getCoincidentParameters();
    model.UBO.setValue('CoincidentFactor', cp.factor);
    model.UBO.setValue('CoincidentOffset', cp.offset);
    model.UBO.sendIfNeeded(model.device);
  };

  publicAPI.updateBuffers = () => {
    publicAPI.updateGeometryBuffers();
    if (!model.currentInput || !model.numberOfVertices) {
      return;
    }

    const actor = model.WebGPUImageSlice.getRenderable();
    const textureCount = model.currentValidInputs.length;

    if (model.multiTexturePerVolumeEnabled) {
      for (let i = 0; i < textureCount; i++) {
        const { imageData, inputIndex } = model.currentValidInputs[i];
        updateInputTextureView(
          publicAPI,
          model,
          actor,
          imageData,
          inputIndex,
          i
        );
      }
    } else {
      const { imageData, inputIndex } = model.currentValidInputs[0];
      updateInputTextureView(publicAPI, model, actor, imageData, inputIndex, 0);
    }

    for (let i = textureCount; i < model.scalarTextures.length; i++) {
      model.scalarTextures[i] = null;
    }

    model.imageState = publicAPI.computeImageState();
    publicAPI.updateLUTImage();
    publicAPI.updateOpacityLUTImage();
    if (model.imageState.useLabelOutline) {
      publicAPI.updateLabelOutlineThicknessTexture();
      publicAPI.updateLabelOutlineOpacityTexture();
    } else {
      model._labelOutlineThicknessHash = null;
      model._labelOutlineOpacityHash = null;
    }

    const maxSlot = model.imageState.useLabelOutline
      ? getLabelOutlineOpacitySlot(model)
      : getOpacityTextureSlot(model);
    model.textureViews.length = Math.min(
      model.textureViews.length,
      maxSlot + 1
    );

    publicAPI.updateUBO();
  };

  publicAPI.replaceShaderPosition = (hash, pipeline, vertexInput) => {
    const vDesc = pipeline.getShaderDescription('vertex');
    vDesc.addBuiltinOutput('vec4<f32>', '@builtin(position) Position');
    vDesc.addOutput('vec4<f32>', 'vertexSC');
    const useSlab = model.renderable.getSlabThickness() > 0.0;
    let code = vDesc.getCode();
    const lines = [
      'var vertexWC: vec4<f32> = vec4<f32>(vertexBC.xyz, 1.0);',
      'var vertexSC: vec4<f32> = vertexWC - mapperUBO.StabilizedCenter;',
      'vertexSC.w = 1.0;',
    ];
    if (model.dimensions === 2) {
      lines.push('output.tcoordVS = (mapperUBO.SCTCMatrix * vertexWC).xy;');
    } else {
      lines.push('output.tcoordVS = (mapperUBO.SCTCMatrix * vertexWC).xyz;');
    }
    lines.push('output.worldPosVS = vertexWC.xyz;');
    if (useSlab) {
      lines.push(
        vertexInput.hasAttribute('vertexNormal')
          ? 'output.normalWC = normalize(vertexNormal);'
          : 'output.normalWC = mapperUBO.PlaneNormalWC.xyz;'
      );
    }
    lines.push(
      'output.vertexSC = vertexSC;',
      'var pos: vec4<f32> = rendererUBO.SCPCMatrix * vertexSC;',
      'pos.z = clamp(pos.z - 0.000016 * mapperUBO.CoincidentOffset * pos.w, 0.0, pos.w);',
      'output.Position = pos;'
    );
    code = vtkWebGPUShaderCache.substitute(
      code,
      '//VTK::Position::Impl',
      lines
    ).result;
    vDesc.setCode(code);
  };
  publicAPI
    .getShaderReplacements()
    .set('replaceShaderPosition', publicAPI.replaceShaderPosition);

  publicAPI.replaceShaderTCoord = (hash, pipeline, vertexInput) => {
    const vDesc = pipeline.getShaderDescription('vertex');
    if (model.dimensions === 2) {
      vDesc.addOutput('vec2<f32>', 'tcoordVS');
    } else {
      vDesc.addOutput('vec3<f32>', 'tcoordVS');
    }
    vDesc.addOutput('vec3<f32>', 'worldPosVS');
    if (model.renderable.getSlabThickness() > 0.0) {
      vDesc.addOutput('vec3<f32>', 'normalWC');
    }
  };
  publicAPI
    .getShaderReplacements()
    .set('replaceShaderTCoord', publicAPI.replaceShaderTCoord);

  publicAPI.replaceShaderImage = (hash, pipeline, vertexInput) => {
    const fDesc = pipeline.getShaderDescription('fragment');
    let code = fDesc.getCode();
    const imageState = publicAPI.getImageState();
    const numInputs = model.currentValidInputs.length;
    const samplingCtx = buildShaderSamplingContext(model.dimensions);
    const multiInputSampleExpr = (worldPosExpr) =>
      buildMultiInputSampleExpr(model, numInputs, worldPosExpr);

    code = vtkWebGPUShaderCache.substitute(
      code,
      '//VTK::Image::Dec',
      getSlabCompositeDecLines()
    ).result;

    code = vtkWebGPUShaderCache.substitute(
      code,
      '//VTK::Image::Sample',
      buildInitialImageSampleLines(model, samplingCtx, multiInputSampleExpr)
    ).result;

    switch (imageState.textureChannelMode) {
      case TextureChannelMode.SINGLE:
      case TextureChannelMode.INDEPENDENT_1:
        code = vtkWebGPUShaderCache.substitute(
          code,
          '//VTK::Image::Sample',
          buildSingleComponentSampleLines(
            model,
            samplingCtx,
            imageState.useLabelOutline
          )
        ).result;
        break;
      case TextureChannelMode.INDEPENDENT_2:
      case TextureChannelMode.INDEPENDENT_3:
      case TextureChannelMode.INDEPENDENT_4:
        code = vtkWebGPUShaderCache.substitute(
          code,
          '//VTK::Image::Sample',
          buildIndependentComponentSampleLines(model, samplingCtx)
        ).result;
        break;
      default:
        code = vtkWebGPUShaderCache.substitute(
          code,
          '//VTK::Image::Sample',
          buildDependentComponentSampleLines(imageState.textureChannelMode)
        ).result;
        break;
    }

    fDesc.setCode(code);
  };
  publicAPI
    .getShaderReplacements()
    .set('replaceShaderImage', publicAPI.replaceShaderImage);

  publicAPI.updateLabelOutlineThicknessTexture = () => {
    if (!model.labelOutlineProperties.length) {
      return;
    }
    const { dataArrays, hash, width, height } =
      getLabelOutlineTextureParameters(
        model.labelOutlineProperties,
        (property) => property.getLabelOutlineThicknessByReference()
      );

    if (hash === model._labelOutlineThicknessHash) {
      return;
    }
    model._labelOutlineThicknessHash = hash;

    const table = new Uint8Array(width * height);
    fillLabelOutlineTextureTable(table, dataArrays, width);

    const tex = model.device.getTextureManager().getTexture({
      hash: `irm-outline-thickness-${hash}`,
      nativeArray: table,
      width,
      height,
      depth: 1,
      format: 'r8unorm',
      usage: getTextureBindingUsage(),
    });
    const tview = tex.createView('labelOutlineThickness');
    publicAPI.ensureTextureSampler(tview, {
      minFilter: 'nearest',
      magFilter: 'nearest',
    });
    model.textureViews[getLabelOutlineThicknessSlot(model)] = tview;
  };

  publicAPI.updateLabelOutlineOpacityTexture = () => {
    if (!model.labelOutlineProperties.length) {
      return;
    }
    const { dataArrays, hash, width, height } =
      getLabelOutlineTextureParameters(
        model.labelOutlineProperties,
        (property) => {
          const dataArray = property.getLabelOutlineOpacity();
          return typeof dataArray === 'number' ? [dataArray] : dataArray;
        }
      );

    if (hash === model._labelOutlineOpacityHash) {
      return;
    }
    model._labelOutlineOpacityHash = hash;

    const table = new Float32Array(width * height);
    fillLabelOutlineTextureTable(table, dataArrays, width);

    const tex = model.device.getTextureManager().getTexture({
      hash: `irm-outline-opacity-${hash}`,
      nativeArray: table,
      width,
      height,
      depth: 1,
      format: 'r16float',
      usage: getTextureBindingUsage(),
    });
    const tview = tex.createView('labelOutlineOpacity');
    publicAPI.ensureTextureSampler(tview, {
      minFilter: 'nearest',
      magFilter: 'nearest',
    });
    model.textureViews[getLabelOutlineOpacitySlot(model)] = tview;
  };
}

const DEFAULT_VALUES = {
  currentValidInputs: null,
  resliceGeom: null,
  resliceGeomUpdateString: null,
  multiTexturePerVolumeEnabled: false,
  numberOfComponents: 0,
  labelOutlineProperties: [],
  _labelOutlineThicknessHash: null,
  _labelOutlineOpacityHash: null,
  scalarTextures: [],
};

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkWebGPUImageMapper.extend(publicAPI, model, initialValues);
  macro.get(publicAPI, model, ['scalarTextures']);

  const superComputeImageState = publicAPI.computeImageState;
  publicAPI.computeImageState = () => {
    if (
      model.multiTexturePerVolumeEnabled &&
      model.currentValidInputs?.length
    ) {
      const actor = model.WebGPUImageSlice.getRenderable();
      const firstProperty = getInputProperty(
        actor,
        model.currentValidInputs[0].inputIndex
      );
      const independentComponents = true;
      return {
        actorProperty: firstProperty,
        numberOfComponents: model.numberOfComponents,
        independentComponents,
        numberOfIComponents: model.numberOfComponents,
        useLabelOutline: model.labelOutlineProperties.length > 0,
        textureChannelMode: getTextureChannelMode(
          independentComponents,
          model.numberOfComponents
        ),
      };
    }
    const imageState = superComputeImageState();
    imageState.useLabelOutline = model.labelOutlineProperties.length > 0;
    return imageState;
  };

  const superUpdateLUTImage = publicAPI.updateLUTImage;
  publicAPI.updateLUTImage = () => {
    if (!model.multiTexturePerVolumeEnabled) {
      superUpdateLUTImage();
      return;
    }
    const imageState = publicAPI.getImageState();
    const actor = model.WebGPUImageSlice.getRenderable();
    const numIComps = imageState.numberOfIComponents;
    const colorHash = getTransferFunctionHash(
      actor,
      model.currentValidInputs,
      true,
      numIComps,
      'color'
    );
    if (model.colorTextureString === colorHash) {
      return;
    }

    model.numRows = numIComps;
    const colorSize = model.numRows * 2 * model.rowLength * 4;
    if (!model.colorLUTArray || model.colorLUTArray.length !== colorSize) {
      model.colorLUTArray = new Uint8ClampedArray(colorSize);
    }
    const colorArray = model.colorLUTArray;
    const tmpTable = model.colorTmpTable;
    const rowStride = model.rowLength * 4;
    colorArray.fill(0);

    for (let c = 0; c < numIComps; c++) {
      const property = getInputProperty(
        actor,
        model.currentValidInputs[c].inputIndex
      );
      const cfun = property?.getRGBTransferFunction(0);
      if (cfun) {
        const cRange = cfun.getRange();
        cfun.getTable(cRange[0], cRange[1], model.rowLength, tmpTable, 1);
        const componentOffset = c * rowStride * 2;
        for (let i = 0; i < model.rowLength; i++) {
          const idx = componentOffset + i * 4;
          const nextRowIdx = idx + rowStride;
          colorArray[idx] = 255.0 * tmpTable[i * 3];
          colorArray[idx + 1] = 255.0 * tmpTable[i * 3 + 1];
          colorArray[idx + 2] = 255.0 * tmpTable[i * 3 + 2];
          colorArray[idx + 3] = 255.0;
          colorArray[nextRowIdx] = colorArray[idx];
          colorArray[nextRowIdx + 1] = colorArray[idx + 1];
          colorArray[nextRowIdx + 2] = colorArray[idx + 2];
          colorArray[nextRowIdx + 3] = colorArray[idx + 3];
        }
      }
    }

    const newTex = model.device.getTextureManager().getTexture({
      hash: `irm-color-${colorHash}`,
      nativeArray: colorArray,
      width: model.rowLength,
      height: model.numRows * 2,
      depth: 1,
      format: 'rgba8unorm',
    });
    const tview = newTex.createView('tfunTexture');
    publicAPI.ensureTextureSampler(tview, {
      minFilter: 'linear',
      magFilter: 'linear',
    });
    model.textureViews[getColorTextureSlot(model)] = tview;
    model.colorTextureString = colorHash;
  };

  const superUpdateOpacityLUTImage = publicAPI.updateOpacityLUTImage;
  publicAPI.updateOpacityLUTImage = () => {
    if (!model.multiTexturePerVolumeEnabled) {
      superUpdateOpacityLUTImage();
      return;
    }
    const imageState = publicAPI.getImageState();
    const actor = model.WebGPUImageSlice.getRenderable();
    const numIComps = imageState.numberOfIComponents;
    const opacityHash = getTransferFunctionHash(
      actor,
      model.currentValidInputs,
      true,
      numIComps,
      'opacity'
    );
    if (model.opacityTextureString === opacityHash) {
      return;
    }

    model.numRows = numIComps;
    const opacitySize = model.numRows * 2 * model.rowLength;
    if (
      !model.opacityLUTArray ||
      model.opacityLUTArray.length !== opacitySize
    ) {
      model.opacityLUTArray = new Float32Array(opacitySize);
    }
    const opacityArray = model.opacityLUTArray;
    const tmpTable = model.opacityTmpTable;
    opacityArray.fill(1.0);

    for (let c = 0; c < numIComps; c++) {
      const property = getInputProperty(
        actor,
        model.currentValidInputs[c].inputIndex
      );
      const pwfun = property?.getPiecewiseFunction(0);
      if (pwfun) {
        const pwfRange = pwfun.getRange();
        pwfun.getTable(pwfRange[0], pwfRange[1], model.rowLength, tmpTable, 1);
        const offset = c * model.rowLength * 2;
        const nextRowOffset = offset + model.rowLength;
        for (let i = 0; i < model.rowLength; i++) {
          opacityArray[offset + i] = tmpTable[i];
          opacityArray[nextRowOffset + i] = tmpTable[i];
        }
      }
    }

    const newTex = model.device.getTextureManager().getTexture({
      hash: `irm-opacity-${opacityHash}`,
      nativeArray: opacityArray,
      width: model.rowLength,
      height: model.numRows * 2,
      depth: 1,
      format: 'r16float',
    });
    const tview = newTex.createView('ofunTexture');
    publicAPI.ensureTextureSampler(tview, {
      minFilter: 'linear',
      magFilter: 'linear',
    });
    model.textureViews[getOpacityTextureSlot(model)] = tview;
    model.opacityTextureString = opacityHash;
  };

  publicAPI.setScalarTextures = (scalarTextures = []) => {
    model.scalarTextures = [...scalarTextures];
    publicAPI.modified();
  };

  publicAPI.releaseGraphicsResources = () => {
    model.vertexInput.releaseGraphicsResources();
    model.textureViews.length = 0;
    model.imageState = null;
    model.pipelineHash = null;
    model._labelOutlineThicknessHash = null;
    model._labelOutlineOpacityHash = null;
    model.colorTextureString = null;
    model.opacityTextureString = null;
  };

  model.UBO.addEntry('StabilizedCenter', 'vec4<f32>');
  model.UBO.addEntry('BackgroundColor', 'vec4<f32>');
  model.UBO.addEntry('PlaneNormalWC', 'vec4<f32>');
  for (let i = 0; i < 4; i++) {
    if (i > 0) {
      model.UBO.addEntry(getWCTCMatrixName(i), 'mat4x4<f32>');
    }
    model.UBO.addEntry(getOutlineTangent1Name(i), 'vec4<f32>');
    model.UBO.addEntry(getOutlineTangent2Name(i), 'vec4<f32>');
    model.UBO.addEntry(getOutlineTexelSizeName(i), 'vec4<f32>');
  }
  model.UBO.addEntry('SlabThickness', 'f32');
  model.UBO.addEntry('SlabType', 'f32');
  model.UBO.addEntry('SlabTrapezoid', 'f32');
  model.UBO.addEntry('SlabSampleStep', 'f32');
  model.UBO.addEntry('PropID', 'u32');

  model.outlineFilter = vtkImageDataOutlineFilter.newInstance();
  model.cutter = vtkCutter.newInstance();
  model.lineToSurfaceFilter = vtkClosedPolyLineToSurfaceFilter.newInstance();
  model.transform = vtkTransform.newInstance();

  vtkWebGPUImageResliceMapper(publicAPI, model);

  publicAPI.delete = macro.chain(() => {
    publicAPI.releaseGraphicsResources();
    model.outlineFilter?.delete?.();
    model.cutter?.delete?.();
    model.lineToSurfaceFilter?.delete?.();
    model.transform?.delete?.();
  }, publicAPI.delete);
}

export const newInstance = macro.newInstance(
  extend,
  'vtkWebGPUImageResliceMapper'
);

export default { newInstance, extend };

registerOverride('vtkImageResliceMapper', newInstance);
