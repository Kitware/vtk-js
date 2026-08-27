export declare const InterpolationType: {
  readonly NEAREST: 0;
  readonly LINEAR: 1;
  readonly FAST_LINEAR: 2;
};

export type InterpolationType =
  (typeof InterpolationType)[keyof typeof InterpolationType];

export declare const OpacityMode: {
  readonly FRACTIONAL: 0;
  readonly PROPORTIONAL: 1;
};

export type OpacityMode = (typeof OpacityMode)[keyof typeof OpacityMode];

export declare const ColorMixPreset: {
  readonly DEFAULT: 0;

  // Two components preset
  // Out color: sum of colors weighted by opacity
  // Out opacity: sum of opacities
  readonly ADDITIVE: 1;

  // Two components preset
  // Out color: color of the first component, colorized by second component with an intensity that is the second component's opacity
  // Out opacity: opacity of the first component
  readonly COLORIZE: 2;

  // Add a `//VTK::CustomColorMix` tag to the Fragment shader
  // See usage in file `testColorMix` and in function `setColorMixPreset`
  readonly CUSTOM: 3;
};

export type ColorMixPreset =
  (typeof ColorMixPreset)[keyof typeof ColorMixPreset];

export declare const FilterMode: {
  readonly OFF: 0;
  readonly NORMALIZED: 1;
  readonly RAW: 2;
};

export type FilterMode = (typeof FilterMode)[keyof typeof FilterMode];

declare const _default: {
  InterpolationType: typeof InterpolationType;
  OpacityMode: typeof OpacityMode;
  ColorMixPreset: typeof ColorMixPreset;
  FilterMode: typeof FilterMode;
};
export default _default;
