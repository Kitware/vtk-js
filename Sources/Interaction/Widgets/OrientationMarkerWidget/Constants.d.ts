export declare const Corners: {
  readonly TOP_LEFT: 'TOP_LEFT';
  readonly TOP_RIGHT: 'TOP_RIGHT';
  readonly BOTTOM_LEFT: 'BOTTOM_LEFT';
  readonly BOTTOM_RIGHT: 'BOTTOM_RIGHT';
};

export type Corners = (typeof Corners)[keyof typeof Corners];

declare const _default: {
  Corners: typeof Corners;
};
export default _default;
