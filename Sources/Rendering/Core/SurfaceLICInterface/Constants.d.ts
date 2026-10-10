export declare const ContrastEnhanceMode: {
  readonly NONE: 0;
  readonly LIC: 1;
  readonly COLOR: 2;
  readonly BOTH: 3;
};

export type ContrastEnhanceMode =
  (typeof ContrastEnhanceMode)[keyof typeof ContrastEnhanceMode];

export declare const NoiseType: {
  readonly UNIFORM: 0;
  readonly GAUSSIAN: 1;
};

export type NoiseType = (typeof NoiseType)[keyof typeof NoiseType];

export declare const ColorMode: {
  readonly BLEND: 0;
  readonly MULTIPLY: 1;
};

export type ColorMode = (typeof ColorMode)[keyof typeof ColorMode];

declare const _default: {
  ColorMode: typeof ColorMode;
  ContrastEnhanceMode: typeof ContrastEnhanceMode;
  NoiseType: typeof NoiseType;
};
export default _default;
