export declare const VectorMode: {
  readonly MAGNITUDE: 0;
  readonly COMPONENT: 1;
  readonly RGBCOLORS: 2;
};

export type VectorMode = (typeof VectorMode)[keyof typeof VectorMode];

export declare const ScalarMappingTarget: {
  readonly LUMINANCE: 1;
  readonly LUMINANCE_ALPHA: 2;
  readonly RGB: 3;
  readonly RGBA: 4;
};

export type ScalarMappingTarget =
  (typeof ScalarMappingTarget)[keyof typeof ScalarMappingTarget];

export declare const Scale: {
  readonly LINEAR: 0;
  readonly LOG10: 1;
};

export type Scale = (typeof Scale)[keyof typeof Scale];

declare const _default: {
  VectorMode: typeof VectorMode;
  ScalarMappingTarget: typeof ScalarMappingTarget;
  Scale: typeof Scale;
};
export default _default;
