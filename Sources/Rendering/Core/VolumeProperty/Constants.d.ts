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
  // Add a `//VTK::CustomColorMix` tag to the Fragment shader
  // See usage in file `testColorMix` and in function `setColorMixPreset`
  CUSTOM = 0,

  // Two components preset
  // Out color: sum of colors weighted by opacity
  // Out opacity: sum of opacities
  ADDITIVE = 1,

  // Two components preset
  // Out color: color of the first component, colorized by second component with an intensity that is the second component's opacity
  // Out opacity: opacity of the first component
  COLORIZE = 2,
}

export declare enum BlendMode {
  COMPOSITE_BLEND = 0,
  MAXIMUM_INTENSITY_BLEND = 1,
  MINIMUM_INTENSITY_BLEND = 2,
  AVERAGE_INTENSITY_BLEND = 3,
  ADDITIVE_INTENSITY_BLEND = 4,
  RADON_TRANSFORM_BLEND = 5,
  LABELMAP_EDGE_PROJECTION_BLEND = 6,
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
  BlendMode: typeof BlendMode;
  FilterMode: typeof FilterMode;
};
export default _default;
