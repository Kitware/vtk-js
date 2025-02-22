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
  BlendMode: typeof BlendMode;
  FilterMode: typeof FilterMode;
};
export default _default;
