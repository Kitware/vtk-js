export const ColorMode = {
  DEFAULT: 0,
  MAP_SCALARS: 1,
  DIRECT_SCALARS: 2,
};

export const ScalarMode = {
  DEFAULT: 0,
  USE_POINT_DATA: 1,
  USE_CELL_DATA: 2,
  USE_POINT_FIELD_DATA: 3,
  USE_CELL_FIELD_DATA: 4,
  USE_FIELD_DATA: 5,
};

export const GetArray = {
  BY_ID: 0,
  BY_NAME: 1,
};

/**
 * Debug output channels for PBR material inspection.
 * 0 = normal rendering, non zero = override computedColor with that channel.
 */
export const DebugChannel = {
  NONE: 0,
  // Generic
  BASE_COLOR: 1,
  ALPHA: 2,
  NORMAL: 3,
  GEOMETRY_NORMAL: 4,
  TEXTURE_COORDINATES_0: 5,
  OCCLUSION: 6,
  EMISSIVE: 7,
  // Metallic-Roughness
  METALLIC: 10,
  ROUGHNESS: 11,
  // Clearcoat
  CLEARCOAT_FACTOR: 20,
  CLEARCOAT_ROUGHNESS: 21,
  CLEARCOAT_NORMAL: 22,
  // Sheen
  SHEEN_COLOR: 30,
  SHEEN_ROUGHNESS: 31,
  // Specular
  SPECULAR_FACTOR: 40,
  SPECULAR_COLOR: 41,
  // Transmission / Volume
  TRANSMISSION_FACTOR: 50,
  VOLUME_THICKNESS: 51,
  // Iridescence
  IRIDESCENCE_FACTOR: 60,
  IRIDESCENCE_THICKNESS: 61,
  // Anisotropy
  ANISOTROPIC_STRENGTH: 70,
  ANISOTROPIC_DIRECTION: 71,
  // Diffuse Transmission
  DIFFUSE_TRANSMISSION_FACTOR: 80,
  DIFFUSE_TRANSMISSION_COLOR: 81,
  // F0 / Fresnel
  F0: 90,
};

export default {
  ColorMode,
  GetArray,
  ScalarMode,
  DebugChannel,
};
