export declare const ScalarMode: {
  readonly NONE: 0;
  readonly COLORS: 1;
  readonly LABELS: 2;
};

export type ScalarMode = (typeof ScalarMode)[keyof typeof ScalarMode];

declare const _default: {
  ScalarMode: typeof ScalarMode;
};
export default _default;
