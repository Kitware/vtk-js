export declare const InterpolationType: {
  readonly NEAREST: 0;
  readonly LINEAR: 1;
};

export type InterpolationType =
  (typeof InterpolationType)[keyof typeof InterpolationType];

declare const _default: {
  InterpolationType: typeof InterpolationType;
};
export default _default;
