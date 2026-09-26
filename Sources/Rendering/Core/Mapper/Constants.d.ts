export declare const ColorMode: {
  readonly DEFAULT: 0;
  readonly MAP_SCALARS: 1;
  readonly DIRECT_SCALARS: 2;
};

export type ColorMode = (typeof ColorMode)[keyof typeof ColorMode];

export declare const ScalarMode: {
  readonly DEFAULT: 0;
  readonly USE_POINT_DATA: 1;
  readonly USE_CELL_DATA: 2;
  readonly USE_POINT_FIELD_DATA: 3;
  readonly USE_CELL_FIELD_DATA: 4;
  readonly USE_FIELD_DATA: 5;
};

export type ScalarMode = (typeof ScalarMode)[keyof typeof ScalarMode];

export declare const GetArray: {
  readonly BY_ID: 0;
  readonly BY_NAME: 1;
};

export type GetArray = (typeof GetArray)[keyof typeof GetArray];

/**
 * Debug output channels for PBR material inspection.
 * 0 = normal rendering, non zero = override computedColor with that channel.
 */
export declare enum DebugChannel {
  NONE = 0,
  // Generic
  BASE_COLOR = 1,
  ALPHA = 2,
  NORMAL = 3,
  GEOMETRY_NORMAL = 4,
  TEXTURE_COORDINATES_0 = 5,
  OCCLUSION = 6,
  EMISSIVE = 7,
  // Metallic-Roughness
  METALLIC = 10,
  ROUGHNESS = 11,
  // Clearcoat
  CLEARCOAT_FACTOR = 20,
  CLEARCOAT_ROUGHNESS = 21,
  CLEARCOAT_NORMAL = 22,
  // Sheen
  SHEEN_COLOR = 30,
  SHEEN_ROUGHNESS = 31,
  // Specular
  SPECULAR_FACTOR = 40,
  SPECULAR_COLOR = 41,
  // Transmission / Volume
  TRANSMISSION_FACTOR = 50,
  VOLUME_THICKNESS = 51,
  // Iridescence
  IRIDESCENCE_FACTOR = 60,
  IRIDESCENCE_THICKNESS = 61,
  // Anisotropy
  ANISOTROPIC_STRENGTH = 70,
  ANISOTROPIC_DIRECTION = 71,
  // Diffuse Transmission
  DIFFUSE_TRANSMISSION_FACTOR = 80,
  DIFFUSE_TRANSMISSION_COLOR = 81,
  // F0 / Fresnel
  F0 = 90,
}

declare const _default: {
  ColorMode: typeof ColorMode;
  ScalarMode: typeof ScalarMode;
  GetArray: typeof GetArray;
  DebugChannel: typeof DebugChannel;
};
export default _default;
