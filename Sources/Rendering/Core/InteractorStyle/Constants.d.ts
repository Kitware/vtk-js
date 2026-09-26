export declare const States: {
  readonly IS_START: 0;
  readonly IS_NONE: 0;
  readonly IS_ROTATE: 1;
  readonly IS_PAN: 2;
  readonly IS_SPIN: 3;
  readonly IS_DOLLY: 4;
  readonly IS_CAMERA_POSE: 11;
  readonly IS_WINDOW_LEVEL: 1024;
  readonly IS_SLICE: 1025;
};

export type States = (typeof States)[keyof typeof States];

declare const _default: {
  States: typeof States;
};
export default _default;
