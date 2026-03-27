import macro from 'vtk.js/Sources/macros';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkWebGPUCellArrayMapper from 'vtk.js/Sources/Rendering/WebGPU/CellArrayMapper';
import vtkWebGPUPolyDataMapper from 'vtk.js/Sources/Rendering/WebGPU/PolyDataMapper';
import vtkWebGPUShaderCache from 'vtk.js/Sources/Rendering/WebGPU/ShaderCache';

import { registerOverride } from 'vtk.js/Sources/Rendering/WebGPU/ViewNodeFactory';

import {
  vec3ToVec4,
  shiftVec3ToVec4,
  boundsToMinPoint,
  boundsToMaxPoint,
} from 'vtk.js/Sources/Rendering/WebGPU/CutterMapper/helpers';

const { vtkErrorMacro } = macro;

function vtkWebGPUCutterCellArrayMapper(publicAPI, model) {
  model.classHierarchy.push('vtkWebGPUCutterCellArrayMapper');

  publicAPI.replaceShaderPosition = (hash, pipeline, vertexInput) => {
    const functionName = model.renderable.getSupportedImplicitFunctionName();
    if (!functionName) {
      vtkErrorMacro(`No cut function set.`);
      return;
    }

    const vDesc = pipeline.getShaderDescription('vertex');
    vDesc.addBuiltinOutput('vec4<f32>', '@builtin(position) Position');
    if (!vDesc.hasOutput('vertexVC')) {
      vDesc.addOutput('vec4<f32>', 'vertexVC');
    }
    vDesc.addOutput('f32', 'cutDistanceVS');

    let positionImpl = [];
    if (model.useRendererMatrix) {
      positionImpl = [
        '    var pCoord: vec4<f32> = rendererUBO.SCPCMatrix*mapperUBO.BCSCMatrix*vertexBC;',
        '    output.vertexVC = rendererUBO.SCVCMatrix * mapperUBO.BCSCMatrix * vec4<f32>(vertexBC.xyz, 1.0);',
      ];
    } else {
      positionImpl = [
        '    var pCoord: vec4<f32> = mapperUBO.BCSCMatrix*vertexBC;',
        '    pCoord.x = 2.0* pCoord.x / rendererUBO.viewportSize.x - 1.0;',
        '    pCoord.y = 2.0* pCoord.y / rendererUBO.viewportSize.y - 1.0;',
        '    pCoord.z = 0.5 - 0.5 * pCoord.z;',
        '    output.vertexVC = vec4<f32>(0.0);',
      ];
    }

    let cutDistanceImpl = ['    output.cutDistanceVS = 1.0;'];
    switch (functionName) {
      case 'vtkPlane':
        cutDistanceImpl = [
          '    output.cutDistanceVS = dot(mapperUBO.CutPlaneNormal.xyz, vertexBC.xyz - mapperUBO.CutPlaneOrigin.xyz) - mapperUBO.CutValue;',
        ];
        break;
      case 'vtkSphere':
        cutDistanceImpl = [
          '    let cutSphereDelta: vec3<f32> = vertexBC.xyz - mapperUBO.CutSphereCenter.xyz;',
          '    if (mapperUBO.CutSphereUsesAxisRadii == 1u) {',
          '      let cutSphereNormalizedDelta: vec3<f32> = cutSphereDelta / mapperUBO.CutSphereRadius.xyz;',
          '      output.cutDistanceVS = dot(cutSphereNormalizedDelta, cutSphereNormalizedDelta) - 1.0;',
          '    } else {',
          '      output.cutDistanceVS = dot(cutSphereDelta, cutSphereDelta) - mapperUBO.CutSphereRadius.x * mapperUBO.CutSphereRadius.x;',
          '    }',
        ];
        break;
      case 'vtkBox':
        cutDistanceImpl = [
          '    var cutBoxMinDistance: f32 = -1.0e20;',
          '    var cutBoxDistance: f32 = 0.0;',
          '    var cutBoxInside: bool = true;',
          '    var cutBoxIsDegenerate: bool = false;',
          '    for (var i: i32 = 0; i < 3; i++) {',
          '      let cutBoxLength: f32 = mapperUBO.CutBoxMaxPoint[i] - mapperUBO.CutBoxMinPoint[i];',
          '      var cutBoxDist: f32 = 0.0;',
          '      if (cutBoxLength != 0.0) {',
          '        let cutBoxT: f32 = (vertexBC[i] - mapperUBO.CutBoxMinPoint[i]) / cutBoxLength;',
          '        if (cutBoxT < 0.0) {',
          '          cutBoxInside = false;',
          '          cutBoxDist = mapperUBO.CutBoxMinPoint[i] - vertexBC[i];',
          '        } else if (cutBoxT > 1.0) {',
          '          cutBoxInside = false;',
          '          cutBoxDist = vertexBC[i] - mapperUBO.CutBoxMaxPoint[i];',
          '        } else if (cutBoxT <= 0.5) {',
          '          cutBoxDist = mapperUBO.CutBoxMinPoint[i] - vertexBC[i];',
          '          cutBoxMinDistance = max(cutBoxMinDistance, cutBoxDist);',
          '        } else {',
          '          cutBoxDist = vertexBC[i] - mapperUBO.CutBoxMaxPoint[i];',
          '          cutBoxMinDistance = max(cutBoxMinDistance, cutBoxDist);',
          '        }',
          '      } else {',
          '        // Degenerate axis: box has zero thickness along this dimension',
          '        cutBoxIsDegenerate = true;',
          '        cutBoxDist = abs(vertexBC[i] - mapperUBO.CutBoxMinPoint[i]);',
          '        if (cutBoxDist > 0.0) {',
          '          cutBoxInside = false;',
          '        }',
          '      }',
          '      if (cutBoxDist > 0.0) {',
          '        cutBoxDistance += cutBoxDist * cutBoxDist;',
          '      }',
          '    }',
          '    // Guard against degenerate boxes (zero size on one or more axes)',
          '    let cutDistanceIfInside = select(cutBoxMinDistance, 0.0, cutBoxIsDegenerate);',
          '    output.cutDistanceVS = select(sqrt(cutBoxDistance), cutDistanceIfInside, cutBoxInside);',
        ];
        break;
      case 'vtkCylinder':
        cutDistanceImpl = [
          '    let cutCylinderDelta: vec3<f32> = vertexBC.xyz - mapperUBO.CutCylinderCenter.xyz;',
          '    let cutCylinderAxisLengthSq: f32 = dot(mapperUBO.CutCylinderAxis.xyz, mapperUBO.CutCylinderAxis.xyz);',
          '    let cutCylinderProjection: f32 = dot(mapperUBO.CutCylinderAxis.xyz, cutCylinderDelta);',
          '    let cutCylinderDistWithAxis: f32 = dot(cutCylinderDelta, cutCylinderDelta) - cutCylinderProjection * cutCylinderProjection / cutCylinderAxisLengthSq - mapperUBO.CutCylinderRadius * mapperUBO.CutCylinderRadius;',
          '    let cutCylinderDistWithoutAxis: f32 = dot(cutCylinderDelta, cutCylinderDelta) - mapperUBO.CutCylinderRadius * mapperUBO.CutCylinderRadius;',
          '    output.cutDistanceVS = select(cutCylinderDistWithoutAxis, cutCylinderDistWithAxis, cutCylinderAxisLengthSq > 0.0);',
        ];
        break;
      case 'vtkCone':
        cutDistanceImpl = [
          '    let cutConeDelta: vec3<f32> = vertexBC.xyz - mapperUBO.CutConeApex.xyz;',
          '    let cutConeAxial: f32 = dot(mapperUBO.CutConeAxis.xyz, cutConeDelta);',
          '    let cutConeRadial2: f32 = dot(cutConeDelta, cutConeDelta) - cutConeAxial * cutConeAxial;',
          '    output.cutDistanceVS = cutConeRadial2 - cutConeAxial * cutConeAxial * mapperUBO.CutConeTanThetaSquared;',
        ];
        break;
      default:
        vtkErrorMacro(`No cut function set.`);
        break;
    }

    let code = vDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Position::Impl', [
      ...positionImpl,
      ...cutDistanceImpl,
      '//VTK::Position::Impl',
    ]).result;

    if (model.forceZValue) {
      code = vtkWebGPUShaderCache.substitute(code, '//VTK::Position::Impl', [
        model.useRendererMatrix
          ? 'pCoord = vec4<f32>(pCoord.xyz/pCoord.w, 1.0);'
          : '    pCoord = vec4<f32>(pCoord.xyz/pCoord.w, 1.0);',
        '    pCoord.z = mapperUBO.ZValue;',
        '//VTK::Position::Impl',
      ]).result;
    }

    if (publicAPI.haveWideLines()) {
      vDesc.addBuiltinInput('u32', '@builtin(instance_index) instanceIndex');
      code = vtkWebGPUShaderCache.substitute(code, '//VTK::Position::Impl', [
        '    var tmpPos: vec4<f32> = pCoord;',
        '    var numSteps: f32 = max(1.0, ceil(mapperUBO.LineWidth - 1.0));',
        '    var offset: f32 = (mapperUBO.LineWidth - 1.0) * (f32(input.instanceIndex / 2u) - numSteps/2.0) / numSteps;',
        '    var tmpPos2: vec3<f32> = tmpPos.xyz / tmpPos.w;',
        '    tmpPos2.x = tmpPos2.x + 2.0 * (f32(input.instanceIndex) % 2.0) * offset / rendererUBO.viewportSize.x;',
        '    tmpPos2.y = tmpPos2.y + 2.0 * (f32(input.instanceIndex + 1u) % 2.0) * offset / rendererUBO.viewportSize.y;',
        '    tmpPos2.z = min(1.0, tmpPos2.z + 0.00001);',
        '    pCoord = vec4<f32>(tmpPos2.xyz * tmpPos.w, tmpPos.w);',
        '//VTK::Position::Impl',
      ]).result;
    }

    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Position::Impl', [
      '    output.Position = pCoord;',
    ]).result;
    vDesc.setCode(code);

    const fDesc = pipeline.getShaderDescription('fragment');
    code = fDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Position::Impl', [
      '  if (abs(input.cutDistanceVS) > max(fwidth(input.cutDistanceVS) * mapperUBO.CutWidth, 1.0e-6)) { discard; }',
      '//VTK::Position::Impl',
    ]).result;
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::RenderEncoder::Impl', [
      '  let cutterDistanceDx: f32 = dpdx(input.cutDistanceVS);',
      '  let cutterDistanceDy: f32 = dpdy(input.cutDistanceVS);',
      '  let cutterDistanceGradient: f32 = length(vec2<f32>(cutterDistanceDx, cutterDistanceDy));',
      '  if (cutterDistanceGradient <= 0.0 && abs(input.cutDistanceVS) > 1.0e-6) { discard; }',
      '//VTK::RenderEncoder::Impl',
    ]).result;
    fDesc.setCode(code);
  };
  model.shaderReplacements.set(
    'replaceShaderPosition',
    publicAPI.replaceShaderPosition
  );

  const superComputePipelineHash = publicAPI.computePipelineHash;
  publicAPI.computePipelineHash = () => {
    superComputePipelineHash();
    const functionName =
      model.renderable.getSupportedImplicitFunctionName() || 'none';
    model.pipelineHash += `cf${functionName}Params`;
  };

  const superUpdateUBO = publicAPI.updateUBO;
  publicAPI.updateUBO = () => {
    superUpdateUBO();

    const renderable = model.renderable;
    const cutFunction = renderable.getCutFunction();
    const functionName = renderable.getSupportedImplicitFunctionName();
    if (!functionName || !cutFunction) {
      return;
    }

    const bufferShift = model.WebGPUActor.getBufferShift(model.WebGPURenderer);
    model.UBO.setValue('CutWidth', Math.max(renderable.getCutWidth(), 0.0));

    switch (functionName) {
      case 'vtkPlane':
        model.UBO.setArray(
          'CutPlaneOrigin',
          shiftVec3ToVec4(
            model.cutPlaneOrigin,
            cutFunction.getOrigin(),
            bufferShift
          )
        );
        model.UBO.setArray(
          'CutPlaneNormal',
          vec3ToVec4(model.cutPlaneNormal, cutFunction.getNormal())
        );
        model.UBO.setValue('CutValue', renderable.getCutValue());
        break;
      case 'vtkSphere': {
        const radius = cutFunction.getRadius();
        const usesAxisRadii = Array.isArray(radius);
        model.UBO.setArray(
          'CutSphereCenter',
          shiftVec3ToVec4(
            model.cutSphereCenter,
            cutFunction.getCenter(),
            bufferShift
          )
        );
        if (usesAxisRadii) {
          model.cutSphereRadius[0] = radius[0];
          model.cutSphereRadius[1] = radius[1];
          model.cutSphereRadius[2] = radius[2];
        } else {
          model.cutSphereRadius[0] = radius;
          model.cutSphereRadius[1] = radius;
          model.cutSphereRadius[2] = radius;
        }
        model.cutSphereRadius[3] = 0.0;
        model.UBO.setArray('CutSphereRadius', model.cutSphereRadius);
        model.UBO.setValue('CutSphereUsesAxisRadii', usesAxisRadii ? 1 : 0);
        break;
      }
      case 'vtkBox': {
        const bounds = cutFunction.getBounds();
        model.UBO.setArray(
          'CutBoxMinPoint',
          boundsToMinPoint(model.cutBoxMinPoint, bounds, bufferShift)
        );
        model.UBO.setArray(
          'CutBoxMaxPoint',
          boundsToMaxPoint(model.cutBoxMaxPoint, bounds, bufferShift)
        );
        break;
      }
      case 'vtkCylinder':
        model.UBO.setArray(
          'CutCylinderCenter',
          shiftVec3ToVec4(
            model.cutCylinderCenter,
            cutFunction.getCenter(),
            bufferShift
          )
        );
        model.UBO.setArray(
          'CutCylinderAxis',
          vec3ToVec4(model.cutCylinderAxis, cutFunction.getAxis())
        );
        model.UBO.setValue('CutCylinderRadius', cutFunction.getRadius());
        break;
      case 'vtkCone': {
        const apex = model.cutConeApex;
        const axis = model.cutConeAxis;
        const axisPoint = model.cutConeAxisPoint;
        const inverseTransform = cutFunction.getTransform?.()?.getInverse?.();

        apex[0] = 0.0;
        apex[1] = 0.0;
        apex[2] = 0.0;
        axis[0] = 1.0;
        axis[1] = 0.0;
        axis[2] = 0.0;
        axisPoint[0] = 1.0;
        axisPoint[1] = 0.0;
        axisPoint[2] = 0.0;

        if (inverseTransform?.transformPoint) {
          inverseTransform.transformPoint(apex, apex);
          inverseTransform.transformPoint(axisPoint, axisPoint);
          vtkMath.subtract(axisPoint, apex, axis);
          if (vtkMath.norm(axis) > 0.0) {
            vtkMath.normalize(axis);
          }
        } else if (cutFunction.getTransform?.()) {
          vtkErrorMacro(
            'Failed to retrieve inverse transform for cone cut function'
          );
        }
        model.UBO.setArray(
          'CutConeApex',
          shiftVec3ToVec4(model.cutConeApex4, apex, bufferShift)
        );
        model.UBO.setArray('CutConeAxis', vec3ToVec4(model.cutConeAxis4, axis));
        const tanTheta = Math.tan(
          vtkMath.radiansFromDegrees(cutFunction.getAngle())
        );
        model.UBO.setValue('CutConeTanThetaSquared', tanTheta * tanTheta);
        break;
      }
      default:
        break;
    }

    model.UBO.sendIfNeeded(model.WebGPURenderWindow.getDevice());
  };
}

