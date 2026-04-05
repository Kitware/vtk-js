import macro from 'vtk.js/Sources/macros';
import { mat4 } from 'gl-matrix';
import vtkWebGPUBufferManager from 'vtk.js/Sources/Rendering/WebGPU/BufferManager';
import vtkWebGPUSimpleMapper from 'vtk.js/Sources/Rendering/WebGPU/SimpleMapper';
import vtkWebGPUShaderCache from 'vtk.js/Sources/Rendering/WebGPU/ShaderCache';
import vtkWebGPUUniformBuffer from 'vtk.js/Sources/Rendering/WebGPU/UniformBuffer';
import vtkWebGPUSampler from 'vtk.js/Sources/Rendering/WebGPU/Sampler';
import { InterpolationType } from 'vtk.js/Sources/Rendering/Core/ImageProperty/Constants';
import { ProjectionMode } from 'vtk.js/Sources/Rendering/Core/ImageCPRMapper/Constants';
import { Resolve } from 'vtk.js/Sources/Rendering/Core/Mapper/CoincidentTopologyHelper';
import {
  addClipPlaneEntries,
  getClipPlaneShaderChecks,
  MAX_CLIPPING_PLANES,
} from 'vtk.js/Sources/Rendering/WebGPU/Helpers/ClippingPlanes';
import { computeFnToString } from 'vtk.js/Sources/Rendering/WebGPU/Helpers/ImageSampling';
import { registerOverride } from 'vtk.js/Sources/Rendering/WebGPU/ViewNodeFactory';

const { BufferUsage } = vtkWebGPUBufferManager;

const cprVertTemplate = `
//VTK::Renderer::Dec

//VTK::Mapper::Dec

//VTK::IOStructs::Dec

@vertex
fn main(
//VTK::IOStructs::Input
)
//VTK::IOStructs::Output
{
  var output : vertexOutput;

  //VTK::ImageCPR::Impl

  return output;
}
`;

