export declare const BlendMode: {
  readonly COMPOSITE_BLEND: 0;
  readonly MAXIMUM_INTENSITY_BLEND: 1;
  readonly MINIMUM_INTENSITY_BLEND: 2;
  readonly AVERAGE_INTENSITY_BLEND: 3;
  readonly ADDITIVE_INTENSITY_BLEND: 4;
  readonly RADON_TRANSFORM_BLEND: 5;
  readonly LABELMAP_EDGE_PROJECTION_BLEND: 6;
};

export type BlendMode = (typeof BlendMode)[keyof typeof BlendMode];

declare const _default: {
  BlendMode: typeof BlendMode;
};
export default _default;