function extendCellArray(publicAPI, model, initialValues = {}) {
  vtkWebGPUCellArrayMapper.extend(publicAPI, model, initialValues);

  model.UBO.addEntry('CutPlaneOrigin', 'vec4<f32>');
  model.UBO.addEntry('CutPlaneNormal', 'vec4<f32>');
  model.UBO.addEntry('CutSphereCenter', 'vec4<f32>');
  model.UBO.addEntry('CutSphereRadius', 'vec4<f32>');
  model.UBO.addEntry('CutBoxMinPoint', 'vec4<f32>');
  model.UBO.addEntry('CutBoxMaxPoint', 'vec4<f32>');
  model.UBO.addEntry('CutCylinderCenter', 'vec4<f32>');
  model.UBO.addEntry('CutCylinderAxis', 'vec4<f32>');
  model.UBO.addEntry('CutConeApex', 'vec4<f32>');
  model.UBO.addEntry('CutConeAxis', 'vec4<f32>');
  model.UBO.addEntry('CutValue', 'f32');
  model.UBO.addEntry('CutWidth', 'f32');
  model.UBO.addEntry('CutCylinderRadius', 'f32');
  model.UBO.addEntry('CutConeTanThetaSquared', 'f32');
  model.UBO.addEntry('CutSphereUsesAxisRadii', 'u32');

  model.cutPlaneOrigin = [0.0, 0.0, 0.0, 0.0];
  model.cutPlaneNormal = [0.0, 0.0, 0.0, 0.0];
  model.cutSphereCenter = [0.0, 0.0, 0.0, 0.0];
  model.cutSphereRadius = [0.0, 0.0, 0.0, 0.0];
  model.cutBoxMinPoint = [0.0, 0.0, 0.0, 0.0];
  model.cutBoxMaxPoint = [0.0, 0.0, 0.0, 0.0];
  model.cutCylinderCenter = [0.0, 0.0, 0.0, 0.0];
  model.cutCylinderAxis = [0.0, 0.0, 0.0, 0.0];
  model.cutConeApex = [0.0, 0.0, 0.0];
  model.cutConeAxis = [1.0, 0.0, 0.0];
  model.cutConeAxisPoint = [1.0, 0.0, 0.0];
  model.cutConeApex4 = [0.0, 0.0, 0.0, 0.0];
  model.cutConeAxis4 = [1.0, 0.0, 0.0, 0.0];

  vtkWebGPUCutterCellArrayMapper(publicAPI, model);
}

const newCellArrayInstance = macro.newInstance(
  extendCellArray,
  'vtkWebGPUCutterCellArrayMapper'
);

function vtkWebGPUCutterMapper(publicAPI, model) {
  model.classHierarchy.push('vtkWebGPUCutterMapper');

  publicAPI.createCellArrayMapper = () => newCellArrayInstance();
}

export function extend(publicAPI, model, initialValues = {}) {
  vtkWebGPUPolyDataMapper.extend(publicAPI, model, initialValues);
  vtkWebGPUCutterMapper(publicAPI, model);
}

export const newInstance = macro.newInstance(extend, 'vtkWebGPUCutterMapper');

export default { newInstance, extend };

registerOverride('vtkCutterMapper', newInstance);