const cprFragTemplate = `
//VTK::Renderer::Dec

//VTK::Mapper::Dec

//VTK::Clip::Dec

//VTK::Coincident::Dec

//VTK::RenderEncoder::Dec

//VTK::IOStructs::Dec

fn applyQuaternionToVec(q: vec4<f32>, v: vec3<f32>) -> vec3<f32>
{
  let uv = cross(q.xyz, v);
  let uuv = cross(q.xyz, uv);
  return v + (2.0 * q.w) * uv + 2.0 * uuv;
}

fn quaternionLerpOrSlerp(q0In: vec4<f32>, q1In: vec4<f32>, t: f32) -> vec4<f32>
{
  var q0 = normalize(q0In);
  var q1 = normalize(q1In);
  var cosAngle = dot(q0, q1);
  if (cosAngle < 0.0)
  {
    q1 = -q1;
    cosAngle = -cosAngle;
  }
  if (cosAngle > 0.999)
  {
    return normalize((1.0 - t) * q0 + t * q1);
  }
  let omega = acos(cosAngle);
  let sinOmega = max(sin(omega), 0.000001);
  let w0 = sin((1.0 - t) * omega) / sinOmega;
  let w1 = sin(t * omega) / sinOmega;
  return normalize(w0 * q0 + w1 * q1);
}

fn getComponent(v: vec4<f32>, idx: u32) -> f32
{
  if (idx == 0u) { return v.x; }
  if (idx == 1u) { return v.y; }
  if (idx == 2u) { return v.z; }
  return v.w;
}

fn sampleColorTF(value: f32) -> vec4<f32>
{
  return textureSampleLevel(colorTexture, cprSampler, vec2<f32>(value, 0.5), 0.0);
}

fn sampleScalarColor(value: f32) -> vec3<f32>
{
  return sampleColorTF(value).rgb;
}

fn sampleColorRow(value: f32, row: f32) -> vec4<f32>
{
  return textureSampleLevel(colorTexture, cprSampler, vec2<f32>(value, row), 0.0);
}

fn sampleOpacityRow(value: f32, row: f32) -> f32
{
  return textureSampleLevel(pwfTexture, cprSampler, vec2<f32>(value, row), 0.0).r;
}

fn getProjectedValue(volumePosTC: vec3<f32>, projectionDirection: vec3<f32>) -> vec4<f32>
{
  let volumeSize = max(mapperUBO.VolumeSizeMC.xyz, vec3<f32>(0.000001));
  let scaledDirection = projectionDirection / volumeSize;
  let projectionStep = mapperUBO.ProjectionParams.z * scaledDirection;
  let projectionStart = volumePosTC + mapperUBO.ProjectionParams.y * scaledDirection;

  var tvalue = vec4<f32>(0.0);
  if (mapperUBO.ProjectionMode == ${ProjectionMode.MIN}u)
  {
    tvalue = vec4<f32>(1.0);
  }

  for (var projectionSampleIdx: u32 = 0u;
    projectionSampleIdx < mapperUBO.ProjectionSamples;
    projectionSampleIdx = projectionSampleIdx + 1u)
  {
    let projectionSamplePosition =
      projectionStart + f32(projectionSampleIdx) * projectionStep;
    let sampledTextureValue =
      textureSampleLevel(volumeTexture, cprSampler, projectionSamplePosition, 0.0);

    if (mapperUBO.ProjectionMode == ${ProjectionMode.MAX}u)
    {
      tvalue = max(tvalue, sampledTextureValue);
    }
    else if (mapperUBO.ProjectionMode == ${ProjectionMode.MIN}u)
    {
      tvalue = min(tvalue, sampledTextureValue);
    }
    else
    {
      tvalue = tvalue + sampledTextureValue;
    }
  }

  if (mapperUBO.ProjectionMode == ${ProjectionMode.AVERAGE}u)
  {
    tvalue = tvalue / max(f32(mapperUBO.ProjectionSamples), 1.0);
  }
  return tvalue;
}

@fragment
fn main(
//VTK::IOStructs::Input
)
//VTK::IOStructs::Output
{
  var output : fragmentOutput;

  var interpolatedOrientation = mapperUBO.UniformOrientation;
  if (mapperUBO.UseUniformOrientation == 0u)
  {
    interpolatedOrientation = quaternionLerpOrSlerp(
      input.centerlineBottomOrientationVS,
      input.centerlineTopOrientationVS,
      input.quadOffsetVS.y
    );
  }
  let samplingDirection = applyQuaternionToVec(
    interpolatedOrientation,
    mapperUBO.TangentDirection.xyz
  );
  let projectionDirection = applyQuaternionToVec(
    interpolatedOrientation,
    mapperUBO.BitangentDirection.xyz
  );

  var horizontalOffset = input.quadOffsetVS.x;
  if (mapperUBO.UseCenterPoint != 0u)
  {
    let baseOffset = dot(
      samplingDirection,
      mapperUBO.GlobalCenterPoint.xyz - input.centerlinePosVS
    );
    horizontalOffset = horizontalOffset + baseOffset;
  }

  let volumePosMC = input.centerlinePosVS + horizontalOffset * samplingDirection;
  //VTK::Clip::Impl
  let volumePosTC =
    (mapperUBO.MCTCMatrix * vec4<f32>(volumePosMC, 1.0)).xyz;

  if (any(volumePosTC < vec3<f32>(0.0)) || any(volumePosTC > vec3<f32>(1.0)))
  {
    var computedColor = mapperUBO.BackgroundColor;
    //VTK::RenderEncoder::Impl
    return output;
  }

  var tvalue = textureSampleLevel(volumeTexture, cprSampler, volumePosTC, 0.0);
  if (mapperUBO.ProjectionSamples > 1u)
  {
    tvalue = getProjectedValue(volumePosTC, projectionDirection);
  }

  var computedColor = vec4<f32>(0.0);
  if (mapperUBO.IndependentComponents != 0u)
  {
    var sumColor = vec3<f32>(0.0);
    var sumWeight = 0.0;
    for (var c: u32 = 0u; c < mapperUBO.NumComponents; c = c + 1u)
    {
      let row = (f32(c) + 0.5) / max(f32(mapperUBO.NumComponents), 1.0);
      let componentValue = getComponent(tvalue, c);
      let lutValue = componentValue * getComponent(mapperUBO.CScale, c) +
        getComponent(mapperUBO.CShift, c);
      let opacityValue = componentValue * getComponent(mapperUBO.PWFScale, c) +
        getComponent(mapperUBO.PWFShift, c);
      let componentMix = getComponent(mapperUBO.ComponentMix, c);
      let color = sampleColorRow(lutValue, row).rgb;
      let weight = componentMix * sampleOpacityRow(opacityValue, row);
      sumColor = sumColor + weight * color;
      sumWeight = sumWeight + weight;
    }

    let finalColor = select(sumColor, sumColor / max(sumWeight, 0.000001), sumWeight > 0.0);
    if (mapperUBO.NumComponents == 1u)
    {
      computedColor = vec4<f32>(finalColor, sumWeight * mapperUBO.Opacity);
    }
    else
    {
      computedColor = vec4<f32>(finalColor, mapperUBO.Opacity);
    }
  }
  else if (mapperUBO.NumComponents == 1u)
  {
    let intensity = tvalue.r;
    let lutValue = intensity * mapperUBO.CScale.x + mapperUBO.CShift.x;
    let opacityValue = intensity * mapperUBO.PWFScale.x + mapperUBO.PWFShift.x;
    computedColor = vec4<f32>(
      sampleScalarColor(lutValue),
      sampleOpacityRow(opacityValue, 0.5) * mapperUBO.Opacity
    );
  }
  else if (mapperUBO.NumComponents == 2u)
  {
    let intensity = tvalue.r * mapperUBO.CScale.x + mapperUBO.CShift.x;
    computedColor = vec4<f32>(
      sampleScalarColor(intensity),
      mapperUBO.PWFScale.x * tvalue.g + mapperUBO.PWFShift.x
    );
  }
  else if (mapperUBO.NumComponents == 3u)
  {
    let tcolor = mapperUBO.CScale * tvalue + mapperUBO.CShift;
    computedColor = vec4<f32>(
      sampleColorTF(tcolor.r).r,
      sampleColorTF(tcolor.g).r,
      sampleColorTF(tcolor.b).r,
      mapperUBO.Opacity
    );
  }
  else
  {
    let tcolor = mapperUBO.CScale * tvalue + mapperUBO.CShift;
    computedColor = vec4<f32>(
      sampleColorTF(tcolor.r).r,
      sampleColorTF(tcolor.g).r,
      sampleColorTF(tcolor.b).r,
      tcolor.a
    );
  }

  //VTK::Select::Impl
  //VTK::Coincident::Impl
  //VTK::RenderEncoder::Impl
  return output;
}
`;

