export declare const OrientationModes: {
  readonly DIRECTION: 0;
  readonly ROTATION: 1;
  readonly MATRIX: 2;
};

export type OrientationModes =
  (typeof OrientationModes)[keyof typeof OrientationModes];

export declare const ScaleModes: {
  readonly SCALE_BY_CONSTANT: 0;
  readonly SCALE_BY_MAGNITUDE: 1;
  readonly SCALE_BY_COMPONENTS: 2;
};

export type ScaleModes = (typeof ScaleModes)[keyof typeof ScaleModes];

declare const _default: {
  OrientationModes: typeof OrientationModes;
  ScaleModes: typeof ScaleModes;
};
export default _default;
