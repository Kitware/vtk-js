export declare const SlabTypes: {
  readonly MIN: 0;
  readonly MAX: 1;
  readonly MEAN: 2;
  readonly SUM: 3;
};

export type SlabTypes = (typeof SlabTypes)[keyof typeof SlabTypes];

declare const _default: {
  SlabTypes: typeof SlabTypes;
};
export default _default;
