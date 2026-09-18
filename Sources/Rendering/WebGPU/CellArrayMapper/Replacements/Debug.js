import { DebugChannel } from 'vtk.js/Sources/Rendering/Core/Mapper/Constants';

export function getDebugChannelCode(featureFlags, options = {}) {
  const {
    hasTransmission,
    hasVolume,
    hasClearCoat,
    hasSheen,
    hasKHRSpecular,
    hasIridescence,
    hasAnisotropy,
    hasDiffuseTransmission,
  } = featureFlags;

  const {
    hasTCoords = false,
    tcoordComponents = 2,
    hasAOTexture = false,
  } = options;

  const lines = [
    '  // Debug channel override',
    '  let _dbg = mapperUBO.DebugChannel;',
    '  if (_dbg != 0u) {',
    '    // Checkerboard pattern for unsupported/missing channels (Khronos style)',
    '    let _freq = 0.01;',
    '    let _gray = 0.9;',
    '    let _v1 = step(vec2<f32>(0.5), fract(vec2<f32>(_freq) * input.fragPos.xy));',
    '    let _v2 = step(vec2<f32>(0.5), vec2<f32>(1.0) - fract(vec2<f32>(_freq) * input.fragPos.xy));',
    '    var _dbgColor = vec3<f32>(_gray + _v1.x * _v1.y + _v2.x * _v2.y);',
    `    if (_dbg == ${DebugChannel.BASE_COLOR}u) { _dbgColor = baseColor; }`,
    `    else if (_dbg == ${DebugChannel.ALPHA}u) { _dbgColor = vec3<f32>(opacity); }`,
    `    else if (_dbg == ${DebugChannel.NORMAL}u) { _dbgColor = normal * 0.5 + 0.5; }`,
    `    else if (_dbg == ${DebugChannel.GEOMETRY_NORMAL}u) { _dbgColor = geometricNormal * 0.5 + 0.5; }`,
    `    else if (_dbg == ${DebugChannel.METALLIC}u) { _dbgColor = vec3<f32>(metallic); }`,
    `    else if (_dbg == ${DebugChannel.ROUGHNESS}u) { _dbgColor = vec3<f32>(roughness); }`,
    `    else if (_dbg == ${DebugChannel.EMISSIVE}u) { _dbgColor = emission; }`,
    `    else if (_dbg == ${DebugChannel.F0}u) { _dbgColor = f0_dielectric; }`,
  ];

  if (hasAOTexture) {
    lines.push(
      `    else if (_dbg == ${DebugChannel.OCCLUSION}u) { _dbgColor = vec3<f32>(ao); }`
    );
  }

  if (hasTCoords) {
    const zComp = tcoordComponents === 3 ? 'input.tcoordVS.z' : '0.0';
    lines.push(
      `    else if (_dbg == ${DebugChannel.TEXTURE_COORDINATES_0}u) { _dbgColor = vec3<f32>(input.tcoordVS.xy, ${zComp}); }`
    );
  }

  if (hasTransmission) {
    lines.push(
      `    else if (_dbg == ${DebugChannel.TRANSMISSION_FACTOR}u) { _dbgColor = vec3<f32>(transmissionF); }`
    );
  }
  if (hasVolume) {
    lines.push(
      `    else if (_dbg == ${DebugChannel.VOLUME_THICKNESS}u) { _dbgColor = vec3<f32>(thickness); }`
    );
  }
  if (hasClearCoat) {
    lines.push(
      `    else if (_dbg == ${DebugChannel.CLEARCOAT_FACTOR}u) { _dbgColor = vec3<f32>(coatStrength); }`,
      `    else if (_dbg == ${DebugChannel.CLEARCOAT_ROUGHNESS}u) { _dbgColor = vec3<f32>(coatRoughness); }`,
      `    else if (_dbg == ${DebugChannel.CLEARCOAT_NORMAL}u) { _dbgColor = coatNormal * 0.5 + 0.5; }`
    );
  }
  if (hasSheen) {
    lines.push(
      `    else if (_dbg == ${DebugChannel.SHEEN_COLOR}u) { _dbgColor = sheenColor; }`,
      `    else if (_dbg == ${DebugChannel.SHEEN_ROUGHNESS}u) { _dbgColor = vec3<f32>(sheenRoughness); }`
    );
  }
  if (hasKHRSpecular) {
    lines.push(
      `    else if (_dbg == ${DebugChannel.SPECULAR_FACTOR}u) { _dbgColor = vec3<f32>(specWeight); }`,
      `    else if (_dbg == ${DebugChannel.SPECULAR_COLOR}u) { _dbgColor = f0_dielectric; }`
    );
  }
  if (hasIridescence) {
    lines.push(
      `    else if (_dbg == ${DebugChannel.IRIDESCENCE_FACTOR}u) { _dbgColor = vec3<f32>(iridescenceFactor); }`,
      `    else if (_dbg == ${DebugChannel.IRIDESCENCE_THICKNESS}u) { _dbgColor = vec3<f32>(iridescenceThickness / 1200.0); }`
    );
  }
  if (hasAnisotropy) {
    lines.push(
      `    else if (_dbg == ${DebugChannel.ANISOTROPIC_STRENGTH}u) { _dbgColor = vec3<f32>(anisotropyU); }`
    );
  }
  if (hasDiffuseTransmission) {
    lines.push(
      `    else if (_dbg == ${DebugChannel.DIFFUSE_TRANSMISSION_FACTOR}u) { _dbgColor = vec3<f32>(diffTransFactor); }`,
      `    else if (_dbg == ${DebugChannel.DIFFUSE_TRANSMISSION_COLOR}u) { _dbgColor = diffTransColor; }`
    );
  }

  lines.push('    computedColor = vec4<f32>(_dbgColor, 1.0);', '  }');

  return lines;
}

export default { getDebugChannelCode };