const tmpMat4 = new Float64Array(16);
const tmp2Mat4 = new Float64Array(16);
const DEFAULT_ORIENTATION = [0, 0, 0, 1];
const QUAD_VERTEX_ORDER = [0, 1, 3, 0, 3, 2];

function vtkWebGPUImageCPRMapper(publicAPI, model) {
  model.classHierarchy.push('vtkWebGPUImageCPRMapper');

  publicAPI.getCoincidentParameters = () => {
    if (
      model.renderable.getResolveCoincidentTopology() === Resolve.PolygonOffset
    ) {
      return model.renderable.getCoincidentTopologyPolygonOffsetParameters();
    }
    return null;
  };

  publicAPI.buildPass = (prepass) => {
    if (prepass) {
      model.WebGPUImageSlice = publicAPI.getFirstAncestorOfType(
        'vtkWebGPUImageSlice'
      );
      model.WebGPURenderer =
        model.WebGPUImageSlice.getFirstAncestorOfType('vtkWebGPURenderer');
      model.WebGPURenderWindow = model.WebGPURenderer.getParent();
      model.device = model.WebGPURenderWindow.getDevice();
      publicAPI.setWebGPURenderer(model.WebGPURenderer);
    }
  };

  publicAPI.opaquePass = (prepass) => {
    if (prepass) {
      publicAPI.render();
    }
  };

  publicAPI.translucentPass = (prepass) => {
    if (prepass) {
      publicAPI.render();
    }
  };

  publicAPI.zBufferPass = (prepass) => {
    if (prepass) {
      publicAPI.render();
    }
  };

  publicAPI.opaqueZBufferPass = (prepass) => publicAPI.zBufferPass(prepass);

  publicAPI.render = () => {
    model.renderable.update();
    if (!model.renderable.preRenderCheck()) {
      return;
    }

    model.currentImageDataInput = model.renderable.getInputData(0);
    model.currentCenterlineInput = model.renderable.getOrientedCenterline();

    publicAPI.prepareToDraw(model.WebGPURenderer.getRenderEncoder());
    model.renderEncoder.registerDrawCallback(model.pipeline, publicAPI.draw);
  };

  publicAPI.computePipelineHash = () => {
    const numClipPlanes = Math.min(
      model.renderable.getNumberOfClippingPlanes(),
      MAX_CLIPPING_PLANES
    );
    const coincidentParameters = publicAPI.getCoincidentParameters();
    const useCoincident =
      coincidentParameters?.factor || coincidentParameters?.offset ? 1 : 0;
    model.pipelineHash = `cprcp${numClipPlanes}co${useCoincident}${model.renderEncoder.getPipelineHash()}`;
  };

  publicAPI.updateGeometry = () => {
    const centerline = model.currentCenterlineInput;
    const nPoints = centerline?.getNumberOfPoints?.() ?? 0;
    const nLines = nPoints <= 1 ? 0 : nPoints - 1;

    if (!nLines) {
      publicAPI.setNumberOfVertices(0);
      return;
    }

    const height = model.renderable.getHeight();
    const widthMC = model.renderable.getWidth();
    const distances = centerline.getDistancesToFirstPoint();
    const pointsDataArray = centerline.getPoints();
    const orientationQuats = centerline.getOrientations() ?? [];
    const numVerts = 6 * nLines;

    const positions = new Float32Array(numVerts * 3);
    const centerlinePositions = new Float32Array(numVerts * 3);
    const quadIndices = new Uint32Array(numVerts);
    const topOrientations = new Float32Array(numVerts * 4);
    const bottomOrientations = new Float32Array(numVerts * 4);

    const pa = [0, 0, 0];
    const pb = [0, 0, 0];

    for (let lineIdx = 0; lineIdx < nLines; ++lineIdx) {
      pointsDataArray.getPoint(lineIdx, pa);
      pointsDataArray.getPoint(lineIdx + 1, pb);

      const topY = height - distances[lineIdx];
      const bottomY = height - distances[lineIdx + 1];
      const topQuat = orientationQuats[lineIdx] ?? DEFAULT_ORIENTATION;
      const bottomQuat = orientationQuats[lineIdx + 1] ?? topQuat;

      for (let localIdx = 0; localIdx < 6; ++localIdx) {
        const quadIdx = QUAD_VERTEX_ORDER[localIdx];
        const vertIdx = lineIdx * 6 + localIdx;
        const posOffset = vertIdx * 3;
        const orientationOffset = vertIdx * 4;

        positions[posOffset] = quadIdx === 1 || quadIdx === 3 ? widthMC : 0.0;
        positions[posOffset + 1] = quadIdx > 1 ? bottomY : topY;
        positions[posOffset + 2] = 0.0;

        const centerPoint = quadIdx > 1 ? pb : pa;
        centerlinePositions[posOffset] = centerPoint[0];
        centerlinePositions[posOffset + 1] = centerPoint[1];
        centerlinePositions[posOffset + 2] = centerPoint[2];

        quadIndices[vertIdx] = quadIdx;

        topOrientations[orientationOffset] = topQuat[0];
        topOrientations[orientationOffset + 1] = topQuat[1];
        topOrientations[orientationOffset + 2] = topQuat[2];
        topOrientations[orientationOffset + 3] = topQuat[3];

        bottomOrientations[orientationOffset] = bottomQuat[0];
        bottomOrientations[orientationOffset + 1] = bottomQuat[1];
        bottomOrientations[orientationOffset + 2] = bottomQuat[2];
        bottomOrientations[orientationOffset + 3] = bottomQuat[3];
      }
    }

    const bufferManager = model.device.getBufferManager();
    const mtime = Math.max(
      model.renderable.getMTime(),
      centerline.getMTime(),
      centerline.getPoints().getMTime()
    );

    const vertexHash = `cpr-vertex-${mtime}`;
    const centerlineHash = `cpr-centerline-${mtime}`;
    const quadHash = `cpr-quad-${mtime}`;
    const topHash = `cpr-top-${mtime}`;
    const bottomHash = `cpr-bottom-${mtime}`;

    const requests = [
      [vertexHash, positions, 'float32x3', ['vertexMC']],
      [
        centerlineHash,
        centerlinePositions,
        'float32x3',
        ['centerlinePosition'],
      ],
      [quadHash, quadIndices, 'uint32', ['quadIndex']],
      [topHash, topOrientations, 'float32x4', ['centerlineTopOrientation']],
      [
        bottomHash,
        bottomOrientations,
        'float32x4',
        ['centerlineBottomOrientation'],
      ],
    ];

    requests.forEach(([hash, nativeArray, format, names]) => {
      const buff = bufferManager.getBuffer({
        hash,
        nativeArray,
        usage: BufferUsage.RawVertex,
        format,
      });
      model.vertexInput.addBuffer(buff, names);
    });

    publicAPI.setNumberOfVertices(numVerts);
  };

  publicAPI.updateVolumeTexture = () => {
    const newTex = model.device
      .getTextureManager()
      .getTextureForImageData(model.currentImageDataInput);
    if (
      !model.textureViews[0] ||
      model.textureViews[0].getTexture() !== newTex
    ) {
      model.textureViews[0] = newTex.createView('volumeTexture');
    }
  };

  publicAPI.updateColorTexture = () => {
    const property = model.WebGPUImageSlice.getRenderable().getProperty();
    const image = model.currentImageDataInput;
    const scalars = image?.getPointData()?.getScalars();
    if (!scalars) {
      return;
    }

    const numComp = scalars.getNumberOfComponents();
    const iComps = property.getIndependentComponents();
    const numRows = iComps ? numComp : 1;
    const colorTextureString = computeFnToString(
      property,
      property.getRGBTransferFunction,
      numRows
    );

    if (model.colorTextureString === colorTextureString) {
      return;
    }

    const colorArray = new Uint8ClampedArray(model.rowLength * numRows * 4);
    const tmpTable = new Float32Array(model.rowLength * 3);

    if (property.getRGBTransferFunction()) {
      for (let c = 0; c < numRows; ++c) {
        const cfun = property.getRGBTransferFunction(c);
        const cRange = cfun.getRange();
        cfun.getTable(cRange[0], cRange[1], model.rowLength, tmpTable, 1);
        for (let i = 0; i < model.rowLength; ++i) {
          const idx = c * model.rowLength * 4 + i * 4;
          colorArray[idx] = 255.0 * tmpTable[i * 3];
          colorArray[idx + 1] = 255.0 * tmpTable[i * 3 + 1];
          colorArray[idx + 2] = 255.0 * tmpTable[i * 3 + 2];
          colorArray[idx + 3] = 255.0;
        }
      }
    } else {
      const denom = Math.max(model.rowLength - 1, 1);
      for (let i = 0; i < model.rowLength; ++i) {
        const idx = i * 4;
        const grey = (255.0 * i) / denom;
        colorArray[idx] = grey;
        colorArray[idx + 1] = grey;
        colorArray[idx + 2] = grey;
        colorArray[idx + 3] = 255.0;
      }
    }

    const newTex = model.device.getTextureManager().getTexture({
      nativeArray: colorArray,
      width: model.rowLength,
      height: numRows,
      depth: 1,
      format: 'rgba8unorm',
    });
    model.textureViews[1] = newTex.createView('colorTexture');
    model.colorTextureString = colorTextureString;
  };

  publicAPI.updateOpacityTexture = () => {
    const property = model.WebGPUImageSlice.getRenderable().getProperty();
    const image = model.currentImageDataInput;
    const scalars = image?.getPointData()?.getScalars();
    if (!scalars) {
      return;
    }

    const numComp = scalars.getNumberOfComponents();
    const iComps = property.getIndependentComponents();
    const numRows = iComps ? numComp : 1;
    const pwfTextureString = computeFnToString(
      property,
      property.getPiecewiseFunction,
      numRows
    );

    if (model.pwfTextureString === pwfTextureString) {
      return;
    }

    const opacityArray = new Float32Array(model.rowLength * numRows);
    const tmpTable = new Float32Array(model.rowLength);

    if (property.getPiecewiseFunction()) {
      for (let c = 0; c < numRows; ++c) {
        const pwfun = property.getPiecewiseFunction(c);
        if (pwfun) {
          const pwfRange = pwfun.getRange();
          pwfun.getTable(
            pwfRange[0],
            pwfRange[1],
            model.rowLength,
            tmpTable,
            1
          );
          opacityArray.set(tmpTable, c * model.rowLength);
        } else {
          opacityArray.fill(
            1.0,
            c * model.rowLength,
            (c + 1) * model.rowLength
          );
        }
      }
    } else {
      opacityArray.fill(1.0);
    }

    const newTex = model.device.getTextureManager().getTexture({
      nativeArray: opacityArray,
      width: model.rowLength,
      height: numRows,
      depth: 1,
      format: 'r16float',
    });
    model.textureViews[2] = newTex.createView('pwfTexture');
    model.pwfTextureString = pwfTextureString;
  };

  publicAPI.updateUBO = () => {
    const utime = model.UBO.getSendTime();
    const actor = model.WebGPUImageSlice.getRenderable();
    const property = actor.getProperty();
    const image = model.currentImageDataInput;
    if (
      publicAPI.getMTime() <= utime &&
      model.renderable.getMTime() <= utime &&
      actor.getMTime() <= utime &&
      property.getMTime() <= utime &&
      image.getMTime() <= utime &&
      model.WebGPURenderer.getStabilizedTime() <= utime
    ) {
      return;
    }

    const center = model.WebGPURenderer.getStabilizedCenterByReference();
    mat4.transpose(tmpMat4, actor.getMatrix());
    mat4.translate(tmpMat4, tmpMat4, [-center[0], -center[1], -center[2]]);
    model.UBO.setArray('BCSCMatrix', tmpMat4);

    const modelToIndex = image.getWorldToIndex();
    const dims = image.getDimensions();
    mat4.identity(tmp2Mat4);
    mat4.scale(tmp2Mat4, tmp2Mat4, [
      1.0 / Math.max(dims[0], 1),
      1.0 / Math.max(dims[1], 1),
      1.0 / Math.max(dims[2], 1),
    ]);
    mat4.multiply(tmpMat4, tmp2Mat4, modelToIndex);
    model.UBO.setArray('MCTCMatrix', tmpMat4);

    const spacing = image.getSpacing();
    model.UBO.setArray('VolumeSizeMC', [
      spacing[0] * dims[0],
      spacing[1] * dims[1],
      spacing[2] * dims[2],
      1.0,
    ]);

    const centerPoint = model.renderable.getCenterPoint();
    model.UBO.setArray('GlobalCenterPoint', [
      ...(centerPoint ?? [0.0, 0.0, 0.0]),
      1.0,
    ]);
    model.UBO.setValue('UseCenterPoint', centerPoint ? 1 : 0);

    model.UBO.setArray(
      'BackgroundColor',
      model.renderable.getBackgroundColor()
    );
    model.UBO.setArray('TangentDirection', [
      ...model.renderable.getTangentDirection(),
      0.0,
    ]);
    model.UBO.setArray('BitangentDirection', [
      ...model.renderable.getBitangentDirection(),
      0.0,
    ]);
    model.UBO.setArray(
      'UniformOrientation',
      model.renderable.getUniformOrientation()
    );
    model.UBO.setValue(
      'UseUniformOrientation',
      model.renderable.getUseUniformOrientation() ? 1 : 0
    );
    model.UBO.setValue('Width', model.renderable.getWidth());
    model.UBO.setValue('Opacity', property.getOpacity());
    model.UBO.setValue('PropID', model.WebGPUImageSlice.getPropID());
    const numClipPlanes = Math.min(
      model.renderable.getNumberOfClippingPlanes(),
      MAX_CLIPPING_PLANES
    );
    model.UBO.setValue('NumClipPlanes', numClipPlanes);

    const clipPlane = [0.0, 0.0, 0.0, 0.0];
    for (let i = 0; i < MAX_CLIPPING_PLANES; ++i) {
      clipPlane.fill(0.0);
      if (i < numClipPlanes) {
        model.renderable.getClippingPlaneInDataCoords(
          actor.getMatrix(),
          i,
          clipPlane
        );
      }
      model.UBO.setArray(`ClipPlane${i}`, clipPlane);
    }

    const coincidentParameters = publicAPI.getCoincidentParameters();
    model.UBO.setValue('CoincidentFactor', coincidentParameters?.factor ?? 0.0);
    model.UBO.setValue(
      'CoincidentOffset',
      0.000016 * (coincidentParameters?.offset ?? 0.0)
    );

    const projectionSamples =
      model.renderable.getProjectionSlabNumberOfSamples();
    const projectionThickness = model.renderable.getProjectionSlabThickness();
    const projectionStepLength =
      projectionSamples > 1
        ? projectionThickness / (projectionSamples - 1)
        : 0.0;
    model.UBO.setValue('ProjectionSamples', projectionSamples);
    model.UBO.setValue('ProjectionMode', model.renderable.getProjectionMode());
    model.UBO.setArray('ProjectionParams', [
      projectionThickness,
      -0.5 * projectionThickness,
      projectionStepLength,
      0.0,
    ]);

    const scalars = image.getPointData().getScalars();
    const numComp = scalars.getNumberOfComponents();
    const iComps = property.getIndependentComponents();
    const componentMix = [0.0, 0.0, 0.0, 0.0];
    const cScale = [1.0, 1.0, 1.0, 1.0];
    const cShift = [0.0, 0.0, 0.0, 0.0];
    const pwfScale = [1.0, 1.0, 1.0, 1.0];
    const pwfShift = [0.0, 0.0, 0.0, 0.0];
    const volumeScale = model.textureViews[0].getTexture().getScale();

    for (let i = 0; i < Math.min(numComp, 4); ++i) {
      const target = iComps ? i : 0;
      componentMix[i] = property.getComponentWeight?.(i) ?? 1.0;

      let cw = property.getColorWindow();
      let cl = property.getColorLevel();
      const cfun = property.getRGBTransferFunction(target);
      if (cfun && property.getUseLookupTableScalarRange()) {
        const cRange = cfun.getRange();
        cw = cRange[1] - cRange[0];
        cl = 0.5 * (cRange[1] + cRange[0]);
      }
      const colorWindow = Math.abs(cw) > 0.0 ? cw : 1.0;
      cScale[i] = volumeScale / colorWindow;
      cShift[i] = -cl / colorWindow + 0.5;

      const pwfun = property.getPiecewiseFunction(target);
      if (pwfun) {
        const range = pwfun.getRange();
        const length = range[1] - range[0];
        const mid = 0.5 * (range[1] + range[0]);
        const pwfLength = Math.abs(length) > 0.0 ? length : 1.0;
        pwfScale[i] = volumeScale / pwfLength;
        pwfShift[i] = -mid / pwfLength + 0.5;
      }
    }

    model.UBO.setValue('NumComponents', numComp);
    model.UBO.setValue('IndependentComponents', iComps ? 1 : 0);
    model.UBO.setArray('ComponentMix', componentMix);
    model.UBO.setArray('CScale', cScale);
    model.UBO.setArray('CShift', cShift);
    model.UBO.setArray('PWFScale', pwfScale);
    model.UBO.setArray('PWFShift', pwfShift);
    model.UBO.sendIfNeeded(model.device);
  };

  const superClassUpdateBuffers = publicAPI.updateBuffers;
  publicAPI.updateBuffers = () => {
    superClassUpdateBuffers();
    publicAPI.updateGeometry();
    publicAPI.updateVolumeTexture();
    publicAPI.updateColorTexture();
    publicAPI.updateOpacityTexture();
    publicAPI.updateUBO();

    const property = model.WebGPUImageSlice.getRenderable().getProperty();
    const filter =
      property.getInterpolationType() === InterpolationType.NEAREST
        ? 'nearest'
        : 'linear';
    if (
      !model.cprSampler ||
      model.cprSampler.getOptions().minFilter !== filter
    ) {
      model.cprSampler = vtkWebGPUSampler.newInstance({
        label: 'cprSampler',
      });
      model.cprSampler.create(model.device, {
        minFilter: filter,
        magFilter: filter,
      });
      model.additionalBindables = [model.cprSampler];
    }
  };

  publicAPI.replaceShaderImageCPR = (hash, pipeline) => {
    const vDesc = pipeline.getShaderDescription('vertex');
    vDesc.addBuiltinOutput('vec4<f32>', '@builtin(position) Position');
    vDesc.addOutput('vec2<f32>', 'quadOffsetVS');
    vDesc.addOutput('vec3<f32>', 'centerlinePosVS');
    vDesc.addOutput('vec4<f32>', 'centerlineTopOrientationVS');
    vDesc.addOutput('vec4<f32>', 'centerlineBottomOrientationVS');

    let code = vDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::ImageCPR::Impl', [
      'let isLeft = quadIndex == 0u || quadIndex == 2u;',
      'let isTop = quadIndex == 0u || quadIndex == 1u;',
      'output.quadOffsetVS = vec2<f32>(',
      '  mapperUBO.Width * select(0.5, -0.5, isLeft),',
      '  select(0.0, 1.0, isTop)',
      ');',
      'output.centerlinePosVS = centerlinePosition;',
      'output.centerlineTopOrientationVS = centerlineTopOrientation;',
      'output.centerlineBottomOrientationVS = centerlineBottomOrientation;',
      'let posSC = mapperUBO.BCSCMatrix * vec4<f32>(vertexMC, 1.0);',
      'output.Position = rendererUBO.SCPCMatrix * posSC;',
    ]).result;
    vDesc.setCode(code);
  };
  model.shaderReplacements.set(
    'replaceShaderImageCPR',
    publicAPI.replaceShaderImageCPR
  );

  publicAPI.replaceShaderClip = (hash, pipeline) => {
    const fDesc = pipeline.getShaderDescription('fragment');
    let code = fDesc.getCode();

    if (!model.renderable.getNumberOfClippingPlanes()) {
      code = vtkWebGPUShaderCache.substitute(
        code,
        '//VTK::Clip::Impl',
        []
      ).result;
      fDesc.setCode(code);
      return;
    }

    const clipPlaneChecks = getClipPlaneShaderChecks({
      countName: 'mapperUBO.NumClipPlanes',
      planePrefix: 'mapperUBO.ClipPlane',
      positionName: 'vec4<f32>(volumePosMC, 1.0)',
    });

    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Clip::Impl', [
      ...clipPlaneChecks,
    ]).result;

    fDesc.setCode(code);
  };
  model.shaderReplacements.set(
    'replaceShaderClip',
    publicAPI.replaceShaderClip
  );

  publicAPI.replaceShaderCoincident = (hash, pipeline) => {
    const fDesc = pipeline.getShaderDescription('fragment');
    let code = fDesc.getCode();
    const coincidentParameters = publicAPI.getCoincidentParameters();

    if (
      !coincidentParameters ||
      (coincidentParameters.factor === 0.0 &&
        coincidentParameters.offset === 0.0)
    ) {
      code = vtkWebGPUShaderCache.substitute(
        code,
        '//VTK::Coincident::Dec',
        []
      ).result;
      code = vtkWebGPUShaderCache.substitute(
        code,
        '//VTK::Coincident::Impl',
        []
      ).result;
      fDesc.setCode(code);
      return;
    }

    fDesc.addBuiltinInput('vec4<f32>', '@builtin(position) fragPos');
    fDesc.addBuiltinOutput('f32', '@builtin(frag_depth) fragDepth');
    code = vtkWebGPUShaderCache.substitute(
      code,
      '//VTK::Coincident::Dec',
      []
    ).result;
    code = vtkWebGPUShaderCache.substitute(
      code,
      'var output : fragmentOutput;',
      [
        'var output : fragmentOutput;',
        'var coincidentDepth = input.fragPos.z + mapperUBO.CoincidentOffset;',
        'if (mapperUBO.CoincidentFactor != 0.0) {',
        '  let cscale = length(vec2<f32>(dpdx(input.fragPos.z), dpdy(input.fragPos.z)));',
        '  coincidentDepth = coincidentDepth + mapperUBO.CoincidentFactor * cscale;',
        '}',
        'output.fragDepth = clamp(coincidentDepth, 0.0, 1.0);',
      ]
    ).result;
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Coincident::Impl', [
      '',
    ]).result;
    fDesc.setCode(code);
  };
  model.shaderReplacements.set(
    'replaceShaderCoincident',
    publicAPI.replaceShaderCoincident
  );

  publicAPI.replaceShaderRenderEncoder = (hash, pipeline) => {
    if (hash.includes('sel')) {
      const fDesc = pipeline.getShaderDescription('fragment');
      fDesc.addOutput('vec4<u32>', 'outColor');
      let code = fDesc.getCode();
      code = vtkWebGPUShaderCache.substitute(
        code,
        '//VTK::RenderEncoder::Impl',
        ['output.outColor = vec4<u32>(mapperUBO.PropID, 0u, 0u, 0u);']
      ).result;
      fDesc.setCode(code);
      return;
    }
    model.renderEncoder.replaceShaderCode(pipeline);
  };
  model.shaderReplacements.set(
    'replaceShaderRenderEncoder',
    publicAPI.replaceShaderRenderEncoder
  );
}

