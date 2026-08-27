export declare const SlicingMode: {
  readonly NONE: -1;
  readonly I: 0;
  readonly J: 1;
  readonly K: 2;
  readonly X: 3;
  readonly Y: 4;
  readonly Z: 5;
};

export type SlicingMode = (typeof SlicingMode)[keyof typeof SlicingMode];

declare const _default: {
  SlicingMode: typeof SlicingMode;
};
export default _default;
