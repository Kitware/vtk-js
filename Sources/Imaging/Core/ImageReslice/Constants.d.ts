export declare const SlabMode: {
  readonly MIN: 0;
  readonly MAX: 1;
  readonly MEAN: 2;
  readonly SUM: 3;
};

export type SlabMode = (typeof SlabMode)[keyof typeof SlabMode];

declare const _default: {
  SlabMode: typeof SlabMode;
};

export default _default;
