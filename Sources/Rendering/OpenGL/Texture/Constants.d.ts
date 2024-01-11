export declare enum Wrap {
  CLAMP_TO_EDGE = 0,
  REPEAT = 1,
  MIRRORED_REPEAT = 2,
}

export declare enum Filter {
  NEAREST = 0,
  LINEAR = 1,
  NEAREST_MIPMAP_NEAREST = 2,
  NEAREST_MIPMAP_LINEAR = 3,
  LINEAR_MIPMAP_NEAREST = 4,
  LINEAR_MIPMAP_LINEAR = 5,
}

declare const _default: {
  Wrap: typeof Wrap;
  Filter: typeof Filter;
};

export default _default;
