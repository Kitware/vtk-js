export function getMaterialFeatureFlags(property) {
  const sheenColor = property.getSheenColorFactor?.() ?? [0, 0, 0];
  const specularColor = property.getSpecularColorFactor?.() ?? [1, 1, 1];

  const hasClearCoat = (property.getCoatStrength?.() ?? 0) > 0;

  return {
    hasAnisotropy: (property.getAnisotropy?.() ?? 0) !== 0,
    hasClearCoat,
    hasCoatNormalTexture: hasClearCoat && property.getCoatNormalTexture?.(),
    hasDiffuseTransmission:
      (property.getDiffuseTransmissionFactor?.() ?? 0) > 0,
    hasDispersion: (property.getDispersion?.() ?? 0) > 0,
    hasIridescence: (property.getIridescenceFactor?.() ?? 0) > 0,
    hasKHRSpecular:
      (property.getSpecularFactor?.() ?? 1) !== 1 ||
      specularColor.some((value) => value !== 1) ||
      !!property.getSpecularTexture?.()?.getImageLoaded?.() ||
      !!property.getSpecularColorTexture?.()?.getImageLoaded?.(),
    hasSheen:
      (property.getSheenRoughnessFactor?.() ?? 0) > 0 ||
      sheenColor.some((value) => value > 0),
    hasTransmission: (property.getTransmissionFactor?.() ?? 0) > 0,
    hasVolume: (property.getThicknessFactor?.() ?? 0) > 0,
  };
}

export function isEdges(hash) {
  return hash.indexOf('edge') >= 0;
}

/**
 * Build the UV expression for a given texture transform key.
 * When a transform is present, references UBO uniforms so that
 * animated transforms don't trigger pipeline rebuilds.
 */
export function getUV(transformKey, transforms, hasTcoord1) {
  const t = transforms[transformKey];
  const uvSet =
    t?.texCoord === 1 && hasTcoord1 ? 'input.tcoord1VS' : 'input.tcoordVS';
  if (t && (t.rotation != null || t.scale || t.offset)) {
    const rs = `mapperUBO.UVT_${transformKey}_RS`;
    const off = `mapperUBO.UVT_${transformKey}_Off`;
    return `vec2<f32>(${uvSet}.x * ${rs}.x + ${uvSet}.y * ${rs}.z + ${off}.x, ${uvSet}.x * ${rs}.y + ${uvSet}.y * ${rs}.w + ${off}.y)`;
  }
  return uvSet;
}

export default {
  getMaterialFeatureFlags,
  isEdges,
  getUV,
};
