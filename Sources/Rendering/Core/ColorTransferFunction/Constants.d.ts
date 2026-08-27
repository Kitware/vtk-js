export declare const ColorSpace: {
  readonly RGB: 0;
  readonly HSV: 1;
  readonly LAB: 2;
  readonly DIVERGING: 3;
};

export type ColorSpace = (typeof ColorSpace)[keyof typeof ColorSpace];

export declare const Scale: {
  readonly LINEAR: 0;
  readonly LOG10: 1;
};

export type Scale = (typeof Scale)[keyof typeof Scale];

declare const _default: {
  ColorSpace: typeof ColorSpace;
  Scale: typeof Scale;
};
export default _default;