const DEFAULT_VALUES = {
  rowLength: 1024,
  currentImageDataInput: null,
  currentCenterlineInput: null,
  colorTextureString: null,
  pwfTextureString: null,
  cprSampler: null,
};

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkWebGPUSimpleMapper.extend(publicAPI, model, initialValues);

  publicAPI.setVertexShaderTemplate(cprVertTemplate);
  publicAPI.setFragmentShaderTemplate(cprFragTemplate);

  model.UBO = vtkWebGPUUniformBuffer.newInstance({ label: 'mapperUBO' });
  model.UBO.addEntry('BCSCMatrix', 'mat4x4<f32>');
  model.UBO.addEntry('MCTCMatrix', 'mat4x4<f32>');
  model.UBO.addEntry('BackgroundColor', 'vec4<f32>');
  model.UBO.addEntry('VolumeSizeMC', 'vec4<f32>');
  model.UBO.addEntry('GlobalCenterPoint', 'vec4<f32>');
  model.UBO.addEntry('UniformOrientation', 'vec4<f32>');
  model.UBO.addEntry('TangentDirection', 'vec4<f32>');
  model.UBO.addEntry('BitangentDirection', 'vec4<f32>');
  model.UBO.addEntry('ComponentMix', 'vec4<f32>');
  model.UBO.addEntry('CScale', 'vec4<f32>');
  model.UBO.addEntry('CShift', 'vec4<f32>');
  model.UBO.addEntry('PWFScale', 'vec4<f32>');
  model.UBO.addEntry('PWFShift', 'vec4<f32>');
  model.UBO.addEntry('ProjectionParams', 'vec4<f32>');
  addClipPlaneEntries(model.UBO, 'ClipPlane');
  model.UBO.addEntry('Width', 'f32');
  model.UBO.addEntry('Opacity', 'f32');
  model.UBO.addEntry('CoincidentFactor', 'f32');
  model.UBO.addEntry('CoincidentOffset', 'f32');
  model.UBO.addEntry('PropID', 'u32');
  model.UBO.addEntry('NumClipPlanes', 'u32');
  model.UBO.addEntry('ProjectionSamples', 'u32');
  model.UBO.addEntry('ProjectionMode', 'u32');
  model.UBO.addEntry('NumComponents', 'u32');
  model.UBO.addEntry('IndependentComponents', 'u32');
  model.UBO.addEntry('UseUniformOrientation', 'u32');
  model.UBO.addEntry('UseCenterPoint', 'u32');

  vtkWebGPUImageCPRMapper(publicAPI, model);
}

export const newInstance = macro.newInstance(extend, 'vtkWebGPUImageCPRMapper');

export default { newInstance, extend };

registerOverride('vtkImageCPRMapper', newInstance);
