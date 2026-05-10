import vtkWebGPUShaderCache from 'vtk.js/Sources/Rendering/WebGPU/ShaderCache';

function replaceShaderNormal(publicAPI, model, hash, pipeline, vertexInput) {
  const normalBuffer = vertexInput.getBuffer('normalMC');
  const tangentBuffer = vertexInput.getBuffer('tangentMC');
  const actor = model.WebGPUActor.getRenderable();

  if (normalBuffer) {
    const vDesc = pipeline.getShaderDescription('vertex');
    const interpMode = normalBuffer.getArrayInformation()[0].interpolation;

    if (!vDesc.hasOutput('normalVC')) {
      vDesc.addOutput('vec3<f32>', 'normalVC', interpMode);
    }
    if (!vDesc.hasOutput('tangentVC')) {
      vDesc.addOutput('vec3<f32>', 'tangentVC', interpMode);
    }
    if (!vDesc.hasOutput('bitangentVC')) {
      vDesc.addOutput('vec3<f32>', 'bitangentVC', interpMode);
    }

    let code = vDesc.getCode();

    if (tangentBuffer) {
      // Use precomputed tangents (glTF: vec4 with w=handedness, or vec3 padded to vec4)
      code = vtkWebGPUShaderCache.substitute(code, '//VTK::Normal::Impl', [
        '  output.normalVC = normalize((rendererUBO.WCVCNormals * mapperUBO.MCWCNormals * normalMC).xyz);',
        '  output.tangentVC = normalize((rendererUBO.WCVCNormals * mapperUBO.MCWCNormals * tangentMC).xyz);',
        '  var handedness: f32 = select(1.0, tangentMC.w, abs(tangentMC.w) > 0.5);',
        '  output.bitangentVC = normalize(cross(output.normalVC, output.tangentVC) * handedness);',
      ]).result;
    } else {
      // Approximate tangent from normal
      code = vtkWebGPUShaderCache.substitute(code, '//VTK::Normal::Impl', [
        '  output.normalVC = normalize((rendererUBO.WCVCNormals * mapperUBO.MCWCNormals * normalMC).xyz);',
        '  var c1: vec3<f32> = cross(output.normalVC, vec3<f32>(0, 0, 1));',
        '  var c2: vec3<f32> = cross(output.normalVC, vec3<f32>(0, 1, 0));',
        '  var tangent: vec3<f32> = mix(c1, c2, distance(c1, c2));',
        '  output.tangentVC = normalize(tangent);',
        '  output.bitangentVC = normalize(cross(output.normalVC, tangent));',
      ]).result;
    }

    vDesc.setCode(code);

    const fDesc = pipeline.getShaderDescription('fragment');
    code = fDesc.getCode();

    const ppty = actor.getProperty();
    const hasNormalTexture = ppty.getNormalTexture();
    const hasCoatNormalTexture =
      ppty.getCoatStrength?.() > 0 && ppty.getCoatNormalTexture?.();
    const hasAnisotropy = ppty.getAnisotropy?.() !== 0;

    if (hasNormalTexture || hasCoatNormalTexture || hasAnisotropy) {
      // Build TBN matrix in fragment shader
      const normalImpl = [
        '  var normal: vec3<f32> = input.normalVC;',
        '  var tangentVC: vec3<f32> = input.tangentVC;',
        '  var bitangentVC: vec3<f32> = input.bitangentVC;',
        '  let tangentHandedness: f32 = select(1.0, -1.0, dot(bitangentVC, cross(input.normalVC, tangentVC)) < 0.0);',
      ];

      if (hasAnisotropy) {
        // KHR_materials_anisotropy uses RG for direction and B for strength.
        normalImpl.push(
          '  var anisotropyDirTS: vec2<f32> = _anisotropyMap.rg * 2.0 - vec2<f32>(1.0);',
          '  anisotropyDirTS = anisotropyDirTS / max(length(anisotropyDirTS), epsilon);',
          '  var anisotropyRotVal: f32 = mapperUBO.AnisotropyRotation;',
          '  var r2pi: f32 = anisotropyRotVal * 2.0 * pi;',
          '  var sinR: f32 = sin(r2pi);',
          '  var cosR: f32 = cos(r2pi);',
          '  var anisotropyDir: vec2<f32> = vec2<f32>(',
          '    anisotropyDirTS.x * cosR - anisotropyDirTS.y * sinR,',
          '    anisotropyDirTS.x * sinR + anisotropyDirTS.y * cosR',
          '  );',
          '  tangentVC = normalize(tangentVC * anisotropyDir.x + bitangentVC * anisotropyDir.y);'
        );
      }

      // Gram-Schmidt re-orthogonalization + bitangent
      normalImpl.push(
        '  tangentVC = normalize(tangentVC - dot(tangentVC, normal) * normal);',
        '  bitangentVC = normalize(cross(normal, tangentVC) * tangentHandedness);',
        '  var tbn: mat3x3<f32> = mat3x3<f32>(',
        '    tangentVC.x, bitangentVC.x, normal.x,',
        '    tangentVC.y, bitangentVC.y, normal.y,',
        '    tangentVC.z, bitangentVC.z, normal.z,',
        '  );'
      );

      if (hasNormalTexture) {
        normalImpl.push(
          '  var normalTS: vec3<f32> = _normalMap.xyz * 2.0 - 1.0;',
          '  normalTS.x = normalTS.x * normalStrengthUniform;',
          '  normalTS.y = normalTS.y * normalStrengthUniform;',
          '  let geometricNormal = normalize(normal);',
          '  normal = normalize(tbn * normalTS);'
        );
      } else {
        normalImpl.push(
          '  normal = normalize(normal);',
          '  let geometricNormal = normal;'
        );
      }

      if (hasCoatNormalTexture) {
        normalImpl.push(
          '  var coatNormalTS: vec3<f32> = _coatNormalMap.xyz * 2.0 - 1.0;',
          '  coatNormalTS.x = coatNormalTS.x * mapperUBO.CoatNormalStrength;',
          '  coatNormalTS.y = coatNormalTS.y * mapperUBO.CoatNormalStrength;',
          '  var coatNormal: vec3<f32> = normalize(tbn * coatNormalTS);'
        );
      } else if ((ppty.getCoatStrength?.() ?? 0) > 0) {
        // Clearcoat uses geometric normal (not bumped) when no coat normal texture
        normalImpl.push('  var coatNormal: vec3<f32> = geometricNormal;');
      }

      code = vtkWebGPUShaderCache.substitute(
        code,
        '//VTK::Normal::Impl',
        normalImpl
      ).result;
    } else {
      const elseNormalImpl = [
        '  var normal: vec3<f32> = input.normalVC;',
        '  normal = normalize(normal);',
        '  let geometricNormal = normal;',
      ];
      if ((ppty.getCoatStrength?.() ?? 0) > 0) {
        elseNormalImpl.push('  var coatNormal: vec3<f32> = normalize(normal);');
      }
      code = vtkWebGPUShaderCache.substitute(
        code,
        '//VTK::Normal::Impl',
        elseNormalImpl
      ).result;
    }
    fDesc.setCode(code);
  }
}

export default replaceShaderNormal;
