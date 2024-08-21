export const InterpolationType = {
  NEAREST: 0,
  LINEAR: 1,
  FAST_LINEAR: 2,
};

export const OpacityMode = {
  FRACTIONAL: 0,
  PROPORTIONAL: 1,
};

export const ColorMixPreset = {
  CUSTOM: 0,
  ADDITIVE: 1,
  COLORIZE: 2,
};

export const BlendMode = {
  COMPOSITE_BLEND: 0,
  MAXIMUM_INTENSITY_BLEND: 1,
  MINIMUM_INTENSITY_BLEND: 2,
  AVERAGE_INTENSITY_BLEND: 3,
  ADDITIVE_INTENSITY_BLEND: 4,
  RADON_TRANSFORM_BLEND: 5,
  LABELMAP_EDGE_PROJECTION_BLEND: 6,
};

export const FilterMode = {
  OFF: 0,
  NORMALIZED: 1,
  RAW: 2,
};

export default {
  InterpolationType,
  OpacityMode,
  ColorMixPreset,
  BlendMode,
  FilterMode,
};
