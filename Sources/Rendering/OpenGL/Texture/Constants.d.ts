export declare const Wrap: {
  readonly CLAMP_TO_EDGE: 0;
  readonly REPEAT: 1;
  readonly MIRRORED_REPEAT: 2;
};

export type Wrap = (typeof Wrap)[keyof typeof Wrap];

export declare const Filter: {
  readonly NEAREST: 0;
  readonly LINEAR: 1;
  readonly NEAREST_MIPMAP_NEAREST: 2;
  readonly NEAREST_MIPMAP_LINEAR: 3;
  readonly LINEAR_MIPMAP_NEAREST: 4;
  readonly LINEAR_MIPMAP_LINEAR: 5;
};

export type Filter = (typeof Filter)[keyof typeof Filter];

declare const _default: {
  Wrap: typeof Wrap;
  Filter: typeof Filter;
};

export default _default;
