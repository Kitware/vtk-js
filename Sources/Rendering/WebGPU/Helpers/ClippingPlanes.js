export const MAX_CLIPPING_PLANES = 6;

export function addClipPlaneEntries(buffer, prefix) {
  for (let i = 0; i < MAX_CLIPPING_PLANES; i++) {
    buffer.addEntry(`${prefix}${i}`, 'vec4<f32>');
  }
}

export function getClipPlaneShaderChecks({
  countName,
  planePrefix,
  positionName,
  returnValue = 'discard',
}) {
  const checks = [];
  for (let i = 0; i < MAX_CLIPPING_PLANES; i++) {
    checks.push(
      `  if (${countName} > ${i}u && dot(${planePrefix}${i}, ${positionName}) < 0.0) { ${returnValue}; }`
    );
  }
  return checks;
}

// Hardware clip distances need the device feature clip-distances.
export function hasClipDistances(device) {
  return !!device?.hasFeature('clip-distances');
}

/**
 * Clip in the vertex shader with @builtin(clip_distances). The GPU removes
 * the part of a primitive where a distance is negative, so the fragment
 * shader does not need discard, which keeps the early depth test. A plane
 * that is not in use writes 1.0, which keeps everything.
 * @param {*} vDesc The vertex shader description
 * @param {object} options countName, planePrefix and positionName, as for
 * getClipPlaneShaderChecks(). positionName is a vertex shader expression.
 * @returns {string[]} The lines that write the distances
 */
export function addClipDistances(
  vDesc,
  { countName, planePrefix, positionName }
) {
  vDesc.addBuiltinOutput(
    `array<f32, ${MAX_CLIPPING_PLANES}>`,
    '@builtin(clip_distances) clipDistances'
  );
  // The enable directive must be the first statement of the module.
  vDesc.setCode(`enable clip_distances;\n${vDesc.getCode()}`);
  const lines = [];
  for (let i = 0; i < MAX_CLIPPING_PLANES; i++) {
    lines.push(
      `  output.clipDistances[${i}] = select(1.0, dot(${planePrefix}${i}, ${positionName}), ${countName} > ${i}u);`
    );
  }
  return lines;
}

export function getClippingPlaneEquationsInCoords(
  mapper,
  worldToCoords,
  outPlanes
) {
  const count = mapper.getClippingPlanes().length;
  for (let i = 0; i < count; i++) {
    mapper.getClippingPlaneInCoords(worldToCoords, i, outPlanes[i]);
  }
  return count;
}
