export declare enum ColorSpace {
  RGB = 0,
  HSV = 1,
  LAB = 2,
  DIVERGING = 3,
}

export declare enum Scale {
  LINEAR = 0,
  LOG10 = 1,
}

export declare enum ScalarMappingMode {
  LINEAR = 0,
  SIGMOID = 1,
}

declare const _default: {
  ColorSpace: typeof ColorSpace;
  Scale: typeof Scale;
  ScalarMappingMode: typeof ScalarMappingMode;
};
export default _default;
