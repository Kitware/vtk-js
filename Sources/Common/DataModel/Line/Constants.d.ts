export declare const IntersectionState: {
  readonly NO_INTERSECTION: 0;
  readonly YES_INTERSECTION: 1;
  readonly ON_LINE: 2;
};

export type IntersectionState =
  (typeof IntersectionState)[keyof typeof IntersectionState];

declare const _default: {
  IntersectionState: typeof IntersectionState;
};
export default _default;
