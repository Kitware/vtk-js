export declare const CoordinateSystem: {
  readonly WORLD: 1;
  readonly DISPLAY: 0;
};

export type CoordinateSystem =
  (typeof CoordinateSystem)[keyof typeof CoordinateSystem];

declare const _default: {
  CoordinateSystem: typeof CoordinateSystem;
};
export default _default;
