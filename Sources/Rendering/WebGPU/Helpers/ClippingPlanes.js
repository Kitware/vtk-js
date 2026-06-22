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
