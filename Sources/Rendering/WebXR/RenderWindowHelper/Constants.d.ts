export declare const XrSessionTypes: {
  readonly HmdVR: 0;
  readonly MobileAR: 1;
  readonly LookingGlassVR: 2;
  readonly HmdAR: 3;
};

export type XrSessionTypes =
  (typeof XrSessionTypes)[keyof typeof XrSessionTypes];

declare const _default: {
  XrSessionTypes: typeof XrSessionTypes;
};
export default _default;
