import vtkWebGPUShaderCache from 'vtk.js/Sources/Rendering/WebGPU/ShaderCache';
import {
  getMaterialFeatureFlags,
  isEdges,
} from 'vtk.js/Sources/Rendering/WebGPU/CellArrayMapper/Helpers';
import { getDebugChannelCode } from 'vtk.js/Sources/Rendering/WebGPU/CellArrayMapper/Replacements/Debug';

function replaceShaderLight(publicAPI, model, hash, pipeline, vertexInput) {
  if (hash.includes('sel')) return;
  const vDesc = pipeline.getShaderDescription('vertex');
  if (!vDesc.hasOutput('vertexVC')) vDesc.addOutput('vec4<f32>', 'vertexVC');

  const renderer = model.WebGPURenderer.getRenderable();

  const fDesc = pipeline.getShaderDescription('fragment');
  let code = fDesc.getCode();

  // Code that runs if the fragment shader includes normals
  const hasNormal = code.includes('var normal:');
  const needLighting =
    hasNormal &&
    model.useRendererMatrix &&
    !isEdges(hash) &&
    !model.is2D &&
    !hash.includes('sel');
  if (needLighting) {
    const actor = model.WebGPUActor.getRenderable();
    const ppty = actor.getProperty();
    const {
      hasAnisotropy,
      hasClearCoat,
      hasDiffuseTransmission,
      hasDispersion,
      hasIridescence,
      hasKHRSpecular,
      hasSheen,
      hasTransmission,
      hasVolume,
    } = getMaterialFeatureFlags(ppty);

    const lightingCode = [
      // Vectors needed for light calculations
      '  let fragPos = vec3<f32>(input.vertexVC.xyz);',
      '  let V = mix(normalize(-fragPos), vec3<f32>(0, 0, 1), f32(rendererUBO.cameraParallel)); // View Vector',
      // Values needed for light calculations
      '  let baseColor = _diffuseMap.rgb * diffuseColor.rgb;',
      '  let roughness = max(epsilon, roughnessUniform * _roughnessMap.r);',
      '  let metallic = metallicUniform * _metallicMap.r;',
      '  let alphaRoughness = roughness * roughness;',
      // Accumulated per light color
      '  var color = vec3<f32>(0.);',
      '  let emission = _emissionMap.rgb * emissionUniform * mapperUBO.EmissiveStrength;',
      '',
      '  // F0 / F90 for dual-path metallic workflow (Khronos reference)',
      '  let baseF0_raw = vec3<f32>((ior - 1.0) * (ior - 1.0) / max((ior + 1.0) * (ior + 1.0), epsilon));',
      hasKHRSpecular
        ? '  // KHR_materials_specular: modify dielectric F0 and compute specularWeight'
        : '',
      hasKHRSpecular
        ? '  let f0_dielectric = min(baseF0_raw * mapperUBO.SpecularColorFactor.rgb * _specularColorMap.rgb, vec3<f32>(1.0));'
        : '  let f0_dielectric = baseF0_raw;',
      hasKHRSpecular
        ? '  let specWeight = mapperUBO.SpecularFactor * _specularMap.a;'
        : '  let specWeight = 1.0;',
      '  let NdV = clamp(dot(normal, V), 0.00001, 1.0);',
    ];

    if (hasIridescence) {
      lightingCode.push(
        '',
        '  // Iridescence - dual path Fresnel',
        '  let iridescenceFactor = mapperUBO.IridescenceFactor * _iridescenceMap.r;',
        '  let iridescenceIOR = mapperUBO.IridescenceIOR;',
        '  let iridescenceThicknessMin = mapperUBO.IridescenceThicknessMin;',
        '  let iridescenceThicknessMax = mapperUBO.IridescenceThicknessMax;',
        '  let iridescenceThickness = mix(iridescenceThicknessMin, iridescenceThicknessMax, _iridescenceThicknessMap.g);',
        '  let iridescenceFresnel_dielectric = evalIridescence(1.0, iridescenceIOR, NdV, iridescenceThickness, f0_dielectric);',
        '  let iridescenceFresnel_metallic = evalIridescence(1.0, iridescenceIOR, NdV, iridescenceThickness, baseColor);'
      );
    }

    if (hasAnisotropy) {
      lightingCode.push(
        '',
        '  // Anisotropic parameters',
        '  let anisotropyU = mapperUBO.Anisotropy * _anisotropyMap.b;',
        '  let at = mix(alphaRoughness, 1.0, anisotropyU * anisotropyU);',
        '  let ab = clamp(alphaRoughness, 0.001, 1.0);',
        '  let TdV = dot(tangentVC, V);',
        '  let BdV = dot(bitangentVC, V);'
      );
    }

    if (hasClearCoat) {
      lightingCode.push(
        '',
        '  // Clearcoat parameters',
        '  let coatStrength = mapperUBO.CoatStrength * _coatMap.r;',
        '  let coatRoughness = max(epsilon, mapperUBO.CoatRoughness * _coatRoughnessMap.g);',
        '  let coatF0 = vec3<f32>(mapperUBO.CoatF0);',
        '  let coatF90 = vec3<f32>(1.0);',
        '  let coatNdV = clamp(dot(coatNormal, V), 0.00001, 1.0);',
        '  let clearcoatFresnel = fresnelSchlickVec3(coatF0, coatF90, coatNdV);',
        '  let coatColorFactor = mix(vec3<f32>(1.0), mapperUBO.CoatColor.rgb, coatStrength);'
      );
    }

    if (hasSheen) {
      lightingCode.push(
        '',
        '  // Sheen parameters (Charlie BRDF)',
        '  let sheenColor = mapperUBO.SheenColor.rgb * _sheenColorMap.rgb;',
        '  let sheenRoughness = max(epsilon, mapperUBO.SheenRoughness * _sheenRoughnessMap.a);',
        '  let albedoSheenScaling = 1.0 - max(max(sheenColor.r, sheenColor.g), sheenColor.b);'
      );
    }

    if (hasDiffuseTransmission) {
      lightingCode.push(
        '',
        '  // Diffuse transmission parameters',
        '  let diffTransFactor = mapperUBO.DiffuseTransmissionFactor * _diffuseTransmissionMap.r;',
        '  let diffTransColor = mapperUBO.DiffuseTransmissionColor.rgb * _diffuseTransmissionColorMap.rgb;'
      );
    }

    // Volume parameters (needed for per light BTDF and IBL transmission)
    if (hasVolume) {
      lightingCode.push(
        '',
        '  // Volume parameters',
        '  let thickness = mapperUBO.ThicknessFactor * _thicknessMap.r;',
        '  let attDist = mapperUBO.AttenuationDistance;',
        '  let attColor = mapperUBO.AttenuationColor.rgb;'
      );
    }

    // Transmission factor needed for per light BTDF
    if (hasTransmission) {
      lightingCode.push(
        '',
        '  // Specular transmission (per light BTDF)',
        '  let transmissionF_early = mapperUBO.Transmission * _transmissionMap.r;'
      );
    }

    // Light loop
    lightingCode.push(
      '',
      '  {',
      '    var i = 0;',
      '    loop {',
      '      if (!(i < rendererUBO.LightCount)) { break; }',
      '      var L: vec3<f32>;',
      '      var radiance: vec3<f32>;',
      '      switch (i32(rendererLightSSBO.values[i].LightData.x)) {',
      '         case 0 {',
      '           let color = rendererLightSSBO.values[i].LightColor.rgb * rendererLightSSBO.values[i].LightColor.w;',
      '           let pos = (rendererLightSSBO.values[i].LightPos).xyz;',
      '           let lightVec = pos - fragPos;',
      '           let dist2 = max(dot(lightVec, lightVec), epsilon);',
      '           L = lightVec * inverseSqrt(dist2);',
      '           radiance = color / dist2;',
      '          }',
      '         case 1 {',
      '           let dir = normalize((rendererUBO.WCVCNormals * vec4<f32>(normalize(rendererLightSSBO.values[i].LightDir.xyz), 0.)).xyz);',
      '           let color = rendererLightSSBO.values[i].LightColor.rgb * rendererLightSSBO.values[i].LightColor.w;',
      '           L = dir;',
      '           radiance = color;',
      '         }',
      '         case 2 {',
      '           let color = rendererLightSSBO.values[i].LightColor.rgb * rendererLightSSBO.values[i].LightColor.w;',
      '           let pos = (rendererLightSSBO.values[i].LightPos).xyz;',
      '           let dir = normalize((rendererUBO.WCVCNormals * vec4<f32>(normalize(rendererLightSSBO.values[i].LightDir.xyz), 0.)).xyz);',
      '           let cones = vec2<f32>(rendererLightSSBO.values[i].LightData.y, rendererLightSSBO.values[i].LightData.z);',
      '           let lightVec = pos - fragPos;',
      '           let dist2 = max(dot(lightVec, lightVec), epsilon);',
      '           L = lightVec * inverseSqrt(dist2);',
      '           let theta = max(dot(normalize(dir), L), 0.0);',
      '           let coneDelta = max(cones.x - cones.y, epsilon);',
      '           var intensity = clamp((theta - cones.y) / coneDelta, 0.0, 1.0);',
      '           intensity /= dist2;',
      '           radiance = color * intensity;',
      '         }',
      '         default { continue; }',
      '       }',
      '      let H = normalize(L + V);',
      '      let NdL = max(dot(normal, L), 0.0);',
      '      let NdH = max(dot(normal, H), 0.0);',
      '      let HdL = max(dot(H, L), 0.0);',
      '',
      '      // Per-light diffuse (Khronos reference: BRDF_lambertian)',
      '      var l_diffuse = radiance * NdL * BRDF_lambertian(baseColor);'
    );

    // Diffuse transmission modifies l_diffuse per light
    if (hasDiffuseTransmission) {
      lightingCode.push(
        '      l_diffuse *= (1.0 - diffTransFactor);',
        '      if (dot(normal, L) < 0.0) {',
        '        let backNdL = max(dot(-normal, L), 0.0);',
        '        l_diffuse += radiance * backNdL * BRDF_lambertian(diffTransColor) * diffTransFactor;',
        '      }'
      );
    }

    // Per light specular transmission (Khronos BTDF)
    if (hasTransmission) {
      lightingCode.push(
        '      {',
        '        let refractedDir = refract(-V, normal, 1.0 / max(ior, epsilon));',
        `        let trRay = normalize(refractedDir) * ${
          hasVolume ? 'thickness' : '0.0'
        };`,
        '        let trLight = radiance * getPunctualRadianceTransmission(normal, V, L, alphaRoughness, baseColor, ior);'
      );
      if (hasVolume) {
        lightingCode.push(
          '        let trLightAtt = applyVolumeAttenuation(trLight, length(trRay), attColor, attDist);',
          '        l_diffuse = mix(l_diffuse, trLightAtt, transmissionF_early);'
        );
      } else {
        lightingCode.push(
          '        l_diffuse = mix(l_diffuse, trLight, transmissionF_early);'
        );
      }
      lightingCode.push('      }');
    }

    // Per light specular (no Fresnel)
    if (hasAnisotropy) {
      lightingCode.push(
        '',
        '      // Per-light anisotropic specular (Khronos BRDF_specularGGXAnisotropy)',
        '      let l_specular = radiance * NdL * specularAnisotropicBRDF(at, ab, L, tangentVC, bitangentVC, H, TdV, BdV, NdH, NdV, NdL);'
      );
    } else {
      lightingCode.push(
        '',
        '      // Per-light isotropic specular (Khronos BRDF_specularGGX)',
        '      let l_specular = radiance * NdL * BRDF_specularGGX(alphaRoughness, NdL, NdV, NdH);'
      );
    }

    // Dual path Fresnel
    lightingCode.push(
      '',
      '      // Dual-path Fresnel (Khronos reference)',
      '      let dielectric_fresnel = fresnelSchlickVec3(f0_dielectric * specWeight, vec3<f32>(specWeight), HdL);',
      '      let metal_fresnel = fresnelSchlickVec3(baseColor, vec3<f32>(1.0), HdL);',
      '      var l_metal_brdf = metal_fresnel * l_specular;',
      '      var l_dielectric_brdf = mix(l_diffuse, l_specular, dielectric_fresnel);'
    );

    // Iridescence per light
    if (hasIridescence) {
      lightingCode.push(
        '      l_metal_brdf = mix(l_metal_brdf, l_specular * iridescenceFresnel_metallic, iridescenceFactor);',
        '      l_dielectric_brdf = mix(l_dielectric_brdf, rgb_mix(l_diffuse, l_specular, iridescenceFresnel_dielectric), iridescenceFactor);'
      );
    }

    // Mix metal and dielectric paths
    lightingCode.push(
      '      var l_color = mix(l_dielectric_brdf, l_metal_brdf, metallic);'
    );

    // Per light sheen
    if (hasSheen) {
      lightingCode.push(
        '      // Per-light sheen (Charlie BRDF)',
        '      let sheenD = distributionCharlie(sheenRoughness, NdH);',
        '      let sheenV_val = V_Sheen(NdL, NdV, sheenRoughness);',
        '      let l_sheen = radiance * NdL * sheenColor * sheenD * sheenV_val;',
        '      l_color = l_sheen + l_color * albedoSheenScaling;'
      );
    }

    // Per light clearcoat
    if (hasClearCoat) {
      lightingCode.push(
        '      // Per-light clearcoat',
        '      let coatNdL = clamp(dot(coatNormal, L), 0.00001, 1.0);',
        '      let coatNdH = clamp(dot(coatNormal, H), 0.00001, 1.0);',
        '      let coatVdH = max(dot(V, H), 0.0);',
        '      let l_clearcoat_brdf = radiance * coatNdL * clearcoatBRDF(coatNdH, coatNdV, coatNdL, coatRoughness) * fresnelSchlickVec3(coatF0, coatF90, coatVdH);',
        '      l_color = mix(l_color, l_clearcoat_brdf, coatStrength * clearcoatFresnel);'
      );
    }

    // Accumulate per light result
    lightingCode.push(
      '      color += max(vec3<f32>(0.0), l_color);',
      '      continuing { i++; }',
      '    }',
      '  }'
    );

    // Transmission factor
    if (hasTransmission) {
      lightingCode.push('  let transmissionF = transmissionF_early;');
    } else {
      lightingCode.push(
        '  let transmissionF = mapperUBO.Transmission * _transmissionMap.r;'
      );
    }
    // Final PBR result - apply AO with strength
    // Khronos spec: color = color * (1.0 + OcclusionStrength * (ao - 1.0))
    // AO modulates the accumulated lighting (ambient + direct diffuse)
    lightingCode.push(
      '  let ao = _ambientOcclusionMap.r;',
      '  var PBR = ambientIntensity * ambientColor.rgb * baseColor + color;',
      '  PBR = PBR * (1.0 + mapperUBO.OcclusionStrength * (ao - 1.0));'
    );

    if (hasClearCoat) {
      lightingCode.push('  PBR = PBR * coatColorFactor;');
    }

    // For transmissive materials, transmission is baked into the color (via mix
    // with transmitted background), so the fragment must stay opaque in OIT.
    // Without this, glass with low baseColorFactor.a becomes invisible.
    // Matches three.js: transmissionAlpha = mix(1.0, transmitted.a, transmission) ≈ 1.0
    if (hasTransmission) {
      lightingCode.push(
        '  let transmissionAlpha = mix(opacity, 1.0, transmissionF);'
      );
    }
    const alphaExpr = hasTransmission ? 'transmissionAlpha' : 'opacity';
    if (hasClearCoat) {
      lightingCode.push(
        `  computedColor = vec4<f32>(PBR + emission * (1.0 - coatStrength * clearcoatFresnel), ${alphaExpr});`
      );
    } else {
      lightingCode.push(
        `  computedColor = vec4<f32>(PBR + emission, ${alphaExpr});`
      );
    }

    // IBL + Transmission
    const hasIBL = !!renderer.getEnvironmentTexture()?.getImageLoaded();
    const hasTransmissionBg =
      (ppty.getTransmissionFactor?.() ?? 0) > 0 &&
      !!model.WebGPURenderer?.getOpaqueColorTextureView?.();

    if (hasIBL || hasTransmissionBg || hasDiffuseTransmission) {
      // Diffuse IBL
      if (hasIBL) {
        lightingCode.push(
          '  // IBL: sample environment for diffuse (max mip) and specular (roughness mip)',
          '  let diffuseIBLCoords = (transpose(rendererUBO.WCVCNormals) * vec4<f32>(normal, 1.)).xyz;',
          '  let diffuseCoords = vecToRectCoord(diffuseIBLCoords);'
        );

        if (hasAnisotropy) {
          lightingCode.push(
            '  let anisotropicTangent_ibl = cross(bitangentVC, V);',
            '  let anisotropicNormal_ibl = cross(anisotropicTangent_ibl, bitangentVC);',
            '  let bentNormal_ibl = normalize(mix(normal, anisotropicNormal_ibl, anisotropyU));',
            '  let VreflN = normalize(reflect(-V, bentNormal_ibl));'
          );
        } else {
          lightingCode.push('  let VreflN = normalize(reflect(-V, normal));');
        }

        lightingCode.push(
          '  let reflectionIBLCoords = (transpose(rendererUBO.WCVCNormals) * vec4<f32>(VreflN, 1.)).xyz;',
          '  let specularCoords = vecToRectCoord(reflectionIBLCoords);',
          '  let f_diffuse_ibl = textureSampleLevel(EnvironmentTexture, EnvironmentTextureSampler, diffuseCoords, rendererUBO.MaxEnvironmentMipLevel).rgb * rendererUBO.BackgroundDiffuseStrength;',
          '  let specLevel = roughness * rendererUBO.MaxEnvironmentMipLevel;',
          '  let f_specular_ibl = textureSampleLevel(EnvironmentTexture, EnvironmentTextureSampler, specularCoords, specLevel).rgb * rendererUBO.BackgroundSpecularStrength;',
          '',
          '  var f_diffuse_env = f_diffuse_ibl * baseColor;'
        );
      } else {
        // No IBL - use baseColor as ambient diffuse, zero specular
        lightingCode.push(
          '  var f_diffuse_env = baseColor;',
          '  let f_specular_ibl = vec3<f32>(0.0);'
        );
      }

      // Diffuse transmission IBL
      if (hasDiffuseTransmission) {
        if (hasIBL) {
          lightingCode.push(
            '  let negNCoords = (transpose(rendererUBO.WCVCNormals) * vec4<f32>(-normal, 1.)).xyz;',
            '  let negDiffCoords = vecToRectCoord(negNCoords);',
            '  var diffTransIBL = textureSampleLevel(EnvironmentTexture, EnvironmentTextureSampler, negDiffCoords, rendererUBO.MaxEnvironmentMipLevel).rgb * rendererUBO.BackgroundDiffuseStrength * diffTransColor;'
          );
        } else {
          // No IBL: use baseColor tinted by diffTransColor as fallback
          lightingCode.push('  var diffTransIBL = diffTransColor * baseColor;');
        }
        if (hasVolume) {
          lightingCode.push(
            '  diffTransIBL = applyVolumeAttenuation(diffTransIBL, thickness, attColor, attDist);'
          );
        }
        lightingCode.push(
          '  f_diffuse_env = mix(f_diffuse_env, diffTransIBL, diffTransFactor);'
        );
      }

      // Specular transmission
      if (hasTransmissionBg) {
        // Reference: always use refraction-based projection (thickness=0 when no volume)
        const transmissionThickness = hasVolume ? 'thickness' : '0.0';
        // Max available mip level of the transmission framebuffer
        // Base UV from rasterizer builtin position (always correct)
        lightingCode.push(
          '  let transmissionMaxMip = f32(max(i32(textureNumLevels(TransmissionBgTexture)) - 1, 0));',
          '  let transmissionBaseUV = input.fragPos.xy / rendererUBO.viewportSize;'
        );
        if (hasDispersion) {
          // Dispersion: per channel IOR spread
          lightingCode.push(
            '  let dispersionVal = mapperUBO.Dispersion;',
            '  let halfSpread = (ior - 1.0) * 0.025 * dispersionVal;',
            '  let iorR = ior - halfSpread;',
            '  let iorG = ior;',
            '  let iorB = ior + halfSpread;',
            '  // Red channel',
            '  let refractR = refract(-V, normal, 1.0 / max(iorR, epsilon));',
            '  let refractRLen = max(length(refractR), epsilon);',
            `  let trRayR = (refractR / refractRLen) * ${transmissionThickness};`,
            '  let exitR = fragPos + trRayR;',
            '  let clipR = rendererUBO.VCPCMatrix * vec4<f32>(exitR, 1.0);',
            '  let invWR = select(0.0, 1.0 / clipR.w, abs(clipR.w) > epsilon);',
            '  var uvR = clipR.xy * invWR * 0.5 + 0.5;',
            '  uvR.y = 1.0 - uvR.y;',
            '  uvR = clamp(uvR, vec2<f32>(0.001), vec2<f32>(0.999));',
            '  let mipR = min(log2(f32(textureDimensions(TransmissionBgTexture, 0).x)) * applyIorToRoughness(roughness, iorR), transmissionMaxMip);',
            '  // Green channel',
            '  let refractG = refract(-V, normal, 1.0 / max(iorG, epsilon));',
            '  let refractGLen = max(length(refractG), epsilon);',
            `  let trRayG = (refractG / refractGLen) * ${transmissionThickness};`,
            '  let exitG = fragPos + trRayG;',
            '  let clipG = rendererUBO.VCPCMatrix * vec4<f32>(exitG, 1.0);',
            '  let invWG = select(0.0, 1.0 / clipG.w, abs(clipG.w) > epsilon);',
            '  var uvG = clipG.xy * invWG * 0.5 + 0.5;',
            '  uvG.y = 1.0 - uvG.y;',
            '  uvG = clamp(uvG, vec2<f32>(0.001), vec2<f32>(0.999));',
            '  let mipG = min(log2(f32(textureDimensions(TransmissionBgTexture, 0).x)) * applyIorToRoughness(roughness, iorG), transmissionMaxMip);',
            '  // Blue channel',
            '  let refractB = refract(-V, normal, 1.0 / max(iorB, epsilon));',
            '  let refractBLen = max(length(refractB), epsilon);',
            `  let trRayB = (refractB / refractBLen) * ${transmissionThickness};`,
            '  let exitB = fragPos + trRayB;',
            '  let clipB = rendererUBO.VCPCMatrix * vec4<f32>(exitB, 1.0);',
            '  let invWB = select(0.0, 1.0 / clipB.w, abs(clipB.w) > epsilon);',
            '  var uvB = clipB.xy * invWB * 0.5 + 0.5;',
            '  uvB.y = 1.0 - uvB.y;',
            '  uvB = clamp(uvB, vec2<f32>(0.001), vec2<f32>(0.999));',
            '  let mipB = min(log2(f32(textureDimensions(TransmissionBgTexture, 0).x)) * applyIorToRoughness(roughness, iorB), transmissionMaxMip);',
            '  var transmittedColor = vec3<f32>(',
            '    textureSampleLevel(TransmissionBgTexture, TransmissionBgTextureSampler, uvR, mipR).r,',
            '    textureSampleLevel(TransmissionBgTexture, TransmissionBgTextureSampler, uvG, mipG).g,',
            '    textureSampleLevel(TransmissionBgTexture, TransmissionBgTextureSampler, uvB, mipB).b',
            '  );'
          );
        } else {
          // Standard refraction with thickness-scaled normal offset.
          // Thin glass (thickness < 0.3): normal-based distortion for visible refraction.
          // Thick volume (thickness > 0.5): no offset, just see-through with attenuation.
          // When no volume, thickness defaults to 0 (no offset, no attenuation).
          const thicknessExpr = hasVolume ? 'thickness' : '0.0';
          lightingCode.push(
            '  let eta = 1.0 / max(ior, epsilon);',
            '  let refractedDir = refract(-V, normal, eta);',
            '  let refractedDirLen = max(length(refractedDir), epsilon);',
            `  let transmissionRay = (refractedDir / refractedDirLen) * ${transmissionThickness};`,
            `  let offsetScale = 1.0 - smoothstep(0.3, 0.5, ${thicknessExpr});`,
            `  let refractionStrength = (1.0 - eta) * ${thicknessExpr} * offsetScale / max(abs(fragPos.z), 0.01);`,
            '  var refractionUV = clamp(transmissionBaseUV + normal.xy * refractionStrength, vec2<f32>(0.001), vec2<f32>(0.999));',
            '  let iorRoughness = applyIorToRoughness(roughness, ior);',
            '  let transmissionMipLevel = min(log2(f32(textureDimensions(TransmissionBgTexture, 0).x)) * iorRoughness, transmissionMaxMip);',
            '  var transmittedColor = textureSampleLevel(TransmissionBgTexture, TransmissionBgTextureSampler, refractionUV, transmissionMipLevel).rgb;'
          );
        }
        if (hasVolume) {
          // Volume attenuation
          if (hasDispersion) {
            lightingCode.push(
              '  let transmissionRayLength = length(trRayG);',
              '  transmittedColor = applyVolumeAttenuation(transmittedColor, transmissionRayLength, attColor, attDist);'
            );
          } else {
            lightingCode.push(
              '  let transmissionRayLength = length(transmissionRay);',
              '  transmittedColor = applyVolumeAttenuation(transmittedColor, transmissionRayLength, attColor, attDist);'
            );
          }
        }
        lightingCode.push(
          '  transmittedColor = transmittedColor * baseColor;',
          '  f_diffuse_env = mix(f_diffuse_env, transmittedColor, transmissionF);'
        );
      }

      // Dual-path Fresnel
      lightingCode.push(
        '',
        '  // Dual-path IBL Fresnel',
        '  let f_metal_fresnel_ibl = getIBLGGXFresnel(NdV, roughness, baseColor, 1.0);',
        '  var f_metal_brdf_ibl = f_metal_fresnel_ibl * f_specular_ibl;',
        '  let f_dielectric_fresnel_ibl = getIBLGGXFresnel(NdV, roughness, f0_dielectric, specWeight);',
        '  var f_dielectric_brdf_ibl = mix(f_diffuse_env, f_specular_ibl, f_dielectric_fresnel_ibl);'
      );

      // Iridescence IBL
      if (hasIridescence) {
        lightingCode.push(
          '  f_metal_brdf_ibl = mix(f_metal_brdf_ibl, f_specular_ibl * iridescenceFresnel_metallic, iridescenceFactor);',
          '  f_dielectric_brdf_ibl = mix(f_dielectric_brdf_ibl, rgb_mix(f_diffuse_env, f_specular_ibl, iridescenceFresnel_dielectric), iridescenceFactor);'
        );
      }

      // Mix metal and dielectric paths
      lightingCode.push(
        '  var iblColor = mix(f_dielectric_brdf_ibl, f_metal_brdf_ibl, metallic);'
      );

      // Sheen IBL
      if (hasSheen && hasIBL) {
        lightingCode.push(
          '  let sheenLevel_ibl = sheenRoughness * rendererUBO.MaxEnvironmentMipLevel;',
          '  let sheenRefl = normalize(reflect(-V, normal));',
          '  let sheenReflWC = (transpose(rendererUBO.WCVCNormals) * vec4<f32>(sheenRefl, 1.)).xyz;',
          '  let sheenCoords_ibl = vecToRectCoord(sheenReflWC);',
          '  let f_sheen_light = textureSampleLevel(EnvironmentTexture, EnvironmentTextureSampler, sheenCoords_ibl, sheenLevel_ibl).rgb * rendererUBO.BackgroundSpecularStrength;',
          '  let f_sheen_ibl = f_sheen_light * sheenColor;',
          '  iblColor = f_sheen_ibl + iblColor * albedoSheenScaling;'
        );
      }

      // Clearcoat IBL
      if (hasClearCoat && hasIBL) {
        lightingCode.push(
          '  let coatVreflN = normalize(reflect(-V, coatNormal));',
          '  let coatReflCoords = (transpose(rendererUBO.WCVCNormals) * vec4<f32>(coatVreflN, 1.)).xyz;',
          '  let coatSpecCoords = vecToRectCoord(coatReflCoords);',
          '  let coatLevel = coatRoughness * rendererUBO.MaxEnvironmentMipLevel;',
          '  let clearcoat_brdf_ibl = textureSampleLevel(EnvironmentTexture, EnvironmentTextureSampler, coatSpecCoords, coatLevel).rgb * rendererUBO.BackgroundSpecularStrength;',
          '  iblColor = mix(iblColor, clearcoat_brdf_ibl, coatStrength * clearcoatFresnel);'
        );
      }

      // Apply AO with strength and accumulate
      lightingCode.push(
        '  iblColor = iblColor * (1.0 + mapperUBO.OcclusionStrength * (ao - 1.0));',
        '  computedColor += vec4<f32>(iblColor, 0);'
      );
    }

    // Debug channel override - ensure fragPos is available for checkerboard
    fDesc.addBuiltinInput('vec4<f32>', '@builtin(position) fragPos');
    const hasTCoords = vDesc.hasOutput('tcoordVS');
    const hasAOTexture = !!(
      ppty.getAmbientOcclusionTexture?.() || ppty.getORMTexture?.()
    );
    lightingCode.push(
      ...getDebugChannelCode(getMaterialFeatureFlags(ppty), {
        hasTCoords,
        hasAOTexture,
      })
    );

    code = vtkWebGPUShaderCache.substitute(
      code,
      '//VTK::Light::Impl',
      lightingCode
    ).result;
    fDesc.setCode(code);
    // If theres no normals, just set the specular color to be flat
  } else {
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Light::Impl', [
      '  let diffuse = diffuseColor.rgb;',
      '  let specular = specularColor.rgb * specularColor.a;',
      '  computedColor = vec4<f32>(diffuse * _diffuseMap.rgb, opacity);',
    ]).result;
    fDesc.setCode(code);
  }
}

export default replaceShaderLight;
