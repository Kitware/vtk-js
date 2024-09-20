export declare enum InterpolationType {
  NEAREST = 0,
  LINEAR = 1,
  FAST_LINEAR = 2,
}

export declare enum OpacityMode {
  FRACTIONAL = 0,
  PROPORTIONAL = 1,
}

export declare enum ColorMixPreset {
  DEFAULT = 0,

  // Two components preset
  // Out color: sum of colors weighted by opacity
  // Out opacity: sum of opacities
  ADDITIVE = 1,

  // Two components preset
  // Out color: color of the first component, colorized by second component with an intensity that is the second component's opacity
  // Out opacity: opacity of the first component
  COLORIZE = 2,

  // Add a `//VTK::CustomColorMix` tag to the Fragment shader
  // See usage in file `testColorMix` and in function `setColorMixPreset`
  CUSTOM = 3,
}

export declare enum FilterMode {
  OFF = 0,
  NORMALIZED = 1,
  RAW = 2,
}

declare const _default: {
  InterpolationType: typeof InterpolationType;
  OpacityMode: typeof OpacityMode;
  ColorMixPreset: typeof ColorMixPreset;
  FilterMode: typeof FilterMode;
};
export default _default;
