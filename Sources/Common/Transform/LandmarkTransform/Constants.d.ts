export declare const Mode: {
  readonly RIGID_BODY: 0;
  readonly SIMILARITY: 1;
  readonly AFFINE: 2;
};

export type Mode = (typeof Mode)[keyof typeof Mode];

declare const _default: {
  Mode: typeof Mode;
};
export default _default;
