export declare const splineKind: {
  readonly CARDINAL_SPLINE: 'CARDINAL_SPLINE';
  readonly KOCHANEK_SPLINE: 'KOCHANEK_SPLINE';
};

export type splineKind = (typeof splineKind)[keyof typeof splineKind];

declare const _default: {
  splineKind: typeof splineKind;
};
export default _default;
