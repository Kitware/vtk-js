import vtkWebGPUShaderCache from 'vtk.js/Sources/Rendering/WebGPU/ShaderCache';
import vtkWebGPUTypes from 'vtk.js/Sources/Rendering/WebGPU/Types';
import { getClipPlaneShaderChecks } from 'vtk.js/Sources/Rendering/WebGPU/Helpers/ClippingPlanes';

export function replaceShaderPosition(publicAPI, model, hash, pipeline, vertexInput) {
    const vDesc = pipeline.getShaderDescription('vertex');
    vDesc.addBuiltinOutput('vec4<f32>', '@builtin(position) Position');
    if (!vDesc.hasOutput('vertexVC')) vDesc.addOutput('vec4<f32>', 'vertexVC');
    if (!vDesc.hasOutput('vertexSC')) vDesc.addOutput('vec4<f32>', 'vertexSC');
    let code = vDesc.getCode();

    if (model._hasSkinning) {
      const skinLines = [
        '  var skinMatrix: mat4x4<f32> = ',
        '    jointWeights.x * skinJointSSBO.values[u32(jointIndices.x)].JointMatrix +',
        '    jointWeights.y * skinJointSSBO.values[u32(jointIndices.y)].JointMatrix +',
        '    jointWeights.z * skinJointSSBO.values[u32(jointIndices.z)].JointMatrix +',
        '    jointWeights.w * skinJointSSBO.values[u32(jointIndices.w)].JointMatrix;',
        '  var skinnedVertex: vec4<f32> = skinMatrix * vertexBC;',
        '//VTK::Position::Impl',
      ];
      code = vtkWebGPUShaderCache.substitute(
        code,
        '//VTK::Position::Impl',
        skinLines
      ).result;
      vDesc.setCode(code);
    }

    // Displacement mapping: offset vertex along normal before transform
    const actor = model.WebGPUActor?.getRenderable();
    const displacementTexture = actor
      ?.getProperty()
      ?.getDisplacementTexture?.();
    const tcoordBuffer = vertexInput.getBuffer('tcoord');
    const tcoordComponents = tcoordBuffer
      ? vtkWebGPUTypes.getNumberOfComponentsFromBufferFormat(
          tcoordBuffer.getArrayInformation()[0].format
        )
      : 0;
    const hasDisplacement =
      displacementTexture?.getImageLoaded() &&
      displacementTexture.getDimensionality?.() === tcoordComponents &&
      vertexInput.hasAttribute('normalMC') &&
      !!tcoordBuffer;

    if (hasDisplacement) {
      const displacementLines = [
        '    var dispHeight: f32 = textureSampleLevel(DisplacementTexture, DisplacementTextureSampler, tcoord, 0.0).r;',
        '    var dispNormal: vec4<f32> = normalize(normalMC);',
        '    var displacedBC: vec4<f32> = vec4<f32>(vertexBC.xyz + dispNormal.xyz * dispHeight * mapperUBO.DisplacementFactor, vertexBC.w);',
      ];
      if (model._hasSkinning) {
        displacementLines.push('    skinnedVertex = skinMatrix * displacedBC;');
      }
      displacementLines.push('//VTK::Position::Impl');
      code = vtkWebGPUShaderCache.substitute(
        code,
        '//VTK::Position::Impl',
        displacementLines
      ).result;
    }

    let vertexName = 'vertexBC';
    if (model._hasSkinning) {
      vertexName = 'skinnedVertex';
    } else if (hasDisplacement) {
      vertexName = 'displacedBC';
    }

    if (model.useRendererMatrix) {
      code = vtkWebGPUShaderCache.substitute(code, '//VTK::Position::Impl', [
        `    output.vertexSC = mapperUBO.BCSCMatrix * vec4<f32>(${vertexName}.xyz, 1.0);`,
        `    var pCoord: vec4<f32> = rendererUBO.SCPCMatrix*mapperUBO.BCSCMatrix*${vertexName};`,
        `    output.vertexVC = rendererUBO.SCVCMatrix * mapperUBO.BCSCMatrix * vec4<f32>(${vertexName}.xyz, 1.0);`,
        '//VTK::Position::Impl',
      ]).result;
      if (model.forceZValue) {
        code = vtkWebGPUShaderCache.substitute(code, '//VTK::Position::Impl', [
          'pCoord = vec4<f32>(pCoord.xyz/pCoord.w, 1.0);',
          'pCoord.z = mapperUBO.ZValue;',
          '//VTK::Position::Impl',
        ]).result;
      }
    } else {
      code = vtkWebGPUShaderCache.substitute(code, '//VTK::Position::Impl', [
        `    var pCoord: vec4<f32> = mapperUBO.BCSCMatrix*${vertexName};`,
        '    pCoord.x = 2.0* pCoord.x / rendererUBO.viewportSize.x - 1.0;',
        '    pCoord.y = 2.0* pCoord.y / rendererUBO.viewportSize.y - 1.0;',
        '    pCoord.z = 0.5 - 0.5 * pCoord.z;',
        '//VTK::Position::Impl',
      ]).result;
      if (model.forceZValue) {
        code = vtkWebGPUShaderCache.substitute(code, '//VTK::Position::Impl', [
          '    pCoord.z = mapperUBO.ZValue;',
          '//VTK::Position::Impl',
        ]).result;
      }
    }
    if (publicAPI.haveWideLines()) {
      vDesc.addBuiltinInput('u32', '@builtin(instance_index) instanceIndex');
      // widen the edge
      code = vtkWebGPUShaderCache.substitute(code, '//VTK::Position::Impl', [
        '    var tmpPos: vec4<f32> = pCoord;',
        '    var numSteps: f32 = ceil(mapperUBO.LineWidth - 1.0);',
        '    var offset: f32 = (mapperUBO.LineWidth - 1.0) * (f32(input.instanceIndex / 2u) - numSteps/2.0) / numSteps;',
        '    var tmpPos2: vec3<f32> = tmpPos.xyz / tmpPos.w;',
        '    tmpPos2.x = tmpPos2.x + 2.0 * (f32(input.instanceIndex) % 2.0) * offset / rendererUBO.viewportSize.x;',
        '    tmpPos2.y = tmpPos2.y + 2.0 * (f32(input.instanceIndex + 1u) % 2.0) * offset / rendererUBO.viewportSize.y;',
        '    tmpPos2.z = min(1.0, tmpPos2.z + 0.00001);', // could become a setting
        '    pCoord = vec4<f32>(tmpPos2.xyz * tmpPos.w, tmpPos.w);',
        '//VTK::Position::Impl',
      ]).result;
    }
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Position::Impl', [
      // Match the OpenGL coincident topology constant offset scale (~1 / 2^16 = 0.000016)
      '    pCoord.z = clamp(pCoord.z - 0.000016 * mapperUBO.CoincidentOffset * pCoord.w, 0.0, pCoord.w);',
      '    output.Position = pCoord;',
    ]).result;
    vDesc.setCode(code);

    const fDesc = pipeline.getShaderDescription('fragment');
    code = fDesc.getCode();
    const clipPlaneChecks = getClipPlaneShaderChecks({
      countName: 'mapperUBO.NumClipPlanes',
      planePrefix: 'mapperUBO.ClipPlane',
      positionName: 'input.vertexSC',
    });
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Position::Impl', [
      ...clipPlaneChecks,
      '//VTK::Position::Impl',
    ]).result;
    fDesc.setCode(code);
}
